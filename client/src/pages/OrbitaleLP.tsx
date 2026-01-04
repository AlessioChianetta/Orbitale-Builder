import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useFacebookPixelTracking } from '@/hooks/use-facebook-pixel-tracking';
import { Loader2, CheckCircle2, ArrowRight, XCircle } from 'lucide-react';
import { Star } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function OrbitaleLP() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showStickyButton, setShowStickyButton] = useState(false);

  // Auto-track Facebook Pixel events configured in Analytics Dashboard
  useFacebookPixelTracking({
    currentRoute: '/orbitale',
    pageTitle: 'Metodo ORBITALE® - Landing Page',
    pageSlug: 'orbitale',
    additionalData: {
      landing_page_type: 'orbitale',
      campaign: 'metodo-orbitale'
    }
  });

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    businessName: '',
    currentSituation: '',
    privacyConsent: false
  });

  // Track page view on load
  useEffect(() => {
    const trackPageView = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const utmSource = params.get('utm_source') || 'direct';
        const utmMedium = params.get('utm_medium') || 'none';
        const utmCampaign = params.get('utm_campaign') || 'metodo-orbitale';

        await fetch('/api/analytics/track', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event: 'page_view',
            pageSlug: 'orbitale',
            data: {
              source: utmSource,
              medium: utmMedium,
              campaign: utmCampaign,
              page: 'landing-page-orbitale'
            },
            userAgent: navigator.userAgent,
            referrer: document.referrer || null
          })
        });
      } catch (error) {
        console.error('Analytics tracking error:', error);
      }
    };

    trackPageView();
  }, []);

  // Sticky CTA on scroll
  useEffect(() => {
    const handleScroll = () => {
      setShowStickyButton(window.scrollY > 600);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to form
  const scrollToForm = () => {
    const formElement = document.getElementById('candidatura-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.privacyConsent) {
      toast({
        title: "Consenso richiesto",
        description: "Devi accettare la privacy policy per candidarti.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get UTM parameters from URL
      const urlParams = new URLSearchParams(window.location.search);
      const utmSource = urlParams.get('utm_source') || '';
      const utmMedium = urlParams.get('utm_medium') || '';
      const utmCampaign = urlParams.get('utm_campaign') || '';
      const utmContent = urlParams.get('utm_content') || '';
      const utmTerm = urlParams.get('utm_term') || '';

      const response = await fetch('/api/marketing-leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          businessName: formData.businessName,
          source: 'landing-page-orbitale',
          campaign: 'metodo-orbitale',
          additionalData: {
            currentSituation: formData.currentSituation,
            landingPage: 'orbitale',
            submittedAt: new Date().toISOString()
          },
          utmSource: utmSource,
          utmMedium: utmMedium,
          utmCampaign: utmCampaign,
          utmContent: utmContent,
          utmTerm: utmTerm,
          referrer: document.referrer,
          userAgent: navigator.userAgent,
          landingPage: window.location.pathname,
          deviceType: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
          browserInfo: navigator.userAgent
        }),
      });

      if (!response.ok) {
        throw new Error('Errore nella candidatura');
      }

      // Success - Show toast and redirect to thank you page
      toast({
        title: "🎉 Candidatura Inviata!",
        description: "Reindirizzamento alla pagina di conferma...",
      });

      // Track conversion (Meta Pixel ready)
      if (typeof window !== 'undefined' && (window as any).fbq) {
        (window as any).fbq('track', 'Lead', {
          content_name: 'Metodo Orbitale - Candidatura',
          value: 0,
          currency: 'EUR'
        });
      }

      // Redirect to thank you page dopo un breve delay
      setTimeout(() => {
        setLocation('/thank-you?source=orbitale&landingPageSlug=orbitale&campaign=metodo-orbitale');
      }, 1000);

    } catch (error) {
      console.error('Errore candidatura:', error);
      toast({
        title: "Errore",
        description: "C'è stato un problema. Riprova tra qualche minuto.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Metodo ORBITALE® - Accesso Esclusivo | Libertà Finanziaria Calcolata</title>
        <meta name="description" content="Scopri come il Metodo ORBITALE trasforma ogni tuo euro in vera ricchezza misurabile. Sistema ingegnerizzato per professionisti ambiziosi." />
        <meta property="og:title" content="Metodo ORBITALE® - Calcola la Tua Libertà Finanziaria" />
        <meta property="og:description" content="Un sistema ingegnerizzato per costruire un patrimonio di €100.000-€500.000 in 2-4 anni." />
      </Helmet>

      <div className="min-h-screen bg-white">
        {/* Sticky CTA Button Mobile */}
        {showStickyButton && (
          <div className="fixed bottom-0 left-0 right-0 z-50 p-3 bg-slate-900 shadow-2xl md:hidden animate-in slide-in-from-bottom">
            <Button 
              onClick={scrollToForm}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-4 shadow-lg"
            >
              <span className="text-xs sm:text-sm md:text-base">CANDIDATI ORA - GRATIS</span>
            </Button>
          </div>
        )}

        {/* HERO SECTION */}
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDE2YzAtMi4yMSAxLjc5LTQgNC00czQgMS43OSA0IDQtMS43OSA0LTQgNC00LTEuNzktNC00em0tMTIgMGMwLTIuMjEgMS43OS00IDQtNHM0IDEuNzkgNCA0LTEuNzkgNC00IDQtNC0xLjc5LTQtNHptMCAxMmMwLTIuMjEgMS43OS00IDQtNHM0IDEuNzkgNCA0LTEuNzkgNC00IDQtNC0xLjc5LTQtNHptMTIgMGMwLTIuMjEgMS43OS00IDQtNHM0IDEuNzkgNCA0LTEuNzkgNC00IDQtNC0xLjc5LTQtNHo9Ij48L3BhdGg+PC9nPjwvZz48L3N2Zz4=')] opacity-10"></div>

          <div className="container mx-auto px-4 py-12 md:py-20 relative z-10">
            {/* Preheadline */}
            <div className="max-w-4xl mx-auto text-center mb-6">
              <div className="inline-block px-4 py-2 bg-amber-600/10 border border-amber-600/30 rounded-full mb-6">
                <p className="text-amber-400 font-semibold text-sm md:text-base">
                  ⚠️ ATTENZIONE: Pagina riservata a professionisti ambiziosi e famiglie determinate
                </p>
              </div>
            </div>

            {/* Headline */}
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-center max-w-5xl mx-auto mb-6 leading-tight">
              Sei pronto a smettere di sognare la libertà finanziaria e a{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">
                calcolare il tuo percorso
              </span>{' '}
              verso un patrimonio di €100.000 - €500.000 in soli 2-4 anni?
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-slate-200 text-center max-w-4xl mx-auto mb-10 leading-relaxed">
              Scopri come il <strong className="text-amber-400">Metodo ORBITALE®</strong>, un sistema ingegnerizzato 
              supportato da tecnologia proprietaria, trasforma ogni tuo euro in vera ricchezza 
              <span className="text-emerald-400"> misurabile e prevedibile</span>.
            </p>

            {/* Primary CTA */}
            <div className="text-center mb-8 px-4">
              <Button 
                onClick={scrollToForm}
                size="lg"
                className="w-full max-w-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold px-6 md:px-12 py-6 md:py-8 rounded-lg shadow-2xl transition-all"
              >
                <ArrowRight className="mr-2 md:mr-3 h-5 w-5 md:h-6 md:w-6 flex-shrink-0" />
                <span className="text-center leading-tight">
                  <span className="hidden sm:inline text-base md:text-xl">CANDIDATI PER LA CONSULENZA GRATUITA</span>
                  <span className="sm:hidden text-sm">CANDIDATI ORA</span>
                </span>
              </Button>
              <p className="text-xs md:text-sm text-slate-400 mt-4">
                ⏰ Solo 10 posti disponibili questo mese
              </p>
            </div>
          </div>
        </section>

        {/* VSL SECTION */}
        <section className="py-12 md:py-20 bg-slate-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 text-slate-900">
                Guarda Questo Video Prima di Candidarti
              </h2>

              <div className="aspect-video bg-slate-900 rounded-2xl shadow-2xl overflow-hidden mb-6">
                {/* Placeholder for VSL - Replace with actual video embed */}
                <div className="w-full h-full flex items-center justify-center text-white">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 cursor-pointer hover:bg-amber-700 transition">
                      <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                    <p className="text-xl font-semibold">Inserisci qui il tuo VSL</p>
                    <p className="text-sm text-slate-400 mt-2">Video Sales Letter (5-10 minuti)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TESTIMONIANZE SECTION */}
        <section className="py-16 md:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                ⭐ Testimonianze
              </Badge>
              <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
                Cosa Dicono i Nostri <span className="bg-gradient-to-r from-primary via-blue-600 to-indigo-600 bg-clip-text text-transparent">Studenti</span>
              </h2>
              <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto font-medium">
                Risultati reali di persone che hanno applicato il Metodo Orbitale
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
              {[
                {
                  name: "Marco R.",
                  role: "Imprenditore",
                  content: "Ho triplicato i miei contatti qualificati in soli 3 mesi applicando il Metodo Orbitale. Incredibile!",
                  rating: 5,
                  avatar: "MR"
                },
                {
                  name: "Laura B.",
                  role: "Consulente Marketing",
                  content: "Finalmente un metodo che funziona davvero. I risultati parlano chiaro: +250% di conversioni.",
                  rating: 5,
                  avatar: "LB"
                },
                {
                  name: "Andrea V.",
                  role: "CEO Startup",
                  content: "Il Metodo Orbitale ha trasformato completamente il nostro approccio al marketing. ROI straordinario.",
                  rating: 5,
                  avatar: "AV"
                }
              ].map((testimonial, index) => (
                <Card key={index} className="glass-card hover-lift border-0 shadow-xl group">
                  <CardContent className="p-6 sm:p-8">
                    <div className="space-y-6">
                      <div className="flex gap-1">
                        {Array(testimonial.rating).fill(0).map((_, i) => (
                          <Star key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                        ))}
                      </div>
                      <p className="text-slate-600 leading-relaxed italic font-medium">
                        "{testimonial.content}"
                      </p>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {testimonial.avatar}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{testimonial.name}</div>
                          <div className="text-sm text-primary font-medium">{testimonial.role}</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* LONG-FORM COPY SECTION - Newsletter Style */}
        <section className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">

              {/* Intro Copy */}
              <div className="prose prose-lg max-w-none mb-12">
                <p className="text-lg md:text-xl text-slate-700 leading-relaxed mb-6">
                  Sei un <strong>professionista ambizioso</strong>, un <strong>imprenditore determinato</strong>, o una <strong>famiglia che sogna un futuro sereno</strong>... ma senti che qualcosa non torna?
                </p>

                <p className="text-lg md:text-xl text-slate-700 leading-relaxed mb-6">
                  Guadagni bene, hai talento e dedichi tempo ed energia al tuo lavoro. Eppure, ogni mese, il tuo conto sembra fare un passo in avanti e due indietro. Ti senti intrappolato in una <strong className="text-blue-900">"ruota del criceto" finanziaria</strong>, schiacciato da debiti che non diminuiscono, o frustrato da capitali che "dormono" sul conto corrente, erosi dall'inflazione, mentre la vera crescita sembra un miraggio lontano.
                </p>

                <p className="text-lg md:text-xl text-slate-700 leading-relaxed mb-8">
                  Ti tormentano pensieri come:
                </p>

                <ul className="space-y-3 mb-8 text-lg text-slate-700">
                  <li className="flex items-start">
                    <span className="text-red-600 mr-2">●</span>
                    <span>"Nonostante i miei sforzi, non ho il controllo sul mio futuro finanziario."</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-600 mr-2">●</span>
                    <span>"E se un imprevisto distruggesse tutto quello che ho costruito?"</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-600 mr-2">●</span>
                    <span>"Potrò mai essere veramente libero e sicuro, senza la preoccupazione costante per i soldi?"</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-600 mr-2">●</span>
                    <span>"Ho paura di non essere abbastanza 'smart' con il denaro, anche se sono bravo nel mio campo."</span>
                  </li>
                </ul>

                <p className="text-lg md:text-xl text-slate-700 leading-relaxed mb-12">
                  Forse hai già provato approcci fai-da-te, letto libri, ascoltato influencer che promettono formule magiche o ti sei affidato a banche con prodotti standardizzati. Ma il risultato è sempre lo stesso: <strong>confusione, ansia, spreco di tempo e denaro</strong>, e la frustrazione di non avere un metodo affidabile che ti guidi davvero. Ti senti solo e senza una strategia chiara, convinto che "la finanza sia per esperti" o che "il tuo reddito non sia sufficiente per costruire un vero patrimonio".
                </p>

                {/* La Verità Sconvolgente */}
                <div className="bg-slate-50 border-l-4 border-slate-700 p-8 rounded-r-lg mb-12">
                  <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
                    La Verità Sconvolgente che Nessuno Ti Ha Mai Detto<br />
                    <span className="text-xl text-slate-700">(L'Errore Nascosto del Mercato)</span>
                  </h3>

                  <p className="text-lg text-slate-700 leading-relaxed mb-4">
                    Permettimi di svelarti l'errore che sta bloccando la tua crescita e la tua libertà. Il mercato ti ha venduto una <strong>gigantesca bugia</strong>: "Più fatturato = più ricchezza."
                  </p>

                  <p className="text-lg text-slate-700 leading-relaxed mb-4">
                    Ti spingono a credere che l'unica soluzione sia lavorare di più, aumentare le entrate, spingere al massimo. Ma la verità è che <strong className="text-slate-900">non ti serve più fatturato se poi non ti resta nulla</strong>. Non ti servono più soldi in entrata se quei soldi ti scivolano via dalle mani, assorbiti da debiti, inflazione o investimenti inefficienti.
                  </p>

                  <p className="text-xl font-bold text-slate-900 leading-relaxed">
                    Il vero problema non è quanto incassi, ma quanto del tuo denaro resta... e soprattutto, quanto lavora per te.
                  </p>
                </div>

                <p className="text-lg md:text-xl text-slate-700 leading-relaxed mb-12">
                  Finché prenderai decisioni finanziarie basate su intuizioni, paure, consigli generici, o soluzioni superficiali che non affrontano la radice del problema, continuerai a sentirti in trappola. Ti affidi a banche che vendono prodotti, a influencer che propongono "trend" senza basi scientifiche, o a fogli di calcolo rudimentali che non offrono un vero controllo. Non è colpa tua: il mercato è saturo di promesse vuote che distolgono dal vero obiettivo di costruire un patrimonio solido e duraturo.
                </p>

                <p className="text-lg md:text-xl text-slate-700 leading-relaxed mb-12">
                  Ecco perché tutti questi tentativi ti hanno lasciato con la <strong className="text-blue-900">"Miopia del Breve Termine"</strong>, incapace di costruire un piano solido e prevedibile per la tua sicurezza finanziaria futura.
                </p>

                {/* La Nuova Speranza */}
                <div className="bg-slate-50 border-l-4 border-emerald-700 p-8 rounded-r-lg mb-12">
                  <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
                    La Nuova Speranza: Il Metodo ORBITALE® a 4 Fasi
                  </h3>
                  <p className="text-xl font-semibold text-slate-700 mb-4">
                    Il Tuo Sistema Ingegnerizzato per il Controllo Totale
                  </p>

                  <p className="text-lg text-slate-700 leading-relaxed mb-4">
                    Io sono <strong className="text-slate-900">Alessio Chianetta</strong>, e il mio background di <strong>ex programmatore</strong> mi ha permesso di vedere la finanza non come un'arte oscura, ma come un <strong>sistema logico che può essere ingegnerizzato</strong>. Ho creato il <strong className="text-emerald-700">Metodo ORBITALE</strong>, l'unico sistema in Italia specializzato nell'aumento del patrimonio personale, non del fatturato.
                  </p>

                  <p className="text-lg text-slate-700 leading-relaxed">
                    Il Metodo ORBITALE è la nuova speranza per te che hai provato e fallito. È la <strong>certezza di seguire un sistema logico e scientifico</strong> che elimina lo stress, trasforma il caos in ordine, e ti porta a risultati prevedibili e garantiti.
                  </p>
                </div>

                {/* Come Funziona */}
                <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6">
                  Come Funziona il Metodo ORBITALE?<br />
                  <span className="text-xl text-blue-700">Il Tuo Blueprint Dalla Trappola alla Libertà</span>
                </h3>

                <p className="text-lg md:text-xl text-slate-700 leading-relaxed mb-8">
                  Ti guiderò passo dopo passo attraverso un processo a 4 fasi, supportato da un ecosistema tecnologico proprietario e dalla mia mentorship personale:
                </p>

                {/* 4 FASI */}
                <div className="space-y-8 mb-12">
                  <div className="border-l-4 border-red-500 pl-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white font-bold text-xl">
                        1
                      </div>
                      <h4 className="text-xl md:text-2xl font-bold text-slate-900">
                        FASE 1: LIBERAZIONE – Elimina i Debiti e Crea Liquidità Immediata
                      </h4>
                    </div>
                    <p className="text-lg text-slate-700 leading-relaxed">
                      Smettila di essere schiacciato. Attraverso la nostra provata strategia dell'<strong>"Effetto Valanga"</strong>, ridurrai ed eliminerai i tuoi debiti (mutui, prestiti, carte di credito) in tempi record, liberando risorse e un'incredibile sensazione di sollievo e controllo. Questa non è teoria, è il primo passo ingegneristico per riprendere il respiro.
                    </p>
                  </div>

                  <div className="border-l-4 border-blue-500 pl-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xl">
                        2
                      </div>
                      <h4 className="text-xl md:text-2xl font-bold text-slate-900">
                        FASE 2: ACCUMULO – Costruisci il Tuo Fondo e Automatizza i Risparmi
                      </h4>
                    </div>
                    <p className="text-lg text-slate-700 leading-relaxed">
                      Basta che il tuo denaro "dorma". Con il <strong className="text-blue-700">Software Orbitale®</strong>, la nostra piattaforma proprietaria, automatizzerai la gestione delle tue spese, creerai un budget chiaro, calcolerai il tuo Net Worth in tempo reale e trasformerai ogni euro in un mattoncino per il tuo patrimonio. Questa fase elimina la "Gestione Fai-da-Te Non Strutturata", portandoti controllo totale e consapevolezza finanziaria.
                    </p>
                  </div>

                  <div className="border-l-4 border-green-500 pl-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white font-bold text-xl">
                        3
                      </div>
                      <h4 className="text-xl md:text-2xl font-bold text-slate-900">
                        FASE 3: MOLTIPLICAZIONE – Fai Lavorare i Tuoi Soldi per Te
                      </h4>
                    </div>
                    <p className="text-lg text-slate-700 leading-relaxed">
                      È tempo che il tuo denaro generi altro denaro. Ti insegnerò strategie di investimento semplici e sicure, personalizzate per i tuoi obiettivi. Dimentica la complessità e l'ansia: il tuo capitale lavorerà in modo consistente e produttivo, facendoti raggiungere un patrimonio di <strong className="text-green-700">€100.000 - €500.000 in 2-4 anni</strong>. La "Mentalità della Ruota del Criceto" sarà solo un ricordo.
                    </p>
                  </div>

                  <div className="border-l-4 border-yellow-500 pl-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center text-white font-bold text-xl">
                        4
                      </div>
                      <h4 className="text-xl md:text-2xl font-bold text-slate-900">
                        FASE 4: STABILITÀ – Genera Rendite Passive e Raggiungi la Vera Libertà
                      </h4>
                    </div>
                    <p className="text-lg text-slate-700 leading-relaxed">
                      L'obiettivo finale: un flusso costante di reddito passivo (<strong className="text-yellow-700">almeno €2.000 al mese</strong>) che ti darà la libertà di scegliere, non di essere scelto dal denaro. Costruirai un piano finanziario solido e scientificamente strutturato per tutti i tuoi obiettivi di vita (pensione, figli, progetti personali), garantendo tranquillità e realizzazione dei tuoi sogni.
                    </p>
                  </div>
                </div>

                {/* Perché il Metodo ORBITALE è l'unica scelta */}
                <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6">
                  Perché il Metodo ORBITALE è L'UNICA SCELTA Logica e Infallibile:
                </h3>

                <div className="space-y-6 mb-12">
                  <div className="bg-slate-50 p-6 rounded-lg border-l-4 border-slate-700">
                    <h4 className="text-lg font-bold text-slate-900 mb-2">
                      ● Tecnologia Proprietaria & Intelligenza Artificiale
                    </h4>
                    <p className="text-slate-700">
                      L'Ecosistema Finanziario Potenziato (EFP) include il Software Orbitale e la Piattaforma CoachAle con la nostra <strong>AI Assistant 24/7</strong>. Un'AI che conosce ogni tua transazione, obiettivo e progresso, offrendoti supporto continuo e risposte contestuali, eliminando la "Paralisi da Analisi/Overload Informativo".
                    </p>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-lg border-l-4 border-emerald-700">
                    <h4 className="text-lg font-bold text-slate-900 mb-2">
                      ● Formazione d'Élite Ingegnerizzata
                    </h4>
                    <p className="text-slate-700">
                      L'<strong>Accademia Orbitale: Percorso 52 Settimane</strong> ti fornisce una conoscenza organica e strutturata, con lezioni video, materiali, esercizi pratici e revisione costante da parte del consulente, per eliminare l'"Ignoranza Finanziaria Sistemica".
                    </p>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-lg border-l-4 border-amber-600">
                    <h4 className="text-lg font-bold text-slate-900 mb-2">
                      ● Mentorship 1-to-1 & Piano d'Azione Personalizzato
                    </h4>
                    <p className="text-slate-700">
                      Attraverso <strong>Deep Research</strong> e sessioni individuali strategiche, creeremo un piano d'azione unico, su misura per te, superando blocchi mentali e accelerando i tuoi obiettivi. Non è un "prodotto standardizzato", ma la tua roadmap personale.
                    </p>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-lg border-l-4 border-slate-700">
                    <h4 className="text-lg font-bold text-slate-900 mb-2">
                      ● Rischio Inverso & Risultati Garantiti
                    </h4>
                    <p className="text-slate-700">
                      La nostra fiducia nel Metodo ORBITALE è tale che offriamo una garanzia unica: <strong>se non ottieni risultati misurabili entro 30 giorni, continuiamo a seguirti gratis finché non li raggiungi</strong>. Il rischio è nostro. Non tuo.
                    </p>
                  </div>
                </div>

                {/* È Ora di Agire */}
                <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-slate-200 mb-12">
                  {/* Header Section */}
                  <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-8 md:p-12 text-center">
                    <h3 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                      È Ora di Agire: Candidati per la Tua Consulenza Gratuita
                    </h3>
                    <p className="text-lg md:text-xl text-slate-200 max-w-3xl mx-auto leading-relaxed">
                      Il Metodo ORBITALE è un percorso <strong className="text-amber-400">esclusivo e ad alto valore</strong>, non è per tutti. Per garantire il massimo risultato e un'esperienza personalizzata, lavoriamo solo con persone determinate.
                    </p>
                  </div>

                  {/* Content Section */}
                  <div className="p-6 md:p-12">
                    {/* PER CHI È / NON È PER TE SE */}
                    <div className="grid md:grid-cols-2 gap-6 md:gap-8 mb-10">
                      {/* PER CHI È */}
                      <div className="bg-gradient-to-br from-emerald-50 to-white rounded-2xl p-6 md:p-8 border-2 border-emerald-200 hover:border-emerald-300 transition-all">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
                            <CheckCircle2 className="h-6 w-6 text-white" />
                          </div>
                          <h4 className="text-xl md:text-2xl font-bold text-emerald-800">
                            PER CHI È
                          </h4>
                        </div>
                        <ul className="space-y-4">
                          <li className="flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                            <span className="text-slate-700 leading-relaxed">Professionisti ambiziosi o famiglie determinate (Imprenditore, Freelance, Dipendente) con reddito stabile</span>
                          </li>
                          <li className="flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                            <span className="text-slate-700 leading-relaxed">Chi vuole impegnarsi attivamente in un metodo strutturato e basato sui dati</span>
                          </li>
                          <li className="flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                            <span className="text-slate-700 leading-relaxed">Chi comprende che la libertà finanziaria richiede disciplina e un piano scientifico</span>
                          </li>
                        </ul>
                      </div>

                      {/* NON È PER TE SE */}
                      <div className="bg-gradient-to-br from-red-50 to-white rounded-2xl p-6 md:p-8 border-2 border-red-200 hover:border-red-300 transition-all">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0">
                            <XCircle className="h-6 w-6 text-white" />
                          </div>
                          <h4 className="text-xl md:text-2xl font-bold text-red-800">
                            NON È PER TE SE
                          </h4>
                        </div>
                        <ul className="space-y-4">
                          <li className="flex items-start gap-3">
                            <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                            <span className="text-slate-700 leading-relaxed">Cerchi "soldi facili" o formule magiche senza impegno</span>
                          </li>
                          <li className="flex items-start gap-3">
                            <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                            <span className="text-slate-700 leading-relaxed">Vuoi risolvere problemi aziendali strutturali (non è consulenza aziendale)</span>
                          </li>
                          <li className="flex items-start gap-3">
                            <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                            <span className="text-slate-700 leading-relaxed">Non sei disposto a seguire un metodo disciplinato e scientifico</span>
                          </li>
                        </ul>
                      </div>
                    </div>

                    {/* Call to Action Text */}
                    <div className="text-center mb-10 py-6 px-4 bg-slate-50 rounded-xl">
                      <p className="text-xl md:text-2xl font-bold text-slate-900">
                        Se ti riconosci nei requisiti di sinistra, sei pronto a calcolare la tua libertà finanziaria.
                      </p>
                    </div>

                    {/* Il Processo */}
                    <div className="mb-10">
                      <h4 className="text-2xl font-bold mb-8 text-center text-slate-900">Il processo è semplice ma accurato:</h4>
                      <div className="space-y-6 max-w-3xl mx-auto">
                        <div className="flex items-start gap-4 bg-slate-50 p-6 rounded-xl hover:shadow-md transition-all">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0 shadow-lg">
                            1
                          </div>
                          <div className="pt-1">
                            <p className="text-slate-700 leading-relaxed">
                              Clicca il bottone qui sotto <strong>"Voglio candidarmi per ottenere la tua consulenza gratuita"</strong>.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-4 bg-slate-50 p-6 rounded-xl hover:shadow-md transition-all">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0 shadow-lg">
                            2
                          </div>
                          <div className="pt-1">
                            <p className="text-slate-700 leading-relaxed">
                              Compila attentamente il breve modulo di candidatura. Le tue risposte ci aiuteranno a capire la tua situazione e a valutare la tua idoneità al Metodo ORBITALE.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-4 bg-slate-50 p-6 rounded-xl hover:shadow-md transition-all">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0 shadow-lg">
                            3
                          </div>
                          <div className="pt-1">
                            <p className="text-slate-700 leading-relaxed">
                              Una volta inviata la tua candidatura, il nostro team la esaminerà. Se soddisfi i nostri requisiti, ti contatteremo per fissare la tua consulenza gratuita con Alessio Chianetta.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Final CTA */}
                    <div className="text-center py-8 px-4 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl">
                      <p className="text-2xl md:text-3xl font-bold text-white mb-2">
                        Smetti di sognare la libertà finanziaria.
                      </p>
                      <p className="text-2xl md:text-3xl font-bold mb-3">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-200">Inizia a calcolarla.</span>
                      </p>
                      <p className="text-lg md:text-xl text-slate-300 font-medium">
                        Il tuo futuro ti aspetta.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* FORM DI CANDIDATURA */}
        <section id="candidatura-form" className="py-12 md:py-20 bg-slate-50">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <div className="bg-white p-8 md:p-12 rounded-2xl shadow-2xl border border-slate-200">
                <div className="text-center mb-8">
                  <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                    Candidati per la Tua Consulenza Gratuita
                  </h2>
                  <p className="text-lg text-slate-600">
                    Compila il modulo con attenzione. Se soddisfi i requisiti, ti contatteremo entro 24 ore.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="firstName" className="text-base font-semibold">
                        Nome *
                      </Label>
                      <Input
                        id="firstName"
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                        className="mt-2 h-12 text-base"
                        placeholder="Mario"
                      />
                    </div>

                    <div>
                      <Label htmlFor="lastName" className="text-base font-semibold">
                        Cognome *
                      </Label>
                      <Input
                        id="lastName"
                        type="text"
                        required
                        value={formData.lastName}
                        onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                        className="mt-2 h-12 text-base"
                        placeholder="Rossi"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-base font-semibold">
                      Email *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="mt-2 h-12 text-base"
                      placeholder="mario.rossi@email.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-base font-semibold">
                      Telefono *
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="mt-2 h-12 text-base"
                      placeholder="+39 333 1234567"
                    />
                  </div>

                  <div>
                    <Label htmlFor="businessName" className="text-base font-semibold">
                      Azienda / Professione
                    </Label>
                    <Input
                      id="businessName"
                      type="text"
                      value={formData.businessName}
                      onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                      className="mt-2 h-12 text-base"
                      placeholder="La tua azienda o professione"
                    />
                  </div>

                  <div>
                    <Label htmlFor="currentSituation" className="text-base font-semibold">
                      Qual è la tua situazione finanziaria attuale? *
                    </Label>
                    <Textarea
                      id="currentSituation"
                      required
                      value={formData.currentSituation}
                      onChange={(e) => setFormData({...formData, currentSituation: e.target.value})}
                      className="mt-2 min-h-32 text-base"
                      placeholder="Descrivici brevemente: debiti, risparmi, obiettivi, sfide principali..."
                    />
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                    <input
                      type="checkbox"
                      id="privacyConsent"
                      checked={formData.privacyConsent}
                      onChange={(e) => setFormData({...formData, privacyConsent: e.target.checked})}
                      className="mt-1 h-5 w-5 rounded border-slate-300"
                    />
                    <Label htmlFor="privacyConsent" className="text-sm text-slate-700 cursor-pointer">
                      Acconsento al trattamento dei miei dati personali secondo la privacy policy. 
                      Comprendo che questo è un percorso esclusivo e che i dati verranno utilizzati 
                      esclusivamente per valutare la mia candidatura al Metodo ORBITALE®.
                    </Label>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-base md:text-xl py-6 md:py-8 rounded-lg shadow-xl"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 md:mr-3 h-5 w-5 md:h-6 md:w-6 animate-spin" />
                        <span>Invio in corso...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 md:mr-3 h-5 w-5 md:h-6 md:w-6" />
                        <span>INVIA LA MIA CANDIDATURA</span>
                      </>
                    )}
                  </Button>

                  <p className="text-center text-sm text-slate-500">
                    🔒 I tuoi dati sono protetti e non verranno mai condivisi con terze parti
                  </p>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* CTA FINALE */}
        <section className="py-16 md:py-24 bg-slate-900 text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                NON PERDERE ALTRO TEMPO.<br />
                <span className="text-amber-400">CALCOLA LA TUA LIBERTÀ FINANZIARIA.</span>
              </h2>

              <p className="text-xl md:text-2xl text-slate-200 mb-10">
                Il tuo futuro finanziario inizia ora. Fai il primo passo verso la libertà che meriti.
              </p>

              <Button 
                onClick={scrollToForm}
                size="lg"
                className="w-full max-w-4xl bg-amber-600 hover:bg-amber-700 text-white font-bold px-6 md:px-16 py-6 md:py-10 rounded-lg shadow-2xl transition-all"
              >
                <ArrowRight className="mr-2 md:mr-4 h-6 w-6 md:h-8 md:w-8 flex-shrink-0" />
                <span className="text-center leading-tight">
                  <span className="hidden md:inline text-xl lg:text-2xl">CLICCA E CANDIDATI ORA PER LA TUA CONSULENZA GRATUITA</span>
                  <span className="hidden sm:inline md:hidden text-base">CANDIDATI PER LA CONSULENZA GRATUITA</span>
                  <span className="sm:hidden text-sm">CANDIDATI ORA</span>
                </span>
              </Button>

              <p className="text-sm text-slate-400 mt-6">
                ⏰ Posti limitati - Non aspettare che sia troppo tardi
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}