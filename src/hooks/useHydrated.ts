'use client'

import { useSyncExternalStore } from 'react'

// ไม่มี external store ให้ subscribe จริง จึงไม่ต้องแจ้งเตือนการเปลี่ยนแปลงใดๆ
const subscribeNoop = () => () => {}

// คืนค่า true หลัง component mount ฝั่ง client แล้วเท่านั้น (server จะได้ false เสมอ)
// ใช้กัน hydration mismatch ของค่าที่ต่างกันระหว่าง server กับ client (เช่น theme, zustand persist)
// ใช้ useSyncExternalStore แทน useEffect+setState เพื่อเลี่ยง cascading render
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  )
}
