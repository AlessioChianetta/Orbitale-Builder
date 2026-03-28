
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
import { FAQRenderer } from "./FAQRenderer";
import faqTemplate from "@/templates/faq-template.json";

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
              ) : field.type === 'checkbox' ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={item[field.key] || false}
                    onChange={(e) => handleItemChange(index, field.key, e.target.checked)}
                  />
                  <Label>{field.placeholder}</Label>
                </div>
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

export function FAQPageEditor({ pageToEdit, onClose }: { pageToEdit?: any; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState(faqTemplate.sections);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (pageToEdit) {
      setTitle(pageToEdit.title || "");
      setSlug(pageToEdit.slug || '');
      setMetaTitle(pageToEdit.metaTitle || "");
      setMetaDescription(pageToEdit.metaDescription || "");
      
      // Merge con template per garantire struttura completa
      const mergedContent = JSON.parse(JSON.stringify(faqTemplate.sections));
      if (pageToEdit.content) {
        for (const sectionKey in mergedContent) {
          if (pageToEdit.content[sectionKey]) {
            mergedContent[sectionKey] = { ...mergedContent[sectionKey], ...pageToEdit.content[sectionKey] };
          }
        }
      }
      setContent(mergedContent);
    } else {
      setContent(faqTemplate.sections);
      setMetaTitle(faqTemplate.metaTitle);
      setMetaDescription(faqTemplate.metaDescription);
      setTitle("FAQ");
      setSlug("faq");
    }
  }, [pageToEdit]);

  const mutation = useMutation({
    mutationFn: (pageData: any) => {
      const url = pageToEdit?.id ? `/api/pages/${pageToEdit.id}` : '/api/pages';
      const method = pageToEdit?.id ? 'PUT' : 'POST';
      return apiRequest(method, url, pageData).then(res => res.json());
    },
    onSuccess: (data) => {
      toast({ title: "Pagina salvata con successo!" });
      queryClient.invalidateQueries({ queryKey: ['/api/pages'] });
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
          const fields = Object.keys(sampleItem).map(key => {
            if (key === 'popular') {
              return {
                key,
                type: 'checkbox',
                placeholder: 'Popolare'
              };
            }
            return {
              key,
              type: typeof sampleItem[key] === 'string' && sampleItem[key].length > 50 ? 'textarea' : 'input',
              placeholder: `Inserisci ${key}`
            };
          });

          const titleKey = Object.keys(sampleItem).find(key => 
            key.includes('question') || key.includes('title') || key.includes('name')
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
            <h2 className="text-lg font-semibold text-slate-800">Editor FAQ</h2>
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
              <FAQRenderer faq={pageData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
