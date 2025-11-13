import { Link, useLocation } from "wouter";
import { X, Calculator, BarChart3, TrendingUp, TrendingDown, Package, Users, Truck, FileText, Tags, Files, Building2, UserCog, HelpCircle, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCompany } from "@/contexts/CompanyContext";
import { useAuthContext } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { HelpDialog } from "@/components/shared/Help";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const [location] = useLocation();
  const { currentCompany } = useCompany();
  const { user, logout } = useAuthContext();

  const navigation = [
    { name: "Estadísticas", href: "/", icon: BarChart3 },
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
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <aside className="absolute left-0 top-0 bottom-0 w-80 max-w-[80vw] bg-card">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Calculator className="text-primary-foreground" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary">{currentCompany?.name || 'MiContable'}</h1>
              <p className="text-xs text-muted-foreground">Gestión Empresarial</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-muted rounded-lg"
            data-testid="close-mobile-menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <nav className="p-4 overflow-y-auto" style={{ maxHeight: "calc(100vh - 180px)" }}>
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = location === item.href;
              return (
                <Link 
                  key={item.name} 
                  href={item.href}
                  className={cn("sidebar-link", isActive && "active")}
                  onClick={onClose}
                  data-testid={`mobile-nav-${item.name.toLowerCase()}`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          <div className="mt-8 pt-8 border-t border-border space-y-1">
            {secondaryNav.map((item) => {
              const isActive = location === item.href;
              return (
                <Link 
                  key={item.name} 
                  href={item.href}
                  className={cn("sidebar-link", isActive && "active")}
                  onClick={onClose}
                  data-testid={`mobile-nav-${item.name.toLowerCase().replace(/ /g, '-')}`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
            
            <HelpDialog 
              trigger={
                <button 
                  className="sidebar-link w-full"
                  data-testid="mobile-nav-ayuda"
                >
                  <HelpCircle className="w-5 h-5" />
                  <span>Ayuda</span>
                </button>
              }
            />
          </div>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-card">
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
              data-testid="button-logout-mobile"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>
    </div>
  );
}
