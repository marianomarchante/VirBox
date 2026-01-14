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
  UserCog,
  LogOut,
  CalendarDays,
  Images,
  ShoppingBag,
  ClipboardList,
  Receipt
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";
import { Button } from "@/components/ui/button";
import { HelpDialog } from "@/components/shared/Help";
import { ObjectsGallery } from "@/components/inventory/ObjectsGallery";

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuthContext();
  const { currentCompany } = useCompany();

  const navigationAfterInventory = [
    { name: "Informes", href: "/informes", icon: FileText },
  ];

  const navigationAfterDocuments = [
    { name: "Eventos", href: "/eventos", icon: CalendarDays },
  ];

  const secondaryNav = [
    ...(user?.isAdmin ? [
      { name: "Usuarios", href: "/usuarios", icon: UserCog }
    ] : []),
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
          <Link 
            href="/"
            className={cn("sidebar-link", location === "/" && "active")}
            data-testid="nav-estadísticas"
          >
            <BarChart3 className="w-5 h-5" />
            <span>Estadísticas</span>
          </Link>
        </div>

        <div className="my-2 p-2 rounded-lg border-2 border-[#800020] bg-[#800020]/5">
          <Link 
            href="/ingresos"
            className={cn("sidebar-link", location === "/ingresos" && "active")}
            data-testid="nav-ingresos"
          >
            <TrendingUp className="w-5 h-5" />
            <span>Ingresos</span>
          </Link>
          <Link 
            href="/categorias-ingresos"
            className={cn("sidebar-link", location === "/categorias-ingresos" && "active")}
            data-testid="nav-categorías-ingresos"
          >
            <Tags className="w-5 h-5" />
            <span>Categorías de Ingresos</span>
          </Link>
          <Link 
            href="/clientes"
            className={cn("sidebar-link", location === "/clientes" && "active")}
            data-testid="nav-clientes"
          >
            <Users className="w-5 h-5" />
            <span>Clientes</span>
          </Link>
        </div>

        <div className="my-2 p-2 rounded-lg border-2 border-[#800020] bg-[#800020]/5">
          <Link 
            href="/gastos"
            className={cn("sidebar-link", location === "/gastos" && "active")}
            data-testid="nav-gastos"
          >
            <TrendingDown className="w-5 h-5" />
            <span>Gastos</span>
          </Link>
          <Link 
            href="/categorias-gastos"
            className={cn("sidebar-link", location === "/categorias-gastos" && "active")}
            data-testid="nav-categorías-gastos"
          >
            <Tags className="w-5 h-5" />
            <span>Categorías de Gastos</span>
          </Link>
          <Link 
            href="/proveedores"
            className={cn("sidebar-link", location === "/proveedores" && "active")}
            data-testid="nav-proveedores"
          >
            <Truck className="w-5 h-5" />
            <span>Proveedores</span>
          </Link>
        </div>

        <div className="my-2 p-2 rounded-lg border-2 border-[#800020] bg-[#800020]/5">
          <Link 
            href="/inventario"
            className={cn("sidebar-link", location === "/inventario" && "active")}
            data-testid="nav-inventario"
          >
            <Package className="w-5 h-5" />
            <span>Inventario</span>
          </Link>
          <Link 
            href="/categorias-productos"
            className={cn("sidebar-link", location === "/categorias-productos" && "active")}
            data-testid="nav-categorías-inventario"
          >
            <Tags className="w-5 h-5" />
            <span>Categorías Inventario</span>
          </Link>
          <ObjectsGallery
            trigger={
              <button 
                className="sidebar-link w-full bg-[#FFFACD] hover:bg-white text-[#800020] hover:text-[#800020] border border-[#800020] hover:border-[#800020] font-semibold"
                data-testid="nav-objetos"
              >
                <Images className="w-5 h-5" />
                <span>Objetos Inventario</span>
              </button>
            }
          />
        </div>

        <div className="my-2 p-2 rounded-lg border-2 border-[#800020] bg-[#800020]/5">
          <Link 
            href="/articulos"
            className={cn("sidebar-link", location === "/articulos" && "active")}
            data-testid="nav-articulos"
          >
            <ShoppingBag className="w-5 h-5" />
            <span>Artículos</span>
          </Link>
          <Link 
            href="/albaranes"
            className={cn("sidebar-link", location === "/albaranes" && "active")}
            data-testid="nav-albaranes"
          >
            <ClipboardList className="w-5 h-5" />
            <span>Albaranes</span>
          </Link>
          <Link 
            href="/facturas"
            className={cn("sidebar-link", location === "/facturas" && "active")}
            data-testid="nav-facturas"
          >
            <Receipt className="w-5 h-5" />
            <span>Facturas</span>
          </Link>
        </div>

        <div className="space-y-1">
          {navigationAfterInventory.map((item) => {
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

        <div className="my-2 p-2 rounded-lg border-2 border-[#800020] bg-[#800020]/5">
          <Link 
            href="/gestion-documental"
            className={cn("sidebar-link", location === "/gestion-documental" && "active")}
            data-testid="nav-gestión-documental"
          >
            <Files className="w-5 h-5" />
            <span>Gestión Documental</span>
          </Link>
          <Link 
            href="/categorias-documentos"
            className={cn("sidebar-link", location === "/categorias-documentos" && "active")}
            data-testid="nav-categorías-documentos"
          >
            <Tags className="w-5 h-5" />
            <span>Categorías Documentos</span>
          </Link>
        </div>

        <div className="space-y-1">
          {navigationAfterDocuments.map((item) => {
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
          
          <HelpDialog 
            trigger={
              <button 
                className="sidebar-link w-full"
                data-testid="nav-ayuda"
              >
                <HelpCircle className="w-5 h-5" />
                <span>Ayuda</span>
              </button>
            }
          />
        </div>
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
            <span className="text-primary-foreground font-semibold">
              {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.name || user?.email || 'Usuario'}
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
