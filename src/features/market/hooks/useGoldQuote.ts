'use client'

import { useMarketQuote } from '@/features/market/hooks/useMarketQuote'
import type { IGoldQuote } from '@/types/market'

// โหลดราคาทองคำรูปพรรณ/ทองแท่งล่าสุดจาก route handler
export function useGoldQuote() {
  return useMarketQuote<IGoldQuote>('/api/market/gold')
}
