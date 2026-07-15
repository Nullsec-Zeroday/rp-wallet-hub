import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPayblisCheckoutUrl,
  isFulfilledPayblisStatus,
  parsePayblisWebhook,
  payblisAmountMatches,
  payblisCurrencyMatches,
  verifyPayblisSignature,
} from "./payblis.ts";

const secret = "payblis-test-secret";

test("builds the documented PHP-serialized Payblis checkout token", () => {
  const checkoutUrl = buildPayblisCheckoutUrl({
    merchantKey: "merchant-key",
    sandbox: false,
    amount: "14.00",
    currency: "USD",
    productName: "RPWallet Starter",
    storeName: "RPWallet",
    refOrder: "pay_123",
    customerEmail: "buyer@example.com",
    customerName: "Buyer",
    customerFirstName: "Buyer",
    country: "US",
    userIP: "203.0.113.10",
    lang: "en",
    urlOK: "https://rpwallet.app/buy?payment=success",
    urlKO: "https://rpwallet.app/buy?payment=cancelled",
    ipnURL: "https://api.rpwallet.app/webhooks/payblis",
  });

  const url = new URL(checkoutUrl);
  assert.equal(url.origin + url.pathname, "https://pay.payblis.com/api/payment_gateway.php");
  const serialized = atob(url.searchParams.get("token"));
  assert.match(serialized, /^a:17:\{/);
  assert.match(serialized, /s:11:"MerchantKey";s:12:"merchant-key";/);
  assert.match(serialized, /s:6:"method";s:33:"credit_cards,apple_pay,google_pay";/);
  assert.match(serialized, /s:8:"RefOrder";s:7:"pay_123";/);
  assert.match(serialized, /s:6:"ipnURL";s:41:"https:\/\/api\.rpwallet\.app\/webhooks\/payblis";/);
});

test("only SUCCESS is eligible for fulfillment", () => {
  assert.equal(isFulfilledPayblisStatus("SUCCESS"), true);
  assert.equal(isFulfilledPayblisStatus("PENDING"), false);
  assert.equal(isFulfilledPayblisStatus("WAITING"), false);
  assert.equal(isFulfilledPayblisStatus("FAILED"), false);
  assert.equal(isFulfilledPayblisStatus("success"), false);
});

test("parses current Payblis success and pending payloads", () => {
  assert.deepEqual(
    parsePayblisWebhook({
      event: "payment.success",
      merchant_reference: "pay_123",
      transaction_id: "PAYB123",
      amount: "14.00",
      status: "SUCCESS",
      currency: "usd",
    }),
    {
      ok: true,
      webhook: {
        orderId: "pay_123",
        status: "SUCCESS",
        event: "payment.success",
        paymentId: "PAYB123",
        amount: "14.00",
        currency: "USD",
      },
    },
  );

  const pending = parsePayblisWebhook({ merchant_reference: "pay_123", status: "pending" });
  assert.equal(pending.ok, true);
  assert.equal(pending.webhook.status, "PENDING");
  assert.equal(isFulfilledPayblisStatus(pending.webhook.status), false);
});

test("rejects conflicting references, events, and statuses", () => {
  assert.deepEqual(
    parsePayblisWebhook({ RefOrder: "pay_one", merchant_reference: "pay_two", status: "SUCCESS" }),
    { ok: false, error: "Conflicting order reference" },
  );
  assert.deepEqual(
    parsePayblisWebhook({ event: "payment.failed", merchant_reference: "pay_123", status: "SUCCESS" }),
    { ok: false, error: "Conflicting payment status" },
  );
  assert.deepEqual(
    parsePayblisWebhook({ event: "payment.success", merchant_reference: "pay_123", status: "PENDING" }),
    { ok: false, error: "Conflicting payment status" },
  );
  assert.deepEqual(parsePayblisWebhook({ status: "SUCCESS" }), { ok: false, error: "Missing payment fields" });
});

test("compares amounts exactly in integer minor units", () => {
  assert.equal(payblisAmountMatches("14.00", "14"), true);
  assert.equal(payblisAmountMatches("14.00", 14), true);
  assert.equal(payblisAmountMatches("14.00", "14.0"), true);
  assert.equal(payblisAmountMatches("14.00", "14.01"), false);
  assert.equal(payblisAmountMatches("14.00", "14e0"), false);
  assert.equal(payblisAmountMatches("14.00", "14.000"), false);
  assert.equal(payblisAmountMatches("14.00", "0"), false);
  assert.equal(payblisAmountMatches("14.00", undefined), false);
});

test("validates currency when Payblis includes it", () => {
  assert.equal(payblisCurrencyMatches("USD", undefined), true);
  assert.equal(payblisCurrencyMatches("USD", "usd"), true);
  assert.equal(payblisCurrencyMatches("USD", "EUR"), false);
});

test("verifies the live embedded-signature callback format", async () => {
  const unsigned = {
    event: "payment.success",
    merchant_reference: "pay_123",
    transaction_id: "PAYB123",
    amount: "14.00",
    status: "SUCCESS",
  };
  const signature = await sign(JSON.stringify(unsigned));
  const payload = { ...unsigned, signature };
  const rawBody = JSON.stringify(payload);

  assert.equal(await verifyPayblisSignature(rawBody, payload, signature, secret), true);
  assert.equal(await verifyPayblisSignature(rawBody, { ...payload, amount: "1.00" }, signature, secret), false);
  assert.equal(await verifyPayblisSignature(rawBody, payload, signature, "wrong-secret"), false);
});

test("verifies the documented header-only raw-body callback format", async () => {
  const rawBody = '{\n  "merchant_reference": "pay_123",\n  "status": "PENDING"\n}';
  const payload = JSON.parse(rawBody);
  const signature = await sign(rawBody);

  assert.equal(await verifyPayblisSignature(rawBody, payload, `sha256=${signature}`, secret), true);
  assert.equal(await verifyPayblisSignature(`${rawBody} `, payload, signature, secret), false);
});

async function sign(message) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const bytes = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message)));
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
