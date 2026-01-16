import { useState } from "react";
import { Plus, Edit, Trash2, ClipboardList, FileText, Eye, Printer, AlertTriangle } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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
import { useDeliveryNotes } from "@/hooks/use-delivery-notes";
import { useArticles } from "@/hooks/use-articles";
import { useCompanyPermission } from "@/hooks/use-company-permission";
import { useCompany } from "@/contexts/CompanyContext";
import NoCompanySelected from "@/components/shared/NoCompanySelected";
import type { DeliveryNote, Article } from "@shared/schema";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface DeliveryNoteLine {
  articleId: string;
  quantity: string;
  unitPrice: string;
  vatRate: string;
  description?: string;
}

const formSchema = z.object({
  series: z.string().default('A'),
  number: z.number().optional(),
  date: z.string().min(1, "La fecha es obligatoria"),
  clientId: z.string().min(1, "El cliente es obligatorio"),
  notes: z.string().optional(),
  status: z.enum(["pending", "invoiced"]).default("pending"),
});

export default function DeliveryNotes() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [lines, setLines] = useState<DeliveryNoteLine[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationModalOpen, setValidationModalOpen] = useState(false);

  const { deliveryNotes, createDeliveryNote, updateDeliveryNote, deleteDeliveryNote, isLoading } = useDeliveryNotes();
  const { articles } = useArticles();
  const { canWrite, hasCompanySelected } = useCompanyPermission();
  const { currentCompanyId, currentCompany } = useCompany();
  const { toast } = useToast();

  const { data: clients } = useQuery<{ id: string; name: string; nif: string }[]>({
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

  type FormData = z.infer<typeof formSchema>;
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      series: 'A',
      date: new Date().toISOString().split('T')[0],
      clientId: '',
      notes: '',
      status: 'pending',
    },
  });

  const handleSubmit = (data: FormData) => {
    const errors: string[] = [];
    
    if (!data.date || data.date.trim() === '') {
      errors.push('Fecha');
    }
    if (!data.clientId || data.clientId.trim() === '') {
      errors.push('Cliente');
    }
    if (lines.length === 0) {
      errors.push('Al menos una línea');
    }
    
    if (errors.length > 0) {
      setValidationErrors(errors);
      setValidationModalOpen(true);
      return;
    }
    
    const noteData = {
      date: new Date(data.date),
      clientId: data.clientId,
      series: data.series,
      notes: data.notes,
      status: data.status,
      companyId: currentCompanyId ?? undefined,
    };
    
    if (editingNote) {
      updateDeliveryNote.mutate({ 
        id: editingNote, 
        deliveryNote: noteData,
        lines
      });
    } else {
      createDeliveryNote.mutate({ 
        ...noteData,
        number: 0,
        lines 
      });
    }
    handleCloseModal();
  };

  const handleEdit = async (note: DeliveryNote) => {
    try {
      const params = new URLSearchParams();
      if (currentCompanyId) params.append('companyId', currentCompanyId);
      const response = await fetch(`/api/delivery-notes/${note.id}?${params.toString()}`, { credentials: 'include' });
      const noteData = await response.json();
      
      setEditingNote(note.id);
      form.setValue('series', note.series || 'A');
      form.setValue('date', new Date(note.date).toISOString().split('T')[0]);
      form.setValue('clientId', note.clientId || '');
      form.setValue('notes', note.notes || '');
      form.setValue('status', note.status as 'pending' | 'invoiced');
      
      if (noteData.lines && noteData.lines.length > 0) {
        setLines(noteData.lines.map((line: any) => ({
          articleId: line.articleId || '',
          quantity: String(line.quantity || '1'),
          unitPrice: String(line.unitPrice || '0'),
          vatRate: String(line.vatRate || '21.00'),
          description: line.description || '',
        })));
      } else {
        setLines([]);
      }
      
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error loading delivery note:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar el albarán para editar.",
        variant: "destructive",
      });
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingNote(null);
    setLines([]);
    form.reset();
  };

  const handleAddLine = () => {
    setLines([...lines, { articleId: '', quantity: '1', unitPrice: '0', vatRate: '21.00' }]);
  };

  const handleRemoveLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleLineChange = (index: number, field: keyof DeliveryNoteLine, value: string) => {
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

  const handleDelete = (noteId: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar este albarán?')) {
      deleteDeliveryNote.mutate(noteId);
    }
  };

  const handleGeneratePDF = async (note: DeliveryNote) => {
    try {
      const params = new URLSearchParams();
      if (currentCompanyId) params.append('companyId', currentCompanyId);
      const response = await fetch(`/api/delivery-notes/${note.id}?${params.toString()}`, { credentials: 'include' });
      const noteData = await response.json();
      
      const client = clients?.find(c => c.id === note.clientId);
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Company logo (if available)
      let logoWidth = 0;
      if (currentCompany?.logoImage) {
        try {
          doc.addImage(currentCompany.logoImage, 'AUTO', 15, 10, 25, 25);
          logoWidth = 30;
        } catch (e) {
          console.log('Error adding logo to PDF:', e);
        }
      }
      
      // Header with company name
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
        companyY += 6;
      }
      if (currentCompany?.website) {
        doc.text(`Web: ${currentCompany.website}`, textStartX, companyY);
      }
      
      // Delivery note title and number (right side)
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('ALBARÁN', pageWidth - 15, 20, { align: 'right' });
      doc.setFontSize(12);
      const noteYear = note.year || new Date(note.date).getFullYear();
      doc.text(`${note.series}-${noteYear}-${String(note.number).padStart(4, '0')}`, pageWidth - 15, 28, { align: 'right' });
      
      // Note date
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Fecha: ${format(new Date(note.date), 'dd/MM/yyyy')}`, pageWidth - 15, 38, { align: 'right' });
      
      // Separator line
      doc.setDrawColor(200, 200, 200);
      doc.line(15, 50, pageWidth - 15, 50);
      
      // Client info
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('DATOS DEL CLIENTE', 15, 60);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(client?.name || 'Sin cliente', 15, 67);
      if (client?.nif) {
        doc.text(`NIF/CIF: ${client.nif}`, 15, 73);
      }
      
      // Lines table
      const tableData = (noteData.lines || []).map((line: any) => {
        const qty = parseFloat(line.quantity) || 0;
        const price = parseFloat(line.unitPrice) || 0;
        const subtotal = qty * price;
        return [
          line.description || '',
          qty.toFixed(2),
          price.toFixed(2) + ' €',
          subtotal.toFixed(2) + ' €'
        ];
      });
      
      autoTable(doc, {
        startY: 85,
        head: [['Descripción', 'Cantidad', 'Precio Unitario', 'Subtotal']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [66, 139, 202], fontSize: 9 },
        styles: { fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 90 },
          1: { cellWidth: 25, halign: 'right' as const },
          2: { cellWidth: 35, halign: 'right' as const },
          3: { cellWidth: 30, halign: 'right' as const },
        },
      });
      
      // Total
      const totalAmount = (noteData.lines || []).reduce((sum: number, line: any) => {
        const qty = parseFloat(line.quantity) || 0;
        const price = parseFloat(line.unitPrice) || 0;
        return sum + (qty * price);
      }, 0);
      
      const afterLinesY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('TOTAL:', 130, afterLinesY);
      doc.text(`${totalAmount.toFixed(2)} €`, pageWidth - 15, afterLinesY, { align: 'right' });
      
      // Notes
      let notesEndY = afterLinesY + 10;
      if (note.notes) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('OBSERVACIONES', 15, afterLinesY + 15);
        doc.setFont('helvetica', 'normal');
        const notesText = doc.splitTextToSize(note.notes, pageWidth - 30);
        doc.text(notesText, 15, afterLinesY + 21);
        notesEndY = afterLinesY + 21 + (notesText.length * 5);
      }
      
      // Signature area - position after notes to avoid overlap
      const signatureY = Math.max(notesEndY + 15, afterLinesY + 45);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('Recibí conforme:', 15, signatureY);
      doc.line(15, signatureY + 20, 80, signatureY + 20);
      doc.text('Firma', 40, signatureY + 26);
      
      // Data protection clause (footer) - new page
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Company data for data protection text
      const companyNameForClause = currentCompany?.name || 'La empresa';
      const companyTaxIdForClause = currentCompany?.taxId || 'NIF/CIF no indicado';
      const companyAddressParts = [
        currentCompany?.address,
        currentCompany?.postalCode,
        currentCompany?.town,
        currentCompany?.province
      ].filter(Boolean);
      const companyAddressForClause = companyAddressParts.join(', ') || 'Domicilio no indicado';
      const companyEmailForClause = currentCompany?.email || '';
      
      const dataProtectionText = `INFORMACIÓN BÁSICA SOBRE PROTECCIÓN DE DATOS
• Responsable del tratamiento: ${companyNameForClause}, con NIF/CIF ${companyTaxIdForClause} y domicilio ${companyAddressForClause}.
• Finalidad: Gestión administrativa, contable, fiscal y comercial derivada de la entrega de mercancías o prestación de servicios, incluyendo el control de cobros y facturación.
• Legitimación: El tratamiento es necesario para la ejecución de un contrato en el que el interesado es parte y para el cumplimiento de obligaciones legales aplicables al responsable (especialmente en materia tributaria y mercantil).
• Destinatarios: Los datos podrán ser comunicados a la Administración Tributaria y a entidades bancarias para la gestión del cobro. Asimismo, tendrán acceso a la información los prestadores de servicios de asesoramiento contable y fiscal en su condición de encargados del tratamiento. No se realizarán otras cesiones salvo obligación legal.
• Derechos: Usted tiene derecho a acceder, rectificar y suprimir sus datos, así como a la limitación de su tratamiento, portabilidad y oposición. Puede ejercer estos derechos enviando una solicitud por escrito a la dirección postal arriba indicada${companyEmailForClause ? ` o al correo electrónico: ${companyEmailForClause}` : ''}. En caso de dudas razonables sobre su identidad, el responsable podrá solicitar información adicional para confirmarla.
• Conservación: Los datos se conservarán mientras se mantenga la relación comercial y, posteriormente, durante los años necesarios para cumplir con las obligaciones legales de prescripción (generalmente 4 años por normativa fiscal y 6 años por normativa mercantil).
Información adicional: En cumplimiento del artículo 10 de la Ley 34/2002 (LSSI), se hace constar que los medios de contacto directo y efectivo son la dirección física y el correo electrónico detallados en el apartado del Responsable.`;

      // Data protection footer on first page (no QR for delivery notes, full width)
      const footerY = pageHeight - 55;
      doc.setDrawColor(200, 200, 200);
      doc.line(15, footerY - 3, pageWidth - 15, footerY - 3);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5);
      doc.setTextColor(80, 80, 80);
      const splitText = doc.splitTextToSize(dataProtectionText, pageWidth - 25);
      doc.text(splitText, 15, footerY);
      doc.setTextColor(0, 0, 0);
      
      // Save
      const paddedNumber = String(note.number).padStart(4, '0');
      doc.save(`Albaran_${note.series}-${noteYear}-${paddedNumber}.pdf`);
      
      toast({
        title: "PDF generado",
        description: `Albarán ${note.series}-${noteYear}-${paddedNumber} descargado correctamente.`,
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

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const calculateLineTotal = (line: DeliveryNoteLine) => {
    const qty = parseFloat(line.quantity) || 0;
    const price = parseFloat(line.unitPrice) || 0;
    return qty * price;
  };

  const calculateTotal = () => {
    return lines.reduce((sum, line) => sum + calculateLineTotal(line), 0);
  };

  const filteredNotes = deliveryNotes?.filter(note => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      String(note.number).toLowerCase().includes(search) ||
      (note.notes && note.notes.toLowerCase().includes(search))
    );
  });

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
            <p className="text-muted-foreground">Cargando albaranes...</p>
          </div>
        </div>
      ) : (
        <main className="flex-1 overflow-y-auto">
          <TopBar
            title="Albaranes"
            subtitle="Notas de entrega para clientes"
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          />
          
          <div className="p-4 lg:p-8">
            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Lista de Albaranes</h3>
                  <p className="text-sm text-muted-foreground">
                    {filteredNotes?.length || 0} albaranes
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Input
                    placeholder="Buscar albaranes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:w-64"
                    data-testid="input-search-delivery-notes"
                  />
                  <Button 
                    onClick={() => setIsModalOpen(true)}
                    data-testid="button-add-delivery-note"
                    disabled={!canWrite}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Albarán
                  </Button>
                </div>
              </div>
              
              <div className="overflow-x-auto" data-testid="delivery-notes-table">
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
                    {!filteredNotes || filteredNotes.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-muted-foreground">
                          <ClipboardList className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                          <p>No hay albaranes registrados.</p>
                          {canWrite && (
                            <button 
                              onClick={() => setIsModalOpen(true)}
                              className="text-primary hover:underline mt-2"
                            >
                              Crear el primero
                            </button>
                          )}
                        </td>
                      </tr>
                    ) : (
                      filteredNotes.map((note) => {
                        const client = clients?.find(c => c.id === note.clientId);
                        return (
                          <tr 
                            key={note.id} 
                            className="border-b border-border hover:bg-muted/50 transition-colors"
                            data-testid={`delivery-note-row-${note.id}`}
                          >
                            <td className="py-3 px-4">
                              <span className="text-sm font-mono font-medium">
                                {note.series}-{note.year || new Date(note.date).getFullYear()}-{String(note.number).padStart(4, '0')}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-sm">
                                {format(new Date(note.date), 'dd/MM/yyyy', { locale: es })}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-sm">{client?.name || 'Sin cliente'}</span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className="text-sm font-semibold text-primary">
                                {formatCurrency((note as DeliveryNote & { total?: string }).total || '0')}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span 
                                className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                                  note.status === 'pending' 
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' 
                                    : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                }`}
                              >
                                {note.status === 'pending' ? 'Pendiente' : 'Facturado'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center justify-center gap-2">
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => handleEdit(note)}
                                  disabled={!canWrite || note.status === 'invoiced'}
                                  title="Editar"
                                  data-testid={`edit-delivery-note-${note.id}`}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => handleGeneratePDF(note)}
                                  title="Imprimir PDF"
                                  data-testid={`print-delivery-note-${note.id}`}
                                >
                                  <Printer className="w-4 h-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => handleDelete(note.id)}
                                  disabled={!canWrite || note.status === 'invoiced'}
                                  data-testid={`delete-delivery-note-${note.id}`}
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
              {editingNote ? 'Editar Albarán' : 'Nuevo Albarán'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="series">Serie</Label>
                <Select 
                  value={form.watch('series') || 'A'}
                  onValueChange={(value) => form.setValue('series', value)}
                >
                  <SelectTrigger data-testid="select-series">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">Serie A</SelectItem>
                    <SelectItem value="B">Serie B</SelectItem>
                    <SelectItem value="C">Serie C</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Fecha *</Label>
                <Input
                  id="date"
                  type="date"
                  {...form.register('date')}
                  data-testid="input-delivery-note-date"
                />
                {form.formState.errors.date && (
                  <p className="text-xs text-destructive">{form.formState.errors.date.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientId">Cliente *</Label>
                <Select 
                  value={form.watch('clientId') || ''}
                  onValueChange={(value) => form.setValue('clientId', value)}
                >
                  <SelectTrigger data-testid="select-client">
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
                {form.formState.errors.clientId && (
                  <p className="text-xs text-destructive">{form.formState.errors.clientId.message}</p>
                )}
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium">Líneas del Albarán</h4>
                <Button type="button" size="sm" onClick={handleAddLine} data-testid="button-add-line">
                  <Plus className="w-4 h-4 mr-1" />
                  Añadir Línea
                </Button>
              </div>
              
              {lines.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay líneas. Añade conceptos al albarán.
                </p>
              ) : (
                <div className="space-y-3">
                  {lines.map((line, index) => (
                    <div key={index} className="space-y-2 border-b pb-3">
                      <div className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-4">
                          <Label className="text-xs">Descripción</Label>
                          <Input
                            value={line.description || ''}
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
                      <div className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-4">
                          <Label className="text-xs">O seleccionar Artículo</Label>
                          <Select 
                            value={line.articleId || ''}
                            onValueChange={(value) => handleLineChange(index, 'articleId', value)}
                          >
                            <SelectTrigger>
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
                  <div className="border-t pt-3 mt-3 flex justify-end">
                    <div className="text-right">
                      <span className="text-sm text-muted-foreground">Total Base: </span>
                      <span className="text-lg font-bold">{formatCurrency(calculateTotal().toString())}</span>
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
                data-testid="input-delivery-note-notes"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleCloseModal}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createDeliveryNote.isPending || updateDeliveryNote.isPending || lines.length === 0}
                data-testid="button-save-delivery-note"
              >
                {createDeliveryNote.isPending || updateDeliveryNote.isPending ? 'Guardando...' : 'Guardar'}
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
              Para guardar es necesario completar los siguientes campos:
            </p>
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index} className="text-sm font-medium text-destructive">
                  {error}
                </li>
              ))}
            </ul>
            <div className="flex justify-end">
              <Button onClick={() => setValidationModalOpen(false)}>
                Entendido
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
