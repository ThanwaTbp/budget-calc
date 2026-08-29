'use client'

import { useState } from 'react'
import { Award, ChevronRight, CloudAlert, Crown } from 'lucide-react'
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
      <div className="flex flex-col gap-5 overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <Skeleton className="h-10 w-52 rounded-xl" />
        <Skeleton className="h-52 w-full rounded-2xl" />
        <div className="grid gap-3 md:grid-cols-3">
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
      <div className="flex min-h-96 items-center justify-center rounded-2xl border border-border bg-card p-6 shadow-sm">
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
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-border bg-secondary/55 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Award className="size-5" />
          </span>
          <div>
            <p className="font-semibold tracking-tight">ผลรางวัลอย่างเป็นทางการ</p>
            <p className="text-sm text-muted-foreground">งวด {draw.label}</p>
          </div>
        </div>
        <span className="hidden rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground sm:inline-flex">
          แตะรางวัลด้านล่างเพื่อดูเลขทั้งหมด
        </span>
      </div>

      <div className="flex flex-col gap-5 p-4 sm:p-6">
        {firstPrize && (
          <div className="relative overflow-hidden rounded-2xl border border-primary/25 bg-accent/55 px-4 py-7 text-center sm:px-6 sm:py-9">
            <div className="absolute top-1/2 -left-3 size-6 -translate-y-1/2 rounded-full border border-border bg-card" />
            <div className="absolute top-1/2 -right-3 size-6 -translate-y-1/2 rounded-full border border-border bg-card" />
            <p className="flex items-center justify-center gap-2 text-sm font-semibold text-accent-foreground">
              <Crown className="size-4" />
              {firstPrize.name}
            </p>
            <div className="mt-3 flex flex-col items-center gap-1">
              {firstPrize.numbers.map((number) => (
                <span
                  key={number}
                  className={cn(
                    'tabular rounded-xl px-3 py-1 text-4xl font-bold tracking-[0.12em] text-foreground sm:text-6xl',
                    wonNumberKeys.has(`${firstPrize.id}:${number}`) &&
                      'bg-income-muted text-income ring-1 ring-income/40',
                  )}
                >
                  {number}
                </span>
              ))}
            </div>
            <p className="mt-3 text-sm text-muted-foreground">เงินรางวัลต่อฉบับ</p>
            <p className="tabular mt-0.5 text-xl font-semibold text-primary">
              {formatCurrency(firstPrize.reward)}
            </p>
          </div>
        )}

        {quickPrizes.length > 0 && (
          <div className="grid gap-3 md:grid-cols-3">
            {quickPrizes.map((prize) => (
              <QuickPrizeCard key={prize.id} prize={prize} wonNumberKeys={wonNumberKeys} />
            ))}
          </div>
        )}

        {collapsiblePrizes.length > 0 && (
          <div className="flex flex-col divide-y divide-border rounded-xl border border-border px-4">
            {collapsiblePrizes.map((prize) => (
              <CollapsiblePrizeBlock key={prize.id} prize={prize} wonNumberKeys={wonNumberKeys} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

interface IPrizeBlock {
  prize: ILotteryPrize
  wonNumberKeys: Set<string>
}

// การ์ดเล็กสำหรับ 3 รางวัลที่คนตรวจบ่อยที่สุด (เลขหน้า 3 ตัว / เลขท้าย 3 ตัว / เลขท้าย 2 ตัว)
function QuickPrizeCard({ prize, wonNumberKeys }: IPrizeBlock) {
  return (
    <article className="flex min-h-36 flex-col items-center justify-center gap-2 rounded-xl border border-border bg-secondary/45 p-4 text-center transition-colors hover:border-primary/30 hover:bg-accent/45">
      <p className="text-sm font-semibold">{prize.name}</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {prize.numbers.map((number) => (
          <span
            key={number}
            className={cn(
              'tabular rounded-lg px-2 py-1 text-2xl font-bold tracking-widest sm:text-3xl',
              wonNumberKeys.has(`${prize.id}:${number}`) && 'bg-income-muted text-income ring-1 ring-income/40',
            )}
          >
            {number}
          </span>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">รางวัลละ {formatCurrency(prize.reward)}</p>
    </article>
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
        className="flex min-h-14 items-center justify-between gap-3 rounded-lg px-1 text-left transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        aria-expanded={isExpanded}
      >
        <span className="text-sm font-semibold">
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
        <div className="grid grid-cols-3 gap-2 pb-4 sm:grid-cols-5">
          {prize.numbers.map((number) => (
            <span
              key={number}
              className={cn(
                'tabular rounded-lg bg-muted px-2 py-2 text-center text-sm font-medium',
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
