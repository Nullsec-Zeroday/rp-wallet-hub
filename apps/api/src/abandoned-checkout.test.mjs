import assert from "node:assert/strict";
import test from "node:test";
import { selectAbandonedReminderOrders } from "./abandoned-checkout.ts";

test("suppresses buyers with a recent completed purchase", () => {
  const candidates = [
    { id: "pay_1", email: "recent@example.com" },
    { id: "pay_2", email: "returning@example.com" },
  ];

  assert.deepEqual(
    selectAbandonedReminderOrders(candidates, ["RECENT@example.com"], 100).map((order) => order.id),
    ["pay_2"],
  );
});

test("collapses duplicate checkout attempts to one reminder per buyer", () => {
  const candidates = [
    { id: "pay_oldest", email: "buyer@example.com" },
    { id: "pay_duplicate", email: " Buyer@example.com " },
    { id: "pay_other", email: "other@example.com" },
  ];

  assert.deepEqual(
    selectAbandonedReminderOrders(candidates, [], 100).map((order) => order.id),
    ["pay_oldest", "pay_other"],
  );
});

test("applies the batch limit after suppression and deduplication", () => {
  const candidates = [
    { id: "pay_recent", email: "recent@example.com" },
    { id: "pay_first", email: "first@example.com" },
    { id: "pay_second", email: "second@example.com" },
  ];

  assert.deepEqual(
    selectAbandonedReminderOrders(candidates, ["recent@example.com"], 1).map((order) => order.id),
    ["pay_first"],
  );
});
