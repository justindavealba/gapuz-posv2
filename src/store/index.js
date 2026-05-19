import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ── SEED PRODUCTS ────────────────────────────────────────────────
const SEED_PRODUCTS = [
  { id:1,  name:'AMD Ryzen 5 5600X',         category:'Processors',  price:9500,  costPrice:7200, stock:12, barcode:'CPU-001', icon:'💻', sold:24 },
  { id:2,  name:'Intel Core i5-12400',        category:'Processors',  price:10500, costPrice:8000, stock:8,  barcode:'CPU-002', icon:'💻', sold:18 },
  { id:3,  name:'AMD Ryzen 7 5800X',          category:'Processors',  price:15000, costPrice:11500,stock:5,  barcode:'CPU-003', icon:'💻', sold:12 },
  { id:4,  name:'Kingston 8GB DDR4 3200MHz',  category:'RAM',         price:1800,  costPrice:1300, stock:20, barcode:'RAM-001', icon:'🧩', sold:35 },
  { id:5,  name:'Corsair 16GB DDR4 3200MHz',  category:'RAM',         price:3200,  costPrice:2400, stock:15, barcode:'RAM-002', icon:'🧩', sold:28 },
  { id:6,  name:'NVIDIA RTX 3060 12GB',       category:'GPU',         price:22000, costPrice:17000,stock:4,  barcode:'GPU-001', icon:'🎮', sold:8  },
  { id:7,  name:'AMD RX 6600 8GB',            category:'GPU',         price:16500, costPrice:12500,stock:6,  barcode:'GPU-002', icon:'🎮', sold:11 },
  { id:8,  name:'Samsung 500GB SSD SATA',     category:'Storage',     price:2800,  costPrice:2100, stock:18, barcode:'SSD-001', icon:'💾', sold:42 },
  { id:9,  name:'WD 1TB NVMe M.2',            category:'Storage',     price:4500,  costPrice:3400, stock:10, barcode:'SSD-002', icon:'💾', sold:19 },
  { id:10, name:'Seagate 2TB HDD',            category:'Storage',     price:2500,  costPrice:1900, stock:14, barcode:'HDD-001', icon:'💾', sold:23 },
  { id:11, name:'ASUS 24" FHD Monitor',       category:'Peripherals', price:8500,  costPrice:6500, stock:7,  barcode:'MON-001', icon:'🖥️',sold:15 },
  { id:12, name:'Mechanical Keyboard RGB',    category:'Peripherals', price:2200,  costPrice:1600, stock:12, barcode:'KEY-001', icon:'⌨️',sold:31 },
  { id:13, name:'Logitech Wireless Mouse',    category:'Peripherals', price:1200,  costPrice:900,  stock:20, barcode:'MOU-001', icon:'🖱️',sold:47 },
  { id:14, name:'USB-C Hub 7-in-1',           category:'Accessories', price:850,   costPrice:600,  stock:25, barcode:'ACC-001', icon:'🔌', sold:38 },
  { id:15, name:'HDMI Cable 2m',              category:'Accessories', price:350,   costPrice:220,  stock:30, barcode:'ACC-002', icon:'🔌', sold:55 },
  { id:16, name:'Thermal Paste Noctua',       category:'Accessories', price:480,   costPrice:320,  stock:22, barcode:'ACC-003', icon:'🛠️',sold:19 },
  { id:17, name:'Laptop Acer Aspire 5',       category:'Laptops',     price:35000, costPrice:28000,stock:3,  barcode:'LAP-001', icon:'💻', sold:5  },
  { id:18, name:'Laptop ASUS VivoBook',       category:'Laptops',     price:28000, costPrice:22000,stock:4,  barcode:'LAP-002', icon:'💻', sold:7  },
  { id:19, name:'PC Cleaning Service',        category:'Services',    price:350,   costPrice:0,    stock:99, barcode:'SVC-001', icon:'🛠️',sold:62 },
  { id:20, name:'OS Installation Win 11',     category:'Services',    price:500,   costPrice:0,    stock:99, barcode:'SVC-002', icon:'🖥️',sold:44 },
  { id:21, name:'RAM Upgrade Service',        category:'Services',    price:200,   costPrice:0,    stock:99, barcode:'SVC-003', icon:'🔧', sold:28 },
  { id:22, name:'Data Backup Service',        category:'Services',    price:300,   costPrice:0,    stock:99, barcode:'SVC-004', icon:'💾', sold:19 },
]

// ── AUTH STORE ───────────────────────────────────────────────────
const USERS = [
  { id:1, username:'admin',   password:'admin123',   role:'admin',   name:'Gapuz Admin'   },
  { id:2, username:'cashier', password:'cashier123', role:'cashier', name:'Cashier'       },
]

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      role: null,
      login: (username, password) => {
        const found = USERS.find(u => u.username === username && u.password === password)
        if (found) { set({ user: found, role: found.role }); return true }
        return false
      },
      logout: () => set({ user: null, role: null }),
    }),
    { name: 'gapuz-auth', partialize: s => ({ user: s.user, role: s.role }) }
  )
)

// ── APP STORE (theme, language, sidebar) ─────────────────────────
export const useAppStore = create(
  persist(
    (set, get) => ({
      theme: 'dark',
      language: 'en',
      sidebarCollapsed: false,
      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark'
        document.documentElement.classList.toggle('light', next === 'light')
        set({ theme: next })
      },
      toggleLanguage: () => set(s => ({ language: s.language === 'en' ? 'fil' : 'en' })),
      toggleSidebar: () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    }),
    { name: 'gapuz-app', partialize: s => ({ theme: s.theme, language: s.language, sidebarCollapsed: s.sidebarCollapsed }) }
  )
)

// ── PRODUCT STORE ────────────────────────────────────────────────
let prodId = 23
export const useProductStore = create(
  persist(
    (set, get) => ({
      products: SEED_PRODUCTS,
      addProduct: (data) => {
        const p = { ...data, id: prodId++, sold: 0 }
        set(s => ({ products: [...s.products, p] }))
        return p
      },
      updateProduct: (id, data) => set(s => ({ products: s.products.map(p => p.id===id ? {...p,...data} : p) })),
      deleteProduct: (id) => set(s => ({ products: s.products.filter(p => p.id!==id) })),
      deductStock: (items) => set(s => ({
        products: s.products.map(p => {
          const ci = items.find(i => i.id===p.id)
          return ci ? { ...p, stock: Math.max(0, p.stock-ci.qty), sold: (p.sold||0)+ci.qty } : p
        })
      })),
      restockProduct: (id, qty) => set(s => ({ products: s.products.map(p => p.id===id ? {...p, stock:p.stock+qty} : p) })),
    }),
    { name: 'gapuz-products' }
  )
)

// ── CUSTOMER STORE ───────────────────────────────────────────────
let custId = 4
export const useCustomerStore = create(
  persist(
    (set) => ({
      customers: [
        { id:1, name:'Juan dela Cruz',   email:'juan@email.com',   phone:'0917-111-1111', address:'CDO City', points:1520, purchases:12, totalSpent:45000, createdAt:'2024-01-15' },
        { id:2, name:'Maria Santos',     email:'maria@email.com',  phone:'0918-222-2222', address:'CDO City', points:320,  purchases:4,  totalSpent:12000, createdAt:'2024-02-20' },
        { id:3, name:'Pedro Reyes',      email:'pedro@email.com',  phone:'0919-333-3333', address:'CDO City', points:3200, purchases:28, totalSpent:98000, createdAt:'2023-11-10' },
      ],
      addCustomer: (data) => {
        const c = { ...data, id: custId++, points:0, purchases:0, totalSpent:0, createdAt: new Date().toISOString().slice(0,10) }
        set(s => ({ customers: [...s.customers, c] }))
        return c
      },
      updateCustomer: (id, data) => set(s => ({ customers: s.customers.map(c => c.id===id ? {...c,...data} : c) })),
      deleteCustomer: (id) => set(s => ({ customers: s.customers.filter(c => c.id!==id) })),
      addPoints: (id, total) => set(s => ({
        customers: s.customers.map(c => c.id===id ? {
          ...c,
          points: c.points + Math.floor(total/100),
          purchases: c.purchases + 1,
          totalSpent: c.totalSpent + total,
        } : c)
      })),
    }),
    { name: 'gapuz-customers' }
  )
)

// ── TRANSACTION STORE ────────────────────────────────────────────
let txnId = 1
export const useTransactionStore = create(
  persist(
    (set, get) => ({
      transactions: [],
      addTransaction: (txn) => {
        const t = { ...txn, id: txnId++, createdAt: new Date().toISOString() }
        set(s => ({ transactions: [t, ...s.transactions] }))
        return t
      },
    }),
    { name: 'gapuz-transactions' }
  )
)

// ── REFUND STORE ─────────────────────────────────────────────────
let refId = 1
export const useRefundStore = create(
  persist(
    (set) => ({
      refunds: [],
      addRefund: (data) => {
        const r = { ...data, id: refId++, createdAt: new Date().toISOString() }
        set(s => ({ refunds: [r, ...s.refunds] }))
        return r
      },
      updateRefund: (id, data) => set(s => ({ refunds: s.refunds.map(r => r.id===id ? {...r,...data} : r) })),
    }),
    { name: 'gapuz-refunds' }
  )
)

// ── CART STORE ───────────────────────────────────────────────────
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

// ── HOLD STORE ───────────────────────────────────────────────────
export const useHoldStore = create(
  persist(
    (set) => ({
      holds: [],
      saveHold: (label, items, customerId) => set(s => ({
        holds: [...s.holds, { id:Date.now(), label, items, customerId, savedAt:new Date().toISOString() }]
      })),
      removeHold: (id) => set(s => ({ holds: s.holds.filter(h=>h.id!==id) })),
    }),
    { name: 'gapuz-holds' }
  )
)
