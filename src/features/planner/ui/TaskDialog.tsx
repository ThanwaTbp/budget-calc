'use client'

import { Controller } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useConfirm } from '@/components/common/ConfirmProvider'
import { DatePicker } from '@/components/common/DatePicker'
import { TimePicker } from '@/components/common/TimePicker'
import { useTaskForm } from '@/features/planner/hooks/useTaskForm'
import type { ITask } from '@/types/planner'

interface ITaskDialog {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedDate: string
  editingTask?: ITask | null
}

// ฟอร์มเพิ่ม/แก้ไขงาน ช่องเวลาเริ่ม/สิ้นสุดแสดงตลอดเวลา ปล่อยว่างได้ = งานทั้งวัน
// ปิดฟอร์มทั้งที่แก้ไขค้างไว้ต้องยืนยันก่อนเสมอ
export function TaskDialog({ open, onOpenChange, selectedDate, editingTask }: ITaskDialog) {
  const confirm = useConfirm()

  const { form, onSubmit } = useTaskForm({
    open,
    defaultDate: selectedDate,
    editingTask,
    onSuccess: () => {
      onOpenChange(false)
      toast.success(editingTask ? 'แก้ไขงานเรียบร้อยแล้ว' : 'เพิ่มงานเรียบร้อยแล้ว')
    },
  })

  const {
    control,
    register,
    formState: { errors, isDirty },
  } = form

  const onCancel = async () => {
    if (isDirty) {
      const isConfirmed = await confirm({
        title: 'ทิ้งข้อมูลที่กรอกไว้?',
        description: 'ข้อมูลงานที่ยังไม่ได้บันทึกจะหายไปทั้งหมด',
        confirmLabel: 'ทิ้งข้อมูล',
        tone: 'warning',
      })
      if (!isConfirmed) return
      toast.info('ยกเลิกแล้ว')
    }
    onOpenChange(false)
  }

  const onDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      onCancel()
      return
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={onDialogOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editingTask ? 'แก้ไขงาน' : 'เพิ่มงาน'}</DialogTitle>
          <DialogDescription>กรอกรายละเอียดงานแล้วบันทึกเพื่อเพิ่มลงในตารางงาน</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <DialogBody className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="title">ชื่องาน</Label>
              <Input id="title" placeholder="เช่น ประชุมทีมการเงิน" {...register('title')} />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="date">วันที่</Label>
              <Controller
                control={control}
                name="date"
                render={({ field }) => <DatePicker id="date" value={field.value} onChange={field.onChange} />}
              />
              {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="startTime">เวลาเริ่ม</Label>
                  <Controller
                    control={control}
                    name="startTime"
                    render={({ field }) => (
                      <TimePicker id="startTime" value={field.value} onChange={field.onChange} />
                    )}
                  />
                  {errors.startTime && <p className="text-sm text-destructive">{errors.startTime.message}</p>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="endTime">เวลาสิ้นสุด</Label>
                  <Controller
                    control={control}
                    name="endTime"
                    render={({ field }) => (
                      <TimePicker id="endTime" value={field.value} onChange={field.onChange} />
                    )}
                  />
                  {errors.endTime && <p className="text-sm text-destructive">{errors.endTime.message}</p>}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">เว้นว่างไว้ = งานทั้งวัน</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="detail">รายละเอียด</Label>
              <Textarea id="detail" placeholder="ไม่บังคับ" rows={3} {...register('detail')} />
              {errors.detail && <p className="text-sm text-destructive">{errors.detail.message}</p>}
            </div>
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel}>
              ยกเลิก
            </Button>
            <Button type="submit">บันทึก</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
