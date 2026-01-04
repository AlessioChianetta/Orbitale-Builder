import { useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useLocation } from 'wouter';
import { useFacebookPixelTracking } from '@/hooks/use-facebook-pixel-tracking';
import { CheckCircle2, ArrowRight, Calendar, Mail, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ThankYouConfig {
  title: string;
  subtitle: string;
  mainMessage: string;
  nextSteps: {
    icon: React.ReactNode;
    title: string;
    description: string;
  }[];
  ctaText?: string;
  ctaLink?: string;
  metaTitle: string;
  metaDescription: string;
}

const thankYouConfigs: Record<string, ThankYouConfig> = {
  orbitale: {
    title: '🎉 Candidatura Inviata con Successo!',
    subtitle: 'Benvenuto nel Metodo ORBITALE®',
    mainMessage: 'La tua candidatura è stata ricevuta correttamente. Il nostro team la esaminerà entro 24 ore.',
    nextSteps: [
      {
        icon: <Mail className="h-6 w-6 text-blue-600" />,
        title: 'Controlla la tua Email',
        description: 'Riceverai una email di conferma con tutti i dettagli entro pochi minuti.'
      },
      {
        icon: <Calendar className="h-6 w-6 text-green-600" />,
        title: 'Ti Contatteremo Entro 24 Ore',
        description: 'Se la tua candidatura è idonea, ti contatteremo per fissare la consulenza gratuita.'
      },
      {
        icon: <MessageSquare className="h-6 w-6 text-purple-600" />,
        title: 'Preparati alla Consulenza',
        description: 'Nel frattempo, pensa ai tuoi obiettivi finanziari per massimizzare il valore della consulenza.'
      }
    ],
    metaTitle: 'Grazie per la Candidatura - Metodo ORBITALE®',
    metaDescription: 'La tua candidatura è stata ricevuta. Ti contatteremo entro 24 ore.'
  },
  default: {
    title: '✅ Candidatura Inviata!',
    subtitle: 'Grazie per il tuo interesse',
    mainMessage: 'Abbiamo ricevuto la tua richiesta e ti ricontatteremo al più presto.',
    nextSteps: [
      {
        icon: <Mail className="h-6 w-6 text-blue-600" />,
        title: 'Email di Conferma',
        description: 'Riceverai una email di conferma a breve.'
      },
      {
        icon: <Calendar className="h-6 w-6 text-green-600" />,
        title: 'Ti Ricontatteremo',
        description: 'Il nostro team ti contatterà entro 24-48 ore.'
      }
    ],
    metaTitle: 'Grazie per la Candidatura',
    metaDescription: 'La tua candidatura è stata ricevuta correttamente.'
  }
};

export default function ThankYouPage() {
  const [location] = useLocation();
  
  // Estrai parametro source dalla query string
  const params = new URLSearchParams(window.location.search);
  const source = params.get('source') || 'default';
  
  // Ottieni configurazione basata sulla source
  const config = thankYouConfigs[source] || thankYouConfigs.default;

  // Auto-track Facebook Pixel events configured in Analytics Dashboard
  useFacebookPixelTracking({
    currentRoute: '/thank-you',
    pageTitle: config.metaTitle,
    pageSlug: 'thank-you',
    additionalData: {
      source: source,
      conversion_type: 'lead_submission',
      thank_you_page: true
    }
  });

  // Track page view and conversion
  useEffect(() => {
    // Track conversion con Meta Pixel se disponibile
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'CompleteRegistration', {
        content_name: `Thank You - ${source}`,
        status: 'completed'
      });
    }

    // Track con Google Analytics se disponibile
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'conversion', {
        'event_category': 'Form',
        'event_label': `Thank You - ${source}`
      });
    }

    // Salva l'evento di conversione nel database per analytics
    const trackConversion = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const campaign = params.get('campaign') || source;
        const landingPageSlug = params.get('landingPageSlug') || source;
        const utmSource = params.get('utm_source') || source;
        const utmMedium = params.get('utm_medium') || 'organic';
        const utmCampaign = params.get('utm_campaign') || campaign;

        await fetch('/api/analytics/track', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event: 'conversion',
            pageSlug: `thank-you-${landingPageSlug}`,
            data: {
              source: utmSource,
              medium: utmMedium,
              campaign: utmCampaign,
              landingPageSlug: landingPageSlug,
              page: 'thank-you',
              conversionType: 'lead_submission'
            },
            userAgent: navigator.userAgent,
            referrer: document.referrer || null
          })
        });
        
        console.log('✅ Analytics: Conversione tracciata nel database');
      } catch (error) {
        console.error('❌ Analytics: Errore nel tracciamento conversione:', error);
      }
    };

    trackConversion();
  }, [source]);

  return (
    <>
      <Helmet>
        <title>{config.metaTitle}</title>
        <meta name="description" content={config.metaDescription} />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center px-4 py-12">
        <div className="max-w-3xl w-full">
          {/* Success Icon */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6 animate-in zoom-in duration-500">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            
            <h1 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {config.title}
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-600 mb-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
              {config.subtitle}
            </p>
            
            <p className="text-lg text-slate-600 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
              {config.mainMessage}
            </p>
          </div>

          {/* Next Steps */}
          <div className="space-y-4 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            <h2 className="text-2xl font-bold text-slate-900 text-center mb-6">
              Prossimi Passi
            </h2>
            
            {config.nextSteps.map((step, index) => (
              <Card key={index} className="border-2 border-slate-200 hover:border-blue-400 transition-all duration-300 hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                      {step.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-slate-900 mb-1">
                        {step.title}
                      </h3>
                      <p className="text-slate-600">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* CTA Button */}
          {config.ctaText && config.ctaLink && (
            <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-6 rounded-lg shadow-lg"
                onClick={() => window.location.href = config.ctaLink!}
              >
                {config.ctaText}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          )}

          {/* Additional Info */}
          <div className="mt-12 text-center text-sm text-slate-500 animate-in fade-in duration-700 delay-700">
            <p>
              Hai domande? Contattaci all'indirizzo{' '}
              <a href="mailto:info@example.com" className="text-blue-600 hover:text-blue-700 underline">
                info@example.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
