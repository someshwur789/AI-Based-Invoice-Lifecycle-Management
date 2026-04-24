import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Sparkles, TrendingUp, RefreshCw, ShoppingCart, ArrowUpRight, Layers, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useERPContext } from '@/context/ERPContext';
import { useInvoiceContext } from '@/context/InvoiceContext';
import { useCurrency } from '@/context/CurrencyContext';

interface Recommendation {
  product_name: string;
  sku: string;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
  pattern_type: 'complementary' | 'repeat' | 'upsell' | 'cross-sell' | 'seasonal';
}

interface RecommendationData {
  recommendations: Recommendation[];
  customer_insight: string;
}

const patternIcons: Record<string, React.ReactNode> = {
  complementary: <Layers className="h-3.5 w-3.5" />,
  repeat: <RefreshCw className="h-3.5 w-3.5" />,
  upsell: <ArrowUpRight className="h-3.5 w-3.5" />,
  'cross-sell': <ShoppingCart className="h-3.5 w-3.5" />,
  seasonal: <Calendar className="h-3.5 w-3.5" />,
};

const confidenceColors: Record<string, string> = {
  high: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
  medium: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
  low: 'bg-muted text-muted-foreground border-border',
};

export function RecommendationPanel() {
  const { products } = useERPContext();
  const { invoices, clients } = useInvoiceContext();
  const { formatCurrency } = useCurrency();
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<RecommendationData | null>(null);

  const fetchRecommendations = async () => {
    if (!selectedClient) {
      toast.error('Select a client first');
      return;
    }
    if (products.length === 0) {
      toast.error('No products in your catalog. Add products first.');
      return;
    }

    setLoading(true);
    setData(null);

    try {
      const clientInvoices = invoices.filter(inv => inv.clientName === selectedClient);
      const latestInvoice = clientInvoices[0];

      const historyPayload = clientInvoices.map(inv => ({
        invoice_number: inv.invoiceNumber,
        date: inv.issueDate,
        items: inv.items.map(i => ({ description: i.description })),
      }));

      const { data: result, error } = await supabase.functions.invoke('recommend-products', {
        body: {
          clientName: selectedClient,
          currentItems: latestInvoice
            ? latestInvoice.items.map(i => ({
                description: i.description,
                quantity: i.quantity,
                unit_price: i.unitPrice,
              }))
            : [],
          allInvoiceHistory: historyPayload,
          productCatalog: products.map(p => ({
            name: p.name,
            sku: p.sku,
            category: p.category,
            unit_price: p.unitPrice,
            current_stock: p.currentStock,
          })),
        },
      });

      if (error) throw error;
      if (result?.error) throw new Error(result.error);
      setData(result.data);
    } catch (err: any) {
      console.error('Recommendation error:', err);
      toast.error(err.message || 'Failed to get recommendations');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="text-base font-semibold text-foreground">AI Product Recommendations</h3>
      </div>
      <p className="text-xs text-muted-foreground -mt-2">
        Select a client to analyze their purchase patterns and get product suggestions from your catalog.
      </p>

      <div className="flex items-center gap-3">
        <Select value={selectedClient} onValueChange={(v) => { setSelectedClient(v); setData(null); }}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select a client..." />
          </SelectTrigger>
          <SelectContent>
            {clients.map(c => (
              <SelectItem key={c.name} value={c.name}>
                {c.name} ({c.totalInvoices} invoice{c.totalInvoices !== 1 ? 's' : ''})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={fetchRecommendations} disabled={loading || !selectedClient} size="sm">
          {loading ? (
            <>
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <TrendingUp className="mr-1.5 h-3.5 w-3.5" />
              Analyze
            </>
          )}
        </Button>
      </div>

      {data && (
        <div className="space-y-3 pt-1">
          {/* Customer Insight */}
          <div className="rounded-lg bg-muted/50 px-3 py-2">
            <p className="text-xs text-muted-foreground italic">"{data.customer_insight}"</p>
          </div>

          {/* Recommendations */}
          {data.recommendations.length > 0 ? (
            <div className="grid gap-2">
              {data.recommendations.map((rec, i) => {
                const product = products.find(p => p.sku === rec.sku);
                return (
                  <div key={i} className="rounded-lg border bg-card p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-foreground">{rec.product_name}</span>
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${confidenceColors[rec.confidence]}`}>
                            {rec.confidence}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-0.5">
                            {patternIcons[rec.pattern_type]}
                            {rec.pattern_type}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{rec.reason}</p>
                        {product && (
                          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                            <span>{formatCurrency(product.unitPrice)}</span>
                            <span>Stock: {product.currentStock}</span>
                            <span className="text-muted-foreground/60">SKU: {rec.sku}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-2">
              No matching recommendations found in your catalog.
            </p>
          )}
        </div>
      )}

      {!data && !loading && clients.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-3">
          No clients found. Create invoices to start building customer profiles.
        </p>
      )}
    </Card>
  );
}
