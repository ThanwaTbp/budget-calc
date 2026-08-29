'use client'

import { ArrowDownRight, ArrowUpRight, ChartNoAxesCombined, Clock3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { useStockQuote } from '@/features/market/hooks/useStockQuote'
import { formatMarketNumber } from '@/features/market/utils/formatMarketNumber'
import { cn } from '@/lib/utils'
import type { IStockQuote } from '@/types/market'

const updatedAtFormatter = new Intl.DateTimeFormat('th-TH', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Bangkok',
})

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function StockQuoteCard({ quote }: { quote: IStockQuote }) {
  const isPositive = quote.change >= 0
  const ChangeIcon = isPositive ? ArrowUpRight : ArrowDownRight

  return (
    <article className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/35">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold tracking-wide">{quote.symbol}</span>
            <span className="rounded-md bg-muted px-1.5 py-0.5 text-[0.625rem] font-medium text-muted-foreground">
              {quote.exchange}
            </span>
          </div>
          <p className="truncate text-sm text-muted-foreground" title={quote.name}>
            {quote.name}
          </p>
        </div>

        <span
          className={cn(
            'tabular flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold',
            isPositive ? 'bg-income-muted text-income' : 'bg-expense-muted text-expense',
          )}
        >
          <ChangeIcon className="size-3" />
          {isPositive ? '+' : ''}
          {formatMarketNumber(quote.changePercentage, 2)}%
        </span>
      </div>

      <div>
        <p className="tabular text-2xl font-semibold tracking-tight">{usdFormatter.format(quote.price)}</p>
        <p className={cn('tabular text-sm', isPositive ? 'text-income' : 'text-expense')}>
          {isPositive ? '+' : ''}
          {usdFormatter.format(quote.change)} วันนี้
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 border-t border-border pt-3 text-xs">
        <div>
          <p className="text-muted-foreground">ต่ำสุด</p>
          <p className="tabular font-medium">{usdFormatter.format(quote.dayLow)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">สูงสุด</p>
          <p className="tabular font-medium">{usdFormatter.format(quote.dayHigh)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">ปริมาณ</p>
          <p className="tabular font-medium">{formatMarketNumber(quote.volume, 0)}</p>
        </div>
      </div>
    </article>
  )
}

export function StockPanel() {
  const { data: stockQuoteList, isLoading, errorMessage, onRetry } = useStockQuote()

  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, itemIndex) => (
          <Skeleton key={itemIndex} className="h-56 rounded-xl" />
        ))}
      </div>
    )
  }

  if (!stockQuoteList) {
    const isMissingApiKey = errorMessage?.includes('FMP_API_KEY') ?? false
    return (
      <EmptyState
        icon={ChartNoAxesCombined}
        title={isMissingApiKey ? 'ยังไม่ได้เชื่อมต่อข้อมูลหุ้น' : 'ดึงราคาหุ้นสหรัฐฯ ไม่สำเร็จ'}
        description={
          isMissingApiKey
            ? 'เพิ่ม FMP_API_KEY ใน .env.local แล้วเริ่มเซิร์ฟเวอร์ใหม่ เพื่อเปิดใช้งานข้อมูลหุ้น'
            : errorMessage ?? 'ไม่สามารถโหลดราคาหุ้นได้ กรุณาลองใหม่อีกครั้ง'
        }
      >
        {!isMissingApiKey && <Button onClick={onRetry}>ลองใหม่</Button>}
      </EmptyState>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">US Market Watch</p>
          <h2 className="text-xl font-semibold tracking-tight">หุ้นสหรัฐฯ ที่ติดตาม</h2>
        </div>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock3 className="size-3.5" />
          อัปเดต {updatedAtFormatter.format(new Date(stockQuoteList.updatedAt))}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {stockQuoteList.quotes.map((quote) => (
          <StockQuoteCard key={quote.symbol} quote={quote} />
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        ราคาสกุล USD · ข้อมูลอาจล่าช้าตามแผนของผู้ให้บริการ ใช้เพื่อการอ้างอิงเท่านั้น ไม่ใช่คำแนะนำการลงทุน
      </p>
    </div>
  )
}
