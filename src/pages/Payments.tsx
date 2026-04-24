import { useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useInvoiceContext } from '@/context/InvoiceContext';
import { useCurrency } from '@/context/CurrencyContext';
import { InvoiceStatusBadge } from '@/components/invoices/InvoiceStatusBadge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { ArrowUpRight, ArrowDownRight, CreditCard } from 'lucide-react';

export default function Payments() {
  const { invoices, metrics } = useInvoiceContext();

  const payments = useMemo(() =>
    invoices
      .filter((inv) => inv.status === 'paid')
      .map((inv) => ({
        id: `PAY-${inv.id.slice(0, 6)}`,
        invoiceNumber: inv.invoiceNumber,
        clientName: inv.clientName,
        amount: inv.amount,
        date: inv.dueDate,
      })),
    [invoices]
  );

  const totalReceived = payments.reduce((s, p) => s + p.amount, 0);

  const { formatCurrency } = useCurrency();

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Payments</h1>
          <p className="mt-1 text-muted-foreground">Track all incoming and outgoing payments.</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <ArrowDownRight className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Received</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(totalReceived)}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                <ArrowUpRight className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(metrics.pendingAmount)}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <span className="text-lg font-bold text-primary">{payments.length}</span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Transactions</p>
                <p className="text-2xl font-bold text-foreground">Total</p>
              </div>
            </div>
          </div>
        </div>

        {payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <CreditCard className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-semibold text-foreground">No payments yet</p>
            <p className="text-sm text-muted-foreground mt-1">Payments will appear here when invoices are marked as paid.</p>
          </div>
        ) : (
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden animate-fade-in">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="font-semibold">Payment ID</TableHead>
                  <TableHead className="font-semibold">Invoice</TableHead>
                  <TableHead className="font-semibold">Client</TableHead>
                  <TableHead className="font-semibold">Amount</TableHead>
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium text-primary">{payment.id}</TableCell>
                    <TableCell className="text-muted-foreground">{payment.invoiceNumber}</TableCell>
                    <TableCell className="font-medium">{payment.clientName}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(payment.amount)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(payment.date)}</TableCell>
                    <TableCell><InvoiceStatusBadge status="paid" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
