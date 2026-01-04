import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileSpreadsheet, ExternalLink, Plus, Trash2, Save, CheckCircle, XCircle, AlertCircle, Users, Archive } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import UserProfileSettings from '@/components/UserProfileSettings';

interface GoogleSheetsConfig {
  id: string;
  name: string;
  spreadsheetId: string;
  range: string;
  campaign: string;
  isActive: boolean;
  archived?: boolean;
  clientId?: number;
  ownerId?: number;
  maxLeadsPerSync?: number;
  syncIntervalMinutes?: number;
  emailTemplate?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface Client {
  id: number;
  name: string;
  description?: string;
  ownerId: number;
  createdAt: Date;
  updatedAt: Date;
}

interface SyncResults {
  totalImported: number;
  totalSkipped: number;
  configurationsProcessed: number;
  syncResults: Array<{
    configId: string;
    configName: string;
    campaign: string;
    importedCount: number;
    skippedCount: number;
    totalRows: number;
    processedLeads: Array<{
      email: string;
      phone: string;
      businessName: string;
      firstName: string;
      status: 'imported' | 'skipped' | 'duplicate' | 'error';
      reason: string;
      timestamp: string;
    }>;
    timestamp: string;
  }>;
  timestamp: string;
}

export default function GoogleSheetsManager() {
  const [configurations, setConfigurations] = useState<GoogleSheetsConfig[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{
    isRunning: boolean;
    lastSync: string | null;
    nextSync: string | null;
    intervalSeconds: number;
  } | null>(null);
  const [syncResults, setSyncResults] = useState<SyncResults | null>(null);
  const [selectedConfig, setSelectedConfig] = useState<string>('');
  const [campaignsWithLeads, setCampaignsWithLeads] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Funzione helper per ricaricare le configurazioni
  const refetch = async () => {
    await loadConfigurations();
    await loadSyncStatus();
    await loadSyncResults();
  };

  // Helper per garantire che i valori non siano undefined
  const safeValue = (value: any, defaultValue: string = '') => {
    return value === undefined || value === null ? defaultValue : value;
  };


  // Carica le configurazioni dal database
  const loadConfigurations = async () => {
    try {
      console.log('🔄 [LOAD CONFIG] Caricamento configurazioni...');

      const response = await fetch('/api/google-sheets/configurations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📦 [LOAD CONFIG] Dati ricevuti dal server:', data);

        if (!data.success) {
          console.error('❌ [LOAD CONFIG] Server returned unsuccessful response');
          toast({
            title: "Errore",
            description: "Impossibile caricare le configurazioni",
            variant: "destructive"
          });
          return;
        }

        const configs = (data.configurations || []).map((config: any) => ({
          id: String(config.id), // Converti id a stringa
          name: config.campaignName || config.name || `Campagna ${config.id}`, // Usa campaignName come fallback per name
          spreadsheetId: config.sheetId || config.spreadsheetId || '',
          range: config.sheetRange || config.range || '',
          campaign: config.campaignName || config.campaign || '',
          isActive: config.isActive ?? true,
          archived: config.archived ?? false,
          clientId: config.clientId,
          ownerId: config.ownerId,
          maxLeadsPerSync: config.maxLeadsPerSync,
          syncIntervalMinutes: config.syncIntervalMinutes,
          emailTemplate: config.emailTemplate
        }));

        console.log('✅ [LOAD CONFIG] Configurazioni mappate:', configs);
        setConfigurations(configs);

        // Dopo aver caricato le configurazioni, aggiorna lo stato dei lead
        if (configs.length > 0) {
          await updateCampaignsWithLeadsForConfigs(configs);
        }
      }
    } catch (error) {
      console.error('❌ [LOAD CONFIG] Errore caricamento configurazioni:', error);
    }
  };

  const saveConfiguration = async (config: GoogleSheetsConfig) => {
    try {
      // Valida campi richiesti
      if (!config.name || config.name.trim() === '') {
        toast({
          title: "Errore",
          description: "Il nome della campagna è obbligatorio",
          variant: "destructive"
        });
        return;
      }

      if (!config.campaign || config.campaign.trim() === '') {
        toast({
          title: "Errore",
          description: "L'ID campagna è obbligatorio",
          variant: "destructive"
        });
        return;
      }

      if (!config.spreadsheetId || config.spreadsheetId.trim() === '') {
        toast({
          title: "Errore",
          description: "L'ID Google Sheet è obbligatorio",
          variant: "destructive"
        });
        return;
      }

      // Pulisci e valida i dati prima del salvataggio
      const dataToSave = {
        id: config.id,
        name: String(config.name).trim().substring(0, 255),
        campaignName: String(config.campaign).trim().substring(0, 255),
        sheetId: String(config.spreadsheetId).trim().substring(0, 255),
        sheetRange: String(config.range || 'Foglio1!A1:Z1000').trim().substring(0, 100),
        isActive: Boolean(config.isActive),
        clientId: config.clientId || null,
        ownerId: config.ownerId || null,
        maxLeadsPerSync: Number(config.maxLeadsPerSync) || 10,
        syncIntervalMinutes: Number(config.syncIntervalMinutes) || 10,
        emailTemplate: String(config.emailTemplate || 'movieturbo').trim().substring(0, 100)
      };

      console.log('📤 [SAVE CONFIG] Dati validati da inviare:', dataToSave);

      const response = await fetch('/api/google-sheets/configurations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSave)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ [SAVE CONFIG] Risposta server:', data);

        toast({
          title: "Configurazione salvata",
          description: `La campagna "${config.name}" è stata salvata con successo.`
        });

        // Ricarica le configurazioni
        await loadConfigurations();
      } else {
        const errorData = await response.json();
        console.error('❌ [SAVE CONFIG] Errore:', errorData);
        throw new Error(errorData.error || errorData.details || 'Errore nel salvataggio');
      }
    } catch (error) {
      console.error('❌ [SAVE CONFIG] Errore salvataggio configurazione:', error);
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Impossibile salvare la configurazione",
        variant: "destructive"
      });
    }
  };

  // Filtra le configurazioni in base alla selezione
  const filteredConfigurations = configurations.filter(config => {
    // Filtra per archived/non-archived
    if (showArchived && !config.archived) return false;
    if (!showArchived && config.archived) return false;

    return true;
  });

  const addConfiguration = async () => {
    const newConfigName = `Campagna ${configurations.length + 1}`;
    const newCampaignName = `campaign-${configurations.length + 1}`;

    const newConfig = {
      name: newConfigName.substring(0, 255),
      campaignName: newCampaignName.substring(0, 255),
      sheetId: '',
      sheetRange: 'Foglio1!A1:Z1000',
      isActive: true,
      maxLeadsPerSync: 10,
      syncIntervalMinutes: 10,
      emailTemplate: 'movieturbo'
      // ownerId verrà assegnato automaticamente dal server usando req.user.id
    };

    try {
      console.log('📤 [ADD CONFIG] Creazione nuova configurazione:', newConfig);

      // Save immediately to database (without ID - database will generate it)
      const response = await fetch('/api/google-sheets/configurations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newConfig)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ [ADD CONFIG] Configurazione creata:', data);

        await loadConfigurations();
        toast({
          title: "Nuova campagna creata",
          description: `La campagna "${newConfig.name}" è stata creata con successo.`
        });
      } else {
        const errorData = await response.json();
        console.error('❌ [ADD CONFIG] Errore dal server:', errorData);
        throw new Error(errorData.error || errorData.details || 'Errore nel salvataggio');
      }
    } catch (error) {
      console.error('❌ [ADD CONFIG] Errore creazione nuova campagna:', error);
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Impossibile creare la nuova campagna",
        variant: "destructive"
      });
    }
  };

  const removeConfiguration = async (id: string) => {
    if (configurations.length > 1) {
      try {
        const response = await fetch(`/api/google-sheets/configurations/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.status === 409) {
          // La campagna ha lead associati e non può essere eliminata
          const data = await response.json();
          toast({
            title: "Impossibile eliminare",
            description: data.message || "Questa campagna ha lead associati e può solo essere archiviata.",
            variant: "destructive"
          });
          return;
        }

        if (response.ok) {
          await loadConfigurations();
          toast({
            title: "Configurazione eliminata",
            description: "La campagna è stata eliminata con successo."
          });
        }
      } catch (error) {
        console.error('Errore eliminazione configurazione:', error);
        toast({
          title: "Errore",
          description: "Impossibile eliminare la configurazione",
          variant: "destructive"
        });
      }
    }
  };

  const archiveConfiguration = async (id: string) => {
    try {
      const response = await fetch(`/api/google-sheets/configurations/${id}/archive`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await loadConfigurations();
        toast({
          title: "Configurazione archiviata",
          description: "La campagna è stata archiviata con successo."
        });
      }
    } catch (error) {
      console.error('Errore archiviazione configurazione:', error);
      toast({
        title: "Errore",
        description: "Impossibile archiviare la configurazione",
        variant: "destructive"
      });
    }
  };

  const dearchiveConfiguration = async (id: string) => {
    try {
      const response = await fetch(`/api/google-sheets/configurations/${id}/dearchive`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await loadConfigurations();
        toast({
          title: "Configurazione ripristinata",
          description: "La campagna è stata ripristinata dall'archivio con successo."
        });
      } else {
        throw new Error('Errore nel ripristino');
      }
    } catch (error) {
      console.error('Errore ripristino configurazione:', error);
      toast({
        title: "Errore",
        description: "Impossibile ripristinare la configurazione",
        variant: "destructive"
      });
    }
  };

  const checkCampaignHasLeads = async (campaign: string): Promise<boolean> => {
    // Salta il controllo se campaign è undefined o vuoto
    if (!campaign || campaign === 'undefined') {
      return false;
    }

    try {
      const response = await fetch(`/api/marketing-leads/check-campaign/${encodeURIComponent(campaign)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.hasLeads || false;
      }
      return false;
    } catch (error) {
      console.error('Errore controllo lead campagna:', error);
      return false;
    }
  };

  // Funzione per aggiornare lo stato dei lead per una lista specifica di configurazioni
  const updateCampaignsWithLeadsForConfigs = async (configs: GoogleSheetsConfig[]) => {
    const newCampaignsWithLeads = new Set<string>();

    // Controlla ogni configurazione per vedere se ha lead
    for (const config of configs) {
      const hasLeads = await checkCampaignHasLeads(config.campaign);
      if (hasLeads) {
        newCampaignsWithLeads.add(config.campaign);
      }
    }

    setCampaignsWithLeads(newCampaignsWithLeads);
  };

  // Funzione per aggiornare lo stato dei lead per tutte le campagne
  const updateCampaignsWithLeads = async () => {
    await updateCampaignsWithLeadsForConfigs(configurations);
  };

  // Funzioni di gestione
  const updateConfiguration = (id: string, updates: Partial<GoogleSheetsConfig>) => {
    // Aggiorna solo lo stato locale, senza salvare nel database
    setConfigurations(prev =>
      prev.map(config =>
        config.id === id ? { ...config, ...updates } : config
      )
    );
  };

  // Carica lo stato della sincronizzazione automatica
  const loadSyncStatus = async () => {
    try {
      const response = await fetch('/api/google-sheets/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSyncStatus(data.status);
        setSyncResults(data.lastSyncResults);
      }
    } catch (error) {
      console.error('Errore caricamento stato:', error);
    }
  };

  // Carica i risultati dettagliati della sincronizzazione
  const loadSyncResults = async () => {
    try {
      const response = await fetch('/api/google-sheets/sync-results', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.results) {
          setSyncResults(data.results);
        }
      }
    } catch (error) {
      console.error('Errore caricamento risultati sincronizzazione:', error);
    }
  };

  // Carica configurazioni e stato all'avvio
  useEffect(() => {
    refetch();
    // Aggiorna lo stato ogni 15 secondi
    const interval = setInterval(() => {
      loadSyncStatus();
      loadSyncResults();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Google Sheets</h2>
          <p className="text-muted-foreground">
            Gestisci le configurazioni di sincronizzazione automatica con Google Sheets
          </p>
        </div>
      </div>

      {/* User Profile Settings - API Key */}
      <UserProfileSettings />

      {/* Stato Sincronizzazione Automatica */}
      <Card className={`${syncStatus?.isRunning ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className={`h-5 w-5 ${syncStatus?.isRunning ? 'text-green-600' : 'text-red-600'}`} />
                Sincronizzazione Automatica
                {syncStatus?.isRunning && (
                  <div className="flex items-center gap-1 ml-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-700 font-medium">LIVE</span>
                  </div>
                )}
              </CardTitle>
              <CardDescription>
                Il sistema importa automaticamente i lead ogni 10 secondi
              </CardDescription>
            </div>
            <Button
              onClick={async () => {
                try {
                  const response = await fetch('/api/google-sheets/sync-now', {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                      'Content-Type': 'application/json'
                    }
                  });

                  if (response.ok) {
                    toast({
                      title: "Sincronizzazione avviata",
                      description: "Controlla i log del server per i dettagli"
                    });
                    await refetch();
                  } else {
                    throw new Error('Errore sincronizzazione');
                  }
                } catch (error) {
                  toast({
                    title: "Errore",
                    description: "Impossibile avviare la sincronizzazione manuale",
                    variant: "destructive"
                  });
                }
              }}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Sincronizza Ora
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {syncStatus ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant={syncStatus.isRunning ? "default" : "secondary"}>
                  {syncStatus.isRunning ? "🟢 Attivo" : "🔴 Inattivo"}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Sincronizzazione ogni {syncStatus.intervalSeconds} secondi
                </span>
              </div>
              {syncStatus.lastSync && (
                <p className="text-sm text-muted-foreground">
                  Ultima sincronizzazione: {new Date(syncStatus.lastSync).toLocaleString('it-IT')}
                </p>
              )}
              {syncStatus.nextSync && (
                <p className="text-sm text-muted-foreground">
                  Prossima sincronizzazione: {new Date(syncStatus.nextSync).toLocaleString('it-IT')}
                </p>
              )}
              {syncResults && (
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{syncResults.totalImported}</div>
                    <div className="text-xs text-muted-foreground">Importati</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{syncResults.totalSkipped}</div>
                    <div className="text-xs text-muted-foreground">Saltati</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{syncResults.configurationsProcessed}</div>
                    <div className="text-xs text-muted-foreground">Campagne</div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="text-muted-foreground">Caricamento stato...</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configurazioni Campagne */}
      <div>
          {/* Configurazioni Campagne */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {showArchived
                  ? "Campagne Archiviate"
                  : "Le Mie Campagne"
                }
              </CardTitle>
              <CardDescription>
                {showArchived
                  ? "Campagne archiviate che possono essere ripristinate"
                  : "Configura le tue campagne Facebook con i rispettivi Google Sheets"
                }
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={showArchived ? "default" : "outline"}
                size="sm"
                onClick={() => setShowArchived(!showArchived)}
                className="flex items-center gap-2"
              >
                <Archive className="h-4 w-4" />
                {showArchived ? "Mostra Attive" : "Archiviate"}
              </Button>
              {!showArchived && (
                <Button onClick={() => addConfiguration()} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Aggiungi Campagna
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredConfigurations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Nessuna campagna trovata</h3>
                <p>
                  {showArchived
                    ? "Non ci sono campagne archiviate."
                    : "Non ci sono campagne configurate. Clicca 'Aggiungi Campagna' per iniziare."
                  }
                </p>
              </div>
            ) : (
              filteredConfigurations.map((config, index) => (
              <Card key={config.id} className="border-l-4 border-l-blue-500">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`name-${config.id}`}>Nome Campagna</Label>
                      <Input
                        id={`name-${config.id}`}
                        value={safeValue(config.name)}
                        onChange={(e) => updateConfiguration(config.id, { name: e.target.value })}
                        placeholder="es. CAMPAGNA A"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`campaign-${config.id}`}>ID Campagna</Label>
                      <Input
                        id={`campaign-${config.id}`}
                        value={safeValue(config.campaign)}
                        onChange={(e) => updateConfiguration(config.id, { campaign: e.target.value })}
                        placeholder="es. campaign-a"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`spreadsheet-${config.id}`}>ID Google Sheets</Label>
                      <Input
                        id={`spreadsheet-${config.id}`}
                        value={safeValue(config.spreadsheetId)}
                        onChange={(e) => updateConfiguration(config.id, { spreadsheetId: e.target.value })}
                        placeholder="1ABC...XYZ"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`range-${config.id}`}>Range</Label>
                      <Input
                        id={`range-${config.id}`}
                        value={safeValue(config.range)}
                        onChange={(e) => updateConfiguration(config.id, { range: e.target.value })}
                        placeholder="Foglio1!A1:Z1000"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`max-leads-${config.id}`}>Max Lead per Controllo</Label>
                      <Input
                        id={`max-leads-${config.id}`}
                        type="number"
                        min="1"
                        max="1000"
                        value={config.maxLeadsPerSync || 10}
                        onChange={(e) => updateConfiguration(config.id, {
                          maxLeadsPerSync: parseInt(e.target.value) || 10
                        })}
                        placeholder="10"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`sync-interval-${config.id}`}>Intervallo Sincronizzazione (minuti)</Label>
                      <Input
                        id={`sync-interval-${config.id}`}
                        type="number"
                        min="1"
                        max="60"
                        value={config.syncIntervalMinutes || 10}
                        onChange={(e) => updateConfiguration(config.id, {
                          syncIntervalMinutes: parseInt(e.target.value) || 10
                        })}
                        placeholder="10"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`email-template-${config.id}`}>Template Email</Label>
                      <Select
                        value={config.emailTemplate || 'movieturbo'}
                        onValueChange={(value) => {
                          updateConfiguration(config.id, { emailTemplate: value });
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Seleziona template email" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="movieturbo">🎬 MovieTurbo Training</SelectItem>
                          <SelectItem value="dipendenti">💼 Rendita Passiva Dipendenti</SelectItem>
                          <SelectItem value="rendita-imprenditore">🚀 Rendita Passiva Imprenditori</SelectItem>
                          <SelectItem value="rendita-unificata">💰 Rendita Passiva Unificata (Dipendenti + Imprenditori)</SelectItem>
                          <SelectItem value="standard">📚 Training Standard</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Seleziona quale template email verrà inviato ai nuovi lead di questa campagna
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                      <Badge variant={config.isActive ? "default" : "secondary"}>
                        {config.isActive ? "Attiva" : "Inattiva"}
                      </Badge>
                      {config.archived && (
                        <Badge variant="outline" className="text-orange-600 border-orange-200">
                          Archiviata
                        </Badge>
                      )}
                      {config.spreadsheetId && (
                        <Button variant="outline" size="sm" asChild>
                          <a
                            href={`https://docs.google.com/spreadsheets/d/${config.spreadsheetId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Apri Sheet
                          </a>
                        </Button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => saveConfiguration(config)}
                        className="flex items-center gap-1"
                      >
                        <Save className="h-3 w-3" />
                        Salva
                      </Button>
                      {configurations.length > 1 && (
                        config.archived ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => dearchiveConfiguration(config.id)}
                            className="flex items-center gap-1 text-green-600 hover:text-green-700"
                          >
                            <Archive className="h-3 w-3" />
                            Ripristina
                          </Button>
                        ) : campaignsWithLeads.has(config.campaign) ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => archiveConfiguration(config.id)}
                            className="flex items-center gap-1 text-orange-600 hover:text-orange-700"
                          >
                            <Archive className="h-3 w-3" />
                            Archivia
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeConfiguration(config.id)}
                            className="flex items-center gap-1 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                            Rimuovi
                          </Button>
                        )
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
            )}

            {configurations.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nessuna configurazione presente</p>
                <p className="text-sm">Clicca "Aggiungi Campagna" per iniziare</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      </div>

      {/* Risultati Ultima Sincronizzazione */}
      {syncResults && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-600" />
                  Risultati Ultima Sincronizzazione
                </CardTitle>
                <CardDescription>
                  Dettaglio dei lead importati, saltati ed errori dall'ultima sincronizzazione
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">
                  {new Date(syncResults.timestamp).toLocaleString('it-IT')}
                </div>
                <div className="flex gap-2 mt-1">
                  <Badge variant="default">{syncResults.totalImported} Importati</Badge>
                  <Badge variant="secondary">{syncResults.totalSkipped} Saltati</Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {syncResults.syncResults.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="config-select">Visualizza risultati per campagna:</Label>
                  <Select value={selectedConfig} onValueChange={setSelectedConfig}>
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="Seleziona una campagna" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutte le campagne</SelectItem>
                      {syncResults.syncResults.map((result) => (
                        <SelectItem key={result.configId} value={result.configId}>
                          {result.configName} ({result.importedCount + result.skippedCount} lead)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {syncResults.syncResults
                      .filter(result => !selectedConfig || result.configId === selectedConfig)
                      .map((result) => (
                        <div key={result.configId} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold">{result.configName}</h4>
                            <div className="flex gap-2">
                              <Badge variant="default">{result.importedCount} ✅</Badge>
                              <Badge variant="secondary">{result.skippedCount} ⚠️</Badge>
                            </div>
                          </div>

                          <div className="space-y-1 max-h-40 overflow-y-auto">
                            {result.processedLeads && result.processedLeads.length > 0 ? (
                              result.processedLeads.map((lead, index) => (
                                <div
                                  key={index}
                                  className={`flex items-center justify-between p-3 rounded-lg text-sm border ${
                                    lead.status === 'imported' ? 'bg-green-50 border-green-200' :
                                    lead.status === 'duplicate' ? 'bg-yellow-50 border-yellow-200' :
                                    lead.status === 'error' ? 'bg-red-50 border-red-200' :
                                    'bg-gray-50 border-gray-200'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    {lead.status === 'imported' && <CheckCircle className="h-4 w-4 text-green-600" />}
                                    {lead.status === 'duplicate' && <AlertCircle className="h-4 w-4 text-yellow-600" />}
                                    {lead.status === 'error' && <XCircle className="h-4 w-4 text-red-600" />}
                                    {lead.status === 'skipped' && <XCircle className="h-4 w-4 text-gray-600" />}

                                    <div>
                                      <div className="font-medium">
                                        {lead.firstName || 'N/A'} - {lead.businessName || 'N/A'}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {lead.email || 'N/A'} • {lead.phone || 'N/A'}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="text-right">
                                    <Badge
                                      variant={
                                        lead.status === 'imported' ? 'default' :
                                        lead.status === 'duplicate' ? 'secondary' :
                                        lead.status === 'error' ? 'destructive' :
                                        'outline'
                                      }
                                      className="text-xs"
                                    >
                                      {lead.status === 'imported' ? '✅ Importato' :
                                       lead.status === 'duplicate' ? '⚠️ Duplicato' :
                                       lead.status === 'error' ? '❌ Errore' :
                                       '⏭️ Saltato'}
                                    </Badge>
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {lead.reason || 'N/A'}
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-4 text-muted-foreground">
                                <p>Nessun lead processato in questa sincronizzazione</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Formato Colonne Supportato</CardTitle>
          <CardDescription>
            Il sistema riconosce automaticamente questi nomi di colonne nel Google Sheets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <Badge variant="outline">nome_azienda</Badge>
            <Badge variant="outline">business_name</Badge>
            <Badge variant="outline">e-mail</Badge>
            <Badge variant="outline">email</Badge>
            <Badge variant="outline">numero_di_telefono</Badge>
            <Badge variant="outline">phone</Badge>
            <Badge variant="outline">nome_e_cognome</Badge>
            <Badge variant="outline">name</Badge>
          </div>
          <Separator className="my-4" />
          <p className="text-xs text-muted-foreground">
            Il sistema rileva automaticamente le colonne presenti nel foglio e mappa i dati di conseguenza.
            Supporta i formati standard di Facebook Lead Ads e altri servizi.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}