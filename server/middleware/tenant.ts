import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import type { Tenant } from "@shared/schema";
import type { AuthRequest } from "../auth";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Dummy function for verifyToken, assuming it's defined elsewhere or will be added.
// In a real scenario, this would be imported or defined with the actual JWT verification logic.
async function verifyToken(token: string) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error("JWT Verification Error:", error);
    throw error; // Re-throw to be caught by the caller
  }
}


export interface TenantRequest extends Request {
  tenant?: Tenant;
  user?: any;
}

export async function identifyTenant(
  req: TenantRequest,
  res: Response,
  next: NextFunction
) {
  try {
    // Try to extract and verify JWT token to get user's tenant
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 [TENANT MIDDLEWARE] NEW REQUEST');
    console.log('🔍 [TENANT MIDDLEWARE] Auth header present:', !!authHeader);
    console.log('🔍 [TENANT MIDDLEWARE] Token extracted:', !!token);
    console.log('🔍 [TENANT MIDDLEWARE] Request method:', req.method);
    console.log('🔍 [TENANT MIDDLEWARE] Request path:', req.path);
    console.log('🔍 [TENANT MIDDLEWARE] Request host:', req.headers.host);
    console.log('🔍 [TENANT MIDDLEWARE] User-Agent:', req.headers['user-agent']?.substring(0, 100));

    if (token) {
      try {
        console.log('🔐 [TENANT MIDDLEWARE] Attempting JWT verification...');
        const decoded = await verifyToken(token);
        console.log('🔐 [TENANT MIDDLEWARE] JWT decoded successfully:', decoded ? 'Yes' : 'No');
        
        if (decoded && decoded.id) {
          console.log('🔐 [TENANT MIDDLEWARE] User ID from token:', decoded.id);
          const user = await storage.getUserById(decoded.id);
          
          if (user) {
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('👤 [USER INFO] Username:', user.username);
            console.log('👤 [USER INFO] Role:', user.role);
            console.log('👤 [USER INFO] User Tenant ID:', user.tenantId);
            console.log('👤 [USER INFO] User Email:', user.email);
            
            if (user.role === 'admin') {
              console.log('🔑 [ADMIN USER] Admin detected - can access own tenant data');
            } else if (user.role === 'superadmin') {
              console.log('👑 [SUPERADMIN] Superadmin detected - can access all tenants');
            } else {
              console.log('👥 [REGULAR USER] Regular user detected - limited access');
            }
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          } else {
            console.log('⚠️ [TENANT MIDDLEWARE] User not found in database for ID:', decoded.id);
          }
          
          if (user && user.tenantId) {
            const userTenant = await storage.getTenantById(user.tenantId);
            if (userTenant) {
              console.log(`✅ [TENANT MIDDLEWARE] User ${user.username} (${user.role}) → Tenant: ${userTenant.name} (ID: ${userTenant.id}, domain: ${userTenant.domain})`);
              req.tenant = userTenant;
              (req as AuthRequest).user = user;
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
              return next();
            } else {
              console.log('⚠️ [TENANT MIDDLEWARE] Tenant not found for ID:', user.tenantId);
            }
          }
        }
      } catch (jwtError) {
        console.log('⚠️ [TENANT MIDDLEWARE] JWT verification failed:', jwtError instanceof Error ? jwtError.message : jwtError);
      }
    } else {
      console.log('👤 [TENANT MIDDLEWARE] No token - processing as anonymous user');
    }

    // Check if user is authenticated and use their tenant (legacy check for session-based auth)
    if ((req as AuthRequest).user && (req as AuthRequest).user.tenantId) {
      const userTenantId = (req as AuthRequest).user.tenantId;
      const userTenant = await storage.getTenantById(userTenantId);

      if (userTenant) {
        console.log(`🔐 [TENANT MIDDLEWARE] User ${(req as AuthRequest).user.username} authenticated - using tenant ${userTenant.name} (ID: ${userTenant.id})`);
        req.tenant = userTenant;
        return next();
      }
    }

    // Fallback to domain-based tenant identification
    const host = req.headers.host || "";
    let domain = host.split(':')[0];

    console.log(`🌐 [TENANT MIDDLEWARE] Starting domain-based tenant lookup...`);
    console.log(`🌐 [TENANT MIDDLEWARE] Original host header: ${host}`);
    console.log(`🌐 [TENANT MIDDLEWARE] Extracted domain (before mapping): ${domain}`);

    // For Replit development domains, use localhost tenant
    if (domain.includes('.replit.dev') || domain.includes('.repl.co')) {
      console.log(`🔧 [TENANT MIDDLEWARE] Replit domain detected, mapping to localhost`);
      domain = 'localhost';
    } else {
      console.log(`🌍 [TENANT MIDDLEWARE] Custom domain detected: ${domain}`);
    }

    console.log(`🌐 [TENANT MIDDLEWARE] Final domain for lookup: ${domain}`);
    console.log(`🔍 [TENANT MIDDLEWARE] Querying database for tenant with domain: "${domain}"`);
    
    let tenant = await storage.getTenantByDomain(domain);
    
    if (!tenant) {
      console.log(`⚠️ [TENANT MIDDLEWARE] Direct lookup failed for: "${domain}"`);
    } else {
      console.log(`✅ [TENANT MIDDLEWARE] Direct lookup succeeded for: "${domain}" → Tenant ID: ${tenant.id}`);
    }
    
    // If tenant not found by exact domain, try without www prefix
    if (!tenant && domain.startsWith('www.')) {
      const domainWithoutWww = domain.substring(4);
      console.log(`🔄 [TENANT MIDDLEWARE] Trying without www: ${domainWithoutWww}`);
      tenant = await storage.getTenantByDomain(domainWithoutWww);
    }
    
    // If tenant not found, try with www prefix
    if (!tenant && !domain.startsWith('www.')) {
      const domainWithWww = `www.${domain}`;
      console.log(`🔄 [TENANT MIDDLEWARE] Trying with www: ${domainWithWww}`);
      tenant = await storage.getTenantByDomain(domainWithWww);
    }

    if (tenant) {
      console.log(`✅ [TENANT MIDDLEWARE] Tenant found successfully!`);
      console.log(`   - Name: ${tenant.name}`);
      console.log(`   - ID: ${tenant.id}`);
      console.log(`   - Domain: ${tenant.domain}`);
      console.log(`   - Is Active: ${tenant.isActive}`);
    } else {
      console.log(`❌ [TENANT MIDDLEWARE] No tenant found for domain: "${domain}"`);
      console.log(`   This could mean:`);
      console.log(`   1. No tenant exists with domain "${domain}" in the database`);
      console.log(`   2. The domain in the database doesn't match exactly (check case, spaces, etc.)`);
      console.log(`   3. Database query failed silently`);
      
      // List all tenants for debugging
      try {
        const allTenants = await storage.getAllTenants();
        console.log(`📋 [TENANT MIDDLEWARE] Available tenants in database:`);
        allTenants.forEach(t => {
          console.log(`   - "${t.domain}" (ID: ${t.id}, Name: ${t.name})`);
        });
      } catch (e) {
        console.error('Error listing tenants:', e);
      }
    }

    if (!tenant) {
      console.log(`🔄 [TENANT MIDDLEWARE] No tenant found for domain "${domain}", attempting fallback to localhost...`);
      const defaultTenant = await storage.getTenantByDomain('localhost');

      if (!defaultTenant) {
        console.log(`❌ [TENANT MIDDLEWARE] CRITICAL: No localhost tenant found either!`);
        console.log(`   Request will fail with 500 error`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        return res.status(500).json({
          message: "No tenant configuration found. Please contact administrator."
        });
      }

      req.tenant = defaultTenant;
      console.log(`⚠️ [TENANT MIDDLEWARE] Using fallback tenant (localhost)`);
      console.log(`   - Name: ${defaultTenant.name}`);
      console.log(`   - ID: ${defaultTenant.id}`);
      console.log(`   - Original requested domain: ${domain}`);
      console.log(`   - This means the domain "${domain}" is not configured in the database`);
    } else {
      req.tenant = tenant;
      console.log(`✅ [TENANT MIDDLEWARE] Successfully assigned tenant: ${tenant.name} (ID: ${tenant.id})`);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    next();
  } catch (error) {
    console.error('Error identifying tenant:', error);
    res.status(500).json({ message: "Error identifying tenant" });
  }
}