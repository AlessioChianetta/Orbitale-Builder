import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, User, ArrowRight, Clock } from "lucide-react";
import { Link } from "wouter";
import { generateOptimizedAltText } from "@/lib/seoUtils";

interface BlogCardProps {
  title: string;
  excerpt: string;
  author: string;
  publishDate: string;
  readTime: string;
  category: string;
  imageUrl?: string;
  slug: string;
  featured?: boolean;
}

export default function BlogCard({
  title,
  excerpt,
  author,
  publishDate,
  readTime,
  category,
  imageUrl,
  slug,
  featured = false
}: BlogCardProps) {
  const formattedDate = new Date(publishDate).toLocaleDateString('it-IT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <Card className={`hover-elevate h-full group ${featured ? 'border-primary' : ''}`}>
      {/* Featured Image */}
      <div className="relative overflow-hidden">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={generateOptimizedAltText({
              title,
              description: excerpt,
              category,
              context: 'thumbnail'
            })}
            className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
            width="400"
            height="192"
            loading="lazy"
            decoding="async"
            data-testid="img-blog"
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20 flex items-center justify-center">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-primary/30 rounded-lg flex items-center justify-center mx-auto">
                <span className="text-primary font-bold text-xl">B</span>
              </div>
              <p className="text-sm text-muted-foreground">Immagine Blog</p>
            </div>
          </div>
        )}
        
        {featured && (
          <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground" data-testid="badge-featured">
            In Evidenza
          </Badge>
        )}
        
        <Badge 
          variant="secondary" 
          className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm"
          data-testid="badge-category"
        >
          {category}
        </Badge>
      </div>
      
      <CardHeader className="pb-3">
        <h3 className="font-heading font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors" data-testid="heading-blog-title">
          {title}
        </h3>
      </CardHeader>
      
      <CardContent className="pt-0 pb-4">
        <p className="text-muted-foreground text-sm line-clamp-3 mb-4" data-testid="text-blog-excerpt">
          {excerpt}
        </p>
        
        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
          <div className="flex items-center space-x-1">
            <User className="h-3 w-3" />
            <span data-testid="text-blog-author">{author}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="h-3 w-3" />
            <span data-testid="text-blog-date">{formattedDate}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span data-testid="text-blog-readtime">{readTime}</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-0">
        <Button 
          asChild 
          variant="ghost" 
          className="w-full justify-between group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
          data-testid="button-blog-read"
        >
          <Link href={`/blog/${slug}`}>
            Leggi Articolo
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}