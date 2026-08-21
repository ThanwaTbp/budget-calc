'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { z } from 'zod'
import { usePayrollStore } from '@/features/payroll/store/usePayrollStore'
import type { IPayrollEntry } from '@/types/finance'

const payItemFormSchema = z.object({
  label: z.string().min(1, 'กรุณากรอกชื่อรายการ'),
  amount: z.coerce.number().positive('จำนวนเงินต้องมากกว่า 0'),
  kind: z.enum(['earning', 'deduction']),
})

const payrollEntryFormSchema = z.object({
  employeeId: z.string().min(1, 'กรุณาเลือกพนักงาน'),
  date: z.string().min(1, 'กรุณาเลือกวันที่'),
  note: z.string().max(120, 'หมายเหตุต้องไม่เกิน 120 ตัวอักษร'),
  items: z.array(payItemFormSchema).min(1, 'ต้องมีอย่างน้อย 1 รายการ'),
})

// ค่าที่กรอกในฟอร์ม (ก่อนผ่าน zod coerce) กับค่าที่ validate แล้วมีชนิดต่างกันที่ amount ของแต่ละรายการ
export type IPayrollEntryFormInput = z.input<typeof payrollEntryFormSchema>
export type IPayrollEntryFormValues = z.output<typeof payrollEntryFormSchema>

// คืนวันที่ปัจจุบันตามเวลาท้องถิ่นในรูปแบบ yyyy-MM-dd ห้ามใช้ toISOString() เพราะคืนค่าตามโซน UTC
// ทำให้วันที่เพี้ยนย้อนหลัง 1 วันในช่วงหลัง 17:00 น. ตามเวลาไทย (UTC+7)
function getLocalDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// ค่าเริ่มต้นตอนเปิดฟอร์มใหม่: บรรทัดว่าง 1 รายการชนิดจ่ายเพิ่ม วันที่เป็นวันนี้
// amount เป็นค่าว่างแทน 0 เพื่อไม่ให้ผู้ใช้ต้องลบเลข 0 ทิ้งก่อนพิมพ์ทุกครั้ง
// defaultEmployeeId เป็นค่าว่างได้ (เช่น เปิดจากปุ่ม 'เพิ่มรอบจ่าย' ที่หัวหน้า) บังคับให้ผู้ใช้เลือกเองในฟอร์ม
function createEmptyFormValues(defaultEmployeeId: string): IPayrollEntryFormInput {
  return {
    employeeId: defaultEmployeeId,
    date: getLocalDateString(new Date()),
    note: '',
    items: [{ label: '', amount: '', kind: 'earning' }],
  }
}

interface IUsePayrollEntryForm {
  open: boolean
  defaultEmployeeId: string
  editingEntry?: IPayrollEntry | null
  onConfirmSave: (netPay: number) => Promise<boolean>
  onSuccess: () => void
}

// รวม logic ของฟอร์มสร้าง/แก้ไขรอบจ่าย: validate ด้วย zod, useFieldArray สำหรับรายการเงินหลายบรรทัด,
// ยืนยันก่อนบันทึกจริงผ่าน onConfirmSave (เพราะบันทึกแล้วจะไปสร้าง/แก้รายจ่ายอัตโนมัติ) แล้วค่อยเชื่อมกับ store
export function usePayrollEntryForm({
  open,
  defaultEmployeeId,
  editingEntry,
  onConfirmSave,
  onSuccess,
}: IUsePayrollEntryForm) {
  const onCreateEntry = usePayrollStore((state) => state.onCreateEntry)
  const onUpdateEntry = usePayrollStore((state) => state.onUpdateEntry)

  const form = useForm<IPayrollEntryFormInput, unknown, IPayrollEntryFormValues>({
    resolver: zodResolver(payrollEntryFormSchema),
    defaultValues: createEmptyFormValues(defaultEmployeeId),
  })

  const fieldArray = useFieldArray({ control: form.control, name: 'items' })

  // ต้อง reset ทุกครั้งที่ dialog เปิด (dep มี open ไม่ใช่แค่ editingEntry) ไม่งั้นกดเพิ่มรอบจ่ายใหม่
  // ติดกันสองครั้ง editingEntry จะเป็น null เหมือนเดิมทั้งคู่ effect จะไม่ทำงานและค่าฟอร์มเก่าจะค้างอยู่
  useEffect(() => {
    if (!open) return

    if (editingEntry) {
      form.reset({
        employeeId: editingEntry.employeeId,
        date: editingEntry.date,
        note: editingEntry.note,
        items: editingEntry.items.map((item) => ({
          label: item.label,
          amount: item.amount,
          kind: item.kind,
        })),
      })
    } else {
      form.reset(createEmptyFormValues(defaultEmployeeId))
    }
  }, [open, editingEntry, defaultEmployeeId, form])

  const onSubmit = form.handleSubmit(async (values) => {
    const netPay = values.items.reduce(
      (total, item) => total + (item.kind === 'earning' ? item.amount : -item.amount),
      0,
    )

    const isConfirmed = await onConfirmSave(netPay)
    if (!isConfirmed) return

    if (editingEntry) {
      onUpdateEntry(editingEntry.id, values)
    } else {
      onCreateEntry(values)
    }

    onSuccess()
  })

  return { form, fieldArray, onSubmit }
}
