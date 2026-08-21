import type { IEmployee, IPayrollEntry, IPayrollResult, PayItemKind } from '@/types/finance'

// input สำหรับสร้าง/แก้ไขพนักงาน (ตาม Store contract ใน SPEC.md)
export interface IEmployeeInput {
  name: string
  note: string
}

// input สำหรับหนึ่งบรรทัดรายการเงินในรอบจ่าย
export interface IPayItemInput {
  label: string
  amount: number
  kind: PayItemKind
}

// input สำหรับสร้าง/แก้ไขรอบจ่ายค่าจ้างหนึ่งรอบ
export interface IPayrollEntryInput {
  employeeId: string
  date: string
  note: string
  items: IPayItemInput[]
}

// รอบจ่ายหนึ่งรอบพร้อมข้อมูลพนักงานและผลคำนวณ ใช้แสดงในตารางย่อยที่กางออกของแต่ละคน
export interface IPayrollEntryRow {
  entry: IPayrollEntry
  employee: IEmployee
  result: IPayrollResult
}

// สรุปของพนักงานหนึ่งคนภายในงวดที่เลือก = หนึ่งแถวในตารางหลักของแท็บภาพรวม
export interface IEmployeePayrollRow {
  employee: IEmployee
  entryCount: number
  totalEarning: number
  totalDeduction: number
  totalNetPay: number
}

// สรุปรวมของทั้งงวด ใช้แสดงแถบสรุปและแถวรวมท้ายตาราง (ใช้ซ้ำได้ทั้งสรุปรวมทั้งงวดและสรุปเฉพาะพนักงานคนเดียว)
export interface IPayrollPeriodSummary {
  entryCount: number
  employeeCount: number
  totalEarning: number
  totalDeduction: number
  totalNetPay: number
}

// ตัวเลือกปีใน Select — value เป็น 'all' (ทุกปี) หรือปี ค.ศ. เช่น '2026'
export interface IYearOption {
  value: string
  label: string
}

// ตัวเลือกเดือน/วันใน Select — hasData บอกว่าช่วงนั้นมีรอบจ่ายจริงไหม เพื่อแสดงป้ายสถานะสีเขียว/แดง แต่ยังเลือกได้
export interface IMonthOption {
  value: string
  label: string
  hasData: boolean
}

export interface IDayOption {
  value: string
  label: string
  hasData: boolean
}

// แท็บบนสุดของหน้าค่าจ้าง: ภาพรวมทั้งหมด vs ดูรายคน
export type PayrollBoardTab = 'overview' | 'personal'
