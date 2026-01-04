import { Router } from 'express';
import { authenticateToken, AuthRequest } from './auth';
import { z } from 'zod';

// Estendi global per includere googleSheetsAutoSync
declare global {
  var googleSheetsAutoSync: any;
}
// TODO: Ripristinare quando il file email.ts sarà disponibile
// import { getTransporter } from '../email';

const router = Router();

// Endpoint per testare il sistema di notifiche email per nuovi lead
// TEMPORANEAMENTE DISABILITATO - manca il file email.ts
router.post('/test-notification', authenticateToken, async (req, res) => {
  try {
    console.log('⚠️ [Test Notification] Endpoint temporaneamente disabilitato - file email.ts mancante');
    res.status(503).json({
      success: false,
      message: 'Funzionalità email temporaneamente non disponibile. Creare il file server/email.ts o importarlo correttamente.'
    });
  } catch (error) {
    console.error('❌ [Test Notification] Errore:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Errore sconosciuto'
    });
  }
});

// Endpoint per testare sincronizzazione immediata (debug)
router.post('/sync-now', authenticateToken, async (req, res) => {
  try {
    console.log('🔧 [Sync Manual] Avvio sincronizzazione immediata per debug...');

    // Forza una sincronizzazione immediata
    if (global.googleSheetsAutoSync) {
      // Usa il metodo privato direttamente per test
      await (global.googleSheetsAutoSync as any).syncNow();

      res.json({
        success: true,
        message: 'Sincronizzazione completata. Controlla i log del server per dettagli.'
      });
    } else {
      res.status(503).json({
        success: false,
        message: 'Sistema di sincronizzazione automatica non disponibile'
      });
    }
  } catch (error) {
    console.error('❌ [Sync Manual] Errore:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Errore sconosciuto'
    });
  }
});

// Interfaccia per i dati del lead da Google Sheets
interface GoogleSheetLead {
  timestamp: string;
  businessName: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone: string;
  source: string;
  campaign: string;
}

// Endpoint per sincronizzare i lead da Google Sheets
router.post('/sync', authenticateToken, async (req, res) => {
  try {
    const { spreadsheetId: rawSpreadsheetId, range, campaign, apiKey } = req.body;

    // Usa l'API Key dalle variabili d'ambiente se non fornita
    const googleApiKey = apiKey || process.env.GOOGLE_SHEETS_API_KEY;

    if (!rawSpreadsheetId || !range || !googleApiKey) {
      return res.status(400).json({
        error: 'Mancano parametri richiesti: spreadsheetId, range, apiKey'
      });
    }

    // Funzione per estrarre lo Spreadsheet ID dall'URL
    const extractSpreadsheetId = (urlOrId: string): string => {
      console.log(`🔧 [Manual Sync] Estrazione ID da: ${urlOrId}`);

      // Se è già un ID (solo caratteri alfanumerici, underscore e trattini)
      if (/^[a-zA-Z0-9_-]+$/.test(urlOrId)) {
        console.log(`✅ [Manual Sync] È già un ID valido: ${urlOrId}`);
        return urlOrId;
      }

      // Estrai l'ID dall'URL di Google Sheets
      const match = urlOrId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (match && match[1]) {
        console.log(`✅ [Manual Sync] ID estratto dall'URL: ${match[1]}`);
        return match[1];
      }

      console.log(`❌ [Manual Sync] Impossibile estrarre ID da: ${urlOrId}`);
      throw new Error(`Formato Spreadsheet ID non valido: ${urlOrId}`);
    };

    // Estrai l'ID dal parametro fornito
    const spreadsheetId = extractSpreadsheetId(rawSpreadsheetId);

    console.log('🔄 [Google Sheets] Inizio sincronizzazione...');
    console.log('📊 [Google Sheets] Spreadsheet URL/ID originale:', rawSpreadsheetId);
    console.log('📊 [Google Sheets] Spreadsheet ID estratto:', spreadsheetId);
    console.log('📍 [Google Sheets] Range:', range);

    // URL dell'API Google Sheets
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${googleApiKey}`;

    console.log('🌐 [Google Sheets] Chiamata API:', url);

    // Chiamata all'API Google Sheets
    const response = await fetch(url);

    if (!response.ok) {
      console.error('❌ [Google Sheets] Errore API:', response.status, response.statusText);
      return res.status(response.status).json({
        error: `Errore Google Sheets API: ${response.statusText}`
      });
    }

    const data = await response.json();
    console.log('✅ [Google Sheets] Dati ricevuti:', data);

    if (!data.values || data.values.length === 0) {
      console.log('⚠️ [Google Sheets] Nessun dato trovato nel foglio');
      return res.json({ message: 'Nessun dato trovato nel foglio', imported: 0 });
    }

    // Prima riga contiene gli headers
    const headers = data.values[0];
    const rows = data.values.slice(1);

    console.log('📋 [Google Sheets] Headers:', headers);
    // Processa righe

    const columnMap = {
      timestamp: headers.findIndex((h: string) => {
        const lowerH = h.toLowerCase();
        return lowerH.includes('created_time') || lowerH.includes('timestamp') || lowerH.includes('data');
      }),
      businessName: headers.findIndex((h: string) => {
        const lowerH = h.toLowerCase();
        return lowerH.includes('nome_azienda') || lowerH.includes('business') || lowerH.includes('azienda');
      }),
      firstName: headers.findIndex((h: string) => {
        const lowerH = h.toLowerCase();
        return lowerH.includes('nome_e_cognome') || lowerH.includes('first') || lowerH.includes('nome') && !lowerH.includes('azienda');
      }),
      lastName: headers.findIndex((h: string) => {
        const lowerH = h.toLowerCase();
        return lowerH.includes('last') || lowerH.includes('cognome');
      }),
      email: headers.findIndex((h: string) => {
        const lowerH = h.toLowerCase();
        return lowerH.includes('e-mail') || lowerH.includes('email') || lowerH.includes('mail');
      }),
      phone: headers.findIndex((h: string) => {
        const lowerH = h.toLowerCase();
        return lowerH.includes('numero_di_telefono') || lowerH.includes('phone') || lowerH.includes('telefono');
      }),
      source: headers.findIndex((h: string) => {
        const lowerH = h.toLowerCase();
        return lowerH.includes('source') || lowerH.includes('fonte') || lowerH.includes('utm_source');
      }),
      campaign: headers.findIndex((h: string) => {
        const lowerH = h.toLowerCase();
        return lowerH.includes('campaign') || lowerH.includes('campagna') || lowerH.includes('page_slug');
      })
    };

    console.log('🗺️ [Google Sheets] Mappa colonne:', columnMap);

    const storage = req.app.get('storage');
    let importedCount = 0;
    let skippedCount = 0;

    // Processa ogni riga
    for (const row of rows) {
      try {
        // Estrai i dati della riga
        const leadData: GoogleSheetLead = {
          timestamp: row[columnMap.timestamp] || new Date().toISOString(),
          businessName: row[columnMap.businessName] || 'N/A',
          firstName: row[columnMap.firstName] || '',
          lastName: row[columnMap.lastName] || '',
          email: row[columnMap.email] || '',
          phone: row[columnMap.phone] || '',
          source: row[columnMap.source] || 'google-sheets',
          campaign: campaign || row[columnMap.campaign] || 'import'
        };

        // Valida i dati essenziali
        if (!leadData.email && !leadData.phone) {
          console.log('⚠️ [Google Sheets] Riga saltata - mancano email e telefono:', row);
          skippedCount++;
          continue;
        }

        // Costruisci il nome completo
        const fullName = [leadData.firstName, leadData.lastName].filter(Boolean).join(' ');

        // Controlla se il lead esiste già usando query diretta al database
        try {
          const { db } = await import('./db');
          const { marketingLeads } = await import('../shared/schema');
          const { eq } = await import('drizzle-orm');

          const [existingLead] = await db.select()
            .from(marketingLeads)
            .where(eq(marketingLeads.email, leadData.email))
            .limit(1);

          if (existingLead) {
            console.log('⚠️ [Google Sheets] Lead già esistente:', leadData.email);
            skippedCount++;
            continue;
          }
        } catch (dbError) {
          console.error('❌ [Google Sheets] Errore controllo duplicati:', dbError);
          // Continua comunque per non bloccare l'importazione
        }

        // Crea il lead
        const newLead = await storage.createMarketingLead({
          businessName: leadData.businessName,
          name: fullName,
          email: leadData.email,
          phone: leadData.phone,
          source: leadData.source,
          campaign: leadData.campaign
        });

        console.log('✅ [Google Sheets] Lead importato:', newLead.id, leadData.email);
        importedCount++;

      } catch (error) {
        console.error('❌ [Google Sheets] Errore importazione riga:', error, row);
        skippedCount++;
      }
    }

    console.log('🎯 [Google Sheets] Sincronizzazione completata');
    console.log(`📊 [Google Sheets] Risultati: ${importedCount} importati, ${skippedCount} saltati`);

    res.json({
      success: true,
      imported: importedCount,
      skipped: skippedCount,
      total: rows.length,
      message: `Sincronizzazione completata: ${importedCount} lead importati, ${skippedCount} saltati`
    });

  } catch (error) {
    console.error('❌ [Google Sheets] Errore sincronizzazione:', error);
    res.status(500).json({ error: 'Errore durante la sincronizzazione' });
  }
});

// Endpoint per ottenere le configurazioni salvate
router.get('/config', authenticateToken, async (req, res) => {
  try {
    // Ritorna le configurazioni salvate (puoi estendere salvandole nel database)
    res.json({
      success: true,
      configs: [
        {
          id: 1,
          name: 'Facebook Lead Ads',
          spreadsheetId: '1z4C0X16fl4Wd7vqmXa0OERsaAaf6xU39oiLreBTCvt8',
          range: 'Foglio1!A1:Z1000',
          description: 'Sincronizza lead da Facebook tramite Google Sheets'
        }
      ]
    });
  } catch (error) {
    console.error('❌ [Google Sheets] Errore recupero configurazioni:', error);
    res.status(500).json({ error: 'Errore nel recupero delle configurazioni' });
  }
});

// Schema di validazione per le configurazioni
const configSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(), // Optional for new configs, database will generate
  name: z.string().min(1),
  campaignName: z.string().min(1), // Corretto: usa campaignName
  sheetId: z.string().optional().default(''), // Corretto: usa sheetId
  sheetRange: z.string().min(1), // Corretto: usa sheetRange
  isActive: z.boolean().default(true),
  clientId: z.number().optional().nullable(),
  ownerId: z.string().optional(), // Corretto: ownerId è una stringa UUID
  maxLeadsPerSync: z.number().optional(),
  syncIntervalMinutes: z.number().optional(),
  emailTemplate: z.string().optional(),
  tenantId: z.number().optional() // Corretto: usa number invece di string
});

// Endpoint per recuperare tutte le configurazioni
router.get('/configurations', authenticateToken, async (req: AuthRequest, res) => {
  try {
    console.log('🔍 [GET CONFIGS] Start - User:', req.user?.username, 'Tenant:', req.user?.tenantId);
    
    let storage = req.app.get('storage');

    // Se storage non è disponibile, importa DatabaseStorage direttamente
    if (!storage) {
      console.log('📊 [Google Sheets] Storage non trovato in app, importando DatabaseStorage...');
      const { Storage } = await import('../server/storage');
      storage = new Storage();
      req.app.set('storage', storage);
    }

    if (!storage || typeof storage.getGoogleSheetsConfigs !== 'function') {
      throw new Error('Storage o metodo getGoogleSheetsConfigs non disponibile');
    }

    // Recupera tutte le configurazioni
    console.log('🔍 [GET CONFIGS] Fetching all configurations from database...');
    const allConfigurations = await storage.getGoogleSheetsConfigs();
    console.log(`📊 [GET CONFIGS] Total configurations in DB: ${allConfigurations.length}`);
    
    // Filtra per tenantId dell'utente
    const userTenantId = req.user?.tenantId || req.tenant?.id;
    console.log(`🔍 [GET CONFIGS] Filtering by tenant: ${userTenantId}`);
    
    const configurations = allConfigurations.filter((config: any) => config.tenantId === userTenantId);
    
    console.log(`✅ [GET CONFIGS] Configurations for tenant ${userTenantId}: ${configurations.length}`);
    if (configurations.length > 0) {
      configurations.forEach((c: any, i: number) => {
        console.log(`📋 [CONFIG ${i + 1}] ID: ${c.id}, Name: ${c.campaignName}, Sheet: ${c.sheetId?.substring(0, 30)}...`);
      });
    }
    
    res.json({ success: true, configurations });
  } catch (error) {
    console.error('❌ [Google Sheets] Errore recupero configurazioni:', error);
    const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
    res.status(500).json({ success: false, error: 'Errore nel recupero delle configurazioni', details: errorMessage });
  }
});

// Endpoint per salvare una configurazione
router.post('/configurations', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const validatedConfig = configSchema.parse(req.body);
    let storage = req.app.get('storage');

    // Se storage non è disponibile, importa DatabaseStorage direttamente
    if (!storage) {
      console.log('📊 [Google Sheets] Storage non trovato in app, importando DatabaseStorage...');
      const { Storage } = await import('../server/storage');
      storage = new Storage();
    }

    if (!storage || typeof storage.getGoogleSheetsConfigs !== 'function') {
      throw new Error('Storage o metodo getGoogleSheetsConfigs non disponibile');
    }

    let savedConfig;

    // Se l'ID non è presente, crea una nuova configurazione
    if (!validatedConfig.id) {
      // Rimuovi l'ID dall'oggetto per lasciare che il database lo generi
      const { id, ...configWithoutId } = validatedConfig;

      // Get tenant_id from request
      const tenantId = req.user?.tenantId || req.tenant?.id;

      if (!tenantId) {
        console.error('❌ [Google Sheets] Tenant ID mancante');
        return res.status(400).json({ error: 'Tenant ID richiesto' });
      }

      // Aggiungi tenantId e ownerId alla configurazione da salvare
      const configToSave = { ...configWithoutId, tenantId, ownerId: req.user?.id };

      savedConfig = await storage.createGoogleSheetsConfig(configToSave);
      console.log(`✅ [Google Sheets] Nuova configurazione creata: ${validatedConfig.name}`);
    } else {
      // Controlla se esiste già una configurazione con questo ID
      const existingConfigs = await storage.getGoogleSheetsConfigs();
      const existingConfig = existingConfigs.find((c: any) => c.id === validatedConfig.id);

      if (existingConfig) {
        // Aggiorna configurazione esistente
        savedConfig = await storage.updateGoogleSheetsConfig(validatedConfig.id, validatedConfig);
        console.log(`✅ [Google Sheets] Configurazione aggiornata: ${validatedConfig.name}`);
      } else {
        // ID fornito ma non esiste - crea nuova senza ID
        const { id, ...configWithoutId } = validatedConfig;

        // Get tenant_id from request
        const tenantId = req.user?.tenantId || req.tenant?.id;

        if (!tenantId) {
          console.error('❌ [Google Sheets] Tenant ID mancante');
          return res.status(400).json({ error: 'Tenant ID richiesto' });
        }

        // Aggiungi tenantId e ownerId alla configurazione da salvare
        const configToSave = { ...configWithoutId, tenantId, ownerId: req.user?.id };

        savedConfig = await storage.createGoogleSheetsConfig(configToSave);
        console.log(`✅ [Google Sheets] Nuova configurazione creata: ${validatedConfig.name}`);
      }
    }

    // Aggiorna le configurazioni nel sistema di sincronizzazione automatica
    if (global.googleSheetsAutoSync) {
      const allConfigs = await storage.getActiveGoogleSheetsConfigs();
      (global.googleSheetsAutoSync as any).updateConfigurations(allConfigs);
      console.log(`🔄 [Google Sheets] Sistema di sincronizzazione aggiornato con ${allConfigs.length} configurazioni`);
    }

    res.json({ success: true, configuration: savedConfig });
  } catch (error) {
    console.error('❌ [Google Sheets] Errore salvataggio configurazione:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Dati configurazione non validi', details: error.errors });
    } else {
      res.status(500).json({ error: 'Errore nel salvataggio della configurazione' });
    }
  }
});

// Endpoint per eliminare una configurazione
router.delete('/configurations/:id', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    let storage = req.app.get('storage');

    // Se storage non è disponibile, importa DatabaseStorage direttamente
    if (!storage) {
      console.log('📊 [Google Sheets] Storage non trovato in app, importando DatabaseStorage...');
      const { Storage } = await import('../server/storage');
      storage = new Storage();
    }

    if (!storage || typeof storage.deleteGoogleSheetsConfig !== 'function') {
      throw new Error('Storage o metodo deleteGoogleSheetsConfig non disponibile');
    }

    // Prima controlla se la campagna ha lead associati
    const config = await storage.getGoogleSheetsConfig(id);
    if (!config) {
      return res.status(404).json({ error: 'Configurazione non trovata' });
    }

    // Controlla se ci sono lead associati a questa campagna
    const hasLeads = await storage.checkCampaignHasLeads(config.campaignName);
    if (hasLeads) {
      return res.status(409).json({
        error: 'Impossibile eliminare campagna con lead associati',
        hasLeads: true,
        message: 'Questa campagna ha lead associati e non può essere eliminata. Puoi solo archiviarla.'
      });
    }

    const deleted = await storage.deleteGoogleSheetsConfig(id);
    if (deleted) {
      // Aggiorna il sistema di sincronizzazione
      if (global.googleSheetsAutoSync) {
        const allConfigs = await storage.getActiveGoogleSheetsConfigs();
        (global.googleSheetsAutoSync as any).updateConfigurations(allConfigs);
        console.log(`🗑️ [Google Sheets] Configurazione eliminata e sistema aggiornato`);
      }
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Configurazione non trovata' });
    }
  } catch (error) {
    console.error('❌ [Google Sheets] Errore eliminazione configurazione:', error);
    res.status(500).json({ error: 'Errore nell\'eliminazione della configurazione' });
  }
});

// Endpoint per archiviare una configurazione
router.patch('/configurations/:id/archive', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    let storage = req.app.get('storage');

    // Se storage non è disponibile, importa DatabaseStorage direttamente
    if (!storage) {
      console.log('📊 [Google Sheets] Storage non trovato in app, importando DatabaseStorage...');
      const { Storage } = await import('../server/storage');
      storage = new Storage();
    }

    if (!storage || typeof storage.archiveGoogleSheetsConfig !== 'function') {
      throw new Error('Storage o metodo archiveGoogleSheetsConfig non disponibile');
    }

    const archivedConfig = await storage.archiveGoogleSheetsConfig(id);
    if (archivedConfig) {
      // Aggiorna il sistema di sincronizzazione per rimuovere la configurazione archiviata
      if (global.googleSheetsAutoSync) {
        const allConfigs = await storage.getActiveGoogleSheetsConfigs();
        (global.googleSheetsAutoSync as any).updateConfigurations(allConfigs);
        console.log(`📦 [Google Sheets] Configurazione archiviata e sistema aggiornato`);
      }
      res.json({ success: true, archived: true });
    } else {
      res.status(404).json({ error: 'Configurazione non trovata' });
    }
  } catch (error) {
    console.error('❌ [Google Sheets] Errore archiviazione configurazione:', error);
    res.status(500).json({ error: 'Errore nell\'archiviazione della configurazione' });
  }
});

// Endpoint per ripristinare una configurazione dall'archivio
router.patch('/configurations/:id/dearchive', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    let storage = req.app.get('storage');

    // Se storage non è disponibile, importa DatabaseStorage direttamente
    if (!storage) {
      console.log('📊 [Google Sheets] Storage non trovato in app, importando DatabaseStorage...');
      const { Storage } = await import('../server/storage');
      storage = new Storage();
    }

    if (!storage || typeof storage.dearchiveGoogleSheetsConfig !== 'function') {
      throw new Error('Storage o metodo dearchiveGoogleSheetsConfig non disponibile');
    }

    const dearchivedConfig = await storage.dearchiveGoogleSheetsConfig(id);
    if (dearchivedConfig) {
      // Aggiorna il sistema di sincronizzazione per includere nuovamente la configurazione
      if (global.googleSheetsAutoSync) {
        const allConfigs = await storage.getActiveGoogleSheetsConfigs();
        (global.googleSheetsAutoSync as any).updateConfigurations(allConfigs);
        console.log(`📦 [Google Sheets] Configurazione ripristinata dall\'archivio e sistema aggiornato`);
      }
      res.json({ success: true, archived: false });
    } else {
      res.status(404).json({ error: 'Configurazione non trovata' });
    }
  } catch (error) {
    console.error('❌ [Google Sheets] Errore ripristino configurazione:', error);
    res.status(500).json({ error: 'Errore nel ripristino della configurazione' });
  }
});

// Endpoint per controllare lo stato della sincronizzazione automatica
router.get('/status', authenticateToken, async (req, res) => {
  try {
    if (global.googleSheetsAutoSync) {
      const status = (global.googleSheetsAutoSync as any).getStatus();
      const lastSyncResults = (global.googleSheetsAutoSync as any).getLastSyncResults();

      console.log('📊 [Google Sheets] Status recuperato:', status);
      console.log('📊 [Google Sheets] LastSyncResults:', lastSyncResults);

      res.json({
        success: true,
        status: {
          ...status,
          message: status.isRunning ? 'Sincronizzazione automatica attiva ogni 10 secondi' : 'Sincronizzazione automatica non attiva'
        },
        lastSyncResults
      });
    } else {
      console.log('❌ [Google Sheets] Global sync object non disponibile');
      res.json({
        success: true,
        status: {
          isRunning: false,
          lastSync: null,
          nextSync: null,
          intervalSeconds: 10,
          message: 'Sistema di sincronizzazione non disponibile'
        },
        lastSyncResults: null
      });
    }
  } catch (error) {
    console.error('❌ [Google Sheets] Errore recupero stato:', error);
    res.status(500).json({ error: 'Errore nel recupero dello stato' });
  }
});

// Endpoint per ottenere i risultati dettagliati dell'ultima sincronizzazione
router.get('/sync-results', authenticateToken, async (req, res) => {
  try {
    if (global.googleSheetsAutoSync) {
      const lastSyncResults = (global.googleSheetsAutoSync as any).getLastSyncResults();
      res.json({
        success: true,
        results: lastSyncResults
      });
    } else {
      res.json({
        success: false,
        message: 'Sistema di sincronizzazione automatica non disponibile'
      });
    }
  } catch (error) {
    console.error('❌ [Google Sheets] Errore recupero risultati sincronizzazione:', error);
    res.status(500).json({ error: 'Errore nel recupero dei risultati' });
  }
});

// PUT /api/google-sheets/:id - Update configuration
router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Utente non autenticato' });
    }

    const configId = parseInt(req.params.id);
    const updates = req.body;

    console.log(`🔧 [Google Sheets] Aggiornamento configurazione ${configId}:`, updates);

    // Ottieni storage dall'app
    let storage = req.app.get('storage');
    if (!storage) {
      console.log('📊 [Google Sheets] Storage non trovato in app, importando DatabaseStorage...');
      const { Storage } = await import('../server/storage');
      storage = new Storage();
      req.app.set('storage', storage); // Salva per future richieste
    }

    // Verifica che i metodi necessari esistano
    if (typeof storage.getGoogleSheetsConfig !== 'function') {
      console.error('❌ [Google Sheets] Metodo getGoogleSheetsConfig non disponibile');
      return res.status(500).json({ error: 'Metodo getGoogleSheetsConfig non disponibile nello storage' });
    }

    // Verifica che la configurazione esista
    const existingConfig = await storage.getGoogleSheetsConfig(configId);
    if (!existingConfig) {
      return res.status(404).json({ error: 'Configurazione non trovata' });
    }

    // Usa direttamente userId come stringa (UUID)
    const userIdStr = userId;

    // Se la configurazione non ha un ownerId (configurazioni esistenti), assegnalo all'utente corrente
    if (!existingConfig.ownerId) {
      console.log(`🔧 [Google Sheets] Assegnazione ownership a configurazione ${configId} per utente ${userIdStr}`);
      const updated = await storage.updateGoogleSheetsConfig(configId, { ownerId: userIdStr });
      // Aggiorna existingConfig con il nuovo owner
      if (updated) {
        existingConfig.ownerId = userIdStr;
      }
    }

    // Verifica tenant e ownership
    const userTenantId = req.user?.tenantId || req.tenant?.id;
    console.log(`🔍 [Google Sheets] Verifica accesso: config.tenantId=${existingConfig.tenantId}, userTenantId=${userTenantId}, config.ownerId=${existingConfig.ownerId}, userId=${userIdStr}`);
    
    // Prima verifica che la configurazione appartenga al tenant dell'utente
    if (existingConfig.tenantId !== userTenantId) {
      return res.status(403).json({ error: 'Accesso negato: questa configurazione appartiene a un altro tenant' });
    }
    
    // Poi verifica ownership (ora dovrebbe essere sempre impostato)
    if (existingConfig.ownerId !== userIdStr) {
      return res.status(403).json({ error: 'Accesso negato: questa configurazione non ti appartiene' });
    }

    console.log(`✅ [Google Sheets] Ownership verificato: user ${userIdStr} può modificare config ${configId}`);

    // Se stiamo aggiornando il clientId, verifichiamo che il cliente appartenga all'utente
    if (updates.clientId && updates.clientId !== null) {
      if (typeof storage.getClient !== 'function') {
        console.error('❌ [Google Sheets] Metodo getClient non disponibile');
        return res.status(500).json({ error: 'Metodo getClient non disponibile nello storage' });
      }

      const client = await storage.getClient(updates.clientId);
      if (!client) {
        return res.status(404).json({ error: 'Cliente non trovato' });
      }
      if (client.ownerId !== userIdStr) {
        return res.status(403).json({ error: 'Cliente non trovato o accesso negato' });
      }
      console.log(`✅ [Google Sheets] Cliente ${client.name} verificato per assegnazione`);
    }

    // Verifica che il metodo di update esista
    if (typeof storage.updateGoogleSheetsConfig !== 'function') {
      console.error('❌ [Google Sheets] Metodo updateGoogleSheetsConfig non disponibile');
      return res.status(500).json({ error: 'Metodo updateGoogleSheetsConfig non disponibile nello storage' });
    }

    // Aggiorna la configurazione
    const updatedConfig = await storage.updateGoogleSheetsConfig(configId, updates);
    if (!updatedConfig) {
      return res.status(500).json({ error: 'Errore durante l\'aggiornamento della configurazione' });
    }

    // Aggiorna il sistema di sincronizzazione se disponibile
    if (global.googleSheetsAutoSync) {
      try {
        const allConfigs = await storage.getGoogleSheetsConfigs();
        (global.googleSheetsAutoSync as any).updateConfigurations(allConfigs);
        console.log(`🔄 [Google Sheets] Sistema di sincronizzazione aggiornato`);
      } catch (syncError) {
        console.error('⚠️ [Google Sheets] Errore aggiornamento sistema sincronizzazione:', syncError);
      }
    }

    console.log('✅ [Google Sheets] Configurazione aggiornata:', updatedConfig);
    res.json({ success: true, config: updatedConfig });
  } catch (error) {
    console.error('❌ [Google Sheets] Errore aggiornamento configurazione:', error);
    const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
    res.status(500).json({
      success: false,
      error: 'Errore nel salvataggio della configurazione',
      details: errorMessage
    });
  }
});

export default router;