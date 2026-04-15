import { ReactNode } from "react";
import { useForm, UseFormReturn, FieldValues, Path, DefaultValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface EntityFormProps<T extends FieldValues> {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: T) => void;
  schema: z.ZodSchema<T>;
  defaultValues: DefaultValues<T>;
  isLoading?: boolean;
  children: (form: UseFormReturn<T>) => ReactNode;
  testId?: string;
  maxWidth?: string;
}

export function EntityForm<T extends FieldValues>({
  title,
  isOpen,
  onClose,
  onSubmit,
  schema,
  defaultValues,
  isLoading,
  children,
  testId,
  maxWidth = "max-w-2xl",
}: EntityFormProps<T>) {
  const form = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const handleFormSubmit = (data: T) => {
    onSubmit(data);
    form.reset();
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={maxWidth}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6" data-testid={testId}>
          {children(form)}
          
          <div className="flex items-center gap-3 pt-6 border-t border-border">
            <Button 
              type="submit" 
              className="flex-1"
              disabled={isLoading}
              data-testid={`${testId}-save`}
            >
              Guardar
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              data-testid={`${testId}-cancel`}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
