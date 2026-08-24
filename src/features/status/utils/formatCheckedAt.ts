// แสดงเวลาที่ตรวจสอบล่าสุดแบบไทยพร้อมเวลา เช่น '21 ส.ค. 2569 14:32 น.'
const checkedAtFormatter = new Intl.DateTimeFormat('th-TH', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function formatCheckedAt(isoDateTime: string): string {
  return `${checkedAtFormatter.format(new Date(isoDateTime))} น.`
}
