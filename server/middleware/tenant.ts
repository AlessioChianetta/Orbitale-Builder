import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import type { Tenant } from "@shared/schema";
import type { AuthRequest } from "../auth";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

async function verifyToken(token: string) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    throw error;
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
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      try {
        const decoded = await verifyToken(token);
        
        if (decoded && decoded.id) {
          const user = await storage.getUserById(decoded.id);
          
          if (!user) {
            console.warn('[TENANT] User not found for token ID:', decoded.id);
          }
          
          if (user && user.tenantId) {
            const userTenant = await storage.getTenantById(user.tenantId);
            if (userTenant) {
              req.tenant = userTenant;
              (req as AuthRequest).user = user;
              return next();
            } else {
              console.warn('[TENANT] Tenant not found for ID:', user.tenantId);
            }
          }
        }
      } catch (jwtError) {
        // Token invalid/expired — fall through to domain-based lookup
      }
    }

    if ((req as AuthRequest).user && (req as AuthRequest).user.tenantId) {
      const userTenantId = (req as AuthRequest).user.tenantId;
      const userTenant = await storage.getTenantById(userTenantId);

      if (userTenant) {
        req.tenant = userTenant;
        return next();
      }
    }

    const host = req.headers.host || "";
    let domain = host.split(':')[0];

    if (domain.includes('.replit.dev') || domain.includes('.repl.co')) {
      domain = 'localhost';
    }

    let tenant = await storage.getTenantByDomain(domain);
    
    if (!tenant && domain.startsWith('www.')) {
      const domainWithoutWww = domain.substring(4);
      tenant = await storage.getTenantByDomain(domainWithoutWww);
    }
    
    if (!tenant && !domain.startsWith('www.')) {
      const domainWithWww = `www.${domain}`;
      tenant = await storage.getTenantByDomain(domainWithWww);
    }

    if (!tenant) {
      const defaultTenant = await storage.getTenantByDomain('localhost');

      if (!defaultTenant) {
        console.error('[TENANT] CRITICAL: No tenant found for domain:', domain, 'and no localhost fallback');
        return res.status(500).json({
          message: "No tenant configuration found. Please contact administrator."
        });
      }

      req.tenant = defaultTenant;
    } else {
      req.tenant = tenant;
    }

    next();
  } catch (error) {
    console.error('[TENANT] Error identifying tenant:', error);
    res.status(500).json({ message: "Error identifying tenant" });
  }
}
