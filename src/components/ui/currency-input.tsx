import * as React from "react"

import { Input } from "@/components/ui/input"

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value?: number
  onValueChange?: (value: number | undefined) => void
  locale?: string
  currency?: string
}

const formatterCache = new Map<string, Intl.NumberFormat>()

function getFormatter(locale: string, currency: string) {
  const key = `${locale}-${currency}`
  if (!formatterCache.has(key)) {
    formatterCache.set(
      key,
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    )
  }
  return formatterCache.get(key)!
}

function formatCurrency(value: number, locale: string, currency: string) {
  return getFormatter(locale, currency).format(value)
}

function parseCurrency(rawValue: string) {
  const digits = rawValue.replace(/\D/g, "")
  if (!digits) return undefined
  const numeric = Number.parseInt(digits, 10)
  if (Number.isNaN(numeric)) return undefined
  return numeric / 100
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onValueChange, locale = "pt-BR", currency = "BRL", onBlur, onFocus, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState<string>(() =>
      typeof value === "number" ? formatCurrency(value, locale, currency) : "",
    )

    React.useEffect(() => {
      if (typeof value === "number") {
        setDisplayValue(formatCurrency(value, locale, currency))
      } else if (value === undefined) {
        setDisplayValue("")
      }
    }, [currency, locale, value])

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const raw = event.target.value
      const parsed = parseCurrency(raw)

      if (typeof parsed === "number") {
        setDisplayValue(formatCurrency(parsed, locale, currency))
        onValueChange?.(parsed)
      } else if (raw.trim() === "") {
        setDisplayValue("")
        onValueChange?.(undefined)
      } else {
        setDisplayValue(raw)
      }
    }

    const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
      if (displayValue.trim() === "") {
        onValueChange?.(undefined)
        setDisplayValue("")
      }
      onBlur?.(event)
    }

    const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
      if (displayValue.trim() === "" || displayValue === formatCurrency(0, locale, currency)) {
        setDisplayValue("")
      }
      onFocus?.(event)
    }

    return (
      <Input
        ref={ref}
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        {...props}
      />
    )
  },
)

CurrencyInput.displayName = "CurrencyInput"

export { CurrencyInput }
