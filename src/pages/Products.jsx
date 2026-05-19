import { useState } from 'react'
import { useProductStore } from '../store'
import { useToast } from '../utils/toast'
import { useT, peso, stockStatus, genBarcode, CATEGORIES, CAT_COLORS } from '../utils/helpers'

const ICONS = ['💻','🖥️','⌨️','🖱️','🖨️','📱','💾','🔌','🎮','🎧','📷','🔋','💡','🛠️','📦','🧩','🔧']
const EMPTY = { name:'', category:'Processors', price:'', costPrice:'', stock:'', barcode:'', icon:'💻' }

export default function Products() {
  const { products, addProduct, updateProduct, deleteProduct, restockProduct } = useProductStore()
  const [search,    setSearch]    = useState('')
  const [catFilter, setCatFilter] = useState('All')
  const [sortBy,    setSortBy]    = useState('name')
  const [modal,     setModal]     = useState(null)
  const [form,      setForm]      = useState(EMPTY)
  const [selected,  setSelected]  = useState(null)
  const [restockQty,setRestockQty]= useState('')
  const toast = useToast()
  const t     = useT()

  const openAdd   = () => { setForm({...EMPTY,barcode:genBarcode()}); setModal('add') }
  const openEdit  = p  => { setForm({name:p.name,category:p.category,price:p.price,costPrice:p.costPrice||'',stock:p.stock,barcode:p.barcode||'',icon:p.icon||'💻'}); setSelected(p); setModal('edit') }
  const openRestock = p => { setSelected(p); setRestockQty(''); setModal('restock') }

  const handleSave = () => {
    if(!form.name||!form.price) return toast('Name and price are required','error')
    const data = { name:form.name.trim(), category:form.category, price:parseFloat(form.price), costPrice:parseFloat(form.costPrice)||0, stock:parseInt(form.stock)||0, barcode:form.barcode||genBarcode(), icon:form.icon||'💻' }
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
        <div><div className="page-title">📦 {t('products')}</div><div style={{fontSize:12,color:'var(--text3)',marginTop:2}}>{t('showing')} {filtered.length} {t('of')} {products.length}</div></div>
        <button onClick={openAdd} className="btn-primary">+ {t('add_product')}</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,flexShrink:0}}>
        {[{label:t('total_products'),value:products.length,color:'var(--accent)'},{label:t('inventory_value'),value:peso(totalValue),color:'var(--green)'},{label:'Low Stock',value:lowCount,color:'var(--yellow)'},{label:'Out of Stock',value:outCount,color:'var(--red)'}].map(s=>(
          <div key={s.label} className="card" style={{padding:16,borderTop:`2px solid ${s.color}`}}>
            <div style={{fontSize:10,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:6}}>{s.label}</div>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:20,fontWeight:700,color:s.color}}>{s.value}</div>
          </div>
        ))}
      </div>
      <div style={{display:'flex',gap:8,flexShrink:0}}>
        <div style={{position:'relative', maxWidth:280, flex:1}}>
          <img src="/logo.png" style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',width:22,height:22,borderRadius:'50%',objectFit:'cover',pointerEvents:'none'}} alt=""/>
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
              {filtered.length===0?<tr><td colSpan={9} style={{textAlign:'center',padding:40,color:'var(--text3)'}}>{t('no_data')}</td></tr>
              :filtered.map(p=>{
                const profit=p.costPrice?((p.price-p.costPrice)/p.price*100).toFixed(1):'—'
                const ss=stockStatus(p.stock)
                return(<tr key={p.id}>
                  <td style={{fontSize:20,width:40}}>{p.icon}</td>
                  <td><div style={{fontWeight:600,fontSize:12}}>{p.name}</div><div style={{fontSize:10,color:'var(--text3)',fontFamily:"'JetBrains Mono',monospace"}}>{p.barcode}</div></td>
                  <td><span className={`badge ${CAT_COLORS[p.category]||'badge-accent'}`} style={{fontSize:10}}>{p.category}</span></td>
                  <td style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:'var(--accent)',fontWeight:600}}>{peso(p.price)}</td>
                  <td style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:'var(--text2)'}}>{p.costPrice?peso(p.costPrice):'—'}</td>
                  <td style={{fontSize:11,color:p.costPrice?'var(--green)':'var(--text3)'}}>{profit}{p.costPrice?'%':''}</td>
                  <td><span className={`badge ${ss.cls}`} style={{fontSize:10}}>{ss.label}</span></td>
                  <td style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:'var(--text3)'}}>{p.sold||0}</td>
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
          <div className="card animate-scale-in" style={{width:480,padding:28,maxHeight:'90vh',overflowY:'auto'}}>
            <div style={{fontSize:15,fontWeight:700,marginBottom:20}}>{modal==='add'?`➕ ${t('add_product')}`:`✏️ ${t('edit_product')}`}</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
              <div style={{gridColumn:'span 2'}}><label style={{fontSize:10,color:'var(--text3)',display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'.5px'}}>{t('product_name')} *</label><input className="input-field" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. AMD Ryzen 5 5600X"/></div>
              <div><label style={{fontSize:10,color:'var(--text3)',display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'.5px'}}>{t('category')}</label><select className="select-field" style={{width:'100%'}} value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>{CATEGORIES.filter(c=>c!=='All').map(c=><option key={c}>{c}</option>)}</select></div>
              <div><label style={{fontSize:10,color:'var(--text3)',display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'.5px'}}>Icon</label><div style={{display:'flex',gap:5,flexWrap:'wrap',padding:8,background:'var(--bg3)',border:'1px solid var(--border2)',borderRadius:8}}>{ICONS.map(ic=><span key={ic} onClick={()=>setForm(f=>({...f,icon:ic}))} style={{fontSize:17,cursor:'pointer',padding:3,borderRadius:5,background:form.icon===ic?'rgba(209,231,81,0.15)':'transparent',border:form.icon===ic?'1px solid var(--accent)':'1px solid transparent'}}>{ic}</span>)}</div></div>
              {[['price',t('price'),'0.00'],['costPrice',t('cost_price'),'0.00'],['stock',t('stock'),'0']].map(([key,label,ph])=>(
                <div key={key}><label style={{fontSize:10,color:'var(--text3)',display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'.5px'}}>{label}</label><input className="input-field" type="number" min="0" value={form[key]} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))} placeholder={ph}/></div>
              ))}
              <div><label style={{fontSize:10,color:'var(--text3)',display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'.5px'}}>{t('barcode')}</label><div style={{display:'flex',gap:6}}><input className="input-field" value={form.barcode} onChange={e=>setForm(f=>({...f,barcode:e.target.value}))} placeholder="BC-..."/><button onClick={()=>setForm(f=>({...f,barcode:genBarcode()}))} style={{padding:'9px 10px',borderRadius:8,border:'1px solid var(--border2)',background:'var(--bg3)',color:'var(--text2)',cursor:'pointer',fontSize:11}}>Gen</button></div></div>
            </div>
            {form.price&&form.costPrice&&<div style={{marginTop:12,padding:10,background:'rgba(74,222,128,0.06)',border:'1px solid rgba(74,222,128,0.2)',borderRadius:8,fontSize:12,color:'var(--green)'}}>💰 Profit: {(((parseFloat(form.price)-parseFloat(form.costPrice))/parseFloat(form.price))*100).toFixed(1)}%</div>}
            <div style={{display:'flex',gap:10,marginTop:20,justifyContent:'flex-end'}}><button onClick={()=>setModal(null)} className="btn-secondary">{t('cancel')}</button><button onClick={handleSave} className="btn-primary">{t('save')}</button></div>
          </div>
        </div>
      )}
      {modal==='restock'&&(
        <div style={{position:'fixed',inset:0,zIndex:50,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.9)'}} onClick={e=>e.target===e.currentTarget&&setModal(null)}>
          <div className="card animate-scale-in" style={{width:340,padding:28}}>
            <div style={{fontSize:15,fontWeight:700,marginBottom:8}}>📦 {t('add_stock')}</div>
            <div style={{fontSize:13,color:'var(--text2)',marginBottom:16}}>{selected?.name}</div>
            <div style={{fontSize:11,color:'var(--text3)',marginBottom:6}}>Current stock: <strong style={{color:'var(--text)'}}>{selected?.stock}</strong></div>
            <input className="input-field" type="number" min="1" value={restockQty} onChange={e=>setRestockQty(e.target.value)} placeholder={t('qty_to_add')} onKeyDown={e=>e.key==='Enter'&&handleRestock()}/>
            {restockQty&&parseInt(restockQty)>0&&<div style={{marginTop:8,fontSize:12,color:'var(--green)'}}>New stock: {selected.stock+parseInt(restockQty)}</div>}
            <div style={{display:'flex',gap:10,marginTop:20}}><button onClick={()=>setModal(null)} className="btn-secondary" style={{flex:1}}>{t('cancel')}</button><button onClick={handleRestock} className="btn-primary" style={{flex:1}}>{t('restock')}</button></div>
          </div>
        </div>
      )}
    </div>
  )
}
