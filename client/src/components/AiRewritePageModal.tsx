import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface ComponentData {
  id: string;
  type: string;
  props: Record<string, unknown>;
  children?: ComponentData[];
}

interface BrandVoiceData {
  businessInfo?: { businessName?: string; consultantDisplayName?: string };
  voiceStyle?: { personalTone?: string };
  authorityPositioning?: { usp?: string };
}

interface AiRewritePageModalProps {
  open: boolean;
  onClose: () => void;
  components: ComponentData[];
  selectedComponentId?: string | null;
  onRewriteComplete: (components: ComponentData[]) => void;
}

const loadingSteps = [
  { text: "Analizzando i componenti della pagina..." },
  { text: "Applicando il Brand Voice ai testi..." },
  { text: "Riscrivendo i contenuti con AI..." },
  { text: "Finalizzando la riscrittura..." },
];

export function AiRewritePageModal({ open, onClose, components, selectedComponentId, onRewriteComplete }: AiRewritePageModalProps) {
  const { toast } = useToast();

  const [mode, setMode] = useState<"full" | "single">("full");
  const [instructions, setInstructions] = useState("");
  const [loadingStep, setLoadingStep] = useState(0);

  const { data: configData } = useQuery<{ configured: boolean }>({
    queryKey: ["/api/ai/check-config"],
    enabled: open,
  });

  const { data: brandVoice } = useQuery<BrandVoiceData>({
    queryKey: ["/api/brand-voice"],
    enabled: open,
  });

  const isKeyConfigured = configData?.configured !== false;
  const hasBrandVoice = !!(brandVoice?.businessInfo?.businessName || brandVoice?.voiceStyle?.personalTone);

  const rewriteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/ai/rewrite-page", {
        components,
        instructions: instructions.trim() || undefined,
        mode,
        selectedComponentId: mode === "single" ? selectedComponentId : undefined,
      });
      return response.json() as Promise<{ components: ComponentData[] }>;
    },
    onSuccess: (data) => {
      onRewriteComplete(data.components);
      toast({ title: "Riscrittura completata!", description: "I testi sono stati riscritti. Controlla e poi salva." });
      handleClose();
    },
    onError: (err: Error) => {
      toast({ title: "Errore nella riscrittura", description: err.message || "Riprova", variant: "destructive" });
    }
  });

  useEffect(() => {
    if (selectedComponentId) {
      setMode("single");
    }
  }, [selectedComponentId, open]);

  useEffect(() => {
    if (!rewriteMutation.isPending) {
      setLoadingStep(0);
      return;
    }
    const interval = setInterval(() => {
      setLoadingStep(prev => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
    }, 5000);
    return () => clearInterval(interval);
  }, [rewriteMutation.isPending]);

  const handleClose = () => {
    setInstructions("");
    setMode("full");
    setLoadingStep(0);
    onClose();
  };

  const selectedComponentType = selectedComponentId
    ? components.find(c => c.id === selectedComponentId)?.type
    : null;

  const isLoading = rewriteMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={v => !v && !isLoading && handleClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0 gap-0 border-0 shadow-2xl">
        <DialogTitle className="sr-only">Riscrivi Pagina con AI</DialogTitle>
        <DialogDescription className="sr-only">Usa Gemini e il Brand Voice per riscrivere i testi della pagina.</DialogDescription>

        <div className="relative overflow-hidden rounded-t-lg bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 px-6 py-6">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-2 right-8 w-20 h-20 rounded-full bg-white/20 blur-xl"></div>
            <div className="absolute bottom-0 left-12 w-32 h-16 rounded-full bg-white/10 blur-2xl"></div>
          </div>
          <div className="relative flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white" aria-hidden="true">Riscrivi con AI + Brand Voice</h2>
              <p className="text-sm text-white/70 mt-1">Riscrittura automatica dei testi usando il tuo Brand Voice</p>
              <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full bg-white/10 border border-white/20 text-[10px] font-medium text-white/80 tracking-wide uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
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
                  <a href="/superadmin" className="underline font-semibold text-red-700 hover:text-red-900">Super Admin → Configurazione AI</a>
                </p>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-6">
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 rounded-full border-[3px] border-emerald-100"></div>
                <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-emerald-600 border-r-teal-500 animate-spin"></div>
                <div className="absolute inset-2 rounded-full bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </div>
              </div>

              <div className="text-center space-y-2">
                <p className="font-bold text-lg text-slate-800">{loadingSteps[loadingStep]?.text}</p>
                <p className="text-sm text-slate-500">Questo richiede 15-30 secondi</p>
              </div>

              <div className="w-full max-w-xs space-y-3">
                {loadingSteps.map((s, i) => (
                  <div key={i} className={`flex items-center gap-2.5 transition-all duration-500 ${i <= loadingStep ? "opacity-100" : "opacity-30"}`}>
                    <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-colors duration-500 ${i < loadingStep ? "bg-emerald-500" : i === loadingStep ? "bg-teal-600" : "bg-slate-200"}`}>
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
            </div>
          ) : (
            <div className="space-y-5">
              {hasBrandVoice ? (
                <div className="rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-4 flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">Brand Voice configurato</p>
                    <p className="text-xs text-emerald-600 mt-0.5">
                      {brandVoice?.businessInfo?.businessName && <span className="font-medium">{brandVoice.businessInfo.businessName}</span>}
                      {brandVoice?.voiceStyle?.personalTone && <span> · Tono: {brandVoice.voiceStyle.personalTone}</span>}
                      {brandVoice?.authorityPositioning?.usp && <span> · USP: {brandVoice.authorityPositioning.usp.slice(0, 60)}...</span>}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-amber-800">Brand Voice non configurato</p>
                    <p className="text-xs text-amber-600 mt-0.5">
                      La riscrittura funzionerà comunque, ma i risultati saranno migliori se{" "}
                      <a href="/admin/brand-voice" className="underline font-semibold text-amber-700 hover:text-amber-900">configuri il Brand Voice</a> prima.
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-2.5">
                <Label className="text-sm font-semibold text-slate-700">Cosa riscrivere</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMode("full")}
                    className={`group relative p-4 rounded-xl border-2 text-left transition-all duration-200 ${mode === "full" ? "border-emerald-500 bg-emerald-50/80 shadow-md shadow-emerald-500/10" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"}`}
                  >
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${mode === "full" ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/></svg>
                      </div>
                      <div className="font-semibold text-sm text-slate-800">Tutta la pagina</div>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{components.length} componenti</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("single")}
                    disabled={!selectedComponentId}
                    className={`group relative p-4 rounded-xl border-2 text-left transition-all duration-200 ${!selectedComponentId ? "opacity-50 cursor-not-allowed" : ""} ${mode === "single" ? "border-emerald-500 bg-emerald-50/80 shadow-md shadow-emerald-500/10" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"}`}
                  >
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${mode === "single" ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>
                      </div>
                      <div className="font-semibold text-sm text-slate-800">Singolo componente</div>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {selectedComponentId ? `Tipo: ${selectedComponentType}` : "Seleziona prima un componente"}
                    </p>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rewrite-instructions" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-teal-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  Istruzioni aggiuntive <span className="text-slate-400 font-normal">(opzionale)</span>
                </Label>
                <Textarea
                  id="rewrite-instructions"
                  placeholder="Es: Rendi il testo più aggressivo, Aggiungi più urgenza, Usa un tono più formale, Enfatizza i benefici economici..."
                  value={instructions}
                  onChange={e => setInstructions(e.target.value)}
                  rows={3}
                  className="text-sm resize-none rounded-xl border-slate-200 focus:border-emerald-400 focus:ring-emerald-400/20 transition-colors"
                />
              </div>

              <div className="rounded-xl bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200/60 p-3.5 flex items-start gap-2.5">
                <div className="flex-shrink-0 mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-700">Come funziona</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">I testi vengono riscritti mantenendo la struttura della pagina. Potrai verificare il risultato prima di salvare.</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Button variant="ghost" onClick={handleClose} disabled={isLoading} className="text-slate-500 hover:text-slate-700">
                  Annulla
                </Button>
                <Button
                  onClick={() => rewriteMutation.mutate()}
                  disabled={isLoading || !isKeyConfigured || components.length === 0}
                  className="relative bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 text-white gap-2 px-6 py-2.5 rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-200 disabled:opacity-50 disabled:shadow-none"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Riscrivi con AI
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
