import { describe, expect, it } from "vitest"
import { Payment } from "@/data/types"
import {
  DEFAULT_COLUMNS,
  EXPORT_COLUMNS,
  exportFilename,
  parseColumns,
  toCsv,
} from "./csv"

/**
 * The export is the file ops hands to a merchant, so a broken cell is a
 * support ticket rather than a stack trace. These tests pin the escaping and
 * the column contract; NWP-101 changes which columns ship, not how a cell is
 * written, and these should still pass afterwards.
 */

const payment: Payment = {
  id: "pay_0001",
  merchantId: "mch_01",
  amount: 25000,
  currency: "USD",
  status: "captured",
  method: "card",
  cardBrand: "visa",
  last4: "4242",
  createdAt: "2026-03-14T10:15:00.000Z",
  description: "Order 1180",
}

describe("toCsv", () => {
  it("writes a header row followed by one row per payment", () => {
    const lines = toCsv([payment]).split("\n")
    expect(lines).toHaveLength(2)
    expect(lines[0]).toBe(EXPORT_COLUMNS.join(","))
  })

  it("writes only the requested columns, in the order given", () => {
    expect(toCsv([payment], ["id", "amount"])).toBe(
      ["id,amount", "pay_0001,$250.00"].join("\n"),
    )
  })

  it("quotes cells containing a comma, so amounts do not split", () => {
    const large = { ...payment, amount: 123456789 }
    expect(toCsv([large], ["amount"])).toBe(['amount', '"$1,234,567.89"'].join("\n"))
  })

  it("doubles embedded quotes rather than dropping them", () => {
    const quoted = { ...payment, description: 'Order "rush"' }
    expect(toCsv([quoted], ["description"])).toBe(
      ["description", '"Order ""rush"""'].join("\n"),
    )
  })

  it("keeps a newline inside a description in one quoted cell", () => {
    const multiline = { ...payment, description: "Order 1180\nsecond line" }
    const body = toCsv([multiline], ["description"]).split("\n").slice(1).join("\n")
    expect(body).toBe('"Order 1180\nsecond line"')
  })

  it("resolves the merchant name, and falls back to the id when unknown", () => {
    expect(toCsv([payment], ["merchant"])).toContain("Lumen Coffee Roasters")
    const orphan = { ...payment, merchantId: "mch_missing" }
    expect(toCsv([orphan], ["merchant"])).toContain("mch_missing")
  })

  it("writes an empty cell for a payment with no card", () => {
    const bank: Payment = {
      ...payment,
      method: "bank_transfer",
      cardBrand: null,
      last4: null,
    }
    expect(toCsv([bank], ["card_brand", "last4"])).toBe(
      ["card_brand,last4", ","].join("\n"),
    )
  })

  it("emits a header even with no rows", () => {
    expect(toCsv([], ["id"])).toBe("id")
  })
})

/**
 * NWP-101: ops chooses the columns, so the selection is client input and
 * `parseColumns` is the allowlist standing between it and a header row.
 */
describe("parseColumns", () => {
  it("keeps a subset in the order asked for, not the canonical order", () => {
    expect(parseColumns("amount,id")).toEqual(["amount", "id"])
    expect(parseColumns("id,amount")).toEqual(["id", "amount"])
  })

  it("drops names that are not columns, and collapses duplicates", () => {
    expect(parseColumns("id,merchant_secret,id,amount")).toEqual([
      "id",
      "amount",
    ])
  })

  it("returns nothing for an empty selection, so the route can refuse it", () => {
    // A headerless file is worse than an error: ops would not notice.
    expect(parseColumns("")).toEqual([])
    expect(parseColumns("nope")).toEqual([])
    expect(parseColumns(null)).toEqual([])
  })
})

describe("DEFAULT_COLUMNS", () => {
  it("leaves out the card last four, which merchants must never receive", () => {
    expect(EXPORT_COLUMNS).toContain("last4")
    expect(DEFAULT_COLUMNS).not.toContain("last4")
  })

  it("keeps every other column, in the canonical order", () => {
    expect(DEFAULT_COLUMNS).toEqual(
      EXPORT_COLUMNS.filter((column) => column !== "last4"),
    )
  })

  it("writes no last four into a default export", () => {
    const csv = toCsv([payment], DEFAULT_COLUMNS)
    expect(csv).not.toContain("last4")
    expect(csv).not.toContain("4242")
  })
})

describe("exportFilename", () => {
  it("names the scope and stamps the UTC date", () => {
    expect(
      exportFilename("disputed", new Date("2026-08-13T23:00:00.000Z")),
    ).toBe("payments-disputed-2026-08-13.csv")
    expect(exportFilename("all", new Date("2026-03-14T23:00:00.000Z"))).toBe(
      "payments-all-2026-03-14.csv",
    )
  })
})
