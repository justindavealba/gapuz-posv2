import { useState, useMemo } from 'react'
import { useTransactionStore, useProductStore, useCustomerStore, useRefundStore } from '../store'
import { useT, peso, pesoCompact, getTier } from '../utils/helpers'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { CHART_COLORS, ACCENT, RED, YELLOW, PURPLE, SLATE } from '../utils/colors'

const REPORT_TABS = [
  { id:'sales',     label:'📊 Sales'     },
  { id:'inventory', label:'📦 Inventory' },
  { id:'loss',      label:'📉 Loss'      },
  { id:'customer',  label:'👥 Customer'  },
  { id:'refund',    label:'🔄 Refund'    },
]
const COLORS = CHART_COLORS
const PERIODS = ['Today','This Week','This Month','This Year']

function StatCard({label,value,color,sub}){
  return(
    <div className="card" style={{padding:16,borderTop:`2px solid ${color}`}}>
      <div style={{fontSize:9.5,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:5}}>{label}</div>
      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:20,fontWeight:700,color}}>{value}</div>
      {sub&&<div style={{fontSize:10,color:'var(--text3)',marginTop:3}}>{sub}</div>}
    </div>
  )
}

export default function Reports(){
  const transactions = useTransactionStore(s=>s.transactions)
  const products     = useProductStore(s=>s.products)
  const customers    = useCustomerStore(s=>s.customers)
  const refunds      = useRefundStore(s=>s.refunds)
  const t            = useT()
  const [activeTab,  setActiveTab]  = useState('sales')
  const [period,     setPeriod]     = useState('Today')

  const filtered = useMemo(()=>{
    const now = new Date()
    const start = new Date()
    if(period==='Today'){start.setHours(0,0,0,0)}
    else if(period==='This Week'){start.setDate(now.getDate()-6);start.setHours(0,0,0,0)}
    else if(period==='This Month'){start.setDate(1);start.setHours(0,0,0,0)}
    else{start.setMonth(0,1);start.setHours(0,0,0,0)}
    return transactions.filter(tx=>new Date(tx.createdAt)>=start)
  },[transactions,period])

  // ── SALES ────────────────────────────────────────────────
  const salesRev  = filtered.reduce((s,t)=>s+t.total,0)
  const salesVat  = filtered.reduce((s,t)=>s+(t.vat||0),0)
  const salesAvg  = filtered.length?Math.round(salesRev/filtered.length):0
  const salesItems= filtered.reduce((s,t)=>s+(t.items||[]).reduce((a,i)=>a+i.qty,0),0)
  const payData   = useMemo(()=>{ const map={}; filtered.forEach(t=>{map[t.payment]=(map[t.payment]||0)+t.total}); return Object.entries(map).map(([name,value])=>({name,value})) },[filtered])
  const salesChart= useMemo(()=>{
    if(period==='Today') return Array.from({length:17},(_,i)=>{ const h=i+6; const hrs=filtered.filter(tx=>new Date(tx.createdAt).getHours()===h); return {label:`${h}:00`,value:hrs.reduce((s,t)=>s+t.total,0)} })
    const days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
    return Array.from({length:7},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-(6-i)); d.setHours(0,0,0,0); const dt=filtered.filter(tx=>{const td=new Date(tx.createdAt);td.setHours(0,0,0,0);return td.getTime()===d.getTime()}); return {label:days[d.getDay()],value:dt.reduce((s,t)=>s+t.total,0)} })
  },[filtered,period])
  const topProds  = useMemo(()=>{ const map={}; filtered.forEach(tx=>(tx.items||[]).forEach(i=>{ if(!map[i.name]) map[i.name]={name:i.name,sold:0,revenue:0}; map[i.name].sold+=i.qty; map[i.name].revenue+=i.qty*i.price })); return Object.values(map).sort((a,b)=>b.sold-a.sold).slice(0,5) },[filtered])
  const leastProds= useMemo(()=>{ const map={}; filtered.forEach(tx=>(tx.items||[]).forEach(i=>{ if(!map[i.name]) map[i.name]={name:i.name,sold:0,revenue:0}; map[i.name].sold+=i.qty; map[i.name].revenue+=i.qty*i.price })); products.forEach(p=>{ if(!map[p.name]) map[p.name]={name:p.name,sold:0,revenue:0} }); return Object.values(map).sort((a,b)=>a.sold-b.sold).slice(0,5) },[filtered,products])

  // ── INVENTORY ────────────────────────────────────────────
  const totalVal  = products.reduce((s,p)=>s+p.price*p.stock,0)
  const lowStock  = products.filter(p=>p.stock>0&&p.stock<=5&&p.category!=='Services')
  const outStock  = products.filter(p=>p.stock===0&&p.category!=='Services')
  const now       = new Date()
  const oldStock  = products.filter(p=>{ const added=p.createdAt?new Date(p.createdAt):null; const lastSold=p.lastSoldAt?new Date(p.lastSoldAt):null; const daysSinceAdded=added?Math.floor((now-added)/(1000*60*60*24)):0; const daysSinceLastSold=lastSold?Math.floor((now-lastSold)/(1000*60*60*24)):999; return daysSinceAdded>90&&daysSinceLastSold>90 })
  const newStock  = products.filter(p=>{ const added=p.createdAt?new Date(p.createdAt):null; const days=added?Math.floor((now-added)/(1000*60*60*24)):999; return days<=30 })
  const catData   = useMemo(()=>{ const map={}; products.forEach(p=>{ map[p.category]=(map[p.category]||0)+1 }); return Object.entries(map).map(([name,value])=>({name,value})) },[products])

  // ── LOSS ─────────────────────────────────────────────────
  const lossProds = products.filter(p=>p.costPrice&&p.price<p.costPrice&&p.category!=='Services')
  const totalLoss = lossProds.reduce((s,p)=>s+((p.costPrice-p.price)*p.sold),0)
  const soldAtLoss= useMemo(()=>{ const map={}; filtered.forEach(tx=>(tx.items||[]).forEach(i=>{ const prod=products.find(p=>p.name===i.name); if(prod&&prod.costPrice&&prod.price<prod.costPrice){ if(!map[i.name]) map[i.name]={name:i.name,sold:0,lossPerUnit:prod.costPrice-prod.price,totalLoss:0}; map[i.name].sold+=i.qty; map[i.name].totalLoss+=(prod.costPrice-prod.price)*i.qty } })); return Object.values(map).sort((a,b)=>b.totalLoss-a.totalLoss) },[filtered,products])
  const lowMargin = products.filter(p=>p.costPrice&&p.category!=='Services').map(p=>({...p,margin:Math.round(((p.price-p.costPrice)/p.price)*100)})).filter(p=>p.margin>=0&&p.margin<=15).sort((a,b)=>a.margin-b.margin)

  // ── CUSTOMER ──────────────────────────────────────────────
  const topCusts  = useMemo(()=>[...customers].sort((a,b)=>b.totalSpent-a.totalSpent).slice(0,8),[customers])
  const tierCounts= useMemo(()=>[
    {name:'Platinum',value:customers.filter(c=>c.points>=3000).length,          color:PURPLE},
    {name:'Gold',    value:customers.filter(c=>c.points>=1500&&c.points<3000).length, color:YELLOW},
    {name:'Silver',  value:customers.filter(c=>c.points>=500&&c.points<1500).length,  color:SLATE},
    {name:'Bronze',  value:customers.filter(c=>c.points<500).length,             color:ACCENT},
  ].filter(t=>t.value>0),[customers])

  // ── REFUND ────────────────────────────────────────────────
  const refFiltered= useMemo(()=>{
    const start=new Date()
    if(period==='Today'){start.setHours(0,0,0,0)}
    else if(period==='This Week'){start.setDate(now.getDate()-6);start.setHours(0,0,0,0)}
    else if(period==='This Month'){start.setDate(1);start.setHours(0,0,0,0)}
    else{start.setMonth(0,1);start.setHours(0,0,0,0)}
    return refunds.filter(r=>new Date(r.createdAt||r.date)>=start)
  },[refunds,period])
  const refApproved= refFiltered.filter(r=>r.status==='Approved')
  const refTotal   = refApproved.reduce((s,r)=>s+r.total,0)
  const refStatusData=[
    {name:'Pending', value:refFiltered.filter(r=>r.status==='Pending').length,  color:YELLOW},
    {name:'Approved',value:refFiltered.filter(r=>r.status==='Approved').length, color:ACCENT},
    {name:'Rejected',value:refFiltered.filter(r=>r.status==='Rejected').length, color:RED},
  ].filter(r=>r.value>0)

  const exportCSV = () => {
    const rows = filtered.map(tx=>[
      String(tx.id).padStart(4,'0'),
      new Date(tx.createdAt).toLocaleString('en-PH'),
      tx.customerName||'Walk-in',
      (tx.items||[]).length,
      tx.payment,
      tx.subtotal,
      tx.discAmt||0,
      tx.vat||0,
      tx.total,
      tx.status||'Completed'
    ])
    const csv = ['TXN#,Date & Time,Customer,Items,Payment,Subtotal,Discount,VAT,Total,Status',...rows.map(r=>r.join(','))].join('\n')
    const a = document.createElement('a'); a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv); a.download=`gapuz-sales-report-${period.toLowerCase().replace(' ','-')}.csv`; a.click()
  }

  const Tip=({active,payload,label})=>{ if(!active||!payload?.length) return null; return <div className="card" style={{padding:'8px 12px',fontSize:12}}><div style={{color:'var(--text3)',marginBottom:3}}>{label}</div><div style={{fontFamily:"'JetBrains Mono',monospace",color:'var(--accent)'}}>{peso(payload[0].value)}</div></div> }

  return(
    <div style={{height:'100%',overflowY:'auto',padding:20,display:'flex',flexDirection:'column',gap:16}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10}}>
        <div style={{fontSize:18,fontWeight:700}}>📊 Reports</div>
        <button onClick={exportCSV} className="btn-success" style={{fontSize:11,padding:'7px 14px'}}>⬇ Export CSV</button>
      </div>

      {/* REPORT TYPE TABS */}
      <div style={{display:'flex',gap:6,borderBottom:'1px solid var(--border)',paddingBottom:0,overflowX:'auto',flexShrink:0}}>
        {REPORT_TABS.map(tab=>(
          <button key={tab.id} onClick={()=>setActiveTab(tab.id)}
            style={{padding:'8px 16px',fontSize:11,fontWeight:600,border:'none',cursor:'pointer',borderRadius:'8px 8px 0 0',transition:'all .15s',background:activeTab===tab.id?'var(--accent)':'var(--bg2)',color:activeTab===tab.id?'#0a0a0a':'var(--text3)',borderBottom:activeTab===tab.id?'2px solid var(--accent)':'2px solid transparent',marginBottom:activeTab===tab.id?'-1px':'0'}}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* PERIOD FILTER — shown for sales and refund tabs */}
      {(activeTab==='sales'||activeTab==='refund') && (
        <div style={{display:'flex',gap:6,alignItems:'center',overflowX:'auto',flexShrink:0}}>
          <span style={{fontSize:11,color:'var(--text3)',flexShrink:0}}>Period:</span>
          {PERIODS.map(p=>(
            <button key={p} onClick={()=>setPeriod(p)}
              style={{padding:'5px 12px',fontSize:11,fontWeight:600,border:`1px solid ${period===p?'var(--blue)':'var(--border)'}`,borderRadius:6,cursor:'pointer',background:period===p?'var(--blue)':'var(--bg2)',color:period===p?'#ffffff':'var(--text3)',transition:'all .15s'}}>
              {p}
            </button>
          ))}
        </div>
      )}

      {/* ══════════ SALES REPORT ══════════ */}
      {activeTab==='sales' && <>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:12}}>
          <StatCard label="Total Revenue"  value={peso(salesRev)}     color="var(--accent)"/>
          <StatCard label="Transactions"   value={filtered.length}    color="var(--green)"/>
          <StatCard label="Total VAT"      value={peso(salesVat)}     color="var(--purple)"/>
          <StatCard label="Average Order"  value={peso(salesAvg)}     color="var(--yellow)"/>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(340px,1fr))',gap:14}}>
          <div className="card" style={{padding:20}}>
            <div style={{fontWeight:600,fontSize:13,marginBottom:14}}>Revenue Chart</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={salesChart} barSize={period==='Today'?12:24}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
                <XAxis dataKey="label" tick={{fontSize:9,fill:'var(--text3)'}} tickLine={false} axisLine={false}/>
                <YAxis tick={{fontSize:9,fill:'var(--text3)'}} tickLine={false} axisLine={false} tickFormatter={v=>v>=1000?Math.round(v/1000)+'k':v}/>
                <Tooltip content={<Tip/>} cursor={{fill:'rgba(255,255,255,0.03)'}}/>
                <Bar dataKey="value" fill={ACCENT} radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card" style={{padding:20}}>
            <div style={{fontWeight:600,fontSize:13,marginBottom:14}}>Payment Methods</div>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart><Pie data={payData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>{payData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Pie><Tooltip formatter={v=>peso(v)}/><Legend iconSize={8} wrapperStyle={{fontSize:11}}/></PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))',gap:14}}>
          <div className="card" style={{padding:20}}>
            <div style={{fontWeight:600,fontSize:13,marginBottom:12}}>🏆 Top Selling Products</div>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {topProds.length===0?<div style={{color:'var(--text3)',fontSize:12,textAlign:'center',padding:20}}>No data.</div>
              :topProds.map((p,i)=>(
                <div key={p.name} style={{display:'flex',alignItems:'center',gap:10}}>
                  <span style={{fontSize:11,color:'var(--text3)',fontFamily:"'JetBrains Mono',monospace",width:14}}>{i+1}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.name}</div>
                    <div style={{marginTop:3,height:3,background:'var(--bg5)',borderRadius:2,overflow:'hidden'}}><div style={{height:'100%',borderRadius:2,background:COLORS[i],width:`${Math.round((p.sold/(topProds[0]?.sold||1))*100)}%`}}/></div>
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
              {leastProds.length===0?<div style={{color:'var(--text3)',fontSize:12,textAlign:'center',padding:20}}>No data.</div>
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
        {/* Transaction Table */}
        <div>
          <div style={{fontWeight:600,fontSize:13,marginBottom:10}}>Transaction History ({filtered.length})</div>
          <div className="tbl-wrap">
            <table>
              <thead><tr>{['TXN #','Date & Time','Customer','Items','Payment','Subtotal','VAT','Total'].map(h=><th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {filtered.length===0?<tr><td colSpan={8} style={{textAlign:'center',padding:40,color:'var(--text3)'}}>No transactions for this period.</td></tr>
                :filtered.map(tx=>(
                  <tr key={tx.id}>
                    <td style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:'var(--accent)'}}>#{String(tx.id).padStart(4,'0')}</td>
                    <td style={{fontSize:11,color:'var(--text3)'}}>{new Date(tx.createdAt).toLocaleString('en-PH',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</td>
                    <td style={{fontSize:12}}>{tx.customerName||'Walk-in'}</td>
                    <td style={{fontSize:11,color:'var(--text3)'}}>{(tx.items||[]).length} item(s)</td>
                    <td><span className={`badge ${tx.payment==='Cash'?'badge-green':tx.payment==='GCash'?'badge-blue':'badge-purple'}`} style={{fontSize:10}}>{tx.payment}</span></td>
                    <td style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11}}>{peso(tx.subtotal||tx.total)}</td>
                    <td style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:'var(--text3)'}}>{peso(tx.vat||0)}</td>
                    <td style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:'var(--green)',fontWeight:600}}>{peso(tx.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </>}

      {/* ══════════ INVENTORY REPORT ══════════ */}
      {activeTab==='inventory' && <>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:12}}>
          <StatCard label="Total Products"  value={products.length}       color="var(--accent)"/>
          <StatCard label="Inventory Value" value={peso(totalVal)}        color="var(--green)"/>
          <StatCard label="Low Stock"       value={lowStock.length}       color="var(--yellow)"/>
          <StatCard label="Out of Stock"    value={outStock.length}       color="var(--red)"/>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:12}}>
          <StatCard label="Old Stock Items" value={oldStock.length}       color="var(--red)"    sub="Added 90+ days ago, not sold recently"/>
          <StatCard label="New Stock Items" value={newStock.length}       color="var(--green)"  sub="Added within the last 30 days"/>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))',gap:14}}>
          <div className="card" style={{padding:20}}>
            <div style={{fontWeight:600,fontSize:13,marginBottom:14}}>Products by Category</div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart><Pie data={catData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>{catData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Pie><Tooltip/><Legend iconSize={8} wrapperStyle={{fontSize:11}}/></PieChart>
            </ResponsiveContainer>
          </div>
          <div className="card" style={{padding:20,borderTop:'2px solid var(--red)'}}>
            <div style={{fontWeight:600,fontSize:13,marginBottom:12}}>📦 Old Stock — Needs Attention</div>
            {oldStock.length===0?<div style={{color:'var(--text3)',fontSize:12,textAlign:'center',padding:20}}>No old stock items! ✅</div>
            :oldStock.slice(0,6).map(p=>{
              const added=p.createdAt?new Date(p.createdAt):null
              const lastSold=p.lastSoldAt?new Date(p.lastSoldAt):null
              const daysSinceAdded=added?Math.floor((now-added)/(1000*60*60*24)):0
              const daysSinceLastSold=lastSold?Math.floor((now-lastSold)/(1000*60*60*24)):999
              return(
                <div key={p.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:'1px solid var(--border)'}}>
                  <div>
                    <div style={{fontSize:12,fontWeight:500}}>{p.name}</div>
                    <div style={{fontSize:10,color:'var(--text3)'}}>Added {daysSinceAdded}d ago · Last sold {daysSinceLastSold===999?'never':`${daysSinceLastSold}d ago`}</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:700,color:'var(--red)'}}>{p.stock} left</div>
                    <div style={{fontSize:9,color:'var(--text3)'}}>{peso(p.price)}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))',gap:14}}>
          <div className="card" style={{padding:20,borderTop:'2px solid var(--yellow)'}}>
            <div style={{fontWeight:600,fontSize:13,marginBottom:12}}>⚠️ Low Stock</div>
            {lowStock.length===0?<div style={{color:'var(--text3)',fontSize:12,textAlign:'center',padding:20}}>All good! ✅</div>
            :lowStock.map(p=>(
              <div key={p.id} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid var(--border)'}}>
                <div><div style={{fontSize:12,fontWeight:500}}>{p.name}</div><div style={{fontSize:10,color:'var(--text3)'}}>{p.category}</div></div>
                <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,fontWeight:700,color:'var(--yellow)'}}>{p.stock} left</span>
              </div>
            ))}
          </div>
          <div className="card" style={{padding:20,borderTop:'2px solid var(--accent)'}}>
            <div style={{fontWeight:600,fontSize:13,marginBottom:12}}>🆕 New Stock</div>
            {newStock.length===0?<div style={{color:'var(--text3)',fontSize:12,textAlign:'center',padding:20}}>No new items.</div>
            :newStock.map(p=>{
              const added=p.createdAt?new Date(p.createdAt):null
              const daysAgo=added?Math.floor((now-added)/(1000*60*60*24)):0
              return(
                <div key={p.id} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid var(--border)'}}>
                  <div><div style={{fontSize:12,fontWeight:500}}>{p.name}</div><div style={{fontSize:10,color:'var(--accent)'}}>Added {daysAgo} day(s) ago</div></div>
                  <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:700,color:'var(--accent)'}}>{peso(p.price)}</span>
                </div>
              )
            })}
          </div>
        </div>
      </>}

      {/* ══════════ LOSS REPORT ══════════ */}
      {activeTab==='loss' && <>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:12}}>
          <StatCard label="Products at Loss"     value={lossProds.length}      color="var(--red)"    sub="Price below cost price"/>
          <StatCard label="Estimated Total Loss" value={peso(totalLoss)}       color="var(--red)"    sub="Based on units sold"/>
          <StatCard label="Low Margin Products"  value={lowMargin.length}      color="var(--yellow)" sub="Margin below 15%"/>
        </div>
        <div className="card" style={{padding:20,borderTop:'2px solid var(--red)'}}>
          <div style={{fontWeight:600,fontSize:13,marginBottom:4}}>🚨 Products Selling at a Loss</div>
          <div style={{fontSize:11,color:'var(--text3)',marginBottom:14}}>These products have a selling price lower than their cost price.</div>
          {lossProds.length===0?<div style={{color:'var(--text3)',fontSize:12,textAlign:'center',padding:40}}>✅ No products are selling at a loss!</div>
          :<div className="tbl-wrap">
            <table>
              <thead><tr>{['Product','Category','Cost Price','Selling Price','Loss/Unit','Units Sold','Total Loss'].map(h=><th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {lossProds.map(p=>(
                  <tr key={p.id}>
                    <td style={{fontSize:12,fontWeight:500}}>{p.name}</td>
                    <td><span className="badge badge-accent" style={{fontSize:10}}>{p.category}</span></td>
                    <td style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:'var(--text3)'}}>{peso(p.costPrice)}</td>
                    <td style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:'var(--red)',fontWeight:700}}>{peso(p.price)}</td>
                    <td style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:'var(--red)'}}>{peso(p.costPrice-p.price)}</td>
                    <td style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11}}>{p.sold||0}</td>
                    <td style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:'var(--red)',fontWeight:700}}>{peso((p.costPrice-p.price)*(p.sold||0))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>}
        </div>
        <div className="card" style={{padding:20,borderTop:'2px solid var(--yellow)'}}>
          <div style={{fontWeight:600,fontSize:13,marginBottom:4}}>⚠️ Low Margin Products</div>
          <div style={{fontSize:11,color:'var(--text3)',marginBottom:14}}>Products with profit margin below 15% — consider adjusting prices.</div>
          {lowMargin.length===0?<div style={{color:'var(--text3)',fontSize:12,textAlign:'center',padding:40}}>✅ All products have healthy margins!</div>
          :<div className="tbl-wrap">
            <table>
              <thead><tr>{['Product','Category','Cost Price','Selling Price','Margin %','Stock'].map(h=><th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {lowMargin.map(p=>(
                  <tr key={p.id}>
                    <td style={{fontSize:12,fontWeight:500}}>{p.name}</td>
                    <td><span className="badge badge-accent" style={{fontSize:10}}>{p.category}</span></td>
                    <td style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:'var(--text3)'}}>{peso(p.costPrice)}</td>
                    <td style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11}}>{peso(p.price)}</td>
                    <td style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:700,color:p.margin<=5?'var(--red)':'var(--yellow)'}}>{p.margin}%</td>
                    <td style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11}}>{p.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>}
        </div>
        {soldAtLoss.length>0&&(
          <div className="card" style={{padding:20,borderTop:'2px solid var(--red)'}}>
            <div style={{fontWeight:600,fontSize:13,marginBottom:4}}>📉 Loss from Transactions — {period}</div>
            <div className="tbl-wrap">
              <table>
                <thead><tr>{['Product','Units Sold','Loss/Unit','Total Loss'].map(h=><th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  {soldAtLoss.map(p=>(
                    <tr key={p.name}>
                      <td style={{fontSize:12,fontWeight:500}}>{p.name}</td>
                      <td style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11}}>{p.sold}</td>
                      <td style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:'var(--red)'}}>{peso(p.lossPerUnit)}</td>
                      <td style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:'var(--red)',fontWeight:700}}>{peso(p.totalLoss)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </>}

      {/* ══════════ CUSTOMER REPORT ══════════ */}
      {activeTab==='customer' && <>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:12}}>
          <StatCard label="Total Customers"  value={customers.length}                                      color="var(--accent)"/>
          <StatCard label="Total Points"     value={customers.reduce((s,c)=>s+c.points,0).toLocaleString()} color="var(--yellow)"/>
          <StatCard label="Platinum Members" value={customers.filter(c=>c.points>=3000).length}             color="var(--purple)"/>
          <StatCard label="Gold Members"     value={customers.filter(c=>c.points>=1500&&c.points<3000).length} color="var(--yellow)"/>
        </div>
        {/* Tier criteria */}
        <div className="card" style={{padding:20}}>
          <div style={{fontWeight:600,fontSize:13,marginBottom:4}}>🏅 Loyalty Tier Criteria</div>
          <div style={{fontSize:11,color:'var(--text3)',marginBottom:14}}>Points earned: 10 pts per transaction + 1 pt per ₱100 spent</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:12}}>
            {[
              {tier:'Bronze',   range:'0 – 499 pts',      color:'var(--accent)', icon:'🥉', count:customers.filter(c=>c.points<500).length,         next:'Need 500 pts for Silver'},
              {tier:'Silver',   range:'500 – 1,499 pts',  color:SLATE, icon:'🥈', count:customers.filter(c=>c.points>=500&&c.points<1500).length,  next:'Need 1,500 pts for Gold'},
              {tier:'Gold',     range:'1,500 – 2,999 pts',color:'var(--yellow)', icon:'🥇', count:customers.filter(c=>c.points>=1500&&c.points<3000).length, next:'Need 3,000 pts for Platinum'},
              {tier:'Platinum', range:'3,000+ pts',        color:'var(--purple)', icon:'💎', count:customers.filter(c=>c.points>=3000).length,         next:'Highest tier! 🎉'},
            ].map(t=>(
              <div key={t.tier} style={{padding:16,background:'var(--bg2)',borderRadius:10,borderTop:`3px solid ${t.color}`,textAlign:'center'}}>
                <div style={{fontSize:30,marginBottom:6}}>{t.icon}</div>
                <div style={{fontSize:13,fontWeight:700,color:t.color,marginBottom:4}}>{t.tier}</div>
                <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:18,fontWeight:700,marginBottom:4}}>{t.count}</div>
                <div style={{fontSize:10,color:'var(--text3)',marginBottom:6}}>{t.range}</div>
                <div style={{fontSize:9,color:'var(--text3)',lineHeight:1.4}}>{t.next}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))',gap:14}}>
          <div className="card" style={{padding:20}}>
            <div style={{fontWeight:600,fontSize:13,marginBottom:14}}>Tier Distribution</div>
            {tierCounts.length===0?<div style={{color:'var(--text3)',fontSize:12,textAlign:'center',padding:40}}>No customers yet.</div>
            :<ResponsiveContainer width="100%" height={200}>
              <PieChart><Pie data={tierCounts} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>{tierCounts.map((t,i)=><Cell key={i} fill={t.color}/>)}</Pie><Tooltip/><Legend iconSize={8} wrapperStyle={{fontSize:11}}/></PieChart>
            </ResponsiveContainer>}
          </div>
          <div className="card" style={{padding:20}}>
            <div style={{fontWeight:600,fontSize:13,marginBottom:14}}>🌟 Top Customers by Spending</div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {topCusts.map((c,i)=>{
                const tier=getTier(c.points)
                return(
                  <div key={c.id} style={{display:'flex',alignItems:'center',gap:10}}>
                    <div style={{width:26,height:26,borderRadius:6,background:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'#0a0a0a',flexShrink:0}}>{c.name.charAt(0)}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.name}</div>
                      <div style={{fontSize:10,color:tier.color}}>{tier.icon} {tier.label} · {(c.points||0).toLocaleString()} pts</div>
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

      {/* ══════════ REFUND REPORT ══════════ */}
      {activeTab==='refund' && <>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:12}}>
          <StatCard label="Total Refunds"  value={refFiltered.length}  color="var(--blue)"/>
          <StatCard label="Pending"        value={refFiltered.filter(r=>r.status==='Pending').length}  color="var(--yellow)"/>
          <StatCard label="Approved"       value={refFiltered.filter(r=>r.status==='Approved').length} color="var(--accent)"/>
          <StatCard label="Total Refunded" value={peso(refTotal)}      color="var(--red)"/>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))',gap:14}}>
          <div className="card" style={{padding:20}}>
            <div style={{fontWeight:600,fontSize:13,marginBottom:14}}>Refund Status Breakdown</div>
            {refStatusData.length===0?<div style={{color:'var(--text3)',fontSize:12,textAlign:'center',padding:40}}>No refunds for this period.</div>
            :<ResponsiveContainer width="100%" height={200}>
              <PieChart><Pie data={refStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>{refStatusData.map((r,i)=><Cell key={i} fill={r.color}/>)}</Pie><Tooltip/><Legend iconSize={8} wrapperStyle={{fontSize:11}}/></PieChart>
            </ResponsiveContainer>}
          </div>
          <div className="card" style={{padding:20}}>
            <div style={{fontWeight:600,fontSize:13,marginBottom:14}}>📋 Refund Policy Summary</div>
            {[
              {icon:'⏰',title:'15-Day Return Period',   desc:'Items must be returned within 15 days from purchase date.'},
              {icon:'📦',title:'Subject to Approval',    desc:'Each refund is reviewed and approved by the Administrator.'},
              {icon:'💳',title:'Same Payment Method',    desc:'Cash→Cash, GCash→GCash, Card→Card.'},
              {icon:'🧾',title:'Transaction ID Required',desc:'Original transaction number must be provided.'},
            ].map(p=>(
              <div key={p.title} style={{display:'flex',gap:10,padding:'8px 0',borderBottom:'1px solid var(--border)'}}>
                <div style={{fontSize:18,flexShrink:0}}>{p.icon}</div>
                <div><div style={{fontSize:11,fontWeight:700}}>{p.title}</div><div style={{fontSize:10,color:'var(--text3)'}}>{p.desc}</div></div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div style={{fontWeight:600,fontSize:13,marginBottom:10}}>Refund History ({refFiltered.length})</div>
          <div className="tbl-wrap">
            <table>
              <thead><tr>{['Refund #','TXN #','Customer','Reason','Method','Amount','Status'].map(h=><th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {refFiltered.length===0?<tr><td colSpan={7} style={{textAlign:'center',padding:40,color:'var(--text3)'}}>No refunds for this period.</td></tr>
                :refFiltered.map(r=>(
                  <tr key={r.id}>
                    <td style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:'var(--accent)'}}>#{String(r.id).padStart(4,'0')}</td>
                    <td style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:'var(--text3)'}}>#{String(r.transactionId||'—').padStart(4,'0')}</td>
                    <td style={{fontSize:12}}>{r.customerName||'Walk-in'}</td>
                    <td style={{fontSize:11,color:'var(--text2)'}}>{r.reason}</td>
                    <td><span className={`badge ${r.refundMethod==='Cash'?'badge-green':r.refundMethod==='GCash'?'badge-blue':'badge-purple'}`} style={{fontSize:10}}>{r.refundMethod}</span></td>
                    <td style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:'var(--red)',fontWeight:600}}>{peso(r.total)}</td>
                    <td><span style={{fontSize:9,fontWeight:700,padding:'2px 8px',borderRadius:99,background:r.status==='Approved'?'rgba(52,211,153,0.1)':r.status==='Rejected'?'rgba(239,68,68,0.1)':'rgba(234,179,8,0.1)',color:r.status==='Approved'?'var(--accent)':r.status==='Rejected'?'var(--red)':'var(--yellow)'}}>{r.status}</span></td>
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
