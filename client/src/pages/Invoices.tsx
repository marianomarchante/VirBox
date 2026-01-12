import { useState } from "react";
import { Plus, Trash2, Receipt, Eye, Download, FileText, CheckCircle, FileCode, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Sidebar from "@/components/layout/Sidebar";
import MobileMenu from "@/components/layout/MobileMenu";
import TopBar from "@/components/layout/TopBar";
import { useInvoices } from "@/hooks/use-invoices";
import { useDeliveryNotes } from "@/hooks/use-delivery-notes";
import { useArticles } from "@/hooks/use-articles";
import { useCompanyPermission } from "@/hooks/use-company-permission";
import { useCompany } from "@/contexts/CompanyContext";
import NoCompanySelected from "@/components/shared/NoCompanySelected";
import type { Invoice, DeliveryNote } from "@shared/schema";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { apiRequest } from "@/lib/queryClient";

interface InvoiceLine {
  articleId?: string;
  quantity: string;
  unitPrice: string;
  vatRate: string;
  description: string;
}

const formSchema = z.object({
  series: z.string().default('F'),
  date: z.string().min(1, "La fecha es obligatoria"),
  dueDate: z.string().optional(),
  clientId: z.string().min(1, "El cliente es obligatorio"),
  paymentMethod: z.string().default('transferencia'),
  notes: z.string().optional(),
  status: z.enum(["draft", "issued", "paid", "cancelled"]).default("draft"),
});

type FormData = z.infer<typeof formSchema>;

export default function Invoices() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [lines, setLines] = useState<InvoiceLine[]>([]);
  const [selectedDeliveryNotes, setSelectedDeliveryNotes] = useState<string[]>([]);
  const [createMode, setCreateMode] = useState<'manual' | 'from-delivery-notes'>('manual');

  const { invoices, createInvoice, createInvoiceFromDeliveryNotes, updateInvoice, deleteInvoice, isLoading } = useInvoices();
  const { deliveryNotes } = useDeliveryNotes();
  const { articles } = useArticles();
  const { canWrite, hasCompanySelected } = useCompanyPermission();
  const { currentCompanyId, currentCompany } = useCompany();

  const { data: clients } = useQuery<{ id: string; name: string; nif: string; address?: string; city?: string; postalCode?: string }[]>({
    queryKey: ['/api/clients', { companyId: currentCompanyId }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (currentCompanyId) params.append('companyId', currentCompanyId);
      const res = await fetch(`/api/clients?${params.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      return res.json();
    },
    enabled: !!currentCompanyId,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      series: 'F',
      date: new Date().toISOString().split('T')[0],
      clientId: '',
      paymentMethod: 'transferencia',
      notes: '',
      status: 'draft',
    },
  });

  const handleSubmit = (data: FormData) => {
    const client = clients?.find(c => c.id === data.clientId);
    const subtotal = calculateSubtotal();
    const totalVat = calculateVat();
    const total = subtotal + totalVat;
    
    const invoiceData = {
      date: new Date(data.date),
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      clientId: data.clientId,
      clientName: client?.name || '',
      clientIdFiscal: client?.nif,
      clientAddress: client?.address,
      series: data.series,
      paymentMethod: data.paymentMethod,
      notes: data.notes,
      status: data.status,
      subtotal: subtotal.toFixed(2),
      totalVat: totalVat.toFixed(2),
      total: total.toFixed(2),
      companyId: currentCompanyId ?? undefined,
    };
    
    const invoiceDataWithCategory = {
      ...invoiceData,
      incomeCategory: 'Ventas',
    };
    
    if (editingInvoice) {
      updateInvoice.mutate({ 
        id: editingInvoice, 
        invoice: invoiceDataWithCategory 
      });
    } else if (createMode === 'from-delivery-notes') {
      if (selectedDeliveryNotes.length === 0) return;
      createInvoiceFromDeliveryNotes.mutate({
        deliveryNoteIds: selectedDeliveryNotes,
        invoiceData: { 
          ...invoiceDataWithCategory,
          number: 0,
          subtotal: '0',
          totalVat: '0',
          total: '0',
        }
      });
    } else {
      if (lines.length === 0) return;
      createInvoice.mutate({ 
        ...invoiceDataWithCategory,
        number: 0,
        lines 
      });
    }
    handleCloseModal();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingInvoice(null);
    setLines([]);
    setSelectedDeliveryNotes([]);
    setCreateMode('manual');
    form.reset();
  };

  const handleAddLine = () => {
    setLines([...lines, { articleId: '', quantity: '1', unitPrice: '0', vatRate: '21.00', description: '' }]);
  };

  const handleRemoveLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleLineChange = (index: number, field: keyof InvoiceLine, value: string) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    
    if (field === 'articleId' && articles) {
      const article = articles.find(a => a.id === value);
      if (article) {
        newLines[index].unitPrice = article.unitPrice;
        newLines[index].vatRate = article.vatRate;
        newLines[index].description = article.name;
      }
    }
    
    setLines(newLines);
  };

  const handleDelete = (invoiceId: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar esta factura?')) {
      deleteInvoice.mutate(invoiceId);
    }
  };

  const toggleDeliveryNote = (noteId: string) => {
    setSelectedDeliveryNotes(prev => 
      prev.includes(noteId) 
        ? prev.filter(id => id !== noteId)
        : [...prev, noteId]
    );
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

  const calculateLineTotal = (line: InvoiceLine) => {
    const qty = parseFloat(line.quantity) || 0;
    const price = parseFloat(line.unitPrice) || 0;
    return qty * price;
  };

  const calculateSubtotal = () => {
    return lines.reduce((sum, line) => sum + calculateLineTotal(line), 0);
  };

  const calculateVat = () => {
    return lines.reduce((sum, line) => {
      const base = calculateLineTotal(line);
      const vatRate = parseFloat(line.vatRate) || 0;
      return sum + (base * vatRate / 100);
    }, 0);
  };

  const pendingDeliveryNotes = deliveryNotes?.filter(dn => dn.status === 'pending') || [];

  const filteredInvoices = invoices?.filter(invoice => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      String(invoice.number).toLowerCase().includes(search) ||
      (invoice.notes && invoice.notes.toLowerCase().includes(search))
    );
  });

  const { toast } = useToast();

  const handleIssueInvoice = (invoice: Invoice) => {
    if (window.confirm('¿Está seguro de que desea emitir esta factura? Una vez emitida se creará automáticamente un ingreso asociado.')) {
      updateInvoice.mutate({ 
        id: invoice.id, 
        invoice: { status: 'issued', companyId: currentCompanyId ?? undefined }
      });
    }
  };

  const handleMarkPaid = (invoice: Invoice) => {
    updateInvoice.mutate({ 
      id: invoice.id, 
      invoice: { status: 'paid', companyId: currentCompanyId ?? undefined }
    });
  };

  const handleGeneratePDF = async (invoice: Invoice) => {
    try {
      // Fetch invoice details with lines
      const params = new URLSearchParams();
      if (currentCompanyId) params.append('companyId', currentCompanyId);
      const response = await fetch(`/api/invoices/${invoice.id}?${params.toString()}`, { credentials: 'include' });
      const invoiceData = await response.json();
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Header with company name
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(currentCompany?.name || 'Empresa', 15, 15);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      if (currentCompany?.taxId) {
        doc.text(`NIF/CIF: ${currentCompany.taxId}`, 15, 22);
      }
      if (currentCompany?.address) {
        doc.text(currentCompany.address, 15, 28);
      }
      if (currentCompany?.phone) {
        doc.text(`Tel: ${currentCompany.phone}`, 15, 34);
      }
      if (currentCompany?.email) {
        doc.text(currentCompany.email, 15, 40);
      }
      
      // Invoice title and number (right side)
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('FACTURA', pageWidth - 15, 20, { align: 'right' });
      doc.setFontSize(12);
      doc.text(`${invoice.series}-${String(invoice.number).padStart(4, '0')}`, pageWidth - 15, 28, { align: 'right' });
      
      // Invoice details
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Fecha de emisi\u00f3n: ${format(new Date(invoice.date), 'dd/MM/yyyy')}`, pageWidth - 15, 38, { align: 'right' });
      if (invoice.dueDate) {
        doc.text(`Fecha de vencimiento: ${format(new Date(invoice.dueDate), 'dd/MM/yyyy')}`, pageWidth - 15, 44, { align: 'right' });
      }
      
      // Separator line
      doc.setDrawColor(200, 200, 200);
      doc.line(15, 50, pageWidth - 15, 50);
      
      // Client info
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('DATOS DEL CLIENTE', 15, 60);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(invoice.clientName || '', 15, 67);
      if (invoice.clientIdFiscal) {
        doc.text(`NIF/CIF: ${invoice.clientIdFiscal}`, 15, 73);
      }
      if (invoice.clientAddress) {
        doc.text(invoice.clientAddress, 15, 79);
      }
      
      // Invoice lines table
      const tableData = (invoiceData.lines || []).map((line: any) => [
        line.description,
        parseFloat(line.quantity).toFixed(2),
        parseFloat(line.unitPrice).toFixed(2) + ' \u20AC',
        parseFloat(line.vatRate).toFixed(0) + '%',
        parseFloat(line.subtotal).toFixed(2) + ' \u20AC',
        parseFloat(line.vatAmount).toFixed(2) + ' \u20AC',
        parseFloat(line.total).toFixed(2) + ' \u20AC'
      ]);
      
      autoTable(doc, {
        startY: 90,
        head: [['Descripci\u00f3n', 'Cant.', 'Precio', 'IVA%', 'Base', 'Cuota IVA', 'Total']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [66, 139, 202], fontSize: 9 },
        styles: { fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 55 },
          1: { cellWidth: 18, halign: 'right' },
          2: { cellWidth: 22, halign: 'right' },
          3: { cellWidth: 15, halign: 'right' },
          4: { cellWidth: 22, halign: 'right' },
          5: { cellWidth: 22, halign: 'right' },
          6: { cellWidth: 22, halign: 'right' },
        },
      });
      
      // VAT breakdown table
      const vatData = (invoiceData.vatBreakdown || []).map((vat: any) => [
        parseFloat(vat.vatRate).toFixed(0) + '%',
        parseFloat(vat.taxableBase).toFixed(2) + ' \u20AC',
        parseFloat(vat.vatAmount).toFixed(2) + ' \u20AC'
      ]);
      
      const afterLinesY = (doc as any).lastAutoTable.finalY + 10;
      
      if (vatData.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('DESGLOSE DE IVA', 15, afterLinesY);
        
        autoTable(doc, {
          startY: afterLinesY + 5,
          head: [['Tipo IVA', 'Base Imponible', 'Cuota IVA']],
          body: vatData,
          theme: 'plain',
          headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontSize: 9 },
          styles: { fontSize: 9 },
          tableWidth: 80,
        });
      }
      
      // Totals (right side)
      const totalsY = afterLinesY;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('Base Imponible:', 130, totalsY);
      doc.text(`${parseFloat(invoice.subtotal || '0').toFixed(2)} \u20AC`, pageWidth - 15, totalsY, { align: 'right' });
      doc.text('Total IVA:', 130, totalsY + 7);
      doc.text(`${parseFloat(invoice.totalVat || '0').toFixed(2)} \u20AC`, pageWidth - 15, totalsY + 7, { align: 'right' });
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('TOTAL FACTURA:', 130, totalsY + 16);
      doc.text(`${parseFloat(invoice.total || '0').toFixed(2)} \u20AC`, pageWidth - 15, totalsY + 16, { align: 'right' });
      
      // Payment info
      const paymentY = Math.max((doc as any).lastAutoTable?.finalY || totalsY, totalsY + 25) + 15;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('FORMA DE PAGO', 15, paymentY);
      doc.setFont('helvetica', 'normal');
      const paymentLabels: Record<string, string> = {
        'transferencia': 'Transferencia bancaria',
        'efectivo': 'Efectivo',
        'tarjeta': 'Tarjeta de cr\u00e9dito/d\u00e9bito',
        'domiciliacion': 'Domiciliaci\u00f3n bancaria'
      };
      doc.text(paymentLabels[invoice.paymentMethod || 'transferencia'] || invoice.paymentMethod || '', 15, paymentY + 6);
      if (invoice.iban) {
        doc.text(`IBAN: ${invoice.iban}`, 15, paymentY + 12);
      }
      
      // Notes
      if (invoice.notes) {
        doc.setFont('helvetica', 'bold');
        doc.text('OBSERVACIONES', 15, paymentY + 25);
        doc.setFont('helvetica', 'normal');
        doc.text(invoice.notes, 15, paymentY + 31);
      }
      
      // Save
      doc.save(`Factura_${invoice.series}-${invoice.number}.pdf`);
      
      toast({
        title: "PDF generado",
        description: `Factura ${invoice.series}-${invoice.number} descargada correctamente.`,
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

  const handleGenerateXML = async (invoice: Invoice) => {
    try {
      // Fetch invoice details with lines
      const params = new URLSearchParams();
      if (currentCompanyId) params.append('companyId', currentCompanyId);
      const response = await fetch(`/api/invoices/${invoice.id}?${params.toString()}`, { credentials: 'include' });
      const invoiceData = await response.json();
      
      // Generate Facturae 3.2.2 XML
      const invoiceNumber = `${invoice.series}-${String(invoice.number).padStart(4, '0')}`;
      const invoiceDate = format(new Date(invoice.date), 'yyyy-MM-dd');
      
      // Escape XML special characters
      const escapeXml = (str: string) => str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
      
      // Company data
      const companyName = escapeXml(currentCompany?.name || 'Empresa no configurada');
      const companyTaxId = currentCompany?.taxId || 'NIF_NO_CONFIGURADO';
      const companyAddress = escapeXml(currentCompany?.address || '');
      const companyPhone = currentCompany?.phone || '';
      const companyEmail = currentCompany?.email || '';
      
      // Client data
      const clientName = escapeXml(invoice.clientName || '');
      const clientTaxId = invoice.clientIdFiscal || 'NIF_NO_PROPORCIONADO';
      const clientAddress = escapeXml(invoice.clientAddress || '');
      
      let xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<fe:Facturae xmlns:fe="http://www.facturae.es/Facturae/2014/v3.2.2/Facturae">
  <FileHeader>
    <SchemaVersion>3.2.2</SchemaVersion>
    <Modality>I</Modality>
    <InvoiceIssuerType>EM</InvoiceIssuerType>
    <Batch>
      <BatchIdentifier>${invoiceNumber}</BatchIdentifier>
      <InvoicesCount>1</InvoicesCount>
      <TotalInvoicesAmount>
        <TotalAmount>${parseFloat(invoice.total || '0').toFixed(2)}</TotalAmount>
      </TotalInvoicesAmount>
      <TotalOutstandingAmount>
        <TotalAmount>${parseFloat(invoice.total || '0').toFixed(2)}</TotalAmount>
      </TotalOutstandingAmount>
      <TotalExecutableAmount>
        <TotalAmount>${parseFloat(invoice.total || '0').toFixed(2)}</TotalAmount>
      </TotalExecutableAmount>
      <InvoiceCurrencyCode>EUR</InvoiceCurrencyCode>
    </Batch>
  </FileHeader>
  <Parties>
    <SellerParty>
      <TaxIdentification>
        <PersonTypeCode>J</PersonTypeCode>
        <ResidenceTypeCode>R</ResidenceTypeCode>
        <TaxIdentificationNumber>${companyTaxId}</TaxIdentificationNumber>
      </TaxIdentification>
      <LegalEntity>
        <CorporateName>${companyName}</CorporateName>
        ${companyAddress ? `<AddressInSpain>
          <Address>${companyAddress}</Address>
          <PostCode>00000</PostCode>
          <Town>-</Town>
          <Province>-</Province>
          <CountryCode>ESP</CountryCode>
        </AddressInSpain>` : ''}
        ${companyPhone || companyEmail ? `<ContactDetails>
          ${companyPhone ? `<Telephone>${companyPhone}</Telephone>` : ''}
          ${companyEmail ? `<ElectronicMail>${companyEmail}</ElectronicMail>` : ''}
        </ContactDetails>` : ''}
      </LegalEntity>
    </SellerParty>
    <BuyerParty>
      <TaxIdentification>
        <PersonTypeCode>J</PersonTypeCode>
        <ResidenceTypeCode>R</ResidenceTypeCode>
        <TaxIdentificationNumber>${clientTaxId}</TaxIdentificationNumber>
      </TaxIdentification>
      <LegalEntity>
        <CorporateName>${clientName}</CorporateName>
        ${clientAddress ? `<AddressInSpain>
          <Address>${clientAddress}</Address>
          <PostCode>00000</PostCode>
          <Town>-</Town>
          <Province>-</Province>
          <CountryCode>ESP</CountryCode>
        </AddressInSpain>` : ''}
      </LegalEntity>
    </BuyerParty>
  </Parties>
  <Invoices>
    <Invoice>
      <InvoiceHeader>
        <InvoiceNumber>${invoiceNumber}</InvoiceNumber>
        <InvoiceSeriesCode>${invoice.series || 'F'}</InvoiceSeriesCode>
        <InvoiceDocumentType>FC</InvoiceDocumentType>
        <InvoiceClass>OO</InvoiceClass>
      </InvoiceHeader>
      <InvoiceIssueData>
        <IssueDate>${invoiceDate}</IssueDate>
        <InvoiceCurrencyCode>EUR</InvoiceCurrencyCode>
        <TaxCurrencyCode>EUR</TaxCurrencyCode>
        <LanguageName>es</LanguageName>
      </InvoiceIssueData>
      <TaxesOutputs>
${(invoiceData.vatBreakdown || []).map((vat: any) => `        <Tax>
          <TaxTypeCode>01</TaxTypeCode>
          <TaxRate>${parseFloat(vat.vatRate).toFixed(2)}</TaxRate>
          <TaxableBase>
            <TotalAmount>${parseFloat(vat.taxableBase).toFixed(2)}</TotalAmount>
          </TaxableBase>
          <TaxAmount>
            <TotalAmount>${parseFloat(vat.vatAmount).toFixed(2)}</TotalAmount>
          </TaxAmount>
        </Tax>`).join('\n')}
      </TaxesOutputs>
      <InvoiceTotals>
        <TotalGrossAmount>${parseFloat(invoice.subtotal || '0').toFixed(2)}</TotalGrossAmount>
        <TotalGrossAmountBeforeTaxes>${parseFloat(invoice.subtotal || '0').toFixed(2)}</TotalGrossAmountBeforeTaxes>
        <TotalTaxOutputs>${parseFloat(invoice.totalVat || '0').toFixed(2)}</TotalTaxOutputs>
        <TotalTaxesWithheld>0.00</TotalTaxesWithheld>
        <InvoiceTotal>${parseFloat(invoice.total || '0').toFixed(2)}</InvoiceTotal>
        <TotalOutstandingAmount>${parseFloat(invoice.total || '0').toFixed(2)}</TotalOutstandingAmount>
        <TotalExecutableAmount>${parseFloat(invoice.total || '0').toFixed(2)}</TotalExecutableAmount>
      </InvoiceTotals>
      <Items>
${(invoiceData.lines || []).map((line: any, index: number) => `        <InvoiceLine>
          <ItemDescription>${line.description}</ItemDescription>
          <Quantity>${parseFloat(line.quantity).toFixed(2)}</Quantity>
          <UnitOfMeasure>01</UnitOfMeasure>
          <UnitPriceWithoutTax>${parseFloat(line.unitPrice).toFixed(6)}</UnitPriceWithoutTax>
          <TotalCost>${parseFloat(line.subtotal).toFixed(2)}</TotalCost>
          <GrossAmount>${parseFloat(line.subtotal).toFixed(2)}</GrossAmount>
          <TaxesOutputs>
            <Tax>
              <TaxTypeCode>01</TaxTypeCode>
              <TaxRate>${parseFloat(line.vatRate).toFixed(2)}</TaxRate>
              <TaxableBase>
                <TotalAmount>${parseFloat(line.subtotal).toFixed(2)}</TotalAmount>
              </TaxableBase>
              <TaxAmount>
                <TotalAmount>${parseFloat(line.vatAmount).toFixed(2)}</TotalAmount>
              </TaxAmount>
            </Tax>
          </TaxesOutputs>
        </InvoiceLine>`).join('\n')}
      </Items>
      <PaymentDetails>
        <Installment>
          <InstallmentDueDate>${invoice.dueDate ? format(new Date(invoice.dueDate), 'yyyy-MM-dd') : invoiceDate}</InstallmentDueDate>
          <InstallmentAmount>${parseFloat(invoice.total || '0').toFixed(2)}</InstallmentAmount>
          <PaymentMeans>${invoice.paymentMethod === 'transferencia' ? '04' : invoice.paymentMethod === 'efectivo' ? '01' : '02'}</PaymentMeans>
        </Installment>
      </PaymentDetails>
    </Invoice>
  </Invoices>
</fe:Facturae>`;

      // Download XML
      const blob = new Blob([xmlContent], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Factura_${invoice.series}-${invoice.number}_Facturae.xml`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "XML generado",
        description: `Factura ${invoice.series}-${invoice.number} en formato Facturae 3.2.2 descargada.`,
      });
    } catch (error) {
      console.error('Error generating XML:', error);
      toast({
        title: "Error",
        description: "No se pudo generar el XML.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      issued: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    const labels = {
      draft: 'Borrador',
      issued: 'Emitida',
      paid: 'Pagada',
      cancelled: 'Anulada',
    };
    return (
      <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${styles[status as keyof typeof styles] || styles.draft}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
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
            <p className="text-muted-foreground">Cargando facturas...</p>
          </div>
        </div>
      ) : (
        <main className="flex-1 overflow-y-auto">
          <TopBar
            title="Facturas"
            subtitle="Gestión de facturas de venta"
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          />
          
          <div className="p-4 lg:p-8">
            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Lista de Facturas</h3>
                  <p className="text-sm text-muted-foreground">
                    {filteredInvoices?.length || 0} facturas
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Input
                    placeholder="Buscar facturas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:w-64"
                    data-testid="input-search-invoices"
                  />
                  <Button 
                    onClick={() => setIsModalOpen(true)}
                    data-testid="button-add-invoice"
                    disabled={!canWrite}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva Factura
                  </Button>
                </div>
              </div>
              
              <div className="overflow-x-auto" data-testid="invoices-table">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">
                        Número
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">
                        Fecha
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">
                        Cliente
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">
                        Total
                      </th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">
                        Estado
                      </th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {!filteredInvoices || filteredInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-muted-foreground">
                          <Receipt className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                          <p>No hay facturas registradas.</p>
                          {canWrite && (
                            <button 
                              onClick={() => setIsModalOpen(true)}
                              className="text-primary hover:underline mt-2"
                            >
                              Crear la primera
                            </button>
                          )}
                        </td>
                      </tr>
                    ) : (
                      filteredInvoices.map((invoice) => {
                        const client = clients?.find(c => c.id === invoice.clientId);
                        return (
                          <tr 
                            key={invoice.id} 
                            className="border-b border-border hover:bg-muted/50 transition-colors"
                            data-testid={`invoice-row-${invoice.id}`}
                          >
                            <td className="py-3 px-4">
                              <span className="text-sm font-mono font-medium">
                                {invoice.series}-{String(invoice.number)}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-sm">
                                {format(new Date(invoice.date), 'dd/MM/yyyy', { locale: es })}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div>
                                <span className="text-sm font-medium">{invoice.clientName || client?.name || 'Sin cliente'}</span>
                                {invoice.clientIdFiscal && (
                                  <p className="text-xs text-muted-foreground">{invoice.clientIdFiscal}</p>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className="text-sm font-semibold text-primary">
                                {formatCurrency(invoice.total || '0')}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              {getStatusBadge(invoice.status || 'draft')}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center justify-center gap-1 flex-wrap">
                                {invoice.status === 'draft' && (
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    className="text-blue-600 hover:text-blue-700"
                                    onClick={() => handleIssueInvoice(invoice)}
                                    disabled={!canWrite}
                                    title="Emitir factura"
                                    data-testid={`issue-invoice-${invoice.id}`}
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </Button>
                                )}
                                {invoice.status === 'issued' && (
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    className="text-green-600 hover:text-green-700"
                                    onClick={() => handleMarkPaid(invoice)}
                                    disabled={!canWrite}
                                    title="Marcar como pagada"
                                    data-testid={`mark-paid-${invoice.id}`}
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </Button>
                                )}
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => handleGeneratePDF(invoice)}
                                  title="Generar PDF"
                                  data-testid={`download-pdf-${invoice.id}`}
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => handleGenerateXML(invoice)}
                                  title="Generar XML Facturae"
                                  data-testid={`download-xml-${invoice.id}`}
                                >
                                  <FileCode className="w-4 h-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => handleDelete(invoice.id)}
                                  disabled={!canWrite || invoice.status === 'issued' || invoice.status === 'paid'}
                                  title="Eliminar factura"
                                  data-testid={`delete-invoice-${invoice.id}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
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
              {editingInvoice ? 'Editar Factura' : 'Nueva Factura'}
            </DialogTitle>
          </DialogHeader>
          
          <Tabs value={createMode} onValueChange={(v) => setCreateMode(v as 'manual' | 'from-delivery-notes')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">Crear Manualmente</TabsTrigger>
              <TabsTrigger value="from-delivery-notes">Desde Albaranes</TabsTrigger>
            </TabsList>
            
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="series">Serie</Label>
                  <Select 
                    value={form.watch('series') || 'F'}
                    onValueChange={(value) => form.setValue('series', value)}
                  >
                    <SelectTrigger data-testid="select-invoice-series">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="F">Serie F</SelectItem>
                      <SelectItem value="R">Serie R (Rectificativa)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Fecha Emisión *</Label>
                  <Input
                    id="date"
                    type="date"
                    {...form.register('date')}
                    data-testid="input-invoice-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientId">Cliente *</Label>
                  <Select 
                    value={form.watch('clientId') || ''}
                    onValueChange={(value) => form.setValue('clientId', value)}
                  >
                    <SelectTrigger data-testid="select-invoice-client">
                      <SelectValue placeholder="Seleccionar cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients?.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name} ({client.nif})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Forma de Pago</Label>
                  <Select 
                    value={form.watch('paymentMethod') || 'transferencia'}
                    onValueChange={(value) => form.setValue('paymentMethod', value)}
                  >
                    <SelectTrigger data-testid="select-payment-method">
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
              </div>

              <TabsContent value="manual" className="border rounded-lg p-4 mt-0">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">Líneas de la Factura</h4>
                  <Button type="button" size="sm" onClick={handleAddLine} data-testid="button-add-invoice-line">
                    <Plus className="w-4 h-4 mr-1" />
                    Añadir Línea
                  </Button>
                </div>
                
                {lines.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay líneas. Añade artículos a la factura.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {lines.map((line, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-4">
                          <Label className="text-xs">Descripción</Label>
                          <Input
                            value={line.description}
                            onChange={(e) => handleLineChange(index, 'description', e.target.value)}
                            placeholder="Descripción del concepto"
                          />
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs">Cantidad</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={line.quantity}
                            onChange={(e) => handleLineChange(index, 'quantity', e.target.value)}
                          />
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs">Precio</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={line.unitPrice}
                            onChange={(e) => handleLineChange(index, 'unitPrice', e.target.value)}
                          />
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs">IVA %</Label>
                          <Select 
                            value={line.vatRate}
                            onValueChange={(value) => handleLineChange(index, 'vatRate', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="21.00">21%</SelectItem>
                              <SelectItem value="10.00">10%</SelectItem>
                              <SelectItem value="4.00">4%</SelectItem>
                              <SelectItem value="0.00">0%</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-1 text-right">
                          <span className="text-sm font-medium">
                            {formatCurrency(calculateLineTotal(line).toString())}
                          </span>
                        </div>
                        <div className="col-span-1">
                          <Button 
                            type="button" 
                            size="sm" 
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => handleRemoveLine(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <div className="border-t pt-3 mt-3 space-y-1">
                      <div className="flex justify-end">
                        <span className="text-sm text-muted-foreground w-32">Base Imponible:</span>
                        <span className="text-sm font-medium w-28 text-right">{formatCurrency(calculateSubtotal().toString())}</span>
                      </div>
                      <div className="flex justify-end">
                        <span className="text-sm text-muted-foreground w-32">IVA:</span>
                        <span className="text-sm font-medium w-28 text-right">{formatCurrency(calculateVat().toString())}</span>
                      </div>
                      <div className="flex justify-end">
                        <span className="text-sm font-semibold w-32">Total:</span>
                        <span className="text-lg font-bold w-28 text-right">{formatCurrency((calculateSubtotal() + calculateVat()).toString())}</span>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="from-delivery-notes" className="border rounded-lg p-4 mt-0">
                <h4 className="font-medium mb-4">Seleccionar Albaranes Pendientes</h4>
                {pendingDeliveryNotes.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay albaranes pendientes de facturar.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {pendingDeliveryNotes.map((note) => {
                      const client = clients?.find(c => c.id === note.clientId);
                      const isSelected = selectedDeliveryNotes.includes(note.id);
                      return (
                        <div 
                          key={note.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                          }`}
                          onClick={() => toggleDeliveryNote(note.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <input 
                                type="checkbox" 
                                checked={isSelected}
                                onChange={() => {}}
                                className="rounded"
                              />
                              <div>
                                <span className="font-mono font-medium">{note.series}-{String(note.number)}</span>
                                <span className="text-sm text-muted-foreground ml-2">
                                  {format(new Date(note.date), 'dd/MM/yyyy', { locale: es })}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-medium">{client?.name}</span>
                              <p className="text-sm font-semibold text-primary">{formatCurrency((note as DeliveryNote & { total?: string }).total || '0')}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas</Label>
                <Input
                  id="notes"
                  {...form.register('notes')}
                  placeholder="Observaciones opcionales"
                  data-testid="input-invoice-notes"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={handleCloseModal}>
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={
                    createInvoice.isPending || 
                    createInvoiceFromDeliveryNotes.isPending || 
                    (createMode === 'manual' && lines.length === 0) ||
                    (createMode === 'from-delivery-notes' && selectedDeliveryNotes.length === 0)
                  }
                  data-testid="button-save-invoice"
                >
                  {createInvoice.isPending || createInvoiceFromDeliveryNotes.isPending ? 'Guardando...' : 'Crear Factura'}
                </Button>
              </div>
            </form>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
