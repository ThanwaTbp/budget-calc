'use client'

import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import { useConfirm } from '@/components/common/ConfirmProvider'
import { CategoryIcon } from '@/features/transactions/ui/CategoryIcon'
import { useBudgetStore } from '@/features/budget/store/useBudgetStore'
import type { IBudgetUsage } from '@/features/budget/utils/budgetCalc'
import { budgetStatusIndicatorClass, budgetStatusTextClass } from '@/features/budget/utils/budgetStatusStyle'
import type { IBudget } from '@/types/budget'
import type { ICategory } from '@/types/finance'
import { formatCurrency } from '@/utils/format'
import { cn } from '@/lib/utils'

interface IBudgetCategoryCard {
  category: ICategory
  usage: IBudgetUsage
  budget: IBudget
  onEdit: (budget: IBudget) => void
}

// การ์ดแสดงการใช้งบของหมวดหนึ่ง พร้อมแถบความคืบหน้าและเมนูแก้ไข/ลบงบ
export function BudgetCategoryCard({ category, usage, budget, onEdit }: IBudgetCategoryCard) {
  const onDeleteBudget = useBudgetStore((state) => state.onDelete)
  const confirm = useConfirm()

  const isOverBudget = usage.remaining < 0

  const onDeleteClick = async () => {
    const isConfirmed = await confirm({
      title: `ลบงบประมาณของหมวด '${category.name}'?`,
      description: 'วงเงินที่ตั้งไว้จะถูกลบถาวรและกู้คืนไม่ได้',
      confirmLabel: 'ลบเลย',
      tone: 'danger',
    })
    if (!isConfirmed) return

    onDeleteBudget(budget.id)
    toast.success('ลบงบประมาณแล้ว')
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <CategoryIcon icon={category.icon} />
          <span className="truncate font-medium">{category.name}</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(budget)}>
              <Pencil className="size-4" />
              แก้ไข
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={onDeleteClick}>
              <Trash2 className="size-4" />
              ลบ
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-col gap-1.5">
        {/* ตัด Progress ที่ 100 กันล้นกรอบ แต่ตัวเลข % ข้างล่างยังโชว์ค่าจริงที่อาจเกิน 100 */}
        <Progress value={Math.min(usage.usedPercent, 100)} className={budgetStatusIndicatorClass[usage.status]} />
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="truncate text-muted-foreground">
            <span className="tabular">ใช้ไป {formatCurrency(usage.spent)}</span> /{' '}
            <span className="tabular">งบ {formatCurrency(usage.limit)}</span>
          </span>
          <span className={cn('tabular font-semibold', budgetStatusTextClass[usage.status])}>
            {usage.usedPercent}%
          </span>
        </div>
      </div>

      <p className={cn('tabular text-sm', isOverBudget ? 'font-medium text-expense' : 'text-muted-foreground')}>
        {isOverBudget ? `เกินงบ ${formatCurrency(Math.abs(usage.remaining))}` : `เหลือ ${formatCurrency(usage.remaining)}`}
      </p>
    </div>
  )
}
