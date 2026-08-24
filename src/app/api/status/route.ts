import { NextResponse } from 'next/server'
import { getStatusReport } from '@/features/status/services/statusService'

// สถานะระบบต้องสดเสมอ ห้าม cache เด็ดขาด ไม่งั้นผู้ใช้จะเห็นสถานะเก่าตอนบริการเพิ่งพัง/เพิ่งฟื้น
export const dynamic = 'force-dynamic'

export async function GET(): Promise<NextResponse> {
  try {
    const report = await getStatusReport()
    return NextResponse.json(report)
  } catch (error) {
    // getStatusReport ห่อ error ของแต่ละบริการไว้แล้ว จุดนี้ดักไว้กันเหตุคาดไม่ถึงเท่านั้น
    const message = error instanceof Error ? error.message : 'ตรวจสอบสถานะระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง'
    return NextResponse.json({ message }, { status: 500 })
  }
}
