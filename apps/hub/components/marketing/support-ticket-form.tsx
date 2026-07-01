"use client";

import React, { useMemo, useState } from "react";
import { Bug, CheckCircle2, KeyRound, Loader2, Send, X } from "lucide-react";
import { RpWalletApiClient, type SupportTicketType } from "@rp-wallet/api-client";
import { HUB_API_BASE_URL } from "@/lib/api-base-url";

type SubmitState = "idle" | "submitting" | "submitted" | "error";

const ticketTypes: Array<{ id: SupportTicketType; label: string; icon: typeof KeyRound }> = [
  { id: "did_not_receive_key", label: "Key not received", icon: KeyRound },
  { id: "bug", label: "Bug report", icon: Bug },
];

export function SupportTicketForm({ defaultEmail = "" }: { defaultEmail?: string }) {
  const api = useMemo(() => new RpWalletApiClient(HUB_API_BASE_URL), []);
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<SupportTicketType>("did_not_receive_key");
  const [email, setEmail] = useState(defaultEmail);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [orderId, setOrderId] = useState("");
  const [providerPaymentId, setProviderPaymentId] = useState("");
  const [transactionHash, setTransactionHash] = useState("");
  const [paymentCurrency, setPaymentCurrency] = useState("");
  const [amount, setAmount] = useState("");
  const [state, setState] = useState<SubmitState>("idle");
  const [error, setError] = useState("");

  React.useEffect(() => {
    if (!email && defaultEmail) setEmail(defaultEmail);
  }, [defaultEmail, email]);

  async function submitTicket(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("submitting");
    setError("");

    try {
      const response = await api.createSupportTicket({
        type,
        email: email.trim(),
        subject: subject.trim() || undefined,
        message: message.trim(),
        orderId: type === "did_not_receive_key" ? orderId.trim() || undefined : undefined,
        providerPaymentId: type === "did_not_receive_key" ? providerPaymentId.trim() || undefined : undefined,
        transactionHash: type === "did_not_receive_key" ? transactionHash.trim() || undefined : undefined,
        paymentCurrency: type === "did_not_receive_key" ? paymentCurrency.trim() || undefined : undefined,
        amount: type === "did_not_receive_key" ? amount.trim() || undefined : undefined,
      });
      setState("submitted");
      setSubject("");
      setMessage("");
      setOrderId("");
      setProviderPaymentId("");
      setTransactionHash("");
      setPaymentCurrency("");
      setAmount("");
      setError(`Ticket ${response.ticket.id} submitted.`);
    } catch (submitError) {
      setState("error");
      setError(submitError instanceof Error ? submitError.message : "Unable to submit ticket.");
    }
  }

  const isSubmitting = state === "submitting";
  const isPaymentIssue = type === "did_not_receive_key";

  return (
    <>
      <div className="flex w-full justify-center">
        <div
          className="relative flex h-[68px] w-full max-w-[620px] items-center justify-between overflow-hidden rounded-full px-5 pl-7 backdrop-blur-xl md:h-[76px] md:px-6 md:pl-10"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.035) 50%, rgba(255,255,255,0.065) 100%)",
            border: "1px solid rgba(255,255,255,0.15)",
            boxShadow: [
              "inset 0 1px 1px rgba(255,255,255,0.2)",
              "inset 0 -1px 1px rgba(0,0,0,0.15)",
              "0 10px 24px rgba(0,0,0,0.34)",
              "0 0 0 0.5px rgba(255,255,255,0.08)",
              "0 0 25px rgba(171,159,242,0.12)",
            ].join(", "),
          }}
        >
          <span className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none" />
          <span className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.08] to-transparent pointer-events-none" />
          <span className="absolute inset-0 rounded-full bg-gradient-to-br from-white/[0.06] via-transparent to-white/[0.03] pointer-events-none" />
          <span className="relative z-10 min-w-0 pr-3 text-left text-[15px] font-semibold tracking-tight text-white/90 md:text-[22px]">
            Didn&apos;t receive your key?
          </span>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="relative z-10 flex h-11 shrink-0 items-center justify-center rounded-full px-5 text-sm font-bold text-white transition hover:scale-[1.02] active:scale-[0.97] md:h-14 md:px-9 md:text-[18px]"
            style={{
              background: "linear-gradient(135deg, rgba(139,92,246,0.95) 0%, rgba(124,58,237,0.98) 100%)",
              boxShadow: [
                "inset 0 1px 1px rgba(255,255,255,0.25)",
                "inset 0 -1px 1px rgba(0,0,0,0.16)",
                "0 8px 20px rgba(139,92,246,0.42)",
                "0 0 0 0.5px rgba(255,255,255,0.12)",
              ].join(", "),
            }}
          >
            Submit a ticket
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-md">
          <button
            type="button"
            aria-label="Close ticket form"
            className="absolute inset-0 cursor-default"
            onClick={() => setIsOpen(false)}
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="support-ticket-title"
            className="relative z-10 max-h-[92vh] w-full max-w-[680px] overflow-y-auto rounded-[2rem] border border-white/10 bg-[#101011]/95 p-5 text-white shadow-[0_30px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl md:p-6"
          >
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 id="support-ticket-title" className="text-lg font-semibold text-white">Submit ticket</h2>
                <p className="mt-1 text-sm text-white/45">Send checkout details or a bug report directly to admin.</p>
              </div>
              <div className="flex items-center gap-2">
                {state === "submitted" && <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-400" />}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/60 transition hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <form onSubmit={submitTicket} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {ticketTypes.map((entry) => {
                  const Icon = entry.icon;
                  const selected = type === entry.id;
                  return (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => setType(entry.id)}
                      className={`flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition ${selected ? "border-[#9c8df6]/60 bg-[#9c8df6]/20 text-white" : "border-white/10 bg-white/[0.03] text-white/55 hover:text-white"}`}
                    >
                      <Icon size={16} />
                      {entry.label}
                    </button>
                  );
                })}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-medium text-white/70">
                  Email
                  <input
                    required
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="h-11 rounded-xl border border-white/10 bg-black/20 px-3 text-white outline-none placeholder:text-white/25 focus:border-[#9c8df6]/60"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium text-white/70">
                  Subject
                  <input
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    placeholder={isPaymentIssue ? "License key not received" : "What broke?"}
                    className="h-11 rounded-xl border border-white/10 bg-black/20 px-3 text-white outline-none placeholder:text-white/25 focus:border-[#9c8df6]/60"
                  />
                </label>
              </div>

              {isPaymentIssue && (
                <div className="grid gap-3 md:grid-cols-2">
                  <TicketInput label="Order ID" value={orderId} onChange={setOrderId} placeholder="pay_..." />
                  <TicketInput label="NOWPayments payment ID" value={providerPaymentId} onChange={setProviderPaymentId} placeholder="Payment or invoice ID" />
                  <TicketInput label="Transaction hash" value={transactionHash} onChange={setTransactionHash} placeholder="Blockchain hash" />
                  <div className="grid grid-cols-2 gap-3">
                    <TicketInput label="Currency" value={paymentCurrency} onChange={setPaymentCurrency} placeholder="USDT" />
                    <TicketInput label="Amount" value={amount} onChange={setAmount} placeholder="14" />
                  </div>
                </div>
              )}

              <label className="flex flex-col gap-2 text-sm font-medium text-white/70">
                Details
                <textarea
                  required
                  minLength={10}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder={isPaymentIssue ? "Tell us when you paid and what email you expected the key on." : "What happened, what did you expect, and where did it happen?"}
                  rows={4}
                  className="resize-none rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-white outline-none placeholder:text-white/25 focus:border-[#9c8df6]/60"
                />
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#8b5cf6] text-sm font-bold text-white transition hover:bg-[#7c3aed] disabled:cursor-wait disabled:opacity-70"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {isSubmitting ? "Submitting..." : "Submit ticket"}
              </button>

              {error && (
                <p className={`text-center text-sm ${state === "submitted" ? "text-emerald-400" : "text-amber-400"}`}>
                  {error}
                </p>
              )}
            </form>
          </section>
        </div>
      )}
    </>
  );
}

function TicketInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-white/70">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 rounded-xl border border-white/10 bg-black/20 px-3 text-white outline-none placeholder:text-white/25 focus:border-[#9c8df6]/60"
      />
    </label>
  );
}
