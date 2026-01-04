import { storage } from "../server/storage";
import { db } from "../server/db";
import { categories, tags, blogPostTags, services } from "../shared/schema";

async function seedDatabase() {
  console.log("🌱 Starting database seeding...");

  try {
    // Create admin user
    console.log("Creating admin user...");
    const adminUser = await storage.createUser({
      username: "admin",
      email: "admin@example.com",
      password: "admin123",
      role: "admin"
    });
    console.log("✅ Admin user created:", adminUser.username);

    // Create categories
    console.log("Creating categories...");
    const [techCategory] = await db.insert(categories).values({
      name: "Tecnologia",
      slug: "tecnologia",
      description: "Articoli su tecnologia e innovazione"
    }).returning();

    const [businessCategory] = await db.insert(categories).values({
      name: "Business",
      slug: "business", 
      description: "Articoli su business e strategia"
    }).returning();

    const [marketingCategory] = await db.insert(categories).values({
      name: "Marketing",
      slug: "marketing",
      description: "Articoli su marketing digitale"
    }).returning();

    console.log("✅ Categories created");

    // Create tags
    console.log("Creating tags...");
    const [webDevTag] = await db.insert(tags).values({
      name: "Sviluppo Web",
      slug: "sviluppo-web"
    }).returning();

    const [aiTag] = await db.insert(tags).values({
      name: "Intelligenza Artificiale",
      slug: "intelligenza-artificiale"
    }).returning();

    const [seoTag] = await db.insert(tags).values({
      name: "SEO",
      slug: "seo"
    }).returning();

    console.log("✅ Tags created");

    // Create services
    console.log("Creating services...");
    await storage.createService({
      title: "Sviluppo Web",
      slug: "sviluppo-web",
      description: "Sviluppiamo siti web moderni e responsive utilizzando le tecnologie più avanzate",
      shortDescription: "Siti web professionali e moderni",
      features: ["Design responsive", "Ottimizzazione SEO", "Performance elevate", "Sicurezza avanzata"],
      category: "development",
      price: 2500,
      duration: "4-6 settimane",
      isActive: true,
      order: 1
    });

    await storage.createService({
      title: "Consulenza Digital Marketing",
      slug: "consulenza-digital-marketing",
      description: "Strategie di marketing digitale personalizzate per far crescere il tuo business online",
      shortDescription: "Strategie di marketing digitale",
      features: ["Analisi competitor", "Strategy personalizzata", "Social media marketing", "Email marketing"],
      category: "marketing",
      price: 1500,
      duration: "2-3 settimane",
      isActive: true,
      order: 2
    });

    await storage.createService({
      title: "Ottimizzazione SEO",
      slug: "ottimizzazione-seo",
      description: "Miglioriamo la visibilità del tuo sito sui motori di ricerca con tecniche SEO avanzate",
      shortDescription: "Posizionamento sui motori di ricerca",
      features: ["Audit SEO completo", "Ottimizzazione on-page", "Link building", "Reportistica mensile"],
      category: "seo",
      price: 800,
      duration: "3-4 settimane",
      isActive: true,
      order: 3
    });

    console.log("✅ Services created");

    // Create sample pages
    console.log("Creating pages...");
    await storage.createPage({
      title: "Chi Siamo",
      slug: "chi-siamo",
      content: {
        sections: [
          {
            type: "hero",
            title: "La Nostra Storia",
            subtitle: "Un team di professionisti dedicati all'innovazione digitale"
          },
          {
            type: "text",
            content: "Siamo un'agenzia digitale specializzata nello sviluppo web e nel marketing digitale. Con anni di esperienza nel settore, aiutiamo le aziende a crescere online attraverso soluzioni innovative e strategie personalizzate."
          }
        ]
      },
      metaTitle: "Chi Siamo - La Nostra Agenzia Digitale",
      metaDescription: "Scopri la nostra storia e il nostro team di esperti in sviluppo web e marketing digitale.",
      status: "published",
      publishedAt: new Date(),
      authorId: adminUser.id
    });

    await storage.createPage({
      title: "Servizi",
      slug: "servizi",
      content: {
        sections: [
          {
            type: "hero",
            title: "I Nostri Servizi",
            subtitle: "Soluzioni digitali complete per il tuo business"
          },
          {
            type: "services_grid",
            title: "Cosa Offriamo",
            services: ["sviluppo-web", "consulenza-digital-marketing", "ottimizzazione-seo"]
          }
        ]
      },
      metaTitle: "Servizi - Sviluppo Web e Marketing Digitale",
      metaDescription: "Scopri tutti i nostri servizi: sviluppo web, marketing digitale, SEO e molto altro.",
      status: "published",
      publishedAt: new Date(),
      authorId: adminUser.id
    });

    await storage.createPage({
      title: "Contatti",
      slug: "contatti",
      content: {
        sections: [
          {
            type: "hero",
            title: "Contattaci",
            subtitle: "Pronto a far crescere il tuo business online?"
          },
          {
            type: "contact_form"
          },
          {
            type: "text",
            content: "Siamo qui per aiutarti a realizzare i tuoi obiettivi digitali. Contattaci per una consulenza gratuita."
          }
        ]
      },
      metaTitle: "Contatti - Agenzia Digitale",
      metaDescription: "Contatta la nostra agenzia per una consulenza gratuita sui tuoi progetti digitali.",
      status: "published",
      publishedAt: new Date(),
      authorId: adminUser.id
    });

    console.log("✅ Pages created");

    // Create sample blog posts
    console.log("Creating blog posts...");
    const blogPost1 = await storage.createBlogPost({
      title: "Il Futuro dello Sviluppo Web nel 2024",
      slug: "futuro-sviluppo-web-2024",
      content: `
        <h2>Le Tendenze che Stanno Rivoluzionando il Web</h2>
        <p>Il mondo dello sviluppo web è in costante evoluzione. Nel 2024, stiamo assistendo a cambiamenti significativi che stanno ridefinendo il modo in cui costruiamo e interagiamo con i siti web.</p>
        
        <h3>1. Intelligenza Artificiale Integrata</h3>
        <p>L'AI non è più una tecnologia del futuro, ma una realtà presente. Dall'assistenza clienti automatizzata alla personalizzazione dei contenuti, l'intelligenza artificiale sta diventando parte integrante dell'esperienza web.</p>
        
        <h3>2. Web Performance e Core Web Vitals</h3>
        <p>Le performance del sito web sono più importanti che mai. Google continua a enfatizzare l'importanza dei Core Web Vitals per il posizionamento nei risultati di ricerca.</p>
        
        <h3>3. Progressive Web Apps (PWA)</h3>
        <p>Le PWA offrono un'esperienza simile alle app native direttamente nel browser, combinando il meglio del web e delle applicazioni mobile.</p>
        
        <p>Il futuro dello sviluppo web è ricco di opportunità per chi sa adattarsi e innovare. Rimanere aggiornati sulle ultime tendenze è essenziale per il successo.</p>
      `,
      excerpt: "Scopri le principali tendenze che stanno definendo il futuro dello sviluppo web nel 2024, dall'AI alle PWA.",
      status: "published",
      publishedAt: new Date(),
      isFeatured: true,
      categoryId: techCategory.id,
      authorId: adminUser.id,
      readingTime: 5
    });

    const blogPost2 = await storage.createBlogPost({
      title: "Strategie SEO Efficaci per il 2024",
      slug: "strategie-seo-efficaci-2024",
      content: `
        <h2>Come Migliorare il Posizionamento del Tuo Sito</h2>
        <p>La SEO continua a essere un pilastro fondamentale per il successo online. Ecco le strategie più efficaci per il 2024.</p>
        
        <h3>1. Contenuti di Qualità e E-A-T</h3>
        <p>Google premia sempre di più i contenuti che dimostrano Expertise, Authoritativeness e Trustworthiness (E-A-T).</p>
        
        <h3>2. Ottimizzazione per la Ricerca Vocale</h3>
        <p>Con l'aumento degli assistenti vocali, ottimizzare per le query vocali è diventato essenziale.</p>
        
        <h3>3. User Experience e Core Web Vitals</h3>
        <p>L'esperienza utente è un fattore di ranking sempre più importante. Velocità, interattività e stabilità visiva sono cruciali.</p>
        
        <h3>4. SEO Locale</h3>
        <p>Per le attività locali, una strategia SEO locale ben pianificata può fare la differenza nella visibilità online.</p>
      `,
      excerpt: "Le strategie SEO più efficaci per migliorare il posizionamento del tuo sito nei motori di ricerca.",
      status: "published",
      publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      isFeatured: false,
      categoryId: marketingCategory.id,
      authorId: adminUser.id,
      readingTime: 4
    });

    const blogPost3 = await storage.createBlogPost({
      title: "Come Scegliere la Giusta Agenzia Digitale",
      slug: "come-scegliere-agenzia-digitale",
      content: `
        <h2>Guida alla Scelta del Partner Digitale Perfetto</h2>
        <p>Scegliere l'agenzia digitale giusta può fare la differenza nel successo della tua presenza online. Ecco cosa considerare.</p>
        
        <h3>1. Portfolio e Case Studies</h3>
        <p>Esamina attentamente i lavori precedenti dell'agenzia. I risultati ottenuti per altri clienti sono un buon indicatore delle loro capacità.</p>
        
        <h3>2. Competenze Tecniche</h3>
        <p>Assicurati che l'agenzia abbia le competenze necessarie per i tuoi progetti: sviluppo web, SEO, social media marketing, etc.</p>
        
        <h3>3. Approccio e Comunicazione</h3>
        <p>Una buona agenzia deve sapere ascoltare le tue esigenze e comunicare in modo chiaro e trasparente.</p>
        
        <h3>4. Supporto Post-Lancio</h3>
        <p>Il lavoro non finisce con il lancio del progetto. Verifica che l'agenzia offra supporto e manutenzione continui.</p>
        
        <p>Investire tempo nella scelta dell'agenzia giusta ti farà risparmiare tempo e denaro nel lungo periodo.</p>
      `,
      excerpt: "Una guida completa per scegliere l'agenzia digitale perfetta per i tuoi progetti online.",
      status: "published",
      publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      isFeatured: true,
      categoryId: businessCategory.id,
      authorId: adminUser.id,
      readingTime: 6
    });

    console.log("✅ Blog posts created");

    // Associate tags with blog posts
    console.log("Associating tags with blog posts...");
    await db.insert(blogPostTags).values([
      { blogPostId: blogPost1.id, tagId: webDevTag.id },
      { blogPostId: blogPost1.id, tagId: aiTag.id },
      { blogPostId: blogPost2.id, tagId: seoTag.id },
      { blogPostId: blogPost3.id, tagId: webDevTag.id }
    ]);

    console.log("✅ Tags associated with blog posts");

    console.log("🎉 Database seeding completed successfully!");
    console.log("\n📋 Summary:");
    console.log("- 1 Admin user created");
    console.log("- 3 Categories created");
    console.log("- 3 Tags created");
    console.log("- 3 Services created");
    console.log("- 3 Pages created");
    console.log("- 3 Blog posts created");
    console.log("\n🔐 Admin credentials:");
    console.log("Username: admin");
    console.log("Email: admin@example.com");
    console.log("Password: admin123");

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

// Run the seed function
seedDatabase()
  .then(() => {
    console.log("✅ Seeding process completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seeding process failed:", error);
    process.exit(1);
  });