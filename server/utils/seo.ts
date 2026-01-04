
import { storage } from '../storage';

export interface SitemapEntry {
  url: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

export class SEOManager {

  static async generateSitemap(tenantId: number): Promise<string> {
    // Get SEO settings from database
    const seoSettings = await storage.getGlobalSeoSettings(tenantId);
    const baseUrl = seoSettings?.siteUrl || seoSettings?.canonicalDomain || process.env.BASE_URL || 'https://yoursite.com';
    const entries: SitemapEntry[] = [];

    // Rotte da escludere dal sitemap
    const excludedRoutes = ['admin', 'superadmin', 'login'];

    // Add homepage
    entries.push({
      url: baseUrl,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'daily',
      priority: 1.0
    });

    // Add pages
    const pagesResult = await storage.getPages(tenantId, 1000, 0);
    pagesResult.pages.forEach(page => {
      // Escludi pagine amministrative
      if (page.status === 'published' && !excludedRoutes.includes(page.slug)) {
        entries.push({
          url: `${baseUrl}/${page.slug}`,
          lastmod: page.updatedAt.toISOString().split('T')[0],
          changefreq: 'weekly',
          priority: 0.8
        });
      }
    });

    // Add blog posts
    const postsResult = await storage.getBlogPosts(tenantId, 1000, 0, 'published');
    postsResult.posts.forEach(post => {
      entries.push({
        url: `${baseUrl}/blog/${post.slug}`,
        lastmod: post.updatedAt.toISOString().split('T')[0],
        changefreq: 'monthly',
        priority: 0.6
      });
    });

    // Add landing pages
    const landingPagesResult = await storage.getLandingPages(tenantId, 1000, 0, false);
    landingPagesResult.landingPages.forEach(landing => {
      if (landing.isActive) {
        entries.push({
          url: `${baseUrl}/landing/${landing.slug}`,
          lastmod: landing.updatedAt.toISOString().split('T')[0],
          changefreq: 'weekly',
          priority: 0.9
        });
      }
    });

    // Add builder pages
    const builderPagesResult = await storage.getBuilderPages(tenantId, 1000, 0);
    builderPagesResult.pages.forEach(builderPage => {
      if (builderPage.isActive) {
        entries.push({
          url: `${baseUrl}/${builderPage.slug}`,
          lastmod: builderPage.updatedAt.toISOString().split('T')[0],
          changefreq: 'weekly',
          priority: 0.7
        });
      }
    });

    // Generate XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(entry => `
  <url>
    <loc>${entry.url}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`).join('')}
</urlset>`;

    return xml;
  }

  static async generateRobotsTxt(tenantId: number): Promise<string> {
    // Get SEO settings from database
    const seoSettings = await storage.getGlobalSeoSettings(tenantId);

    // Use custom robots.txt if provided
    if (seoSettings?.robotsTxtCustom && seoSettings.robotsTxtCustom.trim()) {
      return seoSettings.robotsTxtCustom;
    }

    // Otherwise generate default robots.txt
    const baseUrl = seoSettings?.siteUrl || seoSettings?.canonicalDomain || process.env.BASE_URL || 'https://yoursite.com';

    return `User-agent: *
Allow: /

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml

# Disallow admin and private areas
Disallow: /admin/
Disallow: /superadmin/
Disallow: /login
Disallow: /uploads/private/

# Crawl delay
Crawl-delay: 1`;
  }

  static async generateMetaTags(tenantId: number, data: {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    type?: string;
    siteName?: string;
    keywords?: string[];
    author?: string;
    publishedAt?: string;
    updatedAt?: string;
    locale?: string;
    alternateLocales?: { locale: string; url: string }[];
    articleSection?: string;
    articleTags?: string[];
    noindex?: boolean;
  }): Promise<string> {
    // Get SEO settings from database for defaults
    const seoSettings = await storage.getGlobalSeoSettings(tenantId);

    const {
      title = seoSettings?.defaultMetaTitle || 'Default Title',
      description = seoSettings?.defaultMetaDescription || 'Default description',
      image = seoSettings?.defaultOgImage || '/default-og-image.jpg',
      url = '/',
      type = 'website',
      siteName = seoSettings?.siteName || 'Your Site Name',
      keywords = [],
      author,
      publishedAt,
      updatedAt,
      locale = 'it_IT',
      alternateLocales = [],
      articleSection,
      articleTags = [],
      noindex = false
    } = data;

    // Build canonical URL with proper domain
    const baseUrl = seoSettings?.siteUrl || seoSettings?.canonicalDomain;
    const canonicalUrl = baseUrl ? 
      `${baseUrl.replace(/\/$/, '')}${url.startsWith('/') ? url : `/${url}`}` : 
      url;

    let metaTags = `
    <!-- Basic Meta Tags -->
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <meta name="description" content="${description}">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="${type}">
    <meta property="og:url" content="${canonicalUrl}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${image}">
    <meta property="og:site_name" content="${siteName}">

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="${canonicalUrl}">
    <meta property="twitter:title" content="${title}">
    <meta property="twitter:description" content="${description}">
    <meta property="twitter:image" content="${image}">`;

    // Add Twitter handle if available
    if (seoSettings?.twitterHandle) {
      metaTags += `
    <meta name="twitter:site" content="${seoSettings.twitterHandle}">`;
    }

    // Add Facebook App ID if available
    if (seoSettings?.facebookAppId) {
      metaTags += `
    <meta property="fb:app_id" content="${seoSettings.facebookAppId}">`;
    }

    metaTags += `

    <!-- Additional SEO -->
    <link rel="canonical" href="${canonicalUrl}">
    <meta name="robots" content="${noindex ? 'noindex,nofollow' : 'index,follow'}">
    <meta name="googlebot" content="${noindex ? 'noindex,nofollow' : 'index,follow'}">
    <meta name="language" content="${locale.split('_')[0]}">
    <meta name="geo.region" content="IT">
    <meta name="geo.country" content="IT">${keywords.length > 0 ? `
    <meta name="keywords" content="${keywords.join(', ')}">` : ''}${author ? `
    <meta name="author" content="${author}">` : ''}${publishedAt ? `
    <meta property="article:published_time" content="${publishedAt}">` : ''}${updatedAt ? `
    <meta property="article:modified_time" content="${updatedAt}">` : ''}${articleSection ? `
    <meta property="article:section" content="${articleSection}">` : ''}${articleTags.map(tag => `
    <meta property="article:tag" content="${tag}">`).join('')}${alternateLocales.map(alt => `
    <link rel="alternate" hreflang="${alt.locale}" href="${alt.url}">`).join('')}`;

    // Add Search Console verification if available
    if (seoSettings?.googleSearchConsoleCode) {
      metaTags += `
    ${seoSettings.googleSearchConsoleCode}`;
    }

    // Add Bing verification if available
    if (seoSettings?.bingWebmasterCode) {
      metaTags += `
    <meta name="msvalidate.01" content="${seoSettings.bingWebmasterCode}">`;
    }

    // Custom head code removed - causes syntax errors when injected server-side
    // It's already handled by FacebookPixelInitializer and AnalyticsInitializer components client-side

    metaTags += `
    `;

    return metaTags;
  }

  static async generateStructuredData(tenantId: number, type: 'article' | 'webpage' | 'organization', data: any): Promise<string> {
    // Get SEO settings from database for organization info
    const seoSettings = await storage.getGlobalSeoSettings(tenantId);

    const baseStructure = {
      "@context": "https://schema.org"
    };

    let schema;

    switch (type) {
      case 'article':
        schema = {
          ...baseStructure,
          "@type": "BlogPosting",
          "headline": data.title,
          "description": data.description,
          "image": data.image,
          "author": {
            "@type": "Person",
            "name": data.author
          },
          "publisher": {
            "@type": "Organization",
            "name": seoSettings?.organizationName || data.siteName || seoSettings?.siteName,
            "logo": data.logo,
            "url": seoSettings?.siteUrl || seoSettings?.canonicalDomain
          },
          "datePublished": data.publishedAt,
          "dateModified": data.updatedAt,
          "url": data.url
        };
        break;

      case 'webpage':
        schema = {
          ...baseStructure,
          "@type": "WebPage",
          "name": data.title,
          "description": data.description,
          "url": data.url,
          "publisher": {
            "@type": "Organization",
            "name": seoSettings?.organizationName || seoSettings?.siteName,
            "url": seoSettings?.siteUrl || seoSettings?.canonicalDomain
          }
        };
        break;

      case 'organization':
        const orgSchema: any = {
          ...baseStructure,
          "@type": seoSettings?.organizationType || "Organization",
          "name": seoSettings?.organizationName || data.name,
          "url": seoSettings?.siteUrl || seoSettings?.canonicalDomain || data.url,
          "logo": data.logo,
          "description": seoSettings?.siteDescription || data.description
        };

        // Add address if available
        if (seoSettings?.address) {
          orgSchema.address = {
            "@type": "PostalAddress",
            "streetAddress": seoSettings.address.streetAddress,
            "addressLocality": seoSettings.address.addressLocality,
            "addressRegion": seoSettings.address.addressRegion,
            "postalCode": seoSettings.address.postalCode,
            "addressCountry": seoSettings.address.addressCountry
          };
        }

        // Add contact point if phone is provided
        if (data.phone) {
          orgSchema.contactPoint = {
            "@type": "ContactPoint",
            "telephone": data.phone,
            "contactType": "customer service"
          };
        }

        schema = orgSchema;
        break;

      default:
        schema = baseStructure;
    }

    return `<script type="application/ld+json">${JSON.stringify(schema, null, 2)}</script>`;
  }

  static calculateReadingTime(content: string): number {
    const wordsPerMinute = 200;
    const wordCount = content.trim().split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }

  static extractKeywords(content: string, limit: number = 10): string[] {
    // Simple keyword extraction (in production, use a proper NLP library)
    const words = content
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);

    const frequency: { [key: string]: number } = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([word]) => word);
  }

  static async generateBreadcrumbSchema(tenantId: number, breadcrumbs: { name: string; url: string }[]): Promise<string> {
    const seoSettings = await storage.getGlobalSeoSettings(tenantId);
    const baseUrl = seoSettings?.canonicalDomain || seoSettings?.siteUrl || '';

    const schema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": breadcrumbs.map((crumb, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": crumb.name,
        "item": crumb.url.startsWith('http') ? crumb.url : `${baseUrl}${crumb.url}`
      }))
    };

    return `<script type="application/ld+json">${JSON.stringify(schema, null, 2)}</script>`;
  }

  static async generateLocalBusinessSchema(tenantId: number, business: {
    name: string;
    description?: string;
    image?: string;
    phone?: string;
    email?: string;
    address?: {
      streetAddress: string;
      addressLocality: string;
      addressRegion: string;
      postalCode: string;
      addressCountry: string;
    };
    openingHours?: string[];
    priceRange?: string;
    services?: string[];
  }): Promise<string> {
    const seoSettings = await storage.getGlobalSeoSettings(tenantId);

    const schema: any = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": business.name,
      "url": seoSettings?.siteUrl || seoSettings?.canonicalDomain,
      "description": business.description || seoSettings?.siteDescription,
      "image": business.image
    };

    if (business.phone) {
      schema.telephone = business.phone;
    }

    if (business.email) {
      schema.email = business.email;
    }

    if (business.address) {
      schema.address = {
        "@type": "PostalAddress",
        ...business.address
      };
    }

    if (business.openingHours) {
      schema.openingHours = business.openingHours;
    }

    if (business.priceRange) {
      schema.priceRange = business.priceRange;
    }

    if (business.services && business.services.length > 0) {
      schema.hasOfferCatalog = {
        "@type": "OfferCatalog",
        "name": "Servizi",
        "itemListElement": business.services.map(service => ({
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": service
          }
        }))
      };
    }

    return `<script type="application/ld+json">${JSON.stringify(schema, null, 2)}</script>`;
  }

  static generateFAQSchema(faqs: { question: string; answer: string }[]): string {
    const schema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map(faq => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
    };

    return `<script type="application/ld+json">${JSON.stringify(schema, null, 2)}</script>`;
  }

  static generateProductSchema(product: {
    name: string;
    description: string;
    image?: string;
    brand?: string;
    price?: number;
    currency?: string;
    availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
    rating?: {
      value: number;
      count: number;
    };
    reviews?: Array<{
      author: string;
      rating: number;
      text: string;
      datePublished: string;
    }>;
  }): string {
    const schema: any = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": product.name,
      "description": product.description,
      "image": product.image
    };

    if (product.brand) {
      schema.brand = {
        "@type": "Brand",
        "name": product.brand
      };
    }

    if (product.price !== undefined) {
      schema.offers = {
        "@type": "Offer",
        "price": product.price,
        "priceCurrency": product.currency || "EUR",
        "availability": `https://schema.org/${product.availability || 'InStock'}`
      };
    }

    if (product.rating) {
      schema.aggregateRating = {
        "@type": "AggregateRating",
        "ratingValue": product.rating.value,
        "reviewCount": product.rating.count
      };
    }

    if (product.reviews && product.reviews.length > 0) {
      schema.review = product.reviews.map(review => ({
        "@type": "Review",
        "author": {
          "@type": "Person",
          "name": review.author
        },
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": review.rating
        },
        "reviewBody": review.text,
        "datePublished": review.datePublished
      }));
    }

    return `<script type="application/ld+json">${JSON.stringify(schema, null, 2)}</script>`;
  }

  static generateEventSchema(event: {
    name: string;
    description: string;
    startDate: string;
    endDate?: string;
    location: {
      name: string;
      address?: string;
    };
    organizer?: {
      name: string;
      url?: string;
    };
    image?: string;
    price?: number;
    currency?: string;
    availability?: string;
  }): string {
    const schema: any = {
      "@context": "https://schema.org",
      "@type": "Event",
      "name": event.name,
      "description": event.description,
      "startDate": event.startDate,
      "location": {
        "@type": "Place",
        "name": event.location.name,
        ...(event.location.address && {
          "address": event.location.address
        })
      }
    };

    if (event.endDate) {
      schema.endDate = event.endDate;
    }

    if (event.organizer) {
      schema.organizer = {
        "@type": "Organization",
        "name": event.organizer.name,
        ...(event.organizer.url && { "url": event.organizer.url })
      };
    }

    if (event.image) {
      schema.image = event.image;
    }

    if (event.price !== undefined) {
      schema.offers = {
        "@type": "Offer",
        "price": event.price,
        "priceCurrency": event.currency || "EUR",
        "availability": event.availability || "https://schema.org/InStock"
      };
    }

    return `<script type="application/ld+json">${JSON.stringify(schema, null, 2)}</script>`;
  }

  static generateVideoSchema(video: {
    name: string;
    description: string;
    thumbnailUrl: string;
    contentUrl?: string;
    embedUrl?: string;
    duration?: string;
    uploadDate?: string;
    viewCount?: number;
  }): string {
    const schema: any = {
      "@context": "https://schema.org",
      "@type": "VideoObject",
      "name": video.name,
      "description": video.description,
      "thumbnailUrl": video.thumbnailUrl
    };

    if (video.contentUrl) {
      schema.contentUrl = video.contentUrl;
    }

    if (video.embedUrl) {
      schema.embedUrl = video.embedUrl;
    }

    if (video.duration) {
      schema.duration = video.duration;
    }

    if (video.uploadDate) {
      schema.uploadDate = video.uploadDate;
    }

    if (video.viewCount) {
      schema.interactionStatistic = {
        "@type": "InteractionCounter",
        "interactionType": "https://schema.org/WatchAction",
        "userInteractionCount": video.viewCount
      };
    }

    return `<script type="application/ld+json">${JSON.stringify(schema, null, 2)}</script>`;
  }

  // Advanced SEO analysis methods
  static analyzeContentSEO(content: string, targetKeywords: string[] = []): {
    readabilityScore: number;
    keywordDensity: { [keyword: string]: number };
    recommendations: string[];
  } {
    const words = content.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
    const totalWords = words.length;

    // Simple readability score (Flesch approximation)
    const sentences = content.split(/[.!?]+/).length;
    const avgWordsPerSentence = totalWords / sentences;
    const readabilityScore = Math.max(0, Math.min(100, 206.835 - (1.015 * avgWordsPerSentence)));

    // Keyword density analysis
    const keywordDensity: { [keyword: string]: number } = {};
    targetKeywords.forEach(keyword => {
      const keywordCount = words.filter(word => word.includes(keyword.toLowerCase())).length;
      keywordDensity[keyword] = (keywordCount / totalWords) * 100;
    });

    // SEO recommendations
    const recommendations: string[] = [];

    if (totalWords < 300) {
      recommendations.push("Contenuto troppo breve. Consigliamo almeno 300 parole per un buon posizionamento SEO.");
    }

    if (readabilityScore < 50) {
      recommendations.push("Il contenuto potrebbe essere difficile da leggere. Usa frasi più corte e paragrafi più brevi.");
    }

    targetKeywords.forEach(keyword => {
      const density = keywordDensity[keyword];
      if (density < 0.5) {
        recommendations.push(`La parola chiave "${keyword}" è presente troppo poco (${density.toFixed(1)}%). Aumenta la frequenza.`);
      } else if (density > 3) {
        recommendations.push(`La parola chiave "${keyword}" è troppo presente (${density.toFixed(1)}%). Rischio di keyword stuffing.`);
      }
    });

    return {
      readabilityScore: Math.round(readabilityScore),
      keywordDensity,
      recommendations
    };
  }
}
