import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock, Users, MapPin, LogOut, Check, X,
  RefreshCw, Phone, Calendar, AlertTriangle,
  CheckCircle, Trash2, Pencil, Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Alert, User, AlertStatus, timeAgo } from '@/types/alert';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const ADMIN_CODE = 'lessa2030';

interface AlertFromDB {
  id: string;
  user_id: string;
  address_text: string;
  neighborhood: string | null;
  lat: number;
  lng: number;
  status: 'ACTIVE' | 'RESOLVED' | 'EXPIRED';
  notes: string | null;
  created_at: string;
  updated_at: string;
  expires_at: string;
  resolved_at: string | null;
}

interface UserFromDB {
  id: string;
  full_name: string;
  phone: string;
  token: string;
  default_address_text: string | null;
  default_lat: number | null;
  default_lng: number | null;
  created_at: string;
  updated_at: string;
}

export default function Admin() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Edit/Delete dialogs
  const [editAlertOpen, setEditAlertOpen] = useState(false);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [deleteUserOpen, setDeleteUserOpen] = useState(false);

  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Edit form states
  const [editAlertForm, setEditAlertForm] = useState({
    addressText: '',
    neighborhood: '',
    notes: ''
  });
  const [editUserForm, setEditUserForm] = useState({
    fullName: '',
    phone: '',
    defaultAddressText: ''
  });

  const transformAlert = (dbAlert: AlertFromDB, photos: string[] = []): Alert => {
    return {
      id: dbAlert.id,
      userId: dbAlert.user_id,
      addressText: dbAlert.address_text,
      neighborhood: dbAlert.neighborhood || undefined,
      lat: dbAlert.lat,
      lng: dbAlert.lng,
      status: dbAlert.status as AlertStatus,
      notes: dbAlert.notes || undefined,
      photos,
      createdAt: new Date(dbAlert.created_at),
      updatedAt: new Date(dbAlert.updated_at),
      expiresAt: new Date(dbAlert.expires_at),
      resolvedAt: dbAlert.resolved_at ? new Date(dbAlert.resolved_at) : undefined,
    };
  };

  const transformUser = (dbUser: UserFromDB): User => {
    return {
      id: dbUser.id,
      fullName: dbUser.full_name,
      phone: dbUser.phone,
      token: dbUser.token,
      defaultAddressText: dbUser.default_address_text || undefined,
      defaultLat: dbUser.default_lat || undefined,
      defaultLng: dbUser.default_lng || undefined,
      createdAt: new Date(dbUser.created_at),
    };
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch alerts
      const { data: alertsData, error: alertsError } = await supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false });

      if (alertsError) throw alertsError;

      // Fetch photos for alerts
      const alertIds = (alertsData || []).map(a => a.id);
      const { data: mediaData } = await supabase
        .from('alert_media')
        .select('alert_id, photo_url')
        .in('alert_id', alertIds);

      const photosByAlert: Record<string, string[]> = {};
      (mediaData || []).forEach((m) => {
        if (!photosByAlert[m.alert_id]) {
          photosByAlert[m.alert_id] = [];
        }
        photosByAlert[m.alert_id].push(m.photo_url);
      });

      const transformedAlerts = (alertsData || []).map((dbAlert: AlertFromDB) =>
        transformAlert(dbAlert, photosByAlert[dbAlert.id] || [])
      );

      setAlerts(transformedAlerts);
      setActiveCount(transformedAlerts.filter(a => a.status === 'ACTIVE').length);

      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('sentinela_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      setUsers((usersData || []).map(transformUser));
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const isAuth = sessionStorage.getItem('sentinela_admin') === 'true';
    setIsAuthenticated(isAuth);

    if (isAuth) {
      loadData();
    }
  }, [loadData]);

  const handleLogin = () => {
    if (accessCode === ADMIN_CODE) {
      sessionStorage.setItem('sentinela_admin', 'true');
      setIsAuthenticated(true);
      loadData();
      toast.success('Acesso autorizado');
    } else {
      toast.error('Código de acesso incorreto');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('sentinela_admin');
    setIsAuthenticated(false);
    setAccessCode('');
    navigate('/');
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({
          status: 'RESOLVED' as const,
          resolved_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error) throw error;

      await loadData();
      toast.success('Alerta marcado como resolvido');
    } catch (error) {
      console.error('Error resolving alert:', error);
      toast.error('Erro ao resolver alerta');
    }
  };

  const handleReactivateAlert = async (alertId: string) => {
    try {
      const newExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const { error } = await supabase
        .from('alerts')
        .update({
          status: 'ACTIVE' as const,
          expires_at: newExpiresAt,
          resolved_at: null
        })
        .eq('id', alertId);

      if (error) throw error;

      await loadData();
      toast.success('Alerta reativado');
    } catch (error) {
      console.error('Error reactivating alert:', error);
      toast.error('Erro ao reativar alerta');
    }
  };

  // Alert Edit/Delete handlers
  const openEditAlert = (alert: Alert) => {
    setSelectedAlert(alert);
    setEditAlertForm({
      addressText: alert.addressText,
      neighborhood: alert.neighborhood || '',
      notes: alert.notes || ''
    });
    setEditAlertOpen(true);
  };

  const handleSaveAlert = async () => {
    if (!selectedAlert) return;

    try {
      const { error } = await supabase
        .from('alerts')
        .update({
          address_text: editAlertForm.addressText,
          neighborhood: editAlertForm.neighborhood || null,
          notes: editAlertForm.notes || null
        })
        .eq('id', selectedAlert.id);

      if (error) throw error;

      setEditAlertOpen(false);
      await loadData();
      toast.success('Alerta atualizado');
    } catch (error) {
      console.error('Error updating alert:', error);
      toast.error('Erro ao atualizar alerta');
    }
  };

  const openDeleteAlert = (alert: Alert) => {
    setSelectedAlert(alert);
    setDeleteAlertOpen(true);
  };

  const handleConfirmDeleteAlert = async () => {
    if (!selectedAlert) return;

    try {
      // First delete related media
      await supabase
        .from('alert_media')
        .delete()
        .eq('alert_id', selectedAlert.id);

      // Then delete the alert
      const { error } = await supabase
        .from('alerts')
        .delete()
        .eq('id', selectedAlert.id);

      if (error) throw error;

      setDeleteAlertOpen(false);
      await loadData();
      toast.success('Alerta excluído');
    } catch (error) {
      console.error('Error deleting alert:', error);
      toast.error('Erro ao excluir alerta');
    }
  };

  // User Edit/Delete handlers
  const openEditUser = (user: User) => {
    setSelectedUser(user);
    setEditUserForm({
      fullName: user.fullName,
      phone: user.phone,
      defaultAddressText: user.defaultAddressText || ''
    });
    setEditUserOpen(true);
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;

    try {
      const { error } = await supabase
        .from('sentinela_users')
        .update({
          full_name: editUserForm.fullName,
          phone: editUserForm.phone,
          default_address_text: editUserForm.defaultAddressText || null
        })
        .eq('id', selectedUser.id);

      if (error) throw error;

      setEditUserOpen(false);
      await loadData();
      toast.success('Usuário atualizado');
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Erro ao atualizar usuário');
    }
  };

  const openDeleteUser = (user: User) => {
    setSelectedUser(user);
    setDeleteUserOpen(true);
  };

  const handleConfirmDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      // First delete user's alerts and their media
      const { data: userAlerts } = await supabase
        .from('alerts')
        .select('id')
        .eq('user_id', selectedUser.id);

      if (userAlerts && userAlerts.length > 0) {
        const alertIds = userAlerts.map(a => a.id);

        // Delete media for all user's alerts
        await supabase
          .from('alert_media')
          .delete()
          .in('alert_id', alertIds);

        // Delete all user's alerts
        await supabase
          .from('alerts')
          .delete()
          .eq('user_id', selectedUser.id);
      }

      // Then delete the user
      const { error } = await supabase
        .from('sentinela_users')
        .delete()
        .eq('id', selectedUser.id);

      if (error) throw error;

      setDeleteUserOpen(false);
      await loadData();
      toast.success('Usuário excluído');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Erro ao excluir usuário');
    }
  };

  const getStatusBadge = (status: Alert['status']) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-primary text-primary-foreground">Ativo</Badge>;
      case 'RESOLVED':
        return <Badge className="bg-success text-success-foreground">Resolvido</Badge>;
      case 'EXPIRED':
        return <Badge variant="secondary">Expirado</Badge>;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-xl border-border/50 animate-scale-in">
          <CardHeader className="text-center pb-2">
            <div className="w-18 h-18 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center mx-auto mb-5 border border-primary/10" style={{ width: '72px', height: '72px' }}>
              <Lock className="w-9 h-9 text-primary" />
            </div>
            <CardTitle className="text-xl">Área Administrativa</CardTitle>
            <p className="text-sm text-muted-foreground mt-1.5">
              Digite o código de acesso para continuar
            </p>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <input
              type="password"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="Código de acesso"
              className="input-field text-center"
              autoFocus
            />
            <Button onClick={handleLogin} className="w-full h-11 text-base font-semibold">
              Acessar
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => navigate('/')}
            >
              Voltar ao mapa
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="relative bg-card border-b border-border/50 px-4 py-4">
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-secondary to-primary opacity-30" />
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center border border-primary/10">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-foreground">Painel Administrativo</h1>
              <p className="text-xs text-muted-foreground">Sentinela • Supabase</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-border/50 shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center ring-2 ring-primary/10">
                  <AlertTriangle className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">{activeCount}</p>
                  <p className="text-xs text-muted-foreground">Alertas Ativos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-secondary/10 flex items-center justify-center ring-2 ring-secondary/10">
                  <MapPin className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">{alerts.length}</p>
                  <p className="text-xs text-muted-foreground">Total de Alertas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-success/10 flex items-center justify-center ring-2 ring-success/10">
                  <Users className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">{users.length}</p>
                  <p className="text-xs text-muted-foreground">Usuários Cadastrados</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center ring-2 ring-border/30">
                  <CheckCircle className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">
                    {alerts.filter(a => a.status === 'RESOLVED').length}
                  </p>
                  <p className="text-xs text-muted-foreground">Resolvidos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="alerts" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="alerts">Alertas</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
          </TabsList>

          <TabsContent value="alerts" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Gerenciar Alertas</CardTitle>
                <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Atualizar
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Endereço</TableHead>
                        <TableHead>Bairro</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Criado</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {alerts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground">
                            {isLoading ? 'Carregando...' : 'Nenhum alerta encontrado'}
                          </TableCell>
                        </TableRow>
                      ) : (
                        alerts.map((alert) => (
                          <TableRow key={alert.id}>
                            <TableCell className="font-mono text-xs">{alert.id}</TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              {alert.addressText}
                            </TableCell>
                            <TableCell>{alert.neighborhood || '-'}</TableCell>
                            <TableCell>{getStatusBadge(alert.status)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {timeAgo(alert.createdAt)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {alert.status === 'ACTIVE' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleResolveAlert(alert.id)}
                                    className="text-success hover:text-success h-8 w-8 p-0"
                                    title="Resolver"
                                  >
                                    <Check className="w-4 h-4" />
                                  </Button>
                                )}
                                {(alert.status === 'RESOLVED' || alert.status === 'EXPIRED') && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleReactivateAlert(alert.id)}
                                    className="text-primary hover:text-primary h-8 w-8 p-0"
                                    title="Reativar"
                                  >
                                    <RefreshCw className="w-4 h-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditAlert(alert)}
                                  className="h-8 w-8 p-0"
                                  title="Editar"
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openDeleteAlert(alert)}
                                  className="text-destructive hover:text-destructive h-8 w-8 p-0"
                                  title="Excluir"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Usuários Cadastrados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead>Token</TableHead>
                        <TableHead>Cadastrado em</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            {isLoading ? 'Carregando...' : 'Nenhum usuário cadastrado'}
                          </TableCell>
                        </TableRow>
                      ) : (
                        users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.fullName}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-muted-foreground" />
                                {user.phone}
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-xs">{user.token}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditUser(user)}
                                  className="h-8 w-8 p-0"
                                  title="Editar"
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openDeleteUser(user)}
                                  className="text-destructive hover:text-destructive h-8 w-8 p-0"
                                  title="Excluir"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Edit Alert Dialog */}
      <Dialog open={editAlertOpen} onOpenChange={setEditAlertOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Alerta</DialogTitle>
            <DialogDescription>
              Modifique as informações do alerta
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="addressText">Endereço</Label>
              <Input
                id="addressText"
                value={editAlertForm.addressText}
                onChange={(e) => setEditAlertForm(prev => ({ ...prev, addressText: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="neighborhood">Bairro</Label>
              <Input
                id="neighborhood"
                value={editAlertForm.neighborhood}
                onChange={(e) => setEditAlertForm(prev => ({ ...prev, neighborhood: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={editAlertForm.notes}
                onChange={(e) => setEditAlertForm(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditAlertOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveAlert}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Alert Dialog */}
      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Alerta</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este alerta? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteAlert}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit User Dialog */}
      <Dialog open={editUserOpen} onOpenChange={setEditUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Modifique as informações do usuário
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome Completo</Label>
              <Input
                id="fullName"
                value={editUserForm.fullName}
                onChange={(e) => setEditUserForm(prev => ({ ...prev, fullName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={editUserForm.phone}
                onChange={(e) => setEditUserForm(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultAddressText">Endereço Padrão</Label>
              <Input
                id="defaultAddressText"
                value={editUserForm.defaultAddressText}
                onChange={(e) => setEditUserForm(prev => ({ ...prev, defaultAddressText: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUserOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveUser}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <AlertDialog open={deleteUserOpen} onOpenChange={setDeleteUserOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este usuário e todos os seus alertas? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
