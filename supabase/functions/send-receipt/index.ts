// Supabase Edge Function: send-receipt
// Emails a transaction receipt to a customer via Brevo's SMTP relay. The
// SMTP key must never reach the browser, so this call is proxied through here.
// The frontend calls this via supabase.functions.invoke('send-receipt', {...}).
//
// Requires these secrets (from Brevo dashboard → SMTP & API → SMTP tab):
//   supabase secrets set BREVO_SMTP_LOGIN=youraccount@brevo-login.com
//   supabase secrets set BREVO_SMTP_KEY=xxxxxxxxxxxxxxxx
//   supabase secrets set SENDER_EMAIL=receipts@yourdomain.com
// SENDER_EMAIL must be a verified sender in Brevo (Senders & IPs → Senders).
// Deploy with:
//   supabase functions deploy send-receipt

import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const peso = (n: number) => `₱${(n || 0).toFixed(2)}`

function receiptHtml(txn: any) {
  const items = (txn.items || []).map((i: any) => `
    <tr>
      <td style="padding:4px 0;font-size:13px;color:#111">${i.name}</td>
      <td style="padding:4px 0;font-size:13px;color:#555;text-align:center">x${i.qty}</td>
      <td style="padding:4px 0;font-size:13px;color:#111;text-align:right">${peso(i.price * i.qty)}</td>
    </tr>`).join('')

  return `
  <div style="font-family:'Courier New',monospace;max-width:340px;margin:0 auto;padding:20px;color:#111">
    <div style="text-align:center;border-bottom:1px dashed #ccc;padding-bottom:10px;margin-bottom:10px">
      <div style="font-size:16px;font-weight:700">GAPUZ COMPUTER</div>
      <div style="font-weight:700">SERVICES & ACCESSORIES</div>
      <div style="font-size:11px;color:#555">Door 2 NGAP Building, Purok 3</div>
      <div style="font-size:11px;color:#555">Tablon, Cagayan de Oro City</div>
    </div>
    <div style="display:flex;justify-content:space-between;font-size:11px;color:#555;margin-bottom:10px">
      <span>#${String(txn.id).padStart(4, '0')}</span>
      <span>${new Date(txn.createdAt).toLocaleString('en-PH')}</span>
    </div>
    <div style="font-size:11px;color:#555;margin-bottom:10px">
      Customer: ${txn.customerName || 'Walk-in'}
    </div>
    <table style="width:100%;border-top:1px dashed #ccc;border-bottom:1px dashed #ccc;padding:8px 0;border-collapse:collapse">
      <tbody>${items}</tbody>
    </table>
    <div style="font-size:12px;margin-top:8px">
      <div style="display:flex;justify-content:space-between;color:#555"><span>Subtotal</span><span>${peso(txn.subtotal)}</span></div>
      ${txn.discAmt > 0 ? `<div style="display:flex;justify-content:space-between;color:#555"><span>Discount</span><span>-${peso(txn.discAmt)}</span></div>` : ''}
      <div style="display:flex;justify-content:space-between;color:#555"><span>VAT (12%)</span><span>${peso(txn.vat)}</span></div>
      <div style="display:flex;justify-content:space-between;font-weight:700;font-size:15px;border-top:1px solid #ccc;padding-top:4px;margin-top:4px"><span>TOTAL</span><span>${peso(txn.total)}</span></div>
      <div style="margin-top:6px;color:#555">Payment: ${txn.payment}</div>
    </div>
    <div style="text-align:center;font-size:11px;color:#888;border-top:1px dashed #ccc;padding-top:10px;margin-top:14px">
      <div>Thank you for shopping at Gapuz!</div>
      <div>Items are non-refundable after 7 days.</div>
    </div>
  </div>`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  try {
    const { email, txn } = await req.json()
    if (!email || typeof email !== 'string') {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }
    if (!txn || typeof txn !== 'object') {
      return new Response(JSON.stringify({ error: 'Transaction data is required' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

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
      to: email.trim(),
      subject: `Your Receipt — #${String(txn.id).padStart(4, '0')}`,
      html: receiptHtml(txn),
    })
    await client.close()

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Unexpected error' }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
