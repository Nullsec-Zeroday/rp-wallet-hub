"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, DollarSign, LogOut, MousePointerClick, ReceiptText, RefreshCcw, Send } from "lucide-react";
import { createApiClient } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Dashboard = Awaited<ReturnType<ReturnType<typeof createApiClient>["getAffiliateDashboard"]>>;

export default function DashboardClient() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    createApiClient()
      .getAffiliateDashboard()
      .then(setDashboard)
      .catch(() => router.replace("/"))
      .finally(() => setLoading(false));
  }, [router]);

  async function copyReferralUrl() {
    if (!dashboard) return;
    await navigator.clipboard.writeText(dashboard.referralUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  async function logout() {
    await createApiClient().logoutAffiliate().catch(() => undefined);
    router.replace("/");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <RefreshCcw className="size-8 animate-spin text-slate-500" />
      </main>
    );
  }

  if (!dashboard) return null;

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between">
          <div>
            <Badge className="mb-3 bg-slate-950 text-white">Affiliate Dashboard</Badge>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Welcome, {dashboard.affiliate.displayName}</h1>
            <p className="mt-1 text-sm text-slate-500">Code: {dashboard.affiliate.code} · Commission rate: {Number(dashboard.affiliate.commissionRate) * 100}%</p>
          </div>
          <Button variant="outline" onClick={logout}>
            <LogOut className="size-4" />
            Sign out
          </Button>
        </header>

        <Card>
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Your referral link</CardTitle>
              <CardDescription>Share this in Instagram, TikTok, YouTube, Safari, Chrome, or desktop browsers.</CardDescription>
            </div>
            <Button onClick={copyReferralUrl}>
              <Copy className="size-4" />
              {copied ? "Copied" : "Copy link"}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="break-all rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-sm text-slate-700">{dashboard.referralUrl}</div>
          </CardContent>
        </Card>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard icon={<MousePointerClick className="size-5" />} label="Clicks" value={dashboard.stats.clicks.toString()} />
          <MetricCard icon={<Send className="size-5" />} label="Checkout starts" value={dashboard.stats.checkoutIntents.toString()} />
          <MetricCard icon={<ReceiptText className="size-5" />} label="Conversions" value={dashboard.stats.conversions.toString()} />
          <MetricCard icon={<DollarSign className="size-5" />} label="Pending commission" value={formatCurrency(dashboard.stats.pendingCommission)} />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
          <Card>
            <CardHeader>
              <CardTitle>Recent conversions</CardTitle>
              <CardDescription>Paid orders attributed to your referral code.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sale</TableHead>
                    <TableHead>Commission</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboard.recentConversions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-slate-500">No conversions yet.</TableCell>
                    </TableRow>
                  ) : (
                    dashboard.recentConversions.map((conversion) => (
                      <TableRow key={conversion.id}>
                        <TableCell>
                          <div className="font-medium">{conversion.plan}</div>
                          <div className="text-xs text-slate-500">{formatDate(conversion.createdAt)}</div>
                        </TableCell>
                        <TableCell><Badge>{conversion.status}</Badge></TableCell>
                        <TableCell>{formatCurrency(conversion.amount)}</TableCell>
                        <TableCell>{formatCurrency(conversion.commissionAmount)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent clicks</CardTitle>
              <CardDescription>Latest tracked visits from your affiliate link.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source</TableHead>
                    <TableHead>Path</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboard.recentClicks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-slate-500">No clicks yet.</TableCell>
                    </TableRow>
                  ) : (
                    dashboard.recentClicks.map((click) => (
                      <TableRow key={click.id}>
                        <TableCell><Badge className="capitalize">{click.source || "direct"}</Badge></TableCell>
                        <TableCell className="max-w-[220px] truncate">{click.landingPath}</TableCell>
                        <TableCell>{formatDate(click.createdAt)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardDescription>{label}</CardDescription>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-2 text-slate-600">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold tracking-tight">{value}</div>
      </CardContent>
    </Card>
  );
}
