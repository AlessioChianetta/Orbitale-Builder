import React from 'react';
import { Helmet } from 'react-helmet';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Shield,
  Target,
  Calculator,
  BookOpen,
  CheckCircle,
  ArrowRight,
  PiggyBank,
  Building2,
  Sparkles,
  AlertTriangle,
  Rocket,
  BarChart3,
  Users,
  X,
  TrendingDown,
  Clock
} from "lucide-react";

// Definiamo un'interfaccia più precisa per le props
interface LandingPageProps {
  landingPage: {
    id: number;
    title: string;
    slug: string;
    description: string;
    sections: any;
    metaTitle: string;
    metaDescription: string;
    ogImage: string | null;
    isActive: boolean;
  };
}

// Helper per estrarre valori
const extractValue = (field: any, fallback: string = ''): string => {
  if (!field) return fallback;
  if (typeof field === 'string') return field;
  if (field && typeof field === 'object') {
    if (field.value !== undefined) return field.value;
    if (field.text !== undefined) return field.text;
  }
  return fallback;
};

const extractLink = (field: any): string => {
  if (!field || typeof field !== 'object' || field.link === undefined) return '#';
  return field.link;
};

// Mappa per le icone, per renderle dinamiche
const iconMap: { [key: string]: React.ElementType } = {
  Shield,
  PiggyBank,
  TrendingUp,
  Rocket,
  AlertTriangle,
  Building2,
  BarChart3,
  Target,
  Calculator,
  BookOpen,
  Users
};

export function PatrimonioLandingRenderer({ landingPage }: LandingPageProps) {
  const { title, metaTitle, metaDescription, ogImage, sections } = landingPage;

  // Usa il link globale se disponibile, altrimenti il fallback
  const formLink = landingPage.sections?.globalSettings?.formLink || 'https://forms.gle/yourform';
  const handleCandidatura = () => {
    window.open(formLink, '_blank');
  };

  return (
    <>
      <Helmet>
        <title>{metaTitle || title}</title>
        <meta name="description" content={metaDescription || ''} />
        {ogImage && <meta property="og:image" content={ogImage} />}
      </Helmet>

      <div className="min-h-screen bg-slate-50" data-testid={`landing-page-${landingPage.slug}`}>
        {/* Header Section */}
        {sections?.header?.enabled && (
          <header className="bg-white/95 backdrop-blur-lg shadow-sm border-b border-slate-100 sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-md">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                      {extractValue(sections.header.elements.brandName, "Metodo ORBITALE")}
                    </h1>
                    <p className="text-sm text-slate-500">{extractValue(sections.header.elements.brandSubtitle, "Costruisci il Tuo Patrimonio")}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Button onClick={handleCandidatura} className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                    {extractValue(sections.header.elements.ctaButton, "CANDIDATI ORA")}
                  </Button>
                </div>
              </div>
            </div>
          </header>
        )}

        {/* Hero Section */}
        {sections?.hero?.enabled && (
          <section className="relative py-16 lg:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50">
            <div className="max-w-4xl mx-auto text-center">
              <div className="space-y-6">
                {/* ***** LA CORREZIONE È QUI ***** */}
                <h1 
                  className="text-4xl md:text-6xl font-bold leading-tight text-slate-900" 
                  data-testid="hero-title"
                  dangerouslySetInnerHTML={{
                    __html: extractValue(sections.hero.elements.mainTitle, "Non ti serve un lavoro in più. Ti serve un patrimonio che lavora al posto tuo.").replace(
                      'Ti serve un patrimonio che lavora al posto tuo.', 
                      '<span class="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Ti serve un patrimonio che lavora al posto tuo.</span>'
                    )
                  }}
                />
                <p className="text-xl md:text-2xl text-slate-600 leading-relaxed max-w-4xl mx-auto" data-testid="hero-subtitle">
                  {extractValue(sections.hero.elements.subtitle)}
                </p>
                <div className="pt-4">
                  <Button size="lg" onClick={handleCandidatura} className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white text-lg px-8 py-4 rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
                    <ArrowRight className="mr-2 h-5 w-5" />
                    {extractValue(sections.hero.elements.ctaButton)}
                  </Button>
                </div>
                <p className="text-sm text-slate-500 italic max-w-2xl mx-auto">
                  <AlertTriangle className="w-4 h-4 inline mr-1" />
                  {extractValue(sections.hero.elements.disclaimer)}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Filter Section */}
        {sections?.filter?.enabled && (
            <section className="py-16 bg-gradient-to-br from-slate-50 to-blue-50/30 relative overflow-hidden">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <div className="text-center mb-12">
                        <Badge variant="outline" className="mb-4 bg-white/80 backdrop-blur-sm border-blue-200 text-blue-700">
                            {extractValue(sections.filter.elements.badge)}
                        </Badge>
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4" dangerouslySetInnerHTML={{ __html: extractValue(sections.filter.elements.title).replace('brutalmente onesto', '<span class="text-blue-600">brutalmente onesto</span>') }}/>
                        <p className="text-xl text-slate-600">{extractValue(sections.filter.elements.subtitle)}</p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-8">
                        <Card className="border-2 border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 shadow-xl">
                            <CardContent className="p-8">
                                <div className="flex items-center mb-6">
                                    <div className="bg-green-500 p-3 rounded-full mr-4 shadow-lg"><CheckCircle className="h-6 w-6 text-white" /></div>
                                    <h3 className="text-2xl font-bold text-green-800">{sections.filter.elements.whatWeDo.value.title}</h3>
                                </div>
                                <ul className="space-y-4 text-green-700">
                                    {sections.filter.elements.whatWeDo.value.items.map((item: string, index: number) => (
                                        <li key={index} className="flex items-start">
                                            <Sparkles className="h-5 w-5 text-green-600 mt-1 mr-3 flex-shrink-0" />
                                            <span className="font-medium">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                        <Card className="border-2 border-red-300 bg-gradient-to-br from-red-50 to-rose-50 shadow-xl">
                            <CardContent className="p-8">
                                <div className="flex items-center mb-6">
                                    <div className="bg-red-500 p-3 rounded-full mr-4 shadow-lg"><AlertTriangle className="h-6 w-6 text-white" /></div>
                                    <h3 className="text-2xl font-bold text-red-800">{sections.filter.elements.whatWeDontDo.value.title}</h3>
                                </div>
                                <ul className="space-y-4 text-red-700">
                                    {sections.filter.elements.whatWeDontDo.value.items.map((item: string, index: number) => (
                                        <li key={index} className="flex items-start">
                                            <X className="h-5 w-5 text-red-600 mt-1 mr-3 flex-shrink-0" />
                                            <span className="font-medium">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>
        )}

        {/* ***** SEZIONE MANCANTE SOCIAL PROOF AGGIUNTA QUI ***** */}
        {sections?.socialProof?.enabled && (
          <section className="py-20 bg-white relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-indigo-50/50"></div>
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
              <div className="text-center mb-12">
                <Badge variant="outline" className="mb-4 bg-blue-50 border-blue-200 text-blue-700">
                  {extractValue(sections.socialProof.elements.badge)}
                </Badge>
                <p className="text-2xl md:text-3xl font-bold text-slate-900 mb-6" dangerouslySetInnerHTML={{ __html: extractValue(sections.socialProof.elements.intro).replace('"Ok, ma come siete arrivati a creare una cosa del genere?"', '<span class="text-blue-600">"Ok, ma come siete arrivati a creare una cosa del genere?"</span>') }} />
              </div>

              <div className="grid lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2">
                  <Card className="p-8 shadow-xl border-2 border-blue-100 bg-gradient-to-br from-white to-blue-50/30">
                    <CardContent className="p-0">
                      <div className="mb-6">
                        <h3 className="text-xl font-bold text-slate-900 mb-4">
                          {extractValue(sections.socialProof.elements.storyTitle)}
                        </h3>
                        <div className="space-y-4 text-lg text-slate-700 leading-relaxed">
                          {(sections.socialProof.elements.storyContent.value || []).map((p: string, i: number) => <p key={i} dangerouslySetInnerHTML={{ __html: p }} />)}
                        </div>
                      </div>

                      <div className="border-t pt-6 mt-6">
                        <h4 className="text-lg font-bold text-slate-900 mb-3">
                          {extractValue(sections.socialProof.elements.credibilityTitle)}
                        </h4>
                        <p className="text-slate-700 mb-4">
                          {extractValue(sections.socialProof.elements.credibilityText)}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {(sections.socialProof.elements.partnerships.value || []).map((partner: string, i: number) => <Badge key={i} variant="secondary" className="bg-purple-100 text-purple-700">{partner}</Badge>)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="lg:col-span-1">
                  <Card className="p-6 shadow-xl border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-amber-50">
                    <CardContent className="p-0 text-center">
                      <div className="mb-4">
                        <img 
                          src={extractValue(sections.socialProof.elements.bookImage)} 
                          alt={extractValue(sections.socialProof.elements.bookImage, 'alt')} 
                          className="w-full max-w-[200px] mx-auto rounded-lg shadow-lg"
                        />
                      </div>
                      <h4 className="text-lg font-bold text-slate-900 mb-3">
                        {extractValue(sections.socialProof.elements.bookTitle)}
                      </h4>
                      <p className="text-sm text-slate-600 mb-4">
                        {extractValue(sections.socialProof.elements.bookDescription)}
                      </p>
                      <Button asChild className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                        <a href={sections.socialProof.elements.bookLink.url} target="_blank" rel="noopener noreferrer">
                          {sections.socialProof.elements.bookLink.text}
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Problems Section */}
        {sections?.problems?.enabled && (
            <section className="py-16 bg-slate-100">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">{extractValue(sections.problems.elements.title)}</h2>
                        <p className="text-xl text-slate-600">{extractValue(sections.problems.elements.subtitle)}</p>
                    </div>
                    <div className="grid gap-6">
                        {(sections.problems.elements.problemsList.value || []).map((problem: any, index: number) => {
                            const IconComponent = iconMap[problem.icon] || AlertTriangle;
                            return (
                                <Card key={index} className="p-6">
                                    <CardContent className="p-0 flex items-start space-x-4">
                                        <div className="text-red-500 flex-shrink-0 mt-1"><IconComponent className="h-8 w-8" /></div>
                                        <div>
                                            <h3 className="text-xl font-semibold text-slate-900 mb-2">{problem.title}</h3>
                                            <p className="text-slate-600">{problem.description}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </section>
        )}

        {/* Solution Section */}
        {sections?.solution?.enabled && (
            <section className="py-16 bg-white">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4" dangerouslySetInnerHTML={{ __html: extractValue(sections.solution.elements.title).replace("Serve un piano d'azione ingegneristico.", '<span class="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Serve un piano d\'azione ingegneristico.</span>') }} />
                        <p className="text-xl text-slate-600">{extractValue(sections.solution.elements.subtitle)}</p>
                    </div>
                    <div className="grid gap-8">
                        {(sections.solution.elements.phases.value || []).map((phase: any, index: number) => {
                            const IconComponent = iconMap[phase.icon] || Shield;
                            return (
                                <Card key={index} className="overflow-hidden">
                                    <CardContent className="p-0 flex">
                                        <div className={`w-2 bg-gradient-to-b ${phase.color}`}></div>
                                        <div className="p-6 flex-1">
                                            <div className="flex items-center space-x-4 mb-4">
                                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${phase.color} flex items-center justify-center text-white`}>
                                                    <IconComponent className="h-8 w-8" />
                                                </div>
                                                <div>
                                                    <Badge variant="outline" className="mb-2">{phase.phase}</Badge>
                                                    <h3 className="text-xl font-bold text-slate-900">{phase.title}</h3>
                                                </div>
                                            </div>
                                            <p className="text-slate-600 mb-4">{phase.description}</p>
                                            <div className="bg-slate-50 rounded-lg p-3">
                                                <p className="text-sm font-semibold text-slate-700">
                                                    <span className="text-green-600">Trasformazione:</span> {phase.transformation}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </section>
        )}

        {/* Value Stack Section */}
        {sections?.valueStack?.enabled && (
            <section className="py-16 bg-slate-100">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4" dangerouslySetInnerHTML={{ __html: extractValue(sections.valueStack.elements.title).replace("Acquisisci un intero arsenale per la costruzione della ricchezza.", '<span class="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Acquisisci un intero arsenale per la costruzione della ricchezza.</span>') }} />
                    </div>
                    <div className="grid gap-6">
                        {(sections.valueStack.elements.components.value || []).map((component: any, index: number) => {
                            const IconComponent = iconMap[component.icon] || Calculator;
                            return (
                                <Card key={index} className="p-6">
                                    <CardContent className="p-0 flex items-start space-x-4">
                                        <div className="bg-blue-100 p-3 rounded-lg text-blue-600"><IconComponent className="h-6 w-6" /></div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="text-lg font-semibold text-slate-900">{component.title}</h3>
                                                <Badge variant="secondary" className="text-green-600 font-semibold">Valore: {component.value}</Badge>
                                            </div>
                                            <p className="text-slate-600">{component.description}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                    <div className="mt-8 p-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl text-white text-center">
                        <h3 className="text-2xl font-bold mb-2">{extractValue(sections.valueStack.elements.totalValue)}</h3>
                        <p className="text-xl">{extractValue(sections.valueStack.elements.yourInvestment)}</p>
                    </div>
                </div>
            </section>
        )}

        {/* Pricing Section */}
        {sections?.pricing?.enabled && (
            <section className="py-16 bg-white">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">{extractValue(sections.pricing.elements.title)}</h2>
                    </div>
                    <div className="grid md:grid-cols-2 gap-8">
                        {(sections.pricing.elements.plans.value || []).map((plan: any, index: number) => (
                            <Card key={index} className={`relative overflow-hidden ${plan.recommended ? 'border-2 border-orange-200' : ''}`}>
                                {plan.recommended && (
                                    <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-orange-500 to-red-500 text-white text-center py-2">
                                        <span className="font-semibold">CONSIGLIATO</span>
                                    </div>
                                )}
                                <CardContent className={`p-8 ${plan.recommended ? 'pt-12' : ''}`}>
                                    <div className="text-center mb-6">
                                        <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                                        <div className={`text-3xl font-bold ${plan.recommended ? 'text-orange-600' : 'text-blue-600'} mb-4`}>{plan.price}</div>
                                    </div>
                                    <ul className="space-y-3 mb-8">
                                        {(plan.features || []).map((feature: string, fIndex: number) => (
                                            <li key={fIndex} className="flex items-center">
                                                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <p className="text-sm text-slate-600 mb-6">{plan.ideal}</p>
                                    <Button onClick={handleCandidatura} className={`w-full ${plan.recommended ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-blue-600'}`}>
                                        {plan.buttonText}
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>
        )}

        {/* Guarantee Section */}
        {sections?.guarantee?.enabled && (
            <section className="py-16 bg-green-50">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="bg-white rounded-2xl p-8 shadow-lg">
                        <Shield className="w-16 h-16 text-green-600 mx-auto mb-6" />
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">{extractValue(sections.guarantee.elements.title)}</h2>
                        <p className="text-lg text-slate-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: extractValue(sections.guarantee.elements.text).replace('ti rimborsiamo l\'intero importo versato. Senza fare domande.', '<strong class="text-green-600">ti rimborsiamo l\'intero importo versato. Senza fare domande.</strong>') }} />
                    </div>
                </div>
            </section>
        )}

        {/* Fork Section */}
        {sections?.fork?.enabled && (
            <section className="py-20 bg-white text-slate-900">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center space-x-2 bg-blue-100 rounded-full px-6 py-3 mb-6">
                            <AlertTriangle className="w-5 h-5 text-blue-600" />
                            <span className="text-blue-800 font-semibold">{extractValue(sections.fork.elements.badge)}</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold mb-6" dangerouslySetInnerHTML={{ __html: extractValue(sections.fork.elements.title).replace('BIVIO DEFINITIVO', '<span class="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">BIVIO DEFINITIVO</span>') }}/>
                        <p className="text-xl text-slate-600 max-w-3xl mx-auto">{extractValue(sections.fork.elements.subtitle)}</p>
                    </div>
                    <div className="grid lg:grid-cols-2 gap-8 mb-16">
                        {/* Path 1 */}
                        <Card className="border-2 border-red-300">
                            <div className="bg-red-500 text-white text-center py-2 font-bold text-sm">{sections.fork.elements.statusQuoPath.value.title}</div>
                            <CardContent className="p-8">
                                <div className="text-center mb-6"><div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><TrendingDown className="h-10 w-10 text-red-500" /></div><h3 className="text-2xl font-bold text-red-700">{sections.fork.elements.statusQuoPath.value.subtitle}</h3><p className="text-slate-500 italic">{sections.fork.elements.statusQuoPath.value.description}</p></div>
                                <div className="space-y-4">
                                    {sections.fork.elements.statusQuoPath.value.consequences.map((item: any, index: number) => (
                                        <div key={index} className="flex items-start space-x-3"><Clock className="h-5 w-5 text-red-500 mt-1" /><div><p className="font-medium">{item.title}</p><p className="text-sm text-slate-600">{item.description}</p></div></div>
                                    ))}
                                </div>
                                <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200"><p className="text-red-800 text-center font-semibold">{sections.fork.elements.statusQuoPath.value.finalThought}</p></div>
                            </CardContent>
                        </Card>
                        {/* Path 2 */}
                        <Card className="border-2 border-green-400">
                            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-center py-2 font-bold text-sm">{sections.fork.elements.transformationPath.value.title}</div>
                            <CardContent className="p-8">
                                <div className="text-center mb-6"><div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4"><Target className="h-10 w-10 text-blue-600" /></div><h3 className="text-2xl font-bold text-green-700">{sections.fork.elements.transformationPath.value.subtitle}</h3><p className="text-slate-500 italic">{sections.fork.elements.transformationPath.value.description}</p></div>
                                <div className="space-y-4">
                                    {sections.fork.elements.transformationPath.value.benefits.map((item: any, index: number) => (
                                        <div key={index} className="flex items-start space-x-3"><Shield className="h-5 w-5 text-green-500 mt-1" /><div><p className="font-medium">{item.title}</p><p className="text-sm text-slate-600">{item.description}</p></div></div>
                                    ))}
                                </div>
                                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200"><p className="text-blue-800 text-center font-semibold">{sections.fork.elements.transformationPath.value.finalThought}</p></div>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="text-center">
                        <Button size="lg" onClick={handleCandidatura} className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xl px-12 py-6 rounded-xl shadow-2xl">
                            <ArrowRight className="mr-3 h-6 w-6" />
                            SCELGO LA STRADA #2: CANDIDATI ORA
                        </Button>
                    </div>
                </div>
            </section>
        )}

        {/* Footer statico */}
        <footer className="bg-slate-800 text-slate-300 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <div className="flex items-center justify-center space-x-3 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Metodo ORBITALE</h3>
                        <p className="text-xs">Costruisci il Tuo Patrimonio</p>
                    </div>
                </div>
                <p className="text-sm">© 2025 Metodo ORBITALE. Tutti i diritti riservati.</p>
            </div>
        </footer>
      </div>
    </>
  );
}