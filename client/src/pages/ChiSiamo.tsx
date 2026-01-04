import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Target, Shield, Lightbulb, ArrowRight, Quote, Award, TrendingUp, Heart } from "lucide-react";
import { Link } from "wouter";
import { SEOHead, useSEOPerformance } from "@/components/SEOHead";

// Team members data
const teamMembers = [
  {
    id: "1",
    fullName: "Alessio Rossi",
    title: "Founder & Lead Strategist",
    bio: "Unisce la logica ingegneristica del codice con i principi scientifici del marketing a risposta diretta.",
    profileImage: "https://via.placeholder.com/500x500/3b82f6/ffffff?text=AR",
    username: "alessio",
    role: "CEO",
    specialties: ["Marketing Strategy", "Business Growth", "Data Analytics"]
  },
  {
    id: "2",
    fullName: "Laura Bianchi",
    title: "Head of Operations",
    bio: "Organizza e ottimizza i processi per garantire che ogni progetto venga consegnato con la massima qualità.",
    profileImage: "https://via.placeholder.com/500x500/10b981/ffffff?text=LB",
    username: "laura",
    role: "COO",
    specialties: ["Project Management", "Team Leadership", "Process Optimization"]
  },
  {
    id: "3",
    fullName: "Marco Verdi",
    title: "Lead Developer",
    bio: "Trasforma le strategie in piattaforme web performanti, scalabili e facili da gestire per i nostri clienti.",
    profileImage: "https://via.placeholder.com/500x500/8b5cf6/ffffff?text=MV",
    username: "marco",
    role: "CTO",
    specialties: ["Full-Stack Development", "System Architecture", "DevOps"]
  },
  {
    id: "4",
    fullName: "Sofia Neri",
    title: "Senior Copywriter",
    bio: "Specializzata nella scrittura di testi persuasivi che convertono i visitatori in clienti fedeli.",
    profileImage: "https://via.placeholder.com/500x500/f59e0b/ffffff?text=SN",
    username: "sofia",
    role: "Creative Director",
    specialties: ["Copywriting", "Content Strategy", "Brand Messaging"]
  }
];

// Company values
const values = [
  {
    icon: Target,
    title: "Orientati ai Risultati",
    description: "Ogni strategia è misurata sul ROI concreto per i nostri clienti. Non promettiamo, dimostriamo.",
    color: "blue"
  },
  {
    icon: Lightbulb,
    title: "Innovazione Tecnologica",
    description: "Usiamo la logica ingegneristica per creare sistemi di marketing scientifici e replicabili.",
    color: "amber"
  },
  {
    icon: Shield,
    title: "Trasparenza Totale",
    description: "Comunicazione chiara, report dettagliati e nessuna sorpresa. Il tuo successo è misurabile.",
    color: "emerald"
  },
  {
    icon: Users,
    title: "Partnership Strategica",
    description: "Non siamo fornitori, siamo partner investiti nella tua crescita a lungo termine.",
    color: "purple"
  }
];

// Company timeline
const milestones = [
  {
    year: "2019",
    title: "L'Intuizione",
    description: "Nasce l'idea di unire programmazione e marketing a risposta diretta per creare sistemi automatizzati.",
    icon: Lightbulb
  },
  {
    year: "2021",
    title: "Primi 100 Clienti",
    description: "Raggiungiamo i primi 100 clienti con un tasso di successo del 98% e risultati misurabili.",
    icon: Users
  },
  {
    year: "2023",
    title: "Lancio del Sistema",
    description: "Rilasciamo la nostra piattaforma proprietaria per la gestione automatizzata della crescita.",
    icon: TrendingUp
  },
  {
    year: "2025",
    title: "Il Futuro",
    description: "La nostra missione è diventare il punto di riferimento in Italia per la crescita sistematica.",
    icon: Award
  }
];

// Componente semplificato che renderizza una sezione statica
function AnimatedSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

export default function ChiSiamo() {
  // SEO Performance monitoring
  useSEOPerformance('chi-siamo');

  return (
    <>
      <SEOHead 
        type="website"
        url="/chi-siamo"
        usePageData={true}
      />
      <div className="bg-gradient-to-br from-slate-50 via-white to-blue-50/30 text-slate-800 min-h-screen">
      {/* Hero Section */}
      <section className="section-padding bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]"></div>
        <div className="relative max-w-6xl mx-auto container-padding text-center">
          <div className="space-y-8">
            <div>
              <Badge className="glass-card border-primary/20 text-primary bg-primary/5 px-6 py-3 font-bold rounded-full shadow-lg">
                <Heart className="w-4 h-4 mr-2" />
                LA NOSTRA MISSIONE
              </Badge>
            </div>

            <h1 className="text-responsive-xl font-heading font-black tracking-tight leading-tight">
              Costruiamo <span className="bg-gradient-to-r from-primary via-blue-600 to-indigo-600 bg-clip-text text-transparent">Sistemi di Crescita</span>, non solo Campagne.
            </h1>

            <p className="text-responsive-md text-slate-600 max-w-4xl mx-auto leading-relaxed font-medium">
              Aiutiamo le aziende ambiziose a liberarsi dalla dipendenza dalle agenzie tradizionali, implementando asset di marketing proprietari che generano clienti in modo prevedibile e scalabile.
            </p>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <AnimatedSection>
        <section className="section-padding bg-white">
          <div className="max-w-7xl mx-auto container-padding">
            <div className="space-y-16">
              <div className="text-center space-y-6">
                <h2 className="text-responsive-lg font-heading font-black text-slate-900">I Pilastri del Nostro Metodo</h2>
                <p className="text-responsive-md text-slate-600 max-w-4xl mx-auto leading-relaxed font-medium">Ogni nostra azione si basa su questi quattro principi fondamentali che guidano il nostro approccio al business.</p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                {values.map((value) => {
                  const Icon = value.icon;
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
                          <div className="space-y-3">
                            <h3 className="font-bold text-lg sm:text-xl text-slate-900">{value.title}</h3>
                            <p className="text-slate-600 leading-relaxed font-medium">{value.description}</p>
                          </div>
                        </div>
                      </Card>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* Quote Section */}
      <AnimatedSection>
        <section className="section-padding bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 to-indigo-900/20"></div>
          <div className="relative max-w-5xl mx-auto container-padding text-center">
            <div className="space-y-8">
              <div>
                <Quote className="h-16 w-16 sm:h-20 sm:w-20 text-blue-400 mx-auto opacity-50"/>
              </div>
              <blockquote className="text-2xl sm:text-3xl lg:text-4xl font-medium italic leading-relaxed">
                "Il nostro obiettivo non è essere i vostri marketer. È rendervi così bravi nel marketing da non aver più bisogno di noi."
              </blockquote>
              <footer className="text-lg font-semibold text-slate-300">
                — Alessio Rossi, Founder
              </footer>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* Timeline Section */}
      <AnimatedSection>
        <section className="section-padding bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
          <div className="max-w-5xl mx-auto container-padding">
            <div className="space-y-16">
              <div className="text-center space-y-6">
                <h2 className="text-responsive-lg font-heading font-black text-slate-900">La Nostra Storia in Breve</h2>
                <p className="text-responsive-md text-slate-600 max-w-3xl mx-auto leading-relaxed font-medium">Dal sogno iniziale alla realtà di oggi: ecco come abbiamo costruito un metodo che funziona davvero.</p>
              </div>

              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-4 sm:left-8 top-0 w-0.5 h-full bg-gradient-to-b from-primary via-blue-500 to-indigo-600 rounded-full hidden md:block"></div>

                <div className="space-y-8 sm:space-y-12">
                  {milestones.map((milestone) => (
                    <div key={milestone.year}>
                      <Card className="glass-card hover-lift p-6 sm:p-8 ml-0 md:ml-20 border-0 shadow-xl group relative">
                        {/* Timeline dot */}
                        <div className="absolute -left-20 top-8 hidden md:flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-blue-600 rounded-full border-4 border-white shadow-xl group-hover:scale-110 transition-transform">
                          <milestone.icon className="h-8 w-8 text-white" />
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center gap-4 md:hidden">
                            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-primary to-blue-600 rounded-full">
                              <milestone.icon className="h-6 w-6 text-white" />
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
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* Team Section */}
      <AnimatedSection>
        <section className="section-padding bg-white">
          <div className="max-w-7xl mx-auto container-padding">
            <div className="space-y-16">
              <div className="text-center space-y-6">
                <h2 className="text-responsive-lg font-heading font-black text-slate-900">Le Menti dietro il Sistema</h2>
                <p className="text-responsive-md text-slate-600 max-w-4xl mx-auto leading-relaxed font-medium">Un team di specialisti ossessionati dai risultati e dalla crescita dei nostri partner. Conoscenza, esperienza e passione al servizio del tuo successo.</p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                {teamMembers.map((member) => (
                  <div key={member.id}>
                    <Card className="glass-card hover-lift overflow-hidden border-0 shadow-xl group h-full">
                      <div className="aspect-square relative overflow-hidden">
                        <img
                          src={member.profileImage}
                          alt={member.fullName}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>

                      <CardContent className="p-6 space-y-4">
                        <div className="text-center space-y-2">
                          <h3 className="font-bold text-lg sm:text-xl text-slate-900">{member.fullName}</h3>
                          <p className="text-primary text-sm font-bold">{member.title}</p>
                          <Badge variant="outline" className="text-xs px-3 py-1">{member.role}</Badge>
                        </div>

                        <p className="text-slate-600 text-sm leading-relaxed font-medium">{member.bio}</p>

                        <div className="flex flex-wrap gap-2">
                          {member.specialties.map((specialty, i) => (
                            <Badge key={i} variant="secondary" className="text-xs px-2 py-1 bg-slate-100 text-slate-600">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* CTA Section */}
      <AnimatedSection>
        <section className="section-padding bg-gradient-to-br from-primary via-blue-600 to-indigo-700 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
          <div className="relative max-w-5xl mx-auto container-padding text-center">
            <div className="space-y-8">
              <h2 className="text-responsive-lg font-heading font-black">Pronto a Lavorare con Noi?</h2>
              <p className="text-responsive-md opacity-90 leading-relaxed max-w-3xl mx-auto font-medium">Se condividi la nostra visione e sei pronto a costruire un sistema di crescita solido e duraturo, saremmo felici di conoscerti e valutare insieme le opportunità.</p>

              <div>
                <div>
                  <Button asChild size="lg" className="px-8 sm:px-12 py-6 sm:py-8 text-base sm:text-lg font-bold bg-white hover:bg-gray-100 text-slate-900 shadow-2xl rounded-2xl transition-all duration-300 w-full sm:w-auto">
                    <Link href="/contatti">
                      Contattaci Ora
                      <ArrowRight className="ml-3 h-5 w-5 sm:h-6 sm:w-6"/>
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>
    </div>
    </>
  );
}