"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, DollarSign, LogOut, MousePointerClick, ReceiptText, RefreshCcw, Send } from "lucide-react";
import { createApiClient } from "../../lib/api";
import { formatCurrency, formatDate } from "../../lib/utils";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";

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
        <RefreshCcw className="size-8 animate-spin text-muted-foreground" />
      </main>
    );
  }

  if (!dashboard) return null;

  return (
    <div className="flex min-h-screen w-full flex-col md:flex-row bg-background">
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-b md:border-r border-border bg-card flex flex-col shrink-0">
        <div className="p-6">
          <Badge className="mb-3 bg-primary text-primary-foreground">Affiliate Portal</Badge>
          <div className="text-xl font-bold text-foreground">LarperWallet</div>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          <div className="flex items-center gap-3 px-3 py-2 bg-primary/10 text-primary rounded-md font-medium text-sm">
            <MousePointerClick className="size-4" />
            Overview
          </div>
        </nav>

        <div className="p-6 border-t border-border">
          <div className="mb-4 space-y-1">
            <p className="text-sm font-medium text-foreground">{dashboard.affiliate.displayName}</p>
            <p className="text-xs text-muted-foreground">Code: <span className="text-foreground">{dashboard.affiliate.code}</span></p>
            <p className="text-xs text-muted-foreground">Commission: <span className="text-foreground">{Number(dashboard.affiliate.commissionRate) * 100}%</span></p>
          </div>
          <Button variant="outline" className="w-full justify-start text-muted-foreground hover:text-foreground" onClick={logout}>
            <LogOut className="mr-2 size-4" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-4 sm:p-6 md:p-8 space-y-8 max-w-6xl mx-auto">
          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
              <p className="text-muted-foreground mt-1">Welcome back, {dashboard.affiliate.displayName}.</p>
            </div>
          </header>

          {/* Referral Link */}
          <Card className="border-primary/20 shadow-lg shadow-primary/5">
            <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pb-4">
              <div>
                <CardTitle>Your Referral Link</CardTitle>
                <CardDescription>Share this on Instagram, TikTok, YouTube, or direct messages.</CardDescription>
              </div>
              <Button onClick={copyReferralUrl} className="shrink-0">
                <Copy className="mr-2 size-4" />
                {copied ? "Copied!" : "Copy link"}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="break-all rounded-md bg-muted/50 p-3 font-mono text-sm text-muted-foreground border border-border">
                {dashboard.referralUrl}
              </div>
            </CardContent>
          </Card>

          {/* Metrics */}
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard icon={<MousePointerClick className="size-5" />} label="Clicks" value={dashboard.stats.clicks.toString()} />
            <MetricCard icon={<Send className="size-5" />} label="Checkout starts" value={dashboard.stats.checkoutIntents.toString()} />
            <MetricCard icon={<ReceiptText className="size-5" />} label="Conversions" value={dashboard.stats.conversions.toString()} />
            <MetricCard icon={<DollarSign className="size-5" />} label="Pending comms" value={formatCurrency(dashboard.stats.pendingCommission)} />
          </section>

          {/* Tables */}
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
                        <TableCell colSpan={4} className="text-muted-foreground text-center py-6">No conversions yet.</TableCell>
                      </TableRow>
                    ) : (
                      dashboard.recentConversions.map((conversion) => (
                        <TableRow key={conversion.id}>
                          <TableCell>
                            <div className="font-medium">{conversion.plan}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{formatDate(conversion.createdAt)}</div>
                          </TableCell>
                          <TableCell><Badge variant="outline">{conversion.status}</Badge></TableCell>
                          <TableCell>{formatCurrency(conversion.amount)}</TableCell>
                          <TableCell className="font-medium text-primary">{formatCurrency(conversion.commissionAmount)}</TableCell>
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
                        <TableCell colSpan={3} className="text-muted-foreground text-center py-6">No clicks yet.</TableCell>
                      </TableRow>
                    ) : (
                      dashboard.recentClicks.map((click) => (
                        <TableRow key={click.id}>
                          <TableCell><Badge variant="secondary" className="capitalize">{click.source || "direct"}</Badge></TableCell>
                          <TableCell className="max-w-[180px] truncate">{click.landingPath}</TableCell>
                          <TableCell className="text-muted-foreground">{formatDate(click.createdAt)}</TableCell>
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
    </div>
  );
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardDescription>{label}</CardDescription>
        <div className="rounded-md border border-border bg-muted/50 p-2 text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold tracking-tight">{value}</div>
      </CardContent>
    </Card>
  );
}
