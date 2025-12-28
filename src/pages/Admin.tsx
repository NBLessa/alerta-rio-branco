import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Lock, Users, MapPin, LogOut, Check, X, 
  RefreshCw, Eye, Phone, Calendar, AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { 
  getAllAlerts, 
  updateAlertStatus,
  countActiveAlerts
} from '@/store/alertStore';
import { Alert, timeAgo } from '@/types/alert';
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

const ADMIN_CODE = 'lessa2030';

interface User {
  id: string;
  fullName: string;
  phone: string;
  defaultAddressText?: string;
  createdAt: Date;
}

export default function Admin() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activeCount, setActiveCount] = useState(0);

  useEffect(() => {
    // Check if already authenticated in session
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
    
    // Load users from localStorage
    const storedUsers = localStorage.getItem('sentinela_users');
    if (storedUsers) {
      const parsedUsers = JSON.parse(storedUsers).map((u: User) => ({
        ...u,
        createdAt: new Date(u.createdAt),
      }));
      setUsers(parsedUsers);
    }
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
                              <div className="flex items-center gap-2">
                                {alert.status === 'ACTIVE' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleResolveAlert(alert.id)}
                                    className="text-success hover:text-success"
                                  >
                                    <Check className="w-4 h-4 mr-1" />
                                    Resolver
                                  </Button>
                                )}
                                {(alert.status === 'RESOLVED' || alert.status === 'EXPIRED') && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleReactivateAlert(alert.id)}
                                    className="text-primary hover:text-primary"
                                  >
                                    <RefreshCw className="w-4 h-4 mr-1" />
                                    Reativar
                                  </Button>
                                )}
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
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground">
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
    </div>
  );
}
