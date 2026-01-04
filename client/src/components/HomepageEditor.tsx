
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Save, Trash2, Plus, X, Palette, Type, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline, RotateCcw } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { HomepageRenderer } from "./HomepageRenderer";
import homepageTemplate from "@/templates/homepage-template.json";

// --- COMPONENTI EDITOR ---

// Color Picker Component
const ColorPicker = ({ value, onChange, label }: { value: string, onChange: (color: string) => void, label: string }) => {
  const presetColors = [
    '#000000', '#374151', '#6B7280', '#9CA3AF', '#D1D5DB', '#F3F4F6', '#FFFFFF',
    '#DC2626', '#EF4444', '#F87171', '#FCA5A5', '#FEE2E2',
    '#D97706', '#F59E0B', '#FBBF24', '#FCD34D', '#FEF3C7',
    '#059669', '#10B981', '#34D399', '#6EE7B7', '#D1FAE5',
    '#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#DBEAFE',
    '#7C3AED', '#8B5CF6', '#A78BFA', '#C4B5FD', '#EDE9FE',
    '#DB2777', '#EC4899', '#F472B6', '#F9A8D4', '#FCE7F3'
  ];
  
  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium">{label}</Label>
      <div className="flex items-center gap-2">
        <input 
          type="color" 
          value={value || '#000000'} 
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded border cursor-pointer"
        />
        <Input 
          value={value || ''} 
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="flex-1 text-xs"
        />
      </div>
      <div className="grid grid-cols-7 gap-1">
        {presetColors.map(color => (
          <button
            key={color}
            onClick={() => onChange(color)}
            className="w-6 h-6 rounded border-2 hover:border-gray-400"
            style={{ backgroundColor: color, borderColor: value === color ? '#3B82F6' : '#E5E7EB' }}
          />
        ))}
      </div>
    </div>
  );
};

// Font Family Selector
const FontFamilySelector = ({ value, onChange }: { value: string, onChange: (font: string) => void }) => {
  const fonts = [
    { value: 'inherit', label: 'Default' },
    { value: 'Inter, sans-serif', label: 'Inter' },
    { value: 'Roboto, sans-serif', label: 'Roboto' },
    { value: 'Open Sans, sans-serif', label: 'Open Sans' },
    { value: 'Lato, sans-serif', label: 'Lato' },
    { value: 'Montserrat, sans-serif', label: 'Montserrat' },
    { value: 'Poppins, sans-serif', label: 'Poppins' },
    { value: 'Playfair Display, serif', label: 'Playfair Display' },
    { value: 'Georgia, serif', label: 'Georgia' },
    { value: 'JetBrains Mono, monospace', label: 'JetBrains Mono' }
  ];
  
  return (
    <div className="space-y-1">
      <Label className="text-xs font-medium">Font Family</Label>
      <Select value={value || 'inherit'} onValueChange={onChange}>
        <SelectTrigger className="h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {fonts.map(font => (
            <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>
              {font.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

// Typography Controls
const TypographyControls = ({ 
  fontSize, onFontSizeChange,
  fontWeight, onFontWeightChange,
  lineHeight, onLineHeightChange,
  letterSpacing, onLetterSpacingChange,
  textAlign, onTextAlignChange
}: {
  fontSize?: number, onFontSizeChange: (size: number) => void,
  fontWeight?: string, onFontWeightChange: (weight: string) => void,
  lineHeight?: number, onLineHeightChange: (height: number) => void,
  letterSpacing?: number, onLetterSpacingChange: (spacing: number) => void,
  textAlign?: string, onTextAlignChange: (align: string) => void
}) => {
  const weights = [
    { value: 'normal', label: 'Normal' },
    { value: 'medium', label: 'Medium' },
    { value: 'semibold', label: 'Semi Bold' },
    { value: 'bold', label: 'Bold' },
    { value: 'extrabold', label: 'Extra Bold' }
  ];
  
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs font-medium">Font Size (px)</Label>
          <div className="flex items-center gap-2">
            <Slider 
              value={[fontSize || 16]} 
              onValueChange={([value]) => onFontSizeChange(value)}
              min={8} max={72} step={1}
              className="flex-1"
            />
            <span className="text-xs w-8">{fontSize || 16}</span>
          </div>
        </div>
        
        <div>
          <Label className="text-xs font-medium">Font Weight</Label>
          <Select value={fontWeight || 'normal'} onValueChange={onFontWeightChange}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {weights.map(weight => (
                <SelectItem key={weight.value} value={weight.value}>
                  {weight.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs font-medium">Line Height</Label>
          <div className="flex items-center gap-2">
            <Slider 
              value={[lineHeight || 1.5]} 
              onValueChange={([value]) => onLineHeightChange(value)}
              min={1} max={3} step={0.1}
              className="flex-1"
            />
            <span className="text-xs w-8">{(lineHeight || 1.5).toFixed(1)}</span>
          </div>
        </div>
        
        <div>
          <Label className="text-xs font-medium">Letter Spacing</Label>
          <div className="flex items-center gap-2">
            <Slider 
              value={[letterSpacing || 0]} 
              onValueChange={([value]) => onLetterSpacingChange(value)}
              min={-2} max={4} step={0.1}
              className="flex-1"
            />
            <span className="text-xs w-8">{(letterSpacing || 0).toFixed(1)}</span>
          </div>
        </div>
      </div>
      
      <div>
        <Label className="text-xs font-medium">Text Align</Label>
        <div className="flex gap-1 mt-1">
          {[
            { value: 'left', icon: AlignLeft },
            { value: 'center', icon: AlignCenter },
            { value: 'right', icon: AlignRight }
          ].map(({ value, icon: Icon }) => (
            <Button
              key={value}
              variant={textAlign === value ? 'default' : 'outline'}
              size="sm"
              onClick={() => onTextAlignChange(value)}
              className="h-8 w-8 p-0"
            >
              <Icon className="h-3 w-3" />
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

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

export function HomepageEditor({ pageToEdit, onClose }: { pageToEdit?: any; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState(homepageTemplate.sections);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (pageToEdit) {
      setTitle(pageToEdit.title || "");
      setSlug(pageToEdit.slug || ''); // Mantieni lo slug esistente o vuoto se nuovo
      setMetaTitle(pageToEdit.metaTitle || "");
      setMetaDescription(pageToEdit.metaDescription || "");
      
      // Merge con template per garantire struttura completa
      const mergedContent = JSON.parse(JSON.stringify(homepageTemplate.sections));
      if (pageToEdit.content) {
        for (const sectionKey in mergedContent) {
          if (pageToEdit.content[sectionKey]) {
            mergedContent[sectionKey] = { ...mergedContent[sectionKey], ...pageToEdit.content[sectionKey] };
          }
        }
      }
      setContent(mergedContent);
    } else {
      setContent(homepageTemplate.sections);
      setMetaTitle(homepageTemplate.metadata.metaTitle);
      setMetaDescription(homepageTemplate.metadata.metaDescription);
      setTitle("Homepage Personalizzata");
      setSlug("home"); // Tutte le homepage personalizzate hanno slug "home"
    }
  }, [pageToEdit]);

  const mutation = useMutation({
    mutationFn: (pageData: any) => {
      // Per homepage personalizzate, usa sempre le route normali delle pagine
      // Non modificare mai la homepage attiva (slug='home') direttamente
      const url = pageToEdit?.id ? `/api/pages/${pageToEdit.id}` : '/api/pages';
      const method = pageToEdit?.id ? 'PUT' : 'POST';
      return apiRequest(method, url, { ...pageData, isHomepageCustom: true }).then(res => res.json());
    },
    onSuccess: (data) => {
      toast({ title: "Homepage personalizzata salvata con successo!" });
      queryClient.invalidateQueries({ queryKey: ['/api/pages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/pages/home'] });
      onClose();
    },
    onError: (err: any) => toast({
      title: "Errore",
      description: `Salvataggio fallito: ${err.message}`,
      variant: "destructive"
    })
  });

  const handleSave = () => {
    if (!title) {
      toast({ title: "Errore", description: "Il titolo è obbligatorio", variant: "destructive" });
      return;
    }
    
    // Per le homepage personalizzate, usa sempre slug unico nel database 
    // ma mostrato come "home" nell'interfaccia
    let finalSlug = slug;
    if (!pageToEdit) {
      // Nuova homepage: crea slug unico per evitare conflitti DB
      finalSlug = `home-${Date.now()}`;
    }
    
    const pageData = { 
      title, 
      slug: finalSlug,
      content, 
      metaTitle, 
      metaDescription,
      isHomepageCustom: true // Flag per identificare homepage personalizzata
    };
    mutation.mutate(pageData);
  };

  const updateSectionElement = (sectionId: string, elementKey: string, newElementData: any) => {
    setContent(prev => {
      const newContent = JSON.parse(JSON.stringify(prev));
      newContent[sectionId].elements[elementKey] = newElementData;
      return newContent;
    });
  };
  
  // Funzione per resettare gli stili di un elemento
  const resetElementStyles = (sectionId: string, elementKey: string) => {
    setContent(prev => {
      const newContent = JSON.parse(JSON.stringify(prev));
      const element = newContent[sectionId].elements[elementKey];
      // Rimuovi tutti gli stili personalizzati mantenendo solo i dati base
      delete element.style;
      return newContent;
    });
  };
  
  // Funzione per resettare TUTTI gli stili di TUTTI gli elementi
  const resetAllStyles = () => {
    setContent(prev => {
      const newContent = JSON.parse(JSON.stringify(prev));
      
      // Itera su tutte le sezioni
      Object.keys(newContent).forEach(sectionId => {
        const section = newContent[sectionId];
        if (section.elements) {
          // Itera su tutti gli elementi della sezione
          Object.keys(section.elements).forEach(elementKey => {
            const element = section.elements[elementKey];
            // Rimuovi tutti gli stili personalizzati
            if (element.style) {
              delete element.style;
            }
          });
        }
      });
      
      return newContent;
    });
    
    toast({ 
      title: "Stili resettati", 
      description: "Tutti gli stili personalizzati sono stati rimossi" 
    });
  };
  
  // Funzione per inizializzare solo l'oggetto style se non esiste, senza forzare valori
  const initializeElementStyles = (element: any) => {
    if (!element.style) {
      element.style = {};
    }
    return element;
  };

  const renderElementEditor = (sectionId: string, elementKey: string, element: any) => {
    // Inizializza gli stili se non esistono per elementi che supportano lo styling
    if (['text', 'button', 'image'].includes(element.type)) {
      element = initializeElementStyles(element);
    }
    
    if (element.type === 'array') {
      if (elementKey === 'clientLogos') {
        return <ObjectListEditor 
          value={element.value} 
          onChange={newValue => updateSectionElement(sectionId, elementKey, {...element, value: newValue})} 
          fields={[{key: 'name', placeholder: 'Nome Cliente'}, {key: 'logo', placeholder: 'URL Logo'}]} 
          titleKey='name' 
          addItemTemplate={{name: 'Nuovo Cliente', logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='60'%3E%3Crect fill='%23e2e8f0' width='160' height='60'/%3E%3Ctext x='50%25' y='50%25' font-size='12' fill='%2364748b' text-anchor='middle' dy='.3em'%3ECliente%3C/text%3E%3C/svg%3E"}} 
        />;
      }
      if (elementKey === 'problems') {
        return <ObjectListEditor 
          value={element.value} 
          onChange={newValue => updateSectionElement(sectionId, elementKey, {...element, value: newValue})} 
          fields={[
            {key: 'icon', placeholder: 'Icona (es. XCircle)'},
            {key: 'title', placeholder: 'Titolo'},
            {key: 'description', placeholder: 'Descrizione', type: 'textarea'},
            {key: 'color', placeholder: 'Colore (red/amber/slate)'}
          ]} 
          titleKey='title' 
          addItemTemplate={{icon: 'XCircle', title: 'Nuovo Problema', description: '', color: 'red'}} 
        />;
      }
      if (elementKey === 'testimonials') {
        return <ObjectListEditor 
          value={element.value} 
          onChange={newValue => updateSectionElement(sectionId, elementKey, {...element, value: newValue})} 
          fields={[
            {key: 'name', placeholder: 'Nome'},
            {key: 'role', placeholder: 'Ruolo'},
            {key: 'content', placeholder: 'Contenuto testimonianza', type: 'textarea'},
            {key: 'rating', placeholder: 'Rating (1-5)'},
            {key: 'avatar', placeholder: 'Avatar (iniziali)'}
          ]} 
          titleKey='name' 
          addItemTemplate={{name: 'Nuovo Cliente', role: '', content: '', rating: 5, avatar: 'NC'}} 
        />;
      }
      return <SimpleListEditor value={element.value} onChange={newValue => updateSectionElement(sectionId, elementKey, {...element, value: newValue})} />;
    }

    switch (element.type) {
      case 'text':
        return (
          <div className="space-y-3">
            <Label className="text-sm font-semibold">{elementKey}</Label>
            
            {/* Text Content */}
            <div>
              <Label className="text-xs font-medium">Contenuto</Label>
              {String(element.value).length > 100 ? 
                <Textarea 
                  value={element.value} 
                  onChange={(e) => updateSectionElement(sectionId, elementKey, {...element, value: e.target.value})} 
                  className="mt-1"
                /> :
                <Input 
                  value={element.value} 
                  onChange={(e) => updateSectionElement(sectionId, elementKey, {...element, value: e.target.value})} 
                  className="mt-1"
                />
              }
            </div>
            
            {/* Style Controls */}
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="styling">
                <AccordionTrigger className="text-xs py-2">
                  <div className="flex items-center gap-2">
                    <Palette className="h-3 w-3" />
                    Stile e Formattazione
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  {/* Reset Button */}
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => resetElementStyles(sectionId, elementKey)}
                      className="h-8 px-3 text-xs"
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Reset Stili
                    </Button>
                  </div>
                  
                  {/* Colors */}
                  <div className="grid grid-cols-1 gap-3">
                    <ColorPicker 
                      value={element.style?.color || '#000000'}
                      onChange={(color) => updateSectionElement(sectionId, elementKey, {
                        ...element, 
                        style: { ...element.style, color }
                      })}
                      label="Colore Testo"
                    />
                    
                    <ColorPicker 
                      value={element.style?.backgroundColor || 'transparent'}
                      onChange={(backgroundColor) => updateSectionElement(sectionId, elementKey, {
                        ...element, 
                        style: { ...element.style, backgroundColor }
                      })}
                      label="Colore Sfondo"
                    />
                  </div>
                  
                  {/* Typography */}
                  <div className="space-y-3">
                    <FontFamilySelector 
                      value={element.style?.fontFamily || 'inherit'}
                      onChange={(fontFamily) => updateSectionElement(sectionId, elementKey, {
                        ...element, 
                        style: { ...element.style, fontFamily }
                      })}
                    />
                    
                    <TypographyControls 
                      fontSize={element.style?.fontSize || 16}
                      onFontSizeChange={(fontSize) => updateSectionElement(sectionId, elementKey, {
                        ...element, 
                        style: { ...element.style, fontSize }
                      })}
                      fontWeight={element.style?.fontWeight || 'normal'}
                      onFontWeightChange={(fontWeight) => updateSectionElement(sectionId, elementKey, {
                        ...element, 
                        style: { ...element.style, fontWeight }
                      })}
                      lineHeight={element.style?.lineHeight || 1.5}
                      onLineHeightChange={(lineHeight) => updateSectionElement(sectionId, elementKey, {
                        ...element, 
                        style: { ...element.style, lineHeight }
                      })}
                      letterSpacing={element.style?.letterSpacing || 0}
                      onLetterSpacingChange={(letterSpacing) => updateSectionElement(sectionId, elementKey, {
                        ...element, 
                        style: { ...element.style, letterSpacing }
                      })}
                      textAlign={element.style?.textAlign || 'left'}
                      onTextAlignChange={(textAlign) => updateSectionElement(sectionId, elementKey, {
                        ...element, 
                        style: { ...element.style, textAlign }
                      })}
                    />
                  </div>
                  
                  {/* Spacing & Layout */}
                  <div className="space-y-3">
                    <Label className="text-xs font-medium">Spaziatura</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Padding (px)</Label>
                        <div className="flex items-center gap-2">
                          <Slider 
                            value={[element.style?.padding || 0]} 
                            onValueChange={([padding]) => updateSectionElement(sectionId, elementKey, {
                              ...element, 
                              style: { ...element.style, padding }
                            })}
                            min={0} max={50} step={1}
                            className="flex-1"
                          />
                          <span className="text-xs w-8">{element.style?.padding || 0}</span>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-xs">Margin (px)</Label>
                        <div className="flex items-center gap-2">
                          <Slider 
                            value={[element.style?.margin || 0]} 
                            onValueChange={([margin]) => updateSectionElement(sectionId, elementKey, {
                              ...element, 
                              style: { ...element.style, margin }
                            })}
                            min={0} max={50} step={1}
                            className="flex-1"
                          />
                          <span className="text-xs w-8">{element.style?.margin || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Border & Effects */}
                  <div className="space-y-3">
                    <Label className="text-xs font-medium">Bordi e Effetti</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Border Radius (px)</Label>
                        <div className="flex items-center gap-2">
                          <Slider 
                            value={[element.style?.borderRadius || 0]} 
                            onValueChange={([borderRadius]) => updateSectionElement(sectionId, elementKey, {
                              ...element, 
                              style: { ...element.style, borderRadius }
                            })}
                            min={0} max={50} step={1}
                            className="flex-1"
                          />
                          <span className="text-xs w-8">{element.style?.borderRadius || 0}</span>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-xs">Border Width (px)</Label>
                        <div className="flex items-center gap-2">
                          <Slider 
                            value={[element.style?.borderWidth || 0]} 
                            onValueChange={([borderWidth]) => updateSectionElement(sectionId, elementKey, {
                              ...element, 
                              style: { ...element.style, borderWidth }
                            })}
                            min={0} max={10} step={1}
                            className="flex-1"
                          />
                          <span className="text-xs w-8">{element.style?.borderWidth || 0}</span>
                        </div>
                      </div>
                    </div>
                    
                    {element.style?.borderWidth > 0 && (
                      <ColorPicker 
                        value={element.style?.borderColor || '#E5E7EB'}
                        onChange={(borderColor) => updateSectionElement(sectionId, elementKey, {
                          ...element, 
                          style: { ...element.style, borderColor }
                        })}
                        label="Colore Bordo"
                      />
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        );
      case 'button':
        return (
          <div className="space-y-3">
            <Label className="text-sm font-semibold">{elementKey}</Label>
            
            {/* Button Content */}
            <div className="space-y-2">
              <Input 
                placeholder="Testo bottone" 
                value={element.text || ''} 
                onChange={e => updateSectionElement(sectionId, elementKey, {...element, text: e.target.value})} 
              />
              <Input 
                placeholder="Link" 
                value={element.link || ''} 
                onChange={e => updateSectionElement(sectionId, elementKey, {...element, link: e.target.value})} 
              />
            </div>
            
            {/* Button Style Controls */}
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="styling">
                <AccordionTrigger className="text-xs py-2">
                  <div className="flex items-center gap-2">
                    <Palette className="h-3 w-3" />
                    Stile Bottone
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  {/* Reset Button */}
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => resetElementStyles(sectionId, elementKey)}
                      className="h-8 px-3 text-xs"
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Reset Stili
                    </Button>
                  </div>
                  
                  {/* Button Colors */}
                  <div className="grid grid-cols-1 gap-3">
                    <ColorPicker 
                      value={element.style?.backgroundColor || '#3B82F6'}
                      onChange={(backgroundColor) => updateSectionElement(sectionId, elementKey, {
                        ...element, 
                        style: { ...element.style, backgroundColor }
                      })}
                      label="Colore Sfondo"
                    />
                    
                    <ColorPicker 
                      value={element.style?.color || '#FFFFFF'}
                      onChange={(color) => updateSectionElement(sectionId, elementKey, {
                        ...element, 
                        style: { ...element.style, color }
                      })}
                      label="Colore Testo"
                    />
                  </div>
                  
                  {/* Button Size */}
                  <div>
                    <Label className="text-xs font-medium">Dimensioni</Label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div>
                        <Label className="text-xs">Padding X (px)</Label>
                        <div className="flex items-center gap-2">
                          <Slider 
                            value={[element.style?.paddingX || 16]} 
                            onValueChange={([paddingX]) => updateSectionElement(sectionId, elementKey, {
                              ...element, 
                              style: { ...element.style, paddingX }
                            })}
                            min={8} max={50} step={1}
                            className="flex-1"
                          />
                          <span className="text-xs w-8">{element.style?.paddingX || 16}</span>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-xs">Padding Y (px)</Label>
                        <div className="flex items-center gap-2">
                          <Slider 
                            value={[element.style?.paddingY || 8]} 
                            onValueChange={([paddingY]) => updateSectionElement(sectionId, elementKey, {
                              ...element, 
                              style: { ...element.style, paddingY }
                            })}
                            min={4} max={25} step={1}
                            className="flex-1"
                          />
                          <span className="text-xs w-8">{element.style?.paddingY || 8}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Button Border */}
                  <div>
                    <Label className="text-xs font-medium">Border Radius (px)</Label>
                    <div className="flex items-center gap-2">
                      <Slider 
                        value={[element.style?.borderRadius || 6]} 
                        onValueChange={([borderRadius]) => updateSectionElement(sectionId, elementKey, {
                          ...element, 
                          style: { ...element.style, borderRadius }
                        })}
                        min={0} max={50} step={1}
                        className="flex-1"
                      />
                      <span className="text-xs w-8">{element.style?.borderRadius || 6}</span>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        );
      case 'image':
        return (
          <div className="space-y-3">
            <Label className="text-sm font-semibold">{elementKey}</Label>
            
            {/* Image Content */}
            <div className="space-y-2">
              <Input 
                placeholder="URL Immagine" 
                value={element.value || ''} 
                onChange={e => updateSectionElement(sectionId, elementKey, {...element, value: e.target.value})} 
              />
              <Input 
                placeholder="Alt text" 
                value={element.alt || ''} 
                onChange={e => updateSectionElement(sectionId, elementKey, {...element, alt: e.target.value})} 
              />
              {element.value && (
                <img 
                  src={element.value} 
                  alt={element.alt} 
                  className="w-32 mt-2 rounded border"
                  style={{
                    borderRadius: `${element.style?.borderRadius || 8}px`,
                    border: element.style?.borderWidth ? `${element.style.borderWidth}px solid ${element.style.borderColor || '#E5E7EB'}` : 'none'
                  }}
                />
              )}
            </div>
            
            {/* Image Style Controls */}
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="styling">
                <AccordionTrigger className="text-xs py-2">
                  <div className="flex items-center gap-2">
                    <Palette className="h-3 w-3" />
                    Stile Immagine
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  {/* Reset Button */}
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => resetElementStyles(sectionId, elementKey)}
                      className="h-8 px-3 text-xs"
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Reset Stili
                    </Button>
                  </div>
                  
                  {/* Image Dimensions */}
                  <div>
                    <Label className="text-xs font-medium">Dimensioni</Label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div>
                        <Label className="text-xs">Larghezza (px)</Label>
                        <Input 
                          type="number"
                          value={element.style?.width || ''}
                          onChange={e => updateSectionElement(sectionId, elementKey, {
                            ...element, 
                            style: { ...element.style, width: e.target.value ? parseInt(e.target.value) : undefined }
                          })}
                          placeholder="Auto"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-xs">Altezza (px)</Label>
                        <Input 
                          type="number"
                          value={element.style?.height || ''}
                          onChange={e => updateSectionElement(sectionId, elementKey, {
                            ...element, 
                            style: { ...element.style, height: e.target.value ? parseInt(e.target.value) : undefined }
                          })}
                          placeholder="Auto"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Object Fit */}
                  <div>
                    <Label className="text-xs font-medium">Modalità Visualizzazione</Label>
                    <Select 
                      value={element.style?.objectFit || 'cover'} 
                      onValueChange={(objectFit) => updateSectionElement(sectionId, elementKey, {
                        ...element, 
                        style: { ...element.style, objectFit }
                      })}
                    >
                      <SelectTrigger className="h-8 mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cover">Cover (ritaglia)</SelectItem>
                        <SelectItem value="contain">Contain (adatta)</SelectItem>
                        <SelectItem value="fill">Fill (riempi)</SelectItem>
                        <SelectItem value="none">None (originale)</SelectItem>
                        <SelectItem value="scale-down">Scale Down</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Border & Effects */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Border Radius (px)</Label>
                        <div className="flex items-center gap-2">
                          <Slider 
                            value={[element.style?.borderRadius || 8]} 
                            onValueChange={([borderRadius]) => updateSectionElement(sectionId, elementKey, {
                              ...element, 
                              style: { ...element.style, borderRadius }
                            })}
                            min={0} max={50} step={1}
                            className="flex-1"
                          />
                          <span className="text-xs w-8">{element.style?.borderRadius || 8}</span>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-xs">Border Width (px)</Label>
                        <div className="flex items-center gap-2">
                          <Slider 
                            value={[element.style?.borderWidth || 0]} 
                            onValueChange={([borderWidth]) => updateSectionElement(sectionId, elementKey, {
                              ...element, 
                              style: { ...element.style, borderWidth }
                            })}
                            min={0} max={10} step={1}
                            className="flex-1"
                          />
                          <span className="text-xs w-8">{element.style?.borderWidth || 0}</span>
                        </div>
                      </div>
                    </div>
                    
                    {element.style?.borderWidth > 0 && (
                      <ColorPicker 
                        value={element.style?.borderColor || '#E5E7EB'}
                        onChange={(borderColor) => updateSectionElement(sectionId, elementKey, {
                          ...element, 
                          style: { ...element.style, borderColor }
                        })}
                        label="Colore Bordo"
                      />
                    )}
                  </div>
                  
                  {/* Shadow */}
                  <div>
                    <Label className="text-xs font-medium">Ombra</Label>
                    <Select 
                      value={element.style?.boxShadow || 'none'} 
                      onValueChange={(boxShadow) => updateSectionElement(sectionId, elementKey, {
                        ...element, 
                        style: { ...element.style, boxShadow }
                      })}
                    >
                      <SelectTrigger className="h-8 mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nessuna</SelectItem>
                        <SelectItem value="0 1px 3px 0 rgb(0 0 0 / 0.1)">Leggera</SelectItem>
                        <SelectItem value="0 4px 6px -1px rgb(0 0 0 / 0.1)">Media</SelectItem>
                        <SelectItem value="0 10px 15px -3px rgb(0 0 0 / 0.1)">Forte</SelectItem>
                        <SelectItem value="0 20px 25px -5px rgb(0 0 0 / 0.1)">Molto Forte</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        );
      default:
        return <p className="text-sm text-red-500">Editor non implementato per il tipo: {element.type}</p>;
    }
  };

  const previewData = { id: pageToEdit?.id || 0, title, slug, content: content, metaTitle, metaDescription };
  
  // Helper to apply styles to rendered elements
  const applyElementStyle = (element: any) => {
    if (!element.style) return {};
    
    const style: any = {};
    
    // Typography
    if (element.style.color) style.color = element.style.color;
    if (element.style.backgroundColor && element.style.backgroundColor !== 'transparent') {
      style.backgroundColor = element.style.backgroundColor;
    }
    if (element.style.fontFamily && element.style.fontFamily !== 'inherit') {
      style.fontFamily = element.style.fontFamily;
    }
    if (element.style.fontSize) style.fontSize = `${element.style.fontSize}px`;
    if (element.style.fontWeight && element.style.fontWeight !== 'normal') {
      style.fontWeight = element.style.fontWeight;
    }
    if (element.style.lineHeight) style.lineHeight = element.style.lineHeight;
    if (element.style.letterSpacing) style.letterSpacing = `${element.style.letterSpacing}px`;
    if (element.style.textAlign && element.style.textAlign !== 'left') {
      style.textAlign = element.style.textAlign;
    }
    
    // Layout
    if (element.style.padding) style.padding = `${element.style.padding}px`;
    if (element.style.margin) style.margin = `${element.style.margin}px`;
    if (element.style.paddingX) {
      style.paddingLeft = `${element.style.paddingX}px`;
      style.paddingRight = `${element.style.paddingX}px`;
    }
    if (element.style.paddingY) {
      style.paddingTop = `${element.style.paddingY}px`;
      style.paddingBottom = `${element.style.paddingY}px`;
    }
    
    // Border
    if (element.style.borderRadius) style.borderRadius = `${element.style.borderRadius}px`;
    if (element.style.borderWidth) {
      style.border = `${element.style.borderWidth}px solid ${element.style.borderColor || '#E5E7EB'}`;
    }
    
    // Image specific
    if (element.style.width) style.width = `${element.style.width}px`;
    if (element.style.height) style.height = `${element.style.height}px`;
    if (element.style.objectFit) style.objectFit = element.style.objectFit;
    if (element.style.boxShadow && element.style.boxShadow !== 'none') {
      style.boxShadow = element.style.boxShadow;
    }
    
    return style;
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-black bg-opacity-50" onClick={onClose}>
      <div className="w-full max-w-screen-2xl mx-auto flex h-full" onClick={e => e.stopPropagation()}>
        {/* Editor Panel */}
        <div className="w-2/5 bg-background border-r overflow-y-auto flex flex-col">
          <div className="sticky top-0 bg-background border-b p-4 flex justify-between items-center">
            <h2 className="text-lg font-semibold">{pageToEdit ? 'Modifica Homepage' : 'Nuova Homepage'}</h2>
            <Button variant="ghost" size="sm" onClick={onClose}><X className="h-4 w-4" /></Button>
          </div>
          
          <div className="p-4 flex-grow">
            <Tabs defaultValue="content">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="content">Contenuti</TabsTrigger>
                <TabsTrigger value="settings">Impostazioni</TabsTrigger>
              </TabsList>
              
              <TabsContent value="content" className="pt-4">
                <Accordion type="multiple" className="w-full">
                  {Object.entries(content).map(([sectionId, section]: [string, any]) => (
                    <AccordionItem key={sectionId} value={sectionId}>
                      <AccordionTrigger>{section.sectionName || sectionId}</AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        {Object.entries(section.elements).map(([elementKey, element]: [string, any]) => (
                          element.editable && (
                            <div key={elementKey} className="p-3 border rounded-lg bg-white shadow-sm">
                              {renderElementEditor(sectionId, elementKey, element)}
                            </div>
                          )
                        ))}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </TabsContent>
              
              <TabsContent value="settings" className="space-y-4 pt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Informazioni Base</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input placeholder="Titolo" value={title} onChange={e => setTitle(e.target.value)} />
                    <Input 
                      placeholder="Slug (es: homepage-natale)" 
                      value={slug} 
                      onChange={e => setSlug(e.target.value)} 
                      className={slug === 'home' ? 'bg-blue-50 border-blue-200' : ''}
                    />
                    {slug === 'home' ? (
                      <p className="text-xs text-blue-600">Questa è la homepage attiva - visibile su /</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">Homepage personalizzata - per attivarla usa "Imposta come Predefinita"</p>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>SEO</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input placeholder="Meta Title" value={metaTitle} onChange={e => setMetaTitle(e.target.value)} />
                    <Textarea placeholder="Meta Description" value={metaDescription} onChange={e => setMetaDescription(e.target.value)} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          
          <div className="sticky bottom-0 bg-background border-t p-4 flex justify-between items-center">
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>Annulla</Button>
              <Button 
                variant="destructive" 
                onClick={resetAllStyles}
                className="text-xs"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset Completo
              </Button>
            </div>
            <Button onClick={handleSave} disabled={mutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {mutation.isPending ? "Salvataggio..." : "Salva"}
            </Button>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="w-3/5 bg-slate-200 overflow-y-auto p-4">
          <div className="bg-white rounded-lg shadow-xl mx-auto max-w-screen-lg transform scale-95 origin-top">
            <HomepageRenderer homepage={previewData} applyElementStyle={applyElementStyle} />
          </div>
        </div>
      </div>
    </div>
  );
}
