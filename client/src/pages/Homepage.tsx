import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle, PlayCircle, Star, XCircle, AlertTriangle, Zap, TrendingUp, Users, Award, Shield, Target } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Service } from "@shared/schema";
import { generateOptimizedAltText } from "@/lib/seoUtils";
import { SEOHead, useSEOPerformance } from "@/components/SEOHead";

// Example Data
const testimonials = [
  { name: "Marco Rossi", role: "CEO, TechStart SRL", content: "Le strategie che ci hanno fornito hanno portato a un aumento del 340% nelle conversioni in soli 3 mesi. Incredibile.", rating: 5, avatar: "MR" },
  { name: "Laura Bianchi", role: "Marketing Director, Fashion Hub", content: "Finalmente un partner che capisce le nostre esigenze e porta risultati concreti. Il team è professionale e sempre disponibile.", rating: 5, avatar: "LB" },
  { name: "Andrea Verdi", role: "Founder, GreenTech Solutions", content: "Il ROI delle campagne è triplicato in 6 mesi. Consiglio vivamente!", rating: 5, avatar: "AV" },
];

const WhoIsItFor = [ "Imprenditori che vogliono un sistema prevedibile per generare clienti.", "Professionisti che vogliono smettere di competere sul prezzo.", "Aziende stanche delle agenzie tradizionali senza risultati misurabili.", "Chiunque sia pronto a seguire un metodo testato e a impegnarsi per la crescita." ];
const WhoIsNotFor = [ "Chi cerca formule magiche o risultati immediati senza sforzo.", "Chi non è disposto a investire in una strategia a lungo termine.", "Aziende senza un prodotto/servizio di qualità.", "Chi non è aperto a nuove strategie e preferisce la propria comfort zone." ];

const stats = [
  { number: "500+", label: "Progetti Completati", icon: Award },
  { number: "98%", label: "Tasso di Successo", icon: Target },
  { number: "340%", label: "ROI Medio", icon: TrendingUp },
  { number: "24/7", label: "Supporto Dedicato", icon: Shield },
];

const clientLogos = [
    { name: "Client A", logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='60'%3E%3Crect fill='%23e2e8f0' width='160' height='60'/%3E%3Ctext x='50%25' y='50%25' font-size='12' fill='%2364748b' text-anchor='middle' dy='.3em'%3ECLIENT A%3C/text%3E%3C/svg%3E" },
    { name: "Client B", logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='60'%3E%3Crect fill='%23e2e8f0' width='160' height='60'/%3E%3Ctext x='50%25' y='50%25' font-size='12' fill='%2364748b' text-anchor='middle' dy='.3em'%3ECLIENT B%3C/text%3E%3C/svg%3E" },
    { name: "Client C", logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='60'%3E%3Crect fill='%23e2e8f0' width='160' height='60'/%3E%3Ctext x='50%25' y='50%25' font-size='12' fill='%2364748b' text-anchor='middle' dy='.3em'%3ECLIENT C%3C/text%3E%3C/svg%3E" },
    { name: "Client D", logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='60'%3E%3Crect fill='%23e2e8f0' width='160' height='60'/%3E%3Ctext x='50%25' y='50%25' font-size='12' fill='%2364748b' text-anchor='middle' dy='.3em'%3ECLIENT D%3C/text%3E%3C/svg%3E" },
    { name: "Client E", logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='60'%3E%3Crect fill='%23e2e8f0' width='160' height='60'/%3E%3Ctext x='50%25' y='50%25' font-size='12' fill='%2364748b' text-anchor='middle' dy='.3em'%3ECLIENT E%3C/text%3E%3C/svg%3E" },
];

// Componente ottimizzato per mobile con loading states e precaricamento
function AnimatedSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section 
      className={`${className} will-change-auto`} 
      style={{ 
        contentVisibility: 'auto', 
        containIntrinsicSize: '1px 500px',
        contain: 'layout style paint'
      }}
    >
      {children}
    </section>
  );
}

export default function Homepage() {
  const { data: servicesData, isLoading } = useQuery<Service[]>({ queryKey: ['/api/services'] });
  const mainService = servicesData?.find(s => s.isFeatured) || servicesData?.[0];

  // SEO Performance monitoring
  useSEOPerformance('homepage');

  // Hero video placeholder - no need to preload SVG data URIs
  const heroVideoPlaceholder = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1280' height='720'%3E%3Crect fill='%231e293b' width='1280' height='720'/%3E%3Ctext x='50%25' y='50%25' font-size='20' fill='%23ffffff' text-anchor='middle' dy='.3em'%3EGuarda il Video Sales Letter%3C/text%3E%3C/svg%3E";

  return (
    <>
      <SEOHead 
        keywords={['marketing a risposta diretta', 'lead generation', 'business growth', 'sistemi marketing', 'ROI', 'conversioni']}
        type="website"
        url="/"
        usePageData={true}
      />
      <div className="bg-gradient-to-br from-slate-50 via-white to-blue-50/30 text-foreground font-sans min-h-screen" style={{ WebkitOverflowScrolling: 'touch' }}>
      {/* Hero Section */}
      <section className="relative overflow-hidden section-padding bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]"></div>
        <div className="relative max-w-7xl mx-auto container-padding text-center">
          <div className="space-y-8">
            <div>
              <Badge variant="outline" className="glass-card border-primary/20 text-primary bg-primary/5 px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-bold rounded-full shadow-lg max-w-[90vw] text-center break-words">
                <Zap className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
                <span className="leading-tight">PER IMPRENDITORI E AZIENDE AMBIZIOSE</span>
              </Badge>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-heading font-black tracking-tight leading-tight">
              Smetti di Acquistare Clienti.
              <span className="block bg-gradient-to-r from-primary via-blue-600 to-indigo-600 bg-clip-text text-transparent mt-4">
                Costruisci un Sistema che li Attrae.
              </span>
            </h1>

            <p className="text-responsive-md mt-8 text-slate-600 max-w-4xl mx-auto leading-relaxed font-medium">
              Implementiamo sistemi di marketing a risposta diretta per trasformare la tua spesa pubblicitaria in un asset aziendale prevedibile e profittevole.
            </p>

            <div className="mt-12">
              <Card className="max-w-5xl mx-auto glass-card border-2 border-primary/10 rounded-3xl overflow-hidden group hover-lift">
                <div className="aspect-video bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center relative">
                  {/* Placeholder background sempre visibile */}
                  <div className="absolute inset-0 bg-slate-800"></div>
                  <img 
                    src={heroVideoPlaceholder}
                    alt={generateOptimizedAltText({
                      title: "Video Sales Letter",
                      description: "Scopri il sistema di marketing a risposta diretta per imprenditori e aziende ambiziose",
                      context: 'hero',
                      keywords: ['marketing', 'sistema', 'imprenditori', 'crescita aziendale']
                    })} 
                    className="w-full h-full object-cover opacity-80 relative z-10"
                    width="1280"
                    height="720"
                    loading="eager"
                    decoding="async"
                    style={{ contentVisibility: 'visible' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60 transition-all duration-500 group-hover:from-black/40 group-hover:to-black/40 z-20"></div>
                  <div className="absolute z-30">
                    <PlayCircle className="h-20 w-20 sm:h-24 sm:w-24 text-white drop-shadow-2xl cursor-pointer"/>
                  </div>
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              <div>
                <Button asChild size="lg" className="px-8 sm:px-12 py-6 sm:py-8 text-base sm:text-lg font-bold gradient-primary text-white shadow-2xl rounded-2xl hover-glow transition-all duration-300 w-full sm:w-auto">
                  <Link href="/candidatura">
                    CANDIDATI ORA PER LA TUA SESSIONE STRATEGICA
                    <ArrowRight className="ml-3 h-5 w-5 sm:h-6 sm:w-6"/>
                  </Link>
                </Button>
              </div>
              <p className="text-sm text-slate-500 font-medium">🔥 Posti limitati. Approvazione manuale richiesta.</p>
            </div>
          </div>
        </div>
      </section>



      {/* Social Proof */}
      <AnimatedSection>
        <section className="section-padding bg-white relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50/80 via-white to-blue-50/30"></div>
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
          
          <div className="relative max-w-7xl mx-auto container-padding">
            <div className="text-center space-y-12">
              {/* Header migliorato */}
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-xs font-semibold tracking-wider uppercase">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                  Aziende che si fidano di noi
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-700 max-w-3xl mx-auto leading-tight">
                  SI FIDANO DI NOI AZIENDE E PROFESSIONISTI IN TUTTA ITALIA
                </h3>
              </div>

              {/* Logos con design migliorato */}
              <div className="relative">
                {/* Gradient Fade Edges */}
                <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white via-white/90 to-transparent z-10"></div>
                <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white via-white/90 to-transparent z-10"></div>
                
                {/* Logo Container con padding migliorato */}
                <div className="overflow-hidden py-8">
                  <div className="flex animate-scroll-logos-slow whitespace-nowrap">
                    {/* Prima serie di loghi */}
                    <div className="flex items-center justify-center gap-12 sm:gap-16 lg:gap-20 mx-8">
                      {clientLogos.map((logo) => (
                        <div
                          key={logo.name}
                          className="relative group flex-shrink-0"
                        >
                          <div className="relative p-6 bg-white rounded-2xl shadow-lg border border-slate-100 hover:shadow-2xl hover:border-primary/20 transition-all duration-500 hover:-translate-y-2">
                            <img
                              src={logo.logo}
                              alt={logo.name}
                              className="h-12 sm:h-16 lg:h-20 w-auto object-contain filter grayscale group-hover:grayscale-0 transition-all duration-500 opacity-70 group-hover:opacity-100"
                              width="160"
                              height="60"
                              loading="lazy"
                              decoding="async"
                            />
                            {/* Subtle glow effect */}
                            <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Seconda serie per continuità */}
                    <div className="flex items-center justify-center gap-12 sm:gap-16 lg:gap-20 mx-8">
                      {clientLogos.map((logo) => (
                        <div
                          key={`${logo.name}-2`}
                          className="relative group flex-shrink-0"
                        >
                          <div className="relative p-6 bg-white rounded-2xl shadow-lg border border-slate-100 hover:shadow-2xl hover:border-primary/20 transition-all duration-500 hover:-translate-y-2">
                            <img
                              src={logo.logo}
                              alt={logo.name}
                              className="h-12 sm:h-16 lg:h-20 w-auto object-contain filter grayscale group-hover:grayscale-0 transition-all duration-500 opacity-70 group-hover:opacity-100"
                              width="160"
                              height="60"
                              loading="lazy"
                              decoding="async"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Terza serie per garantire smooth loop */}
                    <div className="flex items-center justify-center gap-12 sm:gap-16 lg:gap-20 mx-8">
                      {clientLogos.map((logo) => (
                        <div
                          key={`${logo.name}-3`}
                          className="relative group flex-shrink-0"
                        >
                          <div className="relative p-6 bg-white rounded-2xl shadow-lg border border-slate-100 hover:shadow-2xl hover:border-primary/20 transition-all duration-500 hover:-translate-y-2">
                            <img
                              src={logo.logo}
                              alt={logo.name}
                              className="h-12 sm:h-16 lg:h-20 w-auto object-contain filter grayscale group-hover:grayscale-0 transition-all duration-500 opacity-70 group-hover:opacity-100"
                              width="160"
                              height="60"
                              loading="lazy"
                              decoding="async"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Stats Row - ispirato al design di riferimento */}
                <div className="mt-12 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
                  <div className="text-center space-y-1">
                    <div className="text-2xl sm:text-3xl font-black text-primary">500+</div>
                    <div className="text-xs sm:text-sm text-slate-600 font-medium">Clienti Soddisfatti</div>
                  </div>
                  <div className="text-center space-y-1">
                    <div className="text-2xl sm:text-3xl font-black text-primary">98%</div>
                    <div className="text-xs sm:text-sm text-slate-600 font-medium">Tasso di Successo</div>
                  </div>
                  <div className="text-center space-y-1">
                    <div className="text-2xl sm:text-3xl font-black text-primary">340%</div>
                    <div className="text-xs sm:text-sm text-slate-600 font-medium">ROI Medio</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* Problem Section */}
      <AnimatedSection>
        <section className="section-padding">
          <div className="max-w-6xl mx-auto container-padding text-center">
            <div className="space-y-12">
              <div className="space-y-6">
                <Badge className="border-red-400/50 text-red-700 bg-red-50 font-bold px-6 py-3 rounded-full">❌ IL PROBLEMA</Badge>
                <h2 className="text-responsive-lg font-heading font-black text-slate-900">Il Marketing Digitale Tradizionale è Rotto</h2>
                <p className="text-responsive-md text-slate-600 leading-relaxed max-w-4xl mx-auto font-medium">Le agenzie ti vendono fuffa, i costi pubblicitari aumentano e tu non hai nessun controllo sui risultati. Ti sembra familiare?</p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {[
                  { icon: XCircle, title: "Agenzie Inefficaci", desc: "Paghi fee mensili per report incomprensibili e risultati inesistenti.", color: "red" },
                  { icon: AlertTriangle, title: "Costi Pubblicitari Folli", desc: "Sei in balia degli algoritmi di Facebook e Google, con costi per lead sempre più alti.", color: "amber" },
                  { icon: Target, title: "Mancanza di un Sistema", desc: "Le tue vendite sono imprevedibili, basate sul caso e non su un processo scientifico.", color: "slate" }
                ].map((item) => (
                  <div key={item.title}>
                    <Card className="glass-card hover-lift p-6 sm:p-8 h-full border-0 shadow-xl group">
                      <div className="flex flex-col items-center text-center space-y-4">
                        <div className={`p-4 rounded-2xl ${
                          item.color === 'red' ? 'bg-red-100 group-hover:bg-red-200' :
                          item.color === 'amber' ? 'bg-amber-100 group-hover:bg-amber-200' :
                          'bg-slate-100 group-hover:bg-slate-200'
                        } transition-colors`}>
                          <item.icon className={`h-8 w-8 ${
                            item.color === 'red' ? 'text-red-600' :
                            item.color === 'amber' ? 'text-amber-600' :
                            'text-slate-600'
                          }`} />
                        </div>
                        <h3 className="font-bold text-lg sm:text-xl text-slate-900">{item.title}</h3>
                        <p className="text-slate-600 leading-relaxed">{item.desc}</p>
                      </div>
                    </Card>
                  </div>
                ))}
              </div>

              <div className="mt-16">
                <Card className="glass-card p-8 sm:p-12 rounded-3xl shadow-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-blue-50/80 to-indigo-50/60">
                  <div className="text-center space-y-6">
                    <Badge variant="secondary" className="bg-primary/10 text-primary font-bold px-6 py-3 rounded-full">✅ LA SOLUZIONE</Badge>
                    <h3 className="text-responsive-lg font-heading font-black text-slate-900">Smettere di Affittare l'Attenzione e Iniziare a Possederla</h3>
                    <p className="text-responsive-sm text-slate-600 max-w-4xl mx-auto leading-relaxed font-medium">L'unica via d'uscita è costruire un asset di marketing proprietario: un sistema che genera clienti in modo prevedibile e profittevole, che lavora per te 24/7 e il cui valore cresce nel tempo.</p>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* Service Showcase */}
      <AnimatedSection>
        <section className="section-padding bg-gradient-to-br from-white via-slate-50 to-blue-50/30">
          <div className="max-w-7xl mx-auto container-padding">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div className="space-y-8">
                <Badge className="border-red-400/50 text-red-700 bg-red-50 font-bold px-6 py-3 rounded-full">🎯 IL TUO VERO OSTACOLO</Badge>
                <h2 className="text-responsive-lg font-heading font-black text-slate-900">Intrappolato nella "Ruota del Criceto"</h2>
                <p className="text-responsive-md text-slate-600 leading-relaxed font-medium">Passi le giornate a gestire emergenze, rincorrere clienti e sperare che il fatturato copra le spese. Lavori 'nel' tuo business, non 'sul' tuo business.</p>
                <div className="space-y-6">
                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-red-50 border border-red-200">
                    <XCircle className="h-6 w-6 text-red-500 mt-1 flex-shrink-0"/>
                    <div>
                      <p className="font-bold text-slate-800">L'errore:</p>
                      <p className="text-slate-600">Pensare che per crescere basti "lavorare di più" o trovare il "trucco segreto".</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-green-50 border border-green-200">
                    <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0"/>
                    <div>
                      <p className="font-bold text-slate-800">La Soluzione:</p>
                      <p className="text-slate-600">Installare un sistema operativo per la crescita che automatizza l'acquisizione clienti e ti libera tempo per le attività strategiche.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                {mainService && (
                  <Card className="glass-card hover-lift p-8 sm:p-10 rounded-3xl shadow-2xl border-0 h-full bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/30">
                    <div className="space-y-6">
                      <Badge variant="secondary" className="bg-primary text-primary-foreground font-bold px-4 py-2 rounded-full">{mainService.category === 'main' ? '🚀 Servizio Principale' : '📦 Servizio'}</Badge>
                      <h3 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-black text-slate-900">{mainService.title}</h3>
                      <p className="text-slate-600 leading-relaxed font-medium">{mainService.shortDescription || mainService.description}</p>
                      <ul className="space-y-4">
                        {(mainService.features || []).map((feature, i) => (
                          <li key={i} className="flex items-center gap-3 text-slate-800">
                            <CheckCircle className="h-5 w-5 text-primary flex-shrink-0"/>
                            <span className="font-medium">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Button asChild size="lg" className="w-full py-6 sm:py-8 gradient-primary text-white font-bold rounded-2xl hover-glow transition-all duration-300">
                        <Link href="/candidatura">SCOPRI COME IMPLEMENTARLO</Link>
                      </Button>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* Testimonials */}
      <AnimatedSection>
        <section className="section-padding bg-white">
          <div className="max-w-7xl mx-auto container-padding">
            <div className="space-y-16">
              <div className="text-center space-y-6">
                <h2 className="text-responsive-lg font-heading font-black text-slate-900">Non fidarti di noi, fidati dei loro risultati</h2>
                <p className="text-responsive-md text-slate-600 leading-relaxed max-w-4xl mx-auto font-medium">Aziende e professionisti che hanno installato il nostro sistema di crescita.</p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {testimonials.map((testimonial, index) => (
                  <div key={index}>
                    <Card className="glass-card hover-lift p-6 sm:p-8 h-full border-0 shadow-xl group">
                      <div className="space-y-6">
                        <div className="flex gap-1">
                          {Array(testimonial.rating).fill(0).map((_, j) => (
                            <Star key={j} className="h-5 w-5 text-yellow-400 fill-yellow-400"/>
                          ))}
                        </div>
                        <p className="text-slate-600 leading-relaxed italic font-medium">"{testimonial.content}"</p>
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
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* Requirements */}
      <AnimatedSection>
        <section className="section-padding bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
          <div className="max-w-7xl mx-auto container-padding">
            <div className="space-y-16">
              <div className="text-center space-y-6">
                <Badge className="border-accent/50 text-accent-foreground bg-accent/20 font-bold px-6 py-3 rounded-full">💯 TRASPARENZA</Badge>
                <h2 className="text-responsive-lg font-heading font-black text-slate-900">Questo sistema non è per tutti</h2>
                <p className="text-responsive-md text-slate-600 leading-relaxed max-w-4xl mx-auto font-medium">Lavoriamo solo con un numero limitato di clienti per garantire risultati eccezionali.</p>
              </div>

              <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
                <div>
                  <Card className="glass-card p-8 sm:p-10 rounded-3xl h-full border-2 border-green-200 bg-gradient-to-br from-green-50 via-emerald-50/80 to-green-50 shadow-xl">
                    <div className="space-y-6">
                      <h3 className="text-xl sm:text-2xl font-bold font-heading text-green-900 flex items-center gap-3">
                        <CheckCircle className="text-green-600"/>
                        Fa per te se...
                      </h3>
                      <ul className="space-y-4 text-slate-700">
                        {WhoIsItFor.map((item, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0"/>
                            <span className="font-medium">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </Card>
                </div>

                <div>
                  <Card className="glass-card p-8 sm:p-10 rounded-3xl h-full border-2 border-red-200 bg-gradient-to-br from-red-50 via-rose-50/80 to-red-50 shadow-xl">
                    <div className="space-y-6">
                      <h3 className="text-xl sm:text-2xl font-bold font-heading text-red-900 flex items-center gap-3">
                        <XCircle className="text-red-600"/>
                        NON fa per te se...
                      </h3>
                      <ul className="space-y-4 text-slate-700">
                        {WhoIsNotFor.map((item, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <XCircle className="h-5 w-5 text-red-500 mt-1 flex-shrink-0"/>
                            <span className="font-medium">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* Final CTA */}
      <AnimatedSection>
        <section className="section-padding bg-gradient-to-br from-primary via-blue-600 to-indigo-700 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
          <div className="relative max-w-5xl mx-auto container-padding text-center">
            <div className="space-y-8">
              <h2 className="text-responsive-xl font-heading font-black">Pronto a Costruire il Tuo Sistema di Crescita?</h2>
              <p className="text-responsive-md opacity-90 leading-relaxed max-w-3xl mx-auto font-medium">Il processo è semplice e progettato per capire se siamo un match perfetto per i tuoi obiettivi.</p>

              <div className="space-y-6">
                <div>
                  <Button asChild size="lg" className="px-8 sm:px-12 py-6 sm:py-8 text-base sm:text-lg font-bold bg-white hover:bg-gray-100 text-slate-900 shadow-2xl rounded-2xl transition-all duration-300 w-full sm:w-auto">
                    <Link href="/candidatura">
                      INVIA LA TUA CANDIDATURA ORA
                      <ArrowRight className="ml-3 h-5 w-5 sm:h-6 sm:w-6"/>
                    </Link>
                  </Button>
                </div>
                <p className="text-sm opacity-80 font-medium">⚡ Dopo la candidatura, il nostro team analizzerà il tuo profilo. Se idoneo, verrai contattato entro 24 ore.</p>
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>
    </div>
    </>
  );
}