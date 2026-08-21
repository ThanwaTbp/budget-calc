import type { ICategory } from '@/types/finance'

// หมวดหมู่รายรับ 4 หมวด
const incomeCategories: ICategory[] = [
  { id: 'salary', name: 'เงินเดือน', type: 'income', icon: 'Wallet', chartToken: 'chart-1' },
  { id: 'sales', name: 'ยอดขาย', type: 'income', icon: 'TrendingUp', chartToken: 'chart-2' },
  { id: 'interest', name: 'ดอกเบี้ย', type: 'income', icon: 'PiggyBank', chartToken: 'chart-3' },
  { id: 'other-income', name: 'รายได้อื่น', type: 'income', icon: 'MoreHorizontal', chartToken: 'chart-4' },
]

// หมวดหมู่รายจ่าย 8 หมวด
const expenseCategories: ICategory[] = [
  { id: 'rent', name: 'ค่าเช่า', type: 'expense', icon: 'Home', chartToken: 'chart-1' },
  { id: 'food', name: 'ค่าอาหาร', type: 'expense', icon: 'Utensils', chartToken: 'chart-2' },
  { id: 'transport', name: 'เดินทาง', type: 'expense', icon: 'Car', chartToken: 'chart-3' },
  { id: 'utilities', name: 'สาธารณูปโภค', type: 'expense', icon: 'Zap', chartToken: 'chart-4' },
  { id: 'marketing', name: 'การตลาด', type: 'expense', icon: 'Megaphone', chartToken: 'chart-5' },
  { id: 'equipment', name: 'อุปกรณ์', type: 'expense', icon: 'Laptop', chartToken: 'chart-1' },
  { id: 'tax', name: 'ภาษี', type: 'expense', icon: 'Receipt', chartToken: 'chart-2' },
  { id: 'staff-wage', name: 'ค่าจ้างพนักงาน', type: 'expense', icon: 'Users', chartToken: 'chart-3' },
  { id: 'other-expense', name: 'อื่นๆ', type: 'expense', icon: 'MoreHorizontal', chartToken: 'chart-4' },
]

// หมวดที่รอบจ่ายค่าจ้างใช้บันทึกรายจ่ายอัตโนมัติ ห้ามลบหรือเปลี่ยน id
export const PAYROLL_CATEGORY_ID = 'staff-wage'

export const DEFAULT_CATEGORIES: ICategory[] = [...incomeCategories, ...expenseCategories]
