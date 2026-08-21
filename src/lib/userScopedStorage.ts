import { createJSONStorage, type StateStorage } from 'zustand/middleware'

// ข้อมูลการเงินถูกแยกตามบัญชีผู้ใช้ โดยเติม userId ต่อท้าย key ของ localStorage
// ยังไม่ล็อกอินให้ใช้พื้นที่ 'guest' ไปก่อน แล้วค่อยย้ายเข้าบัญชีตอนสมัคร/ล็อกอินครั้งแรก
const GUEST_SCOPE = 'guest'

let activeScope = GUEST_SCOPE

// ระหว่างสลับบัญชีต้องล้าง state ในหน่วยความจำก่อน rehydrate
// แต่ zustand persist จะเขียนลง storage ทุกครั้งที่ state เปลี่ยน ถ้าไม่หยุดเขียนไว้ก่อน
// state ว่างจะถูกเขียนทับข้อมูลจริงของบัญชีที่กำลังจะสลับไป ทำให้ข้อมูลหายทั้งหมด
let isWriteSuspended = false

export function suspendStorageWrites(): void {
  isWriteSuspended = true
}

export function resumeStorageWrites(): void {
  isWriteSuspended = false
}

export function setActiveStorageScope(userId: string | null): void {
  activeScope = userId ?? GUEST_SCOPE
}

export function getActiveStorageScope(): string {
  return activeScope
}

export function toScopedKey(storeName: string, scope: string = activeScope): string {
  return `${storeName}:${scope}`
}

export const GUEST_STORAGE_SCOPE = GUEST_SCOPE

const userScopedStateStorage: StateStorage = {
  getItem: (name) => {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem(toScopedKey(name))
  },
  setItem: (name, value) => {
    if (typeof window === 'undefined' || isWriteSuspended) return
    window.localStorage.setItem(toScopedKey(name), value)
  },
  removeItem: (name) => {
    if (typeof window === 'undefined' || isWriteSuspended) return
    window.localStorage.removeItem(toScopedKey(name))
  },
}

export const userScopedStorage = createJSONStorage(() => userScopedStateStorage)

// ย้ายข้อมูลที่บันทึกไว้ตอนยังไม่ล็อกอินไปเป็นของบัญชีที่ระบุ
// ย้ายเฉพาะตอนบัญชีนั้นยังไม่มีข้อมูลของตัวเอง เพื่อไม่ให้ทับข้อมูลเดิมของผู้ใช้
export function migrateGuestDataToUser(storeNames: string[], userId: string): boolean {
  if (typeof window === 'undefined') return false

  let hasMigrated = false

  storeNames.forEach((storeName) => {
    const guestValue = window.localStorage.getItem(toScopedKey(storeName, GUEST_SCOPE))
    if (!guestValue) return

    const userKey = toScopedKey(storeName, userId)
    if (window.localStorage.getItem(userKey)) return

    window.localStorage.setItem(userKey, guestValue)
    window.localStorage.removeItem(toScopedKey(storeName, GUEST_SCOPE))
    hasMigrated = true
  })

  return hasMigrated
}
