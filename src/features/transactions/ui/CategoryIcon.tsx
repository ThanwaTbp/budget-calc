import { Circle, type LucideIcon } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { cn } from '@/lib/utils'

interface ICategoryIcon {
  icon: string
  className?: string
}

// lucide-react export หลายอย่างปนกัน (icon, type, helper function) จึงต้อง cast เป็น registry ของ icon
// component โดยเฉพาะ แล้ว fallback เป็น Circle กรณีหาไอคอนตามชื่อที่เก็บไว้ไม่เจอ
const iconRegistry = LucideIcons as unknown as Record<string, LucideIcon>

export function CategoryIcon({ icon, className }: ICategoryIcon) {
  const ResolvedIcon = iconRegistry[icon] ?? Circle

  return <ResolvedIcon className={cn('size-4', className)} />
}
