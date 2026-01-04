import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import type { Tenant, ApiKey } from "@shared/schema";

export interface ApiKeyRequest extends Request {
  apiKey?: ApiKey;
  tenant?: Tenant;
  apiScopes?: string[];
}

export async function validateApiKey(
  req: ApiKeyRequest,
  res: Response,
  next: NextFunction
) {
  try {
    let apiKey: string | undefined;

    const xApiKey = req.headers['x-api-key'] as string | undefined;
    const authHeader = req.headers.authorization;

    if (xApiKey) {
      apiKey = xApiKey;
    } else if (authHeader && authHeader.startsWith('Bearer ')) {
      apiKey = authHeader.substring(7);
    }

    if (!apiKey) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'API key is required. Provide it via X-API-Key header or Authorization: Bearer <key>'
      });
    }

    const apiKeyRecord = await storage.getApiKeyByKey(apiKey);

    if (!apiKeyRecord) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid API key'
      });
    }

    if (!apiKeyRecord.isActive) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'API key has been revoked'
      });
    }

    const tenant = await storage.getTenantById(apiKeyRecord.tenantId);

    if (!tenant) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Tenant not found for this API key'
      });
    }

    if (!tenant.isActive) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Tenant account is inactive'
      });
    }

    await storage.updateApiKeyLastUsed(apiKeyRecord.id);

    req.apiKey = apiKeyRecord;
    req.tenant = tenant;
    req.apiScopes = apiKeyRecord.scopes;

    next();
  } catch (error) {
    console.error('Error validating API key:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Error validating API key'
    });
  }
}

export function requireScope(requiredScope: string) {
  return (req: ApiKeyRequest, res: Response, next: NextFunction) => {
    if (!req.apiScopes) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'No scopes available'
      });
    }

    const hasScope = req.apiScopes.includes(requiredScope);

    if (!hasScope) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `This operation requires the '${requiredScope}' scope`
      });
    }

    next();
  };
}

export function requireAnyScope(requiredScopes: string[]) {
  return (req: ApiKeyRequest, res: Response, next: NextFunction) => {
    if (!req.apiScopes || req.apiScopes.length === 0) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'No scopes available'
      });
    }

    const hasAnyScope = requiredScopes.some(scope => req.apiScopes?.includes(scope));

    if (!hasAnyScope) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `This operation requires one of the following scopes: ${requiredScopes.join(', ')}`
      });
    }

    next();
  };
}
