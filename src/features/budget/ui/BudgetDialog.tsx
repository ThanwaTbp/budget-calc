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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useConfirm } from '@/components/common/ConfirmProvider'
import { CategoryIcon } from '@/features/transactions/ui/CategoryIcon'
import { useTransactionStore } from '@/features/transactions/store/useTransactionStore'
import { useBudgetForm } from '@/features/budget/hooks/useBudgetForm'
import type { IBudget } from '@/types/budget'

interface IBudgetDialog {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingBudget?: IBudget | null
  defaultCategoryId?: string
}

// ฟอร์มตั้ง/แก้วงเงินงบประมาณของหมวดรายจ่ายหนึ่งหมวด
export function BudgetDialog({ open, onOpenChange, editingBudget, defaultCategoryId }: IBudgetDialog) {
  const confirm = useConfirm()
  const categories = useTransactionStore((state) => state.categories)
  const expenseCategories = categories.filter((category) => category.type === 'expense')

  const { form, onSubmit } = useBudgetForm({
    open,
    editingBudget,
    defaultCategoryId,
    onSuccess: () => {
      onOpenChange(false)
      toast.success('บันทึกงบประมาณเรียบร้อยแล้ว')
    },
  })

  const {
    register,
    control,
    formState: { errors, isDirty },
  } = form

  // ปิด/ยกเลิกฟอร์มขณะมีข้อมูลกรอกค้างไว้ (isDirty) ต้องให้ผู้ใช้ยืนยันก่อนเสมอ กันข้อมูลหายโดยไม่ตั้งใจ
  const onRequestClose = async () => {
    if (!isDirty) {
      onOpenChange(false)
      return
    }

    const isConfirmed = await confirm({
      title: 'ทิ้งข้อมูลที่กรอกไว้?',
      description: 'ข้อมูลที่กรอกไว้จะหายไปทันทีหากปิดตอนนี้',
      confirmLabel: 'ทิ้งข้อมูล',
      tone: 'warning',
    })
    if (!isConfirmed) return

    onOpenChange(false)
    toast.info('ยกเลิกแล้ว')
  }

  const onDialogOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      onOpenChange(true)
      return
    }
    onRequestClose()
  }

  return (
    <Dialog open={open} onOpenChange={onDialogOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editingBudget ? 'แก้ไขงบประมาณ' : 'ตั้งงบประมาณ'}</DialogTitle>
          <DialogDescription>กำหนดวงเงินรายเดือนของหมวดรายจ่าย ใช้ซ้ำได้ทุกเดือนโดยไม่ต้องตั้งใหม่</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <DialogBody className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="categoryId">หมวดรายจ่าย</Label>
              <Controller
                control={control}
                name="categoryId"
                render={({ field }) => (
                  // แก้ไขงบที่มีอยู่แล้วต้องล็อกหมวดไว้ ป้องกันสลับหมวดจนกลายเป็นตั้งงบซ้อนโดยไม่ตั้งใจ
                  <Select value={field.value} onValueChange={field.onChange} disabled={Boolean(editingBudget)}>
                    <SelectTrigger id="categoryId" className="w-full">
                      <SelectValue placeholder="เลือกหมวดรายจ่าย" />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <CategoryIcon icon={category.icon} />
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.categoryId && <p className="text-sm text-destructive">{errors.categoryId.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="amount">วงเงินต่อเดือน</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base text-muted-foreground">
                  ฿
                </span>
                <Input
                  id="amount"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  className="h-10 pl-7 text-base"
                  {...register('amount')}
                />
              </div>
              {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
            </div>
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="outline" size="lg" onClick={onRequestClose}>
              ยกเลิก
            </Button>
            <Button type="submit" size="lg">
              บันทึก
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
