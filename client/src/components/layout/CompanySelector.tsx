import { Building2, Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useCompany } from "@/contexts/CompanyContext";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function CompanySelector() {
  const { currentCompanyId, companies, setCurrentCompanyId } = useCompany();
  const [open, setOpen] = useState(false);

  const currentCompany = companies.find(c => c.id === currentCompanyId);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
          data-testid="company-selector"
        >
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="truncate">
              {currentCompany?.name || "Seleccionar empresa"}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Buscar empresa..." />
          <CommandList>
            <CommandEmpty>No se encontraron empresas.</CommandEmpty>
            <CommandGroup>
              {companies.map((company) => (
                <CommandItem
                  key={company.id}
                  value={company.name}
                  onSelect={() => {
                    setCurrentCompanyId(company.id);
                    setOpen(false);
                  }}
                  data-testid={`company-option-${company.id}`}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      currentCompanyId === company.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {company.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
