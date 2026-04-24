import { MainLayout } from '@/components/layout/MainLayout';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { StatusChart } from '@/components/dashboard/StatusChart';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { useInvoiceContext } from '@/context/InvoiceContext';
import { useCurrency } from '@/context/CurrencyContext';
import { TrendingUp, TrendingDown, Target, Percent } from 'lucide-react';

export default function Analytics() {
  const { invoices } = useInvoiceContext();

  const avgInvoiceValue = invoices.length > 0 ? invoices.reduce((s, i) => s + i.amount, 0) / invoices.length : 0;
  const paidRate = invoices.length > 0 ? (invoices.filter((i) => i.status === 'paid').length / invoices.length) * 100 : 0;
  const overdueRate = invoices.length > 0 ? (invoices.filter((i) => i.status === 'overdue').length / invoices.length) * 100 : 0;

  const { formatCurrency } = useCurrency();

  const topClients = Array.from(
    invoices.reduce((map, inv) => {
      const existing = map.get(inv.clientName) || 0;
      map.set(inv.clientName, existing + inv.amount);
      return map;
    }, new Map<string, number>())
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Analytics</h1>
          <p className="mt-1 text-muted-foreground">Insights and trends from your invoice data.</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Avg. Invoice Value" value={formatCurrency(avgInvoiceValue)} icon={Target} variant="primary" />
          <MetricCard title="Payment Rate" value={`${paidRate.toFixed(0)}%`} subtitle="Invoices paid" icon={TrendingUp} variant="success" />
          <MetricCard title="Overdue Rate" value={`${overdueRate.toFixed(0)}%`} subtitle="Past due date" icon={TrendingDown} variant="destructive" />
          <MetricCard title="Total Invoices" value={invoices.length.toString()} subtitle="All time" icon={Percent} variant="default" />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <RevenueChart />
          <StatusChart />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-card-foreground">Top Clients</h3>
            <p className="text-sm text-muted-foreground mb-4">By total invoice value</p>
            {topClients.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No data yet. Upload invoices to see analytics.</p>
            ) : (
              <div className="space-y-3">
                {topClients.map(([name, amount], index) => (
                  <div key={name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{index + 1}</span>
                      <span className="text-sm font-medium text-foreground">{name}</span>
                    </div>
                    <span className="text-sm font-semibold text-foreground">{formatCurrency(amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
