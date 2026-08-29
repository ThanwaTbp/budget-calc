'use client'

import { useMarketQuote } from '@/features/market/hooks/useMarketQuote'
import type { IStockQuoteList } from '@/types/market'

export function useStockQuote() {
  return useMarketQuote<IStockQuoteList>('/api/market/stocks')
}
