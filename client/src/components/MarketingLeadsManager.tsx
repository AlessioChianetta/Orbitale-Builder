import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download, MoreHorizontal, Eye, Trash2, Mail, Phone, Calendar, Users, Clock, TrendingUp, Megaphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';

interface MarketingLead {
  id: number;
  businessName?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  source: string;
  campaign: string;
  emailSent: boolean;
  whatsappSent: boolean;
  additionalData?: any;
  createdAt: string;
}

export default function MarketingLeadsManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedLead, setSelectedLead] = useState<MarketingLead | null>(null);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [campaignFilter, setCampaignFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: leadsData, isLoading: leadsLoading } = useQuery({
    queryKey: ['/api/marketing-leads', { page, sourceFilter, campaignFilter, startDate, endDate }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      });
      
      if (sourceFilter && sourceFilter !== 'all') params.append('source', sourceFilter);
      if (campaignFilter && campaignFilter !== 'all') params.append('campaign', campaignFilter);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await apiRequest('GET', `/api/marketing-leads?${params.toString()}`);
      return response.json();
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['/api/marketing-leads/stats'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/marketing-leads/stats');
      return response.json();
    },
  });

  const { data: sources } = useQuery<string[]>({
    queryKey: ['/api/marketing-leads/sources'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/marketing-leads/sources');
      return response.json();
    },
  });

  const { data: campaigns } = useQuery<string[]>({
    queryKey: ['/api/marketing-leads/campaigns'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/marketing-leads/campaigns');
      return response.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/marketing-leads/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/marketing-leads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/marketing-leads/stats'] });
      toast({
        title: "Lead eliminato",
        description: "Il lead e stato eliminato con successo",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Errore durante l'eliminazione del lead",
        variant: "destructive",
      });
    },
  });

  const handleExportCSV = () => {
    const params = new URLSearchParams({
      export: 'true',
      page: '1',
      limit: '10000',
    });
    
    if (sourceFilter && sourceFilter !== 'all') params.append('source', sourceFilter);
    if (campaignFilter && campaignFilter !== 'all') params.append('campaign', campaignFilter);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    window.open(
      `/api/marketing-leads?${params.toString()}`,
      '_blank'
    );
  };

  const filteredLeads = leadsData?.leads?.filter((lead: MarketingLead) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      lead.email?.toLowerCase().includes(search) ||
      lead.firstName?.toLowerCase().includes(search) ||
      lead.lastName?.toLowerCase().includes(search) ||
      lead.businessName?.toLowerCase().includes(search) ||
      lead.phone?.includes(search)
    );
  }) || [];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-50">
                <Users className="h-3.5 w-3.5 text-indigo-600" />
              </div>
              <p className="text-xs text-slate-600">Totale Leads</p>
            </div>
            <CardTitle className="text-3xl text-slate-900">{stats?.general?.total_leads || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-50">
                <Clock className="h-3.5 w-3.5 text-indigo-600" />
              </div>
              <p className="text-xs text-slate-600">Ultimi 24h</p>
            </div>
            <CardTitle className="text-3xl text-slate-900">{stats?.general?.leads_last_24h || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-50">
                <TrendingUp className="h-3.5 w-3.5 text-indigo-600" />
              </div>
              <p className="text-xs text-slate-600">Ultimi 7 giorni</p>
            </div>
            <CardTitle className="text-3xl text-slate-900">{stats?.general?.leads_last_7d || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-50">
                <Megaphone className="h-3.5 w-3.5 text-indigo-600" />
              </div>
              <p className="text-xs text-slate-600">Sources Uniche</p>
            </div>
            <CardTitle className="text-3xl text-slate-900">{stats?.general?.unique_sources || 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="pt-5">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
            <div>
              <Input
                placeholder="Cerca per nome, email, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border-slate-200 focus:border-indigo-300"
              />
            </div>
            <div>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="border-slate-200 focus:border-indigo-300">
                  <SelectValue placeholder="Tutte le sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte le sources</SelectItem>
                  {sources?.map((source) => (
                    <SelectItem key={source} value={source}>
                      {source}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={campaignFilter} onValueChange={setCampaignFilter}>
                <SelectTrigger className="border-slate-200 focus:border-indigo-300">
                  <SelectValue placeholder="Tutte le campagne" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte le campagne</SelectItem>
                  {campaigns?.map((campaign) => (
                    <SelectItem key={campaign} value={campaign}>
                      {campaign}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="Data inizio"
                className="border-slate-200 focus:border-indigo-300"
              />
            </div>
            <div className="flex gap-2">
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="Data fine"
                className="border-slate-200 focus:border-indigo-300 flex-1"
              />
              <Button onClick={handleExportCSV} variant="outline" size="icon" className="border-slate-200 text-slate-600 hover:bg-slate-50 shrink-0">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-slate-700">Lead ({leadsData?.pagination?.total || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-100">
                <TableHead className="text-slate-600 text-xs">Nome</TableHead>
                <TableHead className="text-slate-600 text-xs">Email</TableHead>
                <TableHead className="text-slate-600 text-xs">Telefono</TableHead>
                <TableHead className="text-slate-600 text-xs">Azienda</TableHead>
                <TableHead className="text-slate-600 text-xs">Source</TableHead>
                <TableHead className="text-slate-600 text-xs">Campaign</TableHead>
                <TableHead className="text-slate-600 text-xs">Status</TableHead>
                <TableHead className="text-slate-600 text-xs">Data</TableHead>
                <TableHead className="text-right text-slate-600 text-xs">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leadsLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-slate-400">
                    Caricamento...
                  </TableCell>
                </TableRow>
              ) : filteredLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-slate-400">
                    Nessun lead trovato
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeads.map((lead: MarketingLead) => (
                  <TableRow key={lead.id} className="border-slate-50 hover:bg-slate-50/50">
                    <TableCell className="font-medium text-slate-800">
                      {lead.firstName} {lead.lastName}
                    </TableCell>
                    <TableCell className="text-slate-600">{lead.email}</TableCell>
                    <TableCell className="text-slate-600">{lead.phone || '-'}</TableCell>
                    <TableCell className="text-slate-600">{lead.businessName || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-slate-200 text-slate-600 text-xs">{lead.source}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 text-xs">{lead.campaign}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {lead.emailSent && (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                            <Mail className="h-3 w-3 mr-1" />
                            Email
                          </Badge>
                        )}
                        {lead.whatsappSent && (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                            <Phone className="h-3 w-3 mr-1" />
                            WA
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-400">
                      {format(new Date(lead.createdAt), 'dd/MM/yyyy HH:mm')}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-700">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedLead(lead)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Dettagli
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => window.open(`mailto:${lead.email}`)}>
                            <Mail className="h-4 w-4 mr-2" />
                            Invia Email
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              if (confirm('Sei sicuro di voler eliminare questo lead?')) {
                                deleteMutation.mutate(lead.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Elimina
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {leadsData?.pagination && leadsData.pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
              <div className="text-xs text-slate-400">
                Pagina {leadsData.pagination.page} di {leadsData.pagination.pages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="border-slate-200 text-slate-600"
                >
                  Precedente
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= leadsData.pagination.pages}
                  className="border-slate-200 text-slate-600"
                >
                  Successiva
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Dettaglio Lead</DialogTitle>
            <DialogDescription className="text-slate-600">
              Informazioni complete sul lead
            </DialogDescription>
          </DialogHeader>
          
          {selectedLead && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Nome</label>
                  <p className="text-sm text-slate-800">{selectedLead.firstName} {selectedLead.lastName}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Email</label>
                  <p className="text-sm text-slate-800">{selectedLead.email}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Telefono</label>
                  <p className="text-sm text-slate-800">{selectedLead.phone || 'Non fornito'}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Azienda</label>
                  <p className="text-sm text-slate-800">{selectedLead.businessName || 'Non fornita'}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Source</label>
                  <Badge variant="outline" className="border-slate-200 text-slate-600">{selectedLead.source}</Badge>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Campaign</label>
                  <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200">{selectedLead.campaign}</Badge>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Data Creazione</label>
                  <p className="text-sm text-slate-800 flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-slate-400" />
                    {format(new Date(selectedLead.createdAt), 'dd/MM/yyyy HH:mm')}
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Status Invii</label>
                  <div className="flex gap-2 mt-1">
                    {selectedLead.emailSent && (
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">Email Inviata</Badge>
                    )}
                    {selectedLead.whatsappSent && (
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">WhatsApp Inviato</Badge>
                    )}
                  </div>
                </div>
              </div>

              {selectedLead.additionalData && Object.keys(selectedLead.additionalData).length > 0 && (
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-2">Dati Aggiuntivi</label>
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg">
                    <pre className="text-xs overflow-auto text-slate-700">
                      {JSON.stringify(selectedLead.additionalData, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t border-slate-100">
                <Button
                  variant="outline"
                  onClick={() => window.open(`mailto:${selectedLead.email}`)}
                  className="flex-1 border-slate-200 text-indigo-600 hover:bg-indigo-50"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Invia Email
                </Button>
                {selectedLead.phone && (
                  <Button
                    variant="outline"
                    onClick={() => window.open(`tel:${selectedLead.phone}`)}
                    className="flex-1 border-slate-200 text-indigo-600 hover:bg-indigo-50"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Chiama
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
