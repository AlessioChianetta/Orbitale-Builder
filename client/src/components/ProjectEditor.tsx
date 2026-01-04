import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Skeleton } from './ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Save, Send, X, Plus, Upload, Calendar, Briefcase, Code, TrendingUp, Lightbulb, Quote, FileText } from 'lucide-react';
import { Card, CardContent } from './ui/card';

const CMSEditor = lazy(() => import('./CMSEditor').then(module => ({ default: module.CMSEditor })));

function CMSEditorSkeleton() {
  return (
    <div className="bg-white prose prose-lg max-w-none border rounded-md p-4 min-h-[600px] space-y-4">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-48 w-full mt-6" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
    </div>
  );
}

interface ProjectEditorProps { 
  initialProject?: any; 
  onSave: (projectData: any) => void; 
  onPublish: (projectData: any) => void; 
  onClose: () => void; 
}

export function ProjectEditor({ initialProject, onSave, onPublish, onClose }: ProjectEditorProps) {
  const [formData, setFormData] = useState({ 
    id: null, 
    title: '', 
    slug: '', 
    shortDescription: '', 
    description: '',
    challenge: '',
    solution: '',
    clientName: '', 
    projectType: 'project',
    category: 'development',
    featuredImage: '', 
    images: [] as string[],
    projectUrl: '',
    caseStudyUrl: '',
    duration: '',
    startDate: '',
    endDate: '',
    completionDate: '',
    status: 'published', 
    isFeatured: false,
    metaTitle: '', 
    metaDescription: '',
    technologies: [] as string[],
    results: [] as {metric: string, value: string}[],
    testimonial: { text: '', author: '', role: '', company: '' },
  });
  
  const [fullDescription, setFullDescription] = useState({});
  const [editorKey, setEditorKey] = useState(Date.now());
  const [newTechnology, setNewTechnology] = useState('');
  const [newResult, setNewResult] = useState({ metric: '', value: '' });
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isTitleValid = formData.title.trim().length >= 3;
  const isDescriptionValid = formData.description.trim().length >= 10;

  const projectTemplates = [
    {
      name: "Case Study Completo",
      data: {
        blocks: [
          { type: "header", data: { text: "Panoramica del Progetto", level: 2 } },
          { type: "paragraph", data: { text: "Descrivi brevemente il contesto e gli obiettivi del progetto..." } },
          { type: "header", data: { text: "La Sfida", level: 2 } },
          { type: "paragraph", data: { text: "Quali erano le principali sfide o problemi da affrontare?" } },
          { type: "header", data: { text: "La Soluzione", level: 2 } },
          { type: "paragraph", data: { text: "Come avete risolto il problema? Quali tecnologie/metodologie avete utilizzato?" } },
          { type: "header", data: { text: "Risultati", level: 2 } },
          { type: "list", data: { style: "unordered", items: ["Risultato 1", "Risultato 2", "Risultato 3"] } },
          { type: "header", data: { text: "Tecnologie Utilizzate", level: 2 } },
          { type: "paragraph", data: { text: "Stack tecnologico e strumenti implementati..." } }
        ]
      }
    },
    {
      name: "Portfolio Project",
      data: {
        blocks: [
          { type: "header", data: { text: "Il Progetto", level: 2 } },
          { type: "paragraph", data: { text: "Descrizione del progetto e del cliente..." } },
          { type: "header", data: { text: "Obiettivi", level: 2 } },
          { type: "list", data: { style: "unordered", items: ["Obiettivo 1", "Obiettivo 2", "Obiettivo 3"] } },
          { type: "header", data: { text: "Implementazione", level: 2 } },
          { type: "paragraph", data: { text: "Descrivi il processo di sviluppo e implementazione..." } },
          { type: "header", data: { text: "Risultati Ottenuti", level: 2 } },
          { type: "paragraph", data: { text: "Metriche e feedback del cliente..." } }
        ]
      }
    },
    {
      name: "Partnership Showcase",
      data: {
        blocks: [
          { type: "header", data: { text: "Partnership", level: 2 } },
          { type: "paragraph", data: { text: "Descrizione della collaborazione e degli obiettivi comuni..." } },
          { type: "header", data: { text: "Valore Creato", level: 2 } },
          { type: "paragraph", data: { text: "Quali benefici ha portato questa partnership?" } },
          { type: "header", data: { text: "Timeline", level: 2 } },
          { type: "paragraph", data: { text: "Fasi principali della collaborazione..." } },
          { type: "quote", data: { text: "Testimonianza del partner...", caption: "Nome Partner, Ruolo" } }
        ]
      }
    }
  ];

  const applyTemplate = (templateData: any) => {
    setFullDescription(templateData);
    setEditorKey(Date.now());
  };

  const handleInputChange = (field: string, value: any) => setFormData(p => ({ ...p, [field]: value }));
  
  const handleSlugChange = useCallback((newTitle: string) => {
    const slug = newTitle.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').trim();
    handleInputChange('slug', slug);
  }, []);

  useEffect(() => {
    if (initialProject) {
      const initialFormData = {
        ...initialProject,
        metaTitle: initialProject.metaTitle || '',
        metaDescription: initialProject.metaDescription || '',
        technologies: initialProject.technologies || [],
        results: initialProject.results || [],
        startDate: initialProject.startDate ? new Date(initialProject.startDate).toISOString().split('T')[0] : '',
        endDate: initialProject.endDate ? new Date(initialProject.endDate).toISOString().split('T')[0] : '',
        completionDate: initialProject.completionDate ? new Date(initialProject.completionDate).toISOString().split('T')[0] : '',
      };
      setFormData(initialFormData);

      if (initialProject.fullDescription) { 
        try {
          const parsedContent = typeof initialProject.fullDescription === 'string' 
            ? JSON.parse(initialProject.fullDescription) 
            : initialProject.fullDescription;
          setFullDescription(parsedContent);
          setEditorKey(Date.now());
        } catch (e) {
          console.error('Error parsing fullDescription:', e);
        }
      }
    }
  }, [initialProject]);

  const handleSaveAll = (isPublishing = false) => {
    if (!isTitleValid) { 
      alert("Il titolo è obbligatorio per salvare o pubblicare."); 
      return; 
    }
    if (!isDescriptionValid) { 
      alert("La descrizione è obbligatoria (minimo 10 caratteri)."); 
      return; 
    }
    
    const finalData: any = { ...formData };
    finalData.fullDescription = JSON.stringify(fullDescription);
    finalData.status = isPublishing ? 'published' : 'draft';
    
    // Keep dates as strings or empty strings - backend will handle conversion
    // Empty strings will be converted to null by backend
    
    if (isPublishing) {
      onPublish(finalData);
    } else {
      onSave(finalData);
    }
  };

  const handleContentSave = (newContent: any) => {
    setFullDescription(newContent);
  };

  const handleImageUpload = (file: File) => {
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target?.result as string);
      reader.readAsDataURL(file);
    });
  };

  const onFileDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); 
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const base64Url = await handleImageUpload(file);
      handleInputChange('featuredImage', base64Url);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64Url = await handleImageUpload(file);
      handleInputChange('featuredImage', base64Url);
    }
  };

  const addTechnology = () => {
    if (newTechnology.trim()) {
      handleInputChange('technologies', [...formData.technologies, newTechnology.trim()]);
      setNewTechnology('');
    }
  };

  const removeTechnology = (index: number) => {
    handleInputChange('technologies', formData.technologies.filter((_, i) => i !== index));
  };

  const addResult = () => {
    if (newResult.metric.trim() && newResult.value.trim()) {
      handleInputChange('results', [...formData.results, newResult]);
      setNewResult({ metric: '', value: '' });
    }
  };

  const removeResult = (index: number) => {
    handleInputChange('results', formData.results.filter((_, i) => i !== index));
  };

  const getCategoryIcon = () => {
    switch (formData.category) {
      case 'development': return <Code className="w-4 h-4" />;
      case 'marketing': return <TrendingUp className="w-4 h-4" />;
      case 'consulting': return <Lightbulb className="w-4 h-4" />;
      default: return <Briefcase className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex h-full bg-muted/30">
      {/* Left Panel - Form */}
      <div className="w-2/5 border-r bg-background overflow-y-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {initialProject ? 'Modifica Progetto' : 'Nuovo Progetto'}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <Accordion type="multiple" defaultValue={["basic", "content", "media"]} className="space-y-4">
          {/* Basic Info */}
          <AccordionItem value="basic" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-primary" />
                <span className="font-semibold">Informazioni Base</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div>
                <Label htmlFor="title">Titolo Progetto *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => {
                    handleInputChange('title', e.target.value);
                    handleSlugChange(e.target.value);
                  }}
                  placeholder="Es: Ecommerce per BigClient"
                  className={!isTitleValid && formData.title ? 'border-red-500' : ''}
                />
                {!isTitleValid && formData.title && (
                  <p className="text-xs text-red-500 mt-1">Minimo 3 caratteri</p>
                )}
              </div>

              <div>
                <Label htmlFor="slug">Slug URL</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => handleInputChange('slug', e.target.value)}
                  placeholder="ecommerce-bigclient"
                />
              </div>

              <div>
                <Label htmlFor="description">Descrizione *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Descrizione completa del progetto (campo obbligatorio)"
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="shortDescription">Breve Descrizione</Label>
                <Textarea
                  id="shortDescription"
                  value={formData.shortDescription}
                  onChange={(e) => handleInputChange('shortDescription', e.target.value)}
                  placeholder="Una breve descrizione del progetto (max 500 caratteri)"
                  rows={3}
                  maxLength={500}
                />
              </div>

              <div>
                <Label htmlFor="clientName">Nome Cliente</Label>
                <Input
                  id="clientName"
                  value={formData.clientName}
                  onChange={(e) => handleInputChange('clientName', e.target.value)}
                  placeholder="Es: Orbitale"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="projectType">Tipo</Label>
                  <Select value={formData.projectType} onValueChange={(v) => handleInputChange('projectType', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="project">Progetto</SelectItem>
                      <SelectItem value="partnership">Partnership</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <Select value={formData.category} onValueChange={(v) => handleInputChange('category', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="development">Sviluppo</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="consulting">Consulenza</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between py-2">
                <Label htmlFor="isFeatured">In Evidenza</Label>
                <Switch
                  id="isFeatured"
                  checked={formData.isFeatured}
                  onCheckedChange={(checked) => handleInputChange('isFeatured', checked)}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Content Details */}
          <AccordionItem value="content" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                {getCategoryIcon()}
                <span className="font-semibold">Dettagli Progetto</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div>
                <Label htmlFor="challenge">Sfida / Problema</Label>
                <Textarea
                  id="challenge"
                  value={formData.challenge ?? ''}
                  onChange={(e) => handleInputChange('challenge', e.target.value)}
                  placeholder="Quale problema o sfida affrontava il cliente?"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="solution">Soluzione Implementata</Label>
                <Textarea
                  id="solution"
                  value={formData.solution ?? ''}
                  onChange={(e) => handleInputChange('solution', e.target.value)}
                  placeholder="Come avete risolto il problema?"
                  rows={3}
                />
              </div>

              <div>
                <Label>Tecnologie Utilizzate</Label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={newTechnology}
                      onChange={(e) => setNewTechnology(e.target.value)}
                      placeholder="Es: React, Node.js, PostgreSQL"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTechnology())}
                    />
                    <Button type="button" size="sm" onClick={addTechnology}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.technologies.map((tech, i) => (
                      <Badge key={i} variant="secondary" className="pl-3 pr-1">
                        {tech}
                        <button onClick={() => removeTechnology(i)} className="ml-2 hover:text-destructive">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <Label>Risultati Raggiunti</Label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={newResult.value}
                      onChange={(e) => setNewResult({...newResult, value: e.target.value})}
                      placeholder="Valore (es: +45%)"
                      className="w-1/3"
                    />
                    <Input
                      value={newResult.metric}
                      onChange={(e) => setNewResult({...newResult, metric: e.target.value})}
                      placeholder="Metrica (es: ROI, Vendite)"
                      className="flex-1"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addResult())}
                    />
                    <Button type="button" size="sm" onClick={addResult}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-1">
                    {formData.results.map((result, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-sm"><strong>{result.value}</strong> {result.metric}</span>
                        <button onClick={() => removeResult(i)} className="hover:text-destructive">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Media & Links */}
          <AccordionItem value="media" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-primary" />
                <span className="font-semibold">Media e Collegamenti</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div>
                <Label>Immagine in Evidenza</Label>
                <div
                  onDrop={onFileDrop}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {formData.featuredImage ? (
                    <div className="relative">
                      <img src={formData.featuredImage} alt="Preview" className="max-h-48 mx-auto rounded" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInputChange('featuredImage', '');
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Trascina o clicca per caricare</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </div>
              </div>

              <div>
                <Label>Galleria Immagini Aggiuntive</Label>
                <div className="space-y-3">
                  <div
                    onDrop={async (e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file && file.type.startsWith('image/')) {
                        const base64 = await handleImageUpload(file);
                        handleInputChange('images', [...(formData.images || []), base64]);
                      }
                    }}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = async (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                          const base64 = await handleImageUpload(file);
                          handleInputChange('images', [...(formData.images || []), base64]);
                        }
                      };
                      input.click();
                    }}
                  >
                    <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Aggiungi immagine alla galleria</p>
                  </div>

                  {formData.images && formData.images.length > 0 && (
                    <div className="grid grid-cols-2 gap-3">
                      {formData.images.map((img, idx) => (
                        <div key={idx} className="relative group">
                          <img src={img} alt={`Gallery ${idx + 1}`} className="w-full h-32 object-cover rounded" />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => {
                              const newImages = formData.images.filter((_, i) => i !== idx);
                              handleInputChange('images', newImages);
                            }}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="projectUrl">URL Progetto</Label>
                <Input
                  id="projectUrl"
                  value={formData.projectUrl}
                  onChange={(e) => handleInputChange('projectUrl', e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div>
                <Label htmlFor="caseStudyUrl">URL Case Study</Label>
                <Input
                  id="caseStudyUrl"
                  value={formData.caseStudyUrl}
                  onChange={(e) => handleInputChange('caseStudyUrl', e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Testimonial */}
          <AccordionItem value="testimonial" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Quote className="w-4 h-4 text-primary" />
                <span className="font-semibold">Testimonianza Cliente</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div>
                <Label htmlFor="testimonialText">Testo Testimonianza</Label>
                <Textarea
                  id="testimonialText"
                  value={formData.testimonial?.text ?? ''}
                  onChange={(e) => handleInputChange('testimonial', { ...formData.testimonial, text: e.target.value })}
                  placeholder="Inserisci la testimonianza del cliente..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="testimonialAuthor">Nome</Label>
                  <Input
                    id="testimonialAuthor"
                    value={formData.testimonial?.author || ''}
                    onChange={(e) => handleInputChange('testimonial', { ...formData.testimonial, author: e.target.value })}
                    placeholder="Mario Rossi"
                  />
                </div>

                <div>
                  <Label htmlFor="testimonialRole">Ruolo</Label>
                  <Input
                    id="testimonialRole"
                    value={formData.testimonial?.role || ''}
                    onChange={(e) => handleInputChange('testimonial', { ...formData.testimonial, role: e.target.value })}
                    placeholder="CEO"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="testimonialCompany">Azienda (opzionale)</Label>
                <Input
                  id="testimonialCompany"
                  value={formData.testimonial?.company || ''}
                  onChange={(e) => handleInputChange('testimonial', { ...formData.testimonial, company: e.target.value })}
                  placeholder="Nome Azienda"
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Timeline */}
          <AccordionItem value="timeline" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="font-semibold">Timeline</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div>
                <Label htmlFor="duration">Durata</Label>
                <Input
                  id="duration"
                  value={formData.duration}
                  onChange={(e) => handleInputChange('duration', e.target.value)}
                  placeholder="Es: 3 mesi, 6 settimane"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Data Inizio</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="endDate">Data Fine</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="completionDate">Data Completamento</Label>
                <Input
                  id="completionDate"
                  type="date"
                  value={formData.completionDate}
                  onChange={(e) => handleInputChange('completionDate', e.target.value)}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* SEO */}
          <AccordionItem value="seo" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="font-semibold">SEO & Meta Tags</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div>
                <Label htmlFor="metaTitle">Meta Title (max 60 caratteri)</Label>
                <Input
                  id="metaTitle"
                  value={formData.metaTitle}
                  onChange={(e) => handleInputChange('metaTitle', e.target.value)}
                  placeholder="Titolo ottimizzato per SEO"
                  maxLength={60}
                />
                <p className="text-xs text-muted-foreground mt-1">{formData.metaTitle.length}/60</p>
              </div>

              <div>
                <Label htmlFor="metaDescription">Meta Description (max 160 caratteri)</Label>
                <Textarea
                  id="metaDescription"
                  value={formData.metaDescription}
                  onChange={(e) => handleInputChange('metaDescription', e.target.value)}
                  placeholder="Descrizione ottimizzata per SEO"
                  rows={3}
                  maxLength={160}
                />
                <p className="text-xs text-muted-foreground mt-1">{formData.metaDescription.length}/160</p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t sticky bottom-0 bg-background pb-4">
          <Button variant="outline" onClick={() => handleSaveAll(false)} className="flex-1" disabled={!isTitleValid || !isDescriptionValid}>
            <Save className="w-4 h-4 mr-2" />
            Salva Bozza
          </Button>
          <Button onClick={() => handleSaveAll(true)} className="flex-1" disabled={!isTitleValid || !isDescriptionValid}>
            <Send className="w-4 h-4 mr-2" />
            Pubblica
          </Button>
        </div>
      </div>

      {/* Right Panel - Rich Text Editor */}
      <div className="flex-1 bg-background p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-2">Descrizione Completa del Progetto</h3>
            <p className="text-sm text-muted-foreground">Racconta la storia completa del progetto con testo ricco, immagini e formattazione.</p>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                {Object.keys(fullDescription).length === 0 ? 'Scegli Template' : 'Cambia Template'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-60">
              <div className="space-y-2">
                {projectTemplates.map(template => (
                  <Button
                    key={template.name}
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => applyTemplate(template.data)}
                  >
                    {template.name}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
        
        <Suspense fallback={<CMSEditorSkeleton />}>
          <CMSEditor
            key={editorKey}
            initialContent={fullDescription}
            onSave={handleContentSave}
          />
        </Suspense>
      </div>
    </div>
  );
}
