
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';

interface SEOData {
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterCard?: string;
  robots?: string;
  schemaMarkup?: any;
}

interface SEOManagerProps {
  entityType: 'page' | 'blog_post';
  entityId: number;
  initialData?: SEOData;
  onSave: (seoData: SEOData) => void;
}

export function SEOManager({ entityType, entityId, initialData, onSave }: SEOManagerProps) {
  const [seoData, setSeoData] = useState<SEOData>(initialData || {});
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const updateField = (field: keyof SEOData, value: string) => {
    setSeoData(prev => ({ ...prev, [field]: value }));
  };

  const analyzeContent = async () => {
    setIsAnalyzing(true);
    // Simulate SEO analysis
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 2000);
  };

  const generateSchemaMarkup = () => {
    const schema = entityType === 'blog_post' ? {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": seoData.metaTitle,
      "description": seoData.metaDescription,
      "image": seoData.ogImage,
      "author": {
        "@type": "Person",
        "name": "Author Name"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Company Name"
      }
    } : {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": seoData.metaTitle,
      "description": seoData.metaDescription,
      "url": seoData.canonicalUrl
    };

    setSeoData(prev => ({ ...prev, schemaMarkup: schema }));
  };

  const getSEOScore = () => {
    let score = 0;
    const checks = [
      { condition: seoData.metaTitle && seoData.metaTitle.length >= 30 && seoData.metaTitle.length <= 60, points: 20 },
      { condition: seoData.metaDescription && seoData.metaDescription.length >= 120 && seoData.metaDescription.length <= 160, points: 20 },
      { condition: seoData.ogTitle && seoData.ogTitle.length > 0, points: 15 },
      { condition: seoData.ogDescription && seoData.ogDescription.length > 0, points: 15 },
      { condition: seoData.ogImage && seoData.ogImage.length > 0, points: 15 },
      { condition: seoData.canonicalUrl && seoData.canonicalUrl.length > 0, points: 15 }
    ];

    checks.forEach(check => {
      if (check.condition) score += check.points;
    });

    return score;
  };

  const score = getSEOScore();

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>SEO Manager</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={score >= 80 ? 'default' : score >= 60 ? 'secondary' : 'destructive'}>
              SEO Score: {score}/100
            </Badge>
            <Button 
              onClick={analyzeContent} 
              disabled={isAnalyzing}
              size="sm"
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic SEO</TabsTrigger>
            <TabsTrigger value="social">Social Media</TabsTrigger>
            <TabsTrigger value="technical">Technical</TabsTrigger>
            <TabsTrigger value="schema">Schema</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div>
              <Label htmlFor="metaTitle">Meta Title</Label>
              <Input
                id="metaTitle"
                value={seoData.metaTitle || ''}
                onChange={(e) => updateField('metaTitle', e.target.value)}
                placeholder="Page title for search engines (30-60 characters)"
              />
              <div className="text-sm text-gray-500 mt-1">
                {seoData.metaTitle?.length || 0}/60 characters
              </div>
            </div>

            <div>
              <Label htmlFor="metaDescription">Meta Description</Label>
              <Textarea
                id="metaDescription"
                value={seoData.metaDescription || ''}
                onChange={(e) => updateField('metaDescription', e.target.value)}
                placeholder="Brief description for search results (120-160 characters)"
                rows={3}
              />
              <div className="text-sm text-gray-500 mt-1">
                {seoData.metaDescription?.length || 0}/160 characters
              </div>
            </div>

            <div>
              <Label htmlFor="canonicalUrl">Canonical URL</Label>
              <Input
                id="canonicalUrl"
                value={seoData.canonicalUrl || ''}
                onChange={(e) => updateField('canonicalUrl', e.target.value)}
                placeholder="https://example.com/page-url"
              />
            </div>

            <div>
              <Label htmlFor="robots">Robots Meta</Label>
              <Input
                id="robots"
                value={seoData.robots || 'index,follow'}
                onChange={(e) => updateField('robots', e.target.value)}
                placeholder="index,follow"
              />
            </div>
          </TabsContent>

          <TabsContent value="social" className="space-y-4">
            <div>
              <Label htmlFor="ogTitle">Open Graph Title</Label>
              <Input
                id="ogTitle"
                value={seoData.ogTitle || ''}
                onChange={(e) => updateField('ogTitle', e.target.value)}
                placeholder="Title for social media sharing"
              />
            </div>

            <div>
              <Label htmlFor="ogDescription">Open Graph Description</Label>
              <Textarea
                id="ogDescription"
                value={seoData.ogDescription || ''}
                onChange={(e) => updateField('ogDescription', e.target.value)}
                placeholder="Description for social media sharing"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="ogImage">Open Graph Image</Label>
              <Input
                id="ogImage"
                value={seoData.ogImage || ''}
                onChange={(e) => updateField('ogImage', e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div>
              <Label htmlFor="twitterCard">Twitter Card Type</Label>
              <Input
                id="twitterCard"
                value={seoData.twitterCard || 'summary'}
                onChange={(e) => updateField('twitterCard', e.target.value)}
                placeholder="summary, summary_large_image"
              />
            </div>
          </TabsContent>

          <TabsContent value="technical" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Performance Tips</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-sm">• Use descriptive URLs</div>
                  <div className="text-sm">• Optimize image alt tags</div>
                  <div className="text-sm">• Include internal links</div>
                  <div className="text-sm">• Use header tags hierarchy</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Content Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Word Count:</span>
                    <span>---</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Reading Time:</span>
                    <span>--- min</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Keywords Density:</span>
                    <span>---%</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="schema" className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Schema Markup (JSON-LD)</Label>
              <Button onClick={generateSchemaMarkup} size="sm">
                Generate Schema
              </Button>
            </div>
            <Textarea
              value={JSON.stringify(seoData.schemaMarkup, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  updateField('schemaMarkup', parsed);
                } catch {}
              }}
              rows={10}
              className="font-mono text-sm"
              placeholder="Schema markup will be generated automatically"
            />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end mt-6">
          <Button onClick={() => onSave(seoData)}>
            Save SEO Data
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
