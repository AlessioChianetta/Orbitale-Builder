import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Copy, Trash2, Key, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from '@/hooks/use-toast';
import { apiRequest, getAuthToken } from '@/lib/queryClient';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface ApiKey {
  id: number;
  tenantId: number;
  key: string;
  name: string;
  scopes: string[];
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CreateApiKeyData {
  name: string;
  scopes: string[];
  environment: 'live' | 'test';
}

const AVAILABLE_SCOPES = [
  { value: 'leads:read', label: 'Lettura lead CRM', description: 'Permette di leggere i lead dal CRM' },
  { value: 'leads:write', label: 'Scrittura lead CRM', description: 'Permette di creare/modificare lead nel CRM' },
  { value: 'marketing_leads:read', label: 'Lettura lead marketing', description: 'Permette di leggere i lead marketing' },
];

function getEnvironmentFromKey(key: string): 'live' | 'test' {
  if (key.startsWith('crm_live_')) return 'live';
  if (key.startsWith('crm_test_')) return 'test';
  return 'live';
}

export default function ApiKeysManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyEnvironment, setNewKeyEnvironment] = useState<'live' | 'test'>('live');
  const [newKeyScopes, setNewKeyScopes] = useState<string[]>([]);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<ApiKey | null>(null);
  const [keyToRevoke, setKeyToRevoke] = useState<ApiKey | null>(null);

  const { data: apiKeysData, isLoading } = useQuery({
    queryKey: ['/api/api-keys'],
    queryFn: async () => {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response = await fetch('/api/api-keys', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to fetch API keys' }));
        throw new Error(error.message || 'Failed to fetch API keys');
      }
      return await response.json() as { apiKeys: ApiKey[] };
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateApiKeyData) => {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response = await fetch('/api/api-keys', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to create API key' }));
        throw new Error(error.message || 'Failed to create API key');
      }
      return await response.json() as ApiKey;
    },
    onSuccess: (newKey) => {
      queryClient.invalidateQueries({ queryKey: ['/api/api-keys'] });
      setNewlyCreatedKey(newKey);
      setNewKeyName('');
      setNewKeyScopes([]);
      setNewKeyEnvironment('live');
      toast({
        title: "API Key Creata",
        description: "La nuova API key è stata generata con successo. Salvala subito, non sarà più visibile!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile creare l'API key",
        variant: "destructive",
      });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response = await fetch(`/api/api-keys/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to revoke API key' }));
        throw new Error(error.message || 'Failed to revoke API key');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/api-keys'] });
      setKeyToRevoke(null);
      toast({
        title: "API Key Revocata",
        description: "L'API key è stata revocata con successo",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile revocare l'API key",
        variant: "destructive",
      });
    },
  });

  const handleCreateKey = () => {
    if (!newKeyName.trim()) {
      toast({
        title: "Nome Richiesto",
        description: "Inserisci un nome per l'API key",
        variant: "destructive",
      });
      return;
    }

    if (newKeyScopes.length === 0) {
      toast({
        title: "Scopes Richiesti",
        description: "Seleziona almeno un permesso per l'API key",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate({
      name: newKeyName,
      scopes: newKeyScopes,
      environment: newKeyEnvironment,
    });
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast({
      title: "Chiave Copiata",
      description: "La chiave API è stata copiata negli appunti",
    });
  };

  const toggleScope = (scope: string) => {
    if (newKeyScopes.includes(scope)) {
      setNewKeyScopes(newKeyScopes.filter(s => s !== scope));
    } else {
      setNewKeyScopes([...newKeyScopes, scope]);
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Attiva</Badge>
    ) : (
      <Badge variant="secondary">Revocata</Badge>
    );
  };

  const getEnvironmentBadge = (environment: 'live' | 'test') => {
    return environment === 'live' ? (
      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Live</Badge>
    ) : (
      <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Test</Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Caricamento API keys...</p>
        </div>
      </div>
    );
  }

  const apiKeys = apiKeysData?.apiKeys || [];

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-800">Crea Nuova API Key</CardTitle>
          <CardDescription>
            Genera una nuova chiave API per integrare i tuoi sistemi esterni.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="key-name">Nome Chiave *</Label>
              <Input
                id="key-name"
                placeholder="es. Sistema ERP, App Mobile"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="environment">Environment *</Label>
              <Select value={newKeyEnvironment} onValueChange={(value: 'live' | 'test') => setNewKeyEnvironment(value)}>
                <SelectTrigger id="environment">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="live">Live (Produzione)</SelectItem>
                  <SelectItem value="test">Test (Sviluppo)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Permessi (Scopes) *</Label>
            <div className="space-y-3">
              {AVAILABLE_SCOPES.map((scope) => (
                <div key={scope.value} className="flex items-start space-x-3">
                  <Checkbox
                    id={scope.value}
                    checked={newKeyScopes.includes(scope.value)}
                    onCheckedChange={() => toggleScope(scope.value)}
                  />
                  <div className="flex-1">
                    <label
                      htmlFor={scope.value}
                      className="text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {scope.label}
                    </label>
                    <p className="text-xs text-slate-600 mt-1">
                      {scope.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button 
            onClick={handleCreateKey}
            disabled={createMutation.isPending}
            className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {createMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generazione...
              </>
            ) : (
              <>
                <Key className="h-4 w-4 mr-2" />
                Genera API Key
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-800">Le tue API Keys</CardTitle>
          <CardDescription>
            Gestisci le chiavi API per l'integrazione con sistemi esterni.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {apiKeys.length === 0 ? (
            <div className="text-center py-12">
              <Key className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Nessuna API Key
              </h3>
              <p className="text-slate-600 mb-4">
                Crea la tua prima API key per iniziare l'integrazione.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {apiKeys.map((apiKey) => {
                const environment = getEnvironmentFromKey(apiKey.key);

                return (
                  <div key={apiKey.id} className="border border-slate-200 rounded-lg p-4 bg-white hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-indigo-50 rounded-lg">
                            <Key className="h-4 w-4 text-indigo-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-slate-900">{apiKey.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              {getStatusBadge(apiKey.isActive)}
                              {getEnvironmentBadge(environment)}
                            </div>
                          </div>
                        </div>

                        <TooltipProvider>
                          <div className="flex items-center gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono">
                                  {apiKey.key}
                                </code>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">Chiave mascherata per sicurezza.<br />La chiave completa è visibile solo alla creazione.</p>
                              </TooltipContent>
                            </Tooltip>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyKey(apiKey.key)}
                              title="Copia chiave mascherata"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </TooltipProvider>

                        <div className="flex flex-wrap gap-1">
                          {apiKey.scopes.map((scope) => (
                            <Badge key={scope} variant="outline" className="text-xs">
                              {scope}
                            </Badge>
                          ))}
                        </div>

                        <div className="flex items-center gap-4 text-xs text-slate-600">
                          <span>Creata: {format(new Date(apiKey.createdAt), 'dd MMM yyyy', { locale: it })}</span>
                          <span>Ultimo uso: {apiKey.lastUsedAt 
                            ? format(new Date(apiKey.lastUsedAt), 'dd MMM yyyy', { locale: it })
                            : 'Mai usata'
                          }</span>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setKeyToRevoke(apiKey)}
                        disabled={!apiKey.isActive}
                        title="Revoca"
                        className="text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!newlyCreatedKey} onOpenChange={(open) => !open && setNewlyCreatedKey(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              API Key Creata con Successo
            </DialogTitle>
            <DialogDescription>
              Salva questa chiave in un luogo sicuro. Non sarà più possibile visualizzarla dopo aver chiuso questa finestra.
            </DialogDescription>
          </DialogHeader>

          <Alert variant="destructive" className="my-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Attenzione!</AlertTitle>
            <AlertDescription>
              Questa è l'unica volta in cui potrai vedere la chiave completa. Assicurati di copiarla e salvarla in un posto sicuro.
            </AlertDescription>
          </Alert>

          {newlyCreatedKey && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <div className="font-medium">{newlyCreatedKey.name}</div>
              </div>

              <div className="space-y-2">
                <Label>Environment</Label>
                <div>{getEnvironmentBadge(getEnvironmentFromKey(newlyCreatedKey.key))}</div>
              </div>

              <div className="space-y-2">
                <Label>Scopes</Label>
                <div className="flex flex-wrap gap-1">
                  {newlyCreatedKey.scopes.map((scope) => (
                    <Badge key={scope} variant="outline">
                      {scope}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Chiave API</Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm bg-slate-100 px-3 py-2 rounded overflow-x-auto">
                    {newlyCreatedKey.key}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyKey(newlyCreatedKey.key)}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copia
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setNewlyCreatedKey(null)}>
              Ho Salvato la Chiave
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!keyToRevoke} onOpenChange={(open) => !open && setKeyToRevoke(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conferma Revoca API Key</DialogTitle>
            <DialogDescription>
              Sei sicuro di voler revocare questa API key? L'operazione non può essere annullata.
            </DialogDescription>
          </DialogHeader>

          {keyToRevoke && (
            <div className="space-y-2 my-4">
              <div className="text-sm">
                <span className="font-medium">Nome:</span> {keyToRevoke.name}
              </div>
              <div className="text-sm">
                <span className="font-medium">Chiave:</span>{' '}
                <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                  {keyToRevoke.key}
                </code>
              </div>
            </div>
          )}

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Attenzione</AlertTitle>
            <AlertDescription>
              Dopo la revoca, tutti i sistemi che utilizzano questa chiave non potranno più accedere alle API.
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setKeyToRevoke(null)}
              disabled={revokeMutation.isPending}
            >
              Annulla
            </Button>
            <Button
              variant="destructive"
              onClick={() => keyToRevoke && revokeMutation.mutate(keyToRevoke.id)}
              disabled={revokeMutation.isPending}
            >
              {revokeMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Revoca...
                </>
              ) : (
                'Revoca API Key'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
