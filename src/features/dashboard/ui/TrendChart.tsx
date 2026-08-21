'use client'

import { ChartArea } from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { TooltipContentProps, TooltipValueType } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmptyState } from '@/components/common/EmptyState'
import type { ITrendPoint } from '@/features/dashboard/hooks/useDashboardData'
import { PERIOD_OPTIONS, type PeriodGranularity } from '@/utils/period'
import { formatCompactCurrency, formatCurrency } from '@/utils/format'

interface ITrendChart {
  trendPoints: ITrendPoint[]
  granularity: PeriodGranularity
  onGranularityChange: (granularity: PeriodGranularity) => void
}

const axisTickStyle = { fill: 'var(--color-muted-foreground)', fontSize: 14 }

// ป้ายกำกับหน่วยของแต่ละช่วงเวลา ใช้ต่อกับจำนวนช่วงที่แสดงในคำอธิบายการ์ด
const granularityUnitLabel: Record<PeriodGranularity, string> = {
  day: 'วัน',
  month: 'เดือน',
  year: 'ปี',
}

export function TrendChart({ trendPoints, granularity, onGranularityChange }: ITrendChart) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>แนวโน้มรายรับ-รายจ่าย</CardTitle>
          <CardDescription>8{granularityUnitLabel[granularity]}ล่าสุด</CardDescription>
        </div>

        <Tabs
          value={granularity}
          onValueChange={(value) => onGranularityChange(value as PeriodGranularity)}
        >
          <TabsList>
            {PERIOD_OPTIONS.map((option) => (
              <TabsTrigger key={option.value} value={option.value}>
                {option.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {trendPoints.length === 0 ? (
          <EmptyState
            icon={ChartArea}
            title="ยังไม่มีข้อมูลแนวโน้ม"
            description="บันทึกรายรับรายจ่ายเพื่อดูแนวโน้มตามช่วงเวลาที่นี่"
          />
        ) : (
          <div className="h-75 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendPoints}>
                <defs>
                  <linearGradient id="dashboardIncomeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="dashboardExpenseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-chart-2)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="var(--color-chart-2)" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={axisTickStyle} />
                <YAxis
                  tickFormatter={(value: number) => formatCompactCurrency(value)}
                  tickLine={false}
                  axisLine={false}
                  tick={axisTickStyle}
                />
                <Tooltip content={TrendChartTooltip} />
                <Legend formatter={(value) => (value === 'income' ? 'รายรับ' : 'รายจ่าย')} />

                <Area
                  type="monotone"
                  dataKey="income"
                  name="income"
                  stroke="var(--color-chart-1)"
                  strokeWidth={2}
                  fill="url(#dashboardIncomeGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  name="expense"
                  stroke="var(--color-chart-2)"
                  strokeWidth={2}
                  fill="url(#dashboardExpenseGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// แปลงค่าจาก payload ของ recharts (อาจเป็น number/string/array) ให้เป็นตัวเลขเสมอ
function toNumericValue(value: TooltipValueType | undefined): number {
  return typeof value === 'number' ? value : Number(value ?? 0)
}

// tooltip แบบกำหนดเอง ห้ามใช้ default ของ recharts เพราะพื้นขาวไม่รองรับ dark mode
function TrendChartTooltip({ active, label, payload }: TooltipContentProps<TooltipValueType, string | number>) {
  if (!active || !payload || payload.length === 0) return null

  const incomeEntry = payload.find((entry) => entry.dataKey === 'income')
  const expenseEntry = payload.find((entry) => entry.dataKey === 'expense')

  return (
    <div className="rounded-lg border border-border bg-popover p-3 text-base shadow-md">
      <p className="mb-2 font-semibold text-popover-foreground">{label}</p>
      <div className="flex flex-col gap-1">
        <p className="flex items-center justify-between gap-4 text-income">
          <span>รายรับ</span>
          <span className="tabular font-semibold">{formatCurrency(toNumericValue(incomeEntry?.value))}</span>
        </p>
        <p className="flex items-center justify-between gap-4 text-expense">
          <span>รายจ่าย</span>
          <span className="tabular font-semibold">{formatCurrency(toNumericValue(expenseEntry?.value))}</span>
        </p>
      </div>
    </div>
  )
}
