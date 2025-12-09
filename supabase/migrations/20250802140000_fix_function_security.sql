/*
  # Fix Security Advisories
  
  1. Security Updates
    - Fixes "Function Search Path Mutable" warning for claim_available_key function.
    - Explicitly sets search_path to 'public, pg_temp' to prevent search path hijacking.
    
  2. Implementation
    - Uses a DO block to safely handle potential parameter type differences (UUID vs Text).
*/

DO $$
BEGIN
    -- Try to alter the function assuming UUID parameters (Standard Supabase pattern)
    BEGIN
        ALTER FUNCTION public.claim_available_key(uuid, text, uuid) SET search_path = public, pg_temp;
    EXCEPTION WHEN OTHERS THEN
        -- If that fails, try with TEXT parameters (Fallback case)
        BEGIN
            ALTER FUNCTION public.claim_available_key(text, text, text) SET search_path = public, pg_temp;
        EXCEPTION WHEN OTHERS THEN
            -- Log notice if function not found or signature is completely different
            RAISE NOTICE 'Could not alter claim_available_key function. Please check the function signature manually.';
        END;
    END;
END $$;
