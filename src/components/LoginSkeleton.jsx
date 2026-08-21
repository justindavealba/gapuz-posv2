import { useBreakpoint } from '../utils/helpers'

const Bar = ({ w='100%', h=12, r=6, style={} }) => (
  <div className="skeleton" style={{ width:w, height:h, borderRadius:r, ...style }}/>
)

export default function LoginSkeleton() {
  const { isMobile } = useBreakpoint()

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:isMobile?'column':'row', background:'var(--bg)', overflow:isMobile?'visible':'hidden' }}>

      {/* Left panel — branding, mirrors Login.jsx */}
      {isMobile ? (
        <div style={{
          display:'flex', alignItems:'center', gap:14, padding:'22px 24px',
          background:'linear-gradient(155deg, var(--accent) 0%, var(--accent2) 100%)',
          flexShrink:0,
        }}>
          <div style={{ width:52, height:52, borderRadius:'50%', background:'rgba(0,0,0,0.12)', flexShrink:0 }}/>
          <div style={{ flex:1 }}>
            <Bar w="70%" h={14} style={{ background:'rgba(0,0,0,0.12)', marginBottom:8 }}/>
            <Bar w="40%" h={10} style={{ background:'rgba(0,0,0,0.12)' }}/>
          </div>
        </div>
      ) : (
        <div style={{
          flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:26,
          background:'linear-gradient(155deg, var(--accent) 0%, var(--accent2) 100%)',
          padding:48,
        }}>
          <div style={{ width:198, height:198, borderRadius:'50%', background:'rgba(0,0,0,0.1)' }}/>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
            <Bar w={220} h={22} style={{ background:'rgba(0,0,0,0.12)' }}/>
            <Bar w={140} h={22} style={{ background:'rgba(0,0,0,0.12)' }}/>
            <Bar w={100} h={11} style={{ background:'rgba(0,0,0,0.1)', marginTop:6 }}/>
          </div>
        </div>
      )}

      {/* Right panel — login form, mirrors Login.jsx */}
      <div style={{
        width: isMobile ? '100%' : 440, flex: isMobile ? 1 : 'none',
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        background:'var(--bg2)', padding: isMobile ? '32px 24px' : 48,
        borderLeft: isMobile ? 'none' : '1px solid var(--border)',
      }}>
        <div style={{ width:'100%', maxWidth:340 }}>
          <div style={{ marginBottom:36 }}>
            <Bar w="60%" h={20} style={{ marginBottom:10 }}/>
            <Bar w="80%" h={12}/>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:16, marginBottom:24 }}>
            <div>
              <Bar w={60} h={9} style={{ marginBottom:8 }}/>
              <Bar h={42} r={8}/>
            </div>
            <div>
              <Bar w={70} h={9} style={{ marginBottom:8 }}/>
              <Bar h={42} r={8}/>
            </div>
          </div>

          <Bar h={44} r={8}/>
        </div>
      </div>
    </div>
  )
}
