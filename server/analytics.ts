import { Request, Response, Router } from "express";
import { db } from "./db";
import { analytics } from "../shared/schema";

const router = Router();

router.post("/track", async (req: Request, res: Response) => {
  console.log("📊 [Analytics] Inizio richiesta POST /api/analytics/track");
  console.log("📋 [Analytics] Body ricevuto:", JSON.stringify(req.body, null, 2));

  try {
    const { event, pageSlug, postSlug, data, userAgent, ip, referrer, tenantId: providedTenantId } = req.body;

    console.log("🔍 [Analytics] Validazione campi obbligatori...");
    if (!event) {
      console.log("❌ [Analytics] Campo event obbligatorio mancante");
      return res.status(400).json({ error: "Campo event obbligatorio" });
    }

    let tenantId = (req as any).tenant?.id || providedTenantId;
    if (!tenantId) {
      console.log("⚠️ [Analytics] Nessun tenant nel middleware, tento di recuperare dal dominio...");
      const host = req.get('host') || '';
      const domain = host.includes('.replit.dev') || host.includes('localhost') ? 'localhost' : host.split(':')[0];
      
      const { storage } = await import('./storage');
      const tenant = await storage.getTenantByDomain(domain);
      
      if (tenant) {
        tenantId = tenant.id;
        console.log("✅ [Analytics] Tenant recuperato dal dominio:", tenantId);
      } else {
        console.error("❌ [Analytics] Impossibile identificare il tenant dal dominio:", domain);
        console.log("🔍 [Analytics] Host originale:", host);
        return res.status(400).json({ error: "Tenant non identificato" });
      }
    }
    console.log("🔧 [Analytics] Tenant ID:", tenantId);

    console.log("📝 [Analytics] Inserimento evento nel database...");
    
    const result = await db.insert(analytics).values({
      tenantId: tenantId,
      pageSlug: pageSlug || null,
      postSlug: postSlug || null,
      event: event,
      data: data || null,
      userAgent: userAgent || null,
      ip: ip || null,
      referrer: referrer || null,
    }).returning();

    const savedEvent = result[0];
    console.log("✅ [Analytics] Evento registrato con successo:", savedEvent);

    res.json({ success: true, event: savedEvent });
  } catch (error: any) {
    console.error("❌ [Analytics] Errore nel tracciamento:", error);
    console.error("❌ [Analytics] Stack trace:", error?.stack);
    res.status(500).json({ error: "Errore nel tracciamento dell'evento" });
  }
});

export default router;
