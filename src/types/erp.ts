export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  description?: string;
  unitPrice: number;
  costPrice: number;
  currentStock: number;
  reorderPoint: number;
  unit: string;
  imageUrl?: string;
  createdAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string;
  reference?: string;
  createdAt: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendorName: string;
  status: 'draft' | 'sent' | 'received' | 'cancelled';
  items: PurchaseOrderItem[];
  totalAmount: number;
  orderDate: string;
  expectedDate?: string;
  receivedDate?: string;
  notes?: string;
}

export interface PurchaseOrderItem {
  id: string;
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Expense {
  id: string;
  description: string;
  category: string;
  amount: number;
  date: string;
  vendor?: string;
  receiptUrl?: string;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  department: string;
  joinDate: string;
  salary?: number;
  status: 'active' | 'inactive';
}
