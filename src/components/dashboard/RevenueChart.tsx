import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useInvoiceContext } from '@/context/InvoiceContext';
import { useCurrency } from '@/context/CurrencyContext';

export function RevenueChart() {
  const { monthlyRevenue } = useInvoiceContext();
  const { currency } = useCurrency();

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm animate-fade-in">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-card-foreground">Revenue Overview</h3>
        <p className="text-sm text-muted-foreground">Monthly revenue breakdown</p>
      </div>
      <div className="h-[300px]">
        {monthlyRevenue.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">No data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyRevenue}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(174, 72%, 40%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(174, 72%, 40%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(210, 10%, 45%)', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(210, 10%, 45%)', fontSize: 12 }} tickFormatter={(v) => `${currency.symbol}${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(0, 0%, 100%)', border: '1px solid hsl(214, 20%, 90%)', borderRadius: '8px' }} formatter={(value: number) => [`${currency.symbol}${value.toLocaleString(currency.locale)}`, 'Revenue']} />
              <Area type="monotone" dataKey="value" stroke="hsl(174, 72%, 40%)" strokeWidth={2} fill="url(#revenueGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
