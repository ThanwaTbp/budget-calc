// รวมฟังก์ชันแปลงวันที่ตามเวลาท้องถิ่น ใช้ร่วมกันทั้งแอป
// ห้ามใช้ toISOString()/new Date(isoString) กับวันที่แบบ 'yyyy-MM-dd' ตรงๆ เพราะ JS ตีความเป็น UTC
// ทำให้วันที่เพี้ยนย้อนหลัง 1 วันในช่วงเวลาไทย (UTC+7) เช่นหลัง 17:00 น. เป็นต้นไป

// แปลง Date เป็น 'yyyy-MM-dd' ตามเวลาท้องถิ่น
export function toLocalDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// แปลง 'yyyy-MM-dd' เป็น Date ตามเวลาท้องถิ่น
export function fromLocalDateString(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day)
}

// วันที่วันนี้ตามเวลาท้องถิ่น รูปแบบ 'yyyy-MM-dd'
export function getTodayDateString(): string {
  return toLocalDateString(new Date())
}

// แปลง Date เป็น 'yyyy-MM' ของเดือนที่ระบุตามเวลาท้องถิ่น
export function toYearMonthString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

const thaiMonthFormatter = new Intl.DateTimeFormat('th-TH', { month: 'long' })

// ชื่อเดือนภาษาไทยเดี่ยวๆ ไม่รวมปี เช่น 'สิงหาคม'
export function formatThaiMonthName(month: number): string {
  return thaiMonthFormatter.format(new Date(2000, month - 1, 1))
}

// จำนวนวันจริงของเดือน/ปีที่ระบุ รองรับปีอธิกสุรทินด้วยกลไก rollover ของ Date ในตัว
// (วันที่ 0 ของเดือนถัดไป = วันสุดท้ายของเดือนนี้)
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}
