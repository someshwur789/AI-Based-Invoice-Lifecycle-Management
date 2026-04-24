import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useERPContext } from '@/context/ERPContext';
import { useInvoiceContext } from '@/context/InvoiceContext';
import { useCurrency } from '@/context/CurrencyContext';
import { PurchaseOrder, PurchaseOrderItem } from '@/types/erp';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, MoreHorizontal, Plus, Trash2, CheckCircle, Clock, XCircle, Package } from 'lucide-react';

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  sent: 'bg-warning/10 text-warning border-warning/20',
  received: 'bg-success/10 text-success border-success/20',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
};

export default function PurchaseOrders() {
  const { purchaseOrders, addPurchaseOrder, updatePOStatus, deletePurchaseOrder } = useERPContext();
  const { vendors } = useInvoiceContext();
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ vendorName: '', expectedDate: '', notes: '' });
  const [items, setItems] = useState<{ description: string; quantity: string; unitPrice: string }[]>([{ description: '', quantity: '1', unitPrice: '' }]);

  const handleAdd = () => {
    const poItems: PurchaseOrderItem[] = items.map(i => ({
      id: crypto.randomUUID(),
      description: i.description,
      quantity: parseFloat(i.quantity) || 0,
      unitPrice: parseFloat(i.unitPrice) || 0,
      total: (parseFloat(i.quantity) || 0) * (parseFloat(i.unitPrice) || 0),
    }));
    const po: PurchaseOrder = {
      id: crypto.randomUUID(),
      poNumber: `PO-${Date.now().toString(36).toUpperCase()}`,
      vendorName: form.vendorName,
      status: 'draft',
      items: poItems,
      totalAmount: poItems.reduce((s, i) => s + i.total, 0),
      orderDate: new Date().toISOString().split('T')[0],
      expectedDate: form.expectedDate || undefined,
      notes: form.notes || undefined,
    };
    addPurchaseOrder(po);
    setAddOpen(false);
    setForm({ vendorName: '', expectedDate: '', notes: '' });
    setItems([{ description: '', quantity: '1', unitPrice: '' }]);
  };

  const addItem = () => setItems([...items, { description: '', quantity: '1', unitPrice: '' }]);
  const updateItem = (idx: number, field: string, value: string) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: value };
    setItems(updated);
  };

  const { formatCurrency } = useCurrency();

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Purchase Orders</h1>
            <p className="mt-1 text-muted-foreground">Create and track purchase orders to vendors.</p>
          </div>
          <Button onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" /> New PO</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total POs</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{purchaseOrders.length}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-warning">{purchaseOrders.filter(p => p.status === 'sent').length}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Value</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{formatCurrency(purchaseOrders.reduce((s, p) => s + p.totalAmount, 0))}</p></CardContent></Card>
        </div>

        {purchaseOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-lg font-semibold">No purchase orders yet</p>
            <p className="text-sm text-muted-foreground mt-1">Create your first purchase order.</p>
          </div>
        ) : (
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>PO Number</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Order Date</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseOrders.map(po => (
                  <TableRow key={po.id}>
                    <TableCell className="font-medium text-primary">{po.poNumber}</TableCell>
                    <TableCell>{po.vendorName}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(po.totalAmount)}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusColors[po.status]}`}>
                        {po.status.charAt(0).toUpperCase() + po.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{new Date(po.orderDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {po.status !== 'sent' && <DropdownMenuItem onClick={() => updatePOStatus(po.id, 'sent')}><Clock className="mr-2 h-4 w-4" /> Mark as Sent</DropdownMenuItem>}
                          {po.status !== 'received' && <DropdownMenuItem onClick={() => updatePOStatus(po.id, 'received')}><CheckCircle className="mr-2 h-4 w-4" /> Mark as Received</DropdownMenuItem>}
                          {po.status !== 'cancelled' && <DropdownMenuItem onClick={() => updatePOStatus(po.id, 'cancelled')}><XCircle className="mr-2 h-4 w-4" /> Cancel</DropdownMenuItem>}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => deletePurchaseOrder(po.id)}><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
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
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New Purchase Order</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Vendor</Label><Input value={form.vendorName} onChange={e => setForm({ ...form, vendorName: e.target.value })} placeholder="Vendor name" /></div>
            <div><Label>Expected Delivery</Label><Input type="date" value={form.expectedDate} onChange={e => setForm({ ...form, expectedDate: e.target.value })} /></div>
            <div>
              <div className="flex items-center justify-between mb-2"><Label>Items</Label><Button variant="outline" size="sm" onClick={addItem}><Plus className="h-3 w-3 mr-1" /> Add</Button></div>
              {items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-6 gap-2 mb-2">
                  <Input className="col-span-3" placeholder="Description" value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} />
                  <Input type="number" placeholder="Qty" value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} />
                  <Input type="number" placeholder="Price" value={item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', e.target.value)} />
                  <Button variant="ghost" size="icon" onClick={() => setItems(items.filter((_, i) => i !== idx))} disabled={items.length === 1}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
            <div><Label>Notes</Label><Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={handleAdd} disabled={!form.vendorName || items.every(i => !i.description)}>Create PO</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
