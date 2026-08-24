import { Activity, ArrowLeftRight, CalendarDays, CloudSun, Download, Repeat, Settings, Ticket, TrendingUp, Users, Wallet, type LucideIcon } from 'lucide-react'

// รายการเมนูหลักของ sidebar ใช้ร่วมกันทั้งเวอร์ชัน desktop และ mobile
export const NAV_ITEMS: Array<{ href: string; label: string; icon: LucideIcon }> = [
  { href: '/transactions', label: 'รายรับ-รายจ่าย', icon: ArrowLeftRight },
  { href: '/payroll', label: 'ค่าจ้างพนักงาน', icon: Users },
  { href: '/planner', label: 'วางแผนงาน', icon: CalendarDays },
  { href: '/lottery', label: 'ตรวจหวย', icon: Ticket },
  { href: '/weather', label: 'สภาพอากาศ', icon: CloudSun },
  { href: '/budget', label: 'งบประมาณ', icon: Wallet },
  { href: '/recurring', label: 'รายการประจำ', icon: Repeat },
  { href: '/market', label: 'ราคาตลาด', icon: TrendingUp },
  { href: '/export', label: 'ส่งออกข้อมูล', icon: Download },
  { href: '/status', label: 'สถานะระบบ', icon: Activity },
  { href: '/settings', label: 'ตั้งค่า', icon: Settings },
]

// เมนูที่ห้ามซ่อน มิฉะนั้นผู้ใช้จะซ่อนทางเข้าหน้าตั้งค่าจนกลับมาเปิดเมนูอื่นไม่ได้อีก
export const ALWAYS_VISIBLE_MENU_HREFS = ['/settings']
