// Supabase Edge Function: create-cashier
// Creates a new cashier account (auth user + profile row). Uses the admin API,
// which requires the service role key — never exposed to the browser — so this
// has to run server-side. Only an authenticated admin may call it: the caller's
// JWT is verified and their own profile role is checked before anything is created.
//
// Deploy with: supabase functions deploy create-cashier

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
    if (callerProfile?.role !== 'admin') return json({ error: 'Only admins can create cashier accounts' }, 403)

    const { name, email, password } = await req.json()
    if (!name || typeof name !== 'string' || !name.trim()) return json({ error: 'Name is required' }, 400)
    if (!email || typeof email !== 'string' || !email.trim()) return json({ error: 'Email is required' }, 400)
    if (!password || typeof password !== 'string' || password.length < 6) {
      return json({ error: 'Password must be at least 6 characters' }, 400)
    }

    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim(),
      password,
      email_confirm: true,
    })
    if (createErr) return json({ error: createErr.message }, 400)

    const { error: profileErr } = await supabaseAdmin.from('profiles').insert({
      id: created.user.id,
      name: name.trim(),
      email: email.trim(),
      role: 'cashier',
    })
    if (profileErr) {
      // Don't leave an orphaned auth user behind if the profile insert fails.
      await supabaseAdmin.auth.admin.deleteUser(created.user.id)
      return json({ error: profileErr.message }, 500)
    }

    return json({ ok: true, id: created.user.id })
  } catch (err) {
    return json({ error: err.message || 'Unexpected error' }, 500)
  }
})
