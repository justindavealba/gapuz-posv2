import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore, useAppStore } from './store'
import { ToastProvider } from './utils/toast'
import Login     from './pages/Login'
import Layout    from './components/Layout'
import POS       from './pages/POS'
import Dashboard from './pages/Dashboard'
import Products  from './pages/Products'
import Reports   from './pages/Reports'
import Customers from './pages/Customers'
import Refunds   from './pages/Refunds'

function Guard({ children, adminOnly=false }) {
  const { user, role } = useAuthStore()
  if (!user) return <Navigate to="/login" replace/>
  if (adminOnly && role !== 'admin') return <Navigate to="/pos" replace/>
  return children
}

export default function App() {
  const { theme } = useAppStore()
  
  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light')
    document.title = 'Gapuz POS'

    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 64; canvas.height = 64
      const ctx = canvas.getContext('2d')
      ctx.beginPath()
      ctx.arc(32, 32, 32, 0, Math.PI * 2)
      ctx.clip()
      ctx.drawImage(img, 0, 0, 64, 64)
      let link = document.querySelector("link[rel~='icon']")
      if (!link) {
        link = document.createElement('link')
        link.rel = 'icon'
        document.head.appendChild(link)
      }
      link.href = canvas.toDataURL()
    }
    img.src = '/logo.png'
  }, [theme])

  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login/>}/>
          <Route path="/" element={<Guard><Layout/></Guard>}>
            <Route index element={<Navigate to="/pos" replace/>}/>
            <Route path="pos"       element={<POS/>}/>
            <Route path="dashboard" element={<Guard adminOnly><Dashboard/></Guard>}/>
            <Route path="products"  element={<Guard adminOnly><Products/></Guard>}/>
            <Route path="reports"   element={<Guard adminOnly><Reports/></Guard>}/>
            <Route path="customers" element={<Customers/>}/>
            <Route path="refunds"   element={<Refunds/>}/>
          </Route>
          <Route path="*" element={<Navigate to="/" replace/>}/>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}
