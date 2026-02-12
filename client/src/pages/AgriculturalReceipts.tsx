import { useState, useEffect } from "react";
import { Plus, Trash2, Receipt, Download, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Sidebar from "@/components/layout/Sidebar";
import MobileMenu from "@/components/layout/MobileMenu";
import TopBar from "@/components/layout/TopBar";
import { useAgriculturalReceipts } from "@/hooks/use-agricultural-receipts";
import { useArticles } from "@/hooks/use-articles";
import { useCompanyPermission } from "@/hooks/use-company-permission";
import { useCompany } from "@/contexts/CompanyContext";
import NoCompanySelected from "@/components/shared/NoCompanySelected";
import type { AgriculturalReceipt } from "@shared/schema";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import { apiRequest } from "@/lib/queryClient";

interface ReceiptLine {
  articleId?: string;
  quantity: string;
  unitPrice: string;
  description: string;
}

const formSchema = z.object({
  series: z.string().default('RA'),
  date: z.string().min(1, "La fecha es obligatoria"),
  operationDate: z.string().optional(),
  supplierId: z.string().min(1, "El proveedor es obligatorio"),
  paymentMethod: z.string().default('transferencia'),
  notes: z.string().optional(),
  status: z.enum(["draft", "issued", "paid", "cancelled"]).default("draft"),
});

type FormData = z.infer<typeof formSchema>;

export default function AgriculturalReceipts() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [lines, setLines] = useState<ReceiptLine[]>([]);
  const [productType, setProductType] = useState<string>('agricola');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationModalOpen, setValidationModalOpen] = useState(false);
  const [showDeleteButtons, setShowDeleteButtons] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === '-') {
        e.preventDefault();
        setShowDeleteButtons(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const { receipts, createReceipt, updateReceipt, deleteReceipt, isLoading } = useAgriculturalReceipts();
  const { articles } = useArticles();
  const { canWrite, hasCompanySelected } = useCompanyPermission();
  const { currentCompanyId, currentCompany } = useCompany();
  const { toast } = useToast();

  const { data: allSuppliers } = useQuery<{ id: string; name: string; idFiscal: string; address?: string; town?: string; province?: string; postalCode?: string; isReagp?: boolean }[]>({
    queryKey: ['/api/suppliers', { companyId: currentCompanyId }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (currentCompanyId) params.append('companyId', currentCompanyId);
      const res = await fetch(`/api/suppliers?${params.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      return res.json();
    },
    enabled: !!currentCompanyId,
  });

  const reagpSuppliers = allSuppliers?.filter(s => s.isReagp === true) || [];

  const getCompensationRate = (): number => {
    if (productType === 'agricola') return parseFloat(currentCompany?.reagpAgricolaRate || '12.00');
    if (productType === 'ganadero') return parseFloat(currentCompany?.reagpGanaderoRate || '10.50');
    if (productType === 'forestal') return parseFloat(currentCompany?.reagpForestalRate || '12.00');
    return 12.00;
  };

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      series: 'RA',
      date: new Date().toISOString().split('T')[0],
      operationDate: '',
      supplierId: '',
      paymentMethod: 'transferencia',
      notes: '',
      status: 'draft',
    },
  });

  const handleSubmit = async (data: FormData) => {
    const errors: string[] = [];
    if (!data.date) errors.push('Fecha de emisión');
    if (!data.supplierId) errors.push('Proveedor');
    if (lines.length === 0) errors.push('Al menos una línea de recibo');

    const supplier = reagpSuppliers.find(s => s.id === data.supplierId);
    if (supplier && !supplier.isReagp) {
      errors.push('El proveedor seleccionado no está acogido al REAGP');
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      setValidationModalOpen(true);
      return;
    }

    const compensationRate = getCompensationRate();
    const subtotal = calculateSubtotal();
    const compensationAmount = subtotal * compensationRate / 100;
    const total = subtotal + compensationAmount;

    const receiptLines = lines.map((line, index) => ({
      articleId: line.articleId || undefined,
      description: line.description,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      subtotal: ((parseFloat(line.quantity) || 0) * (parseFloat(line.unitPrice) || 0)).toFixed(2),
      lineOrder: index,
    }));

    const receiptData = {
      date: new Date(data.date),
      operationDate: data.operationDate ? new Date(data.operationDate) : null,
      supplierId: data.supplierId,
      supplierName: supplier?.name || '',
      supplierIdFiscal: supplier?.idFiscal,
      supplierAddress: supplier?.address,
      supplierTown: supplier?.town,
      supplierProvince: supplier?.province,
      supplierPostalCode: supplier?.postalCode,
      series: data.series,
      productType: productType,
      compensationRate: compensationRate.toFixed(2),
      paymentMethod: data.paymentMethod,
      notes: data.notes,
      status: data.status,
      subtotal: subtotal.toFixed(2),
      compensationAmount: compensationAmount.toFixed(2),
      total: total.toFixed(2),
      companyId: currentCompanyId ?? undefined,
      lines: receiptLines,
    };

    if (editingReceipt) {
      updateReceipt.mutate({ id: editingReceipt, receipt: receiptData });
    } else {
      createReceipt.mutate(receiptData, {
        onSuccess: async (newReceipt: any) => {
          if (data.status === 'issued' && newReceipt?.id) {
            await handleGeneratePDFAndSave(newReceipt);
          }
        },
      });
    }
    handleCloseModal();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingReceipt(null);
    setLines([]);
    setProductType('agricola');
    form.reset();
  };

  const handleAddLine = () => {
    setLines([...lines, { articleId: '', quantity: '1', unitPrice: '0', description: '' }]);
  };

  const handleRemoveLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleLineChange = (index: number, field: keyof ReceiptLine, value: string) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };

    if (field === 'articleId' && articles) {
      const article = articles.find(a => a.id === value);
      if (article) {
        newLines[index].unitPrice = article.unitPrice;
        newLines[index].description = article.name;
      }
    }

    setLines(newLines);
  };

  const calculateLineTotal = (line: ReceiptLine) => {
    const qty = parseFloat(line.quantity) || 0;
    const price = parseFloat(line.unitPrice) || 0;
    return qty * price;
  };

  const calculateSubtotal = () => {
    return lines.reduce((sum, line) => sum + calculateLineTotal(line), 0);
  };

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const filteredReceipts = receipts?.filter(receipt => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    const receiptNumber = `${receipt.series}-${receipt.year || new Date(receipt.date).getFullYear()}-${String(receipt.number).padStart(4, '0')}`;
    return (
      receiptNumber.toLowerCase().includes(search) ||
      (receipt.supplierName && receipt.supplierName.toLowerCase().includes(search))
    );
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      issued: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    const labels = {
      draft: 'Borrador',
      issued: 'Emitido',
      paid: 'Pagado',
      cancelled: 'Anulado',
    };
    return (
      <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${styles[status as keyof typeof styles] || styles.draft}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  const getProductTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      agricola: 'Agrícola',
      ganadero: 'Ganadero',
      forestal: 'Forestal',
    };
    return labels[type] || type;
  };

  const handleGeneratePDFAndSave = async (receipt: AgriculturalReceipt) => {
    try {
      const params = new URLSearchParams();
      if (currentCompanyId) params.append('companyId', currentCompanyId);
      const response = await fetch(`/api/agricultural-receipts/${receipt.id}?${params.toString()}`, { credentials: 'include' });
      const receiptData = await response.json();

      const pdfDoc = await generatePDFDocument(receipt, receiptData);
      const pdfBase64 = pdfDoc.output('datauristring');

      await apiRequest('PATCH', `/api/agricultural-receipts/${receipt.id}/pdf`, {
        pdfData: pdfBase64,
        companyId: currentCompanyId,
      });
    } catch (error) {
      console.error('Error saving PDF:', error);
    }
  };

  const generatePDFDocument = async (receipt: AgriculturalReceipt, receiptData: any) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    let logoWidth = 0;
    if (currentCompany?.logoImage) {
      try {
        doc.addImage(currentCompany.logoImage, 'AUTO', 15, 10, 25, 25);
        logoWidth = 30;
      } catch (e) {
        console.log('Error adding logo to PDF:', e);
      }
    }

    const textStartX = 15 + logoWidth;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(currentCompany?.name || 'Empresa', textStartX, 15);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    let companyY = 22;
    if (currentCompany?.taxId) {
      doc.text(`NIF/CIF: ${currentCompany.taxId}`, textStartX, companyY);
      companyY += 6;
    }
    if (currentCompany?.address) {
      doc.text(currentCompany.address, textStartX, companyY);
      companyY += 6;
    }
    const companyLocation = [
      currentCompany?.postalCode,
      currentCompany?.town,
      currentCompany?.province ? `(${currentCompany.province})` : null
    ].filter(Boolean).join(' ');
    if (companyLocation) {
      doc.text(companyLocation, textStartX, companyY);
      companyY += 6;
    }
    if (currentCompany?.phone) {
      doc.text(`Tel: ${currentCompany.phone}`, textStartX, companyY);
      companyY += 6;
    }
    if (currentCompany?.email) {
      doc.text(currentCompany.email, textStartX, companyY);
    }

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('RECIBO DE COMPENSACIÓN', pageWidth - 15, 15, { align: 'right' });
    doc.text('AGRARIA', pageWidth - 15, 22, { align: 'right' });
    doc.setFontSize(12);
    const receiptYear = receipt.year || new Date(receipt.date).getFullYear();
    doc.text(`${receipt.series}-${receiptYear}-${String(receipt.number).padStart(4, '0')}`, pageWidth - 15, 30, { align: 'right' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha de emisión: ${format(new Date(receipt.date), 'dd/MM/yyyy')}`, pageWidth - 15, 40, { align: 'right' });
    if (receipt.operationDate) {
      doc.text(`Fecha de operación: ${format(new Date(receipt.operationDate), 'dd/MM/yyyy')}`, pageWidth - 15, 46, { align: 'right' });
    }

    doc.setDrawColor(200, 200, 200);
    doc.line(15, 52, pageWidth - 15, 52);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('DATOS DEL PROVEEDOR (REAGP)', 15, 62);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    let supplierY = 69;
    doc.text(receipt.supplierName || '', 15, supplierY);
    supplierY += 6;
    if (receipt.supplierIdFiscal) {
      doc.text(`NIF: ${receipt.supplierIdFiscal}`, 15, supplierY);
      supplierY += 6;
    }
    if (receipt.supplierAddress) {
      doc.text(receipt.supplierAddress, 15, supplierY);
      supplierY += 6;
    }
    const supplierLocation = [
      receiptData.supplierPostalCode,
      receiptData.supplierTown,
      receiptData.supplierProvince ? `(${receiptData.supplierProvince})` : null
    ].filter(Boolean).join(' ');
    if (supplierLocation) {
      doc.text(supplierLocation, 15, supplierY);
    }

    doc.setFont('helvetica', 'bold');
    doc.text(`Tipo de producto: ${getProductTypeLabel(receipt.productType || 'agricola')}`, pageWidth - 15, 62, { align: 'right' });

    const tableData = (receiptData.lines || []).map((line: any) => [
      line.description,
      parseFloat(line.quantity).toFixed(2),
      parseFloat(line.unitPrice).toFixed(2) + ' \u20AC',
      parseFloat(line.subtotal).toFixed(2) + ' \u20AC'
    ]);

    autoTable(doc, {
      startY: 92,
      head: [['Descripción', 'Cantidad', 'Precio Unitario', 'Subtotal']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [66, 139, 70], fontSize: 9 },
      styles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 75 },
        1: { cellWidth: 25, halign: 'right' },
        2: { cellWidth: 35, halign: 'right' },
        3: { cellWidth: 35, halign: 'right' },
      },
    });

    const afterLinesY = (doc as any).lastAutoTable.finalY + 10;
    const compensationRate = parseFloat(receipt.compensationRate || '0');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    let totalsOffset = 0;
    doc.text('Base de compensación:', 130, afterLinesY);
    doc.text(`${parseFloat(receipt.subtotal || '0').toFixed(2)} \u20AC`, pageWidth - 15, afterLinesY, { align: 'right' });
    totalsOffset += 7;
    doc.text(`% Compensación (${compensationRate.toFixed(2)}%):`, 130, afterLinesY + totalsOffset);
    doc.text(`${parseFloat(receipt.compensationAmount || '0').toFixed(2)} \u20AC`, pageWidth - 15, afterLinesY + totalsOffset, { align: 'right' });
    totalsOffset += 7;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('TOTAL A PAGAR:', 130, afterLinesY + totalsOffset + 2);
    doc.text(`${parseFloat(receipt.total || '0').toFixed(2)} \u20AC`, pageWidth - 15, afterLinesY + totalsOffset + 2, { align: 'right' });

    const paymentY = afterLinesY + totalsOffset + 18;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('FORMA DE PAGO', 15, paymentY);
    doc.setFont('helvetica', 'normal');
    const paymentMethod = receipt.paymentMethod || 'transferencia';
    let paymentMethodText = '';
    if (paymentMethod === 'transferencia') {
      paymentMethodText = currentCompany?.bankAccount
        ? `Transferencia en la cuenta ${currentCompany.bankAccount}`
        : 'Transferencia';
    } else {
      const paymentLabels: Record<string, string> = {
        'efectivo': 'Efectivo',
        'tarjeta': 'Tarjeta de crédito/débito',
        'domiciliacion': 'Domiciliación bancaria',
      };
      paymentMethodText = paymentLabels[paymentMethod] || paymentMethod;
    }
    doc.text(paymentMethodText, 15, paymentY + 6);

    if (receipt.notes) {
      doc.setFont('helvetica', 'bold');
      doc.text('OBSERVACIONES', 15, paymentY + 20);
      doc.setFont('helvetica', 'normal');
      doc.text(receipt.notes, 15, paymentY + 26);
    }

    const legalY = paymentY + (receipt.notes ? 40 : 25);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    const legalText = 'Recibo de compensación emitido conforme al artículo 16 del Reglamento de Facturación (RD 1619/2012). Operación acogida al Régimen Especial de Agricultura, Ganadería y Pesca.';
    const splitLegal = doc.splitTextToSize(legalText, pageWidth - 30);
    doc.text(splitLegal, 15, legalY);
    doc.setTextColor(0, 0, 0);

    const now = new Date();
    const qrYear = String(receiptYear).padStart(4, '0');
    const qrMonth = String(now.getMonth() + 1).padStart(2, '0');
    const qrDay = String(now.getDate()).padStart(2, '0');
    const qrHour = String(now.getHours()).padStart(2, '0');
    const qrMinute = String(now.getMinutes()).padStart(2, '0');
    const qrReceiptNum = String(receipt.number).padStart(10, '0');
    const qrCompanyNif = (currentCompany?.taxId || '').replace(/[^A-Za-z0-9]/g, '').padStart(10, '0').slice(-10);
    const qrSupplierNif = (receipt.supplierIdFiscal || '').replace(/[^A-Za-z0-9]/g, '').padStart(10, '0').slice(-10);
    const qrCode = `RA${qrYear}${qrMonth}${qrDay}${qrHour}${qrMinute}${qrReceiptNum}${qrCompanyNif}${qrSupplierNif}`;

    const qrDataUrl = await QRCode.toDataURL(qrCode, { width: 80, margin: 1 });
    const pageHeight = doc.internal.pageSize.getHeight();
    const qrSize = 25;
    const qrX = pageWidth - qrSize - 10;
    const footerY = pageHeight - 30;
    try {
      doc.addImage(qrDataUrl, 'PNG', qrX, footerY - 3, qrSize, qrSize);
    } catch (e) {
      console.log('Error adding QR code to PDF:', e);
    }

    return doc;
  };

  const handleGeneratePDF = async (receipt: AgriculturalReceipt) => {
    try {
      const params = new URLSearchParams();
      if (currentCompanyId) params.append('companyId', currentCompanyId);
      const response = await fetch(`/api/agricultural-receipts/${receipt.id}?${params.toString()}`, { credentials: 'include' });
      const receiptData = await response.json();

      const doc = await generatePDFDocument(receipt, receiptData);

      const receiptYear = receipt.year || new Date(receipt.date).getFullYear();
      const paddedNumber = String(receipt.number).padStart(4, '0');
      doc.save(`Recibo_Agrario_${receipt.series}-${receiptYear}-${paddedNumber}.pdf`);

      try {
        const pdfBase64 = doc.output('datauristring');
        await apiRequest('PATCH', `/api/agricultural-receipts/${receipt.id}/pdf`, {
          pdfData: pdfBase64,
          companyId: currentCompanyId,
        });
      } catch (e) {
        console.log('Error saving PDF to server:', e);
      }

      toast({
        title: "PDF generado",
        description: `Recibo ${receipt.series}-${receiptYear}-${paddedNumber} descargado correctamente.`,
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "No se pudo generar el PDF.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = (receiptId: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar este recibo agrario?')) {
      deleteReceipt.mutate(receiptId);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

      {!hasCompanySelected ? (
        <div className="flex-1 flex items-center justify-center">
          <NoCompanySelected />
        </div>
      ) : isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando recibos agrarios...</p>
          </div>
        </div>
      ) : (
        <main className="flex-1 overflow-y-auto">
          <TopBar
            title="Recibos Agrarios REAGP"
            subtitle="Recibos de compensación agraria"
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          />

          <div className="p-4 lg:p-8">
            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Lista de Recibos Agrarios</h3>
                  <p className="text-sm text-muted-foreground">
                    {filteredReceipts?.length || 0} recibos
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Input
                    placeholder="Buscar recibos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:w-64"
                    data-testid="input-search-receipts"
                  />
                  <Button
                    onClick={() => setIsModalOpen(true)}
                    data-testid="button-add-receipt"
                    disabled={!canWrite}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Recibo
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto" data-testid="receipts-table">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Número</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Fecha</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Proveedor</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Tipo Producto</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Base</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Compensación</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Total</th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Estado</th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!filteredReceipts || filteredReceipts.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-muted-foreground">
                          <Receipt className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                          <p>No hay recibos agrarios registrados.</p>
                          {canWrite && (
                            <button
                              onClick={() => setIsModalOpen(true)}
                              className="text-primary hover:underline mt-2"
                              data-testid="button-create-first-receipt"
                            >
                              Crear el primero
                            </button>
                          )}
                        </td>
                      </tr>
                    ) : (
                      filteredReceipts.map((receipt) => {
                        const receiptYear = receipt.year || new Date(receipt.date).getFullYear();
                        return (
                          <tr
                            key={receipt.id}
                            className="border-b border-border hover:bg-muted/50 transition-colors"
                            data-testid={`receipt-row-${receipt.id}`}
                          >
                            <td className="py-3 px-4">
                              <span className="text-sm font-mono font-medium">
                                {receipt.series}-{receiptYear}-{String(receipt.number).padStart(4, '0')}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-sm">
                                {format(new Date(receipt.date), 'dd/MM/yyyy', { locale: es })}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div>
                                <span className="text-sm font-medium">{receipt.supplierName || 'Sin proveedor'}</span>
                                {receipt.supplierIdFiscal && (
                                  <p className="text-xs text-muted-foreground">{receipt.supplierIdFiscal}</p>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-sm">{getProductTypeLabel(receipt.productType || 'agricola')}</span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className="text-sm">{parseFloat(receipt.subtotal || '0').toFixed(2)} €</span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className="text-sm">{parseFloat(receipt.compensationAmount || '0').toFixed(2)} €</span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className="text-sm font-semibold text-primary">
                                {formatCurrency(receipt.total || '0')}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              {getStatusBadge(receipt.status || 'draft')}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center justify-center gap-1 flex-wrap">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleGeneratePDF(receipt)}
                                  title="Generar PDF"
                                  data-testid={`download-pdf-${receipt.id}`}
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                                {showDeleteButtons && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => handleDelete(receipt.id)}
                                    disabled={!canWrite}
                                    title="Eliminar recibo"
                                    data-testid={`delete-receipt-${receipt.id}`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingReceipt ? 'Editar Recibo Agrario' : 'Nuevo Recibo Agrario'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="series">Serie</Label>
                <Select
                  value={form.watch('series') || 'RA'}
                  onValueChange={(value) => form.setValue('series', value)}
                >
                  <SelectTrigger data-testid="select-receipt-series">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RA">Serie RA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Fecha Emisión *</Label>
                <Input
                  id="date"
                  type="date"
                  {...form.register('date')}
                  data-testid="input-receipt-date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="operationDate">Fecha Operación</Label>
                <Input
                  id="operationDate"
                  type="date"
                  {...form.register('operationDate')}
                  data-testid="input-receipt-operation-date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <Select
                  value={form.watch('status') || 'draft'}
                  onValueChange={(value) => form.setValue('status', value as any)}
                >
                  <SelectTrigger data-testid="select-receipt-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Borrador</SelectItem>
                    <SelectItem value="issued">Emitido</SelectItem>
                    <SelectItem value="paid">Pagado</SelectItem>
                    <SelectItem value="cancelled">Anulado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplierId">Proveedor REAGP *</Label>
                <Select
                  value={form.watch('supplierId') || ''}
                  onValueChange={(value) => form.setValue('supplierId', value)}
                >
                  <SelectTrigger data-testid="select-receipt-supplier">
                    <SelectValue placeholder="Seleccionar proveedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {reagpSuppliers.map(supplier => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name} {supplier.idFiscal ? `(${supplier.idFiscal})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {reagpSuppliers.length === 0 && (
                  <p className="text-xs text-amber-600">No hay proveedores con REAGP activado. Marque la opción REAGP en la ficha del proveedor.</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Forma de Pago</Label>
                <Select
                  value={form.watch('paymentMethod') || 'transferencia'}
                  onValueChange={(value) => form.setValue('paymentMethod', value)}
                >
                  <SelectTrigger data-testid="select-receipt-payment-method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transferencia">Transferencia</SelectItem>
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                    <SelectItem value="tarjeta">Tarjeta</SelectItem>
                    <SelectItem value="domiciliacion">Domiciliación</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo de Producto</Label>
                <Select
                  value={productType}
                  onValueChange={setProductType}
                >
                  <SelectTrigger data-testid="select-product-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agricola">Agrícola</SelectItem>
                    <SelectItem value="ganadero">Ganadero</SelectItem>
                    <SelectItem value="forestal">Forestal</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Compensación: {getCompensationRate().toFixed(2)}%
                </p>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium">Líneas del Recibo</h4>
                <Button type="button" size="sm" onClick={handleAddLine} data-testid="button-add-receipt-line">
                  <Plus className="w-4 h-4 mr-1" />
                  Añadir Línea
                </Button>
              </div>

              {lines.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay líneas. Añade productos al recibo.
                </p>
              ) : (
                <div className="space-y-3">
                  {lines.map((line, index) => (
                    <div key={index} className="space-y-2 border-b pb-3">
                      <div className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-5">
                          <Label className="text-xs">Descripción</Label>
                          <Input
                            value={line.description}
                            onChange={(e) => handleLineChange(index, 'description', e.target.value)}
                            placeholder="Descripción del producto"
                            data-testid={`input-line-description-${index}`}
                          />
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs">Cantidad</Label>
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={line.quantity}
                            onChange={(e) => {
                              const val = e.target.value.replace(',', '.').replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
                              handleLineChange(index, 'quantity', val);
                            }}
                            placeholder="0"
                            data-testid={`input-line-quantity-${index}`}
                          />
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs">Precio Unitario</Label>
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={line.unitPrice}
                            onChange={(e) => {
                              const val = e.target.value.replace(',', '.').replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
                              handleLineChange(index, 'unitPrice', val);
                            }}
                            placeholder="0.00"
                            data-testid={`input-line-price-${index}`}
                          />
                        </div>
                        <div className="col-span-2 text-right">
                          <Label className="text-xs">Subtotal</Label>
                          <p className="text-sm font-medium pt-2" data-testid={`text-line-subtotal-${index}`}>
                            {calculateLineTotal(line).toFixed(2)} €
                          </p>
                        </div>
                        <div className="col-span-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => handleRemoveLine(index)}
                            data-testid={`button-remove-line-${index}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-5">
                          <Label className="text-xs">O seleccionar Artículo</Label>
                          <Select
                            value={line.articleId || ''}
                            onValueChange={(value) => handleLineChange(index, 'articleId', value)}
                          >
                            <SelectTrigger data-testid={`select-line-article-${index}`}>
                              <SelectValue placeholder="Seleccionar artículo" />
                            </SelectTrigger>
                            <SelectContent>
                              {articles?.filter(a => a.isActive).map(article => (
                                <SelectItem key={article.id} value={article.id}>
                                  {article.code} - {article.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="border-t pt-3 mt-3 space-y-1">
                    <div className="flex justify-end">
                      <span className="text-sm text-muted-foreground w-40">Base de compensación:</span>
                      <span className="text-sm font-medium w-28 text-right" data-testid="text-subtotal">
                        {calculateSubtotal().toFixed(2)} €
                      </span>
                    </div>
                    <div className="flex justify-end">
                      <span className="text-sm text-muted-foreground w-40">% Compensación ({getCompensationRate().toFixed(2)}%):</span>
                      <span className="text-sm font-medium w-28 text-right" data-testid="text-compensation">
                        {(calculateSubtotal() * getCompensationRate() / 100).toFixed(2)} €
                      </span>
                    </div>
                    <div className="flex justify-end border-t pt-2 mt-2">
                      <span className="text-sm font-semibold w-40">Total:</span>
                      <span className="text-lg font-bold w-28 text-right" data-testid="text-total">
                        {(calculateSubtotal() + calculateSubtotal() * getCompensationRate() / 100).toFixed(2)} €
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Input
                id="notes"
                {...form.register('notes')}
                placeholder="Observaciones opcionales"
                data-testid="input-receipt-notes"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleCloseModal} data-testid="button-cancel-receipt">
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createReceipt.isPending || lines.length === 0}
                data-testid="button-save-receipt"
              >
                {createReceipt.isPending ? 'Guardando...' : (editingReceipt ? 'Guardar Cambios' : 'Crear Recibo')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={validationModalOpen} onOpenChange={setValidationModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-amber-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Datos obligatorios incompletos
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Para crear el recibo agrario es necesario completar los siguientes campos:
            </p>
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index} className="text-sm font-medium text-destructive">
                  {error}
                </li>
              ))}
            </ul>
            <div className="flex justify-end">
              <Button onClick={() => setValidationModalOpen(false)} data-testid="button-validation-ok">
                Entendido
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
