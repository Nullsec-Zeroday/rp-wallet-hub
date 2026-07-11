import assert from "node:assert/strict";
import test from "node:test";
import { createReferralToken, verifyReferralToken } from "./referral-token.ts";
import { getReferralBonusDays } from "@rp-wallet/config";

const secret = "test-referral-secret-that-is-long-enough";

test("round-trips a valid referral token", async () => {
  const payload = { clickId: "afc_0123456789abcdef01", expiresAt: new Date(Date.now() + 60_000).toISOString() };
  const token = await createReferralToken(payload, secret);
  assert.deepEqual(await verifyReferralToken(token, secret), payload);
});

test("rejects tampering and the wrong secret", async () => {
  const token = await createReferralToken(
    { clickId: "afc_0123456789abcdef01", expiresAt: new Date(Date.now() + 60_000).toISOString() },
    secret,
  );
  assert.equal(await verifyReferralToken(`${token.slice(0, -1)}x`, secret), null);
  assert.equal(await verifyReferralToken(token, "different-secret"), null);
});

test("rejects expired tokens", async () => {
  const token = await createReferralToken(
    { clickId: "afc_0123456789abcdef01", expiresAt: new Date(Date.now() - 1_000).toISOString() },
    secret,
  );
  assert.equal(await verifyReferralToken(token, secret), null);
});

test("applies the expected creator bonus for every paid plan", () => {
  assert.equal(getReferralBonusDays("starter"), 2);
  assert.equal(getReferralBonusDays("popular"), 7);
  assert.equal(getReferralBonusDays("yearly"), 30);
  assert.equal(getReferralBonusDays("unknown"), 0);
});
