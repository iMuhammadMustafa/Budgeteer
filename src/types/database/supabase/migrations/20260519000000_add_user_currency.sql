-- Add primary currency to profiles so each user has a default
-- display currency that drives all amount displays and the
-- transaction-form currency picker.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'USD';
