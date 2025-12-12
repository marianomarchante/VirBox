import { useState, useEffect, Suspense, lazy } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { CompanyProvider } from "@/contexts/CompanyContext";
import { useAuthContext } from "@/contexts/AuthContext";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";

const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Income = lazy(() => import("@/pages/Income"));
const Expenses = lazy(() => import("@/pages/Expenses"));
const Inventory = lazy(() => import("@/pages/Inventory"));
const Clients = lazy(() => import("@/pages/Clients"));
const Suppliers = lazy(() => import("@/pages/Suppliers"));
const Reports = lazy(() => import("@/pages/Reports"));
const Events = lazy(() => import("@/pages/Events"));
const IncomeCategories = lazy(() => import("@/pages/IncomeCategories"));
const ExpenseCategories = lazy(() => import("@/pages/ExpenseCategories"));
const ProductCategories = lazy(() => import("@/pages/ProductCategories"));
const DocumentCategories = lazy(() => import("@/pages/DocumentCategories"));
const DocumentManagement = lazy(() => import("@/pages/DocumentManagement"));
const Companies = lazy(() => import("@/pages/Companies"));
const UserManagement = lazy(() => import("@/pages/UserManagement"));

const PastEventsModal = lazy(() => 
  import("@/components/events/PastEventsModal").then(mod => ({ default: mod.PastEventsModal }))
);

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
        <p className="text-sm text-muted-foreground">Cargando...</p>
      </div>
    </div>
  );
}

function Router() {
  const [location] = useLocation();
  
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Switch key={location}>
        <Route path="/" component={Dashboard} />
        <Route path="/ingresos" component={Income} />
        <Route path="/gastos" component={Expenses} />
        <Route path="/inventario" component={Inventory} />
        <Route path="/clientes" component={Clients} />
        <Route path="/proveedores" component={Suppliers} />
        <Route path="/informes" component={Reports} />
        <Route path="/eventos" component={Events} />
        <Route path="/categorias-ingresos" component={IncomeCategories} />
        <Route path="/categorias-gastos" component={ExpenseCategories} />
        <Route path="/categorias-productos" component={ProductCategories} />
        <Route path="/categorias-documentos" component={DocumentCategories} />
        <Route path="/gestion-documental" component={DocumentManagement} />
        <Route path="/empresas" component={Companies} />
        <Route path="/usuarios" component={UserManagement} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function AuthenticatedApp() {
  const { user, isLoading, login } = useAuthContext();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      const timer = setTimeout(() => setShowModal(true), 1000);
      return () => clearTimeout(timer);
    } else {
      setShowModal(false);
    }
  }, [isLoading, user]);

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
        {showModal && (
          <Suspense fallback={null}>
            <PastEventsModal />
          </Suspense>
        )}
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
