import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  FileText,
  Users,
  BarChart3,
  Globe,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  TrendingUp,
  Calendar,
  Mail,
  X,
  Copy,
  Home,
  Settings,
  SearchCheck,
  Target,
  Rocket,
  LogOut,
  Palette,
  Lightbulb,
  Menu
} from "lucide-react";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { PageEditor } from './PageEditor';
import { LandingPageEditor } from './LandingPageEditor';
import { HomepageEditor } from './HomepageEditor';
import { BlogPageEditor } from './BlogPageEditor';
import { ContattiPageEditor } from './ContattiPageEditor';
import { CreateFromTemplateModal } from './CreateFromTemplateModal';
import { DragDropPageBuilder } from './DragDropPageBuilder';
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest, getAuthToken, setAuthToken, clearAuthToken } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { SettingsEditor } from './SettingsEditor';
import { BlogEditor } from "./BlogEditor";
import { AnalyticsDashboard } from "./AnalyticsDashboard";
import ProjectsManager from "./ProjectsManager";
import SEOSettings from "./SEOSettings";
import CandidateFormSettings from "./CandidateFormSettings";
import NavbarSettings from "./NavbarSettings";
import TenantSettings from "./TenantSettings";
import { PreviewFrame } from "./PreviewFrame";
import GoogleSheetsManager from "../pages/GoogleSheetsManager"; // Importa il nuovo componente
import { SEOHead } from "./SEOHead";
import FooterSettings from "./FooterSettings";

// Componente di login
function LoginForm({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/login", credentials);
      return response.json();
    },
    onSuccess: (data) => {
      // Controlla il ruolo prima di salvare il token
      if (data.user && data.user.role === 'superadmin') {
        setAuthToken(data.token);
        toast({
          title: "Login effettuato!",
          description: "Benvenuto nell'area superadmin.",
        });
        // Redirect immediato per superadmin
        setTimeout(() => {
          window.location.href = '/superadmin';
        }, 100);
      } else {
        setAuthToken(data.token);
        toast({
          title: "Login effettuato!",
          description: "Benvenuto nell'area amministrativa.",
        });
        onLoginSuccess();
      }
    },
    onError: (error) => {
      toast({
        title: "Errore di login",
        description: "Username o password non corretti.",
        variant: "destructive"
      });
      console.error('Login error:', error);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username && password) {
      loginMutation.mutate({ username, password });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login Amministratore</CardTitle>
          <CardDescription>Accedi all'area amministrativa</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              data-testid="login-username"
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              data-testid="login-password"
            />
            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending}
              data-testid="login-submit"
            >
              {loginMutation.isPending ? "Accesso..." : "Accedi"}
            </Button>
          </form>
          <div className="mt-4 text-sm text-gray-600">
            <p>Superadmin: superadmin / superadmin123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Componente per l'editor di servizi
function ServiceEditor({ serviceToEdit, onClose }: { serviceToEdit?: any; onClose?: () => void }) {
  const [title, setTitle] = useState(serviceToEdit ? serviceToEdit.title : "");
  const [slug, setSlug] = useState(serviceToEdit ? serviceToEdit.slug : "");
  const [description, setDescription] = useState(serviceToEdit ? serviceToEdit.description : "");
  const [shortDescription, setShortDescription] = useState(serviceToEdit ? serviceToEdit.shortDescription : "");
  const [price, setPrice] = useState(serviceToEdit ? serviceToEdit.price : "");
  const [priceDescription, setPriceDescription] = useState(serviceToEdit ? serviceToEdit.priceDescription : "");
  const [icon, setIcon] = useState(serviceToEdit ? serviceToEdit.icon : "");
  const [features, setFeatures] = useState(serviceToEdit ? serviceToEdit.features?.join('\n') || "" : "");
  const [benefits, setBenefits] = useState(serviceToEdit ? serviceToEdit.benefits?.join('\n') || "" : "");
  const [isPopular, setIsPopular] = useState(serviceToEdit ? serviceToEdit.isPopular : false);
  const [isFeatured, setIsFeatured] = useState(serviceToEdit ? serviceToEdit.isFeatured : false);
  const [category, setCategory] = useState(serviceToEdit ? serviceToEdit.category : "main");
  const [landingPageSlug, setLandingPageSlug] = useState(serviceToEdit ? serviceToEdit.landingPageSlug : "");
  const [ctaText, setCtaText] = useState(serviceToEdit ? serviceToEdit.ctaText || "Scopri di più" : "Scopri di più");
  const [order, setOrder] = useState(serviceToEdit ? serviceToEdit.order || 0 : 0);
  const [isActive, setIsActive] = useState(serviceToEdit ? serviceToEdit.isActive : true);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mutation per creare nuovo servizio
  const createServiceMutation = useMutation({
    mutationFn: async (serviceData: any) => {
      const response = await apiRequest("POST", "/api/services", serviceData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Servizio creato!",
        description: "Il servizio è stato salvato con successo.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/services'] });
      if (onClose) onClose();
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: "Errore nel salvare il servizio. Riprova più tardi.",
        variant: "destructive"
      });
      console.error('Create service error:', error);
    }
  });

  // Mutation per aggiornare servizio esistente
  const updateServiceMutation = useMutation({
    mutationFn: async ({ id, serviceData }: { id: number; serviceData: any }) => {
      const response = await apiRequest("PUT", `/api/services/${id}`, serviceData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Servizio aggiornato!",
        description: "Il servizio è stato salvato con successo.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/services'] });
      if (onClose) onClose();
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: "Errore nell'aggiornare il servizio. Riprova più tardi.",
        variant: "destructive"
      });
      console.error('Update service error:', error);
    }
  });

  const handleSave = () => {
    if (!title.trim()) {
      toast({
        title: "Errore",
        description: "Il titolo è obbligatorio.",
        variant: "destructive"
      });
      return;
    }

    if (!description.trim()) {
      toast({
        title: "Errore",
        description: "La descrizione è obbligatoria.",
        variant: "destructive"
      });
      return;
    }

    const cleanSlug = (slug.trim() || title.trim())
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const serviceData = {
      title: title.trim(),
      slug: cleanSlug,
      description: description.trim(),
      shortDescription: shortDescription?.trim() || null,
      price: price?.trim() || null,
      priceDescription: priceDescription?.trim() || null,
      icon: icon?.trim() || null,
      features: features.trim() ? features.split('\n').map(f => f.trim()).filter(f => f) : [],
      benefits: benefits.trim() ? benefits.split('\n').map(b => b.trim()).filter(b => b) : [],
      isPopular,
      isFeatured,
      category,
      landingPageSlug: landingPageSlug?.trim() || null,
      ctaText: ctaText?.trim() || "Scopri di più",
      order,
      isActive
    };

    if (serviceToEdit && serviceToEdit.id) {
      updateServiceMutation.mutate({ id: serviceToEdit.id, serviceData });
    } else {
      createServiceMutation.mutate(serviceData);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto my-8">
      <CardHeader>
        <CardTitle>{serviceToEdit ? "Modifica Servizio" : "Nuovo Servizio"}</CardTitle>
        <CardDescription>Configura i dettagli del servizio.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Input
            placeholder="Titolo del servizio"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
            }}
            data-testid="service-editor-title"
          />
          <Input
            placeholder="Slug (es. consulenza-strategica)"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            data-testid="service-editor-slug"
          />
          <Textarea
            placeholder="Descrizione completa"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            data-testid="service-editor-description"
          />
          <Input
            placeholder="Descrizione breve"
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            data-testid="service-editor-short-description"
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Prezzo (es. €299)"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              data-testid="service-editor-price"
            />
            <Input
              placeholder="Descrizione prezzo (es. /mese)"
              value={priceDescription}
              onChange={(e) => setPriceDescription(e.target.value)}
              data-testid="service-editor-price-description"
            />
          </div>
          <Input
            placeholder="Icona Lucide (es. Palette)"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            data-testid="service-editor-icon"
          />
        </div>

        <div className="space-y-4">
          <Textarea
            placeholder="Caratteristiche (una per riga)"
            value={features}
            onChange={(e) => setFeatures(e.target.value)}
            rows={6}
            data-testid="service-editor-features"
          />
          <Textarea
            placeholder="Benefici (uno per riga)"
            value={benefits}
            onChange={(e) => setBenefits(e.target.value)}
            rows={4}
            data-testid="service-editor-benefits"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full p-2 border rounded"
            data-testid="service-editor-category"
          >
            <option value="main">Servizio Principale</option>
            <option value="additional">Servizio Aggiuntivo</option>
          </select>
          <Input
            placeholder="Landing Page Slug (opzionale)"
            value={landingPageSlug}
            onChange={(e) => setLandingPageSlug(e.target.value)}
            data-testid="service-editor-landing-slug"
          />
          <Input
            placeholder="Testo CTA"
            value={ctaText}
            onChange={(e) => setCtaText(e.target.value)}
            data-testid="service-editor-cta-text"
          />
          <Input
            type="number"
            placeholder="Ordine di visualizzazione"
            value={order}
            onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
            data-testid="service-editor-order"
          />
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPopular"
                checked={isPopular}
                onChange={(e) => setIsPopular(e.target.checked)}
                data-testid="service-editor-popular"
              />
              <label htmlFor="isPopular" className="text-sm">Popolare</label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isFeatured"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                data-testid="service-editor-featured"
              />
              <label htmlFor="isFeatured" className="text-sm">In Evidenza</label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                data-testid="service-editor-active"
              />
              <label htmlFor="isActive" className="text-sm">Attivo</label>
            </div>
          </div>
        </div>

        <div className="col-span-2 flex justify-end space-x-4">
          <Button variant="outline" onClick={onClose}>Annulla</Button>
          <Button
            onClick={handleSave}
            data-testid="service-editor-save"
            disabled={createServiceMutation.isPending || updateServiceMutation.isPending}
          >
            {createServiceMutation.isPending || updateServiceMutation.isPending ? "Salvando..." : "Salva Servizio"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [postToEdit, setPostToEdit] = useState(null);
  const [pageToEdit, setPageToEdit] = useState(null);
  const [isEditingService, setIsEditingService] = useState(false);
  const [serviceToEdit, setServiceToEdit] = useState(null);
  const [isEditingLandingPage, setIsEditingLandingPage] = useState(false);
  const [landingPageToEdit, setLandingPageToEdit] = useState(null);
  const [isEditingBuilderPage, setIsEditingBuilderPage] = useState(false);
  const [builderPageToEdit, setBuilderPageToEdit] = useState(null);
  const [isEditingHomepage, setIsEditingHomepage] = useState(false);
  const [homepageToEdit, setHomepageToEdit] = useState(null);
  const [isEditingBlogPage, setIsEditingBlogPage] = useState(false);
  const [blogPageToEdit, setBlogPageToEdit] = useState(null);
  const [isEditingContattiPage, setIsEditingContattiPage] = useState(false);
  const [contattiPageToEdit, setContattiPageToEdit] = useState(null);
  const [isCreatingFromTemplate, setIsCreatingFromTemplate] = useState(false);
  const [templateSource, setTemplateSource] = useState('');
  const [homepageMode, setHomepageMode] = useState('static');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ username?: string } | null>(null); // State for current user
  const [isEditingPage, setIsEditingPage] = useState(false);
  const [pageTemplateType, setPageTemplateType] = useState('homepage');
  const [isCreatingCustomPage, setIsCreatingCustomPage] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [isEditingLeadStatus, setIsEditingLeadStatus] = useState(false);

  // Fetch current user data
  const { data: userData } = useQuery({
    queryKey: ['/api/auth/me'],
    enabled: isAuthenticated,
  });

  // Fetch current tenant info
  const { data: tenantInfo } = useQuery({
    queryKey: ['/api/tenant/info'],
    enabled: isAuthenticated,
  });

  // Update currentUser when userData changes
  useEffect(() => {
    if (userData) {
      setCurrentUser(userData);
    }
  }, [userData]);

  // Mapping slug -> templateType per determinare quale template utilizzare
  const getTemplateType = (slug) => {
    switch (slug) {
      case 'home':
      case 'homepage':
        return 'homepage';
      case 'chi-siamo':
        return 'chi-siamo';
      case 'servizi':
        return 'servizi';
      case 'contatti':
        return 'contatti';
      case 'faq':
        return 'faq';
      case 'progetti':
        return 'progetti';
      case 'blog':
        return 'blog';
      default:
        return 'homepage'; // default fallback
    }
  };

  const handleNewPage = (templateType: string | React.MouseEvent = 'homepage') => {
    // Ensure templateType is a string, not an event object
    const actualTemplateType = typeof templateType === 'string' ? templateType : 'homepage';
    setPageToEdit(null);
    setPageTemplateType(actualTemplateType);
    setIsEditingPage(true);
  };

  const handleCreateCustomPage = (title: string, slug: string, templateType: string) => {
    setPageToEdit(null);
    setPageTemplateType(templateType);
    setIsEditingPage(true);
    setIsCreatingCustomPage(false);
  };

  const handleEditPage = (page) => {
    // Logica speciale per homepage
    if (page.slug === 'home' || page.slug === 'homepage') {
      setHomepageToEdit(page);
      setIsEditingHomepage(true);
      return;
    }

    // Logica speciale per blog page
    if (page.slug === 'blog') {
      setBlogPageToEdit(page);
      setIsEditingBlogPage(true);
      return;
    }

    // Logica speciale per contatti page
    if (page.slug === 'contatti') {
      setContattiPageToEdit(page);
      setIsEditingContattiPage(true);
      return;
    }

    // Determina il template type basato sullo slug della pagina
    const templateType = getTemplateType(page.slug);
    setPageToEdit(page);
    setPageTemplateType(templateType);
    setIsEditingPage(true);
  };

  const handleClosePageEditor = () => {
    setIsEditingPage(false);
    setPageToEdit(null);
    setPageTemplateType('homepage');
  };
  const handleCloseHomepageEditor = () => {
    setIsEditingHomepage(false);
    setHomepageToEdit(null);
  };

  const handleCloseBlogPageEditor = () => {
    setIsEditingBlogPage(false);
    setBlogPageToEdit(null);
  };

  const handleCloseContattiPageEditor = () => {
    setIsEditingContattiPage(false);
    setContattiPageToEdit(null);
  };


  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch blog posts from API
  const { data: blogPostsData, isLoading: isLoadingPosts } = useQuery({
    queryKey: ['/api/blog'],
    enabled: isAuthenticated,
  });

  // Fetch services from API
  const { data: servicesData, isLoading: isLoadingServices } = useQuery({
    queryKey: ['/api/services'],
    enabled: isAuthenticated,
  });

  // Fetch landing pages from API
  const { data: landingPagesData, isLoading: isLoadingLandingPages } = useQuery({
    queryKey: ['/api/landing-pages'],
    enabled: isAuthenticated,
  });

  // Fetch dashboard stats from API
  const { data: statsData, isLoading: isLoadingStats } = useQuery<any>({ queryKey: ['/api/dashboard/stats'] });
  const { data: projectsData } = useQuery<any>({ queryKey: ['/api/projects'] });
  const { data: settingsData } = useQuery<any>({ queryKey: ['/api/settings'] });

  // Mutation for saving blog posts
  const savePostMutation = useMutation({
    mutationFn: (postData: any) => {
        const url = postData.id ? `/api/blog/${postData.id}` : '/api/blog';
        const method = postData.id ? 'PUT' : 'POST';
        return apiRequest(method, url, postData);
    },
    onSuccess: () => {
        toast({ title: "Articolo salvato!" });
        queryClient.invalidateQueries({ queryKey: ['/api/blog'] });
        handleCloseEditor();
    },
    onError: () => toast({ title: "Errore nel salvataggio", variant: "destructive" })
  });

  // Mutation for duplicating landing page
  const duplicateLandingPageMutation = useMutation({
    mutationFn: async ({ id, title, slug }: { id: number; title: string; slug: string }) => {
      const response = await apiRequest("POST", `/api/landing-pages/${id}/duplicate`, { title, slug });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Landing page duplicata!",
        description: "La landing page è stata duplicata con successo.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/landing-pages'] });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Errore nella duplicazione della landing page.",
        variant: "destructive"
      });
    }
  });

  // Mutation for toggling landing page status
  const toggleLandingPageStatusMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/landing-pages/${id}/toggle-status`),
    onSuccess: () => {
      toast({ title: "Status cambiato con successo!" });
      queryClient.invalidateQueries({ queryKey: ['/api/landing-pages'] });
    },
    onError: () => toast({ title: "Errore nel cambio status", variant: "destructive" })
  });

  // Mutation for deleting landing page
  const deleteLandingPageMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/landing-pages/${id}`);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Landing page eliminata!",
        description: "La landing page è stata eliminata con successo.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/landing-pages'] });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Errore nell'eliminazione della landing page.",
        variant: "destructive"
      });
    }
  });

  const { data: pagesData, isLoading: isLoadingPages, refetch: refetchPages } = useQuery({
    queryKey: ['/api/pages'],
    enabled: isAuthenticated,
  });
  const pages = pagesData?.pages || [];

  const savePageMutation = useMutation({
    mutationFn: (pageData: any) => {
      const url = pageData.id ? `/api/pages/${pageData.id}` : '/api/pages';
      const method = pageData.id ? 'PUT' : 'POST';
      return apiRequest(method, url, pageData);
    },
    onSuccess: () => {
      toast({ title: "Pagina salvata con successo!" });
      queryClient.invalidateQueries({ queryKey: ['/api/pages'] });
      handleClosePageEditor();
    },
    onError: () => toast({ title: "Errore nel salvataggio della pagina", variant: "destructive" })
  });

  // Mutation for deleting page
  const deletePageMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/pages/${id}`);
      return response;
    },
    onSuccess: () => {
      toast({ title: "Pagina eliminata con successo!" });
      queryClient.invalidateQueries({ queryKey: ['/api/pages'] });
    },
    onError: () => toast({ title: "Errore nell'eliminazione della pagina", variant: "destructive" })
  });

  // Mutation for creating from Patrimonio template
  const createFromPatrimonioTemplateMutation = useMutation({
    mutationFn: async ({ title, slug }: { title: string; slug: string }) => {
      const response = await apiRequest("POST", "/api/landing-pages/duplicate-from-patrimonio", { title, slug });
      return response.json();
    },
    onSuccess: (landingPage) => {
      toast({
        title: "Landing page creata dal template!",
        description: "La landing page basata sul template Patrimonio è stata creata con successo.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/landing-pages'] });
      setLandingPageToEdit(landingPage);
      setIsEditingLandingPage(true);
      setIsCreatingFromTemplate(false);
    },
    onError: (error) => {
      console.error('Create from template error:', error);
      toast({
        title: "Errore",
        description: "Errore nella creazione della landing page dal template.",
        variant: "destructive"
      });
    }
  });

  // Fetch builder pages from API
  const { data: builderPagesData, isLoading: isLoadingBuilderPages } = useQuery({
    queryKey: ['/api/builder-pages'],
    enabled: isAuthenticated,
  });

  // Mutation for toggling builder page status
  const toggleBuilderPageStatusMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/builder-pages/${id}/toggle-status`),
    onSuccess: () => {
      toast({ title: "Status cambiato con successo!" });
      queryClient.invalidateQueries({ queryKey: ['/api/builder-pages'] });
    },
    onError: () => toast({ title: "Errore nel cambio status", variant: "destructive" })
  });

  // Mutation for deleting builder page
  const deleteBuilderPageMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/builder-pages/${id}`);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Builder page eliminata!",
        description: "La builder page è stata eliminata con successo.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/builder-pages'] });
    },
    onError: () => {
      toast({
        title: "Errore nell'eliminazione",
        description: "Impossibile eliminare la builder page.",
        variant: "destructive"
      });
    }
  });

  // Fetch leads from API
  const { data: leadsData, isLoading: isLoadingLeads } = useQuery({
    queryKey: ['/api/leads'],
    enabled: isAuthenticated,
  });

  // Controlla se l'utente è già autenticato al caricamento
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      refetchPages(); // Assicura che le pagine siano caricate
      queryClient.invalidateQueries();
    }
  }, [isAuthenticated, queryClient, refetchPages]);

  useEffect(() => {
    if (settingsData?.homepageMode) {
      setHomepageMode(settingsData.homepageMode);
    }
  }, [settingsData]);

  // Mutation for activating homepage - MOVED TO TOP
  const activateHomepageMutation = useMutation({
    mutationFn: (useCustom: boolean) => apiRequest("POST", "/api/pages/activate-homepage", { useCustom }),
    onSuccess: (data) => {
      setHomepageMode(data.mode);
      toast({ title: `Homepage ${data.mode === 'custom' ? 'personalizzata' : 'statica'} attivata!` });
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/pages/home'] });
    },
    onError: () => toast({ title: "Errore nell'attivazione homepage", variant: "destructive" })
  });

  const blogPosts = blogPostsData?.posts || [];
  const services = servicesData || [];
  const landingPages = landingPagesData?.landingPages || [];
  const builderPages = builderPagesData?.pages || [];

  // Calculate real stats from fetched data
  const realStats = {
    totalPages: (pages?.length || 0) + (landingPages?.length || 0),
    totalPosts: blogPosts?.length || 0,
    totalServices: services?.length || 0,
    totalLeads: leadsData?.total || statsData?.totalLeads || 0,
    monthlyViews: statsData?.monthlyViews || 0,
    totalViews: statsData?.totalViews || 0,
    conversionRate: statsData?.conversionRate || 0
  };

  const handleCloseEditor = () => {
    setIsEditingPost(false);
    setPostToEdit(null);
  };

  if (isEditingPage) {
    return (
      <div className="h-screen">
        <PageEditor
          pageToEdit={pageToEdit}
          templateType={pageTemplateType}
          onClose={handleClosePageEditor}
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  if (isEditingPost) {
    return (
      <div className="h-screen">
        <BlogEditor
          initialPost={postToEdit}
          onSave={(data) => savePostMutation.mutate(data)}
          onPublish={(data) => savePostMutation.mutate({ ...data, status: 'published' })}
          onClose={handleCloseEditor}
        />
      </div>
    );
  }

  const handleEditPost = (post) => {
    setPostToEdit(post);
    setIsEditingPost(true);
  };

  const handleEditService = (service) => {
    setServiceToEdit(service);
    setIsEditingService(true);
  };

  const handleEditHomepage = (homepage) => {
    setHomepageToEdit(homepage);
    setIsEditingHomepage(true);
  };

  const handleCloseServiceEditor = () => {
    setIsEditingService(false);
    setServiceToEdit(null);
  };

  const handleEditLandingPage = (landingPage) => {
    setLandingPageToEdit(landingPage);
    setIsEditingLandingPage(true);
  };

  const handleCloseLandingPageEditor = () => {
    setIsEditingLandingPage(false);
    setLandingPageToEdit(null);
  };

  const handleEditBuilderPage = (page) => {
    setBuilderPageToEdit(page);
    setIsEditingBuilderPage(true);
  };

  const handleCloseBuilderPageEditor = () => {
    setIsEditingBuilderPage(false);
    setBuilderPageToEdit(null);
  };

  const handleToggleBuilderPageStatus = (id: number) => {
    toggleBuilderPageStatusMutation.mutate(id);
  };

  const handleDeleteBuilderPage = (id: number) => {
    if (confirm("Sei sicuro di voler eliminare questa builder page?")) {
      deleteBuilderPageMutation.mutate(id);
    }
  };

  const handleDuplicateLandingPage = (landingPage) => {
    const newTitle = prompt("Inserisci il titolo per la copia:", `${landingPage.title} - Copia`);
    if (!newTitle) return;

    const newSlug = prompt("Inserisci lo slug per la copia:", `${landingPage.slug}-copia`);
    if (!newSlug) return;

    duplicateLandingPageMutation.mutate({
      id: landingPage.id,
      title: newTitle,
      slug: newSlug
    });
  };

  const handleToggleLandingPageStatus = (id: number) => {
    toggleLandingPageStatusMutation.mutate(id);
  };

  const handleDeleteLandingPage = (id: number) => {
    if (confirm("Sei sicuro di voler eliminare questa landing page?")) {
      deleteLandingPageMutation.mutate(id);
    }
  };

  const handleCreateFromPatrimonioTemplate = () => {
    setIsCreatingFromTemplate(true);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      "Pubblicata": "default",
      "Pubblicato": "default",
      "Bozza": "secondary",
      "Programmato": "outline",
      "Nuovo": "destructive",
      "Contattato": "outline",
      "Approvato": "default"
    };
    return <Badge variant={variants[status as keyof typeof variants] as any}>{status}</Badge>;
  };

  // Menu items per la sidebar
  const menuItems = [
    {
      key: "overview",
      title: "Panoramica",
      icon: Home,
      isActive: activeTab === "overview"
    },
    {
      key: "preview",
      title: "Anteprima Sito",
      icon: Eye,
      isActive: activeTab === "preview"
    },
    {
      key: "pages",
      title: "Pagine",
      icon: Globe,
      isActive: activeTab === "pages"
    },
    {
      key: "homepage-duplicates",
      title: "Homepage Duplicate",
      icon: Copy,
      isActive: activeTab === "homepage-duplicates"
    },
    {
      key: "blog",
      title: "Blog",
      icon: FileText,
      isActive: activeTab === "blog"
    },
    {
      key: "services",
      title: "Servizi",
      icon: Palette,
      isActive: activeTab === "services"
    },
    {
      key: "projects",
      title: "Progetti",
      icon: Target,
      isActive: activeTab === "projects"
    },
    {
      key: "landing-pages",
      title: "Landing",
      icon: Rocket,
      isActive: activeTab === "landing-pages"
    },
    {
      key: "page-builder",
      title: "Page Builder",
      icon: Palette,
      isActive: activeTab === "page-builder"
    },
    {
      key: "seo",
      title: "SEO",
      icon: SearchCheck,
      isActive: activeTab === "seo"
    },
    {
      key: "navbar",
      title: "Navbar",
      icon: Menu,
      isActive: activeTab === "navbar"
    },
    {
      key: "tenant",
      title: "Sito",
      icon: Globe,
      isActive: activeTab === "tenant"
    },
    {
      key: "footer",
      title: "Footer",
      icon: Settings,
      isActive: activeTab === "footer"
    },
    {
      key: "settings",
      title: "Impostazioni",
      icon: Settings,
      isActive: activeTab === "settings"
    },
    {
      key: "analytics",
      title: "Analytics",
      icon: BarChart3,
      isActive: activeTab === "analytics"
    },
    {
      key: "leads",
      title: "Lead",
      icon: Users,
      isActive: activeTab === "leads"
    },
    {
      key: "candidate-form",
      title: "Form Candidatura",
      icon: FileText,
      isActive: activeTab === "candidate-form"
    },
    { // Nuova voce per Google Sheets
      key: "google-sheets",
      title: "Google Sheets",
      icon: FileText,
      isActive: activeTab === "google-sheets"
    }
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <Sidebar collapsible="icon" className="border-r">
          <SidebarHeader className="border-b px-4 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md">
                <Lightbulb className="h-6 w-6" />
              </div>
              <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                <h1 className="font-heading font-bold text-xl tracking-tight">CMS Dashboard</h1>
                <p className="text-xs text-muted-foreground mt-0.5">Gestione contenuti</p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="px-2 py-6">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu className="gap-1.5">
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.key}>
                      <SidebarMenuButton
                        isActive={item.isActive}
                        onClick={() => setActiveTab(item.key)}
                        className={`
                          w-full h-11 px-3 rounded-lg transition-all duration-200
                          ${item.isActive
                            ? 'bg-primary text-primary-foreground shadow-sm font-medium'
                            : 'hover:bg-accent hover:text-accent-foreground'
                          }
                          group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10
                          group-data-[collapsible=icon]:justify-center
                        `}
                        tooltip={item.title}
                      >
                        <item.icon className={`
                          ${item.isActive ? 'h-5 w-5' : 'h-4 w-4'}
                          transition-all duration-200
                          group-data-[collapsible=icon]:h-5 group-data-[collapsible=icon]:w-5
                        `} />
                        <span className="font-medium group-data-[collapsible=icon]:sr-only">
                          {item.title}
                        </span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t px-3 py-4">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => {
                    clearAuthToken();
                    setIsAuthenticated(false);
                    toast({
                      title: "Logout effettuato",
                      description: "Sei stato disconnesso con successo.",
                    });
                  }}
                  className="h-11 px-3 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors duration-200 font-medium"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="group-data-[collapsible=icon]:sr-only">Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex-1">
          <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-filter: blur(10px) supports-[backdrop-filter]:bg-background/60 px-6">
            <SidebarTrigger />
            <div className="flex items-center gap-4 ml-auto">
              <Badge variant="outline" className="font-medium">
                Admin
              </Badge>
            </div>
          </header>

          <main className="flex-1 p-6 space-y-6">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-8">
                {/* User and Tenant Info Header */}
                <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-primary/20">
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="space-y-2">
                        <h1 className="text-3xl font-bold">
                          Panoramica
                        </h1>
                        <div className="flex flex-col gap-1 text-sm">
                          {currentUser?.username && (
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="font-medium">
                                <Users className="h-3 w-3 mr-1" />
                                Utente: {currentUser.username}
                              </Badge>
                            </div>
                          )}
                          {tenantInfo && (
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="font-medium">
                                <Globe className="h-3 w-3 mr-1" />
                                Cliente: {tenantInfo.name}
                              </Badge>
                              <Badge variant="outline" className="font-medium">
                                Dominio: {tenantInfo.domain}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {tenantInfo && (
                          <Button
                            asChild
                            variant="default"
                            className="gap-2"
                          >
                            <a
                              href={tenantInfo.domain === 'localhost' ? '/' : `https://${tenantInfo.domain}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Eye className="h-4 w-4" />
                              Apri Sito
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Pagina Predefinita */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Home className="h-5 w-5" />
                      Pagina Predefinita (Homepage)
                    </CardTitle>
                    <CardDescription>
                      Imposta quale pagina viene mostrata quando gli utenti visitano il sito
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <Label htmlFor="default-homepage" className="sr-only">Pagina Predefinita</Label>
                        <select
                          id="default-homepage"
                          value={settingsData?.defaultHomepage || '/home'}
                          onChange={(e) => {
                            apiRequest('PUT', '/api/settings', {
                              key: 'defaultHomepage',
                              value: e.target.value
                            }).then(() => {
                              queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
                              toast({
                                title: "Pagina predefinita aggiornata!",
                                description: "La homepage è stata modificata con successo.",
                              });
                            });
                          }}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="/home">Home (default)</option>
                          {pages?.filter(p => p.status === 'published').map((page: any) => (
                            <option key={page.id} value={`/${page.slug}`}>
                              {page.title} (/{page.slug})
                            </option>
                          ))}
                          {landingPages?.filter((lp: any) => lp.isActive).map((lp: any) => (
                            <option key={`lp-${lp.id}`} value={`/${lp.slug}`}>
                              {lp.title} (/{lp.slug}) - Landing Page
                            </option>
                          ))}
                          {builderPages?.filter((bp: any) => bp.isActive).map((bp: any) => (
                            <option key={`bp-${bp.id}`} value={`/${bp.slug}`}>
                              {bp.title} (/{bp.slug}) - Builder Page
                            </option>
                          ))}
                        </select>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveTab('tenant')}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Altre Impostazioni
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <div>
                  <p className="text-muted-foreground">Gestisci tutti i contenuti del sito</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="hover:shadow-lg transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Pagine Totali</CardTitle>
                      <Globe className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold" data-testid="stat-total-pages">
                        {isLoadingPages || isLoadingLandingPages ? "..." : realStats.totalPages}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {(pages?.length || 0)} pagine + {(landingPages?.length || 0)} landing
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-lg transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Articoli Blog</CardTitle>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold" data-testid="stat-total-posts">
                        {isLoadingPosts ? "..." : realStats.totalPosts}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {blogPosts.filter(p => p.status === 'published').length} pubblicati
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-lg transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Servizi Attivi</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold" data-testid="stat-total-services">
                        {isLoadingServices ? "..." : realStats.totalServices}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {services.filter(s => s.isActive).length} attivi
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-lg transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Visualizzazioni</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold" data-testid="stat-monthly-views">
                        {isLoadingStats ? "..." : (realStats.totalViews || 0).toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Visite totali del sito
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">🚀 Azioni Rapide</CardTitle>
                    <CardDescription>
                      Gestisci rapidamente i contenuti del sito
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      <Button
                        className="h-20 flex-col space-y-2"
                        data-testid="button-create-homepage"
                        onClick={() => handleNewPage('homepage')}
                        variant="outline"
                      >
                        <Home className="h-5 w-5" />
                        <span>Homepage</span>
                      </Button>
                      <Button
                        className="h-20 flex-col space-y-2"
                        data-testid="button-create-chisiamo"
                        onClick={() => handleNewPage('chi-siamo')}
                        variant="outline"
                      >
                        <Users className="h-5 w-5" />
                        <span>Chi Siamo</span>
                      </Button>
                      <Button
                        className="h-20 flex-col space-y-2"
                        data-testid="button-create-servizi"
                        onClick={() => handleNewPage('servizi')}
                        variant="outline"
                      >
                        <Target className="h-5 w-5" />
                        <span>Servizi</span>
                      </Button>
                      <Button
                        className="h-20 flex-col space-y-2"
                        data-testid="button-create-contatti"
                        onClick={() => handleNewPage('contatti')}
                        variant="outline"
                      >
                        <Mail className="h-5 w-5" />
                        <span>Contatti</span>
                      </Button>
                      <Button
                        className="h-20 flex-col space-y-2"
                        data-testid="button-create-faq"
                        onClick={() => handleNewPage('faq')}
                        variant="outline"
                      >
                        <SearchCheck className="h-5 w-5" />
                        <span>FAQ</span>
                      </Button>
                      <Button
                        className="h-20 flex-col space-y-2"
                        data-testid="button-create-progetti"
                        onClick={() => handleNewPage('progetti')}
                        variant="outline"
                      >
                        <Rocket className="h-5 w-5" />
                        <span>Progetti</span>
                      </Button>
                      <Button
                        className="h-20 flex-col space-y-2"
                        data-testid="button-create-blog"
                        onClick={() => handleNewPage('blog')}
                        variant="outline"
                      >
                        <FileText className="h-5 w-5" />
                        <span>Blog</span>
                      </Button>
                      <Button
                        className="h-20 flex-col space-y-2"
                        data-testid="button-create-post"
                        onClick={() => setIsEditingPost(true)}
                        variant="outline"
                      >
                        <FileText className="h-5 w-5" />
                        <span>Nuovo Articolo</span>
                      </Button>
                      <Button
                        className="h-20 flex-col space-y-2"
                        data-testid="button-view-analytics"
                        onClick={() => setActiveTab('analytics')}
                        variant="outline"
                      >
                        <BarChart3 className="h-5 w-5" />
                        <span>Analytics</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Pages Tab */}
            {activeTab === "pages" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-3xl font-bold">Gestione Pagine</h2>
                  <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => {
                          const homePage = pages?.find(p => p.slug === 'home');
                          setHomepageToEdit(homePage || { slug: 'home', title: 'Homepage Personalizzata' });
                          setIsEditingHomepage(true);
                        }}
                      >
                        <Lightbulb className="mr-2 h-4 w-4" />
                        {pages?.find(p => p.slug === 'home' && p.isHomepageCustom) ? 'Modifica Homepage' : 'Crea Homepage Personalizzata'}
                      </Button>
                    <Button onClick={() => setIsCreatingCustomPage(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nuova Pagina
                    </Button>
                  </div>
                </div>
                <Card>
                  <CardContent className="pt-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Titolo</TableHead>
                          <TableHead>URL (Slug)</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Azioni</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoadingPages ? (
                          <TableRow><TableCell colSpan={4} className="text-center">Caricamento...</TableCell></TableRow>
                        ) : (
                          pages.filter(page => !page.isHomepageCustom || page.slug === 'home').map((page: any) => (
                            <TableRow key={page.id}>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="font-medium flex items-center gap-2">
                                    {page.title}
                                    {page.slug === 'home' && (
                                      <Badge variant={page.isHomepageCustom ? 'default' : 'secondary'}>
                                        {page.isHomepageCustom ? 'Personalizzata' : 'Statica'}
                                      </Badge>
                                    )}
                                    {page.isHomepageCustom && page.slug !== 'home' && (
                                      <Badge variant="outline">Homepage Personalizzata</Badge>
                                    )}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {page.isHomepageCustom ? '/home' : `/${page.slug}`}
                                  </div>
                                  {page.isHomepageCustom && page.slug !== 'home' && (
                                    <div className="text-xs text-blue-600">Clicca "Imposta come Predefinita" per attivarla</div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={page.status === 'published' ? 'default' : 'secondary'}>{page.status}</Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleEditPage(page)}>
                                      <Edit className="mr-2 h-4 w-4" />
                                      Modifica
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Eye className="mr-2 h-4 w-4" />
                                      Visualizza
                                    </DropdownMenuItem>
                                    {/* Opzioni per homepage attiva (slug = 'home') */}
                                    {(page.slug === 'home') && (
                                      <>
                                        <DropdownMenuItem onClick={() => activateHomepageMutation.mutate(false)}>
                                          <Home className="mr-2 h-4 w-4" />
                                          {homepageMode === 'static' ? '✓ In Uso (Statica)' : 'Usa Statica'}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => activateHomepageMutation.mutate(true)}>
                                          <Palette className="mr-2 h-4 w-4" />
                                          {homepageMode === 'custom' && page.isHomepageCustom ? '✓ In Uso (Personalizzata)' : 'Usa Personalizzata'}
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                    {/* Opzioni per homepage personalizzate non attive */}
                                    {page.isHomepageCustom && page.slug !== 'home' && (
                                      <DropdownMenuItem onClick={() => {
                                        // Converte la homepage personalizzata in homepage attiva
                                        const updateData = {
                                          id: page.id,
                                          title: page.title,
                                          slug: 'home',
                                          content: page.content,
                                          status: page.status,
                                          metaTitle: page.metaTitle,
                                          metaDescription: page.metaDescription,
                                          isHomepageCustom: true
                                        };
                                        savePageMutation.mutate(updateData);
                                        activateHomepageMutation.mutate(true);
                                      }}>
                                        <Home className="mr-2 h-4 w-4" />
                                        Imposta come Predefinita
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem
                                      onClick={() => deletePageMutation.mutate(page.id)}
                                      className="text-destructive"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Elimina
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Homepage Duplicates Tab */}
            {activeTab === "homepage-duplicates" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-3xl font-bold">Homepage Duplicate</h2>
                    <p className="text-muted-foreground">Gestisci le versioni personalizzate della homepage</p>
                  </div>
                  <Button
                    onClick={() => {
                      setHomepageToEdit(null);
                      setIsEditingHomepage(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nuova Homepage
                  </Button>
                </div>
                <Card>
                  <CardContent className="pt-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Titolo</TableHead>
                          <TableHead>URL</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Azioni</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoadingPages ? (
                          <TableRow><TableCell colSpan={4} className="text-center">Caricamento...</TableCell></TableRow>
                        ) : (
                          pages.filter(page => page.isHomepageCustom).map((page: any) => (
                            <TableRow key={page.id}>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="font-medium flex items-center gap-2">
                                    {page.title}
                                    {page.slug === 'home' && (
                                      <Badge variant="default">Homepage Attiva</Badge>
                                    )}
                                    {page.slug !== 'home' && (
                                      <Badge variant="outline">Versione Personalizzata</Badge>
                                    )}
                                  </div>
                                  <div className="text-sm text-muted-foreground">/home</div>
                                  {page.slug !== 'home' && (
                                    <div className="text-xs text-blue-600">Clicca "Attiva" per renderla la homepage principale</div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={page.status === 'published' ? 'default' : 'secondary'}>{page.status}</Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => {
                                      setHomepageToEdit(page);
                                      setIsEditingHomepage(true);
                                    }}>
                                      <Edit className="mr-2 h-4 w-4" />
                                      Modifica
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Eye className="mr-2 h-4 w-4" />
                                      Anteprima
                                    </DropdownMenuItem>
                                    {page.slug !== 'home' && (
                                      <DropdownMenuItem onClick={() => {
                                        // Attiva questa homepage personalizzata
                                        const updateData = {
                                          id: page.id,
                                          title: page.title,
                                          slug: 'home',
                                          content: page.content,
                                          status: page.status,
                                          metaTitle: page.metaTitle,
                                          metaDescription: page.metaDescription,
                                          isHomepageCustom: true
                                        };
                                        savePageMutation.mutate(updateData);
                                        activateHomepageMutation.mutate(true);
                                      }}>
                                        <Home className="mr-2 h-4 w-4" />
                                        Attiva Homepage
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem
                                      onClick={() => deletePageMutation.mutate(page.id)}
                                      className="text-destructive"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Elimina
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Blog Tab */}
            {activeTab === "blog" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-3xl font-bold">Gestione Blog</h1>
                    <p className="text-muted-foreground">Crea e gestisci gli articoli del blog</p>
                  </div>
                  <Button data-testid="button-add-blog-post" onClick={() => setIsEditingPost(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuovo Articolo
                  </Button>
                </div>

                <Card>
                  <CardContent className="pt-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Titolo</TableHead>
                          <TableHead>Autore</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Visualizzazioni</TableHead>
                          <TableHead className="text-right">Azioni</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoadingPosts ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center">Caricamento...</TableCell>
                          </TableRow>
                        ) : blogPosts.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center">Nessun articolo trovato</TableCell>
                          </TableRow>
                        ) : (
                          blogPosts.map((post) => {
                            const getUIStatusForDisplay = (dbStatus: string) => {
                              switch(dbStatus) {
                                case "draft": return "Bozza";
                                case "published": return "Pubblicato";
                                case "scheduled": return "Programmato";
                                default: return "Bozza";
                              }
                            };

                            return (
                              <TableRow key={post.id}>
                                <TableCell className="font-medium" data-testid={`blog-title-${post.id}`}>
                                  {post.title}
                                </TableCell>
                                <TableCell>{post.author?.username || 'N/A'}</TableCell>
                                <TableCell>{getStatusBadge(getUIStatusForDisplay(post.status))}</TableCell>
                                <TableCell>{new Date(post.createdAt).toLocaleDateString()}</TableCell>
                                <TableCell>{post.views || 0}</TableCell>
                                <TableCell className="text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" data-testid={`button-blog-actions-${post.id}`}>
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem>
                                        <Eye className="h-4 w-4 mr-2" />
                                        Anteprima
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleEditPost(post)}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Modifica
                                      </DropdownMenuItem>
                                      <DropdownMenuItem className="text-destructive">
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Elimina
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Services Tab */}
            {activeTab === "services" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-3xl font-bold">Gestione Servizi</h1>
                    <p className="text-muted-foreground">Configura i servizi offerti</p>
                  </div>
                  <Button data-testid="button-add-service" onClick={() => setIsEditingService(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuovo Servizio
                  </Button>
                </div>

                <Card>
                  <CardContent className="pt-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Titolo</TableHead>
                          <TableHead>Categoria</TableHead>
                          <TableHead>Prezzo</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Ordine</TableHead>
                          <TableHead className="text-right">Azioni</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoadingServices ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center">Caricamento...</TableCell>
                          </TableRow>
                        ) : services.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center">Nessun servizio trovato</TableCell>
                          </TableRow>
                        ) : (
                          services.map((service) => (
                            <TableRow key={service.id}>
                              <TableCell className="font-medium" data-testid={`service-title-${service.id}`}>
                                {service.title}
                                {service.isPopular && <Badge className="ml-2" variant="secondary">Popolare</Badge>}
                                {service.isFeatured && <Badge className="ml-2" variant="outline">In Evidenza</Badge>}
                              </TableCell>
                              <TableCell>
                                <Badge variant={service.category === 'main' ? 'default' : 'secondary'}>
                                  {service.category === 'main' ? 'Principale' : 'Aggiuntivo'}
                                </Badge>
                              </TableCell>
                              <TableCell>{service.price || 'N/A'}</TableCell>
                              <TableCell>
                                <Badge variant={service.isActive ? 'default' : 'secondary'}>
                                  {service.isActive ? 'Attivo' : 'Inattivo'}
                                </Badge>
                              </TableCell>
                              <TableCell>{service.order}</TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" data-testid={`button-service-actions-${service.id}`}>
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem>
                                      <Eye className="h-4 w-4 mr-2" />
                                      Anteprima
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleEditService(service)}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Modifica
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive">
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Elimina
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Projects Tab */}
            {activeTab === "projects" && <ProjectsManager />}

            {/* Landing Pages Tab */}
            {activeTab === "landing-pages" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-3xl font-bold">Gestione Landing Pages</h1>
                    <p className="text-muted-foreground">Crea e gestisci le landing pages</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => setIsEditingLandingPage(true)}
                      data-testid="button-create-landing-page"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Nuova Landing Page
                    </Button>
                    <Button
                      onClick={handleCreateFromPatrimonioTemplate}
                      variant="secondary"
                      data-testid="button-create-from-patrimonio"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Duplica da Template Patrimonio
                    </Button>
                  </div>
                </div>

                <Card>
                  <CardContent className="pt-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Titolo</TableHead>
                          <TableHead>Slug</TableHead>
                          <TableHead>Template</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Conversioni</TableHead>
                          <TableHead>Creata</TableHead>
                          <TableHead className="text-right">Azioni</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoadingLandingPages ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center">Caricamento...</TableCell>
                          </TableRow>
                        ) : landingPages?.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center">
                              Nessuna landing page trovata
                              <br />
                              <Button
                                variant="outline"
                                className="mt-2"
                                onClick={() => setIsEditingLandingPage(true)}
                              >
                                Crea la prima landing page
                              </Button>
                            </TableCell>
                          </TableRow>
                        ) : (
                          landingPages?.map((landingPage) => (
                            <TableRow key={landingPage.id}>
                              <TableCell className="font-medium" data-testid={`landing-page-title-${landingPage.id}`}>
                                {landingPage.title}
                                {landingPage.isTemplate && <Badge className="ml-2" variant="secondary">Template</Badge>}
                              </TableCell>
                              <TableCell>
                                <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                                  /{landingPage.slug}
                                </code>
                              </TableCell>
                              <TableCell>
                                {landingPage.templateName || 'Custom'}
                              </TableCell>
                              <TableCell>
                                <Badge variant={landingPage.isActive ? 'default' : 'secondary'}>
                                  {landingPage.isActive ? 'Attiva' : 'Inattiva'}
                                </Badge>
                              </TableCell>
                              <TableCell>{landingPage.conversionCount || 0}</TableCell>
                              <TableCell>
                                {new Date(landingPage.createdAt).toLocaleDateString('it-IT')}
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" data-testid={`button-landing-page-actions-${landingPage.id}`}>
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => window.open(`/${landingPage.slug}`, '_blank')}>
                                      <Eye className="h-4 w-4 mr-2" />
                                      Anteprima
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleEditLandingPage(landingPage)}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Modifica
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDuplicateLandingPage(landingPage)}>
                                      <Plus className="h-4 w-4 mr-2" />
                                      Duplica
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleToggleLandingPageStatus(landingPage.id)}>
                                      {landingPage.isActive ? '🔴 Disattiva' : '🟢 Attiva'}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteLandingPage(landingPage.id)}>
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Elimina
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Page Builder Tab */}
            {activeTab === "page-builder" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-3xl font-bold">Page Builder</h1>
                    <p className="text-muted-foreground">Crea pagine con drag & drop</p>
                  </div>
                  <Button
                    onClick={() => setIsEditingBuilderPage(true)}
                    data-testid="button-create-builder-page"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nuova Pagina Builder
                  </Button>
                </div>

                <Card>
                  <CardContent className="pt-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Titolo</TableHead>
                          <TableHead>Slug</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Conversioni</TableHead>
                          <TableHead>Creata</TableHead>
                          <TableHead className="text-right">Azioni</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoadingBuilderPages ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center">Caricamento...</TableCell>
                          </TableRow>
                        ) : builderPages?.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center">
                              Nessuna builder page trovata
                              <br />
                              <Button
                                variant="outline"
                                className="mt-2"
                                onClick={() => setIsEditingBuilderPage(true)}
                              >
                                Crea la prima builder page
                              </Button>
                            </TableCell>
                          </TableRow>
                        ) : (
                          builderPages?.map((page: any) => (
                            <TableRow key={page.id}>
                              <TableCell className="font-medium" data-testid={`builder-page-title-${page.id}`}>
                                {page.title}
                              </TableCell>
                              <TableCell>
                                <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                                  /{page.slug}
                                </code>
                              </TableCell>
                              <TableCell>
                                <Badge variant={page.isActive ? 'default' : 'secondary'}>
                                  {page.isActive ? 'Attiva' : 'Inattiva'}
                                </Badge>
                              </TableCell>
                              <TableCell>{page.conversions || 0}</TableCell>
                              <TableCell>
                                {new Date(page.createdAt).toLocaleDateString('it-IT')}
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" data-testid={`button-builder-page-actions-${page.id}`}>
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => window.open(`/${page.slug}`, '_blank')}>
                                      <Eye className="h-4 w-4 mr-2" />
                                      Anteprima
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleEditBuilderPage(page)}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Modifica
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleToggleBuilderPageStatus(page.id)}>
                                      {page.isActive ? '🔴 Disattiva' : '🟢 Attiva'}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteBuilderPage(page.id)}>
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Elimina
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Preview Tab */}
            {activeTab === "preview" && (
              <div className="space-y-6 h-[calc(100vh-200px)]">
                <div>
                  <h1 className="text-3xl font-bold">Anteprima Sito</h1>
                  <p className="text-muted-foreground">
                    Visualizza come apparirà il tuo sito su diversi dispositivi
                  </p>
                </div>
                {tenantInfo && (
                  <PreviewFrame
                    url={tenantInfo.domain === 'localhost' ? '/' : `https://${tenantInfo.domain}`}
                    className="h-full"
                  />
                )}
                {!tenantInfo && (
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-center text-muted-foreground">
                        Caricamento informazioni sito...
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === "analytics" && <AnalyticsDashboard />}

            {/* SEO Tab */}
            {activeTab === "seo" && (
              <>
                <SEOHead title="Admin Dashboard" description="Pannello di controllo amministrativo" noindex={true} />
                <SEOSettings />
              </>
            )}

            {/*Navbar Tab */}
            {activeTab === "navbar" && <NavbarSettings />}

            {/* Tenant Settings Tab */}
            {activeTab === "tenant" && <TenantSettings />}

            {/* Footer Settings Tab */}
            {activeTab === "footer" && <FooterSettings />}

            {/* Settings Tab */}
            {activeTab === "settings" && <SettingsEditor />}

            {/* Candidate Form Settings Tab */}
            {activeTab === "candidate-form" && (
              <CandidateFormSettings />
            )}

            {/* Google Sheets Tab */}
            {activeTab === "google-sheets" && (
              <div className="space-y-6">
                <GoogleSheetsManager />
              </div>
            )}

            {/* Leads Tab */}
            {activeTab === "leads" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-3xl font-bold">Gestione Lead</h1>
                    <p className="text-muted-foreground">Visualizza e gestisci i contatti ricevuti suddivisi per campagna</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setActiveTab('google-sheets')}>
                      <FileText className="h-4 w-4 mr-2" />
                      Gestisci Campagne
                    </Button>
                    <Button variant="outline" data-testid="button-export-leads">
                      Esporta Lead
                    </Button>
                  </div>
                </div>

                {/* Raggruppa lead per campagna */}
                {isLoadingLeads ? (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center py-8">Caricamento lead...</div>
                    </CardContent>
                  </Card>
                ) : leadsData?.leads?.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <h3 className="text-lg font-semibold mb-2">Nessun lead trovato</h3>
                        <p className="text-muted-foreground mb-4">Configura le tue campagne Google Sheets per iniziare a ricevere lead</p>
                        <Button onClick={() => setActiveTab('google-sheets')}>
                          <FileText className="h-4 w-4 mr-2" />
                          Configura Campagne
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  (() => {
                    // Raggruppa lead per source/campagna
                    const leadsByCampaign = leadsData.leads.reduce((acc: Record<string, any[]>, lead: any) => {
                      const campaign = lead.source || 'non-assegnati';
                      if (!acc[campaign]) {
                        acc[campaign] = [];
                      }
                      acc[campaign].push(lead);
                      return acc;
                    }, {});

                    return Object.entries(leadsByCampaign).map(([campaign, campaignLeads]: [string, any]) => (
                      <Card key={campaign} className="border-l-4 border-l-primary">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Campagna: {campaign.charAt(0).toUpperCase() + campaign.slice(1).replace(/-/g, ' ')}
                              </CardTitle>
                              <CardDescription>
                                {campaignLeads.length} lead{campaignLeads.length !== 1 ? 's' : ''} totali
                              </CardDescription>
                            </div>
                            <Badge variant="default" className="text-lg px-4 py-2">
                              {campaignLeads.length}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Telefono</TableHead>
                                <TableHead>Azienda</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Data</TableHead>
                                <TableHead className="text-right">Azioni</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {campaignLeads.map((lead: any) => (
                                <TableRow key={lead.id} className="hover:bg-muted/50">
                                  <TableCell className="font-medium" data-testid={`lead-name-${lead.id}`}>
                                    <div className="flex flex-col">
                                      <span className="font-semibold">{lead.name}</span>
                                      <span className="text-xs text-muted-foreground">ID: {lead.id.slice(0, 8)}...</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex flex-col">
                                      <span className="truncate max-w-[180px]">{lead.email}</span>
                                      <span className="text-xs text-muted-foreground">Email di contatto</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex flex-col">
                                      <span>{lead.phone || '-'}</span>
                                      {lead.phone && <span className="text-xs text-muted-foreground">Telefono</span>}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex flex-col">
                                      <span className="truncate max-w-[100px]">{lead.company || '-'}</span>
                                      {lead.company && <span className="text-xs text-muted-foreground">Azienda</span>}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {getStatusBadge(
                                      lead.status === 'new' ? 'Nuovo' :
                                      lead.status === 'contacted' ? 'Contattato' :
                                      lead.status === 'qualified' ? 'Qualificato' :
                                      lead.status === 'converted' ? 'Convertito' :
                                      'Nuovo'
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex flex-col">
                                      <span className="text-sm">{new Date(lead.createdAt).toLocaleDateString('it-IT')}</span>
                                      <span className="text-xs text-muted-foreground">{new Date(lead.createdAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex space-x-2 justify-end">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        data-testid={`button-contact-lead-${lead.id}`}
                                        onClick={() => window.open(`mailto:${lead.email}?subject=Risposta alla tua richiesta&body=Ciao ${lead.name},%0D%0A%0D%0AGrazie per averci contattato.`, '_blank')}
                                      >
                                        <Mail className="h-4 w-4 mr-1" />
                                        Contatta
                                      </Button>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="icon" data-testid={`button-lead-actions-${lead.id}`}>
                                            <MoreHorizontal className="h-4 w-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-56">
                                          <DropdownMenuItem onClick={() => setSelectedLead(lead)}>
                                            <Eye className="h-4 w-4 mr-2" />
                                            Visualizza Dettagli Completi
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => {
                                            setSelectedLead(lead);
                                            setIsEditingLeadStatus(true);
                                          }}>
                                            <Edit className="h-4 w-4 mr-2" />
                                            Modifica Status
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            onClick={() => window.open(`tel:${lead.phone}`, '_self')}
                                            disabled={!lead.phone}
                                          >
                                            <Users className="h-4 w-4 mr-2" />
                                            Chiama {lead.phone ? lead.phone : '(non disponibile)'}
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            onClick={() => navigator.clipboard.writeText(`${lead.name}\n${lead.email}\n${lead.phone || ''}\n${lead.company || ''}\n${lead.message || ''}`)}
                                          >
                                            <Copy className="h-4 w-4 mr-2" />
                                            Copia Informazioni
                                          </DropdownMenuItem>
                                          <DropdownMenuItem className="text-destructive" onClick={() => {
                                            if (confirm(`Sei sicuro di voler eliminare il lead di ${lead.name}?`)) {
                                              // TODO: Add delete mutation
                                              console.log('Delete lead:', lead.id);
                                            }
                                          }}>
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Elimina Lead
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    ));
                  })()
                )}
              </div>
            )}
          </main>
        </SidebarInset>
      </div>

      {/* Service Editor */}
      {isEditingService && (
        <ServiceEditor
          serviceToEdit={serviceToEdit}
          onClose={handleCloseServiceEditor}
        />
      )}

      {/* Page Editor */}
      {isEditingPage && (
        <PageEditor
          pageToEdit={pageToEdit}
          templateType={pageTemplateType}
          onClose={handleClosePageEditor}
        />
      )}

      {/* Homepage Editor */}
      {isEditingHomepage && (
        <HomepageEditor
          pageToEdit={homepageToEdit}
          onClose={handleCloseHomepageEditor}
        />
      )}

      {/* Blog Page Editor */}
      {isEditingBlogPage && (
        <BlogPageEditor
          pageToEdit={blogPageToEdit}
          onClose={handleCloseBlogPageEditor}
        />
      )}

      {/* Contatti Page Editor */}
      {isEditingContattiPage && (
        <ContattiPageEditor
          pageToEdit={contattiPageToEdit}
          onClose={handleCloseContattiPageEditor}
        />
      )}

      {/* Landing Page Editor */}
      {isEditingLandingPage && (
        <LandingPageEditor
          landingPageToEdit={landingPageToEdit}
          onClose={() => {
            setIsEditingLandingPage(false);
            setLandingPageToEdit(null);
          }}
        />
      )}

      {/* Page Builder Editor */}
      {isEditingBuilderPage && (
        <DragDropPageBuilder
          pageToEdit={builderPageToEdit}
          onClose={handleCloseBuilderPageEditor}
        />
      )}

      {/* Create from Patrimonio Template Modal */}
      {isCreatingFromTemplate && (
        <CreateFromTemplateModal
          onClose={() => setIsCreatingFromTemplate(false)}
          onSubmit={(title, slug) => {
            createFromPatrimonioTemplateMutation.mutate({ title, slug });
          }}
          isLoading={createFromPatrimonioTemplateMutation.isPending}
        />
      )}

      {/* Create Custom Page Modal */}
      {isCreatingCustomPage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Crea Nuova Pagina</CardTitle>
              <CardDescription>
                Scegli il template e inserisci i dettagli della nuova pagina.
              </CardDescription>
            </CardHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const title = formData.get('title') as string;
              const slug = formData.get('slug') as string;
              const templateType = formData.get('templateType') as string;
              handleCreateCustomPage(title, slug, templateType);
            }}>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Template</label>
                  <select
                    name="templateType"
                    className="w-full p-2 border rounded"
                    defaultValue="homepage"
                    required
                  >
                    <option value="homepage">Homepage</option>
                    <option value="chi-siamo">Chi Siamo</option>
                    <option value="servizi">Servizi</option>
                    <option value="contatti">Contatti</option>
                    <option value="faq">FAQ</option>
                    <option value="progetti">Progetti</option>
                    <option value="blog">Blog</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Titolo</label>
                  <Input
                    name="title"
                    placeholder="Es: La Mia Nuova Pagina"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Slug</label>
                  <Input
                    name="slug"
                    placeholder="es: la-mia-nuova-pagina"
                    required
                  />
                </div>
              </CardContent>
              <div className="flex justify-end space-x-2 p-6 pt-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreatingCustomPage(false)}
                >
                  Annulla
                </Button>
                <Button type="submit">
                  Crea Pagina
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Lead Detail Modal */}
      {selectedLead && !isEditingLeadStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <Card className="w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <CardHeader className="border-b">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">Dettagli Lead Completi</CardTitle>
                  <CardDescription>
                    Informazioni dettagliate per {selectedLead.name}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedLead(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Informazioni Personali
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Nome Completo</label>
                      <p className="text-sm font-semibold">{selectedLead.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Email</label>
                      <p className="text-sm">{selectedLead.email}</p>
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0 h-auto"
                        onClick={() => window.open(`mailto:${selectedLead.email}`, '_blank')}
                      >
                        <Mail className="h-3 w-3 mr-1" />
                        Invia Email
                      </Button>
                    </div>
                    {selectedLead.phone && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Telefono</label>
                        <p className="text-sm">{selectedLead.phone}</p>
                        <Button
                          variant="link"
                          size="sm"
                          className="p-0 h-auto"
                          onClick={() => window.open(`tel:${selectedLead.phone}`, '_self')}
                        >
                          <Users className="h-3 w-3 mr-1" />
                          Chiama
                        </Button>
                      </div>
                    )}
                    {selectedLead.company && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Azienda</label>
                        <p className="text-sm font-semibold">{selectedLead.company}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Lead Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Informazioni Lead
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Fonte</label>
                      <Badge variant="outline" className="block w-fit">
                        {selectedLead.source?.replace('contact-page-', '').replace('contact-form-', '').replace('-', ' ') || 'Contatto'}
                      </Badge>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Status Attuale</label>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(
                          selectedLead.status === 'new' ? 'Nuovo' :
                          selectedLead.status === 'contacted' ? 'Contattato' :
                          selectedLead.status === 'qualified' ? 'Qualificato' :
                          selectedLead.status === 'converted' ? 'Convertito' :
                          'Nuovo'
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsEditingLeadStatus(true)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Modifica
                        </Button>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Data Creazione</label>
                      <p className="text-sm">{new Date(selectedLead.createdAt).toLocaleString('it-IT')}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">ID Lead</label>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded">{selectedLead.id}</code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigator.clipboard.writeText(selectedLead.id)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Message */}
                {selectedLead.message && (
                  <div className="md:col-span-2 space-y-3">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Messaggio
                    </h3>
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{selectedLead.message}</p>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedLead.notes && (
                  <div className="md:col-span-2 space-y-3">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Note Interne
                    </h3>
                    <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{selectedLead.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <div className="flex justify-between items-center p-6 border-t bg-muted/50">
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => window.open(`mailto:${selectedLead.email}?subject=Risposta alla tua richiesta&body=Ciao ${selectedLead.name},%0D%0A%0D%0AGrazie per averci contattato.`, '_blank')}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Invia Email
                </Button>
                {selectedLead.phone && (
                  <Button
                    variant="outline"
                    onClick={() => window.open(`tel:${selectedLead.phone}`, '_self')}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Chiama
                  </Button>
                )}
              </div>
              <Button onClick={() => setSelectedLead(null)}>
                Chiudi
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Lead Status Edit Modal */}
      {selectedLead && isEditingLeadStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Modifica Status Lead</CardTitle>
              <CardDescription>
                Aggiorna lo status per {selectedLead.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nuovo Status</label>
                <select
                  className="w-full p-2 border rounded mt-1"
                  defaultValue={selectedLead.status}
                  id="newStatus"
                >
                  <option value="new">Nuovo</option>
                  <option value="contacted">Contattato</option>
                  <option value="qualified">Qualificato</option>
                  <option value="converted">Convertito</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Note (opzionale)</label>
                <Textarea
                  placeholder="Aggiungi note sul cambio di status..."
                  className="mt-1"
                  id="statusNotes"
                />
              </div>
            </CardContent>
            <div className="flex justify-end space-x-2 p-6 pt-0">
              <Button
                variant="outline"
                onClick={() => setIsEditingLeadStatus(false)}
              >
                Annulla
              </Button>
              <Button onClick={() => {
                // TODO: Add update mutation
                const newStatus = (document.getElementById('newStatus') as HTMLSelectElement)?.value;
                const notes = (document.getElementById('statusNotes') as HTMLTextAreaElement)?.value;
                console.log('Update lead status:', selectedLead.id, newStatus, notes);
                setIsEditingLeadStatus(false);
                setSelectedLead(null);
                toast({
                  title: "Status aggiornato!",
                  description: `Il lead di ${selectedLead.name} è stato aggiornato.`,
                });
              }}>
                Salva Modifiche
              </Button>
            </div>
          </Card>
        </div>
      )}
    </SidebarProvider>
  );
}