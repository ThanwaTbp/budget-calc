// input สำหรับสร้าง/แก้ไขเลขที่ผู้ใช้บันทึกไว้ (ตาม Store contract ใน SPEC.md)
export interface ILotteryTicketInput {
  number: string
  note: string
}

// รายการงวดแบบย่อ ตามผลลัพธ์ของ GET /api/lottery/draws
export interface IDrawListItem {
  id: string
  label: string
  date: string
}
