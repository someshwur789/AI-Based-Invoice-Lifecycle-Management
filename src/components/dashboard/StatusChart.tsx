import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useInvoiceContext } from '@/context/InvoiceContext';

export function StatusChart() {
  const { statusDistribution } = useInvoiceContext();
  const hasData = statusDistribution.some((d) => d.value > 0);

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm animate-fade-in">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-card-foreground">Invoice Status</h3>
        <p className="text-sm text-muted-foreground">Distribution by payment status</p>
      </div>
      <div className="h-[300px]">
        {!hasData ? (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">No data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={statusDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value">
                {statusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: 'hsl(0, 0%, 100%)', border: '1px solid hsl(214, 20%, 90%)', borderRadius: '8px' }} />
              <Legend verticalAlign="bottom" height={36} formatter={(value) => <span className="text-sm text-muted-foreground">{value}</span>} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
