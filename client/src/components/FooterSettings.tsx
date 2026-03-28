import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Mail, Phone, MapPin, Type, Eye } from "lucide-react";

export default function FooterSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [copyrightText, setCopyrightText] = useState("");
  const [showContactInfo, setShowContactInfo] = useState(true);

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['/api/settings'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/settings');
      return response.json();
    }
  });

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
        title: "Impostazioni salvate",
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-slate-500 text-sm">Caricamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <div className="p-2 rounded-lg bg-indigo-50">
              <Mail className="h-4 w-4 text-indigo-600" />
            </div>
            Informazioni di Contatto
          </CardTitle>
          <p className="text-sm text-slate-500">
            Queste informazioni verranno visualizzate nel footer del sito
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg bg-slate-50">
            <div className="space-y-0.5">
              <Label className="text-sm text-slate-800">Mostra informazioni di contatto</Label>
              <p className="text-xs text-slate-500">
                Attiva per mostrare email, telefono e indirizzo nel footer
              </p>
            </div>
            <Switch
              checked={showContactInfo}
              onCheckedChange={setShowContactInfo}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="footer-email" className="text-xs text-slate-600 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              Email
            </Label>
            <Input
              id="footer-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="info@example.com"
              className="border-slate-200 focus:border-indigo-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="footer-phone" className="text-xs text-slate-600 flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" />
              Telefono
            </Label>
            <Input
              id="footer-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+39 02 1234 5678"
              className="border-slate-200 focus:border-indigo-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="footer-address" className="text-xs text-slate-600 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              Indirizzo (opzionale)
            </Label>
            <Input
              id="footer-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Via Example 123, Milano"
              className="border-slate-200 focus:border-indigo-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="footer-copyright" className="text-xs text-slate-600 flex items-center gap-1.5">
              <Type className="h-3.5 w-3.5" />
              Testo Copyright
            </Label>
            <Input
              id="footer-copyright"
              value={copyrightText}
              onChange={(e) => setCopyrightText(e.target.value)}
              placeholder={`© ${new Date().getFullYear()} Nome Azienda. Tutti i diritti riservati.`}
              className="border-slate-200 focus:border-indigo-300"
            />
            <p className="text-xs text-slate-400">
              Puoi usare {new Date().getFullYear()} per l'anno corrente
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {saveMutation.isPending ? 'Salvataggio...' : 'Salva Modifiche'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900 text-sm">
            <div className="p-2 rounded-lg bg-slate-100">
              <Eye className="h-4 w-4 text-slate-600" />
            </div>
            Anteprima
          </CardTitle>
          <p className="text-xs text-slate-500">Come apparira il footer nel sito</p>
        </CardHeader>
        <CardContent>
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-800 text-slate-200">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="font-bold text-white text-sm">Nome Sito</div>
              
              {showContactInfo && (
                <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-300">
                  {email && <span>{email}</span>}
                  {phone && <span>{phone}</span>}
                  {address && <span>{address}</span>}
                </div>
              )}
              
              <div className="text-xs text-slate-400">
                {copyrightText || `© ${new Date().getFullYear()} Nome Sito. Tutti i diritti riservati.`}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
