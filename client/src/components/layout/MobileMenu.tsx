import { Link, useLocation } from "wouter";
import { X, Calculator, BarChart3, TrendingUp, TrendingDown, Package, Users, Truck, FileText, Tags, Files, UserCog, HelpCircle, LogOut, CalendarDays, Images, ShoppingBag, ClipboardList, Receipt, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCompany } from "@/contexts/CompanyContext";
import { useAuthContext } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { HelpDialog } from "@/components/shared/Help";
import { ObjectsGallery } from "@/components/inventory/ObjectsGallery";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const [location] = useLocation();
  const { currentCompany } = useCompany();
  const { user, logout } = useAuthContext();

  const navigationAfterInventory = [
    { name: "Informes", href: "/informes", icon: FileText },
  ];

  const navigationAfterDocuments = [
    { name: "Eventos", href: "/eventos", icon: CalendarDays },
  ];

  const secondaryNav = [
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
            <Link 
              href="/"
              className={cn("sidebar-link", location === "/" && "active")}
              onClick={onClose}
              data-testid="mobile-nav-estadísticas"
            >
              <BarChart3 className="w-5 h-5" />
              <span>Estadísticas</span>
            </Link>
          </div>

          <div className="my-2 p-2 rounded-lg border-2 border-[#800020] bg-[#800020]/5">
            <Link 
              href="/ingresos"
              className={cn("sidebar-link", location === "/ingresos" && "active")}
              onClick={onClose}
              data-testid="mobile-nav-ingresos"
            >
              <TrendingUp className="w-5 h-5" />
              <span>Ingresos</span>
            </Link>
            <Link 
              href="/categorias-ingresos"
              className={cn("sidebar-link", location === "/categorias-ingresos" && "active")}
              onClick={onClose}
              data-testid="mobile-nav-categorías-ingresos"
            >
              <Tags className="w-5 h-5" />
              <span>Categorías de Ingresos</span>
            </Link>
            <Link 
              href="/clientes"
              className={cn("sidebar-link", location === "/clientes" && "active")}
              onClick={onClose}
              data-testid="mobile-nav-clientes"
            >
              <Users className="w-5 h-5" />
              <span>Clientes</span>
            </Link>
          </div>

          <div className="my-2 p-2 rounded-lg border-2 border-[#800020] bg-[#800020]/5">
            <Link 
              href="/gastos"
              className={cn("sidebar-link", location === "/gastos" && "active")}
              onClick={onClose}
              data-testid="mobile-nav-gastos"
            >
              <TrendingDown className="w-5 h-5" />
              <span>Gastos</span>
            </Link>
            <Link 
              href="/categorias-gastos"
              className={cn("sidebar-link", location === "/categorias-gastos" && "active")}
              onClick={onClose}
              data-testid="mobile-nav-categorías-gastos"
            >
              <Tags className="w-5 h-5" />
              <span>Categorías de Gastos</span>
            </Link>
            <Link 
              href="/proveedores"
              className={cn("sidebar-link", location === "/proveedores" && "active")}
              onClick={onClose}
              data-testid="mobile-nav-proveedores"
            >
              <Truck className="w-5 h-5" />
              <span>Proveedores</span>
            </Link>
          </div>

          <div className="my-2 p-2 rounded-lg border-2 border-[#800020] bg-[#800020]/5">
            <Link 
              href="/inventario"
              className={cn("sidebar-link", location === "/inventario" && "active")}
              onClick={onClose}
              data-testid="mobile-nav-inventario"
            >
              <Package className="w-5 h-5" />
              <span>Inventario</span>
            </Link>
            <Link 
              href="/categorias-productos"
              className={cn("sidebar-link", location === "/categorias-productos" && "active")}
              onClick={onClose}
              data-testid="mobile-nav-categorías-inventario"
            >
              <Tags className="w-5 h-5" />
              <span>Categorías Inventario</span>
            </Link>
            <ObjectsGallery
              trigger={
                <button 
                  className="sidebar-link w-full bg-[#FFFACD] hover:bg-white text-[#800020] hover:text-[#800020] border border-[#800020] hover:border-[#800020] font-semibold"
                  data-testid="mobile-nav-objetos"
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
              onClick={onClose}
              data-testid="mobile-nav-articulos"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>Artículos</span>
            </Link>
            <Link 
              href="/albaranes"
              className={cn("sidebar-link", location === "/albaranes" && "active")}
              onClick={onClose}
              data-testid="mobile-nav-albaranes"
            >
              <ClipboardList className="w-5 h-5" />
              <span>Albaranes</span>
            </Link>
            <Link 
              href="/facturas"
              className={cn("sidebar-link", location === "/facturas" && "active")}
              onClick={onClose}
              data-testid="mobile-nav-facturas"
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
                  onClick={onClose}
                  data-testid={`mobile-nav-${item.name.toLowerCase()}`}
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
              onClick={onClose}
              data-testid="mobile-nav-gestión-documental"
            >
              <Files className="w-5 h-5" />
              <span>Gestión Documental</span>
            </Link>
            <Link 
              href="/categorias-documentos"
              className={cn("sidebar-link", location === "/categorias-documentos" && "active")}
              onClick={onClose}
              data-testid="mobile-nav-categorías-documentos"
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
