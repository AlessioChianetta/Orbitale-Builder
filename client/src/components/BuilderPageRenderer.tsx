import { Helmet } from 'react-helmet';
import { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { 
  CheckCircle, ArrowRight, Play, MapPin, Menu, Layout, Sparkles, AlertTriangle, X, Shield, Target, TrendingDown, Star, Users, Lightbulb, Award, TrendingUp, Heart, Quote, Clock, Zap, XCircle, PlayCircle, Search, Trophy, Rocket, Code, Briefcase, Handshake, ExternalLink, Calendar, BookOpen, User, Filter, Mail, HelpCircle, ChevronDown, ChevronUp, MessageCircle, Phone, Headphones, Palette, BarChart, Megaphone, Globe, Smartphone, Euro, ShieldCheck, Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import type { Project, BlogPostWithRelations } from '@shared/schema';
import { SEOHead } from './SEOHead';
import { LazyWistiaVideo } from './LazyWistiaVideo';
import type { LucideIcon } from 'lucide-react';
interface ComponentData {
  id: string;
  type: string;
  props: Record<string, any>;
  children?: ComponentData[];
}

interface BuilderPageProps {
  page: {
    id: number;
    title: string;
    slug: string;
    description: string | null;
    components: ComponentData[];
    metaTitle: string | null;
    metaDescription: string | null;
    ogImage: string | null;
    isActive: boolean;
  };
  isEditing?: boolean;
  onComponentClick?: (componentId: string) => void;
  onComponentDelete?: (componentId: string) => void;
  onComponentReorder?: (newComponents: ComponentData[]) => void;
  selectedComponentId?: string;
}

interface ComponentProps {
  props: Record<string, any>;
  isEditing?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
}

// Optimized icon map - only essential icons loaded
const icons: Record<string, LucideIcon> = {
  CheckCircle,
  ArrowRight,
  Play,
  MapPin,
  Menu,
  Layout,
  Sparkles,
  AlertTriangle,
  X,
  Shield,
  Target,
  TrendingDown,
  Star,
  Users,
  Lightbulb,
  Award,
  TrendingUp,
  Heart,
  Quote,
  Clock,
  Zap,
  XCircle,
  PlayCircle,
  Search,
  Trophy,
  Rocket,
  Code,
  Briefcase,
  Handshake,
  ExternalLink,
  Calendar,
  BookOpen,
  User,
  Filter,
  Mail,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Phone,
  Headphones,
  Palette,
  BarChart,
  Megaphone,
  Globe,
  Smartphone,
  Euro,
  ShieldCheck,
  Loader2
};

// Component Renderers
function HeroComponent({ props }: { props: any }) {
  const titleSizeMap: Record<string, string> = {
    '2xl': 'text-2xl md:text-4xl',
    '3xl': 'text-3xl md:text-5xl',
    '4xl': 'text-4xl md:text-6xl',
    '5xl': 'text-5xl md:text-7xl',
  };
  const titleClass = titleSizeMap[props.titleSize || '4xl'] || 'text-4xl md:text-6xl';
  const subtitleSizeMap: Record<string, string> = {
    'base': 'text-base',
    'lg': 'text-lg',
    'xl': 'text-xl',
    '2xl': 'text-2xl',
  };
  const subtitleClass = subtitleSizeMap[props.subtitleSize || 'xl'] || 'text-xl';
  const textAlignClass = props.textAlign === 'left' ? 'text-left' : props.textAlign === 'right' ? 'text-right' : 'text-center';

  const getVideoEmbedUrl = (url: string, provider: string) => {
    if (!url) return '';

    if (provider === 'youtube') {
      const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
      return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=${props.videoAutoplay ? 1 : 0}&mute=${props.videoMuted ? 1 : 0}&controls=${props.videoControls ? 1 : 0}` : '';
    }

    if (provider === 'vimeo') {
      const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1];
      return videoId ? `https://player.vimeo.com/video/${videoId}?autoplay=${props.videoAutoplay ? 1 : 0}&muted=${props.videoMuted ? 1 : 0}` : '';
    }

    if (provider === 'wistia') {
      const videoId = url.match(/wistia\.com\/medias\/([a-zA-Z0-9]+)/)?.[1] || url.match(/wi\.st\/([a-zA-Z0-9]+)/)?.[1];
      return videoId ? `https://fast.wistia.net/embed/iframe/${videoId}?autoplay=${props.videoAutoplay ? 1 : 0}&muted=${props.videoMuted ? 1 : 0}&controlsVisibleOnLoad=${props.videoControls ? 'true' : 'false'}` : '';
    }

    return url;
  };

  const getWistiaVideoId = (url: string) => {
    if (!url) return null;
    return url.match(/wistia\.com\/medias\/([a-zA-Z0-9]+)/)?.[1] || url.match(/wi\.st\/([a-zA-Z0-9]+)/)?.[1] || null;
  };

  return (
    <section 
      className={`relative px-4 ${textAlignClass}`} 
      style={{ 
        backgroundImage: props.backgroundImage ? `url(${props.backgroundImage})` : undefined,
        backgroundColor: props.backgroundColor || undefined,
        paddingTop: `${props.paddingY || 80}px`,
        paddingBottom: `${props.paddingY || 80}px`,
      }}
    >
      <div className="max-w-6xl mx-auto">
        <h1 
          className={`${titleClass} font-${props.titleWeight || 'bold'} mb-6`}
          style={{ color: props.titleColor || undefined }}
        >
          {props.title || 'Titolo Hero'}
        </h1>
        <p 
          className={`${subtitleClass} text-muted-foreground mb-8`}
          style={{ color: props.subtitleColor || undefined }}
        >
          {props.subtitle || 'Sottotitolo'}
        </p>

        {/* Video Section */}
        {props.videoUrl && (
          <div className="mb-8 max-w-4xl mx-auto">
            {props.videoProvider === 'wistia' && getWistiaVideoId(props.videoUrl) ? (
              <LazyWistiaVideo
                videoId={getWistiaVideoId(props.videoUrl)!}
                thumbnailUrl={props.videoThumbnail}
                title={props.title}
                className="aspect-video"
              />
            ) : (
              <div className="aspect-video rounded-lg overflow-hidden shadow-2xl">
                <iframe
                  src={getVideoEmbedUrl(props.videoUrl, props.videoProvider || 'youtube')}
                  className="w-full h-full"
                  frameBorder="0"
                  allowFullScreen
                  title="Hero Video"
                />
              </div>
            )}
          </div>
        )}

        {props.ctaText && (
          <Button size="lg" asChild>
            <a href={props.ctaLink || '#'}>{props.ctaText}</a>
          </Button>
        )}
      </div>
    </section>
  );
}

function TextComponent({ props }: { props: any }) {
  const alignmentMap: Record<string, string> = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };
  const alignmentClass = alignmentMap[props.textAlign || 'left'] || 'text-left';

  const sizeMap: Record<string, string> = {
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
  };
  const sizeClass = sizeMap[props.fontSize || 'base'] || 'text-base';
  const weightClass = `font-${props.fontWeight || 'normal'}`;

  return (
    <div 
      className={`px-4 ${alignmentClass}`}
      style={{
        paddingTop: `${props.paddingY || 32}px`,
        paddingBottom: `${props.paddingY || 32}px`,
        backgroundColor: props.backgroundColor || undefined,
      }}
    >
      <div className="max-w-4xl mx-auto">
        <p 
          className={`${sizeClass} ${weightClass}`}
          style={{ color: props.color || undefined }}
        >
          {props.content || 'Testo'}
        </p>
      </div>
    </div>
  );
}

function ImageComponent({ props }: { props: any }) {
  const radiusMap: Record<string, string> = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
  };
  const radiusClass = radiusMap[props.borderRadius || 'lg'] || 'rounded-lg';

  // Use explicit dimensions if provided, otherwise use aspect ratio defaults
  const imgWidth = props.imageWidth || 1200;
  const imgHeight = props.imageHeight || (imgWidth * 9 / 16); // 16:9 default aspect ratio

  return (
    <div 
      className="px-4"
      style={{
        paddingTop: `${props.paddingY || 32}px`,
        paddingBottom: `${props.paddingY || 32}px`,
      }}
    >
      <div className="max-w-6xl mx-auto">
        {props.src ? (
          <img 
            src={props.src} 
            alt={props.alt || 'Immagine'} 
            style={{ width: props.width || '100%', aspectRatio: `${imgWidth} / ${imgHeight}` }}
            className={radiusClass}
            width={imgWidth}
            height={imgHeight}
            loading="lazy"
            decoding="async"
            fetchPriority="auto"
          />
        ) : (
          <div className={`bg-muted ${radiusClass} h-64 flex items-center justify-center`}>
            <p className="text-muted-foreground">Nessuna immagine</p>
          </div>
        )}
      </div>
    </div>
  );
}

function FeaturesComponent({ props }: { props: any }) {
  const items = props.items || [];
  const titleSizeMap: Record<string, string> = {
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
    '4xl': 'text-4xl',
  };
  const titleClass = titleSizeMap[props.titleSize || '3xl'] || 'text-3xl';

  return (
    <section 
      className="px-4"
      style={{
        paddingTop: `${props.paddingY || 64}px`,
        paddingBottom: `${props.paddingY || 64}px`,
        backgroundColor: props.backgroundColor || undefined,
      }}
    >
      <div className="max-w-6xl mx-auto">
        {props.title && (
          <h2 
            className={`${titleClass} font-bold text-center mb-12`}
            style={{ color: props.titleColor || undefined }}
          >
            {props.title}
          </h2>
        )}
        <div className="grid md:grid-cols-3 gap-8">
          {items.map((item: any, index: number) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="mb-4">
                  <CheckCircle className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title || 'Feature'}</h3>
                <p className="text-muted-foreground">{item.description || 'Descrizione'}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsComponent({ props }: { props: any }) {
  const items = props.items || [];

  return (
    <section 
      className="py-16 px-4"
      style={{
        backgroundColor: props.backgroundColor || undefined,
      }}
    >
      <div className="max-w-6xl mx-auto">
        {props.title && (
          <h2 className="text-3xl font-bold text-center mb-12">{props.title}</h2>
        )}
        <div className="grid md:grid-cols-2 gap-8">
          {items.map((item: any, index: number) => (
            <Card key={index}>
              <CardContent className="p-6">
                <p className="text-lg mb-4 italic">"{item.text || 'Testimonianza'}"</p>
                <div>
                  <p className="font-semibold">{item.name || 'Nome'}</p>
                  <p className="text-sm text-muted-foreground">{item.role || 'Ruolo'}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTAComponent({ props }: { props: any }) {
  const textAlignClass = props.textAlign === 'left' ? 'text-left' : props.textAlign === 'right' ? 'text-right' : 'text-center';

  return (
    <div 
      className={`px-4 ${textAlignClass}`}
      style={{
        paddingTop: `${props.paddingY || 32}px`,
        paddingBottom: `${props.paddingY || 32}px`,
      }}
    >
      <Button variant={props.variant || 'default'} size={props.size || 'lg'} asChild>
        <a href={props.link || '#'}>
          {props.text || 'Call to Action'}
          <ArrowRight className="ml-2 h-4 w-4" />
        </a>
      </Button>
    </div>
  );
}

function ChecklistComponent({ props }: { props: any }) {
  const items = props.items || [];
  const titleSizeMap: Record<string, string> = {
    'xl': 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
  };
  const titleClass = titleSizeMap[props.titleSize || '2xl'] || 'text-2xl';

  return (
    <section 
      className="px-4"
      style={{
        paddingTop: `${props.paddingY || 48}px`,
        paddingBottom: `${props.paddingY || 48}px`,
        backgroundColor: props.backgroundColor || undefined,
      }}
    >
      <div className="max-w-4xl mx-auto">
        {props.title && (
          <h2 
            className={`${titleClass} font-bold mb-6`}
            style={{ color: props.titleColor || undefined }}
          >
            {props.title}
          </h2>
        )}
        <div className="space-y-3">
          {items.map((item: string, index: number) => (
            <div key={index} className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
              <p>{item}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContainerComponent({ props, children, isEditing }: { props: any; children?: React.ReactNode; isEditing?: boolean }) {
  const paddingMap: Record<string, string> = {
    none: 'p-0',
    small: 'p-4',
    medium: 'p-8',
    large: 'p-16',
  };
  const paddingClass = paddingMap[props.padding || 'medium'] || 'p-8';

  const { setNodeRef, isOver } = useDroppable({
    id: `container-${props.containerId || 'default'}`,
  });

  return (
    <div 
      ref={isEditing ? setNodeRef : undefined}
      className={`${paddingClass} ${isEditing && isOver ? 'bg-primary/10 border-2 border-dashed border-primary' : ''} ${isEditing ? 'min-h-[100px]' : ''}`} 
      style={{ 
        backgroundColor: props.backgroundColor || 'transparent',
        maxWidth: props.maxWidth || '1200px',
        margin: props.margin || 'auto',
      }}
    >
      {children || (
        <div className={`max-w-6xl mx-auto ${isEditing ? 'p-8 text-center border-2 border-dashed border-muted-foreground/30 rounded-lg' : ''}`}>
          {isEditing ? 'Container vuoto - Trascina qui i componenti' : 'Container'}
        </div>
      )}
    </div>
  );
}

// NEW COMPONENT RENDERERS

function SectionComponent({ props, children }: { props: any; children?: React.ReactNode }) {
  const radiusMap: Record<string, string> = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
  };
  const radiusClass = radiusMap[props.borderRadius || 'none'] || 'rounded-none';

  return (
    <section 
      className={`relative ${radiusClass}`}
      style={{
        backgroundColor: props.backgroundColor || 'transparent',
        backgroundImage: props.backgroundImage ? `url(${props.backgroundImage})` : undefined,
        paddingTop: `${props.paddingY || 64}px`,
        paddingBottom: `${props.paddingY || 64}px`,
        paddingLeft: `${props.paddingX || 16}px`,
        paddingRight: `${props.paddingX || 16}px`,
        minHeight: props.minHeight || 'auto',
        maxWidth: props.maxWidth || '100%',
        border: props.border || 'none',
      }}
    >
      <div className="max-w-7xl mx-auto">
        {children || <div>Sezione vuota - Aggiungi componenti qui</div>}
      </div>
    </section>
  );
}

function ColumnComponent({ props, children }: { props: any; children?: React.ReactNode }) {
  const alignmentMap: Record<string, string> = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };
  const alignmentClass = alignmentMap[props.textAlign || 'left'] || 'text-left';

  const verticalAlignMap: Record<string, string> = {
    top: 'items-start',
    center: 'items-center',
    bottom: 'items-end',
  };
  const verticalAlignClass = verticalAlignMap[props.verticalAlign || 'top'] || 'items-start';

  return (
    <div 
      className={`flex flex-col ${alignmentClass} ${verticalAlignClass}`}
      style={{
        width: props.width || '100%',
        backgroundColor: props.backgroundColor || 'transparent',
        paddingTop: `${props.paddingY || 16}px`,
        paddingBottom: `${props.paddingY || 16}px`,
        paddingLeft: `${props.paddingX || 16}px`,
        paddingRight: `${props.paddingX || 16}px`,
        border: props.border || 'none',
        borderRadius: props.borderRadius || '0',
      }}
    >
      {children || <div className="p-4 bg-muted/20 border-dashed border-2">Colonna vuota</div>}
    </div>
  );
}

function HeadingComponent({ props }: { props: any }) {
  const Tag = props.tag || 'h2';
  const sizeMap: Record<string, string> = {
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
    '4xl': 'text-4xl',
    '5xl': 'text-5xl',
    '6xl': 'text-6xl',
  };
  const sizeClass = sizeMap[props.size || '3xl'] || 'text-3xl';
  const weightClass = `font-${props.fontWeight || 'bold'}`;
  const alignmentClass = props.textAlign === 'center' ? 'text-center' : props.textAlign === 'right' ? 'text-right' : 'text-left';
  const lineHeightClass = props.lineHeight === 'tight' ? 'leading-tight' : props.lineHeight === 'loose' ? 'leading-loose' : 'leading-normal';

  return (
    <div style={{ paddingTop: `${props.paddingY || 16}px`, paddingBottom: `${props.paddingY || 16}px` }}>
      <Tag 
        className={`${sizeClass} ${weightClass} ${alignmentClass} ${lineHeightClass}`}
        style={{ color: props.color || undefined }}
      >
        {props.text || 'Il Tuo Titolo Qui'}
      </Tag>
    </div>
  );
}

function VideoComponent({ props }: { props: any }) {
  const [isClicked, setIsClicked] = useState(false);

  const getYoutubeVideoId = (url: string) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  const videoId = props.provider === 'youtube' ? getYoutubeVideoId(props.url) : null;

  // Usiamo un'immagine di qualità leggermente inferiore (hqdefault) che è sempre disponibile
  // e meno soggetta a blocchi.
  const thumbnailUrl = videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : '';

  const getEmbedUrl = () => {
    if (!props.url) return '';

    if (props.provider === 'youtube' && videoId) {
      // Forziamo autoplay quando l'utente clicca per avviare il video
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=${props.muted ? 1 : 0}&controls=${props.controls ? 1 : 0}`;
    }

    if (props.provider === 'vimeo') {
      const vimeoId = props.url.match(/vimeo\.com\/(\d+)/)?.[1];
      return vimeoId ? `https://player.vimeo.com/video/${vimeoId}?autoplay=1&muted=${props.muted ? 1 : 0}` : '';
    }

    return props.url;
  };

  const aspectRatioClass = props.aspectRatio === '16:9' ? 'aspect-video' : props.aspectRatio === '4:3' ? 'aspect-[4/3]' : 'aspect-video';

  const handlePlayClick = () => {
    setIsClicked(true);
  };

  // Se il video è in autoplay, carichiamo subito l'iframe
  if (props.autoplay) {
     return (
        <div style={{ paddingTop: `${props.paddingY || 16}px`, paddingBottom: `${props.paddingY || 16}px` }}>
            <div className={`${aspectRatioClass} bg-muted rounded-lg overflow-hidden`}>
                <iframe
                    src={getEmbedUrl()} // L'URL qui includerà già autoplay=1
                    className="w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="Video embed"
                    loading="lazy"
                />
            </div>
        </div>
     );
  }

  // Altrimenti, usiamo l'approccio Facade
  return (
    <div style={{ paddingTop: `${props.paddingY || 16}px`, paddingBottom: `${props.paddingY || 16}px` }}>
      <div className={`${aspectRatioClass} bg-muted rounded-lg overflow-hidden relative`}>
        {isClicked ? (
          <iframe
            src={getEmbedUrl()}
            className="w-full h-full"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Video embed"
          />
        ) : (
          <button
            onClick={handlePlayClick}
            className="w-full h-full flex items-center justify-center cursor-pointer p-0 border-0"
            aria-label="Play video"
          >
            {thumbnailUrl ? (
              <img 
                src={thumbnailUrl} 
                alt="Video thumbnail" 
                className="absolute top-0 left-0 w-full h-full object-cover" 
                width="800"
                height="450"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="w-full h-full bg-black"></div>
            )}
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors"></div>
            <div className="relative z-10 text-white drop-shadow-lg">
              <PlayCircle className="h-20 w-20 transform transition-transform group-hover:scale-110" />
            </div>
          </button>
        )}
      </div>
    </div>
  );
}

function ButtonComponent({ props }: { props: any }) {
  const alignmentMap: Record<string, string> = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };
  const alignmentClass = alignmentMap[props.alignment || 'left'] || 'text-left';

  return (
    <div 
      className={alignmentClass}
      style={{ paddingTop: `${props.paddingY || 16}px`, paddingBottom: `${props.paddingY || 16}px` }}
    >
      <Button
        variant={props.variant || 'default'}
        size={props.size || 'lg'}
        className={`${props.width === 'full' ? 'w-full' : 'w-auto'}`}
        style={{
          backgroundColor: props.backgroundColor || undefined,
          color: props.textColor || undefined,
          borderRadius: props.borderRadius === 'none' ? '0' : undefined,
        }}
        asChild
      >
        <a href={props.link || '#'}>
          {props.text || 'Clicca Qui'}
        </a>
      </Button>
    </div>
  );
}

function FormComponent({ props }: { props: any }) {
  const fields = props.fields || [];

  return (
    <div style={{ paddingTop: `${props.paddingY || 32}px`, paddingBottom: `${props.paddingY || 32}px` }}>
      <div className="max-w-md mx-auto">
        {props.title && (
          <h3 className="text-2xl font-bold mb-6 text-center">{props.title}</h3>
        )}
        <form className="space-y-4">
          {fields.map((field: any, index: number) => (
            <div key={index}>
              <label className="block text-sm font-medium mb-1">
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </label>
              {field.type === 'textarea' ? (
                <textarea
                  className="w-full p-3 border rounded-md resize-none"
                  rows={4}
                  placeholder={`Inserisci ${field.label.toLowerCase()}`}
                />
              ) : (
                <input
                  type={field.type}
                  className="w-full p-3 border rounded-md"
                  placeholder={`Inserisci ${field.label.toLowerCase()}`}
                />
              )}
            </div>
          ))}
          <Button type="submit" className="w-full">
            {props.submitText || 'Invia'}
          </Button>
        </form>
      </div>
    </div>
  );
}

function MapComponent({ props }: { props: any }) {
  return (
    <div style={{ paddingTop: `${props.paddingY || 16}px`, paddingBottom: `${props.paddingY || 16}px` }}>
      <div 
        className="rounded-lg flex items-center justify-center"
        style={{ 
          height: props.height || '400px',
          backgroundColor: props.backgroundColor || '#f3f4f6'
        }}
      >
        <div className="text-center">
          <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">Mappa: {props.address || 'Inserisci indirizzo'}</p>
        </div>
      </div>
    </div>
  );
}

function IconListComponent({ props }: { props: any }) {
  const items = props.items || [];
  const layoutClass = props.layout === 'horizontal' ? 'flex flex-wrap gap-4' : 'space-y-3';
  const spacingMap: Record<string, string> = {
    small: 'gap-2',
    medium: 'gap-4',
    large: 'gap-6',
  };
  const spacingClass = spacingMap[props.spacing || 'medium'] || 'gap-4';

  return (
    <div style={{ paddingTop: `${props.paddingY || 16}px`, paddingBottom: `${props.paddingY || 16}px` }}>
      <div className={`${layoutClass} ${props.layout === 'horizontal' ? spacingClass : ''}`}>
        {items.map((item: any, index: number) => (
          <div key={index} className="flex items-center gap-3">
            <CheckCircle className={`h-5 w-5 text-${item.color || 'primary'} `} />
            <span>{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SpacerComponent({ props }: { props: any }) {
  return (
    <div 
      style={{ 
        height: `${props.height || 40}px`,
        backgroundColor: props.backgroundColor || 'transparent'
      }}
    />
  );
}

function DividerComponent({ props }: { props: any }) {
  return (
    <div style={{ paddingTop: `${props.spacing || 32}px`, paddingBottom: `${props.spacing || 32}px` }}>
      <hr 
        style={{
          border: 'none',
          borderTop: `${props.thickness || 1}px ${props.style || 'solid'} ${props.color || '#e5e7eb'}`,
          width: props.width || '100%',
          margin: '0 auto',
        }}
      />
    </div>
  );
}

function NavMenuComponent({ props }: { props: any }) {
  const items = props.items || [];
  const layoutClass = props.layout === 'vertical' ? 'flex flex-col space-y-2' : 'flex space-x-6';
  const alignmentMap: Record<string, string> = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  };
  const alignmentClass = alignmentMap[props.alignment || 'left'] || 'justify-start';

  return (
    <nav 
      className={`${alignmentClass}`}
      style={{
        backgroundColor: props.backgroundColor || 'transparent',
        color: props.textColor || undefined,
        paddingTop: `${props.paddingY || 16}px`,
        paddingBottom: `${props.paddingY || 16}px`,
      }}
    >
      <ul className={layoutClass}>
        {items.map((item: any, index: number) => (
          <li key={index}>
            <a 
              href={item.link} 
              className="hover:text-primary transition-colors"
              style={{ color: props.textColor || undefined }}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function PostsGridComponent({ props }: { props: any }) {
  const gridCols = props.columns === 2 ? 'md:grid-cols-2' : props.columns === 4 ? 'md:grid-cols-4' : 'md:grid-cols-3';

  // Mock posts data
  const mockPosts = Array.from({ length: props.postsToShow || 6 }, (_, i) => ({
    id: i + 1,
    title: `Articolo di Esempio ${i + 1}`,
    excerpt: 'Questo è un estratto dell\'articolo che fornisce un\'anteprima del contenuto...',
    date: new Date().toLocaleDateString(),
    author: 'Autore',
  }));

  return (
    <section style={{ paddingTop: `${props.paddingY || 64}px`, paddingBottom: `${props.paddingY || 64}px` }}>
      <div className="max-w-6xl mx-auto px-4">
        {props.title && (
          <h2 className={`text-${props.titleSize || '3xl'} font-bold text-center mb-12`}>
            {props.title}
          </h2>
        )}
        <div className={`grid ${gridCols} gap-8`}>
          {mockPosts.map((post) => (
            <Card key={post.id}>
              <CardContent className="p-6">
                <div className="aspect-video bg-muted rounded-lg mb-4" />
                <h3 className="text-xl font-semibold mb-2">{post.title}</h3>
                {props.showExcerpt && (
                  <p className="text-muted-foreground mb-4">{post.excerpt}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {props.showDate && <span>{post.date}</span>}
                  {props.showAuthor && <span>da {post.author}</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// Advanced Patrimonio Components
function ValueStackComponent({ props }: { props: any }) {
  const items = props.items || [];

  return (
    <section 
      className="py-16" 
      style={{ 
        backgroundColor: props.backgroundColor || '#f1f5f9',
        paddingTop: `${props.paddingY || 64}px`,
        paddingBottom: `${props.paddingY || 64}px`,
      }}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            {props.title || 'Non compri un corso.'}{' '}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {props.highlightedTitle || 'Acquisisci un intero arsenale.'}
            </span>
          </h2>
        </div>

        <div className="grid gap-6">
          {items.map((item: any, index: number) => (
            <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <div className="text-blue-600 text-2xl">
                      {item.icon || '⭐'}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {item.title}
                      </h3>
                      <span className="text-green-600 font-semibold px-3 py-1 bg-secondary rounded-md text-sm">
                        Valore: {item.value}
                      </span>
                    </div>
                    <p className="text-slate-600">
                      {item.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {(props.totalValue || props.investment) && (
          <div className="mt-8 p-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl text-white text-center">
            <h3 className="text-2xl font-bold mb-2">
              {props.totalValue ? `VALORE TOTALE DEL PACCHETTO: ${props.totalValue}` : 'VALORE TOTALE DEL PACCHETTO'}
            </h3>
            <p className="text-xl">{props.investment || 'IL TUO INVESTIMENTO OGGI'}</p>
          </div>
        )}
      </div>
    </section>
  );
}

function MethodPhasesComponent({ props }: { props: any }) {
  const phases = props.phases || [];

  return (
    <section 
      className="py-16" 
      style={{ 
        backgroundColor: props.backgroundColor || 'white',
        paddingTop: `${props.paddingY || 80}px`,
        paddingBottom: `${props.paddingY || 80}px`,
      }}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-slate-900 mb-12">
          {props.title || 'Il Metodo ORBITALE: Sistema a 4 fasi'}
        </h2>

        <div className="grid gap-8">
          {phases.map((phase: any, index: number) => (
            <Card key={index} className="overflow-hidden hover:shadow-xl transition-shadow">
              <div className="flex">
                <div 
                  className="w-2" 
                  style={{ background: phase.borderColor || 'linear-gradient(to bottom, #ef4444, #f97316)' }}
                />
                <div className="p-8 flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-2xl"
                      style={{ background: phase.gradient || 'linear-gradient(135deg, #ef4444, #f97316)' }}
                    >
                      {phase.icon || '🎯'}
                    </div>
                    <div>
                      <div className="bg-slate-100 text-slate-600 px-3 py-1 rounded-md text-xs font-semibold inline-block mb-2">
                        {phase.phase || 'Fase'}
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">
                        {phase.title}
                      </h3>
                    </div>
                  </div>
                  <p className="text-slate-600 mb-4 leading-relaxed">
                    {phase.description}
                  </p>
                  {phase.transformation && (
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-sm font-semibold text-slate-700">
                        <span className="text-green-600">Trasformazione:</span> {phase.transformation}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProblemsListComponent({ props }: { props: any }) {
  const problems = props.problems || [];

  return (
    <section 
      className="py-16" 
      style={{ 
        backgroundColor: props.backgroundColor || '#f8fafc',
        paddingTop: `${props.paddingY || 80}px`,
        paddingBottom: `${props.paddingY || 80}px`,
      }}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-slate-900 mb-4">
          {props.title || 'Se lavori sodo ma il tuo patrimonio è fermo, la colpa non è tua'}
        </h2>
        {props.subtitle && (
          <p className="text-xl text-center text-slate-600 mb-12">
            {props.subtitle}
          </p>
        )}

        <div className="grid gap-6">
          {problems.map((problem: any, index: number) => {
            // Gestione sicura di oggetti vs stringhe
            const isObject = typeof problem === 'object' && problem !== null && !Array.isArray(problem);
            const iconText = isObject ? String(problem.icon || '⚠️') : '⚠️';
            const problemTitle = isObject ? String(problem.title || 'Problema Identificato') : String(problem || 'Problema Identificato');
            const problemDescription = isObject ? String(problem.description || '') : '';
            const severity = isObject ? (problem.severity || 'medium') : 'medium';

            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="text-4xl text-red-500 mt-1">
                      {iconText}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-slate-900 mb-2">
                        {problemTitle}
                      </h3>
                      {problemDescription && (
                        <p className="text-slate-600 leading-relaxed mb-4">
                          {problemDescription}
                        </p>
                      )}
                      {/* Severity Indicator */}
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {[...Array(3)].map((_, i) => (
                            <div 
                              key={i} 
                              className={`h-2 w-8 rounded-full ${
                                i < (severity === 'high' ? 3 : severity === 'medium' ? 2 : 1)
                                  ? 'bg-red-500'
                                  : 'bg-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-semibold text-red-600 uppercase tracking-wide">
                          {severity === 'high' ? 'Critico' : severity === 'medium' ? 'Medio' : 'Basso'}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function TransparencyFilterComponent({ props }: { props: any }) {
  const weDoItems = props.weDoItems || [];
  const weDontItems = props.weDontItems || [];

  return (
    <section 
      className="relative py-16 overflow-hidden" 
      style={{ 
        backgroundColor: props.backgroundColor || '#f8fafc',
        paddingTop: `${props.paddingY || 96}px`,
        paddingBottom: `${props.paddingY || 96}px`,
      }}
    >
      {/* Background decorativo */}
      <div className="absolute inset-0 opacity-30" style={{ 
        backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(239, 68, 68, 0.1) 0%, transparent 50%)'
      }} />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          {props.badge && (
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 px-6 py-3 rounded-full text-sm font-bold mb-6 shadow-lg border border-blue-200/50 backdrop-blur-sm">
              <Shield className="w-4 h-4" />
              {props.badge}
            </div>
          )}
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight mb-4">
            {props.title || 'Prima di continuare, lascia che sia brutalmente onesto su chi siamo'}
          </h2>
          {props.subtitle && (
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              {props.subtitle}
            </p>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Cosa facciamo - Design migliorato */}
          <div className="group relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl opacity-75 group-hover:opacity-100 blur transition duration-500"></div>
            <div className="relative bg-white rounded-2xl p-8 shadow-2xl border border-green-100 hover:shadow-3xl transition-all duration-500 hover:-translate-y-1">
              <div className="flex items-center mb-8">
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white w-16 h-16 rounded-2xl flex items-center justify-center mr-4 shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1">Sì, Lavoriamo Con</div>
                  <h3 className="text-2xl font-black text-slate-900">
                    {props.weDoTitle || 'Quello che facciamo'}
                  </h3>
                </div>
              </div>
              <ul className="space-y-4">
                {weDoItems.map((item: any, index: number) => (
                  <li key={index} className="flex items-start group/item">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3 group-hover/item:bg-green-200 transition-colors">
                      <span className="text-green-600 text-lg">✓</span>
                    </div>
                    <span className="text-slate-700 leading-relaxed font-medium pt-1">
                      {typeof item === 'string' ? item : item.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Cosa NON facciamo - Design migliorato */}
          <div className="group relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-rose-600 rounded-2xl opacity-75 group-hover:opacity-100 blur transition duration-500"></div>
            <div className="relative bg-white rounded-2xl p-8 shadow-2xl border border-red-100 hover:shadow-3xl transition-all duration-500 hover:-translate-y-1">
              <div className="flex items-center mb-8">
                <div className="bg-gradient-to-br from-red-500 to-rose-600 text-white w-16 h-16 rounded-2xl flex items-center justify-center mr-4 shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                  <XCircle className="w-8 h-8" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-1">No, NON Lavoriamo Con</div>
                  <h3 className="text-2xl font-black text-slate-900">
                    {props.weDontTitle || 'Quello che NON facciamo'}
                  </h3>
                </div>
              </div>
              <ul className="space-y-4">
                {weDontItems.map((item: any, index: number) => (
                  <li key={index} className="flex items-start group/item">
                    <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3 group-hover/item:bg-red-200 transition-colors">
                      <span className="text-red-600 text-lg">✗</span>
                    </div>
                    <span className="text-slate-700 leading-relaxed font-medium pt-1">
                      {typeof item === 'string' ? item : item.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* CTA opzionale */}
        {props.ctaText && (
          <div className="mt-12 text-center">
            <Button 
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-6 text-lg font-bold shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300"
              asChild
            >
              <a href={props.ctaLink || '#'}>
                {props.ctaText}
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

// VSL Hero Block Component (Rendita Dipendente) - VERSIONE RESPONSIVE CON DARK/LIGHT THEME
function VSLHeroBlockComponent({ props }: { props: any }) {
  const [showLeadDialog, setShowLeadDialog] = useState(false);
  const [leadFormData, setLeadFormData] = useState({
    nome: '',
    cognome: '',
    email: '',
    telefono: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getVideoEmbedUrl = (url: string, provider: string) => {
    if (!url) return '';
    if (provider === 'youtube') {
      const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
      return videoId ? `https://www.youtube.com/embed/${videoId}?rel=0&showinfo=0&autoplay=0` : '';
    }
    if (provider === 'vimeo') {
      const videoId = url.match(/(?:player\.)?vimeo\.com\/(?:video\/)?(\d+)/)?.[1];
      return videoId ? `https://player.vimeo.com/video/${videoId}?badge=0&autopause=0` : '';
    }
    if (provider === 'wistia') {
      const videoId = url.match(/wistia\.com\/medias\/([a-zA-Z0-9]+)/)?.[1] || url.match(/fast\.wistia\.com\/embed\/iframe\/([a-zA-Z0-9]+)/)?.[1] || (/^[a-zA-Z0-9]{10}$/.test(url.trim()) ? url.trim() : null);
      return videoId ? `https://fast.wistia.com/embed/iframe/${videoId}` : '';
    }
    return url;
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      console.log('📤 [VSL LEAD] Invio lead:', {
        nome: leadFormData.nome,
        cognome: leadFormData.cognome,
        email: leadFormData.email,
        telefono: leadFormData.telefono
      });

      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `${leadFormData.nome} ${leadFormData.cognome}`.trim(),
          email: leadFormData.email,
          phone: leadFormData.telefono || undefined,
          company: undefined,
          message: 'Lead generato da VSL Hero CTA - Sezione Hero Video',
          source: 'vsl-hero-cta'
        }),
      });

      console.log('📥 [VSL LEAD] Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ [VSL LEAD] Lead salvato con successo:', data);
        
        setShowLeadDialog(false);
        setLeadFormData({ nome: '', cognome: '', email: '', telefono: '' });
        alert('Grazie! Ti contatteremo presto.');
      } else {
        const errorData = await response.text();
        console.error('❌ [VSL LEAD] Errore server:', errorData);
        alert('Errore durante l\'invio. Riprova.');
      }
    } catch (error) {
      console.error('❌ [VSL LEAD] Errore invio lead:', error);
      alert('Errore durante l\'invio. Riprova.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCTAClick = (e: React.MouseEvent) => {
    if (props.ctaType === 'form') {
      e.preventDefault();
      setShowLeadDialog(true);
    }
  };

  const isDarkTheme = props.theme === 'dark';
  const paddingY = props.paddingY || 80;

  return (
      <section 
        className={`relative overflow-hidden ${props.videoUrl ? 'min-h-screen flex items-center justify-center' : ''}`}
        style={{ 
          background: isDarkTheme 
            ? '#1e293b' 
            : 'linear-gradient(135deg, #f0f4f8 0%, #ffffff 50%, #e8eef5 100%)',
          paddingTop: `${props.paddingY || 80}px`,
          paddingBottom: `${props.paddingY || 80}px`,
        }}
      >
      {/* Sfondo Animato - Solo per tema scuro */}
      {isDarkTheme && (
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500 rounded-full mix-blend-normal filter blur-[120px] opacity-30 animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-emerald-500 rounded-full mix-blend-normal filter blur-[120px] opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
      )}

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-6xl mx-auto">
          {/* Headline Superiore - Badge Azzurro */}
          <div className="mb-8">
            {props.topHeadline && (
              <p className={`font-bold text-lg md:text-xl tracking-wide mb-4 flex items-center justify-center gap-2 ${
                isDarkTheme ? 'text-blue-400' : 'text-blue-600'
              }`}>
                <span className="text-2xl">🎯</span>
                {props.topHeadline}
              </p>
            )}
            {props.urgencyBadge && (
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-blue-700 px-6 py-2 rounded-full text-white font-bold text-sm md:text-base animate-pulse shadow-lg">
                <AlertTriangle className="w-4 h-4" />
                {props.urgencyBadge}
              </div>
            )}
          </div>

          {/* Titolo Principale - Esattamente come nell'immagine */}
          <div className={`space-y-6 ${props.videoUrl ? 'mb-12' : 'mb-24'}`}>
            <h1 className={`text-3xl md:text-5xl lg:text-6xl font-black leading-tight ${
              isDarkTheme ? 'text-white' : 'text-slate-900'
            }`}>
              {props.titlePrefix && (
                <span className={isDarkTheme ? 'text-blue-400' : 'text-blue-600'}>
                  {props.titlePrefix}
                </span>
              )}
              {props.titlePrefix && ' '}
              {props.title || 'Il Sistema'}{' '}
              <span className={`bg-gradient-to-r ${
                isDarkTheme 
                  ? 'from-blue-400 to-green-500' 
                  : 'from-blue-600 to-emerald-600'
              } bg-clip-text text-transparent`}>
                {props.highlightedTitle || '"ACCELERATORE DI BUSINESS REMOTO"'}
              </span>{' '}
              {props.titleSuffix || (
                <>
                  che Trasforma il Tuo Lavoro Dipendente in una{' '}
                  <span className={`font-black ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                    FONTE DI RICCHEZZA
                  </span>
                </>
              )}
              {props.titleSuffix2 && (
                <>
                  {' '}
                  <span className={`bg-gradient-to-r ${
                    isDarkTheme 
                      ? 'from-blue-400 to-green-500' 
                      : 'from-blue-600 to-emerald-600'
                  } bg-clip-text text-transparent`}>
                    {props.titleSuffix2}
                  </span>
                </>
              )}
            </h1>

            {/* Sottotitolo con 4 parti - Part1 (blu), Highlight (box blu), Part2 (principale), Part3 (blu) */}
            {(props.subtitlePart1 || props.subtitleHighlight || props.subtitlePart2 || props.subtitlePart3) && (
              <h2 className={`text-xl md:text-3xl lg:text-4xl font-bold ${
                isDarkTheme ? 'text-blue-300' : 'text-slate-700'
              }`}>
                {props.subtitlePart1 && (
                  <span className={isDarkTheme ? 'text-blue-200' : 'text-blue-600'}>
                    {props.subtitlePart1}
                  </span>
                )}{' '}
                {props.subtitleHighlight && (
                  <span className={`font-black px-3 py-1 rounded ${
                    isDarkTheme 
                      ? 'bg-blue-400 text-black' 
                      : 'bg-blue-600 text-white'
                  }`}>
                    {props.subtitleHighlight}
                  </span>
                )}{' '}
                {props.subtitlePart2 && (
                  <span className={isDarkTheme ? 'text-white' : 'text-slate-900'}>
                    {props.subtitlePart2}
                  </span>
                )}{' '}
                {props.subtitlePart3 && (
                  <span className={isDarkTheme ? 'text-blue-200' : 'text-blue-600'}>
                    {props.subtitlePart3}
                  </span>
                )}
              </h2>
            )}
          </div>

          {/* Video (opzionale) */}
          {props.videoUrl && (
            <div className={`max-w-5xl mx-auto ${props.ctaText ? 'mb-12' : 'mb-0'}`}>
              <div className={`aspect-video rounded-2xl overflow-hidden shadow-2xl ${
                isDarkTheme 
                  ? 'border-2 border-blue-400/30' 
                  : 'border-2 border-blue-200/50'
              }`}>
                <iframe
                  src={getVideoEmbedUrl(props.videoUrl, props.videoProvider || 'wistia')}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="VSL Video"
                />
              </div>
            </div>
          )}

          {/* CTA Principale */}
          {props.ctaText && (
            <div className={props.urgencyNote ? 'mb-8' : 'mb-0'}>
              <Button 
                size="lg"
                className={`font-bold text-base sm:text-lg md:text-xl px-8 py-6 sm:px-10 sm:py-7 md:px-12 md:py-8 rounded-xl transform hover:scale-105 transition-all duration-300 w-full sm:w-auto max-w-3xl mx-auto ${
                  isDarkTheme
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-2xl shadow-blue-500/50 hover:shadow-blue-600/60'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-2xl shadow-blue-600/30 hover:shadow-blue-700/40'
                }`}
                asChild={props.ctaType !== 'form'}
                onClick={handleCTAClick}
              >
                {props.ctaType === 'form' ? (
                  <span>{props.ctaText}</span>
                ) : (
                  <a href={props.ctaLink || '#'}>
                    {props.ctaText}
                  </a>
                )}
              </Button>
            </div>
          )}

          {/* Lead Dialog */}
          <Dialog open={showLeadDialog} onOpenChange={setShowLeadDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Richiedi Informazioni</DialogTitle>
                <DialogDescription>
                  Compila il form per essere contattato dal nostro team
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleLeadSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nome">Nome *</Label>
                    <Input
                      id="nome"
                      value={leadFormData.nome}
                      onChange={(e) => setLeadFormData({ ...leadFormData, nome: e.target.value })}
                      required
                      placeholder="Il tuo nome"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cognome">Cognome *</Label>
                    <Input
                      id="cognome"
                      value={leadFormData.cognome}
                      onChange={(e) => setLeadFormData({ ...leadFormData, cognome: e.target.value })}
                      required
                      placeholder="Il tuo cognome"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={leadFormData.email}
                    onChange={(e) => setLeadFormData({ ...leadFormData, email: e.target.value })}
                    required
                    placeholder="la.tua@email.com"
                  />
                </div>
                <div>
                  <Label htmlFor="telefono">Telefono *</Label>
                  <Input
                    id="telefono"
                    type="tel"
                    value={leadFormData.telefono}
                    onChange={(e) => setLeadFormData({ ...leadFormData, telefono: e.target.value })}
                    required
                    placeholder="+39 123 456 7890"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Invio in corso...' : 'Invia Richiesta'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          {/* Note di Urgenza */}
          {props.urgencyNote && (
            <div className={`font-semibold text-base md:text-lg ${
              isDarkTheme ? 'text-emerald-400' : 'text-emerald-600'
            }`}>
              <p>{props.urgencyNote}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// Problems Grid RDP Component
function ProblemsGridRDPComponent({ props }: { props: any }) {
  const problems = props.problems || [];

  return (
    <section 
      className="py-16 px-4"
      style={{ 
        backgroundColor: props.backgroundColor || '#1e293b',
        paddingTop: `${props.paddingY || 80}px`,
        paddingBottom: `${props.paddingY || 80}px`,
      }}
    >
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-5xl font-bold text-center mb-16" style={{ color: props.titleColor || '#ffffff' }}>
          {props.title || 'I Problemi che Affronti Ogni Giorno'}
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {problems.map((problem: any, index: number) => (
            <div key={index} className="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-blue-400 transition-all">
              <div className="text-5xl mb-4">{problem.icon || '💰'}</div>
              <h3 className="text-xl font-bold mb-3" style={{ color: props.textColor || '#e2e8f0' }}>
                {problem.title}
              </h3>
              <p style={{ color: props.textColor || '#e2e8f0' }}>
                {problem.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Method Timeline RDP Component
function MethodTimelineRDPComponent({ props }: { props: any }) {
  const steps = props.steps || [];

  return (
    <section 
      className="py-16 px-4"
      style={{ 
        backgroundColor: props.backgroundColor || '#0f172a',
        paddingTop: `${props.paddingY || 80}px`,
        paddingBottom: `${props.paddingY || 80}px`,
      }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4" style={{ color: props.textColor || '#ffffff' }}>
            {props.title || 'Come Funziona il Metodo'}
          </h2>
          {props.subtitle && (
            <p className="text-xl" style={{ color: props.textColor || '#ffffff' }}>
              {props.subtitle}
            </p>
          )}
        </div>
        <div className="space-y-12">
          {steps.map((step: any, index: number) => (
            <div key={index} className="flex items-start gap-8">
              <div className="flex-shrink-0">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-3xl font-black text-white">{step.number || `0${index + 1}`}</span>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-3" style={{ color: props.textColor || '#ffffff' }}>
                  {step.title}
                </h3>
                <p className="text-lg" style={{ color: props.textColor || '#ffffff' }}>
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Offer Ecosystem Component
function OfferEcosystemComponent({ props }: { props: any }) {
  const items = props.items || [];

  return (
    <section 
      className="py-16 px-4"
      style={{ 
        backgroundColor: props.backgroundColor || '#1e293b',
        paddingTop: `${props.paddingY || 80}px`,
        paddingBottom: `${props.paddingY || 80}px`,
      }}
    >
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-5xl font-bold text-center mb-16" style={{ color: props.titleColor || '#ffffff' }}>
          {props.title || 'L\'Ecosistema Completo che Ti Offro'}
        </h2>
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {items.map((item: any, index: number) => (
            <div key={index} className="bg-slate-800 p-8 rounded-xl border-2 border-blue-400">
              <div className="text-5xl mb-6">{item.icon || '💼'}</div>
              <h3 className="text-2xl font-bold mb-6" style={{ color: props.textColor || '#e2e8f0' }}>
                {item.title}
              </h3>
              <ul className="space-y-3">
                {(item.features || []).map((feature: string, fIndex: number) => (
                  <li key={fIndex} className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-green-400 flex-shrink-0 mt-1" />
                    <span style={{ color: props.textColor || '#e2e8f0' }}>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {props.totalValue && (
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: props.textColor || '#e2e8f0' }}>
              Valore Totale: <span className="text-4xl text-green-400">{props.totalValue}</span>
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

// Requirements Compare Component
function RequirementsCompareComponent({ props }: { props: any }) {
  const workWithItems = props.workWithItems || [];
  const dontWorkWithItems = props.dontWorkWithItems || [];

  return (
    <section 
      className="py-16 px-4"
      style={{ 
        backgroundColor: props.backgroundColor || '#0f172a',
        paddingTop: `${props.paddingY || 80}px`,
        paddingBottom: `${props.paddingY || 80}px`,
      }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-bold mb-4" style={{ color: props.textColor || '#ffffff' }}>
            {props.title || 'Requisiti per Potersi Candidare'}
          </h2>
          {props.subtitle && (
            <p className="text-xl" style={{ color: props.textColor || '#ffffff' }}>
              {props.subtitle}
            </p>
          )}
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          {/* Lavoriamo con chi */}
          <div className="bg-green-900/30 border-2 border-green-400 rounded-xl p-8">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-3" style={{ color: props.textColor || '#ffffff' }}>
              <span className="text-3xl">✅</span>
              {props.workWithTitle || '✅ LAVORIAMO CON CHI:'}
            </h3>
            <ul className="space-y-4">
              {workWithItems.map((item: string, index: number) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="text-green-400 text-xl flex-shrink-0">✓</span>
                  <span style={{ color: props.textColor || '#ffffff' }}>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* NON lavoriamo con chi */}
          <div className="bg-red-900/30 border-2 border-red-400 rounded-xl p-8">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-3" style={{ color: props.textColor || '#ffffff' }}>
              <span className="text-3xl">❌</span>
              {props.dontWorkWithTitle || '❌ NON LAVORIAMO CON CHI:'}
            </h3>
            <ul className="space-y-4">
              {dontWorkWithItems.map((item: string, index: number) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="text-red-400 text-xl flex-shrink-0">✗</span>
                  <span style={{ color: props.textColor || '#ffffff' }}>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

// Guarantee CTA Section Component
function GuaranteeCTASectionComponent({ props }: { props: any }) {
  return (
    <section 
      className="py-16 px-4"
      style={{ 
        background: props.backgroundColor || 'linear-gradient(to bottom, #1e40af, #1e3a8a)',
        paddingTop: `${props.paddingY || 80}px`,
        paddingBottom: `${props.paddingY || 80}px`,
      }}
    >
      <div className="max-w-5xl mx-auto text-center">
        {props.badge && (
          <div className="inline-block bg-yellow-400 text-black px-6 py-3 rounded-full text-lg font-bold mb-8">
            {props.badge}
          </div>
        )}
        <h2 className="text-3xl md:text-5xl font-bold mb-8" style={{ color: props.textColor || '#ffffff' }}>
          {props.title || 'GARANZIA "RISCHIO ZERO" 30 GIORNI'}
        </h2>
        <div className="bg-white/10 backdrop-blur-sm p-8 rounded-xl mb-8">
          <p className="text-lg md:text-xl mb-6" style={{ color: props.textColor || '#ffffff' }}>
            {props.description}
          </p>
          {props.guarantee && (
            <p className="text-xl font-bold" style={{ color: props.textColor || '#ffffff' }}>
              {props.guarantee}
            </p>
          )}
        </div>
        {props.ctaText && (
          <div className="space-y-4">
            <Button size="lg" className="text-xl px-12 py-8 bg-yellow-400 hover:bg-yellow-500 text-black font-black" asChild>
              <a href={props.ctaLink || '#'}>{props.ctaText}</a>
            </Button>
            {props.limitedSpots && (
              <p className="text-yellow-300 font-bold text-lg">
                {props.limitedSpots}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

// Lead Form Dialog Component
function LeadFormDialogComponent({ props }: { props: any }) {
  const fields = props.fields || [];

  return (
    <section 
      className="py-16 px-4"
      style={{ 
        backgroundColor: props.backgroundColor || '#ffffff',
        paddingTop: `${props.paddingY || 32}px`,
        paddingBottom: `${props.paddingY || 32}px`,
      }}
    >
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">
            {props.title || 'Candidati per l\'Ecosistema Completo'}
          </h2>
          {props.subtitle && (
            <p className="text-lg text-gray-600">{props.subtitle}</p>
          )}
        </div>
        <Card>
          <CardContent className="p-6">
            <form className="space-y-4">
              {fields.map((field: any, index: number) => (
                <div key={index}>
                  <Label htmlFor={field.name}>{field.label}{field.required && ' *'}</Label>
                  <Input 
                    id={field.name}
                    type={field.type || 'text'}
                    placeholder={field.label}
                    required={field.required}
                    className="mt-1"
                  />
                </div>
              ))}
              <Button type="submit" className="w-full" size="lg">
                {props.submitText || 'INVIA CANDIDATURA'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

// Hero Patrimonio Component
function HeroPatrimonioComponent({ props, isEditing, onClick }: ComponentProps) {
  const handleClick = () => {
    if (isEditing && onClick) {
      onClick();
    }
  };

  const getVideoEmbedUrl = (url: string, provider: string) => {
    if (!url) return '';
    if (provider === 'youtube') {
      const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
      return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=${props.videoAutoplay ? 1 : 0}&mute=${props.videoMuted ? 1 : 0}&controls=${props.videoControls ? 1 : 0}` : '';
    }
    if (provider === 'vimeo') {
      const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1];
      return videoId ? `https://player.vimeo.com/video/${videoId}?autoplay=${props.videoAutoplay ? 1 : 0}&muted=${props.videoMuted ? 1 : 0}` : '';
    }
    if (provider === 'wistia') {
      const videoId = url.match(/wistia\.com\/medias\/([a-zA-Z0-9]+)/)?.[1] || url.match(/wi\.st\/([a-zA-Z0-9]+)/)?.[1];
      return videoId ? `https://fast.wistia.net/embed/iframe/${videoId}?autoplay=${props.videoAutoplay ? 1 : 0}&muted=${props.videoMuted ? 1 : 0}&controlsVisibleOnLoad=${props.videoControls ? 'true' : 'false'}` : '';
    }
    return url;
  };

  return (
    <section 
      className={`relative py-16 lg:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden ${isEditing ? 'cursor-pointer hover:outline hover:outline-2 hover:outline-blue-500' : ''}`}
      style={{
        background: props.backgroundColor || 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        paddingTop: `${props.paddingY || 96}px`,
        paddingBottom: `${props.paddingY || 96}px`
      }}
      onClick={handleClick}
    >
      <div className="max-w-4xl mx-auto text-center">
        {props.badge && (
          <div 
            className="inline-block px-4 py-2 rounded-full text-sm font-semibold mb-6"
            style={{ backgroundColor: props.badgeColor || '#dbeafe', color: props.badgeTextColor || '#1e40af' }}
          >
            {props.badge}
          </div>
        )}

        <h1 
          className={`text-4xl md:text-6xl font-bold leading-tight`}
          style={{ 
            fontSize: props.titleSize === '4xl' ? '2.25rem' : 
                       props.titleSize === '5xl' ? '3rem' : 
                       props.titleSize === '6xl' ? '3.75rem' : '2.25rem',
            color: props.titleColor || '#0f172a',
            textAlign: props.textAlign || 'center',
            fontWeight: props.titleWeight || 'bold'
          }}
        >
          {props.title}{" "}
          {props.highlightedTitle && (
            <span 
              className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"
              style={{ color: props.highlightColor || 'transparent' }}
            >
              {props.highlightedTitle}
            </span>
          )}
        </h1>

        <p 
          className={`text-xl md:text-2xl leading-relaxed max-w-4xl mx-auto`}
          style={{ 
            fontSize: props.subtitleSize === 'lg' ? '1.125rem' : 
                       props.subtitleSize === 'xl' ? '1.25rem' : 
                       props.subtitleSize === '2xl' ? '1.5rem' : '1.25rem',
            color: props.subtitleColor || '#64748b',
            textAlign: props.textAlign || 'center'
          }}
        >
          {props.subtitle}
        </p>

        {/* Video Section */}
        {props.videoUrl && (
          <div className="my-8 max-w-4xl mx-auto">
            <div className="aspect-video rounded-lg overflow-hidden shadow-2xl">
              <iframe
                src={getVideoEmbedUrl(props.videoUrl, props.videoProvider || 'youtube')}
                className="w-full h-full"
                frameBorder="0"
                allowFullScreen
                title="Hero Video"
              />
            </div>
          </div>
        )}

        {props.ctaText && (
          <div style={{ textAlign: props.textAlign || 'center' }}>
            <Button 
              size="lg" 
              className="px-8 py-3 text-lg font-semibold shadow-lg"
              style={{ 
                backgroundColor: props.ctaBackgroundColor || '#ea580c',
                color: props.ctaTextColor || '#ffffff',
                marginTop: props.ctaSpacing || '32px'
              }}
              asChild
            >
              <a href={props.ctaLink || '#'}>
                {props.ctaText}
              </a>
            </Button>
          </div>
        )}

        {props.disclaimer && (
          <div 
            className="text-sm italic mt-4"
            style={{ 
              color: props.disclaimerColor || '#64748b',
              textAlign: props.textAlign || 'center',
              marginTop: props.disclaimerSpacing || '16px'
            }}
            dangerouslySetInnerHTML={{ __html: props.disclaimer }}
          />
        )}
      </div>
    </section>
  );
}

// ==================== HOMEPAGE COMPONENTS ====================

// Hero Home Component
function HeroHomeComponent({ props }: { props: any }) {
  const getVideoEmbedUrl = (url: string, provider: string) => {
    if (!url) return '';
    if (provider === 'youtube') {
      const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
      return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=${props.videoAutoplay ? 1 : 0}&mute=${props.videoMuted ? 1 : 0}&controls=${props.videoControls ? 1 : 0}` : '';
    }
    if (provider === 'vimeo') {
      const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1];
      return videoId ? `https://player.vimeo.com/video/${videoId}?autoplay=${props.videoAutoplay ? 1 : 0}&muted=${props.videoMuted ? 1 : 0}` : '';
    }
    if (provider === 'wistia') {
      const videoId = url.match(/wistia\.com\/medias\/([a-zA-Z0-9]+)/)?.[1] || url.match(/wi\.st\/([a-zA-Z0-9]+)/)?.[1];
      return videoId ? `https://fast.wistia.net/embed/iframe/${videoId}?autoplay=${props.videoAutoplay ? 1 : 0}&muted=${props.videoMuted ? 1 : 0}&controlsVisibleOnLoad=${props.videoControls ? 'true' : 'false'}` : '';
    }
    return url;
  };

  return (
    <section 
      className="relative overflow-hidden section-padding"
      style={{ 
        backgroundColor: props.backgroundColor || '#ffffff',
        paddingTop: `${props.paddingY || 64}px`,
        paddingBottom: `${props.paddingY || 64}px`
      }}
    >
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]"></div>
      <div className="relative max-w-7xl mx-auto container-padding text-center">
        <div className="space-y-8">
          <div>
            <Badge variant="outline" className="glass-card border-primary/20 text-primary bg-primary/5 px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-bold rounded-full shadow-lg max-w-[90vw] text-center break-words">
              <Zap className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
              <span className="leading-tight">{props.badge || 'PER IMPRENDITORI E AZIENDE AMBIZIOSE'}</span>
            </Badge>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-heading font-black tracking-tight leading-tight">
            {props.title || 'Smetti di Acquistare Clienti.'}
            <span className="block bg-gradient-to-r from-primary via-blue-600 to-indigo-600 bg-clip-text text-transparent mt-4">
              {props.highlightedTitle || 'Costruisci un Sistema che li Attrae.'}
            </span>
          </h1>

          <p className="text-responsive-md mt-8 text-slate-600 max-w-4xl mx-auto leading-relaxed font-medium">
            {props.subtitle || 'Implementiamo sistemi di marketing a risposta diretta per trasformare la tua spesa pubblicitaria in un asset aziendale prevedibile e profittevole.'}
          </p>

          {props.showVideo !== false && props.videoUrl && (
            <div className="mt-12">
              <Card className="max-w-5xl mx-auto glass-card border-2 border-primary/10 rounded-3xl overflow-hidden group hover-lift">
                <div className="aspect-video">
                  <iframe
                    src={getVideoEmbedUrl(props.videoUrl, props.videoProvider || 'youtube')}
                    className="w-full h-full"
                    frameBorder="0"
                    allowFullScreen
                    title="Hero Video"
                  />
                </div>
              </Card>
            </div>
          )}
          {props.showVideo !== false && !props.videoUrl && (
            <div className="mt-12">
              <Card className="max-w-5xl mx-auto glass-card border-2 border-primary/10 rounded-3xl overflow-hidden group hover-lift">
                <div className="aspect-video bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-slate-800"></div>
                  <img 
                    src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1280' height='720'%3E%3Crect fill='%231e293b' width='1280' height='720'/%3E%3Ctext x='50%25' y='50%25' font-size='20' fill='%23ffffff' text-anchor='middle' dy='.3em'%3EGuarda il Video Sales Letter%3C/text%3E%3C/svg%3E"
                    alt="Video Sales Letter" 
                    className="w-full h-full object-cover opacity-80 relative z-10"
                    width="1280"
                    height="720"
                    loading="eager"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60 transition-all duration-500 group-hover:from-black/40 group-hover:to-black/40 z-20"></div>
                  <div className="absolute z-30">
                    <PlayCircle className="h-20 w-20 sm:h-24 sm:w-24 text-white drop-shadow-2xl cursor-pointer"/>
                  </div>
                </div>
              </Card>
            </div>
          )}

          <div className="space-y-6">
            <div className="w-full max-w-md mx-auto">
              <Button asChild size="lg" className="w-full px-3 sm:px-6 md:px-8 py-4 sm:py-6 text-xs sm:text-sm md:text-base font-bold gradient-primary text-white shadow-2xl rounded-2xl hover-glow transition-all duration-300">
                <a href={props.ctaLink || '/candidatura'} className="flex flex-col sm:flex-row items-center justify-center gap-2 text-center leading-tight min-h-[3rem] sm:min-h-[4rem]">
                  <span className="break-words word-break text-center px-1 leading-tight text-[10px] sm:text-xs md:text-sm lg:text-base">
                    {props.ctaText || 'CANDIDATI PER LA SESSIONE STRATEGICA'}
                  </span>
                  <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 flex-shrink-0"/>
                </a>
              </Button>
            </div>
            <p className="text-sm text-slate-500 font-medium">{props.ctaSubtext || '🔥 Posti limitati. Approvazione manuale richiesta.'}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

// Social Proof Logos Component
function SocialProofLogosComponent({ props }: { props: any }) {
  const clientLogos = props.clientLogos || [
    { name: "Client A", logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='60'%3E%3Crect fill='%23e2e8f0' width='160' height='60'/%3E%3Ctext x='50%25' y='50%25' font-size='12' fill='%2364748b' text-anchor='middle' dy='.3em'%3ECLIENT A%3C/text%3E%3C/svg%3E" },
    { name: "Client B", logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='60'%3E%3Crect fill='%23e2e8f0' width='160' height='60'/%3E%3Ctext x='50%25' y='50%25' font-size='12' fill='%2364748b' text-anchor='middle' dy='.3em'%3ECLIENT B%3C/text%3E%3C/svg%3E" },
    { name: "Client C", logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='60'%3E%3Crect fill='%23e2e8f0' width='160' height='60'/%3E%3Ctext x='50%25' y='50%25' font-size='12' fill='%2364748b' text-anchor='middle' dy='.3em'%3ECLIENT C%3C/text%3E%3C/svg%3E" },
    { name: "Client D", logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='60'%3E%3Crect fill='%23e2e8f0' width='160' height='60'/%3E%3Ctext x='50%25' y='50%25' font-size='12' fill='%2364748b' text-anchor='middle' dy='.3em'%3ECLIENT D%3C/text%3E%3C/svg%3E" },
    { name: "Client E", logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='60'%3E%3Crect fill='%23e2e8f0' width='160' height='60'/%3E%3Ctext x='50%25' y='50%25' font-size='12' fill='%2364748b' text-anchor='middle' dy='.3em'%3ECLIENT E%3C/text%3E%3C/svg%3E" },
  ];

  return (
    <section 
      className="section-padding relative overflow-hidden"
      style={{
        backgroundColor: props.backgroundColor || '#ffffff',
        paddingTop: `${props.paddingY || 64}px`,
        paddingBottom: `${props.paddingY || 64}px`
      }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-50" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 50%, #eff6ff 100%)' }}></div>
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }}></div>

      <div className="relative max-w-7xl mx-auto container-padding">
        <div className="text-center space-y-12">
          {/* Header migliorato */}
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-xs font-semibold tracking-wider uppercase">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              {props.badge || 'Aziende che si fidano di noi'}
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-700 max-w-3xl mx-auto leading-tight">
              {props.title || 'SI FIDANO DI NOI AZIENDE E PROFESSIONISTI IN TUTTA ITALIA'}
            </h3>
          </div>

          {/* Logos con design migliorato */}
          <div className="relative">
            {/* Gradient Fade Edges */}
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white via-white/90 to-transparent z-10"></div>
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white via-white/90 to-transparent z-10"></div>

            {/* Logo Container con padding migliorato */}
            <div className="overflow-hidden py-8">
              <div className="flex animate-scroll-logos-slow whitespace-nowrap">
                {/* Prima serie di loghi */}
                <div className="flex items-center justify-center gap-12 sm:gap-16 lg:gap-20 mx-8">
                  {clientLogos.map((logo) => (
                    <div
                      key={logo.name}
                      className="relative group flex-shrink-0"
                    >
                      <div className="relative p-6 bg-white rounded-2xl shadow-lg border border-slate-100 hover:shadow-2xl hover:border-primary/20 transition-all duration-500 hover:-translate-y-2">
                        <img
                          src={logo.logo}
                          alt={logo.name}
                          className="h-12 sm:h-16 lg:h-20 w-auto object-contain filter grayscale group-hover:grayscale-0 transition-all duration-500 opacity-70 group-hover:opacity-100"
                          width="160"
                          height="60"
                          loading="lazy"
                          decoding="async"
                        />
                        {/* Subtle glow effect */}
                        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Seconda serie per continuità */}
                <div className="flex items-center justify-center gap-12 sm:gap-16 lg:gap-20 mx-8">
                  {clientLogos.map((logo) => (
                    <div
                      key={`${logo.name}-2`}
                      className="relative group flex-shrink-0"
                    >
                      <div className="relative p-6 bg-white rounded-2xl shadow-lg border border-slate-100 hover:shadow-2xl hover:border-primary/20 transition-all duration-500 hover:-translate-y-2">
                        <img
                          src={logo.logo}
                          alt={logo.name}
                          className="h-12 sm:h-16 lg:h-20 w-auto object-contain filter grayscale group-hover:grayscale-0 transition-all duration-500 opacity-70 group-hover:opacity-100"
                          width="160"
                          height="60"
                          loading="lazy"
                          decoding="async"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Terza serie per garantire smooth loop */}
                <div className="flex items-center justify-center gap-12 sm:gap-16 lg:gap-20 mx-8">
                  {clientLogos.map((logo) => (
                    <div
                      key={`${logo.name}-3`}
                      className="relative group flex-shrink-0"
                    >
                      <div className="relative p-6 bg-white rounded-2xl shadow-lg border border-slate-100 hover:shadow-2xl hover:border-primary/20 transition-all duration-500 hover:-translate-y-2">
                        <img
                          src={logo.logo}
                          alt={logo.name}
                          className="h-12 sm:h-16 lg:h-20 w-auto object-contain filter grayscale group-hover:grayscale-0 transition-all duration-500 opacity-70 group-hover:opacity-100"
                          width="160"
                          height="60"
                          loading="lazy"
                          decoding="async"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Stats Row - ispirato al design di riferimento */}
            <div className="mt-12 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center space-y-1">
                <div className="text-2xl sm:text-3xl font-black text-primary">{props.stat1Number || '500+'}</div>
                <div className="text-xs sm:text-sm text-slate-600 font-medium">{props.stat1Label || 'Clienti Soddisfatti'}</div>
              </div>
              <div className="text-center space-y-1">
                <div className="text-2xl sm:text-3xl font-black text-primary">{props.stat2Number || '98%'}</div>
                <div className="text-xs sm:text-sm text-slate-600 font-medium">{props.stat2Label || 'Tasso di Successo'}</div>
              </div>
              <div className="text-center space-y-1">
                <div className="text-2xl sm:text-3xl font-black text-primary">{props.stat3Number || '340%'}</div>
                <div className="text-xs sm:text-sm text-slate-600 font-medium">{props.stat3Label || 'ROI Medio'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}




// Problem Solution Component - VERSIONE OTTIMIZZATA CON FIX RESPONSIVE
function ProblemSolutionComponent({ props }: { props: any }) {
  const [activeTab, setActiveTab] = useState<'problem' | 'solution'>('problem');
  const problems = Array.isArray(props.problems) ? props.problems : [];
  const solutions = Array.isArray(props.solutions) ? props.solutions : [];

  return (
    <section 
      className="section-padding relative overflow-hidden"
      style={{
        background: props.backgroundColor || 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        paddingTop: `${props.paddingY || 96}px`,
        paddingBottom: `${props.paddingY || 96}px`
      }}
    >
      <div className="relative max-w-7xl mx-auto container-padding">
        {/* Header Section (invariato) */}
        <div className="text-center space-y-6 mb-16">
          <Badge className="border-primary/30 text-primary bg-white backdrop-blur-sm font-bold px-6 py-3 rounded-full text-sm shadow-lg">
            <AlertTriangle className="w-4 h-4 mr-2 inline" />
            {props.badge || '🎯 IL PUNTO DI SVOLTA'}
          </Badge>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading font-black text-slate-900 leading-tight">
            {props.title || (
              <>
                Da <span className="text-red-600">Problema</span>
                {' '}a{' '}
                <span className="text-emerald-600">Soluzione</span>
              </>
            )}
          </h2>

          <p className="text-xl md:text-2xl text-slate-600 leading-relaxed max-w-4xl mx-auto font-medium">
            {props.subtitle || 'Trasformiamo le tue sfide in opportunità concrete di crescita.'}
          </p>
        </div>

        {/* Tabs Navigation Semplificata (invariato) */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex items-center bg-slate-100 rounded-full p-1.5 shadow-inner">
            <button
              onClick={() => setActiveTab('problem')}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm sm:text-base transition-colors duration-300 ${
                activeTab === 'problem' 
                  ? 'bg-white text-red-600 shadow-md' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <XCircle className="h-5 w-5" />
              <span>Il Problema</span>
            </button>
            <button
              onClick={() => setActiveTab('solution')}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm sm:text-base transition-colors duration-300 ${
                activeTab === 'solution' 
                  ? 'bg-white text-emerald-600 shadow-md' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckCircle className="h-5 w-5" />
              <span>La Soluzione</span>
            </button>
          </div>
        </div>

        {/* Content Area con animazione leggera (invariato) */}
        <div className="relative min-h-[400px]">
          {/* Problem Cards */}
          {activeTab === 'problem' && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
              {problems.map((problem: any, index: number) => (
                <Card 
                  key={index} 
                  className="group bg-white border-2 border-transparent hover:border-red-300 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-red-100 flex-shrink-0">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg mb-2 break-words text-slate-900">
                          {problem.title || 'Problema'}
                        </h3>
                        <p className="text-sm text-slate-600 break-words leading-relaxed">
                          {problem.description || ''}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Solution Cards */}
          {activeTab === 'solution' && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
              {solutions.map((solution: any, index: number) => (
                <Card 
                  key={index} 
                  className="group bg-white border-2 border-transparent hover:border-emerald-300 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-emerald-100 flex-shrink-0">
                        <CheckCircle className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg mb-2 break-words text-slate-900">
                          {solution.title || 'Soluzione'}
                        </h3>
                        <p className="text-sm text-slate-600 break-words leading-relaxed">
                          {solution.description || ''}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Enhanced CTA Section - CON FIX */}
        {props.ctaText && (
          // 1. Ridotto il margine superiore da mt-16 a mt-12
          <div className="mt-12 text-center">
            <div className="inline-flex flex-col items-center gap-3">
              <p className="text-xl text-slate-700 font-semibold">
                {props.ctaSubtext || 'Pronto a trasformare il tuo business?'}
              </p>
              <Button 
                size="lg"
                // 2. Aggiunte classi responsive per il pulsante
                className="w-full sm:w-auto px-8 sm:px-12 py-6 sm:py-7 text-base sm:text-lg font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg rounded-2xl hover:shadow-xl hover:scale-105 group transition-all duration-300"
                asChild
              >
                <a href={props.ctaLink || '#'}>
                  {props.ctaText}
                  <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                </a>
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}





function SimpleTextHeroComponent({ props }: { props: any }) {
  const titleSizeMap: Record<string, string> = {
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
    '4xl': 'text-4xl',
    '5xl': 'text-5xl font-bold',
    '6xl': 'text-6xl font-bold',
  };
  const titleClass = titleSizeMap[props.titleSize || '5xl'] || 'text-5xl font-bold';

  const subtitleSizeMap: Record<string, string> = {
    'base': 'text-base',
    'lg': 'text-lg',
    'xl': 'text-xl',
  };
  const subtitleClass = subtitleSizeMap[props.subtitleSize || 'lg'] || 'text-lg';

  return (
    <section 
      className="py-16 px-4"
      style={{
        backgroundColor: props.backgroundColor || '#ffffff',
        paddingTop: `${props.paddingY || 64}px`,
        paddingBottom: `${props.paddingY || 64}px`,
      }}
    >
      <div className="max-w-4xl mx-auto text-center">
        {props.badgeText && (
          <Badge 
            variant="outline" 
            className="mb-6 font-semibold"
          >
            {props.badgeText}
          </Badge>
        )}

        <h1 
          className={`${titleClass} text-slate-800 mb-6`}
          style={{ color: props.titleColor || undefined }}
        >
          {props.title || 'Da Ferita a Forza'}
        </h1>

        <p 
          className={`${subtitleClass} text-slate-600 max-w-3xl mx-auto leading-relaxed`}
          style={{ color: props.subtitleColor || undefined }}
        >
          {props.subtitle || 'Ogni difficoltà può diventare la base della tua rinascita. Io stesso ho imparato che il dolore, se accolto, diventa energia vitale.'}
        </p>
      </div>
    </section>
  );
}


// Service Showcase Component (Ruota del Criceto)
function ServiceShowcaseComponent({ props }: { props: any }) {
  return (
    <section 
      className="section-padding"
      style={{
        background: props.backgroundColor || 'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #eff6ff 100%)',
        paddingTop: `${props.paddingY || 64}px`,
        paddingBottom: `${props.paddingY || 64}px`
      }}
    >
      <div className="max-w-7xl mx-auto container-padding">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="space-y-8">
            <Badge className="border-red-400/50 text-red-700 bg-red-50 font-bold px-6 py-3 rounded-full">{props.badge || '🎯 IL TUO VERO OSTACOLO'}</Badge>
            <h2 className="text-responsive-lg font-heading font-black text-slate-900">{props.title || 'Intrappolato nella "Ruota del Criceto"'}</h2>
            <p className="text-responsive-md text-slate-600 leading-relaxed font-medium">{props.subtitle || 'Passi le giornate a gestire emergenze, rincorrere clienti e sperare che il fatturato copra le spese. Lavori \'nel\' tuo business, non \'sul\' tuo business.'}</p>
            <div className="space-y-6">
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-red-50 border border-red-200">
                <XCircle className="h-6 w-6 text-red-500 mt-1 flex-shrink-0"/>
                <div>
                  <p className="font-bold text-slate-800">{props.errorTitle || 'L\'errore:'}</p>
                  <p className="text-slate-600">{props.errorDesc || 'Pensare che per crescere basti "lavorare di più" o trovare il "trucco segreto".'}</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-green-50 border border-green-200">
                <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0"/>
                <div>
                  <p className="font-bold text-slate-800">{props.solutionTitle || 'La Soluzione:'}</p>
                  <p className="text-slate-600">{props.solutionDesc || 'Installare un sistema operativo per la crescita che automatizza l\'acquisizione clienti e ti libera tempo per le attività strategiche.'}</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            {props.serviceTitle && (
              <Card className="glass-card hover-lift p-8 sm:p-10 rounded-3xl shadow-2xl border-0 h-full bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/60">
                <div className="space-y-6">
                  <Badge variant="secondary" className="bg-primary text-primary-foreground font-bold px-4 py-2 rounded-full">{props.serviceBadge || '🚀 Servizio Principale'}</Badge>
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-black text-slate-900">{props.serviceTitle}</h3>
                  <p className="text-slate-600 leading-relaxed font-medium">{props.serviceDescription}</p>
                  {props.serviceFeatures && (
                    <ul className="space-y-4">
                      {props.serviceFeatures.split(',').map((feature: string, i: number) => (
                        <li key={i} className="flex items-center gap-3 text-slate-800">
                          <CheckCircle className="h-5 w-5 text-primary flex-shrink-0"/>
                          <span className="font-medium">{feature.trim()}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <Button asChild size="lg" className="w-full py-6 sm:py-8 gradient-primary text-white font-bold rounded-2xl hover-glow transition-all duration-300">
                    <a href={props.ctaLink || '/candidatura'}>{props.ctaText || 'SCOPRI COME IMPLEMENTARLO'}</a>
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// Filter Section Component (Per chi è / Per chi NON è)
function FilterSectionComponent({ props }: { props: any }) {
  const WhoIsItFor = props.forWhoItems || [ "Imprenditori che vogliono un sistema prevedibile per generare clienti.", "Professionisti che vogliono smettere di competere sul prezzo.", "Aziende stanche delle agenzie tradizionali senza risultati misurabili.", "Chiunque sia pronto a seguire un metodo testato e a impegnarsi per la crescita." ];
  const WhoIsNotFor = props.notForWhoItems || [ "Chi cerca formule magiche o risultati immediati senza sforzo.", "Chi non è disposto a investire in una strategia a lungo termine.", "Aziende senza un prodotto/servizio di qualità.", "Chi non è aperto a nuove strategie e preferisce la propria comfort zone." ];

  return (
    <section 
      className="section-padding"
      style={{
        background: props.backgroundColor || 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 50%, #e0e7ff 100%)',
        paddingTop: `${props.paddingY || 64}px`,
        paddingBottom: `${props.paddingY || 64}px`
      }}
    >
      <div className="max-w-7xl mx-auto container-padding">
        <div className="space-y-16">
          <div className="text-center space-y-6">
            <Badge className="border-accent/50 text-accent-foreground bg-accent/20 font-bold px-6 py-3 rounded-full">{props.badge || '💯 TRASPARENZA'}</Badge>
            <h2 className="text-responsive-lg font-heading font-black text-slate-900">{props.title || 'Questo sistema non è per tutti'}</h2>
            <p className="text-responsive-md text-slate-600 max-w-3xl mx-auto leading-relaxed font-medium">{props.subtitle || 'Lavoriamo solo con un numero limitato di clienti per garantire risultati eccezionali.'}</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            <div>
              <Card className="glass-card p-8 sm:p-10 rounded-3xl h-full border-2 border-green-200 bg-gradient-to-br from-green-50 via-emerald-50/80 to-green-50 shadow-xl">
                <div className="space-y-6">
                  <h3 className="text-xl sm:text-2xl font-bold font-heading text-green-900 flex items-center gap-3">
                    <CheckCircle className="text-green-600"/>
                    {props.forWhoTitle || 'Fa per te se...'}
                  </h3>
                  <ul className="space-y-4 text-slate-700">
                    {WhoIsItFor.map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0"/>
                        <span className="font-medium">{typeof item === 'string' ? item : item.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            </div>

            <div>
              <Card className="glass-card p-8 sm:p-10 rounded-3xl h-full border-2 border-red-200 bg-gradient-to-br from-red-50 via-rose-50/80 to-red-50 shadow-xl">
                <div className="space-y-6">
                  <h3 className="text-xl sm:text-2xl font-bold font-heading text-red-900 flex items-center gap-3">
                    <XCircle className="text-red-600"/>
                    {props.notForWhoTitle || 'NON fa per te se...'}
                  </h3>
                  <ul className="space-y-4 text-slate-700">
                    {WhoIsNotFor.map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <XCircle className="h-5 w-5 text-red-500 mt-1 flex-shrink-0"/>
                        <span className="font-medium">{typeof item === 'string' ? item : item.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Testimonials Grid Component
function TestimonialsGridComponent({ props }: { props: any }) {
  const testimonials = props.testimonials || [
    { name: "Marco Rossi", role: "CEO, TechStart SRL", content: "Le strategie che ci hanno fornito hanno portato a un aumento del 340% nelle conversioni in soli 3 mesi. Incredibile.", rating: 5, avatar: "MR" },
    { name: "Laura Bianchi", role: "Marketing Director, Fashion Hub", content: "Finalmente un partner che capisce le nostre esigenze e porta risultati concreti. Il team è professionale e sempre disponibile.", rating: 5, avatar: "LB" },
    { name: "Andrea Verdi", role: "Founder, GreenTech Solutions", content: "Il ROI delle campagne è triplicato in 6 mesi. Consiglio vivamente!", rating: 5, avatar: "AV" },
  ];

  return (
    <section 
      className="section-padding"
      style={{
        backgroundColor: props.backgroundColor || '#ffffff',
        paddingTop: `${props.paddingY || 64}px`,
        paddingBottom: `${props.paddingY || 64}px`
      }}
    >
      <div className="max-w-7xl mx-auto container-padding">
        <div className="space-y-16">
          <div className="text-center space-y-6">
            <h2 className="text-responsive-lg font-heading font-black text-slate-900">{props.title || 'Non fidarti di noi, fidati dei loro risultati'}</h2>
            <p className="text-responsive-md text-slate-600 max-w-3xl mx-auto leading-relaxed font-medium">{props.subtitle || 'Aziende e professionisti che hanno installato il nostro sistema di crescita.'}</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index}>
                <Card className="glass-card hover-lift p-6 sm:p-8 h-full border-0 shadow-xl group">
                  <div className="space-y-6">
                    <div className="flex gap-1">
                      {Array(testimonial.rating).fill(0).map((_, j) => (
                        <Star key={j} className="h-5 w-5 text-yellow-400 fill-yellow-400"/>
                      ))}
                    </div>
                    <p className="text-slate-600 leading-relaxed italic font-medium">"{testimonial.content}"</p>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{testimonial.name}</div>
                        <div className="text-sm text-primary font-medium">{testimonial.role}</div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}


// ==================== CHI SIAMO COMPONENTS ====================


// BuilderPageRenderer.tsx -> Aggiungi questa nuova funzione

function LongFormComponent({ props }: { props: any }) {
  const contentBlocks = props.contentBlocks || [];

  // Funzione per convertire la sintassi semplificata in HTML sicuro
  const parseTextToHtml = (text = '') => {
    // Gestisce newline prima di altre conversioni
    let html = text.replace(/\n/g, '<br />');

    // Converte **testo** in <strong>testo</strong>
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'); 

    // Converte [testo](link) in <a href="link">testo</a>
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-blue-600 underline" target="_blank" rel="noopener noreferrer">$1</a>');

    return html;
  };

  const renderBlock = (block: any, index: number) => {
    const createMarkup = (text: string) => ({ __html: parseTextToHtml(text) });

    switch (block.type) {
      case 'main-heading':
        return (
          <h1 
            key={index} 
            className="text-4xl font-bold text-slate-800 mb-6"
            dangerouslySetInnerHTML={createMarkup(block.text || 'Titolo Principale')}
          />
        );

      case 'sub-heading':
        return (
          <h2 
            key={index} 
            className="text-2xl font-bold text-slate-800 mt-10 mb-4 border-l-4 border-blue-500 pl-4"
            dangerouslySetInnerHTML={createMarkup(block.text || 'Sottotitolo di Sezione')}
          />
        );

      case 'paragraph':
        return (
          <p 
            key={index} 
            className="text-lg text-slate-600 leading-relaxed mb-6"
            dangerouslySetInnerHTML={createMarkup(block.text || 'Paragrafo di testo.')}
          />
        );

      case 'emphasis-paragraph':
        return (
          <p 
            key={index} 
            className="text-lg text-blue-800 bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg mb-6"
            dangerouslySetInnerHTML={createMarkup(block.text || 'Paragrafo con enfasi.')}
          />
        );

      case 'list':
        const items = (block.text || '').split('\n').filter((item: string) => item.trim() !== '');
        return (
          <ul key={index} className="space-y-3 my-6">
            {items.map((item: string, i: number) => (
              <li key={i} className="flex items-start">
                <CheckCircle className="h-6 w-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                <span className="text-lg text-slate-700 leading-relaxed" dangerouslySetInnerHTML={createMarkup(item)} />
              </li>
            ))}
          </ul>
        );

      case 'callout':
        return (
          <div key={index} className="bg-slate-100 border-l-4 border-slate-400 p-6 my-8 rounded-r-lg">
             <p 
                className="text-lg text-slate-700 leading-relaxed italic"
                dangerouslySetInnerHTML={createMarkup(block.text || 'Testo evidenziato nel box.')}
             />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <section 
      style={{
        backgroundColor: props.backgroundColor || '#ffffff',
        paddingTop: `${props.paddingY || 64}px`,
        paddingBottom: `${props.paddingY || 64}px`,
      }}
    >
      <div className="max-w-3xl mx-auto px-4">
        {contentBlocks.map(renderBlock)}
      </div>
    </section>
  );
}

// Hero Chi Siamo Component
function HeroChiSiamoComponent({ props }: { props: any }) {
  const getVideoEmbedUrl = (url: string, provider: string) => {
    if (!url) return '';
    if (provider === 'youtube') {
      const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
      return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=${props.videoAutoplay ? 1 : 0}&mute=${props.videoMuted ? 1 : 0}&controls=${props.videoControls ? 1 : 0}` : '';
    }
    if (provider === 'vimeo') {
      const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1];
      return videoId ? `https://player.vimeo.com/video/${videoId}?autoplay=${props.videoAutoplay ? 1 : 0}&muted=${props.videoMuted ? 1 : 0}` : '';
    }
    if (provider === 'wistia') {
      const videoId = url.match(/wistia\.com\/medias\/([a-zA-Z0-9]+)/)?.[1] || url.match(/wi\.st\/([a-zA-Z0-9]+)/)?.[1];
      return videoId ? `https://fast.wistia.net/embed/iframe/${videoId}?autoplay=${props.videoAutoplay ? 1 : 0}&muted=${props.videoMuted ? 1 : 0}&controlsVisibleOnLoad=${props.videoControls ? 'true' : 'false'}` : '';
    }
    return url;
  };

  return (
    <section 
      className="section-padding relative overflow-hidden"
      style={{ 
        background: props.backgroundColor || 'linear-gradient(135deg, #ffffff 0%, #eff6ff 50%, #e0e7ff 100%)',
        paddingTop: `${props.paddingY || 64}px`,
        paddingBottom: `${props.paddingY || 64}px`
      }}
    >
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]"></div>
      <div className="relative max-w-6xl mx-auto container-padding text-center">
        <div className="space-y-8">
          <div>
            <Badge className="glass-card border-primary/20 text-primary bg-primary/5 px-6 py-3 font-bold rounded-full shadow-lg">
              <Heart className="w-4 h-4 mr-2" />
              {props.badge || 'LA NOSTRA MISSIONE'}
            </Badge>
          </div>

          <h1 className="text-responsive-xl font-heading font-black tracking-tight leading-tight">
            {props.title || 'Costruiamo'} <span className="bg-gradient-to-r from-primary via-blue-600 to-indigo-600 bg-clip-text text-transparent">{props.titleHighlight || 'Sistemi di Crescita'}</span>{props.titleEnd || ', non solo Campagne.'}
          </h1>

          <p className="text-responsive-md text-slate-600 max-w-4xl mx-auto leading-relaxed font-medium">
            {props.subtitle || 'Aiutiamo le aziende ambiziose a liberarsi dalla dipendenza dalle agenzie tradizionali, implementando asset di marketing proprietari che generano clienti in modo prevedibile e scalabile.'}
          </p>

          {/* Video Section */}
          {props.videoUrl && (
            <div className="mt-12 max-w-4xl mx-auto">
              <div className="aspect-video rounded-lg overflow-hidden shadow-2xl">
                <iframe
                  src={getVideoEmbedUrl(props.videoUrl, props.videoProvider || 'youtube')}
                  className="w-full h-full"
                  frameBorder="0"
                  allowFullScreen
                  title="Hero Video"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// Values Grid Component
function ValuesGridComponent({ props }: { props: any }) {
  const IconMap: any = { Target, Lightbulb, Shield, Users };

  const values = props.values || [
    { icon: "Target", title: "Orientati ai Risultati", description: "Ogni strategia è misurata sul ROI concreto per i nostri clienti. Non promettiamo, dimostriamo.", color: "blue" },
    { icon: "Lightbulb", title: "Innovazione Tecnologica", description: "Usiamo la logica ingegneristica per creare sistemi di marketing scientifici e replicabili.", color: "amber" },
    { icon: "Shield", title: "Trasparenza Totale", description: "Comunicazione chiara, report dettagliati e nessuna sorpresa. Il tuo successo è misurabile.", color: "emerald" },
    { icon: "Users", title: "Partnership Strategica", description: "Non siamo fornitori, siamo partner investiti nella tua crescita a lungo termine.", color: "purple" }
  ];

  return (
    <section 
      className="section-padding"
      style={{
        backgroundColor: props.backgroundColor || '#ffffff',
        paddingTop: `${props.paddingY || 64}px`,
        paddingBottom: `${props.paddingY || 64}px`
      }}
    >
      <div className="max-w-7xl mx-auto container-padding">
        <div className="space-y-16">
          <div className="text-center space-y-6">
            <h2 className="text-responsive-lg font-heading font-black text-slate-900">{props.title || 'I Pilastri del Nostro Metodo'}</h2>
            <p className="text-responsive-md text-slate-600 max-w-3xl mx-auto leading-relaxed font-medium">{props.subtitle || 'Ogni nostra azione si basa su questi quattro principi fondamentali che guidano il nostro approccio al business.'}</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {values.map((value, index) => {
              const Icon = IconMap[value.icon] || Target;
              return (
                <div key={value.title}>
                  <Card className="glass-card hover-lift p-6 sm:p-8 h-full border-0 shadow-xl text-center group">
                    <div className="space-y-6">
                      <div className={`inline-block p-4 rounded-2xl transition-colors ${
                        value.color === 'blue' ? 'bg-blue-100 group-hover:bg-blue-200' :
                        value.color === 'amber' ? 'bg-amber-100 group-hover:bg-amber-200' :
                        value.color === 'emerald' ? 'bg-emerald-100 group-hover:bg-emerald-200' :
                        'bg-purple-100 group-hover:bg-purple-200'
                      }`}>
                        <Icon className={`h-8 w-8 ${
                          value.color === 'blue' ? 'text-blue-600' :
                          value.color === 'amber' ? 'text-amber-600' :
                          value.color === 'emerald' ? 'text-emerald-600' :
                          'text-purple-600'
                        }`} />
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-slate-900">{value.title}</h3>
                      <p className="text-slate-600">{value.description}</p>
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

// Company Quote Component
function CompanyQuoteComponent({ props }: { props: any }) {
  return (
    <section 
      className="py-16 relative overflow-hidden"
      style={{
        backgroundColor: props.backgroundColor || '#f8fafc',
        paddingTop: `${props.paddingY || 80}px`,
        paddingBottom: `${props.paddingY || 80}px`
      }}
    >
      <div className="max-w-4xl mx-auto px-4 text-center">
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-blue-50 to-indigo-50 p-12">
          <CardContent className="p-0">
            <Quote className="h-12 w-12 text-primary mx-auto mb-6" />
            <blockquote className="text-2xl md:text-3xl font-bold text-slate-900 mb-8 leading-relaxed italic">
              "{props.quote || 'La nostra missione...'}"
            </blockquote>
            {props.author && (
              <div className="mt-6">
                <p className="font-semibold text-lg text-slate-900">{props.author}</p>
                {props.authorTitle && (
                  <p className="text-slate-600">{props.authorTitle}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

// Timeline Milestones Component
function TimelineMilestonesComponent({ props }: { props: any }) {
  const milestones = props.milestones || [];

  const iconMap: Record<string, any> = {
    Lightbulb, Users, TrendingUp, Award, Target, Shield
  };

  return (
    <section 
      className="section-padding"
      style={{
        background: props.backgroundColor || 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 50%, #e0e7ff 100%)',
        paddingTop: `${props.paddingY || 64}px`,
        paddingBottom: `${props.paddingY || 64}px`
      }}
    >
      <div className="max-w-5xl mx-auto container-padding">
        <div className="space-y-16">
          <div className="text-center space-y-6">
            <h2 className="text-responsive-lg font-heading font-black text-slate-900">{props.title || 'La Nostra Storia in Breve'}</h2>
            <p className="text-responsive-md text-slate-600 max-w-3xl mx-auto leading-relaxed font-medium">{props.subtitle || 'Dal sogno iniziale alla realtà di oggi: ecco come abbiamo costruito un metodo che funziona davvero.'}</p>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 sm:left-8 top-0 w-0.5 h-full bg-gradient-to-b from-primary via-blue-500 to-indigo-600 rounded-full hidden md:block"></div>

            <div className="space-y-8 sm:space-y-12">
              {milestones.map((milestone: any, index: number) => {
                const IconComponent = iconMap[milestone.icon] || Lightbulb;

                return (
                  <div key={index}>
                    <Card className="glass-card hover-lift p-6 sm:p-8 ml-0 md:ml-20 border-0 shadow-xl group relative">
                      {/* Timeline dot */}
                      <div className="absolute -left-20 top-8 hidden md:flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-blue-600 rounded-full border-4 border-white shadow-xl group-hover:scale-110 transition-transform">
                        <IconComponent className="h-8 w-8 text-white" />
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-4 md:hidden">
                          <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-primary to-blue-600 rounded-full">
                            <IconComponent className="h-6 w-6 text-white" />
                          </div>
                          <Badge className="bg-primary/10 text-primary font-bold px-4 py-2 rounded-full">
                            {milestone.year}
                          </Badge>
                        </div>

                        <div className="hidden md:block">
                          <Badge className="bg-primary/10 text-primary font-bold px-4 py-2 rounded-full">
                            {milestone.year}
                          </Badge>
                        </div>

                        <h3 className="font-bold text-xl sm:text-2xl text-slate-900 group-hover:text-primary transition-colors">
                          {milestone.title}
                        </h3>
                        <p className="text-slate-600 leading-relaxed font-medium">
                          {milestone.description}
                        </p>
                      </div>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Team Grid Component
function TeamGridComponent({ props }: { props: any }) {
  const team = props.team || [];

  return (
    <section 
      className="py-16"
      style={{
        backgroundColor: props.backgroundColor || '#f8fafc',
        paddingTop: `${props.paddingY || 80}px`,
        paddingBottom: `${props.paddingY || 80}px`
      }}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          {props.badge && (
            <Badge variant="outline" className="mb-4">{props.badge}</Badge>
          )}
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            {props.title || 'Il Nostro Team'}
          </h2>
          {props.subtitle && <p className="text-xl text-slate-600">{props.subtitle}</p>}
        </div>

        <div className={`grid gap-8 ${team.length === 4 ? 'md:grid-cols-2 lg:grid-cols-4' : team.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
          {team.map((member: any, index: number) => (
            <Card key={index} className="hover:shadow-xl transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="mb-6">
                  <img
                    src={member.image || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23e2e8f0' width='200' height='200'/%3E%3Ctext x='50%25' y='50%25' font-size='60' fill='%2364748b' text-anchor='middle' dy='.3em'%3E%3F%3C/text%3E%3C/svg%3E"}
                    alt={member.name}
                    className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-primary/20"
                    width="200"
                    height="200"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">{member.name}</h3>
                <p className="text-primary font-semibold mb-4">{member.title}</p>
                <p className="text-slate-600 text-sm leading-relaxed mb-4">{member.bio}</p>
                {member.specialties && member.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-2 justify-center">
                    {member.specialties.map((specialty: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-xs">{specialty}</Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// ==================== SERVIZI COMPONENTS ====================

// Hero Servizi Component
function HeroServiziComponent({ props }: { props: any }) {
  const getVideoEmbedUrl = (url: string, provider: string) => {
    if (!url) return '';
    if (provider === 'youtube') {
      const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
      return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=${props.videoAutoplay ? 1 : 0}&mute=${props.videoMuted ? 1 : 0}&controls=${props.videoControls ? 1 : 0}` : '';
    }
    if (provider === 'vimeo') {
      const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1];
      return videoId ? `https://player.vimeo.com/video/${videoId}?autoplay=${props.videoAutoplay ? 1 : 0}&muted=${props.videoMuted ? 1 : 0}` : '';
    }
    if (provider === 'wistia') {
      const videoId = url.match(/wistia\.com\/medias\/([a-zA-Z0-9]+)/)?.[1] || url.match(/wi\.st\/([a-zA-Z0-9]+)/)?.[1];
      return videoId ? `https://fast.wistia.net/embed/iframe/${videoId}?autoplay=${props.videoAutoplay ? 1 : 0}&muted=${props.videoMuted ? 1 : 0}&controlsVisibleOnLoad=${props.videoControls ? 'true' : 'false'}` : '';
    }
    return url;
  };

  return (
    <section 
      className="py-12 md:py-16 text-center"
      style={{
        backgroundColor: props.backgroundColor || '#f8fafc',
        paddingTop: `${props.paddingY || 80}px`,
        paddingBottom: `${props.paddingY || 64}px`
      }}
    >
      <div className="max-w-4xl mx-auto px-4">
        {props.badge && (
          <Badge className="mb-4">{props.badge}</Badge>
        )}

        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 mb-6">
          {props.title}
          {props.highlightedTitle && (
            <span className="block bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent mt-2">
              {props.highlightedTitle}
            </span>
          )}
        </h1>

        {props.subtitle && (
          <p className="text-xl text-slate-600 leading-relaxed mb-6">
            {props.subtitle}
          </p>
        )}

        {/* Video Section */}
        {props.videoUrl && (
          <div className="mt-8 max-w-4xl mx-auto">
            <div className="aspect-video rounded-lg overflow-hidden shadow-2xl">
              <iframe
                src={getVideoEmbedUrl(props.videoUrl, props.videoProvider || 'youtube')}
                className="w-full h-full"
                frameBorder="0"
                allowFullScreen
                title="Hero Video"
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// Services Cards Component
function ServicesCardsComponent({ props }: { props: any }) {
  const { data: servicesFromDB = [] } = useQuery<any[]>({
    queryKey: ['/api/services/public'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/services/public');
        if (!res.ok) {
          console.warn('Services API failed, using fallback');
          return [];
        }
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error fetching services:', error);
        return [];
      }
    },
    retry: 1,
    staleTime: 5 * 60 * 1000
  });

  // Filtra servizi attivi dalla categoria specificata - con controllo sicuro
  const filteredServices = Array.isArray(servicesFromDB) ? servicesFromDB.filter((s: any) => {
    if (!s.isActive) return false;
    if (props.category === 'main') return s.category === 'main';
    if (props.category === 'additional') return s.category === 'additional';
    return true; // 'all' o non specificato
  }) : [];

  const services = props.useDatabase !== false ? filteredServices : (props.services || []);

  const iconMap: { [key: string]: React.ElementType } = {
    Palette, Rocket, BarChart, Search, Megaphone, Globe, Smartphone, Shield, Target, Users, Award, Zap
  };

  return (
    <section 
      className="py-16"
      style={{
        backgroundColor: props.backgroundColor || '#ffffff',
        paddingTop: `${props.paddingY || 80}px`,
        paddingBottom: `${props.paddingY || 80}px`
      }}
    >
      <div className="max-w-7xl mx-auto px-4">
        {props.title && (
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              {props.title}
            </h2>
            {props.subtitle && <p className="text-xl text-slate-600">{props.subtitle}</p>}
          </div>
        )}

        <div className={`grid gap-8 ${services.length === 3 ? 'lg:grid-cols-3' : services.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'}`}>
          {services.map((service: any, index: number) => {
            const Icon = iconMap[service.icon] || Zap;
            return (
              <Card key={index} className={`flex flex-col relative overflow-hidden ${service.isPopular ? 'border-2 border-primary shadow-2xl hover:shadow-3xl scale-105' : 'border-0 shadow-xl hover:shadow-2xl'} transition-all duration-500 bg-gradient-to-br from-background via-background to-primary/5 hover:-translate-y-2`}>
                {service.isPopular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 text-white border-0 shadow-lg z-10 px-4 py-1.5 font-bold animate-pulse">
                    ⭐ Più Richiesto
                  </Badge>
                )}
                <CardContent className="p-8 flex flex-col flex-grow">
                  <div className="mb-6 p-5 bg-gradient-to-br from-primary/20 via-primary/15 to-accent/10 rounded-2xl w-fit shadow-inner">
                    <Icon className="h-12 w-12 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-4 leading-tight">{service.title}</h3>
                  <p className="text-muted-foreground/90 mb-6 flex-grow leading-relaxed text-sm">{service.shortDescription || service.description}</p>

                  {service.features && service.features.length > 0 && (
                    <ul className="space-y-3 mb-6">
                      {service.features.map((feature: any, i: number) => (
                        <li key={i} className="flex items-start gap-3 group/item">
                          <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0 group-hover/item:scale-110 transition-transform" />
                          <span className="text-foreground/80 text-sm font-medium">{typeof feature === 'object' ? feature.text : feature}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {service.price && (
                    <div className="mb-6 pb-6 border-b border-border/50">
                      <div className="text-4xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        {service.price}
                      </div>
                      {service.priceDescription && (
                        <span className="text-sm text-muted-foreground font-medium">
                          {service.priceDescription}
                        </span>
                      )}
                    </div>
                  )}

                  <Button 
                    className={`w-full mt-auto font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 ${service.isPopular ? 'bg-gradient-to-r from-primary via-primary/90 to-accent hover:from-primary/90 hover:to-accent/90' : ''}`}
                    asChild
                  >
                    <a href={service.landingPageSlug ? `/${service.landingPageSlug}` : (service.ctaLink || '/contatti')}>
                      {service.ctaText || 'Scopri di più'}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// Process Steps Component
function ProcessStepsComponent({ props }: { props: any }) {
  const steps = props.steps || [];
  const badgeColors = [
    { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', circle: 'bg-gradient-to-br from-emerald-500 to-emerald-600' },
    { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', circle: 'bg-gradient-to-br from-blue-500 to-blue-600' },
    { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200', circle: 'bg-gradient-to-br from-purple-500 to-purple-600' },
    { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200', circle: 'bg-gradient-to-br from-orange-500 to-orange-600' }
  ];

  return (
    <section className="py-16 md:py-20" style={{ backgroundColor: props.backgroundColor }}>
      <div className="max-w-7xl mx-auto container-padding">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
            {props.title} <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{props.titleHighlight}</span>
          </h2>
          {props.subtitle && <p className="mt-4 text-lg text-slate-600">{props.subtitle}</p>}
        </div>

        <div className="mt-20 relative">
          {/* Vertical timeline line for desktop */}
          <div className="absolute left-1/2 -translate-x-1/2 top-0 w-1 h-full bg-gradient-to-b from-blue-500 via-indigo-500 to-blue-600 rounded-full hidden md:block shadow-lg" aria-hidden="true">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full animate-pulse opacity-50"></div>
          </div>

          <div className="space-y-16 md:space-y-20">
            {steps.map((step: any, index: number) => {
              const colors = badgeColors[index % 4];
              const isEven = index % 2 === 0;

              return (
                <div key={index} className="md:grid md:grid-cols-2 md:gap-12 items-center relative group">
                  <div className={`${!isEven ? 'md:order-2 md:text-left' : 'md:text-right'} space-y-4`}>
                    <div className="flex items-center gap-3 md:justify-end">
                      <Badge className={`text-sm font-medium px-4 py-2 ${colors.bg} ${colors.text} ${colors.border}`}>
                        Fase {step.number || `0${index + 1}`}
                      </Badge>
                    </div>
                    <h3 className="font-bold text-2xl md:text-3xl text-slate-900 group-hover:text-blue-600 transition-colors duration-300">
                      {step.title}
                    </h3>
                    <p className="text-slate-600 text-lg leading-relaxed">{step.description}</p>
                    {step.guaranteeText && (
                      <div className="flex items-center gap-2 text-blue-600 font-medium group-hover:gap-3 transition-all duration-300">
                        <ArrowRight className="h-4 w-4" />
                        <span className="text-sm">{step.guaranteeText}</span>
                      </div>
                    )}
                  </div>

                  {/* Desktop circle indicator */}
                  <div className="hidden md:block">
                    <div className={`absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full border-4 border-white shadow-xl flex items-center justify-center text-white font-bold text-xl group-hover:scale-110 transition-all duration-300 ${colors.circle}`}>
                      <span className="relative z-10">{step.number || `0${index + 1}`}</span>
                      <div className="absolute inset-0 rounded-full bg-white/20 group-hover:bg-white/30 transition-colors duration-300"></div>
                    </div>
                  </div>

                  {/* Mobile card design */}
                  <div className="md:hidden">
                    <Card className="p-6 bg-white/80 backdrop-blur-sm border-2 border-slate-100 hover:border-blue-200 hover:shadow-lg transition-all duration-300">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg mb-4 ${colors.circle}`}>
                        {step.number || `0${index + 1}`}
                      </div>
                      <Badge className={`mb-3 ${colors.bg} ${colors.text} ${colors.border}`}>
                        Fase {step.number || `0${index + 1}`}
                      </Badge>
                      <h3 className="font-bold text-xl mb-2 text-slate-900">{step.title}</h3>
                      <p className="text-slate-600 leading-relaxed">{step.description}</p>
                    </Card>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

// Sortable Component Wrapper for drag and drop in preview
function SortableComponent({ 
  component, 
  isEditing, 
  onComponentClick, 
  onComponentDelete, 
  isSelected 
}: {
  component: ComponentData;
  isEditing?: boolean;
  onComponentClick?: (componentId: string) => void;
  onComponentDelete?: (componentId: string) => void;
  isSelected?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: component.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const componentContent = renderComponent(component, false, onComponentClick, onComponentDelete, isSelected);

  if (!isEditing) {
    return componentContent;
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        onComponentClick?.(component.id);
      }}
    >
      {componentContent}

      {/* Overlay per editing */}
      <div className="absolute inset-0 bg-transparent group-hover:bg-primary/5 transition-colors cursor-pointer" />

      {/* Drag handle */}
      <div 
        {...attributes} 
        {...listeners}
        className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
      >
        <Button 
          size="sm" 
          variant="secondary"
          className="h-8 w-8 p-0"
        >
          ⋮⋮
        </Button>
      </div>

      {/* Toolbar di editing */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <Button 
          size="sm" 
          variant="secondary"
          className="h-8 w-8 p-0"
          onClick={(e) => {
            e.stopPropagation();
            onComponentClick?.(component.id);
          }}
        >
          ✏️
        </Button>
        <Button 
          size="sm" 
          variant="destructive"
          className="h-8 w-8 p-0"
          onClick={(e) => {
            e.stopPropagation();
            onComponentDelete?.(component.id);
          }}
        >
          🗑️
        </Button>
      </div>

      {/* Indicatore di selezione */}
      {isSelected && (
        <div className="absolute top-0 left-0 bg-primary text-primary-foreground px-2 py-1 text-xs font-medium rounded-br">
          Modifica in corso
        </div>
      )}
    </div>
  );
}

// Empty drop zone for when no components exist
function EmptyDropZone() {
  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas-drop-zone',
  });

  return (
    <div ref={setNodeRef} className="w-full max-w-2xl mx-auto">
      <Card className={`border-dashed border-2 ${isOver ? 'border-primary bg-primary/10 scale-105' : 'border-muted-foreground/20 hover:border-muted-foreground/40'} transition-all duration-200`}>
        <CardContent className="p-16 text-center">
          <div className={`p-4 rounded-full bg-muted/50 w-fit mx-auto mb-4 ${isOver ? 'scale-110' : ''} transition-transform`}>
            <Layout className="h-16 w-16 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Inizia a Costruire</h3>
          <p className="text-muted-foreground">
            Trascina i componenti dalla libreria a sinistra per iniziare a creare la tua pagina
          </p>
          {isOver && (
            <p className="text-primary font-medium mt-4 animate-pulse">
              Rilascia qui per aggiungere
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// End drop zone for adding components at the end
function EndDropZone() {
  const { setNodeRef, isOver } = useDroppable({
    id: 'end-drop-zone',
  });

  return (
    <div ref={setNodeRef} className="w-full mx-auto p-4">
      <div className={`border-dashed border-2 rounded-lg p-8 text-center transition-all duration-200 ${
        isOver ? 'border-primary bg-primary/10' : 'border-muted-foreground/20 hover:border-muted-foreground/40'
      }`}>
        <p className="text-muted-foreground text-sm">
          {isOver ? 'Rilascia qui per aggiungere' : 'Trascina qui per aggiungere componenti'}
        </p>
      </div>
    </div>
  );
}

// Main Renderer
function renderComponent(
  component: ComponentData, 
  isEditing?: boolean, 
  onComponentClick?: (componentId: string) => void,
  onComponentDelete?: (componentId: string) => void,
  isSelected?: boolean
) {
  const renderers: Record<string, (props: any, children?: React.ReactNode) => JSX.Element> = {
    // Layout Components
    section: (props, children) => <SectionComponent props={props}>{children}</SectionComponent>,
    column: (props, children) => <ColumnComponent props={props}>{children}</ColumnComponent>,
    container: (props, children) => <ContainerComponent props={props} isEditing={isEditing}>{children}</ContainerComponent>,

    // Text Widgets
    heading: (props) => <HeadingComponent props={props} />,
    text: (props) => <TextComponent props={props} />,

    // Media Widgets
    image: (props) => <ImageComponent props={props} />,
    video: (props) => <VideoComponent props={props} />,

    // Interactive Widgets
    button: (props) => <ButtonComponent props={props} />,
    form: (props) => <FormComponent props={props} />,
    map: (props) => <MapComponent props={props} />,

    // List Widgets
    'icon-list': (props) => <IconListComponent props={props} />,
    checklist: (props) => <ChecklistComponent props={props} />,

    // Layout Widgets
    spacer: (props) => <SpacerComponent props={props} />,
    divider: (props) => <DividerComponent props={props} />,

    // Navigation Widgets
    'nav-menu': (props) => <NavMenuComponent props={props} />,

    // Content Widgets
    features: (props) => <FeaturesComponent props={props} />,
    testimonials: (props) => <TestimonialsComponent props={props} />,
    'posts-grid': (props) => <PostsGridComponent props={props} />,

    // Legacy Components
    hero: (props) => <HeroComponent props={props} />,
    cta: (props) => <CTAComponent props={props} />,

    // Advanced Patrimonio Components
    'value-stack': (props) => <ValueStackComponent props={props} />,
    'method-phases': (props) => <MethodPhasesComponent props={props} />,
    'problems-list': (props) => <ProblemsListComponent props={props} />,
    'transparency-filter': (props) => <TransparencyFilterComponent props={props} />,
    'hero-patrimonio': (props) => <HeroPatrimonioComponent props={props} isEditing={isEditing} onClick={() => onComponentClick?.(component.id)} />,

    // Rendita Dipendente Components
    'vsl-hero-block': (props) => <VSLHeroBlockComponent props={props} />,
    'problems-grid-rdp': (props) => <ProblemsGridRDPComponent props={props} />,
    'method-timeline-rdp': (props) => <MethodTimelineRDPComponent props={props} />,
    'offer-ecosystem': (props) => <OfferEcosystemComponent props={props} />,
    'requirements-compare': (props) => <RequirementsCompareComponent props={props} />,
    'guarantee-cta-section': (props) => <GuaranteeCTASectionComponent props={props} />,
    'lead-form-dialog': (props) => <LeadFormDialogComponent props={props} />,

    // Homepage Components
    'hero-home': (props) => <HeroHomeComponent props={props} />,
    'simple-text-hero': (props) => <SimpleTextHeroComponent props={props} />, // <-- AGGIUNGI QUESTA LINEA
    'social-proof-logos': (props) => <SocialProofLogosComponent props={props} />,
    'problem-solution': (props) => <ProblemSolutionComponent props={props} />,
    // --- AGGIUNGI QUESTA NUOVA RIGA QUI ---
    'long-form-copy': (props) => <LongFormComponent props={props} />,
    // --- FINE AGGIUNTA ---

    'service-showcase': (props) => <ServiceShowcaseComponent props={props} />,
    'filter-section': (props) => <FilterSectionComponent props={props} />,
    'testimonials-grid': (props) => <TestimonialsGridComponent props={props} />,

    // Chi Siamo Components
    'hero-chi-siamo': (props) => <HeroChiSiamoComponent props={props} />,
    'values-grid': (props) => <ValuesGridComponent props={props} />,
    'company-quote': (props) => <CompanyQuoteComponent props={props} />,
    'timeline-milestones': (props) => <TimelineMilestonesComponent props={props} />,
    'team-grid': (props) => <TeamGridComponent props={props} />,

    // Servizi Components
    'hero-servizi': (props) => <HeroServiziComponent props={props} />,
    'services-cards': (props) => <ServicesCardsComponent props={props} />,
    'process-steps': (props) => <ProcessStepsComponent props={props} />,

    // Progetti Components


    'pricing-plans': (props) => (
      <section 
        key={component.id} 
        className="py-16"
        style={{ backgroundColor: props.backgroundColor || 'white', paddingTop: `${props.paddingY || 80}px`, paddingBottom: `${props.paddingY || 80}px` }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
              {props.title}
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {props.plans.map((plan: any, index: number) => (
              <div key={index} className="relative bg-white rounded-xl border-2 p-8 shadow-lg">
                {plan.recommended && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-2 rounded-full text-sm font-bold">
                      CONSIGLIATO
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                  <div className={`text-3xl font-bold mb-4 ${plan.recommended ? 'text-orange-600' : 'text-blue-600'}`}>
                    {plan.price}
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature: string, fIndex: number) => (
                    <li key={fIndex} className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <p className="text-sm text-slate-600 mb-6">{plan.ideal}</p>

                <button 
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                    plan.recommended 
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {plan.buttonText}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    ),
    'fork-roads': (props) => {
      const statusQuoPath = props.statusQuoPath || {
        title: '❌ STRADA #1: STATUS QUO',
        subtitle: 'Continuare Come Sempre',
        description: '"Farò da solo, prima o poi ce la farò..."',
        consequences: [],
        finalThought: '💭 "Tra un anno sarò ancora qui a cercare la soluzione magica..."'
      };

      const transformationPath = props.transformationPath || {
        title: '✅ STRADA #2: TRASFORMAZIONE',
        subtitle: 'Cambiare Davvero',
        description: '"È ora di investire su me stesso"',
        benefits: [],
        finalThought: '💡 "Finalmente avrò il controllo del mio futuro finanziario"'
      };

      return (
        <section 
          key={component.id} 
          className="py-20 text-slate-900 relative overflow-hidden"
          style={{ backgroundColor: props.backgroundColor || 'white', paddingTop: `${props.paddingY || 96}px`, paddingBottom: `${props.paddingY || 96}px` }}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center mb-16">
              <div className="inline-flex items-center space-x-2 bg-blue-100 backdrop-blur-sm rounded-full px-6 py-3 mb-6">
                <AlertTriangle className="w-5 h-5 text-blue-600" />
                <span className="text-blue-800 font-semibold">{props.badge || 'DECISIONE IMPORTANTE'}</span>
              </div>

              <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                {(props.title || 'Sei arrivato al BIVIO DEFINITIVO').replace('BIVIO DEFINITIVO', '')}
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  BIVIO DEFINITIVO
                </span>
              </h2>

              <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                {props.subtitle || 'Oggi devi scegliere tra due strade completamente diverse. Non c\'è via di mezzo.'}
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 mb-16">
              {/* Status Quo Path */}
              <div className="relative overflow-hidden bg-white border-2 border-red-300 rounded-xl">
                <div className="bg-red-500 text-white text-center py-2">
                  <span className="font-bold text-sm">{statusQuoPath.title}</span>
                </div>

                <div className="p-8">
                  <div className="text-center mb-6">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <TrendingDown className="h-10 w-10 text-red-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-red-700 mb-2">
                      {statusQuoPath.subtitle}
                    </h3>
                    <p className="text-slate-500 italic">
                      {statusQuoPath.description}
                    </p>
                  </div>

                  <div className="space-y-4">
                    {(statusQuoPath.consequences || []).map((item: any, index: number) => (
                      <div key={index} className="flex items-start space-x-3">
                        <span className="text-xl">{item.icon || '⚠️'}</span>
                        <div>
                          <p className="text-slate-800 font-medium">{item.title}</p>
                          <p className="text-sm text-slate-600">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-red-800 text-center font-semibold">
                      {statusQuoPath.finalThought}
                    </p>
                  </div>
                </div>
              </div>

              {/* Transformation Path */}
              <div className="relative overflow-hidden bg-white border-2 border-green-400 rounded-xl transform hover:scale-105 transition-transform">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-center py-2">
                  <span className="font-bold text-sm">{transformationPath.title}</span>
                </div>

                <div className="p-8">
                  <div className="text-center mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Target className="h-10 w-10 text-blue-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-green-700 mb-2">
                      {transformationPath.subtitle}
                    </h3>
                    <p className="text-slate-500 italic">
                      {transformationPath.description}
                    </p>
                  </div>

                  <div className="space-y-4">
                    {(transformationPath.benefits || []).map((item: any, index: number) => (
                      <div key={index} className="flex items-start space-x-3">
                        <span className="text-xl">{item.icon || '✨'}</span>
                        <div>
                          <p className="text-slate-800 font-medium">{item.title}</p>
                          <p className="text-sm text-slate-600">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <p className="text-blue-800 text-center font-semibold">
                      {transformationPath.finalThought}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white text-xl px-12 py-6 rounded-xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300">
                <ArrowRight className="inline mr-3 h-6 w-6" />
                {props.ctaText || 'Scegli la Trasformazione'}
              </button>
            </div>
          </div>
        </section>
      );
    },
    'guarantee-shield': (props) => (
      <section 
        key={component.id} 
        className="py-16"
        style={{ backgroundColor: props.backgroundColor || '#f0fdf4', paddingTop: `${props.paddingY || 80}px`, paddingBottom: `${props.paddingY || 80}px` }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <Shield className="w-16 h-16 text-green-600 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              {props.title}
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed">
              {props.description || 'Garanzia completa sui nostri servizi.'}
            </p>
          </div>
        </div>
      </section>
    ),

    // I miei progetti Components
    'hero-progetti': (props) => {
      const IconComponent = props.badgeIcon === 'Trophy' ? Trophy : Rocket;
      const stats = props.stats || [
        { icon: Trophy, value: '0', label: 'Progetti Completati' },
        { icon: Star, value: '0', label: 'In Evidenza' }
      ];

      return (
        <section 
          key={component.id} 
          className="relative py-16 md:py-24 overflow-hidden"
          style={{
            backgroundColor: props.backgroundColor || '#ffffff',
            paddingTop: `${props.paddingY || 96}px`,
            paddingBottom: `${props.paddingY || 96}px`
          }}
        >
          <div className="absolute inset-0 opacity-50" style={{ background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.05) 0%, transparent 50%, rgba(251, 146, 60, 0.05) 100%)' }} />
          <div className="relative max-w-7xl mx-auto container-padding text-center">
            <div className="space-y-6">
              <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors">
                <IconComponent className="w-3 h-3 mr-1.5" />
                {props.badge || 'Portfolio Progetti'}
              </Badge>

              <h1 className="text-responsive-xl font-bold leading-[0.9] tracking-tight max-w-4xl mx-auto">
                {props.title || 'I Miei'}
                <span className="block bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent mt-2">
                  {props.titleHighlight || 'Progetti'}
                </span>
              </h1>

              <p className="text-responsive-md text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                {props.subtitle || 'Scopri i progetti e le partnership che hanno trasformato il business dei nostri clienti.'}
              </p>

              {/* Stats */}
              <div className="flex items-center justify-center gap-8 pt-8">
                {stats.map((stat: any, index: number) => {
                  const StatIcon = stat.icon === 'Trophy' ? Trophy : stat.icon === 'Star' ? Star : Trophy;
                  return (
                    <div key={index} className="text-center">
                      <div className="flex items-center justify-center gap-2 text-primary mb-1">
                        <StatIcon className="w-5 h-5" />
                        <span className="text-2xl font-bold">{stat.value || '0'}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </div>
                  );
                })}
              </div>

              {/* Search */}
              {props.hasSearch && (
                <div className="max-w-md mx-auto pt-6">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      placeholder={props.searchPlaceholder || "Cerca progetti..."}
                      className="w-full rounded-2xl py-4 pl-12 pr-6 text-base shadow-lg border-0 bg-background/80 backdrop-blur-sm focus:bg-background transition-all"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      );
    },

    'projects-grid': (props) => {
      const ProjectsGridInner = () => {
        const [activeTab, setActiveTab] = useState(props.defaultTab || "all");

        // Fetch all projects - usa endpoint pubblico
        const { data: allProjects, isLoading: allLoading } = useQuery<any>({ 
          queryKey: ['/api/projects/public']
        });
        const { data: featured, isLoading: featuredLoading } = useQuery<any>({ 
          queryKey: ['/api/projects/public/featured']
        });
        const { data: development, isLoading: devLoading } = useQuery<any>({ 
          queryKey: ['/api/projects/public/category/development']
        });
        const { data: marketing, isLoading: mktLoading } = useQuery<any>({ 
          queryKey: ['/api/projects/public/category/marketing']
        });
        const { data: consulting, isLoading: consLoading } = useQuery<any>({ 
          queryKey: ['/api/projects/public/category/consulting']
        });
        const { data: projectsOnly, isLoading: projLoading } = useQuery<any>({ 
          queryKey: ['/api/projects/public/type/project']
        });
        const { data: partnerships, isLoading: partLoading } = useQuery<any>({ 
          queryKey: ['/api/projects/public/type/partnership']
        });

        const getActiveContent = () => {
          switch (activeTab) {
            case "featured": return { data: featured, isLoading: featuredLoading };
            case "development": return { data: development, isLoading: devLoading };
            case "marketing": return { data: marketing, isLoading: mktLoading };
            case "consulting": return { data: consulting, isLoading: consLoading };
            case "projects": return { data: projectsOnly, isLoading: projLoading };
            case "partnerships": return { data: partnerships, isLoading: partLoading };
            default: return { data: allProjects?.projects, isLoading: allLoading };
          }
        };

        const { data: projects = [], isLoading } = getActiveContent();

        if (isLoading) {
          return (
            <section 
              key={component.id} 
              className="py-16"
              style={{
                backgroundColor: props.backgroundColor || '#ffffff',
                paddingTop: `${props.paddingY || 80}px`,
                paddingBottom: `${props.paddingY || 80}px`
              }}
            >
              <div className="max-w-7xl mx-auto container-padding">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="h-full"><Skeleton className="aspect-video w-full" /><CardHeader><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-1/2" /></CardHeader><CardContent className="space-y-3"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-2/3" /></CardContent></Card>
                  ))}
                </div>
              </div>
            </section>
          );
        }

        return (
          <section 
            key={component.id} 
            className="py-16 md:py-20" 
            style={{ 
              backgroundColor: props.backgroundColor || '#ffffff',
              paddingTop: `${props.paddingY || 80}px`,
              paddingBottom: `${props.paddingY || 80}px`
            }}
          >
            <div className="max-w-7xl mx-auto container-padding">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex items-center justify-center mb-12">
                  <TabsList className="grid w-full max-w-4xl grid-cols-3 lg:grid-cols-7 h-auto p-1 bg-muted/50 backdrop-blur-sm rounded-2xl">
                    <TabsTrigger value="all" className="rounded-xl text-sm font-medium px-4 py-3"><Filter className="w-4 h-4 mr-2" />Tutti</TabsTrigger>
                    <TabsTrigger value="featured" className="rounded-xl text-sm font-medium px-4 py-3"><Star className="w-4 h-4 mr-2" />In Evidenza</TabsTrigger>
                    <TabsTrigger value="development" className="rounded-xl text-sm font-medium px-4 py-3"><Code className="w-4 h-4 mr-2" />Sviluppo</TabsTrigger>
                    <TabsTrigger value="marketing" className="rounded-xl text-sm font-medium px-4 py-3"><TrendingUp className="w-4 h-4 mr-2" />Marketing</TabsTrigger>
                    <TabsTrigger value="consulting" className="rounded-xl text-sm font-medium px-4 py-3"><Lightbulb className="w-4 h-4 mr-2" />Consulenza</TabsTrigger>
                    <TabsTrigger value="projects" className="rounded-xl text-sm font-medium px-4 py-3"><Briefcase className="w-4 h-4 mr-2" />Progetti</TabsTrigger>
                    <TabsTrigger value="partnerships" className="rounded-xl text-sm font-medium px-4 py-3"><Handshake className="w-4 h-4 mr-2" />Partnership</TabsTrigger>
                  </TabsList>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {projects.map((project: any) => (
                    <div key={project.id} className="group">
                      <Card className="h-full border-0 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden bg-gradient-to-br from-background to-primary/5 backdrop-blur-sm hover:-translate-y-1">
                        <div className="relative overflow-hidden">
                          {project.featuredImage ? (
                            <div className="aspect-video overflow-hidden relative">
                              <img 
                                src={project.featuredImage} 
                                alt={project.title} 
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                                width="800"
                                height="450"
                                loading="lazy"
                                decoding="async"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            </div>
                          ) : (
                            <div className="aspect-video flex items-center justify-center bg-gradient-to-br from-primary/20 via-primary/10 to-accent/10">
                              <Rocket className="w-20 h-20 text-primary/50" />
                            </div>
                          )}
                          <div className="absolute top-4 left-4 right-4 flex justify-between items-start gap-2">
                            <Badge className={`${project.projectType === 'project' ? 'bg-gradient-to-r from-blue-500 to-indigo-600' : 'bg-gradient-to-r from-purple-500 to-pink-600'} text-white border-0 shadow-lg backdrop-blur-md font-semibold`}>
                              {project.projectType === 'project' ? <><Briefcase className="w-3.5 h-3.5 mr-1.5" />Progetto</> : <><Handshake className="w-3.5 h-3.5 mr-1.5" />Partnership</>}
                            </Badge>
                            {project.isFeatured && (
                              <Badge className="bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 text-white border-0 shadow-lg animate-pulse">
                                <Star className="w-3.5 h-3.5 mr-1.5 fill-white" />In Evidenza
                              </Badge>
                            )}
                          </div>
                        </div>
                        <CardHeader className="pb-3 px-6 pt-6">
                          <div className="flex items-center justify-between mb-3">
                            <Badge className={`text-xs px-3 py-1.5 font-semibold ${
                              project.category === 'development' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                              project.category === 'marketing' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                              'bg-purple-100 text-purple-700 border-purple-200'
                            }`}>
                              {project.category === 'development' && <><Code className="w-3.5 h-3.5 mr-1.5" />Sviluppo</>}
                              {project.category === 'marketing' && <><TrendingUp className="w-3.5 h-3.5 mr-1.5" />Marketing</>}
                              {project.category === 'consulting' && <><Lightbulb className="w-3.5 h-3.5 mr-1.5" />Consulenza</>}
                            </Badge>
                            {project.duration && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                                <Clock className="w-3.5 h-3.5" />
                                {project.duration}
                              </span>
                            )}
                          </div>
                          <CardTitle className="text-xl mb-2 group-hover:text-primary transition-colors line-clamp-2 font-bold leading-tight">{project.title}</CardTitle>
                          {project.clientName && (
                            <p className="text-sm text-muted-foreground font-semibold mb-2">
                              Cliente: {project.clientName}
                            </p>
                          )}
                          {project.shortDescription && <p className="text-sm text-muted-foreground/90 leading-relaxed line-clamp-2">{project.shortDescription}</p>}
                        </CardHeader>
                        <CardContent className="px-6 pb-4">
                          {project.technologies && project.technologies.length > 0 && (
                            <div className="mb-4">
                              <p className="text-xs font-semibold text-muted-foreground mb-2.5">Tecnologie:</p>
                              <div className="flex flex-wrap gap-2">
                                {project.technologies.slice(0, 4).map((tech: string, idx: number) => (
                                  <Badge key={idx} className="text-xs px-2.5 py-1 bg-gradient-to-r from-slate-100 to-slate-50 text-slate-700 border border-slate-200 font-medium hover:from-slate-200 hover:to-slate-100 transition-colors">
                                    {tech}
                                  </Badge>
                                ))}
                                {project.technologies.length > 4 && (
                                  <Badge className="text-xs px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 font-semibold">
                                    +{project.technologies.length - 4}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                          {project.results && project.results.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs font-semibold text-muted-foreground mb-2">Risultati chiave:</p>
                              {project.results.slice(0, 2).map((result: any, idx: number) => (
                                <div key={idx} className="flex items-center gap-2.5 text-xs">
                                  <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                  <span className="font-bold text-emerald-600">{result.value}</span>
                                  <span className="text-muted-foreground/80">{result.metric}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                        <CardFooter className="pt-4 px-6 pb-6 border-t border-border/50">
                          <div className="flex items-center justify-between w-full gap-2">
                            {project.slug && (
                              <Button size="sm" variant="outline" asChild className="h-9 px-4 border-primary/30 hover:bg-primary/10 hover:border-primary">
                                <Link href={`/progetti/${project.slug}`}>
                                  <ArrowRight className="w-3.5 h-3.5 mr-1.5" />
                                  Scopri di più
                                </Link>
                              </Button>
                            )}
                            {project.caseStudyUrl ? (
                              <Button size="sm" variant="default" asChild className="h-9 px-4">
                                <a href={project.caseStudyUrl} target="_blank" rel="noopener noreferrer">
                                  <BookOpen className="w-3.5 h-3.5 mr-1.5" />
                                  Case Study
                                </a>
                              </Button>
                            ) : project.projectUrl ? (
                              <Button size="sm" variant="default" asChild className="h-9 px-4">
                                <a href={project.projectUrl} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                                  Visita Sito
                                </a>
                              </Button>
                            ) : null}
                          </div>
                        </CardFooter>
                      </Card>
                    </div>
                  ))}
                </div>
              </Tabs>
            </div>
          </section>
        );
      };
      return <ProjectsGridInner />;
    },

    'project-detail-card': (props) => {
      const ProjectDetailCardInner = () => {
        const projectId = props.projectId;
        const { data: project, isLoading } = useQuery<any>({
          queryKey: [`/api/projects/${projectId}`],
          enabled: !!projectId
        });

        if (isLoading) {
          return (
            <section className="py-16" style={{ backgroundColor: props.backgroundColor || '#ffffff' }}>
              <div className="max-w-7xl mx-auto px-4">
                <Skeleton className="h-96 w-full rounded-lg" />
              </div>
            </section>
          );
        }

        if (!project) {
          return (
            <section className="py-16" style={{ backgroundColor: props.backgroundColor || '#ffffff' }}>
              <div className="max-w-7xl mx-auto px-4 text-center">
                <p className="text-muted-foreground">Progetto non trovato</p>
              </div>
            </section>
          );
        }

        return (
          <section 
            className="py-16 md:py-20"
            style={{
              backgroundColor: props.backgroundColor || '#ffffff',
              paddingTop: `${props.paddingY || 80}px`,
              paddingBottom: `${props.paddingY || 80}px`
            }}
          >
            <div className="max-w-7xl mx-auto px-4">
              {/* Back Button */}
              {props.showBackButton && (
                <Button variant="ghost" asChild className="mb-8">
                  <Link href="/progetti">
                    <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
                    Torna ai progetti
                  </Link>
                </Button>
              )}

              {/* Hero Section */}
              <div className="mb-12">
                <div className="flex flex-wrap gap-3 mb-6">
                  <Badge className={`${project.projectType === 'project' ? 'bg-gradient-to-r from-blue-500 to-indigo-600' : 'bg-gradient-to-r from-purple-500 to-pink-600'} text-white border-0 shadow-lg font-semibold`}>
                    {project.projectType === 'project' ? <><Briefcase className="w-4 h-4 mr-1.5" />Progetto</> : <><Handshake className="w-4 h-4 mr-1.5" />Partnership</>}
                  </Badge>

                  <Badge className={`font-semibold ${
                    project.category === 'development' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                    project.category === 'marketing' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                    'bg-purple-100 text-purple-700 border-purple-200'
                  }`}>
                    {project.category === 'development' && <><Code className="w-4 h-4 mr-1.5" />Sviluppo</>}
                    {project.category === 'marketing' && <><TrendingUp className="w-4 h-4 mr-1.5" />Marketing</>}
                    {project.category === 'consulting' && <><Lightbulb className="w-4 h-4 mr-1.5" />Consulenza</>}
                  </Badge>

                  {project.isFeatured && (
                    <Badge className="bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 text-white border-0 shadow-lg animate-pulse">
                      ⭐ In Evidenza
                    </Badge>
                  )}
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                  {project.title}
                </h1>

                <div className="flex flex-wrap gap-6 text-sm text-muted-foreground mb-8">
                  {project.clientName && (
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span className="font-semibold">Cliente: {project.clientName}</span>
                    </div>
                  )}
                  {project.duration && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{project.duration}</span>
                    </div>
                  )}
                  {project.completionDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(project.completionDate).toLocaleDateString('it-IT')}</span>
                    </div>
                  )}
                </div>

                {project.shortDescription && (
                  <p className="text-xl text-muted-foreground leading-relaxed max-w-4xl">
                    {project.shortDescription}
                  </p>
                )}
              </div>

              {/* Featured Image */}
              {project.featuredImage && (
                <div className="mb-12 rounded-2xl overflow-hidden shadow-2xl">
                  <img 
                    src={project.featuredImage} 
                    alt={project.title} 
                    className="w-full h-auto object-cover"
                  />
                </div>
              )}

              {/* Main Content Grid */}
              <div className="grid lg:grid-cols-3 gap-12 mb-12">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                  {/* Full Description */}
                  {project.fullDescription && (() => {
                    try {
                      // Se fullDescription è già un oggetto, usalo direttamente
                      const parsed = typeof project.fullDescription === 'string' 
                        ? JSON.parse(project.fullDescription) 
                        : project.fullDescription;

                      const blocks = parsed.blocks || [];

                      return (
                        <Card className="border-0 shadow-xl bg-gradient-to-br from-background to-background/50">
                          <CardHeader>
                            <CardTitle className="text-2xl">Descrizione del Progetto</CardTitle>
                          </CardHeader>
                          <CardContent className="prose prose-slate max-w-none">
                            {blocks.map((block: any, idx: number) => {
                              switch (block.type) {
                                case 'header':
                                  const HeaderTag = `h${block.data.level}` as keyof JSX.IntrinsicElements;
                                  return <HeaderTag key={idx} className="font-bold mb-3">{block.data.text}</HeaderTag>;

                                case 'paragraph':
                                  return <p key={idx} className="mb-4 leading-relaxed text-muted-foreground">{block.data.text}</p>;

                                case 'list':
                                  const ListTag = block.data.style === 'ordered' ? 'ol' : 'ul';
                                  return (
                                    <ListTag key={idx} className={`mb-4 ${block.data.style === 'ordered' ? 'list-decimal' : 'list-disc'} list-inside space-y-2`}>
                                      {Array.isArray(block.data.items) && block.data.items.map((item: any, i: number) => (
                                        <li key={i} className="text-muted-foreground">
                                          {typeof item === 'string' ? item : typeof item === 'object' && item.content ? item.content : JSON.stringify(item)}
                                        </li>
                                      ))}
                                    </ListTag>
                                  );

                                case 'quote':
                                  return (
                                    <blockquote key={idx} className="border-l-4 border-primary pl-4 italic mb-4 text-muted-foreground">
                                      {block.data.text}
                                    </blockquote>
                                  );

                                default:
                                  return null;
                              }
                            })}
                          </CardContent>
                        </Card>
                      );
                    } catch (e) {
                      // Fallback se non è JSON valido - converti a stringa se è un oggetto
                      const displayText = typeof project.fullDescription === 'string' 
                        ? project.fullDescription 
                        : JSON.stringify(project.fullDescription, null, 2);

                      return (
                        <Card className="border-0 shadow-xl bg-gradient-to-br from-background to-background/50">
                          <CardHeader>
                            <CardTitle className="text-2xl">Descrizione del Progetto</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{displayText}</p>
                          </CardContent>
                        </Card>
                      );
                    }
                  })()}

                  {/* Results */}
                  {project.results && project.results.length > 0 && (
                    <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-indigo-50">
                      <CardHeader>
                        <CardTitle className="text-2xl flex items-center gap-2">
                          <TrendingUp className="w-6 h-6 text-primary" />
                          Risultati Ottenuti
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid sm:grid-cols-2 gap-4">
                          {project.results.map((result: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-3 p-4 bg-background/50 rounded-lg">
                              <CheckCircle className="w-6 h-6 text-emerald-500 flex-shrink-0" />
                              <div>
                                <div className="text-2xl font-bold text-emerald-600">{result.value}</div>
                                <div className="text-sm text-muted-foreground">{result.metric}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Technologies */}
                  {project.technologies && project.technologies.length > 0 && (
                    <Card className="border-0 shadow-xl">
                      <CardHeader>
                        <CardTitle className="text-lg">Tecnologie Utilizzate</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {project.technologies.map((tech: string, idx: number) => (
                            <Badge key={idx} className="bg-gradient-to-r from-slate-100 to-slate-50 text-slate-700 border border-slate-200 font-medium hover:from-slate-200 hover:to-slate-100 transition-colors">
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* CTAs */}
                  <Card className="border-0 shadow-xl bg-gradient-to-br from-primary/5 to-accent/5">
                    <CardContent className="p-6 space-y-3">
                      {project.caseStudyUrl && (
                        <Button className="w-full" asChild>
                          <a href={project.caseStudyUrl} target="_blank" rel="noopener noreferrer">
                            <BookOpen className="w-4 h-4 mr-2" />
                            Leggi il Case Study
                          </a>
                        </Button>
                      )}

                      {project.projectUrl && (
                        <Button variant="outline" className="w-full" asChild>
                          <a href={project.projectUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Visita il Sito
                          </a>
                        </Button>
                      )}

                      <Button variant="secondary" className="w-full" asChild>
                        <Link href="/contatti">
                          Richiedi un Progetto Simile
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </section>
        );
      };
      return <ProjectDetailCardInner />;
    },

    // Blog Components
    'hero-blog': (props) => {
      const IconComponent = props.badgeIcon === 'BookOpen' ? BookOpen : BookOpen;

      return (
        <section 
          key={component.id} 
          className="relative py-16 md:py-24 overflow-hidden"
          style={{
            backgroundColor: props.backgroundColor || '#ffffff',
            paddingTop: `${props.paddingY || 96}px`,
            paddingBottom: `${props.paddingY || 96}px`
          }}
        >
          <div className="absolute inset-0 opacity-50" style={{ background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.05) 0%, transparent 50%, rgba(251, 146, 60, 0.05) 1000%)' }} />
          <div className="relative max-w-7xl mx-auto container-padding text-center">
            <div className="space-y-6">
              <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors">
                <IconComponent className="w-3 h-3 mr-1.5" />
                {props.badge || 'Il Nostro Blog'}
              </Badge>

              <h1 className="text-responsive-xl font-bold leading-[0.9] tracking-tight max-w-4xl mx-auto">
                {props.title || 'Insights e Strategie per il'}
                <span className="block bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent mt-2">
                  {props.titleHighlight || 'Successo Digitale'}
                </span>
              </h1>

              <p className="text-responsive-md text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                {props.subtitle || 'Guide pratiche, case study e le ultime tendenze del marketing digitale per far crescere il tuo business.'}
              </p>

              {props.hasSearch && (
                <div className="max-w-2xl mx-auto pt-8">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                      placeholder={props.searchPlaceholder || "Cerca articoli, argomenti..."} 
                      className="w-full rounded-2xl py-4 pl-12 pr-6 text-base shadow-lg border-0 bg-background/80 backdrop-blur-sm focus:bg-background transition-all"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      );
    },

    'blog-posts-grid': (props) => {
      const BlogPostsGridInner = () => {
        const { data, isLoading } = useQuery<any>({ 
          queryKey: ['/api/blog/public']
        });

        const posts = data?.posts?.filter((p:any) => p.status === 'published') || [];
        const displayPosts = props.postsToShow ? posts.slice(0, props.postsToShow) : posts;

        if (isLoading) {
          return (
            <section 
              key={component.id} 
              className="py-16 md:py-20" 
              style={{ 
                backgroundColor: props.backgroundColor || '#ffffff',
                paddingTop: `${props.paddingY || 80}px`,
                paddingBottom: `${props.paddingY || 80}px`
              }}
            >
              <div className="max-w-7xl mx-auto container-padding">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i}><Skeleton className="aspect-video w-full" /><CardContent className="p-6 space-y-3"><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-full" /></CardContent></Card>
                  ))}
                </div>
              </div>
            </section>
          );
        }

        return (
          <section 
            key={component.id} 
            className="py-16 md:py-20" 
            style={{ 
              backgroundColor: props.backgroundColor || '#ffffff',
              paddingTop: `${props.paddingY || 80}px`,
              paddingBottom: `${props.paddingY || 80}px`
            }}
          >
            <div className="max-w-7xl mx-auto container-padding">
              {props.title && <h2 className="text-3xl font-bold mb-12 text-center">{props.title}</h2>}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {displayPosts.map((post: any) => (
                  <div key={post.id} className="group">
                    <Card className="h-full glass-card border-0 shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden">
                      <div className="relative overflow-hidden">
                        {post.featuredImage ? (
                          <div className="aspect-video overflow-hidden">
                            <img 
                              src={post.featuredImage} 
                              alt={post.title} 
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                              width="800"
                              height="450"
                              loading="lazy"
                              decoding="async"
                            />
                          </div>
                        ) : (
                          <div className="aspect-video flex items-center justify-center bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
                            <BookOpen className="w-16 h-16 text-primary/40" />
                          </div>
                        )}
                        {post.category && (
                          <div className="absolute top-4 left-4">
                            <Badge variant="default" className="bg-primary/90 backdrop-blur-sm text-white border-0 shadow-lg">
                              {typeof post.category === 'object' ? post.category.name : post.category}
                            </Badge>
                          </div>
                        )}
                      </div>
                      <div className="p-6 space-y-4">
                        <h3 className="text-xl font-bold leading-tight group-hover:text-primary transition-colors line-clamp-2">
                          <Link href={`/blog/${post.slug}`} className="hover:underline">{post.title}</Link>
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-3">{post.excerpt}</p>
                        <div className="flex items-center justify-between pt-4 border-t">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <User className="w-3 h-3" />
                            <span>{post.author?.username || 'Admin'}</span>
                          </div>
                          <Button variant="ghost" size="sm" asChild><Link href={`/blog/${post.slug}`}><ArrowRight className="w-3 h-3" /></Link></Button>
                        </div>
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      };
      return <BlogPostsGridInner />;
    },

    'expert-profile-card': (props) => (
      <section 
        key={component.id} 
        className="py-16 md:py-20"
        style={{ 
          backgroundColor: props.backgroundColor || '#ffffff',
          paddingTop: `${props.paddingY || 96}px`,
          paddingBottom: `${props.paddingY || 96}px`
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Immagine */}
            <div className="relative">
              <img 
                src={props.image || '/attached_assets/image_1759612238064.png'} 
                alt={props.title || 'Expert'} 
                className="w-full h-auto rounded-lg shadow-2xl"
              />
            </div>

            {/* Contenuto */}
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                {props.title || 'Marco Massi, maestro pasticcere e lievitista'}
              </h2>

              {props.subtitles && props.subtitles.length > 0 && (
                <div className="space-y-2">
                  {props.subtitles.map((subtitle: string, index: number) => (
                    <p key={index} className="text-lg text-slate-600 italic">
                      {subtitle}
                    </p>
                  ))}
                </div>
              )}

              <div 
                className="text-base text-slate-700 leading-relaxed space-y-4"
                dangerouslySetInnerHTML={{ 
                  __html: props.description || 'Descrizione dell\'esperto...' 
                }}
              />

              {props.ctaText && (
                <div className="pt-4">
                  <Button 
                    asChild 
                    size="lg"
                    className="bg-amber-900 hover:bg-amber-800 text-white px-8 py-6 text-lg"
                  >
                    <Link href={props.ctaLink || '#'}>{props.ctaText}</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    ),

    // Contatti Components
    'hero-contatti': (props) => (
      <section 
        key={component.id} 
        className="py-12 md:py-16 text-center border-b"
        style={{
          backgroundColor: props.backgroundColor || '#f8fafc',
          paddingTop: `${props.paddingY || 80}px`,
          paddingBottom: `${props.paddingY || 64}px`
        }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Badge className="mb-4">{props.badge || 'Contattaci'}</Badge>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-slate-900">
            {props.title || 'Parliamo del tuo Progetto.'}
          </h1>
          <p className="text-lg md:text-xl mt-6 text-slate-600">
            {props.subtitle || 'Siamo pronti ad ascoltare le tue idee e a trasformarle in un successo digitale.'}
          </p>
        </div>
      </section>
    ),

    'benefits-grid': (props) => {
      const benefits = props.benefits || [
        { icon: 'CheckCircle', title: 'Consulenza Gratuita', description: 'Prima consulenza sempre gratuita e senza impegno' },
        { icon: 'Headphones', title: 'Supporto Dedicato', description: 'Account manager dedicato per tutto il progetto' },
        { icon: 'Zap', title: 'Risposta Rapida', description: 'Risposta garantita entro 2 ore in orario lavorativo' },
        { icon: 'Users', title: 'Team Esperto', description: 'Oltre 15 anni di esperienza nel settore digitale' }
      ];

      return (
        <section 
          key={component.id} 
          className="py-20" 
          style={{ 
            backgroundColor: props.backgroundColor || '#ffffff',
            paddingTop: `${props.paddingY || 80}px`,
            paddingBottom: `${props.paddingY || 80}px`
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {benefits.map((benefit: any, index: number) => {
                const IconMap: any = { CheckCircle, Headphones, Zap, Users };
                const Icon = IconMap[benefit.icon] || CheckCircle;
                return (
                  <div key={index} className="flex items-start gap-4">
                    <div className="p-3 bg-blue-100 rounded-full w-fit mt-1">
                      <Icon className="h-6 w-6 text-blue-600"/>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">{benefit.title}</h3>
                      <p className="text-slate-600 text-sm">{benefit.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      );
    },

    'contact-info': (props) => (
      <section 
        key={component.id} 
        className="py-20 md:py-24 border-y"
        style={{
          backgroundColor: props.backgroundColor || '#f8fafc',
          paddingTop: `${props.paddingY || 80}px`,
          paddingBottom: `${props.paddingY || 96}px`
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900">{props.title || 'Pronto a Fare il Prossimo Passo?'}</h2>
              <p className="mt-4 text-lg text-slate-600">{props.description || 'Compila il modulo di contatto per ricevere una consulenza personalizzata.'}</p>
              <Button size="lg" className="mt-8 px-8 py-6 bg-slate-900 hover:bg-slate-800 text-white font-bold">
                {props.ctaText || 'Inizia Ora'}
                <ArrowRight className="ml-2 h-5 w-5"/>
              </Button>
            </div>
            <div className="space-y-8">
              <h3 className="text-xl font-semibold">{props.infoTitle || 'Oppure, usa i nostri canali diretti:'}</h3>
              <div className="flex items-center gap-4">
                <Phone className="h-6 w-6 text-blue-600"/>
                <a href={`tel:${props.phone || '+39 02 1234567'}`} className="hover:text-blue-600">{props.phone || '+39 02 1234567'}</a>
              </div>
              <div className="flex items-center gap-4">
                <Mail className="h-6 w-6 text-blue-600"/>
                <a href={`mailto:${props.email || 'info@example.com'}`} className="hover:text-blue-600">{props.email || 'info@example.com'}</a>
              </div>
              <div className="flex items-center gap-4">
                <MapPin className="h-6 w-6 text-blue-600"/>
                <span>{props.address || 'Via Example, 123 - Milano'}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    ),

    // FAQ Components
    'hero-faq': (props) => {
      // Support both showSearch (new) and hasSearch (legacy) for backward compatibility
      const shouldShowSearch = props.showSearch ?? props.hasSearch ?? false;

      return (
        <section 
          key={component.id} 
          className="py-12"
          style={{
            background: props.backgroundColor || 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(59, 130, 246, 0.1) 100%)',
            paddingTop: `${props.paddingY || 48}px`,
            paddingBottom: `${props.paddingY || 48}px`
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto">
              <Badge className="mb-6 bg-primary/10 text-primary border-primary/20">{props.badge || 'FAQ'}</Badge>
              <h1 className="font-heading font-bold text-5xl mb-6" data-testid="heading-hero">
                {props.title || 'Domande Frequenti'}
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                {props.subtitle || 'Trova rapidamente le risposte alle domande più comuni sui nostri servizi, prezzi, tempistiche e modalità di lavoro.'}
              </p>
              {shouldShowSearch && (
                <div className="max-w-md mx-auto relative">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input placeholder={props.searchPlaceholder || "Cerca nelle FAQ..."} className="pl-10 py-3" data-testid="input-search" />
                </div>
              )}
            </div>
          </div>
        </section>
      );
    },

    'popular-questions': (props) => {
      const questions = props.questions || [
        { question: 'Quali servizi offrite esattamente?', answer: 'Offriamo una gamma completa di servizi digitali: consulenza strategica, sviluppo web, marketing digitale e molto altro.' },
        { question: 'Quanto tempo serve per vedere i primi risultati?', answer: 'I tempi variano in base al servizio: per le campagne Google Ads vediamo risultati in 2-4 settimane.' }
      ];

      return (
        <section 
          key={component.id} 
          className="py-20" 
          style={{ 
            backgroundColor: props.backgroundColor || '#ffffff',
            paddingTop: `${props.paddingY || 80}px`,
            paddingBottom: `${props.paddingY || 80}px`
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <Badge className="mb-4 bg-accent/10 text-accent-foreground">{props.badge || 'Domande Popolari'}</Badge>
              <h2 className="font-heading font-bold text-4xl mb-4">{props.title || 'Le Risposte che Cerchi di Più'}</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">{props.subtitle || 'Le domande più frequenti dei nostri clienti con risposte dettagliate.'}</p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {questions.slice(0, props.limit || 4).map((faq: any, index: number) => (
                <Card key={index} className="hover-elevate">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-start gap-3">
                      <HelpCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                      {faq.question}
                    </CardTitle>
                  </CardHeader>
                  <CardContent><p className="text-muted-foreground leading-relaxed">{faq.answer}</p></CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      );
    },

    'faq-list': (props) => {
      const FAQListInner = () => {
        const [expandedItems, setExpandedItems] = useState<number[]>([]);
        const [selectedCategory, setSelectedCategory] = useState('Tutti');
        const faqs = props.faqs || [];
        const showCategories = props.showCategories ?? true;

        // Calcola le categorie con i conteggi
        const categories = useMemo(() => {
          const categoryCounts: Record<string, number> = {};
          faqs.forEach((faq: any) => {
            if (faq.category) {
              categoryCounts[faq.category] = (categoryCounts[faq.category] || 0) + 1;
            }
          });

          const allCategories = [
            { name: 'Tutti', count: faqs.length },
            ...Object.entries(categoryCounts).map(([name, count]) => ({ name, count }))
          ];

          return allCategories;
        }, [faqs]);

        // Filtra le FAQ per categoria
        const filteredFaqs = selectedCategory === 'Tutti' 
          ? faqs 
          : faqs.filter((faq: any) => faq.category === selectedCategory);

        const toggleExpanded = (index: number) => {
          setExpandedItems(prev => 
            prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
          );
        };

        const getCategoryIcon = (category: string) => {
          switch (category) {
            case 'Servizi': return <CheckCircle className="h-5 w-5 text-blue-500" />;
            case 'Prezzi': return <Euro className="h-5 w-5 text-green-500" />;
            case 'Tempi': return <Clock className="h-5 w-5 text-orange-500" />;
            case 'Supporto': return <Shield className="h-5 w-5 text-purple-500" />;
            default: return <HelpCircle className="h-5 w-5 text-muted-foreground" />;
          }
        };

        return (
          <section 
            key={component.id} 
            className="py-20" 
            style={{ 
              backgroundColor: props.backgroundColor || '#f9fafb',
              paddingTop: `${props.paddingY || 80}px`,
              paddingBottom: `${props.paddingY || 80}px`
            }}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col lg:flex-row gap-12">

                {/* Categories Sidebar */}
                {showCategories && categories.length > 0 && (
                  <div className="lg:w-1/4">
                    <Card className="sticky top-6">
                      <CardHeader>
                        <CardTitle>Categorie</CardTitle>
                        <CardDescription>Filtra per argomento</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {categories.map((category, index) => (
                            <button
                              key={index}
                              onClick={() => setSelectedCategory(category.name)}
                              className={`w-full flex justify-between items-center p-3 rounded text-left transition-colors ${
                                selectedCategory === category.name 
                                  ? 'bg-primary text-primary-foreground' 
                                  : 'hover:bg-muted'
                              }`}
                            >
                              <span>{category.name}</span>
                              <Badge variant={selectedCategory === category.name ? "secondary" : "outline"}>
                                {category.count}
                              </Badge>
                            </button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* FAQ List */}
                <div className={showCategories && categories.length > 0 ? "lg:w-3/4" : "w-full"}>
                  <div className="mb-8">
                    <h3 className="font-heading font-bold text-2xl mb-2">
                      {selectedCategory === 'Tutti' ? (props.title || 'Tutte le Domande') : `Domande su ${selectedCategory}`}
                    </h3>
                    <p className="text-muted-foreground">
                      {filteredFaqs.length} domande trovate
                    </p>
                  </div>

                  <div className="space-y-4">
                    {filteredFaqs.map((faq: any, index: number) => (
                      <Card key={index} className="overflow-hidden">
                        <button
                          onClick={() => toggleExpanded(index)}
                          className="w-full p-6 text-left hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              <div className="flex-shrink-0 mt-1">
                                {getCategoryIcon(faq.category)}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-lg mb-1">{faq.question}</h4>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">{faq.category}</Badge>
                                  {faq.popular && (
                                    <Badge className="text-xs bg-primary">Popolare</Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            {expandedItems.includes(index) ? (
                              <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                            )}
                          </div>
                        </button>

                        {expandedItems.includes(index) && (
                          <div className="px-6 pb-6 border-t bg-muted/20">
                            <div className="pt-4">
                              <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                            </div>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>

                  {filteredFaqs.length === 0 && (
                    <Card className="text-center p-12">
                      <HelpCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold text-lg mb-2">Nessuna domanda trovata</h3>
                      <p className="text-muted-foreground mb-6">
                        Prova a selezionare un'altra categoria.
                      </p>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          </section>
        );
      };
      return <FAQListInner />;
    },

    'contact-support-grid': (props) => {
      const channels = props.channels || [
        { 
          icon: 'MessageCircle', 
          title: 'Chat Live', 
          description: 'Chatta direttamente con un esperto',
          availability: 'Disponibile Lun-Ven 9:00-18:00',
          ctaText: 'Inizia Chat',
          ctaLink: 'https://wa.me/393351234567'
        },
        { 
          icon: 'Phone', 
          title: 'Chiamata Telefonica', 
          description: 'Parla direttamente con un consulente',
          availability: '+39 02 1234 5678\nLun-Ven 9:00-18:00',
          ctaText: 'Chiama Ora',
          ctaLink: 'tel:+390212345678'
        },
        { 
          icon: 'Mail', 
          title: 'Email Supporto', 
          description: 'Scrivi per domande dettagliate',
          availability: 'info@professionale.it\nRisposta entro 2 ore',
          ctaText: 'Invia Email',
          ctaLink: '/contatti'
        }
      ];

      return (
        <section key={component.id} className="py-20" style={{ backgroundColor: props.backgroundColor || '#ffffff' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="font-heading font-bold text-3xl mb-4">{props.title || 'Non Hai Trovato la Risposta?'}</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">{props.subtitle || 'Il nostro team è sempre disponibile per rispondere alle tue domande specifiche.'}</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {channels.map((channel: any, index: number) => {
                const IconMap: any = { MessageCircle, Phone, Mail };
                const Icon = IconMap[channel.icon] || MessageCircle;
                return (
                  <Card key={index} className="text-center hover-elevate">
                    <CardHeader>
                      <div className="mx-auto mb-4 p-4 bg-primary/10 rounded-full w-fit">
                        <Icon className="h-8 w-8 text-primary" />
                      </div>
                      <CardTitle>{channel.title}</CardTitle>
                      <CardDescription>{channel.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-6" style={{ whiteSpace: 'pre-line' }}>
                        {channel.availability}
                      </p>
                      <Button asChild className="w-full">
                        <a href={channel.ctaLink}>
                          {channel.ctaText}
                          <Icon className="ml-2 h-4 w-4" />
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      );
    },
    'candidature-cta': (props) => {
      // Estraiamo le proprietà con valori di default per sicurezza
      const { 
          icon = 'ShieldCheck', 
          title = 'Pronto a Costruire il Tuo Patrimonio?', 
          subtitle = 'Questa non è una semplice consulenza. È l\'inizio di un percorso di trasformazione.', 
          ctaText = 'CANDIDATI ORA', 
          ctaLink = '#', 
          disclaimer = 'ATTENZIONE: Selezioniamo solo persone realmente motivate.', 
          backgroundColor = 'linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%)', 
          paddingY = 96 
      } = props as any;

      // Logica per rendere l'icona dinamica
      const CtaIcon = icons[icon as keyof typeof icons] || ShieldCheck;

      return (
        <section 
          style={{ 
            background: backgroundColor, 
            paddingTop: `${paddingY}px`,
            paddingBottom: `${paddingY}px`
          }}
        >
          <div className="container mx-auto max-w-4xl text-center px-6">
            <div className="mb-6 inline-block rounded-full bg-white/10 p-4 backdrop-blur-sm border border-white/20">
              <CtaIcon className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
              {title}
            </h2>
            <p className="mt-6 text-lg md:text-xl text-blue-200 max-w-3xl mx-auto">
              {subtitle}
            </p>
            <div className="mt-10">
              <Button asChild size="lg" className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white font-bold text-base sm:text-lg px-6 sm:px-10 py-4 sm:py-7 shadow-lg transition-transform hover:scale-105 transform-gpu">
                <a href={ctaLink}>{ctaText}</a>
              </Button>
            </div>
            <p className="mt-8 text-sm text-blue-300/80 max-w-2xl mx-auto italic">
              {disclaimer}
            </p>
          </div>
        </section>
      );
    },

    // Hero Dashboard Preview - Modern Landing Style
    'hero-dashboard-preview': (props) => {
      const {
        badgeIcon = '✓',
        badgeText = 'REAL RESULTS IN NO-TIME',
        title = 'Optimize your eCommerce',
        titleLineTwo = 'for Google and LLMs',
        highlightedTitle = 'in 48h with AI',
        subtitle = 'Speed Performances, SEO results, Security, UX & Accessibility.',
        videoUrl = '',
        videoProvider = 'youtube',
        videoAutoplay = false,
        videoMuted = true,
        videoControls = true,
        ctaText = 'Turbocharge your website',
        ctaLink = '#',
        backgroundColor = '#030c2d',
        badgeBackgroundColor = '#10b98133',
        badgeTextColor = '#10b981',
        badgeBorderColor = '#10b981',
        titleColor = '#ffffff',
        subtitleColor = '#cbd5e1',
        highlightColor = '#60a5fa',
        ctaBackgroundColor = '#3b82f6',
        ctaTextColor = '#ffffff',
        paddingY = 100
      } = props;

      // Video embed URL generator
      const getVideoEmbedUrl = () => {
        if (!videoUrl) return '';

        if (videoProvider === 'youtube') {
          const videoId = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
          return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=${videoAutoplay ? 1 : 0}&mute=${videoMuted ? 1 : 0}&controls=${videoControls ? 1 : 0}` : '';
        }

        if (videoProvider === 'vimeo') {
          const videoId = videoUrl.match(/vimeo\.com\/(\d+)/)?.[1];
          return videoId ? `https://player.vimeo.com/video/${videoId}?autoplay=${videoAutoplay ? 1 : 0}&muted=${videoMuted ? 1 : 0}` : '';
        }

        if (videoProvider === 'wistia') {
          const videoId = videoUrl.match(/wistia\.com\/medias\/([a-zA-Z0-9]+)/)?.[1] || videoUrl.match(/wi\.st\/([a-zA-Z0-9]+)/)?.[1];
          return videoId ? `https://fast.wistia.net/embed/iframe/${videoId}?autoplay=${videoAutoplay ? 1 : 0}&muted=${videoMuted ? 1 : 0}&controlsVisibleOnLoad=${videoControls ? 'true' : 'false'}` : '';
        }

        return videoUrl;
      };

      return (
        <section
          className="relative overflow-hidden"
          style={{
            backgroundColor,
            paddingTop: `${paddingY}px`,
            paddingBottom: `${paddingY}px`
          }}
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <div className="text-center">
              {/* Badge */}
              <div 
                className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2 border"
                style={{
                  backgroundColor: badgeBackgroundColor,
                  borderColor: badgeBorderColor
                }}
              >
                <span className="text-sm font-medium" style={{ color: badgeTextColor }}>{badgeIcon}</span>
                <span className="text-sm font-semibold uppercase tracking-wide" style={{ color: badgeTextColor }}>{badgeText}</span>
              </div>

              {/* Title */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
                <span className="block" style={{ color: titleColor }}>{title}</span>
                <span className="block" style={{ color: titleColor }}>{titleLineTwo}</span>
                <span className="block mt-2" style={{ color: highlightColor }}>{highlightedTitle}</span>
              </h1>

              {/* Subtitle */}
              <p 
                className="text-lg sm:text-xl md:text-2xl max-w-4xl mx-auto mb-12"
                style={{ color: subtitleColor }}
              >
                {subtitle}
              </p>

              {/* Video */}
              {videoUrl && (
                <div className="mb-12 max-w-5xl mx-auto">
                  <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                    <iframe
                      src={getVideoEmbedUrl()}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}

              {/* CTA Button */}
              <div className="mt-8">
                <Button
                  asChild
                  size="lg"
                  className="text-lg px-8 py-6 rounded-xl font-semibold shadow-lg hover:scale-105 transition-transform"
                  style={{
                    backgroundColor: ctaBackgroundColor,
                    color: ctaTextColor
                  }}
                >
                  <a href={ctaLink}>{ctaText}</a>
                </Button>
              </div>
            </div>
          </div>
        </section>
      );
    },
  };

  const Renderer = renderers[component.type];
  if (!Renderer) {
    // Placeholder for unknown components
    return (
      <div 
        key={component.id} 
        className={`relative group p-4 border border-dashed border-red-300 bg-red-50 text-red-600 ${isEditing ? 'cursor-pointer' : ''} ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}`}
        ref={isEditing ? setNodeRef : undefined}
        style={isEditing ? style : {}}
        onClick={(e) => {
          e.stopPropagation();
          if (isEditing) onComponentClick?.(component.id);
        }}
      >
        <p className="text-center font-medium">Componente sconosciuto: <span className="font-bold">{component.type}</span></p>
        {isEditing && (
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="sm" variant="destructive" className="h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); onComponentDelete?.(component.id); }}>🗑️</Button>
          </div>
        )}
      </div>
    );
  }

  // Renderizza i componenti figli se esistono
  const childrenElements = component.children?.map((child) => 
    renderComponent(child, isEditing, onComponentClick, onComponentDelete, isSelected)
  );

  return (
    <div key={component.id} ref={isEditing ? setNodeRef : undefined} style={isEditing ? style : {}}>
      {Renderer(component.props, childrenElements)}
      {isEditing && component.type !== 'container' && ( // Non mostrare toolbar per container per evitare sovrapposizioni
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
          <Button 
            size="sm" 
            variant="secondary"
            className="h-8 w-8 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onComponentClick?.(component.id);
            }}
          >
            ✏️
          </Button>
          <Button 
            size="sm" 
            variant="destructive"
            className="h-8 w-8 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onComponentDelete?.(component.id);
            }}
          >
            🗑️
          </Button>
        </div>
      )}
      {isEditing && isSelected && (
        <div className="absolute top-0 left-0 bg-primary text-primary-foreground px-2 py-1 text-xs font-medium rounded-br z-10">
          Modifica in corso
        </div>
      )}
    </div>
  );
}

export function BuilderPageRenderer({ 
  page, 
  isEditing = false, 
  onComponentClick, 
  onComponentDelete, 
  onComponentReorder,
  selectedComponentId 
}: BuilderPageProps) {
  const { title, slug, metaTitle, metaDescription, ogImage, components } = page;

  // Prepare SEO data
  const seoTitle = metaTitle || title;
  const seoDescription = metaDescription || '';
  const seoImage = ogImage || undefined;

  return (
    <>
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        image={seoImage}
        url={`/${slug}`}
        usePageData={false}
      />
      <div className="min-h-screen bg-background" data-testid={`builder-page-${slug}`}>
        {!isEditing ? (
          components.length > 0 ? (
            components.map((component) => 
              renderComponent(component, false, onComponentClick, onComponentDelete, false)
            )
          ) : (
            <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
              <p className="text-muted-foreground">Nessun componente aggiunto a questa pagina.</p>
            </div>
          )
        ) : (
          <SortableContext items={components.map(c => c.id)} strategy={verticalListSortingStrategy}>
            {components.map((component) => (
              <SortableComponent
                key={component.id}
                component={component}
                isEditing={isEditing}
                onComponentClick={onComponentClick}
                onComponentDelete={onComponentDelete}
                isSelected={selectedComponentId === component.id}
              />
            ))}
            <EndDropZone />
          </SortableContext>
        )}
      </div>
    </>
  );
}