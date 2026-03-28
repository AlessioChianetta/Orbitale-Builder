import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

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

function TemplateMiniPreview({ colors, selected }: { colors: Template["colors"]; selected: boolean }) {
  return (
    <div className={`relative w-full aspect-[4/3] rounded-lg overflow-hidden border transition-all duration-300 ${selected ? "border-indigo-400 shadow-lg shadow-indigo-500/20" : "border-slate-200/60"}`}>
      <div className="absolute inset-0 flex flex-col">
        <div className="h-[10%] flex items-center px-2" style={{ backgroundColor: colors.navBg }}>
          <div className="flex gap-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-white/40"></div>
            <div className="w-4 h-0.5 rounded bg-white/30 mt-0.5"></div>
          </div>
          <div className="ml-auto flex gap-1">
            <div className="w-3 h-0.5 rounded bg-white/25"></div>
            <div className="w-3 h-0.5 rounded bg-white/25"></div>
            <div className="w-3 h-0.5 rounded bg-white/25"></div>
          </div>
        </div>

        <div className="h-[35%] flex flex-col items-center justify-center px-3" style={{ backgroundColor: colors.heroBg }}>
          <div className="w-[60%] h-1.5 rounded bg-white/70 mb-1"></div>
          <div className="w-[80%] h-1 rounded bg-white/40 mb-1.5"></div>
          <div className="w-[40%] h-2 rounded-sm" style={{ backgroundColor: colors.accent }}></div>
        </div>

        <div className="h-[30%] flex items-center justify-center gap-1.5 px-2" style={{ backgroundColor: colors.servicesBg }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="flex-1 h-[70%] rounded bg-white/80 border border-slate-200/30 flex flex-col items-center justify-center gap-0.5 p-0.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.accent, opacity: 0.6 }}></div>
              <div className="w-[70%] h-0.5 rounded bg-slate-300/60"></div>
            </div>
          ))}
        </div>

        <div className="h-[15%] flex items-center justify-center" style={{ backgroundColor: colors.accent }}>
          <div className="w-[50%] h-1.5 rounded bg-white/70"></div>
        </div>

        <div className="h-[10%] flex items-center justify-center" style={{ backgroundColor: colors.navBg }}>
          <div className="w-[30%] h-0.5 rounded bg-white/30"></div>
        </div>
      </div>
    </div>
  );
}

const loadingSteps = [
  { text: "Analizzando la tua descrizione...", icon: "search" },
  { text: "Generando le sezioni della pagina...", icon: "layout" },
  { text: "Ottimizzando contenuti e SEO...", icon: "sparkles" },
  { text: "Finalizzando la landing page...", icon: "check" },
];

export function AiLandingPageModal({ open, onClose, onPageCreated }: AiLandingPageModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<"form" | "generating" | "saving">("form");
  const [description, setDescription] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("professionale-blu");
  const [mode, setMode] = useState<"template" | "scratch">("template");
  const [loadingStep, setLoadingStep] = useState(0);

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

  useEffect(() => {
    if (step !== "generating") {
      setLoadingStep(0);
      return;
    }
    const interval = setInterval(() => {
      setLoadingStep(prev => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
    }, 4000);
    return () => clearInterval(interval);
  }, [step]);

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
      toast({ title: "Chiave AI non configurata", description: "Vai su Super Admin \u2192 Configurazione AI per impostare la chiave Gemini.", variant: "destructive" });
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
  const charCount = description.length;
  const charColor = charCount >= 50 ? "text-emerald-500" : charCount >= 10 ? "text-amber-500" : "text-slate-400";

  return (
    <Dialog open={open} onOpenChange={v => !v && !isLoading && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0 border-0 shadow-2xl">
        <DialogTitle className="sr-only">Genera Landing Page con AI</DialogTitle>
        <DialogDescription className="sr-only">Descrivi la tua attivit\u00e0 e Gemini creer\u00e0 una pagina completa pronta per il Page Builder.</DialogDescription>
        <div className="relative overflow-hidden rounded-t-lg bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 px-6 py-6">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-2 right-8 w-20 h-20 rounded-full bg-white/20 blur-xl"></div>
            <div className="absolute bottom-0 left-12 w-32 h-16 rounded-full bg-white/10 blur-2xl"></div>
          </div>
          <div className="relative flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white" aria-hidden="true">Genera Landing Page con AI</h2>
              <p className="text-sm text-white/70 mt-1">Descrivi la tua attivit\u00e0 e Gemini creer\u00e0 una pagina completa in pochi secondi</p>
              <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full bg-white/10 border border-white/20 text-[10px] font-medium text-white/80 tracking-wide uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Powered by Gemini
              </span>
            </div>
          </div>
        </div>

        <div className="px-6 py-5">
          {open && configData && !isKeyConfigured && (
            <div className="rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-rose-50 p-4 mb-5 flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-red-800">Chiave API Gemini non configurata</p>
                <p className="text-xs text-red-600 mt-0.5">
                  Configura una chiave API nel{" "}
                  <a href="/superadmin" className="underline font-semibold text-red-700 hover:text-red-900">Super Admin \u2192 Configurazione AI</a>
                </p>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-6">
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 rounded-full border-[3px] border-indigo-100"></div>
                <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-indigo-600 border-r-violet-500 animate-spin"></div>
                <div className="absolute inset-2 rounded-full bg-gradient-to-br from-indigo-50 to-violet-50 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                </div>
              </div>

              <div className="text-center space-y-2">
                <p className="font-bold text-lg text-slate-800">
                  {step === "saving" ? "Salvataggio in corso..." : loadingSteps[loadingStep]?.text}
                </p>
                <p className="text-sm text-slate-500">
                  {step === "saving" ? "Quasi fatto!" : "Questo richiede 10-20 secondi"}
                </p>
              </div>

              {step === "generating" && (
                <div className="w-full max-w-xs space-y-3">
                  {loadingSteps.map((s, i) => (
                    <div key={i} className={`flex items-center gap-2.5 transition-all duration-500 ${i <= loadingStep ? "opacity-100" : "opacity-30"}`}>
                      <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-colors duration-500 ${i < loadingStep ? "bg-emerald-500" : i === loadingStep ? "bg-indigo-600" : "bg-slate-200"}`}>
                        {i < loadingStep ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        ) : i === loadingStep ? (
                          <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                        )}
                      </div>
                      <span className={`text-xs font-medium ${i <= loadingStep ? "text-slate-700" : "text-slate-400"}`}>{s.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Descrivi la tua attivit\u00e0
                </Label>
                <Textarea
                  id="description"
                  placeholder="Es: Studio legale specializzato in diritto del lavoro a Milano. Offriamo consulenza per aziende e privati. Voglio una landing page professionale con sezione servizi e testimonianze..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={4}
                  className="text-sm resize-none rounded-xl border-slate-200 focus:border-indigo-400 focus:ring-indigo-400/20 transition-colors"
                />
                <div className="flex items-center justify-between">
                  <p className={`text-xs font-medium transition-colors ${charColor}`}>
                    {charCount} caratteri
                  </p>
                  <p className="text-xs text-slate-400">Pi\u00f9 dettagli = risultato migliore</p>
                </div>
              </div>

              <div className="space-y-2.5">
                <Label className="text-sm font-semibold text-slate-700">Punto di partenza</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMode("template")}
                    className={`group relative p-4 rounded-xl border-2 text-left transition-all duration-200 ${mode === "template" ? "border-indigo-500 bg-indigo-50/80 shadow-md shadow-indigo-500/10" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"}`}
                  >
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${mode === "template" ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
                      </div>
                      <div className="font-semibold text-sm text-slate-800">Da Template</div>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">Palette colori predefinita e coerente</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("scratch")}
                    className={`group relative p-4 rounded-xl border-2 text-left transition-all duration-200 ${mode === "scratch" ? "border-indigo-500 bg-indigo-50/80 shadow-md shadow-indigo-500/10" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"}`}
                  >
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${mode === "scratch" ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </div>
                      <div className="font-semibold text-sm text-slate-800">Da Zero</div>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">Tela bianca, personalizza tutto dopo</p>
                  </button>
                </div>
              </div>

              {mode === "template" && (
                <div className="space-y-2.5">
                  <Label className="text-sm font-semibold text-slate-700">Scegli lo stile</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {templates.map(tpl => (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => setSelectedTemplate(tpl.id)}
                        className={`group relative rounded-xl border-2 text-left transition-all duration-200 overflow-hidden ${selectedTemplate === tpl.id ? "border-indigo-500 shadow-lg shadow-indigo-500/15 scale-[1.02]" : "border-slate-200 hover:border-slate-300 hover:shadow-md"}`}
                      >
                        <TemplateMiniPreview colors={tpl.colors} selected={selectedTemplate === tpl.id} />
                        <div className="p-3 bg-white">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-sm text-slate-800">{tpl.name}</span>
                            {selectedTemplate === tpl.id && (
                              <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                              </div>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{tpl.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {mode === "scratch" && blankTemplate && (
                <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-4 flex items-center gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-700">{blankTemplate.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{blankTemplate.description}</div>
                  </div>
                </div>
              )}

              <div className="rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 p-3.5 flex items-start gap-2.5">
                <div className="flex-shrink-0 mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-amber-800">Struttura generata</p>
                  <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">Navbar sticky \u2192 Hero \u2192 Servizi \u2192 Testimonianze \u2192 CTA \u2192 Footer. Potrai modificare tutto nel Page Builder.</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Button variant="ghost" onClick={handleClose} disabled={isLoading} className="text-slate-500 hover:text-slate-700">
                  Annulla
                </Button>
                <Button
                  onClick={handleGenerate}
                  disabled={isLoading || description.trim().length < 10 || !isKeyConfigured}
                  className="relative bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 hover:from-indigo-700 hover:via-violet-700 hover:to-purple-700 text-white gap-2 px-6 py-2.5 rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 transition-all duration-200 disabled:opacity-50 disabled:shadow-none"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                  Genera con AI
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
