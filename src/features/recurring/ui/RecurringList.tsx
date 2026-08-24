'use client'

import { Pencil, Power, PowerOff, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useConfirm } from '@/components/common/ConfirmProvider'
import { CategoryIcon } from '@/features/transactions/ui/CategoryIcon'
import { useRecurringStore } from '@/features/recurring/store/useRecurringStore'
import { useTransactionStore } from '@/features/transactions/store/useTransactionStore'
import { getNextDueDate, isDueForPosting } from '@/features/recurring/utils/recurringSchedule'
import type { IRecurringItem } from '@/types/recurring'
import { formatCurrency, formatDate } from '@/utils/format'
import { cn } from '@/lib/utils'

interface IRecurringList {
  items: IRecurringItem[]
  todayIsoDate: string
  onPostItem: (item: IRecurringItem) => void
  onEditItem: (item: IRecurringItem) => void
}

// รายการทั้งหมด ใช้โครงเดียวกับ TaskListItem ของฟีเจอร์วางแผนงาน (การ์ดแถวเดียวปรับ layout ตามขนาดจอ)
// จึงยุบเป็น card list บนมือถือโดยอัตโนมัติโดยไม่ต้องแยกมาร์กอัปตาราง/การ์ดสองชุด
export function RecurringList({ items, todayIsoDate, onPostItem, onEditItem }: IRecurringList) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <RecurringListRow
          key={item.id}
          item={item}
          todayIsoDate={todayIsoDate}
          onPostItem={onPostItem}
          onEditItem={onEditItem}
        />
      ))}
    </div>
  )
}

interface IRecurringListRow {
  item: IRecurringItem
  todayIsoDate: string
  onPostItem: (item: IRecurringItem) => void
  onEditItem: (item: IRecurringItem) => void
}

function RecurringListRow({ item, todayIsoDate, onPostItem, onEditItem }: IRecurringListRow) {
  const confirm = useConfirm()
  const categories = useTransactionStore((state) => state.categories)
  const onToggleActive = useRecurringStore((state) => state.onToggleActive)
  const onDeleteItem = useRecurringStore((state) => state.onDelete)

  const category = categories.find((categoryItem) => categoryItem.id === item.categoryId)
  const isDue = isDueForPosting(item, todayIsoDate)
  const nextDueDate = getNextDueDate(item, todayIsoDate)

  const onPostClick = async () => {
    const isConfirmed = await confirm({
      title: 'ลงรายการนี้เลย?',
      description: `ระบบจะสร้างรายการ${item.type === 'income' ? 'รายรับ' : 'รายจ่าย'} ${formatCurrency(item.amount)} เข้ารายรับ-รายจ่ายทันที`,
      confirmLabel: 'ลงรายการ',
      tone: 'default',
    })
    if (!isConfirmed) return

    onPostItem(item)
  }

  const onToggleActiveClick = async () => {
    const isConfirmed = await confirm({
      title: item.isActive ? 'ปิดใช้งานรายการนี้?' : 'เปิดใช้งานรายการนี้?',
      description: item.isActive
        ? 'รายการนี้จะหยุดเตือนและลงรายการอัตโนมัติจนกว่าจะเปิดใช้งานอีกครั้ง'
        : 'รายการนี้จะกลับมาเตือนและลงรายการได้ตามรอบปกติ',
      confirmLabel: item.isActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน',
      tone: 'default',
    })
    if (!isConfirmed) return

    onToggleActive(item.id)
    toast.success(item.isActive ? 'ปิดใช้งานรายการประจำแล้ว' : 'เปิดใช้งานรายการประจำแล้ว')
  }

  const onDeleteClick = async () => {
    const isConfirmed = await confirm({
      title: 'ลบรายการประจำนี้?',
      description: 'รายการนี้จะถูกลบถาวรและกู้คืนไม่ได้ (ไม่กระทบรายการที่เคยลงไปแล้วก่อนหน้า)',
      confirmLabel: 'ลบเลย',
      tone: 'danger',
    })
    if (!isConfirmed) return

    onDeleteItem(item.id)
    toast.success('ลบรายการประจำแล้ว')
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-lg border border-border p-3 transition-colors sm:flex-row sm:items-center sm:justify-between',
        !item.isActive && 'opacity-60',
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <CategoryIcon icon={category?.icon ?? 'Circle'} />
        </span>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="font-medium">{item.note || category?.name || 'ไม่ระบุหมวดหมู่'}</p>
            <Badge
              className={cn(
                'border-transparent',
                item.type === 'income' ? 'bg-income-muted text-income' : 'bg-expense-muted text-expense',
              )}
            >
              {item.type === 'income' ? 'รายรับ' : 'รายจ่าย'}
            </Badge>
            {!item.isActive && <Badge variant="outline">ปิดใช้งาน</Badge>}
            {item.isActive && isDue && (
              <Badge className="border-transparent bg-warning-muted text-warning">ถึงกำหนดแล้ว</Badge>
            )}
          </div>

          <p className="tabular font-semibold">{formatCurrency(item.amount)}</p>

          <p className="text-sm text-muted-foreground">
            ทุกวันที่ {item.dayOfMonth} ของเดือน · ครบกำหนดถัดไป {formatDate(nextDueDate)}
          </p>
        </div>
      </div>

      <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:shrink-0">
        {item.isActive && isDue && (
          <Button size="sm" onClick={onPostClick} className="flex-1 sm:flex-none">
            ลงรายการเลย
          </Button>
        )}

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onEditItem(item)}
          aria-label="แก้ไขรายการประจำ"
          title="แก้ไขรายการประจำ"
        >
          <Pencil />
        </Button>

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onToggleActiveClick}
          aria-label={item.isActive ? 'ปิดใช้งานรายการประจำ' : 'เปิดใช้งานรายการประจำ'}
          title={item.isActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
        >
          {item.isActive ? <PowerOff /> : <Power />}
        </Button>

        <Button
          variant="ghost"
          size="icon-sm"
          className="text-expense hover:bg-expense-muted hover:text-expense"
          onClick={onDeleteClick}
          aria-label="ลบรายการประจำ"
          title="ลบรายการประจำ"
        >
          <Trash2 />
        </Button>
      </div>
    </div>
  )
}
