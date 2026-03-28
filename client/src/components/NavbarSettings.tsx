import { useState } from "react";
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { GripVertical, Plus, Trash2, Eye, EyeOff, Menu, Link } from "lucide-react";
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
      className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg hover:border-indigo-200 transition-colors"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="flex-1 grid grid-cols-2 gap-3">
        <Input
          value={item.label}
          onChange={(e) => onUpdate({ ...item, label: e.target.value })}
          placeholder="Label (es: Home)"
          className="border-slate-200 focus:border-indigo-300 text-sm"
        />
        <Input
          value={item.href}
          onChange={(e) => onUpdate({ ...item, href: e.target.value })}
          placeholder="Path (es: /)"
          className="border-slate-200 focus:border-indigo-300 text-sm"
        />
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onUpdate({ ...item, isVisible: !item.isVisible })}
          title={item.isVisible ? 'Nascondi' : 'Mostra'}
          className={item.isVisible ? "text-emerald-600 hover:text-emerald-700" : "text-slate-400 hover:text-slate-600"}
        >
          {item.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(item.id)}
          className="text-slate-400 hover:text-red-600"
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

  const { data: settingsData, isLoading, error } = useQuery({
    queryKey: ['/api/settings'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/settings');
      return response.json();
    }
  });

  React.useEffect(() => {
    if (settingsData) {
      if (settingsData.navbarItems) {
        setNavItems(settingsData.navbarItems);
      } else {
        setNavItems([]);
      }
    }
  }, [settingsData]);

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
      queryClient.refetchQueries({ queryKey: ['/api/settings/navbar'] });
      toast({
        title: "Navbar aggiornata",
        description: "Impostazioni navbar salvate con successo.",
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-sm text-slate-600">Caricamento impostazioni navbar...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 text-sm">Errore nel caricamento delle impostazioni</p>
          <Button onClick={() => window.location.reload()} variant="outline" className="mt-2 border-slate-200">
            Riprova
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-50">
                <Menu className="h-4 w-4 text-indigo-600" />
              </div>
              <div>
                <CardTitle className="text-sm text-slate-800">Link del Menu</CardTitle>
                <p className="text-xs text-slate-600 mt-0.5">Trascina per riordinare, clicca sull'occhio per mostrare/nascondere</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={addNavItem} variant="outline" size="sm" className="border-slate-200 text-slate-600">
                <Plus className="h-4 w-4 mr-1" />
                Aggiungi
              </Button>
              <Button onClick={handleSave} disabled={saveNavbarMutation.isPending} size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                {saveNavbarMutation.isPending ? 'Salvataggio...' : 'Salva'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
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
              <div className="text-center py-12">
                <div className="p-3 rounded-lg bg-slate-50 w-fit mx-auto mb-3">
                  <Link className="h-8 w-8 text-slate-300" />
                </div>
                <p className="text-sm text-slate-600 mb-3">Nessun link nella navbar.</p>
                <Button onClick={addNavItem} variant="outline" size="sm" className="border-slate-200 text-slate-600">
                  <Plus className="h-4 w-4 mr-1" />
                  Aggiungi il primo link
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-50">
              <Eye className="h-4 w-4 text-indigo-600" />
            </div>
            <CardTitle className="text-sm text-slate-800">Anteprima</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6 p-4 border border-slate-200 rounded-lg bg-slate-800">
            <div className="font-bold text-sm text-white">Logo</div>
            <div className="flex-1 flex gap-6">
              {navItems
                .filter(item => item.isVisible)
                .sort((a, b) => a.order - b.order)
                .map((item) => (
                  <a
                    key={item.id}
                    href={item.href}
                    className="text-sm text-slate-300 hover:text-white transition-colors"
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
