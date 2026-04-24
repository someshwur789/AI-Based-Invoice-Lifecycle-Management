export type InvoiceStatus = 'paid' | 'pending' | 'overdue' | 'draft';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  notes?: string;
  originalFileUrl?: string;
  vendorName?: string;
  vendorPhone?: string;
  vendorAddress?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface DashboardMetrics {
  totalRevenue: number;
  totalInvoices: number;
  pendingAmount: number;
  overdueAmount: number;
  paidThisMonth: number;
  invoicesThisMonth: number;
}

export interface ChartData {
  name: string;
  value: number;
}
