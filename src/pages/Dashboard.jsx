import { useMemo, useState } from 'react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { useTransactionStore, useProductStore, useAuthStore, useCustomerStore, useRefundStore } from '../store'
import { useT, peso, pesoCompact, getTier } from '../utils/helpers'
import { CHART_COLORS, ACCENT, RED, YELLOW, PURPLE, SLATE } from '../utils/colors'

const COLORS = CHART_COLORS

const TabIcon = ({ children }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}>
    {children}
  </svg>
)

const TABS = [
  { id:'overview',  label:'Overview',  icon: <TabIcon><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></TabIcon> },
  { id:'inventory', label:'Inventory', icon: <TabIcon><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></TabIcon> },
  { id:'customers', label:'Customers', icon: <TabIcon><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></TabIcon> },
  { id:'refunds',   label:'Refunds',   icon: <TabIcon><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></TabIcon> },
  { id:'reports',   label:'Reports',   icon: <TabIcon><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></TabIcon> },
]

function MetricCard({ label, value, sub, subUp, color }) {
  return (
    <div className="card" style={{padding:20,borderTop:`2px solid ${color}`}}>
      <div style={{fontSize:10,color:'var(--text3)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.5px',marginBottom:8}}>{label}</div>
      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:24,fontWeight:700,marginBottom:5,color}}>{value}</div>
      {sub&&<div style={{fontSize:11,color:subUp?'var(--green)':'var(--text3)'}}>{sub}</div>}
    </div>
  )
}

function StatCard({ label, value, color }) {
  return (
    <div className="card" style={{padding:16,borderTop:`2px solid ${color}`}}>
      <div style={{fontSize:9.5,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:5}}>{label}</div>
      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:20,fontWeight:700,color}}>{value}</div>
    </div>
  )
}

export default function Dashboard() {
  const transactions = useTransactionStore(s=>s.transactions)
  const products     = useProductStore(s=>s.products)
  const customers    = useCustomerStore(s=>s.customers)
  const refunds      = useRefundStore(s=>s.refunds)
  const { user }     = useAuthStore()
  const t            = useT()
  const [activeTab,  setActiveTab] = useState('overview')
  const [repPeriod,  setRepPeriod] = useState('today')

  const now   = new Date()
  const today = new Date(now); today.setHours(0,0,0,0)

  // ── TODAY METRICS ─────────────────────────────────────────
  const todayTxns = useMemo(()=>transactions.filter(tx=>{ const d=new Date(tx.createdAt); d.setHours(0,0,0,0); return d.getTime()===today.getTime() }),[transactions])
  const revenue   = todayTxns.reduce((s,t)=>s+t.total,0)
  const itemsSold = todayTxns.reduce((s,t)=>s+(t.items||[]).reduce((a,i)=>a+i.qty,0),0)
  const aov       = todayTxns.length?Math.round(revenue/todayTxns.length):0
  const yest      = new Date(today); yest.setDate(yest.getDate()-1)
  const yesterdayRev = transactions.filter(tx=>{ const d=new Date(tx.createdAt); d.setHours(0,0,0,0); return d.getTime()===yest.getTime() }).reduce((s,t)=>s+t.total,0)
  const revChange = yesterdayRev?Math.round(((revenue-yesterdayRev)/yesterdayRev)*100):0

  // ── CHARTS ────────────────────────────────────────────────
  const weekData  = useMemo(()=>{ const days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat']; return Array.from({length:7},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-(6-i)); d.setHours(0,0,0,0); const dt=transactions.filter(tx=>{ const td=new Date(tx.createdAt); td.setHours(0,0,0,0); return td.getTime()===d.getTime() }); return {label:days[d.getDay()],value:dt.reduce((s,t)=>s+t.total,0)} }) },[transactions])
  const areaData  = useMemo(()=>Array.from({length:14},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-(13-i)); d.setHours(0,0,0,0); const dt=transactions.filter(tx=>{ const td=new Date(tx.createdAt); td.setHours(0,0,0,0); return td.getTime()===d.getTime() }); return {label:d.toLocaleDateString('en-PH',{month:'short',day:'numeric'}),revenue:dt.reduce((s,t)=>s+t.total,0)} }),[transactions])
  const payBreak  = useMemo(()=>{ const map={}; transactions.forEach(t=>{map[t.payment]=(map[t.payment]||0)+t.total}); return Object.entries(map).map(([name,value])=>({name,value})) },[transactions])
  const topProds  = useMemo(()=>{ const map={}; transactions.forEach(tx=>(tx.items||[]).forEach(i=>{ if(!map[i.name]) map[i.name]={name:i.name,sold:0,revenue:0}; map[i.name].sold+=i.qty; map[i.name].revenue+=i.qty*i.price })); return Object.values(map).sort((a,b)=>b.sold-a.sold).slice(0,5) },[transactions])
  const leastProds= useMemo(()=>{ const map={}; transactions.forEach(tx=>(tx.items||[]).forEach(i=>{ if(!map[i.name]) map[i.name]={name:i.name,sold:0,revenue:0}; map[i.name].sold+=i.qty; map[i.name].revenue+=i.qty*i.price })); products.forEach(p=>{ if(!map[p.name]) map[p.name]={name:p.name,sold:0,revenue:0} }); return Object.values(map).sort((a,b)=>a.sold-b.sold).slice(0,5) },[transactions,products])

  // ── INVENTORY ANALYTICS ───────────────────────────────────
  const totalValue = products.reduce((s,p)=>s+p.price*p.stock,0)
  const lowStock   = products.filter(p=>p.stock>0&&p.stock<=5&&p.category!=='Services')
  const outStock   = products.filter(p=>p.stock===0&&p.category!=='Services')
  const catData    = useMemo(()=>{ const map={}; products.forEach(p=>{ map[p.category]=(map[p.category]||0)+1 }); return Object.entries(map).map(([name,value])=>({name,value})) },[products])
  const catRevenue = useMemo(()=>{ const map={}; transactions.forEach(tx=>(tx.items||[]).forEach(i=>{ const prod=products.find(p=>p.name===i.name); const cat=prod?.category||'Other'; map[cat]=(map[cat]||0)+i.qty*i.price })); return Object.entries(map).map(([name,value])=>({name,value:Math.round(value)})).sort((a,b)=>b.value-a.value) },[transactions,products])

  // ── CUSTOMER ANALYTICS ────────────────────────────────────
  const totalPoints    = customers.reduce((s,c)=>s+c.points,0)
  const platinumCount  = customers.filter(c=>c.points>=3000).length
  const goldCount      = customers.filter(c=>c.points>=1500&&c.points<3000).length
  const silverCount    = customers.filter(c=>c.points>=500&&c.points<1500).length
  const bronzeCount    = customers.filter(c=>c.points<500).length
  const tierData       = [
    {name:'Platinum',value:platinumCount,color:PURPLE},
    {name:'Gold',    value:goldCount,    color:YELLOW},
    {name:'Silver',  value:silverCount,  color:SLATE},
    {name:'Bronze',  value:bronzeCount,  color:ACCENT},
  ].filter(t=>t.value>0)
  const topCustomers   = useMemo(()=>[...customers].sort((a,b)=>b.totalSpent-a.totalSpent).slice(0,5),[customers])

  // ── REFUNDS ANALYTICS ─────────────────────────────────────
  const pendingRef  = refunds.filter(r=>r.status==='Pending').length
  const approvedRef = refunds.filter(r=>r.status==='Approved').length
  const rejectedRef = refunds.filter(r=>r.status==='Rejected').length
  const totalRef    = refunds.filter(r=>r.status==='Approved').reduce((s,r)=>s+r.total,0)
  const refStatusData = [
    {name:'Pending', value:pendingRef,  color:YELLOW},
    {name:'Approved',value:approvedRef, color:ACCENT},
    {name:'Rejected',value:rejectedRef, color:RED},
  ].filter(r=>r.value>0)

  // ── REPORTS ANALYTICS ─────────────────────────────────────
  const repFiltered = useMemo(()=>{
    const start=new Date()
    if(repPeriod==='today') start.setHours(0,0,0,0)
    else if(repPeriod==='this_week'){start.setDate(start.getDate()-6);start.setHours(0,0,0,0)}
    else{start.setDate(1);start.setHours(0,0,0,0)}
    return transactions.filter(tx=>new Date(tx.createdAt)>=start)
  },[transactions,repPeriod])
  const repRevenue = repFiltered.reduce((s,t)=>s+t.total,0)
  const repVat     = repFiltered.reduce((s,t)=>s+t.vat,0)
  const repAvg     = repFiltered.length?Math.round(repRevenue/repFiltered.length):0
  const repChartData = useMemo(()=>{
    if(repPeriod==='today') return Array.from({length:17},(_,i)=>{ const h=i+6; const hrs=repFiltered.filter(tx=>new Date(tx.createdAt).getHours()===h); return {label:`${h}:00`,value:hrs.reduce((s,t)=>s+t.total,0)} })
    const days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
    return Array.from({length:7},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-(6-i)); d.setHours(0,0,0,0); const dt=repFiltered.filter(tx=>{const td=new Date(tx.createdAt);td.setHours(0,0,0,0);return td.getTime()===d.getTime()}); return {label:days[d.getDay()],value:dt.reduce((s,t)=>s+t.total,0)} })
  },[repFiltered,repPeriod])
  const repLeast = useMemo(()=>{ const map={}; repFiltered.forEach(tx=>(tx.items||[]).forEach(i=>{ if(!map[i.name]) map[i.name]={name:i.name,sold:0,revenue:0}; map[i.name].sold+=i.qty; map[i.name].revenue+=i.qty*i.price })); products.forEach(p=>{ if(!map[p.name]) map[p.name]={name:p.name,sold:0,revenue:0} }); return Object.values(map).sort((a,b)=>a.sold-b.sold).slice(0,5) },[repFiltered,products])
  const repTop   = useMemo(()=>{ const map={}; repFiltered.forEach(tx=>(tx.items||[]).forEach(i=>{ if(!map[i.name]) map[i.name]={name:i.name,sold:0,revenue:0}; map[i.name].sold+=i.qty; map[i.name].revenue+=i.qty*i.price })); return Object.values(map).sort((a,b)=>b.sold-a.sold).slice(0,5) },[repFiltered])

  const hour     = now.getHours()
  const greeting = hour<12?t('good_morning'):hour<17?t('good_afternoon'):t('good_evening')
  const Tip      = ({active,payload,label})=>{ if(!active||!payload?.length) return null; return <div className="card" style={{padding:'8px 12px',fontSize:12}}><div style={{color:'var(--text3)',marginBottom:3}}>{label}</div><div style={{fontFamily:"'JetBrains Mono',monospace",color:'var(--accent)'}}>{peso(payload[0].value)}</div></div> }

  return (
    <div style={{height:'100%',overflowY:'auto',padding:20,display:'flex',flexDirection:'column',gap:20}}>

      {/* HEADER */}
      <div>
        <div style={{fontSize:20,fontWeight:700}}>{greeting}, <span style={{color:'var(--accent)'}}>{user?.name||'Admin'}</span> 👋</div>
        <div style={{color:'var(--text2)',fontSize:13,marginTop:3}}>{now.toLocaleDateString('en-PH',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</div>
      </div>

      {/* TABS */}
      <div style={{display:'flex',gap:6,borderBottom:'1px solid var(--border)',paddingBottom:0,overflowX:'auto',flexShrink:0}}>
        {TABS.map(tab=>(
          <button key={tab.id} onClick={()=>setActiveTab(tab.id)}
            style={{
              display:'flex',alignItems:'center',gap:7,whiteSpace:'nowrap',
              padding:'9px 18px',fontSize:12,fontWeight:600,border:'none',cursor:'pointer',
              borderRadius:'8px 8px 0 0',transition:'all .15s',
              background: activeTab===tab.id ? 'var(--accent)' : 'var(--bg2)',
              color:       activeTab===tab.id ? '#0a0a0a'       : 'var(--text3)',
              borderBottom: activeTab===tab.id ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: activeTab===tab.id ? '-1px' : '0',
            }}>
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {/* ══════════ OVERVIEW TAB ══════════ */}
      {activeTab==='overview' && <>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:14}}>
          <MetricCard label={t('today_revenue')} value={pesoCompact(revenue)} sub={`${revChange>=0?'▲ +':'▼ '}${revChange}% ${t('vs_yesterday')}`} subUp={revChange>=0} color="var(--accent)"/>
          <MetricCard label={t('transactions')} value={todayTxns.length} sub="Today" subUp color="var(--green)"/>
          <MetricCard label={t('items_sold')} value={itemsSold} sub="Today" subUp color="var(--purple)"/>
          <MetricCard label={t('avg_order')} value={pesoCompact(aov)} sub="Today" subUp color="var(--yellow)"/>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(340px,1fr))',gap:14}}>
          <div className="card" style={{padding:20}}>
            <div style={{fontWeight:600,fontSize:13,marginBottom:14}}>Revenue — Last 14 Days</div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={areaData}>
                <defs><linearGradient id="rg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={ACCENT} stopOpacity={0.25}/><stop offset="95%" stopColor={ACCENT} stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
                <XAxis dataKey="label" tick={{fontSize:10,fill:'var(--text3)'}} tickLine={false} axisLine={false} interval={1}/>
                <YAxis tick={{fontSize:10,fill:'var(--text3)'}} tickLine={false} axisLine={false} tickFormatter={v=>v>=1000?Math.round(v/1000)+'k':v}/>
                <Tooltip content={<Tip/>}/>
                <Area type="monotone" dataKey="revenue" stroke={ACCENT} strokeWidth={2} fill="url(#rg)"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="card" style={{padding:20}}>
            <div style={{fontWeight:600,fontSize:13,marginBottom:14}}>Payment Methods</div>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart><Pie data={payBreak} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>{payBreak.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Pie><Tooltip formatter={v=>peso(v)}/><Legend iconSize={8} wrapperStyle={{fontSize:11}}/></PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))',gap:14}}>
          <div className="card" style={{padding:20}}>
            <div style={{fontWeight:600,fontSize:13,marginBottom:14}}>{t('weekly_sales')}</div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={weekData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
                <XAxis dataKey="label" tick={{fontSize:11,fill:'var(--text3)'}} tickLine={false} axisLine={false}/>
                <YAxis tick={{fontSize:10,fill:'var(--text3)'}} tickLine={false} axisLine={false} tickFormatter={v=>v>=1000?Math.round(v/1000)+'k':v}/>
                <Tooltip formatter={v=>peso(v)} cursor={{fill:'rgba(255,255,255,0.03)'}}/>
                <Bar dataKey="value" radius={[5,5,0,0]}>{weekData.map((_,i)=><Cell key={i} fill={i===weekData.length-1?ACCENT:'var(--bg5)'}/>)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card" style={{padding:20}}>
            <div style={{fontWeight:600,fontSize:13,marginBottom:14}}>🏆 {t('top_products')}</div>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {topProds.length===0?<div style={{color:'var(--text3)',fontSize:12,textAlign:'center',padding:'20px 0'}}>{t('no_data')}</div>
              :topProds.map((p,i)=>(
                <div key={p.name} style={{display:'flex',alignItems:'center',gap:10}}>
                  <span style={{fontSize:11,color:'var(--text3)',fontFamily:"'JetBrains Mono',monospace",width:14}}>{i+1}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.name}</div>
                    <div style={{marginTop:3,height:3,background:'var(--bg5)',borderRadius:2,overflow:'hidden'}}><div style={{height:'100%',borderRadius:2,background:COLORS[i],width:`${Math.round((p.sold/(topProds[0]?.sold||1))*100)}%`,transition:'width .5s'}}/></div>
                  </div>
                  <div style={{textAlign:'right',flexShrink:0}}>
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:'var(--green)'}}>{peso(p.revenue)}</div>
                    <div style={{fontSize:10,color:'var(--text3)'}}>{p.sold} sold</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* LEAST SELLING */}
        <div className="card" style={{padding:20,borderTop:'2px solid var(--red)'}}>
          <div style={{fontWeight:600,fontSize:13,marginBottom:4}}>📉 Least Selling Products</div>
          <div style={{fontSize:11,color:'var(--text3)',marginBottom:14}}>Products with the lowest sales — consider promotions or restocking decisions</div>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {leastProds.length===0?<div style={{color:'var(--text3)',fontSize:12,textAlign:'center',padding:'20px 0'}}>No sales data yet.</div>
            :leastProds.map((p,i)=>(
              <div key={p.name} style={{display:'flex',alignItems:'center',gap:10}}>
                <span style={{fontSize:11,color:'var(--red)',fontFamily:"'JetBrains Mono',monospace",width:14}}>{i+1}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.name}</div>
                  <div style={{marginTop:3,height:3,background:'var(--bg5)',borderRadius:2,overflow:'hidden'}}><div style={{height:'100%',borderRadius:2,background:'var(--red)',width:p.sold===0?'4%':`${Math.min(100,Math.round((p.sold/(topProds[0]?.sold||1))*100))}%`,transition:'width .5s'}}/></div>
                </div>
                <div style={{textAlign:'right',flexShrink:0}}>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:'var(--red)'}}>{peso(p.revenue)}</div>
                  <div style={{fontSize:10,color:'var(--text3)'}}>{p.sold} sold</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ALERTS */}
        <div>
          <div className="section-title">{t('ai_insights')}</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:14}}>
            <div className="card" style={{padding:16,borderTop:'2px solid var(--yellow)'}}>
              <div style={{fontSize:20,marginBottom:8}}>⚠️</div>
              <div style={{fontWeight:600,fontSize:12,color:'var(--yellow)',marginBottom:4}}>{t('low_stock_alert')}</div>
              <div style={{fontSize:11,color:'var(--text2)',lineHeight:1.5}}>{lowStock.length===0?'All products have healthy stock.':`${lowStock.length} product(s) running low: ${lowStock.map(p=>p.name).slice(0,2).join(', ')}${lowStock.length>2?'...':''}`}</div>
            </div>
            <div className="card" style={{padding:16,borderTop:`2px solid ${outStock.length?'var(--red)':'var(--green)'}`}}>
              <div style={{fontSize:20,marginBottom:8}}>{outStock.length?'🚫':'✅'}</div>
              <div style={{fontWeight:600,fontSize:12,color:outStock.length?'var(--red)':'var(--green)',marginBottom:4}}>{t('out_of_stock_alert')}</div>
              <div style={{fontSize:11,color:'var(--text2)',lineHeight:1.5}}>{outStock.length===0?'No products are out of stock.':`${outStock.length} item(s) need restocking.`}</div>
            </div>
            <div className="card" style={{padding:16,borderTop:'2px solid var(--red)'}}>
              <div style={{fontSize:20,marginBottom:8}}>📉</div>
              <div style={{fontWeight:600,fontSize:12,color:'var(--red)',marginBottom:4}}>Least Selling</div>
              <div style={{fontSize:11,color:'var(--text2)',lineHeight:1.5}}>{leastProds[0]?`${leastProds[0].name} — only ${leastProds[0].sold} unit(s) sold`:'No sales data yet.'}</div>
            </div>
          </div>
        </div>

        {/* RECENT TRANSACTIONS */}
        <div>
          <div className="section-title">{t('recent_txns')}</div>
          <div className="tbl-wrap">
            <table>
              <thead><tr>{['TXN #','Time','Customer','Items','Payment','Total'].map(h=><th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {transactions.length===0?<tr><td colSpan={6} style={{textAlign:'center',padding:40,color:'var(--text3)'}}>{t('no_data')}</td></tr>
                :transactions.slice(0,8).map(tx=>(
                  <tr key={tx.id}>
                    <td style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:'var(--accent)'}}>#{String(tx.id).padStart(4,'0')}</td>
                    <td style={{fontSize:11,color:'var(--text3)'}}>{new Date(tx.createdAt).toLocaleTimeString('en-PH',{hour:'2-digit',minute:'2-digit'})}</td>
                    <td style={{fontSize:12}}>{tx.customerName||'Walk-in'}</td>
                    <td style={{fontSize:11,color:'var(--text3)'}}>{(tx.items||[]).length} item(s)</td>
                    <td><span className={`badge ${tx.payment==='Cash'?'badge-green':tx.payment==='GCash'?'badge-blue':'badge-purple'}`} style={{fontSize:10}}>{tx.payment}</span></td>
                    <td style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:'var(--green)',fontWeight:600}}>{peso(tx.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </>}

      {/* ══════════ INVENTORY TAB ══════════ */}
      {activeTab==='inventory' && <>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:14}}>
          <StatCard label="Total Products"   value={products.length}      color="var(--accent)"/>
          <StatCard label="Inventory Value"  value={peso(totalValue)}     color="var(--green)"/>
          <StatCard label="Low Stock Items"  value={lowStock.length}      color="var(--yellow)"/>
          <StatCard label="Out of Stock"     value={outStock.length}      color="var(--red)"/>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))',gap:14}}>
          <div className="card" style={{padding:20}}>
            <div style={{fontWeight:600,fontSize:13,marginBottom:14}}>📦 Products by Category</div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart><Pie data={catData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>{catData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Pie><Tooltip/><Legend iconSize={8} wrapperStyle={{fontSize:11}}/></PieChart>
            </ResponsiveContainer>
          </div>
          <div className="card" style={{padding:20}}>
            <div style={{fontWeight:600,fontSize:13,marginBottom:14}}>💰 Revenue by Category</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={catRevenue} layout="vertical" barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false}/>
                <XAxis type="number" tick={{fontSize:9,fill:'var(--text3)'}} tickLine={false} axisLine={false} tickFormatter={v=>v>=1000?Math.round(v/1000)+'k':v}/>
                <YAxis type="category" dataKey="name" tick={{fontSize:10,fill:'var(--text3)'}} tickLine={false} axisLine={false} width={80}/>
                <Tooltip formatter={v=>peso(v)}/>
                <Bar dataKey="value" fill={ACCENT} radius={[0,4,4,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))',gap:14}}>
          <div className="card" style={{padding:20,borderTop:'2px solid var(--yellow)'}}>
            <div style={{fontWeight:600,fontSize:13,marginBottom:12}}>⚠️ Low Stock Products</div>
            {lowStock.length===0?<div style={{color:'var(--text3)',fontSize:12,textAlign:'center',padding:20}}>All products have healthy stock! ✅</div>
            :lowStock.map(p=>(
              <div key={p.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:'1px solid var(--border)'}}>
                <div>
                  <div style={{fontSize:12,fontWeight:500}}>{p.name}</div>
                  <div style={{fontSize:10,color:'var(--text3)'}}>{p.category}</div>
                </div>
                <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,fontWeight:700,color:'var(--yellow)'}}>{p.stock} left</span>
              </div>
            ))}
          </div>
          <div className="card" style={{padding:20,borderTop:'2px solid var(--red)'}}>
            <div style={{fontWeight:600,fontSize:13,marginBottom:12}}>🚫 Out of Stock Products</div>
            {outStock.length===0?<div style={{color:'var(--text3)',fontSize:12,textAlign:'center',padding:20}}>No out of stock products! ✅</div>
            :outStock.map(p=>(
              <div key={p.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:'1px solid var(--border)'}}>
                <div>
                  <div style={{fontSize:12,fontWeight:500}}>{p.name}</div>
                  <div style={{fontSize:10,color:'var(--text3)'}}>{p.category}</div>
                </div>
                <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:700,color:'var(--red)'}}>OUT</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))',gap:14}}>
          <div className="card" style={{padding:20,borderTop:'2px solid var(--accent)'}}>
            <div style={{fontWeight:600,fontSize:13,marginBottom:12}}>🏆 Top Selling Products</div>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {topProds.length===0?<div style={{color:'var(--text3)',fontSize:12,textAlign:'center',padding:20}}>No sales data yet.</div>
              :topProds.map((p,i)=>(
                <div key={p.name} style={{display:'flex',alignItems:'center',gap:10}}>
                  <span style={{fontSize:11,color:'var(--text3)',fontFamily:"'JetBrains Mono',monospace",width:14}}>{i+1}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.name}</div>
                    <div style={{marginTop:3,height:3,background:'var(--bg5)',borderRadius:2,overflow:'hidden'}}><div style={{height:'100%',borderRadius:2,background:'var(--accent)',width:`${Math.round((p.sold/(topProds[0]?.sold||1))*100)}%`}}/></div>
                  </div>
                  <div style={{textAlign:'right',flexShrink:0}}>
                    <div style={{fontSize:11,color:'var(--green)',fontFamily:"'JetBrains Mono',monospace"}}>{peso(p.revenue)}</div>
                    <div style={{fontSize:10,color:'var(--text3)'}}>{p.sold} sold</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="card" style={{padding:20,borderTop:'2px solid var(--red)'}}>
            <div style={{fontWeight:600,fontSize:13,marginBottom:12}}>📉 Least Selling Products</div>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {leastProds.length===0?<div style={{color:'var(--text3)',fontSize:12,textAlign:'center',padding:20}}>No sales data yet.</div>
              :leastProds.map((p,i)=>(
                <div key={p.name} style={{display:'flex',alignItems:'center',gap:10}}>
                  <span style={{fontSize:11,color:'var(--red)',fontFamily:"'JetBrains Mono',monospace",width:14}}>{i+1}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.name}</div>
                    <div style={{marginTop:3,height:3,background:'var(--bg5)',borderRadius:2,overflow:'hidden'}}><div style={{height:'100%',borderRadius:2,background:'var(--red)',width:p.sold===0?'4%':`${Math.min(100,Math.round((p.sold/(topProds[0]?.sold||1))*100))}%`}}/></div>
                  </div>
                  <div style={{textAlign:'right',flexShrink:0}}>
                    <div style={{fontSize:11,color:'var(--red)',fontFamily:"'JetBrains Mono',monospace"}}>{peso(p.revenue)}</div>
                    <div style={{fontSize:10,color:'var(--text3)'}}>{p.sold} sold</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </>}

      {/* ══════════ CUSTOMERS TAB ══════════ */}
      {activeTab==='customers' && <>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:14}}>
          <StatCard label="Total Customers"  value={customers.length}             color="var(--accent)"/>
          <StatCard label="Total Points"     value={totalPoints.toLocaleString()} color="var(--yellow)"/>
          <StatCard label="Platinum Members" value={platinumCount}                color="var(--blue)"/>
          <StatCard label="Gold Members"     value={goldCount}                    color="var(--yellow)"/>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))',gap:14}}>
          <div className="card" style={{padding:20}}>
            <div style={{fontWeight:600,fontSize:13,marginBottom:4}}>🎖️ Customer Loyalty Tiers</div>
            <div style={{fontSize:11,color:'var(--text3)',marginBottom:14}}>Every 1 transaction = 10 loyalty points</div>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={tierData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                  {tierData.map((t,i)=><Cell key={i} fill={t.color}/>)}
                </Pie>
                <Tooltip/>
                <Legend iconSize={8} wrapperStyle={{fontSize:11}}/>
              </PieChart>
            </ResponsiveContainer>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))',gap:8,marginTop:8}}>
              {[{label:'🏅 Bronze',  count:bronzeCount,   pts:'0–499 pts',    color:'var(--accent)'},
                {label:'🥈 Silver',  count:silverCount,   pts:'500–1499 pts', color:SLATE},
                {label:'🥇 Gold',    count:goldCount,     pts:'1500–2999 pts',color:'var(--yellow)'},
                {label:'💎 Platinum',count:platinumCount, pts:'3000+ pts',    color:'var(--purple)'}].map(t=>(
                <div key={t.label} style={{padding:10,background:'var(--bg2)',borderRadius:8,borderLeft:`3px solid ${t.color}`}}>
                  <div style={{fontSize:11,fontWeight:600,color:t.color}}>{t.label}</div>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:14,fontWeight:700,margin:'3px 0'}}>{t.count}</div>
                  <div style={{fontSize:9.5,color:'var(--text3)'}}>{t.pts}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{padding:20}}>
            <div style={{fontWeight:600,fontSize:13,marginBottom:14}}>🌟 Top Customers by Spending</div>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {topCustomers.length===0?<div style={{color:'var(--text3)',fontSize:12,textAlign:'center',padding:20}}>No customers yet.</div>
              :topCustomers.map((c,i)=>{
                const tier = getTier(c.points)
                return (
                  <div key={c.id} style={{display:'flex',alignItems:'center',gap:10}}>
                    <div style={{width:28,height:28,borderRadius:8,background:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'#0a0a0a',flexShrink:0}}>{c.name.charAt(0)}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.name}</div>
                      <div style={{fontSize:10,color:tier.color}}>{tier.icon} {tier.label} · {c.points} pts</div>
                    </div>
                    <div style={{textAlign:'right',flexShrink:0}}>
                      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:'var(--green)',fontWeight:600}}>{peso(c.totalSpent||0)}</div>
                      <div style={{fontSize:10,color:'var(--text3)'}}>{c.purchases} txns</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </>}

      {/* ══════════ REFUNDS TAB ══════════ */}
      {activeTab==='refunds' && <>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:14}}>
          <StatCard label="Total Refunds"  value={refunds.length}   color="var(--blue)"/>
          <StatCard label="Pending"        value={pendingRef}       color="var(--yellow)"/>
          <StatCard label="Approved"       value={approvedRef}      color="var(--accent)"/>
          <StatCard label="Total Refunded" value={peso(totalRef)}   color="var(--red)"/>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))',gap:14}}>
          <div className="card" style={{padding:20}}>
            <div style={{fontWeight:600,fontSize:13,marginBottom:14}}>🔄 Refund Status Breakdown</div>
            {refStatusData.length===0
              ? <div style={{color:'var(--text3)',fontSize:12,textAlign:'center',padding:40}}>No refunds yet.</div>
              : <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={refStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                      {refStatusData.map((r,i)=><Cell key={i} fill={r.color}/>)}
                    </Pie>
                    <Tooltip/>
                    <Legend iconSize={8} wrapperStyle={{fontSize:11}}/>
                  </PieChart>
                </ResponsiveContainer>
            }
          </div>
          <div className="card" style={{padding:20}}>
            <div style={{fontWeight:600,fontSize:13,marginBottom:14}}>📋 Recent Refund Requests</div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {refunds.length===0?<div style={{color:'var(--text3)',fontSize:12,textAlign:'center',padding:20}}>No refunds yet.</div>
              :refunds.slice(0,6).map(r=>(
                <div key={r.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:'1px solid var(--border)'}}>
                  <div>
                    <div style={{fontSize:11,fontWeight:600,color:'var(--accent)'}}>#{String(r.id).padStart(4,'0')}</div>
                    <div style={{fontSize:10,color:'var(--text3)'}}>{r.customerName||'Walk-in'} · {r.reason}</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:'var(--red)',fontWeight:600}}>{peso(r.total)}</div>
                    <span style={{fontSize:9,fontWeight:700,padding:'2px 7px',borderRadius:99,background:r.status==='Approved'?'rgba(52,211,153,0.1)':r.status==='Rejected'?'rgba(239,68,68,0.1)':'rgba(234,179,8,0.1)',color:r.status==='Approved'?'var(--accent)':r.status==='Rejected'?'var(--red)':'var(--yellow)'}}>{r.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </>}

      {/* ══════════ REPORTS TAB ══════════ */}
      {activeTab==='reports' && <>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <span style={{fontSize:12,color:'var(--text3)'}}>Period:</span>
          {['today','this_week','this_month'].map(p=>(
            <button key={p} onClick={()=>setRepPeriod(p)}
              style={{padding:'6px 14px',fontSize:11,fontWeight:600,border:`1px solid ${repPeriod===p?'var(--blue)':'var(--border)'}`,borderRadius:6,cursor:'pointer',background:repPeriod===p?'var(--blue)':'var(--bg2)',color:repPeriod===p?'#ffffff':'var(--text3)',transition:'all .15s'}}>
              {p==='today'?'Today':p==='this_week'?'This Week':'This Month'}
            </button>
          ))}
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:14}}>
          <StatCard label="Total Revenue"   value={peso(repRevenue)}       color="var(--accent)"/>
          <StatCard label="Transactions"    value={repFiltered.length}     color="var(--green)"/>
          <StatCard label="Total VAT"       value={peso(repVat)}           color="var(--purple)"/>
          <StatCard label="Average Order"   value={peso(repAvg)}           color="var(--yellow)"/>
        </div>

        <div className="card" style={{padding:20}}>
          <div style={{fontWeight:600,fontSize:13,marginBottom:14}}>Revenue Chart</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={repChartData} barSize={repPeriod==='today'?14:28}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
              <XAxis dataKey="label" tick={{fontSize:9,fill:'var(--text3)'}} tickLine={false} axisLine={false}/>
              <YAxis tick={{fontSize:9,fill:'var(--text3)'}} tickLine={false} axisLine={false} tickFormatter={v=>v>=1000?Math.round(v/1000)+'k':v}/>
              <Tooltip content={<Tip/>} cursor={{fill:'rgba(255,255,255,0.03)'}}/>
              <Bar dataKey="value" fill={ACCENT} radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))',gap:14}}>
          <div className="card" style={{padding:20}}>
            <div style={{fontWeight:600,fontSize:13,marginBottom:12}}>🏆 Top Selling — This Period</div>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {repTop.length===0?<div style={{color:'var(--text3)',fontSize:12,textAlign:'center',padding:20}}>No data for this period.</div>
              :repTop.map((p,i)=>(
                <div key={p.name} style={{display:'flex',alignItems:'center',gap:10}}>
                  <span style={{fontSize:11,color:'var(--text3)',fontFamily:"'JetBrains Mono',monospace",width:14}}>{i+1}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.name}</div>
                    <div style={{marginTop:3,height:3,background:'var(--bg5)',borderRadius:2,overflow:'hidden'}}><div style={{height:'100%',borderRadius:2,background:'var(--accent)',width:`${Math.round((p.sold/(repTop[0]?.sold||1))*100)}%`}}/></div>
                  </div>
                  <div style={{textAlign:'right',flexShrink:0}}>
                    <div style={{fontSize:11,color:'var(--green)',fontFamily:"'JetBrains Mono',monospace"}}>{peso(p.revenue)}</div>
                    <div style={{fontSize:10,color:'var(--text3)'}}>{p.sold} sold</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="card" style={{padding:20,borderTop:'2px solid var(--red)'}}>
            <div style={{fontWeight:600,fontSize:13,marginBottom:12}}>📉 Least Selling — This Period</div>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {repLeast.length===0?<div style={{color:'var(--text3)',fontSize:12,textAlign:'center',padding:20}}>No data for this period.</div>
              :repLeast.map((p,i)=>(
                <div key={p.name} style={{display:'flex',alignItems:'center',gap:10}}>
                  <span style={{fontSize:11,color:'var(--red)',fontFamily:"'JetBrains Mono',monospace",width:14}}>{i+1}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.name}</div>
                    <div style={{marginTop:3,height:3,background:'var(--bg5)',borderRadius:2,overflow:'hidden'}}><div style={{height:'100%',borderRadius:2,background:'var(--red)',width:p.sold===0?'4%':`${Math.min(100,Math.round((p.sold/(repTop[0]?.sold||1))*100))}%`}}/></div>
                  </div>
                  <div style={{textAlign:'right',flexShrink:0}}>
                    <div style={{fontSize:11,color:'var(--red)',fontFamily:"'JetBrains Mono',monospace"}}>{peso(p.revenue)}</div>
                    <div style={{fontSize:10,color:'var(--text3)'}}>{p.sold} sold</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* TRANSACTION TABLE */}
        <div>
          <div className="section-title" style={{marginBottom:10}}>Transaction History ({repFiltered.length})</div>
          <div className="tbl-wrap">
            <table>
              <thead><tr>{['TXN #','Date & Time','Customer','Items','Payment','Total'].map(h=><th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {repFiltered.length===0?<tr><td colSpan={6} style={{textAlign:'center',padding:40,color:'var(--text3)'}}>No transactions for this period.</td></tr>
                :repFiltered.slice(0,10).map(tx=>(
                  <tr key={tx.id}>
                    <td style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:'var(--accent)'}}>#{String(tx.id).padStart(4,'0')}</td>
                    <td style={{fontSize:11,color:'var(--text3)'}}>{new Date(tx.createdAt).toLocaleString('en-PH',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</td>
                    <td style={{fontSize:12}}>{tx.customerName||'Walk-in'}</td>
                    <td style={{fontSize:11,color:'var(--text3)'}}>{(tx.items||[]).length} item(s)</td>
                    <td><span className={`badge ${tx.payment==='Cash'?'badge-green':tx.payment==='GCash'?'badge-blue':'badge-purple'}`} style={{fontSize:10}}>{tx.payment}</span></td>
                    <td style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:'var(--green)',fontWeight:600}}>{peso(tx.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </>}

    </div>
  )
}
