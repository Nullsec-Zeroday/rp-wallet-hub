const TOKEN_VERSION = 1;

export interface ReferralTokenPayload {
  clickId: string;
  expiresAt: string;
}

export async function createReferralToken(payload: ReferralTokenPayload, secret: string) {
  assertSecret(secret);
  const encodedPayload = encodeBase64Url(
    new TextEncoder().encode(JSON.stringify({
      v: TOKEN_VERSION,
      clickId: payload.clickId,
      expiresAt: payload.expiresAt,
    })),
  );
  const signature = await sign(encodedPayload, secret);
  return `${encodedPayload}.${encodeBase64Url(signature)}`;
}

export async function verifyReferralToken(token: string, secret: string): Promise<ReferralTokenPayload | null> {
  if (!secret || token.length > 1024) return null;
  const [encodedPayload, encodedSignature, extra] = token.split(".");
  if (!encodedPayload || !encodedSignature || extra) return null;

  try {
    const expected = await sign(encodedPayload, secret);
    const actual = decodeBase64Url(encodedSignature);
    if (encodeBase64Url(actual) !== encodedSignature) return null;
    if (!constantTimeEqual(actual, expected)) return null;

    const parsed = JSON.parse(new TextDecoder().decode(decodeBase64Url(encodedPayload))) as {
      v?: number;
      clickId?: string;
      expiresAt?: string;
    };
    if (parsed.v !== TOKEN_VERSION || !isClickId(parsed.clickId) || !isValidFutureDate(parsed.expiresAt)) return null;
    return { clickId: parsed.clickId, expiresAt: parsed.expiresAt };
  } catch {
    return null;
  }
}

function assertSecret(secret: string) {
  if (!secret) throw new Error("Referral signing secret is not configured");
}

async function sign(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)));
}

function isClickId(value: unknown): value is string {
  return typeof value === "string" && /^afc_[a-f0-9]{18}$/.test(value);
}

function isValidFutureDate(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && timestamp > Date.now();
}

function constantTimeEqual(left: Uint8Array, right: Uint8Array) {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) mismatch |= left[index] ^ right[index];
  return mismatch === 0;
}

function encodeBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64Url(value: string) {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error("Invalid base64url value");
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}
