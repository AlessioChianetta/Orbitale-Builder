declare global {
  interface Window {
    fbq: (action: string, eventName: string, data?: any) => void;
    _fbq: any;
  }
}

export const initFacebookPixel = (pixelId?: string) => {
  if (!pixelId) {
    console.warn('Facebook Pixel ID not configured in admin settings');
    return;
  }

  if (typeof window === 'undefined') return;

  // Validate Pixel ID format (alphanumeric, underscore, hyphen only)
  if (!/^[A-Za-z0-9_-]+$/.test(pixelId)) {
    console.error('Invalid Facebook Pixel ID format');
    return;
  }

  // Prevent duplicate initialization
  if (document.getElementById('fb-pixel-script')) {
    console.log('Facebook Pixel already initialized');
    return;
  }

  console.log('📊 Initializing Facebook Pixel with ID:', pixelId);

  // Load Facebook Pixel base script
  const baseScript = document.createElement('script');
  baseScript.id = 'fb-pixel-script';
  baseScript.async = true;
  baseScript.src = 'https://connect.facebook.net/en_US/fbevents.js';
  
  // Initialize fbq function BEFORE loading the script
  if (typeof window.fbq === 'undefined') {
    // Initialize fbq function stub
    (function(f: any, b: any, e: any, v: any, n: any, t: any, s: any) {
      if (f.fbq) return;
      n = f.fbq = function() {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = true;
      n.version = '2.0';
      n.queue = [];
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js', null, null, null);
  }

  baseScript.onload = () => {
    // Initialize pixel after script loads
    console.log('🔍 Facebook Pixel script loaded, initializing...');
    
    // Wait a bit for fbq to be fully available
    setTimeout(() => {
      if (typeof window.fbq === 'function') {
        window.fbq('init', pixelId);
        window.fbq('track', 'PageView');
        console.log('✅ Facebook Pixel initialized with ID:', pixelId);
      } else {
        console.error('❌ Facebook Pixel function not available after script load');
      }
    }, 100);
  };

  baseScript.onerror = () => {
    console.error('❌ Failed to load Facebook Pixel script');
  };

  document.head.appendChild(baseScript);

  // Add noscript fallback
  const noscript = document.createElement('noscript');
  const img = document.createElement('img');
  img.height = 1;
  img.width = 1;
  img.style.display = 'none';
  img.src = `https://www.facebook.com/tr?id=${encodeURIComponent(pixelId)}&ev=PageView&noscript=1`;
  noscript.appendChild(img);
  document.body.appendChild(noscript);
};

// Standard Facebook events that should use track() not trackCustom()
const STANDARD_EVENTS = [
  'AddPaymentInfo', 'AddToCart', 'AddToWishlist', 'CompleteRegistration',
  'Contact', 'CustomizeProduct', 'Donate', 'FindLocation', 'InitiateCheckout',
  'Lead', 'PageView', 'Purchase', 'Schedule', 'Search', 'StartTrial',
  'SubmitApplication', 'Subscribe', 'ViewContent'
];

export const trackFBEvent = (eventName: string, data?: any) => {
  console.log('\n🚀━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀 [FB PIXEL] trackFBEvent CALLED');
  console.log('  📝 Event Name:', eventName);
  console.log('  📦 Event Data:', data);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  if (typeof window === 'undefined') {
    console.warn('❌ [FB PIXEL] Window not available (SSR)');
    return;
  }
  
  console.log('🔍 [FB PIXEL] Checking window.fbq...');
  console.log('  - Type:', typeof window.fbq);
  console.log('  - Is Function:', typeof window.fbq === 'function');
  console.log('  - Value:', window.fbq);
  
  if (typeof window.fbq !== 'function') {
    console.warn('❌ [FB PIXEL] Facebook Pixel not initialized or not available');
    console.log('🔍 [FB PIXEL] Window.fbq type:', typeof window.fbq);
    return;
  }
  
  try {
    // Use track() for standard events, trackCustom() for custom events
    const isStandard = STANDARD_EVENTS.includes(eventName);
    console.log('🔍 [FB PIXEL] Event classification:');
    console.log('  - Event Name:', eventName);
    console.log('  - Is Standard:', isStandard);
    console.log('  - Standard Events List:', STANDARD_EVENTS);
    
    if (isStandard) {
      console.log('✅ [FB PIXEL] Sending STANDARD event via fbq("track", ...)');
      console.log('  📤 fbq("track", "' + eventName + '", ', data, ')');
      window.fbq('track', eventName, data);
      console.log('✅ [FB PIXEL] Standard event sent successfully');
    } else {
      console.log('✅ [FB PIXEL] Sending CUSTOM event via fbq("trackCustom", ...)');
      console.log('  📤 fbq("trackCustom", "' + eventName + '", ', data, ')');
      window.fbq('trackCustom', eventName, data);
      console.log('✅ [FB PIXEL] Custom event sent successfully');
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error) {
    console.error('❌ [FB PIXEL] Error tracking Facebook Pixel event:', error);
    console.error('   Error details:', error);
  }
};

export const trackFBCustomEvent = (eventName: string, data?: any) => {
  if (typeof window === 'undefined') {
    console.warn('Facebook Pixel: Window not available (SSR)');
    return;
  }
  
  if (typeof window.fbq !== 'function') {
    console.warn('Facebook Pixel not initialized or not available');
    return;
  }
  
  try {
    console.log('📊 Tracking Facebook Pixel custom event:', eventName, data);
    window.fbq('trackCustom', eventName, data);
  } catch (error) {
    console.error('❌ Error tracking Facebook Pixel custom event:', error);
  }
};
