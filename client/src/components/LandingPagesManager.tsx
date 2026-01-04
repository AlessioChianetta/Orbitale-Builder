import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
        description: "La landing page è stata duplicata con successo",
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
      description: "Il link della landing page è stato copiato negli appunti",
    });
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Attiva</Badge>
    ) : (
      <Badge variant="secondary">Inattiva</Badge>
    );
  };

  const formatConversionRate = (rate: number) => {
    return `${rate.toFixed(2)}%`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Caricamento statistiche...</p>
        </div>
      </div>
    );
  }

  const landingPages = statsData?.landingPages || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">Le tue pagine</CardTitle>
              <CardDescription>
                Crea, gestisci e monitora le tue landing pages opt-in.
              </CardDescription>
            </div>
            <Button onClick={() => window.location.href = '/admin/landing-pages/new'}>
              Nuova Landing Page
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {landingPages.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Nessuna Landing Page
              </h3>
              <p className="text-slate-600 mb-4">
                Inizia creando la tua prima landing page per raccogliere lead.
              </p>
              <Button onClick={() => window.location.href = '/admin/landing-pages/new'}>
                Crea la Prima Landing Page
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titolo</TableHead>
                    <TableHead>Stato</TableHead>
                    <TableHead className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Eye className="h-4 w-4" />
                        <span>Visualizzazioni</span>
                      </div>
                    </TableHead>
                    <TableHead className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <MousePointerClick className="h-4 w-4" />
                        <span>Conversioni</span>
                      </div>
                    </TableHead>
                    <TableHead className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        <span>Tasso Conv.</span>
                      </div>
                    </TableHead>
                    <TableHead>Ultima Modifica</TableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {landingPages.map((page) => (
                    <TableRow key={page.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-slate-900">{page.title}</div>
                          <div className="text-sm text-slate-500">/{page.slug}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(page.isActive)}</TableCell>
                      <TableCell className="text-center">
                        <div className="font-semibold text-slate-900">{page.views.toLocaleString()}</div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="font-semibold text-slate-900">{page.conversions.toLocaleString()}</div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className={`font-semibold ${page.conversionRate > 5 ? 'text-green-600' : page.conversionRate > 2 ? 'text-blue-600' : 'text-slate-600'}`}>
                          {formatConversionRate(page.conversionRate)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-slate-600">
                          {format(new Date(page.updatedAt), 'dd MMM yyyy', { locale: it })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(page.slug)}
                            title="Visualizza"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(page.id)}
                            title="Modifica"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDuplicate(page.id)}
                            title="Duplica"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleShare(page.slug)}
                            title="Condividi"
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
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Statistiche Generali</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Visualizzazioni Totali</span>
                </div>
                <div className="text-2xl font-bold text-blue-900">
                  {landingPages.reduce((sum, page) => sum + page.views, 0).toLocaleString()}
                </div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <MousePointerClick className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-green-900">Conversioni Totali</span>
                </div>
                <div className="text-2xl font-bold text-green-900">
                  {landingPages.reduce((sum, page) => sum + page.conversions, 0).toLocaleString()}
                </div>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  <span className="text-sm font-medium text-purple-900">Tasso Conversione Medio</span>
                </div>
                <div className="text-2xl font-bold text-purple-900">
                  {(() => {
                    const totalViews = landingPages.reduce((sum, page) => sum + page.views, 0);
                    const totalConversions = landingPages.reduce((sum, page) => sum + page.conversions, 0);
                    const avgRate = totalViews > 0 ? (totalConversions / totalViews) * 100 : 0;
                    return formatConversionRate(avgRate);
                  })()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
