import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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

// Form type with date as string for HTML date input
type TransactionFormData = Omit<InsertTransaction, 'date'> & { 
  date: string;
  taxableBase?: string;
  vatAmount?: string;
  irpfRate?: string;
  irpfAmount?: string;
};

// IRPF retention rates according to Spanish legislation
const IRPF_RATES = [
  { value: '0', label: 'Sin retención (0%)' },
  { value: '1', label: 'Engorde porcino/avicultura (1%)' },
  { value: '2', label: 'Actividades agrícolas/ganaderas (2%)' },
  { value: '7', label: 'Nuevos autónomos/Artísticas (7%)' },
  { value: '15', label: 'Profesionales general (15%)' },
];

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (transaction: InsertTransaction) => void;
  clients: Array<{ id: string; name: string }>;
  suppliers: Array<{ id: string; name: string }>;
  initialData?: any;
  mode?: 'create' | 'edit' | 'view';
  fixedType?: 'income' | 'expense'; // Fixed transaction type from the calling page
}

export default function TransactionModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  clients = [], 
  suppliers = [],
  initialData = null,
  mode = 'create',
  fixedType
}: TransactionModalProps) {
  const { toast } = useToast();
  // Use fixedType if provided, otherwise use initialData type or default to 'income'
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>(
    fixedType || initialData?.type || 'income'
  );
  const [selectedPdf, setSelectedPdf] = useState<{ name: string; data: string } | null>(
    initialData?.pdfFileName ? { name: initialData.pdfFileName, data: initialData.pdfDocument } : null
  );
  
  const { categories: incomeCategories } = useCategories('income');
  const { categories: expenseCategories } = useCategories('expense');

  // Form validation schema with date as string
  const formSchema = insertTransactionSchema.extend({
    date: z.string().min(1, "La fecha es obligatoria"),
    concept: z.string().min(1, "El concepto es obligatorio"),
    category: z.string().min(1, "La categoría es obligatoria"),
    amount: z.string().min(1, "El importe es obligatorio").refine(val => parseFloat(val) > 0, "El importe debe ser mayor a 0"),
  }).omit({ date: true }).merge(z.object({ date: z.string() }));

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
      type: fixedType || initialData.type,
      date: new Date(initialData.date).toISOString().split('T')[0],
      concept: initialData.concept,
      category: initialData.category,
      amount: String(initialData.amount),
      quantity: initialData.quantity || '',
      clientSupplierId: initialData.clientSupplierId || '',
      notes: initialData.notes || '',
      pdfDocument: initialData.pdfDocument || '',
      pdfFileName: initialData.pdfFileName || '',
      taxableBase: initialData.taxableBase || '',
      vatAmount: initialData.vatAmount || '',
      irpfRate: initialData.irpfRate || '0',
      irpfAmount: initialData.irpfAmount || '',
    } : {
      type: fixedType || 'income',
      date: new Date().toISOString().split('T')[0],
      concept: '',
      category: '',
      amount: '0',
      quantity: '',
      clientSupplierId: '',
      notes: '',
      pdfDocument: '',
      pdfFileName: '',
      taxableBase: '',
      vatAmount: '',
      irpfRate: '0',
      irpfAmount: '',
    },
  });

  const watchTaxableBase = form.watch('taxableBase');
  const watchVatAmount = form.watch('vatAmount');
  const watchIrpfRate = form.watch('irpfRate');
  
  // Auto-calculate IRPF amount when rate or taxable base changes
  useEffect(() => {
    if (transactionType === 'income') {
      const base = parseFloat(watchTaxableBase || '0') || 0;
      const rate = parseFloat(watchIrpfRate || '0') || 0;
      const irpfAmount = base * rate / 100;
      form.setValue('irpfAmount', irpfAmount.toFixed(2));
    }
  }, [watchTaxableBase, watchIrpfRate, transactionType, form]);
  
  // Auto-calculate total from taxable base + VAT - IRPF for both income and expense
  useEffect(() => {
    const base = parseFloat(watchTaxableBase || '0') || 0;
    const vat = parseFloat(watchVatAmount || '0') || 0;
    const irpfRate = parseFloat(watchIrpfRate || '0') || 0;
    const irpf = transactionType === 'income' ? (base * irpfRate / 100) : 0;
    const total = base + vat - irpf;
    form.setValue('amount', total.toFixed(2));
  }, [watchTaxableBase, watchVatAmount, watchIrpfRate, transactionType, form]);

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

  useEffect(() => {
    if (initialData) {
      const typeToUse = fixedType || initialData.type;
      form.reset({
        type: typeToUse,
        date: new Date(initialData.date).toISOString().split('T')[0],
        concept: initialData.concept,
        category: initialData.category,
        amount: String(initialData.amount),
        quantity: initialData.quantity || '',
        clientSupplierId: initialData.clientSupplierId || '',
        notes: initialData.notes || '',
        pdfDocument: initialData.pdfDocument || '',
        pdfFileName: initialData.pdfFileName || '',
        taxableBase: initialData.taxableBase || '',
        vatAmount: initialData.vatAmount || '',
        irpfRate: initialData.irpfRate || '0',
        irpfAmount: initialData.irpfAmount || '',
      });
      setTransactionType(typeToUse);
      if (initialData.pdfFileName) {
        setSelectedPdf({ name: initialData.pdfFileName, data: initialData.pdfDocument });
      }
    } else {
      const typeToUse = fixedType || 'income';
      form.reset({
        type: typeToUse,
        date: new Date().toISOString().split('T')[0],
        concept: '',
        category: '',
        amount: '0',
        quantity: '',
        clientSupplierId: '',
        notes: '',
        pdfDocument: '',
        pdfFileName: '',
        taxableBase: '',
        vatAmount: '',
        irpfRate: '0',
        irpfAmount: '',
      });
      setTransactionType(typeToUse);
      setSelectedPdf(null);
    }
  }, [initialData, form, fixedType]);

  const handleSubmit = (data: TransactionFormData) => {
    try {
      // Convert string date to Date object and ensure amount is a string
      const formattedData: InsertTransaction = {
        ...data,
        amount: String(data.amount),
        date: new Date(data.date),
        clientSupplierId: data.clientSupplierId || undefined,
        taxableBase: data.taxableBase || undefined,
        vatAmount: data.vatAmount || undefined,
        irpfRate: transactionType === 'income' ? data.irpfRate : undefined,
        irpfAmount: transactionType === 'income' ? data.irpfAmount : undefined,
        quantity: transactionType === 'income' ? data.quantity : undefined,
      };
      onSubmit(formattedData);
      
      // Reset form with the correct type based on fixedType
      const typeToUse = fixedType || 'income';
      form.reset({
        type: typeToUse,
        date: new Date().toISOString().split('T')[0],
        concept: '',
        category: '',
        amount: '0',
        quantity: '',
        clientSupplierId: '',
        notes: '',
        pdfDocument: '',
        pdfFileName: '',
        taxableBase: '',
        vatAmount: '',
        irpfRate: '0',
        irpfAmount: '',
      });
      setTransactionType(typeToUse);
      setSelectedPdf(null);
      onClose();
      toast({
        title: "Operación creada",
        description: "La operación se ha registrado correctamente.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear la operación. Intenta nuevamente.",
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
  const isViewMode = mode === 'view';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'view' ? 'Ver Operación' : mode === 'edit' ? 'Editar Operación' : 'Nueva Operación'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6" data-testid="transaction-form">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="type">Tipo de Operación</Label>
              <Select 
                onValueChange={handleTypeChange} 
                value={transactionType}
                disabled={!!fixedType || isViewMode}
              >
                <SelectTrigger data-testid="select-transaction-type" disabled={!!fixedType || isViewMode}>
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
                {...form.register("date")}
                disabled={isViewMode}
                data-testid="input-date"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="concept">Concepto</Label>
            <Input
              placeholder="Ej: Venta de maíz, Compra de fertilizantes..."
              {...form.register("concept")}
              disabled={isViewMode}
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
              <Select 
                onValueChange={(value) => form.setValue('category', value)}
                value={form.watch('category') || undefined}
                disabled={isViewMode}
              >
                <SelectTrigger data-testid="select-category" disabled={isViewMode}>
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
            
            {transactionType === 'expense' ? (
              <div>
                <Label htmlFor="clientSupplierId">Proveedor (opcional)</Label>
                <Select 
                  onValueChange={(value) => form.setValue('clientSupplierId', value || undefined)}
                  value={form.watch('clientSupplierId') || undefined}
                  disabled={isViewMode}
                >
                  <SelectTrigger data-testid="select-client-supplier" disabled={isViewMode}>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((entity) => (
                      <SelectItem key={entity.id} value={entity.id}>
                        {entity.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div>
                <Label htmlFor="clientSupplierId">Cliente (opcional)</Label>
                <Select 
                  onValueChange={(value) => form.setValue('clientSupplierId', value || undefined)}
                  value={form.watch('clientSupplierId') || undefined}
                  disabled={isViewMode}
                >
                  <SelectTrigger data-testid="select-client-supplier" disabled={isViewMode}>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((entity) => (
                      <SelectItem key={entity.id} value={entity.id}>
                        {entity.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          {/* Base Imponible, IVA y Total - For both income and expense */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="taxableBase">Base Imponible</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="pl-8"
                  {...form.register("taxableBase")}
                  disabled={isViewMode}
                  data-testid="input-taxable-base"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="vatAmount">IVA</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="pl-8"
                  {...form.register("vatAmount")}
                  disabled={isViewMode}
                  data-testid="input-vat-amount"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="total">Total</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="pl-8 bg-muted"
                  value={form.watch('amount') || '0'}
                  readOnly
                  data-testid="input-total"
                />
              </div>
            </div>
          </div>

          {/* IRPF Retention - Only for income */}
          {transactionType === 'income' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="irpfRate">Retención IRPF</Label>
                <Select 
                  value={form.watch('irpfRate') || '0'}
                  onValueChange={(value) => form.setValue('irpfRate', value)}
                  disabled={isViewMode}
                >
                  <SelectTrigger data-testid="select-irpf-rate" disabled={isViewMode}>
                    <SelectValue placeholder="Sin retención" />
                  </SelectTrigger>
                  <SelectContent>
                    {IRPF_RATES.map(rate => (
                      <SelectItem key={rate.value} value={rate.value}>
                        {rate.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="irpfAmount">Importe IRPF</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="pl-8 bg-muted"
                    value={form.watch('irpfAmount') || '0'}
                    readOnly
                    data-testid="input-irpf-amount"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Quantity field - Only for income */}
          {transactionType === 'income' && (
            <div>
              <Label htmlFor="quantity">Cantidad (opcional)</Label>
              <Input
                placeholder="Ej: 2500 kg, 150 unidades..."
                {...form.register("quantity")}
                disabled={isViewMode}
                data-testid="input-quantity"
              />
            </div>
          )}
          
          <div>
            <Label htmlFor="notes">Notas adicionales (opcional)</Label>
            <Textarea
              rows={3}
              placeholder="Detalles adicionales sobre la operación..."
              className="resize-none"
              {...form.register("notes")}
              disabled={isViewMode}
              data-testid="textarea-notes"
            />
          </div>
          
          <div>
            <Label htmlFor="pdf">Documento PDF (opcional)</Label>
            <div className="mt-2">
              {!selectedPdf ? (
                !isViewMode && (
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
                )
              ) : (
                <div className="flex items-center gap-3 p-3 bg-muted rounded-md" data-testid="pdf-preview">
                  <FileText className="w-5 h-5 text-primary" />
                  <span className="flex-1 text-sm truncate" data-testid="text-pdf-name">
                    {selectedPdf.name}
                  </span>
                  {!isViewMode && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemovePdf}
                      data-testid="button-remove-pdf"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3 pt-6 border-t border-border">
            {!isViewMode && (
              <Button type="submit" className="flex-1" data-testid="button-save-transaction">
                <Save className="w-4 h-4 mr-2" />
                Guardar Operación
              </Button>
            )}
            <Button type="button" variant="outline" onClick={onClose} className={isViewMode ? "flex-1" : ""} data-testid="button-cancel-transaction">
              {isViewMode ? 'Cerrar' : 'Cancelar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
