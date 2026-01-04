import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Save, Trash2, Plus, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PatrimonioLandingRenderer } from "./PatrimonioLandingRenderer";
import patrimonioTemplate from "@/assets/templates/patrimonio-template.json";

// --- INIZIO COMPONENTI EDITOR DEDICATI ---

const SimpleListEditor = ({ value = [], onChange }: { value: string[], onChange: (newValue: string[]) => void }) => {
  const handleItemChange = (index: number, text: string) => onChange(value.map((item, i) => i === index ? text : item));
  const addItem = () => onChange([...value, ""]);
  const removeItem = (index: number) => onChange(value.filter((_, i) => i !== index));
  return (
    <div className="space-y-2">
      {value.map((item, index) => (
        <div key={index} className="flex gap-2 items-center">
          <Input value={item} onChange={(e) => handleItemChange(index, e.target.value)} className="flex-1" />
          <Button variant="outline" size="sm" onClick={() => removeItem(index)}><Trash2 className="h-4 w-4" /></Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addItem}><Plus className="h-4 w-4 mr-2" />Aggiungi</Button>
    </div>
  );
};

const TitledListEditor = ({ value = { title: '', items: [] }, onChange }: { value: any, onChange: (newValue: any) => void }) => {
    const handleTitleChange = (newTitle: string) => onChange({ ...value, title: newTitle });
    const handleItemsChange = (newItems: string[]) => onChange({ ...value, items: newItems });
    return (
        <div className="space-y-2">
            <Input placeholder="Titolo della sezione" value={value.title} onChange={e => handleTitleChange(e.target.value)} />
            <div className="pl-4 border-l-2">
                <Label className="text-sm text-muted-foreground">Elementi della lista</Label>
                <SimpleListEditor value={value.items} onChange={handleItemsChange} />
            </div>
        </div>
    );
};

const ObjectListEditor = ({ value = [], onChange, fields, titleKey, addItemTemplate }: { value: any[], onChange: (newValue: any[]) => void, fields: any[], titleKey: string, addItemTemplate: any }) => {
    const handleItemChange = (index: number, field: string, text: string | boolean | string[]) => {
        const newArray = JSON.parse(JSON.stringify(value));
        newArray[index][field] = text;
        onChange(newArray);
    };
    const addItem = () => onChange([...value, addItemTemplate]);
    const removeItem = (index: number) => onChange(value.filter((_, i) => i !== index));

    return (
        <div className="space-y-3">
            {value.map((item, index) => (
                <div key={index} className="p-3 border rounded-md space-y-2 bg-slate-50">
                    <div className="flex justify-between items-center">
                        <Label className="font-semibold">{item[titleKey] || `Elemento #${index + 1}`}</Label>
                        <Button variant="ghost" size="sm" onClick={() => removeItem(index)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    </div>
                    {fields.map(field => (
                        <div key={field.key}>
                            {field.type === 'textarea' ? (
                                <Textarea placeholder={field.placeholder} value={item[field.key]} onChange={(e) => handleItemChange(index, field.key, e.target.value)} />
                            ) : field.type === 'switch' ? (
                                <div className="flex items-center space-x-2"><Switch checked={!!item[field.key]} onCheckedChange={(checked) => handleItemChange(index, field.key, checked)} /><Label>{field.placeholder}</Label></div>
                            ) : field.type === 'list' ? (
                                <div><Label>{field.placeholder}</Label><SimpleListEditor value={item[field.key] || []} onChange={(newItems) => handleItemChange(index, field.key, newItems)} /></div>
                            ) : (
                                <Input placeholder={field.placeholder} value={item[field.key]} onChange={(e) => handleItemChange(index, field.key, e.target.value)} />
                            )}
                        </div>
                    ))}
                </div>
            ))}
            <Button variant="outline" size="sm" onClick={addItem}><Plus className="h-4 w-4 mr-2" />Aggiungi Elemento</Button>
        </div>
    );
};

// ***** COMPONENTE MANCANTE REINSERITO QUI *****
const ForkPathEditor = ({ value = {}, onChange }: { value: any, onChange: (newValue: any) => void }) => {
    const handleFieldChange = (field: string, text: string) => {
        onChange({ ...value, [field]: text });
    };

    const listKey = value.consequences ? 'consequences' : 'benefits';
    const listTitle = value.consequences ? 'Conseguenze' : 'Benefici';

    const handleListChange = (newList: any[]) => {
        onChange({ ...value, [listKey]: newList });
    };

    return (
        <div className="space-y-3">
            <Input placeholder="Titolo (es. ❌ STRADA #1...)" value={value.title || ''} onChange={e => handleFieldChange('title', e.target.value)} />
            <Input placeholder="Sottotitolo (es. Continuare Come Sempre)" value={value.subtitle || ''} onChange={e => handleFieldChange('subtitle', e.target.value)} />
            <Textarea placeholder="Descrizione" value={value.description || ''} onChange={e => handleFieldChange('description', e.target.value)} />

            <div className="pt-2">
                <Label className="font-semibold">{listTitle}</Label>
                <ObjectListEditor
                    value={value[listKey] || []}
                    onChange={handleListChange}
                    fields={[ { key: 'title', placeholder: 'Titolo' }, { key: 'description', placeholder: 'Descrizione' } ]}
                    titleKey="title"
                    addItemTemplate={{ title: "Nuovo Elemento", description: "" }}
                />
            </div>
            <Input placeholder="Pensiero Finale (es. 💭 'Tra un anno sarò...')" value={value.finalThought || ''} onChange={e => handleFieldChange('finalThought', e.target.value)} />
        </div>
    );
};

// --- FINE COMPONENTI EDITOR ---

export function LandingPageEditor({ landingPageToEdit, onClose }: { landingPageToEdit?: any; onClose: () => void; }) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [sections, setSections] = useState(patrimonioTemplate.sections);
  const [metadata, setMetadata] = useState(patrimonioTemplate.metadata);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (landingPageToEdit) {
      setTitle(landingPageToEdit.title || "");
      setSlug(landingPageToEdit.slug || "");
      setDescription(landingPageToEdit.description || "");
      setIsActive(landingPageToEdit.isActive !== undefined ? landingPageToEdit.isActive : true);
      const mergedSections = JSON.parse(JSON.stringify(patrimonioTemplate.sections));
      for (const sectionKey in mergedSections) {
          if (landingPageToEdit.sections?.[sectionKey]) {
              mergedSections[sectionKey] = { ...mergedSections[sectionKey], ...landingPageToEdit.sections[sectionKey] };
          }
      }
      setSections(mergedSections);
      setMetadata(prev => ({ ...prev, metaTitle: landingPageToEdit.metaTitle || '', metaDescription: landingPageToEdit.metaDescription || '', ogImage: landingPageToEdit.ogImage || '' }));
    } else {
      setSections(patrimonioTemplate.sections);
      setMetadata(patrimonioTemplate.metadata);
    }
  }, [landingPageToEdit]);

  const mutation = useMutation({
    mutationFn: (pageData: any) => landingPageToEdit?.id ? apiRequest("PUT", `/api/landing-pages/${landingPageToEdit.id}`, pageData).then(res => res.json()) : apiRequest("POST", "/api/landing-pages", pageData).then(res => res.json()),
    onSuccess: () => { toast({ title: "Salvataggio riuscito!" }); queryClient.invalidateQueries({ queryKey: ['/api/landing-pages'] }); onClose(); },
    onError: (err: any) => toast({ title: "Errore", description: `Salvataggio fallito: ${err.message}`, variant: "destructive" })
  });

  const handleSave = () => {
    const pageData = { title, slug, description, isActive, sections, metaTitle: metadata.metaTitle, metaDescription: metadata.metaDescription, ogImage: metadata.ogImage };
    mutation.mutate(pageData);
  };

  const updateSectionElement = (sectionId: string, elementKey: string, newElementData: any) => {
    setSections(prev => {
        const newSections = JSON.parse(JSON.stringify(prev));
        newSections[sectionId].elements[elementKey] = newElementData;
        return newSections;
    });
  };

  const renderElementEditor = (sectionId: string, elementKey: string, element: any) => {
    if(element.type === 'object') {
        if((sectionId === 'filter' && (elementKey === 'whatWeDo' || elementKey === 'whatWeDontDo'))) {
            return <TitledListEditor value={element.value} onChange={newValue => updateSectionElement(sectionId, elementKey, {...element, value: newValue})} />;
        }
        if(sectionId === 'fork') {
            return <ForkPathEditor value={element.value} onChange={newValue => updateSectionElement(sectionId, elementKey, {...element, value: newValue})} />;
        }
    }

    if(element.type === 'array') {
        if(elementKey === 'navButtons') return <ObjectListEditor value={element.value} onChange={newValue => updateSectionElement(sectionId, elementKey, {...element, value: newValue})} fields={[{key: 'text', placeholder: 'Testo'}, {key: 'link', placeholder: 'Link'}, {key: 'variant', placeholder: 'Variant (default/outline)'}]} titleKey='text' addItemTemplate={{text: 'Nuovo Link', link: '#', variant: 'outline'}} />;
        if(elementKey === 'problemsList') return <ObjectListEditor value={element.value} onChange={newValue => updateSectionElement(sectionId, elementKey, {...element, value: newValue})} fields={[{key: 'title', placeholder: 'Titolo'}, {key: 'description', placeholder: 'Descrizione', type: 'textarea'}, {key: 'icon', placeholder: 'Icona'}]} titleKey='title' addItemTemplate={{title: 'Nuovo Problema', description: '', icon: 'AlertTriangle'}} />;
        if(elementKey === 'phases') return <ObjectListEditor value={element.value} onChange={newValue => updateSectionElement(sectionId, elementKey, {...element, value: newValue})} fields={[{key: 'phase', placeholder: 'Fase'}, {key: 'title', placeholder: 'Titolo'}, {key: 'description', placeholder: 'Descrizione', type: 'textarea'}, {key: 'transformation', placeholder: 'Trasformazione'}, {key: 'icon', placeholder: 'Icona'}, {key: 'color', placeholder: 'Colore (es. from-red-500...)'}]} titleKey='title' addItemTemplate={{phase: 'Nuova Fase', title: '', description: '', transformation: '', icon: 'Shield', color: ''}} />;
        if(elementKey === 'components') return <ObjectListEditor value={element.value} onChange={newValue => updateSectionElement(sectionId, elementKey, {...element, value: newValue})} fields={[{key: 'title', placeholder: 'Titolo'}, {key: 'value', placeholder: 'Valore'}, {key: 'description', placeholder: 'Descrizione', type: 'textarea'}, {key: 'icon', placeholder: 'Icona'}]} titleKey='title' addItemTemplate={{title: 'Nuovo Componente', value: '0€', description: '', icon: 'Calculator'}} />;
        if(elementKey === 'plans') return <ObjectListEditor value={element.value} onChange={newValue => updateSectionElement(sectionId, elementKey, {...element, value: newValue})} fields={[{key: 'name', placeholder: 'Nome Piano'}, {key: 'price', placeholder: 'Prezzo'}, {key: 'features', placeholder: 'Funzionalità', type: 'list'}, {key: 'ideal', placeholder: 'Ideale per...', type: 'textarea'}, {key: 'buttonText', placeholder: 'Testo Bottone'}, {key: 'buttonLink', placeholder: 'Link Bottone'}, {key: 'recommended', placeholder: 'Consigliato', type: 'switch'}]} titleKey='name' addItemTemplate={{name: 'Nuovo Piano', price: '0€ / mese', features: [], ideal: '', buttonText: 'Inizia Ora', buttonLink: '#', recommended: false}} />;
        return <SimpleListEditor value={element.value} onChange={newValue => updateSectionElement(sectionId, elementKey, {...element, value: newValue})} />;
    }

    switch (element.type) {
      case 'text':
        return <div className="space-y-1"><Label>{elementKey}</Label>{String(element.value).length > 100 ? <Textarea value={element.value} onChange={(e) => updateSectionElement(sectionId, elementKey, {...element, value: e.target.value})} /> : <Input value={element.value} onChange={(e) => updateSectionElement(sectionId, elementKey, {...element, value: e.target.value})} />}</div>;
      case 'button':
         return <div className="space-y-1"><Label>{elementKey}</Label><div className="flex gap-2"><Input placeholder="Testo bottone" value={element.text || ''} onChange={e => updateSectionElement(sectionId, elementKey, {...element, text: e.target.value})} /><Input placeholder="Link" value={element.link || ''} onChange={e => updateSectionElement(sectionId, elementKey, {...element, link: e.target.value})} /></div></div>;
      case 'link':
         return <div className="space-y-1"><Label>{elementKey}</Label><div className="flex gap-2"><Input placeholder="Testo del link" value={element.text || ''} onChange={e => updateSectionElement(sectionId, elementKey, {...element, text: e.target.value})} /><Input placeholder="URL" value={element.url || ''} onChange={e => updateSectionElement(sectionId, elementKey, {...element, url: e.target.value})} /></div></div>;
      case 'image':
         return <div className="space-y-1"><Label>{elementKey}</Label><Input placeholder="URL Immagine" value={element.value || ''} onChange={e => updateSectionElement(sectionId, elementKey, {...element, value: e.target.value})} /><Input placeholder="Testo alternativo (alt)" value={element.alt || ''} onChange={e => updateSectionElement(sectionId, elementKey, {...element, alt: e.target.value})} />{element.value && <img src={element.value} alt={element.alt} className="w-32 mt-2 rounded border"/>}</div>;
      default:
        return <p className="text-sm text-red-500">Editor non implementato per il tipo: {element.type}</p>;
    }
  };

  const previewPageData = { id: landingPageToEdit?.id || 0, title, slug, description, isActive, sections, metaTitle: metadata.metaTitle, metaDescription: metadata.metaDescription, ogImage: metadata.ogImage };

  return (
    <div className="fixed inset-0 z-50 flex bg-black bg-opacity-50" onClick={onClose}>
      <div className="w-full max-w-screen-2xl mx-auto flex h-full" onClick={e => e.stopPropagation()}>
        <div className="w-2/5 bg-background border-r overflow-y-auto flex flex-col">
          <div className="sticky top-0 bg-background border-b p-4 flex justify-between items-center"><h2 className="text-lg font-semibold">{landingPageToEdit ? 'Modifica Landing Page' : 'Nuova Pagina'}</h2><Button variant="ghost" size="sm" onClick={onClose}><X className="h-4 w-4" /></Button></div>
          <div className="p-4 flex-grow">
            <Tabs defaultValue="content">
              <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="content">Contenuti</TabsTrigger><TabsTrigger value="settings">Impostazioni</TabsTrigger></TabsList>
              <TabsContent value="content" className="pt-4">
                 <Accordion type="multiple" className="w-full">
                    {Object.entries(sections).map(([sectionId, section]: [string, any]) => (
                      <AccordionItem key={sectionId} value={sectionId}>
                        <AccordionTrigger>{section.sectionName || sectionId}</AccordionTrigger>
                        <AccordionContent className="space-y-4">{Object.entries(section.elements).map(([elementKey, element]: [string, any]) => ( element.editable && <div key={elementKey} className="p-3 border rounded-lg bg-white shadow-sm">{renderElementEditor(sectionId, elementKey, element)}</div> ))}</AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
              </TabsContent>
              <TabsContent value="settings" className="space-y-4 pt-4">
                <Card><CardHeader><CardTitle>Informazioni Base</CardTitle></CardHeader><CardContent className="space-y-4"><Input placeholder="Titolo" value={title} onChange={e => setTitle(e.target.value)} /><Input placeholder="Slug" value={slug} onChange={e => setSlug(e.target.value)} /><Textarea placeholder="Descrizione interna" value={description} onChange={e => setDescription(e.target.value)} /><div className="flex items-center space-x-2"><Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} /><Label htmlFor="isActive">Pagina Attiva</Label></div></CardContent></Card>
                <Card><CardHeader><CardTitle>SEO</CardTitle></CardHeader><CardContent className="space-y-4"><Input placeholder="Meta Title" value={metadata.metaTitle} onChange={e => setMetadata(p => ({...p, metaTitle: e.target.value}))} /><Textarea placeholder="Meta Description" value={metadata.metaDescription} onChange={e => setMetadata(p => ({...p, metaDescription: e.target.value}))} /></CardContent></Card>
              </TabsContent>
            </Tabs>
          </div>
          <div className="sticky bottom-0 bg-background border-t p-4 flex justify-between">
            <Button variant="outline" onClick={onClose}>Annulla</Button>
            <Button onClick={handleSave} disabled={mutation.isPending}><Save className="h-4 w-4 mr-2" />{mutation.isPending ? "Salvataggio..." : "Salva"}</Button>
          </div>
        </div>
        <div className="w-3/5 bg-slate-200 overflow-y-auto p-4">
           <div className="bg-white rounded-lg shadow-xl mx-auto max-w-screen-lg transform scale-95 origin-top"><PatrimonioLandingRenderer landingPage={previewPageData} /></div>
        </div>
      </div>
    </div>
  );
}