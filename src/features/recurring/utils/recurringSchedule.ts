import type { IRecurringItem } from '@/types/recurring'

// รวม logic การคำนวณกำหนดการของรายการประจำ ทั้งหมดเป็น pure function ไม่แตะ store/DOM
// เพื่อให้ทดสอบตรงๆ ได้ง่าย และห้ามใช้ toISOString() ทุกกรณี (คืนค่าตามโซน UTC ทำให้วันเพี้ยน)

// คืนวันครบกำหนดจริงของเดือนนั้น เดือนที่ไม่มีวันนั้น (เช่นตั้งวันที่ 31 แต่เดือน ก.พ.) ให้ใช้วันสุดท้ายของเดือนแทน
export function resolveDueDate(yearMonth: string, dayOfMonth: number): string {
  const [year, month] = yearMonth.split('-').map(Number)
  // วันที่ 0 ของเดือนถัดไป (เดือนใน Date นับจาก 0 การส่ง month ตรงๆ จึงหมายถึงเดือนถัดไปแบบ 1-indexed)
  // จะได้วันสุดท้ายของเดือนปัจจุบันเสมอ ไม่ว่าเดือนนั้นจะมี 28/29/30/31 วัน
  const lastDayOfMonth = new Date(year, month, 0).getDate()
  const resolvedDay = Math.min(dayOfMonth, lastDayOfMonth)

  return `${year}-${String(month).padStart(2, '0')}-${String(resolvedDay).padStart(2, '0')}`
}

// เลื่อน 'yyyy-MM' ไปเดือนถัดไป ข้ามปีถูกต้องเมื่ออยู่เดือนธันวาคม (ใช้ Date rollover แทนการบวกเลขเอง)
function getNextYearMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split('-').map(Number)
  const nextMonthDate = new Date(year, month, 1)

  return `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}`
}

// ถึงกำหนดลงรายการหรือยัง: ต้องเปิดใช้งานอยู่ + วันนี้ถึงวันครบกำหนดของเดือนปัจจุบันแล้ว + ยังไม่เคยลงรายการเดือนนี้
export function isDueForPosting(item: IRecurringItem, todayIsoDate: string): boolean {
  if (!item.isActive) return false

  const currentYearMonth = todayIsoDate.slice(0, 7)
  if (item.lastPostedYearMonth === currentYearMonth) return false

  const dueDateThisMonth = resolveDueDate(currentYearMonth, item.dayOfMonth)
  // เทียบ string ตรงๆ ได้เพราะรูปแบบ 'yyyy-MM-dd' เรียงลำดับตามตัวอักษรตรงกับลำดับเวลาจริง
  return todayIsoDate >= dueDateThisMonth
}

// รายการที่ถึงกำหนดทั้งหมด ณ วันที่ที่ระบุ
export function getDueItems(items: IRecurringItem[], todayIsoDate: string): IRecurringItem[] {
  return items.filter((item) => isDueForPosting(item, todayIsoDate))
}

// วันครบกำหนดรอบถัดไปนับจากวันนี้ ใช้แสดงในหน้า (ไม่สนใจ isActive เพราะเป็นแค่การคำนวณวันที่ล้วนๆ)
// ยังไม่ถึงกำหนดเดือนนี้และยังไม่เคยลง -> ใช้วันของเดือนนี้ · เลยกำหนดไปแล้วหรือลงไปแล้วเดือนนี้ -> เลื่อนไปเดือนถัดไป
export function getNextDueDate(item: IRecurringItem, todayIsoDate: string): string {
  const currentYearMonth = todayIsoDate.slice(0, 7)
  const dueDateThisMonth = resolveDueDate(currentYearMonth, item.dayOfMonth)

  const isPostedThisMonth = item.lastPostedYearMonth === currentYearMonth
  const isPastDueThisMonth = todayIsoDate >= dueDateThisMonth

  if (!isPostedThisMonth && !isPastDueThisMonth) return dueDateThisMonth

  return resolveDueDate(getNextYearMonth(currentYearMonth), item.dayOfMonth)
}
