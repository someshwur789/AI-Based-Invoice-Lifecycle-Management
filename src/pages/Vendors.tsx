import { MainLayout } from '@/components/layout/MainLayout';
import { useInvoiceContext } from '@/context/InvoiceContext';
import { useCurrency } from '@/context/CurrencyContext';
import { Input } from '@/components/ui/input';
import { Search, Store, Phone, MapPin, FileText } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function Vendors() {
  const { vendors } = useInvoiceContext();
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const filtered = vendors.filter((v) => v.name.toLowerCase().includes(search.toLowerCase()));

  const { formatCurrency } = useCurrency();

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Vendors</h1>
          <p className="mt-1 text-muted-foreground">Manage your vendors and suppliers.</p>
        </div>

        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search vendors..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {vendors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Store className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-semibold text-foreground">No vendors yet</p>
            <p className="text-sm text-muted-foreground mt-1">Vendor details will be extracted automatically when you upload invoices.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((vendor) => (
              <div key={vendor.name} className="rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md animate-fade-in">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
                    {vendor.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{vendor.name}</h3>
                    {vendor.phone && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" />{vendor.phone}</p>
                    )}
                  </div>
                </div>
                {vendor.address && (
                  <p className="mt-3 text-sm text-muted-foreground flex items-start gap-1"><MapPin className="h-3 w-3 mt-0.5 shrink-0" />{vendor.address}</p>
                )}
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Invoices</p>
                    <p className="text-2xl font-bold text-foreground">{vendor.totalInvoices}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Value</p>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(vendor.totalAmount)}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <Button variant="outline" size="sm" className="w-full" onClick={() => navigate(`/invoices?vendor=${encodeURIComponent(vendor.name)}`)}>
                    <FileText className="mr-2 h-4 w-4" />View Invoices
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
