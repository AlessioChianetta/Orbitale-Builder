import { Request, Response, Router } from "express";
import { db } from "./db";
import { sql, eq, and, desc, count, gte, lte } from "drizzle-orm";
import { authenticateToken, type AuthRequest } from "./auth";
import { marketingLeads, users, leads } from "../shared/schema";

const router = Router();

// GET /api/marketing-leads - Recupera tutti i lead CON FILTRI
router.get("/", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 50, source, campaign, startDate, endDate, export: exportCsv } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(403).json({ error: "Tenant not identified" });
    }

    const conditions = [eq(marketingLeads.tenantId, tenantId)];
    
    if (source && source !== 'all') {
      conditions.push(eq(marketingLeads.source, source as string));
    }
    
    if (campaign && campaign !== 'all') {
      conditions.push(eq(marketingLeads.campaign, campaign as string));
    }
    
    if (startDate) {
      conditions.push(gte(marketingLeads.createdAt, new Date(startDate as string)));
    }
    
    if (endDate) {
      conditions.push(lte(marketingLeads.createdAt, new Date(endDate as string)));
    }

    const [result, countResult] = await Promise.all([
      db.select().from(marketingLeads)
        .where(and(...conditions))
        .orderBy(desc(marketingLeads.createdAt))
        .limit(limitNum)
        .offset(offset),
      db.select({ total: count() }).from(marketingLeads)
        .where(and(...conditions))
    ]);

    const total = countResult[0]?.total || 0;

    console.log(`📊 [Marketing Leads] Conteggio totale: ${total}`);

    const mappedLeads = result;

    // Se richiesto export CSV, genera e restituisci CSV
    if (exportCsv === 'true' || exportCsv === '1') {
      console.log("📄 [Marketing Leads] Generazione CSV richiesta");
      
      const csvHeaders = ['ID', 'Business Name', 'First Name', 'Last Name', 'Email', 'Phone', 'Source', 'Campaign', 'Email Sent', 'WhatsApp Sent', 'Created At'];
      const csvRows = mappedLeads.map(lead => [
        lead.id,
        lead.businessName || '',
        lead.firstName || '',
        lead.lastName || '',
        lead.email || '',
        lead.phone || '',
        lead.source || '',
        lead.campaign || '',
        lead.emailSent ? 'Yes' : 'No',
        lead.whatsappSent ? 'Yes' : 'No',
        new Date(lead.createdAt).toLocaleString('it-IT')
      ]);
      
      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="marketing-leads-${new Date().toISOString().split('T')[0]}.csv"`);
      return res.send('\uFEFF' + csvContent); // BOM for Excel UTF-8 support
    }

    const responseData = {
      leads: mappedLeads,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: parseInt(String(total)),
        pages: Math.ceil(parseInt(String(total)) / parseInt(limit as string))
      },
      filters: {
        source: source || null,
        campaign: campaign || null,
        startDate: startDate || null,
        endDate: endDate || null
      }
    };

    res.json(responseData);

  } catch (error: any) {
    console.error("[Marketing Leads] Error:", error?.message);
    res.status(500).json({ error: "Errore nel recupero dei lead" });
  }
});

router.get("/stats", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(403).json({ error: "Tenant not identified" });
    }

    const { days = '30' } = req.query;

    let statsQuery;
    const daysNumber = parseInt(days as string);
    if (days !== 'all' && !isNaN(daysNumber) && daysNumber > 0) {
      statsQuery = sql`
        SELECT 
          COUNT(*) as total_leads,
          COUNT(DISTINCT source) as unique_sources,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as leads_last_24h,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as leads_last_7d
        FROM marketing_leads
        WHERE tenant_id = ${tenantId} AND created_at >= NOW() - INTERVAL ${sql.raw(`'${daysNumber} days'`)}
      `;
    } else {
      statsQuery = sql`
        SELECT 
          COUNT(*) as total_leads,
          COUNT(DISTINCT source) as unique_sources,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as leads_last_24h,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as leads_last_7d
        FROM marketing_leads
        WHERE tenant_id = ${tenantId}
      `;
    }

    const statsResult = await db.execute(statsQuery);

    let sourceStatsQuery;
    if (days !== 'all' && !isNaN(daysNumber) && daysNumber > 0) {
      sourceStatsQuery = sql`
        SELECT 
          source,
          COUNT(*) as count,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as recent_count
        FROM marketing_leads
        WHERE tenant_id = ${tenantId} AND created_at >= NOW() - INTERVAL ${sql.raw(`'${daysNumber} days'`)}
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
        WHERE tenant_id = ${tenantId}
        GROUP BY source
        ORDER BY count DESC
      `;
    }

    const sourceStatsResult = await db.execute(sourceStatsQuery);

    const dailyStatsQuery = sql`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM marketing_leads
      WHERE tenant_id = ${tenantId} AND created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    const dailyStatsResult = await db.execute(dailyStatsQuery);

    res.json({
      general: statsResult.rows[0],
      by_source: sourceStatsResult.rows,
      daily_trend: dailyStatsResult.rows
    });

  } catch (error: any) {
    console.error("[Marketing Stats] Error:", error.message);
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

    // Recupera tenant ID dal middleware
    const tenant = (req as any).tenant;
    if (!tenant || !tenant.id) {
      console.error("❌ [Marketing Leads] Tenant non trovato nella richiesta");
      return res.status(400).json({ error: "Tenant non identificato" });
    }
    const tenantId = tenant.id;
    console.log("🔧 [Marketing Leads] Tenant ID:", tenantId, "- Tenant Name:", tenant.name);

    // Recupera configurazioni utente per Telegram
    let owner = null;
    try {
      const ownerResult = await db.select({
        telegramBotToken: users.telegramBotToken,
        telegramChatId: users.telegramChatId
      })
      .from(users)
      .where(eq(users.tenantId, tenantId))
      .limit(1);
      
      if (ownerResult && ownerResult.length > 0) {
        owner = ownerResult[0];
        console.log("✅ [Marketing Leads] Configurazioni utente recuperate");
      } else {
        console.log("⚠️ [Marketing Leads] Nessun utente trovato per tenant ID:", tenantId);
      }
    } catch (error) {
      console.error("❌ [Marketing Leads] Errore recupero configurazioni utente:", error);
    }

    console.log("📝 [Marketing Leads] Inserimento lead nel database...");
    
    const result = await db.insert(marketingLeads).values({
      tenantId: tenantId,
      businessName: businessName,
      firstName: firstName,
      lastName: lastName,
      email: email,
      phone: phone || null,
      source: source || 'unknown',
      campaign: campaign || 'unknown',
      emailSent: false,
      whatsappSent: false,
    }).returning();

    const savedLead = result[0];
    console.log("✅ [Marketing Leads] Lead creato con successo:", savedLead);

    // 🔄 SINCRONIZZA CON TABELLA LEADS (CRM)
    try {
      console.log("🔄 [Marketing Leads] Sincronizzazione con tabella leads (CRM)...");
      
      const existingCrmLead = await db.execute(sql`
        SELECT id FROM leads 
        WHERE tenant_id = ${tenantId} 
          AND email = ${email} 
          AND source = ${'marketing-' + (campaign || 'unknown')}
        LIMIT 1
      `);
      
      if (existingCrmLead.rows.length === 0) {
        await db.insert(leads).values({
          tenantId: tenantId,
          name: `${firstName} ${lastName}`,
          email: email,
          phone: phone || null,
          company: businessName || null,
          message: `Lead da campagna: ${campaign || 'unknown'} - Fonte: ${source || 'unknown'}`,
          source: `marketing-${campaign || 'unknown'}`,
          status: 'new',
          notes: null,
        });
        console.log("✅ [Marketing Leads] Lead sincronizzato in tabella CRM");
      } else {
        console.log("ℹ️ [Marketing Leads] Lead già esistente in CRM, skip duplicato");
      }
    } catch (syncError: any) {
      console.error("❌ [Marketing Leads] Errore sincronizzazione CRM:", syncError);
    }

    // Invia email di benvenuto personalizzata se non già inviata
      if (savedLead.email && !savedLead.emailSent) {
        try {
          console.log('📧 [Lead API] Invio email di benvenuto personalizzata...');
          const { sendCustomSuccessEmail } = await import('./email');

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
            savedLead.firstName || '', // Usiamo firstName per il nome
            savedLead.phone,
            emailSlug
          );

          if (emailResult.success) {
            console.log(`✅ [Lead API] Email di benvenuto inviata con successo a ${savedLead.email}`);
            // Aggiorna il flag nel database
            await db.update(marketingLeads)
              .set({ emailSent: true })
              .where(eq(marketingLeads.id, savedLead.id));
          } else {
            console.error(`❌ [Lead API] Errore invio email benvenuto a ${savedLead.email}:`, emailResult.error);
          }
        } catch (error: any) {
          console.error('❌ [Lead API] Errore durante invio email:', error);
        }
      }


    // 📱 TRACKING DUPLICATI E INVIO AUTOMATICO WHATSAPP + TELEGRAM BOT
    if (savedLead) {
      try {
        // Conta i duplicati per questa email/campagna per tracking
        const duplicateCountResult = await db.execute(sql`
          SELECT COUNT(*) as count 
          FROM marketing_leads 
          WHERE email = ${email} AND campaign = ${campaign || 'unknown'}
        `);
        const existingCount = parseInt(String(duplicateCountResult.rows[0]?.count || '0'));

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
          const { sendWhatsAppWelcomeMessage } = await import('./whatsapp');

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
            await db.update(marketingLeads)
              .set({ whatsappSent: true })
              .where(eq(marketingLeads.id, savedLead.id));
          } else {
            console.error(`❌ [Marketing Leads] Errore invio WhatsApp automatico per ${email}:`, whatsappResult.error);
          }
        } else {
          console.log(`⚠️ [Marketing Leads] Numero telefono mancante per ${email} - WhatsApp non inviato`);
        }
      } catch (error: any) {
        console.error('❌ [Marketing Leads] Errore durante tracking/WhatsApp/Telegram automatico:', error);
      }
    }

    res.status(201).json(savedLead);

  } catch (error: any) {
    console.error("❌ [Marketing Leads] Errore nella creazione del lead:", error);
    console.error("❌ [Marketing Leads] Error code:", error?.code);
    console.error("❌ [Marketing Leads] Stack trace:", error?.stack);

    if (error?.code === '23505') {
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

    // Recupera tenant ID dal middleware
    const tenant = (req as any).tenant;
    if (!tenant || !tenant.id) {
      console.error("❌ [Marketing Advanced] Tenant non trovato nella richiesta");
      return res.status(400).json({ error: "Tenant non identificato" });
    }
    const tenantId = tenant.id;
    console.log("🔧 [Marketing Advanced] Tenant ID:", tenantId, "- Tenant Name:", tenant.name);

    // Recupera configurazioni utente per Telegram
    let owner = null;
    try {
      const ownerResult = await db.select({
        telegramBotToken: users.telegramBotToken,
        telegramChatId: users.telegramChatId
      })
      .from(users)
      .where(eq(users.tenantId, tenantId))
      .limit(1);
      
      if (ownerResult && ownerResult.length > 0) {
        owner = ownerResult[0];
        console.log("✅ [Marketing Advanced] Configurazioni utente recuperate");
      } else {
        console.log("⚠️ [Marketing Advanced] Nessun utente trovato per tenant ID:", tenantId);
      }
    } catch (error: any) {
      console.error("❌ [Marketing Advanced] Errore recupero configurazioni utente:", error);
    }

    console.log("📝 [Marketing Advanced] Inserimento lead nel database...");
    
    // Prepara additionalData con tutti i campi di tracking avanzato
    const additionalData = {
      utmSource: utmSource || null,
      utmMedium: utmMedium || null,
      utmCampaign: utmCampaign || null,
      utmContent: utmContent || null,
      utmTerm: utmTerm || null,
      referrer: referrer || null,
      userAgent: clientUserAgent || null,
      ipAddress: clientIP || null,
      videoWatchTime: videoWatchTime || 0,
      videoProgress: videoProgress || 0,
      pixelEvents: pixelEvents || [],
      landingPage: landingPage || null,
      deviceType: deviceType || null,
      browserInfo: browserInfo || {}
    };

    const result = await db.insert(marketingLeads).values({
      tenantId: tenantId,
      businessName: businessName,
      firstName: firstName,
      lastName: lastName,
      email: email,
      phone: phone || null,
      source: source || 'MovieTurbo',
      campaign: campaign || null,
      additionalData: additionalData,
      emailSent: false,
      whatsappSent: false,
    }).returning();

    const newLead = result[0];
    console.log("✅ [Marketing Advanced] Lead creato con ID:", newLead.id);

    // 📊 TRACKING DUPLICATI E INVIO WHATSAPP + TELEGRAM BOT AUTOMATICO
    try {
      // Conta i duplicati per questa email/campagna per tracking completo
      const duplicateCountResult = await db.execute(sql`
        SELECT COUNT(*) as count 
        FROM marketing_leads 
        WHERE email = ${email} AND campaign = ${campaign || 'MovieTurbo'}
      `);
      const existingCount = parseInt(String(duplicateCountResult.rows[0]?.count || '0'));

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
        const { sendWhatsAppWelcomeMessage } = await import('./whatsapp');

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
          await db.update(marketingLeads)
            .set({ whatsappSent: true })
            .where(eq(marketingLeads.id, newLead.id));
        } else {
          console.error(`❌ [Marketing Advanced] Errore invio WhatsApp per ${email}:`, whatsappResult.error);
        }
      } else {
        console.log(`⚠️ [Marketing Advanced] Numero telefono mancante per ${email} - WhatsApp non inviato`);
      }
    } catch (trackingError: any) {
      console.error('❌ [Marketing Advanced] Errore durante tracking/WhatsApp/Telegram:', trackingError);
    }

    // Video analytics sono già salvati in additionalData del lead
    // La tabella video_analytics separata non esiste nello schema corrente
    if (videoWatchTime && videoProgress) {
      console.log("📹 [Marketing Advanced] Video analytics salvati in additionalData del lead");
    }

    console.log('📧 [Marketing Advanced] Nuovo lead marketing creato:', { 
      id: newLead.id, 
      email, 
      source, 
      videoProgress,
      deviceType 
    });

    res.json({ 
      success: true, 
      leadId: newLead.id,
      lead: {
        id: newLead.id,
        businessName,
        firstName,
        lastName,
        email,
        phone,
        source: source || 'MovieTurbo',
        campaign: campaign || null
      }
    });
  } catch (error: any) {
    console.error('❌ [Marketing Advanced] Errore nella creazione del lead marketing:', error);
    console.error('❌ [Marketing Advanced] Stack trace:', error?.stack);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Endpoint per ottenere analytics dettagliate dei lead - OTTIMIZZATO
router.get('/analytics', authenticateToken, async (req, res) => {
  console.log("📊 [Marketing Analytics] Inizio richiesta GET /marketing/leads/analytics");
  console.log("📋 [Marketing Analytics] Query params:", req.query);

  try {
    const { days = '7', source, campaign } = req.query;

    // Costruisci i filtri per la query
    const filters: any[] = [];
    
    if (days !== 'all') {
      const daysNumber = parseInt(days as string);
      if (!isNaN(daysNumber) && daysNumber > 0) {
        console.log(`📅 [Marketing Analytics] Filtro giorni: ${daysNumber}`);
        filters.push(sql`created_at >= NOW() - INTERVAL '${sql.raw(daysNumber.toString())} days'`);
      }
    }

    if (source) {
      console.log(`📊 [Marketing Analytics] Filtro source: ${source}`);
      filters.push(sql`source = ${source}`);
    }

    if (campaign) {
      console.log(`📊 [Marketing Analytics] Filtro campaign: ${campaign}`);
      filters.push(sql`campaign = ${campaign}`);
    }

    // Crea la condizione WHERE
    const whereCondition = filters.length > 0 
      ? sql`WHERE ${sql.join(filters, sql` AND `)}`
      : sql``;

    // QUERY UNICA OTTIMIZZATA - tutte le statistiche in una chiamata
    // Nota: additionalData contiene i campi avanzati come videoWatchTime, videoProgress, etc.
    const combinedAnalyticsQuery = sql`
      WITH analytics_data AS (
        SELECT 
          COUNT(*) as total_leads,
          COUNT(DISTINCT source) as unique_sources,
          COUNT(*) as avg_video_watch_time,
          COUNT(*) as avg_video_progress,
          COUNT(*) as high_engagement_leads,
          COUNT(*) as tracked_leads,
          COUNT(*) as started_video,
          COUNT(*) as quarter_watched,
          COUNT(*) as half_watched,
          COUNT(*) as mostly_watched,
          COUNT(*) as completed_video,
          NULL::text as type,
          NULL::text as category,
          NULL::bigint as count,
          NULL::numeric as avg_watch_time,
          NULL::numeric as avg_progress,
          NULL::text as utm_source,
          NULL::text as utm_medium
        FROM marketing_leads ${whereCondition}
      ),
      source_breakdown AS (
        SELECT 
          NULL::bigint as total_leads,
          NULL::bigint as unique_sources,
          NULL::bigint as avg_video_watch_time,
          NULL::bigint as avg_video_progress,
          NULL::bigint as high_engagement_leads,
          NULL::bigint as tracked_leads,
          NULL::bigint as started_video,
          NULL::bigint as quarter_watched,
          NULL::bigint as half_watched,
          NULL::bigint as mostly_watched,
          NULL::bigint as completed_video,
          'source_breakdown' as type,
          source as category,
          COUNT(*) as count,
          NULL as avg_watch_time,
          NULL as avg_progress,
          NULL as utm_source,
          NULL as utm_medium
        FROM marketing_leads ${whereCondition}
        GROUP BY source
      )
      SELECT * FROM analytics_data
      UNION ALL
      SELECT * FROM source_breakdown
      ORDER BY type NULLS FIRST, count DESC NULLS LAST
    `;

    console.log("📝 [Marketing Analytics] Query unica ottimizzata");
    const result = await db.execute(combinedAnalyticsQuery);

    // Processa i risultati
    const stats = result.rows.find(row => !row.type) || {};
    const sourceBreakdown = result.rows.filter(row => row.type === 'source_breakdown');

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
      deviceBreakdown: [], // Device type info is in additionalData, not a separate column
      campaignBreakdown: [], // Campaign info is in additionalData, not separate columns
      conversionFunnel
    };

    console.log("✅ [Marketing Analytics] Risposta preparata con successo (query ottimizzata)");
    res.json(responseData);
  } catch (error: any) {
    console.error('❌ [Marketing Analytics] Errore nel recupero analytics lead:', error);
    console.error('❌ [Marketing Analytics] Stack trace:', error?.stack);
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
  } catch (error: any) {
    console.error("❌ [Marketing Campaigns] Errore recupero campagne:", error);
    res.status(500).json({ error: "Errore nel recupero delle campagne" });
  }
});

// Endpoint per ottenere le sources attive
router.get('/sources', authenticateToken, async (req, res) => {
  console.log("📋 [Marketing Sources] Richiesta sources attive");

  try {
    const sourcesQuery = sql`
      SELECT DISTINCT source 
      FROM marketing_leads 
      WHERE source IS NOT NULL 
      ORDER BY source ASC
    `;

    const result = await db.execute(sourcesQuery);
    const sources = result.rows.map(row => row.source);

    console.log(`✅ [Marketing Sources] ${sources.length} sources trovate:`, sources);
    res.json(sources);
  } catch (error: any) {
    console.error("❌ [Marketing Sources] Errore recupero sources:", error);
    res.status(500).json({ error: "Errore nel recupero delle sources" });
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
    const { sendWhatsAppWelcomeMessage } = await import('./whatsapp');

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
  } catch (error: any) {
    console.error('❌ [Manual WhatsApp] Errore generale:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Errore interno del server' 
    });
  }
});

router.get("/:id", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(403).json({ success: false, error: "Tenant not identified" });
    }

    const { id } = req.params;
    const leadId = parseInt(id);

    if (isNaN(leadId)) {
      return res.status(400).json({
        success: false,
        error: "ID lead non valido"
      });
    }

    const result = await db.select().from(marketingLeads)
      .where(and(eq(marketingLeads.id, leadId), eq(marketingLeads.tenantId, tenantId)));

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Lead non trovato"
      });
    }

    res.json(result[0]);

  } catch (error: any) {
    console.error("[Marketing Lead Details] Error:", error?.message);
    res.status(500).json({
      success: false,
      error: "Errore nel recupero del lead"
    });
  }
});

// DELETE /api/marketing-leads/:id - Elimina lead
router.delete("/:id", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(403).json({ success: false, error: "Tenant not identified" });
    }

    const { id } = req.params;
    const leadId = parseInt(id);

    if (isNaN(leadId)) {
      return res.status(400).json({
        success: false,
        error: "ID lead non valido"
      });
    }

    const existingLead = await db.select().from(marketingLeads)
      .where(and(eq(marketingLeads.id, leadId), eq(marketingLeads.tenantId, tenantId)));

    if (existingLead.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Lead non trovato"
      });
    }

    const result = await db.delete(marketingLeads)
      .where(and(eq(marketingLeads.id, leadId), eq(marketingLeads.tenantId, tenantId)))
      .returning();

    console.log(`✅ [Marketing Lead Delete] Lead ${leadId} eliminato con successo`);
    res.json({
      success: true,
      data: {
        deletedLead: result.length > 0 ? result[0] : null,
        message: "Lead eliminato con successo"
      },
      meta: {
        timestamp: new Date().toISOString(),
        action: 'delete',
        leadId: leadId
      }
    });

  } catch (error: any) {
    console.error(`❌ [Marketing Lead Delete] Errore eliminazione lead ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: "Errore nell'eliminazione del lead",
      message: error?.message
    });
  }
});

// Endpoint per controllare se una campagna ha lead associati
router.get('/check-campaign/:campaign', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(403).json({ error: "Tenant not identified" });
    }

    const { campaign } = req.params;
    const decodedCampaign = decodeURIComponent(campaign);

    const checkQuery = sql`
      SELECT COUNT(*) as count 
      FROM marketing_leads 
      WHERE tenant_id = ${tenantId} AND campaign = ${decodedCampaign}
    `;

    const result = await db.execute(checkQuery);
    const leadCount = parseInt(String(result.rows[0]?.count || '0'));

    res.json({ 
      hasLeads: leadCount > 0,
      leadCount,
      campaign: decodedCampaign
    });
  } catch (error: any) {
    console.error("[Campaign Leads Check] Error:", error?.message);
    res.status(500).json({ error: "Errore nel controllo della campagna" });
  }
});

export { router };
export default router;