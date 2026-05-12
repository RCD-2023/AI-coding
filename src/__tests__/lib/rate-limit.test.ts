import { describe, it, expect } from "vitest"
import { getIp, checkRateLimit } from "@/lib/rate-limit"

describe("getIp", () => {
  it("extracts the first IP from x-forwarded-for", () => {
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    })
    expect(getIp(req)).toBe("1.2.3.4")
  })

  it("trims whitespace from the extracted IP", () => {
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": " 9.9.9.9 " },
    })
    expect(getIp(req)).toBe("9.9.9.9")
  })

  it("falls back to 127.0.0.1 when header is absent", () => {
    const req = new Request("http://localhost")
    expect(getIp(req)).toBe("127.0.0.1")
  })
})

describe("checkRateLimit", () => {
  it("returns success when limiter is null (fail-open)", async () => {
    const result = await checkRateLimit(null, "test-key")
    expect(result.success).toBe(true)
    expect(result.remaining).toBe(999)
    expect(result.reset).toBe(0)
  })
})
