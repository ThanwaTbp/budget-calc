import { NextResponse } from 'next/server'
import { fetchOilQuote } from '@/features/market/services/marketService'

// ราคาน้ำมันเปลี่ยนไม่บ่อย cache ไว้ 30 นาทีกันยิง API ต้นทางถี่เกินไป
export const revalidate = 1800

export async function GET(): Promise<NextResponse> {
  try {
    const quote = await fetchOilQuote()
    return NextResponse.json(quote)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'ดึงราคาน้ำมันไม่สำเร็จ กรุณาลองใหม่อีกครั้ง'
    return NextResponse.json({ message }, { status: 502 })
  }
}
