import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type CurrencyCode = 'INR' | 'USD' | 'EUR';

interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  locale: string;
  label: string;
}

export const CURRENCIES: CurrencyConfig[] = [
  { code: 'INR', symbol: '₹', locale: 'en-IN', label: 'Indian Rupee (₹)' },
  { code: 'USD', symbol: '$', locale: 'en-US', label: 'US Dollar ($)' },
  { code: 'EUR', symbol: '€', locale: 'de-DE', label: 'Euro (€)' },
];

interface CurrencyContextType {
  currency: CurrencyConfig;
  setCurrencyCode: (code: CurrencyCode) => void;
  formatCurrency: (amount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | null>(null);

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [code, setCode] = useState<CurrencyCode>(() => {
    const saved = localStorage.getItem('app-currency');
    return (saved as CurrencyCode) || 'INR';
  });

  const currency = CURRENCIES.find(c => c.code === code) || CURRENCIES[0];

  const setCurrencyCode = useCallback((newCode: CurrencyCode) => {
    setCode(newCode);
    localStorage.setItem('app-currency', newCode);
  }, []);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat(currency.locale, { style: 'currency', currency: currency.code }).format(amount);
  }, [currency]);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrencyCode, formatCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}
