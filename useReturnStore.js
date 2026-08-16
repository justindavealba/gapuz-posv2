import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useProductStore } from './src/store';

export const useReturnStore = create(
  persist(
    (set, get) => ({
      returns: [],

      addReturn: (newReturn) => {
        const returnEntry = {
          ...newReturn,
          id: `RET-${Date.now()}`,
          date: new Date().toISOString(),
          status: 'Pending',
        };
        set((state) => ({
          returns: [returnEntry, ...state.returns],
        }));
        return returnEntry.id;
      },

      approveReturn: (returnId) => {
        const { returns } = get();
        const returnEntry = returns.find((r) => r.id === returnId);
        
        if (!returnEntry || returnEntry.status !== 'Pending') return;

        // Restock items back to inventory
        const { restockProduct } = useProductStore.getState();
        returnEntry.items.forEach((item) => {
          restockProduct(item.id, item.returnQty);
        });

        set((state) => ({
          returns: state.returns.map((r) =>
            r.id === returnId ? { ...r, status: 'Approved' } : r
          ),
        }));
      },

      rejectReturn: (returnId) => {
        set((state) => ({
          returns: state.returns.map((r) =>
            r.id === returnId ? { ...r, status: 'Rejected' } : r
          ),
        }));
      },
    }),
    { name: 'gapuz-returns' }
  )
);