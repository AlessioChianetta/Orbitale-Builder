import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Download, Search, Filter, MoreHorizontal, Eye, Trash2, Mail, Phone, Calendar } from 'lucide-react';
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

  // Fetch leads con filtri
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

  // Fetch statistiche
  const { data: stats } = useQuery({
    queryKey: ['/api/marketing-leads/stats'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/marketing-leads/stats');
      return response.json();
    },
  });

  // Fetch sources disponibili
  const { data: sources } = useQuery<string[]>({
    queryKey: ['/api/marketing-leads/sources'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/marketing-leads/sources');
      return response.json();
    },
  });

  // Fetch campaigns disponibili
  const { data: campaigns } = useQuery<string[]>({
    queryKey: ['/api/marketing-leads/campaigns'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/marketing-leads/campaigns');
      return response.json();
    },
  });

  // Delete lead mutation
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
        description: "Il lead è stato eliminato con successo",
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
      limit: '10000', // Get all for export
    });
    
    if (sourceFilter && sourceFilter !== 'all') params.append('source', sourceFilter);
    if (campaignFilter && campaignFilter !== 'all') params.append('campaign', campaignFilter);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const token = localStorage.getItem('token');
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Marketing Leads</h2>
          <p className="text-muted-foreground">Gestisci i lead provenienti dalle landing pages</p>
        </div>
        <Button onClick={handleExportCSV} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Esporta CSV
        </Button>
      </div>

      {/* Statistiche */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Totale Leads</CardDescription>
            <CardTitle className="text-4xl">{stats?.general?.total_leads || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Ultimi 24h</CardDescription>
            <CardTitle className="text-4xl">{stats?.general?.leads_last_24h || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Ultimi 7 giorni</CardDescription>
            <CardTitle className="text-4xl">{stats?.general?.leads_last_7d || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Sources Uniche</CardDescription>
            <CardTitle className="text-4xl">{stats?.general?.unique_sources || 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filtri */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div>
              <Input
                placeholder="Cerca per nome, email, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger>
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
                <SelectTrigger>
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
              />
            </div>
            <div>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="Data fine"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabella Leads */}
      <Card>
        <CardHeader>
          <CardTitle>Lead ({leadsData?.pagination?.total || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefono</TableHead>
                <TableHead>Azienda</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leadsLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    Caricamento...
                  </TableCell>
                </TableRow>
              ) : filteredLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    Nessun lead trovato
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeads.map((lead: MarketingLead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">
                      {lead.firstName} {lead.lastName}
                    </TableCell>
                    <TableCell>{lead.email}</TableCell>
                    <TableCell>{lead.phone || '-'}</TableCell>
                    <TableCell>{lead.businessName || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{lead.source}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge>{lead.campaign}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {lead.emailSent && (
                          <Badge variant="secondary" className="text-xs">
                            <Mail className="h-3 w-3 mr-1" />
                            Email
                          </Badge>
                        )}
                        {lead.whatsappSent && (
                          <Badge variant="secondary" className="text-xs">
                            <Phone className="h-3 w-3 mr-1" />
                            WA
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(lead.createdAt), 'dd/MM/yyyy HH:mm')}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
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

          {/* Paginazione */}
          {leadsData?.pagination && leadsData.pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Pagina {leadsData.pagination.page} di {leadsData.pagination.pages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Precedente
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= leadsData.pagination.pages}
                >
                  Successiva
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Dettaglio Lead */}
      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Dettaglio Lead</DialogTitle>
            <DialogDescription>
              Informazioni complete sul lead
            </DialogDescription>
          </DialogHeader>
          
          {selectedLead && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nome</label>
                  <p className="text-sm">{selectedLead.firstName} {selectedLead.lastName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-sm">{selectedLead.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Telefono</label>
                  <p className="text-sm">{selectedLead.phone || 'Non fornito'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Azienda</label>
                  <p className="text-sm">{selectedLead.businessName || 'Non fornita'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Source</label>
                  <Badge variant="outline">{selectedLead.source}</Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Campaign</label>
                  <Badge>{selectedLead.campaign}</Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Data Creazione</label>
                  <p className="text-sm flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(selectedLead.createdAt), 'dd/MM/yyyy HH:mm')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status Invii</label>
                  <div className="flex gap-2 mt-1">
                    {selectedLead.emailSent && (
                      <Badge variant="secondary" className="text-xs">Email Inviata</Badge>
                    )}
                    {selectedLead.whatsappSent && (
                      <Badge variant="secondary" className="text-xs">WhatsApp Inviato</Badge>
                    )}
                  </div>
                </div>
              </div>

              {selectedLead.additionalData && Object.keys(selectedLead.additionalData).length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-2">Dati Aggiuntivi</label>
                  <div className="bg-muted p-4 rounded-lg">
                    <pre className="text-xs overflow-auto">
                      {JSON.stringify(selectedLead.additionalData, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => window.open(`mailto:${selectedLead.email}`)}
                  className="flex-1"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Invia Email
                </Button>
                {selectedLead.phone && (
                  <Button
                    variant="outline"
                    onClick={() => window.open(`tel:${selectedLead.phone}`)}
                    className="flex-1"
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
