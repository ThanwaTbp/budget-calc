'use client'

import { useMarketQuote } from '@/features/market/hooks/useMarketQuote'
import type { ICurrencyQuote } from '@/types/market'

// โหลดอัตราแลกเปลี่ยนอ้างอิงกับ THB ล่าสุดจาก route handler
export function useCurrencyQuote() {
  return useMarketQuote<ICurrencyQuote>('/api/market/currency')
}
