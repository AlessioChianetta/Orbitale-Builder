import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Save,
  Upload,
  Building2,
  Target,
  Briefcase,
  Award,
  Mic2,
  Plus,
  X,
  Check,
  AlertCircle,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface BrandVoiceData {
  businessInfo: {
    consultantName?: string;
    businessName?: string;
    businessDescription?: string;
    consultantBio?: string;
  };
  authority: {
    vision?: string;
    mission?: string;
    values?: string[];
    usp?: string;
    whoWeHelp?: string;
    whoWeDoNotHelp?: string;
  };
  servicesInfo: {
    services?: Array<{ name: string; description: string }>;
    method?: string;
    guarantees?: string;
  };
  credentials: {
    yearsExperience?: string;
    clientsHelped?: string;
    resultsGenerated?: string;
    softwareCreated?: string[];
    booksPublished?: string[];
    caseStudies?: Array<{ title: string; description: string }>;
  };
  voiceStyle: {
    personalTone?: string;
    contentPersonality?: string;
    targetLanguage?: string;
    neverDo?: string;
    writingExamples?: string[];
    signaturePhrases?: string[];
  };
}

const emptyData: BrandVoiceData = {
  businessInfo: {},
  authority: { values: [] },
  servicesInfo: { services: [] },
  credentials: { softwareCreated: [], booksPublished: [], caseStudies: [] },
  voiceStyle: { writingExamples: [], signaturePhrases: [] },
};

function StringListEditor({ items, onChange, placeholder }: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
}) {
  const [newItem, setNewItem] = useState("");

  const addItem = () => {
    if (newItem.trim()) {
      onChange([...items, newItem.trim()]);
      setNewItem("");
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          placeholder={placeholder}
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addItem())}
          className="border-slate-200 focus:border-indigo-300"
        />
        <Button type="button" size="sm" variant="outline" onClick={addItem} className="shrink-0">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item, i) => (
          <Badge key={i} variant="secondary" className="text-xs py-1 px-2 gap-1">
            {item}
            <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} className="ml-1 hover:text-red-500">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
}

function ServiceListEditor({ items, onChange }: {
  items: Array<{ name: string; description: string }>;
  onChange: (items: Array<{ name: string; description: string }>) => void;
}) {
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const addItem = () => {
    if (newName.trim()) {
      onChange([...items, { name: newName.trim(), description: newDesc.trim() }]);
      setNewName("");
      setNewDesc("");
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[1fr_2fr_auto] gap-2">
        <Input placeholder="Nome servizio" value={newName} onChange={(e) => setNewName(e.target.value)} className="border-slate-200 text-sm" />
        <Input placeholder="Descrizione" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="border-slate-200 text-sm" />
        <Button type="button" size="sm" variant="outline" onClick={addItem} className="shrink-0">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2 bg-slate-50 rounded-lg p-3 text-sm">
            <div className="flex-1">
              <p className="font-medium text-slate-800">{item.name}</p>
              {item.description && <p className="text-slate-500 mt-0.5">{item.description}</p>}
            </div>
            <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-500 mt-0.5">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function CaseStudyEditor({ items, onChange }: {
  items: Array<{ title: string; description: string }>;
  onChange: (items: Array<{ title: string; description: string }>) => void;
}) {
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const addItem = () => {
    if (newTitle.trim()) {
      onChange([...items, { title: newTitle.trim(), description: newDesc.trim() }]);
      setNewTitle("");
      setNewDesc("");
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[1fr_2fr_auto] gap-2">
        <Input placeholder="Titolo" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="border-slate-200 text-sm" />
        <Input placeholder="Descrizione" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="border-slate-200 text-sm" />
        <Button type="button" size="sm" variant="outline" onClick={addItem} className="shrink-0">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2 bg-slate-50 rounded-lg p-3 text-sm">
            <div className="flex-1">
              <p className="font-medium text-slate-800">{item.title}</p>
              {item.description && <p className="text-slate-500 mt-0.5">{item.description}</p>}
            </div>
            <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-500 mt-0.5">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BrandVoiceEditor() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [data, setData] = useState<BrandVoiceData>(emptyData);
  const [importOpen, setImportOpen] = useState(false);
  const [importJson, setImportJson] = useState("");
  const [importError, setImportError] = useState("");

  const { data: serverData, isLoading } = useQuery({
    queryKey: ["/api/brand-voice"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/brand-voice");
      return res.json();
    },
  });

  useEffect(() => {
    if (serverData) {
      setData({
        businessInfo: serverData.businessInfo || {},
        authority: { ...emptyData.authority, ...serverData.authority },
        servicesInfo: { ...emptyData.servicesInfo, ...serverData.servicesInfo },
        credentials: { ...emptyData.credentials, ...serverData.credentials },
        voiceStyle: { ...emptyData.voiceStyle, ...serverData.voiceStyle },
      });
    }
  }, [serverData]);

  const saveMutation = useMutation({
    mutationFn: async (brandData: BrandVoiceData) => {
      const res = await apiRequest("PUT", "/api/brand-voice", brandData);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Brand Voice salvato!", description: "Le informazioni sono state aggiornate." });
      queryClient.invalidateQueries({ queryKey: ["/api/brand-voice"] });
    },
    onError: () => {
      toast({ title: "Errore", description: "Impossibile salvare il Brand Voice.", variant: "destructive" });
    },
  });

  const importMutation = useMutation({
    mutationFn: async (jsonData: any) => {
      const res = await apiRequest("POST", "/api/brand-voice/import", jsonData);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Importazione completata!", description: "Il Brand Voice è stato importato." });
      queryClient.invalidateQueries({ queryKey: ["/api/brand-voice"] });
      setImportOpen(false);
      setImportJson("");
    },
    onError: () => {
      toast({ title: "Errore", description: "Impossibile importare il Brand Voice.", variant: "destructive" });
    },
  });

  const handleImport = () => {
    setImportError("");
    try {
      const parsed = JSON.parse(importJson);
      importMutation.mutate(parsed);
    } catch {
      setImportError("JSON non valido. Controlla il formato e riprova.");
    }
  };

  const updateField = (section: keyof BrandVoiceData, field: string, value: any) => {
    setData((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/3" />
          <div className="h-4 bg-slate-200 rounded w-2/3" />
          <div className="h-64 bg-slate-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Brand Voice</h2>
          <p className="text-slate-500 mt-1">Configura l'identità del brand per la generazione AI dei contenuti</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setImportOpen(true)} className="gap-2">
            <Upload className="h-4 w-4" />
            Importa
          </Button>
          <Button onClick={() => saveMutation.mutate(data)} disabled={saveMutation.isPending} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
            <Save className="h-4 w-4" />
            {saveMutation.isPending ? "Salvataggio..." : "Salva"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="business" className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-slate-100 p-1 rounded-xl h-auto">
          <TabsTrigger value="business" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm py-2.5">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Business</span>
          </TabsTrigger>
          <TabsTrigger value="authority" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm py-2.5">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Authority</span>
          </TabsTrigger>
          <TabsTrigger value="services" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm py-2.5">
            <Briefcase className="h-4 w-4" />
            <span className="hidden sm:inline">Servizi</span>
          </TabsTrigger>
          <TabsTrigger value="credentials" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm py-2.5">
            <Award className="h-4 w-4" />
            <span className="hidden sm:inline">Credenziali</span>
          </TabsTrigger>
          <TabsTrigger value="voice" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm py-2.5">
            <Mic2 className="h-4 w-4" />
            <span className="hidden sm:inline">Voce & Stile</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="business" className="mt-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5 text-indigo-600" />
                Informazioni Business
              </CardTitle>
              <CardDescription>Nome, descrizione e bio del consulente/azienda</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-xs font-medium text-slate-600">Nome Consulente</Label>
                  <Input
                    placeholder="Es: Alessio Chianetta"
                    value={data.businessInfo.consultantName || ""}
                    onChange={(e) => updateField("businessInfo", "consultantName", e.target.value)}
                    className="border-slate-200 focus:border-indigo-300"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-600">Nome Business</Label>
                  <Input
                    placeholder="Es: Sistema Orbitale"
                    value={data.businessInfo.businessName || ""}
                    onChange={(e) => updateField("businessInfo", "businessName", e.target.value)}
                    className="border-slate-200 focus:border-indigo-300"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label className="text-xs font-medium text-slate-600">Descrizione Business</Label>
                  <Textarea
                    placeholder="Descrizione completa del business..."
                    value={data.businessInfo.businessDescription || ""}
                    onChange={(e) => updateField("businessInfo", "businessDescription", e.target.value)}
                    rows={3}
                    className="border-slate-200 focus:border-indigo-300"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-600">Bio Consulente</Label>
                  <Textarea
                    placeholder="Chi sei, cosa fai, la tua storia..."
                    value={data.businessInfo.consultantBio || ""}
                    onChange={(e) => updateField("businessInfo", "consultantBio", e.target.value)}
                    rows={3}
                    className="border-slate-200 focus:border-indigo-300"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="authority" className="mt-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-indigo-600" />
                Authority & Posizionamento
              </CardTitle>
              <CardDescription>Vision, mission, valori e USP</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-xs font-medium text-slate-600">Vision</Label>
                  <Textarea
                    placeholder="Come vedi il futuro del tuo settore..."
                    value={data.authority.vision || ""}
                    onChange={(e) => updateField("authority", "vision", e.target.value)}
                    rows={3}
                    className="border-slate-200 focus:border-indigo-300"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-600">Mission</Label>
                  <Textarea
                    placeholder="La missione concreta della tua azienda..."
                    value={data.authority.mission || ""}
                    onChange={(e) => updateField("authority", "mission", e.target.value)}
                    rows={3}
                    className="border-slate-200 focus:border-indigo-300"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-600">Valori</Label>
                <StringListEditor
                  items={data.authority.values || []}
                  onChange={(v) => updateField("authority", "values", v)}
                  placeholder="Aggiungi un valore..."
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-600">Unique Selling Proposition (USP)</Label>
                <Textarea
                  placeholder="Cosa ti rende unico rispetto ai competitor..."
                  value={data.authority.usp || ""}
                  onChange={(e) => updateField("authority", "usp", e.target.value)}
                  rows={3}
                  className="border-slate-200 focus:border-indigo-300"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-xs font-medium text-slate-600">Chi Aiutiamo</Label>
                  <Textarea
                    placeholder="Descrivi il tuo cliente ideale..."
                    value={data.authority.whoWeHelp || ""}
                    onChange={(e) => updateField("authority", "whoWeHelp", e.target.value)}
                    rows={4}
                    className="border-slate-200 focus:border-indigo-300"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-600">Chi NON Aiutiamo</Label>
                  <Textarea
                    placeholder="Clienti che non sono il tuo target..."
                    value={data.authority.whoWeDoNotHelp || ""}
                    onChange={(e) => updateField("authority", "whoWeDoNotHelp", e.target.value)}
                    rows={4}
                    className="border-slate-200 focus:border-indigo-300"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="mt-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-lg flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-indigo-600" />
                Cosa Facciamo
              </CardTitle>
              <CardDescription>Servizi offerti, metodo e garanzie</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div>
                <Label className="text-xs font-medium text-slate-600">Servizi Offerti</Label>
                <ServiceListEditor
                  items={data.servicesInfo.services || []}
                  onChange={(s) => updateField("servicesInfo", "services", s)}
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-600">Metodo / Come Lavoriamo</Label>
                <Textarea
                  placeholder="Descrivi il tuo metodo di lavoro, le fasi..."
                  value={data.servicesInfo.method || ""}
                  onChange={(e) => updateField("servicesInfo", "method", e.target.value)}
                  rows={5}
                  className="border-slate-200 focus:border-indigo-300"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-600">Garanzie</Label>
                <Textarea
                  placeholder="Le garanzie che offri ai tuoi clienti..."
                  value={data.servicesInfo.guarantees || ""}
                  onChange={(e) => updateField("servicesInfo", "guarantees", e.target.value)}
                  rows={3}
                  className="border-slate-200 focus:border-indigo-300"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="credentials" className="mt-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="h-5 w-5 text-indigo-600" />
                Credenziali & Risultati
              </CardTitle>
              <CardDescription>Esperienza, software, libri e case studies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label className="text-xs font-medium text-slate-600">Anni di Esperienza</Label>
                  <Input
                    placeholder="Es: 10+"
                    value={data.credentials.yearsExperience || ""}
                    onChange={(e) => updateField("credentials", "yearsExperience", e.target.value)}
                    className="border-slate-200 focus:border-indigo-300"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-600">Clienti Aiutati</Label>
                  <Input
                    placeholder="Es: 200+"
                    value={data.credentials.clientsHelped || ""}
                    onChange={(e) => updateField("credentials", "clientsHelped", e.target.value)}
                    className="border-slate-200 focus:border-indigo-300"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-600">Risultati Generati</Label>
                  <Input
                    placeholder="Es: €10M+ fatturato"
                    value={data.credentials.resultsGenerated || ""}
                    onChange={(e) => updateField("credentials", "resultsGenerated", e.target.value)}
                    className="border-slate-200 focus:border-indigo-300"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-600">Software Creati</Label>
                <StringListEditor
                  items={data.credentials.softwareCreated || []}
                  onChange={(s) => updateField("credentials", "softwareCreated", s)}
                  placeholder="Aggiungi un software..."
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-600">Libri Pubblicati</Label>
                <StringListEditor
                  items={data.credentials.booksPublished || []}
                  onChange={(b) => updateField("credentials", "booksPublished", b)}
                  placeholder="Aggiungi un libro..."
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-600">Case Studies</Label>
                <CaseStudyEditor
                  items={data.credentials.caseStudies || []}
                  onChange={(cs) => updateField("credentials", "caseStudies", cs)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="voice" className="mt-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-lg flex items-center gap-2">
                <Mic2 className="h-5 w-5 text-indigo-600" />
                Voce & Stile Personale
              </CardTitle>
              <CardDescription>Come comunichi e come vuoi che l'AI scriva per te</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-xs font-medium text-slate-600">Tono Personale</Label>
                  <Textarea
                    placeholder="Es: Diretto e provocatorio, uso spesso l'ironia..."
                    value={data.voiceStyle.personalTone || ""}
                    onChange={(e) => updateField("voiceStyle", "personalTone", e.target.value)}
                    rows={3}
                    className="border-slate-200 focus:border-indigo-300"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-600">Personalità del Contenuto</Label>
                  <Textarea
                    placeholder="Es: Voglio che chi legge si senta capito..."
                    value={data.voiceStyle.contentPersonality || ""}
                    onChange={(e) => updateField("voiceStyle", "contentPersonality", e.target.value)}
                    rows={3}
                    className="border-slate-200 focus:border-indigo-300"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-600">Linguaggio del Target</Label>
                <Textarea
                  placeholder="Es: Il mio target sono imprenditori, parlano di MRR, KPI, churn rate..."
                  value={data.voiceStyle.targetLanguage || ""}
                  onChange={(e) => updateField("voiceStyle", "targetLanguage", e.target.value)}
                  rows={3}
                  className="border-slate-200 focus:border-indigo-300"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-600">Cosa NON Fare Mai</Label>
                <Textarea
                  placeholder="Es: Mai iniziare con 'In un mondo dove...', evitare il tono motivazionale americano..."
                  value={data.voiceStyle.neverDo || ""}
                  onChange={(e) => updateField("voiceStyle", "neverDo", e.target.value)}
                  rows={3}
                  className="border-slate-200 focus:border-indigo-300"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-600">Esempi di Scrittura Reale</Label>
                <StringListEditor
                  items={data.voiceStyle.writingExamples || []}
                  onChange={(w) => updateField("voiceStyle", "writingExamples", w)}
                  placeholder="Incolla un testo che hai scritto tu..."
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-600">Frasi Firma</Label>
                <StringListEditor
                  items={data.voiceStyle.signaturePhrases || []}
                  onChange={(s) => updateField("voiceStyle", "signaturePhrases", s)}
                  placeholder="Es: Il punto è questo:"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-indigo-600" />
              Importa Brand Voice
            </DialogTitle>
            <DialogDescription>
              Incolla il JSON esportato dalla tua app esterna per importare tutti i dati del Brand Voice.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder={`{\n  "businessInfo": { "consultantName": "...", "businessName": "..." },\n  "authority": { "vision": "...", "mission": "..." },\n  "servicesInfo": { ... },\n  "credentials": { ... },\n  "voiceStyle": { ... }\n}`}
              value={importJson}
              onChange={(e) => { setImportJson(e.target.value); setImportError(""); }}
              rows={12}
              className="font-mono text-sm border-slate-200 focus:border-indigo-300"
            />
            {importError && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {importError}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>Annulla</Button>
            <Button
              onClick={handleImport}
              disabled={!importJson.trim() || importMutation.isPending}
              className="gap-2 bg-indigo-600 hover:bg-indigo-700"
            >
              {importMutation.isPending ? (
                <>Importazione...</>
              ) : (
                <><Check className="h-4 w-4" /> Importa</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
