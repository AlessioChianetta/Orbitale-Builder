import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  Mail,
  Phone,
  MapPin,
  Clock,
  CheckCircle,
  Headphones,
  Zap,
  Users,
  MessageCircle,
  Send,
  Shield
} from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

const contactSchema = z.object({
  nome: z.string().min(2, "Il nome deve avere almeno 2 caratteri"),
  cognome: z.string().min(2, "Il cognome deve avere almeno 2 caratteri"),
  email: z.string().email("Inserisci un indirizzo email valido"),
  telefono: z.string().optional(),
  azienda: z.string().optional(),
  oggetto: z.string().min(1, "Seleziona un oggetto"),
  messaggio: z.string().min(10, "Il messaggio deve avere almeno 10 caratteri"),
});

type ContactFormData = z.infer<typeof contactSchema>;

interface ContattiData {
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

interface ContattiRendererProps {
  contatti: ContattiData;
}

export function ContattiRenderer({ contatti }: ContattiRendererProps) {
  const { content: sections } = contatti;
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      nome: "",
      cognome: "",
      email: "",
      telefono: "",
      azienda: "",
      oggetto: "",
      messaggio: "",
    }
  });

  const createLeadMutation = useMutation({
    mutationFn: async (leadData: {
      name: string;
      email: string;
      phone?: string;
      company?: string;
      message: string;
      source: string;
    }) => {
      const response = await apiRequest("POST", "/api/leads", leadData);
      return response.json();
    },
    onSuccess: (data) => {
      setIsSubmitted(true);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      toast({
        title: "Messaggio inviato!",
        description: "Ti risponderemo entro 24 ore.",
      });
      console.log('Lead created:', data?.id);
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: "Si è verificato un errore. Riprova più tardi.",
        variant: "destructive"
      });
      console.error('Lead submission error:', error);
    }
  });

  const onSubmit = async (data: ContactFormData) => {
    const leadData = {
      name: `${data.nome} ${data.cognome}`.trim(),
      email: data.email,
      phone: data.telefono || undefined,
      company: data.azienda || undefined,
      message: `Oggetto: ${data.oggetto}\n\n${data.messaggio}`,
      source: `contact-page-${data.oggetto}`
    };

    createLeadMutation.mutate(leadData);
  };

  // Funzione per ottenere valore da sezione
  const getSectionValue = (sectionId: string, elementKey: string, fallback = "") => {
    return sections?.[sectionId]?.elements?.[elementKey]?.value || fallback;
  };

  // Funzione per ottenere array da sezione
  const getSectionArray = (sectionId: string, elementKey: string, fallback: any[] = []) => {
    return sections?.[sectionId]?.elements?.[elementKey]?.value || fallback;
  };

  // Funzione per ottenere oggetti da sezione
  const getSectionObject = (sectionId: string, elementKey: string, fallback: any = {}) => {
    return sections?.[sectionId]?.elements?.[elementKey]?.value || fallback;
  };

  // Mapping delle icone
  const iconMap: { [key: string]: React.ElementType } = {
    Mail, Phone, MapPin, Clock, CheckCircle, Headphones, Zap, Users, MessageCircle, Send, Shield
  };

  const getIcon = (iconName: string) => {
    return iconMap[iconName] || MessageCircle;
  };

  return (
    <div className="min-h-screen bg-white text-slate-800">
      
      {/* Hero Section */}
      {sections.hero?.enabled && (
        <section className="py-12 md:py-16 text-center bg-slate-50 border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Badge className="mb-4">{getSectionValue('hero', 'badge', 'Contattaci')}</Badge>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-slate-900">
              {getSectionValue('hero', 'title', 'Parliamo del tuo')} {getSectionValue('hero', 'highlightTitle', 'Progetto')}.
            </h1>
            <p className="text-lg md:text-xl mt-6 text-slate-600">
              {getSectionValue('hero', 'subtitle', 'Siamo pronti ad ascoltare le tue idee e a trasformarle in un successo digitale. Inizia oggi con una consulenza gratuita e senza impegno.')}
            </p>
          </div>
        </section>
      )}

      {/* Contact Info Section */}
      {sections.contactInfo?.enabled && (
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                {getSectionValue('contactInfo', 'title', 'Come Raggiungerci')}
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {getSectionValue('contactInfo', 'subtitle', 'Siamo sempre disponibili per rispondere alle tue domande')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
              {(getSectionArray('contactInfo', 'contactMethods', []) as any[]).map((method, index) => {
                const Icon = getIcon(method.icon);
                return (
                  <Card key={index} className="h-full glass-card border-0 shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden group">
                    <CardContent className="p-6 text-center">
                      <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                        <Icon className="w-8 h-8 text-primary" />
                      </div>
                      
                      <h3 className="text-xl font-bold mb-2">{method.title}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{method.description}</p>
                      
                      {method.link ? (
                        <Link href={method.link} className="block">
                          <Button variant="outline" size="sm" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                            {method.value}
                          </Button>
                        </Link>
                      ) : (
                        <div className="text-sm font-medium text-foreground bg-muted px-3 py-2 rounded-md">
                          {method.value}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Contact Form Section */}
      {sections.contactForm?.enabled && (
        <section className="py-16 md:py-20 bg-muted/20">
          <div className="max-w-4xl mx-auto container-padding">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                {getSectionValue('contactForm', 'title', 'Invia un Messaggio')}
              </h2>
              <p className="text-muted-foreground">
                {getSectionValue('contactForm', 'subtitle', 'Compila il form sottostante e ti ricontatteremo entro 24 ore')}
              </p>
            </div>

            <Card className="glass-card border-0 shadow-2xl">
              <CardContent className="p-8">
                {isSubmitted ? (
                  <div className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-semibold text-xl">
                      Messaggio Inviato con Successo!
                    </h3>
                    <p className="text-muted-foreground">
                      Grazie per averci contattato. Il nostro team ti risponderà entro 24 ore.
                    </p>
                    <Button 
                      onClick={() => setIsSubmitted(false)}
                      variant="outline"
                    >
                      Invia un Altro Messaggio
                    </Button>
                  </div>
                ) : (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Nome e Cognome */}
                        <FormField
                          control={form.control}
                          name="nome"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome *</FormLabel>
                              <FormControl>
                                <Input placeholder="Il tuo nome" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="cognome"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cognome *</FormLabel>
                              <FormControl>
                                <Input placeholder="Il tuo cognome" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Email e Telefono */}
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email *</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                  <Input 
                                    type="email" 
                                    placeholder="email@esempio.it" 
                                    className="pl-10"
                                    {...field} 
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="telefono"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Telefono</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                  <Input 
                                    type="tel" 
                                    placeholder="+39 123 456 7890" 
                                    className="pl-10"
                                    {...field} 
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Azienda */}
                        <FormField
                          control={form.control}
                          name="azienda"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Azienda</FormLabel>
                              <FormControl>
                                <Input placeholder="Nome della tua azienda" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Oggetto */}
                        <FormField
                          control={form.control}
                          name="oggetto"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Oggetto *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleziona l'argomento" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="richiesta-informazioni">Richiesta informazioni</SelectItem>
                                  <SelectItem value="preventivo-sito-web">Preventivo sito web</SelectItem>
                                  <SelectItem value="consulenza-seo">Consulenza SEO</SelectItem>
                                  <SelectItem value="marketing-digitale">Marketing digitale</SelectItem>
                                  <SelectItem value="ecommerce">E-commerce</SelectItem>
                                  <SelectItem value="altro">Altro</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Messaggio */}
                        <FormField
                          control={form.control}
                          name="messaggio"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Messaggio *</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Descrivi il tuo progetto o le tue esigenze..."
                                  className="min-h-[120px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="text-center">
                        <Button 
                          type="submit" 
                          size="lg" 
                          className="px-8"
                          disabled={createLeadMutation.isPending}
                        >
                          {createLeadMutation.isPending ? (
                            "Invio in corso..."
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2" />
                              {getSectionValue('contactForm', 'submitButton', 'Invia Messaggio')}
                            </>
                          )}
                        </Button>
                      </div>

                      <div className="text-xs text-muted-foreground text-center bg-muted/50 p-3 rounded-md">
                        <Shield className="w-4 h-4 inline mr-1" />
                        {getSectionValue('contactForm', 'privacyNote', 'I tuoi dati personali saranno trattati nel rispetto della privacy. Non verranno mai condivisi con terze parti.')}
                      </div>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* FAQ Section */}
      {sections.faq?.enabled && (
        <section className="py-16 md:py-20">
          <div className="max-w-4xl mx-auto container-padding">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                {getSectionValue('faq', 'title', 'Domande Frequenti')}
              </h2>
              <p className="text-muted-foreground">
                {getSectionValue('faq', 'subtitle', 'Trova rapidamente le risposte alle domande più comuni')}
              </p>
            </div>

            <Accordion type="single" collapsible className="space-y-4">
              {(getSectionArray('faq', 'questions', []) as any[]).map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border glass-card px-6">
                  <AccordionTrigger className="text-left hover:no-underline">
                    <span className="font-semibold">{faq.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-6">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      )}

      {/* CTA Section */}
      {sections.cta?.enabled && (
        <section className="py-16 md:py-24">
          <div className="max-w-4xl mx-auto container-padding">
            <Card className="glass-card border-0 shadow-2xl p-8 md:p-12 text-center bg-gradient-to-br from-primary via-primary to-primary/80 text-white overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
              <div className="relative z-10">
                <MessageCircle className="w-16 h-16 mx-auto mb-6 opacity-90" />
                <h2 className="text-2xl md:text-3xl font-bold mb-4">
                  {getSectionValue('cta', 'title', 'Pronto a Iniziare?')}
                </h2>
                <p className="text-primary-foreground/90 mb-8 text-lg max-w-2xl mx-auto">
                  {getSectionValue('cta', 'subtitle', 'Non aspettare oltre. Contattaci oggi stesso e iniziamo a lavorare insieme al tuo successo digitale.')}
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                  <Button asChild variant="secondary" size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold px-8">
                    <Link href={getSectionObject('cta', 'primaryButton', {}).link || 'tel:+391234567890'}>
                      <Phone className="w-4 h-4 mr-2" />
                      {getSectionObject('cta', 'primaryButton', {}).text || 'Chiamaci Ora'}
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-primary font-semibold px-8">
                    <Link href={getSectionObject('cta', 'secondaryButton', {}).link || 'mailto:info@tuaagenzia.it'}>
                      <Mail className="w-4 h-4 mr-2" />
                      {getSectionObject('cta', 'secondaryButton', {}).text || 'Scrivici una Email'}
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </section>
      )}
    </div>
  );
}