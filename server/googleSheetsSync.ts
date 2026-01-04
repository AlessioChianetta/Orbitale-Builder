/**
 * Sistema di sincronizzazione automatica Google Sheets
 * Importa lead ogni 10 secondi in background
 */

import { IStorage } from './storage';

interface GoogleSheetConfig {
  id: string;
  name: string;
  spreadsheetId: string;
  range: string;
  campaign: string;
  isActive: boolean;
  ownerId: string;
  emailTemplate?: string; // Aggiunto campo per il template email
}

interface SyncStatus {
  isRunning: boolean;
  lastSync: Date | null;
  syncInterval: number; // in milliseconds
  configurations: GoogleSheetConfig[];
}

// Funzione helper per processare i campi del questionario
function processQuestionField(header: string, value: string): { key: string, value: string } | null {
  if (!header || !value || value.trim() === '') return null;

  // Normalizza il nome del campo
  let fieldName = header
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');

  // Mappa campi comuni per maggiore chiarezza
  const fieldMappings: Record<string, string> = {
    // Mapping specifici per tipo di locale
    'che_tipo_di_locale_gestisci': 'tipo_locale',
    'che_tipo_di_locale_gestisci_': 'tipo_locale',
    'tipo_di_locale': 'tipo_locale',
    'tipo_locale_gestisci': 'tipo_locale',

    // Mapping per situazione professionale
    'qual_la_tua_situazione_professionale_attuale': 'situazione_professionale',
    'qual_è_la_tua_situazione_professionale_attuale': 'situazione_professionale',
    'situazione_professionale': 'situazione_professionale',

    // Mapping per obiettivi/risultati
    'che_risultato_vorresti_ottenere': 'obiettivo',
    'cosa_vorresti_ottenere': 'obiettivo',
    'risultato_desiderato': 'obiettivo',
    'obiettivo_principale': 'obiettivo',

    // Mapping per miglioramenti
    'cosa_ti_piacerebbe_migliorare_nel_tuo_locale': 'cosa_migliorare',
    'cosa_vorresti_migliorare_nel_tuo_locale': 'cosa_migliorare',
    'cosa_migliorare': 'cosa_migliorare',
    'miglioramenti_desiderati': 'cosa_migliorare',

    // Mapping per ruolo (spesso confuso)
    'ruolo_nel_locale': 'ruolo',
    'che_ruolo_hai': 'ruolo',
    'il_tuo_ruolo': 'ruolo'
  };

  const finalFieldName = fieldMappings[fieldName] || fieldName;

  return {
    key: finalFieldName,
    value: value.trim()
  };
}

export class GoogleSheetsAutoSync {
  private storage: IStorage;
  private status: SyncStatus;
  private intervalId: NodeJS.Timeout | null = null;
  private apiKey: string;
  private configurations: GoogleSheetConfig[] = [];
  private lastSyncResults: any = null;
  // Rimossa cache temporanea - ora usiamo il database per tracking persistente

  // Funzione per estrarre lo Spreadsheet ID dall'URL
  private extractSpreadsheetId(urlOrId: string): string {
    // Se è già un ID (solo caratteri alfanumerici, underscore e trattini)
    if (/^[a-zA-Z0-9_-]+$/.test(urlOrId)) {
      return urlOrId;
    }

    // Estrai l'ID dall'URL di Google Sheets
    const match = urlOrId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      return match[1];
    }

    throw new Error(`Formato Spreadsheet ID non valido: ${urlOrId}`);
  }

  constructor(storage: IStorage) {
    this.storage = storage;
    this.status = {
      isRunning: false,
      lastSync: null,
      syncInterval: 120000, // 2 minuti invece di 30 secondi per evitare blocchi
      configurations: []
    };
    this.apiKey = ''; // Verrà recuperato dall'utente owner della configurazione
  }

  // Funzione per inviare notifica email per nuovo lead - TEMPORANEAMENTE DISABILITATA
  private async sendNewLeadNotification(leadData: any): Promise<boolean> {
    console.log('📧 [Lead Notification] Email temporaneamente disabilitata per:', leadData.email);
    return false;
  }

  // Carica le configurazioni dal database
  private async loadConfigurations(): Promise<GoogleSheetConfig[]> {
    try {
      console.log('📋 [LoadConfigs] Caricamento configurazioni dal database...');
      const configs = await this.storage.getActiveGoogleSheetsConfigs();
      console.log(`📋 [LoadConfigs] Trovate ${configs.length} configurazioni totali`);
      
      // Mappa i dati dal database al formato atteso (sheetId -> spreadsheetId)
      this.configurations = configs.filter(c => c.isActive).map(config => ({
        ...config,
        spreadsheetId: config.sheetId || config.spreadsheetId,
        range: config.sheetRange || config.range,
        name: config.campaignName || config.name
      }));
      
      console.log(`📋 [LoadConfigs] ${this.configurations.length} configurazioni attive`);
      
      this.status.configurations = this.configurations;

      if (this.configurations.length > 0) {
        this.configurations.forEach((config, idx) => {
          console.log(`📋 [Config ${idx + 1}] ID: ${config.id}, Nome: ${config.name}, Sheet: ${config.spreadsheetId?.substring(0, 50)}...`);
        });
      }

      return this.configurations;
    } catch (error) {
      console.error('❌ [AutoSync] Errore caricamento configurazioni:', error);
      // Fallback alle configurazioni hardcoded se il database non è disponibile
      this.configurations = [
        {
          id: 'default',
          name: 'Facebook Lead Ads - MovieTurbo',
          spreadsheetId: '1z4C0X16fl4Wd7vqmXa0OERsaAaf6xU39oiLreBTCvt8',
          range: 'Foglio1!A1:Z1000',
          campaign: 'facebook-movieturbo',
          isActive: true,
          emailTemplate: 'movieturbo'
        }
      ];
      this.status.configurations = this.configurations;
      return this.configurations;
    }
  }

  // Metodo per aggiornare le configurazioni (chiamato dalle route API)
  public async updateConfigurations(newConfigurations?: GoogleSheetConfig[]) {
    if (newConfigurations) {
      this.configurations = newConfigurations.filter(c => c.isActive);
      this.status.configurations = this.configurations;
    } else {
      await this.loadConfigurations();
    }
  }

  /**
   * Avvia la sincronizzazione automatica
   */
  start(): void {
    if (this.status.isRunning) {
      return;
    }

    if (!this.apiKey) {
      return;
    }

    this.status.isRunning = true;

    // Esegui la prima sincronizzazione immediatamente
    this.syncNow();

    // Programma le sincronizzazioni successive
    this.intervalId = setInterval(() => {
      this.syncNow();
    }, this.status.syncInterval);
  }

  /**
   * Ferma la sincronizzazione automatica
   */
  stop(): void {
    if (!this.status.isRunning) {
      return;
    }

    this.status.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Esegue una sincronizzazione immediata (pubblica per chiamate manuali)
   */
  public async syncNow(): Promise<void> {
    try {
      // Caricamento configurazioni
      // Ricarica le configurazioni dal database ad ogni sync
      await this.loadConfigurations();

      // Sincronizza tutte le configurazioni attive
      const activeConfigs = this.configurations.filter(config => config.isActive);

      if (activeConfigs.length === 0) {
        this.status.lastSync = new Date();
        return;
      }
      let totalImported = 0;
      let totalSkipped = 0;
      let syncResults: any[] = [];

      // Processa ogni configurazione attiva
      for (const config of activeConfigs) {
        try {
          console.log(`\n🔄 [Sync] ===== Processando config: ${config.name || config.id} =====`);
          console.log(`🔄 [Sync] Owner ID: ${config.ownerId}`);
          console.log(`🔄 [Sync] Spreadsheet ID/URL: ${config.spreadsheetId}`);
          console.log(`🔄 [Sync] Range: ${config.range}`);
          
          // Recupera l'API Key dell'utente owner della configurazione
          const { db } = await import('./db');
          const { users } = await import('../shared/schema');
          const { eq } = await import('drizzle-orm');

          const [owner] = await db.select()
            .from(users)
            .where(eq(users.id, config.ownerId))
            .limit(1);

          console.log(`🔄 [Sync] Owner trovato: ${owner ? 'SI' : 'NO'}`);
          console.log(`🔄 [Sync] API Key presente: ${owner?.googleSheetsApiKey ? 'SI (lunghezza: ' + owner.googleSheetsApiKey.length + ')' : 'NO'}`);

          if (!owner || !owner.googleSheetsApiKey) {
            console.log(`⚠️ [AutoSync] Config ${config.name}: Owner non trovato o API Key mancante`);
            continue;
          }

          const userApiKey = owner.googleSheetsApiKey;

          // Estrai l'ID del spreadsheet dall'URL
          console.log(`🔄 [Sync] Tentativo estrazione ID da: ${config.spreadsheetId}`);
          
          let spreadsheetId: string;
          
          // Prova a estrarre l'ID dall'URL
          const spreadsheetIdMatch = config.spreadsheetId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
          
          if (spreadsheetIdMatch && spreadsheetIdMatch[1]) {
            spreadsheetId = spreadsheetIdMatch[1];
            console.log(`✅ [Sync] Spreadsheet ID estratto da URL: ${spreadsheetId}`);
          } else if (/^[a-zA-Z0-9_-]+$/.test(config.spreadsheetId)) {
            // Se è già un ID valido
            spreadsheetId = config.spreadsheetId;
            console.log(`✅ [Sync] Usando ID diretto: ${spreadsheetId}`);
          } else {
            console.log(`❌ [Sync] Formato Spreadsheet ID non valido: ${config.spreadsheetId}`);
            continue;
          }
          
          const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${config.range}?key=${userApiKey}`;
          console.log(`🔄 [Sync] URL chiamata: ${url.replace(userApiKey, 'API_KEY_HIDDEN')}`);

          const response = await fetch(url);
          console.log(`🔄 [Sync] Response status: ${response.status}`);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.log(`❌ [Sync] Errore API: ${errorText}`);
            continue;
          }

          const data = await response.json();
          const totalRows = data.values?.length || 0;

          console.log(`📊 [Google Sheet Data] Config: ${config.name}`);
          console.log(`📊 [Google Sheet Data] Righe totali trovate: ${totalRows}`);

          if (!data.values || data.values.length < 2) {
            console.log(`⚠️ [Google Sheet Data] Nessun dato o solo header presente`);
            continue;
          }

          const [headers, ...rows] = data.values;

          console.log(`📋 [Google Sheet Columns] Colonne trovate (${headers.length}):`);
          headers.forEach((header: string, index: number) => {
            console.log(`   ${index}: "${header}"`);
          });

          console.log(`📋 [Google Sheet Rows] Righe dati trovate: ${rows.length}`);
          if (rows.length > 0) {
            console.log(`📋 [Google Sheet Sample] Prima riga di esempio:`, rows[0]);
            if (rows.length > 1) {
              console.log(`📋 [Google Sheet Sample] Seconda riga di esempio:`, rows[1]);
            }
          }

          // Mappa le colonne - supporta entrambi i formati Facebook
          const columnMap = {
            id: headers.findIndex((h: string) => h.toLowerCase().includes('id') && !h.toLowerCase().includes('email')),
            timestamp: headers.findIndex((h: string) => h.toLowerCase().includes('created_time') || h.toLowerCase().includes('timestamp')),
            businessName: headers.findIndex((h: string) => h.toLowerCase().includes('nome_azienda') || h.toLowerCase().includes('company')),
            firstName: headers.findIndex((h: string) => h.toLowerCase().includes('nome_e_cognome') || h.toLowerCase().includes('full_name')),
            email: headers.findIndex((h: string) => h.toLowerCase().includes('e-mail') || h.toLowerCase().includes('email')),
            phone: headers.findIndex((h: string) => h.toLowerCase().includes('numero_di_telefono') || h.toLowerCase().includes('phone')),
            source: headers.findIndex((h: string) => h.toLowerCase().includes('source')),
            campaign: headers.findIndex((h: string) => h.toLowerCase().includes('campaign'))
          };

          console.log(`🗺️ [Column Mapping] Mappa colonne identificate:`, columnMap);

          const hasEmail = columnMap.email >= 0;
          const hasPhone = columnMap.phone >= 0;

          // Filtra righe valide prima di processarle
          const validRows = rows.filter(row => {
            const leadEmail = row[columnMap.email]?.trim() || '';
            const leadPhone = row[columnMap.phone]?.replace('p:', '').trim() || '';
            return leadEmail || leadPhone;
          });

          let importedCount = 0;
          let skippedCount = 0;

          // Processa tutti i lead disponibili
          console.log(`🚀 [Fresh Start] Configurazione ${config.name} - Processando ${validRows.length} righe (totale disponibili: ${validRows.length})`);

          const rowsToProcess = validRows; // Processa tutti i lead senza limite

          for (const row of rowsToProcess) {
            let leadStatus = 'skipped'; // Stato di default
            let leadId = '';
            let leadEmail = '';
            let leadPhone = '';
            let leadBusinessName = '';
            let leadFirstName = '';

            try {
              leadId = row[columnMap.id]?.replace('l:', '').trim() || '';
              leadEmail = row[columnMap.email]?.trim() || '';
              leadPhone = row[columnMap.phone]?.replace('p:', '').trim() || '';
              leadBusinessName = row[columnMap.businessName]?.trim() || '';
              leadFirstName = row[columnMap.firstName]?.trim() || '';

              if (!leadEmail && !leadPhone) {
                skippedCount++;
                leadStatus = 'skipped - no email or phone';
                syncResults.push({
                  configName: config.name,
                  email: leadEmail,
                  phone: leadPhone,
                  businessName: leadBusinessName,
                  firstName: leadFirstName,
                  status: leadStatus
                });
                continue;
              }

              // 🔍 NUOVO SISTEMA TRACKING COMPLETO - TRACCIA SEMPRE TUTTO
          try {
            // Importa le dipendenze necessarie
            const { db } = await import('./db');
            const { marketingLeads } = await import('../shared/schema');
            const { eq, and, count, desc } = await import('drizzle-orm');

            // Estrai e pulisci i dati
            const source = row[columnMap.source]?.trim() || 'google-sheets';
            const campaign = config.campaign || row[columnMap.campaign]?.trim() || 'facebook-leads';

            // Conta quante volte questa email si è già iscritta a questa campagna
            const [duplicateCount] = await db.select({ count: count() })
              .from(marketingLeads)
              .where(and(
                eq(marketingLeads.email, leadEmail),
                eq(marketingLeads.campaign, campaign)
              ));

            const existingCount = duplicateCount?.count || 0;
            console.log(`📊 [Lead Tracking] Email ${leadEmail} - Campagna ${campaign} - Iscrizioni esistenti: ${existingCount}`);

            // Estrai le risposte del questionario dalle colonne - SISTEMA MIGLIORATO
            const additionalData: Record<string, string> = {};

            // Trova gli indici delle colonne di riferimento
            const platformIndex = headers.findIndex(h => h && h.toLowerCase().includes('platform'));
            const fullNameIndex = headers.findIndex(h => h && (
              h.toLowerCase().includes('full_name') ||
              h.toLowerCase().includes('nome_completo') ||
              h.toLowerCase() === 'name'
            ));

            console.log(`📊 [Dynamic Fields] Platform index: ${platformIndex}, Full name index: ${fullNameIndex}`);

            // STRATEGIA 1: Se troviamo entrambe le colonne di riferimento, estrai tra di loro
            let fieldsExtracted = false;
            if (platformIndex !== -1 && fullNameIndex !== -1 && platformIndex < fullNameIndex) {
              for (let i = platformIndex + 1; i < fullNameIndex; i++) {
                const header = headers[i];
                const value = row[i]?.trim();

                if (header && value && header !== '') {
                  const processedField = processQuestionField(header, value);
                  if (processedField) {
                    additionalData[processedField.key] = processedField.value;
                    console.log(`📝 [Dynamic Fields Strategy 1] Campo rilevato: "${header}" -> ${processedField.key} = "${processedField.value}"`);
                    fieldsExtracted = true;
                  }
                }
              }
            }

            // STRATEGIA 2: Se la strategia 1 non ha funzionato, cerca tutte le colonne che sembrano domande
            if (!fieldsExtracted) {
              console.log(`🔄 [Dynamic Fields] Strategia 1 fallita, uso strategia 2: ricerca generale di domande`);

              headers.forEach((header, index) => {
                if (header && index < row.length) {
                  const value = row[index]?.trim();

                  // Salta le colonne base conosciute
                  const isBaseColumn = ['platform', 'full_name', 'nome_completo', 'name', 'email', 'e-mail',
                                       'phone_number', 'numero_di_telefono', 'phone', 'id', 'created_time',
                                       'timestamp', 'source', 'campaign', 'page_slug'].some(baseCol =>
                    header.toLowerCase().includes(baseCol.toLowerCase())
                  );

                  if (!isBaseColumn && value && header !== '') {
                    const processedField = processQuestionField(header, value);
                    if (processedField) {
                      additionalData[processedField.key] = processedField.value;
                      console.log(`📝 [Dynamic Fields Strategy 2] Campo rilevato: "${header}" -> ${processedField.key} = "${processedField.value}"`);
                      fieldsExtracted = true;
                    }
                  }
                }
              });
            }

            // STRATEGIA 3: Fallback al sistema legacy se necessario
            if (!fieldsExtracted) {
              console.log(`⚠️ [Dynamic Fields] Entrambe le strategie fallite, uso fallback legacy`);
              Object.keys(columnMap).forEach(key => {
                if (!['email', 'businessName', 'firstName', 'phone', 'id', 'source', 'campaign', 'timestamp'].includes(key)) {
                  const value = row[columnMap[key]]?.trim();
                  if (value) {
                    const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '_');
                    additionalData[normalizedKey] = value;
                  }
                }
              });
            }

            console.log(`📋 [Dynamic Fields] Campi estratti totali: ${Object.keys(additionalData).length}`, additionalData);

            // Verifica se questo ID specifico è già stato processato
            let isExactDuplicate = false;
            if (leadId) {
              console.log(`🔍 [ID Check] Controllo duplicato per ID Facebook: ${leadId} - Email: ${leadEmail}`);

              const existingRowsById = await db.select()
                .from(marketingLeads)
                .where(and(
                  eq(marketingLeads.email, leadEmail),
                  eq(marketingLeads.campaign, campaign)
                ))
                .orderBy(desc(marketingLeads.createdAt))
                .limit(20);

              console.log(`🔍 [ID Check] Trovati ${existingRowsById.length} lead esistenti per ${leadEmail} in campagna ${campaign}`);

              // Controlla se esiste già un lead con lo stesso ID Facebook
              for (const existingRow of existingRowsById) {
                const additionalDataStr = existingRow.additionalData;
                console.log(`🔍 [ID Check] Controllo row ID ${existingRow.id}, additionalData type: ${typeof additionalDataStr}`);

                if (typeof additionalDataStr === 'string') {
                  try {
                    const existingAdditionalData = JSON.parse(additionalDataStr);
                    const existingFacebookId = existingAdditionalData.facebookId;
                    console.log(`🔍 [ID Check] Existing Facebook ID: "${existingFacebookId}" vs New: "${leadId}"`);

                    if (existingFacebookId && existingFacebookId === leadId) {
                      isExactDuplicate = true;
                      console.log(`⏭️ [Exact Duplicate] Lead con ID Facebook ${leadId} già presente per ${leadEmail} (Row ID: ${existingRow.id}) - SKIP COMPLETO`);
                      break;
                    }
                  } catch (e) {
                    console.log(`⚠️ [ID Check] Errore parsing JSON per row ${existingRow.id}:`, e.message);
                  }
                } else if (additionalDataStr && typeof additionalDataStr === 'object') {
                  // Se è già un oggetto
                  const existingFacebookId = additionalDataStr.facebookId;
                  console.log(`🔍 [ID Check] Existing Facebook ID (object): "${existingFacebookId}" vs New: "${leadId}"`);

                  if (existingFacebookId && existingFacebookId === leadId) {
                    isExactDuplicate = true;
                    console.log(`⏭️ [Exact Duplicate] Lead con ID Facebook ${leadId} già presente per ${leadEmail} (Row ID: ${existingRow.id}) - SKIP COMPLETO`);
                    break;
                  }
                }
              }

              if (!isExactDuplicate) {
                console.log(`✅ [ID Check] ID Facebook ${leadId} NON trovato nei duplicati - Procedo con l'importazione`);
              }
            }

            // SE È DUPLICATO ESATTO (stesso ID Facebook), SKIP COMPLETAMENTE
            if (isExactDuplicate) {
              skippedCount++;
              leadStatus = `skipped - exact duplicate (id: ${leadId})`;
              console.log(`⏭️ [Complete Skip] Lead con ID Facebook ${leadId} già processato per ${leadEmail} - SKIP TOTALE`);

              // Aggiungi ai risultati ma NON fare nient'altro
              syncResults.push({
                configName: config.name,
                email: leadEmail,
                phone: leadPhone,
                businessName: leadBusinessName,
                firstName: leadFirstName,
                status: leadStatus
              });

              continue; // Salta completamente al prossimo lead
            }

            // PROCEDI SOLO SE NON È UN DUPLICATO ESATTO
            console.log(`✨ [Fresh Start] Processando nuova riga per ${leadEmail} con ID Facebook ${leadId}`);

            // SISTEMA RIPARTITO DA CAPO - Il controllo per ID Facebook previene duplicati esatti
            const timestamp = row[columnMap.timestamp] || new Date().toISOString();

            // Prepara i dati per il lead nel formato corretto
            const leadName = leadFirstName ? leadFirstName.trim() : 'Lead senza nome';
            const leadCompany = leadBusinessName ? leadBusinessName.trim() : undefined;
            
            // Prepara il messaggio con i dati aggiuntivi
            const additionalDataMessage = Object.keys(additionalData).length > 0 
              ? JSON.stringify({
                  ...additionalData,
                  facebookId: leadId,
                  googleSheetTimestamp: timestamp,
                  campaign: campaign
                }, null, 2)
              : JSON.stringify({
                  facebookId: leadId,
                  googleSheetTimestamp: timestamp,
                  campaign: campaign
                }, null, 2);

            const leadData = {
              name: leadName,
              email: leadEmail || '',
              phone: leadPhone || '',
              company: leadCompany,
              message: additionalDataMessage,
              source: source || 'google-sheets',
              status: 'new',
              tenantId: owner.tenantId,
              createdAt: new Date(),
              updatedAt: new Date()
            };

            // Crea il nuovo lead nel database
            const newLead = await this.storage.createLead(leadData);
            importedCount++;

            if (existingCount > 0) {
              leadStatus = `imported - duplicate #${existingCount + 1}`;
              console.log(`🔄 [Lead Tracking] NUOVO DUPLICATO: ${leadEmail} si è iscritto alla campagna ${campaign} per la ${existingCount + 1}ª volta (nuova riga)`);
            } else {
              leadStatus = 'imported - new';
              console.log(`✨ [Lead Tracking] PRIMO LEAD: ${leadEmail} prima iscrizione alla campagna ${campaign}`);
            }

            // INVIA NOTIFICA EMAIL PER OGNI NUOVO LEAD IMPORTATO
            try {
              console.log(`📧 [CRM Notification] Invio notifica a chianettaalessio@gmail.com per nuovo lead: ${leadEmail}`);
              const notificationSent = await this.sendNewLeadNotification(leadData);
              if (notificationSent) {
                console.log(`✅ [CRM Notification] Notifica inviata con successo per ${leadEmail}`);
              } else {
                console.log(`❌ [CRM Notification] Errore invio notifica per ${leadEmail}`);
              }
            } catch (notificationError) {
              console.error(`❌ [CRM Notification] Errore nell'invio notifica per ${leadEmail}:`, notificationError);
            }

            // 🤖 INVIA NOTIFICA TELEGRAM PER OGNI NUOVO LEAD IMPORTATO
            try {
              // Verifica se l'utente ha configurato Telegram
              if (owner?.telegramBotToken && owner?.telegramChatId) {
                console.log(`🤖 [Telegram] Invio notifica Telegram per nuovo lead: ${leadEmail}`);
                
                const telegramMessage = `🚨 NUOVO LEAD GOOGLE SHEETS!\n\n` +
                  `👤 Nome: ${leadFirstName || 'N/A'}\n` +
                  `📧 Email: ${leadEmail}\n` +
                  `📱 Telefono: ${leadPhone || 'Non fornito'}\n` +
                  `🎯 Campagna: ${campaign}\n` +
                  `📊 Fonte: Google Sheets (${config.name})\n` +
                  `🔢 ID Facebook: ${leadId || 'N/A'}\n` +
                  `🕐 Data: ${new Date().toLocaleString('it-IT')}`;

                const telegramUrl = `https://api.telegram.org/bot${owner.telegramBotToken}/sendMessage`;
                
                const telegramResponse = await fetch(telegramUrl, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    chat_id: owner.telegramChatId,
                    text: telegramMessage
                  })
                });

                if (telegramResponse.ok) {
                  console.log(`✅ [Telegram] Notifica inviata con successo per ${leadEmail}`);
                } else {
                  const errorData = await telegramResponse.text();
                  console.error(`❌ [Telegram] Errore invio notifica per ${leadEmail}:`, errorData);
                }
              } else {
                console.log(`⚠️ [Telegram] Notifiche Telegram non configurate per questo utente (${owner?.username})`);
              }
            } catch (telegramError) {
              console.error(`❌ [Telegram] Errore durante invio notifica per ${leadEmail}:`, telegramError);
            }

            // INVIA EMAIL SOLO PER NUOVI LEAD (non duplicati email)
            console.log(`🔍 [Email Debug] ==========================================`);
            console.log(`🔍 [Email Debug] Lead: ${leadEmail}`);
            console.log(`🔍 [Email Debug] Campagna: ${campaign}`);
            console.log(`🔍 [Email Debug] Config ID: ${config.id}`);
            console.log(`🔍 [Email Debug] Config Name: ${config.name}`);
            console.log(`🔍 [Email Debug] Existing Count: ${existingCount}`);
            console.log(`🔍 [Email Debug] New Lead ID: ${newLead.id}`);
            console.log(`🔍 [Email Debug] Is Exact Duplicate: ${isExactDuplicate}`);
            console.log(`🔍 [Email Debug] Lead Status: ${leadStatus}`);
            console.log(`🔍 [Email Debug] ==========================================`);

            if (existingCount === 0) {
              console.log(`📧 [Email Decision] Primo lead per ${leadEmail} - INVIO EMAIL`);
              console.log(`📧 [Email Debug] Chiamando sendTrainingEmail con parametri:`);
              console.log(`📧 [Email Debug] - email: ${leadEmail}`);
              console.log(`📧 [Email Debug] - name: ${leadFirstName}`);
              console.log(`📧 [Email Debug] - phone: ${leadPhone}`);
              console.log(`📧 [Email Debug] - campaign: ${campaign}`);
              console.log(`📧 [Email Debug] - configId: ${config.id}`);

              const emailSent = await this.sendTrainingEmail(leadEmail, leadFirstName, leadPhone, campaign, config.id);

              console.log(`📧 [Email Debug] sendTrainingEmail result: ${emailSent}`);

              if (emailSent && newLead.id) {
                await db.update(marketingLeads)
                  .set({ emailSent: true })
                  .where(eq(marketingLeads.id, newLead.id));
                console.log(`✅ [Email] Email training inviata per ${leadEmail} (${leadStatus})`);
              } else {
                console.log(`❌ [Email] Email training NON inviata per ${leadEmail} (${leadStatus})`);
                console.log(`❌ [Email Debug] Motivo: emailSent=${emailSent}, newLead.id=${newLead.id}`);
              }
            } else {
              console.log(`📧 [Email Decision] Lead duplicato per ${leadEmail} - SKIP EMAIL (già inviata)`);
              console.log(`📧 [Email Debug] Motivo: existingCount=${existingCount}`);
              // Segna comunque come emailSent = false nel database per tracking
              if (newLead.id) {
                await db.update(marketingLeads)
                  .set({ emailSent: false })
                  .where(eq(marketingLeads.id, newLead.id));
              }
            }

            // INVIA WHATSAPP SOLO PER NUOVI LEAD (non duplicati phone)
            console.log(`📱 [WhatsApp Debug] Controllo invio - leadPhone: ${leadPhone}, existingCount: ${existingCount}`);
            console.log(`📱 [WhatsApp Debug] Condizioni: leadPhone=${!!leadPhone}, existingCount=${existingCount}, leadPhone_type=${typeof leadPhone}`);

            if (leadPhone && existingCount === 0) {
              console.log(`📱 [WhatsApp Decision] Primo lead per ${leadEmail} - INVIO WHATSAPP`);
              console.log(`📱 [WhatsApp Data] Phone: ${leadPhone}, Name: ${leadFirstName}, Business: ${leadBusinessName}, Campaign: ${campaign}`);

              try {
                console.log(`📱 [WhatsApp] Importando modulo WhatsApp...`);
                const { sendWhatsAppWelcomeMessage } = await import('./whatsapp');
                console.log(`📱 [WhatsApp] Modulo WhatsApp importato con successo`);

                console.log(`📱 [WhatsApp] Chiamando sendWhatsAppWelcomeMessage...`);
                const whatsappResult = await sendWhatsAppWelcomeMessage({
                  phone: leadPhone,
                  name: leadFirstName,
                  businessName: leadBusinessName,
                  campaign: campaign,
                  message: '' // Verrà generato automaticamente
                });

                console.log(`📱 [WhatsApp Result] Success: ${whatsappResult.success}, Error: ${whatsappResult.error || 'none'}`);

                if (whatsappResult.success && newLead.id) {
                  await db.update(marketingLeads)
                    .set({ whatsappSent: true })
                    .where(eq(marketingLeads.id, newLead.id));
                  console.log(`✅ [WhatsApp] Messaggio inviato con successo per ${leadEmail} (${leadStatus})`);
                } else {
                  console.log(`❌ [WhatsApp] Messaggio NON inviato per ${leadEmail}: ${whatsappResult.error || 'Errore sconosciuto'}`);
                  // Segna come fallito ma salva il tentativo
                  if (newLead.id) {
                    await db.update(marketingLeads)
                      .set({ whatsappSent: false })
                      .where(eq(marketingLeads.id, newLead.id));
                  }
                }
              } catch (whatsappError) {
                console.error(`❌ [WhatsApp] Errore durante invio per ${leadEmail}:`, whatsappError);
                console.error(`❌ [WhatsApp] Stack trace:`, whatsappError.stack);
                console.error(`❌ [WhatsApp] Errore completo:`, JSON.stringify(whatsappError, null, 2));
              }
            } else if (leadPhone && existingCount > 0) {
              console.log(`📱 [WhatsApp Decision] Lead duplicato per ${leadEmail} - SKIP WHATSAPP (già inviato)`);
              console.log(`📱 [WhatsApp Debug] leadPhone: "${leadPhone}", existingCount: ${existingCount}`);
              // Segna come whatsappSent = false per tracking
              if (newLead.id) {
                await db.update(marketingLeads)
                  .set({ whatsappSent: false })
                  .where(eq(marketingLeads.id, newLead.id));
              }
            } else {
              console.log(`⚠️ [WhatsApp] Numero telefono mancante per ${leadEmail} - WhatsApp non inviato`);
              console.log(`⚠️ [WhatsApp Debug] leadPhone: "${leadPhone}", existingCount: ${existingCount}`);
              console.log(`⚠️ [WhatsApp Debug] leadPhone isEmpty: ${!leadPhone}, existingCount > 0: ${existingCount > 0}`);
            }

          } catch (dbError) {
            console.error('❌ [AutoSync] Errore controllo duplicati:', dbError);
            leadStatus = 'skipped - db error';
            syncResults.push({
              configName: config.name,
              email: leadEmail,
              phone: leadPhone,
              businessName: leadBusinessName,
              firstName: leadFirstName,
              status: leadStatus
            });
            skippedCount++;
            continue;
          }

        } catch (error) {
          console.error('❌ [AutoSync] Errore importazione lead:', error);
          skippedCount++;
          leadStatus = 'skipped - import error';
        } finally {
          syncResults.push({
            configName: config.name,
            email: leadEmail,
            phone: leadPhone,
            businessName: leadBusinessName,
            firstName: leadFirstName,
            status: leadStatus
          });
        }
            }

            totalImported += importedCount;
            totalSkipped += skippedCount;

          } catch (configError) {
            console.error(`❌ [AutoSync] Errore configurazione ${config.name}:`, configError);
          }
        }

        this.status.lastSync = new Date();

        // Salva i risultati dettagliati
        this.lastSyncResults = {
          totalImported,
          totalSkipped,
          configurationsProcessed: activeConfigs.length,
          syncResults: activeConfigs.map(config => {
            const configResults = syncResults.filter(r => r.configName === config.name);
            const displayName = config.name || `Campagna ${config.id}`;
            return {
              configId: config.id,
              configName: displayName,
              campaign: config.campaign,
              importedCount: configResults.filter(r => r.status === 'imported').length,
              skippedCount: configResults.filter(r => r.status.includes('skipped')).length,
              totalRows: configResults.length,
              processedLeads: configResults.map(r => ({
                email: r.email || 'N/A',
                phone: r.phone || 'N/A',
                businessName: r.businessName || 'N/A',
                firstName: r.firstName || 'N/A',
                status: r.status.includes('duplicate') ? 'duplicate' :
                       r.status.includes('imported') ? 'imported' :
                       r.status.includes('error') ? 'error' : 'skipped',
                reason: r.status.includes('duplicate') ? 'Lead già presente nel database' :
                       r.status.includes('imported') ? 'Importato con successo' :
                       r.status.includes('error') ? 'Errore durante importazione' :
                       'Saltato per dati mancanti',
                timestamp: new Date().toISOString()
              })),
              timestamp: new Date().toISOString()
            };
          }),
          timestamp: new Date().toISOString()
        };

    } catch (error) {
      console.error('❌ [AutoSync] Errore sincronizzazione:', error);
      this.lastSyncResults = {
        totalImported: 0,
        totalSkipped: 0,
        configurationsProcessed: 0,
        syncResults: [],
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Restituisce lo stato della sincronizzazione
   */
  getStatus() {
    return {
      isRunning: this.status.isRunning,
      lastSync: this.status.lastSync,
      nextSync: this.status.isRunning ? new Date(Date.now() + this.status.syncInterval) : null,
      intervalSeconds: this.status.syncInterval / 1000,
      configurations: this.status.configurations
    };
  }

  /**
   * Restituisce i risultati dettagliati dell'ultima sincronizzazione
   */
  getLastSyncResults() {
    return this.lastSyncResults;
  }

  /**
   * Invia email di training per i nuovi lead - TEMPORANEAMENTE DISABILITATA
   */
  private async sendTrainingEmail(email: string, name: string, phone: string, campaign: string, configId?: string): Promise<boolean> {
    console.log(`📧 [AutoSync] Email training temporaneamente disabilitata per ${email}`);
    return false;
  }


}