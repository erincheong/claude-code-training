import { filterPayments, parseFilters, sortPayments } from "@/data/queries"
import {
  DEFAULT_COLUMNS,
  exportFilename,
  parseColumns,
  toCsv,
} from "@/lib/csv"
import { NextRequest, NextResponse } from "next/server"

/**
 * Exports the payments table as CSV (NWP-101).
 *
 * Ops picks the columns and the scope; both arrive from the client and both are
 * allowlisted here before they reach the query builder or the filename. Scope
 * `all` ignores the active filters, so it runs the same builder with no
 * criteria rather than reading the store directly.
 *
 * No pagination: the file is the whole matching set, not the page on screen.
 */
export function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams

  // Absent means "ops did not choose", which is the default set. Present but
  // empty of anything recognised is a bad request, not an empty file.
  const columnsParam = params.get("columns")
  const columns = columnsParam === null ? DEFAULT_COLUMNS : parseColumns(columnsParam)
  if (columns.length === 0) {
    return NextResponse.json(
      { message: "Select at least one column to export." },
      { status: 400 },
    )
  }

  const scope = params.get("scope") === "all" ? "all" : "filtered"
  const filters = parseFilters(params)

  const rows = sortPayments(
    filterPayments(scope === "all" ? { status: "all" } : filters),
    filters.sort,
    filters.direction,
  )

  const label =
    scope === "all"
      ? "all"
      : filters.status && filters.status !== "all"
        ? filters.status
        : "filtered"

  return new Response(toCsv(rows, columns), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${exportFilename(label)}"`,
    },
  })
}
