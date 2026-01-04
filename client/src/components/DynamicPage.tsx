import { useQuery } from '@tanstack/react-query';
import { useRoute, useLocation } from 'wouter';
import { Loader2 } from 'lucide-react';
import NotFound from '@/pages/not-found';
import { useEffect } from 'react';

// Importiamo i componenti che mostreranno le pagine
import { PatrimonioLandingRenderer } from './PatrimonioLandingRenderer'; // Per le landing page
import { BuilderPageRenderer } from './BuilderPageRenderer'; // Per le builder pages
import Homepage from '@/pages/Homepage'; // Fallback per la homepage statica
import { HomepageRenderer } from './HomepageRenderer'; // Renderer dinamico per la homepage personalizzata
import { PageRenderer } from './PageRenderer'; // Renderer generico per tutte le pagine

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

  // Se non abbiamo trovato nessun contenuto, mostra 404
  if (!contentData) {
    return <NotFound />;
  }

  const { type, content } = contentData;

  // Renderizza in base al tipo di contenuto
  switch (type) {
    case 'page':
      if (content && content.status === 'published') {
        const templateType = getTemplateType(content.slug);
        
        // Se è supportata dal nostro sistema template
        if (templateType) {
          return <PageRenderer page={content} templateType={templateType} />;
        }
        
        // Fallback per pagine non supportate (per retrocompatibilità)
        return <Homepage />; 
      }
      break;

    case 'landing-page':
      if (content && content.isActive) {
        return <PatrimonioLandingRenderer landingPage={content} />;
      }
      break;

    case 'builder-page':
      if (content && content.isActive) {
        return <BuilderPageRenderer page={content} />;
      }
      break;

    case 'project':
      // Il redirect viene gestito da useEffect per evitare errori di rendering
      // Mostra un loader mentre il redirect è in corso
      return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  // Se arriviamo qui, il contenuto non è valido
  return <NotFound />;
}
