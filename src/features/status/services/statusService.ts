// ตรวจสถานะทุกบริการภายนอกที่แอปพึ่งพา + Appwrite แบบขนาน (Promise.all) เพื่อบอกผู้ใช้ว่าถ้าข้อมูลไม่ขึ้นเป็นเพราะอะไร
// บริการหนึ่งพังต้องไม่ทำให้ทั้งรายงานพัง — ทุกจุดจับ error รายตัวและแปลงเป็นข้อความไทยเสมอ ห้ามหลุด error ดิบ
import { APPWRITE_COLLECTIONS, APPWRITE_DATABASE_ID } from '@/constants/appwrite'
import type { IServiceHealth, IStatusReport, ServiceCategory, ServiceStatus } from '@/types/status'

const TIMEOUT_MS = 8000
const DEGRADED_THRESHOLD_MS = 3000

const APPWRITE_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT?.trim() || 'https://cloud.appwrite.io/v1'
const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID?.trim() ?? ''
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY?.trim() ?? ''

// เว็บ lottery.co.th บล็อก request ที่ดูเหมือนบอต จึงต้องปลอมเป็นเบราว์เซอร์ปกติ
const BROWSER_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

interface IServiceConfig {
  id: string
  name: string
  category: ServiceCategory
}

interface ICheckResult {
  ok: boolean
  message: string
}

// สร้างผลลัพธ์รอบเดียวจากฟังก์ชันตรวจ พร้อมจับเวลาและแปลง error/timeout เป็นข้อความไทย
async function measureCheck(config: IServiceConfig, checkFn: () => Promise<ICheckResult>): Promise<IServiceHealth> {
  const startedAt = Date.now()

  try {
    const result = await checkFn()
    const responseTimeMs = Date.now() - startedAt
    const status: ServiceStatus = !result.ok ? 'down' : responseTimeMs > DEGRADED_THRESHOLD_MS ? 'degraded' : 'up'

    return {
      ...config,
      status,
      responseTimeMs,
      message: result.message,
      checkedAt: new Date().toISOString(),
    }
  } catch (error) {
    const responseTimeMs = Date.now() - startedAt
    // AbortSignal.timeout ทำให้ fetch throw DOMException ชื่อ 'TimeoutError' เมื่อเกินเวลาที่กำหนด
    const isTimeout = error instanceof Error && error.name === 'TimeoutError'

    return {
      ...config,
      status: 'down',
      responseTimeMs,
      message: isTimeout ? 'หมดเวลาเชื่อมต่อ (เกิน 8 วินาที)' : 'เชื่อมต่อไปยังบริการนี้ไม่สำเร็จ',
      checkedAt: new Date().toISOString(),
    }
  }
}

// ใช้กับบริการที่ตรวจไม่ได้จริงๆ (ยังไม่ตั้งค่าที่จำเป็น) — ต้องไม่ตีเป็น 'down' เพราะไม่ใช่บริการพัง แค่ตรวจไม่ได้
function buildUnknownHealth(config: IServiceConfig, message: string): IServiceHealth {
  return {
    ...config,
    status: 'unknown',
    responseTimeMs: null,
    message,
    checkedAt: new Date().toISOString(),
  }
}

async function checkHttpOk(url: string, init?: RequestInit): Promise<ICheckResult> {
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) })

  if (!response.ok) {
    return { ok: false, message: `เชื่อมต่อได้แต่เซิร์ฟเวอร์ตอบกลับผิดปกติ (HTTP ${response.status})` }
  }

  return { ok: true, message: 'เชื่อมต่อได้ปกติ' }
}

async function checkAppwriteService(): Promise<ICheckResult> {
  const response = await fetch(`${APPWRITE_ENDPOINT}/health/version`, { signal: AbortSignal.timeout(TIMEOUT_MS) })

  if (!response.ok) {
    return { ok: false, message: `บริการ Appwrite ตอบกลับผิดปกติ (HTTP ${response.status})` }
  }

  const body = (await response.json().catch(() => null)) as { version?: string } | null
  if (!body?.version) {
    return { ok: false, message: 'บริการ Appwrite ตอบกลับโดยไม่มีข้อมูลเวอร์ชัน' }
  }

  return { ok: true, message: `บริการ Appwrite ทำงานปกติ (เวอร์ชัน ${body.version})` }
}

// 401 ตอนยังไม่ล็อกอินแปลว่า project id ถูกต้อง เพราะ Appwrite รู้จักโปรเจคนี้แล้วแค่ปฏิเสธเพราะไม่มี session
// 404 แปลว่า project id ผิด ค่าอื่นถือว่าผิดปกติ
async function checkAppwriteProject(): Promise<ICheckResult> {
  const response = await fetch(`${APPWRITE_ENDPOINT}/account`, {
    headers: { 'X-Appwrite-Project': APPWRITE_PROJECT_ID },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })

  if (response.status === 401) {
    return { ok: true, message: 'ตั้งค่าโปรเจคถูกต้อง (ยังไม่ได้ล็อกอินซึ่งเป็นเรื่องปกติ)' }
  }

  if (response.status === 404) {
    return { ok: false, message: 'ไม่พบโปรเจคนี้ ตรวจสอบค่า Project ID ที่ตั้งไว้' }
  }

  return { ok: false, message: `โปรเจค Appwrite ตอบกลับผิดปกติ (HTTP ${response.status})` }
}

const COLLECTION_LABELS: Record<keyof typeof APPWRITE_COLLECTIONS, string> = {
  transactions: 'รายรับ-รายจ่าย',
  employees: 'พนักงาน',
  payrollEntries: 'รอบจ่ายค่าจ้าง',
  tasks: 'งานในปฏิทิน',
  lotteryTickets: 'เลขหวยที่บันทึก',
  budgets: 'งบประมาณ',
  recurring: 'รายการประจำ',
}

// ตรวจว่า collection ที่แอปต้องใช้ครบทุกตัวไหม (จำกัด 100 แถวแรกก็เพียงพอเพราะแอปมีแค่ 7 collection ของตัวเอง)
async function checkAppwriteCollections(): Promise<ICheckResult> {
  const url = new URL(`${APPWRITE_ENDPOINT}/databases/${APPWRITE_DATABASE_ID}/collections`)
  url.searchParams.append('queries[]', JSON.stringify({ method: 'limit', values: [100] }))

  const response = await fetch(url, {
    headers: {
      'X-Appwrite-Project': APPWRITE_PROJECT_ID,
      'X-Appwrite-Key': APPWRITE_API_KEY,
    },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })

  if (!response.ok) {
    return { ok: false, message: `ดึงรายชื่อตารางข้อมูลไม่สำเร็จ (HTTP ${response.status})` }
  }

  const body = (await response.json().catch(() => null)) as { collections?: Array<{ $id: string }> } | null
  const existingCollectionIds = new Set((body?.collections ?? []).map((collection) => collection.$id))

  const missingCollectionLabels = (Object.keys(APPWRITE_COLLECTIONS) as Array<keyof typeof APPWRITE_COLLECTIONS>)
    .filter((collectionKey) => !existingCollectionIds.has(APPWRITE_COLLECTIONS[collectionKey]))
    .map((collectionKey) => COLLECTION_LABELS[collectionKey])

  if (missingCollectionLabels.length > 0) {
    return {
      ok: false,
      message: `ตารางข้อมูลขาดหายไป: ${missingCollectionLabels.join(', ')} — ลองรัน bun run setup:appwrite`,
    }
  }

  return { ok: true, message: 'ตารางข้อมูลครบถ้วนตามที่แอปต้องใช้' }
}

async function checkLottery(): Promise<ICheckResult> {
  return checkHttpOk('https://www.lottery.co.th/lotto/', { headers: { 'User-Agent': BROWSER_USER_AGENT } })
}

async function checkWeatherForecast(): Promise<ICheckResult> {
  return checkHttpOk('https://api.open-meteo.com/v1/forecast?latitude=13.75&longitude=100.5&current=temperature_2m')
}

async function checkWeatherGeocoding(): Promise<ICheckResult> {
  return checkHttpOk('https://geocoding-api.open-meteo.com/v1/search?name=bangkok&count=1')
}

async function checkGold(): Promise<ICheckResult> {
  return checkHttpOk('https://api.chnwt.dev/thai-gold-api/latest')
}

async function checkOil(): Promise<ICheckResult> {
  return checkHttpOk('https://api.chnwt.dev/thai-oil-api/latest')
}

async function checkCurrency(): Promise<ICheckResult> {
  return checkHttpOk('https://api.frankfurter.app/latest?from=THB&to=USD')
}

// รวบรวมสถานะของทุกบริการพร้อมกันด้วย Promise.all — แต่ละรายการห่อ error ไว้ในตัวเองแล้วผ่าน measureCheck จึงไม่ reject
export async function getStatusReport(): Promise<IStatusReport> {
  const isAppwriteProjectConfigured = APPWRITE_PROJECT_ID.length > 0
  const isAppwriteApiKeyConfigured = APPWRITE_API_KEY.length > 0

  const services = await Promise.all([
    measureCheck({ id: 'appwrite-service', name: 'บริการ Appwrite', category: 'database' }, checkAppwriteService),

    isAppwriteProjectConfigured
      ? measureCheck({ id: 'appwrite-project', name: 'โปรเจค Appwrite', category: 'database' }, checkAppwriteProject)
      : Promise.resolve(
          buildUnknownHealth(
            { id: 'appwrite-project', name: 'โปรเจค Appwrite', category: 'database' },
            'ตรวจสอบไม่ได้เพราะยังไม่ได้ตั้งค่า Project ID ของ Appwrite',
          ),
        ),

    isAppwriteProjectConfigured && isAppwriteApiKeyConfigured
      ? measureCheck({ id: 'appwrite-collections', name: 'ตารางข้อมูล', category: 'database' }, checkAppwriteCollections)
      : Promise.resolve(
          buildUnknownHealth(
            { id: 'appwrite-collections', name: 'ตารางข้อมูล', category: 'database' },
            'ตรวจสอบไม่ได้เพราะยังไม่ได้ตั้ง APPWRITE_API_KEY',
          ),
        ),

    measureCheck({ id: 'lottery', name: 'ผลสลากกินแบ่ง', category: 'external' }, checkLottery),
    measureCheck({ id: 'weather-forecast', name: 'พยากรณ์อากาศ', category: 'external' }, checkWeatherForecast),
    measureCheck({ id: 'weather-geocoding', name: 'ค้นหาสถานที่', category: 'external' }, checkWeatherGeocoding),
    measureCheck({ id: 'gold', name: 'ราคาทองคำ', category: 'external' }, checkGold),
    measureCheck({ id: 'oil', name: 'ราคาน้ำมัน', category: 'external' }, checkOil),
    measureCheck({ id: 'currency', name: 'อัตราแลกเปลี่ยน', category: 'external' }, checkCurrency),
  ])

  return { services, checkedAt: new Date().toISOString() }
}
