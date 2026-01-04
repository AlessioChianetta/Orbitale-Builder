import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { initGA } from "../lib/analytics";

type PublicSeoSettings = {
  googleAnalyticsId: string | null;
  googleSearchConsoleCode: string | null;
  siteName: string | null;
  siteDescription: string | null;
  siteUrl: string | null;
  defaultOgImage: string | null;
  twitterHandle: string | null;
  facebookAppId: string | null;
  customHeadCode: string | null;
};

export function AnalyticsInitializer() {
  // Fetch public SEO settings for GA initialization
  const { data: seoSettings } = useQuery<PublicSeoSettings>({
    queryKey: ['/api/seo-settings/public'],
  });

  // Lazy load Google Analytics AFTER LCP to avoid blocking critical rendering
  useEffect(() => {
    if (!seoSettings?.googleAnalyticsId) return;

    let loaded = false;

    const loadGA = () => {
      if (loaded) return;
      loaded = true;
      initGA(seoSettings.googleAnalyticsId!);
    };

    // Wait for LCP before loading analytics
    const loadAfterLCP = () => {
      if ('PerformanceObserver' in window) {
        try {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            
            // Load analytics after LCP is measured
            if (lastEntry) {
              setTimeout(loadGA, 100); // Small delay after LCP
              observer.disconnect();
            }
          });
          
          observer.observe({ type: 'largest-contentful-paint', buffered: true });
          
          // Fallback: if LCP doesn't fire in 5s, load anyway
          setTimeout(() => {
            observer.disconnect();
            loadGA();
          }, 5000);
        } catch (e) {
          // Fallback if PerformanceObserver fails
          setTimeout(loadGA, 3000);
        }
      } else {
        // Fallback for browsers without PerformanceObserver
        setTimeout(loadGA, 3000);
      }
    };

    // Load on first user interaction (prioritized over LCP wait)
    const interactionEvents = ['scroll', 'click', 'touchstart'];
    const handleInteraction = () => {
      loadGA();
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
  }, [seoSettings?.googleAnalyticsId]);

  return null; // This component doesn't render anything
}