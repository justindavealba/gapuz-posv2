-- Migration: lets an admin manually pin an icon to a category, for ones the
-- keyword-based auto-icon matching doesn't handle well — run this once in
-- Supabase Dashboard -> SQL Editor -> New query -> Run.

ALTER TABLE categories ADD COLUMN icon VARCHAR(30);
