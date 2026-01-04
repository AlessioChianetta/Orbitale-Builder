import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Import component examples
import HeaderExample from "@/components/examples/Header";
import FooterExample from "@/components/examples/Footer";
import HeroExample from "@/components/examples/Hero";
import ServiceCardExample from "@/components/examples/ServiceCard";
import BlogCardExample from "@/components/examples/BlogCard";
import TestimonialCardExample from "@/components/examples/TestimonialCard";
import ContactFormExample from "@/components/examples/ContactForm";
import CandidateFormExample from "@/components/examples/CandidateForm";
import AdminDashboardExample from "@/components/examples/AdminDashboard";

interface ComponentDemoProps {
  title: string;
  description: string;
  component: React.ComponentType;
  category: string;
}

function ComponentDemo({ title, description, component: Component, category }: ComponentDemoProps) {
  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-heading text-xl">{title}</CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
          <Badge variant="outline">{category}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          <Component />
        </div>
      </CardContent>
    </Card>
  );
}

const components = {
  layout: [
    {
      title: "Header",
      description: "Navigazione principale con menu responsive e branding",
      component: HeaderExample,
      category: "Layout"
    },
    {
      title: "Footer",
      description: "Footer completo con link, contatti e social media",
      component: FooterExample,
      category: "Layout"
    },
    {
      title: "Hero Section",
      description: "Sezione hero con CTA, features e visual accattivante",
      component: HeroExample,
      category: "Layout"
    }
  ],
  content: [
    {
      title: "Service Cards",
      description: "Card servizi con prezzi, features e call-to-action",
      component: ServiceCardExample,
      category: "Content"
    },
    {
      title: "Blog Cards",
      description: "Card articoli blog con metadata e anteprima",
      component: BlogCardExample,
      category: "Content"
    },
    {
      title: "Testimonial Cards",
      description: "Testimonianze clienti con rating e avatar",
      component: TestimonialCardExample,
      category: "Content"
    }
  ],
  forms: [
    {
      title: "Contact Form",
      description: "Form contatti con validazione e gestione errori",
      component: ContactFormExample,
      category: "Forms"
    },
    {
      title: "Candidate Form",
      description: "Form candidatura lead generation con campi avanzati",
      component: CandidateFormExample,
      category: "Forms"
    }
  ],
  admin: [
    {
      title: "Admin Dashboard",
      description: "Dashboard CMS completa per gestione contenuti",
      component: AdminDashboardExample,
      category: "Admin"
    }
  ]
};

export default function ComponentShowcase() {
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
            Showcase Componenti
          </Badge>
          <h1 className="font-heading font-bold text-4xl mb-4" data-testid="heading-showcase">
            Libreria Componenti
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Tutti i componenti sviluppati per il sito web professionale con CMS e sistema di lead generation.
          </p>
        </div>

        <Tabs defaultValue="layout" className="space-y-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="layout" data-testid="tab-layout">Layout</TabsTrigger>
            <TabsTrigger value="content" data-testid="tab-content">Content</TabsTrigger>
            <TabsTrigger value="forms" data-testid="tab-forms">Forms</TabsTrigger>
            <TabsTrigger value="admin" data-testid="tab-admin">Admin</TabsTrigger>
          </TabsList>

          <TabsContent value="layout" className="space-y-8">
            <div>
              <h2 className="font-heading font-semibold text-2xl mb-2">Componenti Layout</h2>
              <p className="text-muted-foreground mb-6">
                Componenti strutturali per l'organizzazione delle pagine.
              </p>
              <Separator className="mb-8" />
              {components.layout.map((comp, index) => (
                <ComponentDemo key={index} {...comp} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="content" className="space-y-8">
            <div>
              <h2 className="font-heading font-semibold text-2xl mb-2">Componenti Contenuto</h2>
              <p className="text-muted-foreground mb-6">
                Componenti per la visualizzazione di contenuti e informazioni.
              </p>
              <Separator className="mb-8" />
              {components.content.map((comp, index) => (
                <ComponentDemo key={index} {...comp} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="forms" className="space-y-8">
            <div>
              <h2 className="font-heading font-semibold text-2xl mb-2">Form e Input</h2>
              <p className="text-muted-foreground mb-6">
                Form complessi con validazione per contatti e lead generation.
              </p>
              <Separator className="mb-8" />
              {components.forms.map((comp, index) => (
                <ComponentDemo key={index} {...comp} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="admin" className="space-y-8">
            <div>
              <h2 className="font-heading font-semibold text-2xl mb-2">Pannello Amministrazione</h2>
              <p className="text-muted-foreground mb-6">
                Dashboard e interfacce per la gestione del CMS.
              </p>
              <Separator className="mb-8" />
              {components.admin.map((comp, index) => (
                <ComponentDemo key={index} {...comp} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}