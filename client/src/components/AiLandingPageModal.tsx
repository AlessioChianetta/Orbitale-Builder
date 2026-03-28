import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface Template {
  id: string;
  name: string;
  description: string;
  colors: {
    heroBg: string;
    accent: string;
    servicesBg: string;
    navBg: string;
  };
}

interface BuilderPage {
  id: number;
  title: string;
  slug: string;
  isActive: boolean;
  description?: string;
  createdAt?: string;
}

interface AiLandingPageModalProps {
  open: boolean;
  onClose: () => void;
  onPageCreated: (page: BuilderPage) => void;
}

export function AiLandingPageModal({ open, onClose, onPageCreated }: AiLandingPageModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<"form" | "generating" | "saving">("form");
  const [description, setDescription] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("professionale-blu");
  const [mode, setMode] = useState<"template" | "scratch">("template");

  const { data: configData } = useQuery<{ configured: boolean }>({
    queryKey: ["/api/ai/check-config"],
    enabled: open,
  });

  const { data: templatesData } = useQuery<{ templates: Template[] }>({
    queryKey: ["/api/ai/landing-page-templates"],
    enabled: open,
  });

  const templates = templatesData?.templates?.filter(t => t.id !== "bianco") || [];
  const blankTemplate = templatesData?.templates?.find(t => t.id === "bianco");
  const isKeyConfigured = configData?.configured !== false;

  const generateMutation = useMutation({
    mutationFn: async ({ description: desc, templateId }: { description: string; templateId: string }) => {
      const response = await apiRequest("POST", "/api/ai/generate-landing-page", { description: desc, templateId });
      return response.json();
    },
  });

  const savePageMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const response = await apiRequest("POST", "/api/builder-pages", data);
      return response.json() as Promise<BuilderPage>;
    },
    onSuccess: (page) => {
      queryClient.invalidateQueries({ queryKey: ["/api/builder-pages"] });
      toast({ title: "Landing page creata!", description: `"${page.title}" salvata come bozza nel Page Builder.` });
      handleClose();
      onPageCreated(page);
    },
    onError: (err: Error) => {
      toast({ title: "Errore nel salvataggio", description: err.message || "Riprova", variant: "destructive" });
      setStep("form");
    }
  });

  const handleGenerate = async () => {
    if (!isKeyConfigured) {
      toast({ title: "Chiave AI non configurata", description: "Vai su Super Admin → Configurazione AI per impostare la chiave Gemini.", variant: "destructive" });
      return;
    }
    if (description.trim().length < 10) {
      toast({ title: "Descrizione troppo breve", description: "Inserisci almeno 10 caratteri.", variant: "destructive" });
      return;
    }
    const templateId = mode === "scratch" ? "bianco" : selectedTemplate;

    try {
      setStep("generating");
      const result = await generateMutation.mutateAsync({ description, templateId });
      setStep("saving");

      const slug = (result.suggestedSlug as string || "")
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 80) || `landing-ai-${Date.now()}`;

      await savePageMutation.mutateAsync({
        title: (result.suggestedTitle as string) || "Landing Page AI",
        slug: `ai-${slug}`,
        description: description.slice(0, 500),
        components: result.components,
        metaTitle: (result.suggestedMetaTitle as string) || (result.suggestedTitle as string),
        metaDescription: (result.suggestedMetaDescription as string) || "",
        isActive: false,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Errore durante la generazione. Riprova.";
      toast({ title: "Errore generazione AI", description: msg, variant: "destructive" });
      setStep("form");
    }
  };

  const handleClose = () => {
    setStep("form");
    setDescription("");
    setSelectedTemplate("professionale-blu");
    setMode("template");
    onClose();
  };

  const isLoading = step === "generating" || step === "saving";

  return (
    <Dialog open={open} onOpenChange={v => !v && !isLoading && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.663 17h4.673M12 3v1m6.364 1.636-.707.707M21 12h-1M4 12H3m3.343-5.657-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
            Genera Landing Page con AI
          </DialogTitle>
          <DialogDescription>
            Descrivi il tuo sito e l'AI creerà una landing page completa pronta per il Page Builder.
          </DialogDescription>
        </DialogHeader>

        {open && configData && !isKeyConfigured && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 mb-2">
            <p className="text-sm font-medium text-red-800 mb-1">Chiave API Gemini non configurata</p>
            <p className="text-sm text-red-700">
              Per usare il generatore AI devi prima configurare una chiave API Gemini.{" "}
              <a href="/superadmin" className="underline font-medium text-red-800 hover:text-red-900">
                Vai su Super Admin → Configurazione AI
              </a>
            </p>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-indigo-100"></div>
              <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
            </div>
            <div className="text-center">
              <p className="font-semibold text-slate-800">
                {step === "generating" ? "Gemini sta generando la tua landing page..." : "Salvataggio in corso..."}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                {step === "generating" ? "Questo richiede 10-20 secondi" : "Quasi fatto!"}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Descrivi la tua attività o il sito che vuoi creare
              </Label>
              <Textarea
                id="description"
                placeholder={`Es: Studio legale specializzato in diritto del lavoro a Milano. Offriamo consulenza per aziende e privati. Voglio una landing page professionale che trasmetta fiducia ed esperienza, con sezione servizi (consulenza, contenzioso, contrattualistica) e testimonianze di clienti soddisfatti.`}
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={5}
                className="text-sm"
              />
              <p className="text-xs text-slate-400">{description.length} caratteri — più dettagli fornisci, migliore sarà il risultato</p>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Punto di partenza</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMode("template")}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${mode === "template" ? "border-indigo-600 bg-indigo-50" : "border-slate-200 hover:border-slate-300"}`}
                >
                  <div className="font-medium text-sm text-slate-800">Da Template</div>
                  <div className="text-xs text-slate-500 mt-0.5">Palette colori predefinita e coerente</div>
                </button>
                <button
                  type="button"
                  onClick={() => setMode("scratch")}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${mode === "scratch" ? "border-indigo-600 bg-indigo-50" : "border-slate-200 hover:border-slate-300"}`}
                >
                  <div className="font-medium text-sm text-slate-800">Da Zero</div>
                  <div className="text-xs text-slate-500 mt-0.5">Tela bianca, personalizza tutto dopo</div>
                </button>
              </div>
            </div>

            {mode === "template" && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Scegli il template</Label>
                <div className="grid grid-cols-2 gap-3">
                  {templates.map(tpl => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => setSelectedTemplate(tpl.id)}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${selectedTemplate === tpl.id ? "border-indigo-600 ring-2 ring-indigo-100" : "border-slate-200 hover:border-slate-300"}`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex gap-1">
                          <div className="w-5 h-5 rounded-full" style={{ backgroundColor: tpl.colors.heroBg }}></div>
                          <div className="w-5 h-5 rounded-full" style={{ backgroundColor: tpl.colors.accent }}></div>
                          <div className="w-5 h-5 rounded-full border border-slate-200" style={{ backgroundColor: tpl.colors.servicesBg }}></div>
                        </div>
                        {selectedTemplate === tpl.id && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-600 ml-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        )}
                      </div>
                      <div className="font-medium text-sm text-slate-800">{tpl.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5 leading-tight">{tpl.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {mode === "scratch" && blankTemplate && (
              <div className="rounded-lg border bg-slate-50 p-3 flex items-center gap-3">
                <div className="flex gap-1">
                  <div className="w-5 h-5 rounded-full" style={{ backgroundColor: blankTemplate.colors.heroBg }}></div>
                  <div className="w-5 h-5 rounded-full" style={{ backgroundColor: blankTemplate.colors.accent }}></div>
                  <div className="w-5 h-5 rounded-full border border-slate-200" style={{ backgroundColor: blankTemplate.colors.servicesBg }}></div>
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-700">{blankTemplate.name}</div>
                  <div className="text-xs text-slate-500">{blankTemplate.description}</div>
                </div>
              </div>
            )}

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
              <strong>Struttura generata:</strong> Navbar sticky con hamburger mobile → Hero → Servizi → Testimonianze → CTA → Footer. Potrai modificare tutto nel Page Builder.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t">
              <Button variant="outline" onClick={handleClose} disabled={isLoading}>Annulla</Button>
              <Button
                onClick={handleGenerate}
                disabled={isLoading || description.trim().length < 10 || !isKeyConfigured}
                className="bg-indigo-600 hover:bg-indigo-700 gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.663 17h4.673M12 3v1m6.364 1.636-.707.707M21 12h-1M4 12H3m3.343-5.657-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
                Genera con AI
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
