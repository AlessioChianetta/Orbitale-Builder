import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';

// Funzione per estrarre l'ID video da URL Wistia, YouTube o Vimeo
const extractVideoId = (url: string): { platform: 'wistia' | 'youtube' | 'vimeo' | 'unknown', id: string } => {
  if (!url) return { platform: 'unknown', id: '' };

  // Wistia - controlla prima URL completi, poi ID diretto
  if (url.includes('wistia.com') || url.includes('wistia.net') || url.includes('fast.wistia.com')) {
    const wistiaUrlMatch = url.match(/(?:wistia\.com\/medias\/|wistia\.net\/embed\/iframe\/|fast\.wistia\.com\/embed\/iframe\/)([a-zA-Z0-9]+)/);
    if (wistiaUrlMatch) {
      return { platform: 'wistia', id: wistiaUrlMatch[1] };
    }
  }

  // Se è solo un ID Wistia (10 caratteri alfanumerici)
  if (/^[a-zA-Z0-9]{10}$/.test(url.trim())) {
    return { platform: 'wistia', id: url.trim() };
  }

  // YouTube
  const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  if (youtubeMatch) {
    return { platform: 'youtube', id: youtubeMatch[1] };
  }

  // Vimeo
  const vimeoMatch = url.match(/(?:player\.)?vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) {
    return { platform: 'vimeo', id: vimeoMatch[1] };
  }

  return { platform: 'unknown', id: '' };
};

// Componente VideoPlayer
const VideoPlayer = ({ videoUrl }: { videoUrl: string }) => {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasTrackedLoad, setHasTrackedLoad] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoInfo = extractVideoId(videoUrl);

  console.log('🎬 [VideoPlayer] URL originale:', videoUrl);
  console.log('🎬 [VideoPlayer] Info estratte:', videoInfo);

  // Carica script Wistia
  useEffect(() => {
    const loadWistiaScript = () => {
      const existingScript = document.querySelector('script[src*="wistia.com/assets/external/E-v1.js"]');

      if (!existingScript) {
        console.log('📦 Caricamento script Wistia...');
        const script = document.createElement('script');
        script.src = 'https://fast.wistia.com/assets/external/E-v1.js';
        script.async = true;
        script.onload = () => {
          console.log('✅ Script Wistia caricato');
          setIsScriptLoaded(true);
        };
        script.onerror = () => {
          console.error('❌ Errore caricamento script Wistia');
          setVideoError(true);
        };
        document.head.appendChild(script);
      } else {
        console.log('✅ Script Wistia già presente nel DOM');
        setIsScriptLoaded(true);
      }
    };

    loadWistiaScript();
  }, []);

  // Configura player Wistia
  useEffect(() => {
    if (!isScriptLoaded || !videoInfo.id || hasTrackedLoad || videoInfo.platform !== 'wistia') return;

    console.log('🎬 Configurazione Wistia player per:', videoInfo.id);

    const wistiaConfig = {
      id: videoInfo.id,
      onReady: function(video: any) {
        console.log('🎬 Wistia video pronto:', videoInfo.id);

        if (!hasTrackedLoad) {
          setIsLoaded(true);
          setHasTrackedLoad(true);
          setVideoError(false);
          console.log('🎬 Video Wistia caricato e pronto');
        }
      },
      onError: function(error: any) {
        console.error('❌ Errore Wistia player:', error);
        setVideoError(true);
        setIsLoaded(false);
      }
    };

    // Aggiungi configurazione alla coda Wistia
    (window as any)._wq = (window as any)._wq || [];
    (window as any)._wq.push(wistiaConfig);

    // Timeout di sicurezza
    const timeout = setTimeout(() => {
      if (!isLoaded && !hasTrackedLoad) {
        console.warn('⚠️ Timeout caricamento Wistia player, probabilmente ID non valido:', videoInfo.id);
        setVideoError(true);
        setHasTrackedLoad(true);
      }
    }, 10000);

    return () => clearTimeout(timeout);
  }, [isScriptLoaded, videoInfo.id, hasTrackedLoad, videoInfo.platform]);

  if (videoInfo.platform === 'wistia' && videoInfo.id) {
    if (videoError) {
      return (
        <div className="w-full h-full bg-gray-100 flex items-center justify-center text-center p-8">
          <div>
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <p className="text-gray-600 mb-4 text-lg font-semibold">
              Video Wistia non disponibile
            </p>
            <p className="text-sm text-gray-500 mb-4">
              ID: {videoInfo.id}
            </p>
            <p className="text-sm text-yellow-600 mb-4">
              💡 L'ID video potrebbe non essere pubblicamente accessibile o essere configurato come privato su Wistia
            </p>
            <a 
              href={videoUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              Apri video direttamente su Wistia
            </a>
          </div>
        </div>
      );
    }

    return (
      <div className="relative rounded-lg overflow-hidden shadow-lg" ref={containerRef}>
        <div 
          className={`wistia_embed wistia_async_${videoInfo.id} videoFoam=true`}
          style={{ 
            paddingBottom: '56.25%', 
            position: 'relative',
            height: 0,
            width: '100%'
          }}
        >
          <div className="wistia_swatch" style={{
            height: '100%',
            left: 0,
            opacity: 0,
            overflow: 'hidden',
            position: 'absolute',
            top: 0,
            transition: 'opacity 200ms',
            width: '100%'
          }}>
            <img 
              src={`https://fast.wistia.com/embed/medias/${videoInfo.id}/swatch`}
              style={{ 
                filter: 'blur(5px)', 
                height: '100%', 
                objectFit: 'contain', 
                width: '100%' 
              }}
              alt="Video thumbnail"
              onLoad={(e) => {
                const target = e.target as HTMLImageElement;
                if (target.parentElement) {
                  target.parentElement.style.opacity = '1';
                }
              }}
              onError={() => {
                console.warn('⚠️ Errore caricamento thumbnail Wistia per:', videoInfo.id);
                // Non mostrare errore per thumbnail, il video potrebbe comunque funzionare
              }}
            />
          </div>
        </div>

        {/* Loading overlay - mostra solo se non è ancora caricato */}
        {!isLoaded && isScriptLoaded && (
          <div className="absolute inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-10">
            <div className="text-white text-lg">Caricamento video...</div>
          </div>
        )}

        {/* Script loading overlay */}
        {!isScriptLoaded && (
          <div className="absolute inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-10">
            <div className="text-white text-lg">Inizializzazione player...</div>
          </div>
        )}
      </div>
    );
  }

  if (videoInfo.platform === 'youtube' && videoInfo.id) {
    return (
      <div className="w-full h-full">
        <iframe
          src={`https://www.youtube.com/embed/${videoInfo.id}?rel=0&showinfo=0&autoplay=0`}
          title="Video YouTube"
          className="w-full h-full rounded-lg"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  if (videoInfo.platform === 'vimeo' && videoInfo.id) {
    return (
      <div className="w-full h-full">
        <iframe
          src={`https://player.vimeo.com/video/${videoInfo.id}?badge=0&autopause=0&player_id=0&app_id=58479`}
          title="Video Vimeo"
          className="w-full h-full rounded-lg"
          frameBorder="0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  // Fallback per URL non riconosciuti o ID non validi
  return (
    <div className="w-full h-full bg-gray-100 flex items-center justify-center text-center p-8">
      <div>
        <p className="text-gray-600 mb-4">
          {videoInfo.platform === 'wistia' ? 
            'Video Wistia non disponibile o ID non valido' : 
            'Formato video non supportato'
          }
        </p>
        <p className="text-sm text-gray-500 mb-4">URL: {videoUrl}</p>
        {videoInfo.platform === 'wistia' && (
          <p className="text-sm text-yellow-600 mb-4">
            💡 Verifica che l'ID video Wistia "{videoInfo.id}" sia corretto e pubblicamente accessibile
          </p>
        )}
        <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
          Apri video in una nuova finestra
        </a>
      </div>
    </div>
  );
};

export default function RenditaDipendente() {
  const [formData, setFormData] = useState({
    businessName: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [showExitIntentModal, setShowExitIntentModal] = useState(false);
  const [hasShownExitIntent, setHasShownExitIntent] = useState(false);
  const [exitAttempts, setExitAttempts] = useState(0);
  const [pageLoadTime] = useState(Date.now());
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  // Traccia la visualizzazione della pagina e carica il video URL
  useEffect(() => {
    console.log('🚀 [RenditaDipendente] Componente montato, inizializzazione...');

    // Traccia visualizzazione
    fetch('/api/optin-pages/rendita-dipendente/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
      .then(response => {
        console.log('📊 [RenditaDipendente] Visualizzazione response status:', response.status);
        return response.json();
      })
      .then(data => {
        console.log('📊 [RenditaDipendente] Visualizzazione tracciata:', data);
      })
      .catch(err => console.error('❌ [RenditaDipendente] Errore tracking visualizzazione:', err));

    // Carica il video URL configurato dal pannello admin
    console.log('🎬 [RenditaDipendente] Caricamento dati pagina...');
    fetch('/api/optin-pages/rendita-dipendente')
      .then(response => {
        console.log('🎬 [RenditaDipendente] API response status:', response.status);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('🎬 [RenditaDipendente] Dati pagina ricevuti:', JSON.stringify(data, null, 2));

        if (!data) {
          console.error('❌ [RenditaDipendente] Nessun dato ricevuto dall\'API');
          return;
        }

        // Controlla prima customSettings.vslVideoUrl, poi videoUrl principale
        const configuredVideoUrl = data.customSettings?.vslVideoUrl || data.videoUrl;

        console.log('🎬 [RenditaDipendente] Video URL configurato:', configuredVideoUrl);
        console.log('🎬 [RenditaDipendente] customSettings:', data.customSettings);
        console.log('🎬 [RenditaDipendente] videoUrl principale:', data.videoUrl);

        if (configuredVideoUrl && configuredVideoUrl.trim() !== '') {
          setVideoUrl(configuredVideoUrl);
          console.log('✅ [RenditaDipendente] Video URL impostato:', configuredVideoUrl);
        } else {
          console.log('⚠️ [RenditaDipendente] Nessun video URL configurato, uso placeholder');
        }
      })
      .catch(err => {
        console.error('❌ [RenditaDipendente] Errore caricamento dati pagina:', err);
        console.error('❌ [RenditaDipendente] Errore dettagli:', err.message);
      });
  }, []);

  // Exit Intent Detection (versione potenziata)
  useEffect(() => {
    let mouseLeaveTimer: NodeJS.Timeout;
    let inactivityTimer: NodeJS.Timeout;
    let touchStartY = 0;
    let touchStartX = 0;
    let isGestureNavigation = false;

    // Intercettazione Browser Back/Navigation
    const handlePopState = (e: PopStateEvent) => {
      console.log('🔄 RenditaDipendente PopState intercettato, exitAttempts:', exitAttempts);

      if (exitAttempts < 5 && !showFormDialog) {
        e.preventDefault();
        const newAttempts = exitAttempts + 1;
        setExitAttempts(newAttempts);
        setShowExitIntentModal(true);
        setHasShownExitIntent(true);

        setTimeout(() => {
          window.history.pushState({ optinIntercept: true }, '', window.location.href);
        }, 50);
      }
    };

    // Mobile: Touch gesture detection
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
      touchStartX = e.touches[0].clientX;
      isGestureNavigation = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touchY = e.touches[0].clientY;
      const touchX = e.touches[0].clientX;
      const touchDiffY = touchY - touchStartY;
      const touchDiffX = touchX - touchStartX;

      if (Math.abs(touchDiffX) > Math.abs(touchDiffY) && Math.abs(touchDiffX) > 30) {
        const isLeftSwipe = touchDiffX > 0 && touchStartX < 50;
        const isRightSwipe = touchDiffX < 0 && touchStartX > (window.innerWidth - 50);

        if ((isLeftSwipe || isRightSwipe) && exitAttempts < 5 && !showFormDialog) {
          isGestureNavigation = true;
          setExitAttempts(prev => prev + 1);
          setShowExitIntentModal(true);
          setHasShownExitIntent(true);
        }
      }
    };

    // Desktop: Mouse leave detection
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && exitAttempts < 5 && !showFormDialog) {
        mouseLeaveTimer = setTimeout(() => {
          setExitAttempts(prev => prev + 1);
          setShowExitIntentModal(true);
          setHasShownExitIntent(true);
        }, 100);
      }
    };

    const handleMouseEnter = () => {
      if (mouseLeaveTimer) clearTimeout(mouseLeaveTimer);
    };

    // Inattività detection
    const resetInactivityTimer = () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        if (exitAttempts < 5 && !showFormDialog) {
          setExitAttempts(prev => prev + 1);
          setShowExitIntentModal(true);
          setHasShownExitIntent(true);
        }
      }, 4 * 60 * 1000); // 4 minuti
    };

    // Inizializza intercettazione
    window.history.pushState({ optinIntercept: true }, '', window.location.href);

    // Event listeners
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('popstate', handlePopState);

    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'].forEach(event => {
      document.addEventListener(event, resetInactivityTimer, { passive: true });
    });

    resetInactivityTimer();

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('popstate', handlePopState);

      ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'].forEach(event => {
        document.removeEventListener(event, resetInactivityTimer);
      });

      if (mouseLeaveTimer) clearTimeout(mouseLeaveTimer);
      if (inactivityTimer) clearTimeout(inactivityTimer);
    };
  }, [exitAttempts, showFormDialog, showExitIntentModal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const urlParams = new URLSearchParams(window.location.search);
      const referrer = document.referrer;
      const userAgent = navigator.userAgent;
      const deviceType = /Mobile|Android|iPhone|iPad/.test(userAgent) ? 'mobile' : 
                        /Tablet|iPad/.test(userAgent) ? 'tablet' : 'desktop';

      const browserInfo = {
        language: navigator.language,
        platform: navigator.platform,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
        screen: {
          width: screen.width,
          height: screen.height,
          colorDepth: screen.colorDepth
        }
      };

      const timeOnPage = Date.now() - pageLoadTime;

      const submitData = {
        businessName: formData.businessName,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        source: 'optin-rendita-dipendente',
        campaign: 'Rendita Dipendente - Libertà Finanziaria 2K',
        utmSource: urlParams.get('utm_source'),
        utmMedium: urlParams.get('utm_medium'),
        utmCampaign: urlParams.get('utm_campaign'),
        utmContent: urlParams.get('utm_content'),
        utmTerm: urlParams.get('utm_term'),
        referrer,
        userAgent,
        deviceType,
        browserInfo,
        landingPage: window.location.href,
        timeOnPage,
        videoWatchTime: 0,
        videoProgress: 0,
        pixelEvents: []
      };

      const response = await fetch('/api/marketing/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (response.ok) {
        // Registra la conversione
        try {
          await fetch('/api/optin-pages/rendita-dipendente/conversion', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            }
          });
        } catch (conversionError) {
          console.error('Errore registrazione conversione:', conversionError);
        }

        toast({
          title: 'Candidatura Inviata!',
          description: 'Grazie! Ti contatteremo entro 24h per valutare la tua candidatura.',
        });

        setFormData({
          businessName: '',
          firstName: '',
          lastName: '',
          email: '',
          phone: ''
        });

        setShowFormDialog(false);

        // Ottieni i dati della pagina per il redirect URL configurato
        const pageResponse = await fetch('/api/optin-pages/rendita-dipendente');
        if (pageResponse.ok) {
          const pageData = await pageResponse.json();
          const redirectUrl = pageData.customSettings?.redirectUrl;

          console.log('🔄 [REDIRECT] Dati pagina ricevuti:', pageData);
          console.log('🔄 [REDIRECT] URL configurato:', redirectUrl);

          // Prepara i parametri per il redirect
          const urlParams2 = new URLSearchParams({
            email: formData.email,
            phone: formData.phone,
            name: `${formData.firstName} ${formData.lastName}`,
            businessName: formData.businessName
          });

          if (redirectUrl && redirectUrl.trim() !== '') {
            // Usa l'URL configurato nelle impostazioni della pagina
            if (redirectUrl.startsWith('http://') || redirectUrl.startsWith('https://')) {
              // URL esterno - reindirizza direttamente
              console.log('🌐 [REDIRECT] URL esterno rilevato:', redirectUrl);
              window.location.href = redirectUrl;
            } else {
              // URL interno - aggiungi i parametri
              const separator = redirectUrl.includes('?') ? '&' : '?';
              const finalUrl = `${redirectUrl}${separator}${urlParams2.toString()}`;
              console.log('🔗 [REDIRECT] URL finale interno:', finalUrl);
              window.location.href = finalUrl;
            }
          } else {
            // Fallback se non c'è redirect configurato
            console.log('⚠️ [REDIRECT] Nessun redirect configurato, uso fallback');
            window.location.href = `/optin/rendita-dipendente/success?${urlParams2.toString()}`;
          }
        } else {
          // Fallback alla success page standard se non riesce a ottenere la configurazione
          console.error('❌ [REDIRECT] Errore nel recuperare la configurazione della pagina');
          const urlParams2 = new URLSearchParams({
            email: formData.email,
            phone: formData.phone,
            name: `${formData.firstName} ${formData.lastName}`,
            businessName: formData.businessName
          });
          window.location.href = `/optin/rendita-dipendente/success?${urlParams2.toString()}`;
        }
      } else {
        const errorMessage = data.message || data.error || `Errore server: ${response.status}`;
        toast({
          title: 'Errore',
          description: errorMessage,
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Errore',
        description: `Errore di connessione: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`,
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-black text-white font-sans">
      {/* Hero Section Esplosiva */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Sfondo Animato */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/10 to-green-900/20"></div>
          <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 1200 800">
            <defs>
              <pattern id="blueLines" patternUnits="userSpaceOnUse" width="120" height="120">
                <path d="M0 60 Q 30 30, 60 60 T 120 60" stroke="rgba(59,130,246,0.3)" strokeWidth="2" fill="none"/>
                <circle cx="60" cy="60" r="3" fill="rgba(59,130,246,0.5)"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#blueLines)" />
          </svg>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-6xl mx-auto">
            {/* Headline Superiore */}
            <div className="mb-8">
              <p className="text-blue-400 font-bold text-lg md:text-xl tracking-wide mb-4">
                🎯 ESCLUSIVO PER DIPENDENTI, PROFESSIONISTI E TECNICI
              </p>
              <div className="inline-block bg-gradient-to-r from-green-600 to-blue-700 px-6 py-2 rounded-full text-white font-bold text-sm md:text-base animate-pulse">
                ⚠️ CANDIDATURA LIMITATA - SOLO 50 POSTI DISPONIBILI
              </div>
            </div>

            {/* Titolo Principale Devastante */}
            <div className="space-y-6 mb-12">
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-black leading-tight">
                <span className="text-blue-400">RIVELATO:</span> Il Sistema{' '}
                <span className="bg-gradient-to-r from-blue-400 to-green-500 bg-clip-text text-transparent">"ACCELERATORE DI BUSINESS REMOTO"</span>{' '}
                che Trasforma il Tuo Lavoro Dipendente in una{' '}
                <span className="text-white font-black">FONTE DI RICCHEZZA</span>
              </h1>

              <h2 className="text-xl md:text-3xl lg:text-4xl font-bold text-blue-300 mb-8">
                + Il Metodo <span className="bg-blue-400 text-black px-3 py-1 font-black">"LIBERTÀ FINANZIARIA 2K"</span>{' '}
                per Generare <span className="text-white">€2.000+ di Rendita Passiva</span> al Mese{' '}
                <span className="text-blue-300">e almeno 100.000 / 500.000 euro di patrimonio personale in pochi anni</span>
              </h2>
            </div>

            {/* CTA Principale DEVASTANTE */}
            <div className="mb-12">
              <Button 
                size="xl" 
                onClick={() => setShowFormDialog(true)}
                className="bg-gradient-to-r from-blue-500 via-green-500 to-purple-500 
                           hover:from-blue-600 hover:via-green-600 hover:to-purple-600 
                           text-black font-black text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl
                           px-6 py-6 sm:px-8 sm:py-8 md:px-10 md:py-10 lg:px-12 lg:py-12
                           rounded-xl md:rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-300
                           w-full max-w-4xl mx-auto text-center leading-tight tracking-tight
                           whitespace-normal hyphens-auto min-h-[60px] sm:min-h-[70px] md:min-h-[80px] lg:min-h-[90px]
                           flex items-center justify-center cursor-pointer
                           hover:shadow-3xl active:scale-95 animate-pulse hover:animate-none
                           border-4 border-white shadow-white/50 hover:border-blue-300 hover:shadow-blue-300/70
                           relative overflow-hidden"
                style={{ wordBreak: 'break-word', overflowWrap: 'break-word', hyphens: 'auto' }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                <span className="block w-full relative z-10">
                  🚀 CANDIDATI ORA PER L'ECOSISTEMA COMPLETO!
                </span>
              </Button>
            </div>

            {/* Note di Urgenza */}
            <div className="text-green-400 font-bold text-lg md:text-xl space-y-2">
              <p>⏰ <span className="text-white">Attenzione:</span> Solo 50 candidature accettate questo mese</p>
            </div>
          </div>
        </div>
      </section>

      {/* Sezione Video VSL */}
      <section className="py-8 bg-slate-900 border-b border-blue-400/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-blue-400 mb-6">
              🎬 GUARDA IL VIDEO COMPLETO PER SCOPRIRE I 5 SEGRETI
            </h2>
            <div className="aspect-video bg-slate-800 rounded-xl border-2 border-blue-400 mb-6 overflow-hidden">
              {videoUrl ? (
                <VideoPlayer videoUrl={videoUrl} />
              ) : (
                <div className="flex items-center justify-center h-full text-center">
                  <div>
                    <div className="text-6xl text-blue-400 mb-4">▶️</div>
                    <p className="text-xl text-gray-300">Video Player - VSL Completa</p>
                    <p className="text-sm text-gray-400 mt-2">Durata: 45 minuti | Valore: €2.997</p>
                    <p className="text-xs text-gray-500 mt-4">
                      Video configurabile dal pannello admin
                    </p>
                  </div>
                </div>
              )}
            </div>
            <p className="text-lg text-gray-300">
              <strong className="text-blue-400">ATTENZIONE:</strong> Questo video contiene informazioni che possono trasformare 
              radicalmente la tua situazione finanziaria. Guardalo fino alla fine per non perdere nessun segreto.
            </p>
          </div>
        </div>
      </section>

      {/* Sezione Copy Principale ULTRA DISCORSIVA */}
      <section className="py-20 md:py-32 bg-slate-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">

            {/* Introduzione Narrativa */}
            <div className="mb-20 text-lg md:text-xl text-gray-200 leading-relaxed space-y-8">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                  Ciao e benvenuto! Sono Sofia.
                </h2>
                <p className="text-lg text-blue-400 font-semibold">
                  Se sei qui oggi, probabilmente è perché sei un dipendente, un professionista, un tecnico. 
                  Ami il tuo lavoro, o forse un tempo lo amavi, ma ogni giorno combatti una battaglia silenziosa.
                </p>
              </div>

              <p>
                <strong className="text-blue-400">La battaglia contro l'ansia della domenica sera.</strong> La battaglia contro la sveglia del lunedì mattina. La battaglia contro la frustrazione di vedere lo stipendio svanire prima della fine del mese, senza che nulla cambi davvero.
              </p>

              <p>
                E forse, la battaglia più grande: quella di vedere <em className="text-red-400">gli anni migliori della tua vita svanire</em> senza costruire un futuro finanziario solido e libero per te e la tua famiglia.
              </p>

              <div className="bg-slate-800 border-l-4 border-blue-400 p-8 rounded-r-lg">
                <p className="text-blue-300 font-semibold text-xl">
                  Se ti riconosci in questo, resta con me, perché sto per mostrarti come trasformare radicalmente la tua carriera e la tua vita finanziaria.
                </p>
              </div>

              <p>
                Ti svelerò come alcuni dipendenti stanno creando un business da remoto che genera <strong className="text-blue-400">un'entrata slegata dal tuo tempo e dal tuo cartellino.</strong>
              </p>

              <h3 className="font-bold text-white text-2xl mt-16 mb-6">L'Ecosistema che Cambia Tutto</h3>

              <p>
                La singola 'COSA' che separa i dipendenti che subiscono il lavoro da quelli che creano la propria libertà non è un singolo elemento.
              </p>

              <p>
                <strong className="text-blue-400">È un ecosistema.</strong> È quello che noi chiamiamo la combinazione sinergica dell'<em>Acceleratore di Business Remoto</em> e dell'<em>Acceleratore di Patrimonio Personale.</em>
              </p>

              <p>
                Immagina di poter fondere due mondi che oggi nella tua vita probabilmente non si parlano:
              </p>

              <div className="space-y-8 mt-8">
                <div className="border-l-4 border-green-400 pl-6">
                  <h4 className="font-bold text-white text-lg mb-2">PRIMO MONDO: La creazione di un tuo business profittevole e flessibile</h4>
                  <p>
                    Un'attività che puoi gestire da dove vuoi, che si basa sulle tue passioni o competenze, e che non richiede enormi capitali per iniziare. Un motore che, silenziosamente, ti genera <strong className="text-blue-400">un'entrata slegata dal tuo tempo e dal tuo cartellino.</strong>
                  </p>
                </div>

                <div className="border-l-4 border-purple-400 pl-6">
                  <h4 className="font-bold text-white text-lg mb-2">SECONDO MONDO: La trasformazione strategica di quei profitti in ricchezza personale e rendita passiva</h4>
                  <p>
                    Un sistema guidato che prende una parte di ciò che il tuo nuovo business genera e lo investe intelligentemente per costruirti un futuro finanziario slegato da qualsiasi lavoro attivo.
                  </p>
                </div>
              </div>

              <div className="bg-slate-800 border border-blue-400 p-8 rounded-lg my-12 text-center">
                <p className="text-xl font-bold text-blue-400 mb-4">
                  Quando questi due mondi si fondono, accade la vera magia.
                </p>
                <p className="text-lg">
                  Non solo crei una tua fonte di reddito, ma <strong className="text-white">TU diventi finanziariamente libero.</strong>
                </p>
              </div>

              <h3 className="font-bold text-white text-2xl mt-16 mb-6">Ma Prima, Guardiamo in Faccia la Realtà</h3>

              <p>
                Ti suona familiare qualcosa di tutto questo, sia al lavoro che quando pensi al tuo futuro?
              </p>

              <p>
                Vieni sommerso da email urgenti, riunioni inutili e richieste dell'ultimo minuto, e senti che il tuo tempo e le tue energie vengono prosciugati da attività che non ti danno alcuna soddisfazione reale.
              </p>

              <p>
                Vedi i tuoi colleghi correre come matti, sembrano api impazzite, ma alla fine del mese lo stipendio è sempre quello, e la qualità della tua vita crolla proprio quando avresti più bisogno di tempo per te.
              </p>

              <p>
                Il tuo capo ti chiama in continuazione anche fuori orario, costringendoti a scegliere tra la tua vita privata e la paura di essere visto come un "cattivo" dipendente.
              </p>

              <p>
                Hai colleghi e superiori che ti fanno i complimenti, ti danno una pacca sulla spalla e dicono <em className="text-blue-300">'ottimo lavoro, continua così!'</em>, ma poi la promozione o l'aumento non arrivano mai, e ti senti bloccato/a.
              </p>

              <p>
                E il tuo potenziale... si limita a eseguire compiti. Non proponi nuove idee, non sviluppi progetti tuoi, non crei valore per te stesso, lasciando che il tuo talento e le tue ambizioni si spengano giorno dopo giorno.
              </p>

              <div className="bg-red-900/30 border-l-4 border-red-400 p-8 rounded-r-lg my-12">
                <h4 className="font-bold text-red-300 text-xl mb-4">I Dolori Più Profondi:</h4>
                <div className="space-y-4">
                  <p>• Lavori come un matto, porti a casa uno stipendio, ma a fine mese non ti resta quasi nulla sul conto personale e ti senti sempre con l'acqua alla gola.</p>
                  <p>• Sogni di poterti permettere più libertà, magari viaggiare di più o goderti la vita, ma non vedi una via d'uscita finanziaria concreta dalla "ruota del criceto" del lavoro 9-17.</p>
                  <p>• Hai paura che tutto il tuo benessere dipenda al 100% dal tuo posto di lavoro e se un domani le cose andassero male, non avresti un piano B o un paracadute.</p>
                  <p>• Vorresti investire per il tuo futuro e quello della tua famiglia, ma la finanza ti sembra un mondo complicato e non sai da dove iniziare o di chi fidarti.</p>
                </div>
              </div>

              <p>
                <strong className="text-white">Se hai annuito anche solo una volta, non è colpa tua.</strong> Sei vittima di un modello di carriera obsoleto e di una mancanza di strategia per la tua ricchezza personale, basato su false credenze che oggi andremo a distruggere insieme.
              </p>

              <h3 className="font-bold text-white text-2xl mt-16 mb-6">I 4 Errori Silenziosi che Stanno Uccidendo la Tua Ricchezza</h3>

              <div className="space-y-12 mt-8">
                <div className="bg-slate-800 p-8 rounded-lg">
                  <h4 className="font-bold text-red-400 text-xl mb-4">ERRORE #1: "Per avviare un business, serve un'idea geniale e rivoluzionaria"</h4>
                  <p className="mb-4">
                    <strong className="text-white">Falso.</strong> Questa credenza ti paralizza e ti impedisce di iniziare, mentre aspetti un'illuminazione che non arriverà mai.
                  </p>
                  <p>
                    <strong className="text-green-400">La Soluzione:</strong> Il <em>'Talento Aumentato'</em>. Potenziare le tue competenze attuali con un sistema che le trasforma in un servizio ad alta richiesta, risolvendo un problema specifico per un gruppo specifico di persone.
                  </p>
                </div>

                <div className="bg-slate-800 p-8 rounded-lg">
                  <h4 className="font-bold text-red-400 text-xl mb-4">ERRORE #2: "Lavorando 8 ore al giorno, non avrò mai il tempo per avviare un'altra attività"</h4>
                  <p className="mb-4">
                    Ogni ora passata a fare scrolling sui social, ogni serata persa davanti alla TV, è potenziale sprecato e un passo in meno verso la tua libertà.
                  </p>
                  <p>
                    <strong className="text-green-400">La Soluzione:</strong> Usare un <em>'Sistema di Gestione Intelligente'</em> che lavora per te anche quando non lavori, ottimizzando ogni minuto che dedichi al tuo nuovo business.
                  </p>
                </div>

                <div className="bg-slate-800 p-8 rounded-lg">
                  <h4 className="font-bold text-red-400 text-xl mb-4">ERRORE #3: "Non sono un venditore, non saprei mai come trovare clienti"</h4>
                  <p className="mb-4">
                    <strong className="text-white">Pura illusione.</strong> Oggi siamo bombardati da pubblicità. Se non fai qualcosa di attivo per connetterti con le persone giuste nel modo giusto, nessuno ti noterà.
                  </p>
                  <p>
                    <strong className="text-green-400">La Soluzione:</strong> Installare un <em>'Generatore'</em> di clienti, un sistema di contatto che li intercetta e li qualifica per te.
                  </p>
                </div>

                <div className="bg-slate-800 p-8 rounded-lg">
                  <h4 className="font-bold text-red-400 text-xl mb-4">ERRORE #4: "L'importante è avere un buon stipendio. I soldi che avanzano sono il mio 'risparmio'"</h4>
                  <p className="mb-4">
                    <strong className="text-white">Sbagliato!</strong> Lo stipendio è solo il punto di partenza per la sopravvivenza. Senza un piano attivo per trasformare i profitti in patrimonio personale e rendite passive, resterai schiavo del tuo lavoro per sempre.
                  </p>
                  <p>
                    <strong className="text-green-400">La Soluzione:</strong> Implementare un <em>'Sistema di Estrazione Valore Programmata'</em> dalla tua vita economica.
                  </p>
                </div>
              </div>

              <h3 className="font-bold text-white text-2xl mt-16 mb-6">Il Caso di Maria: Da Dipendente Frustrata a Libera Imprenditrice</h3>

              <p>
                Voglio presentarti Maria. Quando ho parlato con lei per la prima volta, la sua voce era carica di frustrazione. <em className="text-blue-300">'Sofia'</em>, mi disse, <em className="text-blue-300">'io sono brava nel mio lavoro, ma sto iniziando a odiarlo. Le giornate sono infinite, non ho tempo per me, lo stipendio basta a malapena e a fine mese l'utile sul mio conto è quasi zero. E non vedo come potrò mai smettere di lavorare così tanto. Sto pensando di rassegnarmi'.</em>
              </p>

              <div className="bg-slate-800 p-8 rounded-lg my-8">
                <h4 className="font-bold text-white text-xl mb-4">La Trasformazione di Maria in 3 Mesi</h4>
                <div className="space-y-4">
                  <p><strong className="text-green-400">PRIMA:</strong> Stipendio fisso di €1.600, nessuna prospettiva di crescita</p>
                  <p><strong className="text-green-400">OGGI:</strong> Genera €2.200 extra al mese con social media management</p>
                  <p><strong className="text-green-400">BONUS:</strong> Ha ritrovato il piacere di progettare il suo futuro</p>
                  <p><strong className="text-green-400">FUTURO:</strong> Vede un percorso chiaro per raggiungere l'indipendenza finanziaria</p>
                </div>
              </div>

              <p>
                Ma non è solo una questione di soldi dal business. È una questione di qualità della vita e di prospettive finanziarie personali. <strong className="text-white">Oggi Maria ha ritrovato il piacere di progettare il suo futuro</strong>, e per la prima volta vede un percorso chiaro per raggiungere l'indipendenza finanziaria, indipendentemente dal suo lavoro dipendente.
              </p>

              <h3 className="font-bold text-white text-2xl mt-16 mb-6">I 5 Segreti per la Libertà Finanziaria</h3>

              <div className="space-y-12 mt-8">
                <div className="border-l-4 border-blue-400 pl-8">
                  <h4 className="font-bold text-blue-400 text-xl mb-4">SEGRETO #1: L'"Idea da 2K al Mese"</h4>
                  <p className="mb-4">
                    Significa dare alle tue competenze esistenti un 'superpotere' commerciale attraverso un'analisi guidata che incrocia 3 elementi: ciò che sai fare, ciò che il mercato richiede, e ciò per cui le persone sono disposte a pagare bene.
                  </p>
                  <p>
                    <strong>Non sto parlando di corsi generici.</strong> Sto parlando di un processo che ti porta a definire un'offerta specifica. Questa non è vendita, è soluzione applicata.
                  </p>
                </div>

                <div className="border-l-4 border-green-400 pl-8">
                  <h4 className="font-bold text-green-400 text-xl mb-4">SEGRETO #2: Il "Generatore di Clienti Remoto"</h4>
                  <p className="mb-4">
                    Un sistema che funziona su una progressione a 3 livelli:
                  </p>
                  <div className="space-y-3 ml-6">
                    <p><strong>Livello 1:</strong> La Connessione di Valore. Offri un piccolo consiglio utile invece di vendere.</p>
                    <p><strong>Livello 2:</strong> Lo Status di Esperto. Condividi casi studio e risultati ottenuti.</p>
                    <p><strong>Livello 3:</strong> L'Offerta Esclusiva. Proponi una chiamata conoscitiva solo a chi ha mostrato interesse.</p>
                  </div>
                  <p className="mt-4">
                    <em>Non stai vendendo, stai creando relazioni e dimostrando valore.</em>
                  </p>
                </div>

                <div className="border-l-4 border-purple-400 pl-8">
                  <h4 className="font-bold text-purple-400 text-xl mb-4">SEGRETO #3: Il "Pilota Automatico del Business"</h4>
                  <p className="mb-4">
                    Un sistema di processi standardizzati che ti permette di gestire la tua attività in meno di 10 ore a settimana, include:
                  </p>
                  <div className="space-y-2 ml-6">
                    <p>• Modelli di email e checklist per i progetti</p>
                    <p>• Sistema di gestione appuntamenti automatico</p>
                    <p>• Strumenti di automazione per il follow-up</p>
                  </div>
                  <p className="mt-4">
                    <strong>Risultato:</strong> Libera circa il 50% del tempo dedicato all'amministrazione.
                  </p>
                </div>

                <div className="border-l-4 border-yellow-400 pl-8">
                  <h4 className="font-bold text-yellow-400 text-xl mb-4">SEGRETO #4: La "Formula Dipendente Ricco"</h4>
                  <p className="mb-4">
                    Trasforma il tuo nuovo business da semplice fonte di 'extra' a un vero e proprio motore di creazione di ricchezza personale. Attraverso:
                  </p>
                  <div className="space-y-2 ml-6">
                    <p>• Software di pianificazione dedicato</p>
                    <p>• Accademia formativa 'Dipendente Investitore'</p>
                    <p>• Strategia di suddivisione dei conti scientificamente calcolata</p>
                  </div>
                  <p className="mt-4">
                    <strong>L'obiettivo è chiaro:</strong> quella rendita passiva da <strong className="text-blue-400">almeno €2.000 al mese.</strong>
                  </p>
                </div>

                <div className="border-l-4 border-orange-400 pl-8">
                  <h4 className="font-bold text-orange-400 text-xl mb-4">SEGRETO #5: Il "Pilota Automatico del Patrimonio"</h4>
                  <p className="mb-4">
                    Un sistema che, una volta impostato con le nostre 12 consulenze iniziali dedicate, lavora per te in background:
                  </p>
                  <div className="space-y-2 ml-6">
                    <p>• Il nostro software proprietario traccia i progressi</p>
                    <p>• I tuoi conti personali si auto-alimentano secondo il piano</p>
                    <p>• Ricevi report chiari e comprensibili</p>
                  </div>
                  <p className="mt-4">
                    <em>Non devi diventare un esperto di finanza. La complessità la gestiamo noi, a te la serenità.</em>
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-600/20 to-green-600/20 border-2 border-blue-400 p-8 rounded-xl my-16">
                <h4 className="font-bold text-blue-400 text-2xl mb-4 text-center">La Domanda Che Racchiude Tutto</h4>
                <p className="text-xl text-center">
                  "Sofia, voglio un sistema così completo, che mi aiuti a creare il mio business E a costruire la mia libertà finanziaria! Come accedo a questi strumenti?"
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sezione Cosa Posso Fare Per Te */}
      <section className="py-20 md:py-32 bg-slate-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
                Cosa Posso Fare Per Te
              </h2>
            </div>

            <div className="text-lg md:text-xl text-gray-200 leading-relaxed space-y-8">
              <p>
                A questo punto hai due opzioni. La prima è prendere queste idee e provare a fare da solo: cercare un corso su come trovare un'idea, uno su come trovare clienti, poi un consulente finanziario separato, un corso di investimenti generico... cercare di farli parlare tra loro, spendere mesi, anni e <strong className="text-red-400">decine di migliaia di euro in tentativi.</strong>
              </p>

              <p>
                Oppure, c'è la seconda opzione. <strong className="text-blue-400">La via più veloce, sicura e integrata.</strong>
              </p>

              <div className="bg-slate-900 border border-blue-400 p-8 rounded-lg my-12">
                <h3 className="font-bold text-blue-400 text-2xl mb-6 text-center">L'Ecosistema Completo che Ti Offro</h3>

                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-bold text-white text-xl mb-4">💼 ACCELERATORE DI BUSINESS REMOTO</h4>
                    <ul className="space-y-2 text-gray-300">
                      <li>✓ Sistema "Idea da 2K al Mese"</li>
                      <li>✓ Generatore di Clienti Remoto</li>
                      <li>✓ Pilota Automatico del Business</li>
                      <li>✓ Setup guidato personalizzato</li>
                      <li>✓ Piano 90 giorni su misura</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-xl mb-4">💰 ACCELERATORE DI PATRIMONIO</h4>
                    <ul className="space-y-2 text-gray-300">
                      <li>✓ Formula "Dipendente Ricco"</li>
                      <li>✓ 12 consulenze individuali dedicate</li>
                      <li>✓ Software proprietario pianificazione</li>
                      <li>✓ Accademia "Dipendente Investitore"</li>
                      <li>✓ Simulatori crescita patrimoniale</li>
                    </ul>
                  </div>
                </div>
              </div>

              <p>
                Non parliamo di un corso generico, né di una consulenza isolata. Parliamo di un <strong className="text-white">ecosistema completo</strong>, che unisce strategie per creare un business da remoto, strumenti per generare profitti costanti, sistemi per costruire e far crescere il tuo patrimonio personale, consulenze dedicate, software proprietario e formazione continua.
              </p>

              <div className="bg-green-900/30 border-l-4 border-green-400 p-8 rounded-r-lg my-12">
                <h4 className="font-bold text-green-300 text-xl mb-4">Risultati Concreti che Otterrai:</h4>
                <div className="space-y-3">
                  <p>📈 <strong>Entro 30 giorni:</strong> La tua idea di business definita e primi contatti attivati</p>
                  <p>💡 <strong>Entro 90 giorni:</strong> Sistema di gestione automatizzato e primi clienti paganti</p>
                  <p>💰 <strong>Entro 6 mesi:</strong> Flusso di profitti costante €2.000-€3.000/mese</p>
                  <p>🏆 <strong>Entro 18 mesi:</strong> Rendita passiva €2.000+/mese attivata</p>
                </div>
              </div>

              <p>
                Se sommiamo tutto il valore che stai ricevendo - l'intero Ecosistema Acceleratore di Business Remoto + Acceleratore di Patrimonio, tutti i bonus, le consulenze, il software proprietario - parliamo di un pacchetto completo del <strong className="text-blue-400">valore di oltre €12.000.</strong>
              </p>

              <p>
                Ma l'investimento, ovviamente, non sarà questo. <strong className="text-white">Sarà un investimento molto più basso che andremo a personalizzare con te in consulenza.</strong>
              </p>

              <div className="text-center mt-12">
                <Button 
                  size="xl" 
                  onClick={() => setShowFormDialog(true)}
                  className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 
                             text-black font-black text-base sm:text-lg md:text-xl lg:text-2xl
                             px-6 py-6 sm:px-8 sm:py-8 md:px-10 md:py-10 lg:px-12 lg:py-12
                             rounded-xl md:rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-300
                             w-full max-w-3xl mx-auto text-center leading-tight tracking-tight
                             whitespace-normal hyphens-auto min-h-[60px] sm:min-h-[70px] md:min-h-[80px]
                             flex items-center justify-center cursor-pointer
                             hover:shadow-3xl active:scale-95 animate-pulse hover:animate-none
                             border-4 border-white shadow-white/50 hover:border-blue-300 hover:shadow-blue-300/70"
                  style={{ wordBreak: 'break-word', overflowWrap: 'break-word', hyphens: 'auto' }}
                >
                  <span className="block w-full">
                    🚀 VOGLIO CANDIDARMI PER L'ECOSISTEMA COMPLETO
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sezione Requisiti */}
      <section className="py-20 md:py-32 bg-slate-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
                Requisiti per Potersi Candidare
              </h2>
            </div>

            <div className="text-lg md:text-xl text-gray-200 leading-relaxed space-y-8">
              <p>
                Prima di parlare di come candidarsi, è importante che sia chiarissimo <strong className="text-blue-400">CHI SIAMO e CHI NON SIAMO.</strong>
              </p>

              <div className="grid md:grid-cols-2 gap-8 my-12">
                <div className="bg-green-900/30 border-2 border-green-500 p-8 rounded-xl">
                  <h3 className="text-2xl font-black text-green-400 mb-6">✅ LAVORIAMO CON CHI:</h3>
                  <ul className="space-y-3 text-gray-200">
                    <li>• È davvero determinato a cambiare vita finanziaria</li>
                    <li>• Ha esperienza lavorativa come dipendente o professionista</li>
                    <li>• È disposto a impegnarsi fino in fondo nel percorso</li>
                    <li>• Vuole risultati concreti, non teorie</li>
                    <li>• È pronto a investire su se stesso</li>
                    <li>• Capisce il valore del supporto personalizzato</li>
                  </ul>
                </div>

                <div className="bg-red-900/30 border-2 border-red-500 p-8 rounded-xl">
                  <h3 className="text-2xl font-black text-red-400 mb-6">❌ NON LAVORIAMO CON CHI:</h3>
                  <ul className="space-y-3 text-gray-200">
                    <li>• Vuole solo "provare" o curiosare</li>
                    <li>• Cerca scorciatoie o formule magiche</li>
                    <li>• Non è disposto a seguire le indicazioni</li>
                    <li>• Vuole consulenze a basso costo</li>
                    <li>• Cerca scuse invece di agire</li>
                    <li>• Non ha serietà nell'approccio al cambiamento</li>
                  </ul>
                </div>
              </div>

              <div className="bg-slate-800 border-l-4 border-blue-400 p-8 rounded-r-lg my-12">
                <h3 className="font-bold text-blue-400 text-xl mb-4">Requisiti Specifici:</h3>
                <div className="space-y-4">
                  <p><strong className="text-white">1. Esperienza Lavorativa:</strong> Devi avere almeno 2 anni di esperienza come dipendente o professionista</p>
                  <p><strong className="text-white">2. Competenze Base:</strong> Devi avere delle competenze che possano essere trasformate in servizi</p>
                  <p><strong className="text-white">3. Impegno Temporale:</strong> Disponibilità di almeno 5-7 ore settimanali per sviluppare il business</p>
                  <p><strong className="text-white">4. Determinazione:</strong> Volontà reale di trasformare la propria situazione finanziaria</p>
                  <p><strong className="text-white">5. Investimento:</strong> Capacità di investire seriamente nella propria crescita</p>
                </div>
              </div>

              <p>
                <strong className="text-white">È proprio questa chiarezza che rende il nostro ecosistema diverso da tutto il resto sul mercato.</strong> Qui non trovi informazioni frammentate, ma un sistema integrato che ti accompagna passo dopo passo, con metodo, strumenti e consulenze dedicate.
              </p>

              <p>
                L'unica cosa, il però, è che ovviamente non possiamo offrire questo livello di attenzione e supporto personalizzato, soprattutto le 12 consulenze finanziarie individuali, a tutti. Io e il mio team lavoreremo direttamente con te e questo richiede tempo e risorse dedicate.
              </p>

              <div className="bg-red-800/30 border border-red-400 p-8 rounded-lg text-center my-12">
                <p className="text-2xl font-bold text-red-300 mb-4">
                  ⚠️ ATTENZIONE: POSTI LIMITATI
                </p>
                <p className="text-xl text-white">
                  Per questi motivi, questa opportunità è limitata e accessibile solo tramite candidatura. 
                  <strong className="text-blue-400"> Solo 50 dipendenti selezionati questo mese.</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Garanzia e CTA Finale ESPLOSIVO */}
      <section className="py-20 md:py-32 bg-gradient-to-b from-blue-900/30 to-black">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto text-center">
            <div className="mb-16">
              <h2 className="text-4xl md:text-6xl font-black text-green-400 mb-8">
                🛡️ GARANZIA BLINDATA
              </h2>
              <div className="bg-gradient-to-r from-green-900/40 to-blue-900/40 border-4 border-green-400 p-10 rounded-2xl">
                <h3 className="text-2xl md:text-3xl font-black text-green-400 mb-6">
                  GARANZIA "RISCHIO ZERO" 30 GIORNI
                </h3>
                <p className="text-xl text-gray-200 mb-6">
                  Entri nel sistema, partecipi alle prime sessioni di setup del business e di pianificazione patrimoniale, segui le nostre indicazioni per 30 giorni. Se alla fine del mese, per qualsiasi motivo, non sei assolutamente entusiasta dei primi passi fatti e della chiarezza del tuo piano...
                </p>
                <p className="text-2xl font-bold text-white mb-4">
                  ...ti rimborsiamo l'INTERO investimento fino all'ultimo centesimo!
                </p>
                <p className="text-xl text-green-400 font-bold">
                  Nessuna domanda. Il rischio è tutto sulle MIE spalle. Non hai letteralmente NULLA da perdere!
                </p>
              </div>
            </div>

            <div className="mb-16">
              <h2 className="text-3xl md:text-5xl font-black text-white mb-8">
                ⏰ HAI DUE STRADE DAVANTI A TE...
              </h2>

              <div className="grid md:grid-cols-2 gap-8 mb-12">
                <div className="bg-gradient-to-b from-red-900/50 to-red-800/30 border-2 border-red-500 p-8 rounded-xl">
                  <h3 className="text-2xl font-black text-red-400 mb-6">❌ STRADA #1: Non Fare Nulla</h3>
                  <ul className="text-left space-y-3 text-gray-200">
                    <li>• Continui a essere frustrato dal tuo lavoro dipendente</li>
                    <li>• Il tuo stipendio rimane sempre quello</li>
                    <li>• Zero sicurezza per il futuro tuo e della famiglia</li>
                    <li>• Tra 5 anni sarai ancora nella stessa situazione</li>
                    <li>• I tuoi sogni di libertà rimangono solo sogni</li>
                    <li>• Perdi l'opportunità di costruire €2.000+ di rendita mensile</li>
                  </ul>
                </div>

                <div className="bg-gradient-to-b from-green-900/50 to-blue-800/30 border-2 border-green-500 p-8 rounded-xl">
                  <h3 className="text-2xl font-black text-green-400 mb-6">✅ STRADA #2: Candidati ORA</h3>
                  <ul className="text-left space-y-3 text-gray-200">
                    <li>• Crei il tuo business remoto profittevole</li>
                    <li>• Generi €2.000-€3.000+ extra ogni mese</li>
                    <li>• Costruisci €2.000+ di rendita passiva mensile</li>
                    <li>• Ritrovi il controllo del tuo tempo e della tua vita</li>
                    <li>• Diventi finalmente LIBERO e RICCO</li>
                    <li>• Crei sicurezza finanziaria per tutta la vita</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mb-12">
              <div className="bg-gradient-to-r from-blue-600/30 to-green-600/30 border-4 border-blue-400 p-10 rounded-2xl">
                <p className="text-2xl md:text-3xl font-black text-blue-400 mb-6">
                  🚨 ULTIMA CHIAMATA - SOLO 50 CANDIDATURE ACCETTATE
                </p>
                <p className="text-xl text-white font-bold mb-8">
                  Questo livello di supporto personalizzato (12 consulenze individuali + setup guidato + software proprietario) non può essere offerto a tutti. Per questo motivo, questa opportunità è LIMITATA.
                </p>

                <Button 
                  size="xl" 
                  onClick={() => setShowFormDialog(true)}
                  className="bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 
                             hover:from-green-600 hover:via-blue-600 hover:to-purple-600 
                             text-black font-black text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl
                             px-6 py-6 sm:px-8 sm:py-8 md:px-10 md:py-10 lg:px-12 lg:py-12
                             rounded-xl md:rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-300
                             w-full max-w-5xl mx-auto text-center leading-tight tracking-tight
                             whitespace-normal hyphens-auto min-h-[60px] sm:min-h-[70px] md:min-h-[80px] lg:min-h-[90px]
                             flex items-center justify-center cursor-pointer
                             hover:shadow-3xl active:scale-95 animate-pulse hover:animate-none
                             border-4 border-white shadow-white/50 hover:border-blue-300 hover:shadow-blue-300/70
                             relative overflow-hidden"
                  style={{ wordBreak: 'break-word', overflowWrap: 'break-word', hyphens: 'auto' }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                  <span className="block w-full relative z-10">
                    🔥 VOGLIO CANDIDARMI PER OTTENERE LA TUA CONSULENZA!
                  </span>
                </Button>

                <p className="text-red-400 font-bold text-lg mt-6">
                  ⚠️ Una volta chiuse le 50 candidature, dovrai aspettare almeno 3 mesi per la prossima apertura!
                </p>
              </div>
            </div>

            <div className="text-gray-400 text-sm mb-8">
              <p className="mb-2">
                <strong>P.S.</strong> Ogni giorno che aspetti è un giorno in più di opportunità perse e frustrazione accumulata. 
                Maria oggi genera €2.200/mese extra e sta costruendo la sua rendita passiva. Cosa aspetti?
              </p>
              <p>
                <strong>P.P.S.</strong> Il tuo lavoro dipendente non ti darà mai la libertà che meriti. I tuoi problemi finanziari non si risolveranno da soli. 
                <span className="text-blue-400 font-bold"> CANDIDATI ORA</span> prima che sia troppo tardi!
              </p>
            </div>

            <div className="bg-slate-800 border border-gray-600 p-6 rounded-lg">
              <p className="text-sm text-gray-400 italic">
                "Il tempo stringe. La decisione di voler cambiare l'hai già presa quando hai deciso di leggere questa pagina. 
                Oggi stai solo decidendo quale veicolo usare per arrivare alla meta. 
                Se pensi che noi possiamo essere il veicolo giusto per portarti al successo del tuo business 
                E alla tua indipendenza finanziaria, allora non aspettare."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Exit Intent Modal Personalizzato */}
      <Dialog open={showExitIntentModal} onOpenChange={setShowExitIntentModal}>
        <DialogContent className="max-w-md w-[95%] sm:w-[90%] mx-auto max-h-[95vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          {(() => {
            switch(exitAttempts) {
              case 1:
                return (
                  <>
                    <DialogHeader>
                      <DialogTitle className="text-xl md:text-2xl font-bold text-blue-600 text-center">
                        🤔 Aspetta! Prima di rinunciare alla tua libertà...
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 text-center px-2">
                      <p className="text-base md:text-lg font-semibold text-red-700">
                        🚨 Stai davvero per tornare alla routine che ti sta uccidendo?
                      </p>
                      <p className="text-sm md:text-base text-gray-700">
                        Maria era esattamente come te: frustrata, senza prospettive, con lo stesso stipendio da anni. 
                        Oggi genera <strong>€2.200/mese</strong> extra e sta costruendo €2.000+ di rendita passiva. 
                        <strong>La differenza? Ha detto SÌ a questa opportunità.</strong>
                      </p>
                      <Button
                        onClick={() => {
                          setShowExitIntentModal(false);
                          setShowFormDialog(true);
                        }}
                        className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-black font-black text-base sm:text-lg md:text-xl py-4 md:py-6 rounded-xl shadow-2xl 
                             cursor-pointer transform hover:scale-105 active:scale-95 transition-all duration-300
                             border-4 border-white shadow-white/50 hover:border-blue-300 hover:shadow-blue-300/70 hover:shadow-xl
                             animate-pulse hover:animate-none min-h-[60px] flex items-center justify-center"
                        style={{ wordBreak: 'break-word', overflowWrap: 'break-word', hyphens: 'auto' }}
                      >
                        💎 OK, voglio la mia libertà finanziaria!
                      </Button>
                    </div>
                  </>
                );

              case 2:
                return (
                  <>
                    <DialogHeader>
                      <DialogTitle className="text-xl md:text-2xl font-bold text-red-600 text-center">
                        💸 FERMATI! Stai per perdere €100.000+
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 text-center px-2">
                      <p className="text-base md:text-lg font-semibold text-red-700">
                        🧮 Facciamo due conti insieme...
                      </p>
                      <div className="bg-red-50 border-2 border-red-300 p-3 rounded-lg">
                        <p className="text-red-800 font-medium text-sm md:text-base">
                          💰 <strong>Se oggi perdi l'opportunità di generare €2.500/mese extra,</strong> 
                          in 3 anni avrai perso €90.000! E questo senza contare la rendita passiva che 
                          avresti potuto costruire nel frattempo...
                        </p>
                      </div>
                      <p className="text-sm md:text-base text-gray-700">
                        Questa candidatura potrebbe essere la decisione da <strong>€100.000+</strong> della tua vita!
                      </p>
                      <Button
                        onClick={() => {
                          setShowExitIntentModal(false);
                          setShowFormDialog(true);
                        }}
                        className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-black font-bold text-xs sm:text-sm md:text-base py-3 md:py-4 rounded-lg shadow-lg break-words hyphens-auto
                             cursor-pointer transform hover:scale-105 active:scale-95 transition-all duration-200
                             border-2 border-white/40 hover:border-white/80 hover:shadow-xl"
                        style={{ wordBreak: 'break-word', overflowWrap: 'break-word', hyphens: 'auto' }}
                      >
                        🔥 Non voglio perdere €100.000! CANDIDAMI!
                      </Button>
                    </div>
                  </>
                );

              case 3:
                return (
                  <>
                    <DialogHeader>
                      <DialogTitle className="text-xl md:text-2xl font-bold text-purple-600 text-center">
                        😢 Ok, capisco la tua paura...
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 text-center px-2">
                      <p className="text-base md:text-lg font-semibold text-purple-700">
                        💔 Forse pensi "è troppo bello per essere vero"...
                      </p>
                      <p className="text-sm md:text-base text-gray-700">
                        Lo capisco. Anche Maria all'inizio era scettica. Ma poi ha visto i risultati: 
                        business remoto funzionante, €2.200 extra al mese, patrimonio in crescita costante. 
                        <strong>È proprio per questo che offriamo garanzia totale!</strong>
                      </p>
                      <div className="bg-purple-50 border-2 border-purple-300 p-3 rounded-lg">
                        <p className="text-purple-800 font-medium text-sm md:text-base">
                          🛡️ <strong>RISCHIO ZERO:</strong> 30 giorni per provare tutto. 
                          Se non funziona, rimborso integrale. Cosa puoi perdere?
                        </p>
                      </div>
                      <Button
                        onClick={() => {
                          setShowExitIntentModal(false);
                          setShowFormDialog(true);
                        }}
                        className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-black font-bold text-xs sm:text-sm md:text-base py-3 md:py-4 rounded-lg shadow-lg break-words hyphens-auto
                             cursor-pointer transform hover:scale-105 active:scale-95 transition-all duration-200
                             border-2 border-white/40 hover:border-white/80 hover:shadow-xl"
                        style={{ wordBreak: 'break-word', overflowWrap: 'break-word', hyphens: 'auto' }}
                      >
                        🛡️ OK, con garanzia totale provo!
                      </Button>
                    </div>
                  </>
                );

              case 4:
                return (
                  <>
                    <DialogHeader>
                      <DialogTitle className="text-xl md:text-2xl font-bold text-blue-600 text-center">
                        ⏰ Ultima chance prima del rimpianto...
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 text-center px-2">
                      <p className="text-base md:text-lg font-semibold text-blue-700">
                        😰 Tra 1 anno ti guarderai indietro e penserai...
                      </p>
                      <p className="text-sm md:text-base text-gray-700">
                        "Se solo avessi avuto il coraggio di candidarmi quel giorno... 
                        oggi avrei €30.000+ in più sul conto personale e starei costruendo 
                        la mia rendita passiva invece di essere ancora bloccato nel mio lavoro dipendente."
                      </p>
                      <div className="bg-blue-50 border-2 border-blue-300 p-3 rounded-lg">
                        <p className="text-blue-800 font-medium text-sm md:text-base">
                          💡 <strong>PENSACI:</strong> Tra 5 anni vuoi essere ancora nella stessa situazione? 
                          O vuoi essere finalmente LIBERO e RICCO?
                        </p>
                      </div>
                      <Button
                        onClick={() => {
                          setShowExitIntentModal(false);
                          setShowFormDialog(true);
                        }}
                        className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-black font-bold text-xs sm:text-sm md:text-base py-3 md:py-4 rounded-lg shadow-lg break-words hyphens-auto
                             cursor-pointer transform hover:scale-105 active:scale-95 transition-all duration-200
                             border-2 border-white/40 hover:border-white/80 hover:shadow-xl"
                        style={{ wordBreak: 'break-word', overflowWrap: 'break-word', hyphens: 'auto' }}
                      >
                        💎 Sì, voglio la libertà tra 5 anni!
                      </Button>
                    </div>
                  </>
                );

              case 5:
                return (
                  <>
                    <DialogHeader>
                      <DialogTitle className="text-xl md:text-2xl font-bold text-gray-600 text-center">
                        👋 Ok, hai vinto tu...
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 text-center px-2">
                      <p className="text-base md:text-lg font-semibold text-gray-700">
                        🫡 Rispetto la tua decisione di rimanere nella situazione attuale.
                      </p>
                      <p className="text-sm md:text-base text-gray-700">
                        Ma sappi che quando sarai pronto per la libertà finanziaria, 
                        <strong>questa opportunità potrebbe non essere più disponibile.</strong>
                      </p>
                      <div className="bg-gray-50 border-2 border-gray-300 p-3 rounded-lg">
                        <p className="text-gray-700 font-medium text-sm md:text-base">
                          🚪 I problemi del tuo lavoro dipendente non scompariranno da soli. 
                          Ma le soluzioni sono ancora qui, per ora...
                        </p>
                      </div>
                      <div className="pt-2 space-y-3">
                        <Button
                          onClick={() => {
                            setShowExitIntentModal(false);
                            setShowFormDialog(true);
                          }}
                          className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold text-xs sm:text-sm md:text-base py-3 md:py-4 rounded-lg shadow-lg break-words hyphens-auto
                             cursor-pointer transform hover:scale-105 active:scale-95 transition-all duration-200
                             border-2 border-white/40 hover:border-white/80 hover:shadow-xl"
                          style={{ wordBreak: 'break-word', overflowWrap: 'break-word', hyphens: 'auto' }}
                        >
                          💡 Ci ho ripensato, CANDIDAMI!
                        </Button>
                        <button
                          onClick={() => {
                            setShowExitIntentModal(false);
                            window.history.back();
                          }}
                          className="text-sm text-gray-500 hover:text-gray-700 underline block w-full"
                        >
                          No, preferisco rimanere nella mia situazione attuale
                        </button>
                      </div>
                    </div>
                  </>
                );

              default:
                return null;
            }
          })()}
        </DialogContent>
      </Dialog>

      {/* Dialog Form Candidatura */}
      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent className="w-[90vw] max-w-sm mx-auto max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader className="space-y-1 mb-3">
            <DialogTitle className="text-sm font-bold text-blue-600 text-center leading-tight">
              🚀 CANDIDATURA LIBERTÀ FINANZIARIA
            </DialogTitle>
            <DialogDescription className="text-center text-gray-600 text-xs leading-relaxed">
              Compila per candidarti all'Acceleratore completo
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-gray-700 font-semibold text-xs block">Nome *</Label>
                <Input
                  id="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  placeholder="Maria"
                  required
                  className="h-9 text-sm border-2 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 w-full rounded-lg px-2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-gray-700 font-semibold text-xs block">Cognome *</Label>
                <Input
                  id="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  placeholder="Rossi"
                  required
                  className="h-9 text-sm border-2 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 w-full rounded-lg px-2"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessName" className="text-gray-700 font-semibold text-xs block">Lavoro/Professione *</Label>
              <Input
                id="businessName"
                type="text"
                value={formData.businessName}
                onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                placeholder="Es. Impiegata, Grafico..."
                required
                className="h-9 text-sm border-2 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 w-full rounded-lg px-2"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-semibold text-xs block">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="maria.rossi@email.it"
                required
                className="h-9 text-sm border-2 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 w-full rounded-lg px-2"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-gray-700 font-semibold text-xs block">Telefono *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="+39 331 123 4567"
                required
                className="h-9 text-sm border-2 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 w-full rounded-lg px-2"
              />
              <p className="text-xs text-gray-600 mt-2 leading-relaxed break-words">
                Un nostro esperto ti contatterà entro 24h per valutare la tua candidatura e 
                organizzare la chiamata strategica gratuita per personalizzare l'investimento.
              </p>
            </div>

            <div className="pt-3">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full py-3 text-xs font-black 
                           bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 
                           cursor-pointer transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300
                           border-2 border-white/40 hover:border-white/80 hover:shadow-lg rounded-lg
                           animate-pulse hover:animate-none text-black min-h-[44px]
                           flex items-center justify-center leading-tight disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs">Invio...</span>
                  </div>
                ) : (
                  <span className="px-1 text-center text-xs leading-tight">
                    🔥 CANDIDAMI PER LA CONSULENZA!
                  </span>
                )}
              </Button>
            </div>
          </form>

          <div className="bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-400 p-4 rounded-xl shadow-lg mt-4">
            <p className="text-center text-sm text-blue-800 font-bold leading-relaxed">
              🎯 <strong>Candidatura GRATUITA</strong> - Chiamata strategica gratuita per candidati idonei
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer Professionale */}
      <footer className="bg-gray-900 text-gray-300 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="md:col-span-1">
              <div className="font-bold text-3xl text-blue-400 mb-3">Acceleratore Sofia</div>
              <p className="text-sm text-gray-400 mb-4 max-w-xs">
                L'ecosistema completo che trasforma il tuo lavoro dipendente in un business remoto 
                profittevole e costruisce la tua libertà finanziaria.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white text-lg mb-4">Acceleratore di Business</h3>
              <ul className="space-y-2 text-sm">
                <li><span className="hover:text-blue-400 transition-colors cursor-pointer">Idea da 2K al Mese</span></li>
                <li><span className="hover:text-blue-400 transition-colors cursor-pointer">Generatore Clienti Remoto</span></li>
                <li><span className="hover:text-blue-400 transition-colors cursor-pointer">Pilota Automatico Business</span></li>
                <li><span className="hover:text-blue-400 transition-colors cursor-pointer">Sistema Controllo Profitti</span></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white text-lg mb-4">Acceleratore di Patrimonio</h3>
              <ul className="space-y-2 text-sm">
                <li><span className="hover:text-blue-400 transition-colors cursor-pointer">Formula Dipendente Ricco</span></li>
                <li><span className="hover:text-blue-400 transition-colors cursor-pointer">Pilota Automatico Patrimonio</span></li>
                <li><span className="hover:text-blue-400 transition-colors cursor-pointer">12 Consulenze Dedicate</span></li>
                <li><span className="hover:text-blue-400 transition-colors cursor-pointer">Software Pianificazione</span></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white text-lg mb-4">Legale</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="/privacy" className="hover:text-blue-400 transition-colors cursor-pointer">Privacy Policy</a></li>
                <li><a href="/terms" className="hover:text-blue-400 transition-colors cursor-pointer">Termini di Servizio</a></li>
                <li><a href="/cookies" className="hover:text-blue-400 transition-colors cursor-pointer">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-12 pt-8 text-center">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} Acceleratore Sofia. La Rivoluzione Per Dipendenti Che Vogliono Libertà Finanziaria.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}