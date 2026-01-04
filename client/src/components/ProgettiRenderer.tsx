import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  ExternalLink,
  Calendar,
  Users,
  Trophy,
  Rocket,
  Target,
  Clock,
  Star,
  CheckCircle,
  ArrowRight,
  Filter,
  Search,
  Code,
  TrendingUp,
  Briefcase,
  Handshake,
  Lightbulb
} from "lucide-react";
import { type Project } from "@shared/schema";

interface ProgettiRendererProps {
  sections?: {
    [sectionId: string]: {
      elements: {
        [elementKey: string]: {
          value: any;
          editable: boolean;
        };
      };
    };
  };
}

interface ProjectsResponse {
  projects: Project[];
  total: number;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'development': return <Code className="w-4 h-4" />;
    case 'marketing': return <TrendingUp className="w-4 h-4" />;
    case 'consulting': return <Lightbulb className="w-4 h-4" />;
    default: return <Briefcase className="w-4 h-4" />;
  }
};

const getCategoryLabel = (category: string) => {
  switch (category) {
    case 'development': return 'Sviluppo';
    case 'marketing': return 'Marketing';
    case 'consulting': return 'Consulenza';
    default: return category;
  }
};

function ProjectCard({ project }: { project: Project }) {
  return (
    <div className="group">
      <Card className="h-full glass-card border-0 shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden bg-gradient-to-br from-card via-card to-background/50">
        <div className="relative overflow-hidden">
          {project.featuredImage ? (
            <div className="aspect-video overflow-hidden">
              <img
                src={project.featuredImage}
                alt={project.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                data-testid={`img-project-${project.id}`}
              />
            </div>
          ) : (
            <div className="aspect-video flex items-center justify-center bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
              <div className="text-center">
                <Rocket className="w-16 h-16 mx-auto text-primary/40 mb-4" />
                <p className="text-sm text-muted-foreground font-medium">Progetto</p>
              </div>
            </div>
          )}

          {/* Overlay gradiente */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Badges superiori */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
            <Badge variant="outline" className="bg-background/90 backdrop-blur-sm border-primary/20 text-primary font-medium">
              {project.projectType === 'project' ? (
                <>
                  <Briefcase className="w-3 h-3 mr-1" />
                  Progetto
                </>
              ) : (
                <>
                  <Handshake className="w-3 h-3 mr-1" />
                  Partnership
                </>
              )}
            </Badge>

            {project.isFeatured && (
              <Badge variant="default" className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg">
                <Star className="w-3 h-3 mr-1" />
                In Evidenza
              </Badge>
            )}
          </div>
        </div>

        <CardHeader className="pb-4 px-6 pt-6">
          <CardTitle className="text-xl mb-3 group-hover:text-primary transition-colors line-clamp-2 font-bold" data-testid={`text-project-title-${project.id}`}>
            {project.title}
          </CardTitle>

          {project.clientName && (
            <CardDescription className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <Users className="w-4 h-4 text-primary/60" />
              <span className="font-medium">Cliente:</span>
              <span className="text-foreground font-medium">{project.clientName}</span>
            </CardDescription>
          )}

          {project.shortDescription && (
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3" data-testid={`text-project-description-${project.id}`}>
              {project.shortDescription}
            </p>
          )}
        </CardHeader>

        <CardContent className="pt-0 px-6 space-y-5">
          {/* Technologies */}
          {project.technologies && project.technologies.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                {getCategoryIcon(project.category || '')}
                Tecnologie
              </h4>
              <div className="flex flex-wrap gap-2">
                {project.technologies.slice(0, 4).map((tech, i) => (
                  <Badge key={i} variant="secondary" className="text-xs px-3 py-1 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors">
                    {tech}
                  </Badge>
                ))}
                {project.technologies.length > 4 && (
                  <Badge variant="secondary" className="text-xs px-3 py-1 bg-muted text-muted-foreground">
                    +{project.technologies.length - 4}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Duration & Timeline */}
          {(project.duration || (project.startDate && project.endDate)) && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <Clock className="w-4 h-4 text-primary" />
                Timeline
              </h4>
              <div className="space-y-2 text-sm">
                {project.duration && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Durata:</span>
                    <span className="font-medium text-primary">{project.duration}</span>
                  </div>
                )}
                {project.startDate && project.endDate && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    <span className="text-xs">
                      {new Date(project.startDate).toLocaleDateString('it-IT')} - {new Date(project.endDate).toLocaleDateString('it-IT')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Results */}
          {project.results && project.results.length > 0 && (
            <div className="glass rounded-lg p-4 bg-gradient-to-r from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200/30 dark:border-green-800/30">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-foreground">
                <Target className="w-4 h-4 text-green-600 dark:text-green-400" />
                Risultati Raggiunti
              </h4>
              <div className="space-y-2">
                {project.results.slice(0, 2).map((result, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-foreground">{result.metric}:</span>
                      <span className="ml-2 text-green-700 dark:text-green-300 font-bold">{result.value}</span>
                    </div>
                  </div>
                ))}
                {project.results.length > 2 && (
                  <p className="text-xs text-green-600/80 dark:text-green-400/80 font-medium">
                    +{project.results.length - 2} altri risultati
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-5 px-6 pb-6 border-t border-border/30">
          <div className="flex items-center justify-between w-full gap-3">
            <Badge variant="outline" className="text-xs px-3 py-1.5 font-medium border-primary/30 text-primary bg-primary/5">
              {getCategoryIcon(project.category)}
              <span className="ml-1.5">{getCategoryLabel(project.category || '')}</span>
            </Badge>

            <div className="flex gap-2">
              <Button size="sm" variant="default" asChild className="h-9 px-4 bg-primary hover:bg-primary/90 shadow-md transition-all hover:scale-105">
                <a href={`/progetti/${project.slug}`} data-testid={`button-project-detail-${project.id}`}>
                  <ArrowRight className="w-3 h-3 mr-1.5" />
                  Scopri di più
                </a>
              </Button>
              {project.projectUrl && (
                <Button size="sm" variant="ghost" asChild className="h-9 px-3 hover:bg-primary/10 hover:text-primary transition-all hover:scale-105">
                  <a href={project.projectUrl} target="_blank" rel="noopener noreferrer" data-testid={`button-project-url-${project.id}`}>
                    <ExternalLink className="w-3 h-3 mr-1.5" />
                    Visita
                  </a>
                </Button>
              )}
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

function ProjectsGrid({ projects }: { projects: Project[] }) {
  if (!projects.length) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
          <Trophy className="w-12 h-12 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Nessun progetto trovato</h3>
        <p className="text-muted-foreground max-w-md mx-auto mb-6">
          Non ci sono progetti da mostrare in questa categoria. Torna presto per vedere i nostri lavori!
        </p>
        <Button variant="outline">
          <ArrowRight className="w-4 h-4 mr-2" />
          Esplora Altri Progetti
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="h-full">
          <div className="aspect-video">
            <Skeleton className="w-full h-full rounded-t-lg" />
          </div>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-14" />
            </div>
          </CardContent>
          <CardFooter>
            <Skeleton className="h-8 w-24" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

export default function ProgettiRenderer({ sections }: ProgettiRendererProps) {
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Funzione per ottenere valore da sezione (stesso pattern dell'HomepageRenderer)
  const getSectionValue = (sectionId: string, elementKey: string, fallback: any = "") => {
    return sections?.[sectionId]?.elements?.[elementKey]?.value || fallback;
  };

  // Fetch all projects
  const { data: allProjectsData, isLoading: allProjectsLoading } = useQuery<ProjectsResponse>({
    queryKey: ['/api/projects'],
    enabled: true,
  });

  // Fetch featured projects
  const { data: featuredProjects, isLoading: featuredLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects/featured'],
    enabled: true,
  });

  // Fetch projects by category
  const { data: developmentProjects, isLoading: developmentLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects/category/development'],
    enabled: true,
  });

  const { data: marketingProjects, isLoading: marketingLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects/category/marketing'],
    enabled: true,
  });

  const { data: consultingProjects, isLoading: consultingLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects/category/consulting'],
    enabled: true,
  });

  // Fetch projects by type
  const { data: projectsOnly, isLoading: projectsOnlyLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects/type/project'],
    enabled: true,
  });

  const { data: partnerships, isLoading: partnershipsLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects/type/partnership'],
    enabled: true,
  });

  const getActiveContent = () => {
    switch (activeTab) {
      case "featured":
        return { data: featuredProjects, isLoading: featuredLoading };
      case "development":
        return { data: developmentProjects, isLoading: developmentLoading };
      case "marketing":
        return { data: marketingProjects, isLoading: marketingLoading };
      case "consulting":
        return { data: consultingProjects, isLoading: consultingLoading };
      case "projects":
        return { data: projectsOnly, isLoading: projectsOnlyLoading };
      case "partnerships":
        return { data: partnerships, isLoading: partnershipsLoading };
      default:
        return { data: allProjectsData?.projects, isLoading: allProjectsLoading };
    }
  };

  const { data: activeData, isLoading: activeLoading } = getActiveContent();

  // Filter projects based on search term
  const filteredProjects = activeData?.filter(project =>
    searchTerm === "" ||
    project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.shortDescription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.clientName?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5" />
        <div className="relative max-w-7xl mx-auto container-padding text-center">
          <div className="space-y-6">
            <Badge 
              className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors"
              data-testid="badge-portfolio"
            >
              <Trophy className="w-3 h-3 mr-1.5" />
              {getSectionValue("hero", "badge", "Portfolio Progetti")}
            </Badge>

            <h1 
              className="text-responsive-xl font-bold leading-[0.9] tracking-tight max-w-4xl mx-auto" 
              data-testid="text-hero-title"
            >
              {getSectionValue("hero", "titlePart1", "I Miei")}
              <span className="block bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent mt-2">
                {getSectionValue("hero", "titlePart2", "Progetti")}
              </span>
            </h1>

            <p 
              className="text-responsive-md text-muted-foreground max-w-2xl mx-auto leading-relaxed"
              data-testid="text-hero-description"
            >
              {getSectionValue("hero", "description", "Scopri i progetti e le partnership che hanno trasformato il business dei nostri clienti. Ogni progetto racconta una storia di successo, innovazione e crescita digitale.")}
            </p>

            {/* Stats */}
            <div className="flex items-center justify-center gap-8 pt-8">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-primary mb-1">
                  <Trophy className="w-5 h-5" />
                  <span className="text-2xl font-bold" data-testid="stat-total-projects">
                    {allProjectsData?.total || 0}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {getSectionValue("hero", "statLabel1", "Progetti Completati")}
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-primary mb-1">
                  <Star className="w-5 h-5" />
                  <span className="text-2xl font-bold" data-testid="stat-featured-projects">
                    {featuredProjects?.length || 0}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {getSectionValue("hero", "statLabel2", "In Evidenza")}
                </p>
              </div>
            </div>

            {/* Search */}
            <div className="max-w-md mx-auto pt-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder={getSectionValue("hero", "searchPlaceholder", "Cerca progetti...")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-2xl py-4 pl-12 pr-6 text-base shadow-lg border-0 bg-background/80 backdrop-blur-sm focus:bg-background transition-all"
                  data-testid="input-search"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto container-padding">
          <div>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex items-center justify-center mb-12">
                <TabsList className="grid w-full max-w-4xl grid-cols-3 lg:grid-cols-7 h-auto p-1 bg-muted/50 backdrop-blur-sm rounded-2xl">
                  <TabsTrigger value="all" className="rounded-xl text-sm font-medium px-4 py-3" data-testid="tab-all">
                    <Filter className="w-4 h-4 mr-2" />
                    Tutti
                  </TabsTrigger>
                  <TabsTrigger value="featured" className="rounded-xl text-sm font-medium px-4 py-3" data-testid="tab-featured">
                    <Star className="w-4 h-4 mr-2" />
                    In Evidenza
                  </TabsTrigger>
                  <TabsTrigger value="development" className="rounded-xl text-sm font-medium px-4 py-3" data-testid="tab-development">
                    <Code className="w-4 h-4 mr-2" />
                    Sviluppo
                  </TabsTrigger>
                  <TabsTrigger value="marketing" className="rounded-xl text-sm font-medium px-4 py-3" data-testid="tab-marketing">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Marketing
                  </TabsTrigger>
                  <TabsTrigger value="consulting" className="rounded-xl text-sm font-medium px-4 py-3" data-testid="tab-consulting">
                    <Lightbulb className="w-4 h-4 mr-2" />
                    Consulenza
                  </TabsTrigger>
                  <TabsTrigger value="projects" className="rounded-xl text-sm font-medium px-4 py-3" data-testid="tab-projects">
                    <Briefcase className="w-4 h-4 mr-2" />
                    Progetti
                  </TabsTrigger>
                  <TabsTrigger value="partnerships" className="rounded-xl text-sm font-medium px-4 py-3" data-testid="tab-partnerships">
                    <Handshake className="w-4 h-4 mr-2" />
                    Partnership
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value={activeTab} className="mt-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-semibold" data-testid="text-section-title">
                    {activeTab === "all" && getSectionValue("projects", "titleAll", "Tutti i Progetti")}
                    {activeTab === "featured" && getSectionValue("projects", "titleFeatured", "Progetti in Evidenza")}
                    {activeTab === "development" && getSectionValue("projects", "titleDevelopment", "Progetti di Sviluppo")}
                    {activeTab === "marketing" && getSectionValue("projects", "titleMarketing", "Progetti di Marketing")}
                    {activeTab === "consulting" && getSectionValue("projects", "titleConsulting", "Progetti di Consulenza")}
                    {activeTab === "projects" && getSectionValue("projects", "titleProjects", "Solo Progetti")}
                    {activeTab === "partnerships" && getSectionValue("projects", "titlePartnerships", "Partnership")}
                  </h2>

                  {filteredProjects.length > 0 && (
                    <Badge variant="outline" className="text-sm" data-testid="badge-count">
                      {filteredProjects.length} progett{filteredProjects.length === 1 ? 'o' : 'i'}
                    </Badge>
                  )}
                </div>

                {activeLoading ? (
                  <LoadingSkeleton />
                ) : (
                  <ProjectsGrid projects={filteredProjects} />
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>
    </div>
  );
}