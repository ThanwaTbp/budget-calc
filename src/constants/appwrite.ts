// ค่าคงที่และ schema ของ Appwrite Databases — ให้ทั้งสคริปต์ตั้งค่า (scripts/setupAppwrite.ts)
// และ data layer (src/features/sync/services/remoteStore.ts) อ้างอิงจากที่เดียวกัน จะได้ไม่หลุด sync กัน
// ไฟล์นี้ต้องไม่ import SDK ใดๆ (ทั้ง appwrite และ node-appwrite) เพราะถูกใช้ทั้งฝั่ง browser และฝั่งสคริปต์ node

// เผื่อกรณีบัญชี Appwrite แผนฟรีที่สร้าง database ใหม่ไม่ได้แล้ว (จำกัดจำนวนต่อโปรเจค)
// ให้ชี้ไปใช้ database เดิมที่มีอยู่ได้ผ่าน env โดยไม่ต้องแก้โค้ด
export const APPWRITE_DATABASE_ID =
  process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID?.trim() || 'budget-calc'

// database เดียวกันอาจมี collection ของโปรเจคเก่าที่ชื่อ 'transactions'/'employees' อยู่แล้ว
// จึงใช้ id ที่ไม่ชนกันสำหรับแอปนี้โดยเฉพาะ ห้ามเปลี่ยนหลังมีข้อมูลจริงแล้ว
// (payrollEntries เป็น collection ที่แอปนี้สร้างเองตั้งแต่แรก จึงไม่ต้องเติม prefix)
export const APPWRITE_COLLECTIONS = {
  transactions: 'bc_transactions',
  employees: 'bc_employees',
  payrollEntries: 'payrollEntries',
  tasks: 'bc_tasks',
  lotteryTickets: 'bc_lottery_tickets',
  budgets: 'bc_budgets',
  recurring: 'bc_recurring',
  privateNotes: 'bc_private_notes',
} as const


// ชนิด attribute ที่ schema ของแอปใช้จริง (พอสำหรับ string/float เท่านั้น ไม่ต้องรองรับทุกชนิดของ Appwrite)
export type IAppwriteAttributeType = 'string' | 'float'

export interface IAppwriteAttributeSpec {
  key: string
  type: IAppwriteAttributeType
  required: boolean
  // บังคับใช้เฉพาะตอน type เป็น 'string' คือความยาวตัวอักษรสูงสุด
  size?: number
}

export type IAppwriteIndexType = 'key' | 'fulltext' | 'unique'

export interface IAppwriteIndexSpec {
  key: string
  type: IAppwriteIndexType
  attributes: string[]
}

export interface IAppwriteCollectionSchema {
  collectionId: string
  name: string
  attributes: IAppwriteAttributeSpec[]
  indexes: IAppwriteIndexSpec[]
}

// ต้องตรงกับตารางใน docs/SPEC.md หัวข้อ "Sync ข้อมูลขึ้น Appwrite Databases" เป๊ะ
// ห้ามใช้ชื่อ field ว่า 'createdAt' เพราะชนกับ $createdAt ของ Appwrite เอง จึงใช้ 'createdAtIso' แทน
export const APPWRITE_SCHEMA: IAppwriteCollectionSchema[] = [
  {
    collectionId: APPWRITE_COLLECTIONS.transactions,
    name: 'Transactions',
    attributes: [
      { key: 'type', type: 'string', required: true, size: 16 },
      { key: 'amount', type: 'float', required: true },
      { key: 'categoryId', type: 'string', required: true, size: 64 },
      { key: 'note', type: 'string', required: false, size: 256 },
      { key: 'date', type: 'string', required: true, size: 10 },
      { key: 'source', type: 'string', required: true, size: 16 },
      { key: 'sourceRefId', type: 'string', required: false, size: 64 },
      { key: 'createdAtIso', type: 'string', required: true, size: 32 },
    ],
    indexes: [{ key: 'date_idx', type: 'key', attributes: ['date'] }],
  },
  {
    collectionId: APPWRITE_COLLECTIONS.employees,
    name: 'Employees',
    attributes: [
      { key: 'name', type: 'string', required: true, size: 128 },
      { key: 'note', type: 'string', required: false, size: 256 },
      { key: 'createdAtIso', type: 'string', required: true, size: 32 },
    ],
    indexes: [],
  },
  {
    collectionId: APPWRITE_COLLECTIONS.payrollEntries,
    name: 'Payroll Entries',
    attributes: [
      { key: 'employeeId', type: 'string', required: true, size: 64 },
      { key: 'date', type: 'string', required: true, size: 10 },
      { key: 'note', type: 'string', required: false, size: 256 },
      // itemsJson = JSON.stringify(IPayItem[]) เพราะ Appwrite ไม่มีชนิด object ซ้อน
      { key: 'itemsJson', type: 'string', required: true, size: 8192 },
      { key: 'createdAtIso', type: 'string', required: true, size: 32 },
    ],
    indexes: [
      { key: 'employeeId_idx', type: 'key', attributes: ['employeeId'] },
      { key: 'date_idx', type: 'key', attributes: ['date'] },
    ],
  },
  {
    collectionId: APPWRITE_COLLECTIONS.tasks,
    name: 'Tasks',
    attributes: [
      { key: 'title', type: 'string', required: true, size: 160 },
      { key: 'detail', type: 'string', required: false, size: 1000 },
      { key: 'date', type: 'string', required: true, size: 10 },
      { key: 'startTime', type: 'string', required: false, size: 5 },
      { key: 'endTime', type: 'string', required: false, size: 5 },
      { key: 'status', type: 'string', required: true, size: 16 },
      { key: 'createdAtIso', type: 'string', required: true, size: 32 },
    ],
    indexes: [{ key: 'date_idx', type: 'key', attributes: ['date'] }],
  },
  {
    collectionId: APPWRITE_COLLECTIONS.lotteryTickets,
    name: 'Lottery Tickets',
    attributes: [
      { key: 'number', type: 'string', required: true, size: 6 },
      { key: 'note', type: 'string', required: false, size: 160 },
      { key: 'createdAtIso', type: 'string', required: true, size: 32 },
    ],
    indexes: [],
  },
  {
    collectionId: APPWRITE_COLLECTIONS.budgets,
    name: 'Budgets',
    attributes: [
      { key: 'categoryId', type: 'string', size: 64, required: true },
      { key: 'amount', type: 'float', required: true },
      { key: 'createdAtIso', type: 'string', size: 32, required: true },
    ],
    indexes: [],
  },
  {
    collectionId: APPWRITE_COLLECTIONS.recurring,
    name: 'Recurring Items',
    attributes: [
      { key: 'type', type: 'string', size: 16, required: true },
      { key: 'amount', type: 'float', required: true },
      { key: 'categoryId', type: 'string', size: 64, required: true },
      { key: 'note', type: 'string', size: 256, required: false },
      { key: 'dayOfMonth', type: 'float', required: true },
      { key: 'isActive', type: 'string', size: 8, required: true },
      { key: 'lastPostedYearMonth', type: 'string', size: 7, required: false },
      { key: 'createdAtIso', type: 'string', size: 32, required: true },
    ],
    indexes: [],
  },
  {
    collectionId: APPWRITE_COLLECTIONS.privateNotes,
    name: 'Private Notes',
    attributes: [
      { key: 'kind', type: 'string', size: 16, required: true },
      { key: 'title', type: 'string', size: 160, required: false },
      { key: 'content', type: 'string', size: 8192, required: false },
      { key: 'tone', type: 'string', size: 16, required: false },
      { key: 'isPinned', type: 'string', size: 8, required: true },
      // ข้อมูลลับทั้งก้อนเป็น ciphertext + metadata สำหรับปลดล็อก ไม่มี plaintext ของหัวข้อหรือรหัสผ่าน
      { key: 'secretJson', type: 'string', size: 16384, required: false },
      { key: 'createdAtIso', type: 'string', size: 32, required: true },
      { key: 'updatedAtIso', type: 'string', size: 32, required: true },
    ],
    indexes: [{ key: 'updatedAtIso_idx', type: 'key', attributes: ['updatedAtIso'] }],
  },
]
