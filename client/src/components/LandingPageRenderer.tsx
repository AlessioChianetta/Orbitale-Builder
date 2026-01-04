import React from 'react';
import { Helmet } from 'react-helmet';

interface LandingPageProps {
  landingPage: {
    id: number;
    title: string;
    slug: string;
    description: string;
    sections: any;
    metaTitle: string;
    metaDescription: string;
    ogImage: string | null;
    isActive: boolean;
  };
}

export function LandingPageRenderer({ landingPage }: LandingPageProps) {
  const { title, metaTitle, metaDescription, ogImage, sections } = landingPage;

  return (
    <>
      <Helmet>
        <title>{metaTitle || title}</title>
        <meta name="description" content={metaDescription || ''} />
        {ogImage && <meta property="og:image" content={ogImage} />}
        <meta property="og:title" content={metaTitle || title} />
        <meta property="og:description" content={metaDescription || ''} />
      </Helmet>

      <div className="min-h-screen" data-testid={`landing-page-${landingPage.slug}`}>
        {/* Header Section */}
        {sections?.header?.enabled && (
          <SectionRenderer section={sections.header} />
        )}

        {/* Hero Section */}
        {sections?.hero?.enabled && (
          <SectionRenderer section={sections.hero} />
        )}

        {/* Problems Section */}
        {sections?.problems?.enabled && (
          <SectionRenderer section={sections.problems} />
        )}

        {/* Solution Section */}
        {sections?.solution?.enabled && (
          <SectionRenderer section={sections.solution} />
        )}

        {/* Value Stack Section */}
        {sections?.valueStack?.enabled && (
          <SectionRenderer section={sections.valueStack} />
        )}

        {/* Social Proof Section */}
        {sections?.socialProof?.enabled && (
          <SectionRenderer section={sections.socialProof} />
        )}

        {/* Pricing Section */}
        {sections?.pricing?.enabled && (
          <SectionRenderer section={sections.pricing} />
        )}

        {/* Guarantee Section */}
        {sections?.guarantee?.enabled && (
          <SectionRenderer section={sections.guarantee} />
        )}

        {/* Filter Section */}
        {sections?.filter?.enabled && (
          <SectionRenderer section={sections.filter} />
        )}

        {/* Fork Section */}
        {sections?.fork?.enabled && (
          <SectionRenderer section={sections.fork} />
        )}
      </div>
    </>
  );
}

function SectionRenderer({ section }: { section: any }) {
  if (!section || !section.enabled) return null;

  const { sectionName, elements } = section;

  return (
    <section className="py-12 lg:py-20" data-testid={`section-${section.sectionId}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section content based on elements */}
        <div className="text-center">
          {/* For now, render a basic structure - this can be enhanced later */}
          <h2 className="text-3xl font-bold mb-6">{sectionName}</h2>
          
          {/* Render elements if they exist */}
          {elements && (
            <div className="space-y-6">
              {elements.headline && (
                <h1 className="text-4xl lg:text-6xl font-bold">{elements.headline}</h1>
              )}
              {elements.subHeadline && (
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto">{elements.subHeadline}</p>
              )}
              {elements.description && (
                <p className="text-lg text-muted-foreground max-w-4xl mx-auto">{elements.description}</p>
              )}
              {elements.ctaText && (
                <div className="mt-8">
                  <button 
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
                    data-testid="button-cta"
                  >
                    {elements.ctaText}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}