import { Link, useLocation } from "wouter";
import { 
  Calculator,
  TrendingUp, 
  TrendingDown, 
  Package, 
  Users, 
  Truck, 
  FileText, 
  Settings, 
  HelpCircle,
  BarChart3,
  Tags,
  Files,
  Building2,
  UserCog,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";
import { Button } from "@/components/ui/button";

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuthContext();
  const { currentCompany } = useCompany();

  const navigation = [
    { name: "Dashboard", href: "/", icon: BarChart3 },
    { name: "Ingresos", href: "/ingresos", icon: TrendingUp },
    { name: "Gastos", href: "/gastos", icon: TrendingDown },
    { name: "Inventario", href: "/inventario", icon: Package },
    { name: "Clientes", href: "/clientes", icon: Users },
    { name: "Proveedores", href: "/proveedores", icon: Truck },
    { name: "Informes", href: "/informes", icon: FileText },
  ];

  const secondaryNav = [
    { name: "Categorías de Ingresos", href: "/categorias-ingresos", icon: Tags },
    { name: "Categorías de Gastos", href: "/categorias-gastos", icon: Tags },
    { name: "Categorías Inventario", href: "/categorias-productos", icon: Tags },
    { name: "Categorías Documentos", href: "/categorias-documentos", icon: Tags },
    { name: "Gestión Documental", href: "/gestion-documental", icon: Files },
    ...(user?.isAdmin ? [
      { name: "Empresas", href: "/empresas", icon: Building2 },
      { name: "Usuarios", href: "/usuarios", icon: UserCog }
    ] : []),
    { name: "Ayuda", href: "/ayuda", icon: HelpCircle },
  ];

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-card border-r border-border">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Calculator className="text-primary-foreground" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary">{currentCompany?.name || 'MiContable'}</h1>
            <p className="text-xs text-muted-foreground">Gestión Empresarial</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={cn("sidebar-link", isActive && "active")}
                data-testid={`nav-${item.name.toLowerCase()}`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>

        <div className="mt-8 pt-8 border-t border-border">
          {secondaryNav.map((item) => {
            const isActive = location === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={cn("sidebar-link", isActive && "active")}
                data-testid={`nav-${item.name.toLowerCase()}`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
            <span className="text-primary-foreground font-semibold">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.isAdmin ? 'Administrador' : 'Usuario'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            title="Cerrar sesión"
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
