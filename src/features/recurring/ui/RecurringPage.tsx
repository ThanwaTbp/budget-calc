'use client'

import { useState } from 'react'
import { Plus, Repeat } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { PageHeader } from '@/components/common/PageHeader'
import { useHydrated } from '@/hooks/useHydrated'
import { useRecurringBoard } from '@/features/recurring/hooks/useRecurringBoard'
import { DueAlertPanel } from '@/features/recurring/ui/DueAlertPanel'
import { RecurringDialog } from '@/features/recurring/ui/RecurringDialog'
import { RecurringList } from '@/features/recurring/ui/RecurringList'
import type { IRecurringItem } from '@/types/recurring'
import { formatCurrency } from '@/utils/format'
import { cn } from '@/lib/utils'

export function RecurringPage() {
  const isHydrated = useHydrated()
  const {
    items,
    dueItems,
    totalDueAmount,
    monthlyIncomeTotal,
    monthlyExpenseTotal,
    monthlyBalance,
    todayIsoDate,
    hasAnyItem,
    onPostItem,
    onPostAllDue,
  } = useRecurringBoard()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<IRecurringItem | null>(null)

  const onCreateItem = () => {
    setEditingItem(null)
    setIsDialogOpen(true)
  }

  const onEditItem = (item: IRecurringItem) => {
    setEditingItem(item)
    setIsDialogOpen(true)
  }

  const onDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open)
    if (!open) setEditingItem(null)
  }

  if (!isHydrated) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="รายการประจำ" description="ตั้งบิลที่ต้องจ่ายหรือรับทุกเดือน แล้วลงรายการได้ในคลิกเดียว">
        <Button size="lg" onClick={onCreateItem}>
          <Plus />
          เพิ่มรายการประจำ
        </Button>
      </PageHeader>

      <DueAlertPanel dueItems={dueItems} totalDueAmount={totalDueAmount} onPostAllDue={onPostAllDue} />

      {hasAnyItem ? (
        <>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-2 rounded-lg border border-border bg-muted/40 px-5 py-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm text-muted-foreground">รายรับประจำ / เดือน</span>
              <span className="tabular text-base font-semibold text-income">
                {formatCurrency(monthlyIncomeTotal)}
              </span>
            </div>

            <div className="flex flex-col gap-0.5">
              <span className="text-sm text-muted-foreground">รายจ่ายประจำ / เดือน</span>
              <span className="tabular text-base font-semibold text-expense">
                {formatCurrency(monthlyExpenseTotal)}
              </span>
            </div>

            <div className="flex flex-col gap-0.5">
              <span className="text-sm text-muted-foreground">คงเหลือ / เดือน</span>
              <span
                className={cn(
                  'tabular text-base font-semibold',
                  monthlyBalance >= 0 ? 'text-income' : 'text-expense',
                )}
              >
                {formatCurrency(monthlyBalance)}
              </span>
            </div>
          </div>

          <RecurringList items={items} todayIsoDate={todayIsoDate} onPostItem={onPostItem} onEditItem={onEditItem} />
        </>
      ) : (
        <EmptyState
          icon={Repeat}
          title="ยังไม่มีรายการประจำ"
          description="เพิ่มบิลที่ต้องจ่ายหรือรับทุกเดือน แล้วให้ระบบช่วยเตือนเมื่อถึงกำหนดลงรายการ"
        >
          <Button onClick={onCreateItem}>
            <Plus />
            เพิ่มรายการประจำแรก
          </Button>
        </EmptyState>
      )}

      <RecurringDialog open={isDialogOpen} onOpenChange={onDialogOpenChange} editingItem={editingItem} />
    </div>
  )
}
