import { ArrowLeftRight, CalendarDays, LayoutDashboard, Ticket, Users, type LucideIcon } from 'lucide-react'

// รายการเมนูหลักของ sidebar ใช้ร่วมกันทั้งเวอร์ชัน desktop และ mobile
export const NAV_ITEMS: Array<{ href: string; label: string; icon: LucideIcon }> = [
  { href: '/', label: 'ภาพรวม', icon: LayoutDashboard },
  { href: '/transactions', label: 'รายรับ-รายจ่าย', icon: ArrowLeftRight },
  { href: '/payroll', label: 'ค่าจ้างพนักงาน', icon: Users },
  { href: '/planner', label: 'วางแผนงาน', icon: CalendarDays },
  { href: '/lottery', label: 'ตรวจหวย', icon: Ticket },
]
