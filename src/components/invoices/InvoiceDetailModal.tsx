import { useState } from 'react';
import { Invoice } from '@/types/invoice';
import { useCurrency } from '@/context/CurrencyContext';
import { InvoiceStatusBadge } from './InvoiceStatusBadge';
import { ProductRecommendations } from './ProductRecommendations';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Download, Send, Printer, Loader2 } from 'lucide-react';
import { downloadInvoicePdf } from './InvoiceTable';
import { toast } from 'sonner';

interface InvoiceDetailModalProps {
  invoice: Invoice | null;
  open: boolean;
  onClose: () => void;
}

export function InvoiceDetailModal({ invoice, open, onClose }: InvoiceDetailModalProps) {
  const { formatCurrency } = useCurrency();
  const [downloading, setDownloading] = useState(false);
  if (!invoice) return null;

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      await downloadInvoicePdf(invoice);
    } catch (err) {
      console.error('PDF generation error:', err);
      toast.error('Failed to generate PDF');
    } finally {
      setDownloading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">
              {invoice.invoiceNumber}
            </DialogTitle>
            <InvoiceStatusBadge status={invoice.status} />
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Billed To</p>
              <p className="mt-1 font-semibold text-foreground">{invoice.clientName}</p>
              <p className="text-sm text-muted-foreground">{invoice.clientEmail}</p>
            </div>
            <div className="text-right">
              <div className="space-y-1">
                <div>
                  <p className="text-sm text-muted-foreground">Issue Date</p>
                  <p className="font-medium">{formatDate(invoice.issueDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Due Date</p>
                  <p className="font-medium">{formatDate(invoice.dueDate)}</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="mb-4 font-semibold text-foreground">Line Items</h4>
            <div className="rounded-lg border">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Description</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Qty</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Unit Price</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="px-4 py-3 text-sm text-foreground">{item.description}</td>
                      <td className="px-4 py-3 text-right text-sm text-muted-foreground">{item.quantity}</td>
                      <td className="px-4 py-3 text-right text-sm text-muted-foreground">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-foreground">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatCurrency(invoice.amount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax (0%)</span>
                <span className="font-medium">{formatCurrency(0)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-bold text-primary">{formatCurrency(invoice.amount)}</span>
              </div>
            </div>
          </div>

          {invoice.notes && (
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-sm font-medium text-muted-foreground">Notes</p>
              <p className="mt-1 text-sm text-foreground">{invoice.notes}</p>
            </div>
          )}

          <Separator />

          <ProductRecommendations invoice={invoice} />

          <div className="flex gap-3 pt-4">
            <Button className="flex-1">
              <Send className="mr-2 h-4 w-4" />
              Send Invoice
            </Button>
            <Button variant="outline" onClick={handleDownloadPdf} disabled={downloading}>
              {downloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Download PDF
            </Button>
            <Button variant="outline">
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
