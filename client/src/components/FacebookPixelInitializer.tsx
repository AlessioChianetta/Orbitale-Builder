import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { initFacebookPixel } from "../lib/facebookPixel";

type PublicSeoSettings = {
  googleAnalyticsId: string | null;
  googleSearchConsoleCode: string | null;
  siteName: string | null;
  siteDescription: string | null;
  siteUrl: string | null;
  defaultOgImage: string | null;
  twitterHandle: string | null;
  facebookAppId: string | null;
  facebookPixelId: string | null;
  customHeadCode: string | null;
};

export function FacebookPixelInitializer() {
  const { data: seoSettings } = useQuery<PublicSeoSettings>({
    queryKey: ['/api/seo-settings/public'],
  });

  // Lazy load Facebook Pixel AFTER LCP to avoid blocking critical rendering
  useEffect(() => {
    if (!seoSettings?.facebookPixelId) {
      console.debug('ℹ️ [FB PIXEL INIT] No Facebook Pixel ID configured');
      return;
    }

    let loaded = false;

    const loadPixel = () => {
      if (loaded) return;
      loaded = true;
      console.log('✅ [FB PIXEL INIT] Loading Facebook Pixel after LCP with ID:', seoSettings.facebookPixelId);
      initFacebookPixel(seoSettings.facebookPixelId!);
    };

    // Wait for LCP before loading Facebook Pixel (same strategy as Analytics)
    const loadAfterLCP = () => {
      if ('PerformanceObserver' in window) {
        try {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            
            // Load pixel after LCP + 2s delay to ensure critical rendering is complete
            if (lastEntry) {
              setTimeout(loadPixel, 2000);
              observer.disconnect();
            }
          });
          
          observer.observe({ type: 'largest-contentful-paint', buffered: true });
          
          // Fallback: if LCP doesn't fire in 8s, load anyway
          setTimeout(() => {
            observer.disconnect();
            loadPixel();
          }, 8000);
        } catch (e) {
          // Fallback if PerformanceObserver fails
          setTimeout(loadPixel, 5000);
        }
      } else {
        // Fallback for browsers without PerformanceObserver
        setTimeout(loadPixel, 5000);
      }
    };

    // Load on first user interaction (prioritized over LCP wait)
    const interactionEvents = ['scroll', 'click', 'touchstart'];
    const handleInteraction = () => {
      loadPixel();
      interactionEvents.forEach(event => 
        window.removeEventListener(event, handleInteraction)
      );
    };

    interactionEvents.forEach(event => 
      window.addEventListener(event, handleInteraction, { once: true, passive: true })
    );

    // If no interaction, wait for LCP
    loadAfterLCP();

    return () => {
      interactionEvents.forEach(event => 
        window.removeEventListener(event, handleInteraction)
      );
    };
  }, [seoSettings?.facebookPixelId]);

  return null;
}
