import { useQuery } from '@tanstack/react-query';
import { useRoute, useLocation } from 'wouter';
import { Loader2 } from 'lucide-react';
import NotFound from '@/pages/not-found';
import { useEffect, lazy, Suspense } from 'react';

// Lazy load heavy components to reduce initial bundle size
const PatrimonioLandingRenderer = lazy(() => 
  import('./PatrimonioLandingRenderer').then(module => ({ 
    default: module.PatrimonioLandingRenderer 
  }))
); // 108 KiB saved

const BuilderPageRenderer = lazy(() => 
  import('./BuilderPageRenderer').then(module => ({ 
    default: module.BuilderPageRenderer 
  }))
); // 192 KiB saved

const Homepage = lazy(() => import('@/pages/Homepage')); // Fallback
const PageRenderer = lazy(() => import('./PageRenderer')); // Renderer generico

// Mapping slug -> templateType
const getTemplateType = (slug: string) => {
  switch (slug) {
    case 'home':
    case 'homepage':
      return 'homepage';
    case 'chi-siamo':
      return 'chi-siamo';
    case 'servizi':
      return 'servizi';
    case 'contatti':
      return 'contatti';
    case 'faq':
      return 'faq';
    case 'progetti':
      return 'progetti';
    case 'blog':
      return 'blog';
    default:
      return null; // Per pagine non supportate dal sistema template
  }
};

export default function DynamicPage() {
  const [, params] = useRoute("/:slug*");
  const [, setLocation] = useLocation();
  // Se l'URL è "/", lo trattiamo come lo slug "home"
  const slug = params?.['slug*'] || 'home'; 

  // Usa il nuovo endpoint unificato per evitare 404 multipli
  const { data: contentData, isLoading } = useQuery({
    queryKey: ['/api/content', slug],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};

      const response = await fetch(`/api/content/${slug}`, { headers });
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch content');
      }
      return response.json();
    },
    retry: false,
  });

  // Redirect per progetti - usando useEffect per evitare errori di rendering
  useEffect(() => {
    if (contentData?.type === 'project' && contentData?.content?.slug) {
      setLocation(`/progetti/${contentData.content.slug}`);
    }
  }, [contentData, setLocation]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!contentData) {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/admin';
      return null;
    }
    return <NotFound />;
  }

  const { type, content } = contentData;

  // Loading fallback per tutti i lazy components
  const LoadingFallback = () => (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );

  // Renderizza in base al tipo di contenuto
  switch (type) {
    case 'page':
      if (content && content.status === 'published') {
        const templateType = getTemplateType(content.slug);
        
        // Se è supportata dal nostro sistema template
        if (templateType) {
          return (
            <Suspense fallback={<LoadingFallback />}>
              <PageRenderer page={content} templateType={templateType} />
            </Suspense>
          );
        }
        
        // Fallback per pagine non supportate (per retrocompatibilità)
        return (
          <Suspense fallback={<LoadingFallback />}>
            <Homepage />
          </Suspense>
        ); 
      }
      break;

    case 'landing-page':
      if (content && content.isActive) {
        return (
          <Suspense fallback={<LoadingFallback />}>
            <PatrimonioLandingRenderer landingPage={content} />
          </Suspense>
        );
      }
      break;

    case 'builder-page':
      if (content && content.isActive) {
        return (
          <Suspense fallback={<LoadingFallback />}>
            <BuilderPageRenderer page={content} />
          </Suspense>
        );
      }
      break;

    case 'project':
      // Il redirect viene gestito da useEffect per evitare errori di rendering
      // Mostra un loader mentre il redirect è in corso
      return <LoadingFallback />;
  }

  // Se arriviamo qui, il contenuto non è valido
  return <NotFound />;
}
