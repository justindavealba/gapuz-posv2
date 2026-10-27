-- Adds an `active` column to profiles so cashier accounts can be
-- suspended/reactivated without deleting them. schema.sql already includes
-- this column for fresh installs.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;
