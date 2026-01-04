
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle, PlayCircle, Star, XCircle, AlertTriangle, Zap, TrendingUp, Users, Award, Shield, Target } from "lucide-react";
import { Link } from "wouter";

interface HomepageData {
  id?: number | string;
  title?: string;
  slug?: string;
  content: {
    [key: string]: {
      enabled: boolean;
      elements: {
        [key: string]: {
          type: string;
          value?: any;
          text?: string;
          link?: string;
          alt?: string;
          style?: {
            color?: string;
            backgroundColor?: string;
            fontFamily?: string;
            fontSize?: number;
            fontWeight?: string;
            lineHeight?: number;
            letterSpacing?: number;
            textAlign?: string;
            padding?: number;
            margin?: number;
            paddingX?: number;
            paddingY?: number;
            borderRadius?: number;
            borderWidth?: number;
            borderColor?: string;
            width?: number;
            height?: number;
            objectFit?: string;
            boxShadow?: string;
          };
          editable?: boolean;
        };
      };
    };
  };
  metaTitle?: string;
  metaDescription?: string;
}

interface HomepageRendererProps {
  homepage: HomepageData;
  applyElementStyle?: (element: any) => any;
}

export function HomepageRenderer({ homepage, applyElementStyle }: HomepageRendererProps) {
  const { content: sections } = homepage;

  // Funzione per ottenere valore da sezione
  const getSectionValue = (sectionId: string, elementKey: string, fallback = "") => {
    return sections?.[sectionId]?.elements?.[elementKey]?.value || fallback;
  };
  
  // Funzione per ottenere elemento completo
  const getElement = (sectionId: string, elementKey: string) => {
    return sections?.[sectionId]?.elements?.[elementKey];
  };
  
  // Funzione per applicare stili con fallback
  const getElementStyle = (sectionId: string, elementKey: string) => {
    const element = getElement(sectionId, elementKey);
    if (applyElementStyle && element) {
      return applyElementStyle(element);
    }
    return {};
  };
  
  // Funzione per ottenere testo del bottone
  const getButtonText = (sectionId: string, elementKey: string, fallback = "") => {
    const element = getElement(sectionId, elementKey);
    return element?.text || element?.value || fallback;
  };
  
  // Funzione per ottenere link del bottone
  const getButtonLink = (sectionId: string, elementKey: string, fallback = "#") => {
    const element = getElement(sectionId, elementKey);
    return element?.link || fallback;
  };

  // Componenti per le icone dinamiche
  const getIcon = (iconName: string) => {
    const icons: { [key: string]: React.ComponentType<any> } = {
      XCircle,
      AlertTriangle,
      Target,
      CheckCircle,
      TrendingUp,
      Users,
      Award,
      Shield,
      Star,
      Zap
    };
    return icons[iconName] || Target;
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 via-white to-blue-50/30 text-foreground font-sans min-h-screen">
      {/* Hero Section */}
      {sections.hero?.enabled && (
        <section className="relative overflow-hidden section-padding bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20">
          <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]"></div>
          <div className="relative max-w-7xl mx-auto container-padding text-center">
            <div className="space-y-8">
              <div>
                <Badge variant="outline" className="glass-card border-primary/20 text-primary bg-primary/5 px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-bold rounded-full shadow-lg max-w-[90vw] text-center break-words">
                  <Zap className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
                  <span className="leading-tight">
                    {getSectionValue('hero', 'badge', 'PER IMPRENDITORI E AZIENDE AMBIZIOSE')}
                  </span>
                </Badge>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-heading font-black tracking-tight leading-tight">
                <span style={getElementStyle('hero', 'mainTitle')}>
                  {getSectionValue('hero', 'mainTitle', 'Smetti di Acquistare Clienti.')}
                </span>
                <span 
                  className="block bg-gradient-to-r from-primary via-blue-600 to-indigo-600 bg-clip-text text-transparent mt-4"
                  style={getElementStyle('hero', 'highlightTitle')}
                >
                  {getSectionValue('hero', 'highlightTitle', 'Costruisci un Sistema che li Attrae.')}
                </span>
              </h1>

              <p 
                className="text-responsive-md mt-8 text-slate-600 max-w-4xl mx-auto leading-relaxed font-medium"
                style={getElementStyle('hero', 'subtitle')}
              >
                {getSectionValue('hero', 'subtitle', 'Implementiamo sistemi di marketing a risposta diretta per trasformare la tua spesa pubblicitaria in un asset aziendale prevedibile e profittevole.')}
              </p>

              <div className="mt-12">
                <Card className="max-w-5xl mx-auto glass-card border-2 border-primary/10 rounded-3xl overflow-hidden group hover-lift">
                  <div className="aspect-video bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-slate-800"></div>
                    <img 
                      src={getSectionValue('hero', 'videoImage', 'https://via.placeholder.com/1280x720/1e293b/ffffff?text=Guarda+il+Video+Sales+Letter')} 
                      alt={getSectionValue('hero', 'videoImage')?.alt || "Video Sales Letter"} 
                      className="w-full h-full object-cover opacity-80 relative z-10"
                      loading="eager"
                      decoding="async"
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
                  <Button 
                    asChild 
                    size="lg" 
                    className="px-8 sm:px-12 py-6 sm:py-8 text-base sm:text-lg font-bold gradient-primary text-white shadow-2xl rounded-2xl hover-glow transition-all duration-300 w-full sm:w-auto"
                    style={getElementStyle('hero', 'ctaButton')}
                  >
                    <Link href={getButtonLink('hero', 'ctaButton', '/candidatura')}>
                      {getButtonText('hero', 'ctaButton', 'CANDIDATI ORA PER LA TUA SESSIONE STRATEGICA')}
                      <ArrowRight className="ml-3 h-5 w-5 sm:h-6 sm:w-6"/>
                    </Link>
                  </Button>
                </div>
                <p className="text-sm text-slate-500 font-medium">
                  {getSectionValue('hero', 'disclaimer', '🔥 Posti limitati. Approvazione manuale richiesta.')}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      

      {/* Problem Section */}
      {sections.problem?.enabled && (
        <section className="section-padding">
          <div className="max-w-6xl mx-auto container-padding text-center">
            <div className="space-y-12">
              <div className="space-y-6">
                <Badge className="border-red-400/50 text-red-700 bg-red-50 font-bold px-6 py-3 rounded-full">
                  {getSectionValue('problem', 'badge', '❌ IL PROBLEMA')}
                </Badge>
                <h2 className="text-responsive-lg font-heading font-black text-slate-900">
                  {getSectionValue('problem', 'title', 'Il Marketing Digitale Tradizionale è Rotto')}
                </h2>
                <p className="text-responsive-md text-slate-600 leading-relaxed max-w-4xl mx-auto font-medium">
                  {getSectionValue('problem', 'subtitle', 'Le agenzie ti vendono fuffa, i costi pubblicitari aumentano e tu non hai nessun controllo sui risultati. Ti sembra familiare?')}
                </p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {(sections?.problem?.elements?.problems?.value || []).map((problem: any, index: number) => {
                  const IconComponent = getIcon(problem.icon);
                  return (
                    <div key={index}>
                      <Card className="glass-card hover-lift p-6 sm:p-8 h-full border-0 shadow-xl group">
                        <div className="flex flex-col items-center text-center space-y-4">
                          <div className={`p-4 rounded-2xl ${
                            problem.color === 'red' ? 'bg-red-100 group-hover:bg-red-200' :
                            problem.color === 'amber' ? 'bg-amber-100 group-hover:bg-amber-200' :
                            'bg-slate-100 group-hover:bg-slate-200'
                          } transition-colors`}>
                            <IconComponent className={`h-8 w-8 ${
                              problem.color === 'red' ? 'text-red-600' :
                              problem.color === 'amber' ? 'text-amber-600' :
                              'text-slate-600'
                            }`} />
                          </div>
                          <h3 className="font-bold text-lg sm:text-xl text-slate-900">{problem.title}</h3>
                          <p className="text-slate-600 leading-relaxed">{problem.description}</p>
                        </div>
                      </Card>
                    </div>
                  );
                })}
              </div>

              {/* Solution Card */}
              {sections.solution?.enabled && (
                <div className="mt-16">
                  <Card className="glass-card p-8 sm:p-12 rounded-3xl shadow-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-blue-50/80 to-indigo-50/60">
                    <div className="text-center space-y-6">
                      <Badge variant="secondary" className="bg-primary/10 text-primary font-bold px-6 py-3 rounded-full">
                        {getSectionValue('solution', 'badge', '✅ LA SOLUZIONE')}
                      </Badge>
                      <h3 className="text-responsive-lg font-heading font-black text-slate-900">
                        {getSectionValue('solution', 'title', 'Smettere di Affittare l\'Attenzione e Iniziare a Possederla')}
                      </h3>
                      <p className="text-responsive-sm text-slate-600 max-w-4xl mx-auto leading-relaxed font-medium">
                        {getSectionValue('solution', 'description', 'L\'unica via d\'uscita è costruire un asset di marketing proprietario: un sistema che genera clienti in modo prevedibile e profittevole, che lavora per te 24/7 e il cui valore cresce nel tempo.')}
                      </p>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {sections.testimonials?.enabled && (
        <section className="section-padding bg-white">
          <div className="max-w-7xl mx-auto container-padding">
            <div className="space-y-16">
              <div className="text-center space-y-6">
                <h2 className="text-responsive-lg font-heading font-black text-slate-900">
                  {getSectionValue('testimonials', 'title', 'Non fidarti di noi, fidati dei loro risultati')}
                </h2>
                <p className="text-responsive-md text-slate-600 leading-relaxed max-w-4xl mx-auto font-medium">
                  {getSectionValue('testimonials', 'subtitle', 'Aziende e professionisti che hanno installato il nostro sistema di crescita.')}
                </p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {(sections?.testimonials?.elements?.testimonials?.value || []).map((testimonial: any, index: number) => (
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
      )}

      {/* Requirements */}
      {sections.requirements?.enabled && (
        <section className="section-padding bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
          <div className="max-w-7xl mx-auto container-padding">
            <div className="space-y-16">
              <div className="text-center space-y-6">
                <Badge className="border-accent/50 text-accent-foreground bg-accent/20 font-bold px-6 py-3 rounded-full">
                  {getSectionValue('requirements', 'badge', '💯 TRASPARENZA')}
                </Badge>
                <h2 className="text-responsive-lg font-heading font-black text-slate-900">
                  {getSectionValue('requirements', 'title', 'Questo sistema non è per tutti')}
                </h2>
                <p className="text-responsive-md text-slate-600 leading-relaxed max-w-4xl mx-auto font-medium">
                  {getSectionValue('requirements', 'subtitle', 'Lavoriamo solo con un numero limitato di clienti per garantire risultati eccezionali.')}
                </p>
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
                        {(sections?.requirements?.elements?.whoIsItFor?.value || []).map((item: string, i: number) => (
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
                        {(sections?.requirements?.elements?.whoIsNotFor?.value || []).map((item: string, i: number) => (
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
      )}

      {/* Final CTA */}
      {sections.finalCta?.enabled && (
        <section className="section-padding bg-gradient-to-br from-primary via-blue-600 to-indigo-700 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
          <div className="relative max-w-5xl mx-auto container-padding text-center">
            <div className="space-y-8">
              <h2 className="text-responsive-xl font-heading font-black">
                {getSectionValue('finalCta', 'title', 'Pronto a Costruire il Tuo Sistema di Crescita?')}
              </h2>
              <p className="text-responsive-md opacity-90 leading-relaxed max-w-3xl mx-auto font-medium">
                {getSectionValue('finalCta', 'subtitle', 'Il processo è semplice e progettato per capire se siamo un match perfetto per i tuoi obiettivi.')}
              </p>

              <div className="space-y-6">
                <div>
                  <Button asChild size="lg" className="px-8 sm:px-12 py-6 sm:py-8 text-base sm:text-lg font-bold bg-white hover:bg-gray-100 text-slate-900 shadow-2xl rounded-2xl transition-all duration-300 w-full sm:w-auto">
                    <Link href={getSectionValue('finalCta', 'ctaButton')?.link || '/candidatura'}>
                      {getSectionValue('finalCta', 'ctaButton')?.text || 'INVIA LA TUA CANDIDATURA ORA'}
                      <ArrowRight className="ml-3 h-5 w-5 sm:h-6 sm:w-6"/>
                    </Link>
                  </Button>
                </div>
                <p className="text-sm opacity-80 font-medium">
                  {getSectionValue('finalCta', 'disclaimer', '⚡ Dopo la candidatura, il nostro team analizzerà il tuo profilo. Se idoneo, verrai contattato entro 24 ore.')}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
