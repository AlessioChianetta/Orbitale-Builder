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

  // Initialize Google Analytics when settings are available
  useEffect(() => {
    if (seoSettings?.googleAnalyticsId) {
      initGA(seoSettings.googleAnalyticsId);
    }
  }, [seoSettings?.googleAnalyticsId]);

  return null; // This component doesn't render anything
}