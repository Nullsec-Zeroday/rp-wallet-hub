"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, Loader2, Plus, RefreshCcw } from "lucide-react";
import { RpWalletApiClient } from "@rp-wallet/api-client";
import { HUB_API_BASE_URL } from "@/lib/api-base-url";

const ADMIN_TOKEN_KEY = "rp_affiliate_admin_token";
const REFERRAL_DOMAIN = "rpwallet.app";

type Snapshot = Awaited<ReturnType<RpWalletApiClient["getAffiliateAdminSnapshot"]>>;

export default function AffiliateAdminPage() {
  const api = useMemo(() => new RpWalletApiClient(HUB_API_BASE_URL), []);
  const [adminToken, setAdminToken] = useState("");
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updatingConversionId, setUpdatingConversionId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({
    code: "",
    displayName: "",
    email: "",
    commissionRate: "0.2000",
  });

  useEffect(() => {
    const stored = window.localStorage.getItem(ADMIN_TOKEN_KEY) || "";
    if (stored) setAdminToken(stored);
  }, []);

  async function refresh(token = adminToken) {
    if (!token.trim()) {
      setError("Enter your affiliate admin token first.");
      return;
    }

    setLoading(true);
    setError("");
    setNotice("");
    try {
      window.localStorage.setItem(ADMIN_TOKEN_KEY, token.trim());
      setSnapshot(await api.getAffiliateAdminSnapshot(token.trim()));
    } catch {
      setError("Unable to load affiliates. Check that the token is correct and the API is deployed.");
    } finally {
      setLoading(false);
    }
  }

  async function createAffiliate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setError("");
    setNotice("");
    try {
      await api.createAffiliateAdmin(adminToken.trim(), {
        code: form.code,
        displayName: form.displayName || form.code,
        email: form.email || undefined,
        commissionRate: form.commissionRate || "0.2000",
      });
      setForm({ code: "", displayName: "", email: "", commissionRate: "0.2000" });
      setNotice("Affiliate created or updated.");
      await refresh(adminToken);
    } catch {
      setError("Unable to create affiliate. Check the token and affiliate details.");
    } finally {
      setCreating(false);
    }
  }

  async function copyLink(code: string) {
    await navigator.clipboard.writeText(`https://${REFERRAL_DOMAIN}/?ref=${code}`);
    setNotice(`Copied referral link for ${code}.`);
  }

  async function updateConversion(id: string, status: "approved" | "rejected" | "paid") {
    setUpdatingConversionId(id);
    setError("");
    setNotice("");
    try {
      await api.updateAffiliateConversionStatus(adminToken.trim(), id, status);
      await refresh(adminToken);
      setNotice(`Conversion marked ${status}.`);
    } catch {
      setError("Unable to update this conversion. Refresh and check its current status.");
    } finally {
      setUpdatingConversionId("");
    }
  }

  const totals = snapshot
    ? {
        affiliates: snapshot.affiliates.length,
        clicks: snapshot.clicks.length,
        checkoutIntents: snapshot.checkoutIntents.length,
        conversions: snapshot.conversions.length,
        pending: snapshot.payoutTotals.reduce((sum, row) => sum + Number(row.pendingCommission), 0).toFixed(2),
      }
    : null;

  return (
    <div className="space-y-4 p-8 pt-6 mx-auto max-w-7xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between space-y-2 mb-8">
          <h2 className="text-3xl font-bold tracking-tight">Affiliate Dashboard</h2>
          <div className="flex items-center gap-4">
            {snapshot && (
              <span className="text-xs text-zinc-500">Loaded {formatDateTime(new Date().toISOString())}</span>
            )}
            <button onClick={() => refresh()} disabled={loading} className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-white px-4 text-sm font-medium text-black shadow transition hover:bg-zinc-200 disabled:opacity-50">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
              Refresh
            </button>
          </div>
        </div>

        {/* Inputs (Admin token and create) */}
        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mb-8">
          <div className="col-span-4 rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium">Create Creator</h3>
              <span className="rounded-md bg-zinc-900 px-2.5 py-0.5 text-xs font-semibold text-zinc-300">Max code: 16 chars</span>
            </div>
            <form onSubmit={createAffiliate}>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <input required value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} placeholder="Code" className="h-10 rounded-md border border-zinc-800 bg-transparent px-3 text-sm outline-none placeholder:text-zinc-500 focus:border-white focus:ring-1 focus:ring-white" />
                <input value={form.displayName} onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))} placeholder="Display Name" className="h-10 rounded-md border border-zinc-800 bg-transparent px-3 text-sm outline-none placeholder:text-zinc-500 focus:border-white focus:ring-1 focus:ring-white" />
                <input value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} placeholder="Email" type="email" className="h-10 rounded-md border border-zinc-800 bg-transparent px-3 text-sm outline-none placeholder:text-zinc-500 focus:border-white focus:ring-1 focus:ring-white" />
                <input value={form.commissionRate} onChange={(event) => setForm((current) => ({ ...current, commissionRate: event.target.value }))} placeholder="0.2000" className="h-10 rounded-md border border-zinc-800 bg-transparent px-3 text-sm outline-none placeholder:text-zinc-500 focus:border-white focus:ring-1 focus:ring-white" />
              </div>
              <button disabled={creating || !adminToken.trim()} className="mt-4 inline-flex h-9 items-center gap-2 rounded-md bg-white px-4 text-sm font-medium text-black shadow disabled:opacity-50 hover:bg-zinc-200 transition-colors">
                {creating ? <Loader2 className="size-4 animate-spin" /> : <Plus size={16} />}
                Save affiliate
              </button>
            </form>
          </div>

          <div className="col-span-3 rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-medium">Admin Token</h3>
            <input
              value={adminToken}
              onChange={(event) => setAdminToken(event.target.value)}
              type="password"
              placeholder="Paste AFFILIATE_ADMIN_TOKEN"
              className="h-10 w-full rounded-md border border-zinc-800 bg-transparent px-3 text-sm outline-none placeholder:text-zinc-500 focus:border-white focus:ring-1 focus:ring-white"
            />
            <p className="mt-3 text-sm text-zinc-500">Stored only in local storage.</p>
          </div>
        </section>

        {error && <div className="mb-8 rounded-lg border border-red-900/50 bg-red-950/20 p-4 text-sm font-medium text-red-500">{error}</div>}
        {notice && <div className="mb-8 rounded-lg border border-emerald-900/50 bg-emerald-950/20 p-4 text-sm font-medium text-emerald-500">{notice}</div>}

        {totals && (
          <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-8">
            <Metric label="Total Affiliates" value={totals.affiliates.toString()} />
            <Metric label="Clicks" value={totals.clicks.toString()} />
            <Metric label="Checkout Intents" value={totals.checkoutIntents.toString()} />
            <Metric label="Conversions" value={totals.conversions.toString()} />
            <Metric label="Pending Commission" value={`$${totals.pending}`} />
          </section>
        )}

        {snapshot && (
          <div className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <Panel title="Creators" count={snapshot.affiliates.length}>
                <ScrollTable headers={["Creator", "Email", "Rate", "Status", "Joined", "Link"]}>
                  {snapshot.affiliates.length === 0 ? (
                    <EmptyRow colSpan={6} />
                  ) : (
                    snapshot.affiliates.map((affiliate) => (
                      <tr key={affiliate.id} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-900/40">
                        <td className="px-3 py-3">
                          <div className="font-medium text-white">{affiliate.displayName}</div>
                          <div className="text-xs text-zinc-500 mt-0.5">{affiliate.code}</div>
                        </td>
                        <td className="px-3 py-3 text-zinc-400">{affiliate.email || "No email"}</td>
                        <td className="px-3 py-3 text-zinc-300">{Number(affiliate.commissionRate) * 100}%</td>
                        <td className="px-3 py-3"><StatusBadge status={affiliate.status} /></td>
                        <td className="px-3 py-3 whitespace-nowrap text-zinc-400">{formatDateTime(affiliate.createdAt)}</td>
                        <td className="px-3 py-3">
                          <button onClick={() => copyLink(affiliate.code)} className="inline-flex items-center gap-2 rounded-md border border-zinc-700 bg-transparent px-3 py-1.5 text-sm font-medium hover:bg-zinc-800 text-white transition-colors">
                            <Copy size={14} />
                            Copy
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </ScrollTable>
              </Panel>

              <Panel title="Payout totals" count={snapshot.payoutTotals.length}>
                <div className="max-h-[440px] space-y-3 overflow-auto pr-1">
                  {snapshot.payoutTotals.length === 0 ? (
                    <p className="text-sm text-zinc-500">No payout activity yet.</p>
                  ) : (
                    snapshot.payoutTotals.map((row) => (
                      <div key={row.affiliateId} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
                        <div className="font-medium">{row.affiliateCode}</div>
                        <div className="flex gap-6 text-sm">
                          <MiniStat label="Pending" value={`$${row.pendingCommission}`} />
                          <MiniStat label="Approved" value={`$${row.approvedCommission}`} />
                          <MiniStat label="Paid" value={`$${row.paidCommission}`} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Panel>
            </div>

            <Panel title="Conversions" count={snapshot.conversions.length}>
              <ScrollTable headers={["Creator", "Plan", "Buyer", "Order ID", "Amount", "Commission", "Status", "Date & time", ""]}>
                {snapshot.conversions.length === 0 ? (
                  <EmptyRow colSpan={9} />
                ) : (
                  snapshot.conversions.map((conversion) => (
                    <tr key={conversion.id} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-900/40">
                      <td className="px-3 py-3 font-medium text-white">{conversion.affiliateCode}</td>
                      <td className="px-3 py-3 text-zinc-300">{conversion.plan}</td>
                      <td className="px-3 py-3 text-zinc-400">{conversion.buyerEmail || "—"}</td>
                      <td className="px-3 py-3 font-mono text-xs text-zinc-400">{conversion.sellauthOrderId || "—"}</td>
                      <td className="px-3 py-3 text-zinc-300">${conversion.amount}</td>
                      <td className="px-3 py-3 text-zinc-300">${conversion.commissionAmount}</td>
                      <td className="px-3 py-3"><StatusBadge status={conversion.status} /></td>
                      <td className="px-3 py-3 whitespace-nowrap text-zinc-400">{formatDateTime(conversion.createdAt)}</td>
                      <td className="px-3 py-3 text-right">
                        {conversion.status === "pending" ? (
                          <button disabled={updatingConversionId === conversion.id} onClick={() => updateConversion(conversion.id, "approved")} className="rounded-md border border-emerald-800 px-2 py-1 text-[11px] font-semibold text-emerald-400 disabled:opacity-50">Approve</button>
                        ) : conversion.status === "approved" ? (
                          <button disabled={updatingConversionId === conversion.id} onClick={() => updateConversion(conversion.id, "paid")} className="rounded-md border border-[#8b78ee]/60 px-2 py-1 text-[11px] font-semibold text-[#b9adff] disabled:opacity-50">Mark paid</button>
                        ) : null}
                      </td>
                    </tr>
                  ))
                )}
              </ScrollTable>
            </Panel>

            <Panel title="Checkout intents" count={snapshot.checkoutIntents.length}>
              <ScrollTable headers={["Creator", "Plan", "Product", "Visitor", "Date & time"]}>
                {snapshot.checkoutIntents.length === 0 ? (
                  <EmptyRow colSpan={5} />
                ) : (
                  snapshot.checkoutIntents.map((intent) => (
                    <tr key={intent.id} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-900/40">
                      <td className="px-3 py-3 font-medium text-white">{intent.affiliateCode}</td>
                      <td className="px-3 py-3 text-zinc-300">{intent.plan}</td>
                      <td className="px-3 py-3 text-zinc-400">{intent.productId || "—"}</td>
                      <td className="px-3 py-3 font-mono text-xs text-zinc-500" title={intent.visitorId}>{intent.visitorId}</td>
                      <td className="px-3 py-3 whitespace-nowrap text-zinc-400">{formatDateTime(intent.createdAt)}</td>
                    </tr>
                  ))
                )}
              </ScrollTable>
            </Panel>

            <Panel title="Clicks" count={snapshot.clicks.length}>
              <ScrollTable headers={["Creator", "Source", "Landing path", "Visitor", "Date & time"]}>
                {snapshot.clicks.length === 0 ? (
                  <EmptyRow colSpan={5} />
                ) : (
                  snapshot.clicks.map((click) => (
                    <tr key={click.id} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-900/40">
                      <td className="px-3 py-3 font-medium text-white">{click.affiliateCode}</td>
                      <td className="px-3 py-3 text-zinc-300">{click.source || "direct"}</td>
                      <td className="px-3 py-3 text-zinc-400 [overflow-wrap:anywhere]">{click.landingPath}</td>
                      <td className="px-3 py-3 font-mono text-xs text-zinc-500" title={click.visitorId}>{click.visitorId}</td>
                      <td className="px-3 py-3 whitespace-nowrap text-zinc-400">{formatDateTime(click.createdAt)}</td>
                    </tr>
                  ))
                )}
              </ScrollTable>
            </Panel>
          </div>
        )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-sm">
      <h3 className="text-sm font-medium tracking-tight text-zinc-400">{label}</h3>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}

function Panel({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-sm">
      <div className="flex items-center gap-2 p-6 pb-4">
        <h3 className="text-lg font-medium">{title}</h3>
        {typeof count === "number" && (
          <span className="rounded-md bg-zinc-900 px-2 py-0.5 text-xs font-semibold text-zinc-400">{count}</span>
        )}
      </div>
      <div className="p-6 pt-0">{children}</div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-right">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="font-medium mt-0.5">{value}</div>
    </div>
  );
}

function ScrollTable({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <div className="max-h-[440px] overflow-auto rounded-lg border border-zinc-800">
      <table className="w-full text-sm">
        <thead className="sticky top-0 z-10 bg-zinc-950">
          <tr className="border-b border-zinc-800 text-left text-zinc-400">
            {headers.map((header, index) => (
              <th key={header || `col-${index}`} className="whitespace-nowrap px-3 py-2.5 font-medium">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function EmptyRow({ colSpan }: { colSpan: number }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-3 py-6 text-center text-sm text-zinc-500">No activity yet.</td>
    </tr>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    paid: "border-[#8b78ee]/50 bg-[#8b78ee]/10 text-[#b9adff]",
    approved: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    pending: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    rejected: "border-red-500/30 bg-red-500/10 text-red-300",
    active: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    disabled: "border-zinc-700 bg-zinc-900 text-zinc-400",
  };
  const className = styles[status] || "border-zinc-700 bg-zinc-900 text-zinc-400";
  return <span className={`inline-block whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize ${className}`}>{status}</span>;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
