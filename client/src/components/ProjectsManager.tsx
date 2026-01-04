import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  MoreHorizontal,
  Star,
  Calendar,
  ExternalLink,
  Users,
  Rocket,
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  Briefcase,
  Handshake,
  Filter
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type Project, type InsertProject } from "@shared/schema";
import { ProjectEditor } from "./ProjectEditor";

interface ProjectsResponse {
  projects: Project[];
  total: number;
}

function ProjectsTable({ projects, onEdit, onDelete }: { 
  projects: Project[]; 
  onEdit: (project: Project) => void; 
  onDelete: (id: number) => void; 
}) {
  if (!projects.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Nessun progetto trovato</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Progetto</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Categoria</TableHead>
          <TableHead>Stato</TableHead>
          <TableHead>Azioni</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.map((project) => (
          <TableRow key={project.id}>
            <TableCell>
              <div className="flex items-start gap-3">
                {project.featuredImage && (
                  <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0">
                    <img 
                      src={project.featuredImage} 
                      alt={project.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div>
                  <div className="font-medium flex items-center gap-2">
                    {project.title}
                    {project.isFeatured && <Star className="w-4 h-4 text-amber-500" />}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {project.shortDescription}
                  </div>
                  {project.technologies && project.technologies.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {project.technologies.slice(0, 3).map((tech, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                      {project.technologies.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{project.technologies.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                {project.clientName || "Non specificato"}
              </div>
            </TableCell>
            <TableCell>
              <Badge variant={project.projectType === 'project' ? 'default' : 'secondary'}>
                {project.projectType === 'project' ? (
                  <><Briefcase className="w-3 h-3 mr-1" />Progetto</>
                ) : (
                  <><Handshake className="w-3 h-3 mr-1" />Partnership</>
                )}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant="outline">
                {project.category === 'development' ? 'Sviluppo' : 
                 project.category === 'marketing' ? 'Marketing' : 
                 project.category === 'consulting' ? 'Consulenza' : project.category}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Badge variant={project.status === 'published' ? 'default' : 'secondary'}>
                  {project.status === 'published' ? (
                    <><CheckCircle className="w-3 h-3 mr-1" />Pubblicato</>
                  ) : (
                    <><AlertCircle className="w-3 h-3 mr-1" />Bozza</>
                  )}
                </Badge>
                {!project.isActive && (
                  <Badge variant="destructive" className="text-xs">Inattivo</Badge>
                )}
              </div>
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" data-testid={`button-actions-${project.id}`}>
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(project)} data-testid={`button-edit-${project.id}`}>
                    <Edit className="w-4 h-4 mr-2" />
                    Modifica
                  </DropdownMenuItem>
                  {project.projectUrl && (
                    <DropdownMenuItem asChild>
                      <a href={project.projectUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Visualizza Progetto
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
                    className="text-destructive"
                    data-testid={`button-delete-${project.id}`}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Elimina
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function ProjectsManager() {
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [filter, setFilter] = useState("all");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all projects
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
      toast({ title: "Progetto creato con successo!" });
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
      toast({ title: "Progetto aggiornato con successo!" });
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
      toast({ title: "Progetto eliminato con successo!" });
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

  // Show ProjectEditor in fullscreen when editing or creating
  if (isEditingProject) {
    return (
      <div className="fixed inset-0 z-50 bg-background">
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestione Progetti</h1>
          <p className="text-muted-foreground">
            Gestisci i progetti e le partnership della tua azienda
          </p>
        </div>
        <Button onClick={handleNewProject} data-testid="button-new-project">
          <Plus className="w-4 h-4 mr-2" />
          Nuovo Progetto
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Totale Progetti</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Evidenza</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              {stats.featured}
              <Star className="w-5 h-5 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pubblicati</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              {stats.published}
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Partnership</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              {stats.partnerships}
              <Handshake className="w-5 h-5 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtra Progetti
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
              <TabsTrigger value="all" data-testid="filter-all">Tutti</TabsTrigger>
              <TabsTrigger value="featured" data-testid="filter-featured">In Evidenza</TabsTrigger>
              <TabsTrigger value="published" data-testid="filter-published">Pubblicati</TabsTrigger>
              <TabsTrigger value="draft" data-testid="filter-draft">Bozze</TabsTrigger>
              <TabsTrigger value="project" data-testid="filter-project">Progetti</TabsTrigger>
              <TabsTrigger value="partnership" data-testid="filter-partnership">Partnership</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Projects Table */}
      <Card>
        <CardHeader>
          <CardTitle>Progetti ({filteredProjects.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[100px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <ProjectsTable 
              projects={filteredProjects}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}