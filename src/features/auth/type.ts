// ผู้ใช้ที่ล็อกอินอยู่ ณ ตอนนี้ (แปลงมาจาก Models.User ของ Appwrite แล้ว)
export interface IAuthUser {
  id: string
  name: string
  email: string
  isEmailVerified: boolean
}

// สถานะของ session ทั้งแอป — 'loading' คือกำลังเช็ค session ตอนเปิดแอป ยังสรุปไม่ได้ว่าล็อกอินอยู่หรือไม่
export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

export interface ILoginInput {
  email: string
  password: string
}

export interface IRegisterInput {
  name: string
  email: string
  password: string
}

export interface IForgotPasswordInput {
  email: string
}

export interface IResetPasswordInput {
  userId: string
  secret: string
  password: string
}
