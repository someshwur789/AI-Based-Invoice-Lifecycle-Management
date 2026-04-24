import { useInvoiceContext } from '@/context/InvoiceContext';
import { useCurrency } from '@/context/CurrencyContext';
import { InvoiceStatusBadge } from '../invoices/InvoiceStatusBadge';
import { ArrowRight, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export function RecentInvoices() {
  const { invoices } = useInvoiceContext();
  const recentInvoices = invoices.slice(0, 5);

  const { formatCurrency } = useCurrency();

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-card-foreground">Recent Invoices</h3>
          <p className="text-sm text-muted-foreground">Latest invoice activity</p>
        </div>
        <Link to="/invoices" className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors">
          View all <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      {recentInvoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <FileText className="h-10 w-10 text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">No invoices yet. Upload your first invoice to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {recentInvoices.map((invoice) => (
            <div key={invoice.id} className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/30">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {invoice.clientName.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-foreground">{invoice.clientName}</p>
                  <p className="text-sm text-muted-foreground">{invoice.invoiceNumber}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-semibold text-foreground">{formatCurrency(invoice.amount)}</span>
                <InvoiceStatusBadge status={invoice.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
