// ดึงและ parse ผลสลากกินแบ่งรัฐบาลจาก www.lottery.co.th (ไม่มี API สาธารณะที่ใช้งานได้แล้ว)
// ใช้แค่ regex ธรรมดา ห้ามเพิ่ม dependency parse HTML ใหม่ — โครงหน้าเว็บอาจเปลี่ยนได้ทุกเมื่อ
// parse ไม่ได้/ไม่ครบต้อง throw error ภาษาไทยเสมอ ห้ามคืนผลบางส่วนหรือผลผิด
import type { ILotteryDraw, ILotteryPrize, LotteryMatchMode, LotteryPrizeId } from '@/types/lottery'

const REQUEST_TIMEOUT_MS = 10000
// ปลอมเป็นเบราว์เซอร์ปกติ กันเว็บต้นทางบล็อก request ที่ดูเหมือนบอต
const BROWSER_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
// cache ผลไว้ 1 ชั่วโมง เพราะผลรางวัลที่ออกแล้วไม่มีทางเปลี่ยน กันยิงเว็บต้นทางถี่เกินไป
const CACHE_REVALIDATE_SECONDS = 3600

const DRAW_ID_PATTERN = /^\d{1,2}-\d{2}-\d{2}$/

const THAI_MONTH_ABBREVIATIONS = [
  'ม.ค.',
  'ก.พ.',
  'มี.ค.',
  'เม.ย.',
  'พ.ค.',
  'มิ.ย.',
  'ก.ค.',
  'ส.ค.',
  'ก.ย.',
  'ต.ค.',
  'พ.ย.',
  'ธ.ค.',
] as const

interface IPrizeParseConfig {
  id: LotteryPrizeId
  tableId: string
  name: string
  matchMode: LotteryMatchMode
  digitLength: number
  expectedCount: number
}

// ต้องตรงกับตารางใน docs/SPEC.md หัวข้อ "ฟีเจอร์ตรวจหวย (Lottery)" เป๊ะ
const PRIZE_PARSE_CONFIGS: IPrizeParseConfig[] = [
  { id: 'first', tableId: 'reward1', name: 'รางวัลที่ 1', matchMode: 'exact', digitLength: 6, expectedCount: 1 },
  {
    id: 'nearFirst',
    tableId: 'nearreward1',
    name: 'รางวัลข้างเคียงรางวัลที่ 1',
    matchMode: 'exact',
    digitLength: 6,
    expectedCount: 2,
  },
  { id: 'second', tableId: 'reward2', name: 'รางวัลที่ 2', matchMode: 'exact', digitLength: 6, expectedCount: 5 },
  { id: 'third', tableId: 'reward3', name: 'รางวัลที่ 3', matchMode: 'exact', digitLength: 6, expectedCount: 10 },
  { id: 'fourth', tableId: 'reward4', name: 'รางวัลที่ 4', matchMode: 'exact', digitLength: 6, expectedCount: 50 },
  { id: 'fifth', tableId: 'reward5', name: 'รางวัลที่ 5', matchMode: 'exact', digitLength: 6, expectedCount: 100 },
  {
    id: 'frontThree',
    tableId: 'left3digit',
    name: 'เลขหน้า 3 ตัว',
    matchMode: 'frontThree',
    digitLength: 3,
    expectedCount: 2,
  },
  {
    id: 'backThree',
    tableId: 'right3digit',
    name: 'เลขท้าย 3 ตัว',
    matchMode: 'backThree',
    digitLength: 3,
    expectedCount: 2,
  },
  {
    id: 'backTwo',
    tableId: 'right2digit',
    name: 'เลขท้าย 2 ตัว',
    matchMode: 'backTwo',
    digitLength: 2,
    expectedCount: 1,
  },
]

// รหัสงวดต้องเป็นรูปแบบ 'd-mm-yy' เท่านั้น (เช่น '16-08-69', '2-05-69') กันพาธแปลกปลอม/SSRF ก่อนยิงออกไปเว็บต้นทาง
export function isValidDrawId(value: string): boolean {
  if (!DRAW_ID_PATTERN.test(value)) return false

  // ตรวจช่วงวัน/เดือนด้วย ไม่ใช่แค่รูปแบบ ไม่งั้น '99-99-99' จะผ่านไปยิงเว็บต้นทางแล้วค่อยพังทีหลัง
  // (สลากออกวันที่ 1, 2, 16 หรือ 17 เท่านั้น แต่เผื่อไว้ทั้งเดือนกันกรณีเว็บต้นทางเปลี่ยนรูปแบบวันที่)
  const [dayText, monthText] = value.split('-')
  const day = Number(dayText)
  const month = Number(monthText)
  return day >= 1 && day <= 31 && month >= 1 && month <= 12
}

// แปลงรหัสงวด 'd-mm-yy' (ปี พ.ศ. 2 หลัก) เป็นวันที่ ISO และป้ายกำกับภาษาไทย
// เว็บต้นทางเติมหลักร้อยของปี พ.ศ. เป็น 25 เสมอ (ใช้ได้ถึงปี พ.ศ. 2599)
function parseDrawId(drawId: string): { date: string; label: string } {
  const match = drawId.match(/^(\d{1,2})-(\d{2})-(\d{2})$/)
  if (!match) {
    throw new Error('รหัสงวดหวยไม่ถูกต้อง')
  }

  const day = Number(match[1])
  const month = Number(match[2])
  const yearBuddhistTwoDigit = Number(match[3])

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    throw new Error('รหัสงวดหวยไม่ถูกต้อง')
  }

  const yearBuddhist = 2500 + yearBuddhistTwoDigit
  const yearChristian = yearBuddhist - 543
  const date = `${yearChristian}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  const label = `${day} ${THAI_MONTH_ABBREVIATIONS[month - 1]} ${yearBuddhist}`

  return { date, label }
}

async function fetchHtml(url: string): Promise<string> {
  let response: Response

  try {
    response = await fetch(url, {
      headers: { 'user-agent': BROWSER_USER_AGENT },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      next: { revalidate: CACHE_REVALIDATE_SECONDS },
    })
  } catch {
    throw new Error('เชื่อมต่อเว็บตรวจหวยต้นทางไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
  }

  if (!response.ok) {
    throw new Error('ดึงข้อมูลจากเว็บตรวจหวยต้นทางไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
  }

  return response.text()
}

// ตัดเฉพาะเนื้อหาภายใน <table id="tableId">...</table> ออกมา หา id ไม่เจอแปลว่าโครงเว็บเปลี่ยนไปแล้ว
function extractTableHtml(html: string, tableId: string): string {
  const pattern = new RegExp(`<table id="${tableId}"[^>]*>([\\s\\S]*?)<\\/table>`, 'i')
  const match = html.match(pattern)

  if (!match) {
    throw new Error('โครงหน้าเว็บตรวจหวยเปลี่ยนแปลง ไม่สามารถอ่านผลรางวัลได้ กรุณาลองใหม่ภายหลัง')
  }

  return match[1]
}

// อ่านเงินรางวัลจาก <caption> ด้วยรูปแบบ '...จำนวนเงิน บาท' ตัดเครื่องหมายจุลภาคออกก่อนแปลงเป็นตัวเลข
function extractCaptionReward(tableHtml: string, prizeName: string): number {
  const captionMatch = tableHtml.match(/<caption>([\s\S]*?)<\/caption>/i)
  const amountMatch = captionMatch?.[1].match(/([\d,]+)\s*บาท/)

  if (!amountMatch) {
    throw new Error(`อ่านเงินรางวัลของ${prizeName}ไม่ได้ อาจเป็นเพราะโครงเว็บเปลี่ยนแปลง`)
  }

  const reward = Number(amountMatch[1].replace(/,/g, ''))
  if (!Number.isFinite(reward) || reward <= 0) {
    throw new Error(`อ่านเงินรางวัลของ${prizeName}ไม่ได้ อาจเป็นเพราะโครงเว็บเปลี่ยนแปลง`)
  }

  return reward
}

// อ่านเฉพาะเลขที่เป็นตัวเลขล้วนความยาวตรงตามที่กำหนด (กันเลขอื่นในหน้าหลุดเข้ามา) และต้องได้ครบตามจำนวนรางวัลจริง
function extractPrizeNumbers(
  tableHtml: string,
  digitLength: number,
  expectedCount: number,
  prizeName: string,
): string[] {
  const rawMatches = [...tableHtml.matchAll(/>(\d+)</g)]
  const numbers = rawMatches.map((rawMatch) => rawMatch[1]).filter((value) => value.length === digitLength)

  if (numbers.length !== expectedCount) {
    throw new Error(`อ่านเลข${prizeName}ไม่ครบ อาจเป็นเพราะโครงเว็บเปลี่ยนแปลง`)
  }

  return numbers
}

// ดึงรายการงวดของปี พ.ศ. ปัจจุบันและปีก่อนหน้า 1 ปี รวมกัน เรียงงวดใหม่→เก่า
export async function fetchDrawList(): Promise<Array<{ id: string; label: string; date: string }>> {
  const currentBuddhistYear = new Date().getFullYear() + 543
  const yearsToFetch = [currentBuddhistYear, currentBuddhistYear - 1]

  const htmlPages = await Promise.all(
    yearsToFetch.map((year) => fetchHtml(`https://www.lottery.co.th/year-${year}`)),
  )

  const drawIdSet = new Set<string>()
  for (const html of htmlPages) {
    for (const linkMatch of html.matchAll(/\/lotto\/(\d{1,2}-\d{2}-\d{2})/g)) {
      drawIdSet.add(linkMatch[1])
    }
  }

  if (drawIdSet.size === 0) {
    throw new Error('ไม่พบรายการงวดหวยจากเว็บต้นทาง อาจเป็นเพราะโครงเว็บเปลี่ยนแปลง')
  }

  const draws = [...drawIdSet].map((id) => {
    const { date, label } = parseDrawId(id)
    return { id, label, date }
  })

  draws.sort((drawA, drawB) => (drawA.date < drawB.date ? 1 : drawA.date > drawB.date ? -1 : 0))

  return draws
}

// ดึงผลรางวัลเต็มงวดของ drawId ที่ระบุ ('d-mm-yy')
export async function fetchDraw(drawId: string): Promise<ILotteryDraw> {
  if (!isValidDrawId(drawId)) {
    throw new Error('รหัสงวดหวยไม่ถูกต้อง')
  }

  const { date, label } = parseDrawId(drawId)
  const html = await fetchHtml(`https://www.lottery.co.th/lotto/${drawId}`)

  const prizes: ILotteryPrize[] = PRIZE_PARSE_CONFIGS.map((config) => {
    const tableHtml = extractTableHtml(html, config.tableId)
    const reward = extractCaptionReward(tableHtml, config.name)
    const numbers = extractPrizeNumbers(tableHtml, config.digitLength, config.expectedCount, config.name)

    return { id: config.id, name: config.name, reward, matchMode: config.matchMode, numbers }
  })

  return { id: drawId, label, date, prizes }
}
