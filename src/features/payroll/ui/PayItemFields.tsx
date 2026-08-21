'use client'

import { Minus, Plus, Trash2 } from 'lucide-react'
import { Controller, useWatch } from 'react-hook-form'
import type { UseFieldArrayReturn, UseFormReturn } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type {
  IPayrollEntryFormInput,
  IPayrollEntryFormValues,
} from '@/features/payroll/hooks/usePayrollEntryForm'
import { DEDUCTION_ITEM_OPTIONS, EARNING_ITEM_OPTIONS } from '@/constants/payroll'
import { cn } from '@/lib/utils'
import type { PayItemKind } from '@/types/finance'
import { formatCurrency } from '@/utils/format'

interface IPayItemFields {
  form: UseFormReturn<IPayrollEntryFormInput, unknown, IPayrollEntryFormValues>
  fieldArray: UseFieldArrayReturn<IPayrollEntryFormInput, 'items'>
}

// ตัวเลือกชื่อรายการต่อกลุ่ม กันผู้ใช้เลือกชื่อรายการหักไปใส่ในกลุ่มจ่ายเพิ่มหรือกลับกัน
const GROUP_OPTIONS: Record<PayItemKind, string[]> = {
  earning: EARNING_ITEM_OPTIONS,
  deduction: DEDUCTION_ITEM_OPTIONS,
}

const GROUP_META: Record<
  PayItemKind,
  { title: string; addLabel: string; emptyLabel: string; icon: typeof Plus; tone: string }
> = {
  earning: {
    title: 'รายการจ่ายเพิ่ม',
    addLabel: 'เพิ่มรายการจ่าย',
    emptyLabel: 'ยังไม่มีรายการจ่ายเพิ่ม',
    icon: Plus,
    tone: 'text-income',
  },
  deduction: {
    title: 'รายการหัก',
    addLabel: 'เพิ่มรายการหัก',
    emptyLabel: 'ยังไม่มีรายการหัก',
    icon: Minus,
    tone: 'text-expense',
  },
}

interface IPayItemGroup {
  form: UseFormReturn<IPayrollEntryFormInput, unknown, IPayrollEntryFormValues>
  fieldArray: UseFieldArrayReturn<IPayrollEntryFormInput, 'items'>
  kind: PayItemKind
  groupTotal: number
}

// การ์ดรายการเงินหนึ่งกลุ่ม (จ่ายเพิ่ม/หัก) แสดงเฉพาะบรรทัดของ kind นั้น
// index ที่ใช้ register/remove ยังเป็น index จริงใน items array เดียวกันเสมอ (ไม่ใช่ index ของกลุ่มที่กรองแล้ว)
// ไม่งั้นกดลบ/แก้บรรทัดในกลุ่มหนึ่งจะไปโดนบรรทัดผิดของอีกกลุ่ม
function PayItemGroup({ form, fieldArray, kind, groupTotal }: IPayItemGroup) {
  const {
    register,
    control,
    formState: { errors },
  } = form
  const { fields, append, remove } = fieldArray
  const meta = GROUP_META[kind]
  const GroupIcon = meta.icon

  const groupRows = fields
    .map((field, index) => ({ field, index }))
    .filter(({ field }) => field.kind === kind)

  const onAppendItem = () => {
    append({ label: '', amount: '', kind })
  }

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className={cn('flex items-center gap-1.5 text-sm font-medium', meta.tone)}>
          <GroupIcon className="size-4" />
          {meta.title}
        </div>
        <span className={cn('tabular text-sm font-semibold', meta.tone)}>{formatCurrency(groupTotal)}</span>
      </div>

      {groupRows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{meta.emptyLabel}</p>
      ) : (
        <div className="flex max-h-72 flex-col gap-2 overflow-y-auto">
          {groupRows.map(({ field, index }) => {
            const itemErrors = errors.items?.[index]

            return (
              <div key={field.id} className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Controller
                      control={control}
                      name={`items.${index}.label`}
                      render={({ field: labelField }) => (
                        <Select value={labelField.value} onValueChange={labelField.onChange}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="เลือกรายการ" />
                          </SelectTrigger>
                          <SelectContent>
                            {GROUP_OPTIONS[kind].map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="w-28 text-right tabular"
                    {...register(`items.${index}.amount`)}
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                    <Trash2 className="size-4" />
                    <span className="sr-only">ลบรายการ</span>
                  </Button>
                </div>
                {(itemErrors?.label || itemErrors?.amount) && (
                  <p className="text-sm text-destructive">
                    {itemErrors?.label?.message ?? itemErrors?.amount?.message}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}

      <Button type="button" variant="outline" size="sm" onClick={onAppendItem} className="mt-3 self-start">
        <Plus />
        {meta.addLabel}
      </Button>
    </div>
  )
}

// ส่วนแก้รายการเงินของรอบจ่าย แยกเป็น 2 กลุ่มชัดเจน: รายการจ่ายเพิ่ม (earning) กับรายการหัก (deduction)
// ใช้ useFieldArray เดียวกันชื่อ items เหมือนเดิม (store/schema ไม่เปลี่ยน) แค่กรองแสดงตาม kind ตอน render
export function PayItemFields({ form, fieldArray }: IPayItemFields) {
  const watchedItems = useWatch({ control: form.control, name: 'items' })

  const earningTotal = watchedItems.reduce(
    (total, item) => (item.kind === 'earning' ? total + (Number(item.amount) || 0) : total),
    0,
  )
  const deductionTotal = watchedItems.reduce(
    (total, item) => (item.kind === 'deduction' ? total + (Number(item.amount) || 0) : total),
    0,
  )

  return (
    <div className="flex flex-col gap-4">
      <PayItemGroup form={form} fieldArray={fieldArray} kind="earning" groupTotal={earningTotal} />
      <PayItemGroup form={form} fieldArray={fieldArray} kind="deduction" groupTotal={deductionTotal} />
    </div>
  )
}
