'use client'

import { ArrowRight, MoreHorizontal, Pencil, Plus, SearchX, Trash2, UserPlus, Users } from 'lucide-react'
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
import type { IEmployeePayrollRow, IPayrollPeriodSummary } from '@/features/payroll/type'
import { DEFAULT_AVATAR_TONE_CLASS, getInitials } from '@/features/payroll/utils/employee'
import type { IEmployee } from '@/types/finance'
import { cn } from '@/lib/utils'
import { formatCurrency, formatNumber } from '@/utils/format'

interface IEmployeeActionsMenu {
  row: IEmployeePayrollRow
  onCreateEntryForEmployee: (employeeId: string) => void
  onEditEmployee: (employee: IEmployee) => void
  onViewEmployeePersonal: (employeeId: string) => void
}

// เหมือน IEmployeeActionsMenu แต่เพิ่ม avatarToneByEmployeeId สำหรับแถว/การ์ดที่ต้องแสดง Avatar ด้วย
interface IEmployeePayrollRowActions extends IEmployeeActionsMenu {
  avatarToneByEmployeeId: Record<string, string>
}

// รวม logic ยืนยัน+toast ของการลบพนักงาน ใช้ร่วมกันทั้งแถวตาราง desktop และการ์ด mobile
function useEmployeeRowActions(employee: IEmployee) {
  const confirm = useConfirm()
  const onDeleteEmployee = usePayrollStore((state) => state.onDeleteEmployee)

  const onDelete = async () => {
    const isConfirmed = await confirm({
      title: `ลบ ${employee.name}?`,
      description: 'รอบจ่ายและรายจ่ายอัตโนมัติที่ผูกกับพนักงานคนนี้ทั้งหมดจะถูกลบไปด้วย และกู้คืนไม่ได้',
      confirmLabel: 'ลบเลย',
      tone: 'danger',
    })
    if (!isConfirmed) return

    onDeleteEmployee(employee.id)
    toast.success('ลบพนักงานเรียบร้อยแล้ว')
  }

  return { onDelete }
}

// เมนูจัดการพนักงาน (เพิ่มรอบจ่าย/แก้ไข/ลบ) ใช้ร่วมกันทั้งแถวตาราง desktop และการ์ด mobile
function EmployeeActionsMenu({ row, onCreateEntryForEmployee, onEditEmployee }: IEmployeeActionsMenu) {
  const { employee } = row
  const { onDelete } = useEmployeeRowActions(employee)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" onClick={(event) => event.stopPropagation()}>
          <MoreHorizontal />
          <span className="sr-only">เมนูพนักงาน</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onCreateEntryForEmployee(employee.id)}>
          <Plus className="size-4" />
          เพิ่มรอบจ่ายให้คนนี้
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEditEmployee(employee)}>
          <Pencil className="size-4" />
          แก้ไขข้อมูลพนักงาน
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={onDelete}>
          <Trash2 className="size-4" />
          ลบพนักงาน
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// หนึ่งแถวพนักงานในตาราง desktop ของแท็บภาพรวม กด 'ดูรายคน' เพื่อสลับไปดูรายการรอบจ่ายของคนนี้ในแท็บรายคน
function EmployeeDesktopRow({
  row,
  avatarToneByEmployeeId,
  onCreateEntryForEmployee,
  onEditEmployee,
  onViewEmployeePersonal,
}: IEmployeePayrollRowActions) {
  const { employee, entryCount, totalEarning, totalDeduction, totalNetPay } = row
  const hasEntries = entryCount > 0
  const avatarToneClass = avatarToneByEmployeeId[employee.id] ?? DEFAULT_AVATAR_TONE_CLASS

  return (
    <TableRow className={cn(!hasEntries && 'text-muted-foreground')}>
      <TableCell className="min-w-52">
        <div className="flex items-center gap-2.5">
          <Avatar size="lg">
            <AvatarFallback className={cn(avatarToneClass, 'font-semibold')}>
              {getInitials(employee.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-base font-semibold text-foreground">{employee.name}</span>
            {employee.note && <span className="truncate text-xs text-muted-foreground">{employee.note}</span>}
          </div>
        </div>
      </TableCell>
      <TableCell className="tabular text-center">{formatNumber(entryCount)}</TableCell>
      <TableCell className={cn('tabular text-right', hasEntries && 'text-income')}>
        {formatCurrency(totalEarning)}
      </TableCell>
      <TableCell className={cn('tabular text-right', hasEntries && 'text-expense')}>
        {totalDeduction > 0 ? `-${formatCurrency(totalDeduction)}` : '-'}
      </TableCell>
      <TableCell className="tabular text-right text-base font-semibold">{formatCurrency(totalNetPay)}</TableCell>
      <TableCell className="text-right">
        <Button variant="ghost" size="sm" onClick={() => onViewEmployeePersonal(employee.id)}>
          ดูรายคน
          <ArrowRight />
        </Button>
      </TableCell>
      <TableCell className="text-right">
        <EmployeeActionsMenu
          row={row}
          onCreateEntryForEmployee={onCreateEntryForEmployee}
          onEditEmployee={onEditEmployee}
          onViewEmployeePersonal={onViewEmployeePersonal}
        />
      </TableCell>
    </TableRow>
  )
}

// การ์ดพนักงานหนึ่งใบสำหรับ mobile แทนแถวตาราง โครงสร้างข้อมูลเหมือนกันแค่จัด layout ใหม่ให้เหมาะจอเล็ก
function EmployeeMobileCard({
  row,
  avatarToneByEmployeeId,
  onCreateEntryForEmployee,
  onEditEmployee,
  onViewEmployeePersonal,
}: IEmployeePayrollRowActions) {
  const { employee, entryCount, totalEarning, totalDeduction, totalNetPay } = row
  const hasEntries = entryCount > 0
  const avatarToneClass = avatarToneByEmployeeId[employee.id] ?? DEFAULT_AVATAR_TONE_CLASS

  return (
    <div className={cn('flex flex-col gap-3 rounded-xl border border-border p-4', !hasEntries && 'text-muted-foreground')}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <Avatar size="lg">
            <AvatarFallback className={cn(avatarToneClass, 'font-semibold')}>
              {getInitials(employee.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-base font-semibold text-foreground">{employee.name}</span>
            {employee.note && <span className="truncate text-xs text-muted-foreground">{employee.note}</span>}
          </div>
        </div>

        <EmployeeActionsMenu
          row={row}
          onCreateEntryForEmployee={onCreateEntryForEmployee}
          onEditEmployee={onEditEmployee}
          onViewEmployeePersonal={onViewEmployeePersonal}
        />
      </div>

      <div className="flex items-baseline justify-between">
        <span className="text-sm text-muted-foreground">เงินสุทธิ</span>
        <span className="tabular text-base font-semibold">{formatCurrency(totalNetPay)}</span>
      </div>

      <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/40 p-3 text-center">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">จ่ายเพิ่ม</span>
          <span className={cn('tabular text-sm', hasEntries && 'text-income')}>{formatCurrency(totalEarning)}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">หัก</span>
          <span className={cn('tabular text-sm', hasEntries && 'text-expense')}>
            {totalDeduction > 0 ? `-${formatCurrency(totalDeduction)}` : '-'}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">รอบจ่าย</span>
          <span className="tabular text-sm">{formatNumber(entryCount)}</span>
        </div>
      </div>

      <Button type="button" variant="ghost" size="sm" onClick={() => onViewEmployeePersonal(employee.id)}>
        ดูรายคน
        <ArrowRight />
      </Button>
    </div>
  )
}

interface IPayrollTable {
  employeeRows: IEmployeePayrollRow[]
  periodSummary: IPayrollPeriodSummary
  hasEmployees: boolean
  employeeKeyword: string
  avatarToneByEmployeeId: Record<string, string>
  onResetEmployeeKeyword: () => void
  onCreateEmployeeClick: () => void
  onCreateEntryClick: () => void
  onCreateEntryForEmployee: (employeeId: string) => void
  onEditEmployee: (employee: IEmployee) => void
  onViewEmployeePersonal: (employeeId: string) => void
}

// ตารางหลักของแท็บภาพรวม: สรุปรายคนในงวดที่เลือก พร้อมแถวรวมท้ายตาราง ดูรายละเอียดรายตัวได้ผ่านปุ่ม 'ดูรายคน'
export function PayrollTable({
  employeeRows,
  periodSummary,
  hasEmployees,
  employeeKeyword,
  avatarToneByEmployeeId,
  onResetEmployeeKeyword,
  onCreateEmployeeClick,
  onCreateEntryClick,
  onCreateEntryForEmployee,
  onEditEmployee,
  onViewEmployeePersonal,
}: IPayrollTable) {
  if (!hasEmployees) {
    return (
      <div className="p-6">
        <EmptyState icon={Users} title="ยังไม่มีพนักงาน" description="เพิ่มพนักงานคนแรกเพื่อเริ่มบันทึกค่าจ้าง">
          <Button onClick={onCreateEmployeeClick}>
            <UserPlus />
            เพิ่มพนักงาน
          </Button>
        </EmptyState>
      </div>
    )
  }

  if (employeeRows.length === 0) {
    const isKeywordFiltered = employeeKeyword.trim().length > 0

    return (
      <div className="p-6">
        <EmptyState
          icon={SearchX}
          title={isKeywordFiltered ? 'ไม่พบพนักงานที่ตรงกับคำค้น' : 'ไม่มีพนักงานที่มีรอบจ่ายในงวดนี้'}
          description={
            isKeywordFiltered
              ? 'ลองเปลี่ยนคำค้นหาดูอีกครั้ง'
              : 'เปิดสวิตช์ "แสดงพนักงานที่ไม่มีรอบจ่าย" เพื่อดูพนักงานทุกคน'
          }
        >
          {isKeywordFiltered && (
            <Button variant="outline" onClick={onResetEmployeeKeyword}>
              ล้างคำค้น
            </Button>
          )}
        </EmptyState>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>พนักงาน</TableHead>
              <TableHead className="text-center">รอบจ่าย</TableHead>
              <TableHead className="text-right">จ่ายเพิ่ม</TableHead>
              <TableHead className="text-right">หัก</TableHead>
              <TableHead className="text-right">เงินสุทธิ</TableHead>
              <TableHead className="w-28" />
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {employeeRows.map((row) => (
              <EmployeeDesktopRow
                key={row.employee.id}
                row={row}
                avatarToneByEmployeeId={avatarToneByEmployeeId}
                onCreateEntryForEmployee={onCreateEntryForEmployee}
                onEditEmployee={onEditEmployee}
                onViewEmployeePersonal={onViewEmployeePersonal}
              />
            ))}
          </TableBody>
          <TableFooter>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableCell className="font-semibold">รวมทั้งหมด</TableCell>
              <TableCell className="tabular text-center font-semibold">
                {formatNumber(periodSummary.entryCount)}
              </TableCell>
              <TableCell className="tabular text-right font-semibold text-income">
                {formatCurrency(periodSummary.totalEarning)}
              </TableCell>
              <TableCell className="tabular text-right font-semibold text-expense">
                {periodSummary.totalDeduction > 0 ? `-${formatCurrency(periodSummary.totalDeduction)}` : '-'}
              </TableCell>
              <TableCell className="tabular text-right text-base font-semibold">
                {formatCurrency(periodSummary.totalNetPay)}
              </TableCell>
              <TableCell />
              <TableCell />
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      <div className="flex flex-col gap-3 p-4 md:hidden">
        {employeeRows.map((row) => (
          <EmployeeMobileCard
            key={row.employee.id}
            row={row}
            avatarToneByEmployeeId={avatarToneByEmployeeId}
            onCreateEntryForEmployee={onCreateEntryForEmployee}
            onEditEmployee={onEditEmployee}
            onViewEmployeePersonal={onViewEmployeePersonal}
          />
        ))}

        <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 p-4 font-semibold">
          <span>รวมทั้งหมด</span>
          <span className="tabular text-base">{formatCurrency(periodSummary.totalNetPay)}</span>
        </div>
      </div>

      {periodSummary.entryCount === 0 && (
        <div className="flex flex-col items-center gap-3 py-6 text-center text-muted-foreground">
          <p>ยังไม่มีรอบจ่ายในงวดนี้</p>
          <Button size="sm" onClick={onCreateEntryClick}>
            <Plus />
            เพิ่มรอบจ่าย
          </Button>
        </div>
      )}
    </div>
  )
}
