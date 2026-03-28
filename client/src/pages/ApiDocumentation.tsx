
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Copy, CheckCircle2, AlertTriangle, Key, Code, Terminal, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ApiKey {
  id: number;
  key: string;
  name: string;
  scopes: string[];
  isActive: boolean;
}

export default function ApiDocumentation() {
  const { toast } = useToast();
  const [selectedKey, setSelectedKey] = useState<ApiKey | null>(null);
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);

  const { data: apiKeysData } = useQuery({
    queryKey: ['/api/api-keys'],
    queryFn: async () => {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/api-keys', {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch API keys');
      return await response.json() as { apiKeys: ApiKey[] };
    },
  });

  const apiKeys = apiKeysData?.apiKeys || [];
  const activeKeys = apiKeys.filter(key => key.isActive);

  useEffect(() => {
    if (activeKeys.length > 0 && !selectedKey) {
      setSelectedKey(activeKeys[0]);
    }
  }, [activeKeys, selectedKey]);

  const baseUrl = window.location.origin;

  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedEndpoint(label);
    setTimeout(() => setCopiedEndpoint(null), 2000);
    toast({
      title: "Copiato!",
      description: `${label} copiato negli appunti`,
    });
  };

  const endpoints = [
    {
      name: "Get All Marketing Leads",
      method: "GET",
      path: "/api/external/marketing-leads",
      scopes: ["marketing_leads:read"],
      description: "Recupera tutti i lead marketing con paginazione e filtri opzionali",
      params: [
        { name: "page", type: "number", optional: true, description: "Numero pagina (default: 1)" },
        { name: "limit", type: "number", optional: true, description: "Elementi per pagina (default: 100, max: 1000)" },
        { name: "source", type: "string", optional: true, description: "Filtra per fonte (es: 'facebook', 'google')" },
        { name: "campaign", type: "string", optional: true, description: "Filtra per campagna" },
        { name: "since", type: "date", optional: true, description: "Data minima (YYYY-MM-DD)" },
        { name: "fields", type: "string", optional: true, description: "Campi da includere (es: 'id,email,phone')" },
        { name: "format", type: "string", optional: true, description: "'json' o 'csv'" }
      ]
    },
    {
      name: "Get Single Marketing Lead",
      method: "GET",
      path: "/api/external/marketing-leads/:id",
      scopes: ["marketing_leads:read"],
      description: "Recupera un singolo lead marketing per ID",
      params: []
    },
    {
      name: "Get Marketing Leads Statistics",
      method: "GET",
      path: "/api/external/marketing-leads/stats",
      scopes: ["marketing_leads:read"],
      description: "Ottieni statistiche aggregate sui lead marketing",
      params: [
        { name: "days", type: "number", optional: true, description: "Ultimi N giorni (default: 30)" }
      ]
    }
  ];

  const generateCurlExample = (endpoint: any) => {
    if (!selectedKey) return '';
    
    let url = `${baseUrl}${endpoint.path}`;
    
    if (endpoint.params.length > 0) {
      const exampleParams: string[] = [];
      endpoint.params.forEach((param: any) => {
        if (param.name === 'page') exampleParams.push('page=1');
        else if (param.name === 'limit') exampleParams.push('limit=10');
        else if (param.name === 'source') exampleParams.push('source=facebook');
        else if (param.name === 'campaign') exampleParams.push('campaign=patrimonio');
      });
      if (exampleParams.length > 0) {
        url += `?${exampleParams.join('&')}`;
      }
    }

    return `curl "${url}" \\
  -H "X-API-Key: ${selectedKey.key}" \\
  -H "Content-Type: application/json"`;
  };

  const generateJavascriptExample = (endpoint: any) => {
    if (!selectedKey) return '';
    
    let url = `${baseUrl}${endpoint.path}`;
    
    if (endpoint.params.length > 0) {
      const exampleParams: string[] = [];
      endpoint.params.forEach((param: any) => {
        if (param.name === 'page') exampleParams.push('page=1');
        else if (param.name === 'limit') exampleParams.push('limit=10');
        else if (param.name === 'source') exampleParams.push('source=facebook');
        else if (param.name === 'campaign') exampleParams.push('campaign=patrimonio');
      });
      if (exampleParams.length > 0) {
        url += `?${exampleParams.join('&')}`;
      }
    }

    return `fetch('${url}', {
  method: '${endpoint.method}',
  headers: {
    'X-API-Key': '${selectedKey.key}',
    'Content-Type': 'application/json'
  }
})
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error(err));`;
  };

  const generatePythonExample = (endpoint: any) => {
    if (!selectedKey) return '';
    
    let url = `${baseUrl}${endpoint.path}`;
    
    if (endpoint.params.length > 0) {
      const exampleParams: string[] = [];
      endpoint.params.forEach((param: any) => {
        if (param.name === 'page') exampleParams.push('page=1');
        else if (param.name === 'limit') exampleParams.push('limit=10');
        else if (param.name === 'source') exampleParams.push('source=facebook');
        else if (param.name === 'campaign') exampleParams.push('campaign=patrimonio');
      });
      if (exampleParams.length > 0) {
        url += `?${exampleParams.join('&')}`;
      }
    }

    return `import requests

url = "${url}"
headers = {
    "X-API-Key": "${selectedKey.key}",
    "Content-Type": "application/json"
}

response = requests.get(url, headers=headers)
data = response.json()
print(data)`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Documentazione API</h1>
        <p className="text-muted-foreground">
          Guida completa per integrare le API con esempi aggiornati in tempo reale
        </p>
      </div>

      {/* API Key Selector */}
      {activeKeys.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Seleziona API Key
            </CardTitle>
            <CardDescription>
              Gli esempi di codice verranno aggiornati automaticamente con la chiave selezionata
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {activeKeys.map((key) => (
                <Button
                  key={key.id}
                  variant={selectedKey?.id === key.id ? "default" : "outline"}
                  onClick={() => setSelectedKey(key)}
                  className="flex items-center gap-2"
                >
                  {selectedKey?.id === key.id && <CheckCircle2 className="h-4 w-4" />}
                  {key.name}
                  <Badge variant="secondary" className="ml-1">
                    {key.scopes.length} scopes
                  </Badge>
                </Button>
              ))}
            </div>
            {selectedKey && (
              <div className="mt-4 p-3 bg-muted rounded-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Chiave selezionata:</p>
                    <code className="text-xs">{selectedKey.key}</code>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(selectedKey.key, "API Key")}
                  >
                    {copiedEndpoint === "API Key" ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground">Scopes disponibili:</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedKey.scopes.map(scope => (
                      <Badge key={scope} variant="outline" className="text-xs">
                        {scope}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Nessuna API Key disponibile</AlertTitle>
          <AlertDescription>
            Crea prima una API Key nella sezione "API Keys" del pannello di amministrazione.
          </AlertDescription>
        </Alert>
      )}

      {/* Base URL */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Base URL
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-3 bg-muted rounded-md">
            <code className="text-sm font-mono">{baseUrl}</code>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(baseUrl, "Base URL")}
            >
              {copiedEndpoint === "Base URL" ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Authentication */}
      <Card>
        <CardHeader>
          <CardTitle>Autenticazione</CardTitle>
          <CardDescription>
            Come autenticare le richieste API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Tutte le richieste API richiedono autenticazione tramite API Key. Puoi passare la chiave in due modi:
          </p>
          
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium mb-2">1. Header X-API-Key (Raccomandato)</p>
              <div className="p-3 bg-muted rounded-md">
                <code className="text-xs">X-API-Key: {selectedKey?.key || 'your-api-key'}</code>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">2. Authorization Bearer Token</p>
              <div className="p-3 bg-muted rounded-md">
                <code className="text-xs">Authorization: Bearer {selectedKey?.key || 'your-api-key'}</code>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Endpoints */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Endpoints Disponibili</h2>
        
        {endpoints.map((endpoint, index) => {
          const hasRequiredScope = selectedKey?.scopes.some(scope => 
            endpoint.scopes.includes(scope)
          );

          return (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {endpoint.name}
                      <Badge variant={endpoint.method === 'GET' ? 'default' : 'secondary'}>
                        {endpoint.method}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {endpoint.description}
                    </CardDescription>
                  </div>
                  {!hasRequiredScope && selectedKey && (
                    <Badge variant="destructive" className="ml-2">
                      Scope mancante
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-2 mt-3">
                  <code className="text-sm bg-muted px-2 py-1 rounded">
                    {endpoint.path}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(`${baseUrl}${endpoint.path}`, `Endpoint ${index}`)}
                  >
                    {copiedEndpoint === `Endpoint ${index}` ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {endpoint.scopes.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground mb-1">Scopes richiesti:</p>
                    <div className="flex flex-wrap gap-1">
                      {endpoint.scopes.map(scope => (
                        <Badge key={scope} variant="outline" className="text-xs">
                          {scope}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardHeader>
              
              <CardContent>
                {/* Parameters */}
                {endpoint.params.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold mb-2">Parametri</h4>
                    <div className="space-y-2">
                      {endpoint.params.map((param, pIndex) => (
                        <div key={pIndex} className="flex items-start gap-3 text-sm">
                          <code className="bg-muted px-2 py-1 rounded text-xs">
                            {param.name}
                          </code>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground text-xs">{param.type}</span>
                              {param.optional && (
                                <Badge variant="outline" className="text-xs">opzionale</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{param.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Code Examples */}
                {selectedKey && hasRequiredScope && (
                  <Tabs defaultValue="curl" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="curl">
                        <Terminal className="h-4 w-4 mr-2" />
                        cURL
                      </TabsTrigger>
                      <TabsTrigger value="javascript">
                        <Code className="h-4 w-4 mr-2" />
                        JavaScript
                      </TabsTrigger>
                      <TabsTrigger value="python">
                        <Code className="h-4 w-4 mr-2" />
                        Python
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="curl" className="relative">
                      <div className="absolute top-2 right-2 z-10">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(generateCurlExample(endpoint), `cURL ${index}`)}
                        >
                          {copiedEndpoint === `cURL ${index}` ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <pre className="bg-slate-950 text-slate-50 p-4 rounded-md overflow-x-auto text-xs">
                        <code>{generateCurlExample(endpoint)}</code>
                      </pre>
                    </TabsContent>
                    
                    <TabsContent value="javascript" className="relative">
                      <div className="absolute top-2 right-2 z-10">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(generateJavascriptExample(endpoint), `JS ${index}`)}
                        >
                          {copiedEndpoint === `JS ${index}` ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <pre className="bg-slate-950 text-slate-50 p-4 rounded-md overflow-x-auto text-xs">
                        <code>{generateJavascriptExample(endpoint)}</code>
                      </pre>
                    </TabsContent>
                    
                    <TabsContent value="python" className="relative">
                      <div className="absolute top-2 right-2 z-10">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(generatePythonExample(endpoint), `Python ${index}`)}
                        >
                          {copiedEndpoint === `Python ${index}` ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <pre className="bg-slate-950 text-slate-50 p-4 rounded-md overflow-x-auto text-xs">
                        <code>{generatePythonExample(endpoint)}</code>
                      </pre>
                    </TabsContent>
                  </Tabs>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Response Format */}
      <Card>
        <CardHeader>
          <CardTitle>Formato delle Risposte</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold mb-2">Risposta di Successo (200 OK)</h4>
            <pre className="bg-slate-950 text-slate-50 p-4 rounded-md overflow-x-auto text-xs">
{`{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 100,
    "total": 150,
    "pages": 2,
    "hasNext": true,
    "hasPrev": false
  },
  "meta": {
    "timestamp": "2025-01-18T10:30:00.000Z",
    "version": "1.0"
  }
}`}
            </pre>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-2">Risposta di Errore (4xx/5xx)</h4>
            <pre className="bg-slate-950 text-slate-50 p-4 rounded-md overflow-x-auto text-xs">
{`{
  "error": "Unauthorized",
  "message": "Invalid API key",
  "statusCode": 401
}`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
