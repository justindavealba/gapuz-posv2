import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore, useAppStore } from '../store'
import { useT } from '../utils/helpers'

const NAV = [
  { section: { en:'Main', fil:'Pangunahin' }, items:[
    { to:'/pos',       icon:'🛒', key:'pos'      },
    { to:'/dashboard', icon:'📊', key:'dashboard', adminOnly:true },
  ]},
  { section: { en:'Management', fil:'Pamamahala' }, items:[
    { to:'/products',  icon:'📦', key:'products',  adminOnly:true },
    { to:'/customers', icon:'👥', key:'customers'  },
  ]},
  { section: { en:'Finance', fil:'Pinansyal' }, items:[
    { to:'/reports',   icon:'📈', key:'reports',   adminOnly:true },
    { to:'/refunds',   icon:'🔄', key:'refunds'    },
  ]},
]

export default function Layout() {
  const { user, role, logout }                          = useAuthStore()
  const { theme, language, toggleTheme, toggleLanguage,
          sidebarCollapsed, toggleSidebar }             = useAppStore()
  const navigate  = useNavigate()
  const location  = useLocation()
  const t         = useT()
  const [time, setTime] = useState(new Date())

  useEffect(()=>{ const i=setInterval(()=>setTime(new Date()),1000); return()=>clearInterval(i) },[])

  const handleLogout = async () => { await logout(); navigate('/login') }
  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'
  const initials = userName.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()
  const sW = sidebarCollapsed ? '64px' : '220px'

  const currentItem = NAV.flatMap(s=>s.items).find(i=>location.pathname.startsWith(i.to))

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'var(--bg)' }}>

      {/* ── SIDEBAR ───────────────────────────────────── */}
      <aside style={{
        width:sW, flexShrink:0, height:'100vh',
        display:'flex', flexDirection:'column',
        background:'var(--bg2)',
        borderRight:'1px solid var(--border)',
        transition:'width .22s cubic-bezier(.4,0,.2,1)',
        overflow:'hidden', position:'relative', zIndex:50,
      }}>

        {/* Brand */}
        <div style={{
          display:'flex', alignItems:'center', gap:10,
          padding:'16px 14px', borderBottom:'1px solid var(--border)',
          minHeight:64, flexShrink:0,
        }}>
          <img src="/logo.png" alt="Logo" style={{ width:34, height:34, borderRadius:'50%', objectFit:'cover', flexShrink:0 }}/>
          {!sidebarCollapsed && (
            <div style={{ overflow:'hidden', flex:1 }}>
              <div style={{ fontSize:12, fontWeight:800, color:'var(--accent)', letterSpacing:'-.2px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                GAPUZ POS
              </div>
              <div style={{ fontSize:9.5, color:'var(--text3)', marginTop:1 }}>Cagayan de Oro City</div>
            </div>
          )}
          <button onClick={toggleSidebar} style={{
            marginLeft:'auto', width:22, height:22, borderRadius:6, flexShrink:0,
            border:'1px solid var(--border2)', background:'var(--bg3)',
            color:'var(--text3)', cursor:'pointer', display:'flex',
            alignItems:'center', justifyContent:'center', fontSize:10, transition:'all .15s',
          }}
          onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--accent)';e.currentTarget.style.color='var(--accent)'}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border2)';e.currentTarget.style.color='var(--text3)'}}>
            {sidebarCollapsed?'›':'‹'}
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, overflowY:'auto', overflowX:'hidden', padding:'10px 8px', display:'flex', flexDirection:'column', gap:2 }}>
          {NAV.map(section=>{
            const items = section.items.filter(i=>!i.adminOnly||role==='admin')
            if(!items.length) return null
            return (
              <div key={section.section.en}>
                {!sidebarCollapsed && (
                  <div style={{ fontSize:9, fontWeight:700, letterSpacing:'1.2px', textTransform:'uppercase', color:'var(--text3)', padding:'10px 8px 4px' }}>
                    {section.section[language]||section.section.en}
                  </div>
                )}
                {sidebarCollapsed && <div style={{ height:8 }}/>}
                {items.map(item=>(
                  <NavLink key={item.to} to={item.to} end={item.to === '/pos'}
                    style={({ isActive }) => ({
                      display:'flex', alignItems:'center', gap:10,
                      padding:'9px 10px', borderRadius:8, textDecoration:'none',
                      whiteSpace:'nowrap', overflow:'hidden', transition:'all .15s',
                      cursor:'pointer', border:'1px solid transparent',
                      fontSize:13, fontWeight:isActive?600:400, position:'relative',
                      background: isActive ? 'rgba(209,231,81,0.08)' : 'transparent',
                      borderColor: isActive ? 'rgba(209,231,81,0.2)' : 'transparent',
                      color: isActive ? 'var(--accent)' : 'var(--text2)'
                    })}
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <span style={{ position:'absolute', left:0, top:'20%', bottom:'20%', width:2.5, background:'var(--accent)', borderRadius:'0 2px 2px 0' }}/>
                        )}
                        <span style={{ fontSize:15, width:18, textAlign:'center', flexShrink:0 }}>{item.icon}</span>
                        {!sidebarCollapsed && <span>{t(item.key)}</span>}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            )
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding:'10px 8px', borderTop:'1px solid var(--border)', flexShrink:0 }}>
          {/* Controls */}
          <div style={{ display:'flex', gap:5, marginBottom:8, justifyContent:sidebarCollapsed?'center':'flex-end' }}>
            {!sidebarCollapsed && (
              <button onClick={toggleLanguage} style={{ padding:'4px 7px', borderRadius:6, border:'1px solid var(--border2)', background:'var(--bg3)', color:'var(--text2)', cursor:'pointer', fontSize:9.5, fontWeight:700, transition:'all .15s' }}>
                {language==='en'?'🇵🇭':'🇺🇸'}
              </button>
            )}
            <button onClick={toggleTheme} style={{ padding:'4px 8px', borderRadius:6, border:'1px solid var(--border2)', background:'var(--bg3)', color:'var(--text2)', cursor:'pointer', fontSize:12, transition:'all .15s' }}>
              {theme==='dark'?'☀️':'🌙'}
            </button>
            {!sidebarCollapsed && (
              <button onClick={handleLogout} style={{ padding:'4px 9px', borderRadius:6, border:'1px solid var(--border2)', background:'var(--bg3)', color:'var(--text2)', cursor:'pointer', fontSize:11, fontWeight:600, transition:'all .15s' }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--red)';e.currentTarget.style.color='var(--red)'}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border2)';e.currentTarget.style.color='var(--text2)'}}>
                {t('logout')}
              </button>
            )}
          </div>

          {/* User */}
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:8, background:'var(--bg3)', border:'1px solid var(--border)', overflow:'hidden' }}>
            <div style={{ width:28, height:28, borderRadius:6, background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, color:'#0a0a0a', flexShrink:0 }}>
              {initials}
            </div>
            {!sidebarCollapsed && (
              <div style={{ overflow:'hidden', flex:1 }}>
                <div style={{ fontSize:12, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{userName}</div>
                <div style={{ fontSize:10, color:'var(--text3)', marginTop:1 }}>{role==='admin'?'👑 Admin':'🧾 Cashier'}</div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── MAIN ─────────────────────────────────────── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>
        {/* Topbar */}
        <header style={{
          height:52, flexShrink:0, display:'flex', alignItems:'center',
          gap:12, padding:'0 20px', background:'var(--bg2)',
          borderBottom:'1px solid var(--border)',
        }}>
          <div style={{ flex:1, display:'flex', alignItems:'center', gap:10 }}>
            {currentItem && <span style={{ fontSize:15 }}>{currentItem.icon}</span>}
            <span style={{ fontSize:15, fontWeight:700, color: theme === 'light' ? '#1e3a8a' : 'var(--text)' }}>
              {t(currentItem?.key||'pos')}
            </span>
            {role==='admin' && (
              <span className="badge badge-accent" style={{ fontSize:9 }}>Admin</span>
            )}
          </div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:'var(--text3)' }}>
            {time.toLocaleTimeString('en-PH',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}
          </div>
          <div style={{ fontSize:11, color:'var(--text3)' }}>
            {time.toLocaleDateString('en-PH',{weekday:'short',month:'short',day:'numeric'})}
          </div>
        </header>

        <div style={{ flex:1, overflow:'hidden' }}>
          <Outlet/>
        </div>
      </div>
    </div>
  )
}
