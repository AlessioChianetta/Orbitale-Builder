import { Button } from "@/components/ui/button";
import { ArrowRight, Play, CheckCircle } from "lucide-react";
import { Link } from "wouter";

interface HeroProps {
  title?: string;
  subtitle?: string;
  description?: string;
  ctaPrimary?: string;
  ctaSecondary?: string;
  features?: string[];
  videoUrl?: string;
}

export default function Hero({
  title = "Soluzioni Web Professionali per il Tuo Business",
  subtitle = "CMS Avanzato • Landing Page • Lead Generation",
  description = "Crea siti web professionali con il nostro sistema CMS completo, blog integrato e landing page ottimizzate per massimizzare le conversioni.",
  ctaPrimary = "Inizia Ora",
  ctaSecondary = "Scopri di Più",
  features = [
    "Sistema CMS completo e intuitivo",
    "Landing page ottimizzate per conversioni",
    "Blog integrato con SEO avanzata",
    "Analytics e tracking dettagliato"
  ],
  videoUrl
}: HeroProps) {
  return (
    <section className="relative bg-gradient-to-br from-background to-muted py-20 lg:py-32 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-black/[0.02] bg-[size:60px_60px]" />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-transparent" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm bg-accent/10 text-accent-foreground border-accent/20">
              <span className="font-medium">✨ Nuovo:</span>
              <span className="ml-1">Landing Page Builder Avanzato</span>
            </div>

            {/* Headlines */}
            <div className="space-y-4">
              <h1 className="font-heading font-bold text-4xl lg:text-6xl leading-tight text-foreground" data-testid="heading-hero-title">
                {title}
              </h1>
              <p className="text-lg lg:text-xl text-primary font-medium" data-testid="text-hero-subtitle">
                {subtitle}
              </p>
              <p className="text-lg text-muted-foreground max-w-xl" data-testid="text-hero-description">
                {description}
              </p>
            </div>

            {/* Features List */}
            <div className="grid sm:grid-cols-2 gap-3">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-accent shrink-0" />
                  <span className="text-sm text-muted-foreground" data-testid={`text-feature-${index}`}>
                    {feature}
                  </span>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                asChild 
                size="lg" 
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold"
                data-testid="button-hero-primary"
              >
                <Link href="/contatti">
                  {ctaPrimary}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button 
                asChild 
                variant="outline" 
                size="lg" 
                className="font-semibold"
                data-testid="button-hero-secondary"
              >
                <Link href="/servizi">
                  {ctaSecondary}
                </Link>
              </Button>
            </div>

            {/* Social Proof */}
            <div className="pt-4">
              <p className="text-sm text-muted-foreground mb-2">Scelto da oltre 500+ aziende</p>
              <div className="flex items-center space-x-6 opacity-60">
                <div className="h-8 bg-muted rounded flex items-center px-4">
                  <span className="text-xs font-medium">AZIENDA A</span>
                </div>
                <div className="h-8 bg-muted rounded flex items-center px-4">
                  <span className="text-xs font-medium">AZIENDA B</span>
                </div>
                <div className="h-8 bg-muted rounded flex items-center px-4">
                  <span className="text-xs font-medium">AZIENDA C</span>
                </div>
              </div>
            </div>
          </div>

          {/* Visual/Video */}
          <div className="relative">
            {videoUrl ? (
              <div className="relative bg-card rounded-2xl overflow-hidden shadow-2xl">
                <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <Button
                    size="lg"
                    className="rounded-full w-16 h-16 p-0 bg-primary hover:bg-primary/90"
                    data-testid="button-hero-video"
                  >
                    <Play className="h-6 w-6 ml-1" fill="currentColor" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="relative">
                {/* Mock Dashboard/CMS Interface */}
                <div className="bg-card rounded-2xl shadow-2xl overflow-hidden border">
                  <div className="bg-muted p-4 border-b">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-3 h-3 rounded-full bg-destructive" />
                        <div className="w-3 h-3 rounded-full bg-amber-500" />
                        <div className="w-3 h-3 rounded-full bg-accent" />
                      </div>
                      <div className="text-sm text-muted-foreground">Dashboard CMS</div>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-4 bg-muted rounded w-1/2" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-primary/10 rounded-lg p-3">
                        <div className="h-3 bg-primary/30 rounded w-full mb-2" />
                        <div className="h-8 bg-primary/20 rounded" />
                      </div>
                      <div className="bg-accent/10 rounded-lg p-3">
                        <div className="h-3 bg-accent/30 rounded w-full mb-2" />
                        <div className="h-8 bg-accent/20 rounded" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-muted rounded w-full" />
                      <div className="h-3 bg-muted rounded w-4/5" />
                      <div className="h-3 bg-muted rounded w-3/5" />
                    </div>
                  </div>
                </div>

                {/* Floating Elements */}
                <div className="absolute -top-4 -right-4 bg-accent text-accent-foreground rounded-full p-3 shadow-lg">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div className="absolute -bottom-4 -left-4 bg-primary text-primary-foreground rounded-lg px-3 py-2 shadow-lg">
                  <span className="text-sm font-medium">+127% Conversioni</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}