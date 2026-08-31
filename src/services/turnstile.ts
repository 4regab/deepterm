import type { NextRequest } from "next/server";

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const MAX_TOKEN_LENGTH = 2048;

type SiteverifyResult = {
  success: boolean;
  hostname?: string;
  "error-codes"?: string[];
};

export type TurnstileVerifyResult =
  | { ok: true }
  | { ok: false; status: 403; error: string };

function allowedHostnames(): string[] {
  return (process.env.TURNSTILE_HOSTNAMES ?? "")
    .split(",")
    .map((hostname) => hostname.trim())
    .filter(Boolean);
}

export type TurnstileConfig = {
  secret?: string;
  hostnames?: string[];
  /** When true, missing secret fails closed (production default). */
  failClosedWithoutSecret?: boolean;
};

function isProductionRuntime(): boolean {
  return (
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production"
  );
}

function readConfig(): TurnstileConfig {
  return {
    secret: process.env.TURNSTILE_SECRET,
    hostnames: allowedHostnames(),
    failClosedWithoutSecret: isProductionRuntime(),
  };
}

export async function verifyTurnstileToken(
  token: unknown,
  request: NextRequest,
  config: TurnstileConfig = readConfig(),
): Promise<TurnstileVerifyResult> {
  const secret = config.secret;
  if (!secret) {
    const failClosed =
      config.failClosedWithoutSecret ?? isProductionRuntime();
    if (failClosed) {
      console.error("TURNSTILE_SECRET is not configured; rejecting captcha check");
      return { ok: false, status: 403, error: "Captcha verification required" };
    }
    // Local/dev convenience only — captcha intentionally skipped when unset.
    return { ok: true };
  }

  if (typeof token !== "string" || token.length === 0 || token.length > MAX_TOKEN_LENGTH) {
    return { ok: false, status: 403, error: "Captcha verification required" };
  }

  const remoteip =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "";

  try {
    const response = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      signal: AbortSignal.timeout(10_000),
      body: new URLSearchParams({
        secret,
        response: token,
        remoteip,
      }),
    });

    if (!response.ok) {
      return { ok: false, status: 403, error: "Captcha verification failed" };
    }

    const result = (await response.json()) as SiteverifyResult;
    if (!result.success) {
      return { ok: false, status: 403, error: "Captcha verification failed" };
    }

    const hosts = config.hostnames ?? allowedHostnames();
    if (hosts.length > 0 && result.hostname && !hosts.includes(result.hostname)) {
      return { ok: false, status: 403, error: "Captcha verification failed" };
    }

    return { ok: true };
  } catch {
    return { ok: false, status: 403, error: "Captcha verification failed" };
  }
}
