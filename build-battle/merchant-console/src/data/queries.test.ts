import { describe, expect, it } from "vitest"
import { sortPayments } from "./queries"
import { Payment } from "./types"

/**
 * Sorting is what decides the order of rows in the table and in an export, so
 * a wrong comparison is a file ops hands to a merchant in a misleading order.
 *
 * `filterPayments` reads the shared store; these cases build their own rows so
 * they pin the comparison itself rather than whatever the seed happens to hold.
 */

const payment = (amount: number, createdAt: string): Payment => ({
  id: `pay_${amount}`,
  merchantId: "mch_01",
  amount,
  currency: "USD",
  status: "captured",
  method: "card",
  cardBrand: "visa",
  last4: "4242",
  createdAt,
  description: "Order",
})

const amounts = (rows: Payment[]) => rows.map((row) => row.amount)

describe("sortPayments by amount", () => {
  // 994 minor units is $9.94 and 1000 is $10.00. Compared as text, "1000"
  // sorts before "994" — the cheaper payment lands second.
  const rows = [payment(1000, "2026-03-01T00:00:00.000Z"), payment(994, "2026-03-02T00:00:00.000Z")]

  it("orders by value ascending, not by the digits as text", () => {
    expect(amounts(sortPayments(rows, "amount", "asc"))).toEqual([994, 1000])
  })

  it("orders by value descending", () => {
    expect(amounts(sortPayments(rows, "amount", "desc"))).toEqual([1000, 994])
  })

  it("keeps a run of differing magnitudes in numeric order", () => {
    const mixed = [9999, 994, 100004, 25000, 1000].map((amount) =>
      payment(amount, "2026-03-01T00:00:00.000Z"),
    )
    expect(amounts(sortPayments(mixed, "amount", "asc"))).toEqual([
      994, 1000, 9999, 25000, 100004,
    ])
  })

  it("does not mutate the array it was given", () => {
    const original = [...rows]
    sortPayments(rows, "amount", "asc")
    expect(rows).toEqual(original)
  })
})

describe("sortPayments by createdAt", () => {
  const rows = [
    payment(100, "2026-03-14T10:15:00.000Z"),
    payment(200, "2026-01-02T23:59:00.000Z"),
  ]

  it("defaults to newest first", () => {
    expect(amounts(sortPayments(rows))).toEqual([100, 200])
  })

  it("orders oldest first when asked", () => {
    expect(amounts(sortPayments(rows, "createdAt", "asc"))).toEqual([200, 100])
  })
})
