import { MainLayout } from '@/components/layout/MainLayout';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { StatusChart } from '@/components/dashboard/StatusChart';
import { RecentInvoices } from '@/components/dashboard/RecentInvoices';
import { useInvoiceContext } from '@/context/InvoiceContext';
import { DollarSign, FileText, Clock, AlertTriangle } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';

export default function Dashboard() {
  const { metrics } = useInvoiceContext();
  const { formatCurrency } = useCurrency();

  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">Welcome back! Here's your invoice overview.</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Total Revenue" value={formatCurrency(metrics.totalRevenue)} subtitle={`${metrics.invoicesThisMonth} invoices this month`} icon={DollarSign} variant="primary" />
          <MetricCard title="Total Invoices" value={metrics.totalInvoices.toString()} subtitle="All time" icon={FileText} variant="default" />
          <MetricCard title="Pending" value={formatCurrency(metrics.pendingAmount)} subtitle="Awaiting payment" icon={Clock} variant="warning" />
          <MetricCard title="Overdue" value={formatCurrency(metrics.overdueAmount)} subtitle="Requires attention" icon={AlertTriangle} variant="destructive" />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <RevenueChart />
          <StatusChart />
        </div>

        <RecentInvoices />
      </div>
    </MainLayout>
  );
}
