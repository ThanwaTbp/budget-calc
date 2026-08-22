'use client'

import { Ticket, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/EmptyState'
import { useConfirm } from '@/components/common/ConfirmProvider'
import { useLotteryTicketStore } from '@/features/lottery/store/useLotteryTicketStore'
import { formatCurrency } from '@/utils/format'
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
      <EmptyState
        icon={Ticket}
        title="ยังไม่มีเลขที่บันทึกไว้"
        description="กรอกเลขในช่องตรวจเลขด้านบนแล้วกดบันทึกเพื่อเก็บไว้ตรวจกับงวดถัดไปได้ทันที"
      />
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium text-muted-foreground">เลขที่บันทึกไว้ ({tickets.length})</p>

      <ul className="flex flex-col gap-2">
        {tickets.map((ticket, index) => {
          const checkedResult = checkedTickets[index]
          const isWinning = (checkedResult?.hits.length ?? 0) > 0

          return (
            <li
              key={ticket.id}
              className="flex items-start justify-between gap-3 rounded-lg border border-border p-3"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <span className="tabular text-lg font-semibold tracking-wider">{ticket.number}</span>
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
                  <span className="text-sm text-muted-foreground">ไม่ถูกรางวัล</span>
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

      <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
        <span className="text-sm font-medium">รวมเงินรางวัลงวดนี้</span>
        <span
          className={
            totalReward > 0 ? 'tabular text-lg font-bold text-income' : 'tabular text-sm text-muted-foreground'
          }
        >
          {formatCurrency(totalReward)}
        </span>
      </div>
    </div>
  )
}
