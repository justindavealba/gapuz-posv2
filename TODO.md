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
      message on the login page instead of a generic error. Suspend/Reactivate
      use a themed confirm modal (not a browser popup) with a loading spinner,
      not window.confirm.
- [x] Permanent delete for a mistakenly-created account.
      Done: new `delete-staff` edge function — blocks deleting your own
      account or the only remaining admin; Delete button + confirm modal on
      every row except the signed-in admin's own.
- [x] Promote a cashier to admin (or demote an admin back to cashier).
      Done: Role dropdown added to the Edit Staff modal (edit mode only),
      with an inline warning that the change is immediate; `update-staff`
      blocks demoting the only remaining admin.
- [x] Search/filter on the staff list.
      Done: search box above the table filters by name/email, client-side.

## Reliability
- [ ] Brevo's free tier caps at 300 emails/day — fine for now, but worth
      tracking if the shop's volume grows.
- [x] No activity/audit log (who processed a refund, deleted a product, etc.) —
      would help if disputes ever come up.
      Done: new `activity_log` table (migration `add_activity_log.sql` — run
      this manually in the Supabase SQL editor, same as the other
      migrations) with RLS restricting reads to admins and no UPDATE/DELETE
      policies, so entries can't be edited or removed through the app once
      written. Logs staff create/update/suspend/reactivate/delete, product
      create/update/delete/restock, category create/delete, customer delete,
      and refund submit/approve/reject, each with the actor's name. New
      admin-only "Activity Log" page under Management, with search and
      pagination.

## Reports
- [ ] Scheduled daily/weekly sales summary emailed to the admin (via the Brevo
      setup already in place), instead of manually checking the Reports page.

## Inventory
- [x] Proactive low-stock alert (email/notification) when a product actually
      hits zero, instead of only showing a badge on the Products page.
      Done: new `send-low-stock-alert` edge function (reuses the existing
      Brevo SMTP secrets) emails every active admin with an email on file.
      Triggered client-side the moment a product's stock crosses from above
      zero to zero — at checkout (`deductStock`) and on a manual stock edit
      (`updateProduct`) — not on a poll, so it fires once per event, not
      repeatedly. Needs `supabase functions deploy send-low-stock-alert`.

## Data safety
- [ ] Confirm the Supabase plan includes backups/point-in-time recovery — a
      real gap on the free tier for a system handling live transactions and
      customer data.

## Product icons (follow-up to the category-icon fallback)
- [x] Extend the same category-icon fallback to Cart line items, Dashboard's
      Top Products/Best Seller card, and Reports tables.
      Done: new shared `ProductThumb` component (`src/components/ProductThumb.jsx`)
      wraps the photo → emoji → category-icon fallback Products.jsx already had,
      now reused in Cart line items, every Top/Least Selling Products list on
      Dashboard (all three tabs) and the standalone Reports page, plus Reports'
      Old/Low/New Stock lists and the Loss tab's three tables.
- [x] Preview the category icon live in the Add/Edit Product modal's image
      upload placeholder (currently a generic camera icon).
      Done: swapped the placeholder for `ProductThumb`, so with no photo
      uploaded it now shows the selected category's icon and updates live
      as the category dropdown changes.
- [x] Let admins override the auto-matched icon per category, for categories
      the keyword matching doesn't handle well.
      Done: new `icon` column on `categories` (migration
      `add_category_icon.sql`), a shared icon-picker grid (21 icons + "Auto")
      used both when creating a category and via a new per-row Edit button
      in Manage Categories, and `ProductThumb` now prefers a category's
      pinned icon over the keyword guess when one is set.
