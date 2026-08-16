import { useEffect, useState } from 'react'
import { useAppStore } from '../store'
import { translations } from '../i18n/translations'

export const peso = (n) => '₱' + Number(n||0).toLocaleString('en-PH',{minimumFractionDigits:2,maximumFractionDigits:2})
export const pesoCompact = (n) => { if(n>=1000000) return '₱'+(n/1000000).toFixed(1)+'M'; if(n>=1000) return '₱'+(n/1000).toFixed(1)+'K'; return '₱'+(n||0).toLocaleString() }
export const fmtDate = (d) => new Date(d).toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'})
export const fmtDateTime = (d) => new Date(d).toLocaleString('en-PH',{month:'short',day:'numeric',year:'numeric',hour:'2-digit',minute:'2-digit'})
export const fmtTxnId = (id) => '#'+String(id).padStart(4,'0')
export const genBarcode = () => 'BC-'+Date.now().toString(36).toUpperCase()

export const stockStatus = (stock) => {
  if(stock===0)  return {label:'Out of Stock',cls:'badge-red'}
  if(stock<=5)   return {label:`Low: ${stock}`,cls:'badge-yellow'}
  return               {label:`${stock} in stock`,cls:'badge-green'}
}

export const getTier = (points) => {
  if(points>=3000) return {label:'Platinum',color:'#8b5cf6',icon:'💎'}
  if(points>=1500) return {label:'Gold',    color:'#eab308',icon:'🥇'}
  if(points>=500)  return {label:'Silver',  color:'#94a3b8',icon:'🥈'}
  return                  {label:'Bronze',  color:'#b45309',icon:'🥉'}
}

export const CATEGORIES = ['All','Processors','RAM','GPU','Storage','Laptops','Peripherals','Accessories','Services']
export const REFUND_REASONS = ['Defective product','Wrong item delivered','Customer changed mind','Item not as described','Duplicate purchase','Other']
export const CAT_COLORS = { Processors:'badge-blue',RAM:'badge-purple',GPU:'badge-accent',Storage:'badge-yellow',Laptops:'badge-green',Peripherals:'badge-cyan',Accessories:'badge-orange',Services:'badge-green' }

export const useT = () => {
  const lang = useAppStore(s=>s.language)
  return (key) => translations[lang]?.[key] || translations['en']?.[key] || key
}

// Breakpoints: <=860px = mobile (stacked layouts, drawer nav), <=1180px = tablet (narrower panels)
export const useBreakpoint = () => {
  const [width, setWidth] = useState(typeof window!=='undefined' ? window.innerWidth : 1280)
  useEffect(()=>{
    const onResize = () => setWidth(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  },[])
  return { width, isMobile: width<=860, isTablet: width>860&&width<=1180 }
}

export const useKeyboardShortcuts = (shortcuts) => {
  useEffect(()=>{
    const h = (e) => {
      const tag = document.activeElement?.tagName
      const typing = tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT'
      shortcuts.forEach(({key,allowInInput,fn})=>{ if(typing&&!allowInInput) return; if(e.key===key){e.preventDefault();fn()} })
    }
    window.addEventListener('keydown',h)
    return ()=>window.removeEventListener('keydown',h)
  },[shortcuts])
}
