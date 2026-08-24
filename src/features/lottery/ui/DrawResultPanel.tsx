'use client'

import { useState } from 'react'
import { ChevronRight, CloudAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { formatCurrency } from '@/utils/format'
import { cn } from '@/lib/utils'
import type { ILotteryDraw, ILotteryPrize, ITicketCheckResult, LotteryPrizeId } from '@/types/lottery'

// 3 รางวัลที่คนตรวจบ่อยที่สุด — แสดงเต็มเสมอ ไม่ยุบ
const QUICK_PRIZE_IDS: LotteryPrizeId[] = ['frontThree', 'backThree', 'backTwo']
// ข้างเคียงรางวัลที่ 1 + รางวัลที่ 2-5 มีเลขเยอะ ยุบเป็นแถวกางได้
const COLLAPSIBLE_PRIZE_IDS: LotteryPrizeId[] = ['nearFirst', 'second', 'third', 'fourth', 'fifth']

// แยกผลรางวัลทั้งงวดออกเป็น 3 กลุ่มตามลำดับความสำคัญที่ผู้ใช้ต้องเห็น: รางวัลที่ 1 → 3 รางวัลยอดฮิต → รางวัลที่ยุบไว้
export function splitPrizesForBoard(prizes: ILotteryPrize[]): {
  firstPrize: ILotteryPrize | null
  quickPrizes: ILotteryPrize[]
  collapsiblePrizes: ILotteryPrize[]
} {
  return {
    firstPrize: prizes.find((prize) => prize.id === 'first') ?? null,
    quickPrizes: QUICK_PRIZE_IDS.map((prizeId) => prizes.find((prize) => prize.id === prizeId)).filter(
      (prize): prize is ILotteryPrize => prize !== undefined,
    ),
    collapsiblePrizes: COLLAPSIBLE_PRIZE_IDS.map((prizeId) => prizes.find((prize) => prize.id === prizeId)).filter(
      (prize): prize is ILotteryPrize => prize !== undefined,
    ),
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
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-36 w-full rounded-xl" />
        <div className="grid gap-3 sm:grid-cols-3">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
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
  const { firstPrize, quickPrizes, collapsiblePrizes } = splitPrizesForBoard(draw.prizes)

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <p className="font-semibold tracking-tight">ผลรางวัลงวด {draw.label}</p>

      {firstPrize && (
        <div className="rounded-xl border-2 border-dashed border-primary/40 bg-card p-6 text-center">
          <p className="text-sm font-medium text-muted-foreground">{firstPrize.name}</p>
          <div className="mt-2 flex flex-col items-center gap-1">
            {firstPrize.numbers.map((number) => (
              <span
                key={number}
                className={cn(
                  'tabular rounded-lg px-3 py-1 text-4xl font-bold tracking-[0.15em] text-foreground sm:text-5xl',
                  wonNumberKeys.has(`${firstPrize.id}:${number}`) &&
                    'bg-income-muted text-income ring-1 ring-income/40',
                )}
              >
                {number}
              </span>
            ))}
          </div>
          <p className="mt-2 text-base font-semibold text-primary">{formatCurrency(firstPrize.reward)}</p>
        </div>
      )}

      {quickPrizes.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          {quickPrizes.map((prize) => (
            <QuickPrizeCard key={prize.id} prize={prize} wonNumberKeys={wonNumberKeys} />
          ))}
        </div>
      )}

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

// การ์ดเล็กสำหรับ 3 รางวัลที่คนตรวจบ่อยที่สุด (เลขหน้า 3 ตัว / เลขท้าย 3 ตัว / เลขท้าย 2 ตัว)
function QuickPrizeCard({ prize, wonNumberKeys }: IPrizeBlock) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-border bg-muted/30 p-4 text-center">
      <p className="text-sm font-medium">{prize.name}</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {prize.numbers.map((number) => (
          <span
            key={number}
            className={cn(
              'tabular rounded-md px-2 py-1 text-2xl font-bold tracking-widest',
              wonNumberKeys.has(`${prize.id}:${number}`) && 'bg-income-muted text-income ring-1 ring-income/40',
            )}
          >
            {number}
          </span>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{formatCurrency(prize.reward)}</p>
    </div>
  )
}

// แถวรางวัลข้างเคียงรางวัลที่ 1 และรางวัลที่ 2-5 — ยุบไว้เป็นค่าเริ่มต้น กดทั้งแถบเพื่อกางดูเลขทั้งหมด
function CollapsiblePrizeBlock({ prize, wonNumberKeys }: IPrizeBlock) {
  const [isExpanded, setIsExpanded] = useState(false)

  const onToggleExpand = () => setIsExpanded((previousExpanded) => !previousExpanded)

  return (
    <div className="flex flex-col gap-2 py-1 first:pt-0 last:pb-0">
      <button
        type="button"
        onClick={onToggleExpand}
        className="flex min-h-12 items-center justify-between gap-3 text-left"
        aria-expanded={isExpanded}
      >
        <span className="text-sm font-medium">
          {prize.name} <span className="text-muted-foreground">({prize.numbers.length} เลข)</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="tabular text-sm text-muted-foreground">{formatCurrency(prize.reward)}</span>
          <ChevronRight
            className={cn('size-4 shrink-0 text-muted-foreground transition-transform', isExpanded && 'rotate-90')}
          />
        </span>
      </button>

      {isExpanded && (
        <div className="grid grid-cols-3 gap-2 pb-3 sm:grid-cols-5">
          {prize.numbers.map((number) => (
            <span
              key={number}
              className={cn(
                'tabular rounded-md bg-muted px-2 py-1.5 text-center text-sm',
                wonNumberKeys.has(`${prize.id}:${number}`) &&
                  'bg-income-muted font-semibold text-income ring-1 ring-income/40',
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
