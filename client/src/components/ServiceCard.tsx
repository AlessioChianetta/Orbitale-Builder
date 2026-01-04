import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, LucideIcon } from "lucide-react";
import { Link } from "wouter";

interface ServiceCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  features: string[];
  price?: string;
  popular?: boolean;
  ctaText?: string;
  ctaLink: string;
}

export default function ServiceCard({
  title,
  description,
  icon: Icon,
  features,
  price,
  popular = false,
  ctaText = "Scopri di più",
  ctaLink
}: ServiceCardProps) {
  return (
    <Card className={`relative hover-elevate h-full ${popular ? 'border-primary shadow-lg' : ''}`}>
      {popular && (
        <Badge 
          className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground"
          data-testid="badge-popular"
        >
          Più Richiesto
        </Badge>
      )}
      
      <CardHeader className="text-center pb-4">
        <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
          <Icon className="h-8 w-8 text-primary" data-testid="icon-service" />
        </div>
        <CardTitle className="font-heading text-xl" data-testid="heading-service-title">
          {title}
        </CardTitle>
        <CardDescription className="text-base" data-testid="text-service-description">
          {description}
        </CardDescription>
        {price && (
          <div className="pt-2">
            <span className="text-3xl font-bold text-foreground" data-testid="text-service-price">
              {price}
            </span>
            <span className="text-muted-foreground ml-1">/mese</span>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="pt-0">
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-accent rounded-full shrink-0 mt-2" />
              <span className="text-sm text-muted-foreground" data-testid={`text-feature-${index}`}>
                {feature}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
      
      <CardFooter className="pt-4">
        <Button 
          asChild 
          className={`w-full ${popular ? 'bg-primary hover:bg-primary/90' : 'bg-secondary hover:bg-secondary/90'}`}
          data-testid="button-service-cta"
        >
          <Link href={ctaLink}>
            {ctaText}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}