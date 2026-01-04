import { lazy, Suspense } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import GoogleSheetsManager from "./pages/GoogleSheetsManager";
import RenditaDipendente from "./pages/RenditaDipendente";
import RelumePage from "./pages/RelumePage";
import ComponentShowcase from "./pages/ComponentShowcase";
import ApiDocumentation from "./pages/ApiDocumentation";

// Type for settings with defaultHomepage
interface PublicSettings {
  defaultHomepage?: string;
  [key: string]: any;
}

// Lazy-loaded Pages and Components
const Homepage = lazy(() => import("./pages/Homepage"));
const ChiSiamo = lazy(() => import("./pages/ChiSiamo"));
const Servizi = lazy(() => import("./pages/Servizi"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Contatti = lazy(() => import("./pages/Contatti"));
const FAQ = lazy(() => import("./pages/FAQ"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const OrbitaleLP = lazy(() => import("./pages/OrbitaleLP"));
const ThankYouPage = lazy(() => import("./pages/ThankYouPage"));
const PatrimonioPage = lazy(() => import("./pages/PatrimonioPage"));
const IMieiProgetti = lazy(() => import("./pages/IMieiProgetti"));
const ProjectDetail = lazy(() => import("@/pages/ProjectDetail"));
// ComponentShowcase is now imported directly above

// Admin components
const AdminDashboard = lazy(() => import("./components/AdminDashboard"));
const SuperAdminDashboard = lazy(() => import("./components/SuperAdminDashboard"));
const ProjectsManager = lazy(() => import("./components/ProjectsManager"));
const CandidateForm = lazy(() => import("./components/CandidateForm"));
const DynamicLandingPage = lazy(() => import("./components/DynamicLandingPage"));
const DynamicPage = lazy(() => import("./components/DynamicPage"));
const NotFound = lazy(() => import("./pages/not-found"));

// Simple skeleton loader for page transitions
function PageSkeleton() {
  return (
    <div className="min-h-screen p-8 space-y-6">
      <Skeleton className="h-12 w-3/4 max-w-2xl" />
      <Skeleton className="h-6 w-1/2 max-w-md" />
      <div className="space-y-4 mt-8">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    </div>
  );
}

// Placeholder for ProtectedRoute (assuming it exists elsewhere)
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  // Replace with actual auth logic
  return <>{children}</>;
}

function Router() {
  // Track page views when routes change
  useAnalytics();

  // Carica la pagina predefinita dalle impostazioni
  const { data: settings } = useQuery<PublicSettings>({
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
      <Route path="/orbitale" component={OrbitaleLP} />
      <Route path="/thank-you" component={ThankYouPage} />
      <Route path="/candidatura" component={CandidateForm} />
      <Route path="/components" component={ComponentShowcase} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/progetti" component={ProjectsManager} />
      <Route path="/superadmin" component={SuperAdminDashboard} />

      {/* Google Sheets Manager */}
          <Route
            path="/admin/google-sheets"
            element={
              <ProtectedRoute>
                <GoogleSheetsManager />
              </ProtectedRoute>
            }
          />

          {/* API Documentation */}
          <Route
            path="/admin/api-documentation"
            element={
              <ProtectedRoute>
                <ApiDocumentation />
              </ProtectedRoute>
            }
          />

      {/* Add route for RelumePage - must be before dynamic routes */}
      <Route path="/relume" component={RelumePage} />

      {/* Add route for ProjectDetail */}
      <Route path="/progetti/:slug" component={ProjectDetail} />
      <Route path="/progetti" component={IMieiProgetti} />

      {/* Catch-all for dynamic pages, landing pages, builder pages, and projects */}
      <Route path="/:slug" component={DynamicLandingPage} />

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
            <Suspense fallback={<PageSkeleton />}>
              <Router />
            </Suspense>
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