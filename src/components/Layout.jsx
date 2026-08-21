import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore, useAppStore, useProductStore, useCustomerStore, useTransactionStore, useRefundStore, useHoldStore } from '../store'
import { useT, useBreakpoint } from '../utils/helpers'

const SidebarIcon = ({ children }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    {children}
  </svg>
)

const NAV = [
  { section: { en:'', fil:'' }, items:[
    { to:'/pos',       key:'pos',       icon: <SidebarIcon><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></SidebarIcon> },
    { to:'/dashboard', key:'dashboard', icon: <SidebarIcon><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></SidebarIcon>, adminOnly:true },
  ]},
  { section: { en:'Management', fil:'Pamamahala' }, items:[
    { to:'/products',  key:'products',  icon: <SidebarIcon><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></SidebarIcon>, adminOnly:true },
    { to:'/customers', key:'customers', icon: <SidebarIcon><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></SidebarIcon> },
  ]},
  { section: { en:'Finance', fil:'Pinansyal' }, items:[
    { to:'/reports',   key:'reports',   icon: <SidebarIcon><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></SidebarIcon>, adminOnly:true },
    { to:'/refunds',   key:'refunds',   icon: <SidebarIcon><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></SidebarIcon> },
  ]},
]

export default function Layout() {
  const { user, role, logout }                          = useAuthStore()
  const { theme, language, toggleTheme }                = useAppStore()
  const navigate  = useNavigate()
  const isLight   = theme === 'light'
  const location  = useLocation()
  const t         = useT()
  const [time, setTime] = useState(new Date())
  const { isMobile } = useBreakpoint()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  useEffect(()=>{ const i=setInterval(()=>setTime(new Date()),1000); return()=>clearInterval(i) },[])
  useEffect(()=>{ setMobileNavOpen(false) },[location.pathname])
  useEffect(()=>{
    useProductStore.getState().fetchProducts()
    useCustomerStore.getState().fetchCustomers()
    useTransactionStore.getState().fetchTransactions()
    useRefundStore.getState().fetchRefunds()
    useHoldStore.getState().fetchHolds()
  },[])

  const handleLogout = async () => { await logout(); navigate('/login') }
  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'
  const initials = userName.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()
  const sW = isMobile ? '240px' : '220px'

  const currentItem = NAV.flatMap(s=>s.items).find(i=>location.pathname.startsWith(i.to))

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'var(--bg)' }}>

      {/* Mobile drawer backdrop */}
      {isMobile && mobileNavOpen && (
        <div onClick={()=>setMobileNavOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:100 }}/>
      )}

      {/* ── SIDEBAR ───────────────────────────────────── */}
      <aside style={{
        width:sW, flexShrink:0, height:'100vh',
        display:'flex', flexDirection:'column',
        background:'var(--bg2)',
        borderRight:'1px solid var(--border)',
        transition: isMobile ? 'transform .22s cubic-bezier(.4,0,.2,1)' : 'width .22s cubic-bezier(.4,0,.2,1)',
        overflow:'hidden', zIndex:110,
        ...(isMobile
          ? { position:'fixed', top:0, left:0, transform: mobileNavOpen ? 'translateX(0)' : 'translateX(-100%)', boxShadow: mobileNavOpen?'0 0 40px rgba(0,0,0,0.4)':'none' }
          : { position:'relative' }),
      }}>

        {/* Brand */}
        <div style={{
          display:'flex', alignItems:'center', gap:10,
          justifyContent:'center',
          padding:'16px 14px', borderBottom:'1px solid var(--border)',
          minHeight:64, flexShrink:0,
        }}>
          <img src="/logo.png" alt="Logo" style={{ width:34, height:34, borderRadius:'50%', objectFit:'cover', flexShrink:0 }}/>
          <div style={{ overflow:'hidden', flex:1 }}>
            <div style={{ fontSize:13, fontWeight:800, color:'var(--accent)', letterSpacing:'-.2px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
              GAPUZ POS
            </div>
            <div style={{ fontSize:10.5, color:'var(--text2)', marginTop:1 }}>Cagayan de Oro City</div>
          </div>
          {isMobile && (
            <button onClick={()=>setMobileNavOpen(false)} aria-label="Close menu" style={{
              marginLeft:'auto', width:22, height:22, borderRadius:6, flexShrink:0,
              border:'1px solid var(--border2)', background:'var(--bg3)',
              color:'var(--text)', cursor:'pointer', display:'flex',
              alignItems:'center', justifyContent:'center', fontSize:11, transition:'all .15s',
            }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--accent)';e.currentTarget.style.color='var(--accent)'}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border2)';e.currentTarget.style.color='var(--text)'}}>
              ×
            </button>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex:1, overflowY:'auto', overflowX:'hidden', padding:'10px 8px', display:'flex', flexDirection:'column', gap:2 }}>
          {NAV.map(section=>{
            const items = section.items.filter(i=>!i.adminOnly||role==='admin')
            if(!items.length) return null
            const sectionLabel = section.section[language]||section.section.en
            return (
              <div key={sectionLabel||section.items[0].to}>
                {sectionLabel && (
                  <div style={{ fontSize:10, fontWeight:700, letterSpacing:'1.2px', textTransform:'uppercase', color:'var(--text2)', padding:'10px 8px 4px' }}>
                    {sectionLabel}
                  </div>
                )}
                {items.map(item=>(
                  <NavLink key={item.to} to={item.to}
                    onClick={()=>{ if(isMobile) setMobileNavOpen(false) }}
                    style={({ isActive }) => ({
                      display:'flex', alignItems:'center', gap:10,
                      padding:'9px 10px', borderRadius:8, textDecoration:'none',
                      whiteSpace:'nowrap', overflow:'hidden', transition:'all .15s',
                      cursor:'pointer', border: '1px solid transparent',
                      fontSize:14, fontWeight:isActive?700:500, position:'relative',
                      background: isActive ? 'var(--accent)' : 'transparent',
                      boxShadow: isActive ? '0 2px 8px rgba(52,211,153,0.35)' : 'none',
                      color: isActive ? 'var(--accent-dark)' : 'var(--text2)'
                    })}
                    onMouseEnter={e => { if (e.currentTarget.getAttribute('aria-current') !== 'page') { e.currentTarget.style.background = 'var(--bg3)'; e.currentTarget.style.color = 'var(--text)' } }}
                    onMouseLeave={e => { if (e.currentTarget.getAttribute('aria-current') !== 'page') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text2)' } }}>
                    {({ isActive }) => (
                      <>
                        <span style={{ fontSize: 15, width: 18, textAlign: 'center', flexShrink: 0, color: 'inherit', opacity: isActive ? 1 : 0.55, transition: 'all .2s' }}>
                          {item.icon}
                        </span>
                        <span>{t(item.key)}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            )
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding:'12px 8px', borderTop:'1px solid var(--border)', flexShrink:0 }}>
          {/* Theme toggle */}
          <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:10 }}>
            <button onClick={toggleTheme} aria-label="Toggle theme" style={{
              width:30, height:30, borderRadius:8, border:'1px solid var(--border2)', background:'var(--bg3)',
              color:'var(--text2)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all .15s',
            }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--accent)';e.currentTarget.style.color='var(--accent)'}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border2)';e.currentTarget.style.color='var(--text2)'}}>
              {theme==='dark' ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"/></svg>
              )}
            </button>
          </div>

          {/* User */}
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 10px', borderRadius:10, background:'var(--bg3)', border:'1px solid var(--border)', overflow:'hidden' }}>
            <div style={{ width:34, height:34, borderRadius:9, background:'linear-gradient(140deg, var(--accent), var(--accent2))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, color:'var(--accent-dark)', flexShrink:0, boxShadow:'0 2px 6px rgba(52,211,153,0.3)' }}>
              {initials}
            </div>
            <div style={{ overflow:'hidden', flex:1 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{userName}</div>
              <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:10.5, fontWeight:600, color: role==='admin' ? 'var(--yellow)' : 'var(--text2)', marginTop:2 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
                  {role==='admin'
                    ? <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7Z"/>
                    : <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></>
                  }
                </svg>
                {role==='admin' ? 'Admin' : 'Cashier'}
              </div>
            </div>
          </div>

          <button onClick={handleLogout} style={{
              width:'100%', marginTop:8, padding:'10px 14px', borderRadius:10, display:'flex', alignItems:'center',
              justifyContent:'center', gap:8, border:'1px solid var(--border2)', background:'var(--bg3)',
              color:'var(--text2)', cursor:'pointer', fontSize:12.5, fontWeight:700, transition:'all .15s',
            }}
            onMouseEnter={e=>{e.currentTarget.style.background='rgba(239,68,68,0.1)';e.currentTarget.style.borderColor='var(--red)';e.currentTarget.style.color='var(--red)'}}
            onMouseLeave={e=>{e.currentTarget.style.background='var(--bg3)';e.currentTarget.style.borderColor='var(--border2)';e.currentTarget.style.color='var(--text2)'}}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              {t('logout')}
          </button>
        </div>
      </aside>

      {/* ── MAIN ─────────────────────────────────────── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>
        {/* Topbar */}
        <header style={{
          height:52, flexShrink:0, display:'flex', alignItems:'center',
          gap:12, padding: isMobile ? '0 12px' : '0 20px', background:'var(--bg2)',
          borderBottom:'1px solid var(--border)',
        }}>
          {isMobile && (
            <button onClick={()=>setMobileNavOpen(true)} aria-label="Open menu" style={{
              width:32, height:32, flexShrink:0, borderRadius:8, border:'1px solid var(--border2)',
              background:'var(--bg3)', color:'var(--text)', cursor:'pointer', display:'flex',
              alignItems:'center', justifyContent:'center',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
          )}
          <div style={{ flex:1, display:'flex', alignItems:'center', gap:10, minWidth:0, overflow:'hidden' }}>
            {currentItem && <span style={{ fontSize:16, flexShrink:0 }}>{currentItem.icon}</span>}
            <span style={{ fontSize:16, fontWeight:700, color:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
              {t(currentItem?.key||'pos')}
            </span>
            {role==='admin' && !isMobile && (
              <span className="badge badge-accent" style={{ fontSize:10 }}>Admin</span>
            )}
          </div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:'var(--text2)', flexShrink:0 }}>
            {time.toLocaleTimeString('en-PH',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}
          </div>
          {!isMobile && (
            <div style={{ fontSize:12, color:'var(--text2)', flexShrink:0 }}>
              {time.toLocaleDateString('en-PH',{weekday:'short',month:'short',day:'numeric'})}
            </div>
          )}
        </header>

        <div style={{ flex:1, overflow:'hidden' }}>
          <Outlet/>
        </div>
      </div>
    </div>
  )
}
