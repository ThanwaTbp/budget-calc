'use client'

import { useMemo } from 'react'
import { toast } from 'sonner'
import { useRecurringStore } from '@/features/recurring/store/useRecurringStore'
import { useTransactionStore } from '@/features/transactions/store/useTransactionStore'
import { getDueItems, isDueForPosting, resolveDueDate } from '@/features/recurring/utils/recurringSchedule'
import type { IRecurringItem } from '@/types/recurring'
import { getTodayDateString } from '@/utils/date'
import { formatCurrency } from '@/utils/format'

function sortByDayOfMonth(items: IRecurringItem[]): IRecurringItem[] {
  return [...items].sort((itemA, itemB) => itemA.dayOfMonth - itemB.dayOfMonth)
}

// รวม logic ของหน้ารายการประจำ: แยกรายการถึงกำหนด/เปิดใช้งาน/ปิดใช้งาน สรุปยอดต่อเดือน
// และลงรายการจริงเข้ารายรับ-รายจ่าย (ผู้ใช้ต้องกดยืนยันเองเสมอ ห้ามลงอัตโนมัติเงียบๆ)
export function useRecurringBoard() {
  const items = useRecurringStore((state) => state.items)
  const onMarkPosted = useRecurringStore((state) => state.onMarkPosted)
  const categories = useTransactionStore((state) => state.categories)
  const onCreateTransaction = useTransactionStore((state) => state.onCreate)

  // คำนวณครั้งเดียวตอน mount ฝั่ง client พอ (หน้านี้ไม่จำเป็นต้องอัปเดตข้ามเที่ยงคืนแบบเรียลไทม์)
  const todayIsoDate = useMemo(() => getTodayDateString(), [])

  const dueItems = useMemo(() => getDueItems(items, todayIsoDate), [items, todayIsoDate])
  const activeItems = useMemo(() => sortByDayOfMonth(items.filter((item) => item.isActive)), [items])
  const inactiveItems = useMemo(() => sortByDayOfMonth(items.filter((item) => !item.isActive)), [items])
  // รายการทั้งหมดที่ใช้วาดลิสต์ เรียงรายการที่เปิดใช้งานไว้ก่อนเสมอ แล้วต่อด้วยรายการที่ปิดใช้งาน
  const sortedItems = useMemo(() => [...activeItems, ...inactiveItems], [activeItems, inactiveItems])

  const totalDueAmount = useMemo(() => dueItems.reduce((total, item) => total + item.amount, 0), [dueItems])

  const monthlyIncomeTotal = useMemo(
    () => activeItems.filter((item) => item.type === 'income').reduce((total, item) => total + item.amount, 0),
    [activeItems],
  )

  const monthlyExpenseTotal = useMemo(
    () => activeItems.filter((item) => item.type === 'expense').reduce((total, item) => total + item.amount, 0),
    [activeItems],
  )

  const getCategoryName = (categoryId: string) =>
    categories.find((category) => category.id === categoryId)?.name ?? 'ไม่ระบุหมวดหมู่'

  // สร้างรายการจริงเข้ารายรับ-รายจ่ายด้วยวันที่ครบกำหนดของเดือนนี้ แล้วทำเครื่องหมายว่าลงรายการของเดือนนี้แล้ว
  // กันลงซ้ำในเดือนเดียวกันผ่าน lastPostedYearMonth
  const postItemForCurrentMonth = (item: IRecurringItem) => {
    const currentYearMonth = todayIsoDate.slice(0, 7)
    const dueDate = resolveDueDate(currentYearMonth, item.dayOfMonth)

    onCreateTransaction({
      type: item.type,
      amount: item.amount,
      categoryId: item.categoryId,
      note: item.note,
      date: dueDate,
    })
    onMarkPosted(item.id, currentYearMonth)
  }

  const onPostItem = (item: IRecurringItem) => {
    postItemForCurrentMonth(item)
    toast.success(`ลงรายการ "${item.note || getCategoryName(item.categoryId)}" ${formatCurrency(item.amount)} แล้ว`)
  }

  // ลงรายการทั้งหมดที่ถึงกำหนดในครั้งเดียว เช็ค isDueForPosting ซ้ำตอนลงจริง กันกรณีข้อมูลเปลี่ยนระหว่างเปิดหน้าค้างไว้
  const onPostAllDue = () => {
    const itemsToPost = items.filter((item) => isDueForPosting(item, todayIsoDate))
    if (itemsToPost.length === 0) return

    itemsToPost.forEach((item) => postItemForCurrentMonth(item))

    const totalPostedAmount = itemsToPost.reduce((total, item) => total + item.amount, 0)
    toast.success(`ลงรายการทั้งหมด ${itemsToPost.length} รายการ รวม ${formatCurrency(totalPostedAmount)} แล้ว`)
  }

  return {
    items: sortedItems,
    dueItems,
    totalDueAmount,
    monthlyIncomeTotal,
    monthlyExpenseTotal,
    monthlyBalance: monthlyIncomeTotal - monthlyExpenseTotal,
    todayIsoDate,
    hasAnyItem: items.length > 0,
    onPostItem,
    onPostAllDue,
  }
}
