import type { Client } from "@shared/schema";

interface TopClientsProps {
  clients: Client[];
}

export default function TopClients({ clients }: TopClientsProps) {
  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const getGradientClass = (index: number) => {
    const gradients = [
      'from-primary to-secondary',
      'from-secondary to-accent',
      'from-accent to-muted',
      'from-muted to-primary',
      'from-primary to-accent',
    ];
    return gradients[index % gradients.length];
  };

  // Sort clients by total purchases and take top 5
  const topClients = [...clients]
    .sort((a, b) => parseFloat(b.totalPurchases || "0") - parseFloat(a.totalPurchases || "0"))
    .slice(0, 5);

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Principales Clientes</h3>
          <p className="text-sm text-muted-foreground">Top 5 del mes</p>
        </div>
        <button 
          className="text-sm font-medium text-primary hover:underline"
          data-testid="view-all-clients"
        >
          Ver todos
        </button>
      </div>
      
      <div className="space-y-4" data-testid="top-clients-list">
        {topClients.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No hay clientes registrados</p>
          </div>
        ) : (
          topClients.map((client, index) => (
            <div 
              key={client.id} 
              className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/10 transition-colors"
              data-testid={`client-${client.id}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 bg-gradient-to-br ${getGradientClass(index)} rounded-full flex items-center justify-center text-primary-foreground font-semibold`}>
                  {index + 1}
                </div>
                <div>
                  <p className="text-sm font-medium">{client.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {client.email || client.phone || 'Sin contacto'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-primary">
                  {formatCurrency(client.totalPurchases || "0")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {client.orderCount || 0} pedidos
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
