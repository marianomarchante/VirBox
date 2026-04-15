import { ReactNode } from "react";
import { Eye, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => ReactNode);
  className?: string;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T> {
  data: T[] | undefined;
  columns: Column<T>[];
  isLoading?: boolean;
  emptyMessage?: string;
  onView?: (item: T) => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  canWrite?: boolean;
  testId?: string;
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  isLoading,
  emptyMessage = "No se encontraron registros.",
  onView,
  onEdit,
  onDelete,
  canWrite = true,
  testId,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
        <p className="text-muted-foreground">Cargando datos...</p>
      </div>
    );
  }

  const renderCell = (item: T, column: Column<T>) => {
    if (typeof column.accessor === 'function') {
      return column.accessor(item);
    }
    const value = item[column.accessor];
    return value !== null && value !== undefined ? String(value) : '-';
  };

  return (
    <div className="overflow-x-auto" data-testid={testId}>
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            {columns.map((column, idx) => (
              <th 
                key={idx}
                className={`py-3 px-4 text-xs font-semibold text-muted-foreground uppercase ${
                  column.align === 'center' ? 'text-center' : 
                  column.align === 'right' ? 'text-right' : 'text-left'
                } ${column.className || ''}`}
              >
                {column.header}
              </th>
            ))}
            {(onView || onEdit || onDelete) && (
              <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">
                Acciones
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {!data || data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (onView || onEdit || onDelete ? 1 : 0)} className="py-8 text-center text-muted-foreground">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr 
                key={item.id} 
                className="transaction-row border-b border-border hover:bg-muted/50 transition-colors"
                data-testid={`${testId}-row-${item.id}`}
              >
                {columns.map((column, idx) => (
                  <td 
                    key={idx} 
                    className={`py-3 px-4 text-sm ${
                      column.align === 'center' ? 'text-center' : 
                      column.align === 'right' ? 'text-right' : 'text-left'
                    } ${column.className || ''}`}
                  >
                    {renderCell(item, column)}
                  </td>
                ))}
                {(onView || onEdit || onDelete) && (
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {onView && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => onView(item)}
                          title="Ver"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      {onEdit && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => onEdit(item)}
                          disabled={!canWrite}
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => onDelete(item)}
                          disabled={!canWrite}
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
