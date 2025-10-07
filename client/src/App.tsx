import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { CompanyProvider } from "@/contexts/CompanyContext";
import { useAuthContext } from "@/contexts/AuthContext";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Income from "@/pages/Income";
import Expenses from "@/pages/Expenses";
import Inventory from "@/pages/Inventory";
import Clients from "@/pages/Clients";
import Suppliers from "@/pages/Suppliers";
import Reports from "@/pages/Reports";
import IncomeCategories from "@/pages/IncomeCategories";
import ExpenseCategories from "@/pages/ExpenseCategories";
import DocumentManagement from "@/pages/DocumentManagement";
import Companies from "@/pages/Companies";
import Landing from "@/pages/Landing";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/ingresos" component={Income} />
      <Route path="/gastos" component={Expenses} />
      <Route path="/inventario" component={Inventory} />
      <Route path="/clientes" component={Clients} />
      <Route path="/proveedores" component={Suppliers} />
      <Route path="/reportes" component={Reports} />
      <Route path="/categorias-ingresos" component={IncomeCategories} />
      <Route path="/categorias-gastos" component={ExpenseCategories} />
      <Route path="/gestion-documental" component={DocumentManagement} />
      <Route path="/empresas" component={Companies} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthenticatedApp() {
  const { user, isLoading, login } = useAuthContext();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Landing onLogin={login} />;
  }

  return (
    <CompanyProvider>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </CompanyProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthenticatedApp />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
