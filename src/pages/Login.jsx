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

const DECOR_ICONS = [
  { // monitor — top-left
    size:130, style:{ top:34, left:32, transform:'rotate(-8deg)' },
    paths: <><rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></>,
  },
  { // keyboard — bottom-left
    size:122, style:{ bottom:52, left:42, transform:'rotate(-10deg)' },
    paths: <><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M6 14h12"/></>,
  },
  { // headphones — top-right
    size:112, style:{ top:34, right:40, transform:'rotate(10deg)' },
    paths: <><path d="M3 14v-3a9 9 0 0 1 18 0v3"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></>,
  },
  { // mouse — bottom-right
    size:96, style:{ bottom:46, right:122, transform:'rotate(16deg)' },
    paths: <><rect x="7" y="2" width="10" height="20" rx="5"/><path d="M12 6v4"/></>,
  },
  { // cpu chip — mid-left
    size:80, style:{ top:'44%', left:36, transform:'rotate(-8deg)' },
    paths: <><rect x="6" y="6" width="12" height="12" rx="1.5"/><rect x="10" y="10" width="4" height="4"/><path d="M10 2v3M14 2v3M10 19v3M14 19v3M2 10h3M2 14h3M19 10h3M19 14h3"/></>,
  },
  { // printer — mid-right
    size:88, style:{ top:'40%', right:46, transform:'rotate(10deg)' },
    paths: <><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></>,
  },
  { // laptop — top-center
    size:88, style:{ top:24, left:'42%', transform:'rotate(-5deg)' },
    paths: <><path d="M18 5a2 2 0 0 1 2 2v9H4V7a2 2 0 0 1 2-2h12z"/><path d="M20.5 16H3.5a1 1 0 0 0-1 1.2l.4 2a1 1 0 0 0 1 .8h16.2a1 1 0 0 0 1-.8l.4-2a1 1 0 0 0-1-1.2z"/></>,
  },
  { // webcam — bottom-center
    size:66, style:{ bottom:20, right:'34%', transform:'rotate(9deg)' },
    paths: <><circle cx="12" cy="10" r="6"/><circle cx="12" cy="10" r="2"/><path d="M7 20h10M12 16v4"/></>,
  },
  { // speaker — lower-left edge
    size:72, style:{ bottom:'14%', left:16, transform:'rotate(-14deg)' },
    paths: <><rect x="6" y="2" width="12" height="20" rx="2"/><circle cx="12" cy="8" r="2.2"/><circle cx="12" cy="15" r="3.2"/></>,
  },
  { // USB flash drive — lower-right edge
    size:60, style:{ top:'60%', right:18, transform:'rotate(12deg)' },
    paths: <><rect x="7" y="8" width="10" height="12" rx="2"/><path d="M9 8V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4"/><line x1="12" y1="12" x2="12" y2="15"/></>,
  },
]

export default function Login() {
  const [username, setUsername]         = useState('')
  const [password, setPassword]         = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading,  setLoading]          = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()
  const toast    = useToast()
  const t        = useT()
  const { isMobile } = useBreakpoint()

  const handleLogin = async (u = username, p = password) => {
    if (!u || !p) return toast('Please enter username and password', 'error')
    setLoading(true)
    await new Promise(r => setTimeout(r, 400))
    const ok = login(u, p)
    if (ok) { toast('Welcome back! 👋', 'success'); navigate('/pos') }
    else    { toast('Invalid username or password', 'error') }
    setLoading(false)
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
          <img src="/logo.png" alt="Gapuz Logo" style={{ position:'relative', width:52, height:52, borderRadius:'50%', objectFit:'cover', border:'3px solid rgba(0,0,0,0.12)', flexShrink:0 }}/>
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
            {/* Logo with glow ring */}
            <div style={{ width:198, height:198, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(255,255,255,0.16)', border:'1px solid rgba(255,255,255,0.35)', boxShadow:'0 0 0 10px rgba(255,255,255,0.07), 0 20px 50px rgba(0,0,0,0.18)' }}>
              <img src="/logo.png" alt="Gapuz Logo" style={{ width:160, height:160, borderRadius:'50%', objectFit:'cover', border:'4px solid rgba(0,0,0,0.1)' }}/>
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
        borderLeft: isMobile ? 'none' : '1px solid var(--border)', position:'relative',
      }}>

        <div style={{ width:'100%', maxWidth:340 }}>

          {/* Heading */}
          <div style={{ marginBottom:36 }}>
            <div style={{ fontSize:26, fontWeight:900, color:'var(--text)', letterSpacing:'-.5px', marginBottom:6 }}>Welcome back</div>
            <div style={{ fontSize:13, color:'var(--text2)' }}>Sign in to access the POS system</div>
          </div>

          {/* Fields */}
          <div style={{ display:'flex', flexDirection:'column', gap:16, marginBottom:24 }}>
            <div>
              <label style={{ display:'block', fontSize:10, fontWeight:700, color:'var(--text3)', marginBottom:7, textTransform:'uppercase', letterSpacing:'.6px' }}>Username</label>
              <input className="input-field" type="text" value={username}
                     onChange={e=>setUsername(e.target.value)}
                     placeholder="Enter username"
                     onKeyDown={e=>e.key==='Enter'&&handleLogin()}/>
            </div>
            <div>
              <label style={{ display:'block', fontSize:10, fontWeight:700, color:'var(--text3)', marginBottom:7, textTransform:'uppercase', letterSpacing:'.6px' }}>Password</label>
              <div style={{ position:'relative' }}>
                <input className="input-field" type={showPassword?'text':'password'} value={password}
                       onChange={e=>setPassword(e.target.value)}
                       placeholder="Enter password"
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
            </div>
          </div>

          <button onClick={()=>handleLogin()} disabled={loading} className="btn-primary" style={{ width:'100%', padding:13, fontSize:14 }}>
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>
        </div>
      </div>
    </div>
  )
}
