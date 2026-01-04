
import React, { useState } from 'react';
import { SEOHead } from '@/components/SEOHead';
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

interface FAQRendererProps {
  faq: {
    id?: string;
    title: string;
    slug: string;
    content: any;
    metaTitle?: string;
    metaDescription?: string;
  };
}

export function FAQRenderer({ faq }: FAQRendererProps) {
  const { title, slug, content, metaTitle, metaDescription } = faq;
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tutti");
  const [expandedItems, setExpandedItems] = useState<number[]>([]);

  // Helper functions
  const getSectionValue = (sectionId: string, elementKey: string, fallback = "") => {
    return content?.[sectionId]?.elements?.[elementKey]?.value || fallback;
  };

  const getSectionArray = (sectionId: string, elementKey: string, fallback: any[] = []) => {
    return content?.[sectionId]?.elements?.[elementKey]?.value || fallback;
  };

  // Get data from content
  const faqCategories = getSectionArray('categories', 'categoriesList', [
    { name: "Tutti", count: 24 },
    { name: "Servizi", count: 8 },
    { name: "Prezzi", count: 6 },
    { name: "Tempi", count: 4 },
    { name: "Supporto", count: 6 }
  ]);

  const faqs = getSectionArray('faqList', 'questions', []);

  const filteredFaqs = faqs.filter((faq: any) => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "Tutti" || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const popularFaqs = faqs.filter((faq: any) => faq.popular);

  const toggleExpanded = (index: number) => {
    setExpandedItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  return (
    <>
      <SEOHead 
        title={metaTitle || title}
        description={metaDescription}
        url={`/${slug}`}
        type="website"
      />
      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="py-12 bg-gradient-to-br from-primary/5 to-primary/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto">
              <Badge className="mb-6 bg-primary/10 text-primary border-primary/20">
                {getSectionValue('hero', 'badge', 'FAQ')}
              </Badge>
              <h1 className="font-heading font-bold text-5xl mb-6" data-testid="heading-hero">
                {getSectionValue('hero', 'title', 'Domande Frequenti')}
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                {getSectionValue('hero', 'subtitle', 'Trova rapidamente le risposte alle domande più comuni sui nostri servizi, prezzi, tempistiche e modalità di lavoro.')}
              </p>
              
              {/* Search Bar */}
              <div className="max-w-md mx-auto relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder={getSectionValue('searchSection', 'searchPlaceholder', 'Cerca nelle FAQ...')}
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
              {popularFaqs.slice(0, 4).map((faq: any, index: number) => (
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
                      {faqCategories.map((category: any, index: number) => (
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
                  {filteredFaqs.map((faq: any, index: number) => (
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
                {getSectionValue('supportSection', 'title', 'Non Hai Trovato la Risposta?')}
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                {getSectionValue('supportSection', 'subtitle', 'Il nostro team è sempre disponibile per rispondere alle tue domande specifiche.')}
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
