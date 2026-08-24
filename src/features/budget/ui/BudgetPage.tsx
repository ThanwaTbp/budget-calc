'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { PageHeader } from '@/components/common/PageHeader'
import { useHydrated } from '@/hooks/useHydrated'
import { useBudgetBoard } from '@/features/budget/hooks/useBudgetBoard'
import { BudgetCategoryCard } from '@/features/budget/ui/BudgetCategoryCard'
import { BudgetDialog } from '@/features/budget/ui/BudgetDialog'
import { BudgetSummaryBar } from '@/features/budget/ui/BudgetSummaryBar'
import { CategoryIcon } from '@/features/transactions/ui/CategoryIcon'
import type { IBudget } from '@/types/budget'

export function BudgetPage() {
  const isHydrated = useHydrated()
  const {
    monthLabel,
    usages,
    totals,
    expenseCategories,
    budgets,
    unbudgetedCategories,
    onPrevMonth,
    onNextMonth,
    onCurrentMonth,
  } = useBudgetBoard()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<IBudget | null>(null)
  const [defaultCategoryId, setDefaultCategoryId] = useState('')

  const onCreateBudgetClick = () => {
    setEditingBudget(null)
    setDefaultCategoryId('')
    setIsDialogOpen(true)
  }

  // กดจากรายการ 'หมวดที่ใช้เงินแล้วแต่ยังไม่ได้ตั้งงบ' ให้เปิด dialog พร้อมเลือกหมวดนั้นไว้ล่วงหน้า
  const onSuggestBudget = (categoryId: string) => {
    setEditingBudget(null)
    setDefaultCategoryId(categoryId)
    setIsDialogOpen(true)
  }

  const onEditBudget = (budget: IBudget) => {
    setEditingBudget(budget)
    setDefaultCategoryId('')
    setIsDialogOpen(true)
  }

  const onDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open)
    if (!open) setEditingBudget(null)
  }

  if (!isHydrated) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-40 w-full" />
          ))}
        </div>
      </div>
    )
  }

  const getCategory = (categoryId: string) => expenseCategories.find((category) => category.id === categoryId)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="งบประมาณ" description="ตั้งวงเงินรายเดือนต่อหมวด แล้วดูว่าใช้ไปเท่าไหร่แล้ว">
        <Button size="lg" onClick={onCreateBudgetClick}>
          <Plus />
          ตั้งงบประมาณ
        </Button>
      </PageHeader>

      <div className="flex items-center justify-center gap-3">
        <Button variant="outline" size="icon" onClick={onPrevMonth} aria-label="เดือนก่อนหน้า">
          <ChevronLeft />
        </Button>
        <span className="min-w-40 text-center text-base font-semibold">{monthLabel}</span>
        <Button variant="outline" size="icon" onClick={onNextMonth} aria-label="เดือนถัดไป">
          <ChevronRight />
        </Button>
        <Button variant="outline" onClick={onCurrentMonth}>
          เดือนนี้
        </Button>
      </div>

      <BudgetSummaryBar totals={totals} monthLabel={monthLabel} />

      {budgets.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="ยังไม่มีงบประมาณ"
          description="ตั้งวงเงินรายเดือนต่อหมวดรายจ่าย เพื่อช่วยควบคุมการใช้จ่ายของคุณ"
        >
          <Button size="lg" onClick={onCreateBudgetClick}>
            <Plus />
            ตั้งงบประมาณแรก
          </Button>
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {usages.map((usage) => {
            const budget = budgets.find((item) => item.categoryId === usage.categoryId)
            const category = getCategory(usage.categoryId)
            if (!budget || !category) return null

            return (
              <BudgetCategoryCard key={budget.id} category={category} usage={usage} budget={budget} onEdit={onEditBudget} />
            )
          })}
        </div>
      )}

      {unbudgetedCategories.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-muted-foreground">หมวดที่ใช้เงินแล้วแต่ยังไม่ได้ตั้งงบ</p>
          <div className="flex flex-col gap-2">
            {unbudgetedCategories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => onSuggestBudget(category.id)}
                className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-border px-4 py-3 text-left text-sm transition-colors hover:border-primary hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <CategoryIcon icon={category.icon} />
                  <span className="truncate">{category.name}</span>
                </span>
                <span className="shrink-0 text-muted-foreground">ตั้งงบให้หมวดนี้</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <BudgetDialog
        open={isDialogOpen}
        onOpenChange={onDialogOpenChange}
        editingBudget={editingBudget}
        defaultCategoryId={defaultCategoryId}
      />
    </div>
  )
}
