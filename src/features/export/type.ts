import type { LucideIcon } from 'lucide-react'
import type { ICsvTable } from '@/features/export/utils/exportBuilders'

export type ExportDatasetKey = 'transactions' | 'employees' | 'payroll' | 'tasks' | 'lotteryTickets'

// ชุดข้อมูลหนึ่งใบการ์ดในหน้าส่งออก — table คำนวณล่วงหน้าจาก builder ตามช่วงวันที่ที่เลือกไว้แล้ว
export interface IExportDataset {
  key: ExportDatasetKey
  title: string
  description: string
  icon: LucideIcon
  hasDateRange: boolean
  fileSlug: string
  table: ICsvTable
}
