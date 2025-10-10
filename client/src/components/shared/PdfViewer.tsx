import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

interface PdfViewerProps {
  isOpen: boolean;
  onClose: () => void;
  pdfData: string;
  fileName: string;
}

export default function PdfViewer({ isOpen, onClose, pdfData, fileName }: PdfViewerProps) {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = pdfData;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle>{fileName}</DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                data-testid="button-download-pdf"
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden rounded-md border border-border bg-muted/30">
          <iframe
            src={pdfData}
            className="w-full h-full"
            title={fileName}
            data-testid="pdf-iframe"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
