import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const initialSettings = {
    companyName: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    officeHours: '',
};

export function SettingsEditor() {
    const [settings, setSettings] = useState(initialSettings);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: loadedSettings, isLoading } = useQuery({
        queryKey: ['/api/settings/contactInfo'],
        queryFn: async () => apiRequest('GET', '/api/settings/public').then(res => res.json()),
    });

    useEffect(() => {
        if (loadedSettings) {
            // --- ECCO LA CORREZIONE ---
            // Corretto "loaded-settings" in "loadedSettings"
            setSettings(prev => ({ ...prev, ...loadedSettings }));
        }
    }, [loadedSettings]);

    const mutation = useMutation({
        mutationFn: (newSettings: any) => apiRequest('PUT', '/api/settings', { key: 'contactInfo', value: newSettings }),
        onSuccess: () => {
            toast({ title: "Impostazioni salvate!" });
            queryClient.invalidateQueries({ queryKey: ['/api/settings/contactInfo'] });
        },
        onError: () => toast({ title: "Errore nel salvataggio", variant: "destructive" })
    });

    const handleSave = () => {
        mutation.mutate(settings);
    };

    if (isLoading) return <p>Caricamento impostazioni...</p>;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Informazioni di Contatto Pubbliche</CardTitle>
                <CardDescription>Questi dati saranno visibili sulla pagina contatti e in altre parti del sito.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div><Label>Nome Azienda</Label><Input value={settings.companyName || ''} onChange={e => setSettings({...settings, companyName: e.target.value})} /></div>
                <div><Label>Email di Contatto</Label><Input type="email" value={settings.contactEmail || ''} onChange={e => setSettings({...settings, contactEmail: e.target.value})} /></div>
                <div><Label>Telefono Principale</Label><Input value={settings.contactPhone || ''} onChange={e => setSettings({...settings, contactPhone: e.target.value})} /></div>
                <div><Label>Indirizzo Sede</Label><Input value={settings.address || ''} onChange={e => setSettings({...settings, address: e.target.value})} /></div>
                <div><Label>Orari di Apertura (testo)</Label><Input value={settings.officeHours || ''} onChange={e => setSettings({...settings, officeHours: e.target.value})} placeholder="Es. Lun-Ven 9:00-18:00"/></div>
                <Button onClick={handleSave} disabled={mutation.isPending}>
                    {mutation.isPending ? "Salvataggio..." : "Salva Impostazioni"}
                </Button>
            </CardContent>
        </Card>
    );
}