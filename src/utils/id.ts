// สร้าง id แบบสุ่มไว้ใช้กับ transaction/employee ที่สร้างฝั่ง client
export function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  // fallback กรณี environment ไม่รองรับ crypto.randomUUID
  const randomPart = Math.random().toString(36).slice(2, 10)
  return `${Date.now().toString(36)}-${randomPart}`
}
