import React from 'react';
import { Helmet } from 'react-helmet';
import { useQuery } from '@tanstack/react-query';

type PublicSeoSettings = {
  googleAnalyticsId: string | null;
  googleTagManagerId: string | null;
  googleSearchConsoleCode: string | null;
  siteName: string | null;
  siteDescription: string | null;
  siteUrl: string | null;
  canonicalDomain?: string | null;
  defaultMetaTitle: string | null;
  defaultMetaDescription: string | null;
  defaultOgImage: string | null;
  faviconUrl: string | null;
  favicon16Url: string | null;
  favicon32Url: string | null;
  favicon96Url: string | null;
  appleTouchIconUrl: string | null;
  androidChrome192Url: string | null;
  androidChrome512Url: string | null;
  twitterHandle: string | null;
  facebookAppId: string | null;
  facebookPixelId: string | null;
  customHeadCode: string | null;
  // Personal Branding
  enablePersonalBranding: boolean;
  personName: string | null;
  personImage: string | null;
  personBio: string | null;
  personJobTitle: string | null;
  personEmail: string | null;
  personPhone: string | null;
  personWebsite: string | null;
  personLinkedIn: string | null;
  personTwitter: string | null;
  personFacebook: string | null;
  personInstagram: string | null;
};

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  noindex?: boolean;
  keywords?: string[];
  author?: string;
  publishedAt?: string;
  updatedAt?: string;
  usePageData?: boolean; // Nuovo prop per controllo dati dinamici
}

export function SEOHead({
  title,
  description,
  image,
  url = '/',
  type = 'website',
  noindex = false,
  keywords = [],
  author,
  publishedAt,
  updatedAt,
  usePageData = true // Nuovo prop per abilitare/disabilitare l'uso dei dati delle pagine
}: SEOHeadProps) {
  // Fetch global SEO settings
  const { data: seoSettings } = useQuery<PublicSeoSettings>({
    queryKey: ['/api/seo-settings/public'],
  });

  // Fetch page-specific data se abilitato
  // Normalizza / e /home entrambi come 'home' per il fetch
  let normalizedPath = url.replace(/^\/+|\/+$/g, '');
  if (normalizedPath === '' || normalizedPath === 'home') {
    normalizedPath = 'home';
  }

  const { data: pageData } = useQuery<{title: string, metaTitle?: string, metaDescription?: string, featuredImage?: string}>({
    queryKey: [`/api/pages/${normalizedPath}`],
    enabled: usePageData && !title && !description, // Solo se non sono già forniti
  });

  // Use page data, then props, then global defaults
  const baseTitle = title ||
                    pageData?.metaTitle ||
                    pageData?.title ||
                    seoSettings?.defaultMetaTitle ||
                    seoSettings?.siteName ||
                    'Default Title';

  // Add personal branding to title if enabled
  const finalTitle = React.useMemo(() => {
    if (seoSettings?.enablePersonalBranding && seoSettings?.personName) {
      // Check if personName is already in the title (case insensitive)
      if (!baseTitle.toLowerCase().includes(seoSettings.personName.toLowerCase())) {
        return `${baseTitle} - ${seoSettings.personName}`;
      }
    }
    return baseTitle;
  }, [baseTitle, seoSettings?.enablePersonalBranding, seoSettings?.personName]);

  const finalDescription = (description && description.trim()) ||
                          pageData?.metaDescription ||
                          seoSettings?.defaultMetaDescription ||
                          seoSettings?.siteDescription ||
                          'Default description';
  const finalImage = image ||
                     pageData?.featuredImage ||
                     seoSettings?.defaultOgImage ||
                     '/default-og-image.jpg';
  const siteName = seoSettings?.siteName || 'Your Site Name';

  // Normalizza l'URL per il canonical - / deve puntare alla root del dominio
  const cleanUrl = url === '/' ? '/' : url;
  const canonicalUrl = seoSettings?.siteUrl ?
    (cleanUrl === '/' ? seoSettings.siteUrl.replace(/\/$/, '') : `${seoSettings.siteUrl.replace(/\/$/, '')}${cleanUrl}`) :
    (seoSettings?.canonicalDomain ?
      (cleanUrl === '/' ? seoSettings.canonicalDomain.replace(/\/$/, '') : `${seoSettings.canonicalDomain.replace(/\/$/, '')}${cleanUrl}`) :
      cleanUrl);

  // Extract verification code from Search Console meta tag
  const extractVerificationCode = (code: string | null): string | null => {
    if (!code) return null;

    // Handle both full meta tag and just the content value
    const match = code.match(/content="([^"]+)"/);
    return match ? match[1] : code;
  };

  const verificationCode = extractVerificationCode(seoSettings?.googleSearchConsoleCode ?? null);

  // Check if the current route should be noindexed (e.g., admin pages)
  const isAdminRoute = url.startsWith('/admin'); // Example: adjust this logic as needed
  const shouldNoindex = noindex || isAdminRoute;

  // Log SEO meta data when component mounts
  React.useEffect(() => {
    console.log('🔍 SEO META DATA per questa pagina:');
    console.log('📄 Title Meta SEO:', finalTitle);
    console.log('📝 Meta Description SEO:', finalDescription);
    console.log('🌐 URL Canonico:', canonicalUrl);
    console.log('🖼️ Immagine OG:', finalImage);

    // Log dettagliato sui 3 scenari di priorità
    console.log('');
    console.log('🎯 ANALISI PRIORITÀ SEO:');

    // Title Source Analysis
    if (title) {
      console.log('📄 TITLE: ✅ Specifico della pagina (PRIORITÀ MASSIMA) →', `"${title}"`);
    } else if (pageData?.metaTitle) {
      console.log('📄 TITLE: 🎯 Gestione Pagine CMS (PRIORITÀ ALTA) →', `"${pageData.metaTitle}"`);
    } else if (pageData?.title) {
      console.log('📄 TITLE: 📄 Titolo Pagina CMS (PRIORITÀ ALTA) →', `"${pageData.title}"`);
    } else if (seoSettings?.defaultMetaTitle) {
      console.log('📄 TITLE: 🎯 Meta Tags di Default (PRIORITÀ MEDIA) →', `"${seoSettings.defaultMetaTitle}"`);
    } else if (seoSettings?.siteName) {
      console.log('📄 TITLE: 🌐 Informazioni Sito fallback (PRIORITÀ BASSA) →', `"${seoSettings.siteName}"`);
    } else {
      console.log('📄 TITLE: ⚠️ Default hardcodato (PRIORITÀ MINIMA) →', '"Default Title"');
    }

    // Description Source Analysis
    if (description && description.trim()) {
      console.log('📝 DESCRIPTION: ✅ Specifica della pagina (PRIORITÀ MASSIMA) →', `"${description}"`);
    } else if (pageData?.metaDescription) {
      console.log('📝 DESCRIPTION: 🎯 Gestione Pagine CMS (PRIORITÀ ALTA) →', `"${pageData.metaDescription}"`);
    } else if (seoSettings?.defaultMetaDescription) {
      console.log('📝 DESCRIPTION: 🎯 Meta Tags di Default (PRIORITÀ MEDIA) →', `"${seoSettings.defaultMetaDescription}"`);
    } else if (seoSettings?.siteDescription) {
      console.log('📝 DESCRIPTION: 🌐 Informazioni Sito fallback (PRIORITÀ BASSA) →', `"${seoSettings.siteDescription}"`);
    } else {
      console.log('📝 DESCRIPTION: ⚠️ Default hardcodato (PRIORITÀ MINIMA) →', '"Default description"');
    }

    // Image Source Analysis
    if (image) {
      console.log('🖼️ IMMAGINE OG: ✅ Specifica della pagina (PRIORITÀ MASSIMA) →', `"${image}"`);
    } else if (seoSettings?.defaultOgImage) {
      console.log('🖼️ IMMAGINE OG: 🌐 Impostazioni globali SEO (PRIORITÀ MEDIA) →', `"${seoSettings.defaultOgImage}"`);
    } else {
      console.log('🖼️ IMMAGINE OG: ⚠️ Default hardcodato (PRIORITÀ MINIMA) →', '"/default-og-image.jpg"');
    }

    // URL Source Analysis
    if (seoSettings?.siteUrl) {
      console.log('🌐 URL CANONICO: 🌐 Costruito con dominio globale →', `"${canonicalUrl}"`);
    } else {
      console.log('🌐 URL CANONICO: ⚠️ URL relativo (manca dominio globale) →', `"${url}"`);
    }

    console.log('');
    console.log('📊 RIEPILOGO SCENARIO:');
    const hasSpecificMeta = (title && title.trim()) || (description && description.trim()) || image;
    const hasGlobalSettings = seoSettings?.siteName || seoSettings?.siteDescription || seoSettings?.defaultOgImage;

    if (hasSpecificMeta) {
      console.log('🎯 SCENARIO: Meta tag specifici configurati → OTTIMIZZAZIONE PERSONALIZZATA ✅');
    } else if (hasGlobalSettings) {
      console.log('🎯 SCENARIO: Solo impostazioni globali → FALLBACK GLOBALE 🌐');
    } else {
      console.log('🎯 SCENARIO: Nessuna configurazione → DEFAULT HARDCODATI ⚠️');
    }

    // Verifica che i valori siano effettivamente applicati al DOM
    setTimeout(() => {
      const actualTitle = document.title;
      const actualDescription = document.querySelector('meta[name="description"]')?.getAttribute('content');
      const actualCanonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href');
      const actualOgImage = document.querySelector('meta[property="og:image"]')?.getAttribute('content');

      console.log('✅ VERIFICA DOM - Valori effettivamente applicati:');
      console.log('📄 Title nel DOM:', actualTitle);
      console.log('📝 Description nel DOM:', actualDescription);
      console.log('🌐 Canonical nel DOM:', actualCanonical);
      console.log('🖼️ OG Image nel DOM:', actualOgImage);

      // Controllo coerenza
      if (actualTitle === finalTitle) {
        console.log('✅ Title SEO applicato correttamente!');
      } else {
        console.warn('⚠️ Title SEO non corrisponde:', { expected: finalTitle, actual: actualTitle });
      }

      if (actualDescription === finalDescription) {
        console.log('✅ Description SEO applicata correttamente!');
      } else {
        console.warn('⚠️ Description SEO non corrisponde:', { expected: finalDescription, actual: actualDescription });
      }
    }, 100);
  }, [finalTitle, finalDescription, canonicalUrl, finalImage]);

  return (
    <Helmet>
      {/* Performance Optimizations - Preconnect to third-party domains */}
      <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://connect.facebook.net" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="https://www.google-analytics.com" />
      
      {/* Font Preloading with fetchpriority */}
      <link 
        rel="preload" 
        href="/fonts/inter-latin-600-normal.woff2" 
        as="font" 
        type="font/woff2" 
        crossOrigin="anonymous"
        fetchPriority="high"
      />
      
      {/* Basic Meta Tags */}
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Search Console Verification */}
      {verificationCode && (
        <meta name="google-site-verification" content={verificationCode} />
      )}

      {/* Robots */}
      <meta name="robots" content={shouldNoindex ? 'noindex,nofollow' : 'index,follow'} />
      <meta name="googlebot" content={shouldNoindex ? 'noindex,nofollow' : 'index,follow'} />

      {/* Keywords */}
      {keywords.length > 0 && (
        <meta name="keywords" content={keywords.join(', ')} />
      )}

      {/* Author */}
      {author && <meta name="author" content={author} />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={finalImage} />
      <meta property="og:site_name" content={siteName} />

      {/* Article specific Open Graph */}
      {type === 'article' && publishedAt && (
        <meta property="article:published_time" content={publishedAt} />
      )}
      {type === 'article' && updatedAt && (
        <meta property="article:modified_time" content={updatedAt} />
      )}
      {type === 'article' && author && (
        <meta property="article:author" content={author} />
      )}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={finalImage} />

      {/* Twitter handle if available */}
      {seoSettings?.twitterHandle && (
        <meta name="twitter:site" content={seoSettings.twitterHandle} />
      )}

      {/* Facebook App ID if available */}
      {seoSettings?.facebookAppId && (
        <meta property="fb:app_id" content={seoSettings.facebookAppId} />
      )}

      {/* Favicon per tutti i dispositivi */}
      {seoSettings?.faviconUrl && seoSettings.faviconUrl.trim() !== '' && (
        <link rel="icon" type="image/x-icon" href={seoSettings.faviconUrl} />
      )}
      {seoSettings?.favicon16Url && seoSettings.favicon16Url.trim() !== '' && (
        <link rel="icon" type="image/png" sizes="16x16" href={seoSettings.favicon16Url} />
      )}
      {seoSettings?.favicon32Url && seoSettings.favicon32Url.trim() !== '' && (
        <link rel="icon" type="image/png" sizes="32x32" href={seoSettings.favicon32Url} />
      )}
      {seoSettings?.favicon96Url && seoSettings.favicon96Url.trim() !== '' && (
        <link rel="icon" type="image/png" sizes="96x96" href={seoSettings.favicon96Url} />
      )}
      {seoSettings?.appleTouchIconUrl && seoSettings.appleTouchIconUrl.trim() !== '' && (
        <link rel="apple-touch-icon" sizes="180x180" href={seoSettings.appleTouchIconUrl} />
      )}
      {seoSettings?.androidChrome192Url && seoSettings.androidChrome192Url.trim() !== '' && (
        <link rel="icon" type="image/png" sizes="192x192" href={seoSettings.androidChrome192Url} />
      )}
      {seoSettings?.androidChrome512Url && seoSettings.androidChrome512Url.trim() !== '' && (
        <link rel="icon" type="image/png" sizes="512x512" href={seoSettings.androidChrome512Url} />
      )}

      {/* Google Analytics */}
      {seoSettings?.googleAnalyticsId && [
        <script key="ga-script" async src={`https://www.googletagmanager.com/gtag/js?id=${seoSettings.googleAnalyticsId}`} />,
        <script key="ga-config">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${seoSettings.googleAnalyticsId}');
          `}
        </script>
      ]}

      {/* Google Tag Manager */}
      {seoSettings?.googleTagManagerId && (
        <script key="gtm-script">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${seoSettings.googleTagManagerId}');
          `}
        </script>
      )}

      {/* Custom Head Code - Handled by AnalyticsInitializer and FacebookPixelInitializer components */}

      {/* Schema.org Person for Personal Branding */}
      {seoSettings?.enablePersonalBranding && seoSettings?.personName && (
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            "name": seoSettings.personName,
            ...(seoSettings.personJobTitle && { "jobTitle": seoSettings.personJobTitle }),
            ...(seoSettings.personBio && { "description": seoSettings.personBio }),
            ...(seoSettings.personImage && { "image": seoSettings.personImage }),
            ...(seoSettings.personEmail && { "email": seoSettings.personEmail }),
            ...(seoSettings.personPhone && { "telephone": seoSettings.personPhone }),
            ...(seoSettings.personWebsite && { "url": seoSettings.personWebsite }),
            ...(([
              seoSettings.personLinkedIn,
              seoSettings.personTwitter,
              seoSettings.personFacebook,
              seoSettings.personInstagram
            ].filter(Boolean).length > 0) && {
              "sameAs": [
                seoSettings.personLinkedIn,
                seoSettings.personTwitter,
                seoSettings.personFacebook,
                seoSettings.personInstagram
              ].filter(Boolean)
            }),
            // Link Person to Organization for brand authority
            ...(seoSettings.siteName && {
              "worksFor": {
                "@type": "Organization",
                "name": seoSettings.siteName,
                ...(seoSettings.siteUrl && { "url": seoSettings.siteUrl }),
                ...(seoSettings.defaultOgImage && { "logo": seoSettings.defaultOgImage }),
                ...(seoSettings.siteDescription && { "description": seoSettings.siteDescription })
              }
            })
          })}
        </script>
      )}
    </Helmet>
  );
}

// Hook for performance monitoring
export function useSEOPerformance(pageSlug: string) {
  const { data: seoSettings } = useQuery<PublicSeoSettings>({
    queryKey: ['/api/seo-settings/public'],
  });

  const trackSEOMetrics = React.useCallback(() => {
    if (typeof window === 'undefined') return;

    // Track basic SEO metrics
    const metrics = {
      pageSlug,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      // Performance metrics
      loadTime: performance.now(),
      // Meta tag presence
      hasTitle: !!document.querySelector('title')?.textContent,
      hasDescription: !!document.querySelector('meta[name="description"]')?.getAttribute('content'),
      hasOgImage: !!document.querySelector('meta[property="og:image"]')?.getAttribute('content'),
      hasCanonical: !!document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
      hasGoogleVerification: !!document.querySelector('meta[name="google-site-verification"]'),
      // Content metrics
      headingCount: document.querySelectorAll('h1, h2, h3, h4, h5, h6').length,
      h1Count: document.querySelectorAll('h1').length,
      imageCount: document.querySelectorAll('img').length,
      imagesWithAlt: document.querySelectorAll('img[alt]').length,
    };

    // Send to analytics if available - use flat parameters for GA4
    if (seoSettings?.googleAnalyticsId && window.gtag) {
      window.gtag('event', 'seo_performance', {
        event_category: 'SEO',
        event_label: pageSlug,
        page_slug: pageSlug,
        has_title: metrics.hasTitle,
        has_description: metrics.hasDescription,
        has_og_image: metrics.hasOgImage,
        has_canonical: metrics.hasCanonical,
        has_google_verification: metrics.hasGoogleVerification,
        heading_count: metrics.headingCount,
        h1_count: metrics.h1Count,
        image_count: metrics.imageCount,
        images_with_alt: metrics.imagesWithAlt,
        load_time_ms: Math.round(metrics.loadTime)
      });
    }

    return metrics;
  }, [pageSlug, seoSettings?.googleAnalyticsId]);

  React.useEffect(() => {
    // Track metrics after page load
    const timer = setTimeout(trackSEOMetrics, 1000);
    return () => clearTimeout(timer);
  }, [trackSEOMetrics]);

  return { trackSEOMetrics };
}