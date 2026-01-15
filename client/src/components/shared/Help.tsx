import { useState, type ReactNode } from "react";
import { HelpCircle, X, Home, TrendingUp, TrendingDown, Package, Users, Truck, FileText, FolderOpen, Building2, BarChart3, Settings, Calendar, Filter, Download, Upload, Receipt, FileCode, QrCode } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

interface HelpDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactNode;
}

export function HelpDialog({ open, onOpenChange, trigger }: HelpDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  
  const isControlled = open !== undefined && onOpenChange !== undefined;
  const dialogOpen = isControlled ? open : internalOpen;
  const setDialogOpen = isControlled ? onOpenChange : setInternalOpen;

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <HelpCircle className="h-6 w-6" />
            Guía de Usuario - MiContable
          </DialogTitle>
          <DialogDescription>
            Documentación completa del sistema de gestión empresarial
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Inicio</TabsTrigger>
            <TabsTrigger value="modules">Módulos</TabsTrigger>
            <TabsTrigger value="invoicing">Facturación</TabsTrigger>
            <TabsTrigger value="reports">Informes</TabsTrigger>
            <TabsTrigger value="admin">Admin</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[500px] mt-4">
            {/* OVERVIEW TAB */}
            <TabsContent value="overview" className="space-y-4">
              <div className="space-y-4">
                <section>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Home className="h-5 w-5 text-primary" />
                    Bienvenido a MiContable
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Sistema integral de gestión empresarial para entidades, organizaciones y asociaciones.
                    Permite gestionar transacciones financieras, inventario, clientes, proveedores y documentos.
                  </p>
                </section>

                <section className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    Sistema Multi-Empresa
                  </h4>
                  <ul className="text-sm space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Selector de Empresa:</strong> Ubicado en la parte superior derecha. Selecciona la empresa activa para trabajar.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Datos Aislados:</strong> Cada empresa tiene sus propios datos completamente separados.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Permisos:</strong> Dos niveles - "Consulta" (solo lectura) y "Administración" (lectura y escritura).</span>
                    </li>
                  </ul>
                </section>

                <section className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Inicio Rápido</h4>
                  <ol className="text-sm space-y-3 text-muted-foreground">
                    <li className="flex gap-2">
                      <span className="font-bold text-primary">1.</span>
                      <span>Selecciona una empresa del selector superior</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-primary">2.</span>
                      <span>Navega usando el menú lateral (escritorio) o menú hamburguesa (móvil)</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-primary">3.</span>
                      <span>Explora las Estadísticas para ver el resumen de tu empresa</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-primary">4.</span>
                      <span>Comienza a registrar transacciones, productos o documentos</span>
                    </li>
                  </ol>
                </section>
              </div>
            </TabsContent>

            {/* MODULES TAB */}
            <TabsContent value="modules" className="space-y-4">
              <div className="space-y-4">
                <ModuleSection
                  icon={<Home className="h-5 w-5" />}
                  title="Estadísticas"
                  description="Panel principal con métricas y resumen de tu empresa"
                  features={[
                    "Visualiza ingresos, gastos y ganancia neta del mes actual",
                    "Gráficos de tendencias mensuales de ingresos vs gastos",
                    "Distribución de gastos por categoría",
                    "Acceso rápido a transacciones recientes"
                  ]}
                />

                <ModuleSection
                  icon={<TrendingUp className="h-5 w-5" />}
                  title="Ingresos"
                  description="Gestión de todas las entradas de dinero"
                  features={[
                    "Registra ingresos con fecha, categoría y concepto",
                    "Adjunta documentos PDF a cada ingreso",
                    "Filtra por búsqueda, categoría y rango de fechas",
                    "Visualiza y descarga PDFs adjuntos"
                  ]}
                />

                <ModuleSection
                  icon={<TrendingDown className="h-5 w-5" />}
                  title="Egresos"
                  description="Control de todas las salidas de dinero"
                  features={[
                    "Registra gastos con categorización detallada",
                    "Soporte para documentos PDF adjuntos",
                    "Búsqueda y filtrado avanzado",
                    "Seguimiento de gastos por categoría"
                  ]}
                />

                <ModuleSection
                  icon={<Package className="h-5 w-5" />}
                  title="Inventario"
                  description="Gestión de objetos y bienes de la entidad"
                  features={[
                    "Registro de objetos con valor en euros",
                    "Fecha de adquisición y emplazamiento de cada bien",
                    "Adjuntar documentos PDF e imágenes",
                    "Categorización personalizada de objetos",
                    "Visualización de documentos e imágenes adjuntos"
                  ]}
                />

                <ModuleSection
                  icon={<Users className="h-5 w-5" />}
                  title="Clientes"
                  description="Base de datos de clientes y contactos"
                  features={[
                    "Información completa de contacto",
                    "Categorización por tipo de cliente",
                    "Seguimiento de correos y teléfonos",
                    "Gestión de direcciones"
                  ]}
                />

                <ModuleSection
                  icon={<Truck className="h-5 w-5" />}
                  title="Proveedores"
                  description="Gestión de proveedores y suministradores"
                  features={[
                    "Registro completo de proveedores",
                    "Categorización por tipo de suministro",
                    "Información de contacto detallada",
                    "Control de proveedores activos/inactivos"
                  ]}
                />

                <ModuleSection
                  icon={<FileText className="h-5 w-5" />}
                  title="Gestión Documental"
                  description="Repositorio central de documentos"
                  features={[
                    "Almacenamiento de archivos PDF",
                    "Organización por categorías personalizadas",
                    "Búsqueda por título y descripción",
                    "Filtrado por categoría y rango de fechas",
                    "Descarga y visualización de documentos"
                  ]}
                />
              </div>
            </TabsContent>

            {/* INVOICING TAB */}
            <TabsContent value="invoicing" className="space-y-4">
              <div className="space-y-4">
                <section>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-primary" />
                    Módulo de Facturación
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Sistema completo de facturación conforme a la normativa española, con generación de facturas en PDF y XML Facturae 3.2.2.
                  </p>
                </section>

                <ModuleSection
                  icon={<Package className="h-5 w-5" />}
                  title="Artículos"
                  description="Catálogo de productos y servicios para facturación"
                  features={[
                    "Registro de artículos con código, nombre y descripción",
                    "Precio unitario y tipo de IVA configurable (21%, 10%, 4%, 0%)",
                    "Categorización de artículos",
                    "Búsqueda y filtrado rápido",
                    "Los artículos se usan en albaranes y facturas"
                  ]}
                />

                <ModuleSection
                  icon={<FileText className="h-5 w-5" />}
                  title="Albaranes"
                  description="Notas de entrega para documentar entregas de productos o servicios"
                  features={[
                    "Numeración secuencial automática (SERIE-AÑO-NÚMERO)",
                    "Selección de cliente y artículos del catálogo",
                    "Cálculo automático de totales",
                    "Generación de PDF con datos de empresa y cliente",
                    "Área de firma para conformidad del cliente",
                    "Cláusula de protección de datos (RGPD/LOPDGDD)",
                    "Conversión a factura con un clic"
                  ]}
                />

                <ModuleSection
                  icon={<Receipt className="h-5 w-5" />}
                  title="Facturas"
                  description="Facturación completa conforme a normativa española"
                  features={[
                    "Numeración secuencial por serie y año (SERIE-AÑO-NÚMERO)",
                    "Desglose de IVA por tipos (21%, 10%, 4%, 0%)",
                    "Retención IRPF configurable (0%, 1%, 2%, 7%, 15%)",
                    "Exención de IVA con motivos según Ley 37/1992",
                    "Formas de pago: transferencia, efectivo, tarjeta, domiciliación",
                    "Cuenta bancaria automática en transferencias",
                    "Estados: borrador, emitida, pagada, anulada",
                    "Creación automática de ingreso al emitir"
                  ]}
                />

                <section className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Download className="h-4 w-4 text-primary" />
                    Generación de Documentos
                  </h4>
                  <ul className="text-sm space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>PDF:</strong> Factura visual con logo de empresa, datos completos y código QR de verificación</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>XML Facturae 3.2.2:</strong> Formato oficial para facturación electrónica en España</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Código QR:</strong> Contiene fecha, número de factura, NIF empresa y NIF cliente</span>
                    </li>
                  </ul>
                </section>

                <section className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <QrCode className="h-4 w-4 text-primary" />
                    Código QR de Factura
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Cada factura incluye un código QR con un código alfanumérico de 38 caracteres:
                  </p>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• AAAAMMDDHHMM (12 dígitos) - Fecha y hora</li>
                    <li>• Número de factura (10 dígitos)</li>
                    <li>• NIF/CIF de la empresa (10 dígitos)</li>
                    <li>• NIF/CIF del cliente (10 dígitos)</li>
                  </ul>
                </section>

                <section className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 text-amber-600 dark:text-amber-400">📋 Exención de IVA</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    El sistema incluye más de 30 motivos de exención según la Ley 37/1992:
                  </p>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Art. 20: Exenciones interiores (sanidad, educación, servicios sociales...)</li>
                    <li>• Art. 21-25: Exportaciones e intracomunitarias</li>
                    <li>• Al activar exención, el IVA se aplica al 0%</li>
                    <li>• El motivo aparece en PDF y XML</li>
                  </ul>
                </section>

                <section className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 text-blue-600 dark:text-blue-400">💼 Retenciones IRPF</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Tipos de retención disponibles según legislación española:
                  </p>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• 0% - Sin retención</li>
                    <li>• 1% - Engorde porcino/avicultura</li>
                    <li>• 2% - Actividades agrícolas/ganaderas</li>
                    <li>• 7% - Inicio de actividad profesional</li>
                    <li>• 15% - Profesionales (tipo general)</li>
                  </ul>
                </section>
              </div>
            </TabsContent>

            {/* REPORTS TAB */}
            <TabsContent value="reports" className="space-y-4">
              <div className="space-y-4">
                <section>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Módulo de Informes
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Análisis financiero completo con múltiples opciones de filtrado y exportación a PDF.
                  </p>
                </section>

                <section className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Filter className="h-4 w-4 text-primary" />
                    Opciones de Período
                  </h4>
                  <ul className="text-sm space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Mes:</strong> Visualiza datos diarios de un mes específico</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Trimestre:</strong> Muestra datos mensuales de un trimestre (Q1-Q4)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Año:</strong> Datos mensuales de un año completo</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Rango Personalizado:</strong> Selecciona fechas específicas "Desde" y "Hasta"</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Todos los Años:</strong> Vista general de todos los años registrados</span>
                    </li>
                  </ul>
                </section>

                <section className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    Rango de Fechas Personalizado
                  </h4>
                  <ol className="text-sm space-y-2 text-muted-foreground">
                    <li className="flex gap-2">
                      <span className="font-bold text-primary">1.</span>
                      <span>Selecciona "Rango personalizado" en el filtro de período</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-primary">2.</span>
                      <span>Haz clic en el botón "Desde" y selecciona la fecha inicial</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-primary">3.</span>
                      <span>Haz clic en el botón "Hasta" y selecciona la fecha final</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-primary">4.</span>
                      <span>Los gráficos se actualizan automáticamente con los datos del rango</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-primary">5.</span>
                      <span>Usa el botón "Limpiar fechas" para resetear el filtro</span>
                    </li>
                  </ol>
                  <div className="mt-3 p-2 bg-primary/10 rounded text-sm">
                    <strong className="text-primary">Nota:</strong> Rangos ≤ 90 días muestran datos diarios. Rangos &gt; 90 días agrupan por semanas.
                  </div>
                </section>

                <section className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Filter className="h-4 w-4 text-primary" />
                    Filtros Adicionales
                  </h4>
                  <ul className="text-sm space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Tipo:</strong> Filtra por "Todos", "Ingresos" o "Gastos"</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Categoría:</strong> Filtra por categoría específica de ingreso o gasto</span>
                    </li>
                  </ul>
                </section>

                <section className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Download className="h-4 w-4 text-primary" />
                    Exportación a PDF
                  </h4>
                  <ul className="text-sm space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Haz clic en "Exportar a PDF" para generar el informe</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>El PDF incluye: métricas resumen, transacciones detalladas y gráficos por categoría</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>El nombre del archivo incluye el período y la fecha de generación</span>
                    </li>
                  </ul>
                </section>

                <section className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Métricas Disponibles</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-start gap-2">
                      <TrendingUp className="h-4 w-4 text-primary mt-0.5" />
                      <div>
                        <strong className="block">Ingresos Totales</strong>
                        <span className="text-muted-foreground text-xs">Suma de todos los ingresos del período</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <TrendingDown className="h-4 w-4 text-destructive mt-0.5" />
                      <div>
                        <strong className="block">Gastos Totales</strong>
                        <span className="text-muted-foreground text-xs">Suma de todos los gastos del período</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <BarChart3 className="h-4 w-4 text-secondary mt-0.5" />
                      <div>
                        <strong className="block">Ganancia Neta</strong>
                        <span className="text-muted-foreground text-xs">Diferencia entre ingresos y gastos</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 text-accent mt-0.5" />
                      <div>
                        <strong className="block">Transacciones</strong>
                        <span className="text-muted-foreground text-xs">Cantidad de operaciones registradas</span>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2 text-amber-600 dark:text-amber-400">
                    <Receipt className="h-4 w-4" />
                    Retenciones IRPF Practicadas
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Cuando existen facturas con retención IRPF en el período seleccionado, se muestra una sección adicional con:
                  </p>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Total de retenciones IRPF del período</li>
                    <li>• Número de facturas con retención</li>
                    <li>• Tabla detallada con fecha, nº factura, cliente, NIF, base imponible, % IRPF e importe</li>
                    <li>• Información útil para declaraciones trimestrales (modelo 111)</li>
                  </ul>
                </section>
              </div>
            </TabsContent>

            {/* ADMIN TAB */}
            <TabsContent value="admin" className="space-y-4">
              <div className="space-y-4">
                <section>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Settings className="h-5 w-5 text-primary" />
                    Administración del Sistema
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Funciones administrativas disponibles solo para usuarios con rol de Administrador Global.
                  </p>
                </section>

                <ModuleSection
                  icon={<Building2 className="h-5 w-5" />}
                  title="Gestión de Empresas"
                  description="Administración de empresas en el sistema"
                  features={[
                    "Crear y editar empresas con datos fiscales completos",
                    "Configurar NIF/CIF, dirección, teléfono y email",
                    "Subir logotipo de empresa (aparece en facturas, albaranes e informes)",
                    "Cuenta bancaria para pagos por transferencia",
                    "Página web de la empresa",
                    "Activar/desactivar empresas",
                    "Eliminar empresas (elimina todos los datos asociados)"
                  ]}
                />

                <section className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 text-blue-600 dark:text-blue-400">📄 Documentos PDF</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Todos los documentos PDF generados (facturas, albaranes, informes) incluyen:
                  </p>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• <strong>Logo de empresa:</strong> En la esquina superior izquierda</li>
                    <li>• <strong>Datos completos:</strong> NIF, dirección, teléfono, email y web</li>
                    <li>• <strong>Cláusula RGPD/LOPDGDD:</strong> Protección de datos en el pie</li>
                    <li>• <strong>Cuenta bancaria:</strong> En facturas con pago por transferencia</li>
                  </ul>
                </section>

                <ModuleSection
                  icon={<Users className="h-5 w-5" />}
                  title="Gestión de Usuarios"
                  description="Control de accesos y permisos"
                  features={[
                    "Asignar usuarios a empresas",
                    "Configurar permisos por empresa (Consulta o Administración)",
                    "Revocar accesos a empresas",
                    "Otorgar rol de Administrador Global"
                  ]}
                />

                <ModuleSection
                  icon={<FolderOpen className="h-5 w-5" />}
                  title="Categorías Personalizadas"
                  description="Configuración de categorías"
                  features={[
                    "Categorías de Ingresos: Personaliza tus tipos de ingresos",
                    "Categorías de Gastos: Define tus categorías de gastos",
                    "Categorías de Productos: Organiza tu inventario",
                    "Categorías de Documentos: Clasifica tus archivos"
                  ]}
                />

                <section className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 text-amber-600 dark:text-amber-400">⚠️ Permisos del Sistema</h4>
                  <ul className="text-sm space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 mt-1">•</span>
                      <span><strong>Consulta:</strong> Solo puede ver datos. No puede crear, editar o eliminar.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 mt-1">•</span>
                      <span><strong>Administración:</strong> Acceso completo para gestionar todos los datos de la empresa.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 mt-1">•</span>
                      <span><strong>Admin Global:</strong> Control total del sistema, incluyendo gestión de empresas y usuarios.</span>
                    </li>
                  </ul>
                </section>

                <section className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Buenas Prácticas</h4>
                  <ul className="text-sm space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">✓</span>
                      <span>Asigna permisos de "Consulta" a usuarios que solo necesitan ver información</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">✓</span>
                      <span>Revisa periódicamente los accesos de usuarios a las empresas</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">✓</span>
                      <span>Realiza copias de seguridad antes de eliminar empresas</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">✓</span>
                      <span>Mantén las categorías organizadas y con nombres descriptivos</span>
                    </li>
                  </ul>
                </section>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-center text-muted-foreground">
            MiContable - Sistema de Gestión Empresarial • Una idea de Mariano Marchante
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ModuleSection({ icon, title, description, features }: { 
  icon: ReactNode; 
  title: string; 
  description: string; 
  features: string[];
}) {
  return (
    <section className="bg-muted/50 rounded-lg p-4">
      <h4 className="font-semibold mb-2 flex items-center gap-2">
        <span className="text-primary">{icon}</span>
        {title}
      </h4>
      <p className="text-sm text-muted-foreground mb-3">{description}</p>
      <ul className="text-sm space-y-1.5">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2 text-muted-foreground">
            <span className="text-primary mt-1">•</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function Help() {
  return (
    <HelpDialog 
      trigger={
        <Button variant="ghost" size="sm" className="gap-2" data-testid="button-help">
          <HelpCircle className="h-5 w-5" />
          <span className="hidden sm:inline">Ayuda</span>
        </Button>
      }
    />
  );
}
