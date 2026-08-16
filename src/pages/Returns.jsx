import { useState, useMemo } from 'react'
import { useTransactionStore, useAuthStore, useProductStore, useAppStore } from '../store'
import { useReturnStore } from '../store/useReturnStore'
import { useToast } from '../utils/toast'
import { useT, REFUND_REASONS, peso, fmtDate, fmtDateTime } from '../utils/helpers'

const RETURN_METHODS = ['Cash', 'GCash', 'Store Credit']

const STEPS = [
  { num: 1, label: 'Look up transaction' },
  { num: 2, label: 'Select items' },
  { num: 3, label: 'Return details' },
  { num: 4, label: 'Confirm & submit' },
]

const StatusBadge = ({ status, isLight }) => {
  const styles = isLight ? {
    Pending:  { bg: '#fef3c7', color: '#92400e', border: '#fde68a' },
    Approved: { bg: '#d1fae5', color: '#047857', border: '#a7f3d0' },
    Rejected: { bg: '#fee2e2', color: '#991b1b', border: '#fecaca' },
  } : {
    Pending:  { bg: 'rgba(234,179,8,0.10)',  color: '#eab308', border: 'rgba(234,179,8,0.25)'  },
    Approved: { bg: 'rgba(52,211,153,0.10)',  color: '#34d399', border: 'rgba(52,211,153,0.25)'  },
    Rejected: { bg: 'rgba(239,68,68,0.10)', color: '#ef4444', border: 'rgba(239,68,68,0.25)' },
  }

  const s = styles[status] || styles.Pending
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 99,
      fontSize: 10, fontWeight: 700, letterSpacing: '.4px', textTransform: 'uppercase',
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
    }}>
      {status === 'Approved' ? '✓' : status === 'Rejected' ? '✗' : '●'} {status}
    </span>
  )
}

export default function Returns() {
  const t                  = useT()
  const toast              = useToast()
  const { role }           = useAuthStore()
  const { theme }          = useAppStore()
  const { transactions }   = useTransactionStore()
  const { products, restockProduct } = useProductStore()
  const { returns, addReturn, approveReturn, rejectReturn } = useReturnStore()

  const isAdmin = role === 'admin'
  const isLight = theme === 'light'

  // ── Wizard state ─────────────────────────────────────────
  const [step,          setStep]         = useState(1)
  const [searchId,      setSearchId]     = useState('')
  const [selectedTxn,   setSelectedTxn]  = useState(null)
  const [returnItems,   setReturnItems]  = useState({})
  const [filterStatus,  setFilterStatus] = useState('All')
  const [details, setDetails] = useState({
    reason: REFUND_REASONS[0],
    method: 'Cash',
    notes: '',
  })

  // ── Stats ─────────────────────────────────────────────────
  const stats = useMemo(() => {
    const pending      = returns.filter(r => r.status === 'Pending').length
    const approved     = returns.filter(r => r.status === 'Approved').length
    const rejected     = returns.filter(r => r.status === 'Rejected').length
    const totalRefunded = returns
      .filter(r => r.status === 'Approved')
      .reduce((s, r) => s + r.total, 0)
    return [
      { label: 'Total Returns',    value: returns.length, color: isLight ? '#2563eb' : 'var(--blue)',   icon: '📋' },
      { label: 'Pending',          value: pending,        color: isLight ? '#d97706' : 'var(--yellow)', icon: '🕒' },
      { label: 'Approved',         value: approved,       color: isLight ? '#059669' : 'var(--accent)', icon: '✅' },
      { label: 'Total Refunded',   value: peso(totalRefunded), color: isLight ? '#dc2626' : 'var(--red)', icon: '🔄' },
    ]
  }, [returns, isLight])

  // ── Filtered returns table ────────────────────────────────
  const filteredReturns = useMemo(() =>
    returns.filter(r => filterStatus === 'All' || r.status === filterStatus),
    [returns, filterStatus]
  )

  // ── Totals calculation ────────────────────────────────────
  const calcTotals = () => {
    if (!selectedTxn) return { subtotal: 0, vat: 0, total: 0 }
    const subtotal = selectedTxn.items.reduce((sum, item) => {
      const ri = returnItems[item.id]
      return ri?.selected ? sum + item.price * ri.qty : sum
    }, 0)
    const vat   = subtotal * 0.12
    const total = subtotal + vat
    return { subtotal, vat, total: Math.round(total) }
  }

  const selectedCount = Object.values(returnItems).filter(r => r.selected).length

  // ── Handlers ─────────────────────────────────────────────
  const handleLookup = () => {
    if (!searchId.trim()) return toast('Enter a transaction ID', 'error')
    const query = searchId.trim().replace('#', '')
    const txn = transactions.find(tx =>
      String(tx.id) === query ||
      String(tx.id).padStart(4, '0') === query.padStart(4, '0')
    )
    if (!txn) return toast(t('txn_not_found'), 'error')

    // Check if already returned
    const alreadyReturned = returns.find(r => String(r.txnId) === String(txn.id) && r.status === 'Approved')
    if (alreadyReturned) return toast('This transaction has already been returned', 'warning')

    setSelectedTxn(txn)
    const init = {}
    txn.items.forEach(item => { init[item.id] = { selected: false, qty: 1 } })
    setReturnItems(init)
    setStep(2)
  }

  const toggleItem = (itemId) => {
    setReturnItems(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], selected: !prev[itemId]?.selected }
    }))
  }

  const setItemQty = (itemId, qty, max) => {
    setReturnItems(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], qty: Math.max(1, Math.min(qty, max)) }
    }))
  }

  const goToStep3 = () => {
    if (selectedCount === 0) return toast('Select at least one item to return', 'error')
    setStep(3)
  }

  const goToStep4 = () => {
    if (!details.reason) return toast('Please select a reason', 'error')
    setStep(4)
  }

  const handleSubmit = () => {
    const { subtotal, vat, total } = calcTotals()
    const selectedList = selectedTxn.items
      .filter(item => returnItems[item.id]?.selected)
      .map(item => ({ ...item, returnQty: returnItems[item.id].qty }))

    addReturn({
      txnId:        selectedTxn.id,
      customerName: selectedTxn.customerName || 'Walk-in',
      items:        selectedList,
      reason:       details.reason,
      method:       details.method,
      notes:        details.notes,
      subtotal, vat, total,
    })

    toast(t('refund_processed'), 'success')
    resetWizard()
  }

  const handleApprove = (r) => {
    approveReturn(r.id)
    // Restock items
    if (r.items?.length) {
      r.items.forEach(item => {
        const prod = products.find(p => p.id === item.id)
        if (prod) restockProduct(prod.id, item.returnQty || item.qty || 1)
      })
    }
    toast('Return approved — items restocked ✓', 'success')
  }

  const handleReject = (r) => {
    rejectReturn(r.id)
    toast('Return rejected', 'info')
  }

  const resetWizard = () => {
    setStep(1); setSearchId(''); setSelectedTxn(null)
    setReturnItems({}); setDetails({ reason: REFUND_REASONS[0], method: 'Cash', notes: '' })
  }

  // ── Shared styles ─────────────────────────────────────────
  const card = { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 6 }
  const { subtotal, vat, total } = calcTotals()

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── HEADER ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', letterSpacing: '-.3px' }}>
            🔄 Returns
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3 }}>
            Manage product returns · Admin approval required
          </div>
        </div>
      </div>

      {/* ── STATS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 12, flexShrink: 0 }}>
        {stats.map(s => (
          <div key={s.label} style={{ ...card, padding: 18, borderTop: `2px solid ${s.color}`, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 15, right: 15, fontSize: 24, opacity: 0.1, color: s.color }}>
              {s.icon}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── MAIN GRID ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 16, flexShrink: 0 }}>

        {/* LEFT: Wizard */}
        <div style={{ ...card, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Step indicator */}
          <div style={{ display: 'flex', gap: 6 }}>
            {STEPS.map(s => (
              <div key={s.num} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700,
                  background: step === s.num ? (isLight ? '#059669' : 'var(--accent)') : step > s.num ? (isLight ? '#d1fae5' : 'rgba(52,211,153,0.15)') : 'var(--bg3)',
                  color: step === s.num ? (isLight ? '#fff' : '#0a0a0a') : step > s.num ? (isLight ? '#047857' : 'var(--accent)') : 'var(--text3)',
                  border: step > s.num ? (isLight ? '1px solid #6ee7b7' : '1px solid rgba(52,211,153,0.3)') : '1px solid var(--border2)',
                  transition: 'all .2s',
                }}>
                  {step > s.num ? '✓' : s.num}
                </div>
                <div style={{ fontSize: 8, color: step >= s.num ? 'var(--text2)' : 'var(--text3)', textAlign: 'center', letterSpacing: '.2px' }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div style={{ height: 2, background: 'var(--bg3)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: isLight ? '#059669' : 'var(--accent)', borderRadius: 99, width: `${((step - 1) / 3) * 100}%`, transition: 'width .3s' }}/>
          </div>

          {/* ── STEP 1: Lookup ── */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Look up Transaction</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 14, lineHeight: 1.6 }}>
                  Enter the Transaction ID from the original sale receipt.
                </div>
                <label style={{ fontSize: 10, color: 'var(--text3)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.5px' }}>
                  {t('orig_txn')} #
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--text3)' }}>🔍</span>
                  <input
                    className="input-field"
                    style={{ paddingLeft: 34 }}
                    placeholder="e.g. 0021"
                    value={searchId}
                    onChange={e => setSearchId(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLookup()}
                  />
                </div>
              </div>
              <button onClick={handleLookup} className="btn-primary" style={{ width: '100%', padding: 12 }}>
                {t('look_up')} →
              </button>

              {/* Recent transactions hint */}
              {transactions.length > 0 && (
                <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: 12, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 9.5, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8, fontWeight: 700 }}>Recent Transactions</div>
                  {transactions.slice(0, 4).map(tx => (
                    <div key={tx.id} onClick={() => { setSearchId(String(tx.id).padStart(4, '0')); }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '.7'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10.5, color: isLight ? '#059669' : 'var(--accent)' }}>#{String(tx.id).padStart(4, '0')}</span>
                      <span style={{ fontSize: 10.5, color: 'var(--text2)' }}>{tx.customerName || 'Walk-in'}</span>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10.5, color: 'var(--green)' }}>{peso(tx.total)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── STEP 2: Select Items ── */}
          {step === 2 && selectedTxn && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* TXN info */}
              <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: 12, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: isLight ? '#059669' : 'var(--accent)', fontWeight: 700 }}>
                    #{String(selectedTxn.id).padStart(4, '0')}
                  </span>
                  <span style={{ fontSize: 10.5, color: 'var(--text3)' }}>{fmtDate(selectedTxn.createdAt)}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text2)' }}>
                  {selectedTxn.customerName || 'Walk-in'} · {peso(selectedTxn.total)}
                </div>
              </div>

              <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 2 }}>Select items to return:</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
                {selectedTxn.items.map(item => {
                  const ri = returnItems[item.id]
                  const isSelected = ri?.selected
                  return (
                    <div key={item.id} onClick={() => toggleItem(item.id)} style={{
                      background: isSelected ? (isLight ? '#ecfdf5' : 'rgba(52,211,153,0.05)') : 'var(--bg3)',
                      border: `1px solid ${isSelected ? (isLight ? '#6ee7b7' : 'rgba(52,211,153,0.3)') : 'var(--border)'}`,
                      borderRadius: 10, padding: '10px 12px', cursor: 'pointer',
                      transition: 'all .15s',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {/* Checkbox */}
                        <div style={{
                          width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                          border: `2px solid ${isSelected ? (isLight ? '#059669' : 'var(--accent)') : 'var(--border2)'}`,
                          background: isSelected ? (isLight ? '#059669' : 'var(--accent)') : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all .15s',
                        }}>
                          {isSelected && <span style={{ fontSize: 10, color: '#0a0a0a', fontWeight: 700 }}>✓</span>}
                        </div>
                        <div style={{ width: 36, height: 36, borderRadius: 6, overflow: 'hidden', background: 'var(--bg4)', flexShrink: 0, border: '1px solid var(--border)' }}>
                          {item.image && (item.image.startsWith('data:') || item.image.startsWith('http')) ? (
                            <img src={item.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, opacity: 0.5 }}>{item.image || '📦'}</div>
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{item.name}</div>
                          <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1 }}>
                            {peso(item.price)} × {item.qty} = {peso(item.price * item.qty)}
                          </div>
                        </div>
                        {/* Qty selector */}
                        {isSelected && (
                          <div onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <button onClick={() => setItemQty(item.id, ri.qty - 1, item.qty)} style={{ width: 22, height: 22, borderRadius: 5, border: '1px solid var(--border2)', background: 'var(--bg4)', color: 'var(--text2)', cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, minWidth: 20, textAlign: 'center', fontWeight: 700 }}>{ri.qty}</span>
                            <button onClick={() => setItemQty(item.id, ri.qty + 1, item.qty)} style={{ width: 22, height: 22, borderRadius: 5, border: '1px solid var(--border2)', background: 'var(--bg4)', color: 'var(--text2)', cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button onClick={resetWizard} className="btn-secondary" style={{ flex: 1, padding: 10 }}>← Back</button>
                <button onClick={goToStep3} className="btn-primary" style={{ flex: 2, padding: 10 }}>
                  Next ({selectedCount} item{selectedCount !== 1 ? 's' : ''}) →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Details ── */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 10, color: 'var(--text3)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.5px' }}>
                  {t('reason')} *
                </label>
                <select className="select-field" style={{ width: '100%' }}
                  value={details.reason} onChange={e => setDetails(d => ({ ...d, reason: e.target.value }))}>
                  {REFUND_REASONS.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 10, color: 'var(--text3)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.5px' }}>
                  {t('refund_method')}
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(90px,1fr))', gap: 6 }}>
                  {RETURN_METHODS.map(m => (
                    <button key={m} onClick={() => setDetails(d => ({ ...d, method: m }))} style={{
                      padding: '8px 4px', borderRadius: 8, border: '1px solid', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                      ...(details.method === m
                        ? { borderColor: isLight ? '#059669' : 'var(--accent)', background: isLight ? 'rgba(4,120,87,0.08)' : 'rgba(52,211,153,0.08)', color: isLight ? '#047857' : 'var(--accent)' }
                        : { borderColor: 'var(--border)', background: 'transparent', color: 'var(--text2)' })
                    }}>
                      {m === 'Cash' ? '💵' : m === 'GCash' ? '📱' : '🏷️'} {m}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 10, color: 'var(--text3)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.5px' }}>
                  {t('notes')} (optional)
                </label>
                <textarea className="input-field" rows={3} style={{ resize: 'none' }}
                  placeholder="Additional notes about this return..."
                  value={details.notes} onChange={e => setDetails(d => ({ ...d, notes: e.target.value }))}/>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setStep(2)} className="btn-secondary" style={{ flex: 1, padding: 10 }}>← Back</button>
                <button onClick={goToStep4} className="btn-primary" style={{ flex: 2, padding: 10 }}>Review →</button>
              </div>
            </div>
          )}

          {/* ── STEP 4: Confirm ── */}
          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Items summary */}
              <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: 12, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8, fontWeight: 700 }}>Items to return</div>
                {selectedTxn.items.filter(i => returnItems[i.id]?.selected).map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--text2)', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 20, height: 20, borderRadius: 4, overflow: 'hidden', background: 'var(--bg4)' }}>
                        {item.image && (item.image.startsWith('data:') || item.image.startsWith('http')) ? (
                          <img src={item.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: 10 }}>{item.image || '📦'}</span>
                        )}
                      </div>
                      <span>{item.name} ×{returnItems[item.id].qty}</span>
                    </div>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", color: 'var(--text)' }}>{peso(item.price * returnItems[item.id].qty)}</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div style={{ background: isLight ? '#f9fafb' : 'rgba(52,211,153,0.04)', border: isLight ? '1px solid #e5e7eb' : '1px solid rgba(52,211,153,0.15)', borderRadius: 10, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text2)', marginBottom: 5 }}>
                  <span>Subtotal</span><span style={{ fontFamily: "'JetBrains Mono',monospace" }}>{peso(subtotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text2)', marginBottom: 8 }}>
                  <span>VAT (12%)</span><span style={{ fontFamily: "'JetBrains Mono',monospace" }}>{peso(vat)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 17, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                  <span>Return Total</span>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", color: isLight ? '#059669' : 'var(--accent)' }}>{peso(total)}</span>
                </div>
              </div>

              {/* Details summary */}
              <div style={{ fontSize: 11, color: 'var(--text2)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text3)' }}>Reason</span><span>{details.reason}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text3)' }}>Method</span><span>{details.method}</span>
                </div>
              </div>

              {/* Cashier note */}
              {!isAdmin && (
                <div style={{ background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.2)', borderRadius: 8, padding: 10, fontSize: 11, color: 'var(--yellow)', lineHeight: 1.6 }}>
                  ⚠️ Return will be submitted as <strong>Pending</strong>. Admin must approve before items are restocked.
                </div>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setStep(3)} className="btn-secondary" style={{ flex: 1, padding: 10 }}>← Back</button>
                <button onClick={handleSubmit} className="btn-primary" style={{ flex: 2, padding: 12, fontSize: 13 }}>
                  🔄 Submit Return
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Returns history table */}
        <div style={{ ...card, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Table header */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>📋 Return History</div>
            {/* Status filter pills */}
            <div style={{ display: 'flex', gap: 6 }}>
              {['All', 'Pending', 'Approved', 'Rejected'].map(s => (
                <button key={s} onClick={() => setFilterStatus(s)} style={{
                  padding: '4px 12px', borderRadius: 99, border: '1px solid', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
                  ...(filterStatus === s
                    ? { background: isLight ? '#059669' : 'var(--accent)', borderColor: isLight ? '#059669' : 'var(--accent)', color: isLight ? '#fff' : '#0a0a0a' }
                    : { background: 'transparent', borderColor: 'var(--border)', color: 'var(--text2)' })
                }}>{s}</button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg3)' }}>
                  {['Return #', 'TXN #', 'Date', 'Customer', 'Reason', 'Method', 'Total', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--text3)', letterSpacing: '.7px', textTransform: 'uppercase', whiteSpace: 'nowrap', borderBottom: '1px solid var(--border)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredReturns.length === 0 ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text3)' }}>
                    <div style={{ fontSize: 36, opacity: .2, marginBottom: 8 }}>🔄</div>
                    No returns found
                  </td></tr>
                ) : filteredReturns.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background .1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '11px 14px', fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: isLight ? '#059669' : 'var(--accent)', fontWeight: 700 }}>{r.id}</td>
                    <td style={{ padding: '11px 14px', fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>#{String(r.txnId).padStart(4, '0')}</td>
                    <td style={{ padding: '11px 14px', fontSize: 11, color: 'var(--text3)', whiteSpace: 'nowrap' }}>{fmtDate(r.date)}</td>
                    <td style={{ padding: '11px 14px', fontSize: 12 }}>{r.customerName}</td>
                    <td style={{ padding: '11px 14px', fontSize: 11, color: 'var(--text2)', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.reason}</td>
                    <td style={{ padding: '11px 14px' }}>
                      <span style={{ fontSize: 11, color: 'var(--text2)' }}>
                        {r.method === 'Cash' ? '💵' : r.method === 'GCash' ? '📱' : '🏷️'} {r.method}
                      </span>
                    </td>
                    <td style={{ padding: '11px 14px', fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: 'var(--red)', fontWeight: 700 }}>{peso(r.total)}</td>
                    <td style={{ padding: '11px 14px' }}><StatusBadge status={r.status} isLight={isLight}/></td>
                    <td style={{ padding: '11px 14px' }}>
                      {r.status === 'Pending' && isAdmin ? (
                        <div style={{ display: 'flex', gap: 5 }}>
                          <button onClick={() => handleApprove(r)} style={{ padding: '5px 10px', borderRadius: 7, border: isLight ? '1px solid #6ee7b7' : '1px solid rgba(52,211,153,0.3)', background: isLight ? 'rgba(4,120,87,0.08)' : 'rgba(52,211,153,0.08)', color: isLight ? '#047857' : 'var(--accent)', cursor: 'pointer', fontSize: 11, fontWeight: 700, transition: 'all .15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = isLight ? 'rgba(4,120,87,0.18)' : 'rgba(52,211,153,0.18)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(52,211,153,0.08)'}>
                            ✓ {t('approve')}
                          </button>
                          <button onClick={() => handleReject(r)} style={{ padding: '5px 10px', borderRadius: 7, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: 'var(--red)', cursor: 'pointer', fontSize: 11, fontWeight: 700, transition: 'all .15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.18)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}>
                            ✗ {t('reject')}
                          </button>
                        </div>
                      ) : r.status === 'Pending' && !isAdmin ? (
                        <span style={{ fontSize: 10, color: 'var(--yellow)' }}>Awaiting admin</span>
                      ) : (
                        <span style={{ fontSize: 11, color: 'var(--text3)' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer note */}
          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <span style={{ fontSize: 14 }}>⚠️</span>
            <span style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.6 }}>
              Items are automatically <span style={{ color: isLight ? '#059669' : 'var(--accent)', fontWeight: 600 }}>restocked</span> to inventory only after an Admin approves the return.
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
