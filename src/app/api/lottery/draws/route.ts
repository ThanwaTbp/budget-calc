import { NextResponse } from 'next/server'
import { fetchDrawList } from '@/features/lottery/services/lotteryScraper'

// ผลรางวัลที่ออกแล้วไม่เปลี่ยน แต่รายการงวดใหม่จะทยอยเพิ่ม จึง cache ไว้ 1 ชั่วโมงกันยิงเว็บต้นทางถี่เกินไป
export const revalidate = 3600

export async function GET(): Promise<NextResponse> {
  try {
    const draws = await fetchDrawList()
    return NextResponse.json({ draws })
  } catch (error) {
    // ห้ามหลุด stack trace หรือข้อความอังกฤษถึงผู้ใช้ ใช้ข้อความไทยที่ throw มาจาก scraper เสมอ
    const message = error instanceof Error ? error.message : 'ดึงรายการงวดหวยไม่สำเร็จ กรุณาลองใหม่อีกครั้ง'
    return NextResponse.json({ message }, { status: 502 })
  }
}
