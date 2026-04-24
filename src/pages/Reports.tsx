import { useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useInvoiceContext } from '@/context/InvoiceContext';
import { useERPContext } from '@/context/ERPContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Download, TrendingUp, TrendingDown, Package } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useCurrency } from '@/context/CurrencyContext';

export default function Reports() {
  const { invoices, metrics, monthlyRevenue, statusDistribution } = useInvoiceContext();
  const { products, expenses, totalExpenses, totalInventoryValue, stockMovements } = useERPContext();
  const { formatCurrency, currency } = useCurrency();

  const netProfit = metrics.totalRevenue - totalExpenses;

  const revenueByClient = useMemo(() => {
    const map = new Map<string, number>();
    invoices.filter(i => i.status === 'paid').forEach(i => map.set(i.clientName, (map.get(i.clientName) || 0) + i.amount));
    return Array.from(map.entries()).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount);
  }, [invoices]);

  const expensesByCategory = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach(e => map.set(e.category, (map.get(e.category) || 0) + e.amount));
    return Array.from(map.entries()).map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount);
  }, [expenses]);

  const monthlyExpenses = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach(e => {
      const d = new Date(e.date);
      const key = d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
      map.set(key, (map.get(key) || 0) + e.amount);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).slice(-6);
  }, [expenses]);

  const profitTrend = useMemo(() => {
    const revMap = new Map<string, number>();
    const expMap = new Map<string, number>();
    invoices.filter(i => i.status === 'paid').forEach(i => {
      const d = new Date(i.issueDate);
      const key = d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
      revMap.set(key, (revMap.get(key) || 0) + i.amount);
    });
    expenses.forEach(e => {
      const d = new Date(e.date);
      const key = d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
      expMap.set(key, (expMap.get(key) || 0) + e.amount);
    });
    const allKeys = new Set([...revMap.keys(), ...expMap.keys()]);
    return Array.from(allKeys).map(name => ({
      name,
      revenue: revMap.get(name) || 0,
      expenses: expMap.get(name) || 0,
      profit: (revMap.get(name) || 0) - (expMap.get(name) || 0),
    })).slice(-6);
  }, [invoices, expenses]);

  // Products & Stock data
  const stockByProduct = useMemo(() => {
    return products.map(p => ({
      name: p.name.length > 15 ? p.name.slice(0, 15) + '…' : p.name,
      fullName: p.name,
      sku: p.sku,
      stock: p.currentStock,
      reorderPoint: p.reorderPoint,
      value: p.currentStock * p.unitPrice,
      costValue: p.currentStock * p.costPrice,
    }));
  }, [products]);

  const stockMovementsByDate = useMemo(() => {
    const map = new Map<string, { in: number; out: number; adjustment: number }>();
    stockMovements.forEach(m => {
      const d = new Date(m.createdAt);
      const key = d.toLocaleString('en-US', { month: 'short', day: 'numeric' });
      const existing = map.get(key) || { in: 0, out: 0, adjustment: 0 };
      existing[m.type] += m.quantity;
      map.set(key, existing);
    });
    return Array.from(map.entries()).map(([name, data]) => ({ name, ...data })).slice(-15);
  }, [stockMovements]);

  const stockByCategory = useMemo(() => {
    const map = new Map<string, { count: number; value: number }>();
    products.forEach(p => {
      const existing = map.get(p.category) || { count: 0, value: 0 };
      existing.count += p.currentStock;
      existing.value += p.currentStock * p.unitPrice;
      map.set(p.category, existing);
    });
    return Array.from(map.entries()).map(([category, data]) => ({ category, ...data }));
  }, [products]);

  const lowStockProducts = useMemo(() => {
    return products.filter(p => p.currentStock <= p.reorderPoint).sort((a, b) => a.currentStock - b.currentStock);
  }, [products]);

  const COLORS = ['hsl(152, 69%, 40%)', 'hsl(38, 92%, 50%)', 'hsl(0, 72%, 51%)', 'hsl(210, 10%, 45%)'];
  const EXPENSE_COLORS = ['hsl(221, 83%, 53%)', 'hsl(262, 83%, 58%)', 'hsl(338, 71%, 51%)', 'hsl(25, 95%, 53%)', 'hsl(142, 71%, 45%)', 'hsl(48, 96%, 53%)'];
  const STOCK_COLORS = ['hsl(174, 72%, 40%)', 'hsl(221, 83%, 53%)', 'hsl(262, 83%, 58%)', 'hsl(338, 71%, 51%)', 'hsl(25, 95%, 53%)', 'hsl(142, 71%, 45%)'];

  const revenueChartConfig = { amount: { label: 'Revenue', color: 'hsl(152, 69%, 40%)' } };
  const expenseChartConfig = { amount: { label: 'Expenses', color: 'hsl(0, 72%, 51%)' } };
  const profitChartConfig = { revenue: { label: 'Revenue', color: 'hsl(152, 69%, 40%)' }, expenses: { label: 'Expenses', color: 'hsl(0, 72%, 51%)' }, profit: { label: 'Profit', color: 'hsl(221, 83%, 53%)' } };
  const stockMovementConfig = { in: { label: 'Stock In', color: 'hsl(152, 69%, 40%)' }, out: { label: 'Stock Out', color: 'hsl(0, 72%, 51%)' }, adjustment: { label: 'Adjustment', color: 'hsl(38, 92%, 50%)' } };
  const stockLevelConfig = { stock: { label: 'Current Stock', color: 'hsl(174, 72%, 40%)' }, reorderPoint: { label: 'Reorder Point', color: 'hsl(0, 72%, 51%)' } };

  const exportCSV = (data: Record<string, any>[], filename: string) => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csv = [headers.join(','), ...data.map(row => headers.map(h => `"${row[h] ?? ''}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${filename}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Reports</h1>
          <p className="mt-1 text-muted-foreground">Financial summaries, charts, and exportable reports.</p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><TrendingUp className="h-4 w-4" />Revenue</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold text-success">{formatCurrency(metrics.totalRevenue)}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><TrendingDown className="h-4 w-4" />Expenses</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold text-destructive">{formatCurrency(totalExpenses)}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Net Profit</CardTitle></CardHeader>
            <CardContent><p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-success' : 'text-destructive'}`}>{formatCurrency(netProfit)}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Inventory Value</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{formatCurrency(totalInventoryValue)}</p></CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Revenue Trend */}
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium">Revenue Trend</CardTitle></CardHeader>
            <CardContent>
              {monthlyRevenue.length === 0 ? (
                <p className="text-center py-12 text-muted-foreground text-sm">No revenue data yet</p>
              ) : (
                <ChartContainer config={revenueChartConfig} className="h-[250px] w-full">
                  <AreaChart data={monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <defs>
                      <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(152, 69%, 40%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(152, 69%, 40%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="value" stroke="hsl(152, 69%, 40%)" fill="url(#revGradient)" strokeWidth={2} name="amount" />
                  </AreaChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* Invoice Status Distribution */}
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium">Invoice Status</CardTitle></CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <p className="text-center py-12 text-muted-foreground text-sm">No invoices yet</p>
              ) : (
                <ChartContainer config={{}} className="h-[250px] w-full">
                  <PieChart>
                    <Pie data={statusDistribution.filter(s => s.value > 0)} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={4} dataKey="value" nameKey="name" label={({ name, value }) => `${name}: ${value}`}>
                      {statusDistribution.filter(s => s.value > 0).map((entry, i) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* Profit/Loss Trend */}
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium">Profit & Loss Trend</CardTitle></CardHeader>
            <CardContent>
              {profitTrend.length === 0 ? (
                <p className="text-center py-12 text-muted-foreground text-sm">No data yet</p>
              ) : (
                <ChartContainer config={profitChartConfig} className="h-[250px] w-full">
                  <BarChart data={profitTrend}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="revenue" fill="hsl(152, 69%, 40%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* Expense Breakdown */}
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium">Expense Breakdown</CardTitle></CardHeader>
            <CardContent>
              {expensesByCategory.length === 0 ? (
                <p className="text-center py-12 text-muted-foreground text-sm">No expenses yet</p>
              ) : (
                <ChartContainer config={expenseChartConfig} className="h-[250px] w-full">
                  <PieChart>
                    <Pie data={expensesByCategory} cx="50%" cy="50%" outerRadius={90} paddingAngle={3} dataKey="amount" nameKey="category" label={({ category, amount }) => `${category}: ${currency.symbol}${amount.toFixed(0)}`}>
                      {expensesByCategory.map((_, i) => (
                        <Cell key={i} fill={EXPENSE_COLORS[i % EXPENSE_COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Products & Stock Charts */}
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2 mt-4"><Package className="h-5 w-5" /> Products & Stock Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{products.length}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Low Stock Alerts</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold text-destructive">{lowStockProducts.length}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Stock Movements</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{stockMovements.length}</p></CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Stock Levels by Product */}
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium">Stock Levels vs Reorder Points</CardTitle></CardHeader>
            <CardContent>
              {stockByProduct.length === 0 ? (
                <p className="text-center py-12 text-muted-foreground text-sm">No products yet</p>
              ) : (
                <ChartContainer config={stockLevelConfig} className="h-[280px] w-full">
                  <BarChart data={stockByProduct} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis type="number" className="text-xs" />
                    <YAxis dataKey="name" type="category" className="text-xs" width={100} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="stock" fill="hsl(174, 72%, 40%)" radius={[0, 4, 4, 0]} name="stock" />
                    <Bar dataKey="reorderPoint" fill="hsl(0, 72%, 51%)" radius={[0, 4, 4, 0]} name="reorderPoint" opacity={0.5} />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* Stock Movement History */}
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium">Stock Movement History</CardTitle></CardHeader>
            <CardContent>
              {stockMovementsByDate.length === 0 ? (
                <p className="text-center py-12 text-muted-foreground text-sm">No stock movements yet</p>
              ) : (
                <ChartContainer config={stockMovementConfig} className="h-[280px] w-full">
                  <BarChart data={stockMovementsByDate}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="in" fill="hsl(152, 69%, 40%)" stackId="a" radius={[0, 0, 0, 0]} name="in" />
                    <Bar dataKey="out" fill="hsl(0, 72%, 51%)" stackId="b" radius={[0, 0, 0, 0]} name="out" />
                    <Bar dataKey="adjustment" fill="hsl(38, 92%, 50%)" stackId="c" radius={[4, 4, 0, 0]} name="adjustment" />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* Stock Value by Category */}
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium">Stock Value by Category</CardTitle></CardHeader>
            <CardContent>
              {stockByCategory.length === 0 ? (
                <p className="text-center py-12 text-muted-foreground text-sm">No products yet</p>
              ) : (
                <ChartContainer config={{}} className="h-[250px] w-full">
                  <PieChart>
                    <Pie data={stockByCategory} cx="50%" cy="50%" outerRadius={90} paddingAngle={3} dataKey="value" nameKey="category" label={({ category, value }) => `${category}: ${currency.symbol}${value.toFixed(0)}`}>
                      {stockByCategory.map((_, i) => (
                        <Cell key={i} fill={STOCK_COLORS[i % STOCK_COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* Low Stock Alert Table */}
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium text-destructive">Low Stock Alerts</CardTitle></CardHeader>
            <CardContent>
              {lowStockProducts.length === 0 ? (
                <p className="text-center py-12 text-muted-foreground text-sm">All products are well stocked</p>
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader><TableRow className="bg-muted/50"><TableHead>Product</TableHead><TableHead className="text-right">Stock</TableHead><TableHead className="text-right">Reorder</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {lowStockProducts.map(p => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell className="text-right text-destructive font-semibold">{p.currentStock}</TableCell>
                          <TableCell className="text-right text-muted-foreground">{p.reorderPoint}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Data Tables */}
        <Tabs defaultValue="revenue">
          <TabsList className="flex-wrap">
            <TabsTrigger value="revenue">Revenue by Client</TabsTrigger>
            <TabsTrigger value="expenses">Expenses by Category</TabsTrigger>
            <TabsTrigger value="invoices">All Invoices</TabsTrigger>
            <TabsTrigger value="products">Products Catalog</TabsTrigger>
            <TabsTrigger value="movements">Stock Movements</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue" className="mt-4 space-y-3">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => exportCSV(revenueByClient, 'revenue-by-client')}>
                <Download className="mr-2 h-4 w-4" /> Export CSV
              </Button>
            </div>
            {revenueByClient.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No revenue data yet.</p>
            ) : (
              <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <Table>
                  <TableHeader><TableRow className="bg-muted/50"><TableHead>Client</TableHead><TableHead className="text-right">Revenue</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {revenueByClient.map(r => (
                      <TableRow key={r.name}><TableCell className="font-medium">{r.name}</TableCell><TableCell className="text-right font-semibold">{formatCurrency(r.amount)}</TableCell></TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="expenses" className="mt-4 space-y-3">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => exportCSV(expensesByCategory, 'expenses-by-category')}>
                <Download className="mr-2 h-4 w-4" /> Export CSV
              </Button>
            </div>
            {expensesByCategory.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No expense data yet.</p>
            ) : (
              <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <Table>
                  <TableHeader><TableRow className="bg-muted/50"><TableHead>Category</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {expensesByCategory.map(e => (
                      <TableRow key={e.category}><TableCell className="font-medium">{e.category}</TableCell><TableCell className="text-right font-semibold">{formatCurrency(e.amount)}</TableCell></TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="invoices" className="mt-4 space-y-3">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => exportCSV(invoices.map(i => ({ number: i.invoiceNumber, client: i.clientName, amount: i.amount, status: i.status, issued: i.issueDate, due: i.dueDate })), 'all-invoices')}>
                <Download className="mr-2 h-4 w-4" /> Export CSV
              </Button>
            </div>
            {invoices.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No invoices yet.</p>
            ) : (
              <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <Table>
                  <TableHeader><TableRow className="bg-muted/50"><TableHead>Invoice</TableHead><TableHead>Client</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {invoices.map(i => (
                      <TableRow key={i.id}>
                        <TableCell className="font-medium text-primary">{i.invoiceNumber}</TableCell>
                        <TableCell>{i.clientName}</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(i.amount)}</TableCell>
                        <TableCell className="capitalize">{i.status}</TableCell>
                        <TableCell className="text-muted-foreground">{new Date(i.issueDate).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="products" className="mt-4 space-y-3">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => exportCSV(products.map(p => ({ name: p.name, sku: p.sku, category: p.category, stock: p.currentStock, reorderPoint: p.reorderPoint, unitPrice: p.unitPrice, costPrice: p.costPrice, value: p.currentStock * p.unitPrice })), 'products-catalog')}>
                <Download className="mr-2 h-4 w-4" /> Export CSV
              </Button>
            </div>
            {products.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No products yet.</p>
            ) : (
              <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Product</TableHead><TableHead>SKU</TableHead><TableHead>Category</TableHead><TableHead className="text-right">Stock</TableHead><TableHead className="text-right">Unit Price</TableHead><TableHead className="text-right">Stock Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell className="text-muted-foreground">{p.sku}</TableCell>
                        <TableCell>{p.category}</TableCell>
                        <TableCell className={`text-right font-semibold ${p.currentStock <= p.reorderPoint ? 'text-destructive' : ''}`}>{p.currentStock}</TableCell>
                        <TableCell className="text-right">{formatCurrency(p.unitPrice)}</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(p.currentStock * p.unitPrice)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="movements" className="mt-4 space-y-3">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => exportCSV(stockMovements.map(m => ({ product: m.productName, type: m.type, quantity: m.quantity, reason: m.reason, reference: m.reference || '', date: m.createdAt })), 'stock-movements')}>
                <Download className="mr-2 h-4 w-4" /> Export CSV
              </Button>
            </div>
            {stockMovements.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No stock movements yet.</p>
            ) : (
              <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Product</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Qty</TableHead><TableHead>Reason</TableHead><TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockMovements.slice().reverse().map(m => (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">{m.productName}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                            m.type === 'in' ? 'bg-success/10 text-success border-success/20' :
                            m.type === 'out' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                            'bg-muted text-muted-foreground'
                          }`}>{m.type === 'in' ? 'Stock In' : m.type === 'out' ? 'Stock Out' : 'Adjustment'}</span>
                        </TableCell>
                        <TableCell className="text-right font-semibold">{m.quantity}</TableCell>
                        <TableCell className="text-muted-foreground">{m.reason}</TableCell>
                        <TableCell className="text-muted-foreground">{new Date(m.createdAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
