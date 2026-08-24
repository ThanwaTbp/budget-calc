// map สถานะบริการเป็นสี/ไอคอน/ข้อความไทย — เป็น pure function แยกออกมาให้ทดสอบได้อิสระจาก React
import { CircleCheck, CircleHelp, CircleX, TriangleAlert, type LucideIcon } from 'lucide-react'
import type { ServiceStatus } from '@/types/status'

export interface IStatusStyle {
  icon: LucideIcon
  colorClassName: string
  label: string
}

const STATUS_STYLE_MAP: Record<ServiceStatus, IStatusStyle> = {
  up: { icon: CircleCheck, colorClassName: 'text-income', label: 'ปกติ' },
  degraded: { icon: TriangleAlert, colorClassName: 'text-warning', label: 'ตอบช้า' },
  down: { icon: CircleX, colorClassName: 'text-expense', label: 'ใช้งานไม่ได้' },
  unknown: { icon: CircleHelp, colorClassName: 'text-muted-foreground', label: 'ตรวจสอบไม่ได้' },
}

// สถานะที่ไม่รู้จัก (เช่น ข้อมูลผิดคาดจากภายนอก) ต้อง fallback เป็น unknown แทนที่จะ throw
export function getStatusStyle(status: ServiceStatus): IStatusStyle {
  return STATUS_STYLE_MAP[status] ?? STATUS_STYLE_MAP.unknown
}
