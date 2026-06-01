"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Copy, Loader2, Plus, RefreshCcw, ShieldCheck } from "lucide-react";
import { RpWalletApiClient } from "@rp-wallet/api-client";

const ADMIN_TOKEN_KEY = "rp_affiliate_admin_token";

type Snapshot = Awaited<ReturnType<RpWalletApiClient["getAffiliateAdminSnapshot"]>>;

export default function AffiliateAdminPage() {
  const api = useMemo(() => new RpWalletApiClient(process.env.NEXT_PUBLIC_API_BASE_URL), []);
  const [adminToken, setAdminToken] = useState("");
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
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
    await navigator.clipboard.writeText(`https://larperwallet.com/?ref=${code}`);
    setNotice(`Copied referral link for ${code}.`);
  }

  const totals = snapshot
    ? {
        affiliates: snapshot.affiliates.length,
        clicks: snapshot.clicks.length,
        conversions: snapshot.conversions.length,
        pending: snapshot.payoutTotals.reduce((sum, row) => sum + Number(row.pendingCommission), 0).toFixed(2),
      }
    : null;

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Top Nav */}
      <div className="border-b border-zinc-800">
        <div className="flex h-16 items-center px-4 md:px-8">
          <div className="flex items-center gap-2 font-bold text-lg">
            <ShieldCheck className="h-6 w-6" />
            LarperWallet Admin
          </div>
          <nav className="flex items-center space-x-6 ml-6">
            <Link href="/" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Hub</Link>
            <Link href="#" className="text-sm font-medium text-white transition-colors">Affiliates</Link>
            <Link href="#" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Settings</Link>
          </nav>
          <div className="ml-auto flex items-center space-x-4">
            <div className="h-8 w-8 rounded-full bg-zinc-800 border border-zinc-700" />
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-4 p-8 pt-6 mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between space-y-2 mb-8">
          <h2 className="text-3xl font-bold tracking-tight">Affiliate Dashboard</h2>
          <div className="flex items-center space-x-2">
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
          <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Metric label="Total Affiliates" value={totals.affiliates.toString()} />
            <Metric label="Recent Clicks" value={totals.clicks.toString()} />
            <Metric label="Conversions" value={totals.conversions.toString()} />
            <Metric label="Pending Commission" value={`$${totals.pending}`} />
          </section>
        )}

        {snapshot && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* Left large col */}
            <div className="col-span-4 space-y-4">
              <Panel title="Creators">
                <div className="overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-800 text-left text-zinc-400">
                        <th className="pb-3 pr-3 font-medium">Creator</th>
                        <th className="pb-3 pr-3 font-medium">Email</th>
                        <th className="pb-3 pr-3 font-medium">Rate</th>
                        <th className="pb-3 pr-3 font-medium">Link</th>
                      </tr>
                    </thead>
                    <tbody>
                      {snapshot.affiliates.map((affiliate) => (
                        <tr key={affiliate.id} className="border-b border-zinc-800/50 last:border-0">
                          <td className="py-4 pr-3">
                            <div className="font-medium text-white">{affiliate.displayName}</div>
                            <div className="text-xs text-zinc-500 mt-0.5">{affiliate.code}</div>
                          </td>
                          <td className="py-4 pr-3 text-zinc-400">{affiliate.email || "No email"}</td>
                          <td className="py-4 pr-3">{Number(affiliate.commissionRate) * 100}%</td>
                          <td className="py-4 pr-3">
                            <button onClick={() => copyLink(affiliate.code)} className="inline-flex items-center gap-2 rounded-md border border-zinc-700 bg-transparent px-3 py-1.5 font-medium hover:bg-zinc-800 text-white transition-colors">
                              <Copy size={14} />
                              Copy
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>

              <Panel title="Payout totals">
                <div className="space-y-4">
                  {snapshot.payoutTotals.map((row) => (
                    <div key={row.affiliateId} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
                      <div className="font-medium">{row.affiliateCode}</div>
                      <div className="flex gap-6 text-sm">
                        <MiniStat label="Pending" value={`$${row.pendingCommission}`} />
                        <MiniStat label="Approved" value={`$${row.approvedCommission}`} />
                        <MiniStat label="Paid" value={`$${row.paidCommission}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>

            {/* Right smaller col */}
            <div className="col-span-3 space-y-4">
              <Panel title="Recent conversions">
                <ActivityTable rows={snapshot.conversions.map((conversion) => ({
                  id: conversion.id,
                  title: `${conversion.affiliateCode} · ${conversion.plan}`,
                  detail: `${conversion.status} · $${conversion.commissionAmount} commission`,
                  date: conversion.createdAt,
                }))} />
              </Panel>

              <Panel title="Recent clicks">
                <ActivityTable rows={snapshot.clicks.map((click) => ({
                  id: click.id,
                  title: `${click.affiliateCode} · ${click.source || "direct"}`,
                  detail: click.landingPath,
                  date: click.createdAt,
                }))} />
              </Panel>
            </div>
          </div>
        )}
      </div>
    </main>
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

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 shadow-sm">
      <div className="p-6">
        <h3 className="text-lg font-medium">{title}</h3>
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

function ActivityTable({ rows }: { rows: Array<{ id: string; title: string; detail: string; date: string }> }) {
  if (rows.length === 0) return <p className="text-sm text-zinc-500">No activity yet.</p>;
  return (
    <div className="space-y-6">
      {rows.slice(0, 12).map((row) => (
        <div key={row.id} className="flex items-center">
          <div className="ml-0 space-y-1">
            <p className="text-sm font-medium leading-none">{row.title}</p>
            <p className="text-sm text-zinc-500">{row.detail}</p>
          </div>
          <div className="ml-auto font-medium text-xs text-zinc-500">
            {new Date(row.date).toLocaleDateString()}
          </div>
        </div>
      ))}
    </div>
  );
}
