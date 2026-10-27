import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// detectSessionInUrl is off because ResetPassword.jsx already exchanges the
// recovery `code` itself — leaving it on races the client's own silent
// auto-exchange on load against that manual call, and since the code is
// one-time-use, whichever runs second always fails with "invalid or expired".
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { detectSessionInUrl: false },
})
