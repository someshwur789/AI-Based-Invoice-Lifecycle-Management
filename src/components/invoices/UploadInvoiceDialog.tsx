import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Upload, Loader2, FileImage, X, Check, Save, Plus, Trash2, FileText, AlertCircle, CheckCircle2, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Invoice } from '@/types/invoice';
import { useERPContext } from '@/context/ERPContext';

interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface ConfidenceScores {
  [key: string]: number;
}

interface ExtractedInvoiceData {
  invoice_number: string;
  vendor_name: string;
  vendor_phone: string;
  vendor_address: string;
  client_name: string;
  client_email: string;
  client_address: string;
  client_phone: string;
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  currency: string;
  notes: string;
  items: InvoiceLineItem[];
  confidence?: ConfidenceScores;
  pages_processed?: number;
}

const defaultData: ExtractedInvoiceData = {
  invoice_number: '',
  vendor_name: '',
  vendor_phone: '',
  vendor_address: '',
  client_name: '',
  client_email: '',
  client_address: '',
  client_phone: '',
  issue_date: new Date().toISOString().split('T')[0],
  due_date: '',
  subtotal: 0,
  tax_rate: 0,
  tax_amount: 0,
  total: 0,
  currency: 'INR',
  notes: '',
  items: [],
};

interface UploadInvoiceDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (invoice: Invoice) => void;
}

export function UploadInvoiceDialog({ open, onClose, onSave }: UploadInvoiceDialogProps) {
  const { products, deductStock } = useERPContext();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileDataUrl, setFileDataUrl] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<ExtractedInvoiceData | null>(null);
  const [autoDeductStock, setAutoDeductStock] = useState(true);

  const ConfidenceBadge = ({ field }: { field: string }) => {
    if (!formData?.confidence || formData.confidence[field] === undefined) return null;
    const score = formData.confidence[field];
    const pct = Math.round(score * 100);
    let color = 'text-destructive';
    let Icon = AlertCircle;
    let label = 'Low confidence';
    if (score >= 0.8) { color = 'text-success'; Icon = CheckCircle2; label = 'High confidence'; }
    else if (score >= 0.5) { color = 'text-warning'; Icon = HelpCircle; label = 'Medium confidence'; }
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`inline-flex items-center gap-0.5 ${color}`}>
            <Icon className="h-3 w-3" />
            <span className="text-[10px] font-medium">{pct}%</span>
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">{label} ({pct}%)</TooltipContent>
      </Tooltip>
    );
  };

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const validTypes = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(selected.type)) {
      toast.error('Please upload a PNG, JPEG, WebP image or PDF');
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      toast.error('File must be under 10MB');
      return;
    }

    setFile(selected);
    setFormData(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setFileDataUrl(dataUrl);
      if (selected.type.startsWith('image/')) {
        setPreview(dataUrl);
      } else {
        setPreview(null);
      }
    };
    reader.readAsDataURL(selected);
  }, []);

  const handleExtract = async () => {
    if (!file) return;
    setExtracting(true);

    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke('extract-invoice', {
        body: { imageBase64: base64, mimeType: file.type },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setFormData({ ...defaultData, ...data.data });
      toast.success('Invoice data extracted! You can now edit the fields.');
    } catch (err: any) {
      console.error('OCR error:', err);
      toast.error(err.message || 'Failed to extract invoice data');
    } finally {
      setExtracting(false);
    }
  };

  const updateField = (field: keyof ExtractedInvoiceData, value: string | number) => {
    if (!formData) return;
    setFormData({ ...formData, [field]: value });
  };

  const updateItem = (index: number, field: keyof InvoiceLineItem, value: string | number) => {
    if (!formData) return;
    const items = [...formData.items];
    items[index] = { ...items[index], [field]: value };
    if (field === 'quantity' || field === 'unit_price') {
      items[index].total = Number(items[index].quantity) * Number(items[index].unit_price);
    }
    const subtotal = items.reduce((sum, item) => sum + Number(item.total), 0);
    const tax_amount = subtotal * (Number(formData.tax_rate) / 100);
    setFormData({ ...formData, items, subtotal, tax_amount, total: subtotal + tax_amount });
  };

  const addItem = () => {
    if (!formData) return;
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', quantity: 1, unit_price: 0, total: 0 }],
    });
  };

  const removeItem = (index: number) => {
    if (!formData) return;
    const items = formData.items.filter((_, i) => i !== index);
    const subtotal = items.reduce((sum, item) => sum + Number(item.total), 0);
    const tax_amount = subtotal * (Number(formData.tax_rate) / 100);
    setFormData({ ...formData, items, subtotal, tax_amount, total: subtotal + tax_amount });
  };

  const recalcTotals = (taxRate: number) => {
    if (!formData) return;
    const subtotal = formData.items.reduce((sum, item) => sum + Number(item.total), 0);
    const tax_amount = subtotal * (taxRate / 100);
    setFormData({ ...formData, tax_rate: taxRate, subtotal, tax_amount, total: subtotal + tax_amount });
  };

  const handleSave = () => {
    if (!formData) return;

    if (!formData.client_name) {
      toast.error('Client name is required');
      return;
    }
    if (!formData.due_date) {
      toast.error('Due date is required');
      return;
    }

    setSaving(true);

    const invoiceNumber = formData.invoice_number || `INV-${Date.now().toString().slice(-6)}`;
    const total = formData.total || formData.items.reduce((sum, item) => sum + Number(item.total), 0);

    const newInvoice: Invoice = {
      id: crypto.randomUUID(),
      invoiceNumber,
      clientName: formData.client_name,
      clientEmail: formData.client_email || '',
      amount: total,
      currency: formData.currency || 'INR',
      status: 'draft',
      issueDate: formData.issue_date || new Date().toISOString().split('T')[0],
      dueDate: formData.due_date,
      items: formData.items.map((item, i) => ({
        id: String(i + 1),
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unit_price),
        total: Number(item.total),
      })),
      notes: formData.notes || undefined,
      originalFileUrl: fileDataUrl || undefined,
      vendorName: formData.vendor_name || undefined,
      vendorPhone: formData.vendor_phone || undefined,
      vendorAddress: formData.vendor_address || undefined,
    };

    onSave(newInvoice);

    // Auto-deduct stock for matching products
    if (autoDeductStock && products.length > 0) {
      let deducted = 0;
      formData.items.forEach((item) => {
        const match = products.find(
          (p) =>
            p.name.toLowerCase() === item.description.toLowerCase() ||
            p.sku.toLowerCase() === item.description.toLowerCase()
        );
        if (match && item.quantity > 0) {
          deductStock(match.id, Number(item.quantity), `Invoice ${invoiceNumber}`);
          deducted++;
        }
      });
      if (deducted > 0) {
        toast.success(`Stock deducted for ${deducted} product(s)`);
      }
    }

    toast.success('Invoice saved successfully!');
    setSaving(false);
    handleClose();
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setFileDataUrl(null);
    setFormData(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{formData && !file ? 'Create Invoice' : 'New Invoice'}</DialogTitle>
          <DialogDescription>
            {formData && !file
              ? 'Fill in the invoice details below.'
              : 'Upload an invoice image for AI extraction, or create one manually.'}
          </DialogDescription>
        </DialogHeader>

        {!formData ? (
          <div className="space-y-4">
            {!file ? (
              <>
                <label
                  htmlFor="invoice-upload"
                  className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-muted-foreground/30 p-10 cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/30"
                >
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">Click to upload invoice</p>
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPEG, WebP or PDF (max 10MB)</p>
                  </div>
                  <input
                    id="invoice-upload"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,application/pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">or</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setFormData({ ...defaultData, items: [{ description: '', quantity: 1, unit_price: 0, total: 0 }] })}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Create Manually
                </Button>
              </>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
                  <FileImage className="h-8 w-8 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={handleReset}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {preview && (
                  <div className="rounded-lg border overflow-hidden bg-muted/20">
                    <img src={preview} alt="Invoice preview" className="w-full max-h-64 object-contain" />
                  </div>
                )}

                <Button onClick={handleExtract} disabled={extracting} className="w-full">
                  {extracting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Extracting with AI...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Extract Invoice Data
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {/* Pages processed badge */}
            {formData.pages_processed && formData.pages_processed > 1 && (
              <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-accent/50 px-3 py-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-accent-foreground">Extracted from {formData.pages_processed} pages</span>
              </div>
            )}

            {/* Confidence summary */}
            {formData.confidence && (
              <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2">
                <span className="text-xs text-muted-foreground">Overall confidence:</span>
                {(() => {
                  const scores = Object.values(formData.confidence).filter(v => typeof v === 'number');
                  const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
                  const pct = Math.round(avg * 100);
                  const color = avg >= 0.8 ? 'text-success' : avg >= 0.5 ? 'text-warning' : 'text-destructive';
                  return <span className={`text-xs font-bold ${color}`}>{pct}%</span>;
                })()}
                <span className="text-[10px] text-muted-foreground ml-auto">Fields with ⚠️ may need review</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label className="text-xs text-muted-foreground font-medium">Vendor Details</Label>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground flex items-center gap-1.5">Vendor Name <ConfidenceBadge field="vendor_name" /></Label>
                <Input value={formData.vendor_name} onChange={(e) => updateField('vendor_name', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground flex items-center gap-1.5">Vendor Phone <ConfidenceBadge field="vendor_phone" /></Label>
                <Input value={formData.vendor_phone} onChange={(e) => updateField('vendor_phone', e.target.value)} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs text-muted-foreground flex items-center gap-1.5">Vendor Address <ConfidenceBadge field="vendor_address" /></Label>
                <Input value={formData.vendor_address} onChange={(e) => updateField('vendor_address', e.target.value)} />
              </div>

              <div className="col-span-2 mt-2">
                <Label className="text-xs text-muted-foreground font-medium">Invoice Details</Label>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground flex items-center gap-1.5">Invoice Number <ConfidenceBadge field="invoice_number" /></Label>
                <Input value={formData.invoice_number} onChange={(e) => updateField('invoice_number', e.target.value)} placeholder="Auto-generated if empty" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground flex items-center gap-1.5">Client Name * <ConfidenceBadge field="client_name" /></Label>
                <Input value={formData.client_name} onChange={(e) => updateField('client_name', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground flex items-center gap-1.5">Client Email <ConfidenceBadge field="client_email" /></Label>
                <Input type="email" value={formData.client_email} onChange={(e) => updateField('client_email', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground flex items-center gap-1.5">Currency <ConfidenceBadge field="currency" /></Label>
                <Input value={formData.currency} onChange={(e) => updateField('currency', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground flex items-center gap-1.5">Issue Date <ConfidenceBadge field="issue_date" /></Label>
                <Input type="date" value={formData.issue_date} onChange={(e) => updateField('issue_date', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground flex items-center gap-1.5">Due Date * <ConfidenceBadge field="due_date" /></Label>
                <Input type="date" value={formData.due_date} onChange={(e) => updateField('due_date', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground flex items-center gap-1.5">Tax Rate (%) <ConfidenceBadge field="tax_rate" /></Label>
                <Input type="number" value={formData.tax_rate} onChange={(e) => recalcTotals(Number(e.target.value))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground flex items-center gap-1.5">Total <ConfidenceBadge field="total" /></Label>
                <Input value={formData.total.toFixed(2)} readOnly className="font-semibold bg-muted/30" />
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">Line Items <ConfidenceBadge field="items" /></Label>
                <Button variant="outline" size="sm" onClick={addItem}>
                  <Plus className="h-3 w-3 mr-1" /> Add Item
                </Button>
              </div>
              {formData.items.length > 0 && (
                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-2 font-medium">Description</th>
                        <th className="text-right p-2 font-medium w-20">Qty</th>
                        <th className="text-right p-2 font-medium w-24">Price</th>
                        <th className="text-right p-2 font-medium w-24">Total</th>
                        <th className="w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.items.map((item, i) => (
                        <tr key={i} className="border-t">
                          <td className="p-1.5">
                            <Input
                              value={item.description}
                              onChange={(e) => updateItem(i, 'description', e.target.value)}
                              className="h-8 text-xs"
                            />
                          </td>
                          <td className="p-1.5">
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateItem(i, 'quantity', Number(e.target.value))}
                              className="h-8 text-xs text-right"
                            />
                          </td>
                          <td className="p-1.5">
                            <Input
                              type="number"
                              step="0.01"
                              value={item.unit_price}
                              onChange={(e) => updateItem(i, 'unit_price', Number(e.target.value))}
                              className="h-8 text-xs text-right"
                            />
                          </td>
                          <td className="p-2 text-right text-xs font-medium">
                            ${item.total.toFixed(2)}
                          </td>
                          <td className="p-1.5">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeItem(i)}>
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Inventory Link */}
            {products.length > 0 && (
              <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/30">
                <div>
                  <p className="text-sm font-medium">Auto-deduct inventory</p>
                  <p className="text-xs text-muted-foreground">Reduce stock for matching product names/SKUs</p>
                </div>
                <Switch checked={autoDeductStock} onCheckedChange={setAutoDeductStock} />
              </div>
            )}

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                rows={2}
                placeholder="Optional notes..."
              />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleReset} className="flex-1">
                Upload Another
              </Button>
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Invoice
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
