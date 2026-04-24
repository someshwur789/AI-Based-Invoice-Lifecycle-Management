import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { InvoiceProvider } from "@/context/InvoiceContext";
import { ERPProvider } from "@/context/ERPContext";
import { CurrencyProvider } from "@/context/CurrencyContext";
import Index from "./pages/Index";
import Invoices from "./pages/Invoices";
import Analytics from "./pages/Analytics";
import Clients from "./pages/Clients";
import Payments from "./pages/Payments";
import Vendors from "./pages/Vendors";
import Settings from "./pages/Settings";
import Inventory from "./pages/Inventory";
import PurchaseOrders from "./pages/PurchaseOrders";
import Expenses from "./pages/Expenses";
import Employees from "./pages/Employees";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CurrencyProvider>
        <InvoiceProvider>
          <ERPProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/invoices" element={<Invoices />} />
                <Route path="/vendors" element={<Vendors />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/clients" element={<Clients />} />
                <Route path="/payments" element={<Payments />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/purchase-orders" element={<PurchaseOrders />} />
                <Route path="/expenses" element={<Expenses />} />
                <Route path="/employees" element={<Employees />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </ERPProvider>
        </InvoiceProvider>
      </CurrencyProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
