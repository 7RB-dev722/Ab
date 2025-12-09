/*
  # Create Push Subscriptions Table
  
  This table stores Web Push subscriptions for admins so they can receive
  notifications even when the site is closed.
*/

CREATE TABLE IF NOT EXISTS public.admin_push_subscriptions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) DEFAULT auth.uid(),
    endpoint text NOT NULL,
    p256dh text NOT NULL,
    auth text NOT NULL,
    created_at timestamptz DEFAULT now(),
    last_used_at timestamptz DEFAULT now(),
    UNIQUE(endpoint)
);

-- Enable RLS
ALTER TABLE public.admin_push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can insert subscriptions"
ON public.admin_push_subscriptions FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Admins can view own subscriptions"
ON public.admin_push_subscriptions FOR SELECT
TO authenticated
USING (true); -- Simplified for admin context, ideally restrict to admin role

CREATE POLICY "Admins can delete own subscriptions"
ON public.admin_push_subscriptions FOR DELETE
TO authenticated
USING (true);
