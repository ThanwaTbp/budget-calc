'use client'

import { ChartPie } from 'lucide-react'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/common/EmptyState'
import { cn } from '@/lib/utils'
import type { IExpenseCategorySlice } from '@/features/dashboard/hooks/useDashboardData'
import { formatCurrency, formatNumber } from '@/utils/format'

interface IExpenseBreakdown {
  expenseByCategory: IExpenseCategorySlice[]
}

// ต้องเขียน class ตรงๆ แบบสถิต (ไม่ใช่ template string) เพื่อให้ Tailwind สแกนเจอตอน build
const chartTokenDotClassMap: Record<string, string> = {
  'chart-1': 'bg-[var(--color-chart-1)]',
  'chart-2': 'bg-[var(--color-chart-2)]',
  'chart-3': 'bg-[var(--color-chart-3)]',
  'chart-4': 'bg-[var(--color-chart-4)]',
  'chart-5': 'bg-[var(--color-chart-5)]',
  'muted-foreground': 'bg-muted-foreground',
}

export function ExpenseBreakdown({ expenseByCategory }: IExpenseBreakdown) {
  const totalExpense = expenseByCategory.reduce((total, slice) => total + slice.total, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>สัดส่วนรายจ่าย</CardTitle>
      </CardHeader>
      <CardContent>
        {expenseByCategory.length === 0 ? (
          <EmptyState
            icon={ChartPie}
            title="ยังไม่มีข้อมูลรายจ่าย"
            description="บันทึกรายจ่ายเพื่อดูสัดส่วนตามหมวดหมู่ที่นี่"
          />
        ) : (
          <div className="flex flex-col gap-4">
            <div className="h-55 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseByCategory}
                    dataKey="total"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {expenseByCategory.map((slice) => (
                      <Cell key={slice.name} fill={`var(--color-${slice.chartToken})`} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <ul className="flex flex-col gap-2">
              {expenseByCategory.map((slice) => {
                const ratio = totalExpense === 0 ? 0 : (slice.total / totalExpense) * 100

                return (
                  <li key={slice.name} className="flex items-center justify-between gap-3 text-base">
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        className={cn(
                          'size-3 shrink-0 rounded-full',
                          chartTokenDotClassMap[slice.chartToken] ?? 'bg-muted-foreground',
                        )}
                      />
                      <span className="truncate text-muted-foreground">{slice.name}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="tabular font-semibold">{formatCurrency(slice.total)}</span>
                      <span className="tabular w-12 text-right text-sm text-muted-foreground">
                        {formatNumber(Math.round(ratio))}%
                      </span>
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
