import { cn } from '@/lib/utils'
import { formatCurrency } from '@/utils/format'

interface IMoneyText {
  amount: number
  variant?: 'default' | 'income' | 'expense' | 'auto'
  showSign?: boolean
  className?: string
}

export function MoneyText({ amount, variant = 'default', showSign = false, className }: IMoneyText) {
  // โหมด auto ให้เลือกสีตามเครื่องหมายของจำนวนเงินเอง (บวก = income, ลบ = expense)
  const resolvedVariant = variant === 'auto' ? (amount < 0 ? 'expense' : 'income') : variant

  const sign = showSign ? (amount < 0 ? '-' : '+') : ''
  const formattedAmount = formatCurrency(Math.abs(amount))

  return (
    <span
      className={cn(
        'tabular',
        resolvedVariant === 'income' && 'text-income',
        resolvedVariant === 'expense' && 'text-expense',
        className,
      )}
    >
      {sign}
      {formattedAmount}
    </span>
  )
}
