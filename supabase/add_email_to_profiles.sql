-- Adds an email column to profiles so the admin's Staff Accounts page can list
-- everyone (name + email + role) without an extra admin-API round trip per view.
-- Run once in the Supabase Dashboard -> SQL Editor on an already-deployed
-- database. schema.sql already includes this column for fresh installs.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email VARCHAR(100);

-- Backfill existing accounts (e.g. the original admin) from auth.users.
UPDATE profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;
