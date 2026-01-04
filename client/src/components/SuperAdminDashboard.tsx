import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { SEOHead } from "./SEOHead";

// Function to clear authentication token (assuming this exists elsewhere)
// For demonstration purposes, let's assume it's imported or defined here.
// import { clearAuthToken } from "@/lib/auth"; 

// Mock clearAuthToken for local testing if not available
const clearAuthToken = () => {
  console.log("Auth token cleared");
  // In a real app, this would remove tokens from localStorage, cookies, etc.
  // And potentially redirect the user
  window.location.href = '/login'; // Example redirect
};

export default function SuperAdminDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [newTenant, setNewTenant] = useState({ name: "", domain: "", isActive: true });
  const [newUser, setNewUser] = useState({ username: "", email: "", password: "", role: "admin", tenantId: 1 });
  const [isCreateTenantOpen, setIsCreateTenantOpen] = useState(false);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);

  // Fetch tenants
  const { data: tenants = [], isLoading: loadingTenants } = useQuery<any[]>({
    queryKey: ['/api/superadmin/tenants'],
  });

  // Fetch users
  const { data: users = [], isLoading: loadingUsers } = useQuery<any[]>({
    queryKey: ['/api/superadmin/users'],
  });

  // Fetch all content across tenants
  const { data: allContent, isLoading: loadingContent } = useQuery<any>({
    queryKey: ['/api/superadmin/content/all'],
  });

  // Create tenant mutation
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

  // Create user mutation
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
      toast({
        title: "Errore nella creazione dell'utente",
        description: error.message || "Riprova più tardi",
        variant: "destructive"
      });
    }
  });

  // Delete tenant mutation
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

  // Delete user mutation
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

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
      clearAuthToken(); // Clear token and redirect
    },
    onSuccess: () => {
      toast({ title: "Logout effettuato con successo!" });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] }); // Invalidate auth status
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

  return (
    <>
      <SEOHead 
        title="SuperAdmin Dashboard"
        description="Area super amministrativa"
        noindex={true}
        usePageData={false}
      />
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold">Super Admin Dashboard</h1>
              <p className="text-muted-foreground mt-2">Gestisci tenant e utenti del sistema</p>
            </div>
            <Button variant="destructive" onClick={() => logoutMutation.mutate()}>Logout</Button>
          </div>

          <Tabs defaultValue="tenants" className="space-y-6">
            <TabsList>
              <TabsTrigger value="tenants">Tenant</TabsTrigger>
              <TabsTrigger value="users">Utenti</TabsTrigger>
              <TabsTrigger value="content">Contenuti</TabsTrigger>
            </TabsList>

            <TabsContent value="tenants">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Gestione Tenant</CardTitle>
                      <CardDescription>Gestisci i domini e i tenant del sistema</CardDescription>
                    </div>
                    <Dialog open={isCreateTenantOpen} onOpenChange={setIsCreateTenantOpen}>
                      <DialogTrigger asChild>
                        <Button>Nuovo Tenant</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Crea Nuovo Tenant</DialogTitle>
                          <DialogDescription>Aggiungi un nuovo dominio al sistema</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">Nome</Label>
                            <Input
                              id="name"
                              placeholder="Es: Sito di Alessio"
                              value={newTenant.name}
                              onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="domain">Dominio</Label>
                            <Input
                              id="domain"
                              placeholder="Es: alessio.it"
                              value={newTenant.domain}
                              onChange={(e) => setNewTenant({ ...newTenant, domain: e.target.value })}
                            />
                          </div>
                          <Button onClick={handleCreateTenant} className="w-full">
                            Crea Tenant
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingTenants ? (
                    <p>Caricamento...</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Nome</TableHead>
                          <TableHead>Dominio</TableHead>
                          <TableHead>Stato</TableHead>
                          <TableHead>Azioni</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tenants.map((tenant: any) => (
                          <TableRow key={tenant.id}>
                            <TableCell>{tenant.id}</TableCell>
                            <TableCell>{tenant.name}</TableCell>
                            <TableCell>{tenant.domain}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded text-xs ${tenant.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                {tenant.isActive ? 'Attivo' : 'Inattivo'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteTenantMutation.mutate(tenant.id)}
                                disabled={tenant.id === 1}
                              >
                                Elimina
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Gestione Utenti</CardTitle>
                      <CardDescription>Gestisci gli utenti admin dei vari tenant</CardDescription>
                    </div>
                    <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
                      <DialogTrigger asChild>
                        <Button>Nuovo Utente</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Crea Nuovo Utente</DialogTitle>
                          <DialogDescription>Aggiungi un admin per un tenant</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="tenant">Tenant</Label>
                            <Select
                              value={newUser.tenantId.toString()}
                              onValueChange={(value) => setNewUser({ ...newUser, tenantId: parseInt(value) })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleziona tenant" />
                              </SelectTrigger>
                              <SelectContent>
                                {tenants.map((tenant: any) => (
                                  <SelectItem key={tenant.id} value={tenant.id.toString()}>
                                    {tenant.name} ({tenant.domain})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input
                              id="username"
                              placeholder="Es: admin_alessio"
                              value={newUser.username}
                              onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                              id="email"
                              type="email"
                              placeholder="admin@alessio.it"
                              value={newUser.email}
                              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                              id="password"
                              type="password"
                              placeholder="Password sicura"
                              value={newUser.password}
                              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="role">Ruolo</Label>
                            <Select
                              value={newUser.role}
                              onValueChange={(value) => setNewUser({ ...newUser, role: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="editor">Editor</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button onClick={handleCreateUser} className="w-full">
                            Crea Utente
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingUsers ? (
                    <p>Caricamento...</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Username</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Ruolo</TableHead>
                          <TableHead>Tenant</TableHead>
                          <TableHead>Password Hash</TableHead>
                          <TableHead>Data Creazione</TableHead>
                          <TableHead className="text-right">Azioni</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user: any) => (
                          <TableRow key={user.id}>
                            <TableCell>{user.username}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <Badge variant={user.role === 'superadmin' ? 'default' : 'secondary'}>
                                {user.role}
                              </Badge>
                            </TableCell>
                            <TableCell>{user.tenantName || '-'}</TableCell>
                            <TableCell>
                              <code className="text-xs bg-muted px-1 py-0.5 rounded">
                                {(user as any).password?.substring(0, 20)}...
                              </code>
                            </TableCell>
                            <TableCell>{new Date(user.createdAt).toLocaleDateString('it-IT')}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteUserMutation.mutate(user.id)}
                                disabled={user.role === 'superadmin'}
                              >
                                Elimina
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="content">
              <div className="space-y-6">
                {loadingContent ? (
                  <p>Caricamento contenuti...</p>
                ) : (
                  <>
                    {/* Blog Posts */}
                    <Card>
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
                                <TableCell>{post.title}</TableCell>
                                <TableCell>{post.slug}</TableCell>
                                <TableCell>
                                  <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                                    {post.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm">
                                    {post.tenantName} <span className="text-muted-foreground">({post.tenantDomain})</span>
                                  </span>
                                </TableCell>
                                <TableCell>{new Date(post.createdAt).toLocaleDateString('it-IT')}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>

                    {/* Pages */}
                    <Card>
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
                                <TableCell>{page.title}</TableCell>
                                <TableCell>{page.slug}</TableCell>
                                <TableCell>
                                  <Badge variant={page.status === 'published' ? 'default' : 'secondary'}>
                                    {page.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm">
                                    {page.tenantName} <span className="text-muted-foreground">({page.tenantDomain})</span>
                                  </span>
                                </TableCell>
                                <TableCell>{new Date(page.createdAt).toLocaleDateString('it-IT')}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>

                    {/* Leads */}
                    <Card>
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
                                <TableCell>{lead.name}</TableCell>
                                <TableCell>{lead.email}</TableCell>
                                <TableCell>{lead.company || '-'}</TableCell>
                                <TableCell>
                                  <Badge>{lead.status}</Badge>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm">
                                    {lead.tenantName} <span className="text-muted-foreground">({lead.tenantDomain})</span>
                                  </span>
                                </TableCell>
                                <TableCell>{new Date(lead.createdAt).toLocaleDateString('it-IT')}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>

                    {/* Services */}
                    <Card>
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
                                <TableCell>{service.title}</TableCell>
                                <TableCell>{service.slug}</TableCell>
                                <TableCell>
                                  <Badge variant={service.isActive ? 'default' : 'secondary'}>
                                    {service.isActive ? 'Attivo' : 'Inattivo'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm">
                                    {service.tenantName} <span className="text-muted-foreground">({service.tenantDomain})</span>
                                  </span>
                                </TableCell>
                                <TableCell>{new Date(service.createdAt).toLocaleDateString('it-IT')}</TableCell>
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
        </div>
      </div>
    </>
  );
}