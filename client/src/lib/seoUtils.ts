/**
 * Utility functions for SEO optimization of images and heading structure
 * Handles automatic alt text generation and H1/H2/H3 hierarchy optimization
 */

export interface ImageSEOData {
  title: string;
  description?: string;
  category?: string;
  context?: 'hero' | 'featured' | 'content' | 'thumbnail' | 'logo' | 'testimonial' | 'product';
  author?: string;
  keywords?: string[];
}

export interface HeadingStructure {
  level: number;
  text: string;
  id?: string;
}

/**
 * Generates optimized alt text for images based on context and content
 */
export function generateOptimizedAltText(data: ImageSEOData): string {
  const { title, description, category, context, author, keywords } = data;
  
  // Truncate very long titles
  const cleanTitle = title.length > 50 ? `${title.substring(0, 47)}...` : title;
  
  switch (context) {
    case 'hero':
      return `Immagine hero per "${cleanTitle}"${category ? ` - ${category}` : ''}`;
    
    case 'featured':
      const categoryPrefix = category ? `${category}: ` : '';
      return `Immagine in evidenza - ${categoryPrefix}${cleanTitle}`;
    
    case 'content':
      if (description && description.length > 0) {
        return `Immagine contenuto: ${description.substring(0, 80)}${description.length > 80 ? '...' : ''}`;
      }
      return `Immagine relativa a "${cleanTitle}"`;
    
    case 'thumbnail':
      return `Anteprima di "${cleanTitle}"${category ? ` nella categoria ${category}` : ''}`;
    
    case 'logo':
      return `Logo di ${cleanTitle}`;
    
    case 'testimonial':
      return `Foto di ${cleanTitle}${author && author !== cleanTitle ? ` (${author})` : ''}`;
    
    case 'product':
      const keywordSuffix = keywords && keywords.length > 0 ? ` - ${keywords.slice(0, 2).join(', ')}` : '';
      return `Immagine prodotto: ${cleanTitle}${keywordSuffix}`;
    
    default:
      return cleanTitle;
  }
}

/**
 * Validates and optimizes heading structure for SEO
 * Ensures proper H1/H2/H3 hierarchy and only one H1 per page
 */
export class HeadingStructureManager {
  private headings: HeadingStructure[] = [];
  private hasH1 = false;

  /**
   * Adds a heading to the structure and returns the optimized level
   */
  addHeading(text: string, requestedLevel: number, id?: string): number {
    // Ensure we have only one H1 per page
    if (requestedLevel === 1) {
      if (this.hasH1) {
        // Demote to H2 if H1 already exists
        requestedLevel = 2;
      } else {
        this.hasH1 = true;
      }
    }

    // Ensure proper hierarchy - no skipping levels
    const optimizedLevel = this.getOptimizedLevel(requestedLevel);
    
    this.headings.push({
      level: optimizedLevel,
      text: text.substring(0, 70), // SEO best practice: keep headings under 70 chars
      id
    });

    return optimizedLevel;
  }

  /**
   * Gets the optimized heading level to maintain proper hierarchy
   */
  private getOptimizedLevel(requestedLevel: number): number {
    if (this.headings.length === 0) {
      // First heading should be H1
      return 1;
    }

    const lastHeading = this.headings[this.headings.length - 1];
    const maxAllowedLevel = lastHeading.level + 1;

    // Don't skip levels (e.g., H1 -> H3)
    if (requestedLevel > maxAllowedLevel) {
      return maxAllowedLevel;
    }

    return requestedLevel;
  }

  /**
   * Resets the heading structure (use when navigating to new page)
   */
  reset(): void {
    this.headings = [];
    this.hasH1 = false;
  }

  /**
   * Gets the current heading structure for debugging/analysis
   */
  getStructure(): HeadingStructure[] {
    return [...this.headings];
  }

  /**
   * Checks if the current structure is SEO-optimized
   */
  validateStructure(): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (!this.hasH1) {
      issues.push("Pagina manca di H1 principale");
    }

    // Check for proper hierarchy
    for (let i = 1; i < this.headings.length; i++) {
      const current = this.headings[i];
      const previous = this.headings[i - 1];
      
      if (current.level > previous.level + 1) {
        issues.push(`Salto di livello da H${previous.level} a H${current.level} - viola la gerarchia SEO`);
      }
    }

    // Check for long headings
    const longHeadings = this.headings.filter(h => h.text.length > 60);
    if (longHeadings.length > 0) {
      issues.push(`${longHeadings.length} titoli troppo lunghi per SEO (oltre 60 caratteri)`);
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }
}

/**
 * Global heading manager instance
 */
export const headingManager = new HeadingStructureManager();

/**
 * Hook for managing page heading structure
 */
export function useHeadingStructure() {
  const resetStructure = () => headingManager.reset();
  
  const addHeading = (text: string, requestedLevel: number, id?: string) => 
    headingManager.addHeading(text, requestedLevel, id);
  
  const validateStructure = () => headingManager.validateStructure();
  
  const getStructure = () => headingManager.getStructure();

  return {
    resetStructure,
    addHeading,
    validateStructure,
    getStructure
  };
}

/**
 * Extracts and optimizes images from content for better SEO
 */
export function optimizeContentImages(content: string, baseAltText: string): string {
  // Replace img tags without proper alt text
  return content.replace(
    /<img([^>]*?)(?:alt=["']([^"']*)["'])?([^>]*?)>/gi,
    (match, beforeAlt, existingAlt, afterAlt) => {
      // If alt text exists and is meaningful (more than 3 chars), keep it
      if (existingAlt && existingAlt.trim().length > 3) {
        return match;
      }

      // Generate better alt text
      const srcMatch = match.match(/src=["']([^"']*?)["']/i);
      const src = srcMatch ? srcMatch[1] : '';
      
      // Create contextual alt text
      let optimizedAlt = baseAltText;
      if (src.includes('logo')) {
        optimizedAlt = `Logo - ${baseAltText}`;
      } else if (src.includes('hero') || src.includes('banner')) {
        optimizedAlt = `Immagine principale - ${baseAltText}`;
      } else if (src.includes('thumb') || src.includes('preview')) {
        optimizedAlt = `Anteprima - ${baseAltText}`;
      }

      return `<img${beforeAlt} alt="${optimizedAlt}"${afterAlt}>`;
    }
  );
}

/**
 * Generates schema-compatible heading structure for rich snippets
 */
export function generateHeadingSchema(headings: HeadingStructure[]): object {
  if (headings.length === 0) return {};

  const h1 = headings.find(h => h.level === 1);
  const h2s = headings.filter(h => h.level === 2).map(h => h.text);

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": h1?.text || "",
    "alternativeHeadline": h2s.length > 0 ? h2s[0] : undefined,
    "articleSection": h2s.length > 1 ? h2s : undefined
  };
}