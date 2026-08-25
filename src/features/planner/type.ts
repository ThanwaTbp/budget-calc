import type { ITask } from '@/types/planner'

// input สำหรับสร้าง/แก้ไขงาน (ตาม Store contract ใน SPEC.md)
export interface ITaskInput {
  title: string
  detail: string
  date: string
  startTime: string
  endTime: string
}

// สรุปงานของวันหนึ่ง ใช้วาดตัวบ่งชี้ในช่องวันที่ของปฏิทิน (react-day-picker)
export interface IDayTaskSummary {
  date: string
  total: number
  doneCount: number
}

// ตัวกรองสถานะงานในลิสต์ของวันที่เลือก/เดือนที่เลือก
export type PlannerStatusFilter = 'all' | 'todo' | 'done'

// มุมมองหน้าวางแผน: รายวัน, รายเดือนแบบลิสต์ หรือปฏิทินทีมขนาดใหญ่ที่แสดงงานในแต่ละวัน
export type PlannerViewMode = 'day' | 'month' | 'calendar'

// โทนสีของตัวบ่งชี้ในช่องวันที่ปฏิทิน: pending = ยังมีงานค้างอยู่, done = เสร็จหมดทุกงานแล้ว
export type DayIndicatorTone = 'pending' | 'done'

// สรุปยอดงานของเดือนที่กำลังดูอยู่บนปฏิทิน
export interface IMonthTaskSummary {
  total: number
  done: number
  todo: number
}

// งานของหนึ่งวัน ใช้เป็นกลุ่มในมุมมองรายเดือน (จัดกลุ่มตามวันที่ เรียงวันเก่า→ใหม่)
export interface IMonthTaskGroup {
  date: string
  tasks: ITask[]
  isToday: boolean
}
