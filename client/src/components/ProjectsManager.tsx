import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  Star,
  ExternalLink,
  Users,
  CheckCircle,
  AlertCircle,
  Briefcase,
  Handshake,
  FolderOpen,
  Image as ImageIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type Project } from "@shared/schema";
import { ProjectEditor } from "./ProjectEditor";

interface ProjectsResponse {
  projects: Project[];
  total: number;
}

function ProjectCard({ project, onEdit, onDelete }: {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-all group overflow-hidden">
      <div className="relative h-40 bg-slate-100 overflow-hidden">
        {project.featuredImage ? (
          <img
            src={project.featuredImage}
            alt={project.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-10 h-10 text-slate-300" />
          </div>
        )}
        <div className="absolute top-2 left-2 flex gap-1.5">
          {project.isFeatured && (
            <Badge className="bg-amber-500 text-white border-0 text-xs shadow-sm">
              <Star className="w-3 h-3 mr-1" />
              In Evidenza
            </Badge>
          )}
        </div>
        <div className="absolute top-2 right-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="h-7 w-7 bg-white/90 backdrop-blur-sm shadow-sm hover:bg-white" data-testid={`button-actions-${project.id}`}>
                <MoreVertical className="w-3.5 h-3.5 text-slate-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => onEdit(project)} data-testid={`button-edit-${project.id}`}>
                <Edit className="w-4 h-4 mr-2" />
                Modifica
              </DropdownMenuItem>
              {project.projectUrl && (
                <DropdownMenuItem asChild>
                  <a href={project.projectUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Visualizza
                  </a>
                </DropdownMenuItem>
              )}
              {project.caseStudyUrl && (
                <DropdownMenuItem asChild>
                  <a href={project.caseStudyUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Case Study
                  </a>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => onDelete(project.id)}
                className="text-red-600 focus:text-red-600"
                data-testid={`button-delete-${project.id}`}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Elimina
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-slate-900 line-clamp-1">{project.title}</h3>
          {project.shortDescription && (
            <p className="text-sm text-slate-500 mt-1 line-clamp-2">{project.shortDescription}</p>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Users className="w-3.5 h-3.5" />
          <span>{project.clientName || "Nessun cliente"}</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant="outline" className={project.projectType === 'project'
            ? 'border-indigo-200 text-indigo-700 bg-indigo-50 text-xs'
            : 'border-violet-200 text-violet-700 bg-violet-50 text-xs'
          }>
            {project.projectType === 'project' ? (
              <><Briefcase className="w-3 h-3 mr-1" />Progetto</>
            ) : (
              <><Handshake className="w-3 h-3 mr-1" />Partnership</>
            )}
          </Badge>
          <Badge variant="outline" className={project.status === 'published'
            ? 'border-emerald-200 text-emerald-700 bg-emerald-50 text-xs'
            : 'border-slate-200 text-slate-600 bg-slate-50 text-xs'
          }>
            {project.status === 'published' ? (
              <><CheckCircle className="w-3 h-3 mr-1" />Pubblicato</>
            ) : (
              <><AlertCircle className="w-3 h-3 mr-1" />Bozza</>
            )}
          </Badge>
          {!project.isActive && (
            <Badge className="bg-red-50 text-red-600 border border-red-200 text-xs">Inattivo</Badge>
          )}
        </div>
        {project.technologies && project.technologies.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {project.technologies.slice(0, 3).map((tech, i) => (
              <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {tech}
              </span>
            ))}
            {project.technologies.length > 3 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                +{project.technologies.length - 3}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ProjectsManager() {
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [filter, setFilter] = useState("all");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: projectsData, isLoading } = useQuery<ProjectsResponse>({
    queryKey: ['/api/projects'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/projects", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      queryClient.invalidateQueries({ queryKey: ['/api/projects/featured'] });
      toast({ title: "Progetto creato con successo" });
      setIsEditingProject(false);
      setProjectToEdit(null);
    },
    onError: () => {
      toast({ title: "Errore nella creazione del progetto", variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", `/api/projects/${projectToEdit!.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      queryClient.invalidateQueries({ queryKey: ['/api/projects/featured'] });
      toast({ title: "Progetto aggiornato con successo" });
      setIsEditingProject(false);
      setProjectToEdit(null);
    },
    onError: () => {
      toast({ title: "Errore nell'aggiornamento del progetto", variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/projects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      queryClient.invalidateQueries({ queryKey: ['/api/projects/featured'] });
      toast({ title: "Progetto eliminato con successo" });
    },
    onError: () => {
      toast({ title: "Errore nell'eliminazione del progetto", variant: "destructive" });
    }
  });

  const handleDelete = (id: number) => {
    if (confirm("Sei sicuro di voler eliminare questo progetto?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (project: Project) => {
    setProjectToEdit(project);
    setIsEditingProject(true);
  };

  const handleNewProject = () => {
    setProjectToEdit(null);
    setIsEditingProject(true);
  };

  const handleCloseEditor = () => {
    setIsEditingProject(false);
    setProjectToEdit(null);
  };

  const handleSaveProject = (projectData: any) => {
    if (projectToEdit) {
      updateMutation.mutate(projectData);
    } else {
      createMutation.mutate(projectData);
    }
  };

  const filteredProjects = projectsData?.projects?.filter(project => {
    if (filter === "all") return true;
    if (filter === "featured") return project.isFeatured;
    if (filter === "draft") return project.status === "draft";
    if (filter === "published") return project.status === "published";
    if (filter === "project") return project.projectType === "project";
    if (filter === "partnership") return project.projectType === "partnership";
    return true;
  }) || [];

  const stats = {
    total: projectsData?.projects?.length || 0,
    featured: projectsData?.projects?.filter(p => p.isFeatured)?.length || 0,
    published: projectsData?.projects?.filter(p => p.status === 'published')?.length || 0,
    partnerships: projectsData?.projects?.filter(p => p.projectType === 'partnership')?.length || 0,
  };

  if (isEditingProject) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-50 to-slate-100">
        <ProjectEditor
          initialProject={projectToEdit || undefined}
          onSave={handleSaveProject}
          onPublish={handleSaveProject}
          onClose={handleCloseEditor}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestione Progetti</h1>
          <p className="text-sm text-slate-500 mt-1">
            Gestisci i progetti e le partnership della tua azienda
          </p>
        </div>
        <Button onClick={handleNewProject} className="bg-indigo-600 hover:bg-indigo-700 text-white" data-testid="button-new-project">
          <Plus className="w-4 h-4 mr-2" />
          Nuovo Progetto
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Totale</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">In Evidenza</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-2xl font-bold text-slate-900">{stats.featured}</p>
              <Star className="w-4 h-4 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Pubblicati</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-2xl font-bold text-slate-900">{stats.published}</p>
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Partnership</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-2xl font-bold text-slate-900">{stats.partnerships}</p>
              <Handshake className="w-4 h-4 text-indigo-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList className="bg-slate-100 p-1">
            <TabsTrigger value="all" className="text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm" data-testid="filter-all">Tutti</TabsTrigger>
            <TabsTrigger value="featured" className="text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm" data-testid="filter-featured">In Evidenza</TabsTrigger>
            <TabsTrigger value="published" className="text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm" data-testid="filter-published">Pubblicati</TabsTrigger>
            <TabsTrigger value="draft" className="text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm" data-testid="filter-draft">Bozze</TabsTrigger>
            <TabsTrigger value="project" className="text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm" data-testid="filter-project">Progetti</TabsTrigger>
            <TabsTrigger value="partnership" className="text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm" data-testid="filter-partnership">Partnership</TabsTrigger>
          </TabsList>
        </Tabs>
        <span className="text-sm text-slate-500">{filteredProjects.length} risultati</span>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="border-0 shadow-sm overflow-hidden">
              <Skeleton className="h-40 w-full rounded-none" />
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 text-center">
            <FolderOpen className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500 font-medium">Nessun progetto trovato</p>
            <p className="text-sm text-slate-400 mt-1">Crea il tuo primo progetto per iniziare</p>
            <Button onClick={handleNewProject} className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Nuovo Progetto
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
