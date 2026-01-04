import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAnalytics } from "./hooks/use-analytics";
import { AnalyticsInitializer } from "@/components/AnalyticsInitializer";
import { FacebookPixelInitializer } from "@/components/FacebookPixelInitializer";


// Pages
import Homepage from "./pages/Homepage";
import ChiSiamo from "./pages/ChiSiamo";
import Servizi from "./pages/Servizi";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Contatti from "./pages/Contatti";
import FAQ from "./pages/FAQ";
import LandingPage from "./pages/LandingPage";
import RelumePage from "./pages/RelumePage";
import PatrimonioPage from "./pages/PatrimonioPage";
import IMieiProgetti from "./pages/IMieiProgetti";
import ProjectDetail from "@/pages/ProjectDetail";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import ComponentShowcase from "./pages/ComponentShowcase";
import AdminDashboard from "./components/AdminDashboard";
import SuperAdminDashboard from "./components/SuperAdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import ProjectsManager from "./components/ProjectsManager";
import CandidateForm from "./components/CandidateForm";
import DynamicLandingPage from "./components/DynamicLandingPage";
import DynamicPage from "./components/DynamicPage";
import NotFound from "./pages/not-found";

function Router() {
  // Track page views when routes change
  useAnalytics();

  // Carica la pagina predefinita dalle impostazioni
  const { data: settings } = useQuery({
    queryKey: ['/api/settings/public'],
    staleTime: 5 * 60 * 1000,
  });

  const defaultRedirect = settings?.defaultHomepage || '/home';

  return (
    <Switch>
      {/* Redirect homepage alla prima pagina della navbar */}
      <Route path="/">
        <Redirect to={defaultRedirect} />
      </Route>
      {/* Template-based pages using DynamicPage */}
      <Route path="/chi-siamo" component={DynamicPage} />
      <Route path="/servizi" component={DynamicPage} />
      <Route path="/contatti" component={DynamicPage} />
      <Route path="/faq" component={DynamicPage} />

      {/* Other pages that keep their original components */}
      <Route path="/blog" component={DynamicPage} />
      <Route path="/blog/:slug" component={BlogPost} />
      <Route path="/patrimonio" component={PatrimonioPage} />
      <Route path="/landing" component={LandingPage} />
      <Route path="/landing/:slug" component={LandingPage} />
      <Route path="/candidatura" component={CandidateForm} />
      <Route path="/components" component={ComponentShowcase} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/progetti" component={ProjectsManager} />
      <Route path="/superadmin" component={SuperAdminDashboard} />

      {/* Add route for RelumePage - must be before dynamic routes */}
      <Route path="/relume" component={RelumePage} />

      {/* Add route for ProjectDetail */}
      <Route path="/progetti/:slug" component={ProjectDetail} />
      <Route path="/progetti" component={IMieiProgetti} />

      {/* Catch-all for dynamic pages, landing pages, builder pages, and projects */}
      <Route path="/:slug" component={DynamicLandingPage} />

      <Route path="/candidatura" component={() => (
        <div className="min-h-screen py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h1 className="font-heading font-bold text-4xl mb-4">Candidatura Lead Generation</h1>
              <p className="text-xl text-muted-foreground">Accedi al nostro programma esclusivo di crescita digitale</p>
            </div>
            <CandidateForm />
          </div>
        </div>
      )} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  return (
    <TooltipProvider>
      <ThemeProvider defaultTheme="light" storageKey="professionale-theme">
        {/* Initialize Google Analytics from database settings */}
        <AnalyticsInitializer />
        {/* Initialize Facebook Pixel from database settings */}
        <FacebookPixelInitializer />

        <div className="min-h-dvh bg-background text-foreground flex flex-col">
          <Header />
          <main className="flex-1">
            <Router />
          </main>
          <Footer />
        </div>
        <Toaster />
      </ThemeProvider>
    </TooltipProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;