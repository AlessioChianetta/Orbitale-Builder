import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Calendar, 
  Clock, 
  User, 
  ArrowLeft, 
  Twitter, 
  Linkedin, 
  Facebook 
} from "lucide-react";
import type { BlogPostWithRelations } from "@shared/schema";
import { generateOptimizedAltText, HeadingStructureManager, optimizeContentImages } from "@/lib/seoUtils";
import { useEffect, useMemo } from "react";
import { SEOHead, useSEOPerformance } from "@/components/SEOHead";
import { Helmet } from "react-helmet";

// Funzione helper per renderizzare i blocchi di Editor.js con gestione SEO ottimizzata
const renderBlock = (block: { type: string; data: any; id: string }, manager: HeadingStructureManager, postTitle: string) => {
  switch (block.type) {
    case 'header':
      // Usa il heading manager per ottimizzare la struttura SEO
      const optimizedLevel = manager.addHeading(block.data.text, block.data.level, block.id);
      const Tag = `h${optimizedLevel}` as keyof JSX.IntrinsicElements;
      return <Tag key={`header-${block.id}`} dangerouslySetInnerHTML={{ __html: block.data.text }} />;
    case 'paragraph':
      // Ottimizza le immagini all'interno del contenuto HTML
      const optimizedHtml = optimizeContentImages(block.data.text, postTitle);
      return <p key={block.id} dangerouslySetInnerHTML={{ __html: optimizedHtml }} />;
    case 'image':
      // Gestione esplicita delle immagini Editor.js con alt text ottimizzato
      return (
        <div key={block.id} className="my-4">
          <img 
            src={block.data.file?.url || block.data.url} 
            alt={generateOptimizedAltText({
              title: block.data.caption || postTitle,
              description: block.data.caption,
              context: 'content'
            })}
            className="w-full h-auto rounded-lg"
            loading="lazy"
          />
          {block.data.caption && (
            <p className="text-sm text-muted-foreground mt-2 text-center italic">
              {block.data.caption}
            </p>
          )}
        </div>
      );
    case 'list':
      const ListTag = block.data.style === 'ordered' ? 'ol' : 'ul';
      return (
        <ListTag key={block.id}>
          {block.data.items.map((item: string, index: number) => (
            <li key={index} dangerouslySetInnerHTML={{ __html: item }} />
          ))}
        </ListTag>
      );
    case 'quote':
        return (
            <blockquote key={block.id}>
                <p dangerouslySetInnerHTML={{ __html: block.data.text }} />
                {block.data.caption && <footer>- {block.data.caption}</footer>}
            </blockquote>
        );
    // Aggiungi qui altri tipi di blocco se li userai (es. 'image', 'delimiter', etc.)
    default:
      console.warn(`Tipo di blocco non gestito: ${block.type}`);
      return null;
  }
};


export default function BlogPost() {
  const [, params] = useRoute("/blog/:slug");
  const slug = params?.slug;

  const { data: post, isLoading, error } = useQuery<BlogPostWithRelations>({ 
    queryKey: [`/api/blog/${slug}`], 
    enabled: !!slug 
  });

  // Parse content if it's a JSON string - MUST be before any conditional returns (React Hook rules)
  const parsedContent = useMemo(() => {
    if (!post?.content) return { blocks: [] };
    
    // If content is already an object with blocks, return it
    if (typeof post.content === 'object' && 'blocks' in post.content) {
      return post.content;
    }
    
    // If content is a string, parse it
    if (typeof post.content === 'string') {
      try {
        return JSON.parse(post.content);
      } catch (e) {
        console.error('Failed to parse blog post content:', e);
        return { blocks: [] };
      }
    }
    
    return { blocks: [] };
  }, [post?.content]);

  // Create a per-render heading manager to avoid lifecycle issues and global state leakage
  const headingManager = useMemo(() => {
    const manager = new HeadingStructureManager();
    if (post) {
      // Register the main H1 title before rendering any blocks
      manager.addHeading(post.title, 1, 'blog-title');
    }
    return manager;
  }, [post?.id, post?.title]);

  // SEO Performance monitoring
  useSEOPerformance(`blog-${slug}`);

  // TODO: In futuro, implementa una chiamata API per trovare articoli correlati
  const { data: allPostsData } = useQuery<{ posts: BlogPostWithRelations[] }>({ 
    queryKey: ['/api/blog'], 
    enabled: !!post // Esegui solo se il post principale è stato caricato
  });

  const relatedPosts = allPostsData?.posts
    .filter(p => p.status === 'published' && p.id !== post?.id && p.category?.name === post?.category?.name)
    .slice(0, 3);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Caricamento articolo...</div>;
  }

  if (error || !post) {
    return <div className="min-h-screen flex items-center justify-center">Articolo non trovato.</div>;
  }

  // Helper function to safely convert date values - handles all possible API return types
  const formatDate = (date: Date | string | number | null | undefined): string | undefined => {
    if (!date) return undefined;
    
    try {
      if (typeof date === 'string') return date;
      // Handle numeric timestamps and Date objects
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return undefined;
      return dateObj.toISOString();
    } catch (error) {
      console.warn('Failed to format date:', date);
      return undefined;
    }
  };

  // Safe window access for SSR with proper production URLs
  const getBaseUrl = () => {
    if (typeof window !== 'undefined') return window.location.origin;
    // Production URL from env vars or default to empty for relative URLs in development
    return process.env.NODE_ENV === 'production' 
      ? (process.env.VITE_SITE_URL || 'https://yoursite.com')
      : 'http://localhost:5000';
  };
  
  const postUrl = typeof window !== 'undefined' ? window.location.href : `${getBaseUrl()}/blog/${post?.slug}`;
  const shareText = `Leggi questo interessante articolo: ${post.title}`;

  // Build keywords array safely, filtering out falsy and too-short values
  const keywords = [
    post?.category?.name || 'blog',
    ...(post?.title?.split(' ').slice(0, 5) || [])
  ]
    .filter(Boolean)
    .map(k => k.trim())
    .filter(k => k.length >= 3); // Minimum 3 characters for SEO validity

  // Generate Breadcrumb Schema for SEO
  const baseUrl = getBaseUrl();
  const breadcrumbItems = [
    { name: "Home", url: baseUrl },
    { name: "Blog", url: `${baseUrl}/blog` }
  ];
  
  if (post?.category?.name) {
    breadcrumbItems.push({
      name: post.category.name,
      url: `${baseUrl}/blog?category=${post.category.name}`
    });
  }
  
  breadcrumbItems.push({
    name: post.title,
    url: `${baseUrl}/blog/${post.slug}`
  });

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbItems.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };

  return (
    <>
      <SEOHead 
        title={post?.metaTitle || post?.title}
        description={post?.metaDescription || post?.excerpt || `Leggi l'articolo "${post?.title}" sul nostro blog.`}
        image={post?.featuredImage || undefined}
        url={`${getBaseUrl()}/blog/${post?.slug}`}
        type="article"
        author={post?.author?.username || undefined}
        publishedAt={formatDate(post?.publishedAt)}
        updatedAt={formatDate(post?.updatedAt)}
        keywords={keywords}
      />
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      </Helmet>
      <div className="bg-background">
        {/* Intestazione con Immagine di Sfondo */}
        <header className="relative h-[50vh] min-h-[400px] text-white flex items-end">
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent z-10"></div>
        {post.featuredImage && (
            <img 
              src={post.featuredImage} 
              alt={generateOptimizedAltText({
                title: post.title,
                description: post.excerpt || undefined,
                category: post.category?.name,
                context: 'featured',
                keywords: post.tags?.map(t => t.name)
              })} 
              className="absolute inset-0 w-full h-full object-cover"
            />
        )}
        <div className="relative z-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 w-full">
            {post.category && <Badge className="mb-4">{post.category.name}</Badge>}
            <h1 className="text-4xl lg:text-6xl font-bold leading-tight drop-shadow-lg">{post.title}</h1>
            <div className="flex items-center flex-wrap gap-x-6 gap-y-2 mt-6 text-sm opacity-90">
                <div className="flex items-center gap-2"><User className="h-4 w-4" />{post.author?.username || 'Admin'}</div>
                <div className="flex items-center gap-2"><Calendar className="h-4 w-4" />{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('it-IT', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}</div>
                <div className="flex items-center gap-2"><Clock className="h-4 w-4" />{post.readingTime || 1} min di lettura</div>
            </div>
        </div>
      </header>

      {/* Contenuto e Sidebar */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-3 xl:grid-cols-4 gap-12">

            {/* Contenuto Articolo */}
            <article className="lg:col-span-2 xl:col-span-3 prose prose-lg max-w-none">
              {/* Renderizza i blocchi di Editor.js con struttura SEO ottimizzata */}
              <div>
                {(parsedContent?.blocks || []).map((block: any) => renderBlock(block, headingManager, post.title))}
              </div>
            </article>

            {/* Sidebar */}
            <aside className="lg:col-span-1 space-y-8 sticky top-24 self-start">
              <Card>
                <CardHeader><CardTitle>Condividi</CardTitle></CardHeader>
                <CardContent className="flex gap-2">
                    <Button variant="outline" size="icon" asChild><a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer"><Twitter className="h-4 w-4"/></a></Button>
                    <Button variant="outline" size="icon" asChild><a href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(postUrl)}`} target="_blank" rel="noopener noreferrer"><Linkedin className="h-4 w-4"/></a></Button>
                    <Button variant="outline" size="icon" asChild><a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`} target="_blank" rel="noopener noreferrer"><Facebook className="h-4 w-4"/></a></Button>
                </CardContent>
              </Card>

              {relatedPosts && relatedPosts.length > 0 &&
                <Card>
                  <CardHeader><CardTitle>Potrebbe interessarti</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    {relatedPosts.map(p => (
                      <div key={p.id}>
                        <Link href={`/blog/${p.slug}`} className="font-semibold hover:text-primary leading-tight">{p.title}</Link>
                        <p className="text-xs text-muted-foreground mt-1">{new Date(p.publishedAt!).toLocaleDateString('it-IT')}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              }
            </aside>
        </div>
      </section>

      {/* Box Autore */}
      <section className="py-12 bg-muted/50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <Card className="p-8">
                  <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                      <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-4xl flex-shrink-0">
                        {post.author?.username.substring(0, 2).toUpperCase() || 'A'}
                      </div>
                      <div>
                          <p className="text-sm text-muted-foreground">Scritto da</p>
                          <h3 className="text-2xl font-bold mb-2">{post.author?.username || 'Il nostro team'}</h3>
                          <p className="text-muted-foreground">Siamo un team di esperti appassionati di marketing digitale e sviluppo web, dedicati ad aiutare le aziende a crescere online.</p>
                      </div>
                  </div>
              </Card>
          </div>
      </section>

      {/* Bottone per tornare al blog */}
      <div className="py-12 text-center">
          <Button asChild variant="outline">
              <Link href="/blog"><ArrowLeft className="mr-2 h-4 w-4"/>Tutti gli articoli</Link>
          </Button>
      </div>
    </div>
    </>
  );
}