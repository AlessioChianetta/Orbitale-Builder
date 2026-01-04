import { Request, Response, Router } from "express";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { authenticateToken } from "./auth";
import { marketingLeads } from "../shared/schema";

const router = Router();

// GET /api/marketing-leads - Recupera tutti i lead (senza filtri)
router.get("/", authenticateToken, async (req: Request, res: Response) => {
  console.log("🔍 [Marketing Leads] Inizio richiesta GET /api/marketing-leads");
  console.log("📋 [Marketing Leads] Query params ricevuti:", req.query);

  try {
    const { page = 1, limit = 50 } = req.query;

    console.log("🔧 [Marketing Leads] Parametri elaborati:", {
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    });

    // Query con parametri integrati correttamente
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    console.log("🔧 [Marketing Leads] Parametri calcolati:", { limit: limitNum, offset });

    const result = await db.execute(sql`
      SELECT 
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
        additional_data,
        COALESCE(created_at, NOW()) as created_at
      FROM marketing_leads
      ORDER BY COALESCE(created_at, NOW()) DESC
      LIMIT ${limitNum} OFFSET ${offset}
    `);
    console.log(`✅ [Marketing Leads] Query eseguita con successo, risultati trovati: ${result.rows.length}`);

    // Count query semplificata
    console.log("📝 [Marketing Leads] Eseguo count query");

    const countResult = await db.execute(sql`
      SELECT COUNT(*) as total FROM marketing_leads
    `);
    const total = countResult.rows[0]?.total || 0;

    console.log(`📊 [Marketing Leads] Conteggio totale: ${total}`);

    // Map snake_case to camelCase for frontend
    const mappedLeads = result.rows.map(lead => ({
      id: lead.id,
      businessName: lead.business_name,
      firstName: lead.first_name,
      lastName: lead.last_name,
      email: lead.email,
      phone: lead.phone,
      source: lead.source,
      campaign: lead.campaign,
      emailSent: lead.email_sent,
      whatsappSent: lead.whatsapp_sent,
      additionalData: lead.additional_data,
      createdAt: lead.created_at
    }));

    const responseData = {
      leads: mappedLeads,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: parseInt(total),
        pages: Math.ceil(total / parseInt(limit as string))
      }
    };

    console.log("✅ [Marketing Leads] Risposta preparata con successo:");
    console.log(`   - Lead restituiti: ${result.rows.length}`);
    console.log(`   - Pagina corrente: ${responseData.pagination.page}`);
    console.log(`   - Totale pagine: ${responseData.pagination.pages}`);

    res.json(responseData);

  } catch (error) {
    console.error("❌ [Marketing Leads] Errore nel recupero dei lead:", error);
    console.error("❌ [Marketing Leads] Stack trace:", error.stack);
    console.error("❌ [Marketing Leads] Query params originali:", req.query);
    res.status(500).json({ error: "Errore nel recupero dei lead" });
  }
});

// GET /api/marketing-leads/stats - Statistiche aggregate (originale)
router.get("/stats", authenticateToken, async (req: Request, res: Response) => {
  console.log("📊 [Marketing Stats] Inizio richiesta GET /api/marketing-leads/stats");
  console.log("📋 [Marketing Stats] Query params:", req.query);

  try {
    const { days = '30' } = req.query;
    console.log(`📅 [Marketing Stats] Periodo analisi: ${days} giorni`);

    // Stats generali
    let statsQuery;
    if (days !== 'all') {
      const daysNumber = parseInt(days as string);
      if (!isNaN(daysNumber) && daysNumber > 0) {
        console.log(`📅 [Marketing Stats] Filtro data applicato: ${daysNumber} giorni`);
        statsQuery = sql`
          SELECT 
            COUNT(*) as total_leads,
            COUNT(DISTINCT source) as unique_sources,
            COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as leads_last_24h,
            COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as leads_last_7d
          FROM marketing_leads
          WHERE created_at >= NOW() - INTERVAL ${sql.raw(`'${daysNumber} days'`)}
        `;
      } else {
        statsQuery = sql`
          SELECT 
            COUNT(*) as total_leads,
            COUNT(DISTINCT source) as unique_sources,
            COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as leads_last_24h,
            COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as leads_last_7d
          FROM marketing_leads
        `;
      }
    } else {
      statsQuery = sql`
        SELECT 
          COUNT(*) as total_leads,
          COUNT(DISTINCT source) as unique_sources,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as leads_last_24h,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as leads_last_7d
        FROM marketing_leads
      `;
    }

    console.log("📝 [Marketing Stats] Eseguo stats query");
    const statsResult = await db.execute(statsQuery);
    console.log("✅ [Marketing Stats] Stats generali ottenute:", statsResult.rows[0]);

    // Stats per fonte
    let sourceStatsQuery;
    if (days !== 'all') {
      const daysNumber = parseInt(days as string);
      if (!isNaN(daysNumber) && daysNumber > 0) {
        sourceStatsQuery = sql`
          SELECT 
            source,
            COUNT(*) as count,
            COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as recent_count
          FROM marketing_leads
          WHERE created_at >= NOW() - INTERVAL ${sql.raw(`'${daysNumber} days'`)}
          GROUP BY source
          ORDER BY count DESC
        `;
      } else {
        sourceStatsQuery = sql`
          SELECT 
            source,
            COUNT(*) as count,
            COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as recent_count
          FROM marketing_leads
          GROUP BY source
          ORDER BY count DESC
        `;
      }
    } else {
      sourceStatsQuery = sql`
        SELECT 
          source,
          COUNT(*) as count,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as recent_count
        FROM marketing_leads
        GROUP BY source
        ORDER BY count DESC
      `;
    }

    console.log("📝 [Marketing Stats] Eseguo source stats query");
    const sourceStatsResult = await db.execute(sourceStatsQuery);
    console.log(`✅ [Marketing Stats] Stats per fonte ottenute: ${sourceStatsResult.rows.length} fonti`);

    // Stats giornaliere (ultimi 30 giorni)
    const dailyStatsQuery = sql`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM marketing_leads
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    console.log("📝 [Marketing Stats] Eseguo daily stats query");
    const dailyStatsResult = await db.execute(dailyStatsQuery);
    console.log(`✅ [Marketing Stats] Stats giornaliere ottenute: ${dailyStatsResult.rows.length} giorni`);

    const responseData = {
      general: statsResult.rows[0],
      by_source: sourceStatsResult.rows,
      daily_trend: dailyStatsResult.rows
    };

    console.log("✅ [Marketing Stats] Risposta preparata con successo");
    res.json(responseData);

  } catch (error) {
    console.error("❌ [Marketing Stats] Errore nel recupero delle statistiche:", error);
    console.error("❌ [Marketing Stats] Stack trace:", error.stack);
    res.status(500).json({ error: "Errore nel recupero delle statistiche" });
  }
});

// POST /api/marketing-leads - Crea un nuovo lead
router.post("/", async (req: Request, res: Response) => {
  console.log("➕ [Marketing Leads] Inizio richiesta POST /api/marketing-leads");
  console.log("📋 [Marketing Leads] Body ricevuto:", JSON.stringify(req.body, null, 2));

  try {
    const { businessName, firstName, lastName, email, phone, source, campaign } = req.body;

    console.log("🔍 [Marketing Leads] Validazione campi obbligatori...");
    if (!businessName || !firstName || !lastName || !email) {
      console.log("❌ [Marketing Leads] Campi obbligatori mancanti:", {
        businessName: !!businessName,
        firstName: !!firstName, 
        lastName: !!lastName,
        email: !!email
      });
      return res.status(400).json({ error: "Campi obbligatori mancanti" });
    }

    const insertQuery = `
      INSERT INTO marketing_leads (business_name, first_name, last_name, email, phone, source, campaign, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *
    `;

    const insertParams = [
      businessName, 
      firstName, 
      lastName, 
      email, 
      phone || null, 
      source || 'unknown', 
      campaign || null
    ];

    console.log("📝 [Marketing Leads] Insert query:", insertQuery);
    console.log("🔢 [Marketing Leads] Insert parametri:", insertParams);

    const result = await db.execute(sql.raw(insertQuery, insertParams));
    const savedLead = result.rows[0];
    console.log("✅ [Marketing Leads] Lead creato con successo:", savedLead);

    // Invia email di benvenuto personalizzata se non già inviata
      if (savedLead.email && !savedLead.emailSent) {
        try {
          console.log('📧 [Lead API] Invio email di benvenuto personalizzata...');
          const { sendCustomSuccessEmail } = await import('../email');

          // Determina lo slug dalla campagna o usa movieturbo come default
          let emailSlug = 'movieturbo'; // default
          if (savedLead.campaign) {
            if (savedLead.campaign.toLowerCase().includes('dipendenti')) {
              emailSlug = 'dipendenti';
            } else if (savedLead.campaign.toLowerCase().includes('standard')) {
              emailSlug = 'standard';
            }
            // movieturbo rimane il default per retrocompatibilità
          }

          console.log(`📧 [Lead API] Invio email con template: ${emailSlug}`);

          const emailResult = await sendCustomSuccessEmail(
            savedLead.email,
            savedLead.first_name, // Usiamo first_name per il nome
            savedLead.phone,
            emailSlug
          );

          if (emailResult.success) {
            console.log(`✅ [Lead API] Email di benvenuto inviata con successo a ${savedLead.email}`);
            // Aggiorna il flag nel database
            const updateQuery = `
              UPDATE marketing_leads 
              SET email_sent = true 
              WHERE id = $1
            `;
            await db.execute(sql.raw(updateQuery, [savedLead.id]));
          } else {
            console.error(`❌ [Lead API] Errore invio email benvenuto a ${savedLead.email}:`, emailResult.error);
          }
        } catch (error) {
          console.error('❌ [Lead API] Errore durante invio email:', error);
        }
      }


    // 📱 TRACKING DUPLICATI E INVIO AUTOMATICO WHATSAPP + TELEGRAM BOT
    if (result.rows[0]) {
      try {
        // Conta i duplicati per questa email/campagna per tracking
        const duplicateCountQuery = `
          SELECT COUNT(*) as count 
          FROM marketing_leads 
          WHERE email = $1 AND campaign = $2
        `;
        const duplicateCountResult = await db.execute(sql.raw(duplicateCountQuery, [email, campaign || 'unknown']));
        const existingCount = parseInt(duplicateCountResult.rows[0]?.count || '0');

        if (existingCount > 1) {
          console.log(`🔄 [Marketing Leads] DUPLICATO TRACCIATO: ${email} si è iscritto alla campagna ${campaign || 'unknown'} per la ${existingCount}ª volta`);
        } else {
          console.log(`✨ [Marketing Leads] NUOVO LEAD: ${email} prima iscrizione alla campagna ${campaign || 'unknown'}`);
        }

        // 🤖 INVIA NOTIFICA AL BOT TELEGRAM
        try {
          console.log('🤖 [Telegram Bot] Invio notifica nuovo lead...');
          const telegramMessage = `🚨 NUOVO LEAD MARKETING!\n\n` +
            `👤 Nome: ${firstName} ${lastName}\n` +
            `🏢 Azienda: ${businessName}\n` +
            `📧 Email: ${email}\n` +
            `📱 Telefono: ${phone || 'Non fornito'}\n` +
            `🎯 Campagna: ${campaign || 'Non specificata'}\n` +
            `🕐 Data: ${new Date().toLocaleString('it-IT')}`;

          // Verifica se l'utente ha configurato Telegram
          if (!owner?.telegramBotToken || !owner?.telegramChatId) {
            console.log('⚠️ [Telegram Bot] Configurazione Telegram non trovata per l\'utente');
          } else {

          const telegramUrl = `https://api.telegram.org/bot${owner.telegramBotToken}/sendMessage`;

          const telegramResponse = await fetch(telegramUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              chat_id: owner.telegramChatId,
              text: telegramMessage,
              parse_mode: 'HTML'
            })
          });

          if (telegramResponse.ok) {
            console.log('✅ [Telegram Bot] Notifica nuovo lead inviata con successo!');
          } else {
            const errorData = await telegramResponse.text();
            console.error('❌ [Telegram Bot] Errore invio notifica:', errorData);
          }
          }
        } catch (telegramError) {
          console.error('❌ [Telegram Bot] Errore durante invio notifica Telegram:', telegramError);
        }

        // Invia SEMPRE WhatsApp automaticamente (anche per duplicati)
        if (phone) {
          console.log('📱 [Marketing Leads] Invio automatico WhatsApp per nuovo lead...');
          const { sendWhatsAppWelcomeMessage } = await import('../whatsapp');

          const whatsappResult = await sendWhatsAppWelcomeMessage({
            phone: phone,
            name: `${firstName} ${lastName}`,
            businessName: businessName,
            campaign: campaign,
            message: '' // Verrà generato automaticamente
          });

          if (whatsappResult.success) {
            console.log(`✅ [Marketing Leads] WhatsApp automatico inviato con successo per ${email}!`);
            // Aggiorna il flag nel database
            const updateQuery = `
              UPDATE marketing_leads 
              SET whatsapp_sent = true 
              WHERE id = $1
            `;
            await db.execute(sql.raw(updateQuery, [result.rows[0].id]));
          } else {
            console.error(`❌ [Marketing Leads] Errore invio WhatsApp automatico per ${email}:`, whatsappResult.error);
          }
        } else {
          console.log(`⚠️ [Marketing Leads] Numero telefono mancante per ${email} - WhatsApp non inviato`);
        }
      } catch (error) {
        console.error('❌ [Marketing Leads] Errore durante tracking/WhatsApp/Telegram automatico:', error);
      }
    }

    res.status(201).json(savedLead);

  } catch (error) {
    console.error("❌ [Marketing Leads] Errore nella creazione del lead:", error);
    console.error("❌ [Marketing Leads] Error code:", error.code);
    console.error("❌ [Marketing Leads] Stack trace:", error.stack);

    if (error.code === '23505') {
      console.log("⚠️ [Marketing Leads] Email duplicata rilevata");
      res.status(409).json({ error: "Email già esistente" });
    } else {
      res.status(500).json({ error: "Errore nella creazione del lead" });
    }
  }
});

// Marketing Leads Routes - Advanced endpoint
router.post('/marketing/leads', async (req, res) => {
  console.log("➕ [Marketing Advanced] Inizio richiesta POST /marketing/leads");
  console.log("📋 [Marketing Advanced] Body completo:", JSON.stringify(req.body, null, 2));

  try {
    const { 
      businessName, 
      firstName, 
      lastName, 
      email, 
      phone, 
      source, 
      campaign,
      // Nuovi campi per tracking avanzato
      utmSource,
      utmMedium,
      utmCampaign,
      utmContent,
      utmTerm,
      referrer,
      userAgent,
      ipAddress,
      videoWatchTime,
      videoProgress,
      pixelEvents,
      landingPage,
      deviceType,
      browserInfo
    } = req.body;

    console.log("🔍 [Marketing Advanced] Validazione input...");
    // Validazione input
    if (!businessName || !firstName || !lastName || !email || !phone) {
      console.log("❌ [Marketing Advanced] Campi obbligatori mancanti");
      return res.status(400).json({ error: 'Tutti i campi sono obbligatori' });
    }

    // Validazione email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log("❌ [Marketing Advanced] Email non valida:", email);
      return res.status(400).json({ error: 'Email non valida' });
    }

    // Validazione telefono (semplice)
    const phoneRegex = /^[+]?[\d\s-()]+$/;
    if (!phoneRegex.test(phone)) {
      console.log("❌ [Marketing Advanced] Telefono non valido:", phone);
      return res.status(400).json({ error: 'Numero di telefono non valido' });
    }

    // Estrai informazioni dal User Agent
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || ipAddress;
    const clientUserAgent = req.headers['user-agent'] || userAgent;

    console.log("🌐 [Marketing Advanced] Info client:", {
      clientIP,
      clientUserAgent: clientUserAgent?.substring(0, 100) + '...',
      deviceType,
      videoWatchTime,
      videoProgress
    });

    const insertQuery = `
      INSERT INTO marketing_leads (
        business_name,
        first_name,
        last_name,
        email,
        phone,
        source,
        campaign,
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
        whatsapp_sent,
        created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, false, NOW()
      )
      RETURNING id
    `;

    const insertParams = [
      businessName,
      firstName,
      lastName,
      email,
      phone,
      source || 'MovieTurbo',
      campaign || null,
      utmSource || null,
      utmMedium || null,
      utmCampaign || null,
      utmContent || null,
      utmTerm || null,
      referrer || null,
      clientUserAgent || null,
      clientIP || null,
      videoWatchTime || 0,
      videoProgress || 0,
      JSON.stringify(pixelEvents || []),
      landingPage || null,
      deviceType || null,
      JSON.stringify(browserInfo || {})
    ];

    console.log("📝 [Marketing Advanced] Esecuzione insert...");
    const newLead = await db.execute(sql.raw(insertQuery, insertParams));
    console.log("✅ [Marketing Advanced] Lead creato con ID:", newLead.rows[0].id);

    // 📊 TRACKING DUPLICATI E INVIO WHATSAPP + TELEGRAM BOT AUTOMATICO
    try {
      // Conta i duplicati per questa email/campagna per tracking completo
      const duplicateCountQuery = `
        SELECT COUNT(*) as count 
        FROM marketing_leads 
        WHERE email = $1 AND campaign = $2
      `;
      const duplicateCountResult = await db.execute(sql.raw(duplicateCountQuery, [email, campaign || 'MovieTurbo']));
      const existingCount = parseInt(duplicateCountResult.rows[0]?.count || '0');

      if (existingCount > 1) {
        console.log(`🔄 [Marketing Advanced] DUPLICATO TRACCIATO: ${email} si è iscritto alla campagna ${campaign || 'MovieTurbo'} per la ${existingCount}ª volta`);
      } else {
        console.log(`✨ [Marketing Advanced] NUOVO LEAD: ${email} prima iscrizione alla campagna ${campaign || 'MovieTurbo'}`);
      }

      // 🤖 INVIA NOTIFICA AL BOT TELEGRAM
      try {
        console.log('🤖 [Telegram Bot Advanced] Invio notifica nuovo lead...');
        console.log('🤖 [Telegram Bot Advanced] Dati lead:', { firstName, lastName, email, campaign });

        const telegramMessage = `🚨 NUOVO LEAD MARKETING (Advanced)!\n\n` +
          `👤 Nome: ${firstName} ${lastName}\n` +
          `🏢 Azienda: ${businessName}\n` +
          `📧 Email: ${email}\n` +
          `📱 Telefono: ${phone || 'Non fornito'}\n` +
          `🎯 Campagna: ${campaign || 'MovieTurbo'}\n` +
          `📺 Video Progress: ${videoProgress || 0}%\n` +
          `⏱️ Watch Time: ${videoWatchTime || 0}s\n` +
          `📱 Device: ${deviceType || 'Sconosciuto'}\n` +
          `🕐 Data: ${new Date().toLocaleString('it-IT')}`;

        console.log('🤖 [Telegram Bot Advanced] Messaggio da inviare:', telegramMessage);

        // Verifica se l'utente ha configurato Telegram
        if (!owner?.telegramBotToken || !owner?.telegramChatId) {
          console.log('⚠️ [Telegram Bot Advanced] Configurazione Telegram non trovata per l\'utente');
        } else {

        const telegramUrl = `https://api.telegram.org/bot${owner.telegramBotToken}/sendMessage`;

        console.log('🤖 [Telegram Bot Advanced] URL Telegram configurato per utente');
        console.log('🤖 [Telegram Bot Advanced] Chat ID:', owner.telegramChatId);

        const telegramResponse = await fetch(telegramUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: owner.telegramChatId,
            text: telegramMessage,
            parse_mode: 'HTML'
          })
        });

        console.log('🤖 [Telegram Bot Advanced] Status risposta:', telegramResponse.status);

        if (telegramResponse.ok) {
          const responseData = await telegramResponse.json();
          console.log('✅ [Telegram Bot Advanced] Notifica nuovo lead inviata con successo!');
          console.log('✅ [Telegram Bot Advanced] Risposta Telegram:', responseData);
        } else {
          const errorData = await telegramResponse.text();
          console.error('❌ [Telegram Bot Advanced] Errore invio notifica:', errorData);
        }
        }
      } catch (telegramError) {
        console.error('❌ [Telegram Bot Advanced] Errore durante invio notifica Telegram:', telegramError);
      }

      // Invia SEMPRE messaggio WhatsApp di benvenuto (anche per duplicati)
      if (phone) {
        console.log('📱 [Marketing Advanced] Invio messaggio WhatsApp di benvenuto...');
        const { sendWhatsAppWelcomeMessage } = await import('../whatsapp');

        const whatsappResult = await sendWhatsAppWelcomeMessage({
          phone: phone,
          name: `${firstName} ${lastName}`,
          businessName: businessName,
          campaign: campaign,
          message: '' // Verrà generato automaticamente
        });

        if (whatsappResult.success) {
          console.log(`✅ [Marketing Advanced] Messaggio WhatsApp inviato con successo per ${email}!`);
          // Aggiorna il flag nel database
          const updateQuery = `
            UPDATE marketing_leads 
            SET whatsapp_sent = true 
            WHERE id = $1
          `;
          await db.execute(sql.raw(updateQuery, [newLead.rows[0].id]));
        } else {
          console.error(`❌ [Marketing Advanced] Errore invio WhatsApp per ${email}:`, whatsappResult.error);
        }
      } else {
        console.log(`⚠️ [Marketing Advanced] Numero telefono mancante per ${email} - WhatsApp non inviato`);
      }
    } catch (trackingError) {
      console.error('❌ [Marketing Advanced] Errore durante tracking/WhatsApp/Telegram:', trackingError);
    }

    // Salva anche le video analytics se presenti
    if (videoWatchTime && videoProgress) {
      console.log("📹 [Marketing Advanced] Salvando video analytics...");

      const videoAnalyticsQuery = `
        INSERT INTO video_analytics (
          video_id, 
          user_email, 
          user_name, 
          interaction_type, 
          interaction_data, 
          video_time, 
          timestamp,
          created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, NOW()
        )
      `;

      const videoAnalyticsParams = [
        source || 'optin_conversion',
        email,
        firstName + ' ' + lastName,
        'conversion',
        JSON.stringify({ videoProgress, totalWatchTime: videoWatchTime }),
        videoWatchTime,
        Date.now()
      ];

      await db.execute(sql.raw(videoAnalyticsQuery, videoAnalyticsParams));
      console.log("✅ [Marketing Advanced] Video analytics salvate");
    }

    console.log('📧 [Marketing Advanced] Nuovo lead marketing creato:', { 
      id: newLead.rows[0].id, 
      email, 
      source, 
      videoProgress,
      deviceType 
    });

    res.json({ 
      success: true, 
      leadId: newLead.rows[0].id,
      lead: {
        id: newLead.rows[0].id,
        businessName,
        firstName,
        lastName,
        email,
        phone,
        source: source || 'MovieTurbo',
        campaign: campaign || null
      }
    });
  } catch (error) {
    console.error('❌ [Marketing Advanced] Errore nella creazione del lead marketing:', error);
    console.error('❌ [Marketing Advanced] Stack trace:', error.stack);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Endpoint per ottenere analytics dettagliate dei lead - OTTIMIZZATO
router.get('/analytics', authenticateToken, async (req, res) => {
  console.log("📊 [Marketing Analytics] Inizio richiesta GET /marketing/leads/analytics");
  console.log("📋 [Marketing Analytics] Query params:", req.query);

  try {
    const { days = '7', source, campaign } = req.query;

    let whereClause = '';
    const params: any[] = [];
    let paramIndex = 1;

    // Usa solo il filtro days, ignora limit se presente
    if (days !== 'all') {
      const daysNumber = parseInt(days as string);
      if (!isNaN(daysNumber) && daysNumber > 0) {
        whereClause += ` WHERE created_at >= NOW() - INTERVAL '${daysNumber} days'`;
        console.log(`📅 [Marketing Analytics] Filtro giorni: ${daysNumber}`);
      }
    }

    if (source) {
      whereClause += whereClause ? ' AND' : ' WHERE';
      whereClause += ` source = $${paramIndex}`;
      params.push(source);
      paramIndex++;
      console.log(`📊 [Marketing Analytics] Filtro source: ${source}`);
    }

    if (campaign) {
      whereClause += whereClause ? ' AND' : ' WHERE';
      whereClause += ` campaign = $${paramIndex}`;
      params.push(campaign);
      paramIndex++;
      console.log(`📊 [Marketing Analytics] Filtro campaign: ${campaign}`);
    }

    // QUERY UNICA OTTIMIZZATA - tutte le statistiche in una chiamata
    const combinedAnalyticsQuery = `
      WITH analytics_data AS (
        SELECT 
          COUNT(*) as total_leads,
          COUNT(DISTINCT source) as unique_sources,
          AVG(video_watch_time) as avg_video_watch_time,
          AVG(video_progress) as avg_video_progress,
          COUNT(CASE WHEN video_progress > 75 THEN 1 END) as high_engagement_leads,
          COUNT(CASE WHEN utm_source IS NOT NULL THEN 1 END) as tracked_leads,
          COUNT(CASE WHEN video_progress > 0 THEN 1 END) as started_video,
          COUNT(CASE WHEN video_progress > 25 THEN 1 END) as quarter_watched,
          COUNT(CASE WHEN video_progress > 50 THEN 1 END) as half_watched,
          COUNT(CASE WHEN video_progress > 75 THEN 1 END) as mostly_watched,
          COUNT(CASE WHEN video_progress > 90 THEN 1 END) as completed_video
        FROM marketing_leads ${whereClause}
      ),
      source_breakdown AS (
        SELECT 
          'source_breakdown' as type,
          source as category,
          COUNT(*) as count,
          AVG(video_watch_time) as avg_watch_time,
          AVG(video_progress) as avg_progress,
          NULL as utm_source,
          NULL as utm_medium
        FROM marketing_leads ${whereClause}
        GROUP BY source
      ),
      device_breakdown AS (
        SELECT 
          'device_breakdown' as type,
          device_type as category,
          COUNT(*) as count,
          NULL as avg_watch_time,
          NULL as avg_progress,
          NULL as utm_source,
          NULL as utm_medium
        FROM marketing_leads ${whereClause}
        WHERE device_type IS NOT NULL
        GROUP BY device_type
      ),
      campaign_breakdown AS (
        SELECT 
          'campaign_breakdown' as type,
          utm_campaign as category,
          COUNT(*) as count,
          NULL as avg_watch_time,
          AVG(video_progress) as avg_progress,
          utm_source,
          utm_medium
        FROM marketing_leads ${whereClause}
        WHERE utm_campaign IS NOT NULL
        GROUP BY utm_campaign, utm_source, utm_medium
      )
      SELECT * FROM analytics_data
      UNION ALL
      SELECT type, category, count, avg_watch_time, avg_progress, utm_source, utm_medium FROM source_breakdown
      UNION ALL  
      SELECT type, category, count, avg_watch_time, avg_progress, utm_source, utm_medium FROM device_breakdown
      UNION ALL
      SELECT type, category, count, avg_watch_time, avg_progress, utm_source, utm_medium FROM campaign_breakdown
      ORDER BY type, count DESC NULLS LAST
    `;

    console.log("📝 [Marketing Analytics] Query unica ottimizzata");
    const result = await db.execute(sql.raw(combinedAnalyticsQuery, params));

    // Processa i risultati
    const stats = result.rows[0] || {};
    const sourceBreakdown = result.rows.filter(row => row.type === 'source_breakdown');
    const deviceBreakdown = result.rows.filter(row => row.type === 'device_breakdown');
    const campaignBreakdown = result.rows.filter(row => row.type === 'campaign_breakdown');

    const conversionFunnel = {
      started_video: stats.started_video || 0,
      quarter_watched: stats.quarter_watched || 0,
      half_watched: stats.half_watched || 0,
      mostly_watched: stats.mostly_watched || 0,
      completed_video: stats.completed_video || 0,
      total_conversions: stats.total_leads || 0
    };

    const responseData = {
      stats: {
        total_leads: stats.total_leads || 0,
        unique_sources: stats.unique_sources || 0,
        avg_video_watch_time: stats.avg_video_watch_time || 0,
        avg_video_progress: stats.avg_video_progress || 0,
        high_engagement_leads: stats.high_engagement_leads || 0,
        tracked_leads: stats.tracked_leads || 0
      },
      sourceBreakdown,
      deviceBreakdown,
      campaignBreakdown,
      conversionFunnel
    };

    console.log("✅ [Marketing Analytics] Risposta preparata con successo (query ottimizzata)");
    res.json(responseData);
  } catch (error) {
    console.error('❌ [Marketing Analytics] Errore nel recupero analytics lead:', error);
    console.error('❌ [Marketing Analytics] Stack trace:', error.stack);
    res.status(500).json({ error: 'Errore nel recupero analytics' });
  }
});

// Endpoint per ottenere le campagne attive
router.get('/campaigns', authenticateToken, async (req, res) => {
  console.log("📋 [Marketing Campaigns] Richiesta campagne attive");

  try {
    const campaignsQuery = sql`
      SELECT DISTINCT campaign 
      FROM marketing_leads 
      WHERE campaign IS NOT NULL 
      ORDER BY campaign ASC
    `;

    const result = await db.execute(campaignsQuery);
    const campaigns = result.rows.map(row => row.campaign);

    console.log(`✅ [Marketing Campaigns] ${campaigns.length} campagne trovate:`, campaigns);
    res.json(campaigns);
  } catch (error) {
    console.error("❌ [Marketing Campaigns] Errore recupero campagne:", error);
    res.status(500).json({ error: "Errore nel recupero delle campagne" });
  }
});

// Endpoint per invio WhatsApp manuale
router.post('/send-whatsapp', authenticateToken, async (req, res) => {
  console.log("📱 [Manual WhatsApp] Richiesta invio WhatsApp manuale");
  console.log("📋 [Manual WhatsApp] Body:", req.body);

  try {
    const { leadId, phone, name, businessName, campaign } = req.body;

    if (!leadId || !phone || !name || !campaign) {
      console.log("❌ [Manual WhatsApp] Campi obbligatori mancanti");
      return res.status(400).json({ error: 'Campi obbligatori mancanti' });
    }

    // Verifica che il lead esista
    const leadQuery = sql`
      SELECT * FROM marketing_leads WHERE id = ${leadId}
    `;
    const leadResult = await db.execute(leadQuery);

    if (leadResult.rows.length === 0) {
      console.log("❌ [Manual WhatsApp] Lead non trovato:", leadId);
      return res.status(404).json({ error: 'Lead non trovato' });
    }

    const lead = leadResult.rows[0];
    console.log("✅ [Manual WhatsApp] Lead trovato:", lead.email);

    // Invia messaggio WhatsApp
    const { sendWhatsAppWelcomeMessage } = await import('../whatsapp');

    const whatsappResult = await sendWhatsAppWelcomeMessage({
      phone: phone,
      name: name,
      businessName: businessName || lead.business_name,
      campaign: campaign,
      message: '' // Verrà generato automaticamente
    });

    if (whatsappResult.success) {
      console.log('✅ [Manual WhatsApp] Messaggio inviato con successo');

      // Aggiorna il flag nel database
      const updateQuery = sql`
        UPDATE marketing_leads 
        SET whatsapp_sent = true 
        WHERE id = ${leadId}
      `;
      await db.execute(updateQuery);

      res.json({ 
        success: true, 
        message: 'Messaggio WhatsApp inviato con successo',
        leadId: leadId
      });
    } else {
      console.error('❌ [Manual WhatsApp] Errore invio:', whatsappResult.error);

      // Determina il codice di stato appropriato
      let statusCode = 500;
      if (whatsappResult.error && whatsappResult.error.includes('limite giornaliero')) {
        statusCode = 429; // Too Many Requests
      }

      res.status(statusCode).json({ 
        success: false, 
        error: whatsappResult.error || 'Errore nell\'invio WhatsApp' 
      });
    }
  } catch (error) {
    console.error('❌ [Manual WhatsApp] Errore generale:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Errore interno del server' 
    });
  }
});

// GET /api/marketing-leads/:id - Recupera dettagli di un singolo lead
router.get("/:id", authenticateToken, async (req: Request, res: Response) => {
  console.log(`🔍 [Marketing Lead Details] Richiesta GET /api/marketing-leads/${req.params.id}`);

  try {
    const { id } = req.params;
    const leadId = parseInt(id);

    if (isNaN(leadId)) {
      console.log("❌ [Marketing Lead Details] ID non valido:", id);
      return res.status(400).json({
        success: false,
        error: "ID lead non valido"
      });
    }

    // Query per ottenere tutti i dettagli del lead
    const result = await db.execute(sql`
      SELECT 
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
      FROM marketing_leads 
      WHERE id = ${leadId}
    `);

    if (result.rows.length === 0) {
      console.log("❌ [Marketing Lead Details] Lead non trovato:", leadId);
      return res.status(404).json({
        success: false,
        error: "Lead non trovato"
      });
    }

    const lead = result.rows[0];

    // Mappa i dati per il frontend
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
      additionalData: lead.additional_data,
      createdAt: lead.created_at,
      updatedAt: lead.updated_at
    };

    console.log(`✅ [Marketing Lead Details] Lead ${leadId} recuperato con successo`);
    res.json(mappedLead);

  } catch (error) {
    console.error(`❌ [Marketing Lead Details] Errore recupero lead ${req.params.id}:`, error);
    console.error('❌ [Marketing Lead Details] Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      error: "Errore nel recupero del lead",
      message: error.message
    });
  }
});

// DELETE /api/marketing-leads/:id - Elimina lead
router.delete("/:id", authenticateToken, async (req: Request, res: Response) => {
  console.log(`🗑️ [Marketing Lead Delete] Richiesta DELETE /api/marketing-leads/${req.params.id}`);

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
    const { marketingLeads } = await import('../../shared/schema');

    // Prima verifica se il lead esiste
    const existingLead = await db.select().from(marketingLeads).where(eq(marketingLeads.id, leadId));

    if (existingLead.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Lead non trovato"
      });
    }

    // Elimina il lead
    const result = await db.delete(marketingLeads).where(eq(marketingLeads.id, leadId)).returning();

    console.log(`✅ [Marketing Lead Delete] Lead ${leadId} eliminato con successo`);
    res.json({
      success: true,
      data: {
        deletedLead: result[0],
        message: "Lead eliminato con successo"
      },
      meta: {
        timestamp: new Date().toISOString(),
        action: 'delete',
        leadId: leadId
      }
    });

  } catch (error) {
    console.error(`❌ [Marketing Lead Delete] Errore eliminazione lead ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: "Errore nell'eliminazione del lead",
      message: error.message
    });
  }
});

// Endpoint per controllare se una campagna ha lead associati
router.get('/check-campaign/:campaign', authenticateToken, async (req, res) => {
  console.log(`🔍 [Campaign Leads Check] Controllo lead per campagna: ${req.params.campaign}`);

  try {
    const { campaign } = req.params;
    const decodedCampaign = decodeURIComponent(campaign);

    console.log(`🔍 [Campaign Leads Check] Campagna decodificata: ${decodedCampaign}`);

    const checkQuery = sql`
      SELECT COUNT(*) as count 
      FROM marketing_leads 
      WHERE campaign = ${decodedCampaign}
    `;

    const result = await db.execute(checkQuery);
    const leadCount = result[0]?.count || 0; // Modifica qui per gestire correttamente il risultato di db.execute
    const hasLeads = leadCount > 0;

    console.log(`✅ [Campaign Leads Check] Campagna ${decodedCampaign}: ${leadCount} lead trovati`);

    res.json({ 
      hasLeads,
      leadCount: parseInt(leadCount),
      campaign: decodedCampaign
    });
  } catch (error) {
    console.error(`❌ [Campaign Leads Check] Errore controllo campagna ${req.params.campaign}:`, error);
    res.status(500).json({ error: "Errore nel controllo della campagna" });
  }
});

export { router };
export default router;