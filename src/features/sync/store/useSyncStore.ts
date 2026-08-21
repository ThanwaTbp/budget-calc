import { create } from 'zustand'
import { pullSnapshot, toThaiSyncErrorMessage } from '@/features/sync/services/remoteStore'
import type { IRemoteSnapshot } from '@/features/sync/services/remoteStore'
import { retrySyncQueueNow } from '@/features/sync/services/syncQueue'

export type SyncStatus = 'disabled' | 'idle' | 'syncing' | 'synced' | 'error' | 'offline'

interface ISyncStore {
  status: SyncStatus
  lastSyncedAt: string | null
  errorMessage: string | null
  pendingCount: number
  // ดึงข้อมูลทั้งหมดของผู้ใช้จาก Appwrite มาใช้ตัดสินใจต่อว่าจะย้ายข้อมูล local ขึ้นหรือแทนที่ state ด้วยของจริง
  // ล้มเหลวไม่โยน error ต่อ (คืน null แทน) เพื่อให้แอปยังใช้ข้อมูลจาก localStorage cache ต่อไปได้
  onPullAll: (userId: string) => Promise<IRemoteSnapshot | null>
  onRetryPending: () => void
  onSetOffline: (isOffline: boolean) => void
  onDisable: () => void
}

export const useSyncStore = create<ISyncStore>((set, get) => ({
  status: 'idle',
  lastSyncedAt: null,
  errorMessage: null,
  pendingCount: 0,

  onPullAll: async (userId) => {
    set({ status: 'syncing', errorMessage: null })
    try {
      const snapshot = await pullSnapshot(userId)
      set({ status: 'synced', lastSyncedAt: new Date().toISOString(), errorMessage: null })
      return snapshot
    } catch (error) {
      set({ status: 'error', errorMessage: toThaiSyncErrorMessage(error) })
      return null
    }
  },

  // ปิดใช้งานอยู่ก็ไม่ต้องมีอะไรให้ลองใหม่ (ไม่ได้ล็อกอิน/ยังไม่ตั้งค่า Appwrite)
  onRetryPending: () => {
    if (get().status === 'disabled') return
    retrySyncQueueNow()
  },

  onSetOffline: (isOffline) => {
    if (get().status === 'disabled') return

    if (isOffline) {
      set({ status: 'offline' })
      return
    }

    // กลับมาออนไลน์ ถ้ามีงานค้างถือว่ากำลังซิงก์ต่อ ไม่งั้นถือว่าซิงก์ปกติอยู่แล้ว
    set({ status: get().pendingCount > 0 ? 'syncing' : 'synced' })
  },

  onDisable: () => set({ status: 'disabled', errorMessage: null, pendingCount: 0, lastSyncedAt: null }),
}))
