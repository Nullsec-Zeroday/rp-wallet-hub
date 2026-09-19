import { neon } from "@neondatabase/serverless";

/**
 * Hub-local license administration backed directly by Neon.
 *
 * The marketing/admin hub normally proxies /admin/* calls to the Cloudflare
 * Worker API (apps/api). This module reimplements the license-key endpoints so
 * the admin panel works against Neon on its own — the exact key algorithm,
 * hashing, and table shape match apps/api/src/platform-store.ts so keys created
 * here are fully interoperable with the Worker and the wallet activation flow.
 */

const KEY_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

type Sql = ReturnType<typeof neon>;

function getSql(): Sql {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured");
  return neon(url);
}

export function generateRandomLicenseKey() {
  const bytes = crypto.getRandomValues(new Uint8Array(20));
  const chars = Array.from(bytes, (byte) => KEY_ALPHABET[byte % KEY_ALPHABET.length]);
  return [0, 5, 10, 15].map((start) => chars.slice(start, start + 5).join("")).join("-");
}

function normalizeLicenseKey(key: string) {
  return key.trim().toUpperCase().replace(/-/g, "");
}

async function hashToken(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function createId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 18)}`;
}

function toIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  return new Date(value as string).toISOString();
}

function toIsoOrUndefined(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  return toIso(value);
}

export function getAdminAllowedDevices(plan: string, requested?: number) {
  if (requested && Number.isFinite(requested) && requested > 0) return Math.floor(requested);
  return plan.toLowerCase().includes("year") ? 2 : 1;
}

export function resolveAdminLicenseExpiry(input: { expiresAt?: string; durationDays?: number }) {
  if (input.expiresAt) {
    const expiresAt = new Date(input.expiresAt);
    if (Number.isFinite(expiresAt.getTime()) && expiresAt > new Date()) return expiresAt;
    return null;
  }
  const durationDays = Number(input.durationDays);
  if (!Number.isFinite(durationDays) || durationDays <= 0) return null;
  return new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
}

export interface AdminAuthResult {
  status: number;
  error: string;
}

/** Returns null when the request is an authorized admin, otherwise an error result. */
export function checkAdminAuth(request: Request): AdminAuthResult | null {
  const expected = process.env.AFFILIATE_ADMIN_TOKEN;
  if (!expected) {
    return {
      status: 503,
      error: "Admin token is not configured on the server. Set AFFILIATE_ADMIN_TOKEN in the project environment.",
    };
  }
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ")
    ? header.slice("Bearer ".length).trim()
    : request.headers.get("x-affiliate-admin-token") || "";
  if (token !== expected) return { status: 401, error: "Unauthorized" };
  return null;
}

export interface CreatedLicense {
  licenseKey: string;
  license: {
    id: string;
    plan: string;
    expiresAt: string;
    status: "active" | "expired" | "revoked";
    allowedDevices: number;
  };
}

export async function createLicenseKey(input: {
  email?: string;
  plan: string;
  expiresAt: Date;
  allowedDevices: number;
}): Promise<CreatedLicense> {
  const sql = getSql();
  const licenseKey = generateRandomLicenseKey();
  const normalized = normalizeLicenseKey(licenseKey);
  const keyHash = await hashToken(normalized);

  const userId = createId("usr");
  const userRows = (await sql`
    insert into users (id, email)
    values (${userId}, ${input.email ?? null})
    returning id
  `) as Array<{ id: string }>;
  const ownerId = userRows[0].id;

  const licenseId = createId("lic");
  const licenseRows = (await sql`
    insert into licenses (id, key_hash, key_plaintext, user_id, plan, status, expires_at, allowed_devices)
    values (${licenseId}, ${keyHash}, ${normalized}, ${ownerId}, ${input.plan}, 'active', ${input.expiresAt.toISOString()}, ${input.allowedDevices})
    on conflict (key_hash) do nothing
    returning id, plan, status, expires_at, allowed_devices
  `) as Array<Record<string, unknown>>;

  const row =
    licenseRows[0] ??
    ((await sql`
      select id, plan, status, expires_at, allowed_devices
      from licenses
      where key_hash = ${keyHash}
      limit 1
    `) as Array<Record<string, unknown>>)[0];

  return {
    licenseKey,
    license: {
      id: row.id as string,
      plan: row.plan as string,
      status: row.status as CreatedLicense["license"]["status"],
      expiresAt: toIso(row.expires_at),
      allowedDevices: Number(row.allowed_devices),
    },
  };
}

export interface AdminLicenseSnapshot {
  license: {
    id: string;
    plan: string;
    expiresAt: string;
    status: "active" | "expired" | "revoked";
    allowedDevices: number;
    keyPlaintext?: string;
    userId: string;
    email?: string;
    createdAt: string;
    updatedAt: string;
  };
  devices: Array<{ id: string; deviceId: string; lastSeenAt: string; createdAt: string }>;
  sessions: Array<{ id: string; expiresAt: string; revokedAt?: string; createdAt: string; active: boolean }>;
  counts: { devices: number; activeSessions: number; revokedSessions: number };
}

async function buildSnapshotForLicense(sql: Sql, license: Record<string, unknown>): Promise<AdminLicenseSnapshot> {
  const userId = license.user_id as string;
  const licenseId = license.id as string;

  const deviceRows = (await sql`
    select id, device_id, last_seen_at, created_at
    from devices
    where user_id = ${userId}
    order by created_at desc
  `) as Array<Record<string, unknown>>;

  const sessionRows = (await sql`
    select id, expires_at, revoked_at, created_at
    from sessions
    where license_id = ${licenseId}
    order by created_at desc
  `) as Array<Record<string, unknown>>;

  const now = Date.now();
  const sessions = sessionRows.map((row) => {
    const revokedAt = toIsoOrUndefined(row.revoked_at);
    const expiresAt = toIso(row.expires_at);
    const active = !revokedAt && new Date(expiresAt).getTime() > now;
    return { id: row.id as string, expiresAt, revokedAt, createdAt: toIso(row.created_at), active };
  });

  const activeSessions = sessions.filter((session) => session.active).length;
  const revokedSessions = sessions.filter((session) => session.revokedAt).length;

  return {
    license: {
      id: licenseId,
      plan: license.plan as string,
      expiresAt: toIso(license.expires_at),
      status: license.status as AdminLicenseSnapshot["license"]["status"],
      allowedDevices: Number(license.allowed_devices),
      keyPlaintext: (license.key_plaintext as string | null) ?? undefined,
      userId,
      email: (license.user_email as string | null) ?? undefined,
      createdAt: toIso(license.created_at),
      updatedAt: toIso(license.updated_at),
    },
    devices: deviceRows.map((row) => ({
      id: row.id as string,
      deviceId: row.device_id as string,
      lastSeenAt: toIso(row.last_seen_at),
      createdAt: toIso(row.created_at),
    })),
    sessions,
    counts: { devices: deviceRows.length, activeSessions, revokedSessions },
  };
}

async function findLicenseRow(sql: Sql, licenseKey: string) {
  const keyHash = await hashToken(normalizeLicenseKey(licenseKey));
  const rows = (await sql`
    select l.id, l.plan, l.status, l.expires_at, l.allowed_devices, l.key_plaintext,
           l.user_id, l.created_at, l.updated_at, u.email as user_email
    from licenses l
    join users u on u.id = l.user_id
    where l.key_hash = ${keyHash}
    limit 1
  `) as Array<Record<string, unknown>>;
  return rows[0] ?? null;
}

export async function lookupLicense(licenseKey: string): Promise<AdminLicenseSnapshot | null> {
  const sql = getSql();
  const license = await findLicenseRow(sql, licenseKey);
  if (!license) return null;
  return buildSnapshotForLicense(sql, license);
}

export interface AdminUnusedLicenseSummary {
  id: string;
  keyPlaintext?: string;
  userId: string;
  email?: string;
  plan: string;
  expiresAt: string;
  status: "active" | "expired" | "revoked";
  allowedDevices: number;
  deviceCount: number;
  createdAt: string;
  updatedAt: string;
}

export async function getUnusedActiveLicenses(): Promise<AdminUnusedLicenseSummary[]> {
  const sql = getSql();
  const rows = (await sql`
    select l.id, l.key_plaintext, l.user_id, u.email as user_email, l.plan,
           l.expires_at, l.status, l.allowed_devices, l.created_at, l.updated_at,
           (select count(*) from devices d where d.user_id = l.user_id)::int as device_count
    from licenses l
    join users u on u.id = l.user_id
    where l.status = 'active' and l.expires_at > now()
    order by l.created_at desc
  `) as Array<Record<string, unknown>>;

  return rows
    .filter((row) => Number(row.device_count) === 0)
    .map((row) => ({
      id: row.id as string,
      keyPlaintext: (row.key_plaintext as string | null) ?? undefined,
      userId: row.user_id as string,
      email: (row.user_email as string | null) ?? undefined,
      plan: row.plan as string,
      expiresAt: toIso(row.expires_at),
      status: row.status as AdminUnusedLicenseSummary["status"],
      allowedDevices: Number(row.allowed_devices),
      deviceCount: 0,
      createdAt: toIso(row.created_at),
      updatedAt: toIso(row.updated_at),
    }));
}

export interface AdminLicenseResetResult {
  snapshot: AdminLicenseSnapshot;
  clearedDevices: number;
  revokedSessions: number;
}

export async function clearLicenseDevices(licenseKey: string): Promise<AdminLicenseResetResult | null> {
  const sql = getSql();
  const license = await findLicenseRow(sql, licenseKey);
  if (!license) return null;

  const deleted = (await sql`
    delete from devices where user_id = ${license.user_id as string} returning id
  `) as Array<{ id: string }>;

  const snapshot = await buildSnapshotForLicense(sql, license);
  return { snapshot, clearedDevices: deleted.length, revokedSessions: 0 };
}

export async function revokeLicenseSessions(licenseKey: string): Promise<AdminLicenseResetResult | null> {
  const sql = getSql();
  const license = await findLicenseRow(sql, licenseKey);
  if (!license) return null;

  const revoked = (await sql`
    update sessions
    set revoked_at = now()
    where license_id = ${license.id as string} and revoked_at is null
    returning id
  `) as Array<{ id: string }>;

  const snapshot = await buildSnapshotForLicense(sql, license);
  return { snapshot, clearedDevices: 0, revokedSessions: revoked.length };
}

export async function resetLicenseAccess(licenseKey: string): Promise<AdminLicenseResetResult | null> {
  const sql = getSql();
  const license = await findLicenseRow(sql, licenseKey);
  if (!license) return null;

  const deleted = (await sql`
    delete from devices where user_id = ${license.user_id as string} returning id
  `) as Array<{ id: string }>;

  const revoked = (await sql`
    update sessions
    set revoked_at = now()
    where license_id = ${license.id as string} and revoked_at is null
    returning id
  `) as Array<{ id: string }>;

  const snapshot = await buildSnapshotForLicense(sql, license);
  return { snapshot, clearedDevices: deleted.length, revokedSessions: revoked.length };
}
