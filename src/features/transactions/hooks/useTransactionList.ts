'use client'

import { useMemo, useState } from 'react'
import { useTransactionStore } from '@/features/transactions/store/useTransactionStore'
import type {
  ITransactionFilter,
  ITransactionMonthOption,
  ITransactionYearOption,
} from '@/features/transactions/type'
import type { ITransaction, TransactionSource } from '@/types/finance'
import { getPeriodKey, getPeriodLabel, groupByPeriod, type PeriodGranularity } from '@/utils/period'

// ต่อยอด filter ของฟีเจอร์ด้วย field source ที่ใช้เฉพาะหน้านี้
export interface ITransactionListFilter extends ITransactionFilter {
  source: TransactionSource | 'all'
}

// รายการที่จัดกลุ่มตามช่วงเวลาแล้ว พร้อมยอดสรุปของกลุ่มนั้นๆ
export interface IPeriodGroup {
  periodKey: string
  label: string
  transactions: ITransaction[]
  income: number
  expense: number
  balance: number
}

const initialFilter: ITransactionListFilter = {
  type: 'all',
  categoryId: 'all',
  keyword: '',
  source: 'all',
}

// ค่าที่หมายถึง 'ทั้งปี' ในตัวเลือกเดือน (ตัวเลือกปีไม่มีค่านี้ เพราะบังคับเลือกปีเสมอ)
export const ALL_MONTHS_VALUE = 'all'

// จำนวนกลุ่มช่วงเวลาที่แสดงต่อหน้า กันตารางยาวเกินไปเวลาเลือกรายวันแล้วมีข้อมูลหลายร้อยวัน
const PERIOD_GROUP_PAGE_SIZE = 15

const monthNameFormatter = new Intl.DateTimeFormat('th-TH', { month: 'long' })

// ชื่อเดือนภาษาไทยเดี่ยวๆ ไม่รวมปี เช่น 'มกราคม' (ต่างจาก getPeriodLabel ที่คืนป้ายพร้อมปีเสมอ)
function formatMonthName(month: number): string {
  return monthNameFormatter.format(new Date(2000, month - 1, 1))
}

function getCurrentYear(): string {
  return String(new Date().getFullYear())
}

// รวม logic ของหน้ารายรับ-รายจ่าย: ตัวเลือกช่วงเวลา (ปีบังคับเลือก + เดือน), ตัวกรองรายการ,
// สรุปยอด และจัดกลุ่มตามช่วงเวลาของข้อมูลที่อยู่ในช่วงที่เลือกเท่านั้น
export function useTransactionList() {
  const transactions = useTransactionStore((state) => state.transactions)
  const categories = useTransactionStore((state) => state.categories)
  const [filter, setFilter] = useState<ITransactionListFilter>(initialFilter)
  const [visiblePeriodCount, setVisiblePeriodCount] = useState(PERIOD_GROUP_PAGE_SIZE)

  // null = ผู้ใช้ยังไม่ได้เลือกปีเอง ให้ยึดปีปัจจุบันเป็นค่าเริ่มต้น
  // (ปีปัจจุบันไม่ขึ้นกับ transactions จึงไม่มีปัญหาเรื่อง zustand persist ยัง rehydrate ไม่เสร็จตอน render แรก
  // แต่คง pattern selectedX ?? defaultX ไว้เพื่อความสม่ำเสมอกับตัวกรองช่วงเวลาอื่นในแอป)
  const [selectedYear, setSelectedYear] = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string>(ALL_MONTHS_VALUE)

  const defaultYear = getCurrentYear()
  const yearValue = selectedYear ?? defaultYear
  const isAllMonths = selectedMonth === ALL_MONTHS_VALUE

  // เปลี่ยนปีต้องรีเซ็ตเดือนกลับเป็น 'ทั้งปี' ไม่งั้นเดือนที่เลือกค้างอาจไม่มีอยู่ในปีใหม่
  const onYearChange = (nextYear: string) => {
    setSelectedYear(nextYear)
    setSelectedMonth(ALL_MONTHS_VALUE)
    setVisiblePeriodCount(PERIOD_GROUP_PAGE_SIZE)
  }

  const onMonthChange = (nextMonth: string) => {
    setSelectedMonth(nextMonth)
    setVisiblePeriodCount(PERIOD_GROUP_PAGE_SIZE)
  }

  // ตัวเลือกปี: บังคับเลือกเสมอ ไม่มี 'ทุกปี' — union ปีที่มีรายการจริงกับปีปัจจุบัน เรียงใหม่→เก่า แสดงเป็น พ.ศ.
  const yearOptions = useMemo<ITransactionYearOption[]>(() => {
    const transactionYears = transactions.map((transaction) => getPeriodKey(transaction.date, 'year'))
    const uniqueYears = Array.from(new Set([...transactionYears, defaultYear])).sort((yearA, yearB) =>
      yearB.localeCompare(yearA),
    )

    return uniqueYears.map((year) => ({ value: year, label: getPeriodLabel(year, 'year') }))
  }, [transactions, defaultYear])

  // ตัวเลือกเดือน: ครบ 12 เดือนเสมอไม่ว่าจะมีรายการหรือไม่ เดือนที่ไม่มีรายการในปีที่เลือกจะมี hasData = false
  const monthOptions = useMemo<ITransactionMonthOption[]>(() => {
    const monthKeysWithData = new Set(
      transactions
        .filter((transaction) => getPeriodKey(transaction.date, 'year') === yearValue)
        .map((transaction) => getPeriodKey(transaction.date, 'month')),
    )

    const months = Array.from({ length: 12 }, (_, index) => {
      const monthNumber = String(index + 1).padStart(2, '0')
      const monthKey = `${yearValue}-${monthNumber}`
      return { value: monthNumber, label: formatMonthName(index + 1), hasData: monthKeysWithData.has(monthKey) }
    })

    return [{ value: ALL_MONTHS_VALUE, label: 'ทั้งปี', hasData: true }, ...months]
  }, [transactions, yearValue])

  // อนุมานช่วงเวลาที่ใช้กรองรายการจากปี/เดือนที่เลือก: 'ทั้งปี' กรองด้วยปี, เลือกเดือนแล้วกรองด้วยเดือน
  const periodFilterGranularity: PeriodGranularity = isAllMonths ? 'year' : 'month'
  const periodFilterKey = isAllMonths ? yearValue : `${yearValue}-${selectedMonth}`
  const periodLabel = getPeriodLabel(periodFilterKey, periodFilterGranularity)

  // จัดกลุ่มรายการที่อยู่ในช่วงที่เลือก: 'ทั้งปี' จัดกลุ่มเป็นรายเดือน, เลือกเดือนแล้วจัดกลุ่มเป็นรายวัน
  const groupGranularity: PeriodGranularity = isAllMonths ? 'month' : 'day'

  // กรองรายการให้เหลือเฉพาะช่วงเวลาที่เลือกก่อนเสมอ ก่อนค่อยกรองด้วยตัวกรองอื่นต่อ
  const periodTransactions = useMemo(
    () =>
      transactions.filter(
        (transaction) => getPeriodKey(transaction.date, periodFilterGranularity) === periodFilterKey,
      ),
    [transactions, periodFilterGranularity, periodFilterKey],
  )

  const filteredTransactions = useMemo(() => {
    const keyword = filter.keyword.trim().toLowerCase()

    return periodTransactions
      .filter((transaction) => filter.type === 'all' || transaction.type === filter.type)
      .filter((transaction) => filter.categoryId === 'all' || transaction.categoryId === filter.categoryId)
      .filter((transaction) => filter.source === 'all' || transaction.source === filter.source)
      .filter((transaction) => {
        if (!keyword) return true

        // กรอง keyword จากทั้งบันทึกช่วยจำและชื่อหมวดหมู่ (ไม่สนตัวพิมพ์เล็กใหญ่)
        const matchedCategory = categories.find((category) => category.id === transaction.categoryId)
        return (
          transaction.note.toLowerCase().includes(keyword) ||
          (matchedCategory?.name.toLowerCase().includes(keyword) ?? false)
        )
      })
      .sort((transactionA, transactionB) => transactionB.date.localeCompare(transactionA.date))
  }, [periodTransactions, categories, filter])

  // ยอดสรุปของช่วงเวลา + ตัวกรองที่กำลังแสดงอยู่จริง ไม่ใช่ยอดรวมทั้งระบบ
  const summary = useMemo(() => {
    const totalIncome = filteredTransactions
      .filter((transaction) => transaction.type === 'income')
      .reduce((total, transaction) => total + transaction.amount, 0)

    const totalExpense = filteredTransactions
      .filter((transaction) => transaction.type === 'expense')
      .reduce((total, transaction) => total + transaction.amount, 0)

    return { totalIncome, totalExpense, balance: totalIncome - totalExpense }
  }, [filteredTransactions])

  // จัดกลุ่มรายการที่กรองแล้วตามช่วงเวลาที่เลือก พร้อมคำนวณยอดสรุปของแต่ละกลุ่ม
  const periodGroups = useMemo<IPeriodGroup[]>(() => {
    const rawGroups = groupByPeriod(filteredTransactions, groupGranularity, (transaction) => transaction.date)

    return rawGroups.map((group) => {
      const income = group.items
        .filter((transaction) => transaction.type === 'income')
        .reduce((total, transaction) => total + transaction.amount, 0)

      const expense = group.items
        .filter((transaction) => transaction.type === 'expense')
        .reduce((total, transaction) => total + transaction.amount, 0)

      return {
        periodKey: group.periodKey,
        label: group.label,
        transactions: group.items,
        income,
        expense,
        balance: income - expense,
      }
    })
  }, [filteredTransactions, groupGranularity])

  const isFilterActive =
    filter.type !== 'all' || filter.categoryId !== 'all' || filter.source !== 'all' || filter.keyword.trim() !== ''

  const onFilterChange = (patch: Partial<ITransactionListFilter>) => {
    setFilter((currentFilter) => {
      // เปลี่ยนตัวกรองประเภทแล้วหมวดหมู่ที่เลือกไว้เป็นของอีกประเภท ต้องรีเซ็ตหมวดหมู่กลับเป็น 'all'
      // ไม่งั้นตารางจะว่างเปล่าแบบไม่มีเหตุผลชัดเจน (เช่น เลือกหมวด 'ค่าเช่า' แล้วสลับไปดูรายรับ)
      const shouldResetCategory = patch.type !== undefined && patch.type !== currentFilter.type

      return {
        ...currentFilter,
        ...patch,
        categoryId: shouldResetCategory ? 'all' : (patch.categoryId ?? currentFilter.categoryId),
      }
    })
    // ตัวกรองเปลี่ยน กลุ่มช่วงเวลาที่แสดงอยู่ไม่เกี่ยวข้องกันอีกต่อไป ต้องเริ่มนับจำนวนที่แสดงใหม่
    setVisiblePeriodCount(PERIOD_GROUP_PAGE_SIZE)
  }

  // รีเซ็ตเฉพาะตัวกรองรายการ (ประเภท/หมวดหมู่/คำค้น/แหล่งที่มา) ไม่แตะปี/เดือนที่เลือกไว้ เพราะปีบังคับเลือกเสมอ
  const onResetFilter = () => {
    setFilter(initialFilter)
    setVisiblePeriodCount(PERIOD_GROUP_PAGE_SIZE)
  }

  // จำกัดจำนวนกลุ่มช่วงเวลาที่แสดงในหน้าแรก แล้วให้ผู้ใช้กด 'แสดงช่วงเวลาเพิ่ม' เพื่อดึงเพิ่มทีละหน้า
  const visiblePeriodGroups = useMemo(
    () => periodGroups.slice(0, visiblePeriodCount),
    [periodGroups, visiblePeriodCount],
  )
  const hasMorePeriodGroups = periodGroups.length > visiblePeriodCount
  const onShowMorePeriods = () => setVisiblePeriodCount((count) => count + PERIOD_GROUP_PAGE_SIZE)

  return {
    transactions,
    categories,
    filter,
    filteredTransactions,
    yearOptions,
    yearValue,
    onYearChange,
    monthOptions,
    monthValue: selectedMonth,
    onMonthChange,
    periodLabel,
    // จำนวนรายการดิบของช่วงเวลาที่เลือก (ก่อนกรองด้วยตัวกรองรายการ) ใช้แยก empty state
    // ระหว่าง 'ช่วงนี้ไม่มีรายการเลย' กับ 'มีรายการแต่ตัวกรองไม่ตรง'
    periodTransactionCount: periodTransactions.length,
    summary,
    periodGroups,
    visiblePeriodGroups,
    hasMorePeriodGroups,
    isFilterActive,
    onFilterChange,
    onResetFilter,
    onShowMorePeriods,
  }
}
