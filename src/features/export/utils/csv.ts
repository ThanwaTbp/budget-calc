// Utility ล้วนสำหรับสร้างและดาวน์โหลดไฟล์ CSV — ไม่มี state/side effect ใดๆ นอกจาก downloadCsv ที่ตั้งใจให้แตะ DOM

// ค่าที่ต้องครอบด้วยอัญประกาศคู่: มีคอมมา, มีอัญประกาศ, ขึ้นบรรทัดใหม่ หรือมีช่องว่างหน้า/หลัง (ตามมาตรฐาน CSV/RFC 4180)
function needsQuoting(value: string): boolean {
  return /[",\r\n]/.test(value) || value !== value.trim()
}

export function escapeCsvValue(value: string | number): string {
  const stringValue = String(value)
  if (!needsQuoting(stringValue)) return stringValue
  return `"${stringValue.replace(/"/g, '""')}"`
}

// ต่อ header กับทุกแถวด้วย CRLF ('\r\n') เพราะ Excel คาดหวังรูปแบบนี้
export function buildCsvContent(headers: string[], rows: Array<Array<string | number>>): string {
  const lines = [headers.map(escapeCsvValue).join(',')]

  rows.forEach((row) => {
    lines.push(row.map(escapeCsvValue).join(','))
  })

  return lines.join('\r\n')
}

// UTF-8 BOM ต้องนำหน้าเนื้อไฟล์เสมอ ไม่งั้น Excel จะเดา encoding ผิดแล้วอ่านภาษาไทยเป็นตัวยึกยือ
const UTF8_BOM = '﻿'

export function downloadCsv(fileName: string, csvContent: string): void {
  const blob = new Blob([UTF8_BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
  const objectUrl = URL.createObjectURL(blob)

  const downloadAnchor = document.createElement('a')
  downloadAnchor.href = objectUrl
  downloadAnchor.download = fileName
  document.body.appendChild(downloadAnchor)
  downloadAnchor.click()
  document.body.removeChild(downloadAnchor)

  // ต้อง revoke เสมอหลังใช้เสร็จ กัน memory leak จาก object URL ที่ค้างอยู่
  URL.revokeObjectURL(objectUrl)
}
