'use client'

import { Link2, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useConfirm } from '@/components/common/ConfirmProvider'
import { MoneyText } from '@/components/common/MoneyText'
import { CategoryIcon } from '@/features/transactions/ui/CategoryIcon'
import { useTransactionStore } from '@/features/transactions/store/useTransactionStore'
import type { ICategory, ITransaction } from '@/types/finance'
import { formatDate } from '@/utils/format'
import { cn } from '@/lib/utils'

interface ITransactionTable {
  transactions: ITransaction[]
  categories: ICategory[]
  onEdit: (transaction: ITransaction) => void
}

// รายการที่มาจากรอบจ่ายค่าจ้างต้องไปแก้ที่หน้าค่าจ้างพนักงานเท่านั้น กดแก้ไข/ลบตรงนี้ไม่ได้
const payrollLockedMessage = 'รายการนี้มาจากรอบจ่ายค่าจ้าง แก้ไขได้ที่หน้าค่าจ้างพนักงาน'

export function TransactionTable({ transactions, categories, onEdit }: ITransactionTable) {
  const onDeleteTransaction = useTransactionStore((state) => state.onDelete)
  const confirm = useConfirm()

  const getCategory = (categoryId: string) => categories.find((category) => category.id === categoryId)

  const onEditClick = (transaction: ITransaction) => {
    if (transaction.source === 'payroll') {
      toast.info(payrollLockedMessage)
      return
    }
    onEdit(transaction)
  }

  const onDeleteClick = async (transaction: ITransaction) => {
    if (transaction.source === 'payroll') {
      toast.info(payrollLockedMessage)
      return
    }

    const isConfirmed = await confirm({
      title: 'ลบรายการนี้?',
      description: 'รายการจะถูกลบถาวรและกู้คืนไม่ได้',
      confirmLabel: 'ลบเลย',
      tone: 'danger',
    })
    if (!isConfirmed) return

    onDeleteTransaction(transaction.id)
    toast.success('ลบรายการแล้ว')
  }

  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>วันที่</TableHead>
              <TableHead>หมวดหมู่</TableHead>
              <TableHead>บันทึก</TableHead>
              <TableHead>ประเภท</TableHead>
              <TableHead className="text-right">จำนวนเงิน</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => {
              const category = getCategory(transaction.categoryId)
              const isPayrollSource = transaction.source === 'payroll'

              return (
                <TableRow key={transaction.id}>
                  <TableCell className="text-muted-foreground">{formatDate(transaction.date)}</TableCell>
                  <TableCell className="max-w-40">
                    <div className="flex min-w-0 items-center gap-2">
                      <CategoryIcon icon={category?.icon ?? 'Circle'} />
                      <span className="truncate">{category?.name ?? 'ไม่ระบุหมวดหมู่'}</span>
                      {isPayrollSource && <PayrollSourceBadge />}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-56 truncate text-muted-foreground">
                    {transaction.note || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        transaction.type === 'income'
                          ? 'border-transparent bg-income-muted text-income'
                          : 'border-transparent bg-expense-muted text-expense'
                      }
                    >
                      {transaction.type === 'income' ? 'รายรับ' : 'รายจ่าย'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <MoneyText
                      amount={transaction.type === 'expense' ? -transaction.amount : transaction.amount}
                      variant={transaction.type}
                      showSign
                      className="text-base font-semibold"
                    />
                  </TableCell>
                  <TableCell>
                    <TransactionRowMenu
                      transaction={transaction}
                      onEditClick={onEditClick}
                      onDeleteClick={onDeleteClick}
                    />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 md:hidden">
        {transactions.map((transaction) => {
          const category = getCategory(transaction.categoryId)
          const isPayrollSource = transaction.source === 'payroll'

          return (
            <div key={transaction.id} className="flex flex-col gap-3 rounded-xl border border-border p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <CategoryIcon icon={category?.icon ?? 'Circle'} />
                  <div className="flex min-w-0 flex-col">
                    <span className="flex min-w-0 items-center gap-1.5 text-base font-medium">
                      <span className="truncate">{category?.name ?? 'ไม่ระบุหมวดหมู่'}</span>
                      {isPayrollSource && <PayrollSourceBadge />}
                    </span>
                    <span className="text-sm text-muted-foreground">{formatDate(transaction.date)}</span>
                  </div>
                </div>
                <TransactionRowMenu
                  transaction={transaction}
                  onEditClick={onEditClick}
                  onDeleteClick={onDeleteClick}
                />
              </div>

              <div className="flex items-center justify-between">
                <Badge
                  className={
                    transaction.type === 'income'
                      ? 'border-transparent bg-income-muted text-income'
                      : 'border-transparent bg-expense-muted text-expense'
                  }
                >
                  {transaction.type === 'income' ? 'รายรับ' : 'รายจ่าย'}
                </Badge>
                <MoneyText
                  amount={transaction.type === 'expense' ? -transaction.amount : transaction.amount}
                  variant={transaction.type}
                  showSign
                  className="text-base font-semibold"
                />
              </div>

              {transaction.note && <p className="text-sm text-muted-foreground">{transaction.note}</p>}
            </div>
          )
        })}
      </div>
    </>
  )
}

// ป้าย 'อัตโนมัติ' ติดที่รายการซึ่งถูกสร้างจากรอบจ่ายค่าจ้าง พร้อมคำอธิบายที่มาเมื่อชี้เมาส์
function PayrollSourceBadge() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge className="gap-1 border-transparent bg-muted text-muted-foreground">
          <Link2 className="size-3" />
          อัตโนมัติ
        </Badge>
      </TooltipTrigger>
      <TooltipContent>สร้างจากรอบจ่ายค่าจ้าง แก้ไขได้ที่หน้าค่าจ้างพนักงาน</TooltipContent>
    </Tooltip>
  )
}

interface ITransactionRowMenu {
  transaction: ITransaction
  onEditClick: (transaction: ITransaction) => void
  onDeleteClick: (transaction: ITransaction) => void
}

// เมนู แก้ไข/ลบ ของแต่ละรายการ — รายการที่มาจากค่าจ้างจะแสดงเป็นตัวเลือกที่ปิดใช้งาน (แต่ยังกดได้เพื่อแจ้งเตือน)
function TransactionRowMenu({ transaction, onEditClick, onDeleteClick }: ITransactionRowMenu) {
  const isPayrollSource = transaction.source === 'payroll'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          className={cn(isPayrollSource && 'cursor-not-allowed text-muted-foreground opacity-70')}
          title={isPayrollSource ? payrollLockedMessage : undefined}
          onClick={() => onEditClick(transaction)}
        >
          <Pencil className="size-4" />
          แก้ไข
        </DropdownMenuItem>
        <DropdownMenuItem
          variant={isPayrollSource ? 'default' : 'destructive'}
          className={cn(isPayrollSource && 'cursor-not-allowed text-muted-foreground opacity-70')}
          title={isPayrollSource ? payrollLockedMessage : undefined}
          onClick={() => onDeleteClick(transaction)}
        >
          <Trash2 className="size-4" />
          ลบ
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
