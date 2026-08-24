import { NextResponse } from 'next/server'
import { fetchGoldQuote } from '@/features/market/services/marketService'

// ราคาทองคำเปลี่ยนไม่บ่อย cache ไว้ 30 นาทีกันยิง API ต้นทางถี่เกินไป
export const revalidate = 1800

export async function GET(): Promise<NextResponse> {
  try {
    const quote = await fetchGoldQuote()
    return NextResponse.json(quote)
  } catch (error) {
    // ห้ามหลุด stack trace หรือข้อความอังกฤษถึงผู้ใช้ ใช้ข้อความไทยที่ throw มาจาก service เสมอ
    const message = error instanceof Error ? error.message : 'ดึงราคาทองคำไม่สำเร็จ กรุณาลองใหม่อีกครั้ง'
    return NextResponse.json({ message }, { status: 502 })
  }
}
