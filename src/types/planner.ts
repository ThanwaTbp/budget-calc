// Data model ของฟีเจอร์วางแผนงาน (Planner) — ห้ามแก้โครงสร้างโดยไม่อัปเดต docs/SPEC.md ตามไปด้วย
export type TaskStatus = 'todo' | 'done'

export interface ITask {
  id: string
  title: string
  detail: string
  date: string // 'yyyy-MM-dd'
  startTime: string // 'HH:mm' — ว่าง = งานทั้งวัน (ไม่ระบุเวลา)
  endTime: string // 'HH:mm' — ว่างได้ (แต่ถ้ากรอกต้องมี startTime ด้วย)
  status: TaskStatus
  createdAt: string
}
