import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { userScopedStorage } from '@/lib/userScopedStorage'
import type { ILotteryTicket } from '@/types/lottery'
import { createId } from '@/utils/id'
import type { ILotteryTicketInput } from '@/features/lottery/type'
import { enqueueSyncOperation } from '@/features/sync/services/syncQueue'

interface ILotteryTicketStore {
  tickets: ILotteryTicket[]
  onCreate: (input: ILotteryTicketInput) => void
  onUpdate: (id: string, input: ILotteryTicketInput) => void
  onDelete: (id: string) => void
  onReset: () => void
  // แทนที่ tickets ทั้งหมดด้วยข้อมูลจาก Appwrite แบบเงียบ ห้ามยิงกลับเข้าคิว sync (กันลูปอัปโหลดซ้ำ)
  onReplaceAll: (tickets: ILotteryTicket[]) => void
}

export const useLotteryTicketStore = create<ILotteryTicketStore>()(
  persist(
    (set, get) => ({
      tickets: [],

      onCreate: (input) => {
        // กันเลขซ้ำ — มีเลขนี้บันทึกไว้แล้วไม่ต้องเพิ่มซ้ำ
        const isDuplicateNumber = get().tickets.some((ticket) => ticket.number === input.number)
        if (isDuplicateNumber) return

        const newTicket: ILotteryTicket = {
          ...input,
          id: createId(),
          createdAt: new Date().toISOString(),
        }

        set((state) => ({ tickets: [...state.tickets, newTicket] }))
        enqueueSyncOperation({ kind: 'lotteryTicket', action: 'upsert', id: newTicket.id, payload: newTicket })
      },

      onUpdate: (id, input) => {
        let updatedTicket: ILotteryTicket | null = null

        set((state) => ({
          tickets: state.tickets.map((ticket) => {
            if (ticket.id !== id) return ticket
            updatedTicket = { ...ticket, ...input }
            return updatedTicket
          }),
        }))

        if (updatedTicket) {
          enqueueSyncOperation({ kind: 'lotteryTicket', action: 'upsert', id, payload: updatedTicket })
        }
      },

      onDelete: (id) => {
        set((state) => ({ tickets: state.tickets.filter((ticket) => ticket.id !== id) }))
        enqueueSyncOperation({ kind: 'lotteryTicket', action: 'delete', id })
      },

      onReset: () => set({ tickets: [] }),

      onReplaceAll: (tickets) => set({ tickets }),
    }),
    {
      name: 'budget-calc:lottery',
      // แยกพื้นที่เก็บข้อมูลตามบัญชีผู้ใช้ (key จริงคือ '<name>:<userId>')
      storage: userScopedStorage,
      version: 1,
    },
  ),
)
