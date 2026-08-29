import { NextResponse } from 'next/server'
import { fetchUsStockQuotes } from '@/features/market/services/marketService'

export const revalidate = 900

export async function GET(): Promise<NextResponse> {
  try {
    const quoteList = await fetchUsStockQuotes()
    return NextResponse.json(quoteList)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'ดึงราคาหุ้นสหรัฐฯ ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง'
    return NextResponse.json({ message }, { status: 502 })
  }
}
