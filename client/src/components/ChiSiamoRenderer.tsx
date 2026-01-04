import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, CheckCircle, Star, Target, Users, Lightbulb, Shield, Award,
  Heart, Quote, TrendingUp, Clock, Euro, Search, ChevronDown, 
  ChevronUp, HelpCircle, MessageCircle, Globe,
  Smartphone, BarChart3, Rocket, Palette, Megaphone
} from "lucide-react";
import { Link } from "wouter";

interface ChiSiamoData {
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

interface ChiSiamoRendererProps {
  chisiamo: ChiSiamoData;
}

export function ChiSiamoRenderer({ chisiamo }: ChiSiamoRendererProps) {
  const { content: sections } = chisiamo;

  // Funzione per ottenere valore da sezione
  const getSectionValue = (sectionId: string, elementKey: string, fallback = "") => {
    return sections?.[sectionId]?.elements?.[elementKey]?.value || fallback;
  };

  // Componenti per le icone dinamiche
  const getIcon = (iconName: string) => {
    const icons: { [key: string]: React.ComponentType<any> } = {
      Target,
      Users,
      Lightbulb,
      Shield,
      Award,
      CheckCircle,
      Star,
      TrendingUp,
      ArrowRight,
      Heart,
      Quote,
      Clock,
      Euro,
      Search,
      ChevronDown,
      ChevronUp,
      HelpCircle,
      MessageCircle,
      Globe,
      Smartphone,
      BarChart3,
      Rocket,
      Palette,
      Megaphone
    };
    return icons[iconName] || Target;
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 via-white to-blue-50/30 text-slate-800 min-h-screen">
      {/* Hero Section */}
      {sections.hero?.enabled && (
        <section className="section-padding bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]"></div>
          <div className="relative max-w-6xl mx-auto container-padding text-center">
            <div className="space-y-8">
              <div>
                <Badge className="glass-card border-primary/20 text-primary bg-primary/5 px-6 py-3 font-bold rounded-full shadow-lg">
                  <Heart className="w-4 h-4 mr-2" />
                  {getSectionValue('hero', 'badge', 'LA NOSTRA MISSIONE')}
                </Badge>
              </div>

              <h1 className="text-responsive-xl font-heading font-black tracking-tight leading-tight">
                {getSectionValue('hero', 'title', 'Costruiamo')} <span className="bg-gradient-to-r from-primary via-blue-600 to-indigo-600 bg-clip-text text-transparent">{getSectionValue('hero', 'highlightTitle', 'Sistemi di Crescita')}</span>{getSectionValue('hero', 'titleEnd', ', non solo Campagne.')}
              </h1>

              <p className="text-responsive-md text-slate-600 max-w-4xl mx-auto leading-relaxed font-medium">
                {getSectionValue('hero', 'subtitle', 'Aiutiamo le aziende ambiziose a liberarsi dalla dipendenza dalle agenzie tradizionali, implementando asset di marketing proprietari che generano clienti in modo prevedibile e scalabile.')}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Values Section */}
      {sections.values?.enabled && (
        <section className="section-padding bg-white">
          <div className="max-w-7xl mx-auto container-padding">
            <div className="space-y-16">
              <div className="text-center space-y-6">
                <h2 className="text-responsive-lg font-heading font-black text-slate-900">
                  {getSectionValue('values', 'title', 'I Pilastri del Nostro Metodo')}
                </h2>
                <p className="text-responsive-md text-slate-600 max-w-4xl mx-auto leading-relaxed font-medium">
                  {getSectionValue('values', 'subtitle', 'Ogni nostra azione si basa su questi quattro principi fondamentali che guidano il nostro approccio al business.')}
                </p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                {(getSectionValue('values', 'valuesList', []) as any[]).map((value, index) => {
                  const IconComponent = getIcon(value.icon);
                  return (
                    <div key={index}>
                      <Card className="glass-card hover-lift p-6 sm:p-8 h-full border-0 shadow-xl text-center group">
                        <div className="space-y-6">
                          <div className={`inline-block p-4 rounded-2xl transition-colors ${
                            value.color === 'blue' ? 'bg-blue-100 group-hover:bg-blue-200' :
                            value.color === 'amber' ? 'bg-amber-100 group-hover:bg-amber-200' :
                            value.color === 'emerald' ? 'bg-emerald-100 group-hover:bg-emerald-200' :
                            'bg-purple-100 group-hover:bg-purple-200'
                          }`}>
                            <IconComponent className={`h-8 w-8 ${
                              value.color === 'blue' ? 'text-blue-600' :
                              value.color === 'amber' ? 'text-amber-600' :
                              value.color === 'emerald' ? 'text-emerald-600' :
                              'text-purple-600'
                            }`} />
                          </div>
                          <div className="space-y-3">
                            <h3 className="font-bold text-lg sm:text-xl text-slate-900">{value.title}</h3>
                            <p className="text-slate-600 leading-relaxed font-medium">{value.description}</p>
                          </div>
                        </div>
                      </Card>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Quote Section */}
      {sections.quote?.enabled && (
        <section className="section-padding bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 to-indigo-900/20"></div>
          <div className="relative max-w-5xl mx-auto container-padding text-center">
            <div className="space-y-8">
              <div>
                <Quote className="h-16 w-16 sm:h-20 sm:w-20 text-blue-400 mx-auto opacity-50"/>
              </div>
              <blockquote className="text-2xl sm:text-3xl lg:text-4xl font-medium italic leading-relaxed">
                "{getSectionValue('quote', 'quote', 'Il nostro obiettivo non è essere i vostri marketer. È rendervi così bravi nel marketing da non aver più bisogno di noi.')}"
              </blockquote>
              <footer className="text-lg font-semibold text-slate-300">
                — {getSectionValue('quote', 'author', 'Alessio Rossi, Founder')}
              </footer>
            </div>
          </div>
        </section>
      )}

      {/* Timeline Section */}
      {sections.timeline?.enabled && (
        <section className="section-padding bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
          <div className="max-w-5xl mx-auto container-padding">
            <div className="space-y-16">
              <div className="text-center space-y-6">
                <h2 className="text-responsive-lg font-heading font-black text-slate-900">
                  {getSectionValue('timeline', 'title', 'La Nostra Storia in Breve')}
                </h2>
                <p className="text-responsive-md text-slate-600 max-w-3xl mx-auto leading-relaxed font-medium">
                  {getSectionValue('timeline', 'subtitle', 'Dal sogno iniziale alla realtà di oggi: ecco come abbiamo costruito un metodo che funziona davvero.')}
                </p>
              </div>

              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-4 sm:left-8 top-0 w-0.5 h-full bg-gradient-to-b from-primary via-blue-500 to-indigo-600 rounded-full hidden md:block"></div>

                <div className="space-y-8 sm:space-y-12">
                  {(getSectionValue('timeline', 'milestones', []) as any[]).map((milestone, index) => {
                    const IconComponent = getIcon(milestone.icon);
                    return (
                      <div key={index}>
                        <Card className="glass-card hover-lift p-6 sm:p-8 ml-0 md:ml-20 border-0 shadow-xl group relative">
                          {/* Timeline dot */}
                          <div className="absolute -left-20 top-8 hidden md:flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-blue-600 rounded-full border-4 border-white shadow-xl group-hover:scale-110 transition-transform">
                            <IconComponent className="h-8 w-8 text-white" />
                          </div>

                          <div className="space-y-4">
                            <div className="flex items-center gap-4 md:hidden">
                              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-primary to-blue-600 rounded-full">
                                <IconComponent className="h-6 w-6 text-white" />
                              </div>
                              <Badge className="bg-primary/10 text-primary font-bold px-4 py-2 rounded-full">
                                {milestone.year}
                              </Badge>
                            </div>

                            <div className="hidden md:block">
                              <Badge className="bg-primary/10 text-primary font-bold px-4 py-2 rounded-full">
                                {milestone.year}
                              </Badge>
                            </div>

                            <h3 className="font-bold text-xl sm:text-2xl text-slate-900 group-hover:text-primary transition-colors">
                              {milestone.title}
                            </h3>
                            <p className="text-slate-600 leading-relaxed font-medium">
                              {milestone.description}
                            </p>
                          </div>
                        </Card>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Team Section */}
      {sections.team?.enabled && (
        <section className="section-padding bg-white">
          <div className="max-w-7xl mx-auto container-padding">
            <div className="space-y-16">
              <div className="text-center space-y-6">
                <h2 className="text-responsive-lg font-heading font-black text-slate-900">
                  {getSectionValue('team', 'title', 'Le Menti dietro il Sistema')}
                </h2>
                <p className="text-responsive-md text-slate-600 max-w-4xl mx-auto leading-relaxed font-medium">
                  {getSectionValue('team', 'subtitle', 'Un team di specialisti ossessionati dai risultati e dalla crescita dei nostri partner. Conoscenza, esperienza e passione al servizio del tuo successo.')}
                </p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                {(getSectionValue('team', 'members', []) as any[]).map((member, index) => (
                  <div key={index}>
                    <Card className="glass-card hover-lift overflow-hidden border-0 shadow-xl group h-full">
                      <div className="aspect-square relative overflow-hidden">
                        <img
                          src={member.profileImage}
                          alt={member.fullName}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          width="500"
                          height="500"
                          loading="lazy"
                          decoding="async"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>

                      <CardContent className="p-6 space-y-4">
                        <div className="text-center space-y-2">
                          <h3 className="font-bold text-lg sm:text-xl text-slate-900">{member.fullName}</h3>
                          <p className="text-primary text-sm font-bold">{member.title}</p>
                          <Badge variant="outline" className="text-xs px-3 py-1">{member.role}</Badge>
                        </div>

                        <p className="text-slate-600 text-sm leading-relaxed font-medium">{member.bio}</p>

                        <div className="flex flex-wrap gap-2">
                          {member.specialties?.map((specialty: string, specIndex: number) => (
                            <Badge key={specIndex} variant="secondary" className="text-xs px-2 py-1 bg-slate-100 text-slate-600">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      {sections.cta?.enabled && (
        <section className="section-padding bg-gradient-to-br from-primary via-blue-600 to-indigo-700 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
          <div className="relative max-w-5xl mx-auto container-padding text-center">
            <div className="space-y-8">
              <h2 className="text-responsive-lg font-heading font-black">
                {getSectionValue('cta', 'title', 'Pronto a Lavorare con Noi?')}
              </h2>
              <p className="text-responsive-md opacity-90 leading-relaxed max-w-3xl mx-auto font-medium">
                {getSectionValue('cta', 'subtitle', 'Se condividi la nostra visione e sei pronto a costruire un sistema di crescita solido e duraturo, saremmo felici di conoscerti e valutare insieme le opportunità.')}
              </p>

              <div>
                <div>
                  <Button asChild size="lg" className="px-8 sm:px-12 py-6 sm:py-8 text-base sm:text-lg font-bold bg-white hover:bg-gray-100 text-slate-900 shadow-2xl rounded-2xl transition-all duration-300 w-full sm:w-auto">
                    <Link href={getSectionValue('cta', 'ctaButton')?.link || '/contatti'}>
                      {getSectionValue('cta', 'ctaButton')?.text || 'Contattaci Ora'}
                      <ArrowRight className="ml-3 h-5 w-5 sm:h-6 sm:w-6"/>
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}