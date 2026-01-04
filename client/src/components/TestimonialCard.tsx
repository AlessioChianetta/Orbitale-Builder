import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star, Quote } from "lucide-react";

interface TestimonialCardProps {
  name: string;
  role: string;
  company: string;
  content: string;
  rating: number;
  avatarUrl?: string;
  featured?: boolean;
}

export default function TestimonialCard({
  name,
  role,
  company,
  content,
  rating,
  avatarUrl,
  featured = false
}: TestimonialCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className={`hover-elevate h-full ${featured ? 'border-primary bg-primary/5' : ''}`}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Quote Icon */}
          <div className="flex items-start justify-between">
            <Quote className="h-8 w-8 text-accent opacity-50" fill="currentColor" />
            {featured && (
              <Badge className="bg-primary text-primary-foreground" data-testid="badge-testimonial-featured">
                In Evidenza
              </Badge>
            )}
          </div>
          
          {/* Content */}
          <blockquote className="text-muted-foreground leading-relaxed" data-testid="text-testimonial-content">
            "{content}"
          </blockquote>
          
          {/* Rating */}
          <div className="flex items-center space-x-1" data-testid="rating-testimonial">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < rating ? 'text-amber-400 fill-current' : 'text-muted-foreground/30'
                }`}
              />
            ))}
            <span className="text-sm text-muted-foreground ml-2">({rating}/5)</span>
          </div>
          
          {/* Author */}
          <div className="flex items-center space-x-3 pt-2">
            <Avatar className="h-12 w-12">
              <AvatarImage src={avatarUrl} alt={name} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {getInitials(name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-semibold text-foreground" data-testid="text-testimonial-name">
                {name}
              </div>
              <div className="text-sm text-muted-foreground" data-testid="text-testimonial-role">
                {role} • {company}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}