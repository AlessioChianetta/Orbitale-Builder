import jwt from "jsonwebtoken";
import { Response, NextFunction } from "express";
import { storage } from "./storage";
import type { User } from "@shared/schema";
import { TenantRequest } from "./middleware/tenant";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

export interface AuthRequest extends TenantRequest {
  user?: User;
}

export function generateToken(user: User): string {
  return jwt.sign(
    { 
      id: user.id, 
      username: user.username, 
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export async function authenticateToken(
  req: AuthRequest, 
  res: Response, 
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }

  try {
    const user = await storage.getUserById(decoded.id);
    if (!user) {
      return res.status(403).json({ message: "User not found" });
    }

    if (!req.tenant) {
      return res.status(500).json({ message: "Tenant not identified" });
    }

    // IMPORTANTE: Sovrascrive il tenant con quello dell'utente autenticato
    // Questo permette login cross-tenant mantenendo i dati corretti
    const userTenant = await storage.getTenantById(user.tenantId);
    if (userTenant) {
      req.tenant = userTenant;
      console.log(`🔐 User ${user.username} authenticated - using tenant ${userTenant.name} (ID: ${userTenant.id})`);
    } else {
      return res.status(500).json({ message: "Tenant for user not found" });
    }

    if (user.tenantId !== req.tenant.id) {
      // Questa condizione è ora ridondante grazie alla sovrascrittura del tenant,
      // ma la manteniamo per sicurezza o per logica futura.
      // Potrebbe essere rimossa se si è certi che req.tenant sia sempre impostato correttamente dall'utente.
      // return res.status(403).json({ message: "User does not belong to this tenant" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({ message: "Authentication error" });
  }
}

export function requireRole(role: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (role === "superadmin") {
      if (req.user.role !== "superadmin") {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
    } else if (req.user.role !== role && req.user.role !== "admin" && req.user.role !== "superadmin") {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    next();
  };
}