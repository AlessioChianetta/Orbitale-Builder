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
import { Save, Send, ArrowLeft, Plus, Upload, Calendar, Briefcase, Code, TrendingUp, Lightbulb, Quote, FileText, X } from 'lucide-react';

const CMSEditor = lazy(() => import('./CMSEditor').then(module => ({ default: module.CMSEditor })));

function CMSEditorSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 min-h-[600px] space-y-4">
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
    <div className="flex h-full bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-2/5 border-r border-slate-200 bg-white shadow-sm flex flex-col">
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-slate-700">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {initialProject ? 'Modifica Progetto' : 'Nuovo Progetto'}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="outline" className={formData.status === 'published'
                  ? 'border-emerald-200 text-emerald-700 bg-emerald-50 text-xs'
                  : 'border-slate-200 text-slate-600 bg-slate-50 text-xs'
                }>
                  {formData.status === 'published' ? 'Pubblicato' : 'Bozza'}
                </Badge>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <Accordion type="multiple" defaultValue={["basic", "content", "media"]} className="space-y-3">
            <AccordionItem value="basic" className="border border-slate-200 rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline text-indigo-600 hover:text-indigo-700">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  <span className="font-semibold text-slate-700 text-sm uppercase tracking-wide">Informazioni Base</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="title" className="text-xs font-medium text-slate-600">Titolo Progetto *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => {
                      handleInputChange('title', e.target.value);
                      handleSlugChange(e.target.value);
                    }}
                    placeholder="Es: Ecommerce per BigClient"
                    className={`border-slate-200 focus:border-indigo-300 ${!isTitleValid && formData.title ? 'border-red-300' : ''}`}
                  />
                  {!isTitleValid && formData.title && (
                    <p className="text-xs text-red-500 mt-1">Minimo 3 caratteri</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="slug" className="text-xs font-medium text-slate-600">Slug URL</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => handleInputChange('slug', e.target.value)}
                    placeholder="ecommerce-bigclient"
                    className="border-slate-200 focus:border-indigo-300"
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-xs font-medium text-slate-600">Descrizione *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Descrizione completa del progetto (campo obbligatorio)"
                    rows={4}
                    className="border-slate-200 focus:border-indigo-300"
                  />
                </div>

                <div>
                  <Label htmlFor="shortDescription" className="text-xs font-medium text-slate-600">Breve Descrizione</Label>
                  <Textarea
                    id="shortDescription"
                    value={formData.shortDescription}
                    onChange={(e) => handleInputChange('shortDescription', e.target.value)}
                    placeholder="Una breve descrizione del progetto (max 500 caratteri)"
                    rows={3}
                    maxLength={500}
                    className="border-slate-200 focus:border-indigo-300"
                  />
                </div>

                <div>
                  <Label htmlFor="clientName" className="text-xs font-medium text-slate-600">Nome Cliente</Label>
                  <Input
                    id="clientName"
                    value={formData.clientName}
                    onChange={(e) => handleInputChange('clientName', e.target.value)}
                    placeholder="Es: Orbitale"
                    className="border-slate-200 focus:border-indigo-300"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="projectType" className="text-xs font-medium text-slate-600">Tipo</Label>
                    <Select value={formData.projectType} onValueChange={(v) => handleInputChange('projectType', v)}>
                      <SelectTrigger className="border-slate-200 focus:border-indigo-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="project">Progetto</SelectItem>
                        <SelectItem value="partnership">Partnership</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="category" className="text-xs font-medium text-slate-600">Categoria</Label>
                    <Select value={formData.category} onValueChange={(v) => handleInputChange('category', v)}>
                      <SelectTrigger className="border-slate-200 focus:border-indigo-300">
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

                <div className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg">
                  <Label htmlFor="isFeatured" className="text-sm text-slate-700">In Evidenza</Label>
                  <Switch
                    id="isFeatured"
                    checked={formData.isFeatured}
                    onCheckedChange={(checked) => handleInputChange('isFeatured', checked)}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="content" className="border border-slate-200 rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline text-indigo-600 hover:text-indigo-700">
                <div className="flex items-center gap-2">
                  {getCategoryIcon()}
                  <span className="font-semibold text-slate-700 text-sm uppercase tracking-wide">Dettagli Progetto</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="challenge" className="text-xs font-medium text-slate-600">Sfida / Problema</Label>
                  <Textarea
                    id="challenge"
                    value={formData.challenge ?? ''}
                    onChange={(e) => handleInputChange('challenge', e.target.value)}
                    placeholder="Quale problema o sfida affrontava il cliente?"
                    rows={3}
                    className="border-slate-200 focus:border-indigo-300"
                  />
                </div>

                <div>
                  <Label htmlFor="solution" className="text-xs font-medium text-slate-600">Soluzione Implementata</Label>
                  <Textarea
                    id="solution"
                    value={formData.solution ?? ''}
                    onChange={(e) => handleInputChange('solution', e.target.value)}
                    placeholder="Come avete risolto il problema?"
                    rows={3}
                    className="border-slate-200 focus:border-indigo-300"
                  />
                </div>

                <div>
                  <Label className="text-xs font-medium text-slate-600">Tecnologie Utilizzate</Label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={newTechnology}
                        onChange={(e) => setNewTechnology(e.target.value)}
                        placeholder="Es: React, Node.js, PostgreSQL"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTechnology())}
                        className="border-slate-200 focus:border-indigo-300"
                      />
                      <Button type="button" size="sm" onClick={addTechnology} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {formData.technologies.map((tech, i) => (
                        <Badge key={i} variant="outline" className="border-indigo-200 text-indigo-700 bg-indigo-50 pl-2.5 pr-1">
                          {tech}
                          <button onClick={() => removeTechnology(i)} className="ml-1.5 hover:text-red-500">
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-medium text-slate-600">Risultati Raggiunti</Label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={newResult.value}
                        onChange={(e) => setNewResult({...newResult, value: e.target.value})}
                        placeholder="Valore (es: +45%)"
                        className="w-1/3 border-slate-200 focus:border-indigo-300"
                      />
                      <Input
                        value={newResult.metric}
                        onChange={(e) => setNewResult({...newResult, metric: e.target.value})}
                        placeholder="Metrica (es: ROI, Vendite)"
                        className="flex-1 border-slate-200 focus:border-indigo-300"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addResult())}
                      />
                      <Button type="button" size="sm" onClick={addResult} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="space-y-1.5">
                      {formData.results.map((result, i) => (
                        <div key={i} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                          <span className="text-sm text-slate-700"><strong className="text-indigo-600">{result.value}</strong> {result.metric}</span>
                          <button onClick={() => removeResult(i)} className="text-slate-400 hover:text-red-500">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="media" className="border border-slate-200 rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline text-indigo-600 hover:text-indigo-700">
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  <span className="font-semibold text-slate-700 text-sm uppercase tracking-wide">Media e Collegamenti</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div>
                  <Label className="text-xs font-medium text-slate-600">Immagine in Evidenza</Label>
                  <div
                    onDrop={onFileDrop}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isDragging ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'}`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {formData.featuredImage ? (
                      <div className="relative">
                        <img src={formData.featuredImage} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
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
                        <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                        <p className="text-sm text-slate-500">Trascina o clicca per caricare</p>
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
                  <Label className="text-xs font-medium text-slate-600">Galleria Immagini Aggiuntive</Label>
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
                      className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${isDragging ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'}`}
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
                      <Upload className="w-6 h-6 mx-auto mb-2 text-slate-400" />
                      <p className="text-sm text-slate-500">Aggiungi immagine alla galleria</p>
                    </div>

                    {formData.images && formData.images.length > 0 && (
                      <div className="grid grid-cols-2 gap-3">
                        {formData.images.map((img, idx) => (
                          <div key={idx} className="relative group rounded-lg overflow-hidden">
                            <img src={img} alt={`Gallery ${idx + 1}`} className="w-full h-32 object-cover" />
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
                  <Label htmlFor="projectUrl" className="text-xs font-medium text-slate-600">URL Progetto</Label>
                  <Input
                    id="projectUrl"
                    value={formData.projectUrl}
                    onChange={(e) => handleInputChange('projectUrl', e.target.value)}
                    placeholder="https://..."
                    className="border-slate-200 focus:border-indigo-300"
                  />
                </div>

                <div>
                  <Label htmlFor="caseStudyUrl" className="text-xs font-medium text-slate-600">URL Case Study</Label>
                  <Input
                    id="caseStudyUrl"
                    value={formData.caseStudyUrl}
                    onChange={(e) => handleInputChange('caseStudyUrl', e.target.value)}
                    placeholder="https://..."
                    className="border-slate-200 focus:border-indigo-300"
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="testimonial" className="border border-slate-200 rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline text-indigo-600 hover:text-indigo-700">
                <div className="flex items-center gap-2">
                  <Quote className="w-4 h-4" />
                  <span className="font-semibold text-slate-700 text-sm uppercase tracking-wide">Testimonianza Cliente</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="testimonialText" className="text-xs font-medium text-slate-600">Testo Testimonianza</Label>
                  <Textarea
                    id="testimonialText"
                    value={formData.testimonial?.text ?? ''}
                    onChange={(e) => handleInputChange('testimonial', { ...formData.testimonial, text: e.target.value })}
                    placeholder="Inserisci la testimonianza del cliente..."
                    rows={4}
                    className="border-slate-200 focus:border-indigo-300"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="testimonialAuthor" className="text-xs font-medium text-slate-600">Nome</Label>
                    <Input
                      id="testimonialAuthor"
                      value={formData.testimonial?.author || ''}
                      onChange={(e) => handleInputChange('testimonial', { ...formData.testimonial, author: e.target.value })}
                      placeholder="Mario Rossi"
                      className="border-slate-200 focus:border-indigo-300"
                    />
                  </div>

                  <div>
                    <Label htmlFor="testimonialRole" className="text-xs font-medium text-slate-600">Ruolo</Label>
                    <Input
                      id="testimonialRole"
                      value={formData.testimonial?.role || ''}
                      onChange={(e) => handleInputChange('testimonial', { ...formData.testimonial, role: e.target.value })}
                      placeholder="CEO"
                      className="border-slate-200 focus:border-indigo-300"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="testimonialCompany" className="text-xs font-medium text-slate-600">Azienda (opzionale)</Label>
                  <Input
                    id="testimonialCompany"
                    value={formData.testimonial?.company || ''}
                    onChange={(e) => handleInputChange('testimonial', { ...formData.testimonial, company: e.target.value })}
                    placeholder="Nome Azienda"
                    className="border-slate-200 focus:border-indigo-300"
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="timeline" className="border border-slate-200 rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline text-indigo-600 hover:text-indigo-700">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span className="font-semibold text-slate-700 text-sm uppercase tracking-wide">Timeline</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="duration" className="text-xs font-medium text-slate-600">Durata</Label>
                  <Input
                    id="duration"
                    value={formData.duration}
                    onChange={(e) => handleInputChange('duration', e.target.value)}
                    placeholder="Es: 3 mesi, 6 settimane"
                    className="border-slate-200 focus:border-indigo-300"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate" className="text-xs font-medium text-slate-600">Data Inizio</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => handleInputChange('startDate', e.target.value)}
                      className="border-slate-200 focus:border-indigo-300"
                    />
                  </div>

                  <div>
                    <Label htmlFor="endDate" className="text-xs font-medium text-slate-600">Data Fine</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => handleInputChange('endDate', e.target.value)}
                      className="border-slate-200 focus:border-indigo-300"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="completionDate" className="text-xs font-medium text-slate-600">Data Completamento</Label>
                  <Input
                    id="completionDate"
                    type="date"
                    value={formData.completionDate}
                    onChange={(e) => handleInputChange('completionDate', e.target.value)}
                    className="border-slate-200 focus:border-indigo-300"
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="seo" className="border border-slate-200 rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline text-indigo-600 hover:text-indigo-700">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="font-semibold text-slate-700 text-sm uppercase tracking-wide">SEO & Meta Tags</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="metaTitle" className="text-xs font-medium text-slate-600">Meta Title (max 60 caratteri)</Label>
                  <Input
                    id="metaTitle"
                    value={formData.metaTitle}
                    onChange={(e) => handleInputChange('metaTitle', e.target.value)}
                    placeholder="Titolo ottimizzato per SEO"
                    maxLength={60}
                    className="border-slate-200 focus:border-indigo-300"
                  />
                  <p className="text-xs text-slate-400 mt-1">{formData.metaTitle.length}/60</p>
                </div>

                <div>
                  <Label htmlFor="metaDescription" className="text-xs font-medium text-slate-600">Meta Description (max 160 caratteri)</Label>
                  <Textarea
                    id="metaDescription"
                    value={formData.metaDescription}
                    onChange={(e) => handleInputChange('metaDescription', e.target.value)}
                    placeholder="Descrizione ottimizzata per SEO"
                    rows={3}
                    maxLength={160}
                    className="border-slate-200 focus:border-indigo-300"
                  />
                  <p className="text-xs text-slate-400 mt-1">{formData.metaDescription.length}/160</p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <div className="border-t border-slate-200 p-4 bg-white/80 backdrop-blur-sm flex gap-3">
          <Button variant="outline" onClick={() => handleSaveAll(false)} className="flex-1 border-slate-200 text-slate-700 hover:bg-slate-50" disabled={!isTitleValid || !isDescriptionValid}>
            <Save className="w-4 h-4 mr-2" />
            Salva Bozza
          </Button>
          <Button onClick={() => handleSaveAll(true)} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white" disabled={!isTitleValid || !isDescriptionValid}>
            <Send className="w-4 h-4 mr-2" />
            Pubblica
          </Button>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Descrizione Completa del Progetto</h3>
            <p className="text-sm text-slate-500">Racconta la storia completa del progetto con testo ricco, immagini e formattazione.</p>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="border-slate-200 text-slate-600 hover:bg-slate-50">
                <FileText className="h-4 w-4 mr-2" />
                {Object.keys(fullDescription).length === 0 ? 'Scegli Template' : 'Cambia Template'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-60">
              <div className="space-y-1">
                {projectTemplates.map(template => (
                  <Button
                    key={template.name}
                    variant="ghost"
                    className="w-full justify-start text-sm hover:bg-indigo-50 hover:text-indigo-700"
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
