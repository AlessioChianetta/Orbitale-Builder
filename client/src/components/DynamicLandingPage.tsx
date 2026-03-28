import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import NotFound from "@/pages/not-found";
import { useEffect, lazy, Suspense } from "react";

// Lazy load ALL heavy components to avoid loading unused code
const PatrimonioLandingRenderer = lazy(() => 
  import("./PatrimonioLandingRenderer").then(module => ({ 
    default: module.PatrimonioLandingRenderer 
  }))
); // 108 KiB saved

const BuilderPageRenderer = lazy(() => 
  import("./BuilderPageRenderer").then(module => ({ 
    default: module.BuilderPageRenderer 
  }))
); // 192 KiB saved

const PageRenderer = lazy(() => import("./PageRenderer"));

// Riconosce automaticamente il tipo di template dal contenuto della pagina
const getTemplateType = (page: any) => {
  if (!page || !page.content) return null;

  const content = page.content;

  // Riconosci il template in base alle sezioni presenti nel content
  if (content.hero && content.projects) {
    return 'progetti';
  }
  if (content.hero && content.values) {
    return 'chi-siamo';
  }
  if (content.hero && content.services) {
    return 'servizi';
  }
  if (content.hero && content.contact) {
    return 'contatti';
  }
  if (content.hero && content.faq) {
    return 'faq';
  }
  if (content.hero && content.blog) {
    return 'blog';
  }
  if (content.hero && (content.features || content.socialProof)) {
    return 'homepage';
  }

  // Fallback: cerca nel titolo o slug per compatibilità
  const slug = page.slug?.toLowerCase() || '';
  const title = page.title?.toLowerCase() || '';

  if (slug.includes('progetti') || title.includes('progetti')) return 'progetti';
  if (slug.includes('chi-siamo') || slug.includes('about')) return 'chi-siamo';
  if (slug.includes('servizi') || slug.includes('service')) return 'servizi';
  if (slug.includes('contatti') || slug.includes('contact')) return 'contatti';
  if (slug.includes('faq')) return 'faq';
  if (slug.includes('blog')) return 'blog';
  if (slug === 'home' || slug === 'homepage') return 'homepage';

  return null;
};

export default function DynamicLandingPage() {
  const [match, params] = useRoute<{ slug: string }>('/:slug');
  const [, setLocation] = useLocation();
  const slug = params?.slug;

  // Usa il nuovo endpoint unificato per evitare 404 multipli
  const { data: contentData, isLoading } = useQuery({
    queryKey: ['/api/content', slug],
    queryFn: async () => {
      if (!slug) return null;

      const token = localStorage.getItem('authToken');
      const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};

      const response = await fetch(`/api/content/${slug}`, { headers });
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch content');
      }
      return response.json();
    },
    enabled: !!slug,
    retry: false,
  });

  // Redirect per progetti - usando useEffect per evitare errori di rendering
  useEffect(() => {
    if (contentData?.type === 'project' && contentData?.content?.slug) {
      setLocation(`/progetti/${contentData.content.slug}`);
    }
  }, [contentData, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!contentData) {
    const token = localStorage.getItem('authToken');
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
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  // Renderizza in base al tipo di contenuto
  switch (type) {
    case 'page':
      if (content && content.status === 'published') {
        const templateType = getTemplateType(content);
        
        if (templateType) {
          return (
            <>
              <SEOHead 
                title={content.metaTitle || content.title}
                description={content.metaDescription}
                image={content.featuredImage}
                url={`/${content.slug}`}
              />
              <Suspense fallback={<LoadingFallback />}>
                <PageRenderer page={content} templateType={templateType} />
              </Suspense>
            </>
          );
        }
      }
      break;

    case 'landing-page':
      if (content && content.isActive) {
        return (
          <>
            <SEOHead 
              title={content.metaTitle || content.title}
              description={content.metaDescription}
              image={content.ogImage}
              url={`/landing/${content.slug}`}
            />
            <Suspense fallback={<LoadingFallback />}>
              <PatrimonioLandingRenderer landingPage={content} />
            </Suspense>
          </>
        );
      }
      break;

    case 'builder-page':
      if (content && content.isActive) {
        return (
          <>
            <SEOHead 
              title={content.metaTitle || content.title}
              description={content.metaDescription}
              image={content.ogImage}
              url={`/${content.slug}`}
            />
            <Suspense fallback={<LoadingFallback />}>
              <BuilderPageRenderer page={content} />
            </Suspense>
          </>
        );
      }
      break;

    case 'project':
      // Il redirect viene gestito da useEffect per evitare errori di rendering
      // Mostra un loader mentre il redirect è in corso
      return (
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
  }

  // Se arriviamo qui, il contenuto non è valido
  return <NotFound />;
}
