/*
  # Add Push Subscriptions Table and Fix Security Advisories

  ## Query Description:
  This migration creates a new table for storing Web Push subscriptions and enables Row Level Security (RLS) on all tables to address security advisories.
  
  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Medium"
  - Requires-Backup: false
  - Reversible: true
  
  ## Structure Details:
  - Create table: `admin_push_subscriptions`
  - Enable RLS on: `admin_push_subscriptions`, `products`, `categories`, `winning_photos`, `site_settings`, `purchase_images`, `purchase_intents`, `invoice_templates`, `product_keys`, `user_notifications`
  
  ## Security Implications:
  - RLS Status: Enabled for all tables
  - Policy Changes: Adds policies for the new table
*/

-- 1. Create the table for Push Subscriptions
CREATE TABLE IF NOT EXISTS public.admin_push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable RLS on the new table
ALTER TABLE public.admin_push_subscriptions ENABLE ROW LEVEL SECURITY;

-- 3. Create Policy to allow authenticated users (Admins) to manage subscriptions
-- We use ON CONFLICT in the frontend, so we need INSERT and UPDATE permissions.
CREATE POLICY "Allow authenticated users to insert subscriptions"
ON public.admin_push_subscriptions
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read subscriptions"
ON public.admin_push_subscriptions
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to update subscriptions"
ON public.admin_push_subscriptions
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to delete subscriptions"
ON public.admin_push_subscriptions
FOR DELETE
TO authenticated
USING (true);

-- 4. Fix Security Advisories: Enable RLS on ALL public tables
-- This addresses the "[ERROR] Policy Exists RLS Disabled" and "[ERROR] RLS Disabled in Public" advisories.

DO $$
BEGIN
    -- Products
    EXECUTE 'ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY';
    
    -- Categories
    EXECUTE 'ALTER TABLE IF EXISTS public.categories ENABLE ROW LEVEL SECURITY';
    
    -- Winning Photos
    EXECUTE 'ALTER TABLE IF EXISTS public.winning_photos ENABLE ROW LEVEL SECURITY';
    
    -- Site Settings
    EXECUTE 'ALTER TABLE IF EXISTS public.site_settings ENABLE ROW LEVEL SECURITY';
    
    -- Purchase Images
    EXECUTE 'ALTER TABLE IF EXISTS public.purchase_images ENABLE ROW LEVEL SECURITY';
    
    -- Purchase Intents
    EXECUTE 'ALTER TABLE IF EXISTS public.purchase_intents ENABLE ROW LEVEL SECURITY';
    
    -- Invoice Templates
    EXECUTE 'ALTER TABLE IF EXISTS public.invoice_templates ENABLE ROW LEVEL SECURITY';
    
    -- Product Keys
    EXECUTE 'ALTER TABLE IF EXISTS public.product_keys ENABLE ROW LEVEL SECURITY';
    
    -- User Notifications
    EXECUTE 'ALTER TABLE IF EXISTS public.user_notifications ENABLE ROW LEVEL SECURITY';
    
END $$;
