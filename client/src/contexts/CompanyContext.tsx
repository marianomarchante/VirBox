import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Company } from '@shared/schema';

interface CompanyContextType {
  currentCompanyId: string | null;
  companies: Company[];
  isLoading: boolean;
  setCurrentCompanyId: (companyId: string) => void;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [currentCompanyId, setCurrentCompanyIdState] = useState<string | null>(() => {
    const stored = localStorage.getItem('currentCompanyId');
    return stored;
  });

  const { data: companies = [], isLoading } = useQuery<Company[]>({
    queryKey: ['/api/companies'],
  });

  useEffect(() => {
    if (companies.length > 0 && !currentCompanyId) {
      const defaultCompany = companies[0];
      setCurrentCompanyIdState(defaultCompany.id);
      localStorage.setItem('currentCompanyId', defaultCompany.id);
    }
  }, [companies, currentCompanyId]);

  const setCurrentCompanyId = (companyId: string) => {
    setCurrentCompanyIdState(companyId);
    localStorage.setItem('currentCompanyId', companyId);
  };

  return (
    <CompanyContext.Provider
      value={{
        currentCompanyId,
        companies,
        isLoading,
        setCurrentCompanyId,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
}
