import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Save, Upload, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { insertTransactionSchema, type InsertTransaction } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useCategories } from "@/hooks/use-categories";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (transaction: InsertTransaction) => void;
  clients: Array<{ id: string; name: string }>;
  suppliers: Array<{ id: string; name: string }>;
}

export default function TransactionModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  clients = [], 
  suppliers = [] 
}: TransactionModalProps) {
  const { toast } = useToast();
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('income');
  const [selectedPdf, setSelectedPdf] = useState<{ name: string; data: string } | null>(null);
  
  const { categories: incomeCategories } = useCategories('income');
  const { categories: expenseCategories } = useCategories('expense');

  const form = useForm<InsertTransaction>({
    resolver: zodResolver(insertTransactionSchema),
    defaultValues: {
      type: 'income',
      date: new Date(),
      concept: '',
      category: '',
      amount: '0',
      quantity: '',
      clientSupplierId: '',
      notes: '',
      pdfDocument: '',
      pdfFileName: '',
    },
  });

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast({
          title: "Error",
          description: "Solo se permiten archivos PDF.",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setSelectedPdf({ name: file.name, data: base64 });
        form.setValue('pdfDocument', base64);
        form.setValue('pdfFileName', file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePdf = () => {
    setSelectedPdf(null);
    form.setValue('pdfDocument', '');
    form.setValue('pdfFileName', '');
  };

  const handleSubmit = (data: InsertTransaction) => {
    try {
      console.log("Form data before formatting:", data);
      // Ensure amount is a string and date is properly formatted
      const formattedData = {
        ...data,
        amount: String(data.amount),
        date: data.date instanceof Date ? data.date : new Date(data.date),
        clientSupplierId: data.clientSupplierId || undefined,
      };
      console.log("Form data after formatting:", formattedData);
      onSubmit(formattedData);
      form.reset();
      setSelectedPdf(null);
      onClose();
      toast({
        title: "Transacción creada",
        description: "La transacción se ha registrado correctamente.",
      });
    } catch (error) {
      console.error("Error creating transaction:", error);
      toast({
        title: "Error",
        description: "No se pudo crear la transacción. Intenta nuevamente.",
        variant: "destructive",
      });
    }
  };

  const handleTypeChange = (type: string) => {
    setTransactionType(type as 'income' | 'expense');
    form.setValue('type', type as 'income' | 'expense');
    form.setValue('category', '');
  };

  const activeIncomeCategories = incomeCategories?.filter(cat => cat.isActive) || [];
  const activeExpenseCategories = expenseCategories?.filter(cat => cat.isActive) || [];
  const currentCategories = transactionType === 'income' ? activeIncomeCategories : activeExpenseCategories;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Transacción</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6" data-testid="transaction-form">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="type">Tipo de Transacción</Label>
              <Select onValueChange={handleTypeChange} defaultValue="income">
                <SelectTrigger data-testid="select-transaction-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Ingreso</SelectItem>
                  <SelectItem value="expense">Gasto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="date">Fecha</Label>
              <Input
                type="date"
                {...form.register("date", { valueAsDate: true })}
                data-testid="input-date"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="concept">Concepto</Label>
            <Input
              placeholder="Ej: Venta de maíz, Compra de fertilizantes..."
              {...form.register("concept")}
              data-testid="input-concept"
            />
            {form.formState.errors.concept && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.concept.message}
              </p>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="category">Categoría</Label>
              <Select onValueChange={(value) => form.setValue('category', value)}>
                <SelectTrigger data-testid="select-category">
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {currentCategories.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.category && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.category.message}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="amount">Monto</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="pl-8"
                  {...form.register("amount")}
                  data-testid="input-amount"
                />
              </div>
              {form.formState.errors.amount && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.amount.message}
                </p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="quantity">Cantidad (opcional)</Label>
              <Input
                placeholder="Ej: 2500 kg, 150 unidades..."
                {...form.register("quantity")}
                data-testid="input-quantity"
              />
            </div>
            
            <div>
              <Label htmlFor="clientSupplierId">
                {transactionType === 'income' ? 'Cliente' : 'Proveedor'} (opcional)
              </Label>
              <Select onValueChange={(value) => form.setValue('clientSupplierId', value || undefined)}>
                <SelectTrigger data-testid="select-client-supplier">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {(transactionType === 'income' ? clients : suppliers).map((entity) => (
                    <SelectItem key={entity.id} value={entity.id}>
                      {entity.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="notes">Notas adicionales (opcional)</Label>
            <Textarea
              rows={3}
              placeholder="Detalles adicionales sobre la transacción..."
              className="resize-none"
              {...form.register("notes")}
              data-testid="textarea-notes"
            />
          </div>
          
          <div>
            <Label htmlFor="pdf">Documento PDF (opcional)</Label>
            <div className="mt-2">
              {!selectedPdf ? (
                <div className="flex items-center gap-3">
                  <Input
                    id="pdf"
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handlePdfChange}
                    className="hidden"
                    data-testid="input-pdf-file"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('pdf')?.click()}
                    className="w-full"
                    data-testid="button-upload-pdf"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Seleccionar archivo PDF
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-muted rounded-md" data-testid="pdf-preview">
                  <FileText className="w-5 h-5 text-primary" />
                  <span className="flex-1 text-sm truncate" data-testid="text-pdf-name">
                    {selectedPdf.name}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemovePdf}
                    data-testid="button-remove-pdf"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3 pt-6 border-t border-border">
            <Button type="submit" className="flex-1" data-testid="button-save-transaction">
              <Save className="w-4 h-4 mr-2" />
              Guardar Transacción
            </Button>
            <Button type="button" variant="outline" onClick={onClose} data-testid="button-cancel-transaction">
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
