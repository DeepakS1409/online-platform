-- V2 Online Dress Store - Core Production PostgreSQL Schema
-- Includes RLS policies, atomic functions for reservations, status transitions, and audit logs

-- Enable uuid-ossp extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    phone TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for phone lookups and role queries
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Helper function to check if user is admin safely without RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role = 'admin'
  );
$$;

-- 2. Customer Addresses Table
CREATE TABLE IF NOT EXISTS public.customer_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    recipient_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    landmark TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL DEFAULT 'Tamil Nadu',
    postal_code TEXT NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_addresses_profile_id ON public.customer_addresses(profile_id);

-- 3. Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_active_order ON public.categories(is_active, display_order);

-- 4. Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    sku TEXT NOT NULL UNIQUE,
    selling_price_paise BIGINT NOT NULL CHECK (selling_price_paise >= 0),
    purchase_cost_paise BIGINT DEFAULT 0 CHECK (purchase_cost_paise >= 0),
    packaging_cost_paise BIGINT DEFAULT 0 CHECK (packaging_cost_paise >= 0),
    stock_physical INT NOT NULL DEFAULT 0 CHECK (stock_physical >= 0),
    stock_reserved INT NOT NULL DEFAULT 0 CHECK (stock_reserved >= 0),
    low_stock_threshold INT NOT NULL DEFAULT 5 CHECK (low_stock_threshold >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT chk_available_stock CHECK (stock_physical >= stock_reserved),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active_stock ON public.products(is_active, stock_physical, stock_reserved);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);

-- 5. Product Images Table
CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    is_thumbnail BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product_order ON public.product_images(product_id, display_order);

-- 6. Inventory Movements Table
CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    change_type TEXT NOT NULL CHECK (change_type IN ('initial', 'stock_in', 'manual_adjustment', 'reservation', 'reservation_release', 'order_fulfillment', 'order_cancellation_restock')),
    quantity_change INT NOT NULL,
    stock_physical_after INT NOT NULL,
    stock_reserved_after INT NOT NULL,
    reference_order_id UUID,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inv_product_date ON public.inventory_movements(product_id, created_at DESC);

-- 7. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL UNIQUE,
    customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    delivery_address_snapshot JSONB NOT NULL,
    subtotal_paise BIGINT NOT NULL CHECK (subtotal_paise >= 0),
    delivery_charge_paise BIGINT NOT NULL DEFAULT 0 CHECK (delivery_charge_paise >= 0),
    grand_total_paise BIGINT NOT NULL CHECK (grand_total_paise >= 0),
    order_status TEXT NOT NULL DEFAULT 'awaiting_confirmation' 
        CHECK (order_status IN ('awaiting_confirmation', 'accepted', 'rejected', 'preparing', 'ready_to_ship', 'shipped', 'delivered', 'cancelled')),
    payment_status TEXT NOT NULL DEFAULT 'unpaid' 
        CHECK (payment_status IN ('unpaid', 'partially_paid', 'paid', 'refunded')),
    idempotency_key TEXT UNIQUE,
    notes TEXT,
    reservation_expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
    whatsapp_opened_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_customer ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_phone ON public.orders(customer_phone);

-- 8. Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name_snapshot TEXT NOT NULL,
    sku_snapshot TEXT NOT NULL,
    unit_price_paise BIGINT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    item_total_paise BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON public.order_items(product_id);

-- 9. Order Status History Table
CREATE TABLE IF NOT EXISTS public.order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    from_status TEXT,
    to_status TEXT NOT NULL,
    note TEXT,
    changed_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order ON public.order_status_history(order_id, created_at ASC);

-- 10. Payment Records Table
CREATE TABLE IF NOT EXISTS public.payment_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    amount_paise BIGINT NOT NULL CHECK (amount_paise > 0),
    payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('upi', 'gpay', 'phonepe', 'bank_transfer', 'cod', 'cash', 'other')),
    transaction_reference TEXT,
    notes TEXT,
    recorded_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_records_order ON public.payment_records(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_date ON public.payment_records(payment_date DESC);

-- 11. Shipments Table
CREATE TABLE IF NOT EXISTS public.shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
    shipment_token TEXT NOT NULL UNIQUE,
    qr_code_data TEXT NOT NULL,
    label_printed_at TIMESTAMPTZ,
    shipped_at TIMESTAMPTZ,
    shipped_by_admin UUID REFERENCES public.profiles(id),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipments_token ON public.shipments(shipment_token);

-- 12. Business Settings Table
CREATE TABLE IF NOT EXISTS public.business_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Initial Business Settings
INSERT INTO public.business_settings (key, value) VALUES
('store_config', '{
    "business_name": "V2 Boutique",
    "tagline": "Pure Cotton Nightwear & Intimates",
    "whatsapp_number": "917306117078",
    "contact_phone": "+91 73061 17078",
    "contact_email": "support@v2boutique.in",
    "currency_symbol": "₹",
    "default_delivery_charge_paise": 6000,
    "free_delivery_threshold_paise": 99900,
    "min_order_value_paise": 20000,
    "address": "Savithri, 2/373-2/2, Park Avenue West, Myleripalayam, Coimbatore - 641032",
    "reservation_expiry_hours": 24
}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Seed Initial Categories
INSERT INTO public.categories (name, slug, description, display_order, is_active) VALUES
('Nighty', 'nighty', 'Ultra-soft, breathable 100% pure combed cotton nighties in lovely floral and classic prints.', 1, TRUE),
('Panties', 'panties', 'Super-comfortable, hygienic, antimicrobial daily cotton briefs and stretch panties.', 2, TRUE),
('Banians', 'banians', 'High-quality pure cotton women slip vests, camisoles, and sleeveless banians.', 3, TRUE),
('Nightdress', 'nightdress', 'Modern stylish night suits, maternity night dresses, and cozy 2-piece lounge sets.', 4, TRUE),
('Inskirts (Pavadai)', 'inskirts-pavadai', 'Premium poplin and cotton inskirts with sturdy interlock stitching and drawstrings.', 5, TRUE)
ON CONFLICT (slug) DO NOTHING;

-- 13. Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL,
    actor_id UUID REFERENCES public.profiles(id),
    payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);

--------------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
--------------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read and update their own profile; Admins have full access
CREATE POLICY "Profiles read policy" ON public.profiles FOR SELECT USING (
    auth.uid() = id OR public.is_admin(auth.uid())
);
CREATE POLICY "Profiles insert policy" ON public.profiles FOR INSERT WITH CHECK (
    auth.uid() = id
);
CREATE POLICY "Profiles update policy" ON public.profiles FOR UPDATE USING (
    auth.uid() = id OR public.is_admin(auth.uid())
);

-- Addresses: Users can manage their own addresses; Admins can view
CREATE POLICY "Addresses owner policy" ON public.customer_addresses FOR ALL USING (
    profile_id = auth.uid() OR public.is_admin(auth.uid())
);

-- Categories: Public can view active categories; Admins can manage all
CREATE POLICY "Categories public read" ON public.categories FOR SELECT USING (
    is_active = TRUE OR public.is_admin(auth.uid())
);
CREATE POLICY "Categories admin write" ON public.categories FOR ALL USING (
    public.is_admin(auth.uid())
);

-- Products: Public can only see active products with positive available stock
CREATE POLICY "Products public read" ON public.products FOR SELECT USING (
    (is_active = TRUE AND (stock_physical - stock_reserved) > 0) OR public.is_admin(auth.uid())
);
CREATE POLICY "Products admin write" ON public.products FOR ALL USING (
    public.is_admin(auth.uid())
);

-- Product Images: Public can read; Admins can manage
CREATE POLICY "Product images read" ON public.product_images FOR SELECT USING (TRUE);
CREATE POLICY "Product images admin write" ON public.product_images FOR ALL USING (
    public.is_admin(auth.uid())
);

-- Orders: Customer can read their own orders; Admins can read all orders
CREATE POLICY "Orders read policy" ON public.orders FOR SELECT USING (
    customer_id = auth.uid() OR public.is_admin(auth.uid())
);
CREATE POLICY "Orders insert policy" ON public.orders FOR INSERT WITH CHECK (
    customer_id = auth.uid() OR auth.uid() IS NULL OR public.is_admin(auth.uid())
);
CREATE POLICY "Orders admin update" ON public.orders FOR UPDATE USING (
    public.is_admin(auth.uid())
);

-- Order Items: Linked to orders readable by customer or admin
CREATE POLICY "Order items read" ON public.order_items FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.orders 
        WHERE orders.id = order_items.order_id 
          AND (orders.customer_id = auth.uid() OR public.is_admin(auth.uid()))
    )
);

-- Payments: Only Admins can read and record payments
CREATE POLICY "Payments admin only" ON public.payment_records FOR ALL USING (
    public.is_admin(auth.uid())
);

-- Shipments: Admins only
CREATE POLICY "Shipments admin only" ON public.shipments FOR ALL USING (
    public.is_admin(auth.uid())
);

-- Business Settings: Public can read; Admin can update
CREATE POLICY "Business settings public read" ON public.business_settings FOR SELECT USING (TRUE);
CREATE POLICY "Business settings admin update" ON public.business_settings FOR ALL USING (
    public.is_admin(auth.uid())
);

--------------------------------------------------------------------------------
-- ATOMIC STORED PROCEDURES (Database Functions)
--------------------------------------------------------------------------------

-- 1. Create Order with Atomic Stock Reservation and Price Revalidation
CREATE OR REPLACE FUNCTION public.create_order_atomic(
    p_customer_id UUID,
    p_customer_name TEXT,
    p_customer_phone TEXT,
    p_delivery_address JSONB,
    p_items JSONB, -- Array of { product_id: UUID, quantity: INT }
    p_idempotency_key TEXT,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_existing_order_id UUID;
    v_order_id UUID;
    v_order_number TEXT;
    v_item RECORD;
    v_product RECORD;
    v_subtotal_paise BIGINT := 0;
    v_delivery_charge_paise BIGINT := 0;
    v_free_delivery_threshold_paise BIGINT := 99900;
    v_default_delivery_charge_paise BIGINT := 6000;
    v_grand_total_paise BIGINT := 0;
    v_shipment_token TEXT;
    v_settings JSONB;
BEGIN
    -- Check idempotency
    IF p_idempotency_key IS NOT NULL THEN
        SELECT id INTO v_existing_order_id FROM public.orders WHERE idempotency_key = p_idempotency_key;
        IF v_existing_order_id IS NOT NULL THEN
            RETURN jsonb_build_object('success', true, 'order_id', v_existing_order_id, 'is_duplicate', true);
        END IF;
    END IF;

    -- Load business settings
    SELECT value INTO v_settings FROM public.business_settings WHERE key = 'store_config';
    IF v_settings IS NOT NULL THEN
        v_default_delivery_charge_paise := COALESCE((v_settings->>'default_delivery_charge_paise')::BIGINT, 6000);
        v_free_delivery_threshold_paise := COALESCE((v_settings->>'free_delivery_threshold_paise')::BIGINT, 99900);
    END IF;

    -- Generate human-friendly order number (e.g. V2-20261026-9481)
    v_order_number := 'V2-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');

    -- First Pass: Lock all requested products FOR UPDATE and verify inventory
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id UUID, quantity INT)
    LOOP
        IF v_item.quantity <= 0 THEN
            RAISE EXCEPTION 'Item quantity must be greater than zero.';
        END IF;

        -- Lock product row to prevent race conditions
        SELECT * INTO v_product FROM public.products 
        WHERE id = v_item.product_id AND is_active = TRUE 
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product % is not available or has been discontinued.', v_item.product_id;
        END IF;

        IF (v_product.stock_physical - v_product.stock_reserved) < v_item.quantity THEN
            RAISE EXCEPTION 'Insufficient stock for "%". Available: %, Requested: %', 
                v_product.name, (v_product.stock_physical - v_product.stock_reserved), v_item.quantity;
        END IF;

        -- Calculate item total using database unit price
        v_subtotal_paise := v_subtotal_paise + (v_product.selling_price_paise * v_item.quantity);
    END LOOP;

    -- Compute delivery charge
    IF v_subtotal_paise >= v_free_delivery_threshold_paise THEN
        v_delivery_charge_paise := 0;
    ELSE
        v_delivery_charge_paise := v_default_delivery_charge_paise;
    END IF;

    v_grand_total_paise := v_subtotal_paise + v_delivery_charge_paise;

    -- Insert Order Record
    INSERT INTO public.orders (
        order_number,
        customer_id,
        customer_name,
        customer_phone,
        delivery_address_snapshot,
        subtotal_paise,
        delivery_charge_paise,
        grand_total_paise,
        order_status,
        payment_status,
        idempotency_key,
        notes
    ) VALUES (
        v_order_number,
        p_customer_id,
        p_customer_name,
        p_customer_phone,
        p_delivery_address,
        v_subtotal_paise,
        v_delivery_charge_paise,
        v_grand_total_paise,
        'awaiting_confirmation',
        'unpaid',
        p_idempotency_key,
        p_notes
    ) RETURNING id INTO v_order_id;

    -- Second Pass: Insert Order Items, Reserve Stock Atomically, Record Inventory Movements
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id UUID, quantity INT)
    LOOP
        SELECT * INTO v_product FROM public.products WHERE id = v_item.product_id;

        -- Insert order item with frozen price snapshot
        INSERT INTO public.order_items (
            order_id,
            product_id,
            product_name_snapshot,
            sku_snapshot,
            unit_price_paise,
            quantity,
            item_total_paise
        ) VALUES (
            v_order_id,
            v_product.id,
            v_product.name,
            v_product.sku,
            v_product.selling_price_paise,
            v_item.quantity,
            (v_product.selling_price_paise * v_item.quantity)
        );

        -- Atomically reserve stock
        UPDATE public.products 
        SET stock_reserved = stock_reserved + v_item.quantity,
            updated_at = NOW()
        WHERE id = v_item.product_id;

        -- Record inventory movement
        INSERT INTO public.inventory_movements (
            product_id,
            change_type,
            quantity_change,
            stock_physical_after,
            stock_reserved_after,
            reference_order_id,
            notes
        ) VALUES (
            v_item.product_id,
            'reservation',
            v_item.quantity,
            v_product.stock_physical,
            v_product.stock_reserved + v_item.quantity,
            v_order_id,
            'Reserved upon order creation ' || v_order_number
        );
    END LOOP;

    -- Generate Shipment Record with Secure Token for QR code
    v_shipment_token := encode(gen_random_bytes(16), 'hex');
    INSERT INTO public.shipments (
        order_id,
        shipment_token,
        qr_code_data
    ) VALUES (
        v_order_id,
        v_shipment_token,
        'V2-SHIP:' || v_shipment_token
    );

    -- Log initial status history
    INSERT INTO public.order_status_history (
        order_id,
        from_status,
        to_status,
        note
    ) VALUES (
        v_order_id,
        NULL,
        'awaiting_confirmation',
        'Order submitted by customer'
    );

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'order_number', v_order_number,
        'grand_total_paise', v_grand_total_paise,
        'subtotal_paise', v_subtotal_paise,
        'delivery_charge_paise', v_delivery_charge_paise,
        'shipment_token', v_shipment_token
    );
END;
$$;

-- 2. Accept Order Atomically
CREATE OR REPLACE FUNCTION public.accept_order_atomic(
    p_order_id UUID,
    p_admin_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_status TEXT;
BEGIN
    SELECT order_status INTO v_current_status FROM public.orders WHERE id = p_order_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found.';
    END IF;

    IF v_current_status != 'awaiting_confirmation' THEN
        RAISE EXCEPTION 'Only orders awaiting confirmation can be accepted. Current status is %', v_current_status;
    END IF;

    UPDATE public.orders 
    SET order_status = 'accepted', updated_at = NOW() 
    WHERE id = p_order_id;

    INSERT INTO public.order_status_history (
        order_id, from_status, to_status, note, changed_by
    ) VALUES (
        p_order_id, v_current_status, 'accepted', 'Order accepted by store admin', p_admin_id
    );

    RETURN jsonb_build_object('success', true, 'new_status', 'accepted');
END;
$$;

-- 3. Cancel Order Atomically (Releases Reserved Stock)
CREATE OR REPLACE FUNCTION public.cancel_order_atomic(
    p_order_id UUID,
    p_reason TEXT,
    p_cancelled_by UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order RECORD;
    v_item RECORD;
    v_product RECORD;
BEGIN
    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found.';
    END IF;

    IF v_order.order_status IN ('cancelled', 'shipped', 'delivered') THEN
        RAISE EXCEPTION 'Cannot cancel an order in % status.', v_order.order_status;
    END IF;

    -- Release reserved stock for each item in the order
    FOR v_item IN SELECT * FROM public.order_items WHERE order_id = p_order_id
    LOOP
        SELECT * INTO v_product FROM public.products WHERE id = v_item.product_id FOR UPDATE;
        IF FOUND THEN
            UPDATE public.products 
            SET stock_reserved = GREATEST(0, stock_reserved - v_item.quantity),
                updated_at = NOW()
            WHERE id = v_item.product_id;

            INSERT INTO public.inventory_movements (
                product_id,
                change_type,
                quantity_change,
                stock_physical_after,
                stock_reserved_after,
                reference_order_id,
                notes,
                created_by
            ) VALUES (
                v_item.product_id,
                'reservation_release',
                -v_item.quantity,
                v_product.stock_physical,
                GREATEST(0, v_product.stock_reserved - v_item.quantity),
                p_order_id,
                'Stock released on order cancellation: ' || COALESCE(p_reason, 'No reason given'),
                p_cancelled_by
            );
        END IF;
    END LOOP;

    -- Update order status
    UPDATE public.orders 
    SET order_status = 'cancelled', updated_at = NOW() 
    WHERE id = p_order_id;

    INSERT INTO public.order_status_history (
        order_id, from_status, to_status, note, changed_by
    ) VALUES (
        p_order_id, v_order.order_status, 'cancelled', p_reason, p_cancelled_by
    );

    RETURN jsonb_build_object('success', true, 'new_status', 'cancelled');
END;
$$;

-- 4. Ship Order Atomically by QR Shipment Token
CREATE OR REPLACE FUNCTION public.ship_order_by_token_atomic(
    p_shipment_token TEXT,
    p_admin_id UUID,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_shipment RECORD;
    v_order RECORD;
    v_item RECORD;
    v_product RECORD;
BEGIN
    SELECT * INTO v_shipment FROM public.shipments WHERE shipment_token = p_shipment_token FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid or unrecognized QR shipment token.';
    END IF;

    SELECT * INTO v_order FROM public.orders WHERE id = v_shipment.order_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Associated order not found.';
    END IF;

    IF v_order.order_status = 'shipped' THEN
        RAISE EXCEPTION 'Order % has already been marked as shipped on %.', v_order.order_number, v_shipment.shipped_at;
    END IF;

    IF v_order.order_status = 'cancelled' THEN
        RAISE EXCEPTION 'Cannot ship cancelled order %.', v_order.order_number;
    END IF;

    -- Deduct physical stock and release reservation simultaneously
    FOR v_item IN SELECT * FROM public.order_items WHERE order_id = v_order.id
    LOOP
        SELECT * INTO v_product FROM public.products WHERE id = v_item.product_id FOR UPDATE;
        IF FOUND THEN
            UPDATE public.products 
            SET stock_physical = GREATEST(0, stock_physical - v_item.quantity),
                stock_reserved = GREATEST(0, stock_reserved - v_item.quantity),
                updated_at = NOW()
            WHERE id = v_item.product_id;

            INSERT INTO public.inventory_movements (
                product_id,
                change_type,
                quantity_change,
                stock_physical_after,
                stock_reserved_after,
                reference_order_id,
                notes,
                created_by
            ) VALUES (
                v_item.product_id,
                'order_fulfillment',
                -v_item.quantity,
                GREATEST(0, v_product.stock_physical - v_item.quantity),
                GREATEST(0, v_product.stock_reserved - v_item.quantity),
                v_order.id,
                'Dispatched via QR scan by admin',
                p_admin_id
            );
        END IF;
    END LOOP;

    -- Update shipment record
    UPDATE public.shipments 
    SET shipped_at = NOW(),
        shipped_by_admin = p_admin_id,
        notes = p_notes
    WHERE id = v_shipment.id;

    -- Update order status
    UPDATE public.orders 
    SET order_status = 'shipped', updated_at = NOW() 
    WHERE id = v_order.id;

    -- Record status history
    INSERT INTO public.order_status_history (
        order_id, from_status, to_status, note, changed_by
    ) VALUES (
        v_order.id, v_order.order_status, 'shipped', 'Parcel scanned and confirmed for shipment', p_admin_id
    );

    RETURN jsonb_build_object(
        'success', true, 
        'order_id', v_order.id,
        'order_number', v_order.order_number,
        'shipped_at', NOW()
    );
END;
$$;

-- 5. Record Payment Atomically
CREATE OR REPLACE FUNCTION public.record_payment_atomic(
    p_order_id UUID,
    p_amount_paise BIGINT,
    p_payment_method TEXT,
    p_transaction_ref TEXT,
    p_notes TEXT,
    p_admin_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order RECORD;
    v_total_paid BIGINT := 0;
    v_new_payment_status TEXT;
BEGIN
    IF p_amount_paise <= 0 THEN
        RAISE EXCEPTION 'Payment amount must be greater than zero.';
    END IF;

    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found.';
    END IF;

    -- Insert payment record
    INSERT INTO public.payment_records (
        order_id,
        amount_paise,
        payment_method,
        transaction_reference,
        notes,
        recorded_by
    ) VALUES (
        p_order_id,
        p_amount_paise,
        p_payment_method,
        p_transaction_ref,
        p_notes,
        p_admin_id
    );

    -- Calculate total paid
    SELECT COALESCE(SUM(amount_paise), 0) INTO v_total_paid 
    FROM public.payment_records 
    WHERE order_id = p_order_id;

    IF v_total_paid >= v_order.grand_total_paise THEN
        v_new_payment_status := 'paid';
    ELSE
        v_new_payment_status := 'partially_paid';
    END IF;

    UPDATE public.orders 
    SET payment_status = v_new_payment_status, updated_at = NOW() 
    WHERE id = p_order_id;

    RETURN jsonb_build_object(
        'success', true,
        'total_paid_paise', v_total_paid,
        'grand_total_paise', v_order.grand_total_paise,
        'outstanding_paise', GREATEST(0, v_order.grand_total_paise - v_total_paid),
        'payment_status', v_new_payment_status
    );
END;
$$;
