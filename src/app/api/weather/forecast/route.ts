import { NextResponse } from 'next/server'
import { fetchForecast } from '@/features/weather/services/weatherService'

// อากาศเปลี่ยนบ่อย cache สั้นแค่ 15 นาที
export const revalidate = 900

// ตรวจว่าเป็นตัวเลขจริงและอยู่ในช่วงพิกัดที่ถูกต้อง (lat -90..90, lon -180..180) ก่อนยิงออกไปเสมอ กันพาธแปลกปลอม
function parseCoordinate(value: string | null, min: number, max: number): number | null {
  if (value === null) return null

  const numericValue = Number(value)
  if (!Number.isFinite(numericValue) || numericValue < min || numericValue > max) return null

  return numericValue
}

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)

  const latitude = parseCoordinate(searchParams.get('lat'), -90, 90)
  const longitude = parseCoordinate(searchParams.get('lon'), -180, 180)

  if (latitude === null || longitude === null) {
    return NextResponse.json(
      { message: 'พิกัดไม่ถูกต้อง กรุณาระบุ lat (-90 ถึง 90) และ lon (-180 ถึง 180) เป็นตัวเลข' },
      { status: 400 },
    )
  }

  try {
    const forecast = await fetchForecast(latitude, longitude)
    return NextResponse.json(forecast)
  } catch (error) {
    // ห้ามหลุด stack trace หรือข้อความอังกฤษถึงผู้ใช้ ใช้ข้อความไทยที่ throw มาจาก service เสมอ
    const message = error instanceof Error ? error.message : 'ดึงข้อมูลพยากรณ์อากาศไม่สำเร็จ กรุณาลองใหม่อีกครั้ง'
    return NextResponse.json({ message }, { status: 502 })
  }
}
