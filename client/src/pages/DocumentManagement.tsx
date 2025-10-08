import { useState } from "react";
import { Plus, Edit, Trash2, FileText, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Sidebar from "@/components/layout/Sidebar";
import MobileMenu from "@/components/layout/MobileMenu";
import TopBar from "@/components/layout/TopBar";
import { insertDocumentSchema, type Document, type InsertDocument } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useCompany } from "@/contexts/CompanyContext";
import { useCompanyPermission } from "@/hooks/use-company-permission";
import NoCompanySelected from "@/components/shared/NoCompanySelected";
import { z } from "zod";
import { format } from "date-fns";

const documentFormSchema = insertDocumentSchema.extend({
  title: z.string().min(1, "El título es requerido"),
});

type DocumentFormValues = z.infer<typeof documentFormSchema>;

export default function DocumentManagement() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const { toast } = useToast();
  const { currentCompanyId } = useCompany();
  const { canWrite, hasCompanySelected } = useCompanyPermission();

  const { data: documents, isLoading } = useQuery<Document[]>({
    queryKey: ['/api/documents', currentCompanyId],
    queryFn: async () => {
      const response = await fetch(`/api/documents?companyId=${currentCompanyId}`, {
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch documents');
      return response.json();
    },
    enabled: !!currentCompanyId,
  });

  const createDocument = useMutation({
    mutationFn: async (data: InsertDocument) => {
      const response = await apiRequest('POST', `/api/documents?companyId=${currentCompanyId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents', currentCompanyId] });
      toast({ title: "Documento creado exitosamente" });
    },
    onError: () => {
      toast({ title: "Error al crear documento", variant: "destructive" });
    },
  });

  const updateDocument = useMutation({
    mutationFn: async ({ id, document }: { id: string; document: Partial<InsertDocument> }) => {
      const response = await apiRequest('PUT', `/api/documents/${id}?companyId=${currentCompanyId}`, document);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents', currentCompanyId] });
      toast({ title: "Documento actualizado exitosamente" });
    },
    onError: () => {
      toast({ title: "Error al actualizar documento", variant: "destructive" });
    },
  });

  const deleteDocument = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/documents/${id}?companyId=${currentCompanyId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents', currentCompanyId] });
      toast({ title: "Documento eliminado exitosamente" });
    },
    onError: () => {
      toast({ title: "Error al eliminar documento", variant: "destructive" });
    },
  });

  const form = useForm<DocumentFormValues>({
    resolver: zodResolver(documentFormSchema),
    defaultValues: {
      title: '',
      description: '',
      pdfData: '',
      pdfFileName: '',
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        const parts = dataUrl.split(',');
        if (parts.length >= 2) {
          const base64String = parts[1];
          form.setValue('pdfData', base64String);
          form.setValue('pdfFileName', file.name);
        } else {
          toast({ title: "Error al procesar el archivo PDF", variant: "destructive" });
        }
      };
      reader.readAsDataURL(file);
    } else {
      toast({ title: "Por favor seleccione un archivo PDF válido", variant: "destructive" });
    }
  };

  const handleSubmit = (data: DocumentFormValues) => {
    if (editingDocument) {
      updateDocument.mutate({ id: editingDocument, document: data });
    } else {
      createDocument.mutate(data);
    }
    handleCloseModal();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDocument(null);
    setPdfFile(null);
    form.reset({
      title: '',
      description: '',
      pdfData: '',
      pdfFileName: '',
    });
  };

  const handleEdit = (documentId: string) => {
    const document = documents?.find(d => d.id === documentId);
    if (document) {
      setEditingDocument(documentId);
      form.reset({
        title: document.title,
        description: document.description || '',
        pdfData: document.pdfData || '',
        pdfFileName: document.pdfFileName || '',
      });
      setIsModalOpen(true);
    }
  };

  const handleDelete = (documentId: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar este documento?')) {
      deleteDocument.mutate(documentId);
    }
  };

  const handleDownload = (document: Document) => {
    if (document.pdfData && document.pdfFileName) {
      const link = window.document.createElement('a');
      const dataUrl = document.pdfData.startsWith('data:')
        ? document.pdfData
        : `data:application/pdf;base64,${document.pdfData}`;
      link.href = dataUrl;
      link.download = document.pdfFileName;
      link.click();
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
            <p className="text-muted-foreground">Cargando documentos...</p>
          </div>
        </div>
      ) : (
        <main className="flex-1 overflow-y-auto">
          <TopBar
            title="Gestión Documental"
            subtitle="Administración de documentos PDF"
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          />
          
          <div className="p-4 lg:p-8">
            <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Documentos</h3>
                <p className="text-sm text-muted-foreground">
                  {documents?.length || 0} documentos registrados
                </p>
              </div>
              <Button 
                onClick={() => setIsModalOpen(true)}
                data-testid="button-add-document"
                disabled={!canWrite}
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar Documento
              </Button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="documents-table">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Título</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Descripción</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Archivo</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Fecha</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {documents?.map((document) => (
                    <tr
                      key={document.id}
                      className="border-b border-border hover:bg-muted/50 transition-colors"
                      data-testid={`document-row-${document.id}`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-blue-600" />
                          </div>
                          <span className="font-medium text-foreground" data-testid={`document-title-${document.id}`}>
                            {document.title}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground max-w-xs truncate">
                        {document.description || '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {document.pdfFileName || 'Sin archivo'}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {format(new Date(document.createdAt), 'dd/MM/yyyy')}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2 justify-end">
                          {document.pdfData && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleDownload(document)}
                              data-testid={`button-download-${document.id}`}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleEdit(document.id)}
                            data-testid={`button-edit-${document.id}`}
                            disabled={!canWrite}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleDelete(document.id)}
                            data-testid={`button-delete-${document.id}`}
                            disabled={!canWrite}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {documents?.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        No hay documentos registrados
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            </div>
          </div>
        </main>
      )}

      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingDocument ? 'Editar Documento' : 'Nuevo Documento'}
            </DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título del Documento</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Ej: Contrato de compra de semillas"
                        data-testid="input-document-title"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value || ''}
                        placeholder="Descripción del documento (opcional)"
                        rows={3}
                        data-testid="input-document-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <label className="text-sm font-medium">Archivo PDF</label>
                <div className="flex items-center gap-4">
                  <Input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="flex-1"
                    data-testid="input-document-pdf"
                  />
                  {pdfFile && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="w-4 h-4" />
                      {pdfFile.name}
                    </div>
                  )}
                  {!pdfFile && form.getValues('pdfFileName') && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="w-4 h-4" />
                      {form.getValues('pdfFileName')}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCloseModal}
                  data-testid="button-cancel"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={createDocument.isPending || updateDocument.isPending}
                  data-testid="button-save-document"
                >
                  {editingDocument ? 'Actualizar' : 'Crear'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
