"use client";

import { useState } from "react";
import { ArrowRight, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { createApiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function requestLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await createApiClient().requestAffiliateMagicLink({ email });
      setSent(true);
    } catch {
      setError("Unable to request a login link right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="space-y-8">
          <Badge className="w-fit gap-2 bg-white shadow-sm">
            <Sparkles className="size-3.5" />
            Creator revenue dashboard
          </Badge>
          <div className="max-w-2xl space-y-5">
            <h1 className="text-5xl font-semibold tracking-[-0.05em] text-slate-950 md:text-7xl">
              Your referrals, commissions, and payouts in one clean place.
            </h1>
            <p className="max-w-xl text-lg leading-8 text-slate-600">
              Sign in with your affiliate email to view your LarperWallet link performance. No passwords, no drama, no tiny goblin login form.
            </p>
          </div>
          <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
            {["Clicks", "Conversions", "Payout status"].map((item) => (
              <div key={item} className="rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm backdrop-blur">
                <ShieldCheck className="mb-3 size-5 text-slate-900" />
                {item}
              </div>
            ))}
          </div>
        </section>

        <Card className="border-slate-200/80 shadow-2xl shadow-slate-200/70">
          <CardHeader>
            <CardTitle className="text-2xl">Affiliate sign in</CardTitle>
            <CardDescription>Enter the email connected to your affiliate account.</CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm leading-6 text-emerald-900">
                Magic link sent if this email belongs to an active affiliate. Check your inbox and open the link within 15 minutes.
              </div>
            ) : (
              <form onSubmit={requestLink} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="pl-9"
                      placeholder="creator@example.com"
                    />
                  </div>
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <Button disabled={loading || !email.trim()} className="w-full">
                  {loading ? "Sending..." : "Send magic link"}
                  <ArrowRight className="size-4" />
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
