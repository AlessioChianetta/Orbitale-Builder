import { GoogleGenAI } from "@google/genai";
import { getSuperAdminGeminiKeys } from "./provider-factory";

export const AI_TEMPLATES = {
  "professionale-blu": {
    id: "professionale-blu",
    name: "Professionale Blu",
    description: "Elegante e istituzionale, ideale per studi professionali e aziende",
    colors: {
      heroBg: "#1e3a5f",
      heroText: "#ffffff",
      heroSubtext: "#bfdbfe",
      accent: "#3b82f6",
      accentHover: "#2563eb",
      accentText: "#ffffff",
      servicesBg: "#f8fafc",
      servicesText: "#1e293b",
      testimonialsBg: "#eff6ff",
      ctaBg: "#1e3a5f",
      ctaText: "#ffffff",
      footerBg: "#0f172a",
      footerText: "#94a3b8",
      navBg: "#1e3a5f",
      navText: "#ffffff",
    }
  },
  "caldo-arancio": {
    id: "caldo-arancio",
    name: "Caldo Arancio",
    description: "Energico e creativo, perfetto per food, artigianato e servizi alla persona",
    colors: {
      heroBg: "#7c2d12",
      heroText: "#ffffff",
      heroSubtext: "#fed7aa",
      accent: "#f97316",
      accentHover: "#ea580c",
      accentText: "#ffffff",
      servicesBg: "#fff7ed",
      servicesText: "#1c1917",
      testimonialsBg: "#fef3c7",
      ctaBg: "#7c2d12",
      ctaText: "#ffffff",
      footerBg: "#431407",
      footerText: "#9a3412",
      navBg: "#7c2d12",
      navText: "#ffffff",
    }
  },
  "moderno-verde": {
    id: "moderno-verde",
    name: "Moderno Verde",
    description: "Fresco e sostenibile, adatto per salute, benessere e natura",
    colors: {
      heroBg: "#14532d",
      heroText: "#ffffff",
      heroSubtext: "#bbf7d0",
      accent: "#22c55e",
      accentHover: "#16a34a",
      accentText: "#ffffff",
      servicesBg: "#f0fdf4",
      servicesText: "#14532d",
      testimonialsBg: "#dcfce7",
      ctaBg: "#14532d",
      ctaText: "#ffffff",
      footerBg: "#052e16",
      footerText: "#4ade80",
      navBg: "#14532d",
      navText: "#ffffff",
    }
  },
  "elegante-viola": {
    id: "elegante-viola",
    name: "Elegante Viola",
    description: "Sofisticato e moderno, ideale per luxury, beauty e lifestyle",
    colors: {
      heroBg: "#4c1d95",
      heroText: "#ffffff",
      heroSubtext: "#ddd6fe",
      accent: "#8b5cf6",
      accentHover: "#7c3aed",
      accentText: "#ffffff",
      servicesBg: "#faf5ff",
      servicesText: "#1e1b4b",
      testimonialsBg: "#f3e8ff",
      ctaBg: "#4c1d95",
      ctaText: "#ffffff",
      footerBg: "#2e1065",
      footerText: "#a78bfa",
      navBg: "#4c1d95",
      navText: "#ffffff",
    }
  },
  "bianco": {
    id: "bianco",
    name: "Da Zero (Bianco)",
    description: "Tela bianca, crea il tuo design da zero",
    colors: {
      heroBg: "#1e293b",
      heroText: "#ffffff",
      heroSubtext: "#cbd5e1",
      accent: "#6366f1",
      accentHover: "#4f46e5",
      accentText: "#ffffff",
      servicesBg: "#f8fafc",
      servicesText: "#0f172a",
      testimonialsBg: "#f1f5f9",
      ctaBg: "#1e293b",
      ctaText: "#ffffff",
      footerBg: "#0f172a",
      footerText: "#64748b",
      navBg: "#1e293b",
      navText: "#ffffff",
    }
  }
};

export type TemplateId = keyof typeof AI_TEMPLATES;

export interface GeneratedLandingContent {
  meta: {
    title: string;
    description: string;
    slug: string;
  };
  navbar: {
    brand: string;
    links: Array<{ label: string; anchor: string }>;
  };
  hero: {
    badge?: string;
    headline: string;
    subheadline: string;
    cta_primary: string;
    cta_secondary?: string;
  };
  services: {
    section_title: string;
    section_subtitle: string;
    items: Array<{ icon: string; title: string; description: string }>;
  };
  testimonials: {
    section_title: string;
    items: Array<{ text: string; name: string; role: string }>;
  };
  cta_section: {
    headline: string;
    description: string;
    button: string;
  };
  footer: {
    brand: string;
    tagline: string;
  };
}

async function getGeminiApiKey(): Promise<string | null> {
  const superAdminKeys = await getSuperAdminGeminiKeys();
  if (superAdminKeys && superAdminKeys.enabled && superAdminKeys.keys.length > 0) {
    return superAdminKeys.keys[Math.floor(Math.random() * superAdminKeys.keys.length)];
  }
  return process.env.GEMINI_API_KEY || null;
}

export async function generateLandingPageContent(
  description: string,
  templateId: TemplateId
): Promise<GeneratedLandingContent> {
  const apiKey = await getGeminiApiKey();
  if (!apiKey) {
    throw new Error("Nessuna chiave API Gemini configurata. Vai su Super Admin → Configurazione AI per impostare la chiave.");
  }

  const template = AI_TEMPLATES[templateId] || AI_TEMPLATES["bianco"];

  const systemPrompt = `Sei un copywriter esperto di landing page italiane per piccole e medie imprese.
Il tuo compito è generare testi persuasivi, chiari e professionali in italiano per una landing page business.
Rispondi SOLO con un oggetto JSON valido, senza markdown, senza testo prima o dopo il JSON.`;

  const userPrompt = `Genera i testi per una landing page italiana basandoti su questa descrizione:
"${description}"

Template scelto: ${template.name}

Genera un oggetto JSON con questa struttura esatta:
{
  "meta": {
    "title": "Titolo SEO della pagina (max 60 caratteri)",
    "description": "Meta description SEO (max 160 caratteri)",
    "slug": "url-slug-della-pagina"
  },
  "navbar": {
    "brand": "Nome Brand/Azienda",
    "links": [
      { "label": "Servizi", "anchor": "#servizi" },
      { "label": "Chi Siamo", "anchor": "#testimonianze" },
      { "label": "Contatti", "anchor": "#contatti" }
    ]
  },
  "hero": {
    "badge": "Breve badge opzionale (es. '✨ Nuovo' o 'Offerta Speciale')",
    "headline": "Titolo principale H1 impattante (max 10 parole)",
    "subheadline": "Sottotitolo descrittivo (max 20 parole)",
    "cta_primary": "Testo pulsante CTA principale (es. 'Scopri di più' o 'Contattaci')",
    "cta_secondary": "Testo pulsante secondario opzionale (es. 'Guarda i nostri lavori')"
  },
  "services": {
    "section_title": "Titolo sezione servizi (max 8 parole)",
    "section_subtitle": "Sottotitolo sezione servizi (max 15 parole)",
    "items": [
      { "icon": "CheckCircle", "title": "Nome Servizio 1", "description": "Descrizione servizio 1 (max 20 parole)" },
      { "icon": "Star", "title": "Nome Servizio 2", "description": "Descrizione servizio 2 (max 20 parole)" },
      { "icon": "Zap", "title": "Nome Servizio 3", "description": "Descrizione servizio 3 (max 20 parole)" }
    ]
  },
  "testimonials": {
    "section_title": "Titolo sezione testimonianze (max 8 parole)",
    "items": [
      { "text": "Testimonianza realistica e positiva (max 30 parole)", "name": "Nome Cliente", "role": "Ruolo / Azienda" },
      { "text": "Seconda testimonianza realistica (max 30 parole)", "name": "Nome Cliente 2", "role": "Ruolo 2" }
    ]
  },
  "cta_section": {
    "headline": "Titolo CTA finale (max 8 parole)",
    "description": "Testo persuasivo sotto il titolo CTA (max 20 parole)",
    "button": "Testo pulsante CTA finale"
  },
  "footer": {
    "brand": "Nome Brand",
    "tagline": "Tagline breve (max 8 parole)"
  }
}

IMPORTANTE:
- Tutti i testi devono essere in ITALIANO
- I contenuti devono essere realistici e coerenti con la descrizione fornita
- Rispondi SOLO con il JSON, nessun testo aggiuntivo`;

  const ai = new GoogleGenAI({ apiKey });
  const result = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    config: {
      systemInstruction: { role: "system", parts: [{ text: systemPrompt }] },
      temperature: 0.7,
      maxOutputTokens: 2048,
    }
  }) as any;

  let rawText = "";
  if (typeof result?.response?.text === "function") {
    rawText = result.response.text();
  } else if (typeof result?.response?.text === "string") {
    rawText = result.response.text;
  } else if (result?.response?.candidates?.[0]?.content?.parts?.[0]?.text) {
    rawText = result.response.candidates[0].content.parts[0].text;
  } else if (typeof result?.text === "string") {
    rawText = result.text;
  } else if (typeof result?.text === "function") {
    rawText = result.text();
  } else if (result?.candidates?.[0]?.content?.parts?.[0]?.text) {
    rawText = result.candidates[0].content.parts[0].text;
  }
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Gemini non ha restituito un JSON valido. Riprova.");
  }

  const content = JSON.parse(jsonMatch[0]) as GeneratedLandingContent;
  return content;
}

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

interface ComponentDefinition {
  id: string;
  type: string;
  props: Record<string, unknown>;
  children?: ComponentDefinition[];
}

export function buildComponentsFromContent(
  content: GeneratedLandingContent,
  templateId: TemplateId
): ComponentDefinition[] {
  const t = (AI_TEMPLATES[templateId] || AI_TEMPLATES["bianco"]).colors;

  const navLinks = content.navbar.links.map(l => ({ label: l.label, link: l.anchor }));
  navLinks.push({ label: "Contattaci", link: "#contatti" });

  const components: ComponentDefinition[] = [
    {
      id: makeId("nav"),
      type: "nav-menu",
      props: {
        items: [{ label: content.navbar.brand, link: "#" }, ...navLinks],
        layout: "horizontal",
        alignment: "right",
        backgroundColor: t.navBg,
        textColor: t.navText,
        paddingY: "16",
        sticky: true,
        mobileHamburger: true,
        smoothScroll: true,
      }
    },

    {
      id: makeId("hero"),
      type: "section",
      props: {
        backgroundColor: t.heroBg,
        paddingY: "120",
        paddingX: "24",
        minHeight: "90vh",
        maxWidth: "900px",
        textAlign: "center",
      },
      children: [
        ...(content.hero.badge ? [{
          id: makeId("hero-badge"),
          type: "text",
          props: {
            content: content.hero.badge,
            fontSize: "sm",
            fontWeight: "semibold",
            color: t.accent,
            textAlign: "center",
          }
        }] : []),
        {
          id: makeId("hero-h1"),
          type: "heading",
          props: {
            text: content.hero.headline,
            tag: "h1",
            size: "5xl",
            weight: "bold",
            color: t.heroText,
            textAlign: "center",
          }
        },
        {
          id: makeId("hero-sub"),
          type: "text",
          props: {
            content: content.hero.subheadline,
            fontSize: "xl",
            fontWeight: "normal",
            color: t.heroSubtext,
            textAlign: "center",
          }
        },
        {
          id: makeId("hero-spacer"),
          type: "spacer",
          props: { height: "32" }
        },
        {
          id: makeId("hero-btn"),
          type: "button",
          props: {
            text: content.hero.cta_primary,
            link: "#contatti",
            variant: "default",
            size: "lg",
            alignment: "center",
            backgroundColor: t.accent,
            textColor: t.accentText,
          }
        },
        ...(content.hero.cta_secondary ? [{
          id: makeId("hero-btn2"),
          type: "button",
          props: {
            text: content.hero.cta_secondary,
            link: "#servizi",
            variant: "outline",
            size: "lg",
            alignment: "center",
          }
        }] : []),
      ]
    },

    {
      id: makeId("services-anchor"),
      type: "section",
      props: {
        id: "servizi",
        backgroundColor: t.servicesBg,
        paddingY: "80",
        paddingX: "24",
      },
      children: [
        {
          id: makeId("services-title"),
          type: "heading",
          props: {
            text: content.services.section_title,
            tag: "h2",
            size: "3xl",
            weight: "bold",
            color: t.servicesText,
            textAlign: "center",
          }
        },
        {
          id: makeId("services-sub"),
          type: "text",
          props: {
            content: content.services.section_subtitle,
            fontSize: "lg",
            fontWeight: "normal",
            color: t.servicesText,
            textAlign: "center",
          }
        },
        {
          id: makeId("spacer-s1"),
          type: "spacer",
          props: { height: "40" }
        },
        {
          id: makeId("features"),
          type: "features",
          props: {
            title: "",
            titleSize: "2xl",
            titleColor: t.servicesText,
            items: content.services.items.map(item => ({
              icon: item.icon,
              title: item.title,
              description: item.description,
            })),
            backgroundColor: "",
            paddingY: "0",
          }
        }
      ]
    },

    {
      id: makeId("testimonials-anchor"),
      type: "testimonials",
      props: {
        id: "testimonianze",
        title: content.testimonials.section_title,
        items: content.testimonials.items.map(item => ({
          name: item.name,
          role: item.role,
          text: item.text,
          image: "",
        })),
        backgroundColor: t.testimonialsBg,
        paddingY: 80,
      }
    },

    {
      id: makeId("cta-section"),
      type: "section",
      props: {
        id: "contatti",
        backgroundColor: t.ctaBg,
        paddingY: "80",
        paddingX: "24",
        textAlign: "center",
      },
      children: [
        {
          id: makeId("cta-title"),
          type: "heading",
          props: {
            text: content.cta_section.headline,
            tag: "h2",
            size: "3xl",
            weight: "bold",
            color: t.ctaText,
            textAlign: "center",
          }
        },
        {
          id: makeId("cta-desc"),
          type: "text",
          props: {
            content: content.cta_section.description,
            fontSize: "lg",
            fontWeight: "normal",
            color: t.heroSubtext,
            textAlign: "center",
          }
        },
        {
          id: makeId("cta-spacer"),
          type: "spacer",
          props: { height: "32" }
        },
        {
          id: makeId("cta-btn"),
          type: "button",
          props: {
            text: content.cta_section.button,
            link: "mailto:info@example.com",
            variant: "default",
            size: "lg",
            alignment: "center",
            backgroundColor: t.accent,
            textColor: t.accentText,
          }
        }
      ]
    },

    {
      id: makeId("footer"),
      type: "section",
      props: {
        backgroundColor: t.footerBg,
        paddingY: "40",
        paddingX: "24",
        textAlign: "center",
      },
      children: [
        {
          id: makeId("footer-brand"),
          type: "heading",
          props: {
            text: content.footer.brand,
            tag: "h3",
            size: "xl",
            weight: "bold",
            color: "#ffffff",
            textAlign: "center",
          }
        },
        {
          id: makeId("footer-tagline"),
          type: "text",
          props: {
            content: content.footer.tagline,
            fontSize: "sm",
            fontWeight: "normal",
            color: t.footerText,
            textAlign: "center",
          }
        }
      ]
    }
  ];

  return components;
}
