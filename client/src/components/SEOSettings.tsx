import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Globe, Search, BarChart3, Code, AlertCircle, CheckCircle, User } from "lucide-react";
import type { GlobalSeoSettings, InsertGlobalSeoSettings } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export default function SEOSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<Partial<InsertGlobalSeoSettings>>({});
  
  const { data: settings, isLoading } = useQuery<GlobalSeoSettings | null>({
    queryKey: ['/api/admin/global-seo-settings'],
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        ...settings,
        faviconUrl: settings.faviconUrl || '',
        favicon16Url: settings.favicon16Url || '',
        favicon32Url: settings.favicon32Url || '',
        favicon96Url: settings.favicon96Url || '',
        appleTouchIconUrl: settings.appleTouchIconUrl || '',
        androidChrome192Url: settings.androidChrome192Url || '',
        androidChrome512Url: settings.androidChrome512Url || ''
      });
    }
  }, [settings]);

  const { data: user } = useQuery({
    queryKey: ['/api/auth/me'],
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<InsertGlobalSeoSettings>) => {
      const method = settings?.id ? 'PUT' : 'POST';
      const dataWithTenant = {
        ...data,
        tenantId: user?.tenantId
      };
      const response = await apiRequest(method, `/api/admin/global-seo-settings`, dataWithTenant);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Impostazioni SEO salvate",
        description: "Le impostazioni SEO sono state aggiornate con successo.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/global-seo-settings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/seo-settings/public'] });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile salvare le impostazioni SEO.",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const updateField = (field: keyof InsertGlobalSeoSettings, value: string | null) => {
    setFormData(prev => ({ ...prev, [field]: value || '' }));
  };

  const updateBooleanField = (field: keyof InsertGlobalSeoSettings, value: boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateNumberField = (field: keyof InsertGlobalSeoSettings, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value ? parseInt(value) : null }));
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="h-4 bg-slate-200 rounded w-1/2"></div>
          <div className="h-64 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="site-info" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-slate-100 p-1">
            <TabsTrigger value="site-info" className="flex items-center gap-1.5 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Globe className="h-3.5 w-3.5" />
              Sito
            </TabsTrigger>
            <TabsTrigger value="meta-tags" className="flex items-center gap-1.5 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Search className="h-3.5 w-3.5" />
              Meta Tags
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-1.5 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <BarChart3 className="h-3.5 w-3.5" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="personal-branding" className="flex items-center gap-1.5 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <User className="h-3.5 w-3.5" />
              Branding
            </TabsTrigger>
            <TabsTrigger value="technical" className="flex items-center gap-1.5 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Code className="h-3.5 w-3.5" />
              Tecnico
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center gap-1.5 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <AlertCircle className="h-3.5 w-3.5" />
              Avanzate
            </TabsTrigger>
          </TabsList>

          <TabsContent value="site-info" className="space-y-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <div className="p-2 rounded-lg bg-indigo-50">
                    <Globe className="h-4 w-4 text-indigo-600" />
                  </div>
                  Informazioni del Sito
                </CardTitle>
                <CardDescription className="text-slate-500">
                  Configura le informazioni di base del tuo sito web.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="siteName" className="text-xs text-slate-600">Nome del Sito</Label>
                    <Input
                      id="siteName"
                      value={formData.siteName || ''}
                      onChange={(e) => updateField('siteName', e.target.value)}
                      placeholder="Il mio sito web"
                      className="border-slate-200 focus:border-indigo-300"
                      data-testid="input-site-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="siteUrl" className="text-xs text-slate-600">URL del Sito</Label>
                    <Input
                      id="siteUrl"
                      value={formData.siteUrl || ''}
                      onChange={(e) => updateField('siteUrl', e.target.value)}
                      placeholder="https://example.com"
                      className="border-slate-200 focus:border-indigo-300"
                      data-testid="input-site-url"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siteDescription" className="text-xs text-slate-600">Descrizione del Sito</Label>
                  <Textarea
                    id="siteDescription"
                    value={formData.siteDescription || ''}
                    onChange={(e) => updateField('siteDescription', e.target.value)}
                    placeholder="Una breve descrizione del tuo sito web..."
                    rows={3}
                    className="border-slate-200 focus:border-indigo-300"
                    data-testid="textarea-site-description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="organizationName" className="text-xs text-slate-600">Nome Organizzazione</Label>
                    <Input
                      id="organizationName"
                      value={formData.organizationName || ''}
                      onChange={(e) => updateField('organizationName', e.target.value)}
                      placeholder="La mia azienda"
                      className="border-slate-200 focus:border-indigo-300"
                      data-testid="input-organization-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="organizationType" className="text-xs text-slate-600">Tipo Organizzazione</Label>
                    <Input
                      id="organizationType"
                      value={formData.organizationType || 'Organization'}
                      onChange={(e) => updateField('organizationType', e.target.value)}
                      placeholder="Organization, LocalBusiness, etc."
                      className="border-slate-200 focus:border-indigo-300"
                      data-testid="input-organization-type"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="meta-tags" className="space-y-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <div className="p-2 rounded-lg bg-indigo-50">
                    <Search className="h-4 w-4 text-indigo-600" />
                  </div>
                  Meta Tags di Default
                </CardTitle>
                <CardDescription className="text-slate-500">
                  Configura i meta tags che verranno usati come fallback per le pagine senza meta tags specifici.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultMetaTitle" className="text-xs text-slate-600">Titolo Default</Label>
                  <Input
                    id="defaultMetaTitle"
                    value={formData.defaultMetaTitle || ''}
                    onChange={(e) => updateField('defaultMetaTitle', e.target.value)}
                    placeholder="Il mio sito - Descrizione breve"
                    maxLength={60}
                    className="border-slate-200 focus:border-indigo-300"
                    data-testid="input-default-meta-title"
                  />
                  <p className="text-xs text-slate-400">
                    Lunghezza: {formData.defaultMetaTitle?.length || 0}/60 caratteri
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultMetaDescription" className="text-xs text-slate-600">Descrizione Default</Label>
                  <Textarea
                    id="defaultMetaDescription"
                    value={formData.defaultMetaDescription || ''}
                    onChange={(e) => updateField('defaultMetaDescription', e.target.value)}
                    placeholder="Una descrizione concisa del contenuto del sito..."
                    maxLength={160}
                    rows={3}
                    className="border-slate-200 focus:border-indigo-300"
                    data-testid="textarea-default-meta-description"
                  />
                  <p className="text-xs text-slate-400">
                    Lunghezza: {formData.defaultMetaDescription?.length || 0}/160 caratteri
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultOgImage" className="text-xs text-slate-600">Immagine Open Graph Default</Label>
                  <Input
                    id="defaultOgImage"
                    value={formData.defaultOgImage || ''}
                    onChange={(e) => updateField('defaultOgImage', e.target.value)}
                    placeholder="https://example.com/og-image.jpg"
                    className="border-slate-200 focus:border-indigo-300"
                    data-testid="input-default-og-image"
                  />
                </div>

                <Separator className="bg-slate-200" />

                <div className="space-y-4">
                  <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Favicon e Icone</h3>
                  <p className="text-xs text-slate-400">
                    Configura le icone per tutti i dispositivi e contesti (browser, iOS, Android, PWA)
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="faviconUrl" className="text-xs text-slate-600">Favicon Standard (.ico o 32x32 PNG)</Label>
                      <Input
                        id="faviconUrl"
                        value={formData.faviconUrl || ''}
                        onChange={(e) => updateField('faviconUrl', e.target.value)}
                        placeholder="https://example.com/favicon.ico"
                        className="border-slate-200 focus:border-indigo-300"
                        data-testid="input-favicon-url"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="favicon16Url" className="text-xs text-slate-600">Favicon 16x16</Label>
                      <Input
                        id="favicon16Url"
                        value={formData.favicon16Url || ''}
                        onChange={(e) => updateField('favicon16Url', e.target.value)}
                        placeholder="https://example.com/favicon-16x16.png"
                        className="border-slate-200 focus:border-indigo-300"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="favicon32Url" className="text-xs text-slate-600">Favicon 32x32</Label>
                      <Input
                        id="favicon32Url"
                        value={formData.favicon32Url || ''}
                        onChange={(e) => updateField('favicon32Url', e.target.value)}
                        placeholder="https://example.com/favicon-32x32.png"
                        className="border-slate-200 focus:border-indigo-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="favicon96Url" className="text-xs text-slate-600">Favicon 96x96</Label>
                      <Input
                        id="favicon96Url"
                        value={formData.favicon96Url || ''}
                        onChange={(e) => updateField('favicon96Url', e.target.value)}
                        placeholder="https://example.com/favicon-96x96.png"
                        className="border-slate-200 focus:border-indigo-300"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="appleTouchIconUrl" className="text-xs text-slate-600">Apple Touch Icon (180x180)</Label>
                      <Input
                        id="appleTouchIconUrl"
                        value={formData.appleTouchIconUrl || ''}
                        onChange={(e) => updateField('appleTouchIconUrl', e.target.value)}
                        placeholder="https://example.com/apple-touch-icon.png"
                        className="border-slate-200 focus:border-indigo-300"
                      />
                      <p className="text-xs text-slate-400">Per iOS (Home Screen)</p>
                    </div>
                    <div className="space-y-2"></div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="androidChrome192Url" className="text-xs text-slate-600">Android Chrome 192x192</Label>
                      <Input
                        id="androidChrome192Url"
                        value={formData.androidChrome192Url || ''}
                        onChange={(e) => updateField('androidChrome192Url', e.target.value)}
                        placeholder="https://example.com/android-chrome-192x192.png"
                        className="border-slate-200 focus:border-indigo-300"
                      />
                      <p className="text-xs text-slate-400">Per Android (Home Screen)</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="androidChrome512Url" className="text-xs text-slate-600">Android Chrome 512x512</Label>
                      <Input
                        id="androidChrome512Url"
                        value={formData.androidChrome512Url || ''}
                        onChange={(e) => updateField('androidChrome512Url', e.target.value)}
                        placeholder="https://example.com/android-chrome-512x512.png"
                        className="border-slate-200 focus:border-indigo-300"
                      />
                      <p className="text-xs text-slate-400">Per PWA e Splash Screen</p>
                    </div>
                  </div>
                </div>

                <Separator className="bg-slate-200" />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="twitterHandle" className="text-xs text-slate-600">Handle Twitter</Label>
                    <Input
                      id="twitterHandle"
                      value={formData.twitterHandle || ''}
                      onChange={(e) => updateField('twitterHandle', e.target.value)}
                      placeholder="@miosito"
                      className="border-slate-200 focus:border-indigo-300"
                      data-testid="input-twitter-handle"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="facebookAppId" className="text-xs text-slate-600">Facebook App ID</Label>
                    <Input
                      id="facebookAppId"
                      value={formData.facebookAppId || ''}
                      onChange={(e) => updateField('facebookAppId', e.target.value)}
                      placeholder="123456789"
                      className="border-slate-200 focus:border-indigo-300"
                      data-testid="input-facebook-app-id"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <div className="p-2 rounded-lg bg-indigo-50">
                    <BarChart3 className="h-4 w-4 text-indigo-600" />
                  </div>
                  Analytics e Tracking
                </CardTitle>
                <CardDescription className="text-slate-500">
                  Configura Google Analytics, Search Console e altri servizi di tracking.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="googleAnalyticsId" className="text-xs text-slate-600">Google Analytics Measurement ID</Label>
                    <Input
                      id="googleAnalyticsId"
                      value={formData.googleAnalyticsId || ''}
                      onChange={(e) => updateField('googleAnalyticsId', e.target.value)}
                      placeholder="G-XXXXXXXXXX"
                      className="border-slate-200 focus:border-indigo-300"
                      data-testid="input-google-analytics-id"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="googleTagManagerId" className="text-xs text-slate-600">Google Tag Manager ID</Label>
                    <Input
                      id="googleTagManagerId"
                      value={formData.googleTagManagerId || ''}
                      onChange={(e) => updateField('googleTagManagerId', e.target.value)}
                      placeholder="GTM-XXXXXXX"
                      className="border-slate-200 focus:border-indigo-300"
                      data-testid="input-google-tag-manager-id"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="facebookPixelId" className="text-xs text-slate-600">Facebook Pixel ID</Label>
                  <Input
                    id="facebookPixelId"
                    value={formData.facebookPixelId || ''}
                    onChange={(e) => updateField('facebookPixelId', e.target.value)}
                    placeholder="123456789012345"
                    className="border-slate-200 focus:border-indigo-300"
                    data-testid="input-facebook-pixel-id"
                  />
                  <p className="text-xs text-slate-400">
                    ID del Pixel di Facebook per tracking e conversioni su tutto il sito
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="googleSearchConsoleCode" className="text-xs text-slate-600">Codice Verifica Search Console</Label>
                  <Textarea
                    id="googleSearchConsoleCode"
                    value={formData.googleSearchConsoleCode || ''}
                    onChange={(e) => updateField('googleSearchConsoleCode', e.target.value)}
                    placeholder='<meta name="google-site-verification" content="..." />'
                    rows={3}
                    className="border-slate-200 focus:border-indigo-300 font-mono text-xs"
                    data-testid="textarea-google-search-console-code"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bingWebmasterCode" className="text-xs text-slate-600">Bing Webmaster Tools Code</Label>
                  <Input
                    id="bingWebmasterCode"
                    value={formData.bingWebmasterCode || ''}
                    onChange={(e) => updateField('bingWebmasterCode', e.target.value)}
                    placeholder="XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                    className="border-slate-200 focus:border-indigo-300"
                    data-testid="input-bing-webmaster-code"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="personal-branding" className="space-y-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <div className="p-2 rounded-lg bg-indigo-50">
                    <User className="h-4 w-4 text-indigo-600" />
                  </div>
                  Personal Branding & Schema.org Person
                </CardTitle>
                <CardDescription className="text-slate-500">
                  Configura i dati personali per apparire su Google con Knowledge Panel e rich snippets.
                  Questi dati generano automaticamente Schema.org Person markup.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg bg-slate-50">
                  <div className="space-y-0.5">
                    <Label htmlFor="enablePersonalBranding" className="text-sm text-slate-800">
                      Abilita Personal Branding
                    </Label>
                    <p className="text-xs text-slate-500">
                      Attiva Schema.org Person e ottimizzazione per ricerche del nome personale
                    </p>
                  </div>
                  <Switch
                    id="enablePersonalBranding"
                    checked={formData.enablePersonalBranding || false}
                    onCheckedChange={(checked) => updateBooleanField('enablePersonalBranding', checked)}
                  />
                </div>

                {formData.enablePersonalBranding && (
                  <>
                    <Separator className="my-6 bg-slate-200" />
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="personName" className="text-xs text-slate-600">Nome Completo *</Label>
                        <Input
                          id="personName"
                          value={formData.personName || ''}
                          onChange={(e) => updateField('personName', e.target.value)}
                          placeholder="Mario Rossi"
                          className="border-slate-200 focus:border-indigo-300"
                        />
                        <p className="text-xs text-slate-400">
                          Il nome che apparira su Google e nei risultati di ricerca
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="personJobTitle" className="text-xs text-slate-600">Titolo Professionale</Label>
                        <Input
                          id="personJobTitle"
                          value={formData.personJobTitle || ''}
                          onChange={(e) => updateField('personJobTitle', e.target.value)}
                          placeholder="Digital Marketing Expert"
                          className="border-slate-200 focus:border-indigo-300"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="personBio" className="text-xs text-slate-600">Biografia / Descrizione</Label>
                      <Textarea
                        id="personBio"
                        value={formData.personBio || ''}
                        onChange={(e) => updateField('personBio', e.target.value)}
                        placeholder="Scrivi una breve biografia professionale..."
                        rows={4}
                        className="border-slate-200 focus:border-indigo-300"
                      />
                      <p className="text-xs text-slate-400">
                        Descrizione che apparira nel Knowledge Panel di Google
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="personImage" className="text-xs text-slate-600">URL Foto Profilo</Label>
                      <Input
                        id="personImage"
                        value={formData.personImage || ''}
                        onChange={(e) => updateField('personImage', e.target.value)}
                        placeholder="https://example.com/foto-profilo.jpg"
                        className="border-slate-200 focus:border-indigo-300"
                      />
                      <p className="text-xs text-slate-400">
                        Immagine professionale per Knowledge Graph (consigliato 400x400px)
                      </p>
                    </div>

                    <Separator className="my-6 bg-slate-200" />
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="personEmail" className="text-xs text-slate-600">Email</Label>
                        <Input
                          id="personEmail"
                          type="email"
                          value={formData.personEmail || ''}
                          onChange={(e) => updateField('personEmail', e.target.value)}
                          placeholder="email@example.com"
                          className="border-slate-200 focus:border-indigo-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="personPhone" className="text-xs text-slate-600">Telefono</Label>
                        <Input
                          id="personPhone"
                          value={formData.personPhone || ''}
                          onChange={(e) => updateField('personPhone', e.target.value)}
                          placeholder="+39 123 456 7890"
                          className="border-slate-200 focus:border-indigo-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="personWebsite" className="text-xs text-slate-600">Sito Web Personale</Label>
                        <Input
                          id="personWebsite"
                          value={formData.personWebsite || ''}
                          onChange={(e) => updateField('personWebsite', e.target.value)}
                          placeholder="https://miosito.com"
                          className="border-slate-200 focus:border-indigo-300"
                        />
                      </div>
                    </div>

                    <Separator className="my-6 bg-slate-200" />
                    <div>
                      <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">Profili Social (per Knowledge Graph)</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="personLinkedIn" className="text-xs text-slate-600">LinkedIn</Label>
                          <Input
                            id="personLinkedIn"
                            value={formData.personLinkedIn || ''}
                            onChange={(e) => updateField('personLinkedIn', e.target.value)}
                            placeholder="https://linkedin.com/in/nomeutente"
                            className="border-slate-200 focus:border-indigo-300"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="personTwitter" className="text-xs text-slate-600">Twitter / X</Label>
                          <Input
                            id="personTwitter"
                            value={formData.personTwitter || ''}
                            onChange={(e) => updateField('personTwitter', e.target.value)}
                            placeholder="https://twitter.com/nomeutente"
                            className="border-slate-200 focus:border-indigo-300"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="personFacebook" className="text-xs text-slate-600">Facebook</Label>
                          <Input
                            id="personFacebook"
                            value={formData.personFacebook || ''}
                            onChange={(e) => updateField('personFacebook', e.target.value)}
                            placeholder="https://facebook.com/nomeutente"
                            className="border-slate-200 focus:border-indigo-300"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="personInstagram" className="text-xs text-slate-600">Instagram</Label>
                          <Input
                            id="personInstagram"
                            value={formData.personInstagram || ''}
                            onChange={(e) => updateField('personInstagram', e.target.value)}
                            placeholder="https://instagram.com/nomeutente"
                            className="border-slate-200 focus:border-indigo-300"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 mt-2">
                        I profili social vengono usati nel campo "sameAs" di Schema.org per collegare l'identita
                      </p>
                    </div>

                    <Separator className="my-6 bg-slate-200" />
                    <div className="space-y-2">
                      <Label htmlFor="personYearsExperience" className="text-xs text-slate-600">Anni di Esperienza</Label>
                      <Input
                        id="personYearsExperience"
                        type="number"
                        value={formData.personYearsExperience || ''}
                        onChange={(e) => updateNumberField('personYearsExperience', e.target.value)}
                        placeholder="10"
                        min="0"
                        className="border-slate-200 focus:border-indigo-300 w-32"
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {formData.enablePersonalBranding && formData.personName && (
              <Card className="border-indigo-200 bg-indigo-50/50">
                <CardHeader>
                  <CardTitle className="text-indigo-700 text-sm">
                    Anteprima Schema.org Person
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-white p-4 rounded-lg overflow-x-auto text-xs text-slate-700 border border-slate-200">
                    {JSON.stringify({
                      "@context": "https://schema.org",
                      "@type": "Person",
                      "name": formData.personName,
                      "jobTitle": formData.personJobTitle,
                      "description": formData.personBio,
                      "image": formData.personImage,
                      "email": formData.personEmail,
                      "telephone": formData.personPhone,
                      "url": formData.personWebsite,
                      "sameAs": [
                        formData.personLinkedIn,
                        formData.personTwitter,
                        formData.personFacebook,
                        formData.personInstagram
                      ].filter(Boolean)
                    }, null, 2)}
                  </pre>
                  <p className="text-xs text-indigo-600 mt-4">
                    Questo JSON-LD verra automaticamente inserito in tutte le pagine quando Personal Branding e attivo
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="technical" className="space-y-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <div className="p-2 rounded-lg bg-indigo-50">
                    <Code className="h-4 w-4 text-indigo-600" />
                  </div>
                  Impostazioni Tecniche
                </CardTitle>
                <CardDescription className="text-slate-500">
                  Configura robots.txt, canonical domains e altre impostazioni tecniche SEO.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="canonicalDomain" className="text-xs text-slate-600">Dominio Canonico</Label>
                  <Input
                    id="canonicalDomain"
                    value={formData.canonicalDomain || ''}
                    onChange={(e) => updateField('canonicalDomain', e.target.value)}
                    placeholder="https://www.example.com"
                    className="border-slate-200 focus:border-indigo-300"
                    data-testid="input-canonical-domain"
                  />
                  <p className="text-xs text-slate-400">
                    Il dominio preferito per i link canonici.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="robotsTxtCustom" className="text-xs text-slate-600">Robots.txt Personalizzato</Label>
                  <Textarea
                    id="robotsTxtCustom"
                    value={formData.robotsTxtCustom || ''}
                    onChange={(e) => updateField('robotsTxtCustom', e.target.value)}
                    placeholder="User-agent: *&#10;Disallow: /admin&#10;&#10;Sitemap: https://example.com/sitemap.xml"
                    rows={6}
                    className="border-slate-200 focus:border-indigo-300 font-mono text-xs"
                    data-testid="textarea-robots-txt"
                  />
                  <p className="text-xs text-slate-400">
                    Lascia vuoto per usare il robots.txt automatico.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <div className="p-2 rounded-lg bg-indigo-50">
                    <AlertCircle className="h-4 w-4 text-indigo-600" />
                  </div>
                  Impostazioni Avanzate
                </CardTitle>
                <CardDescription className="text-slate-500">
                  Codice personalizzato per head e altre impostazioni avanzate.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customHeadCode" className="text-xs text-slate-600">Codice Head Personalizzato</Label>
                  <Textarea
                    id="customHeadCode"
                    value={formData.customHeadCode || ''}
                    onChange={(e) => updateField('customHeadCode', e.target.value)}
                    placeholder="<script><!-- Codice personalizzato --></script>"
                    rows={8}
                    className="border-slate-200 focus:border-indigo-300 font-mono text-xs"
                    data-testid="textarea-custom-head-code"
                  />
                  <p className="text-xs text-slate-400">
                    Codice HTML che verra inserito nella sezione &lt;head&gt; di ogni pagina.
                    Usa per tracking pixels, script di terze parti, etc.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-4 pt-6">
          <Button
            type="submit"
            disabled={updateMutation.isPending}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
            data-testid="button-save-seo-settings"
          >
            {updateMutation.isPending ? 'Salvando...' : 'Salva Impostazioni'}
          </Button>
        </div>
      </form>

      {formData.googleAnalyticsId && (
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-emerald-700">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium text-sm">Google Analytics Configurato</span>
            </div>
            <p className="text-xs text-emerald-600 mt-1">
              ID: {formData.googleAnalyticsId}
            </p>
            <div className="mt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                onClick={() => {
                  if (typeof window !== 'undefined' && window.gtag) {
                    window.gtag('event', 'test_event', {
                      event_category: 'Test',
                      event_label: 'SEO Settings Page',
                      value: 1
                    });
                    toast({
                      title: "Evento di test inviato",
                      description: "Controlla Google Analytics - Realtime - Events per verificare.",
                    });
                  } else {
                    toast({
                      title: "Errore",
                      description: "Google Analytics non inizializzato.",
                      variant: "destructive"
                    });
                  }
                }}
              >
                Testa Google Analytics
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {formData.facebookPixelId && (
        <Card className="border-indigo-200 bg-indigo-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-indigo-700">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium text-sm">Facebook Pixel Configurato</span>
            </div>
            <p className="text-xs text-indigo-600 mt-1">
              ID: {formData.facebookPixelId}
            </p>
            <div className="mt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                onClick={() => {
                  if (typeof window !== 'undefined' && window.fbq) {
                    window.fbq('trackCustom', 'TestEvent', {
                      source: 'SEO Settings Page',
                      test: true,
                      timestamp: new Date().toISOString()
                    });
                    toast({
                      title: "Evento di test inviato",
                      description: "Controlla Facebook Events Manager - Test Events per verificare.",
                    });
                  } else {
                    toast({
                      title: "Errore",
                      description: "Facebook Pixel non inizializzato.",
                      variant: "destructive"
                    });
                  }
                }}
              >
                Testa Facebook Pixel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
