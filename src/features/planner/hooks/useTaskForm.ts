'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { usePlannerStore } from '@/features/planner/store/usePlannerStore'
import type { ITask } from '@/types/planner'

// ตรวจช่วงเวลาของงาน: เว้นว่างทั้งคู่ = งานทั้งวัน (ผ่าน) · มีแต่ endTime โดยไม่มี startTime ไม่ผ่าน
// มี startTime แต่ไม่มี endTime ผ่าน (งานที่ระบุแค่เวลาเริ่ม) · มีทั้งคู่ต้อง endTime ไม่น้อยกว่า startTime
export function isValidTimeRange(startTime: string, endTime: string): boolean {
  if (!startTime && !endTime) return true
  if (endTime && !startTime) return false
  if (startTime && endTime) return endTime >= startTime
  return true
}

const taskFormSchema = z
  .object({
    title: z.string().trim().min(1, 'กรุณากรอกชื่องาน').max(160, 'ชื่องานต้องไม่เกิน 160 ตัวอักษร'),
    date: z.string().min(1, 'กรุณาเลือกวันที่'),
    startTime: z.string(),
    endTime: z.string(),
    detail: z.string().max(1000, 'รายละเอียดต้องไม่เกิน 1000 ตัวอักษร'),
  })
  .refine((values) => !(values.endTime && !values.startTime), {
    message: 'กรุณาเลือกเวลาเริ่มก่อนเวลาสิ้นสุด',
    path: ['startTime'],
  })
  .refine((values) => isValidTimeRange(values.startTime, values.endTime), {
    message: 'เวลาสิ้นสุดต้องไม่น้อยกว่าเวลาเริ่ม',
    path: ['endTime'],
  })

export type ITaskFormValues = z.infer<typeof taskFormSchema>

// ค่าเริ่มต้นตอนเปิดฟอร์มเพิ่มงานใหม่: ใช้วันที่ที่กำลังเลือกอยู่บนปฏิทิน ยังไม่ระบุเวลา (งานทั้งวัน)
function createEmptyFormValues(defaultDate: string): ITaskFormValues {
  return {
    title: '',
    date: defaultDate,
    startTime: '',
    endTime: '',
    detail: '',
  }
}

interface IUseTaskForm {
  open: boolean
  defaultDate: string
  editingTask?: ITask | null
  onSuccess: () => void
}

// รวม logic ฟอร์มเพิ่ม/แก้ไขงาน validate ด้วย zod แล้วเชื่อมกับ usePlannerStore โดยตรง
export function useTaskForm({ open, defaultDate, editingTask, onSuccess }: IUseTaskForm) {
  const onCreate = usePlannerStore((state) => state.onCreate)
  const onUpdate = usePlannerStore((state) => state.onUpdate)

  const form = useForm<ITaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: createEmptyFormValues(defaultDate),
  })

  // ต้อง reset ทุกครั้งที่ dialog เปิด (dep มี open ไม่ใช่แค่ editingTask) ไม่งั้นกดเพิ่มงานใหม่ติดกันสองครั้ง
  // editingTask จะเป็น null เหมือนเดิมทั้งคู่ effect จะไม่ทำงานและค่าฟอร์มเก่าจะค้างอยู่
  useEffect(() => {
    if (!open) return

    if (editingTask) {
      form.reset({
        title: editingTask.title,
        date: editingTask.date,
        startTime: editingTask.startTime,
        endTime: editingTask.endTime,
        detail: editingTask.detail,
      })
    } else {
      form.reset(createEmptyFormValues(defaultDate))
    }
  }, [open, editingTask, defaultDate, form])

  const onSubmit = form.handleSubmit((values) => {
    const input = {
      title: values.title,
      detail: values.detail,
      date: values.date,
      startTime: values.startTime,
      endTime: values.endTime,
    }

    if (editingTask) {
      onUpdate(editingTask.id, input)
    } else {
      onCreate(input)
    }

    onSuccess()
  })

  return { form, onSubmit }
}
