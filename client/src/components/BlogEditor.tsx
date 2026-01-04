import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { CMSEditor } from './CMSEditor';
import { Save, Send, Tag, X, Plus, FileText, Clock, AlertCircle, Upload } from 'lucide-react';
import { Card, CardContent } from './ui/card';

const postTemplates = [
    { name: "Guida Definitiva", data: { blocks: [ { type: "header", data: { text: "Il Titolo della Tua Guida Completa (H2)", level: 2 } }, { type: "paragraph", data: { text: "Inizia con un'introduzione che catturi l'attenzione del lettore, spiegando chiaramente cosa imparerà e perché è importante. Usa dati, fai una domanda o presenta un problema comune." } }, { type: "image", data: { url: "https://via.placeholder.com/800x400.png?text=Immagine+Introduttiva", caption: "Una didascalia per l'immagine introduttiva." } }, { type: "header", data: { text: "Capitolo 1: Le Basi Fondamentali", level: 3 } }, { type: "paragraph", data: { text: "In questa sezione, copri i concetti di base. Assicurati che anche un principiante possa capire. Usa un linguaggio semplice e diretto." } }, { type: "list", data: { style: "ordered", items: ["Primo punto fondamentale.", "Secondo punto da non dimenticare.", "Terzo concetto chiave."] } }, { type: "header", data: { text: "Capitolo 2: Tecniche Avanzate", level: 3 } }, { type: "paragraph", data: { text: "Ora che le basi sono state gettate, puoi esplorare argomenti più complessi. Fornisci esempi pratici e dettagli tecnici." } }, { type: "quote", data: { text: "Una citazione rilevante può aggiungere autorità al tuo articolo.", caption: "Nome Esperto" } }, { type: "header", data: { text: "Conclusione e Prossimi Passi", level: 2 } }, { type: "paragraph", data: { text: "Riassumi i punti più importanti della guida e offri al lettore una chiara 'call to action'. Cosa dovrebbe fare ora? Potrebbe essere iscriversi alla newsletter, contattarti o leggere un altro articolo correlato." } }, ] } },
    { name: "Recensione Prodotto", data: { blocks: [ { type: "header", data: { text: "Recensione Completa di [Nome Prodotto]", level: 2 } }, { type: "paragraph", data: { text: "In questo articolo analizzeremo in dettaglio [Nome Prodotto]. Vedremo le sue caratteristiche principali, i pro, i contro e per chi è più indicato. Alla fine, saprai se è la scelta giusta per te." } }, { type: "header", data: { text: "Cos'è [Nome Prodotto]?", level: 3 } }, { type: "paragraph", data: { text: "Una breve panoramica del prodotto, a cosa serve e quale problema risolve." } }, { type: "image", data: { url: "https://via.placeholder.com/800x400.png?text=Foto+del+Prodotto", caption: "Il prodotto in azione o la sua confezione." } }, { type: "header", data: { text: "Caratteristiche Principali", level: 3 } }, { type: "list", data: { style: "unordered", items: ["Caratteristica 1: Descrizione e beneficio.", "Caratteristica 2: Descrizione e beneficio.", "Caratteristica 3: Descrizione e beneficio."] } }, { type: "header", data: { text: "Prezzo", level: 3 } }, { type: "paragraph", data: { text: "Analisi dei costi e dei vari piani disponibili. C'è un buon rapporto qualità/prezzo?" } }, { type: "header", data: { text: "Verdetto Finale: Lo Consigliamo?", level: 2 } }, { type: "paragraph", data: { text: "Tira le somme. A chi consiglieresti questo prodotto e perché? Ci sono alternative migliori? Concludi con un punteggio finale o una chiara raccomandazione." } }, ] } }
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
      // --- ECCO LA CORREZIONE ---
      // Separiamo la 'category' (oggetto) dal resto dei dati
      const { category, ...restOfPost } = initialPost;
      // Creiamo i dati iniziali per il form, usando solo l'ID della categoria
      const initialFormData = {
          ...restOfPost,
          categoryId: category ? category.id : '',
          // Assicuriamoci che i campi SEO siano sempre stringhe, non null/undefined
          metaTitle: restOfPost.metaTitle || '',
          metaDescription: restOfPost.metaDescription || ''
      };
      setFormData(initialFormData);
      // --- FINE CORREZIONE ---

      if (initialPost.content?.blocks) { setContent(initialPost.content); setEditorKey(Date.now()); }
      setSelectedTags(initialPost.tags?.map((t: any) => t.name) || []);
    }
  }, [initialPost]);

  const handleSaveAll = (isPublishing = false) => {
    if (!isTitleValid) { alert("Il titolo è obbligatorio per salvare o pubblicare."); return; }
    const finalData: any = { ...formData };
    
    // Serialize content as JSON string for the server
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
    <div className="flex h-full bg-muted/30">
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {!initialPost && (
              <Card className="mb-6"><CardContent className="p-4 flex items-center gap-4"><FileText className="h-6 w-6 text-muted-foreground"/><p className="flex-grow font-medium">Parti da un foglio bianco o scegli un template:</p><Popover><PopoverTrigger asChild><Button>Scegli Template</Button></PopoverTrigger><PopoverContent className="w-60"><div className="space-y-2">{postTemplates.map(template => (<Button key={template.name} variant="ghost" className="w-full justify-start" onClick={() => applyTemplate(template.data)}>{template.name}</Button>))}</div></PopoverContent></Popover></CardContent></Card>
          )}
          <Input placeholder="Titolo del tuo articolo..." className={`text-4xl font-bold h-auto border-none shadow-none focus-visible:ring-0 !p-0 bg-transparent mb-6 ${!isTitleValid && 'placeholder:text-red-400'}`} value={formData.title} onChange={(e) => { handleInputChange('title', e.target.value); handleSlugChange(e.target.value); }} />
          <CMSEditor key={editorKey} data={content} onSave={handleContentSave} />
        </div>
      </div>
      <aside className="w-96 bg-background border-l flex flex-col">
        <div className="p-6 border-b flex justify-between items-center"><div><Badge variant={formData.status === 'published' ? 'default' : 'secondary'}>{formData.status}</Badge><div className="flex items-center gap-2 text-sm text-muted-foreground mt-1"><Clock className="h-4 w-4" /><span>{formData.readingTime} min di lettura</span></div></div><Button size="icon" variant="ghost" onClick={onClose}><X className="h-4 w-4" /></Button></div>
        <div className="flex-1 p-6 overflow-y-auto">
          <Accordion type="multiple" defaultValue={['publish', 'image', 'details', 'seo']} className="w-full">
            <AccordionItem value="publish"><AccordionTrigger className="font-semibold">Pubblicazione</AccordionTrigger><AccordionContent className="space-y-4 pt-4"><Button onClick={() => handleSaveAll(false)} variant="outline" className="w-full" disabled={!isTitleValid}><Save className="mr-2 h-4 w-4"/>Salva Bozza</Button><Button onClick={() => handleSaveAll(true)} className="w-full" disabled={!isTitleValid}><Send className="mr-2 h-4 w-4"/>Pubblica Ora</Button>{!isTitleValid && (<div className="flex items-center text-sm text-destructive"><AlertCircle className="h-4 w-4 mr-2" /><span>Il titolo è obbligatorio.</span></div>)}</AccordionContent></AccordionItem>
            <AccordionItem value="image"><AccordionTrigger className="font-semibold">Immagine in Evidenza</AccordionTrigger><AccordionContent className="pt-4 space-y-4"><div className={`w-full aspect-video border-2 border-dashed rounded-md flex flex-col items-center justify-center text-muted-foreground transition-colors cursor-pointer ${isDragging ? 'border-primary bg-primary/10' : 'hover:border-primary/50'}`} onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }} onDragEnter={() => setIsDragging(true)} onDragLeave={() => setIsDragging(false)} onDrop={onFileDrop} onClick={() => fileInputRef.current?.click()}>{formData.featuredImage ? (<div className="relative group w-full h-full"><img src={formData.featuredImage} alt="Anteprima" className="w-full h-full object-cover rounded-md"/><Button size="icon" variant="destructive" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); handleInputChange('featuredImage', ''); }}><X className="h-4 w-4"/></Button></div>) : (<><Upload className="h-8 w-8 mb-2"/><p className="text-sm font-medium">Trascina un'immagine o clicca</p><p className="text-xs">per selezionarla dal dispositivo</p></>)}</div><input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden"/><Input placeholder="O incolla un URL immagine..." value={formData.featuredImage} onChange={e => handleInputChange('featuredImage', e.target.value)} /></AccordionContent></AccordionItem>
            <AccordionItem value="details"><AccordionTrigger className="font-semibold">Dettagli</AccordionTrigger><AccordionContent className="space-y-4 pt-4"><div><Label>Slug URL</Label><Input value={formData.slug} onChange={e => handleInputChange('slug', e.target.value)} /></div><div><Label>Excerpt (Riassunto)</Label><Textarea value={formData.excerpt} onChange={e => handleInputChange('excerpt', e.target.value)} rows={4}/></div><div className="flex items-center space-x-2 pt-2"><Switch id="isFeatured" checked={formData.isFeatured} onCheckedChange={c => handleInputChange('isFeatured', c)} /><Label htmlFor="isFeatured">Articolo in Evidenza</Label></div></AccordionContent></AccordionItem>
            <AccordionItem value="seo"><AccordionTrigger className="font-semibold">Impostazioni SEO</AccordionTrigger><AccordionContent className="space-y-4 pt-4"><div><Label htmlFor="metaTitle">Meta Title</Label><Input id="metaTitle" placeholder="Titolo SEO per i motori di ricerca..." value={formData.metaTitle} onChange={e => handleInputChange('metaTitle', e.target.value)} maxLength={60} data-testid="input-blog-meta-title" /><p className="text-sm text-muted-foreground">Lunghezza: {formData.metaTitle.length}/60 caratteri</p></div><div><Label htmlFor="metaDescription">Meta Description</Label><Textarea id="metaDescription" placeholder="Descrizione SEO per i motori di ricerca..." value={formData.metaDescription} onChange={e => handleInputChange('metaDescription', e.target.value)} maxLength={160} rows={3} data-testid="textarea-blog-meta-description" /><p className="text-sm text-muted-foreground">Lunghezza: {formData.metaDescription.length}/160 caratteri</p></div></AccordionContent></AccordionItem>
            <AccordionItem value="taxonomy"><AccordionTrigger className="font-semibold">Categoria e Tag</AccordionTrigger><AccordionContent className="space-y-4 pt-4"><div><Label>Categoria</Label><Select value={String(formData.categoryId)} onValueChange={v => handleInputChange('categoryId', v)}><SelectTrigger><SelectValue placeholder="Scegli categoria"/></SelectTrigger><SelectContent>{categories.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent></Select></div><div><Label>Tag</Label><div className="flex gap-2"><Input value={newTag} onChange={e => setNewTag(e.target.value)} onKeyPress={e => e.key === 'Enter' && setNewTag('')}/><Button onClick={() => {if(newTag) setSelectedTags([...selectedTags, newTag]); setNewTag('');}} variant="outline" size="icon"><Plus className="h-4 w-4"/></Button></div><div className="flex flex-wrap gap-1 mt-2">{selectedTags.map(t => <Badge key={t} variant="secondary">{t}<X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => setSelectedTags(selectedTags.filter(tag => tag !== t))}/></Badge>)}</div></div></AccordionContent></AccordionItem>
          </Accordion>
        </div>
      </aside>
    </div>
  );
}