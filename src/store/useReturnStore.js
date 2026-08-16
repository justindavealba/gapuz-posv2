import { create } from 'zustand'
import { persist } from 'zustand/middleware'

let retId = 1

export const useReturnStore = create(
  persist(
    (set, get) => ({
      returns: [],

      addReturn: (data) => {
        const r = {
          ...data,
          id: `RTN-${String(retId++).padStart(4, '0')}`,
          status: 'Pending',
          date: new Date().toISOString(),
        }
        set(s => ({ returns: [r, ...s.returns] }))
        return r
      },

      approveReturn: (id) => {
        set(s => ({
          returns: s.returns.map(r =>
            r.id === id ? { ...r, status: 'Approved', approvedAt: new Date().toISOString() } : r
          )
        }))
      },

      rejectReturn: (id) => {
        set(s => ({
          returns: s.returns.map(r =>
            r.id === id ? { ...r, status: 'Rejected', rejectedAt: new Date().toISOString() } : r
          )
        }))
      },

      deleteReturn: (id) => {
        set(s => ({ returns: s.returns.filter(r => r.id !== id) }))
      },
    }),
    { name: 'gapuz-returns' }
  )
)
