import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, Edit, Copy, Share2, TrendingUp, MousePointerClick, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface LandingPageStats {
  id: number;
  title: string;
  slug: string;
  isActive: boolean;
  views: number;
  conversions: number;
  conversionRate: number;
  updatedAt: string;
  createdAt: string;
}

export default function LandingPagesManager() {
  const { toast } = useToast();

  const { data: statsData, isLoading, refetch } = useQuery({
    queryKey: ['/api/landing-pages/stats'],
    queryFn: async () => {
      return await apiRequest<{ landingPages: LandingPageStats[] }>('/api/landing-pages/stats');
    },
  });

  const handleView = (slug: string) => {
    window.open(`/${slug}`, '_blank');
  };

  const handleEdit = (id: number) => {
    window.location.href = `/admin/landing-pages/${id}/edit`;
  };

  const handleDuplicate = async (id: number) => {
    try {
      await apiRequest(`/api/landing-pages/${id}/duplicate`, {
        method: 'POST',
      });
      toast({
        title: "Landing Page Duplicata",
        description: "La landing page e stata duplicata con successo",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile duplicare la landing page",
        variant: "destructive",
      });
    }
  };

  const handleShare = (slug: string) => {
    const url = `${window.location.origin}/${slug}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link Copiato",
      description: "Il link della landing page e stato copiato negli appunti",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-sm text-slate-600">Caricamento statistiche...</p>
        </div>
      </div>
    );
  }

  const landingPages = statsData?.landingPages || [];

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-50">
                <BarChart3 className="h-4 w-4 text-indigo-600" />
              </div>
              <div>
                <CardTitle className="text-sm text-slate-800">Le tue pagine</CardTitle>
                <p className="text-xs text-slate-600 mt-0.5">
                  Crea, gestisci e monitora le tue landing pages opt-in.
                </p>
              </div>
            </div>
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" onClick={() => window.location.href = '/admin/landing-pages/new'}>
              Nuova Landing Page
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {landingPages.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-3 rounded-lg bg-slate-50 w-fit mx-auto mb-4">
                <BarChart3 className="h-10 w-10 text-slate-300" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800 mb-1">
                Nessuna Landing Page
              </h3>
              <p className="text-xs text-slate-600 mb-4">
                Inizia creando la tua prima landing page per raccogliere lead.
              </p>
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" onClick={() => window.location.href = '/admin/landing-pages/new'}>
                Crea la Prima Landing Page
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-100">
                    <TableHead className="text-slate-600 text-xs">Titolo</TableHead>
                    <TableHead className="text-slate-600 text-xs">Stato</TableHead>
                    <TableHead className="text-center text-slate-600 text-xs">
                      <div className="flex items-center justify-center gap-1.5">
                        <Eye className="h-3.5 w-3.5" />
                        <span>Visualizzazioni</span>
                      </div>
                    </TableHead>
                    <TableHead className="text-center text-slate-600 text-xs">
                      <div className="flex items-center justify-center gap-1.5">
                        <MousePointerClick className="h-3.5 w-3.5" />
                        <span>Conversioni</span>
                      </div>
                    </TableHead>
                    <TableHead className="text-center text-slate-600 text-xs">
                      <div className="flex items-center justify-center gap-1.5">
                        <TrendingUp className="h-3.5 w-3.5" />
                        <span>Tasso Conv.</span>
                      </div>
                    </TableHead>
                    <TableHead className="text-slate-600 text-xs">Ultima Modifica</TableHead>
                    <TableHead className="text-right text-slate-600 text-xs">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {landingPages.map((page) => (
                    <TableRow key={page.id} className="border-slate-50 hover:bg-slate-50/50">
                      <TableCell>
                        <div>
                          <div className="font-medium text-slate-800 text-sm">{page.title}</div>
                          <div className="text-xs text-slate-400">/{page.slug}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {page.isActive ? (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">Attiva</Badge>
                        ) : (
                          <Badge className="bg-slate-100 text-slate-600 border-slate-200 text-xs">Inattiva</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="font-semibold text-slate-800 text-sm">{page.views.toLocaleString()}</div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="font-semibold text-slate-800 text-sm">{page.conversions.toLocaleString()}</div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className={`font-semibold text-sm ${page.conversionRate > 5 ? 'text-emerald-600' : page.conversionRate > 2 ? 'text-indigo-600' : 'text-slate-600'}`}>
                          {page.conversionRate.toFixed(2)}%
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-slate-600">
                          {format(new Date(page.updatedAt), 'dd MMM yyyy', { locale: it })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(page.slug)}
                            title="Visualizza"
                            className="text-slate-400 hover:text-indigo-600"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(page.id)}
                            title="Modifica"
                            className="text-slate-400 hover:text-indigo-600"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDuplicate(page.id)}
                            title="Duplica"
                            className="text-slate-400 hover:text-indigo-600"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleShare(page.slug)}
                            title="Condividi"
                            className="text-slate-400 hover:text-indigo-600"
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {landingPages.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-indigo-50">
                  <Eye className="h-3.5 w-3.5 text-indigo-600" />
                </div>
                <span className="text-xs text-slate-600">Visualizzazioni Totali</span>
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {landingPages.reduce((sum, page) => sum + page.views, 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-indigo-50">
                  <MousePointerClick className="h-3.5 w-3.5 text-indigo-600" />
                </div>
                <span className="text-xs text-slate-600">Conversioni Totali</span>
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {landingPages.reduce((sum, page) => sum + page.conversions, 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-indigo-50">
                  <TrendingUp className="h-3.5 w-3.5 text-indigo-600" />
                </div>
                <span className="text-xs text-slate-600">Tasso Conversione Medio</span>
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {(() => {
                  const totalViews = landingPages.reduce((sum, page) => sum + page.views, 0);
                  const totalConversions = landingPages.reduce((sum, page) => sum + page.conversions, 0);
                  const avgRate = totalViews > 0 ? (totalConversions / totalViews) * 100 : 0;
                  return avgRate.toFixed(2) + '%';
                })()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
