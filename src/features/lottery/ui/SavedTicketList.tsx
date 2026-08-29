'use client'

import { CheckCircle2, Coins, Ticket, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/EmptyState'
import { useConfirm } from '@/components/common/ConfirmProvider'
import { useLotteryTicketStore } from '@/features/lottery/store/useLotteryTicketStore'
import { formatCurrency } from '@/utils/format'
import { cn } from '@/lib/utils'
import type { ILotteryTicket, ITicketCheckResult } from '@/types/lottery'

interface ISavedTicketList {
  tickets: ILotteryTicket[]
  checkedTickets: ITicketCheckResult[]
  totalReward: number
}

// รายการเลขที่บันทึกไว้ พร้อมผลตรวจกับงวดที่เลือกอยู่ — checkedTickets เรียงตามลำดับเดียวกับ tickets เสมอ (มาจาก store เดียวกัน)
export function SavedTicketList({ tickets, checkedTickets, totalReward }: ISavedTicketList) {
  const confirm = useConfirm()
  const onDeleteTicket = useLotteryTicketStore((state) => state.onDelete)

  const onDeleteClick = async (ticket: ILotteryTicket) => {
    const isConfirmed = await confirm({
      title: `ลบเลข ${ticket.number}?`,
      description: 'เลขนี้จะถูกลบถาวรและกู้คืนไม่ได้',
      confirmLabel: 'ลบเลย',
      tone: 'danger',
    })
    if (!isConfirmed) return

    onDeleteTicket(ticket.id)
    toast.success('ลบเลขเรียบร้อยแล้ว')
  }

  if (tickets.length === 0) {
    return (
      <section className="flex min-h-72 items-center justify-center rounded-2xl border border-border bg-card p-6 shadow-sm">
        <EmptyState
          icon={Ticket}
          title="ยังไม่มีเลขที่บันทึกไว้"
          description="กรอกเลขด้านบนแล้วกดบันทึก ระบบจะตรวจให้ใหม่ทุกครั้งที่เปลี่ยนงวด"
        />
      </section>
    )
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-border bg-secondary/55 px-4 py-4">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Ticket className="size-5" />
          </span>
          <div>
            <h2 className="font-semibold tracking-tight">เลขที่บันทึกไว้</h2>
            <p className="text-xs text-muted-foreground">ตรวจพร้อมกันกับงวดที่เลือก</p>
          </div>
        </div>
        <Badge variant="secondary" className="rounded-full px-2.5">
          {tickets.length} เลข
        </Badge>
      </div>

      <ul className="flex flex-col gap-2 p-3">
        {tickets.map((ticket, index) => {
          const checkedResult = checkedTickets[index]
          const isWinning = (checkedResult?.hits.length ?? 0) > 0

          return (
            <li
              key={ticket.id}
              className={cn(
                'relative flex items-start justify-between gap-3 overflow-hidden rounded-xl border p-3.5',
                isWinning ? 'border-income/35 bg-income-muted/75' : 'border-border bg-secondary/30',
              )}
            >
              <span
                className={cn(
                  'absolute inset-y-0 left-0 w-1',
                  isWinning ? 'bg-income' : 'bg-muted-foreground/20',
                )}
              />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className={cn('tabular text-xl font-bold tracking-[0.15em]', isWinning && 'text-income')}
                  >
                    {ticket.number}
                  </span>
                  {isWinning && <CheckCircle2 className="size-4 shrink-0 text-income" />}
                </div>
                {ticket.note && <span className="truncate text-sm text-muted-foreground">{ticket.note}</span>}

                {isWinning && checkedResult ? (
                  <div className="flex flex-wrap gap-1">
                    {checkedResult.hits.map((hit) => (
                      <Badge
                        key={`${hit.prizeId}-${hit.matchedNumber}`}
                        variant="secondary"
                        className="bg-income-muted text-income"
                      >
                        {hit.prizeName} {formatCurrency(hit.reward)}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">ยังไม่ถูกรางวัลในงวดนี้</span>
                )}
              </div>

              <Button
                variant="ghost"
                size="icon-sm"
                className="shrink-0 text-expense hover:bg-expense-muted hover:text-expense"
                onClick={() => onDeleteClick(ticket)}
                aria-label={`ลบเลข ${ticket.number}`}
                title="ลบ"
              >
                <Trash2 />
              </Button>
            </li>
          )
        })}
      </ul>

      <div className="border-t border-border p-3">
        <div className="flex items-center justify-between gap-3 rounded-xl bg-accent/55 p-3.5">
          <span className="flex items-center gap-2 text-sm font-semibold">
            <Coins className="size-4 text-primary" />
            รวมเงินรางวัลงวดนี้
          </span>
          <span
            className={
              totalReward > 0 ? 'tabular text-lg font-bold text-income' : 'tabular text-sm text-muted-foreground'
            }
          >
            {formatCurrency(totalReward)}
          </span>
        </div>
      </div>
    </section>
  )
}
