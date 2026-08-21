'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
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
import { usePayrollStore } from '@/features/payroll/store/usePayrollStore'
import type { IEmployee } from '@/types/finance'

const employeeFormSchema = z.object({
  name: z.string().min(1, 'กรุณากรอกชื่อพนักงาน').max(80, 'ชื่อต้องไม่เกิน 80 ตัวอักษร'),
  note: z.string().max(80, 'หมายเหตุต้องไม่เกิน 80 ตัวอักษร'),
})

type IEmployeeFormValues = z.infer<typeof employeeFormSchema>

function createEmptyFormValues(): IEmployeeFormValues {
  return { name: '', note: '' }
}

interface IEmployeeDialog {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingEmployee?: IEmployee | null
}

// Dialog เพิ่ม/แก้ไขพนักงาน ตั้งใจให้กรอกจบไว: มีแค่ชื่อกับหมายเหตุ
export function EmployeeDialog({ open, onOpenChange, editingEmployee }: IEmployeeDialog) {
  const confirm = useConfirm()
  const onCreateEmployee = usePayrollStore((state) => state.onCreateEmployee)
  const onUpdateEmployee = usePayrollStore((state) => state.onUpdateEmployee)

  const form = useForm<IEmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: createEmptyFormValues(),
  })

  const {
    register,
    formState: { errors, isDirty },
  } = form

  // เปิดฟอร์มแก้ไขให้เติมค่าจากพนักงานเดิม เปิดฟอร์มเพิ่มใหม่ให้รีเซ็ตเป็นค่าว่าง ต้อง reset ทุกครั้งที่ open
  // เปลี่ยนเป็น true เท่านั้น ไม่ใช้ editingEmployee เป็น trigger เดี่ยวๆ เพราะกดเพิ่มติดกันสองครั้งจะเป็น null เหมือนเดิม
  useEffect(() => {
    if (!open) return

    if (editingEmployee) {
      form.reset({
        name: editingEmployee.name,
        note: editingEmployee.note,
      })
    } else {
      form.reset(createEmptyFormValues())
    }
  }, [open, editingEmployee, form])

  const onSubmit = form.handleSubmit((values) => {
    if (editingEmployee) {
      onUpdateEmployee(editingEmployee.id, values)
    } else {
      onCreateEmployee(values)
    }

    onOpenChange(false)
    toast.success(editingEmployee ? 'แก้ไขพนักงานเรียบร้อยแล้ว' : 'เพิ่มพนักงานเรียบร้อยแล้ว')
  })

  // ปิดฟอร์มขณะแก้ไขค้างไว้ (isDirty) ต้องยืนยันก่อนทิ้งข้อมูล ทั้งกดปุ่มยกเลิกและปิดผ่าน overlay/Esc
  const onCancel = async () => {
    if (isDirty) {
      const isConfirmed = await confirm({
        title: 'ทิ้งข้อมูลที่กรอกไว้?',
        description: 'ข้อมูลพนักงานที่ยังไม่ได้บันทึกจะหายไปทั้งหมด',
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
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{editingEmployee ? 'แก้ไขพนักงาน' : 'เพิ่มพนักงาน'}</DialogTitle>
          <DialogDescription>กรอกแค่ชื่อก็เริ่มบันทึกค่าจ้างได้ทันที</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <DialogBody className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">ชื่อพนักงาน</Label>
              <Input id="name" placeholder="เช่น สมชาย ใจดี" autoFocus {...register('name')} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="note">หมายเหตุ</Label>
              <Textarea id="note" placeholder="ไม่บังคับ เช่น ตำแหน่ง/แผนก" {...register('note')} />
              {errors.note && <p className="text-sm text-destructive">{errors.note.message}</p>}
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
