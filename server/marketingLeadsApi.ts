
import { Request, Response, Router } from "express";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { authenticateToken } from "./auth";
import { marketingLeads } from "../shared/schema";

const router = Router();

// ============================================================================
// API PUBBLICHE - Per integrazione CRM esterno (senza autenticazione)
// ============================================================================

// GET /api/external/marketing-leads - Recupera tutti i lead (API pubblica)
router.get("/external/marketing-leads", async (req: Request, res: Response) => {
  console.log("🔗 [External API] Richiesta GET /api/external/marketing-leads");
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
    const limitNum = Math.min(1000, Math.max(1, parseInt(limit as string))); // Max 1000 per performance
    const offset = (pageNum - 1) * limitNum;

    console.log("🔧 [External API] Parametri validati:", { 
      page: pageNum, 
      limit: limitNum, 
      offset, 
      source, 
      campaign, 
      since 
    });

    // Costruzione query dinamica
    let whereConditions: string[] = [];
    let queryParams: any[] = [];
    let paramIndex = 1;

    // Filtro per sorgente
    if (source && source !== 'all') {
      whereConditions.push(`source = $${paramIndex}`);
      queryParams.push(source);
      paramIndex++;
    }

    // Filtro per campagna
    if (campaign && campaign !== 'all') {
      whereConditions.push(`campaign = $${paramIndex}`);
      queryParams.push(campaign);
      paramIndex++;
    }

    // Filtro per data (since)
    if (since) {
      const sinceDate = new Date(since as string);
      if (!isNaN(sinceDate.getTime())) {
        whereConditions.push(`created_at >= $${paramIndex}`);
        queryParams.push(sinceDate.toISOString());
        paramIndex++;
      }
    }

    // Costruzione WHERE clause
    const whereClause = whereConditions.length > 0 ? 
      `WHERE ${whereConditions.join(' AND ')}` : '';

    // Selezione campi (se specificata)
    let selectedFields = `
      id, 
      business_name, 
      first_name, 
      last_name, 
      email, 
      phone, 
      source, 
      campaign, 
      email_sent,
      whatsapp_sent,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
      utm_term,
      referrer,
      user_agent,
      ip_address,
      video_watch_time,
      video_progress,
      pixel_events,
      landing_page,
      device_type,
      browser_info,
      additional_data,
      created_at,
      updated_at
    `;

    if (fields) {
      const requestedFields = (fields as string).split(',').map(f => f.trim());
      // Validazione basic dei campi richiesti (security)
      const allowedFields = [
        'id', 'business_name', 'first_name', 'last_name', 'email', 'phone', 
        'source', 'campaign', 'email_sent', 'whatsapp_sent', 'utm_source', 
        'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'referrer',
        'user_agent', 'ip_address', 'video_watch_time', 'video_progress',
        'pixel_events', 'landing_page', 'device_type', 'browser_info',
        'additional_data', 'created_at', 'updated_at'
      ];
      const validFields = requestedFields.filter(field => allowedFields.includes(field));
      if (validFields.length > 0) {
        selectedFields = validFields.join(', ');
      }
    }

    // Costruisci query con drizzle-orm invece di SQL raw
    let query = db.select().from(marketingLeads);
    
    // Applica filtri se presenti
    if (whereConditions.length > 0) {
      const { and, eq, gte } = await import('drizzle-orm');
      const conditions = [];
      
      let paramIdx = 0;
      if (source && source !== 'all') {
        conditions.push(eq(marketingLeads.source, queryParams[paramIdx++]));
      }
      if (campaign && campaign !== 'all') {
        conditions.push(eq(marketingLeads.campaign, queryParams[paramIdx++]));
      }
      if (since) {
        conditions.push(gte(marketingLeads.createdAt, new Date(queryParams[paramIdx++])));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
    }
    
    // Applica ordinamento e paginazione
    const { desc } = await import('drizzle-orm');
    const result = await query
      .orderBy(desc(marketingLeads.createdAt))
      .limit(limitNum)
      .offset(offset);

    console.log(`✅ [External API] Query eseguita: ${result.length} risultati`);

    // Query per il conteggio totale
    let countQuery = db.select({ count: sql`count(*)` }).from(marketingLeads);
    if (whereConditions.length > 0) {
      const { and, eq, gte } = await import('drizzle-orm');
      const conditions = [];
      
      let paramIdx = 0;
      if (source && source !== 'all') {
        conditions.push(eq(marketingLeads.source, queryParams[paramIdx++]));
      }
      if (campaign && campaign !== 'all') {
        conditions.push(eq(marketingLeads.campaign, queryParams[paramIdx++]));
      }
      if (since) {
        conditions.push(gte(marketingLeads.createdAt, new Date(queryParams[paramIdx++])));
      }
      
      if (conditions.length > 0) {
        countQuery = countQuery.where(and(...conditions));
      }
    }
    
    const countResult = await countQuery;
    const total = parseInt(countResult[0]?.count || '0');

    console.log(`✅ [External API] Query eseguita: ${result.length} risultati, ${total} totali`);

    // Mapping dei dati per l'output con parsing dei dati aggiuntivi
    const mappedLeads = result.map(lead => {
      // Parse dei dati aggiuntivi dal modulo
      let parsedAdditionalData = {};
      let formQuestions = {};
      
      try {
        if (lead.additionalData) {
          const additionalDataObj = typeof lead.additionalData === 'string' 
            ? JSON.parse(lead.additionalData) 
            : lead.additionalData;
          
          parsedAdditionalData = additionalDataObj;
          
          // Estrai i dati del questionario (escludi metadati interni)
          Object.keys(additionalDataObj).forEach(key => {
            if (!['facebookId', 'googleSheetTimestamp'].includes(key)) {
              // Converti chiavi snake_case in camelCase e rendi leggibili
              let readableKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
              
              // Mapping specifico per campi comuni
              const keyMappings = {
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
        parsedAdditionalData = lead.additionalData || {};
      }

      return {
        id: lead.id,
        businessName: lead.businessName,
        firstName: lead.firstName,
        lastName: lead.lastName,
        fullName: `${lead.firstName || ''} ${lead.lastName || ''}`.trim(),
        email: lead.email,
        phone: lead.phone,
        source: lead.source,
        campaign: lead.campaign,
        emailSent: lead.emailSent,
        whatsappSent: lead.whatsappSent,
        utmSource: lead.utmSource,
        utmMedium: lead.utmMedium,
        utmCampaign: lead.utmCampaign,
        utmContent: lead.utmContent,
        utmTerm: lead.utmTerm,
        referrer: lead.referrer,
        userAgent: lead.userAgent,
        ipAddress: lead.ipAddress,
        videoWatchTime: lead.videoWatchTime,
        videoProgress: lead.videoProgress,
        pixelEvents: lead.pixelEvents,
        landingPage: lead.landingPage,
        deviceType: lead.deviceType,
        browserInfo: lead.browserInfo,
        // Mantieni il campo originale per compatibilità
        additionalData: parsedAdditionalData,
        // Nuovo campo con le risposte del questionario strutturate
        formResponses: formQuestions,
        createdAt: lead.createdAt,
        updatedAt: lead.updatedAt
      };
    });

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
        endpoint: 'external/marketing-leads'
      }
    };

    // Supporto per formato CSV
    if (format === 'csv') {
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

  } catch (error) {
    console.error("❌ [External API] Errore nel recupero dei lead:", error);
    res.status(500).json({ 
      success: false, 
      error: "Errore nel recupero dei lead",
      message: error.message 
    });
  }
});

// GET /api/external/marketing-leads/:id - Recupera singolo lead (API pubblica)
router.get("/external/marketing-leads/:id", async (req: Request, res: Response) => {
  console.log(`🔗 [External API] Richiesta GET /api/external/marketing-leads/${req.params.id}`);

  try {
    const { id } = req.params;
    const leadId = parseInt(id);

    if (isNaN(leadId)) {
      return res.status(400).json({
        success: false,
        error: "ID lead non valido"
      });
    }

    const { eq } = await import('drizzle-orm');
    const result = await db.select().from(marketingLeads).where(eq(marketingLeads.id, leadId));

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Lead non trovato"
      });
    }

    const lead = result[0];
    // Parse dei dati aggiuntivi dal modulo per lead singolo
    let parsedAdditionalData = {};
    let formQuestions = {};
    
    try {
      if (lead.additional_data) {
        const additionalDataObj = typeof lead.additional_data === 'string' 
          ? JSON.parse(lead.additional_data) 
          : lead.additional_data;
        
        parsedAdditionalData = additionalDataObj;
        
        // Estrai i dati del questionario (escludi metadati interni)
        Object.keys(additionalDataObj).forEach(key => {
          if (!['facebookId', 'googleSheetTimestamp'].includes(key)) {
            // Converti chiavi snake_case in camelCase e rendi leggibili
            let readableKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            
            // Mapping specifico per campi comuni
            const keyMappings = {
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
      console.error('❌ [API External] Errore parsing additionalData per lead singolo', lead.id, error);
      parsedAdditionalData = lead.additional_data || {};
    }

    const mappedLead = {
      id: lead.id,
      businessName: lead.business_name,
      firstName: lead.first_name,
      lastName: lead.last_name,
      fullName: `${lead.first_name || ''} ${lead.last_name || ''}`.trim(),
      email: lead.email,
      phone: lead.phone,
      source: lead.source,
      campaign: lead.campaign,
      emailSent: lead.email_sent,
      whatsappSent: lead.whatsapp_sent,
      utmSource: lead.utm_source,
      utmMedium: lead.utm_medium,
      utmCampaign: lead.utm_campaign,
      utmContent: lead.utm_content,
      utmTerm: lead.utm_term,
      referrer: lead.referrer,
      userAgent: lead.user_agent,
      ipAddress: lead.ip_address,
      videoWatchTime: lead.video_watch_time,
      videoProgress: lead.video_progress,
      pixelEvents: lead.pixel_events,
      landingPage: lead.landing_page,
      deviceType: lead.device_type,
      browserInfo: lead.browser_info,
      // Mantieni il campo originale per compatibilità
      additionalData: parsedAdditionalData,
      // Nuovo campo con le risposte del questionario strutturate
      formResponses: formQuestions,
      createdAt: lead.created_at,
      updatedAt: lead.updated_at
    };

    console.log(`✅ [External API] Lead ${leadId} recuperato con successo`);
    res.json({
      success: true,
      data: mappedLead,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0',
        endpoint: `external/marketing-leads/${id}`
      }
    });

  } catch (error) {
    console.error(`❌ [External API] Errore recupero lead ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: "Errore nel recupero del lead",
      message: error.message
    });
  }
});

// GET /api/external/marketing-leads/stats - Statistiche aggregate (API pubblica)
router.get("/external/marketing-leads/stats", async (req: Request, res: Response) => {
  console.log("📊 [External API] Richiesta GET /api/external/marketing-leads/stats");

  try {
    const { days = '30', source, campaign } = req.query;

    let whereConditions: string[] = [];
    let queryParams: any[] = [];
    let paramIndex = 1;

    // Filtro per data
    if (days !== 'all') {
      const daysNumber = parseInt(days as string);
      if (!isNaN(daysNumber) && daysNumber > 0) {
        whereConditions.push(`created_at >= NOW() - INTERVAL '${daysNumber} days'`);
      }
    }

    // Filtro per sorgente
    if (source && source !== 'all') {
      whereConditions.push(`source = $${paramIndex}`);
      queryParams.push(source);
      paramIndex++;
    }

    // Filtro per campagna
    if (campaign && campaign !== 'all') {
      whereConditions.push(`campaign = $${paramIndex}`);
      queryParams.push(campaign);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? 
      `WHERE ${whereConditions.join(' AND ')}` : '';

    // Statistiche generali
    const statsQuery = `
      SELECT 
        COUNT(*) as total_leads,
        COUNT(DISTINCT source) as unique_sources,
        COUNT(DISTINCT campaign) as unique_campaigns,
        COUNT(CASE WHEN email_sent = true THEN 1 END) as emails_sent,
        COUNT(CASE WHEN whatsapp_sent = true THEN 1 END) as whatsapp_sent,
        AVG(video_watch_time) as avg_video_watch_time,
        AVG(video_progress) as avg_video_progress,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as leads_last_24h,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as leads_last_7d
      FROM marketing_leads ${whereClause}
    `;

    const statsResult = await db.execute(sql.raw(statsQuery, queryParams));

    // Breakdown per sorgente
    const sourceBreakdownQuery = `
      SELECT 
        source,
        COUNT(*) as count,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as recent_count,
        AVG(video_watch_time) as avg_watch_time,
        AVG(video_progress) as avg_progress
      FROM marketing_leads ${whereClause}
      GROUP BY source
      ORDER BY count DESC
    `;

    const sourceBreakdownResult = await db.execute(sql.raw(sourceBreakdownQuery, queryParams));

    // Breakdown per campagna
    const campaignBreakdownQuery = `
      SELECT 
        campaign,
        COUNT(*) as count,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as recent_count
      FROM marketing_leads ${whereClause}
      AND campaign IS NOT NULL
      GROUP BY campaign
      ORDER BY count DESC
    `;

    const campaignBreakdownResult = await db.execute(sql.raw(campaignBreakdownQuery, queryParams));

    // Trend giornaliero ultimi 30 giorni
    const dailyTrendQuery = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM marketing_leads ${whereClause}
      ${whereConditions.length > 0 ? 'AND' : 'WHERE'} created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    const dailyTrendResult = await db.execute(sql.raw(dailyTrendQuery, queryParams));

    const responseData = {
      success: true,
      data: {
        general: statsResult.rows[0],
        breakdown: {
          by_source: sourceBreakdownResult.rows,
          by_campaign: campaignBreakdownResult.rows
        },
        trends: {
          daily: dailyTrendResult.rows
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
        endpoint: 'external/marketing-leads/stats'
      }
    };

    console.log("✅ [External API] Statistiche calcolate con successo");
    res.json(responseData);

  } catch (error) {
    console.error("❌ [External API] Errore calcolo statistiche:", error);
    res.status(500).json({
      success: false,
      error: "Errore nel calcolo delle statistiche",
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

    if (updateFields.length === 1) { // Solo updated_at
      return res.status(400).json({
        success: false,
        error: "Nessun campo da aggiornare fornito"
      });
    }

    updateParams.push(leadId); // ID per WHERE clause

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

  } catch (error) {
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

    const deleteQuery = `
      DELETE FROM marketing_leads 
      WHERE id = $1
      RETURNING id, email, business_name
    `;

    const result = await db.execute(sql.raw(deleteQuery, [leadId]));

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Lead non trovato"
      });
    }

    console.log(`✅ [External API Private] Lead ${leadId} eliminato con successo`);
    res.json({
      success: true,
      data: {
        deletedLead: result.rows[0],
        message: "Lead eliminato con successo"
      },
      meta: {
        timestamp: new Date().toISOString(),
        action: 'delete',
        leadId: leadId
      }
    });

  } catch (error) {
    console.error(`❌ [External API Private] Errore eliminazione lead ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: "Errore nell'eliminazione del lead",
      message: error.message
    });
  }
});

// POST /api/external/marketing-leads/bulk-export - Export bulk con filtri avanzati (API privata)
router.post("/external/marketing-leads/bulk-export", authenticateToken, async (req: Request, res: Response) => {
  console.log("🔐 [External API Private] Richiesta POST /api/external/marketing-leads/bulk-export");

  try {
    const {
      sources = [],
      campaigns = [],
      dateFrom,
      dateTo,
      format = 'json',
      includeFields = 'all'
    } = req.body;

    let whereConditions: string[] = [];
    let queryParams: any[] = [];
    let paramIndex = 1;

    // Filtro per sorgenti multiple
    if (sources.length > 0) {
      const placeholders = sources.map(() => `$${paramIndex++}`).join(',');
      whereConditions.push(`source IN (${placeholders})`);
      queryParams.push(...sources);
    }

    // Filtro per campagne multiple
    if (campaigns.length > 0) {
      const placeholders = campaigns.map(() => `$${paramIndex++}`).join(',');
      whereConditions.push(`campaign IN (${placeholders})`);
      queryParams.push(...campaigns);
    }

    // Filtro per data from
    if (dateFrom) {
      whereConditions.push(`created_at >= $${paramIndex}`);
      queryParams.push(new Date(dateFrom).toISOString());
      paramIndex++;
    }

    // Filtro per data to
    if (dateTo) {
      whereConditions.push(`created_at <= $${paramIndex}`);
      queryParams.push(new Date(dateTo).toISOString());
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? 
      `WHERE ${whereConditions.join(' AND ')}` : '';

    // Selezione campi
    let selectedFields = '*';
    if (includeFields !== 'all' && Array.isArray(includeFields)) {
      selectedFields = includeFields.join(', ');
    }

    const exportQuery = `
      SELECT ${selectedFields}
      FROM marketing_leads 
      ${whereClause}
      ORDER BY created_at DESC
    `;

    console.log("📝 [External API Private] Query export:", exportQuery);
    console.log("🔢 [External API Private] Parametri:", queryParams);

    const result = await db.execute(sql.raw(exportQuery, queryParams));

    if (format === 'csv') {
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Nessun lead trovato con i filtri specificati"
        });
      }

      const csvHeaders = Object.keys(result.rows[0]).join(',');
      const csvRows = result.rows.map(row => 
        Object.values(row).map(value => 
          typeof value === 'object' ? JSON.stringify(value) : `"${value}"`
        ).join(',')
      );
      const csvContent = [csvHeaders, ...csvRows].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="bulk-export-${Date.now()}.csv"`);
      return res.send(csvContent);
    }

    console.log(`✅ [External API Private] Export completato: ${result.rows.length} lead`);
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      filters: {
        sources,
        campaigns,
        dateFrom,
        dateTo
      },
      meta: {
        timestamp: new Date().toISOString(),
        format: format,
        exportType: 'bulk'
      }
    });

  } catch (error) {
    console.error("❌ [External API Private] Errore export bulk:", error);
    res.status(500).json({
      success: false,
      error: "Errore nell'export bulk",
      message: error.message
    });
  }
});

export { router };
export default router;
