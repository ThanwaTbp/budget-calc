'use client'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/common/DatePicker'

interface IExportRangeToolbar {
  fromDate: string
  toDate: string
  onChangeFromDate: (nextDate: string) => void
  onChangeToDate: (nextDate: string) => void
  onSelectThisMonth: () => void
  onSelectThisYear: () => void
  onSelectAllTime: () => void
}

// แถบเลือกช่วงเวลาสำหรับกรองชุดข้อมูลที่มีวันที่ (รายรับ-รายจ่าย, รอบจ่ายค่าจ้าง, งานในปฏิทิน)
export function ExportRangeToolbar({
  fromDate,
  toDate,
  onChangeFromDate,
  onChangeToDate,
  onSelectThisMonth,
  onSelectThisYear,
  onSelectAllTime,
}: IExportRangeToolbar) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-end sm:justify-between">
      <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="export-from-date">ตั้งแต่</Label>
          <DatePicker id="export-from-date" value={fromDate} onChange={onChangeFromDate} placeholder="ไม่จำกัด" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="export-to-date">ถึง</Label>
          <DatePicker id="export-to-date" value={toDate} onChange={onChangeToDate} placeholder="ไม่จำกัด" />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onSelectThisMonth}>
          เดือนนี้
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onSelectThisYear}>
          ปีนี้
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onSelectAllTime}>
          ทั้งหมด
        </Button>
      </div>
    </div>
  )
}
