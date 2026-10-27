// Supabase Edge Function: delete-staff
// Permanently deletes a staff account (auth user + profile row, via the
// profiles.id -> auth.users(id) ON DELETE CASCADE). Uses the admin API, which
// requires the service role key — never exposed to the browser — so this has
// to run server-side. Only an authenticated admin may call it. An admin can't
// delete their own account, and the last remaining admin can't be deleted, so
// the shop can never be left with no admin account.
//
// Deploy with: supabase functions deploy delete-staff

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  try {
    const jwt = (req.headers.get('Authorization') || '').replace('Bearer ', '')
    if (!jwt) return json({ error: 'Missing authorization' }, 401)

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: { user: caller }, error: callerErr } = await supabaseAdmin.auth.getUser(jwt)
    if (callerErr || !caller) return json({ error: 'Invalid session' }, 401)

    const { data: callerProfile } = await supabaseAdmin.from('profiles').select('role').eq('id', caller.id).single()
    if (callerProfile?.role !== 'admin') return json({ error: 'Only admins can delete staff accounts' }, 403)

    const { id } = await req.json()
    if (!id || typeof id !== 'string') return json({ error: 'Staff id is required' }, 400)
    if (id === caller.id) return json({ error: "You can't delete your own account" }, 400)

    const { data: targetProfile } = await supabaseAdmin.from('profiles').select('role').eq('id', id).single()
    if (!targetProfile) return json({ error: 'Account not found' }, 404)

    if (targetProfile.role === 'admin') {
      const { count } = await supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'admin')
      if ((count ?? 0) <= 1) return json({ error: 'Cannot delete the only remaining admin' }, 400)
    }

    const { error: deleteErr } = await supabaseAdmin.auth.admin.deleteUser(id)
    if (deleteErr) return json({ error: deleteErr.message }, 400)

    return json({ ok: true })
  } catch (err) {
    return json({ error: err.message || 'Unexpected error' }, 500)
  }
})
