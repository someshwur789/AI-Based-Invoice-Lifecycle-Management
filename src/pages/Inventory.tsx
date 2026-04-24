import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useERPContext } from '@/context/ERPContext';
import { useCurrency } from '@/context/CurrencyContext';
import { Product, StockMovement } from '@/types/erp';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, AlertTriangle, TrendingUp, MoreHorizontal, Plus, Trash2, ArrowUpDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function Inventory() {
  const {
    products, addProduct, deleteProduct,
    stockMovements, addStockMovement,
    lowStockProducts, totalInventoryValue,
  } = useERPContext();

  const [addOpen, setAddOpen] = useState(false);
  const [stockOpen, setStockOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: '', sku: '', category: '', unitPrice: '', costPrice: '', currentStock: '', reorderPoint: '10', unit: 'pcs', description: '' });
  const [stockForm, setStockForm] = useState({ productId: '', type: 'in' as 'in' | 'out' | 'adjustment', quantity: '', reason: '' });

  const handleAddProduct = () => {
    const product: Product = {
      id: crypto.randomUUID(),
      name: form.name,
      sku: form.sku,
      category: form.category,
      description: form.description,
      unitPrice: parseFloat(form.unitPrice) || 0,
      costPrice: parseFloat(form.costPrice) || 0,
      currentStock: parseInt(form.currentStock) || 0,
      reorderPoint: parseInt(form.reorderPoint) || 10,
      unit: form.unit,
      createdAt: new Date().toISOString(),
    };
    addProduct(product);
    setAddOpen(false);
    setForm({ name: '', sku: '', category: '', unitPrice: '', costPrice: '', currentStock: '', reorderPoint: '10', unit: 'pcs', description: '' });
  };

  const handleStockMovement = () => {
    const product = products.find(p => p.id === stockForm.productId);
    if (!product) return;
    const movement: StockMovement = {
      id: crypto.randomUUID(),
      productId: stockForm.productId,
      productName: product.name,
      type: stockForm.type,
      quantity: parseInt(stockForm.quantity) || 0,
      reason: stockForm.reason,
      createdAt: new Date().toISOString(),
    };
    addStockMovement(movement);
    setStockOpen(false);
    setStockForm({ productId: '', type: 'in', quantity: '', reason: '' });
  };

  const { formatCurrency } = useCurrency();

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Inventory</h1>
            <p className="mt-1 text-muted-foreground">Manage products and stock levels.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStockOpen(true)}>
              <ArrowUpDown className="mr-2 h-4 w-4" /> Stock Movement
            </Button>
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Product
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><p className="text-2xl font-bold">{products.length}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Inventory Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><p className="text-2xl font-bold">{formatCurrency(totalInventoryValue)}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent><p className="text-2xl font-bold text-warning">{lowStockProducts.length}</p></CardContent>
          </Card>
        </div>

        <Tabs defaultValue="products">
          <TabsList>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="movements">Stock Movements</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="mt-4">
            {products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Package className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-lg font-semibold">No products yet</p>
                <p className="text-sm text-muted-foreground mt-1">Add your first product to get started.</p>
              </div>
            ) : (
              <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>SKU</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Stock</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono text-sm">{p.sku}</TableCell>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell>{p.category}</TableCell>
                        <TableCell className="text-right">{formatCurrency(p.costPrice)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(p.unitPrice)}</TableCell>
                        <TableCell className="text-right font-semibold">{p.currentStock} {p.unit}</TableCell>
                        <TableCell>
                          {p.currentStock <= p.reorderPoint ? (
                            <Badge variant="destructive" className="text-xs">Low Stock</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs bg-success/10 text-success border-success/20">In Stock</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setSelectedProduct(p); setStockForm({ ...stockForm, productId: p.id }); setStockOpen(true); }}>
                                <ArrowUpDown className="mr-2 h-4 w-4" /> Adjust Stock
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => deleteProduct(p.id)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="movements" className="mt-4">
            {stockMovements.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <ArrowUpDown className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-lg font-semibold">No stock movements</p>
                <p className="text-sm text-muted-foreground mt-1">Record stock in/out to track history.</p>
              </div>
            ) : (
              <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Date</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockMovements.map(m => (
                      <TableRow key={m.id}>
                        <TableCell className="text-muted-foreground">{new Date(m.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">{m.productName}</TableCell>
                        <TableCell>
                          <Badge variant={m.type === 'in' ? 'default' : m.type === 'out' ? 'destructive' : 'secondary'} className="text-xs">
                            {m.type === 'in' ? 'Stock In' : m.type === 'out' ? 'Stock Out' : 'Adjustment'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">{m.type === 'out' ? '-' : '+'}{m.quantity}</TableCell>
                        <TableCell className="text-muted-foreground">{m.reason}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Product Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Product</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>SKU</Label><Input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Category</Label><Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} /></div>
              <div><Label>Unit</Label><Input value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} placeholder="pcs, kg, etc." /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Cost Price</Label><Input type="number" value={form.costPrice} onChange={e => setForm({ ...form, costPrice: e.target.value })} /></div>
              <div><Label>Selling Price</Label><Input type="number" value={form.unitPrice} onChange={e => setForm({ ...form, unitPrice: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Initial Stock</Label><Input type="number" value={form.currentStock} onChange={e => setForm({ ...form, currentStock: e.target.value })} /></div>
              <div><Label>Reorder Point</Label><Input type="number" value={form.reorderPoint} onChange={e => setForm({ ...form, reorderPoint: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter><Button onClick={handleAddProduct} disabled={!form.name || !form.sku}>Add Product</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stock Movement Dialog */}
      <Dialog open={stockOpen} onOpenChange={setStockOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Record Stock Movement</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Product</Label>
              <Select value={stockForm.productId} onValueChange={v => setStockForm({ ...stockForm, productId: v })}>
                <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                <SelectContent>
                  {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.currentStock} {p.unit})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Type</Label>
              <Select value={stockForm.type} onValueChange={v => setStockForm({ ...stockForm, type: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">Stock In</SelectItem>
                  <SelectItem value="out">Stock Out</SelectItem>
                  <SelectItem value="adjustment">Adjustment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Quantity</Label><Input type="number" value={stockForm.quantity} onChange={e => setStockForm({ ...stockForm, quantity: e.target.value })} /></div>
            <div><Label>Reason</Label><Input value={stockForm.reason} onChange={e => setStockForm({ ...stockForm, reason: e.target.value })} placeholder="e.g., Purchase, Sale, Damaged" /></div>
          </div>
          <DialogFooter><Button onClick={handleStockMovement} disabled={!stockForm.productId || !stockForm.quantity}>Record</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
