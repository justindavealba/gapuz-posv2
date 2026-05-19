import { useState, useMemo } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { useTransactionStore } from '../store'
import { useT, peso } from '../utils/helpers'

const PERIODS = ['today','this_week','this_month']
const COLORS   = ['#d1e751','#a78bfa','#4ade80','#fbbf24','#f87171']

export default function Reports() {
  const transactions = useTransactionStore(s=>s.transactions)
  const [period,     setPeriod]    = useState('today')
  const [payFilter,  setPayFilter] = useState('All')
  const t = useT()

  const filtered = useMemo(()=>{
    const start=new Date()
    if(period==='today') start.setHours(0,0,0,0)
    else if(period==='this_week'){start.setDate(start.getDate()-6);start.setHours(0,0,0,0)}
    else{start.setDate(1);start.setHours(0,0,0,0)}
    return transactions.filter(tx=>new Date(tx.createdAt)>=start&&(payFilter==='All'||tx.payment===payFilter))
  },[transactions,period,payFilter])

  const totalRevenue = filtered.reduce((s,t)=>s+t.total,0)
  const totalVat     = filtered.reduce((s,t)=>s+t.vat,0)
  const avgOrder     = filtered.length?Math.round(totalRevenue/filtered.length):0

  const chartData = useMemo(()=>{
    if(period==='today') return Array.from({length:17},(_,i)=>{ const h=i+6; const hrs=filtered.filter(tx=>new Date(tx.createdAt).getHours()===h); return {label:`${h}:00`,value:hrs.reduce((s,t)=>s+t.total,0)} })
    if(period==='this_week'){ const days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat']; return Array.from({length:7},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-(6-i)); d.setHours(0,0,0,0); const dayTxns=filtered.filter(tx=>{const td=new Date(tx.createdAt);td.setHours(0,0,0,0);return td.getTime()===d.getTime()}); return {label:days[d.getDay()],value:dayTxns.reduce((s,t)=>s+t.total,0)} }) }
    const dim=new Date(new Date().getFullYear(),new Date().getMonth()+1,0).getDate()
    return Array.from({length:dim},(_,i)=>{ const day=i+1; const dayTxns=filtered.filter(tx=>new Date(tx.createdAt).getDate()===day); return {label:`${day}`,value:dayTxns.reduce((s,t)=>s+t.total,0)} })
  },[filtered,period])

  const payBreakdown = useMemo(()=>{ const map={}; filtered.forEach(tx=>{map[tx.payment]=(map[tx.payment]||0)+tx.total}); return Object.entries(map).map(([name,value])=>({name,value})) },[filtered])

  const exportCSV = () => {
    const headers=['TXN #','Date','Customer','Payment','Subtotal','Discount','VAT','Total']
    const rows=filtered.map(tx=>[`#${String(tx.id).padStart(4,'0')}`,new Date(tx.createdAt).toLocaleString('en-PH'),tx.customerName||'Walk-in',tx.payment,tx.subtotal,tx.discAmt||0,tx.vat,tx.total])
    const csv=[headers,...rows].map(r=>r.join(',')).join('\n')
    const blob=new Blob([csv],{type:'text/csv'})
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`gapuz-reports-${period}-${new Date().toISOString().slice(0,10)}.csv`;a.click()
  }

  const Tip=({active,payload,label})=>{ if(!active||!payload?.length) return null; return <div className="card" style={{padding:'8px 12px',fontSize:12}}><div style={{color:'var(--text3)',marginBottom:3}}>{label}</div><div style={{fontFamily:"'JetBrains Mono',monospace",color:'var(--accent)'}}>{peso(payload[0].value)}</div></div> }

  return (
    <div style={{height:'100%',overflowY:'auto',padding:20,display:'flex',flexDirection:'column',gap:18}}>
      <div className="page-header">
        <div className="page-title">📈 {t('reports')}</div>
        <button onClick={exportCSV} className="btn-secondary">📥 {t('export_csv')}</button>
      </div>
      <div style={{display:'flex',gap:6,background:'var(--bg3)',padding:4,borderRadius:10,flexShrink:0,width:'fit-content'}}>
        {PERIODS.map(p=><button key={p} onClick={()=>setPeriod(p)} style={{padding:'7px 20px',borderRadius:7,border:'none',fontFamily:'inherit',fontSize:13,fontWeight:500,cursor:'pointer',transition:'all .18s',...(period===p?{background:'var(--accent)',color:'#0a0a0a',fontWeight:700}:{background:'transparent',color:'var(--text2)'})}}>{t(p)}</button>)}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,flexShrink:0}}>
        {[{label:t('total_revenue'),value:peso(totalRevenue),color:'var(--accent)'},{label:t('total_txns'),value:filtered.length,color:'var(--purple)'},{label:'Total VAT',value:peso(totalVat),color:'var(--yellow)'},{label:'Avg. Order',value:peso(avgOrder),color:'var(--green)'}].map(s=>(
          <div key={s.label} className="card" style={{padding:16,borderTop:`2px solid ${s.color}`}}>
            <div style={{fontSize:10,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:6}}>{s.label}</div>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:20,fontWeight:700,color:s.color}}>{s.value}</div>
          </div>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1.6fr 1fr',gap:14}}>
        <div className="card" style={{padding:20}}>
          <div style={{fontWeight:600,fontSize:13,marginBottom:14}}>Revenue — {t(period)}</div>
          <ResponsiveContainer width="100%" height={200}>
            {period==='this_month'
              ?<LineChart data={chartData}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/><XAxis dataKey="label" tick={{fontSize:9,fill:'var(--text3)'}} tickLine={false} axisLine={false} interval={2}/><YAxis tick={{fontSize:9,fill:'var(--text3)'}} tickLine={false} axisLine={false} tickFormatter={v=>v>=1000?Math.round(v/1000)+'k':v}/><Tooltip content={<Tip/>}/><Line type="monotone" dataKey="value" stroke="#d1e751" strokeWidth={2} dot={false}/></LineChart>
              :<BarChart data={chartData} barSize={period==='today'?14:28}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/><XAxis dataKey="label" tick={{fontSize:9,fill:'var(--text3)'}} tickLine={false} axisLine={false}/><YAxis tick={{fontSize:9,fill:'var(--text3)'}} tickLine={false} axisLine={false} tickFormatter={v=>v>=1000?Math.round(v/1000)+'k':v}/><Tooltip content={<Tip/>} cursor={{fill:'rgba(255,255,255,0.03)'}}/><Bar dataKey="value" fill="#d1e751" radius={[4,4,0,0]}/></BarChart>
            }
          </ResponsiveContainer>
        </div>
        <div className="card" style={{padding:20}}>
          <div style={{fontWeight:600,fontSize:13,marginBottom:14}}>{t('payment_method')}</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart><Pie data={payBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>{payBreakdown.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Pie><Tooltip formatter={v=>peso(v)}/><Legend iconSize={8} wrapperStyle={{fontSize:11}}/></PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
          <div className="section-title" style={{marginBottom:0}}>{t('txn_history')} ({filtered.length})</div>
          <select className="select-field" style={{width:160,fontSize:12}} value={payFilter} onChange={e=>setPayFilter(e.target.value)}>
            <option value="All">{t('all_methods')}</option>
            {['Cash','GCash','Card'].map(m=><option key={m}>{m}</option>)}
          </select>
        </div>
        <div className="tbl-wrap">
          <table>
            <thead><tr>{['TXN #','Date & Time','Customer','Items','Payment','Subtotal','Discount','VAT','Total'].map(h=><th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.length===0?<tr><td colSpan={9} style={{textAlign:'center',padding:40,color:'var(--text3)'}}>{t('no_data')}</td></tr>
              :filtered.map(tx=>(
                <tr key={tx.id}>
                  <td style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:'var(--accent)'}}>#{String(tx.id).padStart(4,'0')}</td>
                  <td style={{fontSize:11,color:'var(--text3)'}}>{new Date(tx.createdAt).toLocaleString('en-PH',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</td>
                  <td style={{fontSize:12}}>{tx.customerName||'Walk-in'}</td>
                  <td style={{fontSize:11,color:'var(--text3)'}}>{(tx.items||[]).length} item(s)</td>
                  <td><span className={`badge ${tx.payment==='Cash'?'badge-green':tx.payment==='GCash'?'badge-blue':'badge-purple'}`} style={{fontSize:10}}>{tx.payment}</span></td>
                  <td style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11}}>{peso(tx.subtotal)}</td>
                  <td style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:'var(--red)'}}>{tx.discAmt>0?`-${peso(tx.discAmt)}`:'—'}</td>
                  <td style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:'var(--text3)'}}>{peso(tx.vat)}</td>
                  <td style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:'var(--green)',fontWeight:700}}>{peso(tx.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
