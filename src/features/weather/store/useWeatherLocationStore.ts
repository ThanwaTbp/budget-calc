import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { userScopedStorage } from '@/lib/userScopedStorage'
import type { IWeatherLocation } from '@/types/weather'

// ค่าเริ่มต้น = กรุงเทพมหานคร
const DEFAULT_LOCATION: IWeatherLocation = {
  id: 0,
  name: 'กรุงเทพมหานคร',
  admin1: '',
  country: 'ประเทศไทย',
  latitude: 13.7563,
  longitude: 100.5018,
}

interface IWeatherLocationStore {
  location: IWeatherLocation
  onSelectLocation: (location: IWeatherLocation) => void
  // ล้างกลับเป็นค่าเริ่มต้นตอนสลับบัญชี ไม่งั้นบัญชีใหม่จะเห็นสถานที่ของบัญชีก่อนหน้าค้างอยู่ในหน่วยความจำ
  onReset: () => void
}

// เก็บสถานที่ที่ผู้ใช้เลือกไว้เป็นค่าตั้งค่าประจำเครื่อง — ไม่ใช่ข้อมูลทางธุรกิจ จึงไม่ต้อง sync ขึ้น cloud
export const useWeatherLocationStore = create<IWeatherLocationStore>()(
  persist(
    (set) => ({
      location: DEFAULT_LOCATION,

      onSelectLocation: (location) => set({ location }),

      onReset: () => set({ location: DEFAULT_LOCATION }),
    }),
    {
      name: 'budget-calc:weather',
      // แยกพื้นที่เก็บข้อมูลตามบัญชีผู้ใช้ (key จริงคือ '<name>:<userId>')
      storage: userScopedStorage,
      version: 1,
    },
  ),
)
