
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { 
  Search,
  Calendar,
  Clock,
  User,
  ArrowRight,
  BookOpen,
  Mail,
  TrendingUp,
  Filter
} from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { BlogPostWithRelations } from "@shared/schema";
import { SEOHead, useSEOPerformance } from "@/components/SEOHead";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.4, 0, 0.2, 1]
    }
  }
};

// Componente Card Articolo modernizzato
const BlogCard = ({ post, variant = "default" }: { post: BlogPostWithRelations; variant?: "featured" | "large" | "default" }) => {
  const isFeatured = variant === "featured";
  const isLarge = variant === "large";
  
  return (
    <motion.div
      variants={itemVariants}
      className="group"
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <Card className={`h-full glass-card border-0 shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden ${
        isFeatured ? 'lg:col-span-2 lg:row-span-2' : ''
      }`}>
        <div className="relative overflow-hidden">
          {post.featuredImage ? (
            <div className={`overflow-hidden ${isLarge ? 'aspect-[16/10]' : 'aspect-video'}`}>
              <img 
                src={post.featuredImage} 
                alt={post.title} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
              />
            </div>
          ) : (
            <div className={`flex items-center justify-center bg-gradient-to-br from-primary/10 via-primary/5 to-transparent ${
              isLarge ? 'aspect-[16/10]' : 'aspect-video'
            }`}>
              <div className="text-center">
                <BookOpen className="w-16 h-16 mx-auto text-primary/40 mb-4" />
                <p className="text-sm text-muted-foreground font-medium">Articolo</p>
              </div>
            </div>
          )}
          
          {/* Overlay gradiente */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Badge categoria */}
          {post.category && (
            <div className="absolute top-4 left-4">
              <Badge variant="default" className="bg-primary/90 backdrop-blur-sm text-white border-0 shadow-lg">
                {post.category.name}
              </Badge>
            </div>
          )}
          
          {/* Reading time */}
          <div className="absolute top-4 right-4">
            <Badge variant="outline" className="bg-background/90 backdrop-blur-sm border-border/50">
              <Clock className="w-3 h-3 mr-1" />
              {post.readingTime || 3} min
            </Badge>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <h3 className={`font-bold leading-tight group-hover:text-primary transition-colors duration-300 line-clamp-2 ${
              isFeatured ? 'text-2xl mb-3' : 'text-xl mb-2'
            }`}>
              <Link href={`/blog/${post.slug}`} className="hover:underline">
                {post.title}
              </Link>
            </h3>
            
            <p className={`text-muted-foreground leading-relaxed ${
              isFeatured ? 'text-base line-clamp-4' : 'text-sm line-clamp-3'
            }`}>
              {post.excerpt}
            </p>
          </div>
          
          <div className="flex items-center justify-between pt-4 border-t border-border/30">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <User className="w-3 h-3" />
                <span className="font-medium">{post.author?.username || 'Admin'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3 h-3" />
                <span>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('it-IT') : ''}</span>
              </div>
            </div>
            
            <Button variant="ghost" size="sm" asChild className="h-8 px-3 text-primary hover:bg-primary/10">
              <Link href={`/blog/${post.slug}`}>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default function Blog() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  
  // SEO Performance monitoring
  useSEOPerformance('blog');
  
  const { data, isLoading } = useQuery<{ posts: BlogPostWithRelations[] }>({ 
    queryKey: ['/api/blog'] 
  });
  
  const posts = data?.posts.filter(p => p.status === 'published') || [];
  
  // Extract unique categories from posts
  const categoryMap = new Map<number, any>();
  posts.forEach(p => {
    if (p.category && 'id' in p.category && typeof p.category.id === 'number') {
      categoryMap.set(p.category.id, p.category);
    }
  });
  const categories = Array.from(categoryMap.values());
  
  // Filtra i post in base alla ricerca e categoria
  const filteredPosts = posts.filter(post => {
    const matchesSearch = searchTerm === "" || 
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.excerpt?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || 
      post.category?.slug === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const featuredPosts = filteredPosts.filter(p => p.isFeatured).slice(0, 2);
  const mainFeaturedPost = featuredPosts[0];
  const latestPosts = filteredPosts.filter(p => !p.isFeatured).slice(0, 8);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-primary/20 animate-pulse mx-auto" />
          <p className="text-muted-foreground">Caricamento articoli...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead 
        keywords={['blog marketing', 'strategie digitali', 'crescita business', 'marketing online', 'guide pratiche']}
        type="website"
        url="/blog"
        usePageData={true}
      />
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5" />
        <div className="relative max-w-7xl mx-auto container-padding text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            className="space-y-6"
          >
            <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors">
              <BookOpen className="w-3 h-3 mr-1.5" />
              Il Nostro Blog
            </Badge>
            
            <h1 className="text-responsive-xl font-bold leading-[0.9] tracking-tight max-w-4xl mx-auto">
              Insights e Strategie per il
              <span className="block bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent mt-2">
                Successo Digitale
              </span>
            </h1>
            
            <p className="text-responsive-md text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Guide pratiche, case study e le ultime tendenze del marketing digitale per far crescere il tuo business.
            </p>

            {/* Search and Filters */}
            <div className="max-w-2xl mx-auto space-y-6 pt-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                  placeholder="Cerca articoli, argomenti..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-2xl py-4 pl-12 pr-6 text-base shadow-lg border-0 bg-background/80 backdrop-blur-sm focus:bg-background transition-all"
                />
              </div>
              
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <Button
                  variant={selectedCategory === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory("all")}
                  className="rounded-full px-6 h-9 transition-all hover:scale-105"
                >
                  <Filter className="w-3 h-3 mr-1.5" />
                  Tutti
                </Button>
                {categories.slice(0, 4).map(category => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.slug ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category.slug)}
                    className="rounded-full px-6 h-9 transition-all hover:scale-105"
                  >
                    {category.name}
                  </Button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Section */}
      {mainFeaturedPost && (
        <section className="py-16 md:py-20">
          <div className="max-w-7xl mx-auto container-padding">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-12"
            >
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="w-6 h-6 text-primary" />
                <h2 className="text-2xl md:text-3xl font-bold">In Evidenza</h2>
              </div>
              
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <BlogCard post={mainFeaturedPost} variant="featured" />
                </div>
                
                <div className="space-y-6">
                  {featuredPosts.slice(1, 3).map(post => (
                    <BlogCard key={post.id} post={post} variant="large" />
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Latest Articles */}
      <section className="py-16 md:py-20 bg-muted/20">
        <div className="max-w-7xl mx-auto container-padding">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-2xl md:text-3xl font-bold">
                {searchTerm || selectedCategory !== "all" ? "Risultati" : "Ultimi Articoli"}
              </h2>
              
              {filteredPosts.length > 0 && (
                <Badge variant="outline" className="text-sm">
                  {filteredPosts.length} articol{filteredPosts.length === 1 ? 'o' : 'i'}
                </Badge>
              )}
            </div>

            {filteredPosts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center py-16"
              >
                <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="w-12 h-12 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Nessun articolo trovato</h3>
                <p className="text-muted-foreground mb-6">
                  Prova a modificare i filtri di ricerca o esplora tutte le categorie.
                </p>
                <Button onClick={() => { setSearchTerm(""); setSelectedCategory("all"); }}>
                  Mostra Tutti gli Articoli
                </Button>
              </motion.div>
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"
              >
                {latestPosts.map(post => (
                  <BlogCard key={post.id} post={post} />
                ))}
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto container-padding">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <Card className="glass-card border-0 shadow-2xl p-8 md:p-12 text-center bg-gradient-to-br from-primary via-primary to-primary/80 text-white overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
              <div className="relative z-10">
                <Mail className="w-16 h-16 mx-auto mb-6 opacity-90" />
                <h2 className="text-2xl md:text-3xl font-bold mb-4">
                  Non Perdere i Nostri Consigli
                </h2>
                <p className="text-primary-foreground/90 mb-8 text-lg max-w-2xl mx-auto">
                  Ricevi i migliori articoli e strategie di marketing digitale direttamente nella tua inbox.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                  <Input 
                    type="email" 
                    placeholder="La tua email..." 
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/70 backdrop-blur-sm focus:bg-white/20"
                  />
                  <Button 
                    variant="secondary" 
                    size="lg"
                    className="bg-white text-primary hover:bg-white/90 font-semibold px-8 whitespace-nowrap"
                  >
                    Iscriviti Gratis
                  </Button>
                </div>
                
                <p className="text-xs text-primary-foreground/70 mt-4">
                  Niente spam. Solo contenuti di valore. Cancellati quando vuoi.
                </p>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
    </>
  );
}
