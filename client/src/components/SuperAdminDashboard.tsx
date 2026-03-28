import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { SEOHead } from "./SEOHead";

const clearAuthToken = () => {
  localStorage.removeItem("token");
  window.location.href = '/admin';
};

export default function SuperAdminDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [newTenant, setNewTenant] = useState({ name: "", domain: "", isActive: true });
  const [newUser, setNewUser] = useState({ username: "", email: "", password: "", role: "admin", tenantId: 1 });
  const [isCreateTenantOpen, setIsCreateTenantOpen] = useState(false);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [passwordDialog, setPasswordDialog] = useState<{ open: boolean; userId: string; username: string }>({ open: false, userId: "", username: "" });
  const [loginAsDialog, setLoginAsDialog] = useState<{ open: boolean; userId: string; username: string }>({ open: false, userId: "", username: "" });
  const [newPassword, setNewPassword] = useState("");

  const { data: tenants = [], isLoading: loadingTenants } = useQuery<any[]>({
    queryKey: ['/api/superadmin/tenants'],
  });

  const { data: users = [], isLoading: loadingUsers } = useQuery<any[]>({
    queryKey: ['/api/superadmin/users'],
  });

  const { data: allContent, isLoading: loadingContent } = useQuery<any>({
    queryKey: ['/api/superadmin/content/all'],
  });

  const createTenantMutation = useMutation({
    mutationFn: async (tenantData: any) => {
      const response = await apiRequest("POST", "/api/superadmin/tenants", tenantData);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Tenant creato con successo!" });
      queryClient.invalidateQueries({ queryKey: ['/api/superadmin/tenants'] });
      setNewTenant({ name: "", domain: "", isActive: true });
      setIsCreateTenantOpen(false);
    },
    onError: () => {
      toast({ title: "Errore nella creazione del tenant", variant: "destructive" });
    }
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      const response = await apiRequest("POST", "/api/superadmin/users", userData);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Utente creato con successo!" });
      queryClient.invalidateQueries({ queryKey: ['/api/superadmin/users'] });
      setNewUser({ username: "", email: "", password: "", role: "admin", tenantId: 1 });
      setIsCreateUserOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Errore nella creazione dell'utente", description: error.message || "Riprova più tardi", variant: "destructive" });
    }
  });

  const deleteTenantMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/superadmin/tenants/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Tenant eliminato con successo!" });
      queryClient.invalidateQueries({ queryKey: ['/api/superadmin/tenants'] });
    },
    onError: () => {
      toast({ title: "Errore nell'eliminazione del tenant", variant: "destructive" });
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/superadmin/users/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Utente eliminato con successo!" });
      queryClient.invalidateQueries({ queryKey: ['/api/superadmin/users'] });
    },
    onError: () => {
      toast({ title: "Errore nell'eliminazione dell'utente", variant: "destructive" });
    }
  });

  const changePasswordMutation = useMutation({
    mutationFn: async ({ userId, password }: { userId: string; password: string }) => {
      const response = await apiRequest("PUT", `/api/superadmin/users/${userId}/password`, { password });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Password aggiornata con successo!" });
      setPasswordDialog({ open: false, userId: "", username: "" });
      setNewPassword("");
    },
    onError: () => {
      toast({ title: "Errore nell'aggiornamento della password", variant: "destructive" });
    }
  });

  const loginAsMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest("POST", `/api/superadmin/users/${userId}/login-as`);
      return response.json();
    },
    onSuccess: (data: any) => {
      localStorage.setItem("token", data.token);
      toast({ title: `Accesso come ${data.user.username} effettuato!` });
      window.location.href = '/admin';
    },
    onError: () => {
      toast({ title: "Errore nell'accesso come utente", variant: "destructive" });
    }
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
      clearAuthToken();
    },
    onSuccess: () => {
      toast({ title: "Logout effettuato con successo!" });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    },
    onError: () => {
      toast({ title: "Errore durante il logout", variant: "destructive" });
    }
  });

  const handleCreateTenant = () => {
    if (!newTenant.name || !newTenant.domain) {
      toast({ title: "Nome e dominio sono obbligatori", variant: "destructive" });
      return;
    }
    createTenantMutation.mutate(newTenant);
  };

  const handleCreateUser = () => {
    if (!newUser.username || !newUser.email || !newUser.password || !newUser.tenantId) {
      toast({ title: "Tutti i campi sono obbligatori", variant: "destructive" });
      return;
    }
    createUserMutation.mutate(newUser);
  };

  const handleChangePassword = () => {
    if (!newPassword || newPassword.length < 6) {
      toast({ title: "La password deve essere di almeno 6 caratteri", variant: "destructive" });
      return;
    }
    changePasswordMutation.mutate({ userId: passwordDialog.userId, password: newPassword });
  };

  const getTenantName = (tenantId: number) => {
    const tenant = tenants.find((t: any) => t.id === tenantId);
    return tenant?.name || "-";
  };

  return (
    <>
      <SEOHead
        title="SuperAdmin Dashboard"
        description="Area super amministrativa"
        noindex={true}
        usePageData={false}
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Super Admin</h1>
                <p className="text-xs text-slate-500">Gestione sistema multi-tenant</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => logoutMutation.mutate()} className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
              Logout
            </Button>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-8">
          <Tabs defaultValue="tenants" className="space-y-6">
            <TabsList className="bg-white border shadow-sm p-1 h-auto">
              <TabsTrigger value="tenants" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 px-6 py-2.5">
                Tenant
              </TabsTrigger>
              <TabsTrigger value="users" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 px-6 py-2.5">
                Utenti
              </TabsTrigger>
              <TabsTrigger value="content" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 px-6 py-2.5">
                Contenuti
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tenants">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-2xl font-semibold text-slate-900">Gestione Tenant</CardTitle>
                      <CardDescription className="mt-1">Gestisci i domini e i siti web del sistema</CardDescription>
                    </div>
                    <Dialog open={isCreateTenantOpen} onOpenChange={setIsCreateTenantOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-indigo-600 hover:bg-indigo-700">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                          Nuovo Tenant
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Crea Nuovo Tenant</DialogTitle>
                          <DialogDescription>Aggiungi un nuovo dominio al sistema</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">Nome</Label>
                            <Input id="name" placeholder="Es: Sito di Alessio" value={newTenant.name} onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="domain">Dominio</Label>
                            <Input id="domain" placeholder="Es: alessio.it" value={newTenant.domain} onChange={(e) => setNewTenant({ ...newTenant, domain: e.target.value })} />
                          </div>
                          <Button onClick={handleCreateTenant} className="w-full bg-indigo-600 hover:bg-indigo-700">Crea Tenant</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingTenants ? (
                    <div className="flex items-center justify-center py-12 text-slate-500">Caricamento...</div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {tenants.map((tenant: any) => (
                        <div key={tenant.id} className="group relative rounded-xl border bg-white p-5 hover:shadow-md transition-all">
                          <div className="flex items-start justify-between mb-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                              {tenant.name?.charAt(0)?.toUpperCase() || "T"}
                            </div>
                            <Badge variant={tenant.isActive !== false ? "default" : "secondary"} className={tenant.isActive !== false ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : ""}>
                              {tenant.isActive !== false ? "Attivo" : "Inattivo"}
                            </Badge>
                          </div>
                          <h3 className="font-semibold text-slate-900 mb-1">{tenant.name}</h3>
                          <p className="text-sm text-slate-500 mb-1">{tenant.domain}</p>
                          <p className="text-xs text-slate-400">ID: {tenant.id}</p>
                          <div className="mt-4 pt-3 border-t flex justify-end">
                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => deleteTenantMutation.mutate(tenant.id)} disabled={tenant.id === 1}>
                              Elimina
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-2xl font-semibold text-slate-900">Gestione Utenti</CardTitle>
                      <CardDescription className="mt-1">Gestisci gli utenti admin dei vari tenant</CardDescription>
                    </div>
                    <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-indigo-600 hover:bg-indigo-700">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                          Nuovo Utente
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Crea Nuovo Utente</DialogTitle>
                          <DialogDescription>Aggiungi un admin per un tenant</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Tenant</Label>
                            <Select value={newUser.tenantId.toString()} onValueChange={(value) => setNewUser({ ...newUser, tenantId: parseInt(value) })}>
                              <SelectTrigger><SelectValue placeholder="Seleziona tenant" /></SelectTrigger>
                              <SelectContent>
                                {tenants.map((tenant: any) => (
                                  <SelectItem key={tenant.id} value={tenant.id.toString()}>{tenant.name} ({tenant.domain})</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Username</Label>
                            <Input placeholder="Es: admin_alessio" value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} />
                          </div>
                          <div className="space-y-2">
                            <Label>Email</Label>
                            <Input type="email" placeholder="admin@alessio.it" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
                          </div>
                          <div className="space-y-2">
                            <Label>Password</Label>
                            <Input type="password" placeholder="Password sicura" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
                          </div>
                          <div className="space-y-2">
                            <Label>Ruolo</Label>
                            <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="editor">Editor</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button onClick={handleCreateUser} className="w-full bg-indigo-600 hover:bg-indigo-700">Crea Utente</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingUsers ? (
                    <div className="flex items-center justify-center py-12 text-slate-500">Caricamento...</div>
                  ) : (
                    <div className="space-y-3">
                      {users.map((user: any) => (
                        <div key={user.id} className="group rounded-xl border bg-white p-5 hover:shadow-md transition-all">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg shrink-0">
                              {user.username?.charAt(0)?.toUpperCase() || "U"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold text-slate-900">{user.username}</h3>
                                <Badge variant={user.role === 'superadmin' ? 'default' : 'secondary'}
                                  className={user.role === 'superadmin' ? 'bg-purple-100 text-purple-700 hover:bg-purple-100' : 'bg-slate-100 text-slate-600'}>
                                  {user.role}
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-500 truncate">{user.email}</p>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-xs text-slate-400">Tenant: {user.tenantName || getTenantName(user.tenantId)}</span>
                                <span className="text-xs text-slate-300">|</span>
                                <span className="text-xs text-slate-400">Creato: {new Date(user.createdAt).toLocaleDateString('it-IT')}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                                onClick={() => setLoginAsDialog({ open: true, userId: user.id, username: user.username })}
                                disabled={loginAsMutation.isPending}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                                Accedi
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-amber-600 border-amber-200 hover:bg-amber-50"
                                onClick={() => { setPasswordDialog({ open: true, userId: user.id, username: user.username }); setNewPassword(""); }}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                                Password
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => deleteUserMutation.mutate(user.id)}
                                disabled={user.role === 'superadmin'}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="content">
              <div className="space-y-6">
                {loadingContent ? (
                  <div className="flex items-center justify-center py-12 text-slate-500">Caricamento contenuti...</div>
                ) : (
                  <>
                    <Card className="border-0 shadow-sm">
                      <CardHeader>
                        <CardTitle>Blog Posts</CardTitle>
                        <CardDescription>Tutti i post del blog di tutti i tenant</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Titolo</TableHead>
                              <TableHead>Slug</TableHead>
                              <TableHead>Stato</TableHead>
                              <TableHead>Tenant</TableHead>
                              <TableHead>Data Creazione</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {allContent?.blogPosts?.map((post: any) => (
                              <TableRow key={post.id}>
                                <TableCell className="font-medium">{post.title}</TableCell>
                                <TableCell className="text-slate-500">{post.slug}</TableCell>
                                <TableCell>
                                  <Badge variant={post.status === 'published' ? 'default' : 'secondary'}
                                    className={post.status === 'published' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : ''}>
                                    {post.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm">{post.tenantName} <span className="text-slate-400">({post.tenantDomain})</span></span>
                                </TableCell>
                                <TableCell className="text-slate-500">{new Date(post.createdAt).toLocaleDateString('it-IT')}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm">
                      <CardHeader>
                        <CardTitle>Pagine</CardTitle>
                        <CardDescription>Tutte le pagine di tutti i tenant</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Titolo</TableHead>
                              <TableHead>Slug</TableHead>
                              <TableHead>Stato</TableHead>
                              <TableHead>Tenant</TableHead>
                              <TableHead>Data Creazione</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {allContent?.pages?.map((page: any) => (
                              <TableRow key={page.id}>
                                <TableCell className="font-medium">{page.title}</TableCell>
                                <TableCell className="text-slate-500">{page.slug}</TableCell>
                                <TableCell>
                                  <Badge variant={page.status === 'published' ? 'default' : 'secondary'}
                                    className={page.status === 'published' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : ''}>
                                    {page.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm">{page.tenantName} <span className="text-slate-400">({page.tenantDomain})</span></span>
                                </TableCell>
                                <TableCell className="text-slate-500">{new Date(page.createdAt).toLocaleDateString('it-IT')}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm">
                      <CardHeader>
                        <CardTitle>Lead</CardTitle>
                        <CardDescription>Tutti i lead di tutti i tenant</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Nome</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Azienda</TableHead>
                              <TableHead>Stato</TableHead>
                              <TableHead>Tenant</TableHead>
                              <TableHead>Data Creazione</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {allContent?.leads?.map((lead: any) => (
                              <TableRow key={lead.id}>
                                <TableCell className="font-medium">{lead.name}</TableCell>
                                <TableCell className="text-slate-500">{lead.email}</TableCell>
                                <TableCell className="text-slate-500">{lead.company || '-'}</TableCell>
                                <TableCell><Badge>{lead.status}</Badge></TableCell>
                                <TableCell>
                                  <span className="text-sm">{lead.tenantName} <span className="text-slate-400">({lead.tenantDomain})</span></span>
                                </TableCell>
                                <TableCell className="text-slate-500">{new Date(lead.createdAt).toLocaleDateString('it-IT')}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm">
                      <CardHeader>
                        <CardTitle>Servizi</CardTitle>
                        <CardDescription>Tutti i servizi di tutti i tenant</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Titolo</TableHead>
                              <TableHead>Slug</TableHead>
                              <TableHead>Stato</TableHead>
                              <TableHead>Tenant</TableHead>
                              <TableHead>Data Creazione</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {allContent?.services?.map((service: any) => (
                              <TableRow key={service.id}>
                                <TableCell className="font-medium">{service.title}</TableCell>
                                <TableCell className="text-slate-500">{service.slug}</TableCell>
                                <TableCell>
                                  <Badge variant={service.isActive ? 'default' : 'secondary'}
                                    className={service.isActive ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : ''}>
                                    {service.isActive ? 'Attivo' : 'Inattivo'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm">{service.tenantName} <span className="text-slate-400">({service.tenantDomain})</span></span>
                                </TableCell>
                                <TableCell className="text-slate-500">{new Date(service.createdAt).toLocaleDateString('it-IT')}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      <Dialog open={passwordDialog.open} onOpenChange={(open) => { setPasswordDialog({ ...passwordDialog, open }); if (!open) setNewPassword(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambia Password</DialogTitle>
            <DialogDescription>Imposta una nuova password per <strong>{passwordDialog.username}</strong></DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nuova Password</Label>
              <Input type="password" placeholder="Minimo 6 caratteri" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordDialog({ open: false, userId: "", username: "" })}>Annulla</Button>
            <Button onClick={handleChangePassword} disabled={changePasswordMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700">
              {changePasswordMutation.isPending ? "Salvataggio..." : "Salva Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={loginAsDialog.open} onOpenChange={(open) => setLoginAsDialog({ ...loginAsDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conferma accesso</DialogTitle>
            <DialogDescription>Stai per accedere come <strong>{loginAsDialog.username}</strong>. Verrai disconnesso dalla sessione SuperAdmin attuale e reindirizzato al pannello admin di questo utente.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLoginAsDialog({ open: false, userId: "", username: "" })}>Annulla</Button>
            <Button
              onClick={() => { loginAsMutation.mutate(loginAsDialog.userId); setLoginAsDialog({ open: false, userId: "", username: "" }); }}
              disabled={loginAsMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {loginAsMutation.isPending ? "Accesso in corso..." : "Conferma accesso"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
