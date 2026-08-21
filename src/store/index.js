import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../lib/supabaseClient'

// ── AUTH STORE (Supabase Auth + profiles table) ───────────────────
export const useAuthStore = create((set, get) => ({
  user: null,
  role: null,
  initialized: false,

  _loadProfile: async (authUser) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, role')
      .eq('id', authUser.id)
      .single()
    set({
      user: { ...authUser, user_metadata: { ...authUser.user_metadata, name: profile?.name } },
      role: profile?.role || 'cashier',
    })
  },

  init: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) await get()._loadProfile(session.user)
    set({ initialized: true })
    supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) get()._loadProfile(session.user)
      else set({ user: null, role: null })
    })
  },

  login: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error || !data.user) return false
    await get()._loadProfile(data.user)
    return true
  },

  logout: async () => {
    await supabase.auth.signOut()
    set({ user: null, role: null })
  },
}))

// ── APP STORE (theme, language, sidebar — local UI prefs only) ────
export const useAppStore = create(
  persist(
    (set, get) => ({
      theme: 'dark',
      language: 'en',
      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark'
        document.documentElement.classList.toggle('light', next === 'light')
        set({ theme: next })
      },
      toggleLanguage: () => set(s => ({ language: s.language === 'en' ? 'fil' : 'en' })),
    }),
    { name: 'gapuz-app', partialize: s => ({ theme: s.theme, language: s.language }) }
  )
)

// ── PRODUCT STORE ────────────────────────────────────────────────
const PRODUCT_SELECT = 'id:product_id, name, category, price, costPrice:cost_price, stock, barcode, icon, image, sold, createdAt:created_at, lastSoldAt:last_sold_at'

export const useProductStore = create((set, get) => ({
  products: [],
  loading: false,

  fetchProducts: async () => {
    set({ loading: true })
    const { data, error } = await supabase.from('products').select(PRODUCT_SELECT).order('name')
    if (!error) set({ products: data, loading: false })
    else set({ loading: false })
  },

  addProduct: async (data) => {
    const row = { name: data.name, category: data.category, price: data.price, cost_price: data.costPrice, stock: data.stock, barcode: data.barcode, icon: data.icon, image: data.image }
    const { data: inserted, error } = await supabase.from('products').insert(row).select(PRODUCT_SELECT).single()
    if (error || !inserted) return null
    set(s => ({ products: [...s.products, inserted] }))
    return inserted
  },

  updateProduct: async (id, data) => {
    const row = {}
    if ('name' in data) row.name = data.name
    if ('category' in data) row.category = data.category
    if ('price' in data) row.price = data.price
    if ('costPrice' in data) row.cost_price = data.costPrice
    if ('stock' in data) row.stock = data.stock
    if ('barcode' in data) row.barcode = data.barcode
    if ('icon' in data) row.icon = data.icon
    if ('image' in data) row.image = data.image
    const { error } = await supabase.from('products').update(row).eq('product_id', id)
    if (!error) set(s => ({ products: s.products.map(p => p.id === id ? { ...p, ...data } : p) }))
  },

  deleteProduct: async (id) => {
    const { error } = await supabase.from('products').delete().eq('product_id', id)
    if (!error) set(s => ({ products: s.products.filter(p => p.id !== id) }))
  },

  deductStock: async (items) => {
    set(s => ({
      products: s.products.map(p => {
        const ci = items.find(i => i.id === p.id)
        return ci ? { ...p, stock: Math.max(0, p.stock - ci.qty), sold: (p.sold || 0) + ci.qty } : p
      })
    }))
    for (const ci of items) {
      const p = get().products.find(pp => pp.id === ci.id)
      if (p) supabase.from('products').update({ stock: p.stock, sold: p.sold }).eq('product_id', ci.id)
    }
  },

  restockProduct: async (id, qty) => {
    const p = get().products.find(pp => pp.id === id)
    const newStock = (p?.stock || 0) + qty
    const { error } = await supabase.from('products').update({ stock: newStock }).eq('product_id', id)
    if (!error) set(s => ({ products: s.products.map(p => p.id === id ? { ...p, stock: newStock } : p) }))
  },
}))

// ── CUSTOMER STORE ───────────────────────────────────────────────
const CUSTOMER_SELECT = 'id:customer_id, name, email, phone, address, points, purchases, totalSpent:total_spent, createdAt:created_at'

export const useCustomerStore = create((set, get) => ({
  customers: [],
  loading: false,

  fetchCustomers: async () => {
    set({ loading: true })
    const { data, error } = await supabase.from('customers').select(CUSTOMER_SELECT).order('name')
    if (!error) set({ customers: data, loading: false })
    else set({ loading: false })
  },

  addCustomer: async (data) => {
    const row = { name: data.name, email: data.email, phone: data.phone, address: data.address }
    const { data: inserted, error } = await supabase.from('customers').insert(row).select(CUSTOMER_SELECT).single()
    if (error || !inserted) return null
    set(s => ({ customers: [...s.customers, inserted] }))
    return inserted
  },

  updateCustomer: async (id, data) => {
    const row = {}
    if ('name' in data) row.name = data.name
    if ('email' in data) row.email = data.email
    if ('phone' in data) row.phone = data.phone
    if ('address' in data) row.address = data.address
    const { error } = await supabase.from('customers').update(row).eq('customer_id', id)
    if (!error) set(s => ({ customers: s.customers.map(c => c.id === id ? { ...c, ...data } : c) }))
  },

  deleteCustomer: async (id) => {
    const { error } = await supabase.from('customers').delete().eq('customer_id', id)
    if (!error) set(s => ({ customers: s.customers.filter(c => c.id !== id) }))
  },

  addPoints: async (id, total) => {
    const c = get().customers.find(cc => cc.id === id)
    if (!c) return
    const points = c.points + 10 + Math.floor(total / 100)
    const purchases = c.purchases + 1
    const totalSpent = c.totalSpent + total
    const { error } = await supabase.from('customers').update({ points, purchases, total_spent: totalSpent }).eq('customer_id', id)
    if (!error) set(s => ({ customers: s.customers.map(cc => cc.id === id ? { ...cc, points, purchases, totalSpent } : cc) }))
  },

  // Reverses stats credited by addPoints when a sale is refunded
  revertPurchase: async (id, { refundTotal, fullRefund }) => {
    const c = get().customers.find(cc => cc.id === id)
    if (!c) return
    const pointsDeducted = (fullRefund ? 10 : 0) + Math.floor(refundTotal / 100)
    const points = Math.max(0, c.points - pointsDeducted)
    const purchases = fullRefund ? Math.max(0, c.purchases - 1) : c.purchases
    const totalSpent = Math.max(0, c.totalSpent - refundTotal)
    const { error } = await supabase.from('customers').update({ points, purchases, total_spent: totalSpent }).eq('customer_id', id)
    if (!error) set(s => ({ customers: s.customers.map(cc => cc.id === id ? { ...cc, points, purchases, totalSpent } : cc) }))
  },
}))

// ── TRANSACTION STORE ────────────────────────────────────────────
const TXN_SELECT = 'id:transaction_id, customerId:customer_id, customerName:customer_name, payment, subtotal, discAmt:disc_amt, vat, total, cashGiven:cash_given, status, cashierName:cashier_name, createdAt:created_at'

export const useTransactionStore = create((set, get) => ({
  transactions: [],
  loading: false,

  fetchTransactions: async () => {
    set({ loading: true })
    const { data, error } = await supabase
      .from('transactions')
      .select(`${TXN_SELECT}, items:transaction_items(id:product_id, name, price, qty)`)
      .order('created_at', { ascending: false })
    if (!error) set({ transactions: data, loading: false })
    else set({ loading: false })
  },

  addTransaction: async (txn) => {
    const row = {
      customer_id: txn.customerId || null,
      customer_name: txn.customerName || 'Walk-in',
      payment: txn.payment,
      subtotal: txn.subtotal,
      disc_amt: txn.discAmt,
      vat: txn.vat,
      total: txn.total,
      cash_given: txn.cashGiven,
      status: txn.status,
      cashier_name: txn.cashierName,
    }
    const { data: inserted, error } = await supabase.from('transactions').insert(row).select(TXN_SELECT).single()
    if (error || !inserted) return null
    const itemRows = txn.items.map(i => ({ transaction_id: inserted.id, product_id: i.id, name: i.name, qty: i.qty, price: i.price }))
    await supabase.from('transaction_items').insert(itemRows)
    const full = { ...inserted, items: txn.items }
    set(s => ({ transactions: [full, ...s.transactions] }))
    return full
  },

  updateTransaction: async (id, data) => {
    const row = {}
    if ('status' in data) row.status = data.status
    const { error } = await supabase.from('transactions').update(row).eq('transaction_id', id)
    if (!error) set(s => ({ transactions: s.transactions.map(tx => tx.id === id ? { ...tx, ...data } : tx) }))
  },
}))

// ── REFUND STORE ─────────────────────────────────────────────────
const REFUND_SELECT = 'id:refund_id, transactionId:transaction_id, customerName:customer_name, reason, refundMethod:refund_method, notes, total, status, processedBy:processed_by, items, subtotal, vat, createdAt:created_at'

export const useRefundStore = create((set, get) => ({
  refunds: [],

  fetchRefunds: async () => {
    const { data, error } = await supabase.from('refunds').select(REFUND_SELECT).order('created_at', { ascending: false })
    if (!error) set({ refunds: data })
  },

  addRefund: async (data) => {
    const row = {
      transaction_id: data.transactionId,
      customer_name: data.customerName,
      reason: data.reason,
      refund_method: data.refundMethod,
      notes: data.notes,
      total: data.total,
      status: data.status,
      processed_by: data.processedBy,
      items: data.items,
    }
    const { data: inserted, error } = await supabase.from('refunds').insert(row).select(REFUND_SELECT).single()
    if (error || !inserted) return null
    set(s => ({ refunds: [inserted, ...s.refunds] }))
    return inserted
  },

  updateRefund: async (id, data) => {
    const row = {}
    if ('status' in data) row.status = data.status
    const { error } = await supabase.from('refunds').update(row).eq('refund_id', id)
    if (!error) set(s => ({ refunds: s.refunds.map(r => r.id === id ? { ...r, ...data } : r) }))
  },
}))

// ── HOLD STORE ───────────────────────────────────────────────────
const HOLD_SELECT = 'id:hold_id, label, items, customerId:customer_id, savedAt:saved_at'

export const useHoldStore = create((set, get) => ({
  holds: [],

  fetchHolds: async () => {
    const { data, error } = await supabase.from('holds').select(HOLD_SELECT).order('saved_at')
    if (!error) set({ holds: data })
  },

  saveHold: async (label, items, customerId) => {
    const row = { label, items, customer_id: customerId }
    const { data: inserted, error } = await supabase.from('holds').insert(row).select(HOLD_SELECT).single()
    if (!error) set(s => ({ holds: [...s.holds, inserted] }))
  },

  removeHold: async (id) => {
    const { error } = await supabase.from('holds').delete().eq('hold_id', id)
    if (!error) set(s => ({ holds: s.holds.filter(h => h.id !== id) }))
  },
}))

// ── CART STORE (local session state — not persisted server-side) ──
export const useCartStore = create((set, get) => ({
  items: [],
  discount: { value:0, type:'pct' },
  payMethod: 'Cash',
  customerId: null,
  splitMode: false,
  split1Pay: 'Cash',
  split2Pay: 'GCash',
  split1Amt: '',

  addItem: (product) => {
    if (product.stock === 0) return false
    set(s => {
      const ex = s.items.find(i => i.id===product.id)
      if (ex) {
        if (ex.qty >= product.stock) return s
        return { items: s.items.map(i => i.id===product.id ? {...i,qty:i.qty+1} : i) }
      }
      return { items: [...s.items, {...product, qty:1}] }
    })
    return true
  },
  removeItem: (id) => set(s => ({ items: s.items.filter(i => i.id!==id) })),
  setQty: (id, qty, max) => set(s => ({ items: s.items.map(i => i.id===id ? {...i,qty:Math.max(1,Math.min(qty,max))} : i) })),
  clearCart: () => set({ items:[], discount:{value:0,type:'pct'}, customerId:null, splitMode:false, split1Amt:'' }),
  setDiscount: (value, type) => set({ discount:{value,type} }),
  setPayMethod: (m) => set({ payMethod:m }),
  setCustomer: (id) => set({ customerId:id }),
  setSplitMode: (v) => set({ splitMode:v }),
  setSplit1Pay: (v) => set({ split1Pay:v }),
  setSplit2Pay: (v) => set({ split2Pay:v }),
  setSplit1Amt: (v) => set({ split1Amt:v }),

  getTotals: () => {
    const { items, discount } = get()
    const subtotal = items.reduce((s,i)=>s+i.price*i.qty,0)
    const discAmt  = discount.type==='pct' ? subtotal*(discount.value/100) : Math.min(discount.value||0,subtotal)
    const afterDisc = subtotal - discAmt
    const vat       = afterDisc * 0.12
    const total     = afterDisc + vat
    return { subtotal, discAmt, vat, total, totalInt: Math.round(total) }
  },
}))
