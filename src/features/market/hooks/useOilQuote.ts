'use client'

import { useMarketQuote } from '@/features/market/hooks/useMarketQuote'
import type { IOilQuote } from '@/types/market'

// โหลดราคาน้ำมันทุกปั๊มล่าสุดจาก route handler
export function useOilQuote() {
  return useMarketQuote<IOilQuote>('/api/market/oil')
}
