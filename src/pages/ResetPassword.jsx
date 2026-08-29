import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store'
import { useToast } from '../utils/toast'

export default function ResetPassword() {
  const [password, setPassword]               = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading]                 = useState(false)
  const { updatePassword } = useAuthStore()
  const navigate = useNavigate()
  const toast    = useToast()

  const handleSubmit = async () => {
    if (!password || !confirmPassword) return toast('Please fill in both fields', 'error')
    if (password.length < 6) return toast('Password must be at least 6 characters', 'error')
    if (password !== confirmPassword) return toast('Passwords do not match', 'error')
    setLoading(true)
    const { error } = await updatePassword(password)
    setLoading(false)
    if (error) return toast(error.message || 'Could not update password — the reset link may have expired', 'error')
    toast('Password updated — please sign in again', 'success')
    navigate('/login')
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)', padding:16 }}>
      <div className="card animate-scale-in" style={{ width:'min(380px,92vw)', padding:32 }}>
        <div style={{ fontSize:20, fontWeight:900, color:'var(--text)', letterSpacing:'-.5px', marginBottom:6 }}>Set a new password</div>
        <div style={{ fontSize:12.5, color:'var(--text2)', marginBottom:24 }}>Choose a new password for your account.</div>

        <div style={{ display:'flex', flexDirection:'column', gap:16, marginBottom:24 }}>
          <div>
            <label style={{ display:'block', fontSize:10, fontWeight:700, color:'var(--text3)', marginBottom:7, textTransform:'uppercase', letterSpacing:'.6px' }}>New Password</label>
            <input className="input-field" type="password" value={password}
                   onChange={e=>setPassword(e.target.value)}
                   placeholder="At least 6 characters"
                   onKeyDown={e=>e.key==='Enter'&&handleSubmit()}/>
          </div>
          <div>
            <label style={{ display:'block', fontSize:10, fontWeight:700, color:'var(--text3)', marginBottom:7, textTransform:'uppercase', letterSpacing:'.6px' }}>Confirm Password</label>
            <input className="input-field" type="password" value={confirmPassword}
                   onChange={e=>setConfirmPassword(e.target.value)}
                   placeholder="Re-enter password"
                   onKeyDown={e=>e.key==='Enter'&&handleSubmit()}/>
          </div>
        </div>

        <button onClick={handleSubmit} disabled={loading} className="btn-primary" style={{ width:'100%', padding:13, fontSize:14 }}>
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </div>
    </div>
  )
}
