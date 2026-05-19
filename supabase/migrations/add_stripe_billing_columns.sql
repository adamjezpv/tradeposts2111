-- Add Stripe billing columns to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
