'use client'

import { useState } from 'react'
import { CalendarOff, Plus, ReceiptText, SearchX, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { PageHeader } from '@/components/common/PageHeader'
import { StatCard } from '@/components/common/StatCard'
import { useHydrated } from '@/hooks/useHydrated'
import { useTransactionList } from '@/features/transactions/hooks/useTransactionList'
import { PeriodSection } from '@/features/transactions/ui/PeriodSection'
import { TransactionDialog } from '@/features/transactions/ui/TransactionDialog'
import { TransactionFilters } from '@/features/transactions/ui/TransactionFilters'
import { TransactionPeriodToolbar } from '@/features/transactions/ui/TransactionPeriodToolbar'
import type { ITransaction } from '@/types/finance'
import { formatCurrency } from '@/utils/format'

export function TransactionPage() {
  const isHydrated = useHydrated()
  const {
    transactions,
    categories,
    filter,
    yearOptions,
    yearValue,
    onYearChange,
    monthOptions,
    monthValue,
    onMonthChange,
    periodLabel,
    periodTransactionCount,
    summary,
    periodGroups,
    visiblePeriodGroups,
    hasMorePeriodGroups,
    isFilterActive,
    onFilterChange,
    onResetFilter,
    onShowMorePeriods,
  } = useTransactionList()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<ITransaction | null>(null)

  const onCreateClick = () => {
    setEditingTransaction(null)
    setIsDialogOpen(true)
  }

  const onEditTransaction = (transaction: ITransaction) => {
    setEditingTransaction(transaction)
    setIsDialogOpen(true)
  }

  const onDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open)
    if (!open) setEditingTransaction(null)
  }

  if (!isHydrated) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-16 w-full" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  // ช่วงเวลาที่เลือกไม่มีรายการเลย (ต่างจากกรณีมีรายการแต่ตัวกรองรายการไม่ตรง)
  const hasEmptyPeriod = transactions.length > 0 && periodTransactionCount === 0

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="รายรับ-รายจ่าย" description="บันทึกและติดตามกระแสเงินสดของคุณ">
        <Button size="lg" onClick={onCreateClick}>
          <Plus />
          เพิ่มรายการ
        </Button>
      </PageHeader>

      {transactions.length === 0 ? (
        <EmptyState
          icon={ReceiptText}
          title="ยังไม่มีรายการ"
          description="เริ่มต้นด้วยการบันทึกรายรับหรือรายจ่ายรายการแรกของคุณ"
        >
          <Button size="lg" onClick={onCreateClick}>
            <Plus />
            เพิ่มรายการแรก
          </Button>
        </EmptyState>
      ) : (
        <>
          <TransactionPeriodToolbar
            yearOptions={yearOptions}
            yearValue={yearValue}
            onYearChange={onYearChange}
            monthOptions={monthOptions}
            monthValue={monthValue}
            onMonthChange={onMonthChange}
          />

          <p className="text-sm text-muted-foreground">กำลังดู {periodLabel}</p>

          {hasEmptyPeriod ? (
            <EmptyState
              icon={CalendarOff}
              title={`ไม่มีรายการใน${periodLabel}`}
              description="ลองเลือกปีหรือเดือนอื่น หรือเพิ่มรายการใหม่ในช่วงเวลานี้"
            >
              <Button size="lg" onClick={onCreateClick}>
                <Plus />
                เพิ่มรายการ
              </Button>
            </EmptyState>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <StatCard
                  label="รายรับรวม"
                  value={formatCurrency(summary.totalIncome)}
                  icon={TrendingUp}
                  tone="income"
                />
                <StatCard
                  label="รายจ่ายรวม"
                  value={formatCurrency(summary.totalExpense)}
                  icon={TrendingDown}
                  tone="expense"
                />
                <StatCard
                  label="คงเหลือ"
                  value={formatCurrency(summary.balance)}
                  icon={Wallet}
                  tone={summary.balance >= 0 ? 'income' : 'expense'}
                />
              </div>

              <Card>
                <CardContent className="flex flex-col gap-4">
                  <TransactionFilters
                    filter={filter}
                    categories={categories}
                    isFilterActive={isFilterActive}
                    onFilterChange={onFilterChange}
                    onResetFilter={onResetFilter}
                  />

                  {periodGroups.length === 0 ? (
                    <EmptyState
                      icon={SearchX}
                      title="ไม่พบรายการตรงตัวกรอง"
                      description="ลองปรับตัวกรองหรือคำค้นหาใหม่อีกครั้ง"
                    >
                      {isFilterActive && (
                        <Button variant="outline" size="sm" onClick={onResetFilter}>
                          ล้างตัวกรอง
                        </Button>
                      )}
                    </EmptyState>
                  ) : (
                    <div className="flex flex-col gap-6">
                      {visiblePeriodGroups.map((periodGroup) => (
                        <PeriodSection
                          key={periodGroup.periodKey}
                          label={periodGroup.label}
                          transactions={periodGroup.transactions}
                          categories={categories}
                          income={periodGroup.income}
                          expense={periodGroup.expense}
                          balance={periodGroup.balance}
                          onEdit={onEditTransaction}
                        />
                      ))}

                      {hasMorePeriodGroups && (
                        <Button variant="outline" onClick={onShowMorePeriods} className="self-center">
                          แสดงช่วงเวลาเพิ่ม
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}

      <TransactionDialog open={isDialogOpen} onOpenChange={onDialogOpenChange} editingTransaction={editingTransaction} />
    </div>
  )
}
