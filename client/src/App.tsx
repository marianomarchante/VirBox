import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
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
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
