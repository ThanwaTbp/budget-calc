import { create } from 'zustand'
import type { AuthStatus, IAuthUser, ILoginInput, IRegisterInput } from '@/features/auth/type'
import {
  getCurrentUser,
  loginWithEmailPassword,
  logoutCurrentSession,
  registerAccount,
} from '@/features/auth/services/authService'
import { applyUserDataScope } from '@/features/auth/services/sessionDataService'

interface IAuthStore {
  user: IAuthUser | null
  status: AuthStatus
  onRestoreSession: () => Promise<void>
  onLogin: (input: ILoginInput) => Promise<void>
  onRegister: (input: IRegisterInput) => Promise<void>
  onLogout: () => Promise<void>
}

// ไม่ persist ตัว store นี้ เพราะ Appwrite เก็บ session ไว้ใน cookie ของโดเมนตัวเองอยู่แล้ว
// การแปลง error เป็นข้อความไทยปล่อยให้ชั้น UI/hook ที่เรียกใช้เป็นคนจัดการ (store ทำหน้าที่แค่ data layer)
export const useAuthStore = create<IAuthStore>((set) => ({
  user: null,
  status: 'loading',

  // เรียกครั้งเดียวตอนแอปเปิด เพื่อเช็คว่ามี session ของ Appwrite ค้างอยู่ในเบราว์เซอร์นี้ไหม
  onRestoreSession: async () => {
    try {
      const user = await getCurrentUser()
      await applyUserDataScope(user.id)
      set({ user, status: 'authenticated' })
    } catch {
      await applyUserDataScope(null)
      set({ user: null, status: 'unauthenticated' })
    }
  },

  onLogin: async (input) => {
    const user = await loginWithEmailPassword(input)
    // ล็อกอินครั้งแรกอาจมีข้อมูลที่บันทึกไว้ตอนยังไม่ล็อกอิน (guest) ต้องย้ายมาเป็นของบัญชีนี้ก่อน
    await applyUserDataScope(user.id, { migrateGuestData: true })
    set({ user, status: 'authenticated' })
  },

  onRegister: async (input) => {
    const user = await registerAccount(input)
    await applyUserDataScope(user.id, { migrateGuestData: true })
    set({ user, status: 'authenticated' })
  },

  onLogout: async () => {
    await logoutCurrentSession()
    await applyUserDataScope(null)
    set({ user: null, status: 'unauthenticated' })
  },
}))
