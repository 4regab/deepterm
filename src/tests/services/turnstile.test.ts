import { afterEach, describe, expect, it, mock } from "bun:test";
import { NextRequest } from "next/server";
import { verifyTurnstileToken } from "@/services/turnstile";

const enabledConfig = {
  secret: "test-secret",
  hostnames: ["localhost", "deepterm.app"],
};

function requestWithIp(ip = "203.0.113.10") {
  return new NextRequest("http://localhost:3000/api/generate-cards", {
    method: "POST",
    headers: { "cf-connecting-ip": ip },
  });
}

describe("verifyTurnstileToken", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("skips verification when secret is not configured", async () => {
    const result = await verifyTurnstileToken(null, requestWithIp(), { secret: undefined });
    expect(result).toEqual({ ok: true });
  });

  it("rejects missing tokens when secret is configured", async () => {
    const result = await verifyTurnstileToken(null, requestWithIp(), enabledConfig);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(403);
      expect(result.error).toBe("Captcha verification required");
    }
  });

  it("rejects oversized tokens", async () => {
    const result = await verifyTurnstileToken("x".repeat(2049), requestWithIp(), enabledConfig);
    expect(result.ok).toBe(false);
  });

  it("accepts a successful siteverify response", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(JSON.stringify({ success: true, hostname: "localhost" }), { status: 200 }),
      ),
    ) as unknown as typeof fetch;

    const result = await verifyTurnstileToken("valid-token", requestWithIp(), enabledConfig);
    expect(result).toEqual({ ok: true });
  });

  it("rejects a failed siteverify response", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(JSON.stringify({ success: false, "error-codes": ["invalid-input-response"] }), {
          status: 200,
        }),
      ),
    ) as unknown as typeof fetch;

    const result = await verifyTurnstileToken("bad-token", requestWithIp(), enabledConfig);
    expect(result.ok).toBe(false);
  });

  it("rejects tokens issued for an unexpected hostname", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(JSON.stringify({ success: true, hostname: "evil.example" }), { status: 200 }),
      ),
    ) as unknown as typeof fetch;

    const result = await verifyTurnstileToken("valid-token", requestWithIp(), enabledConfig);
    expect(result.ok).toBe(false);
  });
});
