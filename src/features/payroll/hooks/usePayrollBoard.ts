'use client'

import { useCallback, useMemo, useState } from 'react'
import { usePayrollStore } from '@/features/payroll/store/usePayrollStore'
import type {
  IDayOption,
  IEmployeePayrollRow,
  IMonthOption,
  IPayrollEntryRow,
  IPayrollPeriodSummary,
  IYearOption,
  PayrollBoardTab,
} from '@/features/payroll/type'
import { formatMonthName, getDaysInMonth } from '@/features/payroll/utils/dateOptions'
import { buildAvatarToneMap } from '@/features/payroll/utils/employee'
import type { IPayrollEntry } from '@/types/finance'
import { calcPayrollEntry } from '@/utils/calc'
import { formatNumber } from '@/utils/format'
import { getPeriodKey, getPeriodLabel, type PeriodGranularity } from '@/utils/period'

// ค่าที่หมายถึง 'ทุกปี' / 'ทั้งปี' / 'ทั้งเดือน' ใน Select ทั้งสามตัว
export const ALL_VALUE = 'all'

function getCurrentYear(): string {
  return String(new Date().getFullYear())
}

function getCurrentMonth(): string {
  return String(new Date().getMonth() + 1).padStart(2, '0')
}

// รวมยอดของกลุ่มรอบจ่ายที่กำหนด ใช้ทั้งสรุปรวมทั้งงวดและสรุปเฉพาะพนักงานคนเดียว
function summarizeEntries(entries: IPayrollEntry[]): IPayrollPeriodSummary {
  const results = entries.map((entry) => calcPayrollEntry(entry))
  const totalEarning = results.reduce((total, result) => total + result.totalEarning, 0)
  const totalDeduction = results.reduce((total, result) => total + result.totalDeduction, 0)
  const totalNetPay = results.reduce((total, result) => total + result.netPay, 0)
  const employeeIds = new Set(entries.map((entry) => entry.employeeId))

  return {
    entryCount: entries.length,
    employeeCount: employeeIds.size,
    totalEarning,
    totalDeduction,
    totalNetPay,
  }
}

// รวม logic ของหน้าค่าจ้างพนักงาน: ตัวกรองช่วงเวลา (ปี/เดือน/วันแยกกัน), แท็บภาพรวม/รายคน,
// สรุปรายคน+รวมทั้งงวด และรายการรอบจ่ายของพนักงานที่เลือกดูรายคน
export function usePayrollBoard() {
  const employees = usePayrollStore((state) => state.employees)
  const entries = usePayrollStore((state) => state.entries)

  const [activeTab, setActiveTab] = useState<PayrollBoardTab>('overview')

  // null = ผู้ใช้ยังไม่ได้เลือกปีเอง ให้ยึดปีปัจจุบันเป็นค่าเริ่มต้น
  // คงรูปแบบเดิมไว้ (ไม่คำนวณค่าเริ่มต้นตอน useState initializer) เพื่อความสม่ำเสมอกับตัวกรองอื่นในหน้านี้
  // แม้ปีปัจจุบันจะไม่ผูกกับ entries จึงไม่มีปัญหาเรื่อง hydration ก็ตาม
  const [selectedYear, setSelectedYear] = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string>(ALL_VALUE)
  const [selectedDay, setSelectedDay] = useState<string>(ALL_VALUE)

  const [employeeKeyword, setEmployeeKeyword] = useState('')
  const [showEmployeesWithoutEntries, setShowEmployeesWithoutEntries] = useState(true)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null)

  // ค่าเริ่มต้นของตัวกรองปีคือปีปัจจุบันเสมอ ไม่ว่าจะมีรอบจ่ายอยู่ในปีไหนก็ตาม
  const defaultYear = getCurrentYear()

  const yearValue = selectedYear ?? defaultYear
  const isAllYears = yearValue === ALL_VALUE

  const monthValue = selectedMonth
  const isAllMonths = monthValue === ALL_VALUE

  const dayValue = selectedDay
  const isAllDays = dayValue === ALL_VALUE

  // เปลี่ยนปีต้องรีเซ็ตเดือน+วัน เปลี่ยนเดือนต้องรีเซ็ตวัน ไม่งั้นค่าที่เลือกค้างจะไม่ตรงกับปี/เดือนใหม่
  const onYearChange = useCallback((nextYear: string) => {
    setSelectedYear(nextYear)
    setSelectedMonth(ALL_VALUE)
    setSelectedDay(ALL_VALUE)
  }, [])

  const onMonthChange = useCallback((nextMonth: string) => {
    setSelectedMonth(nextMonth)
    setSelectedDay(ALL_VALUE)
  }, [])

  const onDayChange = useCallback((nextDay: string) => {
    setSelectedDay(nextDay)
  }, [])

  // ตัวเลือกปี: 'ทุกปี' รวมกับทุกปีที่มีรอบจ่าย union กับปีปัจจุบัน เรียงใหม่→เก่า แสดงเป็น พ.ศ.
  const yearOptions = useMemo<IYearOption[]>(() => {
    const entryYears = entries.map((entry) => getPeriodKey(entry.date, 'year'))
    const uniqueYears = Array.from(new Set([...entryYears, getCurrentYear()])).sort((yearA, yearB) =>
      yearB.localeCompare(yearA),
    )

    return [
      { value: ALL_VALUE, label: 'ทุกปี' },
      ...uniqueYears.map((year) => ({ value: year, label: getPeriodLabel(year, 'year') })),
    ]
  }, [entries])

  // ตัวเลือกเดือน: ครบ 12 เดือนเสมอไม่ว่าจะมีข้อมูลหรือไม่ เดือนที่ไม่มีรอบจ่ายในปีที่เลือกจะมี hasData = false
  const monthOptions = useMemo<IMonthOption[]>(() => {
    const monthKeysWithData = new Set(
      entries
        .filter((entry) => getPeriodKey(entry.date, 'year') === yearValue)
        .map((entry) => getPeriodKey(entry.date, 'month')),
    )

    const months = Array.from({ length: 12 }, (_, index) => {
      const monthNumber = String(index + 1).padStart(2, '0')
      const monthKey = `${yearValue}-${monthNumber}`
      return { value: monthNumber, label: formatMonthName(index + 1), hasData: monthKeysWithData.has(monthKey) }
    })

    return [{ value: ALL_VALUE, label: 'ทั้งปี', hasData: true }, ...months]
  }, [entries, yearValue])

  // ตัวเลือกวัน: ครบทุกวันจริงของเดือน/ปีที่เลือก (รองรับปีอธิกสุรทิน) วันที่ไม่มีรอบจ่ายมี hasData = false
  // ปิดใช้งานตอนเลือก 'ทุกปี'/'ทั้งปี' อยู่ จึงคงเหลือแค่ตัวเลือก 'ทั้งเดือน' ตัวเดียวพอให้ Select แสดงผลได้
  const dayOptions = useMemo<IDayOption[]>(() => {
    const allOption: IDayOption = { value: ALL_VALUE, label: 'ทั้งเดือน', hasData: true }
    if (isAllYears || isAllMonths) return [allOption]

    const daysInMonth = getDaysInMonth(Number(yearValue), Number(monthValue))
    const dateKeysWithData = new Set(
      entries
        .filter((entry) => getPeriodKey(entry.date, 'month') === `${yearValue}-${monthValue}`)
        .map((entry) => getPeriodKey(entry.date, 'day')),
    )

    const days = Array.from({ length: daysInMonth }, (_, index) => {
      const dayNumber = String(index + 1).padStart(2, '0')
      const dayKey = `${yearValue}-${monthValue}-${dayNumber}`
      return { value: dayNumber, label: formatNumber(index + 1), hasData: dateKeysWithData.has(dayKey) }
    })

    return [allOption, ...days]
  }, [entries, isAllYears, isAllMonths, yearValue, monthValue])

  // อนุมาน granularity + periodKey จากตัวเลือกปี/เดือน/วันที่เลือกอยู่ ตามตารางใน spec
  const { granularity, periodKey } = useMemo(() => {
    if (isAllYears) return { granularity: null as PeriodGranularity | null, periodKey: null as string | null }
    if (isAllMonths) return { granularity: 'year' as PeriodGranularity, periodKey: yearValue }
    if (isAllDays) return { granularity: 'month' as PeriodGranularity, periodKey: `${yearValue}-${monthValue}` }
    return { granularity: 'day' as PeriodGranularity, periodKey: `${yearValue}-${monthValue}-${dayValue}` }
  }, [isAllYears, isAllMonths, isAllDays, yearValue, monthValue, dayValue])

  const periodLabel = granularity && periodKey ? getPeriodLabel(periodKey, granularity) : 'ทุกช่วงเวลา'

  // รอบจ่ายทั้งหมดที่อยู่ในช่วงที่เลือก (ไม่กรองเลยถ้าเลือก 'ทุกปี')
  const periodEntries = useMemo(() => {
    if (!granularity || !periodKey) return entries
    return entries.filter((entry) => getPeriodKey(entry.date, granularity) === periodKey)
  }, [entries, granularity, periodKey])

  const periodSummary = useMemo(() => summarizeEntries(periodEntries), [periodEntries])

  // แท็บภาพรวม: สรุปรายคนในงวดที่เลือก กรองด้วยคำค้น+สวิตช์ เรียงเงินสุทธิมาก→น้อย แล้วตามชื่อ
  const employeeRows = useMemo<IEmployeePayrollRow[]>(() => {
    const keyword = employeeKeyword.trim().toLowerCase()
    const filteredEmployees = keyword
      ? employees.filter((employee) => employee.name.toLowerCase().includes(keyword))
      : employees

    const rows = filteredEmployees.map((employee) => {
      const employeeEntries = periodEntries.filter((entry) => entry.employeeId === employee.id)
      const summary = summarizeEntries(employeeEntries)

      return {
        employee,
        entryCount: summary.entryCount,
        totalEarning: summary.totalEarning,
        totalDeduction: summary.totalDeduction,
        totalNetPay: summary.totalNetPay,
      } satisfies IEmployeePayrollRow
    })

    const visibleRows = showEmployeesWithoutEntries ? rows : rows.filter((row) => row.entryCount > 0)

    return [...visibleRows].sort((rowA, rowB) => {
      if (rowB.totalNetPay !== rowA.totalNetPay) return rowB.totalNetPay - rowA.totalNetPay
      return rowA.employee.name.localeCompare(rowB.employee.name, 'th')
    })
  }, [employees, periodEntries, employeeKeyword, showEmployeesWithoutEntries])

  // ตารางสี Avatar ต่อพนักงาน คำนวณจาก employees ดิบ (ลำดับสร้างของ store) เท่านั้น
  // ไม่ใช้ employeeRows เพราะโดนกรอง/เรียงแล้ว สีจะเปลี่ยนไปมาเวลาค้นหา/เรียงตาราง
  const avatarToneByEmployeeId = useMemo(() => buildAvatarToneMap(employees), [employees])

  // เลือกพนักงานคนใหม่ในแท็บ 'รายคน' (รวมถึงตอนกดปุ่ม 'ดูรายคน' จากแท็บภาพรวม)
  // ต้องรีเซ็ตตัวกรองเวลาเป็นปี/เดือนปัจจุบันเสมอ เพื่อให้เห็นข้อมูลล่าสุดของคนที่เพิ่งเลือกทันที
  // ไม่ค้างช่วงเวลาที่เคยเลือกไว้ของพนักงานคนก่อนหน้าซึ่งอาจไม่มีข้อมูลของคนใหม่เลย
  const onSelectEmployee = useCallback((employeeId: string) => {
    setSelectedEmployeeId(employeeId)
    setSelectedYear(getCurrentYear())
    setSelectedMonth(getCurrentMonth())
    setSelectedDay(ALL_VALUE)
  }, [])

  // กดปุ่ม 'ดูรายคน' ที่แถวพนักงาน: สลับไปแท็บ 'รายคน' พร้อมเลือกพนักงานคนนั้นให้ทันที
  const onViewEmployeePersonal = useCallback(
    (employeeId: string) => {
      onSelectEmployee(employeeId)
      setActiveTab('personal')
    },
    [onSelectEmployee],
  )

  const selectedEmployee = useMemo(
    () => employees.find((employee) => employee.id === selectedEmployeeId) ?? null,
    [employees, selectedEmployeeId],
  )

  // แท็บรายคน: รอบจ่ายทั้งหมดของพนักงานที่เลือกในงวดนี้ เรียงวันที่ใหม่→เก่า
  const selectedEmployeeEntries = useMemo<IPayrollEntryRow[]>(() => {
    if (!selectedEmployee) return []
    return periodEntries
      .filter((entry) => entry.employeeId === selectedEmployee.id)
      .map((entry) => ({ entry, employee: selectedEmployee, result: calcPayrollEntry(entry) }))
      .sort((rowA, rowB) => rowB.entry.date.localeCompare(rowA.entry.date))
  }, [periodEntries, selectedEmployee])

  const selectedEmployeeSummary = useMemo(
    () => summarizeEntries(selectedEmployeeEntries.map((row) => row.entry)),
    [selectedEmployeeEntries],
  )

  return {
    activeTab,
    onActiveTabChange: setActiveTab,

    yearOptions,
    yearValue,
    onYearChange,
    monthOptions,
    monthValue,
    onMonthChange,
    monthDisabled: isAllYears,
    dayOptions,
    dayValue,
    onDayChange,
    dayDisabled: isAllYears || isAllMonths,
    periodLabel,

    periodSummary,
    employeeRows,
    employeeKeyword,
    onEmployeeKeywordChange: setEmployeeKeyword,
    showEmployeesWithoutEntries,
    onToggleShowEmployeesWithoutEntries: () => setShowEmployeesWithoutEntries((value) => !value),
    onViewEmployeePersonal,
    avatarToneByEmployeeId,

    employees,
    selectedEmployeeId,
    onSelectEmployee,
    selectedEmployee,
    selectedEmployeeEntries,
    selectedEmployeeSummary,

    hasEmployees: employees.length > 0,
    hasEntries: entries.length > 0,
  }
}
