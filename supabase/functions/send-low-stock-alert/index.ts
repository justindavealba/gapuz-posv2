// Supabase Edge Function: send-low-stock-alert
// Emails every active admin when a product's stock crosses from above zero
// down to zero. Called from the frontend store the moment that happens
// (checkout deducting the last unit, or an admin editing stock to 0) — not
// on a poll, so each zero-crossing fires at most once. Any signed-in user
// may call it (a cashier can trigger it at checkout), but the admin
// recipient list and SMTP credentials stay server-side.
//
// Reuses the same Brevo SMTP secrets already set up for send-receipt:
//   BREVO_SMTP_LOGIN, BREVO_SMTP_KEY, SENDER_EMAIL
// Deploy with:
//   supabase functions deploy send-low-stock-alert

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })

function alertHtml(product: any) {
  return `
  <div style="font-family:Arial,sans-serif;max-width:420px;margin:0 auto;padding:20px;color:#111">
    <div style="text-align:center;border-bottom:1px dashed #ccc;padding-bottom:10px;margin-bottom:16px">
      <div style="font-size:16px;font-weight:700">GAPUZ COMPUTER</div>
      <div style="font-weight:700">SERVICES & ACCESSORIES</div>
    </div>
    <div style="text-align:center;font-size:28px;margin-bottom:8px">⚠️</div>
    <div style="text-align:center;font-size:16px;font-weight:700;color:#b91c1c;margin-bottom:12px">Product Out of Stock</div>
    <table style="width:100%;font-size:13px;border-collapse:collapse">
      <tr><td style="padding:4px 0;color:#555">Product</td><td style="padding:4px 0;text-align:right;font-weight:700">${product.name}</td></tr>
      ${product.category ? `<tr><td style="padding:4px 0;color:#555">Category</td><td style="padding:4px 0;text-align:right">${product.category}</td></tr>` : ''}
      ${product.barcode ? `<tr><td style="padding:4px 0;color:#555">Barcode</td><td style="padding:4px 0;text-align:right">${product.barcode}</td></tr>` : ''}
    </table>
    <div style="text-align:center;font-size:11px;color:#888;border-top:1px dashed #ccc;padding-top:10px;margin-top:16px">
      Restock this item from the Products page before it affects sales.
    </div>
  </div>`
}

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

    const { product } = await req.json()
    if (!product || typeof product !== 'object' || !product.name) {
      return json({ error: 'Product is required' }, 400)
    }

    const { data: admins } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('role', 'admin')
      .eq('active', true)
      .not('email', 'is', null)

    const recipients = (admins || []).map(a => a.email).filter(Boolean)
    if (recipients.length === 0) return json({ ok: true, skipped: 'no admin email on file' })

    const smtpLogin = Deno.env.get('BREVO_SMTP_LOGIN')
    const smtpKey = Deno.env.get('BREVO_SMTP_KEY')
    const senderEmail = Deno.env.get('SENDER_EMAIL')
    if (!smtpLogin || !smtpKey || !senderEmail) throw new Error('Brevo SMTP credentials are not configured')

    const client = new SMTPClient({
      connection: {
        hostname: 'smtp-relay.brevo.com',
        port: 465,
        tls: true,
        auth: { username: smtpLogin, password: smtpKey },
      },
    })

    await client.send({
      from: `Gapuz POS <${senderEmail}>`,
      to: recipients,
      subject: `Out of Stock: ${product.name}`,
      html: alertHtml(product),
    })
    await client.close()

    return json({ ok: true })
  } catch (err) {
    return json({ error: err.message || 'Unexpected error' }, 500)
  }
})
