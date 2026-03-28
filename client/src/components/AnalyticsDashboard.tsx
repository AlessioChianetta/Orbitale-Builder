import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Switch } from './ui/switch';
import { 
  BarChart3, 
  Eye, 
  Mouse, 
  Calendar,
  Download,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  TestTube,
  Target,
  Activity,
  Globe,
  TrendingUp
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface RouteAnalytics {
  id: string;
  route: string;
  name: string;
  pageViews: number;
  uniqueVisitors: number;
  avgTimeOnPage: number;
  bounceRate: number;
  isActive: boolean;
  facebookPixelEvents: Array<{
    eventName: string;
    eventData?: any;
    isActive: boolean;
  }>;
  customEvents: Array<{
    name: string;
    description: string;
    triggerCondition: string;
    isActive: boolean;
  }>;
}

interface AnalyticsSummary {
  totalPageViews: number;
  totalUniqueVisitors: number;
  avgSessionDuration: number;
  topPerformingRoutes: Array<{
    route: string;
    views: number;
    conversionRate: number;
  }>;
  recentActivity: Array<{
    timestamp: string;
    route: string;
    event: string;
    data?: any;
  }>;
}

export function AnalyticsDashboard() {
  const [selectedRoute, setSelectedRoute] = useState<RouteAnalytics | null>(null);
  const [isEditingRoute, setIsEditingRoute] = useState(false);
  const [newEventName, setNewEventName] = useState('');
  const [newEventData, setNewEventData] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch analytics summary
  const { data: analyticsSummary, isLoading: isLoadingSummary } = useQuery<AnalyticsSummary>({
    queryKey: ['/api/analytics/summary'],
  });

  // Fetch route analytics
  const { data: routeAnalytics, isLoading: isLoadingRoutes } = useQuery<RouteAnalytics[]>({
    queryKey: ['/api/analytics/routes'],
  });

  // Fetch available routes dynamically (pages, builder-pages, landing-pages)
  const { data: availableRoutes, isLoading: isLoadingAvailableRoutes } = useQuery<Array<{ route: string; name: string; type: string }>>({
    queryKey: ['/api/analytics/available-routes'],
  });

  // Fetch Facebook Pixel settings
  const { data: seoSettings } = useQuery<{ facebookPixelId?: string; googleAnalyticsId?: string }>({
    queryKey: ['/api/seo-settings/public'],
  });

  // Update route mutation
  const updateRouteMutation = useMutation({
    mutationFn: async (data: Partial<RouteAnalytics>) => {
      console.log('🔧 [MUTATION] Sending data to backend:', JSON.stringify(data, null, 2));

      try {
        // Se l'ID è una stringa (route temporanea), dobbiamo prima crearla
        const isTemporaryRoute = typeof data.id === 'string' && data.id.startsWith('route-');
        
        let response;
        if (isTemporaryRoute) {
          console.log('🔧 [MUTATION] Creating new route in database...');
          response = await apiRequest('POST', '/api/analytics/routes', {
            route: data.route,
            name: data.name,
            isActive: data.isActive ?? true,
            facebookPixelEvents: data.facebookPixelEvents ?? []
          });
        } else {
          response = await apiRequest('PUT', `/api/analytics/routes/${data.id}`, data);
        }

        console.log('🔧 [MUTATION] Response status:', response.status);
        console.log('🔧 [MUTATION] Response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
          console.error('❌ [MUTATION] HTTP Error status:', response.status);
          
          let errorMessage = `HTTP ${response.status}`;
          let errorDetails = null;
          
          try {
            const errorJson = await response.json();
            console.log('🔧 [MUTATION] Error JSON:', errorJson);
            errorMessage = errorJson.message || errorJson.error || errorMessage;
            errorDetails = errorJson;
          } catch (jsonError) {
            console.log('🔧 [MUTATION] Failed to parse error as JSON, trying as text');
            try {
              const errorText = await response.text();
              console.log('🔧 [MUTATION] Error text:', errorText.substring(0, 200) + '...');
              
              if (errorText.includes('<!DOCTYPE')) {
                errorMessage = 'Server returned HTML instead of JSON (possible server error)';
              } else {
                errorMessage = errorText || errorMessage;
              }
            } catch (textError) {
              console.error('❌ [MUTATION] Failed to read error response:', textError);
              errorMessage = 'Unable to read error response';
            }
          }
          
          console.error('❌ [MUTATION] Final error message:', errorMessage);
          throw new Error(errorMessage);
        }

        // Parse successful response
        let result;
        try {
          result = await response.json();
          console.log('✅ [MUTATION] Backend response:', JSON.stringify(result, null, 2));
        } catch (parseError) {
          console.error('❌ [MUTATION] Failed to parse success response as JSON:', parseError);
          throw new Error('Server returned invalid JSON response');
        }

        // Handle new response structure
        if (result.success === true && result.data) {
          console.log('✅ [MUTATION] Success response with data:', result.action);
          return result.data;
        } else if (result.success === false) {
          console.error('❌ [MUTATION] Backend reported failure:', result.message);
          throw new Error(result.message || 'Backend operation failed');
        } else if (result.data) {
          // Backward compatibility for old response format
          console.log('✅ [MUTATION] Legacy response format detected');
          return result.data;
        } else if (result.id) {
          // Direct route object returned
          console.log('✅ [MUTATION] Direct route object returned');
          return result;
        } else {
          console.error('❌ [MUTATION] Unexpected response format:', result);
          throw new Error('Unexpected response format from server');
        }
      } catch (error) {
        console.error('❌ [MUTATION] Request failed:', error);
        if (error instanceof Error) {
          throw error;
        } else {
          throw new Error('Unknown error occurred during mutation');
        }
      }
    },
    onSuccess: (result) => {
      console.log('✅ [MUTATION] Success - Response received:', result);
      const updatedRoute = result.data || result;
      toast({ title: "Route analytics aggiornato!" });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/routes'] });
      // Update selectedRoute with the returned data (which has the correct DB ID)
      if (selectedRoute && updatedRoute) {
        console.log('🔧 [MUTATION] Updating selectedRoute from:', selectedRoute.id, 'to:', updatedRoute.id);
        setSelectedRoute(updatedRoute);
      }
    },
    onError: (error) => {
      console.error('❌ [MUTATION] Error updating route analytics:', error);
      toast({ 
        title: "Errore", 
        description: `Impossibile aggiornare le impostazioni: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`, 
        variant: "destructive" 
      });
    }
  });

  // Add Facebook Pixel event
  const addFacebookEvent = () => {
    console.log('🔧 [ADD EVENT] Starting addFacebookEvent');
    console.log('🔧 [ADD EVENT] selectedRoute:', selectedRoute);
    console.log('🔧 [ADD EVENT] newEventName:', newEventName);
    console.log('🔧 [ADD EVENT] newEventData:', newEventData);
    console.log('🔧 [ADD EVENT] Current Facebook events on route:', selectedRoute?.facebookPixelEvents);

    if (!selectedRoute || !newEventName.trim()) {
      console.error('❌ [ADD EVENT] Missing selectedRoute or newEventName');
      return;
    }

    let eventData;
    try {
      eventData = newEventData ? JSON.parse(newEventData) : undefined;
      console.log('✅ [ADD EVENT] Parsed eventData:', eventData);
    } catch (e) {
      console.error('❌ [ADD EVENT] Invalid JSON:', e);
      toast({ 
        title: "Errore", 
        description: "JSON dei dati evento non valido", 
        variant: "destructive" 
      });
      return;
    }

    const updatedEvents = [
      ...selectedRoute.facebookPixelEvents,
      {
        eventName: newEventName.trim(),
        eventData,
        isActive: true
      }
    ];

    console.log('🔧 [ADD EVENT] Updated events array:', updatedEvents);
    const mutationData = {
      id: selectedRoute.id,
      route: selectedRoute.route,
      name: selectedRoute.name,
      pageViews: selectedRoute.pageViews,
      uniqueVisitors: selectedRoute.uniqueVisitors,
      avgTimeOnPage: selectedRoute.avgTimeOnPage,
      bounceRate: selectedRoute.bounceRate,
      isActive: selectedRoute.isActive,
      facebookPixelEvents: updatedEvents
    };

    console.log('🔧 [ADD EVENT] Full mutation data being sent:', JSON.stringify(mutationData, null, 2));
    console.log('🔧 [ADD EVENT] Mutation status before call:', {
      isLoading: updateRouteMutation.isPending,
      isError: updateRouteMutation.isError,
      error: updateRouteMutation.error
    });

    updateRouteMutation.mutate(mutationData);

    setNewEventName('');
    setNewEventData('');
  };

  // Remove Facebook Pixel event
  const removeFacebookEvent = (index: number) => {
    if (!selectedRoute) return;

    const updatedEvents = selectedRoute.facebookPixelEvents.filter((_, i) => i !== index);
    updateRouteMutation.mutate({
      id: selectedRoute.id,
      route: selectedRoute.route,
      name: selectedRoute.name,
      pageViews: selectedRoute.pageViews,
      uniqueVisitors: selectedRoute.uniqueVisitors,
      avgTimeOnPage: selectedRoute.avgTimeOnPage,
      bounceRate: selectedRoute.bounceRate,
      isActive: selectedRoute.isActive,
      facebookPixelEvents: updatedEvents
    });
  };

  // Test Facebook Pixel
  const testFacebookPixel = () => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('trackCustom', 'TestEvent_Analytics', {
        source: 'Analytics Dashboard',
        route: selectedRoute?.route || 'unknown',
        test: true,
        timestamp: new Date().toISOString()
      });
      toast({
        title: "Test Facebook Pixel inviato",
        description: "Controlla Facebook Events Manager → Test Events per verificare.",
      });
    } else {
      toast({
        title: "Errore",
        description: "Facebook Pixel non inizializzato. Verifica le impostazioni SEO.",
        variant: "destructive"
      });
    }
  };

  if (isLoadingSummary || isLoadingRoutes || isLoadingAvailableRoutes) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800">Analytics & Tracking</h2>
          <p className="text-sm text-slate-600">Monitora e configura il tracking per ogni route del sito</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={testFacebookPixel} size="sm" className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
            <TestTube className="w-4 h-4" />
            Test Facebook Pixel
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600">Page Views Totali</p>
                <p className="text-2xl font-bold text-slate-800">{analyticsSummary?.totalPageViews?.toLocaleString() || '0'}</p>
              </div>
              <div className="p-2 bg-indigo-50 rounded-lg">
                <Eye className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600">Visitatori Unici</p>
                <p className="text-2xl font-bold text-slate-800">{analyticsSummary?.totalUniqueVisitors?.toLocaleString() || '0'}</p>
              </div>
              <div className="p-2 bg-emerald-50 rounded-lg">
                <Mouse className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600">Durata Media Sessione</p>
                <p className="text-2xl font-bold text-slate-800">{Math.round((analyticsSummary?.avgSessionDuration || 0) / 60)}m</p>
              </div>
              <div className="p-2 bg-violet-50 rounded-lg">
                <Calendar className="w-5 h-5 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600">Route Tracciati</p>
                <p className="text-2xl font-bold text-slate-800">{routeAnalytics?.length || 0}</p>
              </div>
              <div className="p-2 bg-amber-50 rounded-lg">
                <Globe className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="routes" className="w-full">
        <TabsList>
          <TabsTrigger value="routes">Route Analytics</TabsTrigger>
          <TabsTrigger value="events" data-value="events">Eventi & Tracking</TabsTrigger>
          <TabsTrigger value="realtime">Tempo Reale</TabsTrigger>
        </TabsList>

        <TabsContent value="routes" className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Route del Sito</CardTitle>
                <Badge variant="secondary">
                  Facebook Pixel: {seoSettings?.facebookPixelId ? 'Configurato' : 'Non configurato'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Route</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Page Views</TableHead>
                    <TableHead>Visitatori Unici</TableHead>
                    <TableHead>Tempo Medio</TableHead>
                    <TableHead>Eventi FB</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {availableRoutes?.map((availableRoute, index) => {
                    const routeData = routeAnalytics?.find(r => r.route === availableRoute.route) || {
                      id: `route-${index}`,
                      route: availableRoute.route,
                      name: availableRoute.name,
                      pageViews: 0,
                      uniqueVisitors: 0,
                      avgTimeOnPage: 0,
                      bounceRate: 0,
                      isActive: true,
                      facebookPixelEvents: [],
                      customEvents: []
                    };

                    return (
                      <TableRow key={routeData.id}>
                        <TableCell>
                          <code className="text-sm bg-slate-100 px-2 py-1 rounded">
                            {routeData.route}
                          </code>
                        </TableCell>
                        <TableCell className="font-medium">{routeData.name}</TableCell>
                        <TableCell>{routeData.pageViews.toLocaleString()}</TableCell>
                        <TableCell>{routeData.uniqueVisitors.toLocaleString()}</TableCell>
                        <TableCell>{Math.round(routeData.avgTimeOnPage / 60)}m</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant={routeData.facebookPixelEvents.length > 0 ? "default" : "outline"}>
                              {routeData.facebookPixelEvents.length} eventi
                            </Badge>
                            {routeData.facebookPixelEvents.length > 0 && (
                              <div className="w-2 h-2 bg-green-500 rounded-full" title="Eventi configurati" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={routeData.isActive ? 'default' : 'secondary'}>
                            {routeData.isActive ? 'Attivo' : 'Inattivo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedRoute(routeData);
                              setIsEditingRoute(true);
                              // Cambia automaticamente alla tab "events"
                              const tabsTrigger = document.querySelector('[data-value="events"]') as HTMLElement;
                              if (tabsTrigger) {
                                tabsTrigger.click();
                              }
                            }}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Configura
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          {selectedRoute && isEditingRoute ? (
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-indigo-500" />
                    Configura Eventi per: {selectedRoute.name}
                  </CardTitle>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditingRoute(false);
                      setSelectedRoute(null);
                    }}
                  >
                    Chiudi
                  </Button>
                </div>
                <p className="text-sm text-slate-600 mt-2">
                  Route: <code className="bg-slate-100 px-2 py-1 rounded text-xs">{selectedRoute.route}</code>
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Route Status */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Tracking Attivo</h4>
                    <p className="text-sm text-slate-600">
                      Abilita il tracking analytics per questo route
                    </p>
                  </div>
                  <Switch
                    checked={selectedRoute.isActive}
                    onCheckedChange={(checked) => {
                      updateRouteMutation.mutate({
                        id: selectedRoute.id,
                        isActive: checked
                      });
                    }}
                  />
                </div>

                {/* Facebook Pixel Events */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold">Eventi Facebook Pixel</h4>
                    <Button onClick={testFacebookPixel} size="sm" variant="outline">
                      <TestTube className="w-4 h-4 mr-2" />
                      Test Pixel
                    </Button>
                  </div>

                  {/* Existing Events */}
                  {selectedRoute.facebookPixelEvents.map((event, index) => (
                    <div key={index} className="flex gap-2 items-start p-3 border rounded-md bg-blue-50">
                      <div className="flex-1 space-y-2">
                        <div className="font-medium">{event.eventName}</div>
                        {event.eventData && (
                          <pre className="text-xs bg-white p-2 rounded border">
                            {JSON.stringify(event.eventData, null, 2)}
                          </pre>
                        )}
                        <Badge variant={event.isActive ? 'default' : 'secondary'}>
                          {event.isActive ? 'Attivo' : 'Inattivo'}
                        </Badge>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeFacebookEvent(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  {/* Add New Event */}
                  <div className="space-y-4 p-4 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50/50">
                    <div className="flex items-center gap-2">
                      <Plus className="w-5 h-5 text-blue-600" />
                      <h5 className="font-semibold text-blue-900">Aggiungi Nuovo Evento Facebook Pixel</h5>
                    </div>

                    <div className="bg-white p-3 rounded border">
                      <Label className="text-sm font-medium">Nome Evento *</Label>
                      <Input
                        value={newEventName}
                        onChange={(e) => setNewEventName(e.target.value)}
                        placeholder="es: ViewContent, Purchase, Lead"
                        className="mt-1"
                      />
                      <p className="text-xs text-slate-600 mt-1">
                        Usa eventi Facebook standard per migliori performance
                      </p>
                    </div>

                    <div className="bg-white p-3 rounded border">
                      <Label className="text-sm font-medium">Dati Evento (JSON) - Opzionale</Label>
                      <Textarea
                        value={newEventData}
                        onChange={(e) => setNewEventData(e.target.value)}
                        placeholder='{"value": 100, "currency": "EUR", "content_name": "Servizio Premium"}'
                        rows={3}
                        className="mt-1 font-mono text-xs"
                      />
                      <p className="text-xs text-slate-600 mt-1">
                        Parametri aggiuntivi per l'evento (formato JSON valido)
                      </p>
                    </div>

                    <Button 
                      onClick={addFacebookEvent} 
                      disabled={!newEventName.trim()}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Aggiungi Evento
                    </Button>
                  </div>

                  {/* Predefined Events */}
                  <div className="space-y-2">
                    <h5 className="font-medium">Eventi Predefiniti Comuni</h5>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        'ViewContent',
                        'AddToCart', 
                        'Purchase',
                        'Lead',
                        'CompleteRegistration',
                        'Contact',
                        'Search',
                        'Subscribe'
                      ].map(eventName => (
                        <Button
                          key={eventName}
                          variant="outline"
                          size="sm"
                          onClick={() => setNewEventName(eventName)}
                        >
                          {eventName}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-6 text-center">
                <Target className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <h3 className="text-xl font-semibold mb-2 text-slate-800">Come configurare gli eventi di tracking</h3>
                <div className="space-y-4 text-left max-w-2xl mx-auto">
                  <div className="bg-slate-50 p-4 rounded-lg border-l-4 border-indigo-400">
                    <h4 className="font-semibold text-slate-800 mb-2">Passo 1: Seleziona un Route</h4>
                    <p className="text-slate-600 text-sm">
                      Torna alla tab <strong>"Route Analytics"</strong> e clicca il pulsante <strong>"Configura"</strong> accanto al route che vuoi tracciare.
                    </p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-lg border-l-4 border-emerald-400">
                    <h4 className="font-semibold text-slate-800 mb-2">Passo 2: Configura Eventi Facebook Pixel</h4>
                    <p className="text-slate-600 text-sm">
                      Potrai aggiungere eventi come <code>ViewContent</code>, <code>Purchase</code>, <code>Lead</code> che si attiveranno quando gli utenti visitano quella pagina.
                    </p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-lg border-l-4 border-violet-400">
                    <h4 className="font-semibold text-slate-800 mb-2">Passo 3: Testa il Tracking</h4>
                    <p className="text-slate-600 text-sm">
                      Usa il pulsante <strong>"Test Pixel"</strong> per verificare che Facebook riceva correttamente gli eventi.
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <Button 
                    onClick={() => {
                      // Torna alla tab routes
                      const routesTab = document.querySelector('[value="routes"]') as HTMLElement;
                      if (routesTab) routesTab.click();
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Vai a Route Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="realtime" className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Attività in Tempo Reale
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analyticsSummary?.recentActivity?.slice(0, 10).map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <div>
                        <div className="font-medium">{activity.event}</div>
                        <div className="text-sm text-slate-600">
                          {activity.route} • {new Date(activity.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    {activity.data && (
                      <Badge variant="outline">
                        {typeof activity.data === 'object' ? 'Con dati' : activity.data}
                      </Badge>
                    )}
                  </div>
                )) || (
                  <div className="text-center py-8 text-slate-600">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Nessuna attività recente</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}