// Data layer สำหรับ sync ข้อมูลขึ้น Appwrite Databases
// ห้าม import store ของ transactions/payroll ที่นี่ (กัน circular import) — รับ/คืนค่าเป็น entity ล้วนเท่านั้น
import { AppwriteException, Databases, type Models, Permission, Query, Role } from 'appwrite'
import { appwriteClient, isAppwriteConfigured } from '@/lib/appwrite'
import { APPWRITE_COLLECTIONS, APPWRITE_DATABASE_ID } from '@/constants/appwrite'
import type { IEmployee, IPayItem, IPayrollEntry, ITransaction, PayItemKind } from '@/types/finance'
import type { ITask, TaskStatus } from '@/types/planner'
import type { ILotteryTicket } from '@/types/lottery'
import type { IBudget } from '@/types/budget'
import type { IRecurringItem } from '@/types/recurring'
import type { TransactionType } from '@/types/finance'

export interface IRemoteSnapshot {
  transactions: ITransaction[]
  employees: IEmployee[]
  entries: IPayrollEntry[]
  tasks: ITask[]
  lotteryTickets: ILotteryTicket[]
  budgets: IBudget[]
  recurringItems: IRecurringItem[]
}

const appwriteDatabases = new Databases(appwriteClient)

// จำนวนแถวต่อหน้าตอนวนดึงเอกสารทั้งหมด (listDocuments คืนสูงสุด 25 แถวถ้าไม่ระบุ limit)
const PAGE_SIZE = 100
// จำนวนรายการที่ยิงพร้อมกันต่อรอบตอน push ทั้งก้อน กันโดน rate limit จาก Appwrite
const PUSH_BATCH_SIZE = 10

// รูปเอกสารดิบที่เก็บบน Appwrite ของแต่ละ collection (ไม่รวม $id/$createdAt ฯลฯ ที่มากับ Models.Document อยู่แล้ว)
interface ITransactionDocument extends Models.Document {
  type: string
  amount: number
  categoryId: string
  note: string
  date: string
  source: string
  sourceRefId: string | null
  createdAtIso: string
}

interface IEmployeeDocument extends Models.Document {
  name: string
  note: string
  createdAtIso: string
}

interface IPayrollEntryDocument extends Models.Document {
  employeeId: string
  date: string
  note: string
  itemsJson: string
  createdAtIso: string
}

interface ITaskDocument extends Models.Document {
  title: string
  detail: string
  date: string
  startTime: string
  endTime: string
  status: string
  createdAtIso: string
}

interface ILotteryTicketDocument extends Models.Document {
  number: string
  note: string
  createdAtIso: string
}

interface IBudgetDocument extends Models.Document {
  categoryId: string
  amount: number
  createdAtIso: string
}

interface IRecurringDocument extends Models.Document {
  type: string
  amount: number
  categoryId: string
  note: string
  dayOfMonth: number
  // schema helper รองรับแค่ string/float เท่านั้น จึงเก็บ boolean เป็น 'true'/'false' แทน
  isActive: string
  lastPostedYearMonth: string
  createdAtIso: string
}

function buildOwnerPermissions(userId: string): string[] {
  return [Permission.read(Role.user(userId)), Permission.update(Role.user(userId)), Permission.delete(Role.user(userId))]
}

function mapTransactionDocumentToEntity(document: ITransactionDocument): ITransaction {
  return {
    id: document.$id,
    type: document.type === 'income' ? 'income' : 'expense',
    amount: document.amount,
    categoryId: document.categoryId,
    note: document.note ?? '',
    date: document.date,
    createdAt: document.createdAtIso,
    source: document.source === 'payroll' ? 'payroll' : 'manual',
    sourceRefId: document.sourceRefId ?? null,
  }
}

function mapTransactionEntityToDocumentData(transaction: ITransaction): Omit<ITransactionDocument, keyof Models.Document> {
  return {
    type: transaction.type,
    amount: transaction.amount,
    categoryId: transaction.categoryId,
    note: transaction.note,
    date: transaction.date,
    source: transaction.source,
    sourceRefId: transaction.sourceRefId,
    createdAtIso: transaction.createdAt,
  }
}

function mapEmployeeDocumentToEntity(document: IEmployeeDocument): IEmployee {
  return {
    id: document.$id,
    name: document.name,
    note: document.note ?? '',
    createdAt: document.createdAtIso,
  }
}

function mapEmployeeEntityToDocumentData(employee: IEmployee): Omit<IEmployeeDocument, keyof Models.Document> {
  return {
    name: employee.name,
    note: employee.note,
    createdAtIso: employee.createdAt,
  }
}

// itemsJson พังหรือว่างต้องไม่ throw ให้คืน array ว่างแทน ไม่งั้นทั้งรอบ pull จะล้มเพราะรายการเดียว
function parsePayItemsJsonSafely(itemsJson: string): IPayItem[] {
  try {
    const parsed: unknown = JSON.parse(itemsJson)
    if (!Array.isArray(parsed)) return []

    return parsed.filter((item): item is IPayItem => isValidPayItem(item))
  } catch {
    return []
  }
}

function isValidPayItem(item: unknown): item is IPayItem {
  if (typeof item !== 'object' || item === null) return false
  const candidate = item as Record<string, unknown>
  const isValidKind = (kind: unknown): kind is PayItemKind => kind === 'earning' || kind === 'deduction'

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.label === 'string' &&
    typeof candidate.amount === 'number' &&
    isValidKind(candidate.kind)
  )
}

function mapPayrollEntryDocumentToEntity(document: IPayrollEntryDocument): IPayrollEntry {
  return {
    id: document.$id,
    employeeId: document.employeeId,
    date: document.date,
    items: parsePayItemsJsonSafely(document.itemsJson),
    note: document.note ?? '',
    createdAt: document.createdAtIso,
  }
}

function mapPayrollEntryEntityToDocumentData(entry: IPayrollEntry): Omit<IPayrollEntryDocument, keyof Models.Document> {
  return {
    employeeId: entry.employeeId,
    date: entry.date,
    note: entry.note,
    itemsJson: JSON.stringify(entry.items),
    createdAtIso: entry.createdAt,
  }
}

function toTaskStatus(status: string): TaskStatus {
  return status === 'done' ? 'done' : 'todo'
}

function mapTaskDocumentToEntity(document: ITaskDocument): ITask {
  return {
    id: document.$id,
    title: document.title,
    detail: document.detail ?? '',
    date: document.date,
    startTime: document.startTime ?? '',
    endTime: document.endTime ?? '',
    status: toTaskStatus(document.status),
    createdAt: document.createdAtIso,
  }
}

function mapTaskEntityToDocumentData(task: ITask): Omit<ITaskDocument, keyof Models.Document> {
  return {
    title: task.title,
    detail: task.detail,
    date: task.date,
    startTime: task.startTime,
    endTime: task.endTime,
    status: task.status,
    createdAtIso: task.createdAt,
  }
}

function mapLotteryTicketDocumentToEntity(document: ILotteryTicketDocument): ILotteryTicket {
  return {
    id: document.$id,
    number: document.number,
    note: document.note ?? '',
    createdAt: document.createdAtIso,
  }
}

function mapLotteryTicketEntityToDocumentData(
  ticket: ILotteryTicket,
): Omit<ILotteryTicketDocument, keyof Models.Document> {
  return {
    number: ticket.number,
    note: ticket.note,
    createdAtIso: ticket.createdAt,
  }
}

function mapBudgetDocumentToEntity(document: IBudgetDocument): IBudget {
  return {
    id: document.$id,
    categoryId: document.categoryId,
    amount: document.amount,
    createdAt: document.createdAtIso,
  }
}

function mapBudgetEntityToDocumentData(budget: IBudget): Omit<IBudgetDocument, keyof Models.Document> {
  return {
    categoryId: budget.categoryId,
    amount: budget.amount,
    createdAtIso: budget.createdAt,
  }
}

function toTransactionType(type: string): TransactionType {
  return type === 'income' ? 'income' : 'expense'
}

// กันวันที่เพี้ยนจากข้อมูลเก่า/แก้มือ ปัดเข้าช่วง 1–31 เสมอ
function clampDayOfMonth(dayOfMonth: number): number {
  if (!Number.isFinite(dayOfMonth)) return 1
  return Math.min(31, Math.max(1, Math.round(dayOfMonth)))
}

function mapRecurringDocumentToEntity(document: IRecurringDocument): IRecurringItem {
  return {
    id: document.$id,
    type: toTransactionType(document.type),
    amount: document.amount,
    categoryId: document.categoryId,
    note: document.note ?? '',
    dayOfMonth: clampDayOfMonth(Number(document.dayOfMonth)),
    // ห้ามใช้ Boolean(value) เพราะ Boolean('false') เป็น true ต้องเทียบ string ตรงๆ เท่านั้น
    isActive: document.isActive === 'true',
    lastPostedYearMonth: document.lastPostedYearMonth ?? '',
    createdAt: document.createdAtIso,
  }
}

function mapRecurringEntityToDocumentData(item: IRecurringItem): Omit<IRecurringDocument, keyof Models.Document> {
  return {
    type: item.type,
    amount: item.amount,
    categoryId: item.categoryId,
    note: item.note,
    dayOfMonth: item.dayOfMonth,
    isActive: item.isActive ? 'true' : 'false',
    lastPostedYearMonth: item.lastPostedYearMonth,
    createdAtIso: item.createdAt,
  }
}

// วนดึงเอกสารทั้งหมดของ collection ด้วย cursor pagination จนครบ (listDocuments คืนแค่ 25 แถวแรกถ้าไม่ระบุ limit)
async function fetchAllDocuments<Document extends Models.Document>(collectionId: string): Promise<Document[]> {
  const documents: Document[] = []
  let lastDocumentId: string | undefined

  while (true) {
    const queries = [Query.limit(PAGE_SIZE)]
    if (lastDocumentId) queries.push(Query.cursorAfter(lastDocumentId))

    const documentList = await appwriteDatabases.listDocuments<Document>({
      databaseId: APPWRITE_DATABASE_ID,
      collectionId,
      queries,
    })

    documents.push(...documentList.documents)

    if (documentList.documents.length < PAGE_SIZE) break
    lastDocumentId = documentList.documents[documentList.documents.length - 1].$id
  }

  return documents
}

// ยิง request ทีละชุดเล็กๆ แทนที่จะยิงพร้อมกันทั้งหมด กันโดน rate limit ตอนอัปโหลดข้อมูลก้อนใหญ่
async function pushInBatches<Item>(items: Item[], pushItem: (item: Item) => Promise<void>): Promise<void> {
  for (let startIndex = 0; startIndex < items.length; startIndex += PUSH_BATCH_SIZE) {
    const batch = items.slice(startIndex, startIndex + PUSH_BATCH_SIZE)
    await Promise.all(batch.map((item) => pushItem(item)))
  }
}

// ดึงข้อมูลทั้งหมดของผู้ใช้คนนี้จาก Appwrite (แหล่งข้อมูลจริง) มาใช้ทำ snapshot ให้ store ในเครื่อง
export async function pullSnapshot(userId: string): Promise<IRemoteSnapshot> {
  if (!userId) {
    throw new Error('ต้องระบุผู้ใช้ก่อนดึงข้อมูล')
  }

  const [
    transactionDocuments,
    employeeDocuments,
    payrollEntryDocuments,
    taskDocuments,
    lotteryTicketDocuments,
    budgetDocuments,
    recurringDocuments,
  ] = await Promise.all([
    fetchAllDocuments<ITransactionDocument>(APPWRITE_COLLECTIONS.transactions),
    fetchAllDocuments<IEmployeeDocument>(APPWRITE_COLLECTIONS.employees),
    fetchAllDocuments<IPayrollEntryDocument>(APPWRITE_COLLECTIONS.payrollEntries),
    fetchAllDocuments<ITaskDocument>(APPWRITE_COLLECTIONS.tasks),
    fetchAllDocuments<ILotteryTicketDocument>(APPWRITE_COLLECTIONS.lotteryTickets),
    fetchAllDocuments<IBudgetDocument>(APPWRITE_COLLECTIONS.budgets),
    fetchAllDocuments<IRecurringDocument>(APPWRITE_COLLECTIONS.recurring),
  ])

  return {
    transactions: transactionDocuments.map(mapTransactionDocumentToEntity),
    employees: employeeDocuments.map(mapEmployeeDocumentToEntity),
    entries: payrollEntryDocuments.map(mapPayrollEntryDocumentToEntity),
    tasks: taskDocuments.map(mapTaskDocumentToEntity),
    lotteryTickets: lotteryTicketDocuments.map(mapLotteryTicketDocumentToEntity),
    budgets: budgetDocuments.map(mapBudgetDocumentToEntity),
    recurringItems: recurringDocuments.map(mapRecurringDocumentToEntity),
  }
}

export async function pushTransaction(userId: string, transaction: ITransaction): Promise<void> {
  await appwriteDatabases.upsertDocument<ITransactionDocument>({
    databaseId: APPWRITE_DATABASE_ID,
    collectionId: APPWRITE_COLLECTIONS.transactions,
    documentId: transaction.id,
    data: mapTransactionEntityToDocumentData(transaction),
    permissions: buildOwnerPermissions(userId),
  })
}

export async function deleteTransaction(id: string): Promise<void> {
  await appwriteDatabases.deleteDocument({
    databaseId: APPWRITE_DATABASE_ID,
    collectionId: APPWRITE_COLLECTIONS.transactions,
    documentId: id,
  })
}

export async function pushEmployee(userId: string, employee: IEmployee): Promise<void> {
  await appwriteDatabases.upsertDocument<IEmployeeDocument>({
    databaseId: APPWRITE_DATABASE_ID,
    collectionId: APPWRITE_COLLECTIONS.employees,
    documentId: employee.id,
    data: mapEmployeeEntityToDocumentData(employee),
    permissions: buildOwnerPermissions(userId),
  })
}

export async function deleteEmployee(id: string): Promise<void> {
  await appwriteDatabases.deleteDocument({
    databaseId: APPWRITE_DATABASE_ID,
    collectionId: APPWRITE_COLLECTIONS.employees,
    documentId: id,
  })
}

export async function pushPayrollEntry(userId: string, entry: IPayrollEntry): Promise<void> {
  await appwriteDatabases.upsertDocument<IPayrollEntryDocument>({
    databaseId: APPWRITE_DATABASE_ID,
    collectionId: APPWRITE_COLLECTIONS.payrollEntries,
    documentId: entry.id,
    data: mapPayrollEntryEntityToDocumentData(entry),
    permissions: buildOwnerPermissions(userId),
  })
}

export async function deletePayrollEntry(id: string): Promise<void> {
  await appwriteDatabases.deleteDocument({
    databaseId: APPWRITE_DATABASE_ID,
    collectionId: APPWRITE_COLLECTIONS.payrollEntries,
    documentId: id,
  })
}

export async function pushTask(userId: string, task: ITask): Promise<void> {
  await appwriteDatabases.upsertDocument<ITaskDocument>({
    databaseId: APPWRITE_DATABASE_ID,
    collectionId: APPWRITE_COLLECTIONS.tasks,
    documentId: task.id,
    data: mapTaskEntityToDocumentData(task),
    permissions: buildOwnerPermissions(userId),
  })
}

export async function deleteTask(id: string): Promise<void> {
  await appwriteDatabases.deleteDocument({
    databaseId: APPWRITE_DATABASE_ID,
    collectionId: APPWRITE_COLLECTIONS.tasks,
    documentId: id,
  })
}

export async function pushLotteryTicket(userId: string, ticket: ILotteryTicket): Promise<void> {
  await appwriteDatabases.upsertDocument<ILotteryTicketDocument>({
    databaseId: APPWRITE_DATABASE_ID,
    collectionId: APPWRITE_COLLECTIONS.lotteryTickets,
    documentId: ticket.id,
    data: mapLotteryTicketEntityToDocumentData(ticket),
    permissions: buildOwnerPermissions(userId),
  })
}

export async function deleteLotteryTicket(id: string): Promise<void> {
  await appwriteDatabases.deleteDocument({
    databaseId: APPWRITE_DATABASE_ID,
    collectionId: APPWRITE_COLLECTIONS.lotteryTickets,
    documentId: id,
  })
}

export async function pushBudget(userId: string, budget: IBudget): Promise<void> {
  await appwriteDatabases.upsertDocument<IBudgetDocument>({
    databaseId: APPWRITE_DATABASE_ID,
    collectionId: APPWRITE_COLLECTIONS.budgets,
    documentId: budget.id,
    data: mapBudgetEntityToDocumentData(budget),
    permissions: buildOwnerPermissions(userId),
  })
}

export async function deleteBudget(id: string): Promise<void> {
  await appwriteDatabases.deleteDocument({
    databaseId: APPWRITE_DATABASE_ID,
    collectionId: APPWRITE_COLLECTIONS.budgets,
    documentId: id,
  })
}

export async function pushRecurringItem(userId: string, item: IRecurringItem): Promise<void> {
  await appwriteDatabases.upsertDocument<IRecurringDocument>({
    databaseId: APPWRITE_DATABASE_ID,
    collectionId: APPWRITE_COLLECTIONS.recurring,
    documentId: item.id,
    data: mapRecurringEntityToDocumentData(item),
    permissions: buildOwnerPermissions(userId),
  })
}

export async function deleteRecurringItem(id: string): Promise<void> {
  await appwriteDatabases.deleteDocument({
    databaseId: APPWRITE_DATABASE_ID,
    collectionId: APPWRITE_COLLECTIONS.recurring,
    documentId: id,
  })
}

// อัปโหลด snapshot ทั้งก้อนขึ้น Appwrite ใช้ตอนย้ายข้อมูลครั้งแรก (ทยอยทีละชุดกันโดน rate limit)
export async function pushSnapshot(userId: string, snapshot: IRemoteSnapshot): Promise<void> {
  await pushInBatches(snapshot.transactions, (transaction) => pushTransaction(userId, transaction))
  await pushInBatches(snapshot.employees, (employee) => pushEmployee(userId, employee))
  await pushInBatches(snapshot.entries, (entry) => pushPayrollEntry(userId, entry))
  await pushInBatches(snapshot.tasks, (task) => pushTask(userId, task))
  await pushInBatches(snapshot.lotteryTickets, (ticket) => pushLotteryTicket(userId, ticket))
  await pushInBatches(snapshot.budgets, (budget) => pushBudget(userId, budget))
  await pushInBatches(snapshot.recurringItems, (item) => pushRecurringItem(userId, item))
}

export function isRemoteReady(): boolean {
  return isAppwriteConfigured
}

// error code ของ Appwrite ที่แปลเป็นข้อความไทยตรงๆ ได้ ที่แปลไม่ได้จะ fallback เป็นข้อความกลางๆ เสมอ
const THAI_SYNC_ERROR_MESSAGE_MAP: Record<string, string> = {
  collection_not_found: 'ยังไม่ได้ตั้งค่าฐานข้อมูล กรุณารัน bun run setup:appwrite ก่อน',
  database_not_found: 'ยังไม่ได้ตั้งค่าฐานข้อมูล กรุณารัน bun run setup:appwrite ก่อน',
  document_not_found: 'ไม่พบข้อมูลนี้ในระบบ อาจถูกลบไปจากอีกเครื่องแล้ว',
  general_unauthorized_scope: 'ไม่มีสิทธิ์ทำรายการนี้ กรุณาเข้าสู่ระบบใหม่อีกครั้ง',
  general_rate_limit_exceeded: 'ทำรายการถี่เกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้ง',
}

const NETWORK_ERROR_MESSAGE = 'เชื่อมต่ออินเทอร์เน็ตไม่ได้ ข้อมูลจะถูกซิงก์อีกครั้งเมื่อกลับมาออนไลน์'
const FALLBACK_SYNC_ERROR_MESSAGE = 'ซิงก์ข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง'

// เบราว์เซอร์/undici โยน TypeError ดิบๆ ตอน fetch หลุดออฟไลน์ ไม่ได้ห่อเป็น AppwriteException มาให้
function isNetworkError(error: unknown): boolean {
  return error instanceof TypeError && /fetch|network/i.test(error.message)
}

// แปลง error ทุกชนิดจากการ sync ให้เป็นข้อความไทยเสมอ ห้ามคืนข้อความอังกฤษดิบให้ผู้ใช้เห็น
export function toThaiSyncErrorMessage(error: unknown): string {
  if (error instanceof AppwriteException) {
    if (error.type && THAI_SYNC_ERROR_MESSAGE_MAP[error.type]) {
      return THAI_SYNC_ERROR_MESSAGE_MAP[error.type]
    }
    // code 0 คือ fetch ไม่ได้รับ response กลับมาเลย ซึ่งเกิดจากออฟไลน์เป็นหลัก
    if (error.code === 0) {
      return NETWORK_ERROR_MESSAGE
    }
    return FALLBACK_SYNC_ERROR_MESSAGE
  }

  if (isNetworkError(error)) {
    return NETWORK_ERROR_MESSAGE
  }

  return FALLBACK_SYNC_ERROR_MESSAGE
}
