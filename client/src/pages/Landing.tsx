import { Building2, ShieldCheck, Users, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface LandingProps {
  onLogin: () => void;
}

export default function Landing({ onLogin }: LandingProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center text-center space-y-8">
          <div className="space-y-4 max-w-3xl">
            <h1 
              className="text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-violet-600 dark:from-blue-400 dark:to-violet-400"
              data-testid="text-hero-title"
            >
              Sistema de Gestión Empresarial
            </h1>
            <p className="text-xl text-muted-foreground" data-testid="text-hero-description">
              Gestiona tus finanzas, inventarios, clientes y proveedores en un solo lugar.
              Control de acceso por empresa con permisos personalizados.
            </p>
          </div>

          <Button 
            size="lg" 
            onClick={onLogin}
            className="text-lg px-8 py-6 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 dark:from-blue-500 dark:to-violet-500 dark:hover:from-blue-600 dark:hover:to-violet-600"
            data-testid="button-login"
          >
            Iniciar Sesión con Replit
          </Button>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl mt-16">
            <Card className="border-2 hover:shadow-lg transition-shadow" data-testid="card-feature-1">
              <CardHeader>
                <Building2 className="h-12 w-12 text-blue-600 dark:text-blue-400 mb-2" />
                <CardTitle>Multi-Empresa</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Gestiona múltiples empresas desde una sola cuenta con control de acceso granular.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-lg transition-shadow" data-testid="card-feature-2">
              <CardHeader>
                <ShieldCheck className="h-12 w-12 text-violet-600 dark:text-violet-400 mb-2" />
                <CardTitle>Permisos Seguros</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Control de acceso basado en roles: consulta (lectura) y administración (lectura/escritura).
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-lg transition-shadow" data-testid="card-feature-3">
              <CardHeader>
                <Users className="h-12 w-12 text-blue-600 dark:text-blue-400 mb-2" />
                <CardTitle>Gestión de Usuarios</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Administradores pueden asignar permisos y gestionar el acceso de usuarios a empresas.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-lg transition-shadow" data-testid="card-feature-4">
              <CardHeader>
                <TrendingUp className="h-12 w-12 text-violet-600 dark:text-violet-400 mb-2" />
                <CardTitle>Análisis Completo</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Reportes financieros, control de inventario, gestión de clientes y proveedores en tiempo real.
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          <div className="mt-16 max-w-4xl">
            <h2 className="text-2xl font-semibold mb-6" data-testid="text-features-heading">Características Principales</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="flex items-start space-x-3" data-testid="feature-financial-control">
                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-600/10 dark:bg-blue-400/10 flex items-center justify-center mt-0.5">
                  <div className="h-3 w-3 rounded-full bg-blue-600 dark:bg-blue-400" />
                </div>
                <div>
                  <p className="font-medium">Control Financiero</p>
                  <p className="text-sm text-muted-foreground">Gestión de ingresos y gastos con categorías personalizadas</p>
                </div>
              </div>
              <div className="flex items-start space-x-3" data-testid="feature-smart-inventory">
                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-violet-600/10 dark:bg-violet-400/10 flex items-center justify-center mt-0.5">
                  <div className="h-3 w-3 rounded-full bg-violet-600 dark:bg-violet-400" />
                </div>
                <div>
                  <p className="font-medium">Inventario Inteligente</p>
                  <p className="text-sm text-muted-foreground">Seguimiento de productos con alertas de stock mínimo</p>
                </div>
              </div>
              <div className="flex items-start space-x-3" data-testid="feature-integrated-crm">
                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-600/10 dark:bg-blue-400/10 flex items-center justify-center mt-0.5">
                  <div className="h-3 w-3 rounded-full bg-blue-600 dark:bg-blue-400" />
                </div>
                <div>
                  <p className="font-medium">CRM Integrado</p>
                  <p className="text-sm text-muted-foreground">Gestión de clientes y proveedores centralizada</p>
                </div>
              </div>
              <div className="flex items-start space-x-3" data-testid="feature-digital-docs">
                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-violet-600/10 dark:bg-violet-400/10 flex items-center justify-center mt-0.5">
                  <div className="h-3 w-3 rounded-full bg-violet-600 dark:bg-violet-400" />
                </div>
                <div>
                  <p className="font-medium">Documentación Digital</p>
                  <p className="text-sm text-muted-foreground">Almacenamiento y gestión de documentos importantes</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
