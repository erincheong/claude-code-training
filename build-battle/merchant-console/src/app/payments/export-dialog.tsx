"use client"

import { Button } from "@/components/Button"
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/Drawer"
import { DEFAULT_COLUMNS, EXPORT_COLUMNS, ExportColumn } from "@/lib/csv"
import { Download } from "lucide-react"
import { useState } from "react"

const LABELS: Record<ExportColumn, string> = {
  id: "Payment ID",
  created_at: "Created at (UTC)",
  merchant: "Merchant",
  description: "Description",
  status: "Status",
  method: "Method",
  card_brand: "Card brand",
  last4: "Card last four",
  amount: "Amount",
  currency: "Currency",
}

/**
 * Export options for the payments table (NWP-101).
 *
 * The counts are passed in rather than fetched: the page already has them from
 * the query builder. Disabling Download on an empty selection is a courtesy —
 * the route is what actually refuses it.
 */
export function ExportDialog({
  query,
  filteredCount,
  totalCount,
}: {
  query: string
  filteredCount: number
  totalCount: number
}) {
  const [selected, setSelected] = useState<ExportColumn[]>([...DEFAULT_COLUMNS])
  const [scope, setScope] = useState<"filtered" | "all">("filtered")

  const toggle = (column: ExportColumn) =>
    setSelected((current) =>
      current.includes(column)
        ? current.filter((c) => c !== column)
        : // Keep the canonical order so the file reads the same way every time.
          EXPORT_COLUMNS.filter((c) => c === column || current.includes(c)),
    )

  const params = new URLSearchParams(scope === "all" ? "" : query)
  params.set("columns", selected.join(","))
  params.set("scope", scope)
  const href = `/api/payments/export?${params.toString()}`

  const rowCount = scope === "all" ? totalCount : filteredCount
  const nothingSelected = selected.length === 0

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="secondary" className="w-full gap-2 py-1.5 sm:w-fit">
          <Download
            className="-ml-0.5 size-4 shrink-0 text-gray-400 dark:text-gray-600"
            aria-hidden="true"
          />
          Export
        </Button>
      </DrawerTrigger>

      <DrawerContent className="sm:max-w-md">
        <DrawerHeader>
          <DrawerTitle>Export payments</DrawerTitle>
          <DrawerDescription>
            Choose what goes in the file before you download it.
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody className="space-y-6">
          <fieldset>
            <legend className="text-sm font-medium text-gray-900 dark:text-gray-50">
              Rows
            </legend>
            <div className="mt-2 space-y-2">
              <label
                htmlFor="scope-filtered"
                className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
              >
                <input
                  type="radio"
                  id="scope-filtered"
                  name="scope"
                  className="size-4"
                  checked={scope === "filtered"}
                  onChange={() => setScope("filtered")}
                />
                Current filter ({filteredCount.toLocaleString()} payments)
              </label>
              <label
                htmlFor="scope-all"
                className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
              >
                <input
                  type="radio"
                  id="scope-all"
                  name="scope"
                  className="size-4"
                  checked={scope === "all"}
                  onChange={() => setScope("all")}
                />
                All payments ({totalCount.toLocaleString()} payments)
              </label>
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-medium text-gray-900 dark:text-gray-50">
              Columns
            </legend>
            <div className="mt-2 space-y-2">
              {EXPORT_COLUMNS.map((column) => (
                <label
                  key={column}
                  htmlFor={`column-${column}`}
                  className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                >
                  <input
                    type="checkbox"
                    id={`column-${column}`}
                    className="size-4"
                    checked={selected.includes(column)}
                    onChange={() => toggle(column)}
                  />
                  {LABELS[column]}
                </label>
              ))}
            </div>
            {nothingSelected && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-500">
                Select at least one column to export.
              </p>
            )}
          </fieldset>
        </DrawerBody>

        <DrawerFooter>
          {nothingSelected ? (
            <Button disabled className="gap-2">
              Download
            </Button>
          ) : (
            <Button asChild className="gap-2">
              <a href={href} download>
                <Download className="-ml-0.5 size-4 shrink-0" aria-hidden="true" />
                Download {rowCount.toLocaleString()} payments
              </a>
            </Button>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
