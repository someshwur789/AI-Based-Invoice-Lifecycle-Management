import { useState } from 'react';
import { Invoice } from '@/types/invoice';
import { useCurrency } from '@/context/CurrencyContext';
import { InvoiceStatusBadge } from './InvoiceStatusBadge';
import { InvoiceDetailModal } from './InvoiceDetailModal';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Eye, MoreHorizontal, Download, Trash2, FileText, CheckCircle, Clock, AlertTriangle, FileEdit, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface InvoiceTableProps {
  invoices: Invoice[];
  onDelete?: (id: string) => void;
  onStatusChange?: (id: string, status: Invoice['status']) => void;
}

async function downloadInvoicePdf(invoice: Invoice) {
  // Use fetch directly to get binary response (supabase.functions.invoke auto-parses)
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const response = await fetch(`${supabaseUrl}/functions/v1/generate-invoice-pdf`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseKey}`,
      'apikey': supabaseKey,
    },
    body: JSON.stringify({
      invoiceNumber: invoice.invoiceNumber,
      clientName: invoice.clientName,
      clientEmail: invoice.clientEmail,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      items: invoice.items.map(i => ({
        description: i.description,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        total: i.total,
      })),
      amount: invoice.amount,
      notes: invoice.notes,
      status: invoice.status,
      currency: invoice.currency || 'INR',
    }),
  });

  if (!response.ok) throw new Error('Failed to generate PDF');

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${invoice.invoiceNumber}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function InvoiceTable({ invoices, onDelete, onStatusChange }: InvoiceTableProps) {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [viewOriginalUrl, setViewOriginalUrl] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { formatCurrency } = useCurrency();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleDownloadPdf = async (invoice: Invoice) => {
    setDownloadingId(invoice.id);
    try {
      await downloadInvoicePdf(invoice);
    } catch (err) {
      console.error('PDF generation error:', err);
      toast.error('Failed to generate PDF');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <>
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden animate-fade-in">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="font-semibold">Invoice</TableHead>
              <TableHead className="font-semibold">Client</TableHead>
              <TableHead className="font-semibold">Amount</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Issue Date</TableHead>
              <TableHead className="font-semibold">Due Date</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow
                key={invoice.id}
                className="cursor-pointer transition-colors hover:bg-muted/30"
                onClick={() => setSelectedInvoice(invoice)}
              >
                <TableCell className="font-medium text-primary">
                  {invoice.invoiceNumber}
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium text-foreground">{invoice.clientName}</p>
                    <p className="text-sm text-muted-foreground">{invoice.clientEmail}</p>
                  </div>
                </TableCell>
                <TableCell className="font-semibold">
                  {formatCurrency(invoice.amount)}
                </TableCell>
                <TableCell>
                  <InvoiceStatusBadge status={invoice.status} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(invoice.issueDate)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(invoice.dueDate)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedInvoice(invoice); }}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      {invoice.originalFileUrl && (
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setViewOriginalUrl(invoice.originalFileUrl!); }}>
                          <FileText className="mr-2 h-4 w-4" />
                          View Original Document
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={(e) => { e.stopPropagation(); handleDownloadPdf(invoice); }}
                        disabled={downloadingId === invoice.id}
                      >
                        {downloadingId === invoice.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        Download PDF
                      </DropdownMenuItem>
                      {onStatusChange && (
                        <>
                          <DropdownMenuSeparator />
                          {invoice.status !== 'paid' && (
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStatusChange(invoice.id, 'paid'); }}>
                              <CheckCircle className="mr-2 h-4 w-4 text-success" />
                              Mark as Paid
                            </DropdownMenuItem>
                          )}
                          {invoice.status !== 'pending' && (
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStatusChange(invoice.id, 'pending'); }}>
                              <Clock className="mr-2 h-4 w-4 text-warning" />
                              Mark as Pending
                            </DropdownMenuItem>
                          )}
                          {invoice.status !== 'overdue' && (
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStatusChange(invoice.id, 'overdue'); }}>
                              <AlertTriangle className="mr-2 h-4 w-4 text-destructive" />
                              Mark as Overdue
                            </DropdownMenuItem>
                          )}
                          {invoice.status !== 'draft' && (
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStatusChange(invoice.id, 'draft'); }}>
                              <FileEdit className="mr-2 h-4 w-4 text-muted-foreground" />
                              Mark as Draft
                            </DropdownMenuItem>
                          )}
                        </>
                      )}
                      {onDelete && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={(e) => { e.stopPropagation(); onDelete(invoice.id); }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <InvoiceDetailModal
        invoice={selectedInvoice}
        open={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
      />

      <Dialog open={!!viewOriginalUrl} onOpenChange={() => setViewOriginalUrl(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Original Document</DialogTitle>
          </DialogHeader>
          {viewOriginalUrl && (
            <div className="overflow-auto max-h-[75vh]">
              <img src={viewOriginalUrl} alt="Original invoice document" className="w-full object-contain rounded-lg" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export { downloadInvoicePdf };
