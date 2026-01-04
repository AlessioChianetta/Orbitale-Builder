
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  ArrowRight,
  MessageCircle,
  Phone,
  Mail,
  CheckCircle,
  Clock,
  Euro,
  Shield,
  Zap
} from "lucide-react";
import { Link } from "wouter";
import { SEOHead, useSEOPerformance } from "@/components/SEOHead";
import { Helmet } from "react-helmet";

const faqCategories = [
  { name: "Tutti", count: 24 },
  { name: "Servizi", count: 8 },
  { name: "Prezzi", count: 6 },
  { name: "Tempi", count: 4 },
  { name: "Supporto", count: 6 }
];

const faqs = [
  {
    category: "Servizi",
    question: "Quali servizi offrite esattamente?",
    answer: "Offriamo una gamma completa di servizi digitali: consulenza strategica, sviluppo web e CMS personalizzato, marketing digitale (Google Ads, Social Media, Email Marketing), SEO, e-commerce, applicazioni mobile, sicurezza web e formazione. Ogni servizio può essere personalizzato in base alle specifiche esigenze del tuo business.",
    popular: true
  },
  {
    category: "Tempi",
    question: "Quanto tempo serve per vedere i primi risultati?",
    answer: "I tempi variano in base al servizio: per le campagne Google Ads vediamo risultati in 2-4 settimane, per il SEO servono tipicamente 3-6 mesi per risultati significativi, mentre per lo sviluppo web i tempi sono 4-8 settimane a seconda della complessità del progetto. Durante la consulenza iniziale ti forniremo un timeline dettagliato.",
    popular: true
  },
  {
    category: "Prezzi",
    question: "Quali sono i vostri prezzi?",
    answer: "I nostri prezzi partono da €299/mese per la consulenza strategica, €899 per lo sviluppo completo (una tantum + hosting), e €599/mese per il marketing digitale. Offriamo sempre preventivi personalizzati gratuiti perché ogni progetto ha esigenze specifiche. La prima consulenza è sempre gratuita e senza impegno.",
    popular: true
  },
  {
    category: "Servizi",
    question: "Offrite garanzie sui risultati?",
    answer: "Sì, offriamo garanzie specifiche per ogni servizio. Ad esempio, garantiamo un aumento delle conversioni del 20% entro 60 giorni per i progetti di ottimizzazione CRO, e un ROI minimo di 3:1 per le campagne pubblicitarie dopo il secondo mese. Ogni garanzia viene definita chiaramente nel contratto.",
    popular: false
  },
  {
    category: "Servizi",
    question: "Lavorate anche con piccole aziende?",
    answer: "Assolutamente! Abbiamo soluzioni per ogni budget e dimensione aziendale, dalle startup alle grandi corporate. Il nostro approccio è sempre personalizzato e scalabile in base alle tue esigenze e possibilità economiche. Offriamo anche piani di pagamento flessibili per le piccole aziende.",
    popular: true
  },
  {
    category: "Supporto",
    question: "Che tipo di supporto fornite dopo il lancio?",
    answer: "Forniamo supporto continuo attraverso diversi canali: supporto tecnico 24/7 per emergenze, aggiornamenti mensili gratuiti, backup automatici, monitoraggio delle performance, e un account manager dedicato. Offriamo anche pacchetti di manutenzione personalizzati in base alle tue esigenze.",
    popular: false
  },
  {
    category: "Servizi",
    question: "Posso gestire il CMS autonomamente?",
    answer: "Sì, il nostro CMS è progettato per essere estremamente user-friendly. Anche senza competenze tecniche puoi gestire contenuti, pubblicare articoli, aggiornare pagine e monitorare le performance. Forniamo formazione completa (video tutorial + sessioni live) e supporto continuo per renderti completamente autonomo.",
    popular: true
  },
  {
    category: "Prezzi",
    question: "Ci sono costi nascosti?",
    answer: "No, la trasparenza è uno dei nostri valori fondamentali. Tutti i costi vengono comunicati chiaramente nel preventivo iniziale. Gli unici costi aggiuntivi possono derivare da richieste di modifiche sostanziali al progetto originale, che vengono sempre discusse e approvate prima dell'implementazione.",
    popular: false
  },
  {
    category: "Tempi",
    question: "Posso richiedere modifiche durante lo sviluppo?",
    answer: "Sì, il nostro processo prevede revisioni periodiche e la possibilità di modifiche. Includiamo fino a 3 round di revisioni gratuite in ogni progetto. Utilizziamo un approccio agile che ti permette di vedere i progressi e dare feedback durante tutto lo sviluppo, non solo alla fine.",
    popular: false
  },
  {
    category: "Supporto",
    question: "Come funziona il processo di onboarding?",
    answer: "Il processo inizia con una consulenza gratuita per comprendere le tue esigenze. Poi definiamo insieme strategia e obiettivi, creiamo un project plan dettagliato, assegniamo il team e l'account manager dedicato. Riceverai accesso a una dashboard per monitorare i progressi in tempo reale.",
    popular: false
  },
  {
    category: "Prezzi",
    question: "Offrite sconti per contratti annuali?",
    answer: "Sì, offriamo sconti significativi per contratti annuali: 15% di sconto per contratti di 12 mesi e 20% per contratti di 24 mesi. Inoltre, per i clienti a lungo termine offriamo servizi aggiuntivi gratuiti come consulenze strategiche mensili e report avanzati.",
    popular: false
  },
  {
    category: "Servizi",
    question: "Lavorate con aziende di tutti i settori?",
    answer: "Sì, abbiamo esperienza in diversi settori: e-commerce, servizi professionali, manifatturiero, immobiliare, sanitario, educativo e molti altri. Il nostro approccio metodologico si adatta a qualsiasi settore, mentre la strategia viene sempre personalizzata in base al mercato di riferimento.",
    popular: false
  },
  {
    category: "Supporto",
    question: "Cosa succede se non sono soddisfatto dei risultati?",
    answer: "Offriamo una garanzia 'soddisfatti o rimborsati' di 30 giorni per tutti i nostri servizi. Se non sei soddisfatto dei risultati, analizziamo insieme cosa non ha funzionato e, se necessario, procediamo con il rimborso totale. La tua soddisfazione è la nostra priorità assoluta.",
    popular: false
  },
  {
    category: "Tempi",
    question: "Posso accelerare i tempi di sviluppo?",
    answer: "Sì, offriamo un servizio 'Fast Track' che riduce i tempi di sviluppo del 40-50% dedicando un team espanso al tuo progetto. Questo servizio ha un costo aggiuntivo del 30% ma garantisce delivery più rapidi mantenendo la stessa qualità.",
    popular: false
  },
  {
    category: "Prezzi",
    question: "I prezzi includono l'hosting e il dominio?",
    answer: "Per il servizio di sviluppo completo, l'hosting è incluso per il primo anno (valore €588). Il dominio è incluso solo se nuovo, altrimenti ti aiutiamo gratuitamente nel trasferimento. Dopo il primo anno, l'hosting ha un costo di €49/mese che include backup, sicurezza, aggiornamenti e supporto.",
    popular: false
  },
  {
    category: "Supporto",
    question: "Fornite formazione al mio team?",
    answer: "Sì, offriamo formazione completa e personalizzata per il tuo team. Include sessioni live, video tutorial, documentazione dettagliata e workshop pratici. La formazione base è inclusa in tutti i progetti, mentre per esigenze specifiche offriamo pacchetti formativi avanzati.",
    popular: false
  },
  {
    category: "Servizi",
    question: "Gestite anche le campagne pubblicitarie esistenti?",
    answer: "Sì, possiamo prendere in gestione le tue campagne esistenti. Iniziamo sempre con un audit completo gratuito per identificare le aree di miglioramento, poi ottimizziamo gradualmente per massimizzare il ROI. Spesso riusciamo a ridurre i costi del 30-50% mantenendo o aumentando le conversioni.",
    popular: false
  },
  {
    category: "Prezzi",
    question: "Come funzionano i pagamenti?",
    answer: "Accettiamo pagamenti con bonifico bancario, carta di credito e PayPal. Per progetti di sviluppo richiediamo un acconto del 50% all'inizio e il saldo alla consegna. Per i servizi mensili, la fatturazione avviene in anticipo. Offriamo anche piani di pagamento personalizzati per progetti di grande entità.",
    popular: false
  },
  {
    category: "Supporto",
    question: "Avete un supporto di emergenza?",
    answer: "Sì, offriamo supporto di emergenza 24/7 per i clienti con contratti di manutenzione Premium. Per situazioni critiche (sito down, attacchi hacker, etc.) interveniamo entro 30 minuti. Il servizio di emergenza ha un costo aggiuntivo ma garantisce la continuità del tuo business online.",
    popular: false
  },
  {
    category: "Servizi",
    question: "Realizzate anche app mobile?",
    answer: "Sì, sviluppiamo app native per iOS e Android, oltre a Progressive Web App (PWA). Il nostro team ha esperienza con React Native, Flutter e sviluppo nativo. Offriamo anche servizi di pubblicazione sui store, manutenzione e aggiornamenti continui.",
    popular: false
  },
  {
    category: "Tempi",
    question: "Quanto tempo serve per un restyling completo?",
    answer: "Un restyling completo richiede tipicamente 6-12 settimane, a seconda della complessità del sito e delle funzionalità richieste. Il processo include analisi dell'esistente, nuovo design, sviluppo, migrazione contenuti, testing e ottimizzazione. Ti forniamo un timeline dettagliato durante la consulenza iniziale.",
    popular: false
  },
  {
    category: "Supporto",
    question: "Posso cambiare piano in corso d'opera?",
    answer: "Sì, puoi sempre fare upgrade o downgrade del tuo piano. Per gli upgrade, le nuove funzionalità vengono attivate immediatamente e paghi la differenza pro-rata. Per i downgrade, le modifiche vengono applicate al rinnovo successivo. Ti aiutiamo sempre a scegliere il piano più adatto alle tue esigenze attuali.",
    popular: false
  },
  {
    category: "Prezzi",
    question: "Cosa include esattamente il servizio di manutenzione?",
    answer: "Il servizio di manutenzione include: backup automatici quotidiani, aggiornamenti di sicurezza, monitoraggio uptime 24/7, ottimizzazione performance, supporto tecnico, report mensili, e fino a 2 ore di modifiche minori. Abbiamo diversi piani di manutenzione per adattarci a ogni esigenza e budget.",
    popular: false
  },
  {
    category: "Servizi",
    question: "Offrite consulenze one-shot?",
    answer: "Sì, offriamo consulenze singole di 2 ore a €299 per chi ha bisogno di consigli strategici specifici, audit del sito esistente, o validazione di un'idea di business. La consulenza include un report dettagliato con raccomandazioni actionable che puoi implementare autonomamente o con il nostro supporto.",
    popular: false
  }
];

export default function FAQ() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tutti");
  const [expandedItems, setExpandedItems] = useState<number[]>([]);

  // SEO Performance monitoring
  useSEOPerformance('faq');

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "Tutti" || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const popularFaqs = faqs.filter(faq => faq.popular);

  const toggleExpanded = (index: number) => {
    setExpandedItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  // Generate FAQ Schema for SEO
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <>
      <SEOHead 
        type="website"
        url="/faq"
        usePageData={true}
      />
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>
      </Helmet>
      <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-12 bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 bg-primary/10 text-primary border-primary/20">FAQ</Badge>
            <h1 className="font-heading font-bold text-5xl mb-6" data-testid="heading-hero">
              Domande Frequenti
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Trova rapidamente le risposte alle domande più comuni sui nostri servizi, 
              prezzi, tempistiche e modalità di lavoro.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Cerca nelle FAQ..."
                className="pl-10 py-3"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Popular Questions */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-accent/10 text-accent-foreground">Domande Popolari</Badge>
            <h2 className="font-heading font-bold text-4xl mb-4">
              Le Risposte che Cerchi di Più
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Le domande più frequenti dei nostri clienti con risposte dettagliate.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-16">
            {popularFaqs.slice(0, 4).map((faq, index) => (
              <Card key={index} className="hover-elevate">
                <CardHeader>
                  <CardTitle className="text-lg flex items-start gap-3">
                    <HelpCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    {faq.question}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* All FAQs */}
      <section className="py-20 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-12">
            
            {/* Categories Sidebar */}
            <div className="lg:w-1/4">
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle>Categorie</CardTitle>
                  <CardDescription>
                    Filtra per argomento
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {faqCategories.map((category, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedCategory(category.name)}
                        className={`w-full flex justify-between items-center p-3 rounded text-left transition-colors ${
                          selectedCategory === category.name 
                            ? 'bg-primary text-primary-foreground' 
                            : 'hover:bg-muted'
                        }`}
                      >
                        <span>{category.name}</span>
                        <Badge variant={selectedCategory === category.name ? "secondary" : "outline"}>
                          {category.count}
                        </Badge>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* FAQ List */}
            <div className="lg:w-3/4">
              <div className="mb-8">
                <h3 className="font-heading font-bold text-2xl mb-2">
                  {selectedCategory === "Tutti" ? "Tutte le Domande" : `Domande su ${selectedCategory}`}
                </h3>
                <p className="text-muted-foreground">
                  {filteredFaqs.length} domande trovate
                </p>
              </div>

              <div className="space-y-4">
                {filteredFaqs.map((faq, index) => (
                  <Card key={index} className="overflow-hidden">
                    <button
                      onClick={() => toggleExpanded(index)}
                      className="w-full p-6 text-left hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="flex-shrink-0 mt-1">
                            {faq.category === "Servizi" && <CheckCircle className="h-5 w-5 text-blue-500" />}
                            {faq.category === "Prezzi" && <Euro className="h-5 w-5 text-green-500" />}
                            {faq.category === "Tempi" && <Clock className="h-5 w-5 text-orange-500" />}
                            {faq.category === "Supporto" && <Shield className="h-5 w-5 text-purple-500" />}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg mb-1">{faq.question}</h4>
                            <Badge variant="outline" className="text-xs">
                              {faq.category}
                            </Badge>
                            {faq.popular && (
                              <Badge className="ml-2 text-xs bg-primary">
                                Popolare
                              </Badge>
                            )}
                          </div>
                        </div>
                        {expandedItems.includes(index) ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        )}
                      </div>
                    </button>
                    
                    {expandedItems.includes(index) && (
                      <div className="px-6 pb-6 border-t bg-muted/20">
                        <div className="pt-4">
                          <p className="text-muted-foreground leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>

              {filteredFaqs.length === 0 && (
                <Card className="text-center p-12">
                  <HelpCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Nessuna domanda trovata</h3>
                  <p className="text-muted-foreground mb-6">
                    Prova a modificare i termini di ricerca o contattaci direttamente.
                  </p>
                  <Button asChild>
                    <Link href="/contatti">
                      Contattaci
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </Card>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Support */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-heading font-bold text-3xl mb-4">
              Non Hai Trovato la Risposta?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Il nostro team è sempre disponibile per rispondere alle tue domande specifiche.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center hover-elevate">
              <CardHeader>
                <div className="mx-auto mb-4 p-4 bg-primary/10 rounded-full w-fit">
                  <MessageCircle className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Chat Live</CardTitle>
                <CardDescription>
                  Chatta direttamente con un esperto
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-6">
                  Disponibile Lun-Ven 9:00-18:00
                </p>
                <Button asChild className="w-full">
                  <a href="https://wa.me/393351234567" target="_blank" rel="noopener noreferrer">
                    Inizia Chat
                    <MessageCircle className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center hover-elevate">
              <CardHeader>
                <div className="mx-auto mb-4 p-4 bg-primary/10 rounded-full w-fit">
                  <Phone className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Chiamata Telefonica</CardTitle>
                <CardDescription>
                  Parla direttamente con un consulente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-6">
                  +39 02 1234 5678<br />
                  Lun-Ven 9:00-18:00
                </p>
                <Button asChild className="w-full">
                  <a href="tel:+390212345678">
                    Chiama Ora
                    <Phone className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center hover-elevate">
              <CardHeader>
                <div className="mx-auto mb-4 p-4 bg-primary/10 rounded-full w-fit">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Email Supporto</CardTitle>
                <CardDescription>
                  Scrivi per domande dettagliate
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-6">
                  info@professionale.it<br />
                  Risposta entro 2 ore
                </p>
                <Button asChild className="w-full">
                  <Link href="/contatti">
                    Invia Email
                    <Mail className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary to-primary/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading font-bold text-4xl mb-6 text-primary-foreground">
            Pronto a Iniziare il Tuo Progetto?
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Ora che hai tutte le informazioni che ti servono, non perdere altro tempo. 
            Iniziamo subito a lavorare sul tuo successo digitale.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              asChild 
              size="lg" 
              className="bg-background text-foreground hover:bg-background/90"
            >
              <Link href="/contatti">
                Richiedi Consulenza Gratuita
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button 
              asChild 
              size="lg" 
              variant="outline" 
              className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
            >
              <Link href="/servizi">
                Vedi Tutti i Servizi
              </Link>
            </Button>
          </div>
          
          <p className="text-sm text-primary-foreground/70 mt-6">
            Consulenza 100% gratuita • Nessun impegno • Risposta garantita entro 2 ore
          </p>
        </div>
      </section>
    </div>
    </>
  );
}
