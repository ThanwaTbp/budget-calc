'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { useTransactionStore } from '@/features/transactions/store/useTransactionStore'
import type { ITransaction, TransactionType } from '@/types/finance'
import { getTodayDateString } from '@/utils/date'

const transactionFormSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.coerce.number().positive('จำนวนเงินต้องมากกว่า 0'),
  categoryId: z.string().min(1, 'กรุณาเลือกหมวดหมู่'),
  date: z.string().min(1, 'กรุณาเลือกวันที่'),
  note: z.string().max(120, 'บันทึกช่วยจำต้องไม่เกิน 120 ตัวอักษร'),
})

// ค่าที่กรอกในฟอร์ม (ก่อนผ่าน zod coerce) กับค่าที่ validate แล้วมีชนิดต่างกันที่ amount
// จึงต้องแยก type input/output ให้ตรงกับที่ zodResolver คืนมา
type ITransactionFormInput = z.input<typeof transactionFormSchema>
export type ITransactionFormValues = z.output<typeof transactionFormSchema>

// สร้างค่าเริ่มต้นของฟอร์มใหม่ (ใช้ทั้งตอน mount ครั้งแรกและตอนกดเพิ่มรายการใหม่)
// amount เป็นค่าว่างแทน 0 เพื่อไม่ให้ผู้ใช้ต้องลบเลข 0 ทิ้งก่อนพิมพ์ทุกครั้ง
function createEmptyFormValues(): ITransactionFormInput {
  return {
    type: 'expense',
    amount: '',
    categoryId: '',
    date: getTodayDateString(),
    note: '',
  }
}

interface IUseTransactionForm {
  open: boolean
  editingTransaction?: ITransaction | null
  onSuccess: () => void
}

// รวม logic ของฟอร์มเพิ่ม/แก้ไขรายการ: validate ด้วย zod และเชื่อมกับ store
export function useTransactionForm({ open, editingTransaction, onSuccess }: IUseTransactionForm) {
  const categories = useTransactionStore((state) => state.categories)
  const onCreate = useTransactionStore((state) => state.onCreate)
  const onUpdate = useTransactionStore((state) => state.onUpdate)

  const form = useForm<ITransactionFormInput, unknown, ITransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: createEmptyFormValues(),
  })

  // เปิดฟอร์มแก้ไขให้เติมค่าจากรายการเดิม เปิดฟอร์มเพิ่มใหม่ให้รีเซ็ตเป็นค่าว่าง
  // ต้อง reset ทุกครั้งที่ open เปลี่ยนเป็น true เท่านั้น (ไม่ใช้ editingTransaction เป็น trigger เดี่ยวๆ
  // เพราะกดเพิ่มรายการใหม่ติดกันสองครั้ง editingTransaction จะเป็น null เหมือนเดิมทั้งคู่ effect จะไม่ทำงาน)
  // ตอนปิด dialog ไม่ reset เพื่อไม่ให้ค่าฟอร์มกระพริบระหว่าง animation ปิด
  useEffect(() => {
    if (!open) return

    if (editingTransaction) {
      form.reset({
        type: editingTransaction.type,
        amount: editingTransaction.amount,
        categoryId: editingTransaction.categoryId,
        date: editingTransaction.date,
        note: editingTransaction.note,
      })
    } else {
      form.reset(createEmptyFormValues())
    }
  }, [open, editingTransaction, form])

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
    if (editingTransaction) {
      onUpdate(editingTransaction.id, values)
    } else {
      onCreate(values)
    }
    onSuccess()
  })

  return { form, filteredCategories, selectedType, onTypeChange, onSubmit }
}
