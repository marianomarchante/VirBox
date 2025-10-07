import { Menu, Plus, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import CompanySelector from "./CompanySelector";

interface TopBarProps {
  title: string;
  subtitle?: string;
  onOpenMobileMenu: () => void;
  onOpenTransactionModal?: () => void;
}

export default function TopBar({ title, subtitle, onOpenMobileMenu, onOpenTransactionModal }: TopBarProps) {
  const currentMonth = new Date().toLocaleDateString('es-ES', { 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <header className="bg-card border-b border-border sticky top-0 z-10">
      <div className="px-4 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2"
            data-testid="open-mobile-menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-foreground">{title}</h2>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium capitalize">{currentMonth}</span>
          </div>
          <CompanySelector />
          {onOpenTransactionModal && (
            <>
              <Button 
                onClick={onOpenTransactionModal}
                className="hidden sm:flex items-center gap-2"
                data-testid="button-new-transaction"
              >
                <Plus className="h-4 w-4" />
                <span>Nueva Transacción</span>
              </Button>
              <Button 
                size="sm"
                onClick={onOpenTransactionModal}
                className="sm:hidden p-3"
                data-testid="button-new-transaction-mobile"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
