const Bar = ({ w='100%', h=12, r=6, style={} }) => (
  <div className="skeleton" style={{ width:w, height:h, borderRadius:r, ...style }}/>
)

export default function AppSkeleton() {
  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'var(--bg)' }}>

      {/* Sidebar */}
      <aside style={{
        width:220, flexShrink:0, height:'100vh', display:'flex', flexDirection:'column',
        background:'var(--bg2)', borderRight:'1px solid var(--border)',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'16px 14px', borderBottom:'1px solid var(--border)', minHeight:64 }}>
          <Bar w={34} h={34} r={17}/>
          <div style={{ flex:1 }}>
            <Bar w="70%" h={11} style={{ marginBottom:6 }}/>
            <Bar w="50%" h={9}/>
          </div>
        </div>
        <div style={{ flex:1, padding:'14px 8px', display:'flex', flexDirection:'column', gap:8 }}>
          <Bar w="40%" h={9} style={{ margin:'4px 8px 8px' }}/>
          {[1,2].map(i => <Bar key={i} h={36} r={8} style={{ margin:'0 0' }}/>)}
          <Bar w="55%" h={9} style={{ margin:'14px 8px 8px' }}/>
          {[1,2].map(i => <Bar key={i} h={36} r={8}/>)}
          <Bar w="45%" h={9} style={{ margin:'14px 8px 8px' }}/>
          {[1,2].map(i => <Bar key={i} h={36} r={8}/>)}
        </div>
        <div style={{ padding:'12px 8px', borderTop:'1px solid var(--border)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 10px', borderRadius:10, background:'var(--bg3)', border:'1px solid var(--border)' }}>
            <Bar w={34} h={34} r={9}/>
            <div style={{ flex:1 }}>
              <Bar w="70%" h={10} style={{ marginBottom:6 }}/>
              <Bar w="40%" h={8}/>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>
        {/* Topbar */}
        <header style={{ height:52, flexShrink:0, display:'flex', alignItems:'center', gap:12, padding:'0 20px', background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
          <Bar w={120} h={14}/>
          <div style={{ flex:1 }}/>
          <Bar w={70} h={12}/>
        </header>

        {/* Content: product grid + cart panel, mirroring the POS screen */}
        <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
          <div style={{ flex:1, padding:20, overflow:'hidden' }}>
            <div style={{ display:'flex', gap:10, marginBottom:16 }}>
              <Bar w="100%" h={38} r={8} style={{ maxWidth:320 }}/>
              <Bar w={90} h={38} r={8}/>
              <Bar w={90} h={38} r={8}/>
            </div>
            <div style={{
              display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px, 1fr))', gap:14,
            }}>
              {Array.from({ length:12 }).map((_,i) => (
                <div key={i} style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:12, padding:14 }}>
                  <Bar h={80} r={8} style={{ marginBottom:10 }}/>
                  <Bar h={11} style={{ marginBottom:6 }}/>
                  <Bar w="60%" h={11} style={{ marginBottom:6 }}/>
                  <Bar w="40%" h={9}/>
                </div>
              ))}
            </div>
          </div>

          <div style={{ width:340, flexShrink:0, borderLeft:'1px solid var(--border)', background:'var(--bg2)', padding:16, display:'flex', flexDirection:'column', gap:12 }}>
            <Bar w="50%" h={16}/>
            {Array.from({ length:4 }).map((_,i) => (
              <div key={i} style={{ display:'flex', gap:10, alignItems:'center' }}>
                <Bar w={44} h={44} r={8}/>
                <div style={{ flex:1 }}>
                  <Bar h={10} style={{ marginBottom:6 }}/>
                  <Bar w="40%" h={9}/>
                </div>
              </div>
            ))}
            <div style={{ flex:1 }}/>
            <Bar h={44} r={8}/>
          </div>
        </div>
      </div>
    </div>
  )
}
