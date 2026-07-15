const PAYBLIS_CHECKOUT_BASE = "https://pay.payblis.com/api/payment_gateway.php";
const PAYBLIS_METHODS = "credit_cards,apple_pay,google_pay";

export const PAYBLIS_WEBHOOK_MAX_BYTES = 64 * 1024;

export interface BuildPayblisCheckoutUrlInput {
  merchantKey: string;
  sandbox: boolean;
  amount: string;
  currency: string;
  productName: string;
  storeName: string;
  refOrder: string;
  customerEmail: string;
  customerName: string;
  customerFirstName: string;
  country: string;
  userIP: string;
  lang: string;
  urlOK: string;
  urlKO: string;
  ipnURL: string;
}

export interface PayblisWebhookPayload {
  orderId: string;
  status: string;
  event?: string;
  paymentId?: string;
  amount?: unknown;
  currency?: string;
}

export type ParsePayblisWebhookResult =
  | { ok: true; webhook: PayblisWebhookPayload }
  | { ok: false; error: string };

export function buildPayblisCheckoutUrl(input: BuildPayblisCheckoutUrlInput) {
  // Field names and order mirror Payblis' current PHP checkout example. Payblis
  // decodes this as a standard-base64 PHP serialized string map.
  const params: Record<string, string> = {
    MerchantKey: input.merchantKey,
    sandbox: input.sandbox ? "true" : "false",
    amount: input.amount,
    currency: input.currency,
    product_name: input.productName,
    method: PAYBLIS_METHODS,
    RefOrder: input.refOrder,
    Customer_Email: input.customerEmail,
    Customer_Name: input.customerName,
    Customer_FirstName: input.customerFirstName,
    country: input.country,
    userIP: input.userIP,
    lang: input.lang,
    store_name: input.storeName,
    urlOK: input.urlOK,
    urlKO: input.urlKO,
    ipnURL: input.ipnURL,
  };
  const token = base64Standard(phpSerializeStringMap(params));
  return `${PAYBLIS_CHECKOUT_BASE}?token=${encodeURIComponent(token)}`;
}

export function parsePayblisWebhook(payload: Record<string, unknown>): ParsePayblisWebhookResult {
  const refOrder = normalizeString(payload.RefOrder);
  const merchantReference = normalizeString(payload.merchant_reference);
  if (refOrder && merchantReference && refOrder !== merchantReference) {
    return { ok: false, error: "Conflicting order reference" };
  }

  const orderId = merchantReference || refOrder;
  const status = normalizeString(payload.status)?.toUpperCase();
  const event = normalizeString(payload.event)?.toLowerCase();
  if (!orderId || !status) return { ok: false, error: "Missing payment fields" };
  if (orderId.length > 128 || status.length > 64 || (event && event.length > 128)) {
    return { ok: false, error: "Invalid payment fields" };
  }

  // Some legacy callbacks omit `event`, so it remains optional. When present it
  // must agree with the terminal status; contradictory signed callbacks fail closed.
  if (event === "payment.success" && status !== "SUCCESS") {
    return { ok: false, error: "Conflicting payment status" };
  }
  if (event === "payment.failed" && status !== "FAILED") {
    return { ok: false, error: "Conflicting payment status" };
  }
  if (status === "SUCCESS" && event && event !== "payment.success") {
    return { ok: false, error: "Conflicting payment event" };
  }
  if (status === "FAILED" && event && event !== "payment.failed") {
    return { ok: false, error: "Conflicting payment event" };
  }

  return {
    ok: true,
    webhook: {
      orderId,
      status,
      event,
      paymentId: normalizeString(payload.transaction_id ?? payload.transactionId),
      amount: payload.amount,
      currency: normalizeString(payload.currency)?.toUpperCase(),
    },
  };
}

export function payblisAmountMatches(expected: unknown, received: unknown) {
  const expectedMinor = parseMoneyMinorUnits(expected);
  const receivedMinor = parseMoneyMinorUnits(received);
  return expectedMinor !== null && receivedMinor !== null && expectedMinor === receivedMinor;
}

export function isFulfilledPayblisStatus(status: string) {
  return status === "SUCCESS";
}

export function payblisCurrencyMatches(expected: string, received?: string) {
  return !received || received.toUpperCase() === expected.toUpperCase();
}

export async function verifyPayblisSignature(
  rawBody: string,
  payload: Record<string, unknown>,
  signature: string,
  secret: string,
) {
  const normalizedSignature = normalizeSignature(signature);
  if (!normalizedSignature || !secret) return false;

  // Live Payblis callbacks include `signature` in the JSON and sign the compact
  // JSON produced after removing it. This is also what their "delete signature"
  // instruction describes.
  const { signature: embeddedSignature, ...unsignedPayload } = payload;
  const unsignedJson = JSON.stringify(unsignedPayload);
  if (timingSafeHexEqual(await hmacSha256Hex(secret, unsignedJson), normalizedSignature)) return true;

  // Their current PHP documentation separately shows a header-only signature over
  // the raw request body. Support that documented variant only when the body does
  // not contain the self-referential signature field.
  if (embeddedSignature === undefined) {
    return timingSafeHexEqual(await hmacSha256Hex(secret, rawBody), normalizedSignature);
  }
  return false;
}

function phpSerializeStringMap(map: Record<string, string>) {
  const encoder = new TextEncoder();
  const serializeString = (value: string) => `s:${encoder.encode(value).length}:"${value}";`;
  const entries = Object.entries(map)
    .map(([key, value]) => `${serializeString(key)}${serializeString(value)}`)
    .join("");
  return `a:${Object.keys(map).length}:{${entries}}`;
}

function base64Standard(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function normalizeString(value: unknown) {
  if (value === undefined || value === null) return undefined;
  const normalized = String(value).trim();
  return normalized || undefined;
}

function parseMoneyMinorUnits(value: unknown) {
  const normalized = normalizeString(value);
  if (!normalized || !/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(normalized)) return null;
  const [whole, fraction = ""] = normalized.split(".");
  const minor = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));
  return minor > 0n ? minor : null;
}

async function hmacSha256Hex(secret: string, message: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return bytesToHex(new Uint8Array(signature));
}

function timingSafeHexEqual(leftHex: string, rightHex: string) {
  const left = hexToBytes(leftHex);
  const right = hexToBytes(rightHex);
  if (!left || !right || left.length !== right.length) return false;

  let diff = 0;
  for (let index = 0; index < left.length; index += 1) diff |= left[index] ^ right[index];
  return diff === 0;
}

function normalizeSignature(signature: string) {
  return signature.trim().toLowerCase().replace(/^sha256=/, "");
}

function bytesToHex(bytes: Uint8Array) {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex: string) {
  const normalized = hex.trim().toLowerCase();
  if (!/^[a-f0-9]+$/.test(normalized) || normalized.length % 2 !== 0) return null;
  const bytes = new Uint8Array(normalized.length / 2);
  for (let index = 0; index < normalized.length; index += 2) {
    bytes[index / 2] = Number.parseInt(normalized.slice(index, index + 2), 16);
  }
  return bytes;
}
