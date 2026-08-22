'use client'

import { Check, Pencil, Trash2, Undo2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useConfirm } from '@/components/common/ConfirmProvider'
import { usePlannerStore } from '@/features/planner/store/usePlannerStore'
import type { ITask } from '@/types/planner'
import { cn } from '@/lib/utils'

interface ITaskListItem {
  task: ITask
  onEditTask: (task: ITask) => void
}

// หนึ่งแถวของงาน: ช่วงเวลา, ชื่องาน, รายละเอียดย่อ และปุ่มจัดการ 3 ปุ่มที่เห็นชัดตลอดเวลา (ทำเสร็จแล้ว/แก้ไข/ลบ)
// desktop เรียงแนวนอนท้ายแถว mobile เรียงเต็มความกว้างใต้ชื่องาน — ใช้ร่วมกันทั้งมุมมองรายวันและรายเดือน
export function TaskListItem({ task, onEditTask }: ITaskListItem) {
  const confirm = useConfirm()
  const onToggleStatus = usePlannerStore((state) => state.onToggleStatus)
  const onDeleteTask = usePlannerStore((state) => state.onDelete)
  const isDone = task.status === 'done'

  const onToggleClick = async () => {
    const isConfirmed = await confirm({
      title: isDone ? 'ย้ายกลับเป็นค้างอยู่?' : 'ทำเครื่องหมายว่าเสร็จแล้ว?',
      description: isDone
        ? `งาน "${task.title}" จะย้ายกลับไปอยู่ในสถานะค้างอยู่`
        : `งาน "${task.title}" จะถูกทำเครื่องหมายว่าเสร็จแล้ว`,
      confirmLabel: isDone ? 'ย้ายกลับ' : 'ทำเครื่องหมาย',
      tone: 'default',
    })
    if (!isConfirmed) return

    onToggleStatus(task.id)
    toast.success(isDone ? 'ย้ายกลับเป็นค้างอยู่แล้ว' : 'ทำเครื่องหมายว่าเสร็จแล้ว')
  }

  const onDeleteClick = async () => {
    const isConfirmed = await confirm({
      title: `ลบงาน "${task.title}"?`,
      description: 'งานนี้จะถูกลบถาวรและกู้คืนไม่ได้',
      confirmLabel: 'ลบเลย',
      tone: 'danger',
    })
    if (!isConfirmed) return

    onDeleteTask(task.id)
    toast.success('ลบงานเรียบร้อยแล้ว')
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-lg border p-3 transition-colors sm:flex-row sm:items-center sm:justify-between',
        // งานที่เสร็จแล้วให้ทั้งแถวจางลงและมีเส้นขอบสีเขียว เห็นความต่างจากงานที่ยังค้างตั้งแต่แรกเห็น
        isDone ? 'border-income/40 bg-income-muted/40' : 'border-border',
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span
          className={cn(
            'mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full',
            isDone ? 'bg-income text-income-foreground' : 'border-2 border-muted-foreground/40',
          )}
          aria-hidden
        >
          {isDone ? <Check className="size-3.5" /> : null}
        </span>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {task.startTime && (
            <span className="tabular text-sm text-muted-foreground">
              {task.endTime ? `${task.startTime}–${task.endTime}` : task.startTime}
            </span>
          )}
          <p className={cn('font-medium', isDone && 'text-muted-foreground line-through')}>{task.title}</p>
          {task.detail && <p className="line-clamp-2 text-sm text-muted-foreground">{task.detail}</p>}
        </div>
      </div>

      <div className="flex w-full items-center gap-2 sm:w-auto sm:shrink-0">
        <Button
          size="sm"
          className={cn(
            'flex-1 sm:flex-none',
            // ปุ่มหลักของแถวต้องเด่นที่สุด ยังไม่เสร็จใช้สีเขียวทึบ เสร็จแล้วลดเป็นปุ่มขอบเพราะไม่ใช่สิ่งที่ต้องกดต่อ
            isDone
              ? 'border border-border bg-transparent text-foreground hover:bg-muted'
              : 'bg-income text-income-foreground hover:bg-income/90',
          )}
          onClick={onToggleClick}
          aria-label={isDone ? 'ย้ายกลับเป็นค้างอยู่' : 'ทำเครื่องหมายว่าเสร็จแล้ว'}
        >
          {isDone ? <Undo2 /> : <Check />}
          <span>{isDone ? 'ย้ายกลับ' : 'ทำเสร็จแล้ว'}</span>
        </Button>

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onEditTask(task)}
          aria-label="แก้ไขงาน"
          title="แก้ไขงาน"
        >
          <Pencil />
        </Button>

        <Button
          variant="ghost"
          size="icon-sm"
          className="text-expense hover:bg-expense-muted hover:text-expense"
          onClick={onDeleteClick}
          aria-label="ลบงาน"
          title="ลบงาน"
        >
          <Trash2 />
        </Button>
      </div>
    </div>
  )
}
