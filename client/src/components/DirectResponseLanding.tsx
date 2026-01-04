
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { 
  PlayCircle, 
  CheckCircle, 
  Star, 
  Phone, 
  Calendar,
  ArrowRight,
  Shield,
  Users,
  TrendingUp
} from 'lucide-react';

interface DirectResponseLandingProps {
  // Pre-headline
  preHeadline?: string;
  
  // Main headline and sub-headline
  headline?: string;
  subHeadline?: string;
  
  // Video section
  videoUrl?: string;
  videoThumbnail?: string;
  
  // Personal copy
  authorName?: string;
  authorImage?: string;
  authorStory?: string;
  results?: string[];
  
  // Testimonials
  testimonials?: Array<{
    name: string;
    role?: string;
    company?: string;
    content: string;
    image?: string;
    video?: boolean;
  }>;
  
  // Client logos
  clientLogos?: string[];
  
  // Requirements and process
  requirements?: string[];
  processSteps?: string[];
  
  // CTA
  ctaText?: string;
  ctaSubtext?: string;
  
  // Form fields
  formTitle?: string;
  customFields?: string[];
}

export function DirectResponseLanding({
  preHeadline = "ATTENZIONE: Solo per imprenditori seri che vogliono risultati reali",
  headline = "Scopri Come Ho Aumentato le Vendite del 340% in 90 Giorni",
  subHeadline = "Il sistema esatto che uso per trasformare visitatori in clienti paganti (anche se parti da zero)",
  videoUrl,
  videoThumbnail = "/api/placeholder/800/450",
  authorName = "Marco Rossi",
  authorImage = "/api/placeholder/150/150",
  authorStory = "Dopo 15 anni nel marketing digitale e oltre 500 progetti completati, ho sviluppato un sistema che garantisce risultati concreti anche ai principianti.",
  results = [
    "€2.4M di fatturato generato per i clienti negli ultimi 12 mesi",
    "Tasso di conversione medio del 8.7% (3x superiore alla media)",
    "ROI medio di 4:1 sui progetti realizzati"
  ],
  testimonials = [
    {
      name: "Laura Bianchi",
      role: "CEO",
      company: "Fashion Hub",
      content: "In soli 3 mesi le nostre vendite sono triplicate. Il sistema di Marco funziona davvero!",
      image: "/api/placeholder/60/60"
    },
    {
      name: "Andrea Verdi", 
      role: "Founder",
      company: "GreenTech",
      content: "ROI del 500% nel primo mese. Non credevo fosse possibile.",
      image: "/api/placeholder/60/60"
    }
  ],
  clientLogos = ["/api/placeholder/120/60", "/api/placeholder/120/60", "/api/placeholder/120/60"],
  requirements = [
    "Fatturato annuo minimo di €100k",
    "Disponibilità a investire almeno €5k/mese in marketing",
    "Commitment serio verso la crescita del business"
  ],
  processSteps = [
    "Compila il form di candidatura",
    "Ricevi conferma entro 24 ore", 
    "Call strategica gratuita di 30 minuti",
    "Proposta personalizzata"
  ],
  ctaText = "CANDIDATI ORA",
  ctaSubtext = "Posti limitati - Solo 10 aziende al mese",
  formTitle = "Candidatura Strategia Crescita",
  customFields = ["Fatturato annuo attuale", "Budget marketing mensile", "Principale sfida del business"]
}: DirectResponseLandingProps) {
  
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefono: '',
    azienda: '',
    fatturato: '',
    budget: '',
    sfida: '',
    messaggio: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 2000);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Pre-headline Bar */}
      <div className="bg-destructive text-destructive-foreground py-3">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="font-semibold text-sm uppercase tracking-wide">
            {preHeadline}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        
        {/* Headline Section */}
        <div className="text-center mb-12">
          <h1 className="font-heading font-bold text-4xl md:text-5xl lg:text-6xl mb-6 leading-tight">
            {headline}
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed max-w-3xl mx-auto">
            {subHeadline}
          </p>
        </div>

        {/* Video Section */}
        <div className="mb-16">
          <div className="relative bg-black rounded-lg overflow-hidden shadow-2xl">
            <div className="aspect-video relative">
              {videoUrl ? (
                <video
                  src={videoUrl}
                  poster={videoThumbnail}
                  controls
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                  <img 
                    src={videoThumbnail} 
                    alt="Video preview" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <PlayCircle className="w-20 h-20 text-white opacity-80 hover:opacity-100 transition-opacity cursor-pointer" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* First CTA */}
        <div className="text-center mb-16">
          <Button size="lg" className="bg-destructive hover:bg-destructive/90 text-destructive-foreground px-12 py-6 text-xl font-bold">
            {ctaText}
            <ArrowRight className="ml-3 h-6 w-6" />
          </Button>
          <p className="text-sm text-muted-foreground mt-3 font-medium">
            {ctaSubtext}
          </p>
        </div>

        {/* Client Logos */}
        {clientLogos.length > 0 && (
          <div className="mb-16">
            <p className="text-center text-muted-foreground mb-8 font-medium">
              Aziende che hanno ottenuto risultati straordinari:
            </p>
            <div className="flex justify-center items-center gap-8 opacity-60">
              {clientLogos.map((logo, index) => (
                <img 
                  key={index}
                  src={logo} 
                  alt={`Client ${index + 1}`}
                  className="h-12 object-contain filter grayscale"
                />
              ))}
            </div>
          </div>
        )}

        {/* Testimonials */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">
            Quello Che Dicono i Nostri Clienti
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-6">
                <CardContent className="p-0">
                  <div className="flex items-center mb-4">
                    <img 
                      src={testimonial.image} 
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full object-cover mr-4"
                    />
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {testimonial.role}{testimonial.company && `, ${testimonial.company}`}
                      </p>
                    </div>
                  </div>
                  <p className="text-muted-foreground italic">"{testimonial.content}"</p>
                  <div className="flex mt-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Personal Copy */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Chi Sono e Perché Dovresti Fidarti</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <img 
                src={authorImage} 
                alt={authorName}
                className="w-full max-w-xs mx-auto rounded-lg shadow-lg"
              />
            </div>
            <div className="md:col-span-2">
              <h3 className="text-2xl font-bold mb-4">{authorName}</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                {authorStory}
              </p>
              
              <h4 className="text-xl font-semibold mb-4">I Miei Risultati Concreti:</h4>
              <div className="space-y-3">
                {results.map((result, index) => (
                  <div key={index} className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <p className="text-muted-foreground">{result}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Requirements */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">
            Requisiti per Candidarsi
          </h2>
          <Card className="border-2 border-destructive/20">
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold mb-4 flex items-center">
                    <Shield className="w-6 h-6 mr-2 text-destructive" />
                    Chi Può Candidarsi:
                  </h3>
                  <div className="space-y-3">
                    {requirements.map((req, index) => (
                      <div key={index} className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <p>{req}</p>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold mb-4 flex items-center">
                    <Calendar className="w-6 h-6 mr-2 text-primary" />
                    Processo di Selezione:
                  </h3>
                  <div className="space-y-3">
                    {processSteps.map((step, index) => (
                      <div key={index} className="flex items-start">
                        <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0">
                          {index + 1}
                        </div>
                        <p>{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Application Form */}
        <div className="mb-16" id="candidatura">
          <Card className="border-2 border-primary/20 shadow-2xl">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-4">{formTitle}</h2>
                <p className="text-muted-foreground">
                  Compila il form per candidarti. Riceverai una risposta entro 24 ore.
                </p>
              </div>

              {isSubmitted ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-4">Candidatura Inviata!</h3>
                  <p className="text-muted-foreground">
                    Grazie per la tua candidatura. Ti contatteremo entro 24 ore per la valutazione.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Nome e Cognome *
                      </label>
                      <Input
                        required
                        value={formData.nome}
                        onChange={(e) => handleInputChange('nome', e.target.value)}
                        placeholder="Il tuo nome completo"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Email *
                      </label>
                      <Input
                        required
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="la.tua@email.com"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Telefono *
                      </label>
                      <Input
                        required
                        type="tel"
                        value={formData.telefono}
                        onChange={(e) => handleInputChange('telefono', e.target.value)}
                        placeholder="+39 xxx xxx xxxx"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Nome Azienda *
                      </label>
                      <Input
                        required
                        value={formData.azienda}
                        onChange={(e) => handleInputChange('azienda', e.target.value)}
                        placeholder="Nome della tua azienda"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Fatturato Annuo Attuale *
                      </label>
                      <Input
                        required
                        value={formData.fatturato}
                        onChange={(e) => handleInputChange('fatturato', e.target.value)}
                        placeholder="es. €500k"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Budget Marketing Mensile *
                      </label>
                      <Input
                        required
                        value={formData.budget}
                        onChange={(e) => handleInputChange('budget', e.target.value)}
                        placeholder="es. €10k"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Principale Sfida del Business *
                    </label>
                    <Textarea
                      required
                      value={formData.sfida}
                      onChange={(e) => handleInputChange('sfida', e.target.value)}
                      placeholder="Descrivi la principale sfida che stai affrontando nel tuo business..."
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Messaggio Aggiuntivo
                    </label>
                    <Textarea
                      value={formData.messaggio}
                      onChange={(e) => handleInputChange('messaggio', e.target.value)}
                      placeholder="Qualcos'altro che vorresti farci sapere..."
                      rows={3}
                    />
                  </div>

                  <Separator />

                  <div className="text-center">
                    <Button 
                      type="submit" 
                      size="lg" 
                      disabled={isSubmitting}
                      className="bg-destructive hover:bg-destructive/90 text-destructive-foreground px-16 py-6 text-xl font-bold"
                    >
                      {isSubmitting ? (
                        <>Invio in corso...</>
                      ) : (
                        <>
                          {ctaText}
                          <ArrowRight className="ml-3 h-6 w-6" />
                        </>
                      )}
                    </Button>
                    <p className="text-sm text-muted-foreground mt-4 font-medium">
                      {ctaSubtext}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      I tuoi dati sono protetti e non verranno mai condivisi con terze parti
                    </p>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Final Social Proof */}
        <div className="text-center">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div className="text-center">
              <Users className="w-12 h-12 text-primary mx-auto mb-4" />
              <p className="text-2xl font-bold">500+</p>
              <p className="text-muted-foreground">Clienti Soddisfatti</p>
            </div>
            <div className="text-center">
              <TrendingUp className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <p className="text-2xl font-bold">340%</p>
              <p className="text-muted-foreground">Aumento Medio Vendite</p>
            </div>
            <div className="text-center">
              <Star className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <p className="text-2xl font-bold">4.9/5</p>
              <p className="text-muted-foreground">Valutazione Media</p>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground">
            © 2024 - Tutti i diritti riservati. Privacy Policy | Termini di Servizio
          </p>
        </div>
      </div>
    </div>
  );
}
