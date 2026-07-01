"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Clipboard, Loader2, RefreshCcw, Save, Search, Ticket } from "lucide-react";
import { RpWalletApiClient, type SupportTicket, type SupportTicketStatus } from "@rp-wallet/api-client";
import { HUB_API_BASE_URL } from "@/lib/api-base-url";

const ADMIN_TOKEN_KEY = "rp_affiliate_admin_token";

const statusOptions: Array<{ value: SupportTicketStatus; label: string }> = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const typeLabels = {
  did_not_receive_key: "Key not received",
  bug: "Bug",
} satisfies Record<SupportTicket["type"], string>;

export default function AdminTicketsPage() {
  const api = useMemo(() => new RpWalletApiClient(HUB_API_BASE_URL), []);
  const [adminToken, setAdminToken] = useState("");
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | SupportTicketStatus>("all");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [draftStatus, setDraftStatus] = useState<SupportTicketStatus>("open");
  const [draftNotes, setDraftNotes] = useState("");

  useEffect(() => {
    const stored = window.localStorage.getItem(ADMIN_TOKEN_KEY) || "";
    if (stored) setAdminToken(stored);
  }, []);

  const selectedTicket = tickets.find((ticket) => ticket.id === selectedId) || tickets[0];

  useEffect(() => {
    if (!selectedTicket) return;
    setSelectedId(selectedTicket.id);
    setDraftStatus(selectedTicket.status);
    setDraftNotes(selectedTicket.adminNotes || "");
  }, [selectedTicket?.id]);

  const filteredTickets = tickets.filter((ticket) => {
    if (statusFilter !== "all" && ticket.status !== statusFilter) return false;
    const haystack = [
      ticket.id,
      ticket.email,
      ticket.subject,
      ticket.message,
      ticket.orderId,
      ticket.providerPaymentId,
      ticket.transactionHash,
    ].join(" ").toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  });

  const counts = {
    open: tickets.filter((ticket) => ticket.status === "open").length,
    inProgress: tickets.filter((ticket) => ticket.status === "in_progress").length,
    resolved: tickets.filter((ticket) => ticket.status === "resolved").length,
  };

  async function loadTickets() {
    setLoading(true);
    setError("");
    setNotice("");

    try {
      window.localStorage.setItem(ADMIN_TOKEN_KEY, adminToken.trim());
      const response = await api.getAdminSupportTickets(adminToken.trim());
      setTickets(response.tickets);
      setSelectedId((current) => current && response.tickets.some((ticket) => ticket.id === current) ? current : response.tickets[0]?.id || null);
      setNotice(`Loaded ${response.tickets.length} ticket${response.tickets.length === 1 ? "" : "s"}.`);
    } catch {
      setError("Unable to load tickets. Check the admin token and API deployment.");
    } finally {
      setLoading(false);
    }
  }

  async function saveTicket() {
    if (!selectedTicket) return;
    setSaving(true);
    setError("");
    setNotice("");

    try {
      window.localStorage.setItem(ADMIN_TOKEN_KEY, adminToken.trim());
      const response = await api.updateAdminSupportTicket(adminToken.trim(), selectedTicket.id, {
        status: draftStatus,
        adminNotes: draftNotes,
      });
      setTickets((current) => current.map((ticket) => ticket.id === response.ticket.id ? response.ticket : ticket));
      setNotice("Ticket updated.");
    } catch {
      setError("Unable to update ticket. Check the admin token and try again.");
    } finally {
      setSaving(false);
    }
  }

  async function copyLookupDetails(ticket: SupportTicket) {
    await navigator.clipboard.writeText([
      `Ticket: ${ticket.id}`,
      `Email: ${ticket.email}`,
      `Order ID: ${ticket.orderId || "-"}`,
      `Payment ID: ${ticket.providerPaymentId || "-"}`,
      `Transaction hash: ${ticket.transactionHash || "-"}`,
      `Currency: ${ticket.paymentCurrency || "-"}`,
      `Amount: ${ticket.amount || "-"}`,
    ].join("\n"));
    setNotice("Lookup details copied.");
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-6 md:p-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight">
            <Ticket className="h-8 w-8 text-[#9c8df6]" />
            Support Tickets
          </h1>
          <p className="mt-2 text-zinc-400">Review missing-key reports, NOWPayments lookup details, and bug submissions.</p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <Stat label="Open" value={counts.open} />
          <Stat label="In progress" value={counts.inProgress} />
          <Stat label="Resolved" value={counts.resolved} />
        </div>
      </header>

      <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <input
            value={adminToken}
            onChange={(event) => setAdminToken(event.target.value)}
            type="password"
            placeholder="Admin token"
            className="h-10 rounded-md border border-zinc-800 bg-black px-3 text-sm outline-none focus:border-white"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
            className="h-10 rounded-md border border-zinc-800 bg-black px-3 text-sm outline-none focus:border-white"
          >
            <option value="all">All statuses</option>
            {statusOptions.map((entry) => <option key={entry.value} value={entry.value}>{entry.label}</option>)}
          </select>
          <button
            onClick={loadTickets}
            disabled={loading}
            className="flex h-10 items-center justify-center gap-2 rounded-md bg-white px-4 text-sm font-semibold text-black disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
            Load
          </button>
        </div>
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search email, order id, payment id, hash, or message"
            className="h-10 w-full rounded-md border border-zinc-800 bg-black pl-9 pr-3 text-sm outline-none focus:border-white"
          />
        </div>
        {notice && <p className="mt-3 flex items-center gap-2 text-sm text-emerald-400"><CheckCircle2 className="h-4 w-4" />{notice}</p>}
        {error && <p className="mt-3 flex items-center gap-2 text-sm text-red-400"><AlertCircle className="h-4 w-4" />{error}</p>}
      </section>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <section className="min-h-[520px] rounded-xl border border-zinc-800 bg-zinc-950">
          <div className="border-b border-zinc-800 p-4 text-sm font-semibold text-zinc-300">
            {filteredTickets.length} ticket{filteredTickets.length === 1 ? "" : "s"}
          </div>
          <div className="max-h-[640px] overflow-y-auto">
            {filteredTickets.map((ticket) => (
              <button
                key={ticket.id}
                type="button"
                onClick={() => setSelectedId(ticket.id)}
                className={`w-full border-b border-zinc-900 p-4 text-left transition hover:bg-zinc-900/70 ${selectedTicket?.id === ticket.id ? "bg-zinc-900" : ""}`}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-white">{ticket.subject}</span>
                  <StatusBadge status={ticket.status} />
                </div>
                <p className="text-xs text-zinc-500">{typeLabels[ticket.type]} • {ticket.email}</p>
                <p className="mt-2 line-clamp-2 text-sm text-zinc-400">{ticket.message}</p>
                <p className="mt-2 text-xs text-zinc-600">{formatDate(ticket.createdAt)}</p>
              </button>
            ))}
            {filteredTickets.length === 0 && (
              <p className="p-6 text-sm text-zinc-500">No tickets match this view.</p>
            )}
          </div>
        </section>

        <section className="min-h-[520px] rounded-xl border border-zinc-800 bg-zinc-950 p-5">
          {selectedTicket ? (
            <div className="space-y-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm text-zinc-500">{selectedTicket.id}</p>
                  <h2 className="mt-1 text-2xl font-semibold">{selectedTicket.subject}</h2>
                  <p className="mt-2 text-sm text-zinc-400">{typeLabels[selectedTicket.type]} from {selectedTicket.email}</p>
                </div>
                <button
                  onClick={() => copyLookupDetails(selectedTicket)}
                  className="flex h-10 items-center justify-center gap-2 rounded-md border border-zinc-800 px-3 text-sm text-zinc-300 hover:text-white"
                >
                  <Clipboard className="h-4 w-4" />
                  Copy lookup
                </button>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <Detail label="Order ID" value={selectedTicket.orderId} />
                <Detail label="Payment ID" value={selectedTicket.providerPaymentId} />
                <Detail label="Transaction hash" value={selectedTicket.transactionHash} wide />
                <Detail label="Currency" value={selectedTicket.paymentCurrency} />
                <Detail label="Amount" value={selectedTicket.amount} />
                <Detail label="Provider" value={selectedTicket.provider} />
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold text-zinc-300">Customer message</h3>
                <div className="whitespace-pre-wrap rounded-lg border border-zinc-800 bg-black p-4 text-sm leading-6 text-zinc-200">
                  {selectedTicket.message}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-[220px_1fr]">
                <label className="flex flex-col gap-2 text-sm font-medium text-zinc-300">
                  Status
                  <select
                    value={draftStatus}
                    onChange={(event) => setDraftStatus(event.target.value as SupportTicketStatus)}
                    className="h-10 rounded-md border border-zinc-800 bg-black px-3 text-sm outline-none focus:border-white"
                  >
                    {statusOptions.map((entry) => <option key={entry.value} value={entry.value}>{entry.label}</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium text-zinc-300">
                  Admin notes
                  <textarea
                    value={draftNotes}
                    onChange={(event) => setDraftNotes(event.target.value)}
                    rows={5}
                    placeholder="Internal notes, lookup result, resend status..."
                    className="resize-none rounded-md border border-zinc-800 bg-black px-3 py-3 text-sm outline-none placeholder:text-zinc-600 focus:border-white"
                  />
                </label>
              </div>

              <button
                onClick={saveTicket}
                disabled={saving}
                className="flex h-10 items-center justify-center gap-2 rounded-md bg-[#8b5cf6] px-4 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save ticket
              </button>
            </div>
          ) : (
            <div className="flex h-full min-h-[440px] items-center justify-center text-sm text-zinc-500">
              Load tickets to inspect submissions.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-center">
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs text-zinc-500">{label}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: SupportTicketStatus }) {
  const className = status === "open"
    ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
    : status === "in_progress"
      ? "border-sky-500/30 bg-sky-500/10 text-sky-300"
      : status === "resolved"
        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
        : "border-zinc-700 bg-zinc-900 text-zinc-400";
  return <span className={`shrink-0 rounded-full border px-2 py-1 text-[11px] font-semibold ${className}`}>{status.replace("_", " ")}</span>;
}

function Detail({ label, value, wide = false }: { label: string; value?: string; wide?: boolean }) {
  return (
    <div className={`rounded-lg border border-zinc-800 bg-black p-3 ${wide ? "md:col-span-2 xl:col-span-1" : ""}`}>
      <p className="mb-1 text-xs text-zinc-500">{label}</p>
      <p className="break-all text-sm text-zinc-200">{value || "-"}</p>
    </div>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
