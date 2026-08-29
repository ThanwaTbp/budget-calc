import { AppwriteException, ID, type Models } from 'appwrite'
import { appwriteAccount, isAppwriteConfigured } from '@/lib/appwrite'
import type {
  IAuthUser,
  ILoginInput,
  IRegisterInput,
  IResetPasswordInput,
  IUpdateNameInput,
  IUpdatePasswordInput,
} from '@/features/auth/type'

// ข้อความ error ของ Appwrite แปลเป็นภาษาไทย แมปตาม `type` ที่ AppwriteException ส่งมา
// รายการที่แปลไม่ได้ (รวมถึง error ที่ไม่ใช่ AppwriteException) จะ fallback เป็นข้อความกลางๆ เสมอ ห้ามโชว์ error ดิบภาษาอังกฤษ
const THAI_AUTH_ERROR_MESSAGE_MAP: Record<string, string> = {
  user_already_exists: 'อีเมลนี้ถูกใช้สมัครไปแล้ว',
  user_invalid_credentials: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
  user_not_found: 'ไม่พบบัญชีผู้ใช้นี้ในระบบ',
  general_argument_invalid: 'ข้อมูลที่กรอกไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง',
  password_recently_used: 'รหัสผ่านนี้เคยถูกใช้ไปแล้ว กรุณาตั้งรหัสผ่านใหม่',
  general_rate_limit_exceeded: 'ทำรายการถี่เกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้ง',
  user_email_not_whitelisted: 'อีเมลนี้ไม่ได้รับอนุญาตให้ใช้งานระบบ',
  general_unauthorized_scope: 'ไม่มีสิทธิ์ทำรายการนี้ กรุณาเข้าสู่ระบบใหม่อีกครั้ง',
}

const FALLBACK_AUTH_ERROR_MESSAGE = 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'

const APPWRITE_NOT_CONFIGURED_MESSAGE =
  'ยังไม่ได้ตั้งค่าโปรเจค Appwrite กรุณาตั้งค่า NEXT_PUBLIC_APPWRITE_PROJECT_ID ก่อนใช้งานระบบบัญชีผู้ใช้'

// แปลง error จาก Appwrite (หรือ error อื่นใดที่ไม่คาดคิด) ให้เป็นข้อความไทยเสมอ
export function toThaiAuthErrorMessage(error: unknown): string {
  if (error instanceof AppwriteException && error.type) {
    const mappedMessage = THAI_AUTH_ERROR_MESSAGE_MAP[error.type]
    if (mappedMessage) return mappedMessage
  }

  return FALLBACK_AUTH_ERROR_MESSAGE
}

export function toThaiPasswordUpdateErrorMessage(error: unknown): string {
  if (error instanceof AppwriteException && error.type === 'user_invalid_credentials') {
    return 'รหัสผ่านปัจจุบันไม่ถูกต้อง'
  }

  return toThaiAuthErrorMessage(error)
}

function ensureAppwriteConfigured(): void {
  if (!isAppwriteConfigured) {
    throw new Error(APPWRITE_NOT_CONFIGURED_MESSAGE)
  }
}

function mapAppwriteUserToAuthUser(user: Models.User<Models.Preferences>): IAuthUser {
  return {
    id: user.$id,
    name: user.name,
    email: user.email,
    isEmailVerified: user.emailVerification,
  }
}

// ดึงผู้ใช้ปัจจุบันจาก session ที่ Appwrite เก็บไว้ใน cookie ของโดเมนตัวเอง (throw ถ้าไม่มี session)
export async function getCurrentUser(): Promise<IAuthUser> {
  ensureAppwriteConfigured()
  const user = await appwriteAccount.get()
  return mapAppwriteUserToAuthUser(user)
}

// สมัครสมาชิกแล้วล็อกอินต่อทันที เพื่อให้ผู้ใช้ใหม่เข้าใช้งานได้เลยโดยไม่ต้องกดล็อกอินซ้ำ
export async function registerAccount(input: IRegisterInput): Promise<IAuthUser> {
  ensureAppwriteConfigured()
  await appwriteAccount.create({
    userId: ID.unique(),
    email: input.email,
    password: input.password,
    name: input.name,
  })
  await appwriteAccount.createEmailPasswordSession({ email: input.email, password: input.password })
  return getCurrentUser()
}

export async function loginWithEmailPassword(input: ILoginInput): Promise<IAuthUser> {
  ensureAppwriteConfigured()
  await appwriteAccount.createEmailPasswordSession({ email: input.email, password: input.password })
  return getCurrentUser()
}

export async function logoutCurrentSession(): Promise<void> {
  ensureAppwriteConfigured()
  await appwriteAccount.deleteSession({ sessionId: 'current' })
}

export async function updateCurrentUserName(input: IUpdateNameInput): Promise<IAuthUser> {
  ensureAppwriteConfigured()
  const user = await appwriteAccount.updateName({ name: input.name.trim() })
  return mapAppwriteUserToAuthUser(user)
}

export async function updateCurrentUserPassword(input: IUpdatePasswordInput): Promise<void> {
  ensureAppwriteConfigured()
  await appwriteAccount.updatePassword({ password: input.newPassword, oldPassword: input.currentPassword })
}

// ขอลิงก์รีเซ็ตรหัสผ่าน — Appwrite ส่งอีเมลให้เอง โดยลิงก์จะพากลับมาที่ url พร้อม query userId/secret
export async function requestPasswordRecovery(input: { email: string; url: string }): Promise<void> {
  ensureAppwriteConfigured()
  await appwriteAccount.createRecovery({ email: input.email, url: input.url })
}

// ตั้งรหัสผ่านใหม่จาก userId/secret ที่แนบมากับลิงก์รีเซ็ตรหัส
export async function confirmPasswordRecovery(input: IResetPasswordInput): Promise<void> {
  ensureAppwriteConfigured()
  await appwriteAccount.updateRecovery({
    userId: input.userId,
    secret: input.secret,
    password: input.password,
  })
}

// ส่งอีเมลยืนยันตัวตนไปให้ผู้ใช้ที่ล็อกอินอยู่ ณ ขณะนั้น
export async function sendEmailVerification(url: string): Promise<void> {
  ensureAppwriteConfigured()
  await appwriteAccount.createEmailVerification({ url })
}

// ยืนยันอีเมลจาก userId/secret ที่แนบมากับลิงก์ยืนยัน
export async function confirmEmailVerification(input: { userId: string; secret: string }): Promise<void> {
  ensureAppwriteConfigured()
  await appwriteAccount.updateEmailVerification({ userId: input.userId, secret: input.secret })
}
