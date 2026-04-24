import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageBase64, mimeType } = await req.json();
    
    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "No image provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType || "image/png"};base64,${imageBase64}`,
                },
              },
              {
                type: "text",
                text: `Extract all invoice fields from this image/document. This may be a multi-page document — extract data from ALL pages and merge into a single invoice.

For each field you extract, also provide a confidence score between 0.0 and 1.0 indicating how confident you are in the extraction accuracy:
- 1.0 = clearly visible and unambiguous
- 0.7-0.9 = mostly clear but minor uncertainty  
- 0.4-0.6 = partially visible or ambiguous
- 0.0-0.3 = guessed or very uncertain

Return the data using the extract_invoice_fields tool.`,
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_invoice_fields",
              description: "Extract structured invoice data from an invoice image with confidence scores",
              parameters: {
                type: "object",
                properties: {
                  invoice_number: { type: "string", description: "Invoice number/ID" },
                  vendor_name: { type: "string", description: "Vendor/seller/company name" },
                  vendor_phone: { type: "string", description: "Vendor phone number" },
                  vendor_address: { type: "string", description: "Vendor address" },
                  client_name: { type: "string", description: "Client/customer/buyer name" },
                  client_email: { type: "string", description: "Client email if visible" },
                  client_address: { type: "string", description: "Client address if visible" },
                  client_phone: { type: "string", description: "Client phone if visible" },
                  issue_date: { type: "string", description: "Issue date in YYYY-MM-DD format" },
                  due_date: { type: "string", description: "Due date in YYYY-MM-DD format" },
                  subtotal: { type: "number", description: "Subtotal before tax" },
                  tax_rate: { type: "number", description: "Tax rate as percentage" },
                  tax_amount: { type: "number", description: "Tax amount" },
                  total: { type: "number", description: "Total amount due" },
                  currency: { type: "string", description: "Currency code (USD, EUR, INR)" },
                  notes: { type: "string", description: "Notes or terms on the invoice" },
                  items: {
                    type: "array",
                    description: "Line items on the invoice",
                    items: {
                      type: "object",
                      properties: {
                        description: { type: "string" },
                        quantity: { type: "number" },
                        unit_price: { type: "number" },
                        total: { type: "number" },
                      },
                      required: ["description", "quantity", "unit_price", "total"],
                      additionalProperties: false,
                    },
                  },
                  confidence: {
                    type: "object",
                    description: "Confidence scores (0.0-1.0) for each extracted field",
                    properties: {
                      invoice_number: { type: "number" },
                      vendor_name: { type: "number" },
                      vendor_phone: { type: "number" },
                      vendor_address: { type: "number" },
                      client_name: { type: "number" },
                      client_email: { type: "number" },
                      issue_date: { type: "number" },
                      due_date: { type: "number" },
                      subtotal: { type: "number" },
                      tax_rate: { type: "number" },
                      total: { type: "number" },
                      currency: { type: "number" },
                      items: { type: "number" },
                    },
                    additionalProperties: false,
                  },
                  pages_processed: { type: "number", description: "Number of pages processed from the document" },
                },
                required: ["invoice_number", "total", "items", "confidence"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_invoice_fields" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI processing failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "Could not extract invoice data" }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const extractedData = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ data: extractedData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-invoice error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
