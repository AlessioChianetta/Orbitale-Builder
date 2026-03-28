import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Building2, Mail, Phone, MapPin, Clock } from "lucide-react";

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
            setSettings(prev => ({ ...prev, ...loadedSettings }));
        }
    }, [loadedSettings]);

    const mutation = useMutation({
        mutationFn: (newSettings: any) => apiRequest('PUT', '/api/settings', { key: 'contactInfo', value: newSettings }),
        onSuccess: () => {
            toast({ title: "Impostazioni salvate" });
            queryClient.invalidateQueries({ queryKey: ['/api/settings/contactInfo'] });
        },
        onError: () => toast({ title: "Errore nel salvataggio", variant: "destructive" })
    });

    const handleSave = () => {
        mutation.mutate(settings);
    };

    if (isLoading) {
        return (
            <div className="animate-pulse space-y-4">
                <div className="h-8 bg-slate-200 rounded w-1/4"></div>
                <div className="h-64 bg-slate-200 rounded"></div>
            </div>
        );
    }

    return (
        <Card className="border-0 shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900">
                    <div className="p-2 rounded-lg bg-indigo-50">
                        <Building2 className="h-4 w-4 text-indigo-600" />
                    </div>
                    Informazioni di Contatto Pubbliche
                </CardTitle>
                <p className="text-sm text-slate-500">Questi dati saranno visibili sulla pagina contatti e in altre parti del sito.</p>
            </CardHeader>
            <CardContent className="space-y-5">
                <div className="space-y-2">
                    <Label className="text-xs text-slate-600 flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5" />
                        Nome Azienda
                    </Label>
                    <Input
                        value={settings.companyName || ''}
                        onChange={e => setSettings({...settings, companyName: e.target.value})}
                        className="border-slate-200 focus:border-indigo-300"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-xs text-slate-600 flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5" />
                            Email di Contatto
                        </Label>
                        <Input
                            type="email"
                            value={settings.contactEmail || ''}
                            onChange={e => setSettings({...settings, contactEmail: e.target.value})}
                            className="border-slate-200 focus:border-indigo-300"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs text-slate-600 flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5" />
                            Telefono Principale
                        </Label>
                        <Input
                            value={settings.contactPhone || ''}
                            onChange={e => setSettings({...settings, contactPhone: e.target.value})}
                            className="border-slate-200 focus:border-indigo-300"
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label className="text-xs text-slate-600 flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        Indirizzo Sede
                    </Label>
                    <Input
                        value={settings.address || ''}
                        onChange={e => setSettings({...settings, address: e.target.value})}
                        className="border-slate-200 focus:border-indigo-300"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-xs text-slate-600 flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        Orari di Apertura (testo)
                    </Label>
                    <Input
                        value={settings.officeHours || ''}
                        onChange={e => setSettings({...settings, officeHours: e.target.value})}
                        placeholder="Es. Lun-Ven 9:00-18:00"
                        className="border-slate-200 focus:border-indigo-300"
                    />
                </div>
                <div className="flex justify-end pt-2">
                    <Button
                        onClick={handleSave}
                        disabled={mutation.isPending}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                        {mutation.isPending ? "Salvataggio..." : "Salva Impostazioni"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
