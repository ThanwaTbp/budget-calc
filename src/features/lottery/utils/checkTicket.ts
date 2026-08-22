// ตรรกะหลักของการตรวจหวย — เปรียบเทียบเลขที่ผู้ใช้กรอกกับผลรางวัลของงวดที่เลือก
import type { ILotteryDraw, ITicketCheckResult, LotteryMatchMode } from '@/types/lottery'

const TICKET_NUMBER_PATTERN = /^\d{6}$/

// เลขสลากไทยมี 6 หลักเท่านั้น (ตัวเลขล้วน)
export function isValidTicketNumber(value: string): boolean {
  return TICKET_NUMBER_PATTERN.test(value)
}

// เทียบเลขตามกติกาของแต่ละรางวัล: exact = ตรงทั้ง 6 หลัก, frontThree = 3 หลักแรก, backThree/backTwo = หลักท้าย
function isNumberMatched(ticketNumber: string, winningNumber: string, matchMode: LotteryMatchMode): boolean {
  switch (matchMode) {
    case 'exact':
      return ticketNumber === winningNumber
    case 'frontThree':
      return ticketNumber.slice(0, 3) === winningNumber
    case 'backThree':
      return ticketNumber.slice(-3) === winningNumber
    case 'backTwo':
      return ticketNumber.slice(-2) === winningNumber
  }
}

// ตรวจเลขหนึ่งใบ หนึ่งใบถูกได้หลายรางวัลพร้อมกัน ต้องรวมเงินทุกรางวัลที่ถูก
export function checkTicket(ticketNumber: string, draw: ILotteryDraw): ITicketCheckResult {
  if (!isValidTicketNumber(ticketNumber)) {
    return { ticketNumber, hits: [], totalReward: 0 }
  }

  const hits: ITicketCheckResult['hits'] = []

  for (const prize of draw.prizes) {
    for (const winningNumber of prize.numbers) {
      if (isNumberMatched(ticketNumber, winningNumber, prize.matchMode)) {
        hits.push({ prizeId: prize.id, prizeName: prize.name, reward: prize.reward, matchedNumber: winningNumber })
      }
    }
  }

  const totalReward = hits.reduce((sumReward, hit) => sumReward + hit.reward, 0)

  return { ticketNumber, hits, totalReward }
}

export function checkTickets(ticketNumbers: string[], draw: ILotteryDraw): ITicketCheckResult[] {
  return ticketNumbers.map((ticketNumber) => checkTicket(ticketNumber, draw))
}
