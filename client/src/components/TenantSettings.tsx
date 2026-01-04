import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface TenantInfo {
  id: number;
  name: string;
  domain: string;
  logo: string | null;
  isActive: boolean;
}

export default function TenantSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [name, setName] = useState("");
  const [logo, setLogo] = useState("");
  const [defaultHomepage, setDefaultHomepage] = useState("/home");

  // Carica le impostazioni del tenant
  const { data: tenantData, isLoading, error } = useQuery<TenantInfo>({
    queryKey: ['/api/tenant/info'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/tenant/info');
      return response.json();
    }
  });

  // Carica le impostazioni generali (per default homepage)
  const { data: generalSettings } = useQuery({
    queryKey: ['/api/settings'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/settings');
      return response.json();
    }
  });

  // Carica pagine disponibili per il dropdown
  const { data: availablePages } = useQuery({
    queryKey: ['/api/analytics/available-routes'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/analytics/available-routes');
      return response.json();
    }
  });

  // Effetto per impostare i valori quando i dati vengono caricati
  useEffect(() => {
    if (tenantData) {
      setName(tenantData.name || '');
      setLogo(tenantData.logo || '');
    }
  }, [tenantData]);

  useEffect(() => {
    if (generalSettings?.defaultHomepage) {
      setDefaultHomepage(generalSettings.defaultHomepage);
    }
  }, [generalSettings]);

  // Salva le impostazioni del tenant
  const saveTenantMutation = useMutation({
    mutationFn: async (data: { name: string; logo: string }) => {
      const response = await apiRequest('PUT', '/api/tenant/update', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tenant/info'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tenant/public'] });
      toast({
        title: "Successo!",
        description: "Impostazioni del sito salvate.",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile salvare le impostazioni.",
        variant: "destructive"
      });
    }
  });

  const handleSave = async () => {
    // Save tenant info
    saveTenantMutation.mutate({ name, logo });
    
    // Save default homepage setting
    try {
      await apiRequest('PUT', '/api/settings', {
        key: 'defaultHomepage',
        value: defaultHomepage
      });
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
    } catch (error) {
      console.error('Error saving default homepage:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Caricamento impostazioni...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive">Errore nel caricamento delle impostazioni</p>
          <Button onClick={() => window.location.reload()} variant="outline" className="mt-2">
            Riprova
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Impostazioni Sito</h1>
          <p className="text-muted-foreground">Configura nome e logo del tuo sito</p>
        </div>
        <Button onClick={handleSave} disabled={saveTenantMutation.isPending}>
          {saveTenantMutation.isPending ? 'Salvataggio...' : 'Salva Modifiche'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informazioni Generali</CardTitle>
          <CardDescription>
            Queste informazioni verranno visualizzate nell'header e nel footer del sito
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="tenant-name">Nome del Sito</Label>
            <Input
              id="tenant-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Es: Fabio Bianchini"
            />
            <p className="text-sm text-muted-foreground">
              Il nome verrà mostrato nell'header e nel footer
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tenant-logo">URL Logo</Label>
            <Input
              id="tenant-logo"
              value={logo}
              onChange={(e) => setLogo(e.target.value)}
              placeholder="https://example.com/logo.png"
            />
            <p className="text-sm text-muted-foreground">
              Inserisci l'URL completo del tuo logo. Se lasci vuoto verrà mostrata solo la prima lettera del nome.
            </p>
          </div>

          {logo && (
            <div className="space-y-2">
              <Label>Anteprima Logo</Label>
              <div className="p-4 border rounded-lg bg-muted/50">
                <img src={logo} alt="Logo preview" className="h-12 w-auto" onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }} />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="default-homepage">Pagina Predefinita (Homepage)</Label>
            <select
              id="default-homepage"
              value={defaultHomepage}
              onChange={(e) => setDefaultHomepage(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="/home">Home (default)</option>
              {availablePages?.map((page: any) => (
                <option key={page.route} value={page.route}>
                  {page.name} ({page.route})
                </option>
              ))}
            </select>
            <p className="text-sm text-muted-foreground">
              Questa pagina si aprirà quando un utente accede al sito
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Anteprima</CardTitle>
          <CardDescription>Come apparirà nell'header del sito</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/50">
            {logo ? (
              <img src={logo} alt={name} className="h-8 w-auto" onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }} />
            ) : (
              <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center">
                <span className="text-primary-foreground font-bold">
                  {name?.charAt(0).toUpperCase() || 'S'}
                </span>
              </div>
            )}
            <span className="font-bold text-xl">{name || 'Nome Sito'}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informazioni Tenant</CardTitle>
          <CardDescription>Dettagli tecnici del tuo spazio</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">ID Tenant:</span>
            <span className="text-sm font-mono">{tenantData?.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Dominio:</span>
            <span className="text-sm font-mono">{tenantData?.domain}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Stato:</span>
            <span className="text-sm">{tenantData?.isActive ? 'Attivo' : 'Non attivo'}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
