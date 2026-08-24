export interface IBudget {
  id: string
  categoryId: string
  amount: number
  createdAt: string
}

// สถานะการใช้งบของหมวดหนึ่ง: ใช้ไป < 80% ปลอดภัย · 80–100% ใกล้เต็ม · เกิน 100% เกินงบ
export type BudgetStatus = 'safe' | 'warning' | 'over'
