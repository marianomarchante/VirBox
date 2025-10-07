import { Sprout, SprayCan, Users, Tractor } from "lucide-react";

export default function CategoryBreakdown() {
  const categories = [
    { name: "Semillas", amount: 8450, percentage: 35, icon: Sprout, color: "primary" },
    { name: "Fertilizantes", amount: 6200, percentage: 26, icon: SprayCan, color: "secondary" },
    { name: "Mano de Obra", amount: 9800, percentage: 41, icon: Users, color: "accent" },
    { name: "Maquinaria", amount: 4000, percentage: 17, icon: Tractor, color: "muted" },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6" data-testid="category-breakdown">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Gastos por Categoría</h3>
        <p className="text-sm text-muted-foreground">Diciembre 2024</p>
      </div>
      
      <div className="space-y-4">
        {categories.map((category) => {
          const Icon = category.icon;
          const colorMap: Record<string, { text: string, bg: string }> = {
            primary: { text: 'text-primary', bg: 'bg-primary' },
            secondary: { text: 'text-secondary', bg: 'bg-secondary' },
            accent: { text: 'text-accent', bg: 'bg-accent' },
            muted: { text: 'text-muted-foreground', bg: 'bg-muted' }
          };
          const colors = colorMap[category.color] || colorMap.primary;
          
          return (
            <div key={category.name} data-testid={`category-${category.name.toLowerCase()}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon className={colors.text} size={16} />
                  <span className="text-sm font-medium">{category.name}</span>
                </div>
                <span className="text-sm font-semibold" data-testid={`category-${category.name.toLowerCase()}-amount`}>
                  {formatCurrency(category.amount)}
                </span>
              </div>
              <div className="w-full bg-muted/30 rounded-full h-2">
                <div 
                  className={`${colors.bg} h-2 rounded-full transition-all duration-300`}
                  style={{ width: `${category.percentage}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {category.percentage}% del total
              </p>
            </div>
          );
        })}
      </div>

      <button 
        className="w-full mt-6 py-2 text-sm font-medium text-primary hover:bg-primary/5 rounded-lg transition-colors"
        data-testid="view-all-categories"
      >
        Ver todas las categorías
      </button>
    </div>
  );
}
