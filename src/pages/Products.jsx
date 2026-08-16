import { useState } from 'react'
import { useProductStore, useAppStore } from '../store'
import { useToast } from '../utils/toast'
import { useT, peso, stockStatus, genBarcode, CATEGORIES, CAT_COLORS } from '../utils/helpers'

const EMPTY = { name:'', category:'Processors', price:'', costPrice:'', stock:'', barcode:'', image:'' }

export default function Products() {
  const { products, addProduct, updateProduct, deleteProduct, restockProduct } = useProductStore()
  const [search,    setSearch]    = useState('')
  const [catFilter, setCatFilter] = useState('All')
  const [sortBy,    setSortBy]    = useState('name')
  const [modal,     setModal]     = useState(null)
  const [form,      setForm]      = useState(EMPTY)
  const [selected,  setSelected]  = useState(null)
  const [restockQty,setRestockQty]= useState('')
  const { theme } = useAppStore()
  const toast = useToast()
  const t     = useT()

  const isLight = theme === 'light'
  const mutedText = isLight ? '#4b5563' : '#d1d5db'
  const bodyText = isLight ? '#374151' : '#ffffff'

  const openAdd   = () => { setForm({...EMPTY,barcode:genBarcode()}); setModal('add') }
  const openEdit  = p  => { setForm({name:p.name,category:p.category,price:p.price,costPrice:p.costPrice||'',stock:p.stock,barcode:p.barcode||'',image:p.image||''}); setSelected(p); setModal('edit') }
  const openRestock = p => { setSelected(p); setRestockQty(''); setModal('restock') }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setForm(f => ({ ...f, image: reader.result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = () => {
    if(!form.name||!form.price) return toast('Name and price are required','error')
    const data = { name:form.name.trim(), category:form.category, price:parseFloat(form.price), costPrice:parseFloat(form.costPrice)||0, stock:parseInt(form.stock)||0, barcode:form.barcode||genBarcode(), image:form.image }
    if(modal==='add') { addProduct(data); toast(t('product_added'),'success') }
    else { updateProduct(selected.id,data); toast(t('product_updated'),'success') }
    setModal(null)
  }

  const handleRestock = () => {
    if(!restockQty||parseInt(restockQty)<=0) return toast('Enter a valid quantity','error')
    restockProduct(selected.id,parseInt(restockQty))
    toast(t('restocked'),'success')
    setModal(null)
  }

  const handleDelete = (p) => {
    if(!window.confirm(t('confirm_delete'))) return
    deleteProduct(p.id)
    toast(t('product_deleted'),'info')
  }

  const filtered = products
    .filter(p=>(catFilter==='All'||p.category===catFilter)&&(!search||p.name.toLowerCase().includes(search.toLowerCase())||(p.barcode||'').toLowerCase().includes(search.toLowerCase())))
    .sort((a,b)=>{ if(sortBy==='name') return a.name.localeCompare(b.name); if(sortBy==='price-asc') return a.price-b.price; if(sortBy==='price-desc') return b.price-a.price; if(sortBy==='stock') return b.stock-a.stock; if(sortBy==='sold') return (b.sold||0)-(a.sold||0); return 0 })

  const totalValue = products.reduce((s,p)=>s+p.price*p.stock,0)
  const outCount   = products.filter(p=>p.stock===0).length
  const lowCount   = products.filter(p=>p.stock>0&&p.stock<=5).length

  return (
    <div style={{height:'100%',overflow:'hidden',display:'flex',flexDirection:'column',padding:20,gap:16}}>
      <div className="page-header">
        <div>
          <div className="page-title" style={{display:'flex',alignItems:'center',gap:10}}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
              <path d="m3.3 7 8.7 5 8.7-5"/>
              <path d="M12 22V12"/>
            </svg>
            {t('products')}
          </div>
          <div style={{fontSize:12,color:mutedText,marginTop:2}}>{t('showing')} {filtered.length} {t('of')} {products.length}</div>
        </div>
        <button onClick={openAdd} className="btn-primary">+ {t('add_product')}</button>
      </div>

      <div style={{display:'flex',gap:8,flexShrink:0,flexWrap:'wrap'}}>
        <div style={{position:'relative', maxWidth:280, minWidth:180, flex:1}}>
          <div style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',pointerEvents:'none',display:'flex',alignItems:'center',opacity:0.6}}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.3-4.3"/>
            </svg>
          </div>
          <input className="input-field" style={{paddingLeft:40, width:'100%'}} placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <select className="select-field" value={catFilter} onChange={e=>setCatFilter(e.target.value)}>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select>
        <select className="select-field" value={sortBy} onChange={e=>setSortBy(e.target.value)}>
          <option value="name">Name A–Z</option><option value="price-asc">Price ↑</option><option value="price-desc">Price ↓</option><option value="stock">Stock</option><option value="sold">Best Selling</option>
        </select>
      </div>
      <div style={{flex:1,overflowY:'auto'}}>
        <div className="tbl-wrap">
          <table>
            <thead><tr>{['','Product','Category','Price','Cost','Profit','Stock','Sold','Actions'].map(h=><th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.length===0?<tr><td colSpan={9} style={{textAlign:'center',padding:40,color:mutedText}}>{t('no_data')}</td></tr>
              :filtered.map(p=>{
                const profit=p.costPrice?((p.price-p.costPrice)/p.price*100).toFixed(1):'—'
                const ss=stockStatus(p.stock)
                return(<tr key={p.id}>
                  <td style={{width:40}}>
                    {p.image && (p.image.startsWith('data:') || p.image.startsWith('http')) ? (
                      <img src={p.image} style={{width:28,height:28,borderRadius:6,objectFit:'cover'}} alt=""/>
                    ) : (
                      <div style={{width:28,height:28,borderRadius:6,background:'var(--bg3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,color:mutedText}}>{p.image || p.icon || '📦'}</div>
                    )}
                  </td>
                  <td><div style={{fontWeight:600,fontSize:13,color:'var(--text)'}}>{p.name}</div><div style={{fontSize:11.5,color:'var(--text2)',fontFamily:"'JetBrains Mono',monospace",marginTop:2}}>{p.barcode}</div></td>
                  <td><span className={`badge ${CAT_COLORS[p.category]||'badge-accent'}`} style={{fontSize:10}}>{p.category}</span></td>
                  <td style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:bodyText,fontWeight:600}}>{peso(p.price)}</td>
                  <td style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:bodyText}}>{p.costPrice?peso(p.costPrice):'—'}</td>
                  <td style={{fontSize:11,color:p.costPrice?'var(--green)':mutedText}}>{profit}{p.costPrice?'%':''}</td>
                  <td>
                    <div style={{display:'flex',flexDirection:'column',gap:3}}>
                      <span className={`badge ${ss.cls}`} style={{fontSize:10}}>{ss.label}</span>
                      {(() => {
                        const now = new Date()
                        const added = p.createdAt ? new Date(p.createdAt) : null
                        const lastSold = p.lastSoldAt ? new Date(p.lastSoldAt) : null
                        const daysSinceAdded = added ? Math.floor((now-added)/(1000*60*60*24)) : 0
                        const daysSinceLastSold = lastSold ? Math.floor((now-lastSold)/(1000*60*60*24)) : 999
                        if(daysSinceAdded <= 30) return <span style={{fontSize:9,padding:'2px 6px',borderRadius:99,background:'rgba(52,211,153,0.15)',color:'var(--accent)',fontWeight:700}}>🆕 New</span>
                        if(daysSinceLastSold > 90) return <span style={{fontSize:9,padding:'2px 6px',borderRadius:99,background:'rgba(239,68,68,0.15)',color:'var(--red)',fontWeight:700}}>📦 Old Stock</span>
                        return null
                      })()}
                    </div>
                  </td>
                  <td style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:mutedText}}>{p.sold||0}</td>
                  <td><div style={{display:'flex',gap:5}}>
                    <button onClick={()=>openRestock(p)} className="btn-success" style={{fontSize:10,padding:'4px 8px'}}>+Stock</button>
                    <button onClick={()=>openEdit(p)} className="btn-secondary" style={{fontSize:10,padding:'4px 8px'}}>{t('edit')}</button>
                    <button onClick={()=>handleDelete(p)} className="btn-danger" style={{fontSize:10,padding:'4px 8px'}}>{t('delete')}</button>
                  </div></td>
                </tr>)
              })}
            </tbody>
          </table>
        </div>
      </div>
      {(modal==='add'||modal==='edit')&&(
        <div style={{position:'fixed',inset:0,zIndex:50,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.9)'}} onClick={e=>e.target===e.currentTarget&&setModal(null)}>
          <div className="card animate-scale-in" style={{width:'min(480px,92vw)',padding:28,maxHeight:'90vh',overflowY:'auto'}}>
            <div style={{fontSize:15,fontWeight:700,marginBottom:20}}>{modal==='add'?`➕ ${t('add_product')}`:`✏️ ${t('edit_product')}`}</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:14}}>
              <div style={{gridColumn:'span 2'}}><label style={{fontSize:10,color:mutedText,display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'.5px'}}>{t('product_name')} *</label><input className="input-field" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. AMD Ryzen 5 5600X"/></div>
              <div><label style={{fontSize:10,color:mutedText,display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'.5px'}}>{t('category')}</label><select className="select-field" style={{width:'100%'}} value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>{CATEGORIES.filter(c=>c!=='All').map(c=><option key={c}>{c}</option>)}</select></div>
              <div>
                <label style={{fontSize:10,color:mutedText,display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'.5px'}}>{t('product_image')}</label>
                <label style={{
                  display:'flex', alignItems:'center', gap:10, padding:'6px 12px', borderRadius:10, 
                  background:'var(--bg3)', border:'1px solid var(--border2)', cursor:'pointer', transition:'all .15s'
                }} onMouseEnter={e=>e.currentTarget.style.borderColor='var(--accent)'} onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border2)'}>
                  <div style={{width:28, height:28, borderRadius:6, background:'var(--bg4)', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0, border:'1px solid var(--border)'}}>
                    {form.image && (form.image.startsWith('data:') || form.image.startsWith('http')) ? (
                      <img src={form.image} style={{width:'100%', height:'100%', objectFit:'cover'}} alt=""/>
                    ) : (
                      <span style={{fontSize:12}}>{form.image || '📷'}</span>
                    )}
                  </div>
                  <div style={{flex:1, fontSize:11, fontWeight:700, color:form.image?'var(--text)':'var(--text3)'}}>
                    {form.image ? 'Change Image' : 'Upload Image'}
                  </div>
                  {form.image && (
                    <div onClick={e=>{e.preventDefault(); setForm(f=>({...f,image:''}))}} style={{fontSize:16, color:'var(--red)', padding:'0 4px', fontWeight:700}}>×</div>
                  )}
                  <input type="file" accept="image/*" hidden onChange={handleFileChange}/>
                </label>
              </div>
              {[['price',t('price'),'0.00'],['costPrice',t('cost_price'),'0.00'],['stock',t('stock'),'0']].map(([key,label,ph])=>(
                <div key={key}><label style={{fontSize:10,color:mutedText,display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'.5px'}}>{label}</label><input className="input-field" type="number" min="0" value={form[key]} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))} placeholder={ph}/></div>
              ))}
              <div><label style={{fontSize:10,color:mutedText,display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'.5px'}}>{t('barcode')}</label><div style={{display:'flex',gap:6}}><input className="input-field" value={form.barcode} onChange={e=>setForm(f=>({...f,barcode:e.target.value}))} placeholder="BC-..."/><button onClick={()=>setForm(f=>({...f,barcode:genBarcode()}))} style={{padding:'9px 10px',borderRadius:8,border:'1px solid var(--border2)',background:'var(--bg3)',color:bodyText,cursor:'pointer',fontSize:11}}>Gen</button></div></div>
            </div>
            {form.price&&form.costPrice&&<div style={{marginTop:12,padding:10,background:'rgba(34,197,94,0.06)',border:'1px solid rgba(34,197,94,0.2)',borderRadius:8,fontSize:12,color:'var(--green)'}}>💰 Profit: {(((parseFloat(form.price)-parseFloat(form.costPrice))/parseFloat(form.price))*100).toFixed(1)}%</div>}
            <div style={{display:'flex',gap:10,marginTop:20,justifyContent:'flex-end'}}><button onClick={()=>setModal(null)} className="btn-secondary">{t('cancel')}</button><button onClick={handleSave} className="btn-primary">{t('save')}</button></div>
          </div>
        </div>
      )}
      {modal==='restock'&&(
        <div style={{position:'fixed',inset:0,zIndex:50,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.9)'}} onClick={e=>e.target===e.currentTarget&&setModal(null)}>
          <div className="card animate-scale-in" style={{width:'min(340px,92vw)',padding:28}}>
            <div style={{fontSize:15,fontWeight:700,marginBottom:8}}>📦 {t('add_stock')}</div>
            <div style={{fontSize:13,color:bodyText,marginBottom:16}}>{selected?.name}</div>
            <div style={{fontSize:11,color:mutedText,marginBottom:6}}>Current stock: <strong style={{color:'var(--text)'}}>{selected?.stock}</strong></div>
            <input className="input-field" type="number" min="1" value={restockQty} onChange={e=>setRestockQty(e.target.value)} placeholder={t('qty_to_add')} onKeyDown={e=>e.key==='Enter'&&handleRestock()}/>
            {restockQty&&parseInt(restockQty)>0&&<div style={{marginTop:8,fontSize:12,color:'var(--green)'}}>New stock: {selected.stock+parseInt(restockQty)}</div>}
            <div style={{display:'flex',gap:10,marginTop:20}}><button onClick={()=>setModal(null)} className="btn-secondary" style={{flex:1}}>{t('cancel')}</button><button onClick={handleRestock} className="btn-primary" style={{flex:1}}>{t('restock')}</button></div>
          </div>
        </div>
      )}
    </div>
  )
}
