import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Lock, Users, MapPin, LogOut, Check, X, 
  RefreshCw, Phone, Calendar, AlertTriangle,
  CheckCircle, Trash2, Pencil
} from 'lucide-react';
import { 
  getAllAlerts, 
  updateAlertStatus,
  countActiveAlerts,
  deleteAlert,
  updateAlert,
  getAllUsers,
  deleteUser,
  updateUser
} from '@/store/alertStore';
import { Alert, User, timeAgo } from '@/types/alert';
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

export default function Admin() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activeCount, setActiveCount] = useState(0);

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

  useEffect(() => {
    const isAuth = sessionStorage.getItem('sentinela_admin') === 'true';
    setIsAuthenticated(isAuth);
    
    if (isAuth) {
      loadData();
    }
  }, []);

  const loadData = () => {
    const allAlerts = getAllAlerts();
    setAlerts(allAlerts);
    setActiveCount(countActiveAlerts());
    setUsers(getAllUsers());
  };

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

  const handleResolveAlert = (alertId: string) => {
    updateAlertStatus(alertId, 'RESOLVED');
    loadData();
    toast.success('Alerta marcado como resolvido');
  };

  const handleReactivateAlert = (alertId: string) => {
    updateAlertStatus(alertId, 'ACTIVE');
    loadData();
    toast.success('Alerta reativado');
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

  const handleSaveAlert = () => {
    if (!selectedAlert) return;
    updateAlert(selectedAlert.id, editAlertForm);
    setEditAlertOpen(false);
    loadData();
    toast.success('Alerta atualizado');
  };

  const openDeleteAlert = (alert: Alert) => {
    setSelectedAlert(alert);
    setDeleteAlertOpen(true);
  };

  const handleConfirmDeleteAlert = () => {
    if (!selectedAlert) return;
    deleteAlert(selectedAlert.id);
    setDeleteAlertOpen(false);
    loadData();
    toast.success('Alerta excluído');
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

  const handleSaveUser = () => {
    if (!selectedUser) return;
    updateUser(selectedUser.id, editUserForm);
    setEditUserOpen(false);
    loadData();
    toast.success('Usuário atualizado');
  };

  const openDeleteUser = (user: User) => {
    setSelectedUser(user);
    setDeleteUserOpen(true);
  };

  const handleConfirmDeleteUser = () => {
    if (!selectedUser) return;
    deleteUser(selectedUser.id);
    setDeleteUserOpen(false);
    loadData();
    toast.success('Usuário excluído');
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
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <CardTitle>Área Administrativa</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Digite o código de acesso para continuar
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              type="password"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="Código de acesso"
              className="input-field"
              autoFocus
            />
            <Button onClick={handleLogin} className="w-full">
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
      <header className="bg-card border-b border-border px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-foreground">Painel Administrativo</h1>
              <p className="text-xs text-muted-foreground">Sentinela</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{activeCount}</p>
                  <p className="text-xs text-muted-foreground">Alertas Ativos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <MapPin className="w-8 h-8 text-secondary" />
                <div>
                  <p className="text-2xl font-bold">{alerts.length}</p>
                  <p className="text-xs text-muted-foreground">Total de Alertas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-success" />
                <div>
                  <p className="text-2xl font-bold">{users.length}</p>
                  <p className="text-xs text-muted-foreground">Usuários Cadastrados</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">
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
                <Button variant="outline" size="sm" onClick={loadData}>
                  <RefreshCw className="w-4 h-4 mr-2" />
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
                            Nenhum alerta encontrado
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
                        <TableHead>Endereço Padrão</TableHead>
                        <TableHead>Cadastrado em</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            Nenhum usuário cadastrado
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
                            <TableCell className="max-w-[200px] truncate">
                              {user.defaultAddressText || '-'}
                            </TableCell>
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
              Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.
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