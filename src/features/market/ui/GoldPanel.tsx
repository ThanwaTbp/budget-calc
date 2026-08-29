'use client'

import { CircleAlert, Coins, Scale } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/EmptyState'
import { useGoldQuote } from '@/features/market/hooks/useGoldQuote'
import { formatNumber } from '@/utils/format'
import type { IGoldPrice } from '@/types/market'

interface IGoldPriceSection {
  title: string
  description: string
  price: IGoldPrice
}

function GoldPriceSection({ title, description, price }: IGoldPriceSection) {
  const spread = price.sell - price.buy

  return (
    <article className="flex flex-col gap-5 bg-card p-5 sm:p-6">
      <div>
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex min-w-0 flex-col gap-1 rounded-lg bg-income-muted/55 p-3">
          <span className="text-xs font-medium text-income">ร้านรับซื้อ</span>
          <span className="tabular text-xl font-semibold tracking-tight sm:text-2xl">{formatNumber(price.buy)}</span>
          <span className="text-xs text-muted-foreground">บาท / 1 บาททองคำ</span>
        </div>
        <div className="flex min-w-0 flex-col gap-1 rounded-lg bg-warning-muted/65 p-3">
          <span className="text-xs font-medium text-warning">ขายออก</span>
          <span className="tabular text-xl font-semibold tracking-tight sm:text-2xl">{formatNumber(price.sell)}</span>
          <span className="text-xs text-muted-foreground">บาท / 1 บาททองคำ</span>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Scale className="size-3.5" />
          ส่วนต่างราคา
        </span>
        <span className="tabular font-medium">{formatNumber(spread)} บาท</span>
      </div>
    </article>
  )
}

export function GoldPanel() {
  const { data: goldQuote, isLoading, errorMessage, onRetry } = useGoldQuote()

  if (isLoading) {
    return <Skeleton className="h-96 w-full rounded-xl" />
  }

  if (!goldQuote) {
    return (
      <EmptyState
        icon={CircleAlert}
        title="ดึงราคาทองคำไม่สำเร็จ"
        description={errorMessage ?? 'ไม่สามารถโหลดราคาทองคำได้ กรุณาลองใหม่อีกครั้ง'}
      >
        <Button onClick={onRetry}>ลองใหม่</Button>
      </EmptyState>
    )
  }

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex flex-col gap-3 border-b border-border bg-warning-muted/35 px-5 py-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-warning-muted text-warning">
            <Coins className="size-4.5" />
          </span>
          <div>
            <h2 className="text-xl font-semibold tracking-tight">ราคาทองคำวันนี้</h2>
            <p className="text-sm text-muted-foreground">เทียบราคารับซื้อและขายออกโดยไม่ต้องไล่อ่านตาราง</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          อัปเดต {goldQuote.updateDate} · {goldQuote.updateTime}
        </p>
      </div>

      <div className="grid gap-px bg-border lg:grid-cols-2">
        <GoldPriceSection title="ทองคำแท่ง" description="ทองคำบริสุทธิ์สำหรับการลงทุน" price={goldQuote.bar} />
        <GoldPriceSection title="ทองรูปพรรณ" description="ราคาสำหรับเครื่องประดับทอง" price={goldQuote.ornament} />
      </div>
    </section>
  )
}
