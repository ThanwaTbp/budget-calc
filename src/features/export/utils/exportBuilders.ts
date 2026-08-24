// ประกอบข้อมูลดิบของแต่ละฟีเจอร์ให้เป็นตาราง CSV (header ภาษาไทย + rows) — pure ทั้งหมด ไม่แตะ DOM/store
import type { ICategory, IEmployee, IPayrollEntry, ITransaction, TransactionSource, TransactionType } from '@/types/finance'
import type { ITask, TaskStatus } from '@/types/planner'
import type { ILotteryTicket } from '@/types/lottery'
import { calcPayrollEntry } from '@/utils/calc'
import { formatDate } from '@/utils/format'

export interface ICsvTable {
  headers: string[]
  rows: Array<Array<string | number>>
}

const TRANSACTION_TYPE_LABEL: Record<TransactionType, string> = {
  income: 'รายรับ',
  expense: 'รายจ่าย',
}

const TRANSACTION_SOURCE_LABEL: Record<TransactionSource, string> = {
  manual: 'บันทึกเอง',
  payroll: 'จากค่าจ้าง',
}

const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  todo: 'ค้างอยู่',
  done: 'เสร็จแล้ว',
}

// กรองช่วงวันที่แบบรวมปลายทั้งสองข้าง — ค่าว่าง ('') ของ fromDate/toDate หมายถึงไม่กรองด้านนั้น
// เทียบ string ตรงๆ ได้เพราะทุกวันที่ในระบบเป็นรูปแบบ 'yyyy-MM-dd' ซึ่งเรียงตามลำดับเวลาได้พอดี
function isWithinDateRange(date: string, fromDate: string, toDate: string): boolean {
  if (fromDate && date < fromDate) return false
  if (toDate && date > toDate) return false
  return true
}

export function buildTransactionRows(
  transactions: ITransaction[],
  categories: ICategory[],
  fromDate: string,
  toDate: string,
): ICsvTable {
  const headers = ['วันที่', 'ประเภท', 'หมวดหมู่', 'จำนวนเงิน', 'บันทึกช่วยจำ', 'ที่มา']

  const rows = transactions
    .filter((transaction) => isWithinDateRange(transaction.date, fromDate, toDate))
    .sort((transactionA, transactionB) => transactionA.date.localeCompare(transactionB.date))
    .map((transaction) => {
      const category = categories.find((categoryItem) => categoryItem.id === transaction.categoryId)

      return [
        transaction.date,
        TRANSACTION_TYPE_LABEL[transaction.type],
        category?.name ?? 'ไม่ระบุหมวดหมู่',
        transaction.amount,
        transaction.note,
        TRANSACTION_SOURCE_LABEL[transaction.source],
      ]
    })

  return { headers, rows }
}

export function buildEmployeeRows(employees: IEmployee[]): ICsvTable {
  const headers = ['ชื่อพนักงาน', 'หมายเหตุ', 'วันที่สร้าง']

  const rows = [...employees]
    .sort((employeeA, employeeB) => employeeA.createdAt.localeCompare(employeeB.createdAt))
    .map((employee) => [employee.name, employee.note, formatDate(employee.createdAt)])

  return { headers, rows }
}

// รวมรายการเงินของรอบจ่ายหนึ่งรอบเป็นข้อความบรรทัดเดียว เช่น 'ค่าแรง 500; ค่ารถ 500; หักเบิกล่วงหน้า -200'
// รายการที่เป็น deduction ใส่เครื่องหมายลบนำหน้า เพื่อให้อ่านแล้วรู้ทันทีว่าเป็นเงินที่ถูกหัก
function buildPayrollItemsText(entry: IPayrollEntry): string {
  return entry.items
    .map((item) => `${item.label} ${item.kind === 'deduction' ? '-' : ''}${item.amount}`)
    .join('; ')
}

export function buildPayrollRows(
  entries: IPayrollEntry[],
  employees: IEmployee[],
  fromDate: string,
  toDate: string,
): ICsvTable {
  const headers = ['วันที่', 'พนักงาน', 'จ่ายเพิ่มรวม', 'หักรวม', 'เงินสุทธิ', 'รายการเงิน', 'หมายเหตุ']

  const rows = entries
    .filter((entry) => isWithinDateRange(entry.date, fromDate, toDate))
    .sort((entryA, entryB) => entryA.date.localeCompare(entryB.date))
    .map((entry) => {
      const employee = employees.find((employeeItem) => employeeItem.id === entry.employeeId)
      const { totalEarning, totalDeduction, netPay } = calcPayrollEntry(entry)

      return [
        entry.date,
        employee?.name ?? 'ไม่ระบุพนักงาน',
        totalEarning,
        totalDeduction,
        netPay,
        buildPayrollItemsText(entry),
        entry.note,
      ]
    })

  return { headers, rows }
}

export function buildTaskRows(tasks: ITask[], fromDate: string, toDate: string): ICsvTable {
  const headers = ['วันที่', 'เวลาเริ่ม', 'เวลาสิ้นสุด', 'ชื่องาน', 'สถานะ', 'รายละเอียด']

  const rows = tasks
    .filter((task) => isWithinDateRange(task.date, fromDate, toDate))
    .sort((taskA, taskB) => taskA.date.localeCompare(taskB.date))
    .map((task) => [task.date, task.startTime, task.endTime, task.title, TASK_STATUS_LABEL[task.status], task.detail])

  return { headers, rows }
}

export function buildLotteryTicketRows(tickets: ILotteryTicket[]): ICsvTable {
  const headers = ['เลข', 'หมายเหตุ', 'วันที่บันทึก']

  const rows = [...tickets]
    .sort((ticketA, ticketB) => ticketA.createdAt.localeCompare(ticketB.createdAt))
    .map((ticket) => [ticket.number, ticket.note, formatDate(ticket.createdAt)])

  return { headers, rows }
}
