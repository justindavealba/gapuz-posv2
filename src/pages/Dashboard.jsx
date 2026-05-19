import { useMemo } from 'react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { useTransactionStore, useProductStore, useAuthStore, useAppStore } from '../store'
import { useT, peso, pesoCompact } from '../utils/helpers'

const COLORS = ['#d1e751','#a78bfa','#4ade80','#fbbf24','#f87171']

function MetricCard({ label, value, sub, subUp, color, isLight }) {
  return (
    <div className="card" style={{padding:20,borderTop:`2px solid ${color}`, background: isLight ? '#fff' : 'var(--bg2)'}}>
      <div style={{fontSize:10,color: isLight ? '#1e40af' : 'var(--text3)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.5px',marginBottom:8}}>{label}</div>
      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:24,fontWeight:700,marginBottom:5,color}}>{value}</div>
      <div style={{fontSize:11,color:subUp?'var(--green)': (isLight ? '#64748b' : 'var(--text3)')}}>{sub}</div>
    </div>
  )
}

export default function Dashboard() {
  const transactions = useTransactionStore(s=>s.transactions)
  const products     = useProductStore(s=>s.products)
  const { user }     = useAuthStore()
  const { theme }    = useAppStore()
  const t            = useT()

  const isLight = theme === 'light'
  const blueText = isLight ? '#1e3a8a' : 'var(--text)'
  const now   = new Date()
  const today = new Date(now); today.setHours(0,0,0,0)

  const todayTxns = useMemo(()=>transactions.filter(tx=>{ const d=new Date(tx.createdAt); d.setHours(0,0,0,0); return d.getTime()===today.getTime() }),[transactions])

  const revenue   = todayTxns.reduce((s,t)=>s+t.total,0)
  const itemsSold = todayTxns.reduce((s,t)=>s+(t.items||[]).reduce((a,i)=>a+i.qty,0),0)
  const aov       = todayTxns.length?Math.round(revenue/todayTxns.length):0

  const yest = new Date(today); yest.setDate(yest.getDate()-1)
  const yesterdayRev = transactions.filter(tx=>{ const d=new Date(tx.createdAt); d.setHours(0,0,0,0); return d.getTime()===yest.getTime() }).reduce((s,t)=>s+t.total,0)
  const revChange = yesterdayRev?Math.round(((revenue-yesterdayRev)/yesterdayRev)*100):0

  const weekData = useMemo(()=>{ const days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat']; return Array.from({length:7},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-(6-i)); d.setHours(0,0,0,0); const dayTxns=transactions.filter(tx=>{ const td=new Date(tx.createdAt); td.setHours(0,0,0,0); return td.getTime()===d.getTime() }); return {label:days[d.getDay()],value:dayTxns.reduce((s,t)=>s+t.total,0)} }) },[transactions])

  const areaData = useMemo(()=>Array.from({length:14},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-(13-i)); d.setHours(0,0,0,0); const dayTxns=transactions.filter(tx=>{ const td=new Date(tx.createdAt); td.setHours(0,0,0,0); return td.getTime()===d.getTime() }); return {label:d.toLocaleDateString('en-PH',{month:'short',day:'numeric'}),revenue:dayTxns.reduce((s,t)=>s+t.total,0)} }),[transactions])

  const payBreakdown = useMemo(()=>{ const map={}; transactions.forEach(t=>{map[t.payment]=(map[t.payment]||0)+t.total}); return Object.entries(map).map(([name,value])=>({name,value})) },[transactions])

  const topProducts = useMemo(()=>{ const map={}; transactions.forEach(tx=>(tx.items||[]).forEach(item=>{ if(!map[item.name]) map[item.name]={name:item.name,sold:0,revenue:0}; map[item.name].sold+=item.qty; map[item.name].revenue+=item.qty*item.price })); return Object.values(map).sort((a,b)=>b.sold-a.sold).slice(0,5) },[transactions])

  const lowStock = products.filter(p=>p.stock>0&&p.stock<=5&&p.category!=='Services')
  const outStock = products.filter(p=>p.stock===0&&p.category!=='Services')

  const hour = now.getHours()
  const greeting = hour<12?t('good_morning'):hour<17?t('good_afternoon'):t('good_evening')

  const Tip = ({active,payload,label})=>{ if(!active||!payload?.length) return null; return <div className="card" style={{padding:'8px 12px',fontSize:12}}><div style={{color:'var(--text3)',marginBottom:3}}>{label}</div><div style={{fontFamily:"'JetBrains Mono',monospace",color:'var(--accent)'}}>{peso(payload[0].value)}</div></div> }

  return (
    <div style={{height:'100%',overflowY:'auto',padding:20,display:'flex',flexDirection:'column',gap:20}}>
      <div>
        <div style={{fontSize:20,fontWeight:700, color: blueText}}>{greeting}, <span style={{color: isLight ? '#3b82f6' : 'var(--accent)'}}>{user?.name||'Admin'}</span> 👋</div>
        <div style={{color: isLight ? '#475569' : 'var(--text2)',fontSize:13,marginTop:3}}>{now.toLocaleDateString('en-PH',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14}}>
        <MetricCard label={t('today_revenue')} value={pesoCompact(revenue)} sub={`${revChange>=0?'▲ +':'▼ '}${revChange}% ${t('vs_yesterday')}`} subUp={revChange>=0} color="#d1e751" isLight={isLight}/>
        <MetricCard label={t('transactions')} value={todayTxns.length} sub="Today" subUp color="#4ade80" isLight={isLight}/>
        <MetricCard label={t('items_sold')} value={itemsSold} sub="Today" subUp color="#a78bfa" isLight={isLight}/>
        <MetricCard label={t('avg_order')} value={pesoCompact(aov)} sub="Today" subUp color="#fbbf24" isLight={isLight}/>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1.6fr 1fr',gap:14}}>
        <div className="card" style={{padding:20}}>
          <div style={{fontWeight:700,fontSize:13,marginBottom:14, color: blueText}}>Revenue — Last 14 Days</div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={areaData}>
              <defs><linearGradient id="rg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#d1e751" stopOpacity={0.25}/><stop offset="95%" stopColor="#d1e751" stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
              <XAxis dataKey="label" tick={{fontSize:10,fill:'var(--text3)'}} tickLine={false} axisLine={false} interval={1}/>
              <YAxis tick={{fontSize:10,fill:'var(--text3)'}} tickLine={false} axisLine={false} tickFormatter={v=>v>=1000?Math.round(v/1000)+'k':v}/>
              <Tooltip content={<Tip/>}/>
              <Area type="monotone" dataKey="revenue" stroke="#d1e751" strokeWidth={2} fill="url(#rg)"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="card" style={{padding:20}}>
          <div style={{fontWeight:700,fontSize:13,marginBottom:14, color: blueText}}>Payment Methods</div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart><Pie data={payBreakdown} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>{payBreakdown.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Pie><Tooltip formatter={v=>peso(v)}/><Legend iconSize={8} wrapperStyle={{fontSize:11}}/></PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
        <div className="card" style={{padding:20}}>
          <div style={{fontWeight:700,fontSize:13,marginBottom:14, color: blueText}}>{t('weekly_sales')}</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={weekData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
              <XAxis dataKey="label" tick={{fontSize:11,fill:'var(--text3)'}} tickLine={false} axisLine={false}/>
              <YAxis tick={{fontSize:10,fill:'var(--text3)'}} tickLine={false} axisLine={false} tickFormatter={v=>v>=1000?Math.round(v/1000)+'k':v}/>
              <Tooltip formatter={v=>peso(v)} cursor={{fill:'rgba(255,255,255,0.03)'}}/>
              <Bar dataKey="value" radius={[5,5,0,0]}>
                {weekData.map((_,i)=><Cell key={i} fill={i===weekData.length-1?'#d1e751':'var(--bg5)'}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card" style={{padding:20}}>
          <div style={{fontWeight:700,fontSize:13,marginBottom:14, color: blueText}}>🏆 {t('top_products')}</div>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {topProducts.length===0?<div style={{color:'var(--text3)',fontSize:12,textAlign:'center',padding:'20px 0'}}>{t('no_data')}</div>
            :topProducts.map((p,i)=>(
              <div key={p.name} style={{display:'flex',alignItems:'center',gap:10}}>
                <span style={{fontSize:11,color:'var(--text3)',fontFamily:"'JetBrains Mono',monospace",width:14}}>{i+1}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.name}</div>
                  <div style={{marginTop:3,height:3,background:'var(--bg5)',borderRadius:2,overflow:'hidden'}}><div style={{height:'100%',borderRadius:2,background:COLORS[i],width:`${Math.round((p.sold/(topProducts[0]?.sold||1))*100)}%`,transition:'width .5s'}}/></div>
                </div>
                <div style={{textAlign:'right',flexShrink:0}}>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color: isLight ? '#059669' : 'var(--green)'}}>{peso(p.revenue)}</div>
                  <div style={{fontSize:10,color:'var(--text3)'}}>{p.sold} sold</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <div className="section-title" style={{color: blueText}}>{t('ai_insights')}</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14}}>
          <div className="card" style={{padding:16,borderTop:'2px solid var(--yellow)'}}>
            <div style={{fontSize:20,marginBottom:8}}>⚠️</div>
            <div style={{fontWeight:700,fontSize:12,color: isLight ? '#854d0e' : 'var(--yellow)',marginBottom:4}}>{t('low_stock_alert')}</div>
            <div style={{fontSize:11,color:'var(--text2)',lineHeight:1.5}}>{lowStock.length===0?'All products have healthy stock.':`${lowStock.length} product(s) running low: ${lowStock.map(p=>p.name).slice(0,2).join(', ')}${lowStock.length>2?'...':''}`}</div>
          </div>
          <div className="card" style={{padding:16,borderTop:`2px solid ${outStock.length?'var(--red)':'var(--green)'}`}}>
            <div style={{fontSize:20,marginBottom:8}}>{outStock.length?'🚫':'✅'}</div>
            <div style={{fontWeight:700,fontSize:12,color:outStock.length?'var(--red)':'var(--green)',marginBottom:4}}>{t('out_of_stock_alert')}</div>
            <div style={{fontSize:11,color:'var(--text2)',lineHeight:1.5}}>{outStock.length===0?'No products are out of stock.':`${outStock.length} item(s) need restocking.`}</div>
          </div>
          <div className="card" style={{padding:16,borderTop:'2px solid var(--accent)'}}>
            <div style={{fontSize:20,marginBottom:8}}>🏆</div>
            <div style={{fontWeight:700,fontSize:12,color: isLight ? '#1e40af' : 'var(--accent)',marginBottom:4}}>{t('best_seller')}</div>
            <div style={{fontSize:11,color:'var(--text2)',lineHeight:1.5}}>{topProducts[0]?`${topProducts[0].name} — ${topProducts[0].sold} units sold`:'No sales data yet.'}</div>
          </div>
        </div>
      </div>

      <div>
        <div className="section-title" style={{color: blueText}}>{t('recent_txns')}</div>
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
    </div>
  )
}
