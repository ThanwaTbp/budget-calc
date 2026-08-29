// Data model ของฟีเจอร์ราคาตลาด (Market) — ราคาทองคำ น้ำมัน และอัตราแลกเปลี่ยน
// ห้ามแก้โครงสร้างโดยไม่อัปเดต docs/SPEC.md ตามไปด้วย
export interface IGoldPrice {
  buy: number
  sell: number
}

export interface IGoldQuote {
  updateDate: string
  updateTime: string
  ornament: IGoldPrice
  bar: IGoldPrice
}

export interface IFuelPrice {
  key: string
  name: string
  price: number
}

export interface IOilStation {
  key: string
  name: string
  fuels: IFuelPrice[]
}

export interface IOilQuote {
  date: string
  stations: IOilStation[]
}

export interface ICurrencyRate {
  code: string
  name: string
  rate: number
}

export interface ICurrencyQuote {
  base: string
  date: string
  rates: ICurrencyRate[]
}

// ผลการแปลงค่าเงินจากสกุลหนึ่งไปอีกสกุล ใช้กับ /api/market/convert
export interface ICurrencyConversion {
  from: string
  to: string
  amount: number
  rate: number
  result: number
  date: string
}

export interface IStockQuote {
  symbol: string
  name: string
  exchange: string
  price: number
  change: number
  changePercentage: number
  previousClose: number
  dayLow: number
  dayHigh: number
  volume: number
}

export interface IStockQuoteList {
  quotes: IStockQuote[]
  updatedAt: string
  isDelayed: boolean
}
