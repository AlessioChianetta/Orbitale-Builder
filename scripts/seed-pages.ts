
import { storage } from "../server/storage";

const basePagesData = [
  {
    title: "Homepage",
    slug: "home", 
    metaTitle: "Marketing a Risposta Diretta per Imprenditori Ambiziosi",
    metaDescription: "Trasforma la tua spesa pubblicitaria in un asset aziendale prevedibile e profittevole con i nostri sistemi di marketing a risposta diretta.",
    featuredImage: "/images/homepage-hero.jpg",
    status: "published",
    content: { type: "homepage" }
  },
  {
    title: "I Nostri Servizi",
    slug: "servizi",
    metaTitle: "I Nostri Servizi - Soluzioni Complete per la Crescita Digitale", 
    metaDescription: "Scopri la gamma completa dei nostri servizi: sviluppo web, marketing digitale, SEO, e-commerce e consulenza strategica. Soluzioni su misura per il tuo business.",
    featuredImage: "/images/servizi-hero.jpg",
    status: "published",
    content: { type: "services" }
  },
  {
    title: "Blog",
    slug: "blog",
    metaTitle: "Blog - Guide e Strategie di Marketing Digitale",
    metaDescription: "Scopri le migliori strategie di marketing digitale, case study e consigli pratici per far crescere il tuo business online. Guide aggiornate e contenuti di valore.",
    featuredImage: "/images/blog-hero.jpg", 
    status: "published",
    content: { type: "blog" }
  },
  {
    title: "Chi Siamo",
    slug: "chi-siamo",
    metaTitle: "Chi Siamo - Il Team di Esperti di Marketing Digitale",
    metaDescription: "Scopri la storia del nostro team di esperti in marketing digitale. La nostra missione è aiutare le aziende a crescere con strategie innovative e misurabili.",
    featuredImage: "/images/team-hero.jpg",
    status: "published", 
    content: { type: "about" }
  },
  {
    title: "Contatti",
    slug: "contatti",
    metaTitle: "Contatti - Richiedi una Consulenza Gratuita",
    metaDescription: "Contattaci per una consulenza gratuita e scopri come possiamo aiutare la tua azienda a crescere con il marketing digitale. Richiedi subito un preventivo.",
    featuredImage: "/images/contact-hero.jpg",
    status: "published",
    content: { type: "contact" }
  },
  {
    title: "FAQ",
    slug: "faq", 
    metaTitle: "Domande Frequenti - Risposte alle Tue Domande",
    metaDescription: "Trova le risposte alle domande più frequenti sui nostri servizi di marketing digitale, processi di lavoro e modalità di collaborazione.",
    featuredImage: "/images/faq-hero.jpg",
    status: "published",
    content: { type: "faq" }
  }
];

async function seedPages() {
  console.log("🌱 Seeding base pages...");
  
  // Ottieni admin user per authoring
  const adminUser = await storage.getUserByUsername('admin');
  if (!adminUser) {
    console.error("❌ Admin user not found. Please run basic seed first.");
    return;
  }

  for (const pageData of basePagesData) {
    try {
      // Controlla se la pagina esiste già
      const existingPage = await storage.getPageBySlug(pageData.slug);
      
      if (existingPage) {
        console.log(`📄 Page "${pageData.slug}" already exists, skipping...`);
        continue;
      }

      // Crea la pagina
      const page = await storage.createPage({
        ...pageData,
        authorId: adminUser.id,
        publishedAt: new Date()
      });

      console.log(`✅ Created page: ${pageData.title} (/${pageData.slug})`);
    } catch (error) {
      console.error(`❌ Failed to create page ${pageData.slug}:`, error);
    }
  }

  console.log("🎉 Base pages seeding completed!");
}

// Esegui se chiamato direttamente
if (import.meta.url === `file://${process.argv[1]}`) {
  seedPages().catch(console.error);
}

export { seedPages };
