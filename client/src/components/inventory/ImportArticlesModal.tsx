import { useState, useRef } from "react";
import { Upload, X, CheckCircle2, AlertCircle } from "lucide-react";
import * as XLSX from "xlsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useArticles } from "@/hooks/use-articles";
import { useCompany } from "@/contexts/CompanyContext";

interface ImportArticlesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ParsedArticle {
  name: string;
  code?: string;
  description?: string;
  unitPrice: string;
  vatRate: string;
  stock?: string;
  unitOfMeasure?: string;
  isValid: boolean;
  error?: string;
}

export function ImportArticlesModal({ isOpen, onClose }: ImportArticlesModalProps) {
  const [parsedData, setParsedData] = useState<ParsedArticle[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { bulkCreateArticles } = useArticles();
  const { currentCompanyId } = useCompany();

  const resetState = () => {
    setParsedData([]);
    setIsDragging(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Use defval to ensure empty cells aren't skipped
        const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, { defval: "" });
        
        const parsedArticles = jsonData.map((row: any) => {
          // Flexible key matching (ignore case and spaces)
          const findKey = (keys: string[]) => {
            const rowKeys = Object.keys(row);
            const foundKey = rowKeys.find(k => keys.includes(k.trim().toLowerCase()));
            return foundKey ? row[foundKey] : "";
          };

          const name = findKey(["nombre", "name", "articulo", "artículo"]);
          const code = findKey(["codigo", "código", "code", "referencia", "ref"]);
          const description = findKey(["descripcion", "descripción", "description", "desc"]);
          const priceStr = findKey(["precio", "price", "p.v.p", "pvp"]);
          const vatStr = findKey(["iva", "vat", "impuesto"]);
          const stockStr = findKey(["stock", "cantidad", "inventario"]);
          const unit = findKey(["unidad", "unit", "medida"]);

          const price = parseFloat(String(priceStr).replace(",", "."));
          const vat = parseFloat(String(vatStr).replace(",", "."));
          const stock = parseFloat(String(stockStr).replace(",", "."));

          const isValid = !!name && !isNaN(price);

          return {
            name: String(name),
            code: code ? String(code) : undefined,
            description: description ? String(description) : undefined,
            unitPrice: !isNaN(price) ? price.toFixed(2) : "0.00",
            vatRate: !isNaN(vat) ? vat.toFixed(2) : "21.00",
            stock: !isNaN(stock) ? stock.toFixed(2) : undefined,
            unitOfMeasure: unit ? String(unit) : "unidad",
            isValid,
            error: !isValid ? "Falta Nombre o Precio válido" : undefined
          };
        });

        setParsedData(parsedArticles);
      } catch (error) {
        console.error("Error parsing file", error);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleImport = () => {
    if (!currentCompanyId) return;

    const validArticles = parsedData.filter(a => a.isValid);
    if (validArticles.length === 0) return;

    const toInsert = validArticles.map(a => ({
      companyId: currentCompanyId,
      name: a.name,
      code: a.code || null,
      description: a.description || null,
      unitPrice: a.unitPrice,
      vatRate: a.vatRate,
      stock: a.stock || null,
      unitOfMeasure: a.unitOfMeasure,
      isActive: true
    }));

    bulkCreateArticles.mutate(toInsert, {
      onSuccess: () => {
        handleClose();
      }
    });
  };

  const validCount = parsedData.filter(a => a.isValid).length;
  const invalidCount = parsedData.length - validCount;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Importar Artículos</DialogTitle>
          <DialogDescription>
            Sube un archivo Excel (.xlsx, .xls) o CSV con tus artículos.
          </DialogDescription>
        </DialogHeader>

        {!parsedData.length ? (
          <div className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg border text-sm">
              <h4 className="font-semibold mb-2">Estructura requerida del archivo</h4>
              <p className="mb-2 text-muted-foreground">La primera fila debe contener los encabezados. Las columnas reconocidas son:</p>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li><strong>Nombre</strong> (Obligatorio)</li>
                <li><strong>Precio</strong> (Obligatorio)</li>
                <li><strong>Código</strong> (Opcional - <span className="text-yellow-600 dark:text-yellow-500">Si un código ya existe, la fila será ignorada para evitar duplicados</span>)</li>
                <li><strong>IVA</strong> (Opcional, por defecto 21)</li>
                <li><strong>Stock</strong> (Opcional)</li>
                <li><strong>Unidad</strong> (Opcional, ej: "unidad", "kg", "hora")</li>
                <li><strong>Descripción</strong> (Opcional)</li>
              </ul>
            </div>

            <div 
              className={`border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center transition-colors cursor-pointer ${
                isDragging ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                onChange={handleFileChange}
              />
              <Upload className={`w-10 h-10 mb-4 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
              <p className="text-sm font-medium mb-1">Haz clic para seleccionar o arrastra el archivo aquí</p>
              <p className="text-xs text-muted-foreground">Soporta formatos .xlsx, .xls y .csv</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-muted/50 p-3 rounded-md">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-500">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">{validCount} artículos válidos</span>
              </div>
              {invalidCount > 0 && (
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">{invalidCount} filas inválidas</span>
                </div>
              )}
            </div>

            <div className="max-h-64 overflow-y-auto border rounded-md">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="py-2 px-3 text-left font-medium">Código</th>
                    <th className="py-2 px-3 text-left font-medium">Nombre</th>
                    <th className="py-2 px-3 text-right font-medium">Precio</th>
                    <th className="py-2 px-3 text-center font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {parsedData.slice(0, 50).map((row, i) => (
                    <tr key={i} className={!row.isValid ? "bg-destructive/10" : ""}>
                      <td className="py-2 px-3 font-mono text-xs">{row.code || "-"}</td>
                      <td className="py-2 px-3 truncate max-w-[150px]" title={row.name}>{row.name || "-"}</td>
                      <td className="py-2 px-3 text-right">{row.unitPrice}</td>
                      <td className="py-2 px-3 text-center">
                        {row.isValid ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" />
                        ) : (
                          <span className="text-xs text-destructive font-medium" title={row.error}>{row.error}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {parsedData.length > 50 && (
              <p className="text-xs text-center text-muted-foreground">Mostrando solo las primeras 50 filas.</p>
            )}
            
            <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 p-3 rounded-md text-xs">
              <strong>Nota importante:</strong> Los artículos cuyo código ya exista en el inventario actual serán ignorados y no se actualizarán, evitando así duplicados o sobreescrituras accidentales.
            </div>
          </div>
        )}

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={parsedData.length > 0 ? resetState : handleClose}>
            {parsedData.length > 0 ? "Cancelar" : "Cerrar"}
          </Button>
          {parsedData.length > 0 && (
            <Button 
              onClick={handleImport} 
              disabled={validCount === 0 || bulkCreateArticles.isPending}
            >
              {bulkCreateArticles.isPending ? "Importando..." : `Importar ${validCount} artículos`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
