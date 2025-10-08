import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function NoCompanySelected() {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Alert className="max-w-md">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No hay empresa seleccionada</AlertTitle>
        <AlertDescription>
          Debe seleccionar una empresa para poder realizar acciones. 
          Por favor, seleccione una empresa desde el menú lateral o cree una nueva empresa primero.
        </AlertDescription>
      </Alert>
    </div>
  );
}
