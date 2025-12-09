/*
  # Fix Function Search Path Security Warning
  
  This migration explicitly sets the search_path for the claim_available_key function
  to 'public, pg_temp' to prevent search path hijacking attacks.
  
  ## Security Implications
  - Fixes [WARN] Function Search Path Mutable
  - Ensures the function only executes code from trusted schemas
*/

-- Secure the claim_available_key function
ALTER FUNCTION public.claim_available_key(uuid, text, uuid) SET search_path = public, pg_temp;

-- Create the admin_push_subscriptions table if it doesn't exist (idempotent check)
CREATE TABLE IF NOT EXISTS public.admin_push_subscriptions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    endpoint text NOT NULL UNIQUE,
    p256dh text NOT NULL,
    auth text NOT NULL,
    created_at timestamptz DEFAULT now(),
    last_used_at timestamptz DEFAULT now()
);

-- Enable RLS on the subscriptions table
ALTER TABLE public.admin_push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anon insert (for initial subscription) and authenticated management
CREATE POLICY "Allow anon insert for push subscriptions"
ON public.admin_push_subscriptions
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow service_role full access"
ON public.admin_push_subscriptions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
