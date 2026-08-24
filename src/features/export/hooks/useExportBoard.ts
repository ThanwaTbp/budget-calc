'use client'

import { useMemo, useState } from 'react'
import { ArrowLeftRight, CalendarDays, Ticket, Users, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import { useTransactionStore } from '@/features/transactions/store/useTransactionStore'
import { usePayrollStore } from '@/features/payroll/store/usePayrollStore'
import { usePlannerStore } from '@/features/planner/store/usePlannerStore'
import { useLotteryTicketStore } from '@/features/lottery/store/useLotteryTicketStore'
import { buildCsvContent, downloadCsv } from '@/features/export/utils/csv'
import {
  buildEmployeeRows,
  buildLotteryTicketRows,
  buildPayrollRows,
  buildTaskRows,
  buildTransactionRows,
} from '@/features/export/utils/exportBuilders'
import type { IExportDataset } from '@/features/export/type'
import { toLocalDateString } from '@/utils/date'

export function useExportBoard() {
  const transactions = useTransactionStore((state) => state.transactions)
  const categories = useTransactionStore((state) => state.categories)
  const employees = usePayrollStore((state) => state.employees)
  const entries = usePayrollStore((state) => state.entries)
  const tasks = usePlannerStore((state) => state.tasks)
  const tickets = useLotteryTicketStore((state) => state.tickets)

  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const onSelectThisMonth = () => {
    const today = new Date()
    setFromDate(toLocalDateString(new Date(today.getFullYear(), today.getMonth(), 1)))
    setToDate(toLocalDateString(today))
  }

  const onSelectThisYear = () => {
    const today = new Date()
    setFromDate(toLocalDateString(new Date(today.getFullYear(), 0, 1)))
    setToDate(toLocalDateString(today))
  }

  const onSelectAllTime = () => {
    setFromDate('')
    setToDate('')
  }

  const datasets: IExportDataset[] = useMemo(
    () => [
      {
        key: 'transactions',
        title: 'รายรับ-รายจ่าย',
        description: 'รายการรายรับและรายจ่ายทั้งหมด',
        icon: ArrowLeftRight,
        hasDateRange: true,
        fileSlug: 'transactions',
        table: buildTransactionRows(transactions, categories, fromDate, toDate),
      },
      {
        key: 'employees',
        title: 'พนักงาน',
        description: 'รายชื่อพนักงานทั้งหมด',
        icon: Users,
        hasDateRange: false,
        fileSlug: 'employees',
        table: buildEmployeeRows(employees),
      },
      {
        key: 'payroll',
        title: 'รอบจ่ายค่าจ้าง',
        description: 'ประวัติการจ่ายค่าจ้างแต่ละรอบ',
        icon: Wallet,
        hasDateRange: true,
        fileSlug: 'payroll',
        table: buildPayrollRows(entries, employees, fromDate, toDate),
      },
      {
        key: 'tasks',
        title: 'งานในปฏิทิน',
        description: 'งานที่บันทึกไว้ในตัววางแผนงาน',
        icon: CalendarDays,
        hasDateRange: true,
        fileSlug: 'tasks',
        table: buildTaskRows(tasks, fromDate, toDate),
      },
      {
        key: 'lotteryTickets',
        title: 'เลขหวยที่บันทึก',
        description: 'เลขสลากที่บันทึกไว้ตรวจย้อนหลัง',
        icon: Ticket,
        hasDateRange: false,
        fileSlug: 'lottery-tickets',
        table: buildLotteryTicketRows(tickets),
      },
    ],
    [transactions, categories, employees, entries, tasks, tickets, fromDate, toDate],
  )

  const onDownload = (dataset: IExportDataset) => {
    const csvContent = buildCsvContent(dataset.table.headers, dataset.table.rows)
    const fileName = `budget-calc-${dataset.fileSlug}-${toLocalDateString(new Date())}.csv`
    downloadCsv(fileName, csvContent)
    toast.success(`ดาวน์โหลด ${fileName} แล้ว`)
  }

  return {
    fromDate,
    toDate,
    onChangeFromDate: setFromDate,
    onChangeToDate: setToDate,
    onSelectThisMonth,
    onSelectThisYear,
    onSelectAllTime,
    datasets,
    onDownload,
  }
}
