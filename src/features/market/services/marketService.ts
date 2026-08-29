// ดึงราคาทองคำ/น้ำมัน/อัตราแลกเปลี่ยนจาก API สาธารณะภายนอก — เรียกจาก Route Handler ฝั่งเซิร์ฟเวอร์เท่านั้น
// error ทุกกรณีต้องแปลงเป็นข้อความไทยก่อน throw ห้ามหลุด error ดิบภาษาอังกฤษออกไป
import type {
  ICurrencyConversion,
  ICurrencyQuote,
  ICurrencyRate,
  IFuelPrice,
  IGoldQuote,
  IOilQuote,
  IOilStation,
  IStockQuote,
  IStockQuoteList,
} from '@/types/market'
import { toLocalDateString } from '@/utils/date'

const REQUEST_TIMEOUT_MS = 10000
// ราคาตลาดเปลี่ยนไม่บ่อย cache ไว้ 30 นาทีกันยิง API ต้นทางถี่เกินไป
const CACHE_REVALIDATE_SECONDS = 1800
const STOCK_CACHE_REVALIDATE_SECONDS = 900

const GOLD_ENDPOINT = 'https://api.chnwt.dev/thai-gold-api/latest'
const OIL_ENDPOINT = 'https://api.chnwt.dev/thai-oil-api/latest'
const CURRENCY_ENDPOINT = 'https://api.frankfurter.app/latest'
const STOCK_ENDPOINT = 'https://financialmodelingprep.com/stable/batch-quote'
const STOCK_SYMBOLS = ['AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'META', 'TSLA', 'BRK-B']

// map รหัสปั๊มน้ำมัน -> ชื่อภาษาไทย ตามปั๊มที่ API ต้นทางรองรับ (docs/SPEC.md)
const STATION_NAME_MAP: Record<string, string> = {
  ptt: 'ปตท.',
  bcp: 'บางจาก',
  shell: 'เชลล์',
  caltex: 'คาลเท็กซ์',
  irpc: 'ไออาร์พีซี',
  pt: 'พีที',
  susco: 'ซัสโก้',
  pure: 'เพียว',
  susco_dealers: 'ซัสโก้ ดีลเลอร์',
}

// map รหัสสกุลเงิน -> ชื่อภาษาไทย รหัสที่ไม่มีในนี้ให้ใช้รหัสเดิมแทน กัน crash
const CURRENCY_NAME_MAP: Record<string, string> = {
  USD: 'ดอลลาร์สหรัฐ',
  EUR: 'ยูโร',
  JPY: 'เยนญี่ปุ่น',
  GBP: 'ปอนด์สเตอร์ลิง',
  CNY: 'หยวนจีน',
  KRW: 'วอนเกาหลี',
  SGD: 'ดอลลาร์สิงคโปร์',
  AUD: 'ดอลลาร์ออสเตรเลีย',
  CHF: 'ฟรังก์สวิส',
  HKD: 'ดอลลาร์ฮ่องกง',
}

const CURRENCY_CODE_PATTERN = /^[A-Z]{3}$/

interface IGoldApiPrice {
  buy: string
  sell: string
}

interface IGoldApiResponse {
  status: string
  response?: {
    update_date: string
    update_time: string
    price: {
      gold: IGoldApiPrice
      gold_bar: IGoldApiPrice
    }
  }
}

interface IOilApiFuel {
  name: string
  price: string
}

interface IOilApiResponse {
  response?: {
    date: string
    stations: Record<string, Record<string, IOilApiFuel | undefined> | undefined>
  }
}

interface IFrankfurterResponse {
  amount: number
  base: string
  date: string
  rates: Record<string, number>
}

interface IFmpStockQuote {
  symbol?: string
  name?: string
  exchange?: string
  price?: number
  change?: number
  changePercentage?: number
  changesPercentage?: number
  previousClose?: number
  dayLow?: number
  dayHigh?: number
  volume?: number
  timestamp?: number
}

async function fetchJson<TResponseBody>(
  url: string,
  errorMessage: string,
  revalidate = CACHE_REVALIDATE_SECONDS,
): Promise<TResponseBody> {
  let response: Response

  try {
    response = await fetch(url, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      next: { revalidate },
    })
  } catch {
    throw new Error('เชื่อมต่อแหล่งข้อมูลราคาตลาดไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
  }

  if (!response.ok) {
    throw new Error(errorMessage)
  }

  return (await response.json()) as TResponseBody
}

// แปลงข้อความราคาที่อาจมีคอมมาคั่นหลักพันเป็นตัวเลข — แปลงไม่ได้ (ค่าว่าง/ขีด/ไม่ใช่ตัวเลข) คืน null เสมอ ห้ามคืน NaN ออกไปให้ UI
export function parsePriceText(text: string | undefined | null): number | null {
  if (text === undefined || text === null) return null

  const trimmedText = text.trim()
  if (trimmedText === '' || trimmedText === '-') return null

  const numericValue = Number(trimmedText.replace(/,/g, ''))
  return Number.isFinite(numericValue) ? numericValue : null
}

// ดึงราคาทองคำรูปพรรณและทองแท่งล่าสุด
export async function fetchGoldQuote(): Promise<IGoldQuote> {
  const data = await fetchJson<IGoldApiResponse>(GOLD_ENDPOINT, 'ดึงราคาทองคำไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')

  const price = data.response?.price
  if (!price) {
    throw new Error('ข้อมูลราคาทองคำที่ได้รับไม่ครบถ้วน กรุณาลองใหม่อีกครั้ง')
  }

  const ornamentBuy = parsePriceText(price.gold?.buy)
  const ornamentSell = parsePriceText(price.gold?.sell)
  const barBuy = parsePriceText(price.gold_bar?.buy)
  const barSell = parsePriceText(price.gold_bar?.sell)

  if (ornamentBuy === null || ornamentSell === null || barBuy === null || barSell === null) {
    throw new Error('อ่านราคาทองคำไม่สำเร็จ อาจเป็นเพราะข้อมูลจากต้นทางเปลี่ยนแปลง')
  }

  return {
    updateDate: data.response?.update_date ?? '',
    updateTime: data.response?.update_time ?? '',
    ornament: { buy: ornamentBuy, sell: ornamentSell },
    bar: { buy: barBuy, sell: barSell },
  }
}

// ดึงราคาน้ำมันทุกปั๊มที่รู้จัก กรองชนิดน้ำมันที่ปั๊มนั้นไม่มี/ราคาอ่านไม่ได้ทิ้งไป (docs/SPEC.md)
export async function fetchOilQuote(): Promise<IOilQuote> {
  const data = await fetchJson<IOilApiResponse>(OIL_ENDPOINT, 'ดึงราคาน้ำมันไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')

  const stationsRaw = data.response?.stations
  if (!stationsRaw) {
    throw new Error('ข้อมูลราคาน้ำมันที่ได้รับไม่ครบถ้วน กรุณาลองใหม่อีกครั้ง')
  }

  const stations: IOilStation[] = Object.entries(STATION_NAME_MAP)
    .map(([stationKey, stationName]) => {
      const fuelsRaw = stationsRaw[stationKey]
      if (!fuelsRaw) return null

      const fuels: IFuelPrice[] = Object.entries(fuelsRaw)
        .map(([fuelKey, fuel]) => {
          const price = parsePriceText(fuel?.price)
          if (!fuel || price === null) return null
          return { key: fuelKey, name: fuel.name, price }
        })
        .filter((fuel): fuel is IFuelPrice => fuel !== null)

      return { key: stationKey, name: stationName, fuels }
    })
    .filter((station): station is IOilStation => station !== null)

  return { date: data.response?.date ?? '', stations }
}

// ดึงอัตราแลกเปลี่ยนอ้างอิงกับ THB ของสกุลเงินหลักที่ ECB รองรับ
export async function fetchCurrencyQuote(): Promise<ICurrencyQuote> {
  const data = await fetchJson<IFrankfurterResponse>(
    `${CURRENCY_ENDPOINT}?from=THB`,
    'ดึงอัตราแลกเปลี่ยนไม่สำเร็จ กรุณาลองใหม่อีกครั้ง',
  )

  const rates: ICurrencyRate[] = Object.entries(data.rates).map(([code, rate]) => ({
    code,
    name: CURRENCY_NAME_MAP[code] ?? code,
    rate,
  }))

  return { base: data.base, date: data.date, rates }
}

// ตรวจว่ารหัสสกุลเงินเป็นตัวอักษร A-Z 3 ตัวเท่านั้น กันพารามิเตอร์แปลกปลอมก่อนยิงออกไปเสมอ
export function isValidCurrencyCode(code: string): boolean {
  return CURRENCY_CODE_PATTERN.test(code)
}

// แปลงค่าเงินจากสกุลหนึ่งไปอีกสกุล — ผู้เรียกต้อง validate from/to/amount ให้ผ่านก่อนเรียกฟังก์ชันนี้เสมอ
// ปัดผลลัพธ์ให้เหลือทศนิยม 4 ตำแหน่ง กันค่าคลาดเคลื่อนของเลขทศนิยมหลุดออกไปให้ผู้ใช้เห็น
// (เช่น 1000 * 0.0306 ได้ 30.599999999999998 แทนที่จะเป็น 30.6)
function roundConversionResult(value: number): number {
  return Math.round(value * 10000) / 10000
}

export async function convertCurrency(from: string, to: string, amount: number): Promise<ICurrencyConversion> {
  // สกุลต้นทางกับปลายทางเดียวกัน เรตคือ 1 เสมอ ไม่ต้องยิง API (Frankfurter ไม่คืนเรตของสกุลเดียวกับ base ให้)
  if (from === to) {
    return { from, to, amount, rate: 1, result: amount, date: toLocalDateString(new Date()) }
  }

  const data = await fetchJson<IFrankfurterResponse>(
    `${CURRENCY_ENDPOINT}?from=${from}&to=${to}`,
    'แปลงค่าเงินไม่สำเร็จ กรุณาลองใหม่อีกครั้ง',
  )

  const rate = data.rates[to]
  if (rate === undefined) {
    throw new Error('ไม่พบอัตราแลกเปลี่ยนของสกุลเงินที่ระบุ')
  }

  return { from, to, amount, rate, result: roundConversionResult(amount * rate), date: data.date }
}

function isFiniteNumber(value: number | undefined): value is number {
  return value !== undefined && Number.isFinite(value)
}

// ราคาหุ้นเรียกแบบ batch หนึ่งครั้งต่อรอบและใช้ API key ฝั่งเซิร์ฟเวอร์เท่านั้น ห้ามเปลี่ยนเป็น NEXT_PUBLIC_
export async function fetchUsStockQuotes(): Promise<IStockQuoteList> {
  const apiKey = process.env.FMP_API_KEY?.trim() ?? ''
  if (!apiKey) {
    throw new Error('ยังไม่ได้ตั้งค่า FMP_API_KEY สำหรับดึงราคาหุ้นสหรัฐฯ')
  }

  const searchParams = new URLSearchParams({ symbols: STOCK_SYMBOLS.join(','), apikey: apiKey })
  const data = await fetchJson<IFmpStockQuote[]>(
    `${STOCK_ENDPOINT}?${searchParams.toString()}`,
    'ดึงราคาหุ้นสหรัฐฯ ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง',
    STOCK_CACHE_REVALIDATE_SECONDS,
  )

  if (!Array.isArray(data)) {
    throw new Error('รูปแบบข้อมูลหุ้นจากต้นทางไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง')
  }

  const quotes: IStockQuote[] = data
    .map((quote) => {
      const changePercentage = quote.changePercentage ?? quote.changesPercentage
      if (
        !quote.symbol ||
        !isFiniteNumber(quote.price) ||
        !isFiniteNumber(quote.change) ||
        !isFiniteNumber(changePercentage)
      ) {
        return null
      }

      return {
        symbol: quote.symbol,
        name: quote.name?.trim() || quote.symbol,
        exchange: quote.exchange?.trim() || 'US',
        price: quote.price,
        change: quote.change,
        changePercentage,
        previousClose: isFiniteNumber(quote.previousClose) ? quote.previousClose : quote.price - quote.change,
        dayLow: isFiniteNumber(quote.dayLow) ? quote.dayLow : quote.price,
        dayHigh: isFiniteNumber(quote.dayHigh) ? quote.dayHigh : quote.price,
        volume: isFiniteNumber(quote.volume) ? quote.volume : 0,
      }
    })
    .filter((quote): quote is IStockQuote => quote !== null)

  if (quotes.length === 0) {
    throw new Error('ไม่พบราคาหุ้นสหรัฐฯ จากต้นทาง กรุณาลองใหม่ภายหลัง')
  }

  const latestTimestamp = data.reduce((latest, quote) => Math.max(latest, quote.timestamp ?? 0), 0)
  const updatedAt = latestTimestamp > 0 ? new Date(latestTimestamp * 1000).toISOString() : new Date().toISOString()

  return { quotes, updatedAt, isDelayed: true }
}
