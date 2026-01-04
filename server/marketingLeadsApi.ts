
import { Request, Response, Router } from "express";
import { db } from "./db";
import { sql, eq, and, gte, isNotNull, count, countDistinct, desc } from "drizzle-orm";
import { authenticateToken } from "./auth";
import { marketingLeads } from "../shared/schema";
import { validateApiKey, requireScope, ApiKeyRequest } from "./middleware/apiKey";

const router = Router();

// ============================================================================
// ENDPOINT DEPRECATI - Mantiene backward compatibility
// ============================================================================
// Questi endpoint sono deprecati in favore di /external/leads
// Delegano alla stessa logica ma mantengono il formato di risposta legacy
// Possono essere rimossi in una futura versione
// ============================================================================

// Helper function per parsing additionalData con formResponses
function parseLeadAdditionalData(lead: any) {
  let parsedAdditionalData = {};
  let formQuestions = {};
  
  try {
    if (lead.additionalData || lead.additional_data) {
      const additionalDataObj = typeof (lead.additionalData || lead.additional_data) === 'string' 
        ? JSON.parse(lead.additionalData || lead.additional_data) 
        : (lead.additionalData || lead.additional_data);
      
      parsedAdditionalData = additionalDataObj;
      
      // Estrai i dati del questionario (escludi metadati interni)
      Object.keys(additionalDataObj).forEach(key => {
        if (!['facebookId', 'googleSheetTimestamp'].includes(key)) {
          // Converti chiavi snake_case in camelCase e rendi leggibili
          let readableKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          
          // Mapping specifico per campi comuni
          const keyMappings: Record<string, string> = {
            'situazione_professionale': 'Situazione Professionale',
            'obiettivo': 'Obiettivo',
            'tipo_locale': 'Tipo di Locale',
            'ruolo': 'Ruolo nel Locale',
            'cosa_migliorare': 'Cosa Desidera Migliorare'
          };
          
          const finalKey = keyMappings[key] || readableKey;
          formQuestions[finalKey] = additionalDataObj[key];
        }
      });
    }
  } catch (error) {
    console.error('❌ [API External] Errore parsing additionalData per lead', lead.id, error);
    parsedAdditionalData = (lead.additionalData || lead.additional_data) || {};
  }

  return { parsedAdditionalData, formQuestions };
}

// Helper function per mappare lead al formato legacy
function mapLeadToLegacyFormat(lead: any) {
  const { parsedAdditionalData, formQuestions } = parseLeadAdditionalData(lead);
  
  return {
    id: lead.id,
    businessName: lead.businessName || lead.business_name,
    firstName: lead.firstName || lead.first_name,
    lastName: lead.lastName || lead.last_name,
    fullName: `${lead.firstName || lead.first_name || ''} ${lead.lastName || lead.last_name || ''}`.trim(),
    email: lead.email,
    phone: lead.phone,
    source: lead.source,
    campaign: lead.campaign,
    emailSent: lead.emailSent || lead.email_sent,
    whatsappSent: lead.whatsappSent || lead.whatsapp_sent,
    utmSource: lead.utmSource || lead.utm_source,
    utmMedium: lead.utmMedium || lead.utm_medium,
    utmCampaign: lead.utmCampaign || lead.utm_campaign,
    utmContent: lead.utmContent || lead.utm_content,
    utmTerm: lead.utmTerm || lead.utm_term,
    referrer: lead.referrer,
    userAgent: lead.userAgent || lead.user_agent,
    ipAddress: lead.ipAddress || lead.ip_address,
    videoWatchTime: lead.videoWatchTime || lead.video_watch_time,
    videoProgress: lead.videoProgress || lead.video_progress,
    pixelEvents: lead.pixelEvents || lead.pixel_events,
    landingPage: lead.landingPage || lead.landing_page,
    deviceType: lead.deviceType || lead.device_type,
    browserInfo: lead.browserInfo || lead.browser_info,
    additionalData: parsedAdditionalData,
    formResponses: formQuestions,
    createdAt: lead.createdAt || lead.created_at,
    updatedAt: lead.updatedAt || lead.updated_at
  };
}

// GET /api/external/marketing-leads - Recupera tutti i lead marketing (DEPRECATO)
// Delega alla stessa logica di /external/leads?type=marketing
router.get("/external/marketing-leads", validateApiKey, requireScope('marketing_leads:read'), async (req: ApiKeyRequest, res: Response) => {
  console.warn("⚠️ [DEPRECATED] /external/marketing-leads is deprecated. Use /external/leads?type=marketing instead");
  console.log("🔗 [External API] Richiesta GET /api/external/marketing-leads");
  console.log("🔑 [External API] API Key:", req.apiKey?.name, "- Tenant:", req.tenant?.name);
  console.log("📋 [External API] Query params:", req.query);

  try {
    const { 
      page = 1, 
      limit = 100, 
      source, 
      campaign, 
      since, 
      format = 'json',
      fields 
    } = req.query;

    // Validazione parametri
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(1000, Math.max(1, parseInt(limit as string)));
    const offset = (pageNum - 1) * limitNum;

    console.log("🔧 [External API] Parametri validati:", { 
      page: pageNum, 
      limit: limitNum, 
      offset, 
      source, 
      campaign, 
      since 
    });

    // Parsing del filtro data
    let parsedSince: Date | null = null;
    if (since) {
      const sinceDate = new Date(since as string);
      if (!isNaN(sinceDate.getTime())) {
        parsedSince = sinceDate;
      }
    }

    // Costruisci query - LOGICA UNIFICATA (solo marketing leads)
    const conditions = [eq(marketingLeads.tenantId, req.tenant!.id)];
    
    if (source && source !== 'all') {
      conditions.push(eq(marketingLeads.source, source as string));
    }
    if (campaign && campaign !== 'all') {
      conditions.push(eq(marketingLeads.campaign, campaign as string));
    }
    if (parsedSince) {
      conditions.push(gte(marketingLeads.createdAt, parsedSince));
    }
    
    // Query con paginazione
    const result = await db.select()
      .from(marketingLeads)
      .where(and(...conditions))
      .orderBy(desc(marketingLeads.createdAt))
      .limit(limitNum)
      .offset(offset);

    console.log(`✅ [External API] Query eseguita: ${result.length} risultati`);

    // Conteggio totale
    const countResult = await db.select({ count: sql`count(*)` })
      .from(marketingLeads)
      .where(and(...conditions));
    
    const total = parseInt(countResult[0]?.count || '0');

    console.log(`✅ [External API] Totale: ${total} lead`);

    // Mapping al formato legacy per backward compatibility
    const mappedLeads = result.map(mapLeadToLegacyFormat);

    // Preparazione risposta
    const responseData = {
      success: true,
      data: mappedLeads,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: total,
        pages: Math.ceil(total / limitNum),
        hasNext: (pageNum * limitNum) < total,
        hasPrev: pageNum > 1
      },
      filters: {
        source: source || null,
        campaign: campaign || null,
        since: since || null
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0',
        endpoint: 'external/marketing-leads',
        deprecated: true,
        message: 'This endpoint is deprecated. Use /external/leads?type=marketing instead'
      }
    };

    // Supporto per formato CSV
    if (format === 'csv') {
      if (mappedLeads.length === 0) {
        return res.status(200).send('');
      }
      
      const csvHeaders = Object.keys(mappedLeads[0] || {}).join(',');
      const csvRows = mappedLeads.map(lead => 
        Object.values(lead).map(value => 
          typeof value === 'object' ? JSON.stringify(value) : `"${value}"`
        ).join(',')
      );
      const csvContent = [csvHeaders, ...csvRows].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="marketing-leads-${Date.now()}.csv"`);
      return res.send(csvContent);
    }

    console.log("✅ [External API] Risposta preparata con successo");
    res.json(responseData);

  } catch (error: any) {
    console.error("❌ [External API] Errore nel recupero dei lead:", error);
    res.status(500).json({ 
      success: false, 
      error: "Errore nel recupero dei lead",
      message: error.message 
    });
  }
});

// GET /api/external/marketing-leads/stats - Statistiche marketing leads (DEPRECATO)
// Delega alla stessa logica di /external/leads/stats?type=marketing
router.get("/external/marketing-leads/stats", validateApiKey, requireScope('marketing_leads:read'), async (req: ApiKeyRequest, res: Response) => {
  console.warn("⚠️ [DEPRECATED] /external/marketing-leads/stats is deprecated. Use /external/leads/stats?type=marketing instead");
  console.log("📊 [External API] Richiesta GET /api/external/marketing-leads/stats");
  console.log("🔑 [External API] API Key:", req.apiKey?.name, "- Tenant:", req.tenant?.name);

  try {
    const { days = '30', source, campaign } = req.query;

    // Costruzione delle condizioni WHERE - LOGICA UNIFICATA (solo marketing)
    let baseConditions = eq(marketingLeads.tenantId, req.tenant!.id);
    
    // Aggiungi filtro data se necessario
    if (days !== 'all') {
      const daysNumber = parseInt(days as string);
      if (!isNaN(daysNumber) && daysNumber > 0) {
        baseConditions = and(
          baseConditions,
          sql`${marketingLeads.createdAt} >= NOW() - INTERVAL '${sql.raw(daysNumber.toString())} days'`
        ) as any;
      }
    }
    
    // Aggiungi filtro source se necessario
    if (source && source !== 'all') {
      baseConditions = and(baseConditions, eq(marketingLeads.source, source as string)) as any;
    }
    
    // Aggiungi filtro campaign se necessario
    if (campaign && campaign !== 'all') {
      baseConditions = and(baseConditions, eq(marketingLeads.campaign, campaign as string)) as any;
    }

    // 1. Statistiche generali
    const statsResult = await db.select({
      total_leads: count(),
      unique_sources: countDistinct(marketingLeads.source),
      unique_campaigns: countDistinct(marketingLeads.campaign),
      emails_sent: sql<number>`COUNT(CASE WHEN ${marketingLeads.emailSent} = true THEN 1 END)`,
      whatsapp_sent: sql<number>`COUNT(CASE WHEN ${marketingLeads.whatsappSent} = true THEN 1 END)`,
      leads_last_24h: sql<number>`COUNT(CASE WHEN ${marketingLeads.createdAt} >= NOW() - INTERVAL '24 hours' THEN 1 END)`,
      leads_last_7d: sql<number>`COUNT(CASE WHEN ${marketingLeads.createdAt} >= NOW() - INTERVAL '7 days' THEN 1 END)`
    })
    .from(marketingLeads)
    .where(baseConditions);

    // 2. Breakdown per sorgente
    const sourceBreakdownResult = await db.select({
      source: marketingLeads.source,
      count: count(),
      recent_count: sql<number>`COUNT(CASE WHEN ${marketingLeads.createdAt} >= NOW() - INTERVAL '24 hours' THEN 1 END)`
    })
    .from(marketingLeads)
    .where(baseConditions)
    .groupBy(marketingLeads.source)
    .orderBy(desc(count()));

    // 3. Breakdown per campagna
    let campaignConditions = and(baseConditions, isNotNull(marketingLeads.campaign)) as any;

    const campaignBreakdownResult = await db.select({
      campaign: marketingLeads.campaign,
      count: count(),
      recent_count: sql<number>`COUNT(CASE WHEN ${marketingLeads.createdAt} >= NOW() - INTERVAL '24 hours' THEN 1 END)`
    })
    .from(marketingLeads)
    .where(campaignConditions)
    .groupBy(marketingLeads.campaign)
    .orderBy(desc(count()));

    // 4. Trend giornaliero ultimi 30 giorni
    let trendConditions = and(
      baseConditions,
      sql`${marketingLeads.createdAt} >= NOW() - INTERVAL '30 days'`
    ) as any;

    const dailyTrendResult = await db.select({
      date: sql<string>`DATE(${marketingLeads.createdAt})`,
      count: count()
    })
    .from(marketingLeads)
    .where(trendConditions)
    .groupBy(sql`DATE(${marketingLeads.createdAt})`)
    .orderBy(sql`DATE(${marketingLeads.createdAt}) ASC`);

    const responseData = {
      success: true,
      data: {
        general: statsResult[0],
        breakdown: {
          by_source: sourceBreakdownResult,
          by_campaign: campaignBreakdownResult
        },
        trends: {
          daily: dailyTrendResult
        }
      },
      filters: {
        days: days,
        source: source || null,
        campaign: campaign || null
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0',
        endpoint: 'external/marketing-leads/stats',
        deprecated: true,
        message: 'This endpoint is deprecated. Use /external/leads/stats?type=marketing instead'
      }
    };

    console.log("✅ [External API] Statistiche calcolate con successo");
    res.json(responseData);

  } catch (error: any) {
    console.error("❌ [External API] Errore calcolo statistiche:", error);
    res.status(500).json({
      success: false,
      error: "Errore nel calcolo delle statistiche",
      message: error.message
    });
  }
});

// GET /api/external/marketing-leads/:id - Recupera singolo lead marketing (DEPRECATO)
// Delega alla stessa logica di /external/leads/:id ma verifica che sia marketing
router.get("/external/marketing-leads/:id", validateApiKey, requireScope('marketing_leads:read'), async (req: ApiKeyRequest, res: Response) => {
  console.warn("⚠️ [DEPRECATED] /external/marketing-leads/:id is deprecated. Use /external/leads/:id instead");
  console.log(`🔗 [External API] Richiesta GET /api/external/marketing-leads/${req.params.id}`);
  console.log("🔑 [External API] API Key:", req.apiKey?.name, "- Tenant:", req.tenant?.name);

  try {
    const { id } = req.params;
    const leadId = parseInt(id);

    if (isNaN(leadId)) {
      return res.status(400).json({
        success: false,
        error: "ID lead non valido"
      });
    }

    // LOGICA UNIFICATA - Cerca solo in marketing_leads (tipo marketing)
    const result = await db.select().from(marketingLeads).where(
      and(
        eq(marketingLeads.id, leadId),
        eq(marketingLeads.tenantId, req.tenant!.id)
      )
    );

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Lead non trovato"
      });
    }

    const lead = result[0];
    
    // Mapping al formato legacy per backward compatibility
    const mappedLead = mapLeadToLegacyFormat(lead);

    console.log(`✅ [External API] Lead ${leadId} recuperato con successo`);
    res.json({
      success: true,
      data: mappedLead,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0',
        endpoint: `external/marketing-leads/${id}`,
        deprecated: true,
        message: 'This endpoint is deprecated. Use /external/leads/:id instead'
      }
    });

  } catch (error: any) {
    console.error(`❌ [External API] Errore recupero lead ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: "Errore nel recupero del lead",
      message: error.message
    });
  }
});

// ============================================================================
// API PRIVATE - Con autenticazione per gestione avanzata
// ============================================================================

// PUT /api/external/marketing-leads/:id - Aggiorna lead (API privata)
router.put("/external/marketing-leads/:id", authenticateToken, async (req: Request, res: Response) => {
  console.log(`🔐 [External API Private] Richiesta PUT /api/external/marketing-leads/${req.params.id}`);

  try {
    const { id } = req.params;
    const leadId = parseInt(id);

    if (isNaN(leadId)) {
      return res.status(400).json({
        success: false,
        error: "ID lead non valido"
      });
    }

    const { 
      businessName, 
      firstName, 
      lastName, 
      email, 
      phone, 
      source, 
      campaign,
      emailSent,
      whatsappSent,
      additionalData 
    } = req.body;

    // Costruzione query di aggiornamento dinamica
    const updateFields: string[] = [];
    const updateParams: any[] = [];
    let paramIndex = 1;

    if (businessName !== undefined) {
      updateFields.push(`business_name = $${paramIndex}`);
      updateParams.push(businessName);
      paramIndex++;
    }
    if (firstName !== undefined) {
      updateFields.push(`first_name = $${paramIndex}`);
      updateParams.push(firstName);
      paramIndex++;
    }
    if (lastName !== undefined) {
      updateFields.push(`last_name = $${paramIndex}`);
      updateParams.push(lastName);
      paramIndex++;
    }
    if (email !== undefined) {
      updateFields.push(`email = $${paramIndex}`);
      updateParams.push(email);
      paramIndex++;
    }
    if (phone !== undefined) {
      updateFields.push(`phone = $${paramIndex}`);
      updateParams.push(phone);
      paramIndex++;
    }
    if (source !== undefined) {
      updateFields.push(`source = $${paramIndex}`);
      updateParams.push(source);
      paramIndex++;
    }
    if (campaign !== undefined) {
      updateFields.push(`campaign = $${paramIndex}`);
      updateParams.push(campaign);
      paramIndex++;
    }
    if (emailSent !== undefined) {
      updateFields.push(`email_sent = $${paramIndex}`);
      updateParams.push(emailSent);
      paramIndex++;
    }
    if (whatsappSent !== undefined) {
      updateFields.push(`whatsapp_sent = $${paramIndex}`);
      updateParams.push(whatsappSent);
      paramIndex++;
    }
    if (additionalData !== undefined) {
      updateFields.push(`additional_data = $${paramIndex}`);
      updateParams.push(JSON.stringify(additionalData));
      paramIndex++;
    }

    updateFields.push(`updated_at = NOW()`);

    if (updateFields.length === 1) {
      return res.status(400).json({
        success: false,
        error: "Nessun campo da aggiornare fornito"
      });
    }

    updateParams.push(leadId);

    const updateQuery = `
      UPDATE marketing_leads 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await db.execute(sql.raw(updateQuery, updateParams));

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Lead non trovato"
      });
    }

    console.log(`✅ [External API Private] Lead ${leadId} aggiornato con successo`);
    res.json({
      success: true,
      data: result.rows[0],
      meta: {
        timestamp: new Date().toISOString(),
        action: 'update',
        leadId: leadId
      }
    });

  } catch (error: any) {
    console.error(`❌ [External API Private] Errore aggiornamento lead ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: "Errore nell'aggiornamento del lead",
      message: error.message
    });
  }
});

// DELETE /api/external/marketing-leads/:id - Elimina lead (API privata)
router.delete("/external/marketing-leads/:id", authenticateToken, async (req: Request, res: Response) => {
  console.log(`🔐 [External API Private] Richiesta DELETE /api/external/marketing-leads/${req.params.id}`);

  try {
    const { id } = req.params;
    const leadId = parseInt(id);

    if (isNaN(leadId)) {
      return res.status(400).json({
        success: false,
        error: "ID lead non valido"
      });
    }

    const result = await db.execute(
      sql`DELETE FROM marketing_leads WHERE id = ${leadId} RETURNING *`
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Lead non trovato"
      });
    }

    console.log(`✅ [External API Private] Lead ${leadId} eliminato con successo`);
    res.json({
      success: true,
      meta: {
        timestamp: new Date().toISOString(),
        action: 'delete',
        leadId: leadId
      }
    });

  } catch (error: any) {
    console.error(`❌ [External API Private] Errore eliminazione lead ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: "Errore nell'eliminazione del lead",
      message: error.message
    });
  }
});

export default router;
