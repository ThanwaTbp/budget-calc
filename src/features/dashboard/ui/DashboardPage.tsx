'use client'

import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { PageHeader } from '@/components/common/PageHeader'
import { useHydrated } from '@/hooks/useHydrated'
import { useDashboardData } from '@/features/dashboard/hooks/useDashboardData'
import { SummaryCards } from '@/features/dashboard/ui/SummaryCards'
import { TrendChart } from '@/features/dashboard/ui/TrendChart'
import { ExpenseBreakdown } from '@/features/dashboard/ui/ExpenseBreakdown'
import { RecentTransactions } from '@/features/dashboard/ui/RecentTransactions'
import { TopEmployees } from '@/features/dashboard/ui/TopEmployees'

export function DashboardPage() {
  const hasHydrated = useHydrated()
  const {
    summary,
    trendPoints,
    granularity,
    onGranularityChange,
    expenseByCategory,
    recentTransactions,
    categories,
    topEmployees,
    expenseRatio,
    employeeCount,
    payrollEntryCount,
    hasAnyData,
  } = useDashboardData()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="ภาพรวม" description="สรุปสถานะการเงินและต้นทุนพนักงานของคุณ" />

      {!hasHydrated ? (
        <DashboardPageSkeleton />
      ) : !hasAnyData ? (
        <EmptyState
          icon={Sparkles}
          title="เริ่มต้นใช้งาน Budget Calculate"
          description="ยังไม่มีข้อมูลในระบบ เริ่มจากบันทึกรายรับรายจ่าย หรือเพิ่มพนักงานเพื่อดูภาพรวมการเงินของคุณ"
        >
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild>
              <Link href="/transactions">บันทึกรายรับรายจ่าย</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/payroll">เพิ่มพนักงาน</Link>
            </Button>
          </div>
        </EmptyState>
      ) : (
        <>
          <SummaryCards
            summary={summary}
            expenseRatio={expenseRatio}
            employeeCount={employeeCount}
            payrollEntryCount={payrollEntryCount}
          />

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <TrendChart
                trendPoints={trendPoints}
                granularity={granularity}
                onGranularityChange={onGranularityChange}
              />
            </div>
            <ExpenseBreakdown expenseByCategory={expenseByCategory} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <RecentTransactions transactions={recentTransactions} categories={categories} />
            <TopEmployees employees={topEmployees} />
          </div>
        </>
      )}
    </div>
  )
}

function DashboardPageSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 w-full rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-[380px] w-full rounded-xl lg:col-span-2" />
        <Skeleton className="h-[380px] w-full rounded-xl" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-72 w-full rounded-xl" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    </div>
  )
}
