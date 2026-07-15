export interface AbandonedReminderCandidate {
  email: string;
}

export function selectAbandonedReminderOrders<T extends AbandonedReminderCandidate>(
  candidates: T[],
  recentPurchaseEmails: Iterable<string>,
  limit: number,
) {
  const recentBuyers = new Set([...recentPurchaseEmails].map(normalizeEmail));
  const selectedBuyers = new Set<string>();
  const selected: T[] = [];

  for (const candidate of candidates) {
    const email = normalizeEmail(candidate.email);
    if (!email || recentBuyers.has(email) || selectedBuyers.has(email)) continue;
    selectedBuyers.add(email);
    selected.push(candidate);
    if (selected.length >= limit) break;
  }

  return selected;
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}
