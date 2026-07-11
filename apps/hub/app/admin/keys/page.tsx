"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, ListChecks, Loader2, Mail, RefreshCcw, RotateCcw, Search, ShieldCheck, Smartphone, UserX, Plus } from "lucide-react";
import { RpWalletApiClient, type AdminLicenseResetResult, type AdminLicenseSnapshot, type AdminUnusedLicenseSummary } from "@rp-wallet/api-client";
import { HUB_API_BASE_URL } from "@/lib/api-base-url";

const ADMIN_TOKEN_KEY = "rp_affiliate_admin_token";

const PLAN_PRESETS = [
  { id: "starter", label: "Starter", plan: "Starter", durationDays: 7, allowedDevices: 1 },
  { id: "popular", label: "Most Popular", plan: "Most Popular", durationDays: 30, allowedDevices: 1 },
  { id: "yearly", label: "Yearly Access", plan: "Yearly Access", durationDays: 365, allowedDevices: 2 },
  { id: "custom", label: "Custom expiry", plan: "Custom", durationDays: 30, allowedDevices: 1 },
] as const;

export default function AdminKeysPage() {
  const api = useMemo(() => new RpWalletApiClient(HUB_API_BASE_URL), []);
  const [adminToken, setAdminToken] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<(typeof PLAN_PRESETS)[number]["id"]>("popular");
  const [email, setEmail] = useState("");
  const [customPlan, setCustomPlan] = useState("");
  const [customExpiresAt, setCustomExpiresAt] = useState("");
  const [allowedDevices, setAllowedDevices] = useState("1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [supportKey, setSupportKey] = useState("");
  const [supportLoading, setSupportLoading] = useState<"lookup" | "devices" | "sessions" | "reset" | null>(null);
  const [supportError, setSupportError] = useState("");
  const [supportNotice, setSupportNotice] = useState("");
  const [licenseSnapshot, setLicenseSnapshot] = useState<AdminLicenseSnapshot | null>(null);
  const [unusedLicenses, setUnusedLicenses] = useState<AdminUnusedLicenseSummary[]>([]);
  const [unusedLoading, setUnusedLoading] = useState(false);
  const [unusedError, setUnusedError] = useState("");
  const [unusedNotice, setUnusedNotice] = useState("");
  const [remindingKey, setRemindingKey] = useState<string | null>(null);
  const [created, setCreated] = useState<{
    licenseKey: string;
    license: {
      id: string;
      plan: string;
      expiresAt: string;
      allowedDevices: number;
    };
  } | null>(null);

  const preset = PLAN_PRESETS.find((entry) => entry.id === selectedPreset) || PLAN_PRESETS[1];
  const isCustom = selectedPreset === "custom";

  useEffect(() => {
    const stored = window.localStorage.getItem(ADMIN_TOKEN_KEY) || "";
    if (stored) setAdminToken(stored);
  }, []);

  useEffect(() => {
    if (!isCustom) setAllowedDevices(String(preset.allowedDevices));
  }, [isCustom, preset.allowedDevices]);

  async function createKey(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");
    setCreated(null);

    try {
      window.localStorage.setItem(ADMIN_TOKEN_KEY, adminToken.trim());
      const response = await api.createAdminLicenseKey(adminToken.trim(), {
        email: email.trim() || undefined,
        plan: isCustom ? customPlan.trim() || "Custom Access" : preset.plan,
        durationDays: isCustom ? undefined : preset.durationDays,
        expiresAt: isCustom && customExpiresAt ? new Date(customExpiresAt).toISOString() : undefined,
        allowedDevices: Number(allowedDevices) || preset.allowedDevices,
      });
      setCreated(response);
      if (response.emailSent) {
        setNotice(`License key created and emailed to ${email.trim()}.`);
      } else if (response.emailError) {
        setError(response.emailError);
      }
    } catch {
      setError("Unable to create key. Check the admin token, expiry date, and API deployment.");
    } finally {
      setLoading(false);
    }
  }

  async function copyKey() {
    if (!created) return;
    await navigator.clipboard.writeText(created.licenseKey);
  }

  async function lookupLicense(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (!supportKey.trim()) return;
    setSupportLoading("lookup");
    setSupportError("");
    setSupportNotice("");

    try {
      window.localStorage.setItem(ADMIN_TOKEN_KEY, adminToken.trim());
      const snapshot = await api.lookupAdminLicense(adminToken.trim(), { licenseKey: supportKey.trim() });
      setLicenseSnapshot(snapshot);
    } catch {
      setLicenseSnapshot(null);
      setSupportError("License not found, or the admin token is invalid.");
    } finally {
      setSupportLoading(null);
    }
  }

  async function runSupportAction(action: "devices" | "sessions" | "reset") {
    if (!supportKey.trim()) return;
    setSupportLoading(action);
    setSupportError("");
    setSupportNotice("");

    try {
      window.localStorage.setItem(ADMIN_TOKEN_KEY, adminToken.trim());
      let result: AdminLicenseResetResult;
      if (action === "devices") {
        result = await api.clearAdminLicenseDevices(adminToken.trim(), { licenseKey: supportKey.trim() });
        setSupportNotice(`Cleared ${result.clearedDevices} device binding${result.clearedDevices === 1 ? "" : "s"}.`);
      } else if (action === "sessions") {
        result = await api.revokeAdminLicenseSessions(adminToken.trim(), { licenseKey: supportKey.trim() });
        setSupportNotice(`Revoked ${result.revokedSessions} active session${result.revokedSessions === 1 ? "" : "s"}.`);
      } else {
        result = await api.resetAdminLicenseAccess(adminToken.trim(), { licenseKey: supportKey.trim() });
        setSupportNotice(`Reset complete: cleared ${result.clearedDevices} device${result.clearedDevices === 1 ? "" : "s"} and revoked ${result.revokedSessions} session${result.revokedSessions === 1 ? "" : "s"}.`);
      }
      setLicenseSnapshot(result.snapshot);
    } catch {
      setSupportError("Action failed. Check the license key, admin token, and API deployment.");
    } finally {
      setSupportLoading(null);
    }
  }

  async function loadUnusedLicenses() {
    setUnusedLoading(true);
    setUnusedError("");
    setUnusedNotice("");

    try {
      window.localStorage.setItem(ADMIN_TOKEN_KEY, adminToken.trim());
      const response = await api.getAdminUnusedLicenses(adminToken.trim());
      setUnusedLicenses(response.licenses);
      setUnusedNotice(`Found ${response.licenses.length} active unused key${response.licenses.length === 1 ? "" : "s"}.`);
    } catch {
      setUnusedLicenses([]);
      setUnusedError("Unable to load unused keys. Check the admin token and API deployment.");
    } finally {
      setUnusedLoading(false);
    }
  }

  async function sendReminder(license: AdminUnusedLicenseSummary) {
    if (!license.keyPlaintext) {
      setUnusedError("This key cannot be reminded because the plaintext key is missing.");
      return;
    }

    setRemindingKey(license.keyPlaintext);
    setUnusedError("");
    setUnusedNotice("");

    try {
      window.localStorage.setItem(ADMIN_TOKEN_KEY, adminToken.trim());
      const response = await api.sendAdminLicenseReminder(adminToken.trim(), { licenseKey: license.keyPlaintext });
      setUnusedNotice(`Reminder sent to ${response.to}.`);
    } catch {
      setUnusedError("Reminder failed. Make sure the key has an email and RESEND_API_KEY is set on the API.");
    } finally {
      setRemindingKey(null);
    }
  }

  function inspectUnusedLicense(license: AdminUnusedLicenseSummary) {
    if (!license.keyPlaintext) return;
    setSupportKey(license.keyPlaintext);
    setLicenseSnapshot(null);
    setSupportError("");
    setSupportNotice("Key copied into License Control Center. Tap Lookup to inspect it.");
  }

  return (
    <div className="space-y-4 p-8 pt-6 mx-auto max-w-7xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between space-y-2 mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Create License Keys</h2>
            <p className="text-zinc-400 mt-2">Generate active keys with preset plans or exact custom expiry times.</p>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mb-8">
          <div className="col-span-4 rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-medium">Key Details</h3>
            <form onSubmit={createKey}>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-medium">
                  Buyer email optional
                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    type="email"
                    placeholder="customer@example.com"
                    className="h-10 rounded-md border border-zinc-800 bg-transparent px-3 text-sm font-normal outline-none focus:border-white focus:ring-1 focus:ring-white placeholder:text-zinc-500"
                  />
                </label>

                <label className="flex flex-col gap-2 text-sm font-medium">
                  Plan
                  <select
                    value={selectedPreset}
                    onChange={(event) => setSelectedPreset(event.target.value as typeof selectedPreset)}
                    className="h-10 rounded-md border border-zinc-800 bg-zinc-950 px-3 text-sm font-normal outline-none focus:border-white focus:ring-1 focus:ring-white"
                  >
                    {PLAN_PRESETS.map((entry) => (
                      <option key={entry.id} value={entry.id}>{entry.label}</option>
                    ))}
                  </select>
                </label>

                {isCustom && (
                  <>
                    <label className="flex flex-col gap-2 text-sm font-medium">
                      Custom plan label
                      <input
                        value={customPlan}
                        onChange={(event) => setCustomPlan(event.target.value)}
                        placeholder="VIP Access"
                        className="h-10 rounded-md border border-zinc-800 bg-transparent px-3 text-sm font-normal outline-none focus:border-white focus:ring-1 focus:ring-white placeholder:text-zinc-500"
                      />
                    </label>

                    <label className="flex flex-col gap-2 text-sm font-medium">
                      Exact expiry date and time
                      <input
                        required={isCustom}
                        value={customExpiresAt}
                        onChange={(event) => setCustomExpiresAt(event.target.value)}
                        type="datetime-local"
                        className="h-10 rounded-md border border-zinc-800 bg-transparent px-3 text-sm font-normal outline-none focus:border-white focus:ring-1 focus:ring-white placeholder:text-zinc-500"
                      />
                    </label>
                  </>
                )}

                {!isCustom && (
                  <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-4 text-sm text-zinc-400">
                    Expires in <span className="font-semibold text-white">{preset.durationDays} days</span> after creation.
                  </div>
                )}

                <label className="flex flex-col gap-2 text-sm font-medium">
                  Allowed devices
                  <input
                    value={allowedDevices}
                    onChange={(event) => setAllowedDevices(event.target.value)}
                    type="number"
                    min={1}
                    max={10}
                    className="h-10 rounded-md border border-zinc-800 bg-transparent px-3 text-sm font-normal outline-none focus:border-white focus:ring-1 focus:ring-white placeholder:text-zinc-500"
                  />
                </label>
              </div>

              {error && <div className="mt-4 rounded-lg border border-red-900/50 bg-red-950/20 p-4 text-sm font-medium text-red-500">{error}</div>}
              {notice && <div className="mt-4 rounded-lg border border-emerald-900/50 bg-emerald-950/20 p-4 text-sm font-medium text-emerald-400">{notice}</div>}

              <button
                disabled={loading || !adminToken.trim()}
                className="mt-6 inline-flex h-9 items-center gap-2 rounded-md bg-white px-4 text-sm font-medium text-black shadow disabled:opacity-50 hover:bg-zinc-200 transition-colors"
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Plus size={16} />}
                Generate key
              </button>
            </form>
          </div>

          <div className="col-span-3 rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-medium flex items-center gap-2">
              <ShieldCheck size={18} /> Admin Token
            </h3>
            <input
              value={adminToken}
              onChange={(event) => setAdminToken(event.target.value)}
              type="password"
              placeholder="Paste AFFILIATE_ADMIN_TOKEN"
              className="h-10 w-full rounded-md border border-zinc-800 bg-transparent px-3 text-sm outline-none placeholder:text-zinc-500 focus:border-white focus:ring-1 focus:ring-white"
            />
            <p className="mt-3 text-sm text-zinc-500">Uses the same owner secret as affiliate admin.</p>
          </div>
        </section>

        {created && (
          <section className="mb-8 rounded-xl border border-emerald-900/50 bg-emerald-950/20 p-6 shadow-sm">
            <div className="mb-3 text-sm font-semibold uppercase tracking-wide text-emerald-500">Key created</div>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="font-mono text-2xl font-bold tracking-wider text-emerald-100">{created.licenseKey}</div>
                <p className="mt-2 text-sm text-emerald-400/80">
                  {created.license.plan} · expires {new Date(created.license.expiresAt).toLocaleString()} · {created.license.allowedDevices} device
                  {created.license.allowedDevices === 1 ? "" : "s"}
                </p>
              </div>
              <button onClick={copyKey} className="inline-flex h-9 items-center gap-2 rounded-md border border-emerald-800/60 bg-transparent hover:bg-emerald-900/40 px-4 text-sm font-medium text-emerald-400 transition-colors">
                <Copy size={16} />
                Copy key
              </button>
            </div>
          </section>
        )}

        <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-sm mb-8">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Unused Active Keys</h2>
              <p className="text-sm text-zinc-400 mt-1">See active, unexpired keys with no device activation yet, then send a setup reminder.</p>
            </div>
            <button
              type="button"
              disabled={unusedLoading || !adminToken.trim()}
              onClick={loadUnusedLicenses}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-white px-4 text-sm font-medium text-black disabled:opacity-50 hover:bg-zinc-200 transition-colors"
            >
              {unusedLoading ? <Loader2 className="size-4 animate-spin" /> : <ListChecks size={16} />}
              Load unused keys
            </button>
          </div>

          {unusedError && <div className="mb-4 rounded-lg border border-red-900/50 bg-red-950/20 p-4 text-sm font-medium text-red-500">{unusedError}</div>}
          {unusedNotice && <div className="mb-4 rounded-lg border border-emerald-900/50 bg-emerald-950/20 p-4 text-sm font-medium text-emerald-500">{unusedNotice}</div>}

          {unusedLicenses.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5 text-sm text-zinc-500">
              Load the list to find keys that were created, are still active, but have never been used on a device.
            </div>
          ) : (
            <div className="grid gap-3">
              {unusedLicenses.map((license) => (
                <div key={license.id} className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-semibold tracking-wider text-white">{license.keyPlaintext || "Key hidden"}</span>
                        <span className="rounded-md border border-emerald-900/50 bg-emerald-950/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-500">
                          Unused
                        </span>
                      </div>
                      <div className="mt-2 grid gap-1 text-sm text-zinc-400 md:grid-cols-2 xl:grid-cols-4">
                        <span>{license.email || "No email"}</span>
                        <span>{license.plan}</span>
                        <span>Expires {new Date(license.expiresAt).toLocaleDateString()}</span>
                        <span>{license.allowedDevices} device{license.allowedDevices === 1 ? "" : "s"}</span>
                      </div>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2 lg:flex lg:items-center">
                      <button
                        type="button"
                        disabled={!license.keyPlaintext}
                        onClick={() => inspectUnusedLicense(license)}
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-zinc-700 bg-transparent px-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
                      >
                        <Search size={15} />
                        Inspect
                      </button>
                      <button
                        type="button"
                        disabled={!license.email || !license.keyPlaintext || remindingKey !== null}
                        onClick={() => sendReminder(license)}
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-[#ab9ff2] px-3 text-sm font-medium text-black transition-colors hover:bg-white disabled:opacity-50"
                      >
                        {remindingKey === license.keyPlaintext ? <Loader2 className="size-4 animate-spin" /> : <Mail size={15} />}
                        Send reminder
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-sm mb-8">
          <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">License Control Center</h2>
              <p className="text-sm text-zinc-400 mt-1">Look up a key, inspect devices and sessions, then reset access without deleting the license.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-zinc-400 border border-zinc-800">
              <ShieldCheck size={14} />
              Admin actions
            </div>
          </div>

          <form onSubmit={lookupLicense} className="grid gap-3 md:grid-cols-[1fr_auto]">
            <input
              value={supportKey}
              onChange={(event) => setSupportKey(event.target.value)}
              placeholder="Paste customer license key"
              className="h-10 w-full rounded-md border border-zinc-800 bg-transparent px-3 font-mono text-sm outline-none placeholder:text-zinc-500 focus:border-white focus:ring-1 focus:ring-white"
            />
            <button
              disabled={supportLoading !== null || !adminToken.trim() || !supportKey.trim()}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-white px-4 text-sm font-medium text-black disabled:opacity-50 hover:bg-zinc-200 transition-colors"
            >
              {supportLoading === "lookup" ? <Loader2 className="size-4 animate-spin" /> : <Search size={16} />}
              Lookup
            </button>
          </form>

          {supportError && <div className="mt-4 rounded-lg border border-red-900/50 bg-red-950/20 p-4 text-sm font-medium text-red-500">{supportError}</div>}
          {supportNotice && <div className="mt-4 rounded-lg border border-emerald-900/50 bg-emerald-950/20 p-4 text-sm font-medium text-emerald-500">{supportNotice}</div>}

          {licenseSnapshot && (
            <div className="mt-6 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5">
                <div className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">License</div>
                <dl className="grid gap-3 text-sm">
                  <div>
                    <dt className="text-zinc-500">Plan</dt>
                    <dd className="font-semibold text-white">{licenseSnapshot.license.plan}</dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">Email</dt>
                    <dd className="font-semibold text-white">{licenseSnapshot.license.email || "No email"}</dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">Status</dt>
                    <dd className="font-semibold text-white">{licenseSnapshot.license.status}</dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">Expires</dt>
                    <dd className="font-semibold text-white">{new Date(licenseSnapshot.license.expiresAt).toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">Allowed devices</dt>
                    <dd className="font-semibold text-white">{licenseSnapshot.license.allowedDevices}</dd>
                  </div>
                </dl>

                <div className="mt-6 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-zinc-900 p-3 border border-zinc-800">
                    <div className="text-lg font-bold">{licenseSnapshot.counts.devices}</div>
                    <div className="text-[11px] font-medium text-zinc-500 mt-1">Devices</div>
                  </div>
                  <div className="rounded-lg bg-zinc-900 p-3 border border-zinc-800">
                    <div className="text-lg font-bold">{licenseSnapshot.counts.activeSessions}</div>
                    <div className="text-[11px] font-medium text-zinc-500 mt-1">Active</div>
                  </div>
                  <div className="rounded-lg bg-zinc-900 p-3 border border-zinc-800">
                    <div className="text-lg font-bold">{licenseSnapshot.counts.revokedSessions}</div>
                    <div className="text-[11px] font-medium text-zinc-500 mt-1">Revoked</div>
                  </div>
                </div>

                <div className="mt-6 grid gap-2">
                  <button
                    type="button"
                    disabled={supportLoading !== null}
                    onClick={() => runSupportAction("reset")}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-red-900/80 hover:bg-red-900 px-4 text-sm font-medium text-white disabled:opacity-50 transition-colors"
                  >
                    {supportLoading === "reset" ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw size={16} />}
                    Reset access
                  </button>
                  <div className="grid gap-2 md:grid-cols-2">
                    <button
                      type="button"
                      disabled={supportLoading !== null}
                      onClick={() => runSupportAction("devices")}
                      className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-zinc-700 bg-transparent hover:bg-zinc-800 px-3 text-sm font-medium text-white disabled:opacity-50 transition-colors"
                    >
                      {supportLoading === "devices" ? <Loader2 className="size-4 animate-spin" /> : <Smartphone size={16} />}
                      Clear devices
                    </button>
                    <button
                      type="button"
                      disabled={supportLoading !== null}
                      onClick={() => runSupportAction("sessions")}
                      className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-zinc-700 bg-transparent hover:bg-zinc-800 px-3 text-sm font-medium text-white disabled:opacity-50 transition-colors"
                    >
                      {supportLoading === "sessions" ? <Loader2 className="size-4 animate-spin" /> : <UserX size={16} />}
                      Revoke sessions
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5">
                  <div className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
                    <Smartphone size={15} />
                    Devices
                  </div>
                  {licenseSnapshot.devices.length === 0 ? (
                    <p className="text-sm text-zinc-500">No device bindings. This key can be activated on a new device.</p>
                  ) : (
                    <div className="space-y-2">
                      {licenseSnapshot.devices.map((device) => (
                        <div key={device.id} className="rounded-lg bg-zinc-900 border border-zinc-800 p-3 text-sm">
                          <div className="break-all font-mono text-xs text-zinc-300">{device.deviceId}</div>
                          <div className="mt-1 text-xs text-zinc-500">Last seen {new Date(device.lastSeenAt).toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5">
                  <div className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
                    <RefreshCcw size={15} />
                    Sessions
                  </div>
                  {licenseSnapshot.sessions.length === 0 ? (
                    <p className="text-sm text-zinc-500">No sessions recorded.</p>
                  ) : (
                    <div className="space-y-2">
                      {licenseSnapshot.sessions.slice(0, 8).map((session) => (
                        <div key={session.id} className="rounded-lg bg-zinc-900 border border-zinc-800 p-3 text-sm">
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-mono text-xs text-zinc-300">{session.id}</span>
                            <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${session.active ? "bg-emerald-950/40 text-emerald-500 border border-emerald-900/50" : "bg-zinc-800 text-zinc-400 border border-zinc-700"}`}>
                              {session.active ? "Active" : "Inactive"}
                            </span>
                          </div>
                          <div className="mt-2 text-xs text-zinc-500">Expires {new Date(session.expiresAt).toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
    </div>
  );
}
