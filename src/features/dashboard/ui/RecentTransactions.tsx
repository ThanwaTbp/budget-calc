'use client'

import Link from 'next/link'
import { ArrowRight, ReceiptText } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/common/EmptyState'
import { MoneyText } from '@/components/common/MoneyText'
import { CategoryIcon } from '@/features/transactions/ui/CategoryIcon'
import type { ICategory, ITransaction } from '@/types/finance'
import { formatDate } from '@/utils/format'

interface IRecentTransactions {
  transactions: ITransaction[]
  categories: ICategory[]
}

export function RecentTransactions({ transactions, categories }: IRecentTransactions) {
  const getCategory = (categoryId: string) => categories.find((category) => category.id === categoryId)

  return (
    <Card>
      <CardHeader>
        <CardTitle>รายการล่าสุด</CardTitle>
        <CardAction>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/transactions">
              ดูทั้งหมด
              <ArrowRight />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <EmptyState
            icon={ReceiptText}
            title="ยังไม่มีรายการ"
            description="เริ่มบันทึกรายรับรายจ่ายเพื่อดูรายการล่าสุดที่นี่"
          >
            <Button size="sm" asChild>
              <Link href="/transactions">บันทึกรายรับรายจ่าย</Link>
            </Button>
          </EmptyState>
        ) : (
          <ul className="flex flex-col gap-2">
            {transactions.map((transaction) => {
              const category = getCategory(transaction.categoryId)

              return (
                <li key={transaction.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
                      <CategoryIcon icon={category?.icon ?? 'Circle'} />
                    </span>
                    <div className="flex min-w-0 flex-col">
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span className="truncate text-base font-medium">
                          {category?.name ?? 'ไม่ระบุหมวดหมู่'}
                        </span>
                        {transaction.source === 'payroll' && (
                          <Badge variant="outline" className="shrink-0 border-transparent bg-muted text-muted-foreground">
                            อัตโนมัติ
                          </Badge>
                        )}
                      </span>
                      <span className="truncate text-sm text-muted-foreground">
                        {transaction.note || '-'}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-0.5">
                    <MoneyText
                      amount={transaction.type === 'expense' ? -transaction.amount : transaction.amount}
                      variant="auto"
                      showSign
                      className="text-base font-semibold"
                    />
                    <span className="text-sm text-muted-foreground">{formatDate(transaction.date)}</span>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
