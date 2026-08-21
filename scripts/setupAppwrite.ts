// สคริปต์ตั้งค่า Appwrite Databases แบบ idempotent — รันซ้ำได้เรื่อยๆ โดยไม่พัง
// ใช้: bun run setup:appwrite (ต้องตั้ง APPWRITE_API_KEY ไว้ก่อน ดู .env.example)
import { AppwriteException, Client, Databases, DatabasesIndexType, Permission, Role } from 'node-appwrite'
import {
  APPWRITE_DATABASE_ID,
  APPWRITE_SCHEMA,
  type IAppwriteAttributeSpec,
  type IAppwriteCollectionSchema,
  type IAppwriteIndexSpec,
} from '@/constants/appwrite'

const DEFAULT_ENDPOINT = 'https://cloud.appwrite.io/v1'
const ATTRIBUTE_READY_TIMEOUT_MS = 60000
const ATTRIBUTE_POLL_INTERVAL_MS = 1000

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ?? DEFAULT_ENDPOINT
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ?? ''
const apiKey = process.env.APPWRITE_API_KEY ?? ''

// ยังตั้งค่าไม่ครบ ให้บอกวิธีตั้งค่าเป็นภาษาไทยแล้วจบอย่างสุภาพ ไม่ให้ throw stack trace ใส่ผู้ใช้
function printSetupInstructionsAndExit(): never {
  console.log('ยังตั้งค่าไม่ครบ กรุณาตั้งค่าตัวแปรแวดล้อมต่อไปนี้ก่อนรันคำสั่งนี้ (ใส่ไว้ใน .env.local):')
  if (!projectId) {
    console.log('  - NEXT_PUBLIC_APPWRITE_PROJECT_ID: คัดลอกจาก Appwrite Console > Project > Settings')
  }
  if (!apiKey) {
    console.log('  - APPWRITE_API_KEY: สร้างที่ Appwrite Console > Project > Overview > Integrations > API Keys')
    console.log('    ต้องมี scope: databases.read, databases.write, collections.read, collections.write,')
    console.log('    attributes.read, attributes.write, indexes.read, indexes.write')
    console.log('    (server key ห้ามขึ้นต้นด้วย NEXT_PUBLIC_ เด็ดขาด เพราะจะถูกฝังลงโค้ดฝั่ง browser)')
  }
  console.log('ดูตัวอย่างค่าที่ต้องตั้งได้ที่ไฟล์ .env.example')
  process.exit(1)
}

if (!projectId || !apiKey) {
  printSetupInstructionsAndExit()
}

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey)
const databases = new Databases(client)

const INDEX_TYPE_MAP: Record<IAppwriteIndexSpec['type'], DatabasesIndexType> = {
  key: DatabasesIndexType.Key,
  fulltext: DatabasesIndexType.Fulltext,
  unique: DatabasesIndexType.Unique,
}

interface ISetupSummary {
  databaseCreated: boolean
  collectionsCreated: string[]
  collectionsSkipped: string[]
  attributesCreated: number
  attributesSkipped: number
  indexesCreated: number
  indexesSkipped: number
}

// database ที่จะใช้จริง อาจไม่ใช่ค่าเริ่มต้นถ้าโปรเจคสร้าง database ใหม่ไม่ได้แล้ว
let activeDatabaseId = APPWRITE_DATABASE_ID

// แผนฟรีของ Appwrite จำกัดจำนวน database ต่อโปรเจค ถ้าเต็มแล้วให้ใช้ database เดิมที่มีอยู่แทนการล้มทั้งสคริปต์
function isDatabaseLimitError(error: unknown): boolean {
  if (!(error instanceof AppwriteException)) return false
  return error.type === 'project_upgrade_required' || /maximum number of databases/i.test(error.message)
}

// หา database ที่จะใช้: ใช้ตัวที่ระบุไว้ถ้ามีอยู่แล้ว ไม่มีก็สร้างใหม่
// สร้างไม่ได้เพราะโควตาเต็ม ให้ตกไปใช้ database ตัวแรกที่มีอยู่ในโปรเจคแทน แล้วบอกผู้ใช้ให้ปักค่าไว้ใน .env.local
async function resolveDatabaseId(): Promise<{ databaseId: string; wasCreated: boolean }> {
  console.log(`\nDatabase: ${APPWRITE_DATABASE_ID}`)

  try {
    await databases.get({ databaseId: activeDatabaseId })
    console.log(`  • database "${APPWRITE_DATABASE_ID}" มีอยู่แล้ว ข้าม`)
    return { databaseId: activeDatabaseId, wasCreated: false }
  } catch (error) {
    if (!(error instanceof AppwriteException) || error.code !== 404) throw error
  }

  try {
    await databases.create({ databaseId: activeDatabaseId, name: 'Budget Calc' })
    console.log(`  ✓ สร้าง database "${APPWRITE_DATABASE_ID}" แล้ว`)
    return { databaseId: activeDatabaseId, wasCreated: true }
  } catch (error) {
    if (!isDatabaseLimitError(error)) throw error
  }

  console.log('  ! สร้าง database ใหม่ไม่ได้ เพราะโปรเจคนี้ใช้โควตา database ของแผนปัจจุบันครบแล้ว')
  const existingDatabases = await databases.list({})

  if (existingDatabases.databases.length === 0) {
    console.error('\nโปรเจคนี้ยังไม่มี database เลย และสร้างใหม่ไม่ได้')
    console.error('กรุณาลบ database ที่ไม่ได้ใช้ออกจาก Appwrite Console หรืออัปเกรดแผน แล้วรันคำสั่งนี้ใหม่')
    process.exit(1)
  }

  const fallbackDatabase = existingDatabases.databases[0]
  console.log(`  → ใช้ database เดิมที่มีอยู่แทน: "${fallbackDatabase.name}" (id: ${fallbackDatabase.$id})`)
  console.log('    เพิ่มบรรทัดนี้ใน .env.local เพื่อให้แอปชี้ไป database เดียวกันเสมอ:')
  console.log(`    NEXT_PUBLIC_APPWRITE_DATABASE_ID=${fallbackDatabase.$id}`)

  return { databaseId: fallbackDatabase.$id, wasCreated: false }
}

function sleep(delayMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delayMs))
}

// เจอ error ประเภท "มีอยู่แล้ว" (409 หรือ type ลงท้าย _already_exists) ถือว่าไม่ใช่ความผิดพลาด ข้ามได้เลย
function isAlreadyExistsError(error: unknown): boolean {
  if (error instanceof AppwriteException) {
    return error.code === 409 || error.type.endsWith('_already_exists')
  }
  return false
}

// สร้างทรัพยากรแบบ idempotent: ถ้ามีอยู่แล้วให้ข้ามเงียบๆ พร้อมพิมพ์แจ้งแทนการ throw
async function ensureCreated(label: string, action: () => Promise<unknown>): Promise<'created' | 'skipped'> {
  try {
    await action()
    console.log(`  ✓ สร้าง ${label} แล้ว`)
    return 'created'
  } catch (error) {
    if (isAlreadyExistsError(error)) {
      console.log(`  • ${label} มีอยู่แล้ว ข้าม`)
      return 'skipped'
    }
    throw error
  }
}

// อ่านรายชื่อ attribute ที่มีอยู่จริงก่อนสร้าง เชื่อถือได้กว่าการดัก error
// เพราะ Appwrite อาจตอบ error เรื่องขนาดแถวแทน _already_exists เมื่อ collection เกือบเต็ม
async function listExistingAttributeKeys(collectionId: string): Promise<Set<string>> {
  try {
    const attributeList = await databases.listAttributes({ databaseId: activeDatabaseId, collectionId })
    return new Set(attributeList.attributes.map((attribute) => attribute.key))
  } catch {
    return new Set<string>()
  }
}

async function createAttribute(
  collectionId: string,
  attribute: IAppwriteAttributeSpec,
  existingKeys: Set<string>,
): Promise<'created' | 'skipped'> {
  const label = `attribute ${collectionId}.${attribute.key}`

  if (existingKeys.has(attribute.key)) {
    console.log(`  • ${label} มีอยู่แล้ว ข้าม`)
    return 'skipped'
  }

  if (attribute.type === 'float') {
    return ensureCreated(label, () =>
      databases.createFloatAttribute({
        databaseId: activeDatabaseId,
        collectionId,
        key: attribute.key,
        required: attribute.required,
      }),
    )
  }

  return ensureCreated(label, () =>
    databases.createStringAttribute({
      databaseId: activeDatabaseId,
      collectionId,
      key: attribute.key,
      size: attribute.size ?? 256,
      required: attribute.required,
    }),
  )
}

// Appwrite สร้าง attribute แบบ async ต้องรอ status = 'available' ก่อนอ้างอิงใน index ไม่งั้นสร้าง index จะพัง
async function waitForAttributesAvailable(collectionId: string, attributeKeys: string[]): Promise<void> {
  const startedAt = Date.now()
  const pendingKeys = new Set(attributeKeys)

  while (pendingKeys.size > 0) {
    const attributeList = await databases.listAttributes({ databaseId: activeDatabaseId, collectionId })

    for (const attribute of attributeList.attributes) {
      if (pendingKeys.has(attribute.key) && attribute.status === 'available') {
        pendingKeys.delete(attribute.key)
      }
    }

    if (pendingKeys.size === 0) break

    if (Date.now() - startedAt > ATTRIBUTE_READY_TIMEOUT_MS) {
      console.log(
        `  ⚠ รอ attribute พร้อมใช้งานนานเกินไป (${[...pendingKeys].join(', ')}) ` +
          'อาจต้องรันคำสั่งนี้ซ้ำอีกครั้งหลังรอสักครู่',
      )
      return
    }

    await sleep(ATTRIBUTE_POLL_INTERVAL_MS)
  }
}

async function setupCollection(schema: IAppwriteCollectionSchema, summary: ISetupSummary): Promise<void> {
  console.log(`\nCollection: ${schema.collectionId}`)

  const collectionResult = await ensureCreated(`collection "${schema.collectionId}"`, () =>
    databases.createCollection({
      databaseId: activeDatabaseId,
      collectionId: schema.collectionId,
      name: schema.name,
      permissions: [Permission.create(Role.users())],
      documentSecurity: true,
    }),
  )
  if (collectionResult === 'created') {
    summary.collectionsCreated.push(schema.collectionId)
  } else {
    summary.collectionsSkipped.push(schema.collectionId)
  }

  const existingAttributeKeys = await listExistingAttributeKeys(schema.collectionId)

  for (const attribute of schema.attributes) {
    const attributeResult = await createAttribute(schema.collectionId, attribute, existingAttributeKeys)
    if (attributeResult === 'created') summary.attributesCreated += 1
    else summary.attributesSkipped += 1
  }

  if (schema.attributes.length > 0) {
    await waitForAttributesAvailable(
      schema.collectionId,
      schema.attributes.map((attribute) => attribute.key),
    )
  }

  for (const index of schema.indexes) {
    const indexResult = await ensureCreated(`index ${schema.collectionId}.${index.key}`, () =>
      databases.createIndex({
        databaseId: activeDatabaseId,
        collectionId: schema.collectionId,
        key: index.key,
        type: INDEX_TYPE_MAP[index.type],
        attributes: index.attributes,
      }),
    )
    if (indexResult === 'created') summary.indexesCreated += 1
    else summary.indexesSkipped += 1
  }
}

function printSummary(summary: ISetupSummary): void {
  console.log('\n=== สรุปผลการตั้งค่า Appwrite ===')
  console.log(`database "${activeDatabaseId}": ${summary.databaseCreated ? 'สร้างใหม่' : 'ใช้ตัวที่มีอยู่แล้ว'}`)
  if (summary.collectionsCreated.length > 0) {
    console.log(`collection ที่สร้างใหม่: ${summary.collectionsCreated.join(', ')}`)
  }
  if (summary.collectionsSkipped.length > 0) {
    console.log(`collection ที่มีอยู่แล้ว: ${summary.collectionsSkipped.join(', ')}`)
  }
  console.log(`attribute: สร้างใหม่ ${summary.attributesCreated} รายการ, มีอยู่แล้ว ${summary.attributesSkipped} รายการ`)
  console.log(`index: สร้างใหม่ ${summary.indexesCreated} รายการ, มีอยู่แล้ว ${summary.indexesSkipped} รายการ`)
  console.log('\nขั้นตอนถัดไป: ตรวจสอบ collection/attribute ใน Appwrite Console ว่าครบตามที่ต้องการ')
  console.log('จากนั้นสามารถเริ่มใช้งาน data layer ที่ src/features/sync/services/remoteStore.ts ได้เลย')
}

async function main(): Promise<void> {
  console.log(`กำลังตั้งค่า Appwrite ที่ ${endpoint} (project: ${projectId})`)

  const summary: ISetupSummary = {
    databaseCreated: false,
    collectionsCreated: [],
    collectionsSkipped: [],
    attributesCreated: 0,
    attributesSkipped: 0,
    indexesCreated: 0,
    indexesSkipped: 0,
  }

  const resolved = await resolveDatabaseId()
  activeDatabaseId = resolved.databaseId
  summary.databaseCreated = resolved.wasCreated

  for (const collectionSchema of APPWRITE_SCHEMA) {
    await setupCollection(collectionSchema, summary)
  }

  printSummary(summary)
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`\nตั้งค่า Appwrite ไม่สำเร็จ: ${message}`)
  process.exit(1)
})
