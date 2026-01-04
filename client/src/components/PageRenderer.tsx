import React, { useEffect } from 'react';
import { SEOHead } from '@/components/SEOHead';
import { Button } from "@/components/ui/button";
import { trackFBEvent, trackFBCustomEvent } from '@/lib/facebookPixel';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ArrowRight, CheckCircle, PlayCircle, Star, XCircle, AlertTriangle, Zap, Target,
  Users, Lightbulb, Shield, Award, Phone, Mail, MapPin, Headphones, Clock, Euro,
  Search, ChevronDown, ChevronUp, HelpCircle, MessageCircle, Heart, TrendingUp,
  Quote, Globe, Smartphone, BarChart3, Rocket, Palette, Megaphone
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { HomepageRenderer } from "./HomepageRenderer";
import { ChiSiamoRenderer } from "./ChiSiamoRenderer";
import { ServiziRenderer } from "./ServiziRenderer";
import ProgettiRenderer from "./ProgettiRenderer";
import { BlogRenderer } from "./BlogRenderer";
import { ContattiRenderer } from "./ContattiRenderer";
import { FAQRenderer } from "./FAQRenderer";
import { useQuery } from '@tanstack/react-query';

// Mapping icone per rendering dinamico
const iconMap: { [key: string]: React.ElementType } = {
  ArrowRight, CheckCircle, PlayCircle, Star, XCircle, AlertTriangle, Zap, Target,
  Users, Lightbulb, Shield, Award, Phone, Mail, MapPin, Headphones, Clock, Euro,
  Search, ChevronDown, ChevronUp, HelpCircle, MessageCircle, Heart, TrendingUp,
  Quote, Globe, Smartphone, BarChart3, Rocket, Palette, Megaphone
};

interface PageRendererProps {
  page: any;
  templateType?: string;
}

export function PageRenderer({ page, templateType }: PageRendererProps) {
  if (!page) return null;

  const location = useLocation();
  const { id, title, slug, content, metaTitle, metaDescription, facebookPixelEvents } = page;

  // Fetch route analytics configuration (public endpoint - no auth required)
  const { data: routeAnalytics, isLoading: routeAnalyticsLoading, error: routeAnalyticsError } = useQuery<Array<{
    route: string;
    name: string;
    isActive: boolean;
    facebookPixelEvents: Array<{
      eventName: string;
      eventData?: any;
      isActive: boolean;
    }>;
  }>>({
    queryKey: ['/api/analytics/routes/public'],
    queryFn: async () => {
      console.log('🔍 [ROUTE ANALYTICS FETCH] Starting fetch...');
      console.log('🔍 [ROUTE ANALYTICS FETCH] Current window location:', window.location.href);
      console.log('🔍 [ROUTE ANALYTICS FETCH] Current domain:', window.location.hostname);

      // Get token from localStorage to include in request
      const token = localStorage.getItem('token');
      console.log('🔍 [ROUTE ANALYTICS FETCH] Token in localStorage:', token ? `Present (${token.substring(0, 20)}...)` : 'Not found');

      const headers: HeadersInit = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('🔐 [ROUTE ANALYTICS FETCH] Including auth token in request');
      } else {
        console.log('⚠️ [ROUTE ANALYTICS FETCH] No auth token found in localStorage');
        console.log('🔍 [ROUTE ANALYTICS FETCH] All localStorage keys:', Object.keys(localStorage));
      }

      const response = await fetch('/api/analytics/routes/public', {
        headers,
        credentials: 'include',
      });

      console.log('🔍 [ROUTE ANALYTICS FETCH] Response status:', response.status);
      console.log('🔍 [ROUTE ANALYTICS FETCH] Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const text = await response.text();
        console.error('❌ [ROUTE ANALYTICS FETCH] Error response:', text);
        throw new Error(`HTTP ${response.status}: ${text}`);
      }

      const contentType = response.headers.get('content-type');
      console.log('🔍 [ROUTE ANALYTICS FETCH] Content-Type:', contentType);

      if (!contentType?.includes('application/json')) {
        const text = await response.text();
        console.error('❌ [ROUTE ANALYTICS FETCH] Non-JSON response:', text.substring(0, 200));
        throw new Error(`Expected JSON response but got: ${contentType}`);
      }

      const data = await response.json();
      console.log('✅ [ROUTE ANALYTICS FETCH] Data received:', data);
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Log API call status
  useEffect(() => {
    console.log('🔍 [ROUTE ANALYTICS API] Status:', {
      isLoading: routeAnalyticsLoading,
      hasError: !!routeAnalyticsError,
      hasData: !!routeAnalytics,
      dataLength: routeAnalytics?.length,
      error: routeAnalyticsError
    });

    if (routeAnalyticsError) {
      console.error('❌ [ROUTE ANALYTICS ERROR] Full error details:', {
        message: routeAnalyticsError instanceof Error ? routeAnalyticsError.message : String(routeAnalyticsError),
        stack: routeAnalyticsError instanceof Error ? routeAnalyticsError.stack : undefined,
        name: routeAnalyticsError instanceof Error ? routeAnalyticsError.name : undefined
      });
    }

    if (routeAnalytics) {
      console.log('✅ [ROUTE ANALYTICS] Data received successfully:', routeAnalytics);
    }
  }, [routeAnalytics, routeAnalyticsLoading, routeAnalyticsError]);

  // Track Facebook Pixel events when page loads
  useEffect(() => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 [FB PIXEL DEBUG] Starting Facebook Pixel tracking');
    console.log('📍 Current location:', location[0]);
    console.log('📄 Current page slug:', slug);
    console.log('📄 Current page title:', page?.title);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Eventi specifici della pagina (se configurati)
    console.log('\n📦 [STEP 1] Checking page-specific events from page data...');
    if (facebookPixelEvents && Array.isArray(facebookPixelEvents)) {
      console.log(`✅ Page has ${facebookPixelEvents.length} page-specific events configured`);
      console.log('📋 Page-specific events:', JSON.stringify(facebookPixelEvents, null, 2));

      facebookPixelEvents.forEach((event: { eventName: string; eventData?: any }, idx) => {
        console.log(`\n🎯 [PAGE EVENT ${idx + 1}/${facebookPixelEvents.length}]`);
        console.log('  - Event Name:', event.eventName);
        console.log('  - Event Data:', event.eventData || 'none');

        if (event.eventName) {
          console.log(`  ✅ FIRING page-specific event: ${event.eventName}`);
          if (event.eventData) {
            trackFBCustomEvent(event.eventName, event.eventData);
          } else {
            trackFBEvent(event.eventName);
          }
        } else {
          console.log('  ❌ SKIPPING: No event name provided');
        }
      });
    } else {
      console.log(`❌ No page-specific events configured for slug: ${slug}`);
      console.log('   facebookPixelEvents value:', facebookPixelEvents);
    }

    // Eventi configurati per il route corrente
    console.log('\n📦 [STEP 2] Checking route analytics configuration...');
    const normalizedLocation = location[0] === '/' ? '/home' : location[0];
    console.log('🔍 Normalized route location:', normalizedLocation);
    console.log('🔍 Route analytics data available:', !!routeAnalytics);

    if (routeAnalytics) {
      console.log(`✅ Route analytics loaded with ${routeAnalytics.length} routes`);
      console.log('📋 Available routes:', routeAnalytics.map(r => ({
        route: r.route,
        name: r.name,
        eventsCount: r.facebookPixelEvents?.length || 0,
        isActive: r.isActive,
        events: r.facebookPixelEvents?.map(e => ({ name: e.eventName, active: e.isActive }))
      })));

      const currentRoute = routeAnalytics.find(r => {
        const normalizedRoute = r.route === '/' ? '/home' : r.route;
        return normalizedRoute === normalizedLocation;
      });

      console.log('\n🔍 Looking for route match...');
      console.log('  Searching for:', normalizedLocation);
      console.log('  Match found:', !!currentRoute);

      if (currentRoute) {
        console.log('✅ Route match details:', {
          route: currentRoute.route,
          name: currentRoute.name,
          isActive: currentRoute.isActive,
          eventsCount: currentRoute.facebookPixelEvents?.length || 0,
          events: currentRoute.facebookPixelEvents
        });

        if (currentRoute.facebookPixelEvents && currentRoute.isActive) {
          console.log(`\n🎯 Processing ${currentRoute.facebookPixelEvents.length} route events...`);

          currentRoute.facebookPixelEvents.forEach((event, index) => {
            console.log(`\n🎯 [ROUTE EVENT ${index + 1}/${currentRoute.facebookPixelEvents.length}]`);
            console.log('  - Event Name:', event.eventName);
            console.log('  - Is Active:', event.isActive);
            console.log('  - Has Data:', !!event.eventData);
            console.log('  - Event Data:', event.eventData || 'none');

            if (event.eventName && event.isActive) {
              console.log(`  ✅ FIRING route event: ${event.eventName} for route: ${currentRoute.route}`);
              const eventPayload = {
                ...event.eventData,
                page_location: location[0],
                page_title: page?.title || currentRoute.name
              };
              console.log('  📤 Event payload:', eventPayload);
              trackFBEvent(event.eventName, eventPayload);
            } else {
              console.log('  ❌ SKIPPING event:', {
                reason: !event.eventName ? 'No event name' : 'Event not active',
                eventName: event.eventName,
                isActive: event.isActive
              });
            }
          });
        } else {
          console.log('❌ Cannot fire events:', {
            hasEvents: !!currentRoute.facebookPixelEvents,
            eventsCount: currentRoute.facebookPixelEvents?.length || 0,
            routeIsActive: currentRoute.isActive
          });
        }
      } else {
        console.log('❌ No route configuration found for:', normalizedLocation);
      }
    } else {
      console.log('❌ Route analytics not loaded yet');
      console.log('   routeAnalytics value:', routeAnalytics);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🏁 [FB PIXEL DEBUG] Tracking complete');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Track page view per analytics
    fetch('/api/analytics/track/pageview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        route: location[0],
        userAgent: navigator.userAgent,
        referrer: document.referrer,
        timestamp: new Date().toISOString()
      })
    }).catch(err => console.warn('Failed to track page view:', err));

  }, [facebookPixelEvents, routeAnalytics, slug, location]);

  // Funzione helper per ottenere valori dalle sezioni
  const getSectionValue = (sectionId: string, elementKey: string, fallback = "") => {
    return content?.[sectionId]?.elements?.[elementKey]?.value || fallback;
  };

  // Funzione helper per ottenere array dalle sezioni
  const getSectionArray = (sectionId: string, elementKey: string, fallback: any[] = []) => {
    return content?.[sectionId]?.elements?.[elementKey]?.value || fallback;
  };

  // Funzione helper per ottenere oggetti dalle sezioni
  const getSectionObject = (sectionId: string, elementKey: string, fallback: any = {}) => {
    return content?.[sectionId]?.elements?.[elementKey]?.value || fallback;
  };

  // Funzione per ottenere l'icona
  const getIcon = (iconName: string) => {
    return iconMap[iconName] || Target;
  };

  // Se è una homepage, usa l'HomepageRenderer esistente
  if (slug === 'home' || templateType === 'homepage') {
    return <HomepageRenderer homepage={{ content: content || {} }} />;
  }

  // Se è la pagina chi siamo, usa il ChiSiamoRenderer dedicato
  if (slug === 'chi-siamo' || templateType === 'chi-siamo') {
    return <ChiSiamoRenderer chisiamo={{ content: content || {} }} />;
  }

  // Se è la pagina servizi, usa il ServiziRenderer dedicato
  if (slug === 'servizi' || templateType === 'servizi') {
    return <ServiziRenderer servizi={{ content: content || {} }} />;
  }

  // Se è la pagina progetti, usa il ProgettiRenderer dedicato
  if (slug === 'progetti' || templateType === 'progetti' || slug === 'i-miei-progetti') {
    return <ProgettiRenderer sections={content || {}} />;
  }

  // Se è la pagina blog, usa il BlogRenderer dedicato
  if (slug === 'blog' || templateType === 'blog') {
    return <BlogRenderer blog={{ content: content || {} }} />;
  }

  // Se è la pagina contatti, usa il ContattiRenderer dedicato
  if (slug === 'contatti' || templateType === 'contatti') {
    return (
      <>
        <SEOHead title={metaTitle || title} description={metaDescription} url={`/${slug}`} type="website" />
        <ContattiRenderer contatti={{ id, title, slug, content: content || {}, metaTitle, metaDescription }} />
      </>
    );
  }

  // Se è la pagina faq, usa il FAQRenderer dedicato
  if (slug === 'faq' || templateType === 'faq') {
    return <FAQRenderer faq={{ id, title, slug, content: content || {}, metaTitle, metaDescription }} />;
  }

  const renderChiSiamoPage = () => (
    <div className="bg-white text-slate-800">
      {/* Hero Section */}
      <section className="py-12 md:py-16 text-center bg-slate-50 border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Badge className="mb-4">{getSectionValue('hero', 'badge', 'LA NOSTRA STORIA')}</Badge>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-slate-900">
            {getSectionValue('hero', 'title', 'Chi Siamo')}
          </h1>
          <p className="text-lg md:text-xl mt-6 text-slate-600">
            {getSectionValue('hero', 'subtitle', 'Un team di professionisti uniti dalla passione per l\'innovazione')}
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
            {getSectionValue('story', 'title', 'La Nostra Storia')}
          </h2>
          <div className="space-y-6 text-lg text-slate-600">
            <p>{getSectionValue('story', 'content', 'La nostra storia...')}</p>
            <p>{getSectionValue('story', 'secondParagraph', 'La nostra missione...')}</p>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
              {getSectionValue('team', 'title', 'Il Nostro Team')}
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              {getSectionValue('team', 'subtitle', 'Professionisti con competenze complementari')}
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {(getSectionArray('team', 'members', []) as any[]).map((member, index) => (
              <Card key={index} className="text-center">
                <CardContent className="p-6">
                  <img
                    src={member.profileImage}
                    alt={member.fullName}
                    className="w-24 h-24 rounded-full mx-auto mb-4"
                  />
                  <h3 className="font-bold text-lg">{member.fullName}</h3>
                  <p className="text-primary font-medium">{member.title}</p>
                  <p className="text-sm text-slate-600 mt-2">{member.bio}</p>
                  <div className="flex flex-wrap gap-1 mt-3 justify-center">
                    {member.specialties?.map((specialty: string, idx: number) => (
                      <Badge key={idx} variant="outline" className="text-xs">{specialty}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
              {getSectionValue('values', 'title', 'I Nostri Valori')}
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {(getSectionArray('values', 'valuesList', []) as any[]).map((value, index) => {
              const Icon = getIcon(value.icon);
              return (
                <div key={index} className="text-center">
                  <div className={`inline-flex items-center justify-center w-16 h-16 bg-${value.color}-100 rounded-full mb-4`}>
                    <Icon className={`h-8 w-8 text-${value.color}-600`} />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{value.title}</h3>
                  <p className="text-slate-600">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            {getSectionValue('cta', 'title', 'Pronti a far crescere insieme il tuo business?')}
          </h2>
          <p className="text-lg mb-8">
            {getSectionValue('cta', 'subtitle', 'Scopri come possiamo aiutarti')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-white text-slate-900 hover:bg-slate-100">
              <Link href={getSectionObject('cta', 'primaryButton', {}).link || '/contatti'}>
                {getSectionObject('cta', 'primaryButton', {}).text || 'Inizia il tuo progetto'}
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-slate-900">
              <Link href={getSectionObject('cta', 'secondaryButton', {}).link || '/servizi'}>
                {getSectionObject('cta', 'secondaryButton', {}).text || 'Scopri i nostri servizi'}
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );

  const renderServiziPage = () => (
    <div className="bg-white text-slate-800">
      {/* Hero Section */}
      <section className="py-12 md:py-16 text-center bg-slate-50 border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Badge className="mb-4">{getSectionValue('hero', 'badge', 'I Nostri Servizi')}</Badge>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-slate-900">
            Un <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
              {getSectionValue('hero', 'highlightText', 'Sistema Completo')}
            </span> per la Tua Crescita
          </h1>
          <p className="text-lg md:text-xl mt-6 text-slate-600">
            {getSectionValue('hero', 'subtitle', 'Non offriamo semplici servizi, ma costruiamo sistemi integrati')}
          </p>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
              {getSectionValue('process', 'title', 'Il Nostro Processo')}
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              {getSectionValue('process', 'subtitle', 'Un approccio metodico e testato')}
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {(getSectionArray('process', 'steps', []) as any[]).map((step, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="text-3xl font-bold text-primary mb-4">{step.number}</div>
                  <h3 className="font-bold text-lg mb-2">{step.title}</h3>
                  <p className="text-slate-600">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );

  const renderContattiPage = () => (
    <div className="bg-white text-slate-800">
      {/* Hero Section */}
      <section className="py-12 md:py-16 text-center bg-slate-50 border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Badge className="mb-4">{getSectionValue('hero', 'badge', 'Contattaci')}</Badge>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-slate-900">
            {getSectionValue('hero', 'title', 'Parliamo del tuo Progetto.')}
          </h1>
          <p className="text-lg md:text-xl mt-6 text-slate-600">
            {getSectionValue('hero', 'subtitle', 'Siamo pronti ad ascoltare le tue idee')}
          </p>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {(getSectionArray('benefits', 'benefitsList', []) as any[]).map((benefit, index) => {
              const Icon = getIcon(benefit.icon);
              return (
                <div key={index} className="flex items-start gap-4">
                  <div className="p-3 bg-blue-100 rounded-full w-fit mt-1">
                    <Icon className="h-6 w-6 text-blue-600"/>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">{benefit.title}</h3>
                    <p className="text-slate-600 text-sm">{benefit.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );

  const renderFaqPage = () => (
    <div className="bg-white text-slate-800">
      {/* Hero Section */}
      <section className="py-12 md:py-16 text-center bg-slate-50 border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Badge className="mb-4">{getSectionValue('hero', 'badge', 'FAQ')}</Badge>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-slate-900">
            {getSectionValue('hero', 'title', 'Domande Frequenti')}
          </h1>
          <p className="text-lg md:text-xl mt-6 text-slate-600">
            {getSectionValue('hero', 'subtitle', 'Trova rapidamente le risposte che cerchi')}
          </p>
        </div>
      </section>

      {/* FAQ List */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-4">
            {(getSectionArray('faqList', 'questions', []) as any[]).map((faq, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-3">{faq.question}</h3>
                  <p className="text-slate-600">{faq.answer}</p>
                  {faq.popular && (
                    <Badge variant="outline" className="mt-3">Popolare</Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );

  const renderProgettiPage = () => (
    <div className="bg-white text-slate-800">
      {/* Hero Section */}
      <section className="py-12 md:py-16 text-center bg-slate-50 border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Badge className="mb-4">{getSectionValue('hero', 'badge', 'I NOSTRI PROGETTI')}</Badge>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-slate-900">
            {getSectionValue('hero', 'title', 'I Miei Progetti')}
          </h1>
          <p className="text-lg md:text-xl mt-6 text-slate-600">
            {getSectionValue('hero', 'subtitle', 'Scopri alcuni dei progetti che ho realizzato')}
          </p>
        </div>
      </section>

      {/* Featured Projects */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
              {getSectionValue('featuredProjects', 'title', 'Progetti in Evidenza')}
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {(getSectionArray('featuredProjects', 'projects', []) as any[]).map((project, index) => (
              <Card key={index}>
                <CardContent className="p-0">
                  <img
                    src={project.image}
                    alt={project.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-6">
                    <Badge className="mb-2">{project.category}</Badge>
                    <h3 className="font-bold text-lg mb-2">{project.title}</h3>
                    <p className="text-slate-600 mb-4">{project.description}</p>
                    <div className="flex flex-wrap gap-1 mb-4">
                      {project.tags?.map((tag: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                    {project.results && (
                      <div className="text-sm text-slate-600">
                        <p>{project.results.metric1}</p>
                        <p>{project.results.metric2}</p>
                        <p>{project.results.metric3}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );

  const renderGenericPage = () => (
    <div className="min-h-screen bg-white py-20">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h1 className="text-4xl font-bold text-slate-900 mb-6">{title}</h1>
        <p className="text-xl text-slate-600">
          Questa è una pagina generica. Inizia ad aggiungere contenuti tramite l'editor per vederli apparire qui.
        </p>
      </div>
    </div>
  );

  // Fallback per tutte le altre pagine
  return (
    <>
      <SEOHead
        title={metaTitle || title}
        description={metaDescription}
        url={`/${slug}`}
        type="website"
      />
      {renderGenericPage()}
    </>
  );
}