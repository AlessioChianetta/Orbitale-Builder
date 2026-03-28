import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Save, Trash2, Plus, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PageRenderer } from "./PageRenderer";

// Importa tutti i template
import homepageTemplate from "@/templates/homepage-template.json";
import chiSiamoTemplate from "@/templates/chi-siamo-template.json";
import serviziTemplate from "@/templates/servizi-template.json";
import contattiTemplate from "@/templates/contatti-template.json";
import faqTemplate from "@/templates/faq-template.json";
import progettiTemplate from "@/templates/progetti-template.json";
import blogTemplate from "@/templates/blog-template.json";

// Mapping dei template
const templates = {
  homepage: homepageTemplate,
  "chi-siamo": chiSiamoTemplate,
  servizi: serviziTemplate,
  contatti: contattiTemplate,
  faq: faqTemplate,
  progetti: progettiTemplate,
  blog: blogTemplate,
} as const;

type TemplateType = keyof typeof templates;

// --- COMPONENTI EDITOR ---

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

interface PageEditorProps {
  pageToEdit?: any;
  templateType: TemplateType;
  onClose: () => void;
}

export function PageEditor({ pageToEdit, templateType, onClose }: PageEditorProps) {
  // Validate templateType parameter
  if (!templateType || typeof templateType !== 'string') {
    console.error('Invalid templateType provided:', templateType);
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md mx-4">
          <h2 className="text-xl font-bold mb-4">Errore Parametro</h2>
          <p className="text-gray-600 mb-4">
            Parametro templateType non valido. Controlla la chiamata del componente.
          </p>
          <Button onClick={onClose}>Chiudi</Button>
        </div>
      </div>
    );
  }

  const template = templates[templateType as TemplateType];

  // Fallback per template non trovati
  if (!template) {
    console.error(`Template "${templateType}" not found in templates mapping`);
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md mx-4">
          <h2 className="text-xl font-bold mb-4">Errore Template</h2>
          <p className="text-gray-600 mb-4">
            Il template "{String(templateType)}" non è stato trovato. Controlla che sia stato importato correttamente.
          </p>
          <Button onClick={onClose}>Chiudi</Button>
        </div>
      </div>
    );
  }

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState(template.sections);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [facebookPixelEvents, setFacebookPixelEvents] = useState<{eventName: string; eventData?: any}[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!template) return; // Evita errori se template è undefined

    if (pageToEdit) {
      setTitle(pageToEdit.title || "");
      setSlug(pageToEdit.slug || '');
      setMetaTitle(pageToEdit.metaTitle || "");
      setMetaDescription(pageToEdit.metaDescription || "");
      setFacebookPixelEvents((pageToEdit as any).facebookPixelEvents || []);

      // Merge con template per garantire struttura completa
      const mergedContent = JSON.parse(JSON.stringify(template.sections));
      if (pageToEdit.content) {
        for (const sectionKey in mergedContent) {
          if (pageToEdit.content[sectionKey]) {
            mergedContent[sectionKey] = { ...mergedContent[sectionKey], ...pageToEdit.content[sectionKey] };
          }
        }
      }
      setContent(mergedContent);
    } else {
      setContent(template.sections);
      setMetaTitle((template as any).metaTitle || (template as any).metadata?.metaTitle || "");
      setMetaDescription((template as any).metaDescription || (template as any).metadata?.metaDescription || "");
      setTitle(template.templateName || "Nuova Pagina");
      setSlug(templateType);
    }
  }, [pageToEdit, template, templateType]);

  const mutation = useMutation({
    mutationFn: (pageData: any) => {
      // Check if we're editing an existing builder page or creating a new one
      const isBuilderPage = pageToEdit && typeof pageToEdit.id === 'number';
      const isNormalPage = pageToEdit && typeof pageToEdit.id === 'string';
      
      if (isBuilderPage) {
        // Update existing builder page
        const components = Object.entries(content).map(([sectionKey, section]: [string, any]) => ({
          id: `${sectionKey}-${Date.now()}`,
          type: sectionKey,
          props: section.elements || {}
        }));

        return apiRequest('PUT', `/api/builder-pages/${pageToEdit.id}`, { 
          title: pageData.title,
          slug: pageData.slug,
          description: pageData.metaDescription || '',
          components,
          metaTitle: pageData.metaTitle,
          metaDescription: pageData.metaDescription,
          ogImage: pageData.ogImage,
          isActive: true
        }).then(res => res.json());
      } else if (isNormalPage) {
        // Update existing normal page
        return apiRequest('PUT', `/api/pages/${pageToEdit.id}`, { 
          title: pageData.title,
          slug: pageData.slug,
          content,
          metaTitle: pageData.metaTitle,
          metaDescription: pageData.metaDescription,
          status: 'published'
        }).then(res => res.json());
      } else {
        // Create new builder page
        const components = Object.entries(content).map(([sectionKey, section]: [string, any]) => ({
          id: `${sectionKey}-${Date.now()}`,
          type: sectionKey,
          props: section.elements || {}
        }));

        return apiRequest('POST', '/api/builder-pages', { 
          title: pageData.title,
          slug: pageData.slug,
          description: pageData.metaDescription || '',
          components,
          metaTitle: pageData.metaTitle,
          metaDescription: pageData.metaDescription,
          ogImage: pageData.ogImage,
          isActive: true
        }).then(res => res.json());
      }
    },
    onSuccess: (data) => {
      toast({ title: "Pagina salvata con successo!" });
      
      // Invalida liste generali
      queryClient.invalidateQueries({ queryKey: ['/api/builder-pages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/pages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/available-routes'] });
      
      // Invalida sia lo slug vecchio (se in editing) che quello nuovo
      if (pageToEdit?.slug && pageToEdit.slug !== slug) {
        // Invalida il vecchio slug
        queryClient.invalidateQueries({ queryKey: ['/api/builder-pages/slug', pageToEdit.slug] });
        queryClient.invalidateQueries({ queryKey: ['/api/pages', pageToEdit.slug] });
      }
      
      // Invalida il nuovo slug
      queryClient.invalidateQueries({ queryKey: ['/api/builder-pages/slug', slug] });
      queryClient.invalidateQueries({ queryKey: ['/api/pages', slug] });
      
      onClose();
    },
    onError: (err: any) => toast({
      title: "Errore",
      description: `Salvataggio fallito: ${err.message}`,
      variant: "destructive"
    })
  });

  const handleSave = () => {
    if (!title.trim()) {
      toast({ title: "Errore", description: "Il titolo è obbligatorio", variant: "destructive" });
      return;
    }
    if (!slug.trim()) {
      toast({ title: "Errore", description: "Lo slug è obbligatorio", variant: "destructive" });
      return;
    }

    mutation.mutate({
      title: title.trim(),
      slug: slug.trim(),
      content,
      metaTitle: metaTitle.trim(),
      metaDescription: metaDescription.trim(),
      facebookPixelEvents,
      status: 'published'
    });
  };

  const updateSectionElement = (sectionId: string, elementKey: string, newElementData: any) => {
    setContent(prev => {
      const newContent = JSON.parse(JSON.stringify(prev));
      newContent[sectionId].elements[elementKey] = newElementData;
      return newContent;
    });
  };

  const renderElementEditor = (sectionId: string, elementKey: string, element: any) => {
    const currentValue = (content as any)[sectionId]?.elements?.[elementKey]?.value || element.value;

    switch (element.type) {
      case 'text':
        return (
          <Input
            value={currentValue}
            onChange={(e) => updateSectionElement(sectionId, elementKey, { ...element, value: e.target.value })}
            placeholder={`Inserisci ${elementKey}`}
          />
        );

      case 'textarea':
        return (
          <Textarea
            value={currentValue}
            onChange={(e) => updateSectionElement(sectionId, elementKey, { ...element, value: e.target.value })}
            placeholder={`Inserisci ${elementKey}`}
            rows={4}
          />
        );

      case 'button':
        return (
          <div className="space-y-2">
            <Input
              value={element.text || currentValue?.text || ''}
              onChange={(e) => updateSectionElement(sectionId, elementKey, { 
                ...element, 
                text: e.target.value,
                value: currentValue 
              })}
              placeholder="Testo del bottone"
            />
            <Input
              value={element.link || currentValue?.link || ''}
              onChange={(e) => updateSectionElement(sectionId, elementKey, { 
                ...element, 
                link: e.target.value,
                value: currentValue 
              })}
              placeholder="Link del bottone"
            />
          </div>
        );

      case 'image':
        return (
          <div className="space-y-2">
            <Input
              value={currentValue?.url || currentValue || ''}
              onChange={(e) => updateSectionElement(sectionId, elementKey, { 
                ...element, 
                value: e.target.value 
              })}
              placeholder="URL dell'immagine"
            />
            <Input
              value={currentValue?.alt || element.alt || ''}
              onChange={(e) => updateSectionElement(sectionId, elementKey, { 
                ...element, 
                alt: e.target.value,
                value: currentValue 
              })}
              placeholder="Alt text dell'immagine"
            />
          </div>
        );

      case 'array':
        // Gestione array semplici (lista di stringhe)
        if (Array.isArray(currentValue) && (currentValue.length === 0 || typeof currentValue[0] === 'string')) {
          return (
            <SimpleListEditor
              value={currentValue}
              onChange={(newValue) => updateSectionElement(sectionId, elementKey, { ...element, value: newValue })}
            />
          );
        }

        // Gestione array di oggetti (più complesso)
        if (Array.isArray(currentValue) && currentValue.length > 0 && typeof currentValue[0] === 'object') {
          const sampleItem = currentValue[0];
          const fields = Object.keys(sampleItem).map(key => ({
            key,
            type: typeof sampleItem[key] === 'string' && sampleItem[key].length > 50 ? 'textarea' : 'input',
            placeholder: `Inserisci ${key}`
          }));

          const titleKey = Object.keys(sampleItem).find(key => 
            key.includes('title') || key.includes('name') || key.includes('question')
          ) || Object.keys(sampleItem)[0];

          return (
            <ObjectListEditor
              value={currentValue}
              onChange={(newValue) => updateSectionElement(sectionId, elementKey, { ...element, value: newValue })}
              fields={fields}
              titleKey={titleKey}
              addItemTemplate={sampleItem}
            />
          );
        }

        return <div>Array vuoto - aggiungi elementi</div>;

      default:
        return (
          <Input
            value={String(currentValue)}
            onChange={(e) => updateSectionElement(sectionId, elementKey, { ...element, value: e.target.value })}
            placeholder={`Inserisci ${elementKey}`}
          />
        );
    }
  };

  const pageData = {
    title,
    slug,
    content,
    metaTitle,
    metaDescription
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[95vw] h-[95vh] flex overflow-hidden">
        {/* Editor Panel - 40% */}
        <div className="w-2/5 flex flex-col border-r">
          <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-slate-200 p-4 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-800">Editor Pagina - {template.templateName}</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-auto">
            <Tabs defaultValue="content" className="h-full">
              <TabsList className="grid w-full grid-cols-2 mx-4 mt-4">
                <TabsTrigger value="content">Contenuti</TabsTrigger>
                <TabsTrigger value="settings">Impostazioni</TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="p-4 space-y-4">
                <Accordion type="multiple" className="space-y-2">
                  {Object.entries(content).map(([sectionKey, section]: [string, any]) => (
                    <AccordionItem key={sectionKey} value={sectionKey}>
                      <AccordionTrigger className="text-left">
                        {section.sectionName || sectionKey}
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        {Object.entries(section.elements || {}).map(([elementKey, element]: [string, any]) => (
                          <div key={elementKey} className="space-y-2">
                            <Label className="text-xs text-slate-600 capitalize">
                              {elementKey.replace(/([A-Z])/g, ' $1').trim()}
                            </Label>
                            {renderElementEditor(sectionKey, elementKey, element)}
                          </div>
                        ))}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </TabsContent>

              <TabsContent value="settings" className="p-4 space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label>Titolo Pagina</Label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                  </div>
                  <div>
                    <Label>Slug</Label>
                    <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
                  </div>
                  <div>
                    <Label>Meta Title</Label>
                    <Input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} />
                  </div>
                  <div>
                    <Label>Meta Description</Label>
                    <Textarea value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} />
                  </div>
                  
                  <div className="space-y-3 pt-4 border-t">
                    <div>
                      <Label className="text-base font-semibold">Eventi Facebook Pixel</Label>
                      <p className="text-xs text-slate-600 mt-1">
                        Eventi custom che verranno tracciati quando questa pagina viene caricata
                      </p>
                    </div>
                    
                    {facebookPixelEvents.map((event, index) => (
                      <div key={index} className="flex gap-2 items-start p-3 border rounded-md">
                        <div className="flex-1 space-y-2">
                          <Input
                            placeholder="Nome evento (es: ViewContent)"
                            value={event.eventName}
                            onChange={(e) => {
                              const newEvents = [...facebookPixelEvents];
                              newEvents[index] = { ...event, eventName: e.target.value };
                              setFacebookPixelEvents(newEvents);
                            }}
                            data-testid={`input-fb-event-name-${index}`}
                          />
                          <Textarea
                            placeholder='Dati evento (JSON opzionale, es: {"value": 100, "currency": "EUR"})'
                            value={event.eventData ? JSON.stringify(event.eventData) : ''}
                            onChange={(e) => {
                              const newEvents = [...facebookPixelEvents];
                              try {
                                newEvents[index] = { 
                                  ...event, 
                                  eventData: e.target.value ? JSON.parse(e.target.value) : undefined 
                                };
                              } catch {
                                newEvents[index] = { ...event, eventData: e.target.value as any };
                              }
                              setFacebookPixelEvents(newEvents);
                            }}
                            rows={2}
                            data-testid={`textarea-fb-event-data-${index}`}
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setFacebookPixelEvents(facebookPixelEvents.filter((_, i) => i !== index));
                          }}
                          data-testid={`button-remove-fb-event-${index}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setFacebookPixelEvents([...facebookPixelEvents, { eventName: '' }]);
                        }}
                        data-testid="button-add-fb-event"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Aggiungi Evento
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (typeof window !== 'undefined' && window.fbq) {
                            window.fbq('trackCustom', 'TestEvent', {
                              source: 'Page Editor',
                              page: title || 'Unknown',
                              test: true,
                              timestamp: new Date().toISOString()
                            });
                            toast({
                              title: "Evento di test inviato",
                              description: "Controlla Facebook Events Manager → Test Events per verificare.",
                            });
                          } else {
                            toast({
                              title: "Errore",
                              description: "Facebook Pixel non inizializzato.",
                              variant: "destructive"
                            });
                          }
                        }}
                        data-testid="button-test-fb-pixel"
                      >
                        Testa Facebook Pixel
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="sticky bottom-0 z-10 bg-white/80 backdrop-blur-sm border-t border-slate-200 p-4 flex justify-between">
            <Button variant="outline" onClick={onClose}>
              Annulla
            </Button>
            <Button onClick={handleSave} disabled={mutation.isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <Save className="h-4 w-4 mr-2" />
              {mutation.isPending ? 'Salvando...' : 'Salva'}
            </Button>
          </div>
        </div>

        {/* Preview Panel - 60% */}
        <div className="w-3/5 flex flex-col bg-slate-100">
          <div className="p-4 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
            <h3 className="text-sm font-medium text-slate-600">Anteprima Live</h3>
          </div>
          <div className="flex-1 overflow-auto">
            <div className="transform scale-95 origin-top-left w-[105.26%] h-[105.26%]">
              <PageRenderer page={pageData} templateType={templateType} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}