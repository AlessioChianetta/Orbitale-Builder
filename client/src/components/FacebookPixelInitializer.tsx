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

  useEffect(() => {
    console.log('🔍 [FB PIXEL INIT] SEO Settings loaded:', seoSettings);
    console.log('🔍 [FB PIXEL INIT] Facebook Pixel ID:', seoSettings?.facebookPixelId);
    
    if (seoSettings?.facebookPixelId) {
      console.log('✅ [FB PIXEL INIT] Initializing Facebook Pixel with ID:', seoSettings.facebookPixelId);
      initFacebookPixel(seoSettings.facebookPixelId);
    } else {
      console.log('❌ [FB PIXEL INIT] No Facebook Pixel ID found in settings');
    }
  }, [seoSettings?.facebookPixelId]);

  return null;
}
