import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Palette, Rocket, BarChart3, Search, Megaphone, Globe, Smartphone, Shield,
  CheckCircle, ArrowRight, Star, Zap, Target, Users, Award
} from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Service } from "@shared/schema";

interface ServiziData {
  id?: number | string;
  title?: string;
  slug?: string;
  content: {
    [key: string]: {
      enabled: boolean;
      elements: {
        [key: string]: {
          type: string;
          value: any;
          editable?: boolean;
        };
      };
    };
  };
  metaTitle?: string;
  metaDescription?: string;
}

interface ServiziRendererProps {
  servizi: ServiziData;
}

export function ServiziRenderer({ servizi }: ServiziRendererProps) {
  const { content: sections } = servizi;

  console.log('🔍 ServiziRenderer - servizi data:', servizi);
  console.log('🔍 ServiziRenderer - sections:', sections);

  // Carica servizi dinamici dal database
  const { data: services = [], isLoading, error } = useQuery<Service[]>({
    queryKey: ['/api/services/public'],
    queryFn: async () => {
      try {
        const res = await fetch("/api/services/public");
        if (!res.ok) {
          console.error('Failed to fetch services:', res.status, res.statusText);
          return [];
        }
        const data = await res.json();
        console.log('Services fetched in ServiziRenderer:', data);
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error fetching services:', error);
        return [];
      }
    },
    retry: 1,
    staleTime: 5 * 60 * 1000
  });

  // Ensure services is always an array
  const safeServices = Array.isArray(services) ? services : [];
  const mainServices = safeServices.filter(s => s.category === 'main' && s.isActive);
  const additionalServices = safeServices.filter(s => s.category === 'additional' && s.isActive);

  // Funzione per ottenere valore da sezione
  const getSectionValue = (sectionId: string, elementKey: string, fallback: any = "") => {
    return sections?.[sectionId]?.elements?.[elementKey]?.value || fallback;
  };

  // Componenti per le icone dinamiche (stesso pattern dell'HomepageRenderer)
  const getIcon = (iconName: string) => {
    const icons: { [key: string]: React.ComponentType<any> } = {
      Palette, Rocket, BarChart3, Search, Megaphone, Globe, Smartphone, Shield, Target, Users, Award, Zap
    };
    return icons[iconName] || Target;
  };

  // Mappa per le icone, per renderle dinamiche (compatibilità con servizi esistenti)
  const iconMap: { [key: string]: React.ElementType } = {
    Palette, Rocket, BarChart3, Search, Megaphone, Globe, Smartphone, Shield, Target, Users, Award, Zap
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><p>Caricamento servizi...</p></div>;
  }

  return (
    <div className="bg-white text-slate-800">
      {/* Hero Section */}
      {sections.hero?.enabled && (
        <section className="py-12 md:py-16 text-center bg-slate-50 border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Badge className="mb-4 text-blue-700 border-blue-200 bg-blue-50">
              {getSectionValue('hero', 'badge', 'I Nostri Servizi')}
            </Badge>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-slate-900">
              {getSectionValue('hero', 'title', 'Un')} <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">{getSectionValue('hero', 'highlightTitle', 'Sistema Completo')}</span> {getSectionValue('hero', 'titleEnd', 'per la Tua Crescita')}
            </h1>
            <p className="text-lg md:text-xl mt-6 text-slate-600">
              {getSectionValue('hero', 'subtitle', 'Non offriamo semplici servizi, ma costruiamo sistemi integrati che trasformano la tua presenza digitale in un motore di crescita prevedibile.')}
            </p>
          </div>
        </section>
      )}

      {/* Main Services Section */}
      {sections.mainServices?.enabled && (
        <section className="py-20 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                {getSectionValue('mainServices', 'title', 'Le Nostre Soluzioni Principali')}
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                {getSectionValue('mainServices', 'subtitle', 'I tre pilastri su cui si fonda la crescita digitale dei nostri clienti.')}
              </p>
            </div>
            <div className={`mt-16 grid gap-8 items-stretch ${
              mainServices.length === 1 ? 'grid-cols-1 max-w-md mx-auto' :
              mainServices.length === 2 ? 'grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto' :
              'lg:grid-cols-3'
            }`}>
              {mainServices.map((service) => {
                const Icon = iconMap[service.icon || 'Zap'] || Zap;
                return (
                  <Card key={service.id} className={`flex flex-col text-center p-8 border-2 transition-all duration-300 ${service.isPopular ? 'border-blue-500 scale-105 shadow-2xl z-10 bg-white' : 'border-slate-200 bg-slate-50 hover:border-blue-300'}`}>
                    {service.isPopular && <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white">Più Richiesto</Badge>}
                    <CardHeader className="p-0">
                      <div className="mx-auto mb-6 p-4 bg-blue-100 rounded-full w-fit"><Icon className="h-10 w-10 text-blue-600" /></div>
                      <CardTitle className="font-heading text-2xl mb-2">{service.title}</CardTitle>
                      <CardDescription className="text-base">{service.shortDescription || service.description}</CardDescription>
                      {service.price && <div className="pt-4"><span className="text-4xl font-bold text-slate-900">{service.price}</span>{service.priceDescription && <span className="text-slate-500 ml-1">{service.priceDescription}</span>}</div>}
                    </CardHeader>
                    <CardContent className="p-0 flex-grow flex flex-col pt-6">
                      <ul className="space-y-3 text-left flex-grow">
                        {(service.features || []).map((feature, i) => (<li key={i} className="flex items-start gap-3"><CheckCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" /><span>{feature}</span></li>))}
                      </ul>
                      <Button asChild size="lg" className="w-full mt-8 bg-blue-600 hover:bg-blue-700 text-white font-bold">
                        <Link href={service.landingPageSlug ? `/${service.landingPageSlug}` : '/contatti'}>{service.ctaText || "Scopri di più"}</Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Additional Services */}
      {sections.additionalServices?.enabled && (
        <section className="py-20 md:py-24 bg-slate-50 border-y">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                {getSectionValue('additionalServices', 'title', 'Servizi Specialistici')}
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                {getSectionValue('additionalServices', 'subtitle', 'Soluzioni mirate per affrontare sfide specifiche e completare la tua strategia digitale.')}
              </p>
            </div>
            <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {additionalServices.map((service) => {
                const Icon = iconMap[service.icon || 'Zap'] || Zap;
                return (
                  <Card key={service.id} className="bg-white hover-elevate border shadow-sm">
                    <CardHeader>
                      <div className="mb-4 p-3 bg-blue-100 rounded-full w-fit"><Icon className="h-6 w-6 text-blue-600" /></div>
                      <CardTitle className="text-xl">{service.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-600 text-sm mb-6 min-h-[60px]">{service.shortDescription || service.description}</p>
                      <Button asChild variant="secondary" className="w-full">
                        <Link href={service.landingPageSlug ? `/${service.landingPageSlug}` : '/contatti'}>{service.ctaText || "Dettagli"}</Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Process Section */}
      {sections.process?.enabled && (
        <section className="py-20 md:py-24 bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <Badge className="mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0">
                {getSectionValue('process', 'badge', 'Metodologia Comprovata')}
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                {getSectionValue('process', 'title', 'Il Nostro Processo')} <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{getSectionValue('process', 'highlightTitle', 'Collaudato')}</span>
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                {getSectionValue('process', 'subtitle', 'Seguiamo un metodo in 4 fasi per garantire chiarezza, efficienza e risultati misurabili in ogni progetto.')}
              </p>
            </div>
            <div className="mt-20 relative">
              {/* Curved timeline line for desktop */}
              <div className="absolute left-1/2 -translate-x-1/2 top-0 w-1 h-full bg-gradient-to-b from-blue-500 via-indigo-500 to-blue-600 rounded-full hidden md:block shadow-lg" aria-hidden="true">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full animate-pulse opacity-50"></div>
              </div>

              <div className="space-y-16 md:space-y-20">
                {(getSectionValue('process', 'steps', []) as any[]).map((step, index) => (
                  <div key={step.number} className="md:grid md:grid-cols-2 md:gap-12 items-center relative group">
                    <div className={`${index % 2 !== 0 ? 'md:order-2 md:text-left' : 'md:text-right'} space-y-4`}>
                      <div className="flex items-center gap-3 md:justify-end">
                        <Badge className={`text-sm font-medium px-4 py-2 ${
                          step.color === 'emerald' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                          step.color === 'blue' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                          step.color === 'purple' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                          'bg-orange-100 text-orange-700 border-orange-200'
                        }`}>
                          Fase {step.number}
                        </Badge>
                      </div>
                      <h3 className="font-bold text-2xl md:text-3xl text-slate-900 group-hover:text-blue-600 transition-colors duration-300">{step.title}</h3>
                      <p className="text-slate-600 text-lg leading-relaxed">{step.description}</p>
                      <div className="flex items-center gap-2 text-blue-600 font-medium group-hover:gap-3 transition-all duration-300">
                        <ArrowRight className="h-4 w-4"/>
                        <span className="text-sm">Risultato garantito</span>
                      </div>
                    </div>

                    {/* Desktop circle indicator */}
                    <div className="hidden md:block">
                      <div className={`absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full border-4 border-white shadow-xl flex items-center justify-center text-white font-bold text-xl group-hover:scale-110 transition-all duration-300 ${
                        step.color === 'emerald' ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' :
                        step.color === 'blue' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                        step.color === 'purple' ? 'bg-gradient-to-br from-purple-500 to-purple-600' :
                        'bg-gradient-to-br from-orange-500 to-orange-600'
                      }`}>
                        <span className="relative z-10">{step.number}</span>
                        <div className="absolute inset-0 rounded-full bg-white/20 group-hover:bg-white/30 transition-colors duration-300"></div>
                      </div>
                    </div>

                    {/* Mobile card design */}
                    <div className="md:hidden">
                      <Card className="p-6 bg-white/80 backdrop-blur-sm border-2 border-slate-100 hover:border-blue-200 hover:shadow-lg transition-all duration-300">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg mb-4 ${
                          step.color === 'emerald' ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' :
                          step.color === 'blue' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                          step.color === 'purple' ? 'bg-gradient-to-br from-purple-500 to-purple-600' :
                          'bg-gradient-to-br from-orange-500 to-orange-600'
                        }`}>
                          {step.number}
                        </div>
                        <Badge className={`mb-3 ${
                          step.color === 'emerald' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                          step.color === 'blue' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                          step.color === 'purple' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                          'bg-orange-100 text-orange-700 border-orange-200'
                        }`}>
                          Fase {step.number}
                        </Badge>
                        <h3 className="font-bold text-xl mb-2 text-slate-900">{step.title}</h3>
                        <p className="text-slate-600 leading-relaxed">{step.description}</p>
                      </Card>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      {sections.cta?.enabled && (
        <section className="py-20 md:py-24 bg-blue-600 text-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold">
              {getSectionValue('cta', 'title', 'Pronto a Costruire il Tuo Sistema di Crescita?')}
            </h2>
            <p className="mt-4 text-lg text-blue-200 max-w-2xl mx-auto">
              {getSectionValue('cta', 'subtitle', 'Parliamone. Analizzeremo insieme i tuoi obiettivi e definiremo la strategia perfetta per la tua azienda, senza impegno.')}
            </p>
            <Button asChild size="lg" className="mt-8 px-8 py-6 bg-white hover:bg-slate-200 text-slate-900 font-bold shadow-lg">
              <Link href={getSectionValue('cta', 'ctaButton')?.link || '/contatti'}>
                {getSectionValue('cta', 'ctaButton')?.text || 'Richiedi una Consulenza Gratuita'}
                <ArrowRight className="ml-2 h-5 w-5"/>
              </Link>
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}