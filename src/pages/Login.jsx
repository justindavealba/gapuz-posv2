import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, useAppStore } from '../store'
import { useToast } from '../utils/toast'
import { useT } from '../utils/helpers'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const { login } = useAuthStore()
  const { theme, toggleTheme, language, toggleLanguage } = useAppStore()
  const navigate = useNavigate()
  const toast    = useToast()
  const t        = useT()

  const handleLogin = async () => {
    if (!username || !password) return toast('Please enter username and password', 'error')
    setLoading(true)
    await new Promise(r => setTimeout(r, 400))
    const ok = login(username, password)
    if (ok) { toast('Welcome back! 👋', 'success'); navigate('/pos') }
    else    { toast('Invalid username or password', 'error') }
    setLoading(false)
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', background:'var(--bg)', overflow:'hidden' }}>

      {/* Left panel — branding */}
      <div style={{
        flex:1, display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center',
        background:'var(--accent)', padding:48, gap:28,
        position:'relative',
      }}>
        {/* Decorative circles */}
        <div style={{ position:'absolute', top:-60, left:-60, width:200, height:200, borderRadius:'50%', background:'rgba(0,0,0,0.06)' }}/>
        <div style={{ position:'absolute', bottom:-40, right:-40, width:160, height:160, borderRadius:'50%', background:'rgba(0,0,0,0.06)' }}/>

        {/* Logo */}
        <div style={{ position:'relative', zIndex:1 }}>
          <img src="/logo.png" alt="Gapuz Logo" style={{ width:170, height:170, borderRadius:'50%', objectFit:'cover', boxShadow:'0 20px 60px rgba(0,0,0,0.25)', border:'4px solid rgba(0,0,0,0.1)' }}/>
        </div>

        <div style={{ position:'relative', zIndex:1, textAlign:'center' }}>
          <div style={{ fontSize:30, fontWeight:900, color:'#0a0a0a', letterSpacing:'-1px', lineHeight:1.1 }}>GAPUZ COMPUTER</div>
          <div style={{ fontSize:30, fontWeight:900, color:'#0a0a0a', letterSpacing:'-1px', lineHeight:1.1 }}>SERVICES</div>
          <div style={{ fontSize:13, color:'rgba(0,0,0,0.45)', marginTop:8, fontWeight:600, letterSpacing:'.5px' }}>& ACCESSORIES</div>
        </div>

        <div style={{ position:'relative', zIndex:1, width:40, height:2, background:'rgba(0,0,0,0.15)', borderRadius:99 }}/>

        <div style={{ position:'relative', zIndex:1, textAlign:'center', fontSize:12, color:'rgba(0,0,0,0.45)', lineHeight:1.9, fontWeight:500 }}>
          Door 2 NGAP Building<br/>Purok 3, Tablon<br/>Cagayan de Oro City
        </div>

        {/* POS badge */}
        <div style={{ position:'relative', zIndex:1, background:'rgba(0,0,0,0.1)', borderRadius:99, padding:'6px 18px', fontSize:11, fontWeight:700, color:'rgba(0,0,0,0.5)', letterSpacing:'1px', textTransform:'uppercase' }}>
          Point of Sale System v3.0
        </div>
      </div>

      {/* Right panel — login form */}
      <div style={{ width:440, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'var(--bg2)', padding:48, borderLeft:'1px solid var(--border)', position:'relative' }}>

        {/* Controls top right */}
        <div style={{ position:'absolute', top:20, right:20, display:'flex', gap:8 }}>
          <button onClick={toggleLanguage} style={{ padding:'5px 9px', borderRadius:7, border:'1px solid var(--border2)', background:'var(--bg3)', color:'var(--text2)', cursor:'pointer', fontSize:11, fontWeight:700 }}>
            {language==='en'?'🇵🇭 FIL':'🇺🇸 ENG'}
          </button>
          <button onClick={toggleTheme} style={{ padding:'5px 9px', borderRadius:7, border:'1px solid var(--border2)', background:'var(--bg3)', color:'var(--text2)', cursor:'pointer', fontSize:13 }}>
            {theme==='dark'?'☀️':'🌙'}
          </button>
        </div>

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
              <input className="input-field" type="password" value={password}
                     onChange={e=>setPassword(e.target.value)}
                     placeholder="Enter password"
                     onKeyDown={e=>e.key==='Enter'&&handleLogin()}/>
            </div>
          </div>

          <button onClick={handleLogin} disabled={loading} className="btn-primary" style={{ width:'100%', padding:13, fontSize:14, borderRadius:10 }}>
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>

          {/* Credentials hint */}
          <div style={{ marginTop:24, padding:16, borderRadius:10, background:'var(--bg3)', border:'1px solid var(--border)' }}>
            <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.6px', color:'var(--text3)', marginBottom:12 }}>Default Credentials</div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {[
                { role:'Admin',   user:'admin',   pass:'admin123',   dot:'var(--accent)' },
                { role:'Cashier', user:'cashier', pass:'cashier123', dot:'var(--text3)'  },
              ].map(({ role, user, pass, dot }) => (
                <div key={role} style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:7, height:7, borderRadius:'50%', background:dot, flexShrink:0 }}/>
                  <div style={{ flex:1 }}>
                    <span style={{ fontSize:12, fontWeight:700, color:'var(--text)' }}>{role}</span>
                    <span style={{ fontSize:11, color:'var(--text3)', marginLeft:6 }}>— {user} / {pass}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop:24, textAlign:'center', fontSize:11, color:'var(--text3)' }}>
            Gapuz POS v3.0 · Offline mode · React + Zustand
          </div>
        </div>
      </div>
    </div>
  )
}
