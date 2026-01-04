import { storage } from '../storage';

export interface PageSEOData {
  title: string;
  description: string;
  ogImage?: string;
  url: string;
  siteName: string;
  siteUrl: string;
  type: 'website' | 'article';
  publishedAt?: string;
  updatedAt?: string;
  author?: string;
  keywords?: string[];
  canonicalUrl?: string;
  noindex?: boolean;
}

/**
 * Recupera i dati SEO per una pagina basandosi sullo slug
 * Controlla in ordine: builder pages, landing pages, pages normali
 */
export async function getPageSEOData(slug: string, tenantId: number): Promise<PageSEOData | null> {
  try {
    // Normalizza lo slug
    const normalizedSlug = slug === '/' || slug === '' ? 'home' : slug.replace(/^\/+|\/+$/g, '');

    // Recupera le impostazioni SEO globali
    const seoSettings = await storage.getGlobalSeoSettings(tenantId);
    const baseUrl = seoSettings?.siteUrl || seoSettings?.canonicalDomain || process.env.BASE_URL || 'https://yoursite.com';
    const siteName = seoSettings?.siteName || 'Your Site Name';

    // 1. Prova con Builder Pages
    const builderPagesResult = await storage.getBuilderPages(tenantId, 1000, 0);
    const builderPage = builderPagesResult.pages.find(p => p.slug === normalizedSlug && p.isActive);
    
    if (builderPage) {
      return {
        title: builderPage.metaTitle || builderPage.title,
        description: builderPage.metaDescription || builderPage.description || '',
        ogImage: builderPage.ogImage || seoSettings?.defaultOgImage || undefined,
        url: `/${builderPage.slug}`,
        siteName,
        siteUrl: baseUrl,
        type: 'website',
        canonicalUrl: `${baseUrl}/${builderPage.slug}`,
        noindex: false
      };
    }

    // 2. Prova con Landing Pages
    const landingPagesResult = await storage.getLandingPages(tenantId, 1000, 0, false);
    const landingPage = landingPagesResult.landingPages.find(p => p.slug === normalizedSlug && p.isActive);
    
    if (landingPage) {
      return {
        title: landingPage.metaTitle || landingPage.title,
        description: landingPage.metaDescription || landingPage.description || '',
        ogImage: landingPage.ogImage || seoSettings?.defaultOgImage || undefined,
        url: `/${landingPage.slug}`,
        siteName,
        siteUrl: baseUrl,
        type: 'website',
        canonicalUrl: `${baseUrl}/${landingPage.slug}`,
        noindex: false
      };
    }

    // 3. Prova con Pages normali
    const pagesResult = await storage.getPages(tenantId, 1000, 0);
    const page = pagesResult.pages.find(p => p.slug === normalizedSlug && p.status === 'published');
    
    if (page) {
      return {
        title: page.metaTitle || page.title,
        description: page.metaDescription || '',
        ogImage: page.featuredImage || seoSettings?.defaultOgImage || undefined,
        url: `/${page.slug}`,
        siteName,
        siteUrl: baseUrl,
        type: 'website',
        publishedAt: page.publishedAt?.toISOString(),
        updatedAt: page.updatedAt?.toISOString(),
        canonicalUrl: `${baseUrl}/${page.slug}`,
        noindex: false
      };
    }

    // 4. Se è la homepage, usa i dati SEO globali
    if (normalizedSlug === 'home') {
      return {
        title: seoSettings?.defaultMetaTitle || seoSettings?.siteName || 'Home',
        description: seoSettings?.defaultMetaDescription || seoSettings?.siteDescription || '',
        ogImage: seoSettings?.defaultOgImage || undefined,
        url: '/',
        siteName,
        siteUrl: baseUrl,
        type: 'website',
        canonicalUrl: baseUrl,
        noindex: false
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching page SEO data:', error);
    return null;
  }
}

/**
 * Genera i meta tags HTML da iniettare nel <head>
 */
export function generateMetaTags(seoData: PageSEOData): string {
  const { title, description, ogImage, url, siteName, siteUrl, type, publishedAt, updatedAt, author, keywords, canonicalUrl, noindex } = seoData;

  let metaTags = '';

  // Title
  metaTags += `    <title>${escapeHtml(title)}</title>\n`;
  
  // Basic Meta Tags
  metaTags += `    <meta name="description" content="${escapeHtml(description)}" />\n`;
  
  if (keywords && keywords.length > 0) {
    metaTags += `    <meta name="keywords" content="${escapeHtml(keywords.join(', '))}" />\n`;
  }

  // Canonical URL
  if (canonicalUrl) {
    metaTags += `    <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />\n`;
  }

  // Robots
  if (noindex) {
    metaTags += `    <meta name="robots" content="noindex, nofollow" />\n`;
  } else {
    metaTags += `    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />\n`;
  }

  // Open Graph Tags
  metaTags += `    <meta property="og:type" content="${type}" />\n`;
  metaTags += `    <meta property="og:title" content="${escapeHtml(title)}" />\n`;
  metaTags += `    <meta property="og:description" content="${escapeHtml(description)}" />\n`;
  metaTags += `    <meta property="og:url" content="${escapeHtml(siteUrl)}${escapeHtml(url)}" />\n`;
  metaTags += `    <meta property="og:site_name" content="${escapeHtml(siteName)}" />\n`;
  
  if (ogImage) {
    metaTags += `    <meta property="og:image" content="${escapeHtml(ogImage)}" />\n`;
    metaTags += `    <meta property="og:image:width" content="1200" />\n`;
    metaTags += `    <meta property="og:image:height" content="630" />\n`;
  }

  if (publishedAt) {
    metaTags += `    <meta property="article:published_time" content="${publishedAt}" />\n`;
  }
  if (updatedAt) {
    metaTags += `    <meta property="article:modified_time" content="${updatedAt}" />\n`;
  }
  if (author) {
    metaTags += `    <meta property="article:author" content="${escapeHtml(author)}" />\n`;
  }

  // Twitter Card Tags
  metaTags += `    <meta name="twitter:card" content="summary_large_image" />\n`;
  metaTags += `    <meta name="twitter:title" content="${escapeHtml(title)}" />\n`;
  metaTags += `    <meta name="twitter:description" content="${escapeHtml(description)}" />\n`;
  
  if (ogImage) {
    metaTags += `    <meta name="twitter:image" content="${escapeHtml(ogImage)}" />\n`;
  }

  return metaTags;
}

/**
 * Genera il contenuto SEO iniziale da iniettare nel <body>
 * Include h1, descrizione e structured data JSON-LD
 */
export function generateSEOContent(seoData: PageSEOData): string {
  const { title, description, type, publishedAt, updatedAt, author, url, siteUrl, siteName } = seoData;

  let content = `    <!-- SEO Content for Crawlers -->\n`;
  content += `    <div id="seo-content" style="position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden;">\n`;
  content += `      <h1>${escapeHtml(title)}</h1>\n`;
  
  if (description) {
    content += `      <p>${escapeHtml(description)}</p>\n`;
  }

  content += `    </div>\n`;

  // JSON-LD Structured Data
  const structuredData: any = {
    "@context": "https://schema.org",
    "@type": type === 'article' ? 'Article' : 'WebPage',
    "headline": title,
    "description": description,
    "url": `${siteUrl}${url}`,
    "name": title
  };

  if (type === 'article' && publishedAt) {
    structuredData.datePublished = publishedAt;
    if (updatedAt) {
      structuredData.dateModified = updatedAt;
    }
    if (author) {
      structuredData.author = {
        "@type": "Person",
        "name": author
      };
    }
  }

  if (siteName) {
    structuredData.publisher = {
      "@type": "Organization",
      "name": siteName,
      "url": siteUrl
    };
  }

  content += `    <script type="application/ld+json">\n`;
  content += `${JSON.stringify(structuredData, null, 2)}\n`;
  content += `    </script>\n`;

  return content;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Inietta i meta tags e il contenuto SEO nell'HTML template
 */
export function injectSEO(html: string, seoData: PageSEOData): string {
  // Genera i meta tags e il contenuto SEO
  const metaTags = generateMetaTags(seoData);
  const seoContent = generateSEOContent(seoData);

  // Inietta i meta tags nel <head> dopo il charset
  html = html.replace(
    /(<meta charset="UTF-8" \/>)/i,
    `$1\n${metaTags}`
  );

  // Inietta il contenuto SEO all'inizio del <body>
  html = html.replace(
    /(<body>)/i,
    `$1\n${seoContent}`
  );

  return html;
}
