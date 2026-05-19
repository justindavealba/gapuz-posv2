import { createContext, useContext, useState, useCallback } from 'react'
const ToastCtx = createContext(null)
let _id = 0
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const addToast = useCallback((message, type='info', duration=2800) => {
    const id = ++_id
    setToasts(t=>[...t,{id,message,type}])
    setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),duration)
  },[])
  const icons = {success:'✅',error:'❌',info:'ℹ️',warning:'⚠️'}
  const colors = {
    success:{border:'rgba(74,222,128,0.3)', color:'#4ade80'},
    error:  {border:'rgba(248,113,113,0.3)',color:'#f87171'},
    info:   {border:'rgba(209,231,81,0.3)', color:'#d1e751'},
    warning:{border:'rgba(251,191,36,0.3)', color:'#fbbf24'},
  }
  return (
    <ToastCtx.Provider value={addToast}>
      {children}
      <div style={{position:'fixed',bottom:20,right:20,display:'flex',flexDirection:'column',gap:8,zIndex:9999}}>
        {toasts.map(t=>(
          <div key={t.id} className="animate-slide-in" style={{
            display:'flex',alignItems:'center',gap:10,padding:'11px 16px',
            borderRadius:10,fontSize:13,boxShadow:'0 8px 32px rgba(0,0,0,0.5)',maxWidth:320,
            background:'var(--bg2)',border:`1px solid ${colors[t.type]?.border}`,
          }}>
            <span>{icons[t.type]}</span>
            <span style={{color:'var(--text)',fontWeight:400}}>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}
export const useToast = () => useContext(ToastCtx)
