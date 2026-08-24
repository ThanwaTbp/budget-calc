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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useConfirm } from '@/components/common/ConfirmProvider'
import { CategoryIcon } from '@/features/transactions/ui/CategoryIcon'
import { useRecurringForm } from '@/features/recurring/hooks/useRecurringForm'
import type { TransactionType } from '@/types/finance'
import type { IRecurringItem } from '@/types/recurring'

interface IRecurringDialog {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingItem?: IRecurringItem | null
}

// วันที่ของเดือนให้เลือกได้ 1-31 (เดือนที่ไม่มีวันนั้นระบบจะใช้วันสุดท้ายของเดือนแทนตอนลงรายการจริง)
const dayOfMonthOptions = Array.from({ length: 31 }, (_, index) => index + 1)

export function RecurringDialog({ open, onOpenChange, editingItem }: IRecurringDialog) {
  const confirm = useConfirm()

  const { form, filteredCategories, selectedType, onTypeChange, onSubmit } = useRecurringForm({
    open,
    editingItem,
    onSuccess: () => {
      onOpenChange(false)
      toast.success(editingItem ? 'แก้ไขรายการประจำเรียบร้อยแล้ว' : 'เพิ่มรายการประจำเรียบร้อยแล้ว')
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
      description: 'ข้อมูลรายการประจำที่กรอกไว้จะหายไปทันทีหากปิดตอนนี้',
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
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{editingItem ? 'แก้ไขรายการประจำ' : 'เพิ่มรายการประจำ'}</DialogTitle>
          <DialogDescription>ตั้งบิลที่เกิดซ้ำทุกเดือนวันเดิม ระบบจะช่วยเตือนให้ลงรายการเมื่อถึงกำหนด</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <DialogBody className="flex flex-col gap-4">
            <Tabs value={selectedType} onValueChange={(value) => onTypeChange(value as TransactionType)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="income">รายรับ</TabsTrigger>
                <TabsTrigger value="expense">รายจ่าย</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="amount">จำนวนเงิน</Label>
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

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="dayOfMonth">วันที่ของเดือน</Label>
                <Controller
                  control={control}
                  name="dayOfMonth"
                  render={({ field }) => (
                    <Select value={String(field.value)} onValueChange={(value) => field.onChange(Number(value))}>
                      <SelectTrigger id="dayOfMonth" className="w-full">
                        <SelectValue placeholder="เลือกวันที่" />
                      </SelectTrigger>
                      <SelectContent>
                        {dayOfMonthOptions.map((day) => (
                          <SelectItem key={day} value={String(day)}>
                            วันที่ {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <p className="text-xs text-muted-foreground">เดือนที่ไม่มีวันนี้จะใช้วันสุดท้ายของเดือนแทน</p>
                {errors.dayOfMonth && <p className="text-sm text-destructive">{errors.dayOfMonth.message}</p>}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="categoryId">หมวดหมู่</Label>
              <Controller
                control={control}
                name="categoryId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="categoryId" className="w-full">
                      <SelectValue placeholder="เลือกหมวดหมู่" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredCategories.map((category) => (
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
              <Label htmlFor="note">หมายเหตุ</Label>
              <Textarea id="note" rows={2} placeholder="เช่น ค่าเช่าออฟฟิศประจำเดือน" {...register('note')} />
              {errors.note && <p className="text-sm text-destructive">{errors.note.message}</p>}
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
