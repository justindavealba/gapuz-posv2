import { useState } from 'react'
import { useRefundStore, useTransactionStore, useAuthStore } from '../store'
import { useToast } from '../utils/toast'
import { useT, peso, fmtDate, REFUND_REASONS } from '../utils/helpers'

export default function Refunds() {
  const { refunds, addRefund, updateRefund } = useRefundStore()
  const transactions = useTransactionStore(s=>s.transactions)
  const { user, role } = useAuthStore()
  const toast = useToast()
  const t     = useT()

  const [step,      setStep]      = useState(0)
  const [txnInput,  setTxnInput]  = useState('')
  const [foundTxn,  setFoundTxn]  = useState(null)
  const [selItems,  setSelItems]  = useState([])
  const [reason,    setReason]    = useState('')
  const [refMethod, setRefMethod] = useState('Cash')
  const [notes,     setNotes]     = useState('')
  const [filterStatus,setFilterStatus]=useState('All')

  const lookupTxn = () => {
    if(!txnInput.trim()) return toast('Enter a transaction ID','error')
    const id = parseInt(txnInput.replace('#',''))
    const found = transactions.find(tx=>tx.id===id)
    if(!found) return toast(t('txn_not_found'),'error')
    if(found.status==='Refunded') return toast('This transaction was already refunded','warning')
    setFoundTxn(found); setSelItems([]); setStep(2)
  }

  const toggleItem = (item) => {
    setSelItems(prev=>{ const ex=prev.find(i=>i.name===item.name); if(ex) return prev.filter(i=>i.name!==item.name); return [...prev,{...item,refundQty:item.qty}] })
  }

  const updateQty = (name,qty) => setSelItems(prev=>prev.map(i=>i.name===name?{...i,refundQty:Math.max(1,Math.min(qty,i.qty))}:i))

  const refundTotal = selItems.reduce((s,i)=>s+i.price*i.refundQty,0)
  const refundVat   = refundTotal*0.12
  const refundGrand = refundTotal+refundVat

  const processRefund = () => {
    if(!selItems.length) return toast('Select at least one item','error')
    if(!reason.trim())   return toast('Enter a reason','error')
    addRefund({
      transactionId: foundTxn.id,
      customerName:  foundTxn.customerName||'Walk-in',
      reason, refundMethod:refMethod, notes,
      total:Math.round(refundGrand),
      status:'Pending',
      processedBy: user?.name||role||'Admin',
      items: selItems,
    })
    toast(t('refund_processed'),'success')
    resetForm()
  }

  const updateStatus = (id,status) => { updateRefund(id,{status}); toast(`Refund ${status.toLowerCase()} ✓`,'success') }
  const resetForm = () => { setStep(0);setTxnInput('');setFoundTxn(null);setSelItems([]);setReason('');setNotes('');setRefMethod('Cash') }

  const filtered = refunds.filter(r=>filterStatus==='All'||r.status===filterStatus)
  const statusBadge = s => s==='Approved'?'badge-green':s==='Rejected'?'badge-red':'badge-yellow'

  return (
    <div style={{height:'100%',overflow:'hidden',display:'flex',flexDirection:'column',padding:20,gap:16}}>
      <div className="page-header">
        <div className="page-title">🔄 {t('refunds')}</div>
        {step===0&&<button onClick={()=>setStep(1)} className="btn-primary">+ {t('process_refund')}</button>}
        {step>0&&<button onClick={resetForm} className="btn-secondary">← Back to List</button>}
      </div>

      {step===0&&(<>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,flexShrink:0}}>
          {[{label:'Total Refunds',value:refunds.length,color:'var(--blue)'},{label:'Pending',value:refunds.filter(r=>r.status==='Pending').length,color:'var(--yellow)'},{label:'Approved',value:refunds.filter(r=>r.status==='Approved').length,color:'var(--green)'},{label:'Total Refunded',value:peso(refunds.filter(r=>r.status==='Approved').reduce((s,r)=>s+r.total,0)),color:'var(--red)'}].map(s=>(
            <div key={s.label} className="card" style={{padding:16,borderTop:`2px solid ${s.color}`}}>
              <div style={{fontSize:10,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:6}}>{s.label}</div>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:20,fontWeight:700,color:s.color}}>{s.value}</div>
            </div>
          ))}
        </div>
        <div style={{display:'flex',gap:6,flexShrink:0}}>
          {['All','Pending','Approved','Rejected'].map(s=>(
            <button key={s} onClick={()=>setFilterStatus(s)} style={{padding:'6px 16px',borderRadius:99,border:'1px solid',fontSize:12,fontWeight:500,cursor:'pointer',transition:'all .15s',fontFamily:'inherit',...(filterStatus===s?{background:'var(--accent)',borderColor:'var(--accent)',color:'#0a0a0a',fontWeight:700}:{background:'transparent',borderColor:'var(--border)',color:'var(--text2)'})}}>{s}</button>
          ))}
        </div>
        <div style={{flex:1,overflowY:'auto'}}>
          <div className="tbl-wrap">
            <table>
              <thead><tr>{['Refund #','TXN #','Date','Customer','Reason','Method','Total','Status','Actions'].map(h=><th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {filtered.length===0?<tr><td colSpan={9} style={{textAlign:'center',padding:40,color:'var(--text3)'}}>No refunds found</td></tr>
                :filtered.map(r=>(
                  <tr key={r.id}>
                    <td style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:'var(--accent)'}}>#{String(r.id).padStart(4,'0')}</td>
                    <td style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11}}>#{String(r.transactionId).padStart(4,'0')}</td>
                    <td style={{fontSize:11,color:'var(--text3)'}}>{fmtDate(r.createdAt)}</td>
                    <td style={{fontSize:12}}>{r.customerName}</td>
                    <td style={{fontSize:11,color:'var(--text2)',maxWidth:140,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.reason}</td>
                    <td><span className={`badge ${r.refundMethod==='Cash'?'badge-green':r.refundMethod==='GCash'?'badge-blue':'badge-purple'}`} style={{fontSize:10}}>{r.refundMethod}</span></td>
                    <td style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:'var(--red)',fontWeight:600}}>{peso(r.total)}</td>
                    <td><span className={`badge ${statusBadge(r.status)}`} style={{fontSize:10}}>{r.status}</span></td>
                    <td>{r.status==='Pending'&&role==='admin'&&(
                      <div style={{display:'flex',gap:5}}>
                        <button onClick={()=>updateStatus(r.id,'Approved')} className="btn-success" style={{fontSize:10,padding:'4px 8px'}}>{t('approve')}</button>
                        <button onClick={()=>updateStatus(r.id,'Rejected')} className="btn-danger" style={{fontSize:10,padding:'4px 8px'}}>{t('reject')}</button>
                      </div>
                    )}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </>)}

      {step===1&&(
        <div style={{display:'flex',justifyContent:'center',paddingTop:40}}>
          <div className="card" style={{width:420,padding:32}}>
            <div style={{fontSize:15,fontWeight:700,marginBottom:6}}>🔍 Step 1 — {t('orig_txn')}</div>
            <div style={{fontSize:12,color:'var(--text2)',marginBottom:20}}>Enter the Transaction ID number to look up the original sale.</div>
            <label style={{fontSize:10,color:'var(--text3)',display:'block',marginBottom:6,textTransform:'uppercase',letterSpacing:'.5px'}}>Transaction ID #</label>
            <div style={{display:'flex',gap:8}}>
              <input className="input-field" placeholder="e.g. 0021" value={txnInput} onChange={e=>setTxnInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&lookupTxn()}/>
              <button onClick={lookupTxn} className="btn-primary" style={{whiteSpace:'nowrap'}}>{t('look_up')}</button>
            </div>
          </div>
        </div>
      )}

      {step===2&&foundTxn&&(
        <div style={{flex:1,overflowY:'auto'}}>
          <div className="card" style={{padding:24,marginBottom:16}}>
            <div style={{fontSize:15,fontWeight:700,marginBottom:12}}>📦 Step 2 — {t('select_items')}</div>
            <div style={{display:'flex',gap:20,marginBottom:16,fontSize:12,color:'var(--text2)'}}>
              <span>TXN #{String(foundTxn.id).padStart(4,'0')}</span>
              <span>Customer: {foundTxn.customerName||'Walk-in'}</span>
              <span>Total: <strong style={{color:'var(--accent)'}}>{peso(foundTxn.total)}</strong></span>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {(foundTxn.items||[]).map(item=>{ const isSelected=selItems.find(i=>i.name===item.name); return (
                <div key={item.name} onClick={()=>toggleItem(item)} style={{display:'flex',alignItems:'center',gap:12,padding:14,borderRadius:10,border:`1px solid ${isSelected?'var(--accent)':'var(--border)'}`,background:isSelected?'rgba(209,231,81,0.05)':'var(--bg3)',cursor:'pointer',transition:'all .15s'}}>
                  <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${isSelected?'var(--accent)':'var(--border2)'}`,background:isSelected?'var(--accent)':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all .15s'}}>{isSelected&&<span style={{fontSize:11,color:'#0a0a0a',fontWeight:700}}>✓</span>}</div>
                  <div style={{flex:1}}><div style={{fontSize:12,fontWeight:600}}>{item.name}</div><div style={{fontSize:11,color:'var(--text3)'}}>{peso(item.price)} × {item.qty} = {peso(item.price*item.qty)}</div></div>
                  {isSelected&&<div onClick={e=>e.stopPropagation()} style={{display:'flex',alignItems:'center',gap:6}}><span style={{fontSize:11,color:'var(--text3)'}}>Qty:</span><input type="number" min="1" max={item.qty} value={isSelected.refundQty} onChange={e=>updateQty(item.name,parseInt(e.target.value))} style={{width:52,padding:'4px 8px',borderRadius:8,border:'1px solid var(--border2)',background:'var(--bg2)',color:'var(--text)',fontSize:12,outline:'none',fontFamily:'inherit',textAlign:'center'}}/></div>}
                </div>
              )})}
            </div>
            {selItems.length>0&&<div style={{marginTop:16,padding:14,background:'rgba(209,231,81,0.04)',border:'1px solid rgba(209,231,81,0.2)',borderRadius:10,fontSize:12}}>
              <div style={{display:'flex',justifyContent:'space-between',color:'var(--text2)',marginBottom:4}}><span>Refund subtotal</span><span style={{fontFamily:"'JetBrains Mono',monospace"}}>{peso(refundTotal)}</span></div>
              <div style={{display:'flex',justifyContent:'space-between',color:'var(--text2)',marginBottom:6}}><span>VAT (12%)</span><span style={{fontFamily:"'JetBrains Mono',monospace"}}>{peso(refundVat)}</span></div>
              <div style={{display:'flex',justifyContent:'space-between',fontWeight:700,fontSize:15,borderTop:'1px solid var(--border)',paddingTop:6}}><span>{t('refund_total')}</span><span style={{fontFamily:"'JetBrains Mono',monospace",color:'var(--accent)'}}>{peso(refundGrand)}</span></div>
            </div>}
          </div>
          <div className="card" style={{padding:24}}>
            <div style={{fontSize:15,fontWeight:700,marginBottom:16}}>📝 Step 3 — Refund Details</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
              <div><label style={{fontSize:10,color:'var(--text3)',display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'.5px'}}>{t('reason')} *</label><select className="select-field" style={{width:'100%'}} value={reason} onChange={e=>setReason(e.target.value)}><option value="">Select reason...</option>{REFUND_REASONS.map(r=><option key={r}>{r}</option>)}</select></div>
              <div><label style={{fontSize:10,color:'var(--text3)',display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'.5px'}}>{t('refund_method')}</label><select className="select-field" style={{width:'100%'}} value={refMethod} onChange={e=>setRefMethod(e.target.value)}>{['Cash','GCash','Store Credit'].map(m=><option key={m}>{m}</option>)}</select></div>
              <div style={{gridColumn:'span 2'}}><label style={{fontSize:10,color:'var(--text3)',display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'.5px'}}>{t('notes')}</label><textarea className="input-field" rows={2} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Additional notes..." style={{resize:'none'}}/></div>
            </div>
            <div style={{display:'flex',gap:10}}>
              <button onClick={resetForm} className="btn-secondary">{t('cancel')}</button>
              <button onClick={processRefund} disabled={!selItems.length||!reason} className="btn-primary" style={{flex:1}}>🔄 Process Refund — {peso(Math.round(refundGrand))}</button>
            </div>
            {role==='cashier'&&<div style={{marginTop:12,padding:10,background:'rgba(251,191,36,0.06)',border:'1px solid rgba(251,191,36,0.2)',borderRadius:8,fontSize:11,color:'var(--yellow)'}}>⚠️ Refund will be submitted as Pending. Admin must approve before it is processed.</div>}
          </div>
        </div>
      )}
    </div>
  )
}
