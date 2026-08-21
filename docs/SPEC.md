# Budget Calculate — สเปกกลาง v2 (ทุก agent ต้องอ่านและยึดตามนี้)

## Stack
Next.js 16 (App Router, `src/`) · React 19 · TypeScript · Tailwind v4 · shadcn/ui (radix-nova) · zustand + persist · zod · react-hook-form · recharts · lucide-react · sonner · next-themes

## Convention (บังคับ)
- **ห้ามใส่ semicolon** `;` ท้ายบรรทัด · ใช้ **single quote** `'` · **ห้ามใช้ `any`**
- interface ขึ้นต้นด้วย `I` · component PascalCase **2 พยางค์ขึ้นไป**
- handler ใช้ prefix `on` + กริยา: `onSubmit`, `onCreate`, `onEdit`, `onDelete`, `onCancel`, `onConfirm`
- ตัวแปรตั้งชื่อเต็ม สื่อความหมาย (ย่อที่ยอมรับ: `res`, `req`, `idx`, `err`, `ctx`)
- loop ใช้เอกพจน์ของ collection · **ห้าม inline style** ใช้ Tailwind เท่านั้น
- comment เป็น **ภาษาไทย** เฉพาะ business logic
- Server Component เป็น default · ไฟล์ใน `src/app/` ต้องบาง (metadata + เรียก component)

## Data model (`src/types/finance.ts`) — เสร็จแล้ว ห้ามแก้
```ts
type TransactionType = 'income' | 'expense'
type TransactionSource = 'manual' | 'payroll'
type PayItemKind = 'earning' | 'deduction'

interface ICategory { id, name, type, icon, chartToken }
interface ITransaction { id, type, amount, categoryId, note, date, createdAt, source, sourceRefId }
interface IEmployee { id, name, note, isActive, createdAt }        // พนักงานเก็บแค่ชื่อ
interface IPayItem { id, label, amount, kind }
interface IPayrollEntry { id, employeeId, date, items: IPayItem[], note, createdAt }
interface IPayrollResult { entryId, employeeId, totalEarning, totalDeduction, netPay }
interface IFinanceSummary { totalIncome, totalExpense, balance, payrollCost }
```

## แนวคิดฟีเจอร์ค่าจ้าง (เปลี่ยนใหม่ทั้งหมด)
1. **เพิ่มพนักงาน** — กรอกแค่ **ชื่อ** (มี `note` เป็นช่องเสริม ไม่บังคับ)
2. **เลือกพนักงาน** → สร้าง **รอบจ่าย (`IPayrollEntry`)** ใส่รายการเงินได้อิสระหลายบรรทัด
   เช่น `ค่าแรง 500` (earning) · `ค่ารถ 500` (earning) · `หักเบิกล่วงหน้า 200` (deduction)
3. **คำนวณรวมแยกรายคน** — `netPay = รวม earning − รวม deduction`
4. **บันทึกเข้ารายจ่ายอัตโนมัติ** — ทุกรอบจ่ายจะสร้าง `ITransaction` ประเภท expense
   หมวด `PAYROLL_CATEGORY_ID` (`'staff-wage'`) `source: 'payroll'` `sourceRefId: <entry.id>`
   ผูกกัน **1:1** แก้รอบจ่าย = อัปเดตรายการเดิม ไม่สร้างใหม่

## Utils ที่มีให้แล้ว (ห้ามเขียนซ้ำ)
- `@/utils/calc` — `calcPayrollEntry(entry)`, `calcTotalPayrollCost(entries)`, `calcFinanceSummary(transactions, entries)`, `groupByMonth`, `groupByCategory`
- `@/utils/format` — `formatCurrency`, `formatCompactCurrency`, `formatNumber`, `formatDate`, `formatMonthLabel`, `toYearMonth`
- `@/utils/period` — `PERIOD_OPTIONS`, `PeriodGranularity` (`'day' | 'week' | 'month' | 'year'`), `getPeriodKey`, `getPeriodLabel`, `groupByPeriod(items, granularity, getDate)` (คืนกลุ่มเรียงใหม่→เก่า)
- `@/utils/id` — `createId()`
- `@/constants/categories` — `DEFAULT_CATEGORIES`, `PAYROLL_CATEGORY_ID`
- `@/constants/payroll` — `PAY_ITEM_PRESETS`, `PAY_ITEM_KIND_LABEL`
- `@/hooks/useHydrated` — `useHydrated()`

## Store contract

### `@/features/transactions/store/useTransactionStore` — เสร็จแล้ว ห้ามแก้
```ts
transactions, categories
onCreate(input: ITransactionInput)          // source = 'manual'
onUpdate(id, input: ITransactionInput)
onDelete(id)
onReset()
onSyncPayrollExpense({ payrollEntryId, amount, date, note })  // สร้างหรืออัปเดตรายจ่ายที่ผูกกับรอบจ่าย
onRemovePayrollExpense(payrollEntryId)
```

### `@/features/payroll/store/usePayrollStore` — agent payroll เป็นคนสร้าง
```ts
export interface IEmployeeInput { name: string; note: string; isActive: boolean }
export interface IPayItemInput { label: string; amount: number; kind: PayItemKind }
export interface IPayrollEntryInput { employeeId: string; date: string; note: string; items: IPayItemInput[] }

interface IPayrollStore {
  employees: IEmployee[]
  entries: IPayrollEntry[]
  onCreateEmployee: (input: IEmployeeInput) => void
  onUpdateEmployee: (id: string, input: IEmployeeInput) => void
  onDeleteEmployee: (id: string) => void          // ลบรอบจ่ายของคนนั้น + รายจ่ายที่ผูกไว้ทั้งหมดด้วย
  onToggleEmployeeActive: (id: string) => void
  onCreateEntry: (input: IPayrollEntryInput) => void
  onUpdateEntry: (id: string, input: IPayrollEntryInput) => void
  onDeleteEntry: (id: string) => void
  onReset: () => void
}
```
persist key `budget-calc:payroll` **version 2** พร้อม `migrate` ที่ **ทิ้งข้อมูลเวอร์ชันเก่า** (โครงสร้างเปลี่ยนทั้งหมด) คืน `{ employees: [], entries: [] }`

## กฎ UX ใหม่ (บังคับทุกหน้า)

### 1. ยืนยันก่อนทำ (แบบ SweetAlert)
ใช้ `useConfirm()` จาก `@/components/common/ConfirmProvider`
```ts
const confirm = useConfirm()
const onDelete = async () => {
  const isConfirmed = await confirm({
    title: 'ลบรายการนี้?',
    description: 'รายการจะถูกลบถาวรและกู้คืนไม่ได้',
    confirmLabel: 'ลบเลย',
    tone: 'danger',
  })
  if (!isConfirmed) return
  // ...ทำจริง แล้ว toast
}
```
`tone`: `'default'` (ยืนยันทั่วไป) · `'danger'` (ลบ) · `'warning'` (ทิ้งข้อมูลที่กรอก)
**ต้องมีขั้นยืนยันสำหรับ:** ลบทุกชนิด · บันทึกรอบจ่าย (เพราะไปสร้างรายจ่ายอัตโนมัติ) · ปิดฟอร์มทิ้งทั้งที่แก้ไขค้างไว้ (เช็ค `formState.isDirty`) · สลับสถานะพนักงาน
งานเพิ่ม/แก้ไขธรรมดาที่ไม่มีผลข้างเคียง **ไม่ต้อง** ยืนยัน แค่ toast พอ

### 2. Toast ทุกผลลัพธ์
`import { toast } from 'sonner'` — ตั้ง duration ไว้ที่ layout แล้ว (2.5 วิ) **ห้ามส่ง duration ซ้ำ**
- สำเร็จ → `toast.success('บันทึกรายการเรียบร้อย')`
- ยกเลิก → `toast.info('ยกเลิกแล้ว')`
- ล้มเหลว/ทำไม่ได้ → `toast.error('...')`
ข้อความไทย สั้น ชัด

### 3. โครง Dialog ใหม่ (บังคับ — แก้ปัญหากล่องดูไม่ติดกัน)
`DialogContent` เป็น `flex flex-col` ไม่มี padding แล้ว ต้องแบ่งเป็น 3 ส่วนเสมอ:
```tsx
<DialogContent className="sm:max-w-lg">
  <DialogHeader>
    <DialogTitle>...</DialogTitle>
    <DialogDescription>...</DialogDescription>
  </DialogHeader>
  <DialogBody className="flex flex-col gap-4">   {/* import DialogBody จาก ui/dialog */}
    ...ฟิลด์ทั้งหมด...
  </DialogBody>
  <DialogFooter>
    <Button variant="outline" onClick={onCancel}>ยกเลิก</Button>
    <Button type="submit">บันทึก</Button>
  </DialogFooter>
</DialogContent>
```
ถ้าใช้ `<form>` ให้ครอบ `DialogBody` + `DialogFooter` ไว้ด้วยกันแล้วให้ form เป็น `flex min-h-0 flex-1 flex-col`
**ห้ามใส่ padding/margin ติดลบเองในสามส่วนนี้** และห้ามใส่ `p-*` ทับ `DialogContent`

## Design tokens
ใช้ผ่าน Tailwind class: `bg-background` `bg-card` `text-foreground` `text-muted-foreground` `border-border` `bg-primary` `text-primary` `bg-accent` `text-accent-foreground` `bg-sidebar`
semantic การเงิน: `text-income`/`bg-income`/`bg-income-muted` · `text-expense`/`bg-expense`/`bg-expense-muted` · `text-warning`/`bg-warning`/`bg-warning-muted`
กราฟ: `var(--color-chart-1)` ถึง `var(--color-chart-5)`
**ห้าม hardcode hex/rgb เด็ดขาด** — แอปมี 4 ชุดสีให้ผู้ใช้สลับ + light/dark ต้องเปลี่ยนตามทั้งหมด
ตัวเลขเงินใส่ class `tabular` เสมอ

## แนวทาง UI — SaaS Minimal Modern
การ์ด `bg-card border border-border shadow-sm rounded-xl` · เว้นวรรค `gap-4`/`gap-6` · หัวข้อ `font-semibold tracking-tight` · ตัวรอง `text-sm text-muted-foreground`
**ทุกหน้าและทุกตารางต้องมี Empty State** (`@/components/common/EmptyState`)
mobile ใช้ card list แทนตาราง ไม่ใช้ตารางเลื่อนแนวนอน
รองรับ Light + Dark ครบ

## ภาษา
UI ภาษาไทยทั้งหมด สกุลเงินบาท `฿` locale `th-TH` ปี พ.ศ.

---

# ระบบบัญชีผู้ใช้ (Appwrite) — เพิ่มใน v3

## หลักการ
แอปเป็น **client-side ล้วน ไม่มี backend ของเราเอง** ใช้ **Appwrite Cloud** ผ่าน JS SDK ฝั่ง browser
ทุกอย่างเรียกจาก Client Component เท่านั้น (Appwrite เก็บ session ไว้ใน cookie ของโดเมน Appwrite เอง)

## คอนฟิกที่มีให้แล้ว — `@/lib/appwrite`
```ts
import { appwriteAccount, isAppwriteConfigured } from '@/lib/appwrite'
```
- `appwriteAccount` — instance ของ `Account` พร้อมใช้
- `isAppwriteConfigured` — `false` เมื่อยังไม่ได้ตั้ง `NEXT_PUBLIC_APPWRITE_PROJECT_ID`
  → หน้า auth ต้อง **ไม่พัง** แต่แสดงคำแนะนำวิธีตั้งค่าแทน (ดู `.env.example`)

## Appwrite SDK v26 — ใช้ **object params** (ห้ามส่งเป็น positional arguments)
```ts
appwriteAccount.create({ userId, email, password, name })              // สมัคร
appwriteAccount.createEmailPasswordSession({ email, password })        // ล็อกอิน
appwriteAccount.get()                                                  // ผู้ใช้ปัจจุบัน (throw ถ้าไม่มี session)
appwriteAccount.deleteSession({ sessionId: 'current' })                // ออกจากระบบ
appwriteAccount.createRecovery({ email, url })                         // ขอลิงก์รีเซ็ตรหัส (Appwrite ส่งอีเมลให้)
appwriteAccount.updateRecovery({ userId, secret, password })           // ตั้งรหัสใหม่จากลิงก์
appwriteAccount.createEmailVerification({ url })                       // ส่งอีเมลยืนยัน
appwriteAccount.updateEmailVerification({ userId, secret })            // ยืนยันอีเมลจากลิงก์
appwriteAccount.updatePassword({ password, oldPassword })              // เปลี่ยนรหัสตอนล็อกอินอยู่
```
`userId` ตอนสมัครใช้ `ID.unique()` จาก `appwrite`
ลิงก์ recovery จะพากลับมาที่ `url` พร้อม query `?userId=...&secret=...`

## การแยกข้อมูลตามบัญชี — `@/lib/userScopedStorage` (มีให้แล้ว)
`useTransactionStore` และ `usePayrollStore` ถูกผูกกับ storage ที่เติม scope ต่อท้าย key แล้ว
key จริงใน localStorage คือ `budget-calc:transactions:<userId>` / `budget-calc:payroll:<userId>`
```ts
setActiveStorageScope(userId: string | null)   // null = โหมด guest
getActiveStorageScope(): string
migrateGuestDataToUser(storeNames: string[], userId: string): boolean
GUEST_STORAGE_SCOPE
```
**ลำดับที่ถูกต้องเวลาสลับบัญชี (สำคัญมาก)**
```ts
setActiveStorageScope(userId)          // 1. เปลี่ยน scope ก่อน
useTransactionStore.getState().onReset()   // 2. ล้าง state ในหน่วยความจำ ไม่งั้นข้อมูลคนเก่าจะค้าง
usePayrollStore.getState().onReset()
await useTransactionStore.persist.rehydrate()  // 3. อ่านข้อมูลของบัญชีใหม่เข้ามา
await usePayrollStore.persist.rehydrate()
```
ข้ามขั้นที่ 2 ไม่ได้ เพราะถ้าบัญชีใหม่ยังไม่มีข้อมูล `rehydrate()` จะไม่เขียนทับ ทำให้เห็นข้อมูลของบัญชีก่อนหน้า

## เส้นทาง
| route | หน้าที่ |
|---|---|
| `/login` | เข้าสู่ระบบ |
| `/register` | สมัครสมาชิก |
| `/forgot-password` | กรอกอีเมลเพื่อขอลิงก์รีเซ็ตรหัส |
| `/reset-password` | ตั้งรหัสใหม่ (รับ `userId` + `secret` จาก query) |
| `/` `/transactions` `/payroll` | ต้องล็อกอินก่อน ถ้ายังไม่ล็อกอินให้เด้งไป `/login` |

## ข้อความ error ต้องเป็นภาษาไทย
แปลง error code ของ Appwrite เป็นข้อความไทยที่เข้าใจง่าย เช่น
`user_already_exists` → 'อีเมลนี้ถูกใช้สมัครไปแล้ว' · `user_invalid_credentials` → 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
`password_recently_used` / `general_argument_invalid` ฯลฯ — ที่แปลไม่ได้ให้ fallback เป็นข้อความกลางๆ **ห้ามโชว์ error ดิบภาษาอังกฤษให้ผู้ใช้**

---

# Sync ข้อมูลขึ้น Appwrite Databases — เพิ่มใน v4

## หลักการ
- **Appwrite เป็นแหล่งข้อมูลจริง (source of truth)** · localStorage เหลือบทบาทเป็น **cache** เพื่อให้หน้าจอวาดได้ทันทีและอ่านได้ตอนออฟไลน์
- zustand store ยังเป็น state ในหน่วยความจำเหมือนเดิม **UI ทั้งหมดไม่ต้องแก้** ยังเรียก `onCreate/onUpdate/onDelete` แบบ sync ได้ตามปกติ
- ทุก mutation ทำแบบ **optimistic**: อัปเดต store ทันที แล้วค่อยยิงขึ้น Appwrite เบื้องหลัง
- ล้มเหลว → **ห้าม rollback state** (ผู้ใช้เพิ่งกรอกไป การลบทิ้งต่อหน้าคือ UX ที่แย่กว่า) ให้ **เก็บงานไว้ในคิวแล้วลองใหม่** พร้อมตั้งสถานะเป็น `error`/`offline` และแจ้งผู้ใช้ — ข้อมูลยังอยู่ครบใน localStorage cache จึงไม่มีอะไรหาย

## Schema (databaseId = `budget-calc`)
ทุก collection เปิด **Document Security** และให้สิทธิ์ระดับเอกสารเป็นของเจ้าของเท่านั้น
- collection permission: `Permission.create(Role.users())` เท่านั้น
- document permission ตอนสร้าง: `read` / `update` / `delete` ของ `Role.user(userId)`

`$id` ของเอกสาร = `id` ของ entity เรา (UUID จาก `createId()` ใช้เป็น `$id` ได้ เพราะยาว 36 ตัวและมีแต่ hex กับ `-`)
**ห้ามใช้ชื่อ field ว่า `createdAt`** เพราะชนกับ `$createdAt` ของ Appwrite → ใช้ `createdAtIso` แทน

| collection | attribute | ชนิด | required |
|---|---|---|---|
| `transactions` | `type` | string(16) | ✓ |
| | `amount` | float | ✓ |
| | `categoryId` | string(64) | ✓ |
| | `note` | string(256) | – |
| | `date` | string(10) | ✓ |
| | `source` | string(16) | ✓ |
| | `sourceRefId` | string(64) | – |
| | `createdAtIso` | string(32) | ✓ |
| `employees` | `name` | string(128) | ✓ |
| | `note` | string(256) | – |
| | `createdAtIso` | string(32) | ✓ |
| `payrollEntries` | `employeeId` | string(64) | ✓ |
| | `date` | string(10) | ✓ |
| | `note` | string(256) | – |
| | `itemsJson` | string(8192) | ✓ |
| | `createdAtIso` | string(32) | ✓ |

`itemsJson` = `JSON.stringify(IPayItem[])` (Appwrite ไม่มีชนิด object ซ้อน)
index: `transactions.date` (key), `payrollEntries.employeeId` (key), `payrollEntries.date` (key)

## สคริปต์ตั้งค่า — `bun run setup:appwrite`
ใช้ `node-appwrite` (devDependency) + `APPWRITE_API_KEY` (server key **ห้ามขึ้นต้นด้วย `NEXT_PUBLIC_`**)
สร้าง database + collections + attributes + indexes ให้อัตโนมัติ · **ต้องรันซ้ำได้โดยไม่พัง** (เจอของเดิมให้ข้าม ไม่ throw)

## Contract ของ data layer — `src/features/sync/services/remoteStore.ts`
```ts
export interface IRemoteSnapshot {
  transactions: ITransaction[]
  employees: IEmployee[]
  entries: IPayrollEntry[]
}

pullSnapshot(userId: string): Promise<IRemoteSnapshot>        // ดึงทั้งหมด (วนหน้าให้ครบ ไม่จำกัด 25 แถวแรก)
pushTransaction(userId, transaction): Promise<void>           // upsert
deleteTransaction(id): Promise<void>
pushEmployee(userId, employee): Promise<void>
deleteEmployee(id): Promise<void>
pushPayrollEntry(userId, entry): Promise<void>
deletePayrollEntry(id): Promise<void>
pushSnapshot(userId, snapshot): Promise<void>                 // อัปโหลดทั้งก้อน ใช้ตอนย้ายข้อมูลครั้งแรก
isRemoteReady(): boolean                                      // false เมื่อยังไม่ได้ตั้งค่า Appwrite
```
- `listDocuments` คืนสูงสุด 25 แถวถ้าไม่ส่ง `Query.limit()` → **ต้องวนดึงด้วย `Query.limit(100)` + `Query.cursorAfter()` จนครบ**
- ทุก write ใช้ `upsertDocument` เพื่อให้เขียนซ้ำได้โดยไม่ error
- error ทุกตัวต้องแปลงเป็นข้อความไทยก่อนส่งถึงผู้ใช้

## สถานะ sync — `src/features/sync/store/useSyncStore.ts`
```ts
type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline' | 'disabled'
```
`disabled` = ยังไม่ได้ตั้งค่า Appwrite หรือยังไม่ล็อกอิน → แอปทำงานแบบ local อย่างเดียวเหมือนเดิม
มีตัวบ่งชี้บน TopBar บอกสถานะ + เวลาที่ sync ล่าสุด + ปุ่มลองใหม่ตอน error
