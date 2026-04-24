
-- Make invoices and related tables publicly accessible (no auth)
-- Drop existing user-scoped RLS policies
DROP POLICY IF EXISTS "Users can view own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can insert own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can update own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can delete own invoices" ON public.invoices;
CREATE POLICY "Public select invoices" ON public.invoices FOR SELECT USING (true);
CREATE POLICY "Public insert invoices" ON public.invoices FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update invoices" ON public.invoices FOR UPDATE USING (true);
CREATE POLICY "Public delete invoices" ON public.invoices FOR DELETE USING (true);

DROP POLICY IF EXISTS "Users can view own invoice items" ON public.invoice_items;
DROP POLICY IF EXISTS "Users can insert own invoice items" ON public.invoice_items;
DROP POLICY IF EXISTS "Users can update own invoice items" ON public.invoice_items;
DROP POLICY IF EXISTS "Users can delete own invoice items" ON public.invoice_items;
CREATE POLICY "Public select invoice_items" ON public.invoice_items FOR SELECT USING (true);
CREATE POLICY "Public insert invoice_items" ON public.invoice_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update invoice_items" ON public.invoice_items FOR UPDATE USING (true);
CREATE POLICY "Public delete invoice_items" ON public.invoice_items FOR DELETE USING (true);

DROP POLICY IF EXISTS "Users can view own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can insert own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can update own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can delete own clients" ON public.clients;
CREATE POLICY "Public select clients" ON public.clients FOR SELECT USING (true);
CREATE POLICY "Public insert clients" ON public.clients FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update clients" ON public.clients FOR UPDATE USING (true);
CREATE POLICY "Public delete clients" ON public.clients FOR DELETE USING (true);

DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can insert own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can update own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can delete own payments" ON public.payments;
CREATE POLICY "Public select payments" ON public.payments FOR SELECT USING (true);
CREATE POLICY "Public insert payments" ON public.payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update payments" ON public.payments FOR UPDATE USING (true);
CREATE POLICY "Public delete payments" ON public.payments FOR DELETE USING (true);

-- Make user_id nullable since no auth
ALTER TABLE public.invoices ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.clients ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.payments ALTER COLUMN user_id DROP NOT NULL;

-- Remove client_id FK requirement since we'll handle clients inline
ALTER TABLE public.invoices ALTER COLUMN client_id DROP NOT NULL;
