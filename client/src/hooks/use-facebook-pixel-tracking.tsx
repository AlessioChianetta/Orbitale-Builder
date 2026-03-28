import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { trackFBEvent } from '@/lib/facebookPixel';

interface FacebookPixelEvent {
  eventName: string;
  eventData?: any;
  isActive: boolean;
}

interface RouteAnalytics {
  route: string;
  name: string;
  isActive: boolean;
  facebookPixelEvents: FacebookPixelEvent[];
}

interface UseFacebookPixelTrackingOptions {
  currentRoute: string;
  pageTitle?: string;
  pageSlug?: string;
  additionalData?: Record<string, any>;
  enabled?: boolean;
}

/**
 * Custom hook to automatically track Facebook Pixel events based on route analytics configuration.
 * This hook fetches the analytics configuration for the current route and triggers any configured Facebook Pixel events.
 * 
 * @param options Configuration options for the hook
 * @param options.currentRoute The current route path (e.g., '/orbitale', '/chi-siamo')
 * @param options.pageTitle Optional page title to include in event data
 * @param options.pageSlug Optional page slug to include in event data
 * @param options.additionalData Optional additional data to merge with event data
 * @param options.enabled Whether to enable tracking (default: true)
 * 
 * @example
 * ```tsx
 * // In OrbitaleLP.tsx
 * useFacebookPixelTracking({
 *   currentRoute: '/orbitale',
 *   pageTitle: 'Metodo Orbitale',
 *   pageSlug: 'orbitale'
 * });
 * ```
 */
export function useFacebookPixelTracking({
  currentRoute,
  pageTitle,
  pageSlug,
  additionalData = {},
  enabled = true
}: UseFacebookPixelTrackingOptions) {
  // Use ref to track the last route that fired events to prevent duplicates on re-renders
  // This approach survives React Strict Mode double-invocation
  const lastFiredRouteRef = useRef<string | null>(null);

  // Fetch route analytics configuration
  const { data: routeAnalytics, isLoading, error } = useQuery<RouteAnalytics[]>({
    queryKey: ['/api/analytics/routes/public'],
    queryFn: async () => {
      console.log('🔍 [FB PIXEL HOOK] Fetching route analytics...');
      
      const token = localStorage.getItem('authToken');
      const headers: HeadersInit = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('🔐 [FB PIXEL HOOK] Including auth token in request');
      }

      const response = await fetch('/api/analytics/routes/public', {
        headers,
        credentials: 'include',
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('❌ [FB PIXEL HOOK] Error response:', text);
        throw new Error(`HTTP ${response.status}: ${text}`);
      }

      const data = await response.json();
      console.log('✅ [FB PIXEL HOOK] Route analytics loaded:', data.length, 'routes');
      return data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: enabled,
  });

  // Track Facebook Pixel events when route changes or analytics data is loaded
  useEffect(() => {
    if (!enabled || isLoading || error || !routeAnalytics) {
      if (error) {
        console.error('❌ [FB PIXEL HOOK] Error loading route analytics:', error);
      }
      return;
    }

    // Normalize route for matching (handle both /home and /)
    const normalizedCurrentRoute = currentRoute === '/' ? '/home' : currentRoute;
    
    // Check if we already fired events for this exact route to prevent duplicates
    // This prevents re-firing on re-renders AND handles React Strict Mode double-invocation
    if (lastFiredRouteRef.current === normalizedCurrentRoute) {
      console.log('⚡ [FB PIXEL HOOK] Events already fired for route:', normalizedCurrentRoute, '- skipping duplicate');
      return;
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎯 [FB PIXEL HOOK] Starting event tracking');
    console.log('📍 Current route:', currentRoute);
    console.log('📄 Page title:', pageTitle || 'N/A');
    console.log('📄 Page slug:', pageSlug || 'N/A');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 [FB PIXEL HOOK] Normalized route:', normalizedCurrentRoute);

    // Find matching route configuration
    const matchingRoute = routeAnalytics.find(r => {
      const normalizedRoute = r.route === '/' ? '/home' : r.route;
      return normalizedRoute === normalizedCurrentRoute;
    });

    if (!matchingRoute) {
      console.log('❌ [FB PIXEL HOOK] No analytics configuration found for route:', normalizedCurrentRoute);
      console.log('📋 [FB PIXEL HOOK] Available routes:', routeAnalytics.map(r => r.route));
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      return;
    }

    console.log('✅ [FB PIXEL HOOK] Found matching route:', {
      route: matchingRoute.route,
      name: matchingRoute.name,
      isActive: matchingRoute.isActive,
      eventsCount: matchingRoute.facebookPixelEvents?.length || 0
    });

    if (!matchingRoute.isActive) {
      console.log('⚠️ [FB PIXEL HOOK] Route tracking is disabled for:', matchingRoute.route);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      return;
    }

    if (!matchingRoute.facebookPixelEvents || matchingRoute.facebookPixelEvents.length === 0) {
      console.log('⚠️ [FB PIXEL HOOK] No Facebook Pixel events configured for:', matchingRoute.route);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      return;
    }

    console.log(`\n🎯 [FB PIXEL HOOK] Processing ${matchingRoute.facebookPixelEvents.length} configured events...`);

    // Trigger each configured Facebook Pixel event
    matchingRoute.facebookPixelEvents.forEach((event, index) => {
      console.log(`\n🎯 [EVENT ${index + 1}/${matchingRoute.facebookPixelEvents.length}]`);
      console.log('  - Event Name:', event.eventName);
      console.log('  - Is Active:', event.isActive);
      console.log('  - Has Custom Data:', !!event.eventData);

      if (!event.eventName) {
        console.log('  ❌ SKIPPING: No event name provided');
        return;
      }

      if (!event.isActive) {
        console.log('  ❌ SKIPPING: Event is not active');
        return;
      }

      // Merge event data with page context
      const eventPayload = {
        ...event.eventData,
        ...additionalData,
        page_location: currentRoute,
        page_title: pageTitle || matchingRoute.name,
        page_slug: pageSlug || currentRoute.replace('/', ''),
        route_name: matchingRoute.name,
        tracked_via: 'useFacebookPixelTracking_hook'
      };

      console.log('  ✅ FIRING event:', event.eventName);
      console.log('  📤 Event payload:', eventPayload);

      try {
        trackFBEvent(event.eventName, eventPayload);
        console.log('  ✅ Event sent successfully');
      } catch (error) {
        console.error('  ❌ Error firing event:', error);
      }
    });

    // Mark this route as having fired events to prevent duplicates
    // This persists across re-renders and Strict Mode double-invocation
    lastFiredRouteRef.current = normalizedCurrentRoute;

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🏁 [FB PIXEL HOOK] Event tracking complete');
    console.log('✅ [FB PIXEL HOOK] Route marked as tracked:', normalizedCurrentRoute);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  }, [currentRoute, pageTitle, pageSlug, routeAnalytics, enabled, isLoading, error]);

  return {
    isLoading,
    error,
    routeAnalytics
  };
}
