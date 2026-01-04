import { Response, NextFunction } from "express";
import { getPageSEOData, injectSEO } from "../utils/seoInjection";
import type { TenantRequest } from "./tenant";

/**
 * Middleware per iniettare meta tags SEO e contenuto strutturato nell'HTML
 * Questo middleware intercetta le risposte HTML e inietta i meta tags appropriati
 * basandosi sulla route richiesta e sul tenant corrente
 */
export function seoInjectionMiddleware(
  req: TenantRequest,
  res: Response,
  next: NextFunction
) {
  // Skip API routes, static files, and HMR requests
  if (
    req.path.startsWith('/api/') || 
    req.path.startsWith('/assets/') ||
    req.path.startsWith('/@') ||
    req.path.startsWith('/src/') ||
    req.path.includes('.') && !req.path.endsWith('.html')
  ) {
    return next();
  }

  // Store original send and end methods
  const originalSend = res.send;
  const originalEnd = res.end;

  // Override res.send to intercept HTML responses
  res.send = function (body: any): Response {
    // Check if this is an HTML response
    const contentType = res.getHeader('content-type');
    if (
      typeof body === 'string' &&
      body.includes('<!DOCTYPE html>') &&
      (!contentType || contentType.toString().includes('text/html'))
    ) {
      // Only inject SEO if we have a tenant
      if (req.tenant?.id) {
        const url = req.path;
        
        // Fetch SEO data and inject asynchronously
        getPageSEOData(url, req.tenant.id)
          .then(seoData => {
            if (seoData) {
              const enhancedHtml = injectSEO(body, seoData);
              return originalSend.call(res, enhancedHtml);
            } else {
              return originalSend.call(res, body);
            }
          })
          .catch(error => {
            console.error('SEO injection error:', error);
            return originalSend.call(res, body);
          });
        
        // Return to prevent double sending
        return res;
      }
    }

    return originalSend.call(res, body);
  };

  // Override res.end as fallback
  res.end = function (chunk?: any, encoding?: any, callback?: any): Response {
    if (
      typeof chunk === 'string' &&
      chunk.includes('<!DOCTYPE html>') &&
      req.tenant?.id
    ) {
      const url = req.path;
      
      getPageSEOData(url, req.tenant.id)
        .then(seoData => {
          if (seoData) {
            const enhancedHtml = injectSEO(chunk, seoData);
            return originalEnd.call(res, enhancedHtml, encoding, callback);
          } else {
            return originalEnd.call(res, chunk, encoding, callback);
          }
        })
        .catch(error => {
          console.error('SEO injection error:', error);
          return originalEnd.call(res, chunk, encoding, callback);
        });
      
      return res;
    }

    return originalEnd.call(res, chunk, encoding, callback);
  };

  next();
}
