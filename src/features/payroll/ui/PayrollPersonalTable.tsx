'use client'

import { useState } from 'react'
import { MoreHorizontal, Pencil, Plus, ReceiptText, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useConfirm } from '@/components/common/ConfirmProvider'
import { EmptyState } from '@/components/common/EmptyState'
import { usePayrollStore } from '@/features/payroll/store/usePayrollStore'
import type { IPayrollEntryRow, IPayrollPeriodSummary } from '@/features/payroll/type'
import { getInitials } from '@/features/payroll/utils/employee'
import type { IPayItem, IPayrollEntry } from '@/types/finance'
import { cn } from '@/lib/utils'
import { formatCurrency, formatDate, formatNumber } from '@/utils/format'

const ENTRY_PAGE_SIZE = 20

// หัวการ์ดแสดงตัวตนพนักงานที่กำลังดูอยู่ (Avatar + ชื่อ) ใช้ทั้งกรณีมีรอบจ่ายและไม่มี
// avatarToneClass รับมาจากภายนอกแทนการคำนวณเอง เพราะต้องอิงลำดับพนักงานใน store ไม่ใช่ id
function EmployeeIdentityHeader({
  avatarToneClass,
  employeeName,
}: {
  avatarToneClass: string
  employeeName: string
}) {
  return (
    <div className="flex items-center gap-2.5 border-b border-border p-4">
      <Avatar size="lg">
        <AvatarFallback className={cn(avatarToneClass, 'font-semibold')}>{getInitials(employeeName)}</AvatarFallback>
      </Avatar>
      <span className="text-base font-semibold text-foreground">{employeeName}</span>
    </div>
  )
}

// ชิปเล็กแสดงรายการเงินหนึ่งบรรทัด ใช้ร่วมกันทั้งตาราง desktop และการ์ด mobile
function PayItemChip({ payItem }: { payItem: IPayItem }) {
  return (
    <span
      className={cn(
        'tabular rounded-full bg-muted px-2 py-0.5 text-xs',
        payItem.kind === 'deduction' && 'text-expense',
      )}
    >
      {payItem.label} {payItem.kind === 'deduction' ? '-' : ''}
      {formatCurrency(payItem.amount)}
    </span>
  )
}

interface IEntryActionsMenu {
  entryRow: IPayrollEntryRow
  onEditEntry: (entry: IPayrollEntry) => void
  onDelete: (entryRow: IPayrollEntryRow) => void
}

function EntryActionsMenu({ entryRow, onEditEntry, onDelete }: IEntryActionsMenu) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm">
          <MoreHorizontal />
          <span className="sr-only">เมนูรอบจ่าย</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEditEntry(entryRow.entry)}>
          <Pencil className="size-4" />
          แก้ไข
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={() => onDelete(entryRow)}>
          <Trash2 className="size-4" />
          ลบ
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

interface IPayrollPersonalTable {
  rows: IPayrollEntryRow[]
  periodSummary: IPayrollPeriodSummary
  periodLabel: string
  avatarToneClass: string
  employeeName: string
  onEditEntry: (entry: IPayrollEntry) => void
  onCreateEntryClick: () => void
}

// ตารางรอบจ่ายทั้งหมดของพนักงานคนเดียวในงวดที่เลือก เรียงวันที่ใหม่→เก่า มีแถวรวมท้ายตาราง
// เกิน 20 รายการแสดง 20 แรกก่อนแล้วกดปุ่ม 'แสดงเพิ่ม' เพื่อดูต่อ mobile ยุบเป็น card list
export function PayrollPersonalTable({
  rows,
  periodSummary,
  periodLabel,
  avatarToneClass,
  employeeName,
  onEditEntry,
  onCreateEntryClick,
}: IPayrollPersonalTable) {
  const confirm = useConfirm()
  const onDeleteEntry = usePayrollStore((state) => state.onDeleteEntry)
  const [visibleCount, setVisibleCount] = useState(ENTRY_PAGE_SIZE)

  const onDelete = async (entryRow: IPayrollEntryRow) => {
    const isConfirmed = await confirm({
      title: 'ลบรอบจ่ายนี้?',
      description: 'รายจ่ายอัตโนมัติที่ผูกกับรอบจ่ายนี้จะถูกลบไปด้วย และกู้คืนไม่ได้',
      confirmLabel: 'ลบเลย',
      tone: 'danger',
    })
    if (!isConfirmed) return

    onDeleteEntry(entryRow.entry.id)
    toast.success('ลบรอบจ่ายเรียบร้อยแล้ว')
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col">
        <EmployeeIdentityHeader avatarToneClass={avatarToneClass} employeeName={employeeName} />
        <div className="p-6">
          <EmptyState
            icon={ReceiptText}
            title="ไม่มีรอบจ่ายในช่วงที่เลือก"
            description={`${periodLabel} ยังไม่มีรอบจ่ายของ${employeeName}`}
          >
            <Button onClick={onCreateEntryClick}>
              <Plus />
              เพิ่มรอบจ่าย
            </Button>
          </EmptyState>
        </div>
      </div>
    )
  }

  const visibleRows = rows.slice(0, visibleCount)
  const remainingCount = rows.length - visibleRows.length

  return (
    <div className="flex flex-col">
      <EmployeeIdentityHeader avatarToneClass={avatarToneClass} employeeName={employeeName} />

      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>วันที่</TableHead>
              <TableHead>หมายเหตุ</TableHead>
              <TableHead>รายการเงิน</TableHead>
              <TableHead className="text-right">จ่ายเพิ่ม</TableHead>
              <TableHead className="text-right">หัก</TableHead>
              <TableHead className="text-right">เงินสุทธิ</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleRows.map((entryRow) => (
              <TableRow key={entryRow.entry.id}>
                <TableCell className="whitespace-nowrap">{formatDate(entryRow.entry.date)}</TableCell>
                <TableCell className="max-w-40 truncate text-muted-foreground">
                  {entryRow.entry.note || '-'}
                </TableCell>
                <TableCell className="whitespace-normal">
                  <div className="flex flex-wrap gap-1.5">
                    {entryRow.entry.items.map((payItem) => (
                      <PayItemChip key={payItem.id} payItem={payItem} />
                    ))}
                  </div>
                </TableCell>
                <TableCell className="tabular text-right text-income">
                  {formatCurrency(entryRow.result.totalEarning)}
                </TableCell>
                <TableCell className="tabular text-right text-expense">
                  {entryRow.result.totalDeduction > 0 ? `-${formatCurrency(entryRow.result.totalDeduction)}` : '-'}
                </TableCell>
                <TableCell className="tabular text-right font-semibold">
                  {formatCurrency(entryRow.result.netPay)}
                </TableCell>
                <TableCell className="text-right">
                  <EntryActionsMenu entryRow={entryRow} onEditEntry={onEditEntry} onDelete={onDelete} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableCell colSpan={3} className="font-semibold">
                รวมทั้งหมด
              </TableCell>
              <TableCell className="tabular text-right font-semibold text-income">
                {formatCurrency(periodSummary.totalEarning)}
              </TableCell>
              <TableCell className="tabular text-right font-semibold text-expense">
                {periodSummary.totalDeduction > 0 ? `-${formatCurrency(periodSummary.totalDeduction)}` : '-'}
              </TableCell>
              <TableCell className="tabular text-right font-semibold">
                {formatCurrency(periodSummary.totalNetPay)}
              </TableCell>
              <TableCell />
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      <div className="flex flex-col gap-3 p-4 md:hidden">
        {visibleRows.map((entryRow) => (
          <div key={entryRow.entry.id} className="flex flex-col gap-2 rounded-xl border border-border p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">{formatDate(entryRow.entry.date)}</span>
              <EntryActionsMenu entryRow={entryRow} onEditEntry={onEditEntry} onDelete={onDelete} />
            </div>
            <p className="truncate text-xs text-muted-foreground">{entryRow.entry.note || '-'}</p>
            <div className="flex flex-wrap gap-1.5">
              {entryRow.entry.items.map((payItem) => (
                <PayItemChip key={payItem.id} payItem={payItem} />
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-border pt-2">
              <span className="text-sm text-muted-foreground">เงินสุทธิ</span>
              <span className="tabular text-base font-semibold">{formatCurrency(entryRow.result.netPay)}</span>
            </div>
          </div>
        ))}

        <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 p-4 font-semibold">
          <span>รวมทั้งหมด</span>
          <span className="tabular text-base">{formatCurrency(periodSummary.totalNetPay)}</span>
        </div>
      </div>

      {remainingCount > 0 && (
        <div className="flex justify-center px-4 py-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setVisibleCount((count) => count + ENTRY_PAGE_SIZE)}
          >
            แสดงเพิ่ม (เหลืออีก {formatNumber(remainingCount)})
          </Button>
        </div>
      )}
    </div>
  )
}
