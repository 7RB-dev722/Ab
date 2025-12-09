/*
  # Fix Function Search Path Security
  
  ## Security Fixes
  - Sets explicit search_path for 'claim_available_key' function to prevent search path hijacking.
  - This resolves the [WARN] Function Search Path Mutable advisory.
  
  ## Notes
  - We are skipping 'pg_leaked_password' extension as it is not available in this environment.
*/

-- Secure the claim_available_key function by setting a fixed search_path
ALTER FUNCTION public.claim_available_key(uuid, text, uuid) SET search_path = public, extensions;
