import type { PayItemKind } from '@/types/finance'

// ตัวเลือกชื่อรายการจ่ายเพิ่ม (earning) ให้เลือกจาก dropdown แทนการพิมพ์เอง กันสะกดชื่อไม่ตรงกัน
export const EARNING_ITEM_OPTIONS = ['ค่าแรง', 'ค่ารถ', 'เบี้ยขยัน', 'โบนัส']

// ตัวเลือกชื่อรายการหัก (deduction) ให้เลือกจาก dropdown แทนการพิมพ์เอง กันสะกดชื่อไม่ตรงกัน
export const DEDUCTION_ITEM_OPTIONS = ['หักเบิกล่วงหน้า', 'หักขาดลา', 'หักอื่นๆ']

export const PAY_ITEM_KIND_LABEL: Record<PayItemKind, string> = {
  earning: 'จ่ายเพิ่ม',
  deduction: 'หัก',
}
