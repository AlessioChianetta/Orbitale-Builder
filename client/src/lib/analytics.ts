// Define the gtag function globally
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

// Initialize Google Analytics
export const initGA = (measurementId?: string) => {
  if (!measurementId) {
    console.warn('Google Analytics Measurement ID not configured in admin settings');
    return;
  }

  console.log('🔍 Initializing Google Analytics with ID:', measurementId);

  // Add Google Analytics script to the head
  const script1 = document.createElement('script');
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  script1.onload = () => {
    console.log('✅ Google Analytics script loaded successfully');
  };
  script1.onerror = () => {
    console.error('❌ Failed to load Google Analytics script');
  };
  document.head.appendChild(script1);

  // Initialize gtag
  const script2 = document.createElement('script');
  script2.textContent = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${measurementId}');
    console.log('✅ Google Analytics configured with ID: ${measurementId}');
  `;
  document.head.appendChild(script2);
};

// Track page views - useful for single-page applications
export const trackPageView = (url: string, measurementId?: string) => {
  if (typeof window === 'undefined' || !window.gtag || !measurementId) return;
  
  console.log('📊 Tracking page view:', url, 'with GA ID:', measurementId);
  
  window.gtag('config', measurementId, {
    page_path: url
  });
};

// Track events
export const trackEvent = (
  action: string, 
  category?: string, 
  label?: string, 
  value?: number
) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};