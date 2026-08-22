'use client'

import { useState } from 'react'
import { ChevronDown, CloudAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { formatCurrency } from '@/utils/format'
import { cn } from '@/lib/utils'
import type { ILotteryDraw, ILotteryPrize, ITicketCheckResult, LotteryPrizeId } from '@/types/lottery'

// รางวัลที่ 2-5 มีเลขเยอะมาก (5/10/50/100 เลข) จึงยุบไว้เป็นค่าเริ่มต้น ที่เหลือแสดงเลขเต็มตลอดเวลา
const COLLAPSIBLE_PRIZE_IDS: LotteryPrizeId[] = ['second', 'third', 'fourth', 'fifth']

// แยกรางวัลที่ต้องโชว์เลขเต็มตลอดเวลา ออกจากรางวัลที่ต้องยุบไว้เป็นค่าเริ่มต้น
export function splitPrizesByVisibility(prizes: ILotteryPrize[]): {
  visiblePrizes: ILotteryPrize[]
  collapsiblePrizes: ILotteryPrize[]
} {
  return {
    visiblePrizes: prizes.filter((prize) => !COLLAPSIBLE_PRIZE_IDS.includes(prize.id)),
    collapsiblePrizes: prizes.filter((prize) => COLLAPSIBLE_PRIZE_IDS.includes(prize.id)),
  }
}

// รวมเลขที่ถูกรางวัลของเลขที่บันทึกไว้ทั้งหมด เป็นคีย์ 'prizeId:เลข' เพื่อไฮไลต์เลขที่ถูกในผลรางวัลทั้งงวด
export function buildWonNumberKeys(checkedTickets: ITicketCheckResult[]): Set<string> {
  const wonNumberKeys = new Set<string>()

  for (const checkedTicket of checkedTickets) {
    for (const hit of checkedTicket.hits) {
      wonNumberKeys.add(`${hit.prizeId}:${hit.matchedNumber}`)
    }
  }

  return wonNumberKeys
}

interface IDrawResultPanel {
  draw: ILotteryDraw | null
  isLoading: boolean
  errorMessage: string | null
  checkedTickets: ITicketCheckResult[]
  onRetry: () => void
}

export function DrawResultPanel({ draw, isLoading, errorMessage, checkedTickets, onRetry }: IDrawResultPanel) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    )
  }

  if (!draw) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-border bg-card p-6 shadow-sm">
        <EmptyState
          icon={CloudAlert}
          title="ดึงผลรางวัลไม่สำเร็จ"
          description={errorMessage ?? 'ไม่สามารถโหลดผลรางวัลของงวดนี้ได้ กรุณาลองใหม่อีกครั้ง'}
        >
          <Button onClick={onRetry}>ลองใหม่</Button>
        </EmptyState>
      </div>
    )
  }

  const wonNumberKeys = buildWonNumberKeys(checkedTickets)
  const { visiblePrizes, collapsiblePrizes } = splitPrizesByVisibility(draw.prizes)

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
      <p className="font-semibold tracking-tight">ผลรางวัลงวด {draw.label}</p>

      <div className="flex flex-col divide-y divide-border">
        {visiblePrizes.map((prize) => (
          <PrizeBlock key={prize.id} prize={prize} wonNumberKeys={wonNumberKeys} />
        ))}
      </div>

      {collapsiblePrizes.length > 0 && (
        <div className="flex flex-col divide-y divide-border border-t border-border">
          {collapsiblePrizes.map((prize) => (
            <CollapsiblePrizeBlock key={prize.id} prize={prize} wonNumberKeys={wonNumberKeys} />
          ))}
        </div>
      )}
    </div>
  )
}

interface IPrizeBlock {
  prize: ILotteryPrize
  wonNumberKeys: Set<string>
}

// บล็อกรางวัลที่แสดงเลขเต็มตลอดเวลา (รางวัลที่ 1, ข้างเคียง, เลขหน้า/ท้าย 3 ตัว, เลขท้าย 2 ตัว)
function PrizeBlock({ prize, wonNumberKeys }: IPrizeBlock) {
  return (
    <div className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium">{prize.name}</span>
        <span className="tabular text-sm text-muted-foreground">{formatCurrency(prize.reward)}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {prize.numbers.map((number) => (
          <span
            key={number}
            className={cn(
              'tabular rounded-md px-3 py-1 text-xl font-semibold tracking-wider',
              wonNumberKeys.has(`${prize.id}:${number}`) ? 'bg-income-muted text-income' : 'bg-muted/50',
            )}
          >
            {number}
          </span>
        ))}
      </div>
    </div>
  )
}

// บล็อกรางวัลที่ 2-5 ยุบไว้เป็นค่าเริ่มต้น กดหัวข้อเพื่อกางดูเลขทั้งหมด
function CollapsiblePrizeBlock({ prize, wonNumberKeys }: IPrizeBlock) {
  const [isExpanded, setIsExpanded] = useState(false)

  const onToggleExpand = () => setIsExpanded((previousExpanded) => !previousExpanded)

  return (
    <div className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0">
      <button
        type="button"
        onClick={onToggleExpand}
        className="flex items-center justify-between gap-3 text-left"
        aria-expanded={isExpanded}
      >
        <span className="text-sm font-medium">
          {prize.name} <span className="text-muted-foreground">({prize.numbers.length} เลข)</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="tabular text-sm text-muted-foreground">{formatCurrency(prize.reward)}</span>
          <ChevronDown
            className={cn('size-4 shrink-0 text-muted-foreground transition-transform', isExpanded && 'rotate-180')}
          />
        </span>
      </button>

      {isExpanded && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {prize.numbers.map((number) => (
            <span
              key={number}
              className={cn(
                'tabular rounded-md px-2 py-1.5 text-center text-sm font-medium tracking-wider',
                wonNumberKeys.has(`${prize.id}:${number}`)
                  ? 'bg-income-muted font-semibold text-income'
                  : 'bg-muted/50',
              )}
            >
              {number}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
