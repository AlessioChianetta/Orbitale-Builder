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
  Search,
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
    consultantDisplayName?: string;
    businessName?: string;
    businessDescription?: string;
    consultantBio?: string;
  };
  authorityPositioning: {
    vision?: string;
    mission?: string;
    values?: string[];
    usp?: string;
    whoWeHelp?: string;
    whoWeDontHelp?: string;
    whatWeDo?: string;
    howWeDoIt?: string;
  };
  servicesGuarantees: {
    servicesOffered?: Array<{ name: string; price: string; description: string }>;
    guarantees?: string;
  };
  credentialsResults: {
    yearsExperience?: number;
    clientsHelped?: number;
    resultsGenerated?: string;
    softwareCreated?: Array<{ emoji: string; name: string; description: string }>;
    booksPublished?: Array<{ title: string; year: string }>;
    caseStudies?: Array<{ client: string; result: string }>;
  };
  voiceStyle: {
    personalTone?: string;
    contentPersonality?: string;
    audienceLanguage?: string;
    avoidPatterns?: string;
    writingExamples?: string[];
    signaturePhrases?: string[];
  };
  marketResearch: {
    currentState?: string[];
    idealState?: string[];
    avatar?: {
      nightThought?: string;
      biggestFear?: string;
      dailyFrustration?: string;
      deepestDesire?: string;
      currentSituation?: string;
      decisionStyle?: string;
      languageUsed?: string;
      influencers?: string;
    };
    emotionalDrivers?: string[];
    existingSolutionProblems?: string[];
    internalObjections?: string[];
    externalObjections?: string[];
    coreLies?: Array<{ name: string; problem: string; cureOrPrevent: string; isAware: boolean; importance: number }>;
    uniqueMechanism?: { name: string; description: string };
    uvp?: string;
  };
}

const emptyData: BrandVoiceData = {
  businessInfo: {},
  authorityPositioning: { values: [] },
  servicesGuarantees: { servicesOffered: [] },
  credentialsResults: { softwareCreated: [], booksPublished: [], caseStudies: [] },
  voiceStyle: { writingExamples: [], signaturePhrases: [] },
  marketResearch: { currentState: [], idealState: [], emotionalDrivers: [], existingSolutionProblems: [], internalObjections: [], externalObjections: [], coreLies: [] },
};

function StringListEditor({ items, onChange, placeholder, useTextarea }: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
  useTextarea?: boolean;
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
        {useTextarea ? (
          <Textarea
            placeholder={placeholder}
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            rows={3}
            className="border-slate-200 focus:border-indigo-300"
          />
        ) : (
          <Input
            placeholder={placeholder}
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addItem())}
            className="border-slate-200 focus:border-indigo-300"
          />
        )}
        <Button type="button" size="sm" variant="outline" onClick={addItem} className="shrink-0">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item, i) => (
          <Badge key={i} variant="secondary" className={`py-1 px-2 gap-1 ${useTextarea ? 'text-xs max-w-full' : 'text-xs'}`}>
            <span className={useTextarea ? 'line-clamp-2' : ''}>{item}</span>
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
  items: Array<{ name: string; price: string; description: string }>;
  onChange: (items: Array<{ name: string; price: string; description: string }>) => void;
}) {
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const addItem = () => {
    if (newName.trim()) {
      onChange([...items, { name: newName.trim(), price: newPrice.trim(), description: newDesc.trim() }]);
      setNewName("");
      setNewPrice("");
      setNewDesc("");
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[1fr_auto_2fr_auto] gap-2">
        <Input placeholder="Nome servizio" value={newName} onChange={(e) => setNewName(e.target.value)} className="border-slate-200 text-sm" />
        <Input placeholder="Prezzo" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} className="border-slate-200 text-sm w-28" />
        <Input placeholder="Descrizione" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="border-slate-200 text-sm" />
        <Button type="button" size="sm" variant="outline" onClick={addItem} className="shrink-0">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2 bg-slate-50 rounded-lg p-3 text-sm">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium text-slate-800">{item.name}</p>
                {item.price && <Badge variant="outline" className="text-xs">{item.price}</Badge>}
              </div>
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

function SoftwareListEditor({ items, onChange }: {
  items: Array<{ emoji: string; name: string; description: string }>;
  onChange: (items: Array<{ emoji: string; name: string; description: string }>) => void;
}) {
  const [emoji, setEmoji] = useState("");
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  const addItem = () => {
    if (name.trim()) {
      onChange([...items, { emoji: emoji.trim() || "💻", name: name.trim(), description: desc.trim() }]);
      setEmoji("");
      setName("");
      setDesc("");
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[auto_1fr_2fr_auto] gap-2">
        <Input placeholder="📱" value={emoji} onChange={(e) => setEmoji(e.target.value)} className="border-slate-200 text-sm w-14 text-center" />
        <Input placeholder="Nome software" value={name} onChange={(e) => setName(e.target.value)} className="border-slate-200 text-sm" />
        <Input placeholder="Descrizione" value={desc} onChange={(e) => setDesc(e.target.value)} className="border-slate-200 text-sm" />
        <Button type="button" size="sm" variant="outline" onClick={addItem} className="shrink-0">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2 bg-slate-50 rounded-lg p-3 text-sm">
            <span className="text-lg">{item.emoji}</span>
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

function BookListEditor({ items, onChange }: {
  items: Array<{ title: string; year: string }>;
  onChange: (items: Array<{ title: string; year: string }>) => void;
}) {
  const [title, setTitle] = useState("");
  const [year, setYear] = useState("");

  const addItem = () => {
    if (title.trim()) {
      onChange([...items, { title: title.trim(), year: year.trim() }]);
      setTitle("");
      setYear("");
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[2fr_auto_auto] gap-2">
        <Input placeholder="Titolo del libro" value={title} onChange={(e) => setTitle(e.target.value)} className="border-slate-200 text-sm" />
        <Input placeholder="Anno" value={year} onChange={(e) => setYear(e.target.value)} className="border-slate-200 text-sm w-24" />
        <Button type="button" size="sm" variant="outline" onClick={addItem} className="shrink-0">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2 bg-slate-50 rounded-lg p-3 text-sm">
            <div className="flex-1">
              <p className="font-medium text-slate-800">{item.title}</p>
              {item.year && <p className="text-slate-500 mt-0.5">{item.year}</p>}
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
  items: Array<{ client: string; result: string }>;
  onChange: (items: Array<{ client: string; result: string }>) => void;
}) {
  const [client, setClient] = useState("");
  const [result, setResult] = useState("");

  const addItem = () => {
    if (client.trim()) {
      onChange([...items, { client: client.trim(), result: result.trim() }]);
      setClient("");
      setResult("");
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[1fr_2fr_auto] gap-2">
        <Input placeholder="Nome cliente" value={client} onChange={(e) => setClient(e.target.value)} className="border-slate-200 text-sm" />
        <Input placeholder="Risultato ottenuto" value={result} onChange={(e) => setResult(e.target.value)} className="border-slate-200 text-sm" />
        <Button type="button" size="sm" variant="outline" onClick={addItem} className="shrink-0">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2 bg-slate-50 rounded-lg p-3 text-sm">
            <div className="flex-1">
              <p className="font-medium text-slate-800">{item.client}</p>
              {item.result && <p className="text-slate-500 mt-0.5">{item.result}</p>}
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

function CoreLiesEditor({ items, onChange }: {
  items: Array<{ name: string; problem: string; cureOrPrevent: string; isAware: boolean; importance: number }>;
  onChange: (items: Array<{ name: string; problem: string; cureOrPrevent: string; isAware: boolean; importance: number }>) => void;
}) {
  const [name, setName] = useState("");
  const [problem, setProblem] = useState("");

  const addItem = () => {
    if (name.trim()) {
      onChange([...items, { name: name.trim(), problem: problem.trim(), cureOrPrevent: "C", isAware: false, importance: 5 }]);
      setName("");
      setProblem("");
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[1fr_2fr_auto] gap-2">
        <Input placeholder="Nome bugia" value={name} onChange={(e) => setName(e.target.value)} className="border-slate-200 text-sm" />
        <Input placeholder="Problema che causa" value={problem} onChange={(e) => setProblem(e.target.value)} className="border-slate-200 text-sm" />
        <Button type="button" size="sm" variant="outline" onClick={addItem} className="shrink-0">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2 bg-slate-50 rounded-lg p-3 text-sm">
            <div className="flex-1">
              <p className="font-medium text-slate-800">{item.name}</p>
              {item.problem && <p className="text-slate-500 mt-0.5">{item.problem}</p>}
              <div className="flex gap-2 mt-1">
                <Badge variant="outline" className="text-xs">{item.cureOrPrevent === "C" ? "Cura" : "Prevenzione"}</Badge>
                <Badge variant="outline" className="text-xs">Importanza: {item.importance}/10</Badge>
              </div>
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

type SectionKey = keyof BrandVoiceData;
type FieldValue = string | number | boolean | string[] |
  Array<{ name: string; price: string; description: string }> |
  Array<{ emoji: string; name: string; description: string }> |
  Array<{ title: string; year: string }> |
  Array<{ client: string; result: string }> |
  Array<{ name: string; problem: string; cureOrPrevent: string; isAware: boolean; importance: number }> |
  { name: string; description: string } |
  Record<string, string | undefined> |
  undefined;

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
        authorityPositioning: { ...emptyData.authorityPositioning, ...serverData.authorityPositioning },
        servicesGuarantees: { ...emptyData.servicesGuarantees, ...serverData.servicesGuarantees },
        credentialsResults: { ...emptyData.credentialsResults, ...serverData.credentialsResults },
        voiceStyle: { ...emptyData.voiceStyle, ...serverData.voiceStyle },
        marketResearch: { ...emptyData.marketResearch, ...serverData.marketResearch },
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
    mutationFn: async (jsonData: Record<string, unknown>) => {
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
      const parsed = JSON.parse(importJson) as Record<string, unknown>;
      importMutation.mutate(parsed);
    } catch {
      setImportError("JSON non valido. Controlla il formato e riprova.");
    }
  };

  const updateField = (section: SectionKey, field: string, value: FieldValue) => {
    setData((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  };

  const updateAvatarField = (field: string, value: string) => {
    setData((prev) => ({
      ...prev,
      marketResearch: {
        ...prev.marketResearch,
        avatar: { ...prev.marketResearch.avatar, [field]: value },
      },
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
        <TabsList className="grid w-full grid-cols-6 bg-slate-100 p-1 rounded-xl h-auto">
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
            <span className="hidden sm:inline">Voce</span>
          </TabsTrigger>
          <TabsTrigger value="research" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm py-2.5">
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Mercato</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Business Info */}
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
                  <Label className="text-xs font-medium text-slate-600">Nome Display Consulente</Label>
                  <Input
                    placeholder="Es: Marco Rossi"
                    value={data.businessInfo.consultantDisplayName || ""}
                    onChange={(e) => updateField("businessInfo", "consultantDisplayName", e.target.value)}
                    className="border-slate-200 focus:border-indigo-300"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-600">Nome Business</Label>
                  <Input
                    placeholder="Es: Momentum Coaching"
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
                    placeholder="Breve descrizione di cosa fa il tuo business..."
                    value={data.businessInfo.businessDescription || ""}
                    onChange={(e) => updateField("businessInfo", "businessDescription", e.target.value)}
                    rows={3}
                    className="border-slate-200 focus:border-indigo-300"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-600">Bio Consulente</Label>
                  <Textarea
                    placeholder="Bio personale del consulente..."
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

        {/* TAB 2: Authority & Posizionamento */}
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
                    placeholder="La tua vision per il futuro..."
                    value={data.authorityPositioning.vision || ""}
                    onChange={(e) => updateField("authorityPositioning", "vision", e.target.value)}
                    rows={3}
                    className="border-slate-200 focus:border-indigo-300"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-600">Mission</Label>
                  <Textarea
                    placeholder="La tua mission..."
                    value={data.authorityPositioning.mission || ""}
                    onChange={(e) => updateField("authorityPositioning", "mission", e.target.value)}
                    rows={3}
                    className="border-slate-200 focus:border-indigo-300"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-600">Valori</Label>
                <StringListEditor
                  items={data.authorityPositioning.values || []}
                  onChange={(v) => updateField("authorityPositioning", "values", v)}
                  placeholder="Aggiungi un valore..."
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-600">Unique Selling Proposition (USP)</Label>
                <Textarea
                  placeholder="Cosa ti rende unico rispetto ai competitor..."
                  value={data.authorityPositioning.usp || ""}
                  onChange={(e) => updateField("authorityPositioning", "usp", e.target.value)}
                  rows={3}
                  className="border-slate-200 focus:border-indigo-300"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-xs font-medium text-slate-600">Chi Aiutiamo</Label>
                  <Textarea
                    placeholder="Il tuo cliente ideale..."
                    value={data.authorityPositioning.whoWeHelp || ""}
                    onChange={(e) => updateField("authorityPositioning", "whoWeHelp", e.target.value)}
                    rows={3}
                    className="border-slate-200 focus:border-indigo-300"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-600">Chi NON Aiutiamo</Label>
                  <Textarea
                    placeholder="Clienti non target..."
                    value={data.authorityPositioning.whoWeDontHelp || ""}
                    onChange={(e) => updateField("authorityPositioning", "whoWeDontHelp", e.target.value)}
                    rows={3}
                    className="border-slate-200 focus:border-indigo-300"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-xs font-medium text-slate-600">Cosa Facciamo</Label>
                  <Textarea
                    placeholder="I servizi che offri..."
                    value={data.authorityPositioning.whatWeDo || ""}
                    onChange={(e) => updateField("authorityPositioning", "whatWeDo", e.target.value)}
                    rows={3}
                    className="border-slate-200 focus:border-indigo-300"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-600">Come Lo Facciamo</Label>
                  <Textarea
                    placeholder="Il tuo metodo/processo..."
                    value={data.authorityPositioning.howWeDoIt || ""}
                    onChange={(e) => updateField("authorityPositioning", "howWeDoIt", e.target.value)}
                    rows={3}
                    className="border-slate-200 focus:border-indigo-300"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: Servizi & Garanzie */}
        <TabsContent value="services" className="mt-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-lg flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-indigo-600" />
                Servizi & Garanzie
              </CardTitle>
              <CardDescription>Offerta commerciale e garanzie</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div>
                <Label className="text-xs font-medium text-slate-600">Servizi Offerti</Label>
                <ServiceListEditor
                  items={data.servicesGuarantees.servicesOffered || []}
                  onChange={(s) => updateField("servicesGuarantees", "servicesOffered", s)}
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-600">Garanzie</Label>
                <Textarea
                  placeholder="Le garanzie che offri ai tuoi clienti..."
                  value={data.servicesGuarantees.guarantees || ""}
                  onChange={(e) => updateField("servicesGuarantees", "guarantees", e.target.value)}
                  rows={4}
                  className="border-slate-200 focus:border-indigo-300"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: Credenziali & Risultati */}
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
                    type="number"
                    min={0}
                    placeholder="Es: 10"
                    value={data.credentialsResults.yearsExperience ?? ""}
                    onChange={(e) => updateField("credentialsResults", "yearsExperience", e.target.value ? Number(e.target.value) : undefined)}
                    className="border-slate-200 focus:border-indigo-300"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-600">Clienti Aiutati</Label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="Es: 200"
                    value={data.credentialsResults.clientsHelped ?? ""}
                    onChange={(e) => updateField("credentialsResults", "clientsHelped", e.target.value ? Number(e.target.value) : undefined)}
                    className="border-slate-200 focus:border-indigo-300"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-600">Risultati Generati</Label>
                  <Input
                    placeholder="Es: €10M+ fatturato"
                    value={data.credentialsResults.resultsGenerated || ""}
                    onChange={(e) => updateField("credentialsResults", "resultsGenerated", e.target.value)}
                    className="border-slate-200 focus:border-indigo-300"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-600">Software Creati</Label>
                <SoftwareListEditor
                  items={data.credentialsResults.softwareCreated || []}
                  onChange={(s) => updateField("credentialsResults", "softwareCreated", s)}
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-600">Libri Pubblicati</Label>
                <BookListEditor
                  items={data.credentialsResults.booksPublished || []}
                  onChange={(b) => updateField("credentialsResults", "booksPublished", b)}
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-600">Case Studies</Label>
                <CaseStudyEditor
                  items={data.credentialsResults.caseStudies || []}
                  onChange={(cs) => updateField("credentialsResults", "caseStudies", cs)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 5: Voce & Stile */}
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
                    placeholder="Es: Voglio che chi legge si senta capito e un po' provocato, mai giudicato."
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
                  placeholder="Es: Il mio target sono personal trainer, parlano informale..."
                  value={data.voiceStyle.audienceLanguage || ""}
                  onChange={(e) => updateField("voiceStyle", "audienceLanguage", e.target.value)}
                  rows={3}
                  className="border-slate-200 focus:border-indigo-300"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-600">Cosa NON Fare Mai</Label>
                <Textarea
                  placeholder="Es: Mai iniziare con 'In un mondo dove...', mai usare elenchi puntati generici..."
                  value={data.voiceStyle.avoidPatterns || ""}
                  onChange={(e) => updateField("voiceStyle", "avoidPatterns", e.target.value)}
                  rows={3}
                  className="border-slate-200 focus:border-indigo-300"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-600">Esempi di Scrittura Reale (max 3)</Label>
                <StringListEditor
                  items={data.voiceStyle.writingExamples || []}
                  onChange={(w) => {
                    if (w.length <= 3) updateField("voiceStyle", "writingExamples", w);
                  }}
                  placeholder="Incolla un testo che hai scritto tu..."
                  useTextarea
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

        {/* TAB 6: Ricerca di Mercato */}
        <TabsContent value="research" className="mt-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="h-5 w-5 text-indigo-600" />
                Ricerca di Mercato
              </CardTitle>
              <CardDescription>Analisi approfondita del tuo mercato in 7 fasi</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 pt-6">
              <div className="space-y-6">
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Fase 1 — Stato Attuale vs Ideale</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-xs font-medium text-slate-600">Stato Attuale del Cliente</Label>
                    <p className="text-xs text-slate-400 mb-1">Problemi, frustrazioni e situazione da cui vuole uscire</p>
                    <StringListEditor
                      items={data.marketResearch.currentState || []}
                      onChange={(v) => updateField("marketResearch", "currentState", v)}
                      placeholder="Aggiungi un problema/frustrazione..."
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-slate-600">Stato Ideale Desiderato</Label>
                    <p className="text-xs text-slate-400 mb-1">Dove il cliente vuole arrivare, i risultati che sogna</p>
                    <StringListEditor
                      items={data.marketResearch.idealState || []}
                      onChange={(v) => updateField("marketResearch", "idealState", v)}
                      placeholder="Aggiungi un risultato desiderato..."
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 border-t pt-6">
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Fase 2 — Avatar del Cliente Ideale</h3>
                <p className="text-xs text-slate-400">Profilo psicografico dettagliato del tuo cliente ideale</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: "nightThought", label: "Cosa pensa di notte", placeholder: "Le preoccupazioni che lo tengono sveglio..." },
                    { key: "biggestFear", label: "Paura più grande", placeholder: "La paura legata al problema..." },
                    { key: "dailyFrustration", label: "Frustrazione quotidiana", placeholder: "La frustrazione che affronta ogni giorno..." },
                    { key: "deepestDesire", label: "Desiderio più profondo", placeholder: "Ciò che vuole davvero..." },
                    { key: "currentSituation", label: "Situazione attuale", placeholder: "Descrizione della situazione attuale..." },
                    { key: "decisionStyle", label: "Stile decisionale", placeholder: "Impulsivo, analitico, ecc..." },
                    { key: "languageUsed", label: "Linguaggio usato", placeholder: "Espressioni che usa normalmente..." },
                    { key: "influencers", label: "Influencer/Riferimenti", placeholder: "Chi ascolta e considera autorevole..." },
                  ].map((f) => (
                    <div key={f.key}>
                      <Label className="text-xs font-medium text-slate-600">{f.label}</Label>
                      <Textarea
                        placeholder={f.placeholder}
                        value={(data.marketResearch.avatar as Record<string, string | undefined>)?.[f.key] || ""}
                        onChange={(e) => updateAvatarField(f.key, e.target.value)}
                        rows={2}
                        className="border-slate-200 focus:border-indigo-300"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4 border-t pt-6">
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Fase 3 — Leve Emotive</h3>
                <StringListEditor
                  items={data.marketResearch.emotionalDrivers || []}
                  onChange={(v) => updateField("marketResearch", "emotionalDrivers", v)}
                  placeholder="Aggiungi una leva emotiva..."
                />
              </div>

              <div className="space-y-4 border-t pt-6">
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Fase 4 — Obiezioni & Problemi con Soluzioni Esistenti</h3>
                <div>
                  <Label className="text-xs font-medium text-slate-600">Problemi con le Soluzioni Esistenti</Label>
                  <StringListEditor
                    items={data.marketResearch.existingSolutionProblems || []}
                    onChange={(v) => updateField("marketResearch", "existingSolutionProblems", v)}
                    placeholder="Cosa non funziona nelle alternative..."
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-xs font-medium text-slate-600">Obiezioni Interne</Label>
                    <p className="text-xs text-slate-400 mb-1">Dubbi su sé stessi ("non ce la faccio", "non ho tempo")</p>
                    <StringListEditor
                      items={data.marketResearch.internalObjections || []}
                      onChange={(v) => updateField("marketResearch", "internalObjections", v)}
                      placeholder="Aggiungi un'obiezione interna..."
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-slate-600">Obiezioni Esterne</Label>
                    <p className="text-xs text-slate-400 mb-1">Dubbi sulla soluzione ("costa troppo", "non funzionerà")</p>
                    <StringListEditor
                      items={data.marketResearch.externalObjections || []}
                      onChange={(v) => updateField("marketResearch", "externalObjections", v)}
                      placeholder="Aggiungi un'obiezione esterna..."
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 border-t pt-6">
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Fase 5 — Bugie di Mercato</h3>
                <CoreLiesEditor
                  items={data.marketResearch.coreLies || []}
                  onChange={(v) => updateField("marketResearch", "coreLies", v)}
                />
              </div>

              <div className="space-y-4 border-t pt-6">
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Fase 6 — Meccanismo Unico</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-xs font-medium text-slate-600">Nome del Meccanismo</Label>
                    <Input
                      placeholder="Es: Il Metodo Orbitale"
                      value={data.marketResearch.uniqueMechanism?.name || ""}
                      onChange={(e) => updateField("marketResearch", "uniqueMechanism", {
                        name: e.target.value,
                        description: data.marketResearch.uniqueMechanism?.description || "",
                      })}
                      className="border-slate-200 focus:border-indigo-300"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-slate-600">Descrizione</Label>
                    <Textarea
                      placeholder="Come funziona e perché è unico..."
                      value={data.marketResearch.uniqueMechanism?.description || ""}
                      onChange={(e) => updateField("marketResearch", "uniqueMechanism", {
                        name: data.marketResearch.uniqueMechanism?.name || "",
                        description: e.target.value,
                      })}
                      rows={2}
                      className="border-slate-200 focus:border-indigo-300"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 border-t pt-6">
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Fase 7 — Unique Value Proposition</h3>
                <Textarea
                  placeholder="La frase che sintetizza il valore unico offerto al cliente..."
                  value={data.marketResearch.uvp || ""}
                  onChange={(e) => updateField("marketResearch", "uvp", e.target.value)}
                  rows={3}
                  className="border-slate-200 focus:border-indigo-300"
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
              placeholder={`{\n  "businessInfo": { ... },\n  "authorityPositioning": { ... },\n  "servicesGuarantees": { ... },\n  "credentialsResults": { ... },\n  "voiceStyle": { ... },\n  "marketResearch": { ... }\n}`}
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
