import { createContext, useContext, useState, useCallback, useMemo, useEffect, ReactNode } from 'react';
import { Invoice, InvoiceStatus, DashboardMetrics } from '@/types/invoice';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface InvoiceContextType {
  invoices: Invoice[];
  addInvoice: (invoice: Invoice) => void;
  updateInvoiceStatus: (id: string, status: InvoiceStatus) => void;
  deleteInvoice: (id: string) => void;
  metrics: DashboardMetrics;
  clients: ClientInfo[];
  vendors: VendorInfo[];
  monthlyRevenue: { name: string; value: number }[];
  statusDistribution: { name: string; value: number; color: string }[];
  loading: boolean;
}

export interface ClientInfo {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  totalInvoices: number;
  totalAmount: number;
}

export interface VendorInfo {
  name: string;
  phone?: string;
  address?: string;
  totalInvoices: number;
  totalAmount: number;
}

const InvoiceContext = createContext<InvoiceContextType | null>(null);

export function useInvoiceContext() {
  const ctx = useContext(InvoiceContext);
  if (!ctx) throw new Error('useInvoiceContext must be used within InvoiceProvider');
  return ctx;
}

export function InvoiceProvider({ children }: { children: ReactNode }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch invoices from DB on mount
  useEffect(() => {
    setLoading(true);
    supabase.from('invoices').select('*').order('created_at', { ascending: false })
      .then(async ({ data: invoiceRows }) => {
        if (!invoiceRows || invoiceRows.length === 0) {
          setLoading(false);
          return;
        }
        // Fetch all items for these invoices
        const ids = invoiceRows.map(r => r.id);
        const { data: itemRows } = await supabase.from('invoice_items').select('*').in('invoice_id', ids).order('sort_order');
        // Fetch client names
        const clientIds = [...new Set(invoiceRows.map(r => r.client_id).filter(Boolean))];
        let clientMap: Record<string, any> = {};
        if (clientIds.length > 0) {
          const { data: clients } = await supabase.from('clients').select('*').in('id', clientIds);
          if (clients) clients.forEach(c => { clientMap[c.id] = c; });
        }

        const mapped: Invoice[] = invoiceRows.map(r => {
          const client = r.client_id ? clientMap[r.client_id] : null;
          const items = (itemRows || []).filter(i => i.invoice_id === r.id);
          return {
            id: r.id,
            invoiceNumber: r.invoice_number,
            clientName: client?.name || 'Unknown',
            clientEmail: client?.email || '',
            amount: Number(r.total),
            currency: 'INR',
            status: r.status as InvoiceStatus,
            issueDate: r.issue_date,
            dueDate: r.due_date,
            items: items.map(i => ({
              id: i.id,
              description: i.description,
              quantity: Number(i.quantity),
              unitPrice: Number(i.unit_price),
              total: Number(i.total),
            })),
            notes: r.notes || undefined,
          };
        });
        setInvoices(mapped);
        setLoading(false);
      });
  }, []);

  const addInvoice = useCallback(async (invoice: Invoice) => {
    // Upsert client first
    let clientId: string | null = null;
    if (invoice.clientName) {
      // Check if client exists
      const { data: existing } = await supabase.from('clients').select('id')
        .eq('name', invoice.clientName).maybeSingle();
      if (existing) {
        clientId = existing.id;
      } else {
        const { data: newClient } = await supabase.from('clients').insert({
          name: invoice.clientName,
          email: invoice.clientEmail || `${invoice.clientName.toLowerCase().replace(/\s+/g, '.')}@placeholder.com`,
        }).select('id').single();
        if (newClient) clientId = newClient.id;
      }
    }

    // Insert invoice
    const { data: invRow, error } = await supabase.from('invoices').insert({
      invoice_number: invoice.invoiceNumber,
      client_id: clientId,
      status: invoice.status,
      issue_date: invoice.issueDate,
      due_date: invoice.dueDate,
      subtotal: invoice.items.reduce((s, i) => s + i.total, 0),
      tax_rate: 0,
      tax_amount: 0,
      total: invoice.amount,
      notes: invoice.notes || null,
    }).select().single();

    if (error || !invRow) {
      toast.error('Failed to save invoice');
      console.error(error);
      return;
    }

    // Insert items
    if (invoice.items.length > 0) {
      await supabase.from('invoice_items').insert(
        invoice.items.map((item, idx) => ({
          invoice_id: invRow.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total: item.total,
          sort_order: idx,
        }))
      );
    }

    // Add to local state with DB id
    setInvoices(prev => [{ ...invoice, id: invRow.id }, ...prev]);
  }, []);

  const updateInvoiceStatus = useCallback(async (id: string, status: InvoiceStatus) => {
    const updates: any = { status };
    if (status === 'paid') updates.paid_at = new Date().toISOString();
    const { error } = await supabase.from('invoices').update(updates).eq('id', id);
    if (error) { toast.error('Failed to update invoice'); return; }
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status } : inv));
    toast.success(`Invoice marked as ${status}`);
  }, []);

  const deleteInvoice = useCallback(async (id: string) => {
    const { error } = await supabase.from('invoices').delete().eq('id', id);
    if (error) { toast.error('Failed to delete invoice'); return; }
    setInvoices(prev => prev.filter(inv => inv.id !== id));
    toast.success('Invoice deleted');
  }, []);

  const metrics = useMemo<DashboardMetrics>(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return {
      totalRevenue: invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.amount, 0),
      totalInvoices: invoices.length,
      pendingAmount: invoices.filter((i) => i.status === 'pending').reduce((s, i) => s + i.amount, 0),
      overdueAmount: invoices.filter((i) => i.status === 'overdue').reduce((s, i) => s + i.amount, 0),
      paidThisMonth: invoices.filter((i) => i.status === 'paid' && i.issueDate.startsWith(currentMonth)).reduce((s, i) => s + i.amount, 0),
      invoicesThisMonth: invoices.filter((i) => i.issueDate.startsWith(currentMonth)).length,
    };
  }, [invoices]);

  const clients = useMemo<ClientInfo[]>(() => {
    const map = new Map<string, ClientInfo>();
    invoices.forEach((inv) => {
      const key = inv.clientEmail || inv.clientName;
      const existing = map.get(key);
      if (existing) { existing.totalInvoices++; existing.totalAmount += inv.amount; }
      else { map.set(key, { name: inv.clientName, email: inv.clientEmail, totalInvoices: 1, totalAmount: inv.amount }); }
    });
    return Array.from(map.values());
  }, [invoices]);

  const vendors = useMemo<VendorInfo[]>(() => {
    const map = new Map<string, VendorInfo>();
    invoices.forEach((inv) => {
      if (!inv.vendorName) return;
      const existing = map.get(inv.vendorName);
      if (existing) { existing.totalInvoices++; existing.totalAmount += inv.amount; }
      else { map.set(inv.vendorName, { name: inv.vendorName, phone: inv.vendorPhone, address: inv.vendorAddress, totalInvoices: 1, totalAmount: inv.amount }); }
    });
    return Array.from(map.values());
  }, [invoices]);

  const monthlyRevenue = useMemo(() => {
    const map = new Map<string, number>();
    invoices.forEach((inv) => {
      const d = new Date(inv.issueDate);
      const key = d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
      map.set(key, (map.get(key) || 0) + inv.amount);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).slice(-6);
  }, [invoices]);

  const statusDistribution = useMemo(() => {
    const counts: Record<string, number> = { Paid: 0, Pending: 0, Overdue: 0, Draft: 0 };
    invoices.forEach((inv) => {
      const label = inv.status.charAt(0).toUpperCase() + inv.status.slice(1);
      if (label in counts) counts[label]++;
    });
    return [
      { name: 'Paid', value: counts.Paid, color: 'hsl(152, 69%, 40%)' },
      { name: 'Pending', value: counts.Pending, color: 'hsl(38, 92%, 50%)' },
      { name: 'Overdue', value: counts.Overdue, color: 'hsl(0, 72%, 51%)' },
      { name: 'Draft', value: counts.Draft, color: 'hsl(210, 10%, 45%)' },
    ];
  }, [invoices]);

  return (
    <InvoiceContext.Provider value={{ invoices, addInvoice, updateInvoiceStatus, deleteInvoice, metrics, clients, vendors, monthlyRevenue, statusDistribution, loading }}>
      {children}
    </InvoiceContext.Provider>
  );
}
