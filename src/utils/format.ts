// รวม helper สำหรับ format ตัวเลข/วันที่ให้เป็นรูปแบบไทย ใช้ร่วมกันทั้งแอป

// แสดงจำนวนเงินเต็มรูปแบบ เช่น ฿1,234.56
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

// แสดงจำนวนเงินแบบย่อสำหรับแกนกราฟ เช่น ฿12.5K
export function formatCompactCurrency(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    notation: 'compact',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(amount)
}

// แสดงตัวเลขทั่วไปแบบมีคั่นหลักพัน
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('th-TH').format(value)
}

const dateFormatter = new Intl.DateTimeFormat('th-TH', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

// แสดงวันที่แบบไทยเต็มรูปแบบ เช่น 21 ส.ค. 2569 (ปี พ.ศ. ตาม locale th-TH)
// รับได้ทั้ง 'yyyy-MM-dd' และ ISO datetime เต็ม
// 'yyyy-MM-dd' ต้องแยกปี/เดือน/วันมาประกอบ Date เอง เพราะ new Date('2026-08-16') ถูกตีความเป็นเที่ยงคืน UTC
// แล้วเครื่องที่อยู่โซนเวลาติดลบจะ format ออกมาเป็นวันก่อนหน้า (ทดสอบแล้วที่ America/Los_Angeles ได้ 15 ส.ค. แทน 16)
export function formatDate(isoDate: string): string {
  const dateOnlyMatch = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/)

  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch
    return dateFormatter.format(new Date(Number(year), Number(month) - 1, Number(day)))
  }

  return dateFormatter.format(new Date(isoDate))
}

// แปลง yearMonth รูปแบบ 'yyyy-MM' เป็นป้ายกำกับเดือนแบบย่อ เช่น 'ส.ค. 69'
export function formatMonthLabel(yearMonth: string): string {
  const [year, month] = yearMonth.split('-').map(Number)
  const monthDate = new Date(year, month - 1, 1)

  return new Intl.DateTimeFormat('th-TH', {
    month: 'short',
    year: '2-digit',
  }).format(monthDate)
}

// ดึง yearMonth รูปแบบ 'yyyy-MM' จากวันที่ ISO ใช้จัดกลุ่มข้อมูลรายเดือน
export function toYearMonth(isoDate: string): string {
  return isoDate.slice(0, 7)
}
