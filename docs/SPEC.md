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
