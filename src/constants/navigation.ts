import {
  Activity,
  ArrowLeftRight,
  CalendarDays,
  CloudSun,
  Download,
  NotebookPen,
  Repeat,
  Settings,
  Ticket,
  TrendingUp,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

export interface INavItem {
  href: string
  label: string
  icon: LucideIcon
}

export interface INavGroup {
  id: 'finance' | 'workspace' | 'data' | 'system'
  label: string
  items: INavItem[]
  placement: 'main' | 'footer'
}

// จัดกลุ่มตามงานที่ผู้ใช้ตั้งใจทำ ไม่จัดตามลำดับที่ฟีเจอร์ถูกสร้าง เพื่อให้หาเมนูจากบริบทได้เร็วขึ้น
export const NAV_GROUPS: INavGroup[] = [
  {
    id: 'finance',
    label: 'การเงิน',
    placement: 'main',
    items: [
      { href: '/transactions', label: 'รายรับ-รายจ่าย', icon: ArrowLeftRight },
      { href: '/budget', label: 'งบประมาณ', icon: Wallet },
      { href: '/recurring', label: 'รายการประจำ', icon: Repeat },
      { href: '/payroll', label: 'ค่าจ้างพนักงาน', icon: Users },
    ],
  },
  {
    id: 'workspace',
    label: 'งานและเครื่องมือ',
    placement: 'main',
    items: [
      { href: '/planner', label: 'วางแผนงาน', icon: CalendarDays },
      { href: '/private-notes', label: 'โน้ตส่วนตัว', icon: NotebookPen },
      { href: '/market', label: 'ราคาตลาด', icon: TrendingUp },
      { href: '/weather', label: 'สภาพอากาศ', icon: CloudSun },
      { href: '/lottery', label: 'ตรวจหวย', icon: Ticket },
    ],
  },
  {
    id: 'data',
    label: 'ข้อมูล',
    placement: 'main',
    items: [{ href: '/export', label: 'ส่งออกข้อมูล', icon: Download }],
  },
  {
    id: 'system',
    label: 'ระบบ',
    placement: 'footer',
    items: [
      { href: '/status', label: 'สถานะระบบ', icon: Activity },
      { href: '/settings', label: 'ตั้งค่า', icon: Settings },
    ],
  },
]

// เก็บรายการแบบแบนไว้ให้หน้าตั้งค่า visibility ใช้ contract เดิมได้ โดยลำดับตรงกับ sidebar
export const NAV_ITEMS: INavItem[] = NAV_GROUPS.flatMap((navGroup) => navGroup.items)

// เมนูที่ห้ามซ่อน มิฉะนั้นผู้ใช้จะซ่อนทางเข้าหน้าตั้งค่าจนกลับมาเปิดเมนูอื่นไม่ได้อีก
export const ALWAYS_VISIBLE_MENU_HREFS = ['/settings']
