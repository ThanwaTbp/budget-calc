'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useBudgetStore } from '@/features/budget/store/useBudgetStore'
import type { IBudget } from '@/types/budget'

const budgetFormSchema = z.object({
  categoryId: z.string().min(1, 'กรุณาเลือกหมวดรายจ่าย'),
  amount: z.coerce.number().positive('จำนวนเงินต้องมากกว่า 0'),
})

// ค่าที่กรอกในฟอร์ม (ก่อนผ่าน zod coerce) กับค่าที่ validate แล้วมีชนิดต่างกันที่ amount
type IBudgetFormInput = z.input<typeof budgetFormSchema>
export type IBudgetFormValues = z.output<typeof budgetFormSchema>

// สร้างค่าเริ่มต้นของฟอร์มตั้งงบใหม่ amount เป็นค่าว่างแทน 0 กันผู้ใช้ต้องลบเลข 0 ทิ้งก่อนพิมพ์
function createEmptyFormValues(defaultCategoryId: string): IBudgetFormInput {
  return {
    categoryId: defaultCategoryId,
    amount: '',
  }
}

interface IUseBudgetForm {
  open: boolean
  editingBudget?: IBudget | null
  defaultCategoryId?: string
  onSuccess: () => void
}

// รวม logic ของฟอร์มตั้ง/แก้วงเงินงบประมาณ validate ด้วย zod แล้วเชื่อมกับ store
// onUpsert ของ store รองรับทั้งสร้างใหม่และแก้ไขในตัวอยู่แล้ว (หนึ่งหมวดมีได้แค่หนึ่งวงเงิน)
export function useBudgetForm({ open, editingBudget, defaultCategoryId = '', onSuccess }: IUseBudgetForm) {
  const onUpsert = useBudgetStore((state) => state.onUpsert)

  const form = useForm<IBudgetFormInput, unknown, IBudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: createEmptyFormValues(defaultCategoryId),
  })

  // ต้อง reset ทุกครั้งที่ open เปลี่ยนเป็น true เท่านั้น เพื่อไม่ให้ฟอร์มกระพริบระหว่าง animation ปิด
  useEffect(() => {
    if (!open) return

    if (editingBudget) {
      form.reset({ categoryId: editingBudget.categoryId, amount: editingBudget.amount })
    } else {
      form.reset(createEmptyFormValues(defaultCategoryId))
    }
  }, [open, editingBudget, defaultCategoryId, form])

  const onSubmit = form.handleSubmit((values) => {
    onUpsert(values.categoryId, values.amount)
    onSuccess()
  })

  return { form, onSubmit }
}
