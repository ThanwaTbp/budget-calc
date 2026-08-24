'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { useRecurringStore } from '@/features/recurring/store/useRecurringStore'
import { useTransactionStore } from '@/features/transactions/store/useTransactionStore'
import type { TransactionType } from '@/types/finance'
import type { IRecurringItem } from '@/types/recurring'

const recurringFormSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.coerce.number().positive('จำนวนเงินต้องมากกว่า 0'),
  categoryId: z.string().min(1, 'กรุณาเลือกหมวดหมู่'),
  dayOfMonth: z.coerce.number().int().min(1, 'กรุณาเลือกวันที่ของเดือน').max(31, 'วันที่ต้องอยู่ระหว่าง 1-31'),
  note: z.string().max(120, 'หมายเหตุต้องไม่เกิน 120 ตัวอักษร'),
})

// ค่าที่กรอกในฟอร์ม (ก่อนผ่าน zod coerce) กับค่าที่ validate แล้วมีชนิดต่างกันที่ amount/dayOfMonth
type IRecurringFormInput = z.input<typeof recurringFormSchema>
export type IRecurringFormValues = z.output<typeof recurringFormSchema>

// ค่าเริ่มต้นตอนเปิดฟอร์มเพิ่มรายการประจำใหม่: amount เป็นค่าว่างแทน 0 กันผู้ใช้ต้องลบเลข 0 ทิ้งก่อนพิมพ์
function createEmptyFormValues(): IRecurringFormInput {
  return {
    type: 'expense',
    amount: '',
    categoryId: '',
    dayOfMonth: 1,
    note: '',
  }
}

interface IUseRecurringForm {
  open: boolean
  editingItem?: IRecurringItem | null
  onSuccess: () => void
}

// รวม logic ของฟอร์มเพิ่ม/แก้ไขรายการประจำ: validate ด้วย zod และเชื่อมกับ useRecurringStore
// isActive ไม่มีช่องกรอกในฟอร์มนี้ (จัดการแยกผ่านปุ่มเปิด/ปิดใช้งานในลิสต์) รายการใหม่เริ่มต้นเปิดใช้งานเสมอ
// ส่วนรายการที่แก้ไขให้คงสถานะเดิมไว้ ไม่เปลี่ยนผ่านฟอร์มนี้
export function useRecurringForm({ open, editingItem, onSuccess }: IUseRecurringForm) {
  const categories = useTransactionStore((state) => state.categories)
  const onCreate = useRecurringStore((state) => state.onCreate)
  const onUpdate = useRecurringStore((state) => state.onUpdate)

  const form = useForm<IRecurringFormInput, unknown, IRecurringFormValues>({
    resolver: zodResolver(recurringFormSchema),
    defaultValues: createEmptyFormValues(),
  })

  // ต้อง reset ทุกครั้งที่ open เปลี่ยนเป็น true เท่านั้น (ไม่ใช้ editingItem เป็น trigger เดี่ยวๆ
  // เพราะกดเพิ่มรายการใหม่ติดกันสองครั้ง editingItem จะเป็น null เหมือนเดิมทั้งคู่ effect จะไม่ทำงาน)
  useEffect(() => {
    if (!open) return

    if (editingItem) {
      form.reset({
        type: editingItem.type,
        amount: editingItem.amount,
        categoryId: editingItem.categoryId,
        dayOfMonth: editingItem.dayOfMonth,
        note: editingItem.note,
      })
    } else {
      form.reset(createEmptyFormValues())
    }
  }, [open, editingItem, form])

  const selectedType = useWatch({ control: form.control, name: 'type' })

  const filteredCategories = useMemo(
    () => categories.filter((category) => category.type === selectedType),
    [categories, selectedType],
  )

  // เปลี่ยนประเภทแล้วหมวดหมู่เดิมไม่ตรงกับประเภทใหม่ ให้ล้างหมวดหมู่เพื่อบังคับเลือกใหม่
  const onTypeChange = (nextType: TransactionType) => {
    const currentCategoryId = form.getValues('categoryId')
    const isCategoryStillValid = categories.some(
      (category) => category.id === currentCategoryId && category.type === nextType,
    )

    form.setValue('type', nextType)
    if (!isCategoryStillValid) {
      form.setValue('categoryId', '')
    }
  }

  const onSubmit = form.handleSubmit((values) => {
    const input = { ...values, isActive: editingItem ? editingItem.isActive : true }

    if (editingItem) {
      onUpdate(editingItem.id, input)
    } else {
      onCreate(input)
    }

    onSuccess()
  })

  return { form, filteredCategories, selectedType, onTypeChange, onSubmit }
}
