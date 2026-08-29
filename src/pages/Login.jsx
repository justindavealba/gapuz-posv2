import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store'
import { useToast } from '../utils/toast'
import { useT, useBreakpoint } from '../utils/helpers'

const DecorIcon = ({ children, size, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"
       style={{ position:'absolute', pointerEvents:'none', ...style }}>
    {children}
  </svg>
)

// The green/white boundary is a curved SVG path (see the seam overlay in the login form
// panel below), not a straight line — it bulges deepest into the green around 60-85% of
// the panel's height. Right-side icons use a bigger "right" offset in that band so they
// keep an even gap from the curve instead of nearly touching it like a straight offset would.
const DECOR_ICONS = [
  { // monitor — top-left
    size:130, style:{ top:75, left:78, transform:'rotate(-8deg)' },
    paths: <><rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></>,
  },
  { // keyboard — bottom-left
    size:122, style:{ bottom:96, left:88, transform:'rotate(-10deg)' },
    paths: <><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M6 14h12"/></>,
  },
  { // headphones — top-right (curve is shallow here, ~t=0.08)
    size:112, style:{ top:65, right:125, transform:'rotate(10deg)' },
    paths: <><path d="M3 14v-3a9 9 0 0 1 18 0v3"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></>,
  },
  { // mouse — bottom-right (curve is near its deepest here, ~t=0.85)
    size:96, style:{ bottom:80, right:155, transform:'rotate(16deg)' },
    paths: <><rect x="7" y="2" width="10" height="20" rx="5"/><path d="M12 6v4"/></>,
  },
  { // cpu chip — mid-left
    size:80, style:{ top:'44%', left:78, transform:'rotate(-8deg)' },
    paths: <><rect x="6" y="6" width="12" height="12" rx="1.5"/><rect x="10" y="10" width="4" height="4"/><path d="M10 2v3M14 2v3M10 19v3M14 19v3M2 10h3M2 14h3M19 10h3M19 14h3"/></>,
  },
  { // printer — mid-right (curve moderate here, ~t=0.4)
    size:88, style:{ top:'40%', right:115, transform:'rotate(10deg)' },
    paths: <><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></>,
  },
  { // laptop — top-center
    size:88, style:{ top:56, left:'42%', transform:'rotate(-5deg)' },
    paths: <><path d="M18 5a2 2 0 0 1 2 2v9H4V7a2 2 0 0 1 2-2h12z"/><path d="M20.5 16H3.5a1 1 0 0 0-1 1.2l.4 2a1 1 0 0 0 1 .8h16.2a1 1 0 0 0 1-.8l.4-2a1 1 0 0 0-1-1.2z"/></>,
  },
  { // webcam — bottom-center
    size:66, style:{ bottom:54, right:'34%', transform:'rotate(9deg)' },
    paths: <><circle cx="12" cy="10" r="6"/><circle cx="12" cy="10" r="2"/><path d="M7 20h10M12 16v4"/></>,
  },
  { // speaker — lower-left edge
    size:72, style:{ bottom:'17%', left:58, transform:'rotate(-14deg)' },
    paths: <><rect x="6" y="2" width="12" height="20" rx="2"/><circle cx="12" cy="8" r="2.2"/><circle cx="12" cy="15" r="3.2"/></>,
  },
  { // USB flash drive — lower-right edge (curve moderately deep here, ~t=0.6)
    size:60, style:{ top:'60%', right:135, transform:'rotate(12deg)' },
    paths: <><rect x="7" y="8" width="10" height="12" rx="2"/><path d="M9 8V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4"/><line x1="12" y1="12" x2="12" y2="15"/></>,
  },
]

export default function Login() {
  const [username, setUsername]         = useState('')
  const [password, setPassword]         = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading,  setLoading]          = useState(false)
  const [forgotOpen, setForgotOpen]     = useState(false)
  const [resetEmail, setResetEmail]     = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const { login, requestPasswordReset, checkEmailExists } = useAuthStore()
  const navigate = useNavigate()
  const toast    = useToast()
  const t        = useT()
  const { isMobile } = useBreakpoint()

  const handleLogin = async (u = username, p = password) => {
    if (!u || !p) return toast('Please enter your email and password', 'error')
    setLoading(true)
    const ok = await login(u, p)
    if (ok) { toast('Welcome back!', 'success'); navigate('/pos') }
    else    { toast('Invalid email or password', 'error') }
    setLoading(false)
  }

  const openForgot = () => { setResetEmail(username); setForgotOpen(true) }

  const handleForgotSubmit = async () => {
    if (!resetEmail.trim()) return toast('Please enter your email', 'error')
    setResetLoading(true)

    const { exists, error: checkError } = await checkEmailExists(resetEmail)
    if (checkError) { setResetLoading(false); return toast(checkError.message || 'Could not verify email', 'error') }
    if (!exists) { setResetLoading(false); return toast('This email is not registered in our system', 'error') }

    const { error } = await requestPasswordReset(resetEmail)
    setResetLoading(false)
    if (error) return toast(error.message || 'Could not send reset email', 'error')
    toast('Password reset link sent — check your email', 'success')
    setForgotOpen(false)
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:isMobile?'column':'row', background:'var(--bg)', overflow:isMobile?'visible':'hidden' }}>

      {/* Left panel — branding */}
      {isMobile ? (
        <div style={{
          display:'flex', alignItems:'center', gap:14, padding:'22px 24px',
          background:'linear-gradient(155deg, var(--accent) 0%, var(--accent2) 100%)',
          position:'relative', overflow:'hidden', flexShrink:0,
        }}>
          <div style={{ position:'absolute', width:200, height:200, borderRadius:'50%', background:'rgba(255,255,255,0.14)', filter:'blur(50px)', top:-90, right:-60, pointerEvents:'none' }}/>
          <img src="/roboticon.png" alt="Gapuz Logo" style={{ position:'relative', height:58, width:'auto', objectFit:'contain', flexShrink:0 }}/>
          <div style={{ position:'relative' }}>
            <div style={{ fontSize:18, fontWeight:900, color:'#0a0a0a', letterSpacing:'-.5px', lineHeight:1.15 }}>GAPUZ COMPUTER SERVICES</div>
            <div style={{ fontSize:11.5, color:'rgba(0,0,0,0.5)', marginTop:2, fontWeight:600, letterSpacing:'.4px' }}>& ACCESSORIES</div>
          </div>
        </div>
      ) : (
        <div style={{
          flex:1, display:'flex', flexDirection:'column',
          background:'linear-gradient(155deg, var(--accent) 0%, var(--accent2) 100%)',
          position:'relative', overflow:'hidden', padding:48,
        }}>
          {/* Decorative glows */}
          <div style={{ position:'absolute', width:380, height:380, borderRadius:'50%', background:'rgba(255,255,255,0.14)', filter:'blur(80px)', top:-140, right:-120, pointerEvents:'none' }}/>
          <div style={{ position:'absolute', width:320, height:320, borderRadius:'50%', background:'rgba(0,0,0,0.12)', filter:'blur(90px)', bottom:-140, left:-100, pointerEvents:'none' }}/>
          {/* Dot-grid texture */}
          <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(rgba(0,0,0,0.08) 1px, transparent 1.5px)', backgroundSize:'22px 22px', pointerEvents:'none' }}/>

          {/* Decorative tech icons */}
          {DECOR_ICONS.map((d, i) => (
            <DecorIcon key={i} size={d.size} style={d.style}>{d.paths}</DecorIcon>
          ))}

          {/* Content */}
          <div style={{ position:'relative', flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:26 }}>
            {/* Logo mascot with soft ambient glow behind */}
            <div style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <div style={{ position:'absolute', width:320, height:320, borderRadius:'50%', background:'rgba(255,255,255,0.35)', filter:'blur(60px)', pointerEvents:'none' }}/>
              <img src="/roboticon.png" alt="Gapuz Logo" style={{ position:'relative', height:320, width:'auto', objectFit:'contain', filter:'drop-shadow(0 20px 34px rgba(0,0,0,0.28))' }}/>
            </div>

            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:32, fontWeight:900, color:'#0a0a0a', letterSpacing:'-1px', lineHeight:1.1 }}>GAPUZ COMPUTER</div>
              <div style={{ fontSize:32, fontWeight:900, color:'#0a0a0a', letterSpacing:'-1px', lineHeight:1.1 }}>SERVICES</div>
              <div style={{ fontSize:13.5, color:'rgba(0,0,0,0.5)', marginTop:9, fontWeight:600, letterSpacing:'.5px' }}>& ACCESSORIES</div>
            </div>
          </div>
        </div>
      )}

      {/* Right panel — login form */}
      <div style={{
        width: isMobile ? '100%' : 440, flex: isMobile ? 1 : 'none',
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        background:'var(--bg2)', padding: isMobile ? '32px 24px' : 48,
        position:'relative',
      }}>

        {/* Curved seam between the green and white panels, for a softer, modern divide */}
        {!isMobile && (
          <svg viewBox="0 0 140 100" preserveAspectRatio="none" aria-hidden="true"
               style={{ position:'absolute', top:0, left:-139, width:140, height:'100%', pointerEvents:'none' }}>
            <path d="M60,0 C135,25 5,75 60,100 L140,100 L140,0 Z" style={{ fill:'var(--bg2)' }}/>
          </svg>
        )}

        <div style={{ width:'100%', maxWidth:340 }}>

          {/* Heading */}
          <div style={{ marginBottom:36 }}>
            <img src="/roboticon2-cropped.png" alt="Gapuz Logo" style={{ height:48, width:'auto', objectFit:'contain', display:'block', marginBottom:-4, transform:'rotate(15deg)' }}/>
            <div style={{ fontSize:26, fontWeight:900, color:'var(--text)', letterSpacing:'-.5px', marginBottom:6 }}>Welcome back</div>
            <div style={{ fontSize:13, color:'var(--text2)' }}>Sign in to access the POS system</div>
          </div>

          {/* Fields */}
          <div style={{ display:'flex', flexDirection:'column', gap:16, marginBottom:24 }}>
            <div>
              <label style={{ display:'block', fontSize:10, fontWeight:700, color:'var(--text3)', marginBottom:7, textTransform:'uppercase', letterSpacing:'.6px' }}>Email</label>
              <input className="input-field" type="email" value={username}
                     onChange={e=>setUsername(e.target.value)}
                     placeholder="Enter your email"
                     onKeyDown={e=>e.key==='Enter'&&handleLogin()}/>
            </div>
            <div>
              <label style={{ display:'block', fontSize:10, fontWeight:700, color:'var(--text3)', marginBottom:7, textTransform:'uppercase', letterSpacing:'.6px' }}>Password</label>
              <div style={{ position:'relative' }}>
                <input className="input-field" type={showPassword?'text':'password'} value={password}
                       onChange={e=>setPassword(e.target.value)}
                       placeholder="Enter your password"
                       style={{ paddingRight:38 }}
                       onKeyDown={e=>e.key==='Enter'&&handleLogin()}/>
                <button type="button" onClick={()=>setShowPassword(s=>!s)} aria-label={showPassword?'Hide password':'Show password'}
                        style={{ position:'absolute', right:4, top:'50%', transform:'translateY(-50%)', width:28, height:28, border:'none', background:'transparent', color:'var(--text3)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {showPassword ? (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
                      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
                      <line x1="2" y1="2" x2="22" y2="22"/>
                    </svg>
                  ) : (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
              <div style={{ textAlign:'right', marginTop:8 }}>
                <button type="button" onClick={openForgot} style={{ background:'none', border:'none', color:'var(--accent)', fontSize:12, fontWeight:600, cursor:'pointer', padding:0 }}>
                  Forgot password?
                </button>
              </div>
            </div>
          </div>

          <button onClick={()=>handleLogin()} disabled={loading} className="btn-primary" style={{ width:'100%', padding:13, fontSize:14 }}>
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>
        </div>
      </div>

      {/* Forgot password modal */}
      {forgotOpen && (
        <div style={{ position:'fixed', inset:0, zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.6)', padding:16 }}
             onClick={e=>e.target===e.currentTarget&&setForgotOpen(false)}>
          <div className="card animate-scale-in" style={{ width:'min(360px,92vw)', padding:28 }}>
            <div style={{ fontSize:15, fontWeight:700, marginBottom:6 }}>Reset your password</div>
            <div style={{ fontSize:12, color:'var(--text2)', marginBottom:18, lineHeight:1.5 }}>Enter your account email and we'll send you a link to set a new password.</div>
            <label style={{ display:'block', fontSize:10, fontWeight:700, color:'var(--text3)', marginBottom:7, textTransform:'uppercase', letterSpacing:'.6px' }}>Email</label>
            <input className="input-field" type="email" value={resetEmail}
                   onChange={e=>setResetEmail(e.target.value)}
                   placeholder="Enter your email"
                   onKeyDown={e=>e.key==='Enter'&&handleForgotSubmit()}/>
            <div style={{ display:'flex', gap:10, marginTop:20 }}>
              <button onClick={()=>setForgotOpen(false)} className="btn-secondary" style={{ flex:1 }}>{t('cancel')}</button>
              <button onClick={handleForgotSubmit} disabled={resetLoading} className="btn-primary" style={{ flex:1 }}>
                {resetLoading ? 'Sending...' : 'Send Link'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
