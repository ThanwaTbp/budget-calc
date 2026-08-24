import { NextResponse } from 'next/server'
import { convertCurrency, isValidCurrencyCode } from '@/features/market/services/marketService'

// อัตราแลกเปลี่ยนเปลี่ยนไม่บ่อย cache ไว้ 30 นาทีกันยิง API ต้นทางถี่เกินไป
export const revalidate = 1800

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const from = (searchParams.get('from') ?? '').toUpperCase()
  const to = (searchParams.get('to') ?? '').toUpperCase()
  const amount = Number(searchParams.get('amount'))

  // ตรวจ from/to/amount ให้ผ่านก่อนยิงออกไปเสมอ ไม่ผ่านคืน 400 ไม่ใช่ 502
  if (!isValidCurrencyCode(from) || !isValidCurrencyCode(to)) {
    return NextResponse.json(
      { message: 'รหัสสกุลเงินไม่ถูกต้อง กรุณาระบุตัวอักษร A-Z 3 ตัว เช่น THB, USD' },
      { status: 400 },
    )
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ message: 'จำนวนเงินต้องเป็นตัวเลขมากกว่า 0' }, { status: 400 })
  }

  try {
    const conversion = await convertCurrency(from, to, amount)
    return NextResponse.json(conversion)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'แปลงค่าเงินไม่สำเร็จ กรุณาลองใหม่อีกครั้ง'
    return NextResponse.json({ message }, { status: 502 })
  }
}
