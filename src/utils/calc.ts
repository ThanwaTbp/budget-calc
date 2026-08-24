import type { IPayrollEntry, IPayrollResult } from '@/types/finance'

// รวมยอดของรอบจ่ายหนึ่งรอบ: ได้เพิ่มทั้งหมด ลบด้วยที่ถูกหักทั้งหมด
export function calcPayrollEntry(entry: IPayrollEntry): IPayrollResult {
  const totalEarning = entry.items
    .filter((item) => item.kind === 'earning')
    .reduce((total, item) => total + item.amount, 0)

  const totalDeduction = entry.items
    .filter((item) => item.kind === 'deduction')
    .reduce((total, item) => total + item.amount, 0)

  return {
    entryId: entry.id,
    employeeId: entry.employeeId,
    totalEarning,
    totalDeduction,
    netPay: totalEarning - totalDeduction,
  }
}

// ต้นทุนค่าจ้างรวมของทุกรอบจ่ายที่ระบุ
export function calcTotalPayrollCost(entries: IPayrollEntry[]): number {
  return entries.reduce((total, entry) => total + calcPayrollEntry(entry).netPay, 0)
}



