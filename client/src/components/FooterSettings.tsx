
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function FooterSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [copyrightText, setCopyrightText] = useState("");
  const [showContactInfo, setShowContactInfo] = useState(true);

  // Carica le impostazioni
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['/api/settings'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/settings');
      return response.json();
    }
  });

  // Effetto per impostare i valori quando i dati vengono caricati
  useEffect(() => {
    if (settingsData?.footerSettings) {
      const footer = settingsData.footerSettings;
      setEmail(footer.email || '');
      setPhone(footer.phone || '');
      setAddress(footer.address || '');
      setCopyrightText(footer.copyrightText || '');
      setShowContactInfo(footer.showContactInfo !== false);
    }
  }, [settingsData]);

  // Mutation per salvare le impostazioni
  const saveMutation = useMutation({
    mutationFn: async () => {
      const footerSettings = {
        email,
        phone,
        address,
        copyrightText,
        showContactInfo
      };

      const response = await apiRequest('PUT', '/api/settings', {
        key: 'footerSettings',
        value: footerSettings
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/settings/public'] });
      toast({
        title: "Impostazioni salvate!",
        description: "Le impostazioni del footer sono state aggiornate.",
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

  const handleSave = () => {
    saveMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Caricamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Impostazioni Footer</h1>
          <p className="text-muted-foreground">Personalizza il footer del tuo sito</p>
        </div>
        <Button onClick={handleSave} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? 'Salvataggio...' : 'Salva Modifiche'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informazioni di Contatto</CardTitle>
          <CardDescription>
            Queste informazioni verranno visualizzate nel footer del sito
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Mostra informazioni di contatto</Label>
              <p className="text-sm text-muted-foreground">
                Attiva per mostrare email, telefono e indirizzo nel footer
              </p>
            </div>
            <Switch
              checked={showContactInfo}
              onCheckedChange={setShowContactInfo}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="footer-email">Email</Label>
            <Input
              id="footer-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="info@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="footer-phone">Telefono</Label>
            <Input
              id="footer-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+39 02 1234 5678"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="footer-address">Indirizzo (opzionale)</Label>
            <Input
              id="footer-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Via Example 123, Milano"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="footer-copyright">Testo Copyright</Label>
            <Input
              id="footer-copyright"
              value={copyrightText}
              onChange={(e) => setCopyrightText(e.target.value)}
              placeholder={`© ${new Date().getFullYear()} Nome Azienda. Tutti i diritti riservati.`}
            />
            <p className="text-sm text-muted-foreground">
              Puoi usare {new Date().getFullYear()} per l'anno corrente
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Anteprima</CardTitle>
          <CardDescription>Come apparirà il footer nel sito</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-4 bg-secondary text-secondary-foreground">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="font-bold">Nome Sito</div>
              
              {showContactInfo && (
                <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
                  {email && <span>📧 {email}</span>}
                  {phone && <span>📞 {phone}</span>}
                  {address && <span>📍 {address}</span>}
                </div>
              )}
              
              <div className="text-xs text-muted-foreground">
                {copyrightText || `© ${new Date().getFullYear()} Nome Sito. Tutti i diritti riservati.`}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
