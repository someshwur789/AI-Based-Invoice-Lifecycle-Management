import { createContext, useContext, useState, useCallback, useMemo, useEffect, ReactNode } from 'react';
import { Product, StockMovement, PurchaseOrder, Expense, Employee } from '@/types/erp';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ERPContextType {
  products: Product[];
  addProduct: (p: Product) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  stockMovements: StockMovement[];
  addStockMovement: (m: StockMovement) => void;
  deductStock: (productId: string, quantity: number, reason: string) => void;
  purchaseOrders: PurchaseOrder[];
  addPurchaseOrder: (po: PurchaseOrder) => void;
  updatePOStatus: (id: string, status: PurchaseOrder['status']) => void;
  deletePurchaseOrder: (id: string) => void;
  expenses: Expense[];
  addExpense: (e: Expense) => void;
  updateExpenseStatus: (id: string, status: Expense['status']) => void;
  deleteExpense: (id: string) => void;
  employees: Employee[];
  addEmployee: (e: Employee) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  lowStockProducts: Product[];
  totalInventoryValue: number;
  totalExpenses: number;
  pendingPOs: number;
  loading: boolean;
}

const ERPContext = createContext<ERPContextType | null>(null);

export function useERPContext() {
  const ctx = useContext(ERPContext);
  if (!ctx) throw new Error('useERPContext must be used within ERPProvider');
  return ctx;
}

export function ERPProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all data on mount
  useEffect(() => {
    setLoading(true);
    Promise.all([
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('stock_movements').select('*').order('created_at', { ascending: false }),
      supabase.from('purchase_orders').select('*').order('created_at', { ascending: false }),
      supabase.from('expenses').select('*').order('created_at', { ascending: false }),
      supabase.from('employees').select('*').order('created_at', { ascending: false }),
    ]).then(([prodRes, smRes, poRes, expRes, empRes]) => {
      if (prodRes.data) setProducts(prodRes.data.map(mapProduct));
      if (smRes.data) setStockMovements(smRes.data.map(mapStockMovement));
      if (poRes.data) setPurchaseOrders(poRes.data.map(r => mapPurchaseOrder(r)));
      if (expRes.data) setExpenses(expRes.data.map(mapExpense));
      if (empRes.data) setEmployees(empRes.data.map(mapEmployee));
      setLoading(false);
    });
  }, []);

  // Fetch PO items after POs load
  useEffect(() => {
    if (purchaseOrders.length === 0) return;
    const ids = purchaseOrders.map(po => po.id);
    supabase.from('purchase_order_items').select('*').in('purchase_order_id', ids).then(({ data }) => {
      if (!data) return;
      setPurchaseOrders(prev => prev.map(po => ({
        ...po,
        items: data.filter((i: any) => i.purchase_order_id === po.id).map((i: any) => ({
          id: i.id,
          productId: i.product_id,
          description: i.description,
          quantity: Number(i.quantity),
          unitPrice: Number(i.unit_price),
          total: Number(i.total),
        })),
      })));
    });
  }, [purchaseOrders.length]);

  // ---- Products ----
  const addProduct = useCallback(async (p: Product) => {
    const { data, error } = await supabase.from('products').insert({
      name: p.name,
      sku: p.sku,
      category: p.category,
      description: p.description || null,
      unit_price: p.unitPrice,
      cost_price: p.costPrice,
      current_stock: p.currentStock,
      reorder_point: p.reorderPoint,
      unit: p.unit,
      image_url: p.imageUrl || null,
    }).select().single();
    if (error) { toast.error('Failed to add product'); return; }
    setProducts(prev => [mapProduct(data), ...prev]);
    toast.success('Product added');
  }, []);

  const updateProduct = useCallback(async (id: string, updates: Partial<Product>) => {
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.sku !== undefined) dbUpdates.sku = updates.sku;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.unitPrice !== undefined) dbUpdates.unit_price = updates.unitPrice;
    if (updates.costPrice !== undefined) dbUpdates.cost_price = updates.costPrice;
    if (updates.currentStock !== undefined) dbUpdates.current_stock = updates.currentStock;
    if (updates.reorderPoint !== undefined) dbUpdates.reorder_point = updates.reorderPoint;
    if (updates.unit !== undefined) dbUpdates.unit = updates.unit;
    const { error } = await supabase.from('products').update(dbUpdates).eq('id', id);
    if (error) { toast.error('Failed to update product'); return; }
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    toast.success('Product updated');
  }, []);

  const deleteProduct = useCallback(async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) { toast.error('Failed to delete product'); return; }
    setProducts(prev => prev.filter(p => p.id !== id));
    toast.success('Product deleted');
  }, []);

  // ---- Stock Movements ----
  const addStockMovement = useCallback(async (m: StockMovement) => {
    const { data, error } = await supabase.from('stock_movements').insert({
      product_id: m.productId,
      product_name: m.productName,
      type: m.type,
      quantity: m.quantity,
      reason: m.reason,
      reference: m.reference || null,
    }).select().single();
    if (error) { toast.error('Failed to record stock movement'); return; }
    setStockMovements(prev => [mapStockMovement(data), ...prev]);
    // Update local product stock
    setProducts(prev => prev.map(p => {
      if (p.id !== m.productId) return p;
      const delta = m.type === 'in' ? m.quantity : m.type === 'out' ? -m.quantity : m.quantity;
      const newStock = Math.max(0, p.currentStock + delta);
      supabase.from('products').update({ current_stock: newStock }).eq('id', p.id);
      return { ...p, currentStock: newStock };
    }));
    toast.success('Stock movement recorded');
  }, []);

  const deductStock = useCallback((productId: string, quantity: number, reason: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const movement: StockMovement = {
      id: crypto.randomUUID(),
      productId,
      productName: product.name,
      type: 'out',
      quantity,
      reason,
      createdAt: new Date().toISOString(),
    };
    addStockMovement(movement);
  }, [products, addStockMovement]);

  // ---- Purchase Orders ----
  const addPurchaseOrder = useCallback(async (po: PurchaseOrder) => {
    const { data, error } = await supabase.from('purchase_orders').insert({
      po_number: po.poNumber,
      vendor_name: po.vendorName,
      status: po.status,
      total_amount: po.totalAmount,
      order_date: po.orderDate,
      expected_date: po.expectedDate || null,
      received_date: po.receivedDate || null,
      notes: po.notes || null,
    }).select().single();
    if (error) { toast.error('Failed to create purchase order'); return; }
    if (po.items.length > 0) {
      await supabase.from('purchase_order_items').insert(
        po.items.map(i => ({
          purchase_order_id: data.id,
          product_id: i.productId || null,
          description: i.description,
          quantity: i.quantity,
          unit_price: i.unitPrice,
          total: i.total,
        }))
      );
    }
    setPurchaseOrders(prev => [{ ...mapPurchaseOrder(data), items: po.items }, ...prev]);
    toast.success('Purchase order created');
  }, []);

  const updatePOStatus = useCallback(async (id: string, status: PurchaseOrder['status']) => {
    const updates: any = { status };
    if (status === 'received') updates.received_date = new Date().toISOString().split('T')[0];
    const { error } = await supabase.from('purchase_orders').update(updates).eq('id', id);
    if (error) { toast.error('Failed to update PO'); return; }
    setPurchaseOrders(prev => prev.map(po => po.id === id ? { ...po, status, ...(status === 'received' ? { receivedDate: updates.received_date } : {}) } : po));
    toast.success(`PO marked as ${status}`);
  }, []);

  const deletePurchaseOrder = useCallback(async (id: string) => {
    const { error } = await supabase.from('purchase_orders').delete().eq('id', id);
    if (error) { toast.error('Failed to delete PO'); return; }
    setPurchaseOrders(prev => prev.filter(po => po.id !== id));
    toast.success('Purchase order deleted');
  }, []);

  // ---- Expenses ----
  const addExpense = useCallback(async (e: Expense) => {
    const { data, error } = await supabase.from('expenses').insert({
      description: e.description,
      category: e.category,
      amount: e.amount,
      date: e.date,
      vendor: e.vendor || null,
      receipt_url: e.receiptUrl || null,
      notes: e.notes || null,
      status: e.status,
    }).select().single();
    if (error) { toast.error('Failed to add expense'); return; }
    setExpenses(prev => [mapExpense(data), ...prev]);
    toast.success('Expense added');
  }, []);

  const updateExpenseStatus = useCallback(async (id: string, status: Expense['status']) => {
    const { error } = await supabase.from('expenses').update({ status }).eq('id', id);
    if (error) { toast.error('Failed to update expense'); return; }
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, status } : e));
    toast.success(`Expense ${status}`);
  }, []);

  const deleteExpense = useCallback(async (id: string) => {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) { toast.error('Failed to delete expense'); return; }
    setExpenses(prev => prev.filter(e => e.id !== id));
    toast.success('Expense deleted');
  }, []);

  // ---- Employees ----
  const addEmployee = useCallback(async (e: Employee) => {
    const { data, error } = await supabase.from('employees').insert({
      name: e.name,
      email: e.email,
      phone: e.phone || null,
      role: e.role,
      department: e.department,
      join_date: e.joinDate,
      salary: e.salary || null,
      status: e.status,
    }).select().single();
    if (error) { toast.error('Failed to add employee'); return; }
    setEmployees(prev => [mapEmployee(data), ...prev]);
    toast.success('Employee added');
  }, []);

  const updateEmployee = useCallback(async (id: string, updates: Partial<Employee>) => {
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.role !== undefined) dbUpdates.role = updates.role;
    if (updates.department !== undefined) dbUpdates.department = updates.department;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.salary !== undefined) dbUpdates.salary = updates.salary;
    const { error } = await supabase.from('employees').update(dbUpdates).eq('id', id);
    if (error) { toast.error('Failed to update employee'); return; }
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    toast.success('Employee updated');
  }, []);

  const deleteEmployee = useCallback(async (id: string) => {
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (error) { toast.error('Failed to delete employee'); return; }
    setEmployees(prev => prev.filter(e => e.id !== id));
    toast.success('Employee removed');
  }, []);

  // Derived
  const lowStockProducts = useMemo(() => products.filter(p => p.currentStock <= p.reorderPoint), [products]);
  const totalInventoryValue = useMemo(() => products.reduce((sum, p) => sum + p.currentStock * p.costPrice, 0), [products]);
  const totalExpenses = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses]);
  const pendingPOs = useMemo(() => purchaseOrders.filter(po => po.status === 'sent').length, [purchaseOrders]);

  return (
    <ERPContext.Provider value={{
      products, addProduct, updateProduct, deleteProduct,
      stockMovements, addStockMovement, deductStock,
      purchaseOrders, addPurchaseOrder, updatePOStatus, deletePurchaseOrder,
      expenses, addExpense, updateExpenseStatus, deleteExpense,
      employees, addEmployee, updateEmployee, deleteEmployee,
      lowStockProducts, totalInventoryValue, totalExpenses, pendingPOs,
      loading,
    }}>
      {children}
    </ERPContext.Provider>
  );
}

// ---- Mappers ----
function mapProduct(r: any): Product {
  return { id: r.id, name: r.name, sku: r.sku, category: r.category, description: r.description || undefined, unitPrice: Number(r.unit_price), costPrice: Number(r.cost_price), currentStock: r.current_stock, reorderPoint: r.reorder_point, unit: r.unit, imageUrl: r.image_url || undefined, createdAt: r.created_at };
}
function mapStockMovement(r: any): StockMovement {
  return { id: r.id, productId: r.product_id, productName: r.product_name, type: r.type, quantity: r.quantity, reason: r.reason, reference: r.reference || undefined, createdAt: r.created_at };
}
function mapPurchaseOrder(r: any): PurchaseOrder {
  return { id: r.id, poNumber: r.po_number, vendorName: r.vendor_name, status: r.status, items: [], totalAmount: Number(r.total_amount), orderDate: r.order_date, expectedDate: r.expected_date || undefined, receivedDate: r.received_date || undefined, notes: r.notes || undefined };
}
function mapExpense(r: any): Expense {
  return { id: r.id, description: r.description, category: r.category, amount: Number(r.amount), date: r.date, vendor: r.vendor || undefined, receiptUrl: r.receipt_url || undefined, notes: r.notes || undefined, status: r.status };
}
function mapEmployee(r: any): Employee {
  return { id: r.id, name: r.name, email: r.email, phone: r.phone || undefined, role: r.role, department: r.department, joinDate: r.join_date, salary: r.salary ? Number(r.salary) : undefined, status: r.status };
}
