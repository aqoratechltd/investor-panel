import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type Currency = 'USD' | 'GBP' | 'EUR' | 'PKR'

export const CURRENCY_META: Record<Currency, { symbol: string; name: string; locale: string; flag: string }> = {
  USD: { symbol: '$', name: 'US Dollar', locale: 'en-US', flag: '🇺🇸' },
  GBP: { symbol: '£', name: 'British Pound', locale: 'en-GB', flag: '🇬🇧' },
  EUR: { symbol: '€', name: 'Euro', locale: 'de-DE', flag: '🇪🇺' },
  PKR: { symbol: '₨', name: 'Pakistani Rupee', locale: 'ur-PK', flag: '🇵🇰' },
}

// Exchange rates relative to USD (mock — update periodically in production)
export const EXCHANGE_RATES: Record<Currency, number> = {
  USD: 1,
  GBP: 0.792,
  EUR: 0.921,
  PKR: 278.5,
}

interface CurrencyState {
  currency: Currency
  setCurrency: (c: Currency) => void
  convert: (usdAmount: number) => number
  format: (usdAmount: number, compact?: boolean) => string
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set, get) => ({
      currency: 'USD',

      setCurrency: (currency) => set({ currency }),

      convert: (usdAmount) => {
        const rate = EXCHANGE_RATES[get().currency]
        return usdAmount * rate
      },

      format: (usdAmount, compact = false) => {
        const { currency, convert } = get()
        const meta = CURRENCY_META[currency]
        const converted = convert(usdAmount)

        if (compact) {
          if (Math.abs(converted) >= 1_000_000) {
            return `${meta.symbol}${(converted / 1_000_000).toFixed(1)}M`
          }
          if (Math.abs(converted) >= 1_000) {
            return `${meta.symbol}${(converted / 1_000).toFixed(1)}K`
          }
        }

        return new Intl.NumberFormat(meta.locale, {
          style: 'currency',
          currency,
          minimumFractionDigits: currency === 'PKR' ? 0 : 2,
          maximumFractionDigits: currency === 'PKR' ? 0 : 2,
        }).format(converted)
      },
    }),
    {
      name: 'investor-panel-currency',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ currency: state.currency }),
    },
  ),
)
