import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useERPContext } from '@/context/ERPContext';
import { useCurrency } from '@/context/CurrencyContext';
import { Expense } from '@/types/erp';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Receipt, Plus, MoreHorizontal, Trash2, CheckCircle, XCircle, DollarSign } from 'lucide-react';

const categories = ['Office Supplies', 'Travel', 'Utilities', 'Software', 'Marketing', 'Equipment', 'Meals', 'Other'];

export default function Expenses() {
  const { expenses, addExpense, updateExpenseStatus, deleteExpense, totalExpenses } = useERPContext();
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ description: '', category: '', amount: '', date: new Date().toISOString().split('T')[0], vendor: '', notes: '' });

  const handleAdd = () => {
    const expense: Expense = {
      id: crypto.randomUUID(),
      description: form.description,
      category: form.category,
      amount: parseFloat(form.amount) || 0,
      date: form.date,
      vendor: form.vendor || undefined,
      notes: form.notes || undefined,
      status: 'pending',
    };
    addExpense(expense);
    setAddOpen(false);
    setForm({ description: '', category: '', amount: '', date: new Date().toISOString().split('T')[0], vendor: '', notes: '' });
  };

  const { formatCurrency } = useCurrency();
  const approvedTotal = expenses.filter(e => e.status === 'approved').reduce((s, e) => s + e.amount, 0);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Expenses</h1>
            <p className="mt-1 text-muted-foreground">Track and categorize business expenses.</p>
          </div>
          <Button onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Expense</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{formatCurrency(totalExpenses)}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-success">{formatCurrency(approvedTotal)}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-warning">{expenses.filter(e => e.status === 'pending').length}</p></CardContent></Card>
        </div>

        {expenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Receipt className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-lg font-semibold">No expenses yet</p>
            <p className="text-sm text-muted-foreground mt-1">Add your first expense to start tracking.</p>
          </div>
        ) : (
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map(e => (
                  <TableRow key={e.id}>
                    <TableCell className="text-muted-foreground">{new Date(e.date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{e.description}</TableCell>
                    <TableCell><Badge variant="secondary" className="text-xs">{e.category}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{e.vendor || '—'}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(e.amount)}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                        e.status === 'approved' ? 'bg-success/10 text-success border-success/20' :
                        e.status === 'rejected' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                        'bg-warning/10 text-warning border-warning/20'
                      }`}>{e.status.charAt(0).toUpperCase() + e.status.slice(1)}</span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {e.status !== 'approved' && <DropdownMenuItem onClick={() => updateExpenseStatus(e.id, 'approved')}><CheckCircle className="mr-2 h-4 w-4" /> Approve</DropdownMenuItem>}
                          {e.status !== 'rejected' && <DropdownMenuItem onClick={() => updateExpenseStatus(e.id, 'rejected')}><XCircle className="mr-2 h-4 w-4" /> Reject</DropdownMenuItem>}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => deleteExpense(e.id)}><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Expense</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Description</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Amount</Label><Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Date</Label><Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
              <div><Label>Vendor</Label><Input value={form.vendor} onChange={e => setForm({ ...form, vendor: e.target.value })} /></div>
            </div>
            <div><Label>Notes</Label><Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={handleAdd} disabled={!form.description || !form.amount}>Add Expense</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
