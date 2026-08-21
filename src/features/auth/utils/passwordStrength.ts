export type PasswordStrengthLevel = 'weak' | 'medium' | 'strong'

// ประเมินความแข็งแรงของรหัสผ่านแบบง่าย นับเงื่อนไขที่ผ่าน (ความยาว, ตัวเลข, ตัวพิมพ์เล็ก-ใหญ่ผสมกัน, อักขระพิเศษ)
// ไม่ได้เชื่อมกับ policy ฝั่ง Appwrite ใช้เป็นแค่ตัวช่วยแนะนำผู้ใช้เท่านั้น
export function getPasswordStrength(password: string): PasswordStrengthLevel {
  if (!password) return 'weak'

  let strengthScore = 0
  if (password.length >= 8) strengthScore += 1
  if (password.length >= 12) strengthScore += 1
  if (/[0-9]/.test(password)) strengthScore += 1
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strengthScore += 1
  if (/[^a-zA-Z0-9]/.test(password)) strengthScore += 1

  if (strengthScore <= 2) return 'weak'
  if (strengthScore <= 3) return 'medium'
  return 'strong'
}

export const PASSWORD_STRENGTH_LABEL: Record<PasswordStrengthLevel, string> = {
  weak: 'อ่อน',
  medium: 'พอใช้',
  strong: 'แข็งแรง',
}

export const PASSWORD_STRENGTH_TEXT_CLASS: Record<PasswordStrengthLevel, string> = {
  weak: 'text-expense',
  medium: 'text-warning',
  strong: 'text-income',
}

export const PASSWORD_STRENGTH_BAR_CLASS: Record<PasswordStrengthLevel, string> = {
  weak: 'bg-expense',
  medium: 'bg-warning',
  strong: 'bg-income',
}

// จำนวนแท่งที่ต้องติดสี ใช้กับแถบบอกความแข็งแรง 3 แท่ง
export const PASSWORD_STRENGTH_FILLED_BAR_COUNT: Record<PasswordStrengthLevel, number> = {
  weak: 1,
  medium: 2,
  strong: 3,
}
