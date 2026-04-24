import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, TrendingUp, RefreshCw, ShoppingCart, ArrowUpRight, Layers, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Invoice } from '@/types/invoice';
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

interface ProductRecommendationsProps {
  invoice: Invoice;
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

export function ProductRecommendations({ invoice }: ProductRecommendationsProps) {
  const { products } = useERPContext();
  const { invoices } = useInvoiceContext();
  const { formatCurrency } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<RecommendationData | null>(null);

  const fetchRecommendations = async () => {
    if (products.length === 0) {
      toast.error('No products in your catalog. Add products to get recommendations.');
      return;
    }

    setLoading(true);
    try {
      // Get all invoices for this client
      const clientInvoices = invoices
        .filter(inv => inv.clientName === invoice.clientName && inv.id !== invoice.id)
        .map(inv => ({
          invoice_number: inv.invoiceNumber,
          date: inv.issueDate,
          items: inv.items.map(i => ({ description: i.description })),
        }));

      const { data: result, error } = await supabase.functions.invoke('recommend-products', {
        body: {
          clientName: invoice.clientName,
          currentItems: invoice.items.map(i => ({
            description: i.description,
            quantity: i.quantity,
            unit_price: i.unitPrice,
          })),
          allInvoiceHistory: clientInvoices,
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

  if (!data) {
    return (
      <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">AI Product Recommendations</p>
              <p className="text-xs text-muted-foreground">
                Analyze {invoice.clientName}'s purchase patterns to suggest products
              </p>
            </div>
          </div>
          <Button size="sm" onClick={fetchRecommendations} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <TrendingUp className="mr-1.5 h-3.5 w-3.5" />
                Get Recommendations
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-semibold text-foreground">AI Recommendations</h4>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchRecommendations} disabled={loading}>
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
        </Button>
      </div>

      {/* Customer Insight */}
      <div className="rounded-lg bg-muted/50 px-3 py-2">
        <p className="text-xs text-muted-foreground italic">"{data.customer_insight}"</p>
      </div>

      {/* Recommendations */}
      <div className="grid gap-2">
        {data.recommendations.map((rec, i) => {
          const product = products.find(p => p.sku === rec.sku);
          return (
            <Card key={i} className="p-3">
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
            </Card>
          );
        })}
      </div>

      {data.recommendations.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-2">
          No matching recommendations found in your catalog.
        </p>
      )}
    </div>
  );
}
