// helper สร้างตัวเลือกปี/เดือน/วันสำหรับตัวกรองช่วงเวลาในหน้าค่าจ้าง
// (ไม่ใช่การคำนวณ periodKey/สรุปยอด จึงไม่ได้อยู่ใน @/utils/period หรือ @/utils/calc)

const monthNameFormatter = new Intl.DateTimeFormat('th-TH', { month: 'long' })

// ชื่อเดือนภาษาไทยเดี่ยวๆ ไม่รวมปี เช่น 'มกราคม' (ต่างจาก getPeriodLabel ที่คืนป้ายพร้อมปีเสมอ)
export function formatMonthName(month: number): string {
  return monthNameFormatter.format(new Date(2000, month - 1, 1))
}

// จำนวนวันจริงของเดือน/ปีที่ระบุ รองรับปีอธิกสุรทินด้วยกลไก rollover ของ Date ในตัว
// (วันที่ 0 ของเดือนถัดไป = วันสุดท้ายของเดือนนี้)
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}
