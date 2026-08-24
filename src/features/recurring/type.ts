import type { IRecurringItem } from '@/types/recurring'

// input สำหรับสร้าง/แก้ไขรายการประจำ (ตาม Store contract ใน SPEC.md)
// ตัด id/createdAt/lastPostedYearMonth ออก เพราะ store เป็นคนกำหนดค่าเหล่านี้เอง
export type IRecurringInput = Omit<IRecurringItem, 'id' | 'createdAt' | 'lastPostedYearMonth'>
