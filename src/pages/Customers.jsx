import { useState } from 'react'
import { useCustomerStore, useTransactionStore } from '../store'
import { useToast } from '../utils/toast'
import { useT, peso, fmtDate, getTier } from '../utils/helpers'

const EMPTY = { name:'', email:'', phone:'', address:'' }

export default function Customers() {
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useCustomerStore()
  const transactions = useTransactionStore(s=>s.transactions)
  const [search,   setSearch]   = useState('')
  const [modal,    setModal]    = useState(null)
  const [form,     setForm]     = useState(EMPTY)
  const [selected, setSelected] = useState(null)
  const [sortBy,   setSortBy]   = useState('name')
  const toast = useToast()
  const t     = useT()

  const openAdd  = () => { setForm(EMPTY); setModal('add') }
  const openEdit = c => { setForm({name:c.name,email:c.email||'',phone:c.phone||'',address:c.address||''}); setSelected(c); setModal('edit') }
  const openHistory = c => { setSelected(c); setModal('history') }

  const handleSave = () => {
    if(!form.name.trim()) return toast('Name is required','error')
    if(modal==='add') { addCustomer(form); toast(t('customer_added'),'success') }
    else { updateCustomer(selected.id,form); toast(t('customer_updated'),'success') }
    setModal(null)
  }

  const handleDelete = c => {
    if(!window.confirm(t('confirm_delete_cust'))) return
    deleteCustomer(c.id)
    toast('Customer deleted','info')
  }

  const filtered = customers
    .filter(c=>!search||c.name.toLowerCase().includes(search.toLowerCase())||(c.phone||'').includes(search)||(c.email||'').toLowerCase().includes(search.toLowerCase()))
    .sort((a,b)=>{ if(sortBy==='name') return a.name.localeCompare(b.name); if(sortBy==='points') return b.points-a.points; if(sortBy==='spent') return b.totalSpent-a.totalSpent; if(sortBy==='purchases') return b.purchases-a.purchases; return 0 })

  const custTxns = selected ? transactions.filter(tx=>tx.customerId===selected.id) : []

  return (
    <div style={{height:'100%',overflow:'hidden',display:'flex',flexDirection:'column',padding:20,gap:16}}>
      <div className="page-header">
        <div className="page-title">👥 {t('customers')}</div>
        <button onClick={openAdd} className="btn-primary">+ {t('add_customer')}</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,flexShrink:0}}>
        {[
          {label:'Total Customers',  value:customers.length,                                         color:'var(--accent)'},
          {label:'Total Points',     value:customers.reduce((s,c)=>s+c.points,0).toLocaleString(),   color:'var(--yellow)'},
          {label:'Platinum Members', value:customers.filter(c=>c.points>=3000).length,               color:'var(--blue)'},
          {label:'Gold Members',     value:customers.filter(c=>c.points>=1500&&c.points<3000).length,color:'var(--yellow)'},
        ].map(s=>(
          <div key={s.label} className="card" style={{padding:16,borderTop:`2px solid ${s.color}`}}>
            <div style={{fontSize:10,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:6}}>{s.label}</div>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:20,fontWeight:700,color:s.color}}>{s.value}</div>
          </div>
        ))}
      </div>
      <div style={{display:'flex',gap:8,flexShrink:0}}>
        <div style={{position:'relative', maxWidth:280, flex:1}}>
          <img src="/logo.png" style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',width:22,height:22,borderRadius:'50%',objectFit:'cover',pointerEvents:'none'}} alt=""/>
          <input className="input-field" style={{paddingLeft:40, width:'100%'}} placeholder="Search customers..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <select className="select-field" value={sortBy} onChange={e=>setSortBy(e.target.value)}>
          <option value="name">Name A–Z</option>
          <option value="points">Most Points</option>
          <option value="spent">Most Spent</option>
          <option value="purchases">Most Purchases</option>
        </select>
      </div>
      <div style={{flex:1,overflowY:'auto'}}>
        <div className="tbl-wrap">
          <table>
            <thead><tr>{['Customer','Contact','Tier','Points','Purchases','Total Spent','Joined','Actions'].map(h=><th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.length===0?<tr><td colSpan={8} style={{textAlign:'center',padding:40,color:'var(--text3)'}}>{t('no_data')}</td></tr>
              :filtered.map(c=>{ const tier=getTier(c.points); return (
                <tr key={c.id}>
                  <td><div style={{display:'flex',alignItems:'center',gap:10}}>
                    <div style={{width:32,height:32,borderRadius:8,background:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#0a0a0a',flexShrink:0}}>{c.name.charAt(0).toUpperCase()}</div>
                    <div><div style={{fontSize:12,fontWeight:600}}>{c.name}</div><div style={{fontSize:10,color:'var(--text3)'}}>{c.email||'No email'}</div></div>
                  </div></td>
                  <td style={{fontSize:11,color:'var(--text2)'}}>{c.phone||'—'}</td>
                  <td><span style={{fontSize:11,fontWeight:600,color:tier.color}}>{tier.icon} {tier.label}</span></td>
                  <td style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:'var(--yellow)',fontWeight:600}}>{(c.points||0).toLocaleString()}</td>
                  <td style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11}}>{c.purchases||0}</td>
                  <td style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:'var(--green)',fontWeight:600}}>{peso(c.totalSpent||0)}</td>
                  <td style={{fontSize:11,color:'var(--text3)'}}>{c.createdAt?fmtDate(c.createdAt):'—'}</td>
                  <td><div style={{display:'flex',gap:5}}>
                    <button onClick={()=>openHistory(c)} className="btn-success" style={{fontSize:10,padding:'4px 8px'}}>History</button>
                    <button onClick={()=>openEdit(c)} className="btn-secondary" style={{fontSize:10,padding:'4px 8px'}}>{t('edit')}</button>
                    <button onClick={()=>handleDelete(c)} className="btn-danger" style={{fontSize:10,padding:'4px 8px'}}>{t('delete')}</button>
                  </div></td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(modal==='add'||modal==='edit')&&(
        <div style={{position:'fixed',inset:0,zIndex:50,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.9)'}} onClick={e=>e.target===e.currentTarget&&setModal(null)}>
          <div className="card animate-scale-in" style={{width:420,padding:28}}>
            <div style={{fontSize:15,fontWeight:700,marginBottom:20}}>{modal==='add'?`➕ ${t('add_customer')}`:`✏️ ${t('edit_customer')}`}</div>
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              {[['name',t('full_name'),'Juan dela Cruz','text'],['email',t('email_addr'),'juan@email.com','email'],['phone',t('phone'),'0917-123-4567','text'],['address',t('address'),'Cagayan de Oro City','text']].map(([key,label,ph,type])=>(
                <div key={key}><label style={{fontSize:10,color:'var(--text3)',display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'.5px'}}>{label}</label><input className="input-field" type={type} value={form[key]} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))} placeholder={ph}/></div>
              ))}
            </div>
            <div style={{display:'flex',gap:10,marginTop:20,justifyContent:'flex-end'}}><button onClick={()=>setModal(null)} className="btn-secondary">{t('cancel')}</button><button onClick={handleSave} className="btn-primary">{t('save')}</button></div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {modal==='history'&&(
        <div style={{position:'fixed',inset:0,zIndex:50,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.9)'}} onClick={e=>e.target===e.currentTarget&&setModal(null)}>
          <div className="card animate-scale-in" style={{width:520,padding:24,maxHeight:'80vh',display:'flex',flexDirection:'column'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <div><div style={{fontSize:15,fontWeight:700}}>📋 {t('purchase_history')}</div><div style={{fontSize:12,color:'var(--text2)',marginTop:2}}>{selected?.name}</div></div>
              <button onClick={()=>setModal(null)} style={{background:'none',border:'none',color:'var(--text3)',cursor:'pointer',fontSize:20}}>×</button>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:16}}>
              {[{label:'Loyalty Points',value:(selected?.points||0).toLocaleString(),color:'var(--yellow)'},{label:'Total Purchases',value:selected?.purchases||0,color:'var(--accent)'},{label:'Total Spent',value:peso(selected?.totalSpent||0),color:'var(--green)'}].map(s=>(
                <div key={s.label} className="card-surface" style={{padding:12}}>
                  <div style={{fontSize:9.5,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:4}}>{s.label}</div>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:16,fontWeight:700,color:s.color}}>{s.value}</div>
                </div>
              ))}
            </div>
            <div style={{flex:1,overflowY:'auto'}}>
              {custTxns.length===0?<div style={{textAlign:'center',padding:32,color:'var(--text3)'}}><div style={{fontSize:36,opacity:.2,marginBottom:8}}>🛒</div>{t('no_purchases')}</div>
              :custTxns.map(tx=>(
                <div key={tx.id} className="card-surface" style={{padding:12,marginBottom:8}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                    <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:'var(--accent)'}}>#{String(tx.id).padStart(4,'0')}</span>
                    <span style={{fontSize:11,color:'var(--text3)'}}>{new Date(tx.createdAt).toLocaleString('en-PH',{month:'short',day:'numeric',year:'numeric',hour:'2-digit',minute:'2-digit'})}</span>
                    <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,fontWeight:700,color:'var(--green)'}}>{peso(tx.total)}</span>
                  </div>
                  <div style={{fontSize:11,color:'var(--text2)'}}>{(tx.items||[]).map(i=>`${i.name} ×${i.qty}`).join(' · ')}</div>
                  <div style={{fontSize:10,color:'var(--text3)',marginTop:3}}>{tx.payment} · +{Math.floor(tx.total/100)} pts earned</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
