import { NextResponse } from 'next/server'
import { fetchCurrencyQuote } from '@/features/market/services/marketService'

// อัตราแลกเปลี่ยนเปลี่ยนไม่บ่อย cache ไว้ 30 นาทีกันยิง API ต้นทางถี่เกินไป
export const revalidate = 1800

export async function GET(): Promise<NextResponse> {
  try {
    const quote = await fetchCurrencyQuote()
    return NextResponse.json(quote)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'ดึงอัตราแลกเปลี่ยนไม่สำเร็จ กรุณาลองใหม่อีกครั้ง'
    return NextResponse.json({ message }, { status: 502 })
  }
}
