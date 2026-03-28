import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Skeleton } from './ui/skeleton';
import { Save, Send, Tag, X, Plus, FileText, Clock, AlertCircle, Upload, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from './ui/card';

const CMSEditor = lazy(() => import('./CMSEditor').then(module => ({ default: module.CMSEditor })));

function CMSEditorSkeleton() {
  return (
    <div className="bg-white prose prose-lg max-w-none border border-slate-200 rounded-lg p-4 min-h-[600px] space-y-4">
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

const postTemplates = [
    { name: "Guida Definitiva", data: { blocks: [ { type: "header", data: { text: "Il Titolo della Tua Guida Completa (H2)", level: 2 } }, { type: "paragraph", data: { text: "Inizia con un'introduzione che catturi l'attenzione del lettore, spiegando chiaramente cosa imparerà e perché è importante. Usa dati, fai una domanda o presenta un problema comune." } }, { type: "image", data: { url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='400'%3E%3Crect fill='%23e2e8f0' width='800' height='400'/%3E%3Ctext x='50%25' y='50%25' font-size='20' fill='%2364748b' text-anchor='middle' dy='.3em'%3EImmagine Introduttiva%3C/text%3E%3C/svg%3E", caption: "Una didascalia per l'immagine introduttiva." } }, { type: "header", data: { text: "Capitolo 1: Le Basi Fondamentali", level: 3 } }, { type: "paragraph", data: { text: "In questa sezione, copri i concetti di base. Assicurati che anche un principiante possa capire. Usa un linguaggio semplice e diretto." } }, { type: "list", data: { style: "ordered", items: ["Primo punto fondamentale.", "Secondo punto da non dimenticare.", "Terzo concetto chiave."] } }, { type: "header", data: { text: "Capitolo 2: Tecniche Avanzate", level: 3 } }, { type: "paragraph", data: { text: "Ora che le basi sono state gettate, puoi esplorare argomenti più complessi. Fornisci esempi pratici e dettagli tecnici." } }, { type: "quote", data: { text: "Una citazione rilevante può aggiungere autorità al tuo articolo.", caption: "Nome Esperto" } }, { type: "header", data: { text: "Conclusione e Prossimi Passi", level: 2 } }, { type: "paragraph", data: { text: "Riassumi i punti più importanti della guida e offri al lettore una chiara 'call to action'. Cosa dovrebbe fare ora? Potrebbe essere iscriversi alla newsletter, contattarti o leggere un altro articolo correlato." } }, ] } },
    { name: "Recensione Prodotto", data: { blocks: [ { type: "header", data: { text: "Recensione Completa di [Nome Prodotto]", level: 2 } }, { type: "paragraph", data: { text: "In questo articolo analizzeremo in dettaglio [Nome Prodotto]. Vedremo le sue caratteristiche principali, i pro, i contro e per chi è più indicato. Alla fine, saprai se è la scelta giusta per te." } }, { type: "header", data: { text: "Cos'è [Nome Prodotto]?", level: 3 } }, { type: "paragraph", data: { text: "Una breve panoramica del prodotto, a cosa serve e quale problema risolve." } }, { type: "image", data: { url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='400'%3E%3Crect fill='%23e2e8f0' width='800' height='400'/%3E%3Ctext x='50%25' y='50%25' font-size='20' fill='%2364748b' text-anchor='middle' dy='.3em'%3EFoto del Prodotto%3C/text%3E%3C/svg%3E", caption: "Il prodotto in azione o la sua confezione." } }, { type: "header", data: { text: "Caratteristiche Principali", level: 3 } }, { type: "list", data: { style: "unordered", items: ["Caratteristica 1: Descrizione e beneficio.", "Caratteristica 2: Descrizione e beneficio.", "Caratteristica 3: Descrizione e beneficio."] } }, { type: "header", data: { text: "Prezzo", level: 3 } }, { type: "paragraph", data: { text: "Analisi dei costi e dei vari piani disponibili. C'è un buon rapporto qualità/prezzo?" } }, { type: "header", data: { text: "Verdetto Finale: Lo Consigliamo?", level: 2 } }, { type: "paragraph", data: { text: "Tira le somme. A chi consiglieresti questo prodotto e perché? Ci sono alternative migliori? Concludi con un punteggio finale o una chiara raccomandazione." } }, ] } }
];

interface BlogEditorProps { initialPost?: any; onSave: (postData: any) => void; onPublish: (postData: any) => void; onClose: () => void; }
const categories = [{ id: 1, name: "Marketing" }, { id: 2, name: "SEO" }];

const calculateReadingTime = (content: { blocks?: { type: string, data: { text?: string } }[] }) => {
    if (!content?.blocks) return 1;
    const wordsPerMinute = 200;
    const text = content.blocks.map(block => block.data.text || '').join(' ');
    const words = text.split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / wordsPerMinute));
};

export function BlogEditor({ initialPost, onSave, onPublish, onClose }: BlogEditorProps) {
  const [formData, setFormData] = useState({ id: null, title: '', slug: '', excerpt: '', featuredImage: '', categoryId: '', status: 'draft', isFeatured: false, publishedAt: null, readingTime: 1, metaTitle: '', metaDescription: '' });
  const [content, setContent] = useState({});
  const [editorKey, setEditorKey] = useState(Date.now());
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isTitleValid = formData.title.trim().length >= 3;

  const handleInputChange = (field: string, value: any) => setFormData(p => ({ ...p, [field]: value }));
  const handleSlugChange = useCallback((newTitle: string) => {
    const slug = newTitle.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').trim();
    handleInputChange('slug', slug);
  }, []);

  useEffect(() => {
    if (initialPost) {
      const { category, ...restOfPost } = initialPost;
      const initialFormData = {
          ...restOfPost,
          categoryId: category ? category.id : '',
          metaTitle: restOfPost.metaTitle || '',
          metaDescription: restOfPost.metaDescription || ''
      };
      setFormData(initialFormData);

      if (initialPost.content?.blocks) { setContent(initialPost.content); setEditorKey(Date.now()); }
      setSelectedTags(initialPost.tags?.map((t: any) => t.name) || []);
    }
  }, [initialPost]);

  const handleSaveAll = (isPublishing = false) => {
    if (!isTitleValid) { alert("Il titolo è obbligatorio per salvare o pubblicare."); return; }
    const finalData: any = { ...formData };
    
    finalData.content = JSON.stringify(content);
    
    const categoryIdAsNumber = finalData.categoryId ? parseInt(finalData.categoryId, 10) : null;
    finalData.categoryId = isNaN(categoryIdAsNumber as number) ? null : categoryIdAsNumber;
    delete finalData.tags; 
    finalData.status = isPublishing ? 'published' : 'draft';
    if (isPublishing) {
        finalData.publishedAt = new Date();
        onPublish(finalData);
    } else {
        onSave(finalData);
    }
  };

  const applyTemplate = (templateData: any) => {
    setContent(templateData);
    setEditorKey(Date.now());
  };

  const handleContentSave = (newContent: any) => {
    setContent(newContent);
    const time = calculateReadingTime(newContent);
    handleInputChange('readingTime', time);
  };

  const handleImageUpload = (file: File) => {
    return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target?.result as string);
        reader.readAsDataURL(file);
    });
  };

  const onFileDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setIsDragging(false);
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

  return (
    <div className="flex h-full bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-slate-200 px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-slate-700">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">{initialPost ? 'Modifica Articolo' : 'Nuovo Articolo'}</h1>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Clock className="h-3 w-3" />
                <span>{formData.readingTime} min di lettura</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={
              formData.status === 'published'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-50 text-slate-600 border-slate-200'
            }>
              {formData.status === 'published' ? 'Pubblicato' : 'Bozza'}
            </Badge>
          </div>
        </header>

        <div className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            {!initialPost && (
              <Card className="border-0 shadow-sm bg-white">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-indigo-500" />
                  </div>
                  <p className="flex-grow font-medium text-slate-700">Parti da un foglio bianco o scegli un template:</p>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button className="bg-indigo-600 hover:bg-indigo-700">Scegli Template</Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-60">
                      <div className="space-y-1">
                        {postTemplates.map(template => (
                          <Button key={template.name} variant="ghost" className="w-full justify-start text-slate-700 hover:bg-indigo-50 hover:text-indigo-700" onClick={() => applyTemplate(template.data)}>
                            {template.name}
                          </Button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </CardContent>
              </Card>
            )}
            <Input
              placeholder="Titolo del tuo articolo..."
              className={`text-4xl font-bold h-auto border-none shadow-none focus-visible:ring-0 !p-0 bg-transparent mb-6 text-slate-900 placeholder:text-slate-300 ${!isTitleValid && 'placeholder:text-red-300'}`}
              value={formData.title}
              onChange={(e) => { handleInputChange('title', e.target.value); handleSlugChange(e.target.value); }}
            />
            <Suspense fallback={<CMSEditorSkeleton />}>
              <CMSEditor key={editorKey} data={content} onSave={handleContentSave} />
            </Suspense>
          </div>
        </div>
      </div>

      <aside className="w-96 bg-white border-l border-slate-200 flex flex-col shadow-sm">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Impostazioni</h3>
          <Button size="icon" variant="ghost" onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 p-5 overflow-y-auto">
          <Accordion type="multiple" defaultValue={['publish', 'image', 'details', 'seo']} className="w-full space-y-1">
            <AccordionItem value="publish" className="border-b border-slate-100">
              <AccordionTrigger className="font-semibold text-sm text-slate-700 hover:text-indigo-600 py-3">Pubblicazione</AccordionTrigger>
              <AccordionContent className="space-y-3 pt-2 pb-4">
                <Button onClick={() => handleSaveAll(false)} variant="outline" className="w-full border-slate-200 text-slate-700 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700" disabled={!isTitleValid}>
                  <Save className="mr-2 h-4 w-4" />Salva Bozza
                </Button>
                <Button onClick={() => handleSaveAll(true)} className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={!isTitleValid}>
                  <Send className="mr-2 h-4 w-4" />Pubblica Ora
                </Button>
                {!isTitleValid && (
                  <div className="flex items-center text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">
                    <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>Il titolo è obbligatorio (min. 3 caratteri).</span>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="image" className="border-b border-slate-100">
              <AccordionTrigger className="font-semibold text-sm text-slate-700 hover:text-indigo-600 py-3">Immagine in Evidenza</AccordionTrigger>
              <AccordionContent className="pt-2 pb-4 space-y-3">
                <div
                  className={`w-full aspect-video border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-slate-400 transition-colors cursor-pointer ${isDragging ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'}`}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragEnter={() => setIsDragging(true)}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={onFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {formData.featuredImage ? (
                    <div className="relative group w-full h-full">
                      <img src={formData.featuredImage} alt="Anteprima" className="w-full h-full object-cover rounded-lg" />
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7"
                        onClick={(e) => { e.stopPropagation(); handleInputChange('featuredImage', ''); }}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 mb-2 text-slate-300" />
                      <p className="text-sm font-medium text-slate-500">Trascina un'immagine o clicca</p>
                      <p className="text-xs text-slate-400">per selezionarla dal dispositivo</p>
                    </>
                  )}
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
                <Input
                  placeholder="O incolla un URL immagine..."
                  value={formData.featuredImage}
                  onChange={e => handleInputChange('featuredImage', e.target.value)}
                  className="border-slate-200 focus:border-indigo-300 focus:ring-indigo-200"
                />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="details" className="border-b border-slate-100">
              <AccordionTrigger className="font-semibold text-sm text-slate-700 hover:text-indigo-600 py-3">Dettagli</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2 pb-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Slug URL</Label>
                  <Input value={formData.slug} onChange={e => handleInputChange('slug', e.target.value)} className="border-slate-200 focus:border-indigo-300 focus:ring-indigo-200" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Excerpt (Riassunto)</Label>
                  <Textarea value={formData.excerpt} onChange={e => handleInputChange('excerpt', e.target.value)} rows={4} className="border-slate-200 focus:border-indigo-300 focus:ring-indigo-200" />
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <Switch id="isFeatured" checked={formData.isFeatured} onCheckedChange={c => handleInputChange('isFeatured', c)} />
                  <Label htmlFor="isFeatured" className="text-sm text-slate-700">Articolo in Evidenza</Label>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="seo" className="border-b border-slate-100">
              <AccordionTrigger className="font-semibold text-sm text-slate-700 hover:text-indigo-600 py-3">Impostazioni SEO</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2 pb-4">
                <div className="space-y-1.5">
                  <Label htmlFor="metaTitle" className="text-xs font-medium text-slate-500 uppercase tracking-wide">Meta Title</Label>
                  <Input id="metaTitle" placeholder="Titolo SEO per i motori di ricerca..." value={formData.metaTitle} onChange={e => handleInputChange('metaTitle', e.target.value)} maxLength={60} data-testid="input-blog-meta-title" className="border-slate-200 focus:border-indigo-300 focus:ring-indigo-200" />
                  <p className="text-xs text-slate-400">{formData.metaTitle.length}/60 caratteri</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="metaDescription" className="text-xs font-medium text-slate-500 uppercase tracking-wide">Meta Description</Label>
                  <Textarea id="metaDescription" placeholder="Descrizione SEO per i motori di ricerca..." value={formData.metaDescription} onChange={e => handleInputChange('metaDescription', e.target.value)} maxLength={160} rows={3} data-testid="textarea-blog-meta-description" className="border-slate-200 focus:border-indigo-300 focus:ring-indigo-200" />
                  <p className="text-xs text-slate-400">{formData.metaDescription.length}/160 caratteri</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="taxonomy" className="border-b-0">
              <AccordionTrigger className="font-semibold text-sm text-slate-700 hover:text-indigo-600 py-3">Categoria e Tag</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2 pb-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Categoria</Label>
                  <Select value={String(formData.categoryId)} onValueChange={v => handleInputChange('categoryId', v)}>
                    <SelectTrigger className="border-slate-200 focus:border-indigo-300 focus:ring-indigo-200">
                      <SelectValue placeholder="Scegli categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Tag</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={e => setNewTag(e.target.value)}
                      onKeyPress={e => { if (e.key === 'Enter' && newTag) { setSelectedTags([...selectedTags, newTag]); setNewTag(''); }}}
                      placeholder="Aggiungi tag..."
                      className="border-slate-200 focus:border-indigo-300 focus:ring-indigo-200"
                    />
                    <Button onClick={() => { if(newTag) { setSelectedTags([...selectedTags, newTag]); setNewTag(''); }}} variant="outline" size="icon" className="border-slate-200 hover:border-indigo-200 hover:bg-indigo-50">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {selectedTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {selectedTags.map(t => (
                        <Badge key={t} className="bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100">
                          {t}
                          <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => setSelectedTags(selectedTags.filter(tag => tag !== t))} />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </aside>
    </div>
  );
}
