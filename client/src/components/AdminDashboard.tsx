import { useState, useEffect, lazy, Suspense } from "react";
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
  SidebarGroupLabel,
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
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  TrendingUp,
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
  Menu,
  Key,
  LayoutDashboard,
  Megaphone,
  Lock,
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
import { Skeleton } from "@/components/ui/skeleton";
import ProjectsManager from "./ProjectsManager";
import SEOSettings from "./SEOSettings";
import CandidateFormSettings from "./CandidateFormSettings";
import NavbarSettings from "./NavbarSettings";
import { PreviewFrame } from "./PreviewFrame";
import GoogleSheetsManager from "../pages/GoogleSheetsManager";
import { SEOHead } from "./SEOHead";
import FooterSettings from "./FooterSettings";
import MarketingLeadsManager from "./MarketingLeadsManager";
import ApiKeysManager from "./ApiKeysManager";
import ApiDocumentation from "../pages/ApiDocumentation";

const BlogEditor = lazy(() => import("./BlogEditor").then(module => ({ default: module.BlogEditor })));
const AnalyticsDashboard = lazy(() => import("./AnalyticsDashboard").then(module => ({ default: module.AnalyticsDashboard })));

function BlogEditorSkeleton() {
  return (
    <div className="flex h-full bg-muted/30">
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
      <aside className="w-96 bg-background border-l p-6 space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </aside>
    </div>
  );
}

function AnalyticsDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

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
      if (data.user && data.user.role === 'superadmin') {
        setAuthToken(data.token);
        toast({
          title: "Login effettuato!",
          description: "Benvenuto nell'area superadmin.",
        });
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200 mb-4">
            <Lock className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Area Amministrativa</h1>
          <p className="text-slate-500 mt-1">Accedi per gestire i contenuti</p>
        </div>
        <Card className="border-0 shadow-xl shadow-slate-200/50">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-user" className="text-sm font-medium text-slate-700">Username</Label>
                <Input
                  id="login-user"
                  type="text"
                  placeholder="Inserisci username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-11 border-slate-200 focus:border-indigo-400 focus:ring-indigo-400"
                  data-testid="login-username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-pass" className="text-sm font-medium text-slate-700">Password</Label>
                <Input
                  id="login-pass"
                  type="password"
                  placeholder="Inserisci password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 border-slate-200 focus:border-indigo-400 focus:ring-indigo-400"
                  data-testid="login-password"
                />
              </div>
              <Button
                type="submit"
                className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm"
                disabled={loginMutation.isPending}
                data-testid="login-submit"
              >
                {loginMutation.isPending ? "Accesso in corso..." : "Accedi"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

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
    <Card className="w-full max-w-4xl mx-auto my-8 border-0 shadow-sm">
      <CardHeader className="border-b border-slate-100 pb-4">
        <CardTitle className="text-lg font-semibold text-slate-900">{serviceToEdit ? "Modifica Servizio" : "Nuovo Servizio"}</CardTitle>
        <CardDescription className="text-slate-500">Configura i dettagli del servizio.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
        <div className="space-y-4">
          <div>
            <Label className="text-xs font-medium text-slate-600">Titolo *</Label>
            <Input
              placeholder="Titolo del servizio"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
              }}
              className="border-slate-200 focus:border-indigo-300"
              data-testid="service-editor-title"
            />
          </div>
          <div>
            <Label className="text-xs font-medium text-slate-600">Slug URL</Label>
            <Input
              placeholder="Slug (es. consulenza-strategica)"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="border-slate-200 focus:border-indigo-300"
              data-testid="service-editor-slug"
            />
          </div>
          <div>
            <Label className="text-xs font-medium text-slate-600">Descrizione *</Label>
            <Textarea
              placeholder="Descrizione completa"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="border-slate-200 focus:border-indigo-300"
              data-testid="service-editor-description"
            />
          </div>
          <div>
            <Label className="text-xs font-medium text-slate-600">Descrizione Breve</Label>
            <Input
              placeholder="Descrizione breve"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              className="border-slate-200 focus:border-indigo-300"
              data-testid="service-editor-short-description"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-medium text-slate-600">Prezzo</Label>
              <Input
                placeholder="Es: €299"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="border-slate-200 focus:border-indigo-300"
                data-testid="service-editor-price"
              />
            </div>
            <div>
              <Label className="text-xs font-medium text-slate-600">Periodo</Label>
              <Input
                placeholder="Es: /mese"
                value={priceDescription}
                onChange={(e) => setPriceDescription(e.target.value)}
                className="border-slate-200 focus:border-indigo-300"
                data-testid="service-editor-price-description"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs font-medium text-slate-600">Icona Lucide</Label>
            <Input
              placeholder="Es: Palette"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className="border-slate-200 focus:border-indigo-300"
              data-testid="service-editor-icon"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-xs font-medium text-slate-600">Caratteristiche (una per riga)</Label>
            <Textarea
              placeholder="Caratteristiche (una per riga)"
              value={features}
              onChange={(e) => setFeatures(e.target.value)}
              rows={6}
              className="border-slate-200 focus:border-indigo-300"
              data-testid="service-editor-features"
            />
          </div>
          <div>
            <Label className="text-xs font-medium text-slate-600">Benefici (uno per riga)</Label>
            <Textarea
              placeholder="Benefici (uno per riga)"
              value={benefits}
              onChange={(e) => setBenefits(e.target.value)}
              rows={4}
              className="border-slate-200 focus:border-indigo-300"
              data-testid="service-editor-benefits"
            />
          </div>
          <div>
            <Label className="text-xs font-medium text-slate-600">Categoria</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="border-slate-200 focus:border-indigo-300" data-testid="service-editor-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="main">Servizio Principale</SelectItem>
                <SelectItem value="additional">Servizio Aggiuntivo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-medium text-slate-600">Landing Page Slug</Label>
            <Input
              placeholder="Landing Page Slug (opzionale)"
              value={landingPageSlug}
              onChange={(e) => setLandingPageSlug(e.target.value)}
              className="border-slate-200 focus:border-indigo-300"
              data-testid="service-editor-landing-slug"
            />
          </div>
          <div>
            <Label className="text-xs font-medium text-slate-600">Testo CTA</Label>
            <Input
              placeholder="Testo CTA"
              value={ctaText}
              onChange={(e) => setCtaText(e.target.value)}
              className="border-slate-200 focus:border-indigo-300"
              data-testid="service-editor-cta-text"
            />
          </div>
          <div>
            <Label className="text-xs font-medium text-slate-600">Ordine</Label>
            <Input
              type="number"
              placeholder="Ordine di visualizzazione"
              value={order}
              onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
              className="border-slate-200 focus:border-indigo-300"
              data-testid="service-editor-order"
            />
          </div>
          <div className="flex items-center gap-6 py-3 px-4 bg-slate-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPopular"
                checked={isPopular}
                onChange={(e) => setIsPopular(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                data-testid="service-editor-popular"
              />
              <label htmlFor="isPopular" className="text-sm text-slate-700">Popolare</label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isFeatured"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                data-testid="service-editor-featured"
              />
              <label htmlFor="isFeatured" className="text-sm text-slate-700">In Evidenza</label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                data-testid="service-editor-active"
              />
              <label htmlFor="isActive" className="text-sm text-slate-700">Attivo</label>
            </div>
          </div>
        </div>

        <div className="col-span-2 flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="outline" onClick={onClose} className="border-slate-200 text-slate-600 hover:bg-slate-50">Annulla</Button>
          <Button
            onClick={handleSave}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
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
  const [currentUser, setCurrentUser] = useState<{ username?: string } | null>(null);
  const [isEditingPage, setIsEditingPage] = useState(false);
  const [pageTemplateType, setPageTemplateType] = useState('homepage');
  const [isCreatingCustomPage, setIsCreatingCustomPage] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [isEditingLeadStatus, setIsEditingLeadStatus] = useState(false);

  const [overviewSubTab, setOverviewSubTab] = useState("stats");
  const [settingsSubTab, setSettingsSubTab] = useState("seo");
  const [leadSubTab, setLeadSubTab] = useState("leads");

  const { data: userData } = useQuery({
    queryKey: ['/api/auth/me'],
    enabled: isAuthenticated,
  });

  const { data: tenantInfo } = useQuery({
    queryKey: ['/api/tenant/info'],
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (userData) {
      setCurrentUser(userData);
    }
  }, [userData]);

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
        return 'homepage';
    }
  };

  const handleNewPage = (templateType: string | React.MouseEvent = 'homepage') => {
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
    if (page.slug === 'home' || page.slug === 'homepage') {
      setHomepageToEdit(page);
      setIsEditingHomepage(true);
      return;
    }
    if (page.slug === 'blog') {
      setBlogPageToEdit(page);
      setIsEditingBlogPage(true);
      return;
    }
    if (page.slug === 'contatti') {
      setContattiPageToEdit(page);
      setIsEditingContattiPage(true);
      return;
    }
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

  const { data: blogPostsData, isLoading: isLoadingPosts } = useQuery({
    queryKey: ['/api/blog'],
    enabled: isAuthenticated,
  });

  const { data: servicesData, isLoading: isLoadingServices } = useQuery({
    queryKey: ['/api/services'],
    enabled: isAuthenticated,
  });

  const { data: landingPagesData, isLoading: isLoadingLandingPages } = useQuery({
    queryKey: ['/api/landing-pages'],
    enabled: isAuthenticated,
  });

  const { data: statsData, isLoading: isLoadingStats } = useQuery<any>({ queryKey: ['/api/dashboard/stats'] });
  const { data: projectsData } = useQuery<any>({ queryKey: ['/api/projects'] });
  const { data: settingsData } = useQuery<any>({ queryKey: ['/api/settings'] });

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

  const toggleLandingPageStatusMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/landing-pages/${id}/toggle-status`),
    onSuccess: () => {
      toast({ title: "Status cambiato con successo!" });
      queryClient.invalidateQueries({ queryKey: ['/api/landing-pages'] });
    },
    onError: () => toast({ title: "Errore nel cambio status", variant: "destructive" })
  });

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

  const { data: builderPagesData, isLoading: isLoadingBuilderPages } = useQuery({
    queryKey: ['/api/builder-pages'],
    enabled: isAuthenticated,
  });

  const toggleBuilderPageStatusMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/builder-pages/${id}/toggle-status`),
    onSuccess: () => {
      toast({ title: "Status cambiato con successo!" });
      queryClient.invalidateQueries({ queryKey: ['/api/builder-pages'] });
    },
    onError: () => toast({ title: "Errore nel cambio status", variant: "destructive" })
  });

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

  const { data: leadsData, isLoading: isLoadingLeads } = useQuery({
    queryKey: ['/api/leads'],
    enabled: isAuthenticated,
  });

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      refetchPages();
      queryClient.invalidateQueries();
    }
  }, [isAuthenticated, queryClient, refetchPages]);

  useEffect(() => {
    if (settingsData?.homepageMode) {
      setHomepageMode(settingsData.homepageMode);
    }
  }, [settingsData]);

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
        <Suspense fallback={<BlogEditorSkeleton />}>
          <BlogEditor
            initialPost={postToEdit}
            onSave={(data) => savePostMutation.mutate(data)}
            onPublish={(data) => savePostMutation.mutate({ ...data, status: 'published' })}
            onClose={handleCloseEditor}
          />
        </Suspense>
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

  const sidebarSections = [
    {
      label: "Principale",
      items: [
        { key: "overview", title: "Panoramica", icon: LayoutDashboard },
        { key: "preview", title: "Anteprima Sito", icon: Eye },
        { key: "pages", title: "Pagine", icon: Globe },
        { key: "homepage-duplicates", title: "Homepage", icon: Copy },
      ]
    },
    {
      label: "Gestione",
      items: [
        { key: "settings-section", title: "Impostazioni SEO", icon: SearchCheck },
        { key: "lead-section", title: "Lead", icon: Megaphone },
      ]
    },
    {
      label: "Strumenti",
      items: [
        { key: "analytics", title: "Analytics", icon: BarChart3 },
        { key: "candidate-form", title: "Form Candidatura", icon: FileText },
        { key: "google-sheets", title: "Google Sheets", icon: FileText },
        { key: "api-keys", title: "API Keys", icon: Key },
        { key: "api-docs", title: "Documentazione API", icon: FileText },
      ]
    }
  ];

  const isTabActive = (key: string) => {
    return activeTab === key;
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 to-slate-100">
        <Sidebar collapsible="icon" className="border-r border-slate-200 bg-white">
          <SidebarHeader className="border-b border-slate-100 px-4 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-200">
                <Lightbulb className="h-5 w-5" />
              </div>
              <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                <h1 className="font-bold text-lg tracking-tight text-slate-900">CMS Dashboard</h1>
                <p className="text-xs text-slate-400 mt-0.5">Gestione contenuti</p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="px-2 py-4">
            {sidebarSections.map((section) => (
              <SidebarGroup key={section.label}>
                <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 px-3 mb-1 group-data-[collapsible=icon]:hidden">
                  {section.label}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu className="gap-0.5">
                    {section.items.map((item) => {
                      const active = isTabActive(item.key);
                      return (
                        <SidebarMenuItem key={item.key}>
                          <SidebarMenuButton
                            isActive={active}
                            onClick={() => setActiveTab(item.key)}
                            className={`
                              w-full h-10 px-3 rounded-lg transition-all duration-200 text-sm
                              ${active
                                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200 font-medium'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                              }
                              group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10
                              group-data-[collapsible=icon]:justify-center
                            `}
                            tooltip={item.title}
                          >
                            <item.icon className={`h-4 w-4 transition-all duration-200 flex-shrink-0 ${active ? 'text-white' : 'text-slate-400'}`} />
                            <span className="font-medium group-data-[collapsible=icon]:sr-only truncate">
                              {item.title}
                            </span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarContent>

          <SidebarFooter className="border-t border-slate-100 px-3 py-4">
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
                  className="h-10 px-3 rounded-lg text-sm text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors duration-200 font-medium"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="group-data-[collapsible=icon]:sr-only">Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex-1">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b border-slate-200 bg-white/80 backdrop-blur-sm px-6">
            <SidebarTrigger className="text-slate-500 hover:text-slate-700" />
            <div className="flex-1" />
            <div className="flex items-center gap-3">
              {currentUser?.username && (
                <span className="text-sm text-slate-500 hidden sm:inline">
                  {currentUser.username}
                </span>
              )}
              <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-100 font-medium text-xs">
                Admin
              </Badge>
            </div>
          </header>

          <main className="flex-1 p-6 space-y-6">
            {/* Overview Tab with sub-tabs */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <Card className="border-0 shadow-sm bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="space-y-1">
                        <h1 className="text-2xl font-bold">Panoramica</h1>
                        <div className="flex flex-col gap-1 text-sm text-indigo-100">
                          {tenantInfo && (
                            <span>Cliente: {tenantInfo.name} &middot; {tenantInfo.domain}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {tenantInfo && (
                          <Button
                            asChild
                            variant="secondary"
                            size="sm"
                            className="bg-white/20 text-white border-white/30 hover:bg-white/30"
                          >
                            <a
                              href={tenantInfo.domain === 'localhost' ? '/' : `https://${tenantInfo.domain}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Apri Sito
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
                  {[
                    { key: "stats", label: "Overview" },
                    { key: "blog", label: "Blog" },
                    { key: "services", label: "Servizi" },
                    { key: "projects", label: "Progetti" },
                    { key: "page-builder", label: "Page Builder" },
                    { key: "navbar", label: "Navbar" },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setOverviewSubTab(tab.key)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        overviewSubTab === tab.key
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {overviewSubTab === "stats" && (
                  <div className="space-y-6">
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                      <Home className="h-4 w-4 text-indigo-500" />
                      Pagina Predefinita (Homepage)
                    </CardTitle>
                    <CardDescription className="text-xs">
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
                          className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                        className="border-slate-200 text-slate-600 hover:text-slate-900"
                        onClick={() => setActiveTab('settings-section')}
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Impostazioni
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-slate-600">Pagine Totali</CardTitle>
                      <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                        <Globe className="h-4 w-4 text-indigo-500" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-slate-900" data-testid="stat-total-pages">
                        {isLoadingPages || isLoadingLandingPages ? "..." : realStats.totalPages}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {(pages?.length || 0)} pagine + {(landingPages?.length || 0)} landing
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-slate-600">Articoli Blog</CardTitle>
                      <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                        <FileText className="h-4 w-4 text-emerald-500" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-slate-900" data-testid="stat-total-posts">
                        {isLoadingPosts ? "..." : realStats.totalPosts}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {blogPosts.filter(p => p.status === 'published').length} pubblicati
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-slate-600">Servizi Attivi</CardTitle>
                      <div className="h-8 w-8 rounded-lg bg-purple-50 flex items-center justify-center">
                        <Palette className="h-4 w-4 text-purple-500" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-slate-900" data-testid="stat-total-services">
                        {isLoadingServices ? "..." : realStats.totalServices}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {services.filter(s => s.isActive).length} attivi
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-slate-600">Visualizzazioni</CardTitle>
                      <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center">
                        <TrendingUp className="h-4 w-4 text-amber-500" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-slate-900" data-testid="stat-monthly-views">
                        {isLoadingStats ? "..." : (realStats.totalViews || 0).toLocaleString()}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Visite totali del sito
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold text-slate-800">Azioni Rapide</CardTitle>
                    <CardDescription className="text-xs">
                      Gestisci rapidamente i contenuti del sito
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                      <Button
                        className="h-16 flex-col space-y-1.5 border-slate-200 text-slate-700 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                        data-testid="button-create-homepage"
                        onClick={() => handleNewPage('homepage')}
                        variant="outline"
                      >
                        <Home className="h-4 w-4" />
                        <span className="text-xs">Homepage</span>
                      </Button>
                      <Button
                        className="h-16 flex-col space-y-1.5 border-slate-200 text-slate-700 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                        data-testid="button-create-chisiamo"
                        onClick={() => handleNewPage('chi-siamo')}
                        variant="outline"
                      >
                        <Users className="h-4 w-4" />
                        <span className="text-xs">Chi Siamo</span>
                      </Button>
                      <Button
                        className="h-16 flex-col space-y-1.5 border-slate-200 text-slate-700 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                        data-testid="button-create-servizi"
                        onClick={() => handleNewPage('servizi')}
                        variant="outline"
                      >
                        <Target className="h-4 w-4" />
                        <span className="text-xs">Servizi</span>
                      </Button>
                      <Button
                        className="h-16 flex-col space-y-1.5 border-slate-200 text-slate-700 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                        data-testid="button-create-contatti"
                        onClick={() => handleNewPage('contatti')}
                        variant="outline"
                      >
                        <Mail className="h-4 w-4" />
                        <span className="text-xs">Contatti</span>
                      </Button>
                      <Button
                        className="h-16 flex-col space-y-1.5 border-slate-200 text-slate-700 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                        data-testid="button-create-faq"
                        onClick={() => handleNewPage('faq')}
                        variant="outline"
                      >
                        <SearchCheck className="h-4 w-4" />
                        <span className="text-xs">FAQ</span>
                      </Button>
                      <Button
                        className="h-16 flex-col space-y-1.5 border-slate-200 text-slate-700 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                        data-testid="button-create-progetti"
                        onClick={() => handleNewPage('progetti')}
                        variant="outline"
                      >
                        <Rocket className="h-4 w-4" />
                        <span className="text-xs">Progetti</span>
                      </Button>
                      <Button
                        className="h-16 flex-col space-y-1.5 border-slate-200 text-slate-700 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                        data-testid="button-create-blog"
                        onClick={() => handleNewPage('blog')}
                        variant="outline"
                      >
                        <FileText className="h-4 w-4" />
                        <span className="text-xs">Blog</span>
                      </Button>
                      <Button
                        className="h-16 flex-col space-y-1.5 border-slate-200 text-slate-700 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                        data-testid="button-create-post"
                        onClick={() => setIsEditingPost(true)}
                        variant="outline"
                      >
                        <FileText className="h-4 w-4" />
                        <span className="text-xs">Nuovo Articolo</span>
                      </Button>
                      <Button
                        className="h-16 flex-col space-y-1.5 border-slate-200 text-slate-700 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                        data-testid="button-view-analytics"
                        onClick={() => setActiveTab('analytics')}
                        variant="outline"
                      >
                        <BarChart3 className="h-4 w-4" />
                        <span className="text-xs">Analytics</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                  </div>
                )}

                {overviewSubTab === "blog" && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800">Gestione Blog</h3>
                        <p className="text-sm text-slate-500">Crea e gestisci gli articoli del blog</p>
                      </div>
                      <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" data-testid="button-add-blog-post-overview" onClick={() => setIsEditingPost(true)}>
                        <Plus className="h-4 w-4 mr-1" />
                        Nuovo Articolo
                      </Button>
                    </div>

                    <Card className="border-0 shadow-sm">
                      <CardContent className="pt-6">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-slate-100">
                              <TableHead className="text-slate-500">Titolo</TableHead>
                              <TableHead className="text-slate-500">Autore</TableHead>
                              <TableHead className="text-slate-500">Status</TableHead>
                              <TableHead className="text-slate-500">Data</TableHead>
                              <TableHead className="text-slate-500">Visualizzazioni</TableHead>
                              <TableHead className="text-right text-slate-500">Azioni</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {isLoadingPosts ? (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center text-slate-400">Caricamento...</TableCell>
                              </TableRow>
                            ) : blogPosts.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center text-slate-400">Nessun articolo trovato</TableCell>
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
                                  <TableRow key={post.id} className="border-slate-50 hover:bg-slate-50/50">
                                    <TableCell className="font-medium text-slate-800">{post.title}</TableCell>
                                    <TableCell className="text-slate-500">{post.author?.username ?? post.author ?? 'N/A'}</TableCell>
                                    <TableCell>
                                      <Badge className={
                                        post.status === 'published'
                                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                          : post.status === 'scheduled'
                                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                                          : 'bg-slate-50 text-slate-600 border-slate-200'
                                      }>
                                        {getUIStatusForDisplay(post.status)}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-slate-500">{new Date(post.createdAt).toLocaleDateString('it-IT')}</TableCell>
                                    <TableCell className="text-slate-500">{post.views || 0}</TableCell>
                                    <TableCell className="text-right">
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-700">
                                            <MoreHorizontal className="h-4 w-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuItem onClick={() => handleEditPost(post)}>
                                            <Edit className="h-4 w-4 mr-2" />
                                            Modifica
                                          </DropdownMenuItem>
                                          <DropdownMenuItem className="text-destructive" onClick={() => handleDeletePost(post.id)}>
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

                {overviewSubTab === "services" && (
                  <div className="space-y-6">
                    {isEditingService ? (
                      <ServiceEditor serviceToEdit={serviceToEdit} onClose={handleCloseServiceEditor} />
                    ) : (
                      <>
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-lg font-semibold text-slate-900">Gestione Servizi</h3>
                            <p className="text-sm text-slate-500">Configura i servizi della tua azienda</p>
                          </div>
                          <Button
                            size="sm"
                            className="bg-indigo-600 hover:bg-indigo-700"
                            onClick={() => { setServiceToEdit(null); setIsEditingService(true); }}
                            data-testid="button-create-service"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Nuovo Servizio
                          </Button>
                        </div>

                        {isLoadingServices ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Array.from({ length: 3 }).map((_, i) => (
                              <Card key={i} className="border-0 shadow-sm">
                                <CardContent className="p-5 space-y-3">
                                  <Skeleton className="h-5 w-3/4" />
                                  <Skeleton className="h-4 w-full" />
                                  <Skeleton className="h-4 w-2/3" />
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        ) : services.length === 0 ? (
                          <Card className="border-0 shadow-sm">
                            <CardContent className="py-16 text-center">
                              <Lightbulb className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                              <p className="text-slate-500 font-medium">Nessun servizio trovato</p>
                              <p className="text-sm text-slate-400 mt-1">Crea il tuo primo servizio per iniziare</p>
                            </CardContent>
                          </Card>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {services.map((service: any) => (
                              <Card key={service.id} className="border-0 shadow-sm hover:shadow-md transition-all group">
                                <CardContent className="p-5">
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                      <h4 className="font-semibold text-slate-900 line-clamp-1">{service.title}</h4>
                                      {service.shortDescription && (
                                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">{service.shortDescription}</p>
                                      )}
                                    </div>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-slate-700">
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleEditService(service)}>
                                          <Edit className="h-4 w-4 mr-2" />
                                          Modifica
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                  <div className="flex items-center gap-1.5 flex-wrap mt-3">
                                    <Badge variant="outline" className={service.isActive
                                      ? 'border-emerald-200 text-emerald-700 bg-emerald-50 text-xs'
                                      : 'border-slate-200 text-slate-600 bg-slate-50 text-xs'
                                    }>
                                      {service.isActive ? 'Attivo' : 'Inattivo'}
                                    </Badge>
                                    <Badge variant="outline" className={service.category === 'main'
                                      ? 'border-indigo-200 text-indigo-700 bg-indigo-50 text-xs'
                                      : 'border-slate-200 text-slate-600 bg-slate-50 text-xs'
                                    }>
                                      {service.category === 'main' ? 'Principale' : 'Aggiuntivo'}
                                    </Badge>
                                    {service.isPopular && (
                                      <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-xs">Popolare</Badge>
                                    )}
                                    {service.isFeatured && (
                                      <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs">In Evidenza</Badge>
                                    )}
                                  </div>
                                  {service.price && (
                                    <p className="mt-3 text-sm font-semibold text-indigo-600">
                                      {service.price}{service.priceDescription ? ` ${service.priceDescription}` : ''}
                                    </p>
                                  )}
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {overviewSubTab === "projects" && <ProjectsManager />}

                {overviewSubTab === "page-builder" && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">Page Builder</h3>
                        <p className="text-sm text-slate-500">Crea pagine con drag & drop</p>
                      </div>
                      <Button
                        size="sm"
                        className="bg-indigo-600 hover:bg-indigo-700"
                        onClick={() => setIsEditingBuilderPage(true)}
                        data-testid="button-create-builder-page-overview"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Nuova Pagina Builder
                      </Button>
                    </div>

                    <Card className="border-0 shadow-sm">
                      <CardContent className="pt-6">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-slate-100">
                              <TableHead className="text-slate-500">Titolo</TableHead>
                              <TableHead className="text-slate-500">Slug</TableHead>
                              <TableHead className="text-slate-500">Status</TableHead>
                              <TableHead className="text-slate-500">Ultima Modifica</TableHead>
                              <TableHead className="text-right text-slate-500">Azioni</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {!builderPages || builderPages.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center text-slate-400">Nessuna pagina builder trovata</TableCell>
                              </TableRow>
                            ) : (
                              builderPages.map((page: any) => (
                                <TableRow key={page.id} className="border-slate-50 hover:bg-slate-50/50">
                                  <TableCell className="font-medium text-slate-800">{page.title}</TableCell>
                                  <TableCell className="text-slate-500">/{page.slug}</TableCell>
                                  <TableCell>
                                    <Badge className={page.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-600 border-slate-200'}>
                                      {page.isActive ? 'Attiva' : 'Disattivata'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-slate-500">{new Date(page.updatedAt || page.createdAt).toLocaleDateString('it-IT')}</TableCell>
                                  <TableCell className="text-right">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-700">
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

                {overviewSubTab === "navbar" && <NavbarSettings />}
              </div>
            )}

            {/* Pages Tab */}
            {activeTab === "pages" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">Gestione Pagine</h2>
                  <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="border-slate-200"
                        onClick={() => {
                          const homePage = pages?.find(p => p.slug === 'home');
                          setHomepageToEdit(homePage || { slug: 'home', title: 'Homepage Personalizzata' });
                          setIsEditingHomepage(true);
                        }}
                      >
                        <Lightbulb className="mr-2 h-4 w-4" />
                        {pages?.find(p => p.slug === 'home' && p.isHomepageCustom) ? 'Modifica Homepage' : 'Crea Homepage Personalizzata'}
                      </Button>
                    <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setIsCreatingCustomPage(true)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Nuova Pagina
                    </Button>
                  </div>
                </div>
                <Card className="border-0 shadow-sm">
                  <CardContent className="pt-6">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-100">
                          <TableHead className="text-slate-500">Titolo</TableHead>
                          <TableHead className="text-slate-500">URL (Slug)</TableHead>
                          <TableHead className="text-slate-500">Status</TableHead>
                          <TableHead className="text-right text-slate-500">Azioni</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoadingPages ? (
                          <TableRow><TableCell colSpan={4} className="text-center text-slate-400">Caricamento...</TableCell></TableRow>
                        ) : (
                          pages.filter(page => !page.isHomepageCustom || page.slug === 'home').map((page: any) => (
                            <TableRow key={page.id} className="border-slate-50 hover:bg-slate-50/50">
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="font-medium flex items-center gap-2 text-slate-800">
                                    {page.title}
                                    {page.slug === 'home' && (
                                      <Badge className={page.isHomepageCustom ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}>
                                        {page.isHomepageCustom ? 'Personalizzata' : 'Statica'}
                                      </Badge>
                                    )}
                                    {page.isHomepageCustom && page.slug !== 'home' && (
                                      <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200">Homepage Personalizzata</Badge>
                                    )}
                                  </div>
                                  <div className="text-sm text-slate-400">
                                    {page.isHomepageCustom ? '/home' : `/${page.slug}`}
                                  </div>
                                  {page.isHomepageCustom && page.slug !== 'home' && (
                                    <div className="text-xs text-indigo-500">Clicca "Imposta come Predefinita" per attivarla</div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={page.status === 'published' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}>{page.status}</Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-700">
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
                                    {page.isHomepageCustom && page.slug !== 'home' && (
                                      <DropdownMenuItem onClick={() => {
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
                    <h2 className="text-2xl font-bold text-slate-900">Homepage Duplicate</h2>
                    <p className="text-slate-500 text-sm">Gestisci le versioni personalizzate della homepage</p>
                  </div>
                  <Button
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700"
                    onClick={() => {
                      setHomepageToEdit(null);
                      setIsEditingHomepage(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Nuova Homepage
                  </Button>
                </div>
                <Card className="border-0 shadow-sm">
                  <CardContent className="pt-6">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-100">
                          <TableHead className="text-slate-500">Titolo</TableHead>
                          <TableHead className="text-slate-500">URL</TableHead>
                          <TableHead className="text-slate-500">Status</TableHead>
                          <TableHead className="text-right text-slate-500">Azioni</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoadingPages ? (
                          <TableRow><TableCell colSpan={4} className="text-center text-slate-400">Caricamento...</TableCell></TableRow>
                        ) : (
                          pages.filter(page => page.isHomepageCustom).map((page: any) => (
                            <TableRow key={page.id} className="border-slate-50 hover:bg-slate-50/50">
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="font-medium flex items-center gap-2 text-slate-800">
                                    {page.title}
                                    {page.slug === 'home' && (
                                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Homepage Attiva</Badge>
                                    )}
                                    {page.slug !== 'home' && (
                                      <Badge className="bg-slate-100 text-slate-600 border-slate-200">Versione Personalizzata</Badge>
                                    )}
                                  </div>
                                  <div className="text-sm text-slate-400">/home</div>
                                  {page.slug !== 'home' && (
                                    <div className="text-xs text-indigo-500">Clicca "Attiva" per renderla la homepage principale</div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={page.status === 'published' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}>{page.status}</Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-700">
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


            {/* Preview Tab */}
            {activeTab === "preview" && (
              <div className="space-y-6 h-[calc(100vh-200px)]">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Anteprima Sito</h2>
                  <p className="text-sm text-slate-500">
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
                  <Card className="border-0 shadow-sm">
                    <CardContent className="pt-6">
                      <p className="text-center text-slate-400">
                        Caricamento informazioni sito...
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === "analytics" && (
              <Suspense fallback={<AnalyticsDashboardSkeleton />}>
                <AnalyticsDashboard />
              </Suspense>
            )}

            {/* Settings Section (SEO, Impostazioni, Footer, Tenant) */}
            {activeTab === "settings-section" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-slate-900">Impostazioni</h2>
                </div>
                <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
                  {[
                    { key: "seo", label: "SEO" },
                    { key: "settings", label: "Impostazioni" },
                    { key: "footer", label: "Footer" },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setSettingsSubTab(tab.key)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        settingsSubTab === tab.key
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {settingsSubTab === "seo" && (
                  <>
                    <SEOHead title="Admin Dashboard" description="Pannello di controllo amministrativo" noindex={true} />
                    <SEOSettings />
                  </>
                )}
                {settingsSubTab === "settings" && <SettingsEditor />}
                {settingsSubTab === "footer" && <FooterSettings />}
              </div>
            )}

            {/* Lead Section (Lead, Marketing Leads, Landing Pages) */}
            {activeTab === "lead-section" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-slate-900">Lead & Marketing</h2>
                </div>
                <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
                  {[
                    { key: "leads", label: "Lead" },
                    { key: "marketing-leads", label: "Marketing Leads" },
                    { key: "landing-pages", label: "Landing Pages" },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setLeadSubTab(tab.key)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        leadSubTab === tab.key
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {leadSubTab === "leads" && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800">Gestione Lead</h3>
                        <p className="text-sm text-slate-500">Visualizza e gestisci i contatti ricevuti suddivisi per campagna</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="border-slate-200" onClick={() => setLeadSubTab('landing-pages')}>
                          <FileText className="h-4 w-4 mr-1" />
                          Gestisci Campagne
                        </Button>
                        <Button variant="outline" size="sm" className="border-slate-200" data-testid="button-export-leads">
                          Esporta Lead
                        </Button>
                      </div>
                    </div>

                    {isLoadingLeads ? (
                      <Card className="border-0 shadow-sm">
                        <CardContent className="pt-6">
                          <div className="text-center py-8 text-slate-400">Caricamento lead...</div>
                        </CardContent>
                      </Card>
                    ) : leadsData?.leads?.length === 0 ? (
                      <Card className="border-0 shadow-sm">
                        <CardContent className="pt-6">
                          <div className="text-center py-8">
                            <Users className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                            <h3 className="text-lg font-semibold mb-2 text-slate-700">Nessun lead trovato</h3>
                            <p className="text-slate-400 mb-4">Configura le tue campagne Google Sheets per iniziare a ricevere lead</p>
                            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setActiveTab('google-sheets')}>
                              <FileText className="h-4 w-4 mr-1" />
                              Configura Campagne
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      (() => {
                        const leadsByCampaign = leadsData.leads.reduce((acc: Record<string, any[]>, lead: any) => {
                          const campaign = lead.source || 'non-assegnati';
                          if (!acc[campaign]) {
                            acc[campaign] = [];
                          }
                          acc[campaign].push(lead);
                          return acc;
                        }, {});

                        return Object.entries(leadsByCampaign).map(([campaign, campaignLeads]: [string, any]) => (
                          <Card key={campaign} className="border-0 shadow-sm border-l-4 border-l-indigo-400">
                            <CardHeader>
                              <div className="flex items-center justify-between">
                                <div>
                                  <CardTitle className="flex items-center gap-2 text-slate-800">
                                    <FileText className="h-5 w-5 text-indigo-500" />
                                    Campagna: {campaign.charAt(0).toUpperCase() + campaign.slice(1).replace(/-/g, ' ')}
                                  </CardTitle>
                                  <CardDescription>
                                    {campaignLeads.length} lead{campaignLeads.length !== 1 ? 's' : ''} totali
                                  </CardDescription>
                                </div>
                                <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 text-lg px-4 py-2">
                                  {campaignLeads.length}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <Table>
                                <TableHeader>
                                  <TableRow className="border-slate-100">
                                    <TableHead className="text-slate-500">Nome</TableHead>
                                    <TableHead className="text-slate-500">Email</TableHead>
                                    <TableHead className="text-slate-500">Telefono</TableHead>
                                    <TableHead className="text-slate-500">Azienda</TableHead>
                                    <TableHead className="text-slate-500">Status</TableHead>
                                    <TableHead className="text-slate-500">Data</TableHead>
                                    <TableHead className="text-right text-slate-500">Azioni</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {campaignLeads.map((lead: any) => (
                                    <TableRow key={lead.id} className="border-slate-50 hover:bg-slate-50/50">
                                      <TableCell className="font-medium" data-testid={`lead-name-${lead.id}`}>
                                        <div className="flex flex-col">
                                          <span className="font-semibold text-slate-800">{lead.name}</span>
                                          <span className="text-xs text-slate-400">ID: {lead.id.slice(0, 8)}...</span>
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex flex-col">
                                          <span className="truncate max-w-[180px] text-slate-600">{lead.email}</span>
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-slate-600">
                                        {lead.phone || '-'}
                                      </TableCell>
                                      <TableCell className="text-slate-600">
                                        {lead.company || '-'}
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
                                          <span className="text-sm text-slate-600">{new Date(lead.createdAt).toLocaleDateString('it-IT')}</span>
                                          <span className="text-xs text-slate-400">{new Date(lead.createdAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <div className="flex space-x-2 justify-end">
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="border-slate-200"
                                            data-testid={`button-contact-lead-${lead.id}`}
                                            onClick={() => window.open(`mailto:${lead.email}?subject=Risposta alla tua richiesta&body=Ciao ${lead.name},%0D%0A%0D%0AGrazie per averci contattato.`, '_blank')}
                                          >
                                            <Mail className="h-4 w-4 mr-1" />
                                            Contatta
                                          </Button>
                                          <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-700" data-testid={`button-lead-actions-${lead.id}`}>
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

                {leadSubTab === "marketing-leads" && <MarketingLeadsManager />}

                {leadSubTab === "landing-pages" && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800">Landing Pages</h3>
                        <p className="text-sm text-slate-500">Gestisci le landing page per le tue campagne</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="border-slate-200" onClick={handleCreateFromPatrimonioTemplate}>
                          <Copy className="h-4 w-4 mr-1" />
                          Da Template
                        </Button>
                        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setIsEditingLandingPage(true)}>
                          <Plus className="h-4 w-4 mr-1" />
                          Nuova Landing Page
                        </Button>
                      </div>
                    </div>

                    <Card className="border-0 shadow-sm">
                      <CardContent className="pt-6">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-slate-100">
                              <TableHead className="text-slate-500">Titolo</TableHead>
                              <TableHead className="text-slate-500">Slug</TableHead>
                              <TableHead className="text-slate-500">Template</TableHead>
                              <TableHead className="text-slate-500">Status</TableHead>
                              <TableHead className="text-slate-500">Conversioni</TableHead>
                              <TableHead className="text-slate-500">Creata</TableHead>
                              <TableHead className="text-right text-slate-500">Azioni</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {isLoadingLandingPages ? (
                              <TableRow>
                                <TableCell colSpan={7} className="text-center text-slate-400">Caricamento...</TableCell>
                              </TableRow>
                            ) : landingPages?.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={7} className="text-center text-slate-400">
                                  Nessuna landing page trovata
                                  <br />
                                  <Button
                                    variant="outline"
                                    className="mt-2 border-slate-200"
                                    onClick={() => setIsEditingLandingPage(true)}
                                  >
                                    Crea la prima landing page
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ) : (
                              landingPages?.map((landingPage) => (
                                <TableRow key={landingPage.id} className="border-slate-50 hover:bg-slate-50/50">
                                  <TableCell className="font-medium text-slate-800" data-testid={`landing-page-title-${landingPage.id}`}>
                                    {landingPage.title}
                                    {landingPage.isTemplate && <Badge className="ml-2 bg-purple-100 text-purple-700 border-purple-200">Template</Badge>}
                                  </TableCell>
                                  <TableCell>
                                    <code className="text-sm bg-slate-100 text-slate-600 px-2 py-1 rounded">
                                      /{landingPage.slug}
                                    </code>
                                  </TableCell>
                                  <TableCell className="text-slate-500">
                                    {landingPage.templateName || 'Custom'}
                                  </TableCell>
                                  <TableCell>
                                    <Badge className={landingPage.isActive ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}>
                                      {landingPage.isActive ? 'Attiva' : 'Inattiva'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-slate-500">{landingPage.conversionCount || 0}</TableCell>
                                  <TableCell className="text-slate-500">
                                    {new Date(landingPage.createdAt).toLocaleDateString('it-IT')}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-700" data-testid={`button-landing-page-actions-${landingPage.id}`}>
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
              </div>
            )}

            {/* Candidate Form Tab */}
            {activeTab === "candidate-form" && (
              <CandidateFormSettings />
            )}

            {/* Google Sheets Tab */}
            {activeTab === "google-sheets" && (
              <div className="space-y-6">
                <GoogleSheetsManager />
              </div>
            )}

            {/* API Keys Tab */}
            {activeTab === "api-keys" && (
              <div className="space-y-6">
                <ApiKeysManager />
              </div>
            )}

            {/* API Documentation Tab */}
            {activeTab === "api-docs" && (
              <div className="space-y-6">
                <ApiDocumentation />
              </div>
            )}
          </main>
        </SidebarInset>
      </div>

      {/* Service Editor */}
      {isEditingService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-auto">
          <ServiceEditor
            serviceToEdit={serviceToEdit}
            onClose={handleCloseServiceEditor}
          />
        </div>
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
          <Card className="w-full max-w-md mx-4 border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-slate-900">Crea Nuova Pagina</CardTitle>
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
                  <label className="text-sm font-medium text-slate-700">Template</label>
                  <select
                    name="templateType"
                    className="w-full p-2 border border-slate-200 rounded-lg mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                  <label className="text-sm font-medium text-slate-700">Titolo</label>
                  <Input
                    name="title"
                    placeholder="Es: La Mia Nuova Pagina"
                    className="border-slate-200 mt-1"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Slug</label>
                  <Input
                    name="slug"
                    placeholder="es: la-mia-nuova-pagina"
                    className="border-slate-200 mt-1"
                    required
                  />
                </div>
              </CardContent>
              <div className="flex justify-end space-x-2 p-6 pt-0">
                <Button
                  type="button"
                  variant="outline"
                  className="border-slate-200"
                  onClick={() => setIsCreatingCustomPage(false)}
                >
                  Annulla
                </Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
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
          <Card className="w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto border-0 shadow-xl">
            <CardHeader className="border-b border-slate-100">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl text-slate-900">Dettagli Lead Completi</CardTitle>
                  <CardDescription>
                    Informazioni dettagliate per {selectedLead.name}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-slate-400 hover:text-slate-700"
                  onClick={() => setSelectedLead(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2 text-slate-800">
                    <Users className="h-5 w-5 text-indigo-500" />
                    Informazioni Personali
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-slate-400">Nome Completo</label>
                      <p className="text-sm font-semibold text-slate-800">{selectedLead.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-400">Email</label>
                      <p className="text-sm text-slate-600">{selectedLead.email}</p>
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0 h-auto text-indigo-600"
                        onClick={() => window.open(`mailto:${selectedLead.email}`, '_blank')}
                      >
                        <Mail className="h-3 w-3 mr-1" />
                        Invia Email
                      </Button>
                    </div>
                    {selectedLead.phone && (
                      <div>
                        <label className="text-sm font-medium text-slate-400">Telefono</label>
                        <p className="text-sm text-slate-600">{selectedLead.phone}</p>
                        <Button
                          variant="link"
                          size="sm"
                          className="p-0 h-auto text-indigo-600"
                          onClick={() => window.open(`tel:${selectedLead.phone}`, '_self')}
                        >
                          <Users className="h-3 w-3 mr-1" />
                          Chiama
                        </Button>
                      </div>
                    )}
                    {selectedLead.company && (
                      <div>
                        <label className="text-sm font-medium text-slate-400">Azienda</label>
                        <p className="text-sm font-semibold text-slate-800">{selectedLead.company}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2 text-slate-800">
                    <Target className="h-5 w-5 text-indigo-500" />
                    Informazioni Lead
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-slate-400">Fonte</label>
                      <Badge variant="outline" className="block w-fit border-slate-200">
                        {selectedLead.source?.replace('contact-page-', '').replace('contact-form-', '').replace('-', ' ') || 'Contatto'}
                      </Badge>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-400">Status Attuale</label>
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
                          className="border-slate-200"
                          onClick={() => setIsEditingLeadStatus(true)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Modifica
                        </Button>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-400">Data Creazione</label>
                      <p className="text-sm text-slate-600">{new Date(selectedLead.createdAt).toLocaleString('it-IT')}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-400">ID Lead</label>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">{selectedLead.id}</code>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-400 hover:text-slate-700"
                          onClick={() => navigator.clipboard.writeText(selectedLead.id)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedLead.message && (
                  <div className="md:col-span-2 space-y-3">
                    <h3 className="font-semibold text-lg flex items-center gap-2 text-slate-800">
                      <FileText className="h-5 w-5 text-indigo-500" />
                      Messaggio
                    </h3>
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-600">{selectedLead.message}</p>
                    </div>
                  </div>
                )}

                {selectedLead.notes && (
                  <div className="md:col-span-2 space-y-3">
                    <h3 className="font-semibold text-lg flex items-center gap-2 text-slate-800">
                      <FileText className="h-5 w-5 text-indigo-500" />
                      Note Interne
                    </h3>
                    <div className="bg-indigo-50 p-4 rounded-lg border-l-4 border-indigo-400">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-600">{selectedLead.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <div className="flex justify-between items-center p-6 border-t border-slate-100 bg-slate-50/50">
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-200"
                  onClick={() => window.open(`mailto:${selectedLead.email}?subject=Risposta alla tua richiesta&body=Ciao ${selectedLead.name},%0D%0A%0D%0AGrazie per averci contattato.`, '_blank')}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Invia Email
                </Button>
                {selectedLead.phone && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-200"
                    onClick={() => window.open(`tel:${selectedLead.phone}`, '_self')}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Chiama
                  </Button>
                )}
              </div>
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setSelectedLead(null)}>
                Chiudi
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Lead Status Edit Modal */}
      {selectedLead && isEditingLeadStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <Card className="w-full max-w-md mx-4 border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-slate-900">Modifica Status Lead</CardTitle>
              <CardDescription>
                Aggiorna lo status per {selectedLead.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Nuovo Status</label>
                <select
                  className="w-full p-2 border border-slate-200 rounded-lg mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                <label className="text-sm font-medium text-slate-700">Note (opzionale)</label>
                <Textarea
                  placeholder="Aggiungi note sul cambio di status..."
                  className="mt-1 border-slate-200"
                  id="statusNotes"
                />
              </div>
            </CardContent>
            <div className="flex justify-end space-x-2 p-6 pt-0">
              <Button
                variant="outline"
                className="border-slate-200"
                onClick={() => setIsEditingLeadStatus(false)}
              >
                Annulla
              </Button>
              <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => {
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
