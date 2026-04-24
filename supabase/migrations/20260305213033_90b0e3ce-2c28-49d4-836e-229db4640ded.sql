
-- Drop existing RLS policies on ERP tables and replace with public access
-- Products
DROP POLICY IF EXISTS "Users can view own products" ON public.products;
DROP POLICY IF EXISTS "Users can insert own products" ON public.products;
DROP POLICY IF EXISTS "Users can update own products" ON public.products;
DROP POLICY IF EXISTS "Users can delete own products" ON public.products;
CREATE POLICY "Public select products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public insert products" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update products" ON public.products FOR UPDATE USING (true);
CREATE POLICY "Public delete products" ON public.products FOR DELETE USING (true);

-- Stock movements
DROP POLICY IF EXISTS "Users can view own stock movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Users can insert own stock movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Users can delete own stock movements" ON public.stock_movements;
CREATE POLICY "Public select stock_movements" ON public.stock_movements FOR SELECT USING (true);
CREATE POLICY "Public insert stock_movements" ON public.stock_movements FOR INSERT WITH CHECK (true);
CREATE POLICY "Public delete stock_movements" ON public.stock_movements FOR DELETE USING (true);

-- Purchase orders
DROP POLICY IF EXISTS "Users can view own POs" ON public.purchase_orders;
DROP POLICY IF EXISTS "Users can insert own POs" ON public.purchase_orders;
DROP POLICY IF EXISTS "Users can update own POs" ON public.purchase_orders;
DROP POLICY IF EXISTS "Users can delete own POs" ON public.purchase_orders;
CREATE POLICY "Public select purchase_orders" ON public.purchase_orders FOR SELECT USING (true);
CREATE POLICY "Public insert purchase_orders" ON public.purchase_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update purchase_orders" ON public.purchase_orders FOR UPDATE USING (true);
CREATE POLICY "Public delete purchase_orders" ON public.purchase_orders FOR DELETE USING (true);

-- Purchase order items
DROP POLICY IF EXISTS "Users can view own PO items" ON public.purchase_order_items;
DROP POLICY IF EXISTS "Users can insert own PO items" ON public.purchase_order_items;
DROP POLICY IF EXISTS "Users can update own PO items" ON public.purchase_order_items;
DROP POLICY IF EXISTS "Users can delete own PO items" ON public.purchase_order_items;
CREATE POLICY "Public select purchase_order_items" ON public.purchase_order_items FOR SELECT USING (true);
CREATE POLICY "Public insert purchase_order_items" ON public.purchase_order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update purchase_order_items" ON public.purchase_order_items FOR UPDATE USING (true);
CREATE POLICY "Public delete purchase_order_items" ON public.purchase_order_items FOR DELETE USING (true);

-- Expenses
DROP POLICY IF EXISTS "Users can view own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can insert own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can update own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can delete own expenses" ON public.expenses;
CREATE POLICY "Public select expenses" ON public.expenses FOR SELECT USING (true);
CREATE POLICY "Public insert expenses" ON public.expenses FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update expenses" ON public.expenses FOR UPDATE USING (true);
CREATE POLICY "Public delete expenses" ON public.expenses FOR DELETE USING (true);

-- Employees
DROP POLICY IF EXISTS "Users can view own employees" ON public.employees;
DROP POLICY IF EXISTS "Users can insert own employees" ON public.employees;
DROP POLICY IF EXISTS "Users can update own employees" ON public.employees;
DROP POLICY IF EXISTS "Users can delete own employees" ON public.employees;
CREATE POLICY "Public select employees" ON public.employees FOR SELECT USING (true);
CREATE POLICY "Public insert employees" ON public.employees FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update employees" ON public.employees FOR UPDATE USING (true);
CREATE POLICY "Public delete employees" ON public.employees FOR DELETE USING (true);

-- Make user_id nullable on all ERP tables since we no longer require auth
ALTER TABLE public.products ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.stock_movements ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.purchase_orders ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.expenses ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.employees ALTER COLUMN user_id DROP NOT NULL;
