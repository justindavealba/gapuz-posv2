import { useState, useMemo } from 'react'
import { useRefundStore, useTransactionStore, useAuthStore, useProductStore, useAppStore } from '../store'
import { useToast } from '../utils/toast'
import { useT, peso, fmtDate, fmtDateTime, REFUND_REASONS } from '../utils/helpers'

const REFUND_METHODS = ['Cash', 'GCash', 'Store Credit']

const STEPS = [
  { num: 1, label: 'Look up transaction' },
  { num: 2, label: 'Select items' },
  { num: 3, label: 'Refund details' },
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

export default function Refunds() {
  const t = useT()
  const toast = useToast()
  const { role, user } = useAuthStore()
  const { theme } = useAppStore()
  const { transactions } = useTransactionStore()
  const { products, restockProduct } = useProductStore()
  const { refunds, addRefund, updateRefund } = useRefundStore()

  const isAdmin = role === 'admin'
  const [showPolicy, setShowPolicy] = useState(true)
  const isLight = theme === 'light'

  const [step,          setStep]         = useState(1)
  const [searchId,      setSearchId]     = useState('')
  const [selectedTxn,   setSelectedTxn]  = useState(null)
  const [refundItems,   setRefundItems]  = useState({})
  const [filterStatus,  setFilterStatus] = useState('All')
  const [details, setDetails] = useState({
    reason: REFUND_REASONS[0],
    method: 'Cash',
    notes: '',
  })

  const filteredRefunds = refunds.filter(r => filterStatus === 'All' || r.status === filterStatus)

  const calcTotals = () => {
    if (!selectedTxn) return { subtotal: 0, vat: 0, total: 0 }
    const subtotal = selectedTxn.items.reduce((sum, item) => {
      const ri = refundItems[item.id]
      return ri?.selected ? sum + item.price * ri.qty : sum
    }, 0)
    const vat   = subtotal * 0.12
    const total = subtotal + vat
    return { subtotal, vat, total: Math.round(total) }
  }

  const selectedCount = Object.values(refundItems).filter(r => r.selected).length
  const { subtotal, vat, total } = calcTotals()

  const handleLookup = () => {
    if (!searchId.trim()) return toast('Enter a transaction ID', 'error')
    const query = searchId.trim().replace('#', '')
    const txn = transactions.find(tx => String(tx.id).padStart(4, '0') === query.padStart(4, '0'))
    if (!txn) return toast(t('txn_not_found'), 'error')
    if (txn.status === 'Refunded') return toast('This transaction was already refunded', 'warning')
    setSelectedTxn(txn)
    const init = {}
    txn.items.forEach(item => { init[item.id] = { selected: false, qty: 1 } })
    setRefundItems(init)
    setStep(2)
  }

  const toggleItem = (itemId) => {
    setRefundItems(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], selected: !prev[itemId]?.selected }
    }))
  }

  const handleSubmit = () => {
    if (selectedCount === 0) return toast('Select at least one item', 'error')
    const selectedList = selectedTxn.items
      .filter(item => refundItems[item.id]?.selected)
      .map(item => ({ ...item, refundQty: refundItems[item.id].qty }))

    addRefund({
      transactionId: selectedTxn.id,
      customerName:  selectedTxn.customerName || 'Walk-in',
      reason:        details.reason,
      refundMethod:  details.method,
      notes:         details.notes,
      total:         total,
      status:        'Pending',
      processedBy:   user?.name || role || 'Admin',
      items:         selectedList,
    })

    toast(t('refund_processed'), 'success')
    resetWizard()
  }

  const handleApprove = (r) => {
    updateRefund(r.id, { status: 'Approved' })
    if (r.items?.length) {
      r.items.forEach(item => {
        const prod = products.find(p => p.id === item.id)
        if (prod) restockProduct(prod.id, item.refundQty || item.qty || 1)
      })
    }
    toast('Refund approved — items restocked ✓', 'success')
  }

  const handleReject = (r) => {
    updateRefund(r.id, { status: 'Rejected' })
    toast('Refund rejected', 'info')
  }

  const resetWizard = () => {
    setStep(1); setSearchId(''); setSelectedTxn(null)
    setRefundItems({}); setDetails({ reason: REFUND_REASONS[0], method: 'Cash', notes: '' })
  }

  const card = { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 6 }

  const POLICY_ITEMS = [
    { icon: '🕒', title: '15-Day Return Window',      desc: 'Items must be returned within 15 days from the original date of purchase.' },
    { icon: '🛡️', title: 'Administrator Review',      desc: 'Each request is evaluated by the Admin for eligibility before approval.' },
    { icon: '💳', title: 'Original Payment Method',   desc: 'Refunds are issued via the same payment method used in the original purchase.' },
    { icon: '🧾', title: 'Transaction Required',       desc: 'The original transaction receipt or ID must be provided for verification.' },
    { icon: '📦', title: 'Inventory Restocking',       desc: 'Approved items are automatically restocked back into the store inventory.' },
  ]

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>🔄 Refunds</div>

      {/* ══════════════════════════════════
        POLICY POPUP OVERLAY
      ══════════════════════════════════ */}
      {showPolicy && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px',
          overflowY: 'auto',
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 8,
            maxWidth: 460, width: '100%',
            overflow: 'hidden',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            margin: 'auto',
          }}>

            {/* ── Top header ── */}
            <div style={{
              background: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              padding: '20px 24px 16px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 36, lineHeight: 1, marginBottom: 10 }}>📋</div>
              <div style={{ fontSize: 19, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
                Refund Policy
              </div>
              <div style={{
                display: 'inline-block', marginTop: 6,
                fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase',
                color: '#64748b', background: '#f1f5f9',
                padding: '3px 10px', borderRadius: 99,
              }}>
                Gapuz Computer Services
              </div>
            </div>

            {/* ── Policy list ── */}
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10, background: '#ffffff' }}>
              {POLICY_ITEMS.map((p, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                  padding: '12px 14px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 10,
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, flexShrink: 0,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  }}>
                    {p.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', marginBottom: 2 }}>{p.title}</div>
                    <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.5 }}>{p.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Footer button ── */}
            <div style={{ padding: '0 20px 20px', background: '#ffffff' }}>
              <button
                onClick={() => setShowPolicy(false)}
                style={{
                  width: '100%',
                  padding: '13px 0',
                  fontSize: 13,
                  fontWeight: 800,
                  borderRadius: 12,
                  border: 'none',
                  cursor: 'pointer',
                  background: '#0f172a',
                  color: '#ffffff',
                  letterSpacing: '0.3px',
                  transition: 'opacity .15s',
                }}
                onMouseEnter={e => e.target.style.opacity = '.85'}
                onMouseLeave={e => e.target.style.opacity = '1'}
              >
                I Understand — Proceed to Refund
              </button>
              <div style={{ textAlign: 'center', marginTop: 8, fontSize: 10, color: '#94a3b8' }}>
                By proceeding you confirm that you have read and understood the refund policy.
              </div>
            </div>

          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 16 }}>
        {/* Wizard UI */}
        <div style={{ ...card, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {STEPS.map(s => (
              <div key={s.num} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700,
                  background: step === s.num ? 'var(--accent)' : step > s.num ? 'rgba(52,211,153,0.15)' : 'var(--bg3)',
                  color: step === s.num ? '#0a0a0a' : step > s.num ? 'var(--accent)' : 'var(--text3)',
                  border: step > s.num ? '1px solid rgba(52,211,153,0.3)' : '1px solid var(--border2)',
                }}>{step > s.num ? '✓' : s.num}</div>
                <div style={{ fontSize: 8, color: step >= s.num ? 'var(--text2)' : 'var(--text3)', textAlign: 'center' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Look up Transaction</div>
              <input className="input-field" placeholder="e.g. 0021" value={searchId} onChange={e => setSearchId(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLookup()} />
              <button onClick={handleLookup} className="btn-primary" style={{ width: '100%', padding: 12 }}>{t('look_up')} →</button>
            </div>
          )}

          {step === 2 && selectedTxn && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: 12, border: '1px solid var(--border)' }}>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'var(--accent)', fontWeight: 700 }}>#{String(selectedTxn.id).padStart(4, '0')}</div>
                <div style={{ fontSize: 11 }}>{selectedTxn.customerName || 'Walk-in'} · {peso(selectedTxn.total)}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {selectedTxn.items.map(item => {
                  const ri = refundItems[item.id]
                  return (
                    <div key={item.id} onClick={() => toggleItem(item.id)} style={{
                      background: ri?.selected ? 'rgba(52,211,153,0.05)' : 'var(--bg3)',
                      border: `1px solid ${ri?.selected ? 'rgba(52,211,153,0.3)' : 'var(--border)'}`,
                      borderRadius: 10, padding: '10px 12px', cursor: 'pointer'
                    }}>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{item.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--text3)' }}>{peso(item.price)} × {item.qty}</div>
                      {ri?.selected && (
                        <input type="number" min="1" max={item.qty} value={ri.qty} onClick={e => e.stopPropagation()} onChange={e => setRefundItems(p => ({ ...p, [item.id]: { ...p[item.id], qty: parseInt(e.target.value) } }))} className="input-field" style={{ marginTop: 6, height: 28, fontSize: 11 }} />
                      )}
                    </div>
                  )
                })}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setStep(1)} className="btn-secondary" style={{ flex: 1 }}>Back</button>
                <button onClick={() => setStep(3)} className="btn-primary" style={{ flex: 2 }}>Next ({selectedCount}) →</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <label style={{ fontSize: 10, color: 'var(--text3)' }}>{t('reason')} *</label>
              <select className="select-field" value={details.reason} onChange={e => setDetails(d => ({ ...d, reason: e.target.value }))}>
                {REFUND_REASONS.map(r => <option key={r}>{r}</option>)}
              </select>
              <label style={{ fontSize: 10, color: 'var(--text3)' }}>{t('refund_method')}</label>
              <select className="select-field" value={details.method} onChange={e => setDetails(d => ({ ...d, method: e.target.value }))}>
                {REFUND_METHODS.map(m => <option key={m}>{m}</option>)}
              </select>

              {/* ── Enhanced Notes Field ── */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px', fontWeight: 700 }}>📝 Additional Notes</label>
                  <span style={{ fontSize: 9, color: details.notes.length > 200 ? 'var(--red)' : 'var(--text3)' }}>{details.notes.length}/250</span>
                </div>
                <div style={{ position: 'relative' }}>
                  <textarea
                    className="input-field"
                    rows={4}
                    maxLength={250}
                    placeholder="Describe the issue, condition of item, or any additional information relevant to this refund request..."
                    value={details.notes}
                    onChange={e => setDetails(d => ({ ...d, notes: e.target.value }))}
                    style={{ resize: 'none', lineHeight: 1.6, fontSize: 12, paddingBottom: 28 }}
                  />
                  <div style={{ position: 'absolute', bottom: 6, left: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {['Defective on arrival', 'Wrong item', 'Customer changed mind', 'Damaged packaging'].map(chip => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setDetails(d => ({ ...d, notes: chip }))}
                        style={{
                          fontSize: 9, padding: '2px 7px', borderRadius: 99, border: '1px solid var(--border)',
                          background: details.notes === chip ? 'var(--accent)' : 'var(--bg3)',
                          color: details.notes === chip ? '#0a0a0a' : 'var(--text3)',
                          cursor: 'pointer', fontWeight: 600, transition: 'all .15s',
                        }}>
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
                {details.notes && (
                  <div style={{ marginTop: 6, padding: '8px 12px', background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 8 }}>
                    <div style={{ fontSize: 9, color: 'var(--accent)', fontWeight: 700, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '.4px' }}>Preview</div>
                    <div style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.5 }}>{details.notes}</div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setStep(2)} className="btn-secondary" style={{ flex: 1 }}>Back</button>
                <button onClick={() => setStep(4)} className="btn-primary" style={{ flex: 2 }}>Review →</button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 17 }}>
                  <span>Refund Total</span>
                  <span style={{ color: 'var(--accent)' }}>{peso(total)}</span>
                </div>
              </div>
              {details.notes && (
                <div style={{ padding: '10px 14px', background: 'var(--bg3)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 9, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 4 }}>📝 Notes</div>
                  <div style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.5 }}>{details.notes}</div>
                </div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setStep(3)} className="btn-secondary" style={{ flex: 1 }}>Back</button>
                <button onClick={handleSubmit} className="btn-primary" style={{ flex: 2 }}>🔄 Submit Refund</button>
              </div>
            </div>
          )}
        </div>

        {/* History Table */}
        <div style={{ ...card, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ fontWeight: 700 }}>📋 Refund History</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['All', 'Pending', 'Approved', 'Rejected'].map(s => (
                <button key={s} onClick={() => setFilterStatus(s)} style={{
                  padding: '4px 12px', borderRadius: 99, border: '1px solid', fontSize: 11, cursor: 'pointer',
                  background: filterStatus === s ? 'var(--accent)' : 'transparent',
                  color: filterStatus === s ? '#0a0a0a' : 'var(--text2)',
                  borderColor: filterStatus === s ? 'var(--accent)' : 'var(--border)',
                }}>{s}</button>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg3)' }}>
                  {['Refund #', 'TXN #', 'Date', 'Customer', 'Reason', 'Method', 'Total', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: 12, textAlign: 'left', fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRefunds.length === 0
                  ? <tr><td colSpan={9} style={{ textAlign: 'center', padding: 48, color: 'var(--text3)' }}>No refunds found</td></tr>
                  : filteredRefunds.map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: 12, fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'var(--accent)' }}>#{String(r.id).padStart(4, '0')}</td>
                      <td style={{ padding: 12, fontSize: 11 }}>#{String(r.transactionId).padStart(4, '0')}</td>
                      <td style={{ padding: 12, fontSize: 11, color: 'var(--text3)' }}>{fmtDate(r.createdAt)}</td>
                      <td style={{ padding: 12, fontSize: 12 }}>{r.customerName}</td>
                      <td style={{ padding: 12, fontSize: 11, color: 'var(--text2)' }}>{r.reason}</td>
                      <td style={{ padding: 12, fontSize: 11 }}>{r.refundMethod}</td>
                      <td style={{ padding: 12, fontSize: 12, fontWeight: 700, color: 'var(--red)' }}>{peso(r.total)}</td>
                      <td style={{ padding: 12 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <StatusBadge status={r.status} isLight={isLight} />
                          {r.notes && (
                            <div title={r.notes} style={{
                              fontSize: 9, color: 'var(--text3)', maxWidth: 120,
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                              cursor: 'help',
                            }}>📝 {r.notes}</div>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: 12 }}>
                        {r.status === 'Pending' && isAdmin ? (
                          <div style={{ display: 'flex', gap: 5 }}>
                            <button onClick={() => handleApprove(r)} className="btn-success" style={{ fontSize: 10, padding: '4px 8px' }}>Approve</button>
                            <button onClick={() => handleReject(r)} className="btn-danger" style={{ fontSize: 10, padding: '4px 8px' }}>Reject</button>
                          </div>
                        ) : r.status === 'Pending' ? <span style={{ fontSize: 10, color: 'var(--yellow)' }}>Awaiting Admin</span> : '—'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
