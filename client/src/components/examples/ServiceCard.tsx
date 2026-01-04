import ServiceCard from '../ServiceCard';
import { Palette, Rocket, BarChart3 } from 'lucide-react';

export default function ServiceCardExample() {
  const services = [
    {
      title: "Consulenza Strategica",
      description: "Analisi completa e strategia personalizzata per il tuo business digitale",
      icon: Palette,
      features: [
        "Analisi di mercato approfondita",
        "Strategia digitale personalizzata",
        "Roadmap di implementazione",
        "Consulenza continuativa"
      ],
      price: "€299",
      ctaLink: "/servizi/consulenza"
    },
    {
      title: "Sviluppo Completo",
      description: "Piattaforma completa con CMS, blog e landing page ottimizzate",
      icon: Rocket,
      features: [
        "Sito web responsive completo",
        "Sistema CMS avanzato",
        "Blog integrato con SEO",
        "Landing page builder",
        "Analytics e tracking"
      ],
      price: "€899",
      popular: true,
      ctaLink: "/servizi/sviluppo"
    },
    {
      title: "Marketing Digitale",
      description: "Campagne mirate e ottimizzazione per massimizzare le conversioni",
      icon: BarChart3,
      features: [
        "Campagne Google Ads",
        "Social Media Marketing",
        "Email Marketing",
        "Ottimizzazione conversioni",
        "Report mensili dettagliati"
      ],
      price: "€599",
      ctaLink: "/servizi/marketing"
    }
  ];

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {services.map((service, index) => (
        <ServiceCard key={index} {...service} />
      ))}
    </div>
  );
}