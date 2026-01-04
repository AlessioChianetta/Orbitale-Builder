// Lazy load web-vitals to avoid blocking initial render
export async function reportWebVitals() {
  // Only load and report vitals after idle time or user interaction
  const loadVitals = async () => {
    try {
      const { onCLS, onFCP, onLCP, onTTFB, onINP } = await import('web-vitals');
      
      onCLS((metric) => {
        sendToAnalytics('CLS', metric.value);
      });
      
      onFCP((metric) => {
        sendToAnalytics('FCP', metric.value);
      });
      
      onLCP((metric) => {
        sendToAnalytics('LCP', metric.value);
      });
      
      onTTFB((metric) => {
        sendToAnalytics('TTFB', metric.value);
      });
      
      onINP((metric) => {
        sendToAnalytics('INP', metric.value);
      });
    } catch (error) {
      console.warn('[Web Vitals] Failed to load web-vitals library:', error);
    }
  };

  // Use requestIdleCallback for better performance
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => loadVitals(), { timeout: 3000 });
  } else {
    setTimeout(loadVitals, 3000);
  }
}

function sendToAnalytics(metricName: string, value: number) {
  // Send to Google Analytics if available
  if (window.gtag) {
    window.gtag('event', metricName, {
      value: Math.round(metricName === 'CLS' ? value * 1000 : value),
      event_category: 'Web Vitals',
      event_label: window.location.pathname,
      non_interaction: true,
    });
  }
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vitals] ${metricName}:`, value);
  }
}

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}
