import { NextResponse } from 'next/server'
import { searchLocations } from '@/features/weather/services/weatherService'

// พิกัดเมืองไม่เปลี่ยน cache ได้นาน 1 วัน
export const revalidate = 86400

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') ?? ''

  try {
    const locations = await searchLocations(query)
    return NextResponse.json({ locations })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'ค้นหาเมืองไม่สำเร็จ กรุณาลองใหม่อีกครั้ง'
    return NextResponse.json({ message }, { status: 502 })
  }
}
