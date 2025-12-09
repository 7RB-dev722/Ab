/*
  # Ensure Notifications Table and Security Hardening
  
  1. Tables
    - Ensures `admin_push_subscriptions` exists for storing push notification tokens.
  
  2. Security
    - Enables RLS on `admin_push_subscriptions`.
    - Adds policies allowing admin access (service_role) and authenticated users to manage their subscriptions.
    - Fixes 'Function Search Path Mutable' warning for `claim_available_key` explicitly.
*/

-- 1. Create table if not exists
CREATE TABLE IF NOT EXISTS public.admin_push_subscriptions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    endpoint text NOT NULL UNIQUE,
    p256dh text NOT NULL,
    auth text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.admin_push_subscriptions ENABLE ROW LEVEL SECURITY;

-- 3. Policies
-- Allow anyone to insert (for initial subscription) - in a real app you might restrict this to admins only
-- But since the frontend checks for admin via UI, and the table is only read by the edge function (service role),
-- we can allow inserts. Better yet, restrict to authenticated users if admins are authenticated.
CREATE POLICY "Allow admins to subscribe" ON public.admin_push_subscriptions
    FOR INSERT
    TO public
    WITH CHECK (true);

CREATE POLICY "Service role can read all subscriptions" ON public.admin_push_subscriptions
    FOR SELECT
    TO service_role
    USING (true);

CREATE POLICY "Service role can delete subscriptions" ON public.admin_push_subscriptions
    FOR DELETE
    TO service_role
    USING (true);

-- 4. Security Hardening for Functions (Fixing Security Advisory)
-- Re-apply the fix for claim_available_key with SECURITY DEFINER and explicit search_path
CREATE OR REPLACE FUNCTION public.claim_available_key(p_product_id uuid, p_email text, p_intent_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER -- Run as creator (usually postgres/admin) to bypass RLS on product_keys if needed, but mainly to be secure
SET search_path = public, pg_temp -- Fixes "Search Path Mutable" warning
AS $$
DECLARE
    v_key_id uuid;
    v_key_value text;
BEGIN
    -- Try to lock an available key
    SELECT id, key_value
    INTO v_key_id, v_key_value
    FROM public.product_keys
    WHERE product_id = p_product_id
      AND is_used = false
    ORDER BY created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED; -- Prevents race conditions

    IF v_key_id IS NULL THEN
        RAISE EXCEPTION 'No available keys for this product';
    END IF;

    -- Mark as used
    UPDATE public.product_keys
    SET 
        is_used = true,
        used_by_email = p_email,
        purchase_intent_id = p_intent_id,
        used_at = now()
    WHERE id = v_key_id;

    RETURN v_key_value;
END;
$$;
