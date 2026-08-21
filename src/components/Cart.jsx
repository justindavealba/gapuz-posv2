import { useRef, useState } from 'react'
import { useReactToPrint } from 'react-to-print'
import { useCartStore, useAuthStore, useTransactionStore, useProductStore, useCustomerStore } from '../store'
import { peso, fmtTxnId, useT, useBreakpoint } from '../utils/helpers'
import { useToast } from '../utils/toast'
import Receipt from './Receipt'

const PAY = [{id:'Cash',label:'💵 Cash'},{id:'GCash',label:'📱 GCash'},{id:'Card',label:'💳 Card'}]

export default function Cart({ products, customers, onHold }) {
  const { items, discount, payMethod, customerId, splitMode, split1Pay, split2Pay, split1Amt,
          removeItem, setQty, clearCart, setDiscount, setPayMethod, setCustomer,
          setSplitMode, setSplit1Pay, setSplit2Pay, setSplit1Amt, getTotals } = useCartStore()
  const { user, role } = useAuthStore()
  const addTransaction = useTransactionStore(s=>s.addTransaction)
  const deductStock    = useProductStore(s=>s.deductStock)
  const addPoints      = useCustomerStore(s=>s.addPoints)
  const toast = useToast()
  const t     = useT()
  const { isMobile } = useBreakpoint()

  const [cashGiven,   setCashGiven]   = useState('')
  const [showReceipt, setShowReceipt] = useState(false)
  const [lastTxn,     setLastTxn]     = useState(null)
  const [emailReceipt, setEmailReceipt] = useState(false)
  const [customerEmail, setCustomerEmail] = useState('')
  const receiptRef = useRef()
  const handlePrint = useReactToPrint({content:()=>receiptRef.current})

  const { subtotal, discAmt, vat, total, totalInt } = getTotals()
  const change = cashGiven ? parseFloat(cashGiven)-totalInt : 0
  const totalItems = items.reduce((s,i)=>s+i.qty,0)
  const cust = customers.find(c=>c.id===customerId)

  const [checkingOut, setCheckingOut] = useState(false)

  const checkout = async () => {
    if(!items.length || checkingOut) return
    if(!splitMode&&payMethod==='Cash'&&cashGiven&&parseFloat(cashGiven)<totalInt){toast('Cash given is less than total!','error');return}
    setCheckingOut(true)
    const payDesc = splitMode?`${split1Pay}+${split2Pay}`:payMethod
    const txn = await addTransaction({
      customerName: cust?cust.name:'Walk-in',
      customerId:   customerId||null,
      payment:      payDesc,
      subtotal, discAmt, vat, total:totalInt,
      cashGiven:    payMethod==='Cash'?parseFloat(cashGiven)||totalInt:0,
      status:       'Completed',
      cashierName:  user?.user_metadata?.name||'Cashier',
      items:        [...items],
    })
    setCheckingOut(false)
    if(!txn) { toast('Checkout failed — please try again','error'); return }
    deductStock(items)
    if(cust) addPoints(cust.id, totalInt)
    setLastTxn({...txn})
    setShowReceipt(true)
    toast(`${t('payment_success')} ${fmtTxnId(txn.id)} — ${peso(totalInt)}`,'success')
  }

  const closeReceipt = () => { setShowReceipt(false); clearCart(); setCashGiven(''); setSplitMode(false); setSplit1Amt(''); setEmailReceipt(false); setCustomerEmail('') }

  const sendEmailReceipt = () => {
    if(!customerEmail) return
    toast(`Receipt will be sent to ${customerEmail} (email sending not wired up yet)`,'info')
  }
  const border = '1px solid var(--border)'

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',background:'var(--bg2)',borderLeft:isMobile?'none':border,borderTop:isMobile?border:'none'}}>
      {/* Header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 16px',borderBottom:border,flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontSize:15,fontWeight:700}}>{t('cart')}</span>
          {totalItems>0&&<span style={{background:'var(--accent)',color:'#0a0a0a',fontSize:10,fontWeight:700,padding:'1px 7px',borderRadius:99,fontFamily:"'JetBrains Mono',monospace"}}>{totalItems}</span>}
        </div>
        <div style={{display:'flex',gap:6}}>
          {onHold&&items.length>0&&<button onClick={onHold} style={{padding:'4px 10px',borderRadius:7,border:'1px solid var(--border2)',background:'var(--bg3)',color:'var(--text2)',cursor:'pointer',fontSize:11,fontWeight:600}}>⏸ Hold</button>}
          {items.length>0&&<button onClick={clearCart} style={{padding:'4px 10px',borderRadius:7,border:'1px solid rgba(239,68,68,0.25)',background:'rgba(239,68,68,0.08)',color:'var(--red)',cursor:'pointer',fontSize:11,fontWeight:600}}>{t('clear')}</button>}
        </div>
      </div>

      {/* Items */}
      <div style={{flex:1,overflowY:'auto',padding:10}}>
        {items.length===0
          ? <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',color:'var(--text3)',gap:8}}><span style={{fontSize:40,opacity:.2}}>🛒</span><span>{t('empty_cart')}</span><span style={{fontSize:11}}>{t('click_to_add')}</span></div>
          : items.map(item=>{
            const prod = products.find(p=>p.id===item.id)
            return (
              <div key={item.id} style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:10,padding:'10px 12px',marginBottom:6}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8,marginBottom:8}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,fontSize:12,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                      <div style={{width:24,height:24,borderRadius:6,background:'var(--bg4)',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',flexShrink:0,border:'1px solid var(--border)'}}>
                        {item.image && (item.image.startsWith('data:') || item.image.startsWith('http')) ? (
                          <img src={item.image} style={{width:'100%',height:'100%',objectFit:'cover'}} alt=""/>
                        ) : (
                          <span style={{fontSize:12}}>{item.image || '📦'}</span>
                        )}
                      </div>
                      <span style={{overflow:'hidden',textOverflow:'ellipsis'}}>{item.name}</span>
                    </div>
                    <div style={{fontSize:10,color:'var(--text3)',fontFamily:"'JetBrains Mono',monospace",marginTop:2}}>{peso(item.price)} each</div>
                  </div>
                  <button onClick={()=>removeItem(item.id)} style={{background:'none',border:'none',color:'var(--text3)',cursor:'pointer',fontSize:18,lineHeight:1}} onMouseEnter={e=>e.target.style.color='var(--red)'} onMouseLeave={e=>e.target.style.color='var(--text3)'}>×</button>
                </div>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    {[[-1,'−'],[1,'+']].map(([d,lbl],i)=>(
                      <button key={i} onClick={()=>setQty(item.id,item.qty+d,prod?.stock||99)} style={{width:26,height:26,borderRadius:7,border:'1px solid var(--border2)',background:'var(--bg4)',color:'var(--text2)',cursor:'pointer',fontSize:14,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',transition:'all .12s'}} onMouseEnter={e=>{e.currentTarget.style.background='var(--accent)';e.currentTarget.style.color='#0a0a0a';e.currentTarget.style.borderColor='var(--accent)'}} onMouseLeave={e=>{e.currentTarget.style.background='var(--bg4)';e.currentTarget.style.color='var(--text2)';e.currentTarget.style.borderColor='var(--border2)'}}>{lbl}</button>
                    )).reduce((acc,el,i)=>i===0?[el,<span key="n" style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:700,minWidth:22,textAlign:'center'}}>{item.qty}</span>,...acc]:[...acc,el],[])}
                  </div>
                  <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:700,color:'var(--accent)'}}>{peso(item.price*item.qty)}</span>
                </div>
              </div>
            )
          })
        }
      </div>

      {/* Customer */}
      <div style={{padding:'8px 12px',borderTop:border,flexShrink:0}}>
        <select className="select-field" style={{fontSize:12}} value={customerId||''} onChange={e=>setCustomer(e.target.value?parseInt(e.target.value):null)}>
          <option value="">{t('walk_in')}</option>
          {customers.map(c=><option key={c.id} value={c.id}>{c.name} (⭐ {c.points} pts)</option>)}
        </select>
      </div>

      {/* Totals & payment */}
      <div style={{padding:'10px 14px 14px',borderTop:border,flexShrink:0,display:'flex',flexDirection:'column',gap:8}}>
        {/* Discount */}
        <div style={{display:'flex',gap:6}}>
          <input type="number" min="0" className="input-field" style={{fontSize:12,padding:'7px 10px'}} placeholder={t('discount')} value={discount.value||''} onChange={e=>setDiscount(parseFloat(e.target.value)||0,discount.type)}/>
          <select className="select-field" style={{width:64,fontSize:12,padding:'7px 8px'}} value={discount.type} onChange={e=>setDiscount(discount.value,e.target.value)}>
            <option value="pct">%</option>
            <option value="fixed">₱</option>
          </select>
        </div>

        {/* Summary */}
        <div style={{fontSize:12,display:'flex',flexDirection:'column',gap:4}}>
          <div style={{display:'flex',justifyContent:'space-between',color:'var(--text2)'}}><span>{t('subtotal')}</span><span style={{fontFamily:"'JetBrains Mono',monospace"}}>{peso(subtotal)}</span></div>
          {discAmt>0&&<div style={{display:'flex',justifyContent:'space-between',color:'var(--red)'}}><span>{t('discount')}</span><span style={{fontFamily:"'JetBrains Mono',monospace"}}>-{peso(discAmt)}</span></div>}
          <div style={{display:'flex',justifyContent:'space-between',color:'var(--text2)'}}><span>{t('vat')}</span><span style={{fontFamily:"'JetBrains Mono',monospace"}}>{peso(vat)}</span></div>
          <div style={{display:'flex',justifyContent:'space-between',fontWeight:700,fontSize:16,borderTop:'1px solid var(--border)',paddingTop:7,marginTop:3}}>
            <span>{t('total')}</span>
            <span style={{fontFamily:"'JetBrains Mono',monospace",color:'var(--accent)'}}>{peso(totalInt)}</span>
          </div>
        </div>

        {/* Split toggle */}
        <button onClick={()=>setSplitMode(!splitMode)} style={{padding:6,borderRadius:8,border:'1px solid',fontSize:11,fontWeight:600,cursor:'pointer',transition:'all .15s',...(splitMode?{borderColor:'var(--accent)',background:'rgba(52,211,153,0.08)',color:'var(--accent)'}:{borderColor:'var(--border)',background:'transparent',color:'var(--text3)'})}}>
          ⚡ {t('split_payment')} {splitMode?'(ON)':''}
        </button>

        {/* Payment methods */}
        {splitMode
          ? <div style={{display:'flex',flexDirection:'column',gap:5}}>
              <div style={{display:'flex',gap:5}}>
                <select className="select-field" style={{width:90,fontSize:11,padding:'6px 8px'}} value={split1Pay} onChange={e=>setSplit1Pay(e.target.value)}>{['Cash','GCash','Card'].map(m=><option key={m}>{m}</option>)}</select>
                <input type="number" className="input-field" style={{fontSize:12,padding:'6px 10px',fontFamily:"'JetBrains Mono',monospace"}} placeholder="Amount (₱)" value={split1Amt} onChange={e=>setSplit1Amt(e.target.value)}/>
              </div>
              <div style={{display:'flex',gap:5}}>
                <select className="select-field" style={{width:90,fontSize:11,padding:'6px 8px'}} value={split2Pay} onChange={e=>setSplit2Pay(e.target.value)}>{['GCash','Cash','Card'].map(m=><option key={m}>{m}</option>)}</select>
                <div className="input-field" style={{fontSize:12,padding:'6px 10px',fontFamily:"'JetBrains Mono',monospace",color:'var(--text2)',display:'flex',alignItems:'center'}}>{peso(Math.max(0,totalInt-(parseFloat(split1Amt)||0)))}</div>
              </div>
            </div>
          : <>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:5}}>
                {PAY.map(m=>(
                  <button key={m.id} onClick={()=>setPayMethod(m.id)} style={{padding:'8px 4px',borderRadius:9,border:'1px solid',fontSize:11,fontWeight:600,cursor:'pointer',transition:'all .15s',fontFamily:'inherit',...(payMethod===m.id?{borderColor:'var(--accent)',background:'rgba(52,211,153,0.08)',color:'var(--accent)'}:{borderColor:'var(--border)',background:'transparent',color:'var(--text2)'})}}>{m.label}</button>
                ))}
              </div>
              {payMethod==='Cash'&&(
                <div style={{display:'flex',gap:6,alignItems:'center'}}>
                  <input type="number" className="input-field" style={{fontSize:12,padding:'7px 10px',fontFamily:"'JetBrains Mono',monospace"}} placeholder={t('cash_given')} value={cashGiven} onChange={e=>setCashGiven(e.target.value)}/>
                  {cashGiven&&change>=0&&<span style={{fontSize:11,fontFamily:"'JetBrains Mono',monospace",color:'var(--green)',whiteSpace:'nowrap',fontWeight:600}}>+{peso(change)}</span>}
                </div>
              )}
            </>
        }

        {/* Checkout */}
        <button onClick={checkout} disabled={items.length===0||checkingOut} style={{width:'100%',padding:12,borderRadius:10,border:'none',background:items.length===0?'var(--bg4)':'var(--accent)',color:items.length===0?'var(--text3)':'#0a0a0a',fontWeight:800,fontSize:14,cursor:items.length===0||checkingOut?'not-allowed':'pointer',fontFamily:'inherit',transition:'all .18s',opacity:checkingOut?0.6:1}}>
          {checkingOut ? 'Processing…' : `${t('checkout')} — ${peso(totalInt)}`}
        </button>
      </div>

      {/* Receipt Modal */}
      {showReceipt&&(
        <div style={{position:'fixed',inset:0,zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.9)'}}>
          <div className="card animate-scale-in" style={{padding:24,width:'min(360px,92vw)',maxHeight:'90vh',overflowY:'auto'}}>
            <div style={{textAlign:'center',fontWeight:700,fontSize:16,marginBottom:16,color:'var(--green)'}}>✅ {t('payment_success')}</div>
            <Receipt ref={receiptRef} txn={lastTxn} role={role}/>

            {/* Email receipt option */}
            <div style={{marginTop:16,padding:'10px 12px',borderRadius:10,border:'1px solid var(--border)',background:'var(--bg3)'}}>
              <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:12.5,fontWeight:600,color:'var(--text)'}}>
                <input type="checkbox" checked={emailReceipt} onChange={e=>setEmailReceipt(e.target.checked)} style={{width:15,height:15,accentColor:'var(--accent)',cursor:'pointer'}}/>
                📧 Email this receipt to the customer
              </label>
              {emailReceipt&&(
                <div style={{display:'flex',gap:6,marginTop:10}}>
                  <input type="email" className="input-field" style={{fontSize:12,padding:'8px 10px'}} placeholder="customer@gmail.com" value={customerEmail} onChange={e=>setCustomerEmail(e.target.value)}/>
                  <button onClick={sendEmailReceipt} disabled={!customerEmail} className="btn-secondary" style={{padding:'8px 14px',fontSize:12,opacity:customerEmail?1:.5,cursor:customerEmail?'pointer':'not-allowed'}}>Send</button>
                </div>
              )}
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginTop:10}}>
              <button onClick={closeReceipt} className="btn-secondary" style={{padding:10}}>{t('close')}</button>
              <button onClick={handlePrint} className="btn-primary" style={{padding:10}}>🖨 {t('print')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
