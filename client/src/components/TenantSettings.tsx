import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Building2, Image, Globe, Home, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

  const { data: tenantData, isLoading, error } = useQuery<TenantInfo>({
    queryKey: ['/api/tenant/info'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/tenant/info');
      return response.json();
    }
  });

  const { data: generalSettings } = useQuery({
    queryKey: ['/api/settings'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/settings');
      return response.json();
    }
  });

  const { data: availablePages } = useQuery({
    queryKey: ['/api/analytics/available-routes'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/analytics/available-routes');
      return response.json();
    }
  });

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

  const saveTenantMutation = useMutation({
    mutationFn: async (data: { name: string; logo: string }) => {
      const response = await apiRequest('PUT', '/api/tenant/update', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tenant/info'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tenant/public'] });
      toast({
        title: "Impostazioni salvate",
        description: "Impostazioni del sito aggiornate con successo.",
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
    saveTenantMutation.mutate({ name, logo });
    
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-sm text-slate-600">Caricamento impostazioni...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 text-sm">Errore nel caricamento delle impostazioni</p>
          <Button onClick={() => window.location.reload()} variant="outline" className="mt-2 border-slate-200">
            Riprova
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-50">
                <Building2 className="h-4 w-4 text-indigo-600" />
              </div>
              <div>
                <CardTitle className="text-sm text-slate-800">Informazioni Generali</CardTitle>
                <p className="text-xs text-slate-600 mt-0.5">Nome, logo e homepage predefinita del sito</p>
              </div>
            </div>
            <Button onClick={handleSave} disabled={saveTenantMutation.isPending} size="sm" className="bg-indigo-600 hover:bg-indigo-700">
              {saveTenantMutation.isPending ? 'Salvataggio...' : 'Salva'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5 text-slate-400" />
              <label htmlFor="tenant-name" className="text-xs text-slate-600">Nome del Sito</label>
            </div>
            <Input
              id="tenant-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Es: Fabio Bianchini"
              className="border-slate-200 focus:border-indigo-300"
            />
            <p className="text-xs text-slate-400">
              Il nome verrà mostrato nell'header e nel footer
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Image className="h-3.5 w-3.5 text-slate-400" />
              <label htmlFor="tenant-logo" className="text-xs text-slate-600">URL Logo</label>
            </div>
            <Input
              id="tenant-logo"
              value={logo}
              onChange={(e) => setLogo(e.target.value)}
              placeholder="https://example.com/logo.png"
              className="border-slate-200 focus:border-indigo-300"
            />
            <p className="text-xs text-slate-400">
              Inserisci l'URL completo del tuo logo. Se lasci vuoto verrà mostrata solo la prima lettera del nome.
            </p>
          </div>

          {logo && (
            <div className="space-y-1.5">
              <label className="text-xs text-slate-600">Anteprima Logo</label>
              <div className="p-4 border border-slate-200 rounded-lg bg-slate-50">
                <img src={logo} alt="Logo preview" className="h-12 w-auto" onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }} />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Home className="h-3.5 w-3.5 text-slate-400" />
              <label htmlFor="default-homepage" className="text-xs text-slate-600">Pagina Predefinita (Homepage)</label>
            </div>
            <select
              id="default-homepage"
              value={defaultHomepage}
              onChange={(e) => setDefaultHomepage(e.target.value)}
              className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300"
            >
              <option value="/home">Home (default)</option>
              {availablePages?.map((page: any) => (
                <option key={page.route} value={page.route}>
                  {page.name} ({page.route})
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-400">
              Questa pagina si aprirà quando un utente accede al sito
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-50">
              <Eye className="h-4 w-4 text-indigo-600" />
            </div>
            <CardTitle className="text-sm text-slate-800">Anteprima Header</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg bg-slate-800">
            {logo ? (
              <img src={logo} alt={name} className="h-8 w-auto" onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }} />
            ) : (
              <div className="h-8 w-8 bg-indigo-600 rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {name?.charAt(0).toUpperCase() || 'S'}
                </span>
              </div>
            )}
            <span className="font-bold text-lg text-white">{name || 'Nome Sito'}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-50">
              <Globe className="h-4 w-4 text-indigo-600" />
            </div>
            <CardTitle className="text-sm text-slate-800">Informazioni Tenant</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-slate-100">
            <span className="text-xs text-slate-600">ID Tenant</span>
            <span className="text-xs font-mono text-slate-800">{tenantData?.id}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-100">
            <span className="text-xs text-slate-600">Dominio</span>
            <span className="text-xs font-mono text-slate-800">{tenantData?.domain}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-xs text-slate-600">Stato</span>
            {tenantData?.isActive ? (
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">Attivo</Badge>
            ) : (
              <Badge className="bg-slate-100 text-slate-600 border-slate-200 text-xs">Non attivo</Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
