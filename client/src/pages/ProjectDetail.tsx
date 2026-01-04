import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowLeft, 
  Briefcase,
  Handshake,
  Code,
  TrendingUp,
  Lightbulb,
  Clock,
  ExternalLink,
  BookOpen,
  CheckCircle,
  Rocket,
  Calendar,
  Building2,
  Quote,
  Users
} from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { Helmet } from "react-helmet";

export default function ProjectDetail() {
  const [, params] = useRoute("/progetti/:slug");
  const slug = params?.slug;

  const { data: project, isLoading, error } = useQuery<any>({ 
    queryKey: [`/api/projects/slug/${slug}`],
    enabled: !!slug,
    retry: 1
  });

  const { data: allProjectsData } = useQuery<any>({ 
    queryKey: ['/api/projects/public'],
    enabled: !!project
  });

  const relatedProjects = allProjectsData?.projects
    ?.filter((p: any) => p.id !== project?.id && p.category === project?.category)
    ?.slice(0, 3);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Rocket className="w-12 h-12 animate-pulse text-primary" />
          <p className="text-muted-foreground">Caricamento progetto...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Progetto non trovato</h2>
          <p className="text-muted-foreground mb-6">Il progetto che stai cercando non esiste o non è disponibile.</p>
          <Button asChild>
            <Link href="/progetti">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Torna ai progetti
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // Tenant isolation check: Ensure the fetched project belongs to the current user's tenant.
  // This is a basic check; more robust checks might involve server-side validation.
  const currentUserTenantId = localStorage.getItem('tenantId'); // Assuming tenantId is stored in localStorage
  const projectTenantId = project.tenantId; // Assuming project object has a tenantId property

  if (currentUserTenantId && projectTenantId && currentUserTenantId !== projectTenantId) {
    // Redirect or show an error if the project is not accessible by the current tenant
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Accesso non autorizzato</h2>
          <p className="text-muted-foreground mb-6">Non hai i permessi per visualizzare questo progetto.</p>
          <Button asChild>
            <Link href="/progetti">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Torna ai progetti
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // Generate Breadcrumb Schema for SEO
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://yoursite.com';
  const breadcrumbItems = [
    { name: "Home", url: baseUrl },
    { name: "Progetti", url: `${baseUrl}/progetti` },
    { name: project.title, url: `${baseUrl}/progetti/${project.slug}` }
  ];

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
        title={project.metaTitle || project.title}
        description={project.metaDescription || project.shortDescription || `Scopri ${project.title} - progetto realizzato con successo`}
        image={project.featuredImage}
        url={`/progetti/${project.slug}`}
        type="article"
      />
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      </Helmet>

      <article className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Back Button */}
          <Button variant="ghost" asChild className="mb-8 hover:bg-primary/10">
            <Link href="/progetti">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Torna ai progetti
            </Link>
          </Button>

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
                <Badge className="bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 text-white border-0 shadow-lg font-semibold">
                  ⭐ In Evidenza
                </Badge>
              )}
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              {project.title}
            </h1>

            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground mb-8">
              {project.clientName && (
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
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
              <p className="text-lg text-foreground/70 leading-relaxed max-w-4xl whitespace-pre-wrap">
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
                className="w-full h-auto max-h-[500px] object-cover"
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
                  const parsed = JSON.parse(project.fullDescription);
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
                                  {Array.isArray(block.data.items) && block.data.items.map((item: any, i: number) => {
                                    // Estrai il testo dall'oggetto in modo sicuro
                                    let itemText = '';
                                    if (typeof item === 'string') {
                                      itemText = item;
                                    } else if (typeof item === 'object' && item !== null) {
                                      itemText = item.content || item.text || item.items || JSON.stringify(item);
                                    }
                                    return (
                                      <li key={i} className="text-muted-foreground">
                                        {itemText}
                                      </li>
                                    );
                                  })}
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
                  // Fallback se non è JSON valido
                  return (
                    <Card className="border-0 shadow-xl bg-gradient-to-br from-background to-background/50">
                      <CardHeader>
                        <CardTitle className="text-2xl">Descrizione del Progetto</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground leading-relaxed">{project.fullDescription}</p>
                      </CardContent>
                    </Card>
                  );
                }
              })()}

              {/* Challenge & Solution */}
              {(project.challenge || project.solution) && (
                <div className="grid md:grid-cols-2 gap-6">
                  {project.challenge && (
                    <Card className="border-0 shadow-xl bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20">
                      <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                          <Lightbulb className="w-5 h-5 text-orange-500" />
                          Sfida
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-foreground/80 leading-relaxed text-base whitespace-pre-wrap">{project.challenge}</p>
                      </CardContent>
                    </Card>
                  )}

                  {project.solution && (
                    <Card className="border-0 shadow-xl bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20">
                      <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-emerald-500" />
                          Soluzione
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-foreground/80 leading-relaxed text-base whitespace-pre-wrap">{project.solution}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Image Gallery */}
              {project.images && project.images.length > 0 && (
                <Card className="border-0 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-2xl">Galleria Immagini</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {project.images.map((img: string, idx: number) => (
                        <div key={idx} className="aspect-video overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300 group">
                          <img 
                            src={img} 
                            alt={`Gallery ${idx + 1}`} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Testimonial */}
              {project.testimonial && project.testimonial.text && (
                <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                  <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <Quote className="w-6 h-6 text-primary" />
                      Testimonianza Cliente
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <blockquote className="text-lg italic mb-6 leading-relaxed">
                      "{project.testimonial.text}"
                    </blockquote>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-primary font-bold text-lg">
                          {project.testimonial.author.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-lg">{project.testimonial.author}</p>
                        <p className="text-muted-foreground">
                          {project.testimonial.role}
                          {project.testimonial.company && ` - ${project.testimonial.company}`}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Results */}
              {project.results && project.results.length > 0 && (
                <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
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

              {/* Features Section */}
              {project.features && project.features.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      Caratteristiche Principali
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {project.features.map((feature, index) => {
                        // Handle both string and object features
                        const featureText = typeof feature === 'string' 
                          ? feature 
                          : feature?.content || JSON.stringify(feature);

                        return (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground">{featureText}</span>
                          </li>
                        );
                      })}
                    </ul>
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
                        <Badge key={idx} className="bg-gradient-to-r from-slate-100 to-slate-50 text-slate-700 border border-slate-200 font-medium">
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

          {/* Related Projects */}
          {relatedProjects && relatedProjects.length > 0 && (
            <div className="mt-16">
              <h2 className="text-3xl font-bold mb-8">Progetti Correlati</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {relatedProjects.map((relatedProject: any) => (
                  <Link key={relatedProject.id} href={`/progetti/${relatedProject.slug}`}>
                    <Card className="h-full border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden group">
                      {relatedProject.featuredImage ? (
                        <div className="aspect-video overflow-hidden">
                          <img 
                            src={relatedProject.featuredImage} 
                            alt={relatedProject.title} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                      ) : (
                        <div className="aspect-video flex items-center justify-center bg-gradient-to-br from-primary/20 via-primary/10 to-accent/10">
                          <Rocket className="w-16 h-16 text-primary/40" />
                        </div>
                      )}
                      <CardHeader>
                        <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                          {relatedProject.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {relatedProject.shortDescription}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </article>
    </>
  );
}