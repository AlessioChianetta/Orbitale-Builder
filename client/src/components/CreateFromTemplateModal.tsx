import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CreateFromTemplateModalProps {
  onClose: () => void;
  onSubmit: (title: string, slug: string) => void;
  isLoading: boolean;
}

export function CreateFromTemplateModal({ 
  onClose, 
  onSubmit, 
  isLoading 
}: CreateFromTemplateModalProps) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim()) return;
    onSubmit(title.trim(), slug.trim());
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    // Auto-generate slug from title
    const autoSlug = newTitle
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    setSlug(autoSlug);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>Crea da Template Patrimonio</CardTitle>
          <CardDescription>
            Inserisci il titolo e lo slug per la nuova landing page basata sul template Patrimonio.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Titolo</label>
              <Input
                value={title}
                onChange={handleTitleChange}
                placeholder="Es: Metodo ORBITALE - Cliente XYZ"
                required
                data-testid="input-template-title"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Slug</label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="es: metodo-orbitale-cliente-xyz"
                required
                data-testid="input-template-slug"
              />
            </div>
          </CardContent>
          <div className="flex justify-end space-x-2 p-6 pt-0">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isLoading}
              data-testid="button-cancel-template"
            >
              Annulla
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !title.trim() || !slug.trim()}
              data-testid="button-create-template"
            >
              {isLoading ? "Creando..." : "Crea Landing Page"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}