// จัดรูปแบบตัวเลขราคาตลาดแบบไทย รองรับเรตแลกเปลี่ยนที่มีทศนิยมน้อย (เช่น 0.0306)
// ให้ maximumFractionDigits ปรับได้ตามบริบท กันการปัดจนค่าเพี้ยนไปจากค่าจริง
export function formatMarketNumber(value: number, maximumFractionDigits = 4): string {
  return new Intl.NumberFormat('th-TH', { maximumFractionDigits }).format(value)
}
