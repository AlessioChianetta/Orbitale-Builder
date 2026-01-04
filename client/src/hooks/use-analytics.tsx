import { useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { trackPageView } from '../lib/analytics';
import { useQuery } from '@tanstack/react-query';

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

export const useAnalytics = () => {
  const [location] = useLocation();
  const prevLocationRef = useRef<string>(location);
  
  // Fetch public SEO settings to get GA ID
  const { data: seoSettings } = useQuery<PublicSeoSettings>({
    queryKey: ['/api/seo-settings/public'],
  });

  useEffect(() => {
    if (location !== prevLocationRef.current && seoSettings?.googleAnalyticsId) {
      trackPageView(location, seoSettings.googleAnalyticsId);
      prevLocationRef.current = location;
    }
  }, [location, seoSettings?.googleAnalyticsId]);
};