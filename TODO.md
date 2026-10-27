> **Instructions for Claude:** this file is the running task list for this project.
> Whenever the user says an item below is done (or you finish it yourself), mark
> it `- [x]` and add a one-line note of what was actually done underneath it —
> no need to be asked to update this file each time, just do it as part of
> wrapping up that task. Leave items the user hasn't confirmed as `- [ ]`. Add
> new items under "Future Improvements" as they come up in conversation.

# Pending — Supabase setup for Add Cashier feature

Project ref: `mnoyuavnjundfwfmlnkt`

## 1. Run the DB migration — ✅ Done
`supabase/add_email_to_profiles.sql` has been applied (adds + backfills the
`email` column on `profiles`).

## 2. Deploy the new edge function — ✅ Done
`create-cashier` and `update-staff` are both deployed. "+ Add Cashier" and
"Edit" on the Staff Accounts page (admin-only, `/staff`) work.

## 3. (Optional) Custom SMTP for Auth emails
Supabase's default auth email sender is rate-limited. To raise the limit for
password-reset/signup emails, enable custom SMTP:
Dashboard → Project Settings → Authentication → SMTP Settings → use the same
Brevo SMTP login/key already set up for `send-receipt`.
Field values: host `smtp-relay.brevo.com`, port `465`, username = `BREVO_SMTP_LOGIN`,
password = `BREVO_SMTP_KEY`, sender email = your verified `SENDER_EMAIL`.

## 4. (Optional) Clean up unused edge function
`check-email` is no longer called anywhere in the app (the forgot-password flow
no longer checks if an email is registered, to avoid leaking that info). Safe
to remove with `supabase functions delete check-email` if you want to tidy up.

---

# Future Improvements (working through these one by one)

## Staff accounts
- [x] Deactivate/suspend a cashier account without deleting it — useful when
      someone leaves or is on leave, without losing their transaction history
      attribution.
      Done: added `active` column to `profiles` (migration
      `add_active_to_profiles.sql`), new `toggle-staff-status` edge function
      (bans/unbans via GoTrue's admin API so suspension actually blocks
      login, not just an app-side flag), Status column + Suspend/Reactivate
      button on `/staff` (cashier rows only), and a clear "account suspended"
      message on the login page instead of a generic error.

## Reliability
- [ ] Brevo's free tier caps at 300 emails/day — fine for now, but worth
      tracking if the shop's volume grows.
- [ ] No activity/audit log (who processed a refund, deleted a product, etc.) —
      would help if disputes ever come up.

## Reports
- [ ] Scheduled daily/weekly sales summary emailed to the admin (via the Brevo
      setup already in place), instead of manually checking the Reports page.

## Inventory
- [ ] Proactive low-stock alert (email/notification) when a product actually
      hits zero, instead of only showing a badge on the Products page.

## Data safety
- [ ] Confirm the Supabase plan includes backups/point-in-time recovery — a
      real gap on the free tier for a system handling live transactions and
      customer data.

## Product icons (follow-up to the category-icon fallback)
- [ ] Extend the same category-icon fallback to Cart line items, Dashboard's
      Top Products/Best Seller card, and Reports tables.
- [ ] Preview the category icon live in the Add/Edit Product modal's image
      upload placeholder (currently a generic camera icon).
- [ ] Let admins override the auto-matched icon per category, for categories
      the keyword matching doesn't handle well.
