
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';

interface PageSEOData {
  title?: string;
  metaTitle?: string;
  metaDescription?: string;
  featuredImage?: string;
  slug: string;
}

export function usePageSEO() {
  const [location] = useLocation();
  
  // Normalizza il path rimuovendo slash iniziali/finali
  const normalizedPath = location.replace(/^\/+|\/+$/g, '') || 'home';
  
  const { data: pageData, isLoading } = useQuery<PageSEOData>({
    queryKey: [`/api/pages/${normalizedPath}`],
    enabled: true,
  });

  return {
    pageData,
    isLoading,
    // Fallback ai dati globali se la pagina non esiste
    getTitle: () => pageData?.metaTitle || pageData?.title,
    getDescription: () => pageData?.metaDescription,
    getImage: () => pageData?.featuredImage,
  };
}
