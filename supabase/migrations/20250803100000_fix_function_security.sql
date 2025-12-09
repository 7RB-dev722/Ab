/*
  # Fix Function Security Warnings
  Resolves "Function Search Path Mutable" warning by explicitly setting search_path.

  ## Query Description: This operation secures database functions by setting a fixed search_path, preventing potential search path hijacking attacks. It is a safe, structural change.
  
  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true
  
  ## Structure Details:
  - Alters function `claim_available_key` to set search_path = public
  
  ## Security Implications:
  - Improves security by preventing search path manipulation
*/

-- Fix search_path for claim_available_key if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'claim_available_key') THEN
        ALTER FUNCTION public.claim_available_key(uuid, text, uuid) SET search_path = public;
    END IF;
END $$;
