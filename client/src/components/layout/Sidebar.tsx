import { Link, useLocation } from "wouter";
import { 
  Sprout, 
  TrendingUp, 
  TrendingDown, 
  Package, 
  Users, 
  Truck, 
  FileText, 
  Settings, 
  HelpCircle,
  BarChart3,
  Tags
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const [location] = useLocation();

  const navigation = [
    { name: "Dashboard", href: "/", icon: BarChart3 },
    { name: "Ingresos", href: "/ingresos", icon: TrendingUp },
    { name: "Gastos", href: "/gastos", icon: TrendingDown },
    { name: "Inventario", href: "/inventario", icon: Package },
    { name: "Clientes", href: "/clientes", icon: Users },
    { name: "Proveedores", href: "/proveedores", icon: Truck },
    { name: "Reportes", href: "/reportes", icon: FileText },
  ];

  const secondaryNav = [
    { name: "Categorías de Ingresos", href: "/categorias-ingresos", icon: Tags },
    { name: "Categorías de Gastos", href: "/categorias-gastos", icon: Tags },
    { name: "Configuración", href: "/configuracion", icon: Settings },
    { name: "Ayuda", href: "/ayuda", icon: HelpCircle },
  ];

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-card border-r border-border">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Sprout className="text-primary-foreground" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary">AgroContable</h1>
            <p className="text-xs text-muted-foreground">Gestión Agrícola</p>
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
            <span className="text-primary-foreground font-semibold">JD</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">Juan Domínguez</p>
            <p className="text-xs text-muted-foreground truncate">Administrador</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
