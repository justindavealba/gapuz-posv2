import { useEffect, useState } from 'react'
import {
  Cpu, CircuitBoard, MemoryStick, HardDrive, Laptop, Monitor, Keyboard, Mouse,
  Headphones, Webcam, Printer, Router, Usb, Cable, Fan, BatteryCharging,
  Gamepad2, Smartphone, Tablet, Wrench, Package,
} from 'lucide-react'
import { useAppStore } from '../store'
import { translations } from '../i18n/translations'

export const peso = (n) => '₱' + Number(n||0).toLocaleString('en-PH',{minimumFractionDigits:2,maximumFractionDigits:2})
export const pesoCompact = (n) => { if(n>=1000000) return '₱'+(n/1000000).toFixed(1)+'M'; if(n>=1000) return '₱'+(n/1000).toFixed(1)+'K'; return '₱'+(n||0).toLocaleString() }
export const fmtDate = (d) => new Date(d).toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'})
export const fmtDateTime = (d) => new Date(d).toLocaleString('en-PH',{month:'short',day:'numeric',year:'numeric',hour:'2-digit',minute:'2-digit'})
export const fmtTxnId = (id) => '#'+String(id).padStart(4,'0')
export const genBarcode = () => 'BC-'+Date.now().toString(36).toUpperCase()

export const stockStatus = (stock) => {
  if(stock===0)  return {label:'Out of stock',cls:'badge-red',   color:'var(--red)',   bg:'rgba(239,68,68,0.1)', border:'rgba(239,68,68,0.22)'}
  if(stock<=5)   return {label:`${stock} left`,cls:'badge-yellow',color:'var(--yellow)',bg:'rgba(245,158,11,0.1)', border:'rgba(245,158,11,0.22)'}
  return               {label:`${stock} in stock`,cls:'badge-green', color:'var(--green)', bg:'rgba(34,197,94,0.1)',border:'rgba(34,197,94,0.2)'}
}

export const getTier = (points) => {
  if(points>=3000) return {label:'Platinum',color:'#8b5cf6',icon:'💎'}
  if(points>=1500) return {label:'Gold',    color:'#eab308',icon:'🥇'}
  if(points>=500)  return {label:'Silver',  color:'#94a3b8',icon:'🥈'}
  return                  {label:'Bronze',  color:'#b45309',icon:'🥉'}
}

// Fallback icon shown for a product with no uploaded image/emoji — matched by
// keyword against the category name so custom categories still get a sensible
// icon instead of the generic box. Order matters: more specific rules first.
const CATEGORY_ICON_RULES = [
  [['processor','cpu'], Cpu],
  [['gpu','graphics','motherboard','mobo','circuit'], CircuitBoard],
  [['ram','memory'], MemoryStick],
  [['storage','ssd','hdd','drive'], HardDrive],
  [['laptop','notebook'], Laptop],
  [['monitor','display','screen'], Monitor],
  [['keyboard'], Keyboard],
  [['mouse','peripheral'], Mouse],
  [['headphone','headset','audio','speaker'], Headphones],
  [['webcam','camera'], Webcam],
  [['printer'], Printer],
  [['network','router','wifi'], Router],
  [['usb','flash'], Usb],
  [['cable','adapter','accessor'], Cable],
  [['fan','cooling','cooler'], Fan],
  [['battery','power','psu'], BatteryCharging],
  [['gaming','console','controller'], Gamepad2],
  [['phone','mobile'], Smartphone],
  [['tablet'], Tablet],
  [['service','repair'], Wrench],
]
export const categoryIcon = (categoryName) => {
  const name = (categoryName||'').toLowerCase()
  const match = CATEGORY_ICON_RULES.find(([keywords])=>keywords.some(k=>name.includes(k)))
  return match ? match[1] : Package
}

// Icon choices an admin can manually pin to a category (stored as the key,
// e.g. "Cpu") when the keyword-based categoryIcon() guess doesn't fit.
export const ICON_MAP = {
  Cpu, CircuitBoard, MemoryStick, HardDrive, Laptop, Monitor, Keyboard, Mouse,
  Headphones, Webcam, Printer, Router, Usb, Cable, Fan, BatteryCharging,
  Gamepad2, Smartphone, Tablet, Wrench, Package,
}
export const ICON_OPTIONS = Object.keys(ICON_MAP)

export const REFUND_REASONS =['Defective product','Wrong item delivered','Customer changed mind','Item not as described','Duplicate purchase','Other']

// Categories now live in the `categories` table (see useCategoryStore) so admins can
// add/remove them from the UI. This is just the picker palette for a new category's badge.
export const BADGE_SWATCHES = [
  { cls:'badge-blue',   hex:'#3b82f6' },
  { cls:'badge-purple', hex:'#8b5cf6' },
  { cls:'badge-accent', hex:'#34d399' },
  { cls:'badge-yellow', hex:'#eab308' },
  { cls:'badge-green',  hex:'#22c55e' },
  { cls:'badge-cyan',   hex:'#06b6d4' },
  { cls:'badge-orange', hex:'#f97316' },
  { cls:'badge-red',    hex:'#ef4444' },
]

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
