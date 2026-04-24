import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientName, currentItems, allInvoiceHistory, productCatalog } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a smart product recommendation engine for a business ERP system. 
Analyze the customer's purchase history and current invoice items to identify buying patterns, then recommend products from the available catalog that the customer is likely to need.

Consider:
- Complementary products (items commonly bought together)
- Repeat purchase patterns (items they buy regularly)  
- Seasonal or category-based associations
- Upsell opportunities (premium versions of what they buy)
- Cross-sell from related categories

Be specific and actionable. Each recommendation should explain WHY this customer would want it.`;

    const userPrompt = `Customer: ${clientName}

Current Invoice Items:
${currentItems.map((i: any) => `- ${i.description} (Qty: ${i.quantity}, Price: ${i.unit_price})`).join("\n")}

${allInvoiceHistory.length > 0 ? `Previous Purchase History for this customer:\n${allInvoiceHistory.map((inv: any) => `  Invoice ${inv.invoice_number} (${inv.date}): ${inv.items.map((i: any) => i.description).join(", ")}`).join("\n")}` : "No previous purchase history available."}

Available Product Catalog:
${productCatalog.map((p: any) => `- ${p.name} (SKU: ${p.sku}, Category: ${p.category}, Price: ${p.unit_price}, Stock: ${p.current_stock})`).join("\n")}

Analyze this customer's purchasing patterns and recommend products from the catalog.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "provide_recommendations",
              description: "Return product recommendations for this customer",
              parameters: {
                type: "object",
                properties: {
                  recommendations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        product_name: { type: "string", description: "Name of the recommended product from catalog" },
                        sku: { type: "string", description: "SKU of the recommended product" },
                        reason: { type: "string", description: "Why this product is recommended for this customer (1-2 sentences)" },
                        confidence: { type: "string", enum: ["high", "medium", "low"], description: "How confident we are in this recommendation" },
                        pattern_type: { type: "string", enum: ["complementary", "repeat", "upsell", "cross-sell", "seasonal"], description: "Type of recommendation pattern" },
                      },
                      required: ["product_name", "sku", "reason", "confidence", "pattern_type"],
                      additionalProperties: false,
                    },
                  },
                  customer_insight: {
                    type: "string",
                    description: "A brief summary of the customer's purchasing behavior pattern (1-2 sentences)",
                  },
                },
                required: ["recommendations", "customer_insight"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "provide_recommendations" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      const text = await response.text();
      console.error("AI gateway error:", status, text);
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway returned ${status}`);
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("No structured response from AI");
    }

    const parsed = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ data: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Recommendation error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
