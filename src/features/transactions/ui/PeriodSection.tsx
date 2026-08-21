'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { MoneyText } from '@/components/common/MoneyText'
import { TransactionTable } from '@/features/transactions/ui/TransactionTable'
import { cn } from '@/lib/utils'
import type { ICategory, ITransaction } from '@/types/finance'

interface IPeriodSection {
  label: string
  transactions: ITransaction[]
  categories: ICategory[]
  income: number
  expense: number
  balance: number
  onEdit: (transaction: ITransaction) => void
}

// หนึ่งกลุ่มเวลา (วัน/เดือน/ปี) แสดงหัวกลุ่มสรุปยอดพร้อมยุบ-ขยายรายการด้านในได้
// หัวกลุ่มทั้งแถบกดได้เพื่อยุบ-ขยาย (ไม่ใช่แค่ไอคอนลูกศร) ให้พื้นที่กดกว้างพอสำหรับผู้ใช้สายตาไม่ดี
export function PeriodSection({ label, transactions, categories, income, expense, balance, onEdit }: IPeriodSection) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const onToggleCollapse = () => setIsCollapsed((currentCollapsed) => !currentCollapsed)

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={onToggleCollapse}
        aria-expanded={!isCollapsed}
        aria-label={isCollapsed ? `ขยายกลุ่ม ${label}` : `ยุบกลุ่ม ${label}`}
        className="sticky top-16 z-10 flex min-h-12 w-full items-center justify-between gap-3 border-b border-border bg-card py-3 text-left transition-colors hover:bg-muted/50"
      >
        <span className="flex min-w-0 items-center gap-2">
          <ChevronDown
            className={cn('size-5 shrink-0 text-muted-foreground transition-transform', isCollapsed && '-rotate-90')}
          />
          <span className="truncate text-base font-semibold">{label}</span>
        </span>

        <span className="flex shrink-0 items-center gap-4 text-base">
          <span className="hidden items-center gap-1 text-income sm:flex">
            รายรับ <MoneyText amount={income} variant="income" />
          </span>
          <span className="hidden items-center gap-1 text-expense sm:flex">
            รายจ่าย <MoneyText amount={expense} variant="expense" />
          </span>
          <span className="flex items-center gap-1 font-semibold">
            คงเหลือ <MoneyText amount={balance} variant="auto" showSign />
          </span>
        </span>
      </button>

      {!isCollapsed && (
        <div className="pt-3">
          <TransactionTable transactions={transactions} categories={categories} onEdit={onEdit} />
        </div>
      )}
    </div>
  )
}
