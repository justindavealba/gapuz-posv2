-- Fixes the "Security Definer View" warnings from Supabase's linter for
-- sales_summary, product_sales, and customer_loyalty. These views were
-- created without security_invoker, so Postgres defaulted them to running
-- with the view owner's privileges — which bypasses each table's Row Level
-- Security instead of respecting the querying user's own permissions.
--
-- Run this once in Supabase Dashboard -> SQL Editor -> New query -> Run.
-- Safe to re-run.

ALTER VIEW sales_summary    SET (security_invoker = true);
ALTER VIEW product_sales    SET (security_invoker = true);
ALTER VIEW customer_loyalty SET (security_invoker = true);
