// รวม helper สำหรับแบ่งช่วงเวลา (วัน/เดือน/ปี) ใช้จัดกลุ่มรายรับรายจ่ายและรอบจ่ายค่าจ้าง

export type PeriodGranularity = 'day' | 'month' | 'year'

export interface IPeriodOption {
  value: PeriodGranularity
  label: string
}

export const PERIOD_OPTIONS: IPeriodOption[] = [
  { value: 'day', label: 'รายวัน' },
  { value: 'month', label: 'รายเดือน' },
  { value: 'year', label: 'รายปี' },
]

// แปลง 'yyyy-MM-dd' เป็น Date ตามเวลาท้องถิ่น (new Date(string) จะตีความเป็น UTC ทำให้วันเพี้ยน)
function toLocalDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day)
}

// key ต้องเรียงลำดับด้วยการเทียบ string ได้ตรงกับลำดับเวลาจริง
export function getPeriodKey(isoDate: string, granularity: PeriodGranularity): string {
  switch (granularity) {
    case 'day':
      return isoDate
    case 'month':
      return isoDate.slice(0, 7)
    case 'year':
      return isoDate.slice(0, 4)
  }
}

const dayFormatter = new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })
const monthFormatter = new Intl.DateTimeFormat('th-TH', { month: 'long', year: 'numeric' })
const buddhistYearFormatter = new Intl.DateTimeFormat('th-TH', { year: 'numeric' })

// ป้ายกำกับของแต่ละกลุ่ม เช่น '21 สิงหาคม 2569', 'สิงหาคม 2569', 'ปี 2569'
export function getPeriodLabel(periodKey: string, granularity: PeriodGranularity): string {
  switch (granularity) {
    case 'day':
      return dayFormatter.format(toLocalDate(periodKey))
    case 'month':
      return monthFormatter.format(toLocalDate(`${periodKey}-01`))
    case 'year':
      return `ปี ${buddhistYearFormatter.format(toLocalDate(`${periodKey}-01-01`))}`
  }
}

// จัดกลุ่ม item ใดๆ ที่มีวันที่ ตามช่วงเวลาที่เลือก เรียงจากช่วงใหม่ไปเก่า
export function groupByPeriod<TItem>(
  items: TItem[],
  granularity: PeriodGranularity,
  getDate: (item: TItem) => string,
): Array<{ periodKey: string; label: string; items: TItem[] }> {
  const itemsByPeriod = new Map<string, TItem[]>()

  items.forEach((item) => {
    const periodKey = getPeriodKey(getDate(item), granularity)
    const bucket = itemsByPeriod.get(periodKey)

    if (bucket) {
      bucket.push(item)
    } else {
      itemsByPeriod.set(periodKey, [item])
    }
  })

  return Array.from(itemsByPeriod.entries())
    .map(([periodKey, bucketItems]) => ({
      periodKey,
      label: getPeriodLabel(periodKey, granularity),
      items: bucketItems,
    }))
    .sort((periodA, periodB) => periodB.periodKey.localeCompare(periodA.periodKey))
}
