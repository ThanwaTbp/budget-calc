'use client'

import { CircleAlert } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/EmptyState'
import { useGoldQuote } from '@/features/market/hooks/useGoldQuote'
import { formatNumber } from '@/utils/format'
import type { IGoldPrice } from '@/types/market'

interface IGoldPriceCard {
  title: string
  price: IGoldPrice
}

// การ์ดแสดงราคารับซื้อ/ขายออกของทองแต่ละประเภท (รูปพรรณ/ทองแท่ง)
function GoldPriceCard({ title, price }: IGoldPriceCard) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">รับซื้อ</span>
          <span className="tabular text-2xl font-bold">{formatNumber(price.buy)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">ขายออก</span>
          <span className="tabular text-2xl font-bold">{formatNumber(price.sell)}</span>
        </div>
      </CardContent>
    </Card>
  )
}

export function GoldPanel() {
  const { data: goldQuote, isLoading, errorMessage, onRetry } = useGoldQuote()

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    )
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
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <GoldPriceCard title="ทองคำแท่ง" price={goldQuote.bar} />
        <GoldPriceCard title="ทองรูปพรรณ" price={goldQuote.ornament} />
      </div>
      <p className="text-sm text-muted-foreground">
        อัปเดตล่าสุด {goldQuote.updateDate} {goldQuote.updateTime}
      </p>
    </div>
  )
}
