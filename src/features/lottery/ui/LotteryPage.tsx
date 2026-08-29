'use client'

import { ShieldCheck } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/common/PageHeader'
import { useHydrated } from '@/hooks/useHydrated'
import { useLotteryTicketStore } from '@/features/lottery/store/useLotteryTicketStore'
import { useLotteryBoard } from '@/features/lottery/hooks/useLotteryBoard'
import { DrawSelector } from '@/features/lottery/ui/DrawSelector'
import { TicketCheckCard } from '@/features/lottery/ui/TicketCheckCard'
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
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  const isQuickNumberSaved = tickets.some((ticket) => ticket.number === quickCheckNumber)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="ตรวจหวย" description="กรอกเลขครั้งเดียว แล้วตรวจผลพร้อมเลขที่บันทึกไว้อย่างเป็นระเบียบ">
        <DrawSelector
          draws={draws}
          selectedDrawId={selectedDrawId}
          isLoading={isLoadingDraws}
          onSelectDraw={onSelectDraw}
        />
      </PageHeader>

      <TicketCheckCard
        drawLabel={draw?.label ?? null}
        quickCheckResult={quickCheckResult}
        isQuickNumberSaved={isQuickNumberSaved}
        isDrawLoaded={draw !== null}
        onQuickCheck={onQuickCheck}
        onSaveQuickNumber={onSaveQuickNumber}
      />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(19rem,0.7fr)]">
        <div>
          <DrawResultPanel
            draw={draw}
            isLoading={isLoadingDraws || isLoadingDraw}
            errorMessage={errorMessage}
            checkedTickets={checkedTickets}
            onRetry={onRetry}
          />
        </div>

        <div className="xl:sticky xl:top-20">
          <SavedTicketList tickets={tickets} checkedTickets={checkedTickets} totalReward={totalReward} />
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-border bg-secondary/35 px-4 py-3 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
        <p>ข้อมูลจาก lottery.co.th โปรดตรวจสอบกับผลรางวัลอย่างเป็นทางการอีกครั้งก่อนขึ้นเงิน</p>
      </div>
    </div>
  )
}
