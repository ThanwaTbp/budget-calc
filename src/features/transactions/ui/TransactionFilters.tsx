'use client'

import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CategoryIcon } from '@/features/transactions/ui/CategoryIcon'
import type { ICategory, TransactionSource, TransactionType } from '@/types/finance'
import type { ITransactionListFilter } from '@/features/transactions/hooks/useTransactionList'

interface ITransactionFilters {
  filter: ITransactionListFilter
  categories: ICategory[]
  isFilterActive: boolean
  onFilterChange: (patch: Partial<ITransactionListFilter>) => void
  onResetFilter: () => void
}

export function TransactionFilters({
  filter,
  categories,
  isFilterActive,
  onFilterChange,
  onResetFilter,
}: ITransactionFilters) {
  const incomeCategories = categories.filter((category) => category.type === 'income')
  const expenseCategories = categories.filter((category) => category.type === 'expense')

  return (
    <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-center">
      <div className="relative flex-1 md:min-w-48">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filter.keyword}
          onChange={(event) => onFilterChange({ keyword: event.target.value })}
          placeholder="ค้นหาบันทึกหรือหมวดหมู่"
          className="pl-8"
        />
      </div>

      <Select
        value={filter.type}
        onValueChange={(value) => onFilterChange({ type: value as TransactionType | 'all' })}
      >
        <SelectTrigger className="w-full md:w-32">
          <SelectValue placeholder="ทุกประเภท" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="all">ทุกประเภท</SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectItem value="income">รายรับ</SelectItem>
            <SelectItem value="expense">รายจ่าย</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>

      <Select value={filter.categoryId} onValueChange={(value) => onFilterChange({ categoryId: value })}>
        <SelectTrigger className="w-full md:w-44">
          <SelectValue placeholder="ทุกหมวดหมู่" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="all">ทุกหมวดหมู่</SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>รายรับ</SelectLabel>
            {incomeCategories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                <CategoryIcon icon={category.icon} />
                {category.name}
              </SelectItem>
            ))}
          </SelectGroup>
          <SelectGroup>
            <SelectLabel>รายจ่าย</SelectLabel>
            {expenseCategories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                <CategoryIcon icon={category.icon} />
                {category.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <Select
        value={filter.source}
        onValueChange={(value) => onFilterChange({ source: value as TransactionSource | 'all' })}
      >
        <SelectTrigger className="w-full md:w-40">
          <SelectValue placeholder="ทุกที่มา" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="all">ทั้งหมด</SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectItem value="manual">บันทึกเอง</SelectItem>
            <SelectItem value="payroll">จากค่าจ้าง</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>

      {isFilterActive && (
        <Button variant="ghost" size="sm" onClick={onResetFilter} className="md:ml-auto">
          <X />
          ล้างตัวกรอง
        </Button>
      )}
    </div>
  )
}
