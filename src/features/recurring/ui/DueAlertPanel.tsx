'use client'

import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useConfirm } from '@/components/common/ConfirmProvider'
import type { IRecurringItem } from '@/types/recurring'
import { formatCurrency } from '@/utils/format'

interface IDueAlertPanel {
  dueItems: IRecurringItem[]
  totalDueAmount: number
  onPostAllDue: () => void
}

// แผงเด่นบนสุดเมื่อมีรายการประจำถึงกำหนดแล้วแต่ยังไม่ได้ลง เพราะเป็นการสร้างรายการเงินจริง
// จึงต้องให้ผู้ใช้กดยืนยันเองเสมอ ไม่ลงอัตโนมัติเงียบๆ · ไม่มีรายการถึงกำหนดให้ซ่อนแผงนี้ไปเลย
export function DueAlertPanel({ dueItems, totalDueAmount, onPostAllDue }: IDueAlertPanel) {
  const confirm = useConfirm()

  if (dueItems.length === 0) return null

  const onPostAllClick = async () => {
    const isConfirmed = await confirm({
      title: `ลงรายการทั้งหมด ${dueItems.length} รายการ?`,
      description: `รวมเป็นเงิน ${formatCurrency(totalDueAmount)} ระบบจะสร้างรายการรายรับ-รายจ่ายจริงให้ทันที`,
      confirmLabel: 'ลงรายการทั้งหมด',
      tone: 'default',
    })
    if (!isConfirmed) return

    onPostAllDue()
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-warning/40 bg-warning-muted p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-warning text-warning-foreground">
          <AlertTriangle className="size-4" />
        </span>
        <div className="flex flex-col gap-0.5">
          <p className="font-semibold text-warning">มีรายการประจำถึงกำหนดแล้ว {dueItems.length} รายการ</p>
          <p className="text-sm text-warning">
            รวมเป็นเงิน <span className="tabular font-semibold">{formatCurrency(totalDueAmount)}</span>
          </p>
        </div>
      </div>

      <Button onClick={onPostAllClick} className="w-full sm:w-auto">
        ลงรายการทั้งหมด
      </Button>
    </div>
  )
}
