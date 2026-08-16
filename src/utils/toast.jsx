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
    success:{border:'rgba(34,197,94,0.3)', color:'var(--green)'},
    error:  {border:'rgba(239,68,68,0.3)',color:'var(--red)'},
    info:   {border:'rgba(52,211,153,0.3)', color:'var(--accent)'},
    warning:{border:'rgba(234,179,8,0.3)', color:'var(--yellow)'},
  }
  return (
    <ToastCtx.Provider value={addToast}>
      {children}
      <div style={{position:'fixed',bottom:20,right:20,display:'flex',flexDirection:'column',gap:8,zIndex:9999}}>
        {toasts.map(t=>(
          <div key={t.id} className="animate-slide-in" style={{
            display:'flex',alignItems:'center',gap:10,padding:'11px 16px',
            borderRadius:6,fontSize:13,boxShadow:'0 2px 8px rgba(0,0,0,0.25)',maxWidth:320,
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
