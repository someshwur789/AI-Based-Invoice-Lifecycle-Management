import "https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface InvoiceData {
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  amount: number;
  notes?: string;
  status: string;
  currency?: string;
}

function fmtCurrency(amount: number, currency = "INR"): string {
  // Standard PDF fonts don't support currency symbols like ₹, so use code-based prefix
  const prefixes: Record<string, string> = { INR: "Rs.", USD: "$", EUR: "EUR ", GBP: "GBP " };
  const prefix = prefixes[currency] || currency + " ";
  return prefix + new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function truncate(str: string, maxLen: number): string {
  return str.length > maxLen ? str.substring(0, maxLen - 2) + ".." : str;
}

async function generatePdf(invoice: InvoiceData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4
  const { width, height } = page.getSize();

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const curr = invoice.currency || "INR";
  const margin = 50;
  let y = height - margin;

  const black = rgb(0.067, 0.067, 0.067);
  const gray = rgb(0.42, 0.42, 0.42);
  const lightGray = rgb(0.6, 0.6, 0.6);
  const tableHeaderBg = rgb(0.95, 0.95, 0.95);

  const statusColors: Record<string, { r: number; g: number; b: number }> = {
    paid: { r: 0.02, g: 0.59, b: 0.4 },
    pending: { r: 0.85, g: 0.59, b: 0.02 },
    overdue: { r: 0.86, g: 0.15, b: 0.15 },
    draft: { r: 0.42, g: 0.42, b: 0.42 },
  };

  // Header
  page.drawText("INVOICE", { x: margin, y, size: 28, font: fontBold, color: black });

  const statusText = invoice.status.toUpperCase();
  const statusW = fontBold.widthOfTextAtSize(statusText, 10);
  const sc = statusColors[invoice.status] || statusColors.draft;
  page.drawRectangle({ x: width - margin - statusW - 16, y: y - 4, width: statusW + 16, height: 20, color: rgb(sc.r, sc.g, sc.b), borderColor: rgb(sc.r, sc.g, sc.b), borderWidth: 0 });
  page.drawText(statusText, { x: width - margin - statusW - 8, y: y + 2, size: 10, font: fontBold, color: rgb(1, 1, 1) });

  y -= 20;
  page.drawText(invoice.invoiceNumber, { x: margin, y, size: 12, font: fontRegular, color: gray });

  // Client & dates section
  y -= 40;
  page.drawText("BILLED TO", { x: margin, y, size: 8, font: fontBold, color: lightGray });
  y -= 16;
  page.drawText(invoice.clientName, { x: margin, y, size: 13, font: fontBold, color: black });
  y -= 16;
  page.drawText(invoice.clientEmail, { x: margin, y, size: 10, font: fontRegular, color: gray });

  // Dates on the right
  let dateY = y + 32;
  const dateX = width - margin - 140;
  page.drawText("ISSUE DATE", { x: dateX, y: dateY, size: 8, font: fontBold, color: lightGray });
  dateY -= 14;
  page.drawText(fmtDate(invoice.issueDate), { x: dateX, y: dateY, size: 10, font: fontRegular, color: black });
  dateY -= 22;
  page.drawText("DUE DATE", { x: dateX, y: dateY, size: 8, font: fontBold, color: lightGray });
  dateY -= 14;
  page.drawText(fmtDate(invoice.dueDate), { x: dateX, y: dateY, size: 10, font: fontRegular, color: black });

  // Table
  y -= 40;
  const colX = [margin, margin + 250, margin + 330, margin + 410];
  const tableW = width - 2 * margin;

  // Table header background
  page.drawRectangle({ x: margin, y: y - 6, width: tableW, height: 22, color: tableHeaderBg });

  const headers = ["Description", "Qty", "Unit Price", "Total"];
  headers.forEach((h, i) => {
    const align = i === 0 ? colX[i] + 8 : colX[i];
    page.drawText(h, { x: align, y: y, size: 8, font: fontBold, color: gray });
  });

  // Separator
  y -= 10;
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1, color: rgb(0.9, 0.9, 0.9) });

  // Items
  for (const item of invoice.items) {
    y -= 22;
    if (y < 100) break; // safety

    page.drawText(truncate(item.description, 45), { x: colX[0] + 8, y, size: 10, font: fontRegular, color: black });
    page.drawText(String(item.quantity), { x: colX[1], y, size: 10, font: fontRegular, color: gray });
    page.drawText(fmtCurrency(item.unitPrice, curr), { x: colX[2], y, size: 10, font: fontRegular, color: gray });
    page.drawText(fmtCurrency(item.total, curr), { x: colX[3], y, size: 10, font: fontBold, color: black });

    page.drawLine({ start: { x: margin, y: y - 8 }, end: { x: width - margin, y: y - 8 }, thickness: 0.5, color: rgb(0.92, 0.92, 0.92) });
  }

  // Totals
  y -= 40;
  const totalsX = width - margin - 180;

  page.drawText("Subtotal", { x: totalsX, y, size: 10, font: fontRegular, color: gray });
  page.drawText(fmtCurrency(invoice.amount, curr), { x: totalsX + 100, y, size: 10, font: fontRegular, color: black });

  y -= 18;
  page.drawText("Tax (0%)", { x: totalsX, y, size: 10, font: fontRegular, color: gray });
  page.drawText(fmtCurrency(0, curr), { x: totalsX + 100, y, size: 10, font: fontRegular, color: black });

  y -= 12;
  page.drawLine({ start: { x: totalsX, y }, end: { x: width - margin, y }, thickness: 1.5, color: black });

  y -= 18;
  page.drawText("Total", { x: totalsX, y, size: 14, font: fontBold, color: black });
  page.drawText(fmtCurrency(invoice.amount, curr), { x: totalsX + 100, y, size: 14, font: fontBold, color: black });

  // Notes
  if (invoice.notes) {
    y -= 40;
    page.drawText("NOTES", { x: margin, y, size: 8, font: fontBold, color: lightGray });
    y -= 14;
    page.drawText(truncate(invoice.notes, 90), { x: margin, y, size: 10, font: fontRegular, color: gray });
  }

  // Footer
  page.drawText(`Generated on ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`, {
    x: margin, y: 30, size: 8, font: fontRegular, color: lightGray,
  });

  return await pdfDoc.save();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const invoice: InvoiceData = await req.json();
    const pdfBytes = await generatePdf(invoice);

    return new Response(pdfBytes, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
