import { merchantById } from "@/data/merchants"
import { Payment } from "@/data/types"
import { formatMoney } from "./money"

/**
 * CSV export for the payments table.
 *
 * Ops chooses the columns (NWP-101). `EXPORT_COLUMNS` is the allowlist and the
 * canonical order; `parseColumns` is the only way a client-supplied selection
 * gets in, so nothing unvalidated reaches a header row or a filename.
 */

export const EXPORT_COLUMNS = [
  "id",
  "created_at",
  "merchant",
  "description",
  "status",
  "method",
  "card_brand",
  "last4",
  "amount",
  "currency",
] as const

export type ExportColumn = (typeof EXPORT_COLUMNS)[number]

/**
 * What ops gets when they do not say otherwise: everything except the card
 * last four, which is the column that has to be stripped by hand before a file
 * can go to a merchant.
 */
export const DEFAULT_COLUMNS: readonly ExportColumn[] = EXPORT_COLUMNS.filter(
  (column) => column !== "last4",
)

/**
 * Turns a comma-separated `columns` param into an allowlisted selection.
 *
 * Unknown names are dropped rather than rejected one by one, duplicates are
 * collapsed, and the caller's order is kept — ops asking for `amount,id` gets
 * those two columns in that order. An empty result means "nothing valid was
 * asked for", which the route turns into a 400 rather than a headerless file.
 */
export function parseColumns(raw: string | null): ExportColumn[] {
  if (raw === null) return []

  const selected: ExportColumn[] = []
  for (const name of raw.split(",")) {
    const column = name.trim()
    if (!isExportColumn(column)) continue
    if (selected.includes(column)) continue
    selected.push(column)
  }
  return selected
}

function isExportColumn(value: string): value is ExportColumn {
  return (EXPORT_COLUMNS as readonly string[]).includes(value)
}

function escapeCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

function cell(payment: Payment, column: ExportColumn): string {
  switch (column) {
    case "id":
      return payment.id
    case "created_at":
      return payment.createdAt
    case "merchant":
      return merchantById(payment.merchantId)?.name ?? payment.merchantId
    case "description":
      return payment.description
    case "status":
      return payment.status
    case "method":
      return payment.method
    case "card_brand":
      return payment.cardBrand ?? ""
    case "last4":
      return payment.last4 ?? ""
    case "amount":
      return formatMoney(payment.amount, payment.currency)
    case "currency":
      return payment.currency
  }
}

export function toCsv(
  payments: Payment[],
  columns: readonly ExportColumn[] = EXPORT_COLUMNS,
): string {
  const header = columns.join(",")
  const rows = payments.map((payment) =>
    columns.map((column) => escapeCell(cell(payment, column))).join(","),
  )
  return [header, ...rows].join("\n")
}

/**
 * `payments-disputed-2026-08-13.csv`.
 *
 * The label says which rows are in the file — a status when the export is
 * scoped to one, `all` for the unfiltered set, `filtered` otherwise. The route
 * derives it from values it has already validated; raw client text never
 * reaches a filename. UTC, so two exports on the same day collide by design.
 */
export function exportFilename(label: string, date = new Date()): string {
  return `payments-${label}-${date.toISOString().slice(0, 10)}.csv`
}
