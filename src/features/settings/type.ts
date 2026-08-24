import type { LucideIcon } from 'lucide-react'

// รายการเมนูที่แสดงในหน้าตั้งค่า ต่อยอดจาก NAV_ITEMS พร้อมสถานะแสดง/ซ่อนและล็อก
export interface IMenuOption {
  href: string
  label: string
  icon: LucideIcon
  isVisible: boolean
  isLocked: boolean
}
