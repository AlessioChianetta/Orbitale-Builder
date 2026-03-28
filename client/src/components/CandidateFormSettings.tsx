
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Save, Eye } from "lucide-react";

export function CandidateFormSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/candidate-form-settings'],
  });

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    badge: "",
    submitText: "",
    loadingText: "",
    footerText: "",
    successTitle: "",
    successDescription: ""
  });

  // Update form data when settings are loaded
  React.useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/candidate-form-settings", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Impostazioni salvate!",
        description: "Le impostazioni del form candidatura sono state aggiornate.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/candidate-form-settings'] });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Errore nel salvare le impostazioni.",
        variant: "destructive"
      });
    }
  });

  const handleSave = () => {
    saveSettingsMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Impostazioni Form Candidatura</h1>
          <p className="text-sm text-slate-600">Caricamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Impostazioni Form Candidatura</h1>
          <p className="text-sm text-slate-600">Personalizza tutti i testi del form di candidatura lead generation</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.open('/candidatura', '_blank')}>
            <Eye className="h-4 w-4 mr-2" />
            Anteprima
          </Button>
          <Button onClick={handleSave} disabled={saveSettingsMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <Save className="h-4 w-4 mr-2" />
            {saveSettingsMutation.isPending ? "Salvando..." : "Salva Impostazioni"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Header Section */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Intestazione Form</CardTitle>
            <CardDescription>Titolo e descrizione principale del form</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Titolo Principale</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Candidatura Lead Generation"
              />
            </div>
            <div>
              <Label htmlFor="description">Descrizione</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Compila il form per accedere al nostro programma esclusivo"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="badge">Badge/Etichetta</Label>
              <Input
                id="badge"
                value={formData.badge}
                onChange={(e) => handleInputChange('badge', e.target.value)}
                placeholder="Posti Limitati - Solo 20 Candidature al Mese"
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Pulsanti e Azioni</CardTitle>
            <CardDescription>Testi dei pulsanti e messaggi di stato</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="submitText">Testo Pulsante Invio</Label>
              <Input
                id="submitText"
                value={formData.submitText}
                onChange={(e) => handleInputChange('submitText', e.target.value)}
                placeholder="Invia Candidatura"
              />
            </div>
            <div>
              <Label htmlFor="loadingText">Testo Durante Invio</Label>
              <Input
                id="loadingText"
                value={formData.loadingText}
                onChange={(e) => handleInputChange('loadingText', e.target.value)}
                placeholder="Invio candidatura in corso..."
              />
            </div>
            <div>
              <Label htmlFor="footerText">Testo Footer</Label>
              <Input
                id="footerText"
                value={formData.footerText}
                onChange={(e) => handleInputChange('footerText', e.target.value)}
                placeholder="La tua candidatura verrà esaminata entro 48 ore"
              />
            </div>
          </CardContent>
        </Card>

        {/* Success Messages */}
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Messaggi di Successo</CardTitle>
            <CardDescription>Messaggi mostrati dopo l'invio della candidatura</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="successTitle">Titolo Successo</Label>
              <Input
                id="successTitle"
                value={formData.successTitle}
                onChange={(e) => handleInputChange('successTitle', e.target.value)}
                placeholder="Candidatura Inviata con Successo!"
              />
            </div>
            <div>
              <Label htmlFor="successDescription">Descrizione Successo</Label>
              <Textarea
                id="successDescription"
                value={formData.successDescription}
                onChange={(e) => handleInputChange('successDescription', e.target.value)}
                placeholder="Grazie per il tuo interesse. Il nostro team esaminerà la tua candidatura e ti contatterà entro 48 ore."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Anteprima Impostazioni</CardTitle>
          <CardDescription>Visualizza come apparirà il form con le impostazioni attuali</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border border-slate-200 rounded-lg p-6 bg-slate-50">
            <div className="text-center space-y-4">
              <h3 className="text-2xl font-bold text-slate-800">{formData.title || "Candidatura Lead Generation"}</h3>
              <p className="text-slate-600">{formData.description || "Compila il form per accedere al nostro programma esclusivo"}</p>
              <div className="inline-block">
                <span className="bg-indigo-600 text-white px-3 py-1 rounded text-sm">
                  {formData.badge || "Posti Limitati - Solo 20 Candidature al Mese"}
                </span>
              </div>
              <div className="pt-4">
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  {formData.submitText || "Invia Candidatura"}
                </Button>
                <p className="text-xs text-slate-600 mt-2">
                  {formData.footerText || "La tua candidatura verrà esaminata entro 48 ore"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CandidateFormSettings;
