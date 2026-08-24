import { fromLocalDateString } from '@/utils/date'

// pure function แปลงวันที่ 'yyyy-MM-dd' เป็นป้ายกำกับภาษาไทย: วันนี้ / พรุ่งนี้ / ชื่อวัน
const weekdayFormatter = new Intl.DateTimeFormat('th-TH', { weekday: 'long', day: 'numeric', month: 'short' })

export function getDayLabel(date: string, referenceDate: Date = new Date()): string {
  const targetDate = fromLocalDateString(date)
  const today = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate())

  const diffDays = Math.round((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'วันนี้'
  if (diffDays === 1) return 'พรุ่งนี้'

  return weekdayFormatter.format(targetDate)
}
