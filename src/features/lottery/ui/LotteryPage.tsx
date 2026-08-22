'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/common/PageHeader'
import { useHydrated } from '@/hooks/useHydrated'
import { useLotteryTicketStore } from '@/features/lottery/store/useLotteryTicketStore'
import { useLotteryBoard } from '@/features/lottery/hooks/useLotteryBoard'
import { DrawSelector } from '@/features/lottery/ui/DrawSelector'
import { TicketCheckForm } from '@/features/lottery/ui/TicketCheckForm'
import { SavedTicketList } from '@/features/lottery/ui/SavedTicketList'
import { DrawResultPanel } from '@/features/lottery/ui/DrawResultPanel'

export function LotteryPage() {
  const isHydrated = useHydrated()
  const tickets = useLotteryTicketStore((state) => state.tickets)

  const {
    draws,
    selectedDrawId,
    draw,
    isLoadingDraws,
    isLoadingDraw,
    errorMessage,
    checkedTickets,
    totalReward,
    quickCheckNumber,
    quickCheckResult,
    onSelectDraw,
    onQuickCheck,
    onSaveQuickNumber,
    onRetry,
  } = useLotteryBoard()

  if (!isHydrated) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  const isQuickNumberSaved = tickets.some((ticket) => ticket.number === quickCheckNumber)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="ตรวจหวย" description="ตรวจผลสลากกินแบ่งรัฐบาล งวดล่าสุดและย้อนหลัง">
        <DrawSelector
          draws={draws}
          selectedDrawId={selectedDrawId}
          isLoading={isLoadingDraws}
          onSelectDraw={onSelectDraw}
        />
      </PageHeader>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <TicketCheckForm
            quickCheckResult={quickCheckResult}
            isQuickNumberSaved={isQuickNumberSaved}
            isDrawLoaded={draw !== null}
            onQuickCheck={onQuickCheck}
            onSaveQuickNumber={onSaveQuickNumber}
          />

          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <SavedTicketList tickets={tickets} checkedTickets={checkedTickets} totalReward={totalReward} />
          </div>
        </div>

        <DrawResultPanel
          draw={draw}
          isLoading={isLoadingDraws || isLoadingDraw}
          errorMessage={errorMessage}
          checkedTickets={checkedTickets}
          onRetry={onRetry}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        ข้อมูลจาก lottery.co.th — โปรดตรวจสอบกับผลรางวัลอย่างเป็นทางการอีกครั้งก่อนขึ้นเงิน
      </p>
    </div>
  )
}
