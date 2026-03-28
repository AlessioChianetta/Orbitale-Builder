import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Save, Trash2, Plus, X, ArrowLeft } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { BlogRenderer } from "./BlogRenderer";
import blogTemplate from "@/templates/blog-template.json";

const SimpleListEditor = ({ value = [], onChange }: { value: string[], onChange: (newValue: string[]) => void }) => {
  const handleItemChange = (index: number, text: string) => onChange(value.map((item, i) => i === index ? text : item));
  const addItem = () => onChange([...value, ""]);
  const removeItem = (index: number) => onChange(value.filter((_, i) => i !== index));
  return (
    <div className="space-y-2">
      {value.map((item, index) => (
        <div key={index} className="flex gap-2 items-center">
          <Input value={item} onChange={(e) => handleItemChange(index, e.target.value)} className="flex-1 border-slate-200 focus:border-indigo-300 focus:ring-indigo-200" />
          <Button variant="outline" size="sm" onClick={() => removeItem(index)} className="border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addItem} className="border-slate-200 text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700">
        <Plus className="h-4 w-4 mr-2" />Aggiungi
      </Button>
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
        <div key={index} className="p-3 border border-slate-200 rounded-lg space-y-2 bg-slate-50/50">
          <div className="flex justify-between items-center">
            <Label className="font-semibold text-sm text-slate-700">{item[titleKey] || `Elemento #${index + 1}`}</Label>
            <Button variant="ghost" size="sm" onClick={() => removeItem(index)} className="text-slate-400 hover:text-red-500 h-7 w-7 p-0">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          {fields.map(field => (
            <div key={field.key}>
              {field.type === 'textarea' ? (
                <Textarea placeholder={field.placeholder} value={item[field.key]} onChange={(e) => handleItemChange(index, field.key, e.target.value)} className="border-slate-200 focus:border-indigo-300 focus:ring-indigo-200" />
              ) : (
                <Input placeholder={field.placeholder} value={item[field.key]} onChange={(e) => handleItemChange(index, field.key, e.target.value)} className="border-slate-200 focus:border-indigo-300 focus:ring-indigo-200" />
              )}
            </div>
          ))}
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addItem} className="border-slate-200 text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700">
        <Plus className="h-4 w-4 mr-2" />Aggiungi Elemento
      </Button>
    </div>
  );
};

export function BlogPageEditor({ pageToEdit, onClose }: { pageToEdit?: any; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState(blogTemplate.sections);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (pageToEdit) {
      setTitle(pageToEdit.title || "");
      setSlug(pageToEdit.slug || "");
      setMetaTitle(pageToEdit.metaTitle || "");
      setMetaDescription(pageToEdit.metaDescription || "");

      const mergedContent = JSON.parse(JSON.stringify(blogTemplate.sections));
      if (pageToEdit.content) {
        for (const sectionKey in mergedContent) {
          if (pageToEdit.content[sectionKey]) {
            mergedContent[sectionKey] = { ...mergedContent[sectionKey], ...pageToEdit.content[sectionKey] };
          }
        }
      }
      setContent(mergedContent);
    } else {
      setTitle("Blog");
      setSlug("blog");
      setMetaTitle(blogTemplate.metadata.metaTitle);
      setMetaDescription(blogTemplate.metadata.metaDescription);
      setContent(blogTemplate.sections);
    }
  }, [pageToEdit]);

  const savePageMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = pageToEdit ? `/api/pages/${pageToEdit.id}` : '/api/pages';
      const method = pageToEdit ? 'PUT' : 'POST';
      return apiRequest(url, { method, body: JSON.stringify(data) });
    },
    onSuccess: () => {
      toast({ title: "Pagina Blog salvata con successo!" });
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
      metaDescription: metaDescription.trim() || blogTemplate.metadata.metaDescription
    };

    savePageMutation.mutate(pageData);
  };

  const updateSectionElement = (sectionId: string, elementKey: string, newElementData: any) => {
    setContent(prev => {
      const newContent = JSON.parse(JSON.stringify(prev));
      newContent[sectionId].elements[elementKey] = newElementData;
      return newContent;
    });
  };

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
            className="border-slate-200 focus:border-indigo-300 focus:ring-indigo-200"
          />
        );
      
      case 'textarea':
        return (
          <Textarea
            value={element.value || ""}
            onChange={(e) => updateElement(e.target.value)}
            placeholder={`Inserisci ${elementKey}`}
            rows={3}
            className="border-slate-200 focus:border-indigo-300 focus:ring-indigo-200"
          />
        );
      
      case 'button':
        return (
          <div className="space-y-2">
            <Label className="text-xs font-medium text-slate-500">Testo del Pulsante</Label>
            <Input
              value={element.text || ""}
              onChange={(e) => updateElement({ ...element.value, text: e.target.value })}
              placeholder="Testo del pulsante"
              className="border-slate-200 focus:border-indigo-300 focus:ring-indigo-200"
            />
            <Label className="text-xs font-medium text-slate-500">Link del Pulsante</Label>
            <Input
              value={element.link || ""}
              onChange={(e) => updateElement({ ...element.value, link: e.target.value })}
              placeholder="URL del link"
              className="border-slate-200 focus:border-indigo-300 focus:ring-indigo-200"
            />
          </div>
        );
      
      case 'object':
        if (element.value && typeof element.value === 'object') {
          return (
            <div className="space-y-3">
              {Object.entries(element.value).map(([key, value]) => (
                <div key={key} className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                  <Textarea
                    value={value as string || ""}
                    onChange={(e) => updateElement({ ...element.value, [key]: e.target.value })}
                    placeholder={`Inserisci ${key}`}
                    rows={2}
                    className="border-slate-200 focus:border-indigo-300 focus:ring-indigo-200"
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
            const fields = Object.keys(element.value[0] || {}).map(key => ({
              key,
              placeholder: `Inserisci ${key}`,
              type: key.includes('description') || key.includes('content') ? 'textarea' : 'text'
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
            className="border-slate-200 focus:border-indigo-300 focus:ring-indigo-200"
          />
        );
    }
  };

  return (
    <div className="h-screen flex bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-2/5 border-r border-slate-200 flex flex-col bg-white shadow-sm">
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-slate-700">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold text-slate-900">Editor Pagina Blog</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="h-4 w-4" />
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <Tabs defaultValue="content" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2 bg-slate-100">
                <TabsTrigger value="content" className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-500">Contenuti</TabsTrigger>
                <TabsTrigger value="settings" className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-500">Impostazioni</TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="space-y-4">
                <Accordion type="single" collapsible className="space-y-1">
                  {Object.entries(content).map(([sectionId, section]: [string, any]) => (
                    <AccordionItem key={sectionId} value={sectionId} className="border border-slate-200 rounded-lg px-3 mb-2">
                      <AccordionTrigger className="text-sm font-semibold text-slate-700 hover:text-indigo-600 py-3">
                        {section.sectionName || sectionId}
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pt-2 pb-2">
                          {Object.entries(section.elements || {}).map(([elementKey, element]: [string, any]) => (
                            element.editable !== false && (
                              <div key={elementKey} className="space-y-1.5">
                                <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
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
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-slate-800">Informazioni Pagina</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Titolo</Label>
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Titolo della pagina"
                        className="border-slate-200 focus:border-indigo-300 focus:ring-indigo-200"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Slug</Label>
                      <Input
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        placeholder="URL della pagina"
                        className="border-slate-200 focus:border-indigo-300 focus:ring-indigo-200"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-slate-800">SEO</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Meta Title</Label>
                      <Input
                        value={metaTitle}
                        onChange={(e) => setMetaTitle(e.target.value)}
                        placeholder="Titolo per i motori di ricerca"
                        className="border-slate-200 focus:border-indigo-300 focus:ring-indigo-200"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Meta Description</Label>
                      <Textarea
                        value={metaDescription}
                        onChange={(e) => setMetaDescription(e.target.value)}
                        placeholder="Descrizione per i motori di ricerca"
                        rows={3}
                        className="border-slate-200 focus:border-indigo-300 focus:ring-indigo-200"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div className="border-t border-slate-200 bg-white p-4">
          <div className="flex gap-2">
            <Button 
              onClick={handleSave} 
              disabled={savePageMutation.isPending}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {savePageMutation.isPending ? "Salvataggio..." : "Salva"}
            </Button>
            <Button variant="outline" onClick={onClose} className="border-slate-200 text-slate-600 hover:text-slate-900">
              Annulla
            </Button>
          </div>
        </div>
      </div>

      <div className="w-3/5 overflow-y-auto">
        <div className="p-4">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200" style={{ transform: 'scale(0.95)', transformOrigin: 'top left', width: '105.26%' }}>
            <BlogRenderer 
              blog={{
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
  );
}
