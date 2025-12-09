/*
  # Recreate claim_available_key Function
  
  This migration fixes the "function does not exist" error by fully recreating the function
  instead of just trying to alter it. It also applies the security fix for search_path.

  ## Changes
  - Drops existing function to avoid signature conflicts
  - Creates claim_available_key with correct parameters and secure search_path
  - Ensures proper permissions

  ## Security
  - SECURITY DEFINER: Function runs with privileges of the creator
  - search_path=public: Prevents search_path hijacking attacks
*/

-- Drop potential existing variations to ensure a clean slate
DROP FUNCTION IF EXISTS public.claim_available_key(uuid, text, uuid);
DROP FUNCTION IF EXISTS public.claim_available_key(uuid, text, text);

-- Recreate the function securely
CREATE OR REPLACE FUNCTION public.claim_available_key(
    p_product_id UUID,
    p_email TEXT,
    p_intent_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public -- Security Fix: Explicitly set search_path
AS $$
DECLARE
    v_key_id UUID;
    v_key_value TEXT;
BEGIN
    -- Find an available key for the product
    -- Lock the row to prevent race conditions (SKIP LOCKED allows concurrent transactions to skip locked rows)
    SELECT id, key_value
    INTO v_key_id, v_key_value
    FROM public.product_keys
    WHERE product_id = p_product_id
      AND is_used = false
    LIMIT 1
    FOR UPDATE SKIP LOCKED;

    IF v_key_id IS NULL THEN
        RAISE EXCEPTION 'No available keys for this product';
    END IF;

    -- Update the key as used
    UPDATE public.product_keys
    SET 
        is_used = true,
        used_by_email = p_email,
        purchase_intent_id = p_intent_id,
        used_at = NOW()
    WHERE id = v_key_id;

    RETURN v_key_value;
END;
$$;

-- Grant execute permission to authenticated and anon users (needed for the API to call it)
GRANT EXECUTE ON FUNCTION public.claim_available_key(uuid, text, uuid) TO anon, authenticated, service_role;
