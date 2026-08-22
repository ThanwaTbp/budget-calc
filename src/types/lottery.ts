// Data model ของฟีเจอร์ตรวจหวย (Lottery) — ห้ามแก้โครงสร้างโดยไม่อัปเดต docs/SPEC.md ตามไปด้วย
export type LotteryPrizeId =
  | 'first'
  | 'nearFirst'
  | 'second'
  | 'third'
  | 'fourth'
  | 'fifth'
  | 'frontThree'
  | 'backThree'
  | 'backTwo'

export type LotteryMatchMode = 'exact' | 'frontThree' | 'backThree' | 'backTwo'

export interface ILotteryPrize {
  id: LotteryPrizeId
  name: string
  reward: number
  matchMode: LotteryMatchMode
  numbers: string[]
}

export interface ILotteryDraw {
  id: string // '16-08-69'
  label: string // '16 ส.ค. 2569'
  date: string // 'yyyy-MM-dd'
  prizes: ILotteryPrize[]
}

export interface ILotteryTicket {
  id: string
  number: string // 6 หลัก
  note: string
  createdAt: string
}

export interface ITicketCheckResult {
  ticketNumber: string
  hits: Array<{ prizeId: LotteryPrizeId; prizeName: string; reward: number; matchedNumber: string }>
  totalReward: number
}
