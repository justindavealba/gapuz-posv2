// Supabase Edge Function: update-staff
// Updates an existing staff account's name, email, password, and/or role.
// Uses the admin API, which requires the service role key — never exposed to
// the browser — so this has to run server-side. Only an authenticated admin
// may call it: the caller's JWT is verified and their own profile role is
// checked before anything is updated. Demoting the last remaining admin is
// blocked so the shop can never be left with no admin account.
//
// Deploy with: supabase functions deploy update-staff

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
    if (callerProfile?.role !== 'admin') return json({ error: 'Only admins can edit staff accounts' }, 403)

    const { id, name, email, password, role } = await req.json()
    if (!id || typeof id !== 'string') return json({ error: 'Staff id is required' }, 400)
    if (!name || typeof name !== 'string' || !name.trim()) return json({ error: 'Name is required' }, 400)
    if (!email || typeof email !== 'string' || !email.trim()) return json({ error: 'Email is required' }, 400)
    if (password && (typeof password !== 'string' || password.length < 6)) {
      return json({ error: 'Password must be at least 6 characters' }, 400)
    }
    if (role && !['admin', 'cashier'].includes(role)) return json({ error: 'Invalid role' }, 400)

    if (role) {
      const { data: targetProfile } = await supabaseAdmin.from('profiles').select('role').eq('id', id).single()
      if (!targetProfile) return json({ error: 'Account not found' }, 404)
      if (targetProfile.role === 'admin' && role !== 'admin') {
        const { count } = await supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'admin')
        if ((count ?? 0) <= 1) return json({ error: 'Cannot demote the only remaining admin' }, 400)
      }
    }

    const authUpdate: Record<string, unknown> = { email: email.trim(), email_confirm: true }
    if (password) authUpdate.password = password

    const { error: authErr } = await supabaseAdmin.auth.admin.updateUserById(id, authUpdate)
    if (authErr) return json({ error: authErr.message }, 400)

    const profileUpdate: Record<string, unknown> = { name: name.trim(), email: email.trim() }
    if (role) profileUpdate.role = role

    const { error: profileErr } = await supabaseAdmin.from('profiles')
      .update(profileUpdate)
      .eq('id', id)
    if (profileErr) return json({ error: profileErr.message }, 500)

    return json({ ok: true })
  } catch (err) {
    return json({ error: err.message || 'Unexpected error' }, 500)
  }
})
