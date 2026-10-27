// Supabase Edge Function: toggle-staff-status
// Suspends or reactivates a cashier account. Uses the admin API (ban/unban via
// GoTrue, which actually blocks login — not just an app-level flag) plus
// mirrors the state into profiles.active so the UI can show it without an
// extra admin API round trip. Only an authenticated admin may call it, and
// only on cashier accounts — admins can't suspend themselves or each other
// through this.
//
// Deploy with: supabase functions deploy toggle-staff-status

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// GoTrue has no "ban forever" — ~100 years is the conventional stand-in.
const BAN_FOREVER = '876000h'

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
    if (callerProfile?.role !== 'admin') return json({ error: 'Only admins can change staff status' }, 403)

    const { id, active } = await req.json()
    if (!id || typeof id !== 'string') return json({ error: 'Staff id is required' }, 400)
    if (typeof active !== 'boolean') return json({ error: 'active must be a boolean' }, 400)

    const { data: targetProfile } = await supabaseAdmin.from('profiles').select('role').eq('id', id).single()
    if (!targetProfile) return json({ error: 'Account not found' }, 404)
    if (targetProfile.role !== 'cashier') return json({ error: 'Only cashier accounts can be suspended' }, 400)

    const { error: authErr } = await supabaseAdmin.auth.admin.updateUserById(id, {
      ban_duration: active ? 'none' : BAN_FOREVER,
    })
    if (authErr) return json({ error: authErr.message }, 400)

    const { error: profileErr } = await supabaseAdmin.from('profiles').update({ active }).eq('id', id)
    if (profileErr) return json({ error: profileErr.message }, 500)

    return json({ ok: true })
  } catch (err) {
    return json({ error: err.message || 'Unexpected error' }, 500)
  }
})
