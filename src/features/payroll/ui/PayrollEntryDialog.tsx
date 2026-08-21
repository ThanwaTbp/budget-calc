'use client'

import { Controller, useWatch } from 'react-hook-form'
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useConfirm } from '@/components/common/ConfirmProvider'
import { DatePicker } from '@/components/common/DatePicker'
import { usePayrollEntryForm } from '@/features/payroll/hooks/usePayrollEntryForm'
import { PayItemFields } from '@/features/payroll/ui/PayItemFields'
import { DEFAULT_AVATAR_TONE_CLASS, getInitials } from '@/features/payroll/utils/employee'
import type { IEmployee, IPayrollEntry } from '@/types/finance'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/utils/format'

interface IPayrollEntryDialog {
  open: boolean
  onOpenChange: (open: boolean) => void
  employees: IEmployee[]
  avatarToneByEmployeeId: Record<string, string>
  defaultEmployeeId?: string
  editingEntry?: IPayrollEntry | null
}

// Dialog สร้าง/แก้ไขรอบจ่าย เลือกพนักงานเป็นฟิลด์แรกของฟอร์ม (เดิมเลือกจากลิสฝั่งซ้ายที่ถูกเอาออกไปแล้ว)
// ใส่รายการเงินได้อิสระหลายบรรทัดแล้วรวมเป็นเงินสุทธิ บันทึกต้องผ่านการยืนยันก่อนเสมอ
// เพราะจะไปสร้าง/แก้รายจ่ายอัตโนมัติในหน้ารายรับ-รายจ่าย
export function PayrollEntryDialog({
  open,
  onOpenChange,
  employees,
  avatarToneByEmployeeId,
  defaultEmployeeId = '',
  editingEntry,
}: IPayrollEntryDialog) {
  const confirm = useConfirm()

  const onConfirmSave = (netPay: number) =>
    confirm({
      title: 'บันทึกรอบจ่ายนี้?',
      description: `ระบบจะบันทึกรายจ่ายอัตโนมัติในหมวด "ค่าจ้างพนักงาน" จำนวน ${formatCurrency(netPay)}`,
      confirmLabel: 'บันทึก',
      tone: 'default',
    })

  const { form, fieldArray, onSubmit } = usePayrollEntryForm({
    open,
    defaultEmployeeId: editingEntry?.employeeId ?? defaultEmployeeId,
    editingEntry,
    onConfirmSave,
    onSuccess: () => {
      onOpenChange(false)
      toast.success(editingEntry ? 'แก้ไขรอบจ่ายเรียบร้อยแล้ว' : 'บันทึกรอบจ่ายเรียบร้อยแล้ว')
    },
  })

  const {
    control,
    register,
    formState: { errors, isDirty },
  } = form

  // ใช้ useWatch แทน form.watch() เพราะ watch() คืนค่าค้างเมื่อใช้ร่วมกับ useFieldArray
  // (React Hook Form ไม่ memoize watch() ให้ ทำให้ยอดรวมสดไม่อัปเดตตามการพิมพ์/เพิ่ม-ลบบรรทัด)
  const watchedItems = useWatch({ control, name: 'items' })

  // สรุปยอดสดจากค่าที่กำลังกรอก ตัวเลขยังไม่ผ่าน zod coerce จึงแปลงเป็นตัวเลขเองก่อนรวม
  const totalEarning = watchedItems.reduce(
    (total, item) => (item.kind === 'earning' ? total + (Number(item.amount) || 0) : total),
    0,
  )
  const totalDeduction = watchedItems.reduce(
    (total, item) => (item.kind === 'deduction' ? total + (Number(item.amount) || 0) : total),
    0,
  )
  const netPay = totalEarning - totalDeduction

  const onCancel = async () => {
    if (isDirty) {
      const isConfirmed = await confirm({
        title: 'ทิ้งข้อมูลที่กรอกไว้?',
        description: 'ข้อมูลรอบจ่ายที่ยังไม่ได้บันทึกจะหายไปทั้งหมด',
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
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{editingEntry ? 'แก้ไขรอบจ่าย' : 'เพิ่มรอบจ่าย'}</DialogTitle>
          <DialogDescription>
            เลือกพนักงานแล้วใส่รายการเงินของรอบนี้ได้อิสระหลายบรรทัด ระบบจะรวมยอดสุทธิให้อัตโนมัติ
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <DialogBody className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="employeeId">พนักงาน</Label>
                <Controller
                  control={control}
                  name="employeeId"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="employeeId" className="w-full">
                        <SelectValue placeholder="เลือกพนักงาน" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((employee) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            <Avatar size="sm">
                              <AvatarFallback
                                className={cn(
                                  avatarToneByEmployeeId[employee.id] ?? DEFAULT_AVATAR_TONE_CLASS,
                                  'text-xs font-semibold',
                                )}
                              >
                                {getInitials(employee.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-base font-semibold text-foreground">{employee.name}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.employeeId && <p className="text-sm text-destructive">{errors.employeeId.message}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="date">วันที่จ่าย</Label>
                <Controller
                  control={control}
                  name="date"
                  render={({ field }) => <DatePicker id="date" value={field.value} onChange={field.onChange} />}
                />
                {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="note">หมายเหตุรอบนี้</Label>
                <Textarea id="note" placeholder="ไม่บังคับ เช่น รอบจ่ายกลางเดือน" {...register('note')} />
                {errors.note && <p className="text-sm text-destructive">{errors.note.message}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>รายการเงิน</Label>
                <PayItemFields form={form} fieldArray={fieldArray} />
                {errors.items?.message && <p className="text-sm text-destructive">{errors.items.message}</p>}
              </div>
            </div>

            <div className="lg:sticky lg:top-0 lg:self-start">
              <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-muted/40 p-4">
                <p className="text-sm font-medium text-foreground">สรุปยอดสด</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">จ่ายเพิ่มรวม</span>
                  <span className="tabular text-income">{formatCurrency(totalEarning)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">หักรวม</span>
                  <span className="tabular text-expense">{formatCurrency(totalDeduction)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-1.5">
                  <span className="text-sm font-medium">เงินสุทธิ</span>
                  <span className="tabular text-base font-semibold text-primary">{formatCurrency(netPay)}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  ยอดนี้จะถูกบันทึกเป็นรายจ่ายหมวด &quot;ค่าจ้างพนักงาน&quot; ให้อัตโนมัติ
                </p>
              </div>
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
