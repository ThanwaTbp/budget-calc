import { NextResponse } from 'next/server'
import { fetchDraw, isValidDrawId } from '@/features/lottery/services/lotteryScraper'

// ผลรางวัลที่ออกแล้วไม่เปลี่ยน cache ไว้ 1 ชั่วโมงกันยิงเว็บต้นทางถี่เกินไป
export const revalidate = 3600

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params

  // ตรวจรูปแบบ id ก่อนยิงออกไปเว็บต้นทางเสมอ กัน SSRF/พาธแปลกปลอมที่ไม่ใช่รหัสงวดหวยจริง
  if (!isValidDrawId(id)) {
    return NextResponse.json({ message: 'รหัสงวดหวยไม่ถูกต้อง' }, { status: 400 })
  }

  try {
    const draw = await fetchDraw(id)
    return NextResponse.json(draw)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'ดึงผลรางวัลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง'
    return NextResponse.json({ message }, { status: 502 })
  }
}
