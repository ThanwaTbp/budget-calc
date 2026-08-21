import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface IStatCard {
  label: string
  value: string
  icon: LucideIcon
  tone?: 'default' | 'income' | 'expense' | 'warning'
  hint?: string
}

const toneClassMap: Record<NonNullable<IStatCard['tone']>, string> = {
  default: 'bg-accent text-accent-foreground',
  income: 'bg-income-muted text-income',
  expense: 'bg-expense-muted text-expense',
  warning: 'bg-warning-muted text-warning',
}

export function StatCard({ label, value, icon: Icon, tone = 'default', hint }: IStatCard) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{label}</p>
          <span className={cn('flex size-10 items-center justify-center rounded-full', toneClassMap[tone])}>
            <Icon className="size-4.5" />
          </span>
        </div>
        <p className="tabular text-2xl font-semibold tracking-tight">{value}</p>
        {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  )
}
