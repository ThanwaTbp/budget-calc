// input สำหรับตั้ง/แก้วงเงินของหมวดหนึ่ง (ตาม Store contract ใน SPEC.md)
export interface IBudgetInput {
  categoryId: string
  amount: number
}
