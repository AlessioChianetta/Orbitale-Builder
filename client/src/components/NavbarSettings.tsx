import { useState } from "react";
import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { GripVertical, Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface NavItem {
  id: string;
  label: string;
  href: string;
  isVisible: boolean;
  order: number;
}

function SortableNavItem({ item, onUpdate, onDelete }: { item: NavItem; onUpdate: (item: NavItem) => void; onDelete: (id: string) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-4 bg-white dark:bg-slate-900 border rounded-lg"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="h-5 w-5" />
      </button>

      <div className="flex-1 grid grid-cols-2 gap-3">
        <Input
          value={item.label}
          onChange={(e) => onUpdate({ ...item, label: e.target.value })}
          placeholder="Label (es: Home)"
        />
        <Input
          value={item.href}
          onChange={(e) => onUpdate({ ...item, href: e.target.value })}
          placeholder="Path (es: /)"
        />
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onUpdate({ ...item, isVisible: !item.isVisible })}
          title={item.isVisible ? 'Nascondi' : 'Mostra'}
        >
          {item.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(item.id)}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function NavbarSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [navItems, setNavItems] = useState<NavItem[]>([]);

  // Carica le impostazioni navbar dal database
  const { data: settingsData, isLoading, error } = useQuery({
    queryKey: ['/api/settings'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/settings');
      return response.json();
    }
  });

  // Effetto per impostare i navItems quando i dati vengono caricati
  React.useEffect(() => {
    if (settingsData) {
      if (settingsData.navbarItems) {
        setNavItems(settingsData.navbarItems);
      } else {
        // Navbar vuota per nuovi tenant
        setNavItems([]);
      }
    }
  }, [settingsData]);

  // Salva le impostazioni navbar
  const saveNavbarMutation = useMutation({
    mutationFn: async (items: NavItem[]) => {
      const response = await apiRequest('PUT', '/api/settings', {
        key: 'navbarItems',
        value: items
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/settings/navbar'] });
      // Force refresh of header data
      queryClient.refetchQueries({ queryKey: ['/api/settings/navbar'] });
      toast({
        title: "Successo!",
        description: "Impostazioni navbar salvate.",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile salvare le impostazioni.",
        variant: "destructive"
      });
    }
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setNavItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const reordered = arrayMove(items, oldIndex, newIndex);
        return reordered.map((item, index) => ({ ...item, order: index }));
      });
    }
  };

  const addNavItem = () => {
    const newId = Date.now().toString();
    setNavItems([...navItems, {
      id: newId,
      label: 'Nuova Pagina',
      href: '/nuova-pagina',
      isVisible: true,
      order: navItems.length
    }]);
  };

  const updateNavItem = (updatedItem: NavItem) => {
    setNavItems(navItems.map(item => item.id === updatedItem.id ? updatedItem : item));
  };

  const deleteNavItem = (id: string) => {
    setNavItems(navItems.filter(item => item.id !== id));
  };

  const handleSave = () => {
    saveNavbarMutation.mutate(navItems);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Caricamento impostazioni navbar...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive">Errore nel caricamento delle impostazioni</p>
          <Button onClick={() => window.location.reload()} variant="outline" className="mt-2">
            Riprova
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestione Navbar</h1>
          <p className="text-muted-foreground">Configura i link del menu di navigazione</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={addNavItem} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Aggiungi Link
          </Button>
          <Button onClick={handleSave} disabled={saveNavbarMutation.isPending}>
            {saveNavbarMutation.isPending ? 'Salvataggio...' : 'Salva Modifiche'}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Link del Menu</CardTitle>
          <CardDescription>
            Trascina per riordinare, clicca sull'occhio per mostrare/nascondere
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={navItems.map(item => item.id)}
                strategy={verticalListSortingStrategy}
              >
                {navItems.map((item) => (
                  <SortableNavItem
                    key={item.id}
                    item={item}
                    onUpdate={updateNavItem}
                    onDelete={deleteNavItem}
                  />
                ))}
              </SortableContext>
            </DndContext>

            {navItems.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p>Nessun link nella navbar.</p>
                <Button onClick={addNavItem} variant="outline" className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Aggiungi il primo link
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Anteprima</CardTitle>
          <CardDescription>Come apparirà la navbar nel sito</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6 p-4 border rounded-lg bg-muted/50">
            <div className="font-bold text-lg">Logo</div>
            <div className="flex-1 flex gap-6">
              {navItems
                .filter(item => item.isVisible)
                .sort((a, b) => a.order - b.order)
                .map((item) => (
                  <a
                    key={item.id}
                    href={item.href}
                    className="text-sm font-medium text-muted-foreground hover:text-foreground"
                    onClick={(e) => e.preventDefault()}
                  >
                    {item.label}
                  </a>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
