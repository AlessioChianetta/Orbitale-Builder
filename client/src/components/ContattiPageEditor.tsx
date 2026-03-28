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
import { ContattiRenderer } from "./ContattiRenderer";
import contattiTemplate from "@/templates/contatti-template.json";

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

export function ContattiPageEditor({ pageToEdit, onClose }: { pageToEdit?: any; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState(contattiTemplate.sections);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Carica dati per editing
  useEffect(() => {
    if (pageToEdit) {
      setTitle(pageToEdit.title || "");
      setSlug(pageToEdit.slug || "");
      setMetaTitle(pageToEdit.metaTitle || "");
      setMetaDescription(pageToEdit.metaDescription || "");

      // Merge dei contenuti esistenti con il template
      const mergedContent = JSON.parse(JSON.stringify(contattiTemplate.sections));
      if (pageToEdit.content) {
        for (const sectionKey in mergedContent) {
          if (pageToEdit.content[sectionKey]) {
            mergedContent[sectionKey] = { ...mergedContent[sectionKey], ...pageToEdit.content[sectionKey] };
          }
        }
      }
      setContent(mergedContent);
    } else {
      // Nuova pagina contatti
      setTitle("Contatti");
      setSlug("contatti");
      setMetaTitle(contattiTemplate.metadata.metaTitle);
      setMetaDescription(contattiTemplate.metadata.metaDescription);
      setContent(contattiTemplate.sections);
    }
  }, [pageToEdit]);

  // Salvataggio
  const savePageMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = pageToEdit ? `/api/pages/${pageToEdit.id}` : '/api/pages';
      const method = pageToEdit ? 'PUT' : 'POST';
      return apiRequest(method, url, data);
    },
    onSuccess: () => {
      toast({ title: "Pagina Contatti salvata con successo" });
      queryClient.invalidateQueries({ queryKey: ['/api/pages'] });
      onClose();
    },
    onError: (error: any) => {
      toast({ 
        title: "Errore nel salvataggio", 
        description: error.message || "Si è verificato un errore",
        variant: "destructive" 
      });
    }
  });

  const handleSave = () => {
    if (!title.trim()) {
      toast({ 
        title: "Titolo richiesto", 
        description: "Inserisci un titolo per la pagina",
        variant: "destructive" 
      });
      return;
    }

    if (!slug.trim()) {
      toast({ 
        title: "Slug richiesto", 
        description: "Inserisci uno slug per la pagina",
        variant: "destructive" 
      });
      return;
    }

    const pageData = {
      title: title.trim(),
      slug: slug.trim(),
      content,
      status: 'published',
      metaTitle: metaTitle.trim() || title.trim(),
      metaDescription: metaDescription.trim() || contattiTemplate.metadata.metaDescription
    };

    savePageMutation.mutate(pageData);
  };

  // Funzione per aggiornare elementi
  const updateSectionElement = (sectionId: string, elementKey: string, newElementData: any) => {
    setContent(prev => {
      const newContent = JSON.parse(JSON.stringify(prev));
      newContent[sectionId].elements[elementKey] = newElementData;
      return newContent;
    });
  };

  // Render editor per ogni tipo di elemento
  const renderElementEditor = (sectionId: string, elementKey: string, element: any) => {
    const updateElement = (newValue: any) => {
      updateSectionElement(sectionId, elementKey, { ...element, value: newValue });
    };

    switch (element.type) {
      case 'text':
        return (
          <Input
            value={element.value || ""}
            onChange={(e) => updateElement(e.target.value)}
            placeholder={`Inserisci ${elementKey}`}
          />
        );
      
      case 'textarea':
        return (
          <Textarea
            value={element.value || ""}
            onChange={(e) => updateElement(e.target.value)}
            placeholder={`Inserisci ${elementKey}`}
            rows={3}
          />
        );
      
      case 'button':
        return (
          <div className="space-y-2">
            <Label>Testo del Pulsante</Label>
            <Input
              value={element.text || ""}
              onChange={(e) => updateElement({ ...element.value, text: e.target.value })}
              placeholder="Testo del pulsante"
            />
            <Label>Link del Pulsante</Label>
            <Input
              value={element.link || ""}
              onChange={(e) => updateElement({ ...element.value, link: e.target.value })}
              placeholder="URL del link"
            />
          </div>
        );
      
      case 'object':
        if (element.value && typeof element.value === 'object') {
          return (
            <div className="space-y-3">
              {Object.entries(element.value).map(([key, value]) => (
                <div key={key}>
                  <Label className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                  <Textarea
                    value={value as string || ""}
                    onChange={(e) => updateElement({ ...element.value, [key]: e.target.value })}
                    placeholder={`Inserisci ${key}`}
                    rows={2}
                  />
                </div>
              ))}
            </div>
          );
        }
        return null;
      
      case 'array':
        if (Array.isArray(element.value)) {
          if (element.value.length > 0 && typeof element.value[0] === 'object') {
            // Array di oggetti
            const fields = Object.keys(element.value[0] || {}).map(key => ({
              key,
              placeholder: `Inserisci ${key}`,
              type: key.includes('description') || key.includes('answer') ? 'textarea' : 'text'
            }));
            
            return (
              <ObjectListEditor
                value={element.value}
                onChange={updateElement}
                fields={fields}
                titleKey={fields[0]?.key || 'title'}
                addItemTemplate={element.value[0] || {}}
              />
            );
          } else {
            // Array di stringhe
            return (
              <SimpleListEditor
                value={element.value}
                onChange={updateElement}
              />
            );
          }
        }
        return null;
      
      default:
        return (
          <Input
            value={element.value || ""}
            onChange={(e) => updateElement(e.target.value)}
            placeholder={`Inserisci ${elementKey}`}
          />
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-black bg-opacity-50" onClick={onClose}>
      <div className="w-full max-w-screen-2xl mx-auto flex h-full" onClick={e => e.stopPropagation()}>
        {/* SIDEBAR EDITOR - 40% */}
        <div className="w-2/5 bg-white border-r flex flex-col">
          <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-slate-200 p-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">Editor Pagina Contatti</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

        {/* Contenuto scrollabile */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <Tabs defaultValue="content" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="content">Contenuti</TabsTrigger>
                <TabsTrigger value="settings">Impostazioni</TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="space-y-4">
                <Accordion type="single" collapsible className="space-y-2">
                  {Object.entries(content).map(([sectionId, section]: [string, any]) => (
                    <AccordionItem key={sectionId} value={sectionId}>
                      <AccordionTrigger className="text-sm font-medium">
                        {section.sectionName || sectionId}
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pt-2">
                          {Object.entries(section.elements || {}).map(([elementKey, element]: [string, any]) => (
                            element.editable !== false && (
                              <div key={elementKey} className="space-y-2">
                                <Label className="text-xs text-slate-600 uppercase tracking-wide">
                                  {elementKey.replace(/([A-Z])/g, ' $1')}
                                </Label>
                                {renderElementEditor(sectionId, elementKey, element)}
                              </div>
                            )
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </TabsContent>

              <TabsContent value="settings" className="space-y-4">
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">Informazioni Pagina</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Titolo</Label>
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Titolo della pagina"
                      />
                    </div>
                    <div>
                      <Label>Slug</Label>
                      <Input
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        placeholder="URL della pagina"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">SEO</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Meta Title</Label>
                      <Input
                        value={metaTitle}
                        onChange={(e) => setMetaTitle(e.target.value)}
                        placeholder="Titolo per i motori di ricerca"
                      />
                    </div>
                    <div>
                      <Label>Meta Description</Label>
                      <Textarea
                        value={metaDescription}
                        onChange={(e) => setMetaDescription(e.target.value)}
                        placeholder="Descrizione per i motori di ricerca"
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div className="sticky bottom-0 z-10 bg-white/80 backdrop-blur-sm border-t border-slate-200 p-4 flex justify-between">
            <Button variant="outline" onClick={onClose}>
              Annulla
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={savePageMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              {savePageMutation.isPending ? "Salvataggio..." : "Salva"}
            </Button>
        </div>
        </div>

        {/* ANTEPRIMA - 60% */}
        <div className="w-3/5 bg-slate-100 overflow-y-auto">
          <div className="p-4">
            <div className="bg-white rounded-lg shadow-sm border" style={{ transform: 'scale(0.95)', transformOrigin: 'top left', width: '105.26%' }}>
              <ContattiRenderer 
                contatti={{
                  id: 'preview',
                  title,
                  slug,
                  content,
                  metaTitle,
                  metaDescription
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}