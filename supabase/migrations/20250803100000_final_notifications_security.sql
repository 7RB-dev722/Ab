/*
  # Final Notification Setup & Security Fixes
  
  1. New Tables
    - `admin_push_subscriptions` for storing Web Push credentials
  
  2. Security
    - Enable RLS on `admin_push_subscriptions`
    - Add policies for authenticated admins
    - Fix "Function Search Path Mutable" warning for `claim_available_key` by explicitly setting search_path
*/

-- 1. Create Notification Subscriptions Table
CREATE TABLE IF NOT EXISTS public.admin_push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable Security (RLS)
ALTER TABLE public.admin_push_subscriptions ENABLE ROW LEVEL SECURITY;

-- 3. Create Policies (Idempotent)
DO $$ 
BEGIN
    -- Policy for Insert (Admins subscribing)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'admin_push_subscriptions' AND policyname = 'Allow admins to subscribe'
    ) THEN
        CREATE POLICY "Allow admins to subscribe"
        ON public.admin_push_subscriptions
        FOR INSERT
        TO authenticated
        WITH CHECK (true);
    END IF;

    -- Policy for Select (Service Role / Edge Function needs to read this)
    -- Note: Service role bypasses RLS, but we add this for completeness if needed by authenticated users
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'admin_push_subscriptions' AND policyname = 'Allow admins to read subscriptions'
    ) THEN
        CREATE POLICY "Allow admins to read subscriptions"
        ON public.admin_push_subscriptions
        FOR SELECT
        TO authenticated
        USING (true);
    END IF;
    
    -- Policy for Update/Delete (Maintenance)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'admin_push_subscriptions' AND policyname = 'Allow admins to manage subscriptions'
    ) THEN
        CREATE POLICY "Allow admins to manage subscriptions"
        ON public.admin_push_subscriptions
        FOR ALL
        TO authenticated
        USING (true);
    END IF;
END $$;

-- 4. Fix Security Advisory: Function Search Path Mutable
-- We recreate the function with 'SET search_path = public' to prevent search path hijacking
CREATE OR REPLACE FUNCTION public.claim_available_key(
    p_product_id UUID,
    p_email TEXT,
    p_intent_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp -- FIX: Explicitly set search path
AS $$
DECLARE
    v_key_id UUID;
    v_key_value TEXT;
BEGIN
    -- Find an available key for the product
    SELECT id, key_value INTO v_key_id, v_key_value
    FROM product_keys
    WHERE product_id = p_product_id
      AND is_used = false
    LIMIT 1
    FOR UPDATE SKIP LOCKED;

    -- If no key found, raise exception
    IF v_key_id IS NULL THEN
        RAISE EXCEPTION 'No available keys for this product';
    END IF;

    -- Mark key as used
    UPDATE product_keys
    SET 
        is_used = true,
        used_by_email = p_email,
        purchase_intent_id = p_intent_id,
        used_at = now()
    WHERE id = v_key_id;

    RETURN v_key_value;
END;
$$;
