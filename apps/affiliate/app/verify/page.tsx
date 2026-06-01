"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, TriangleAlert } from "lucide-react";
import { createApiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function VerifyPage() {
  return (
    <Suspense fallback={<VerifyShell status="Checking your login link..." />}>
      <VerifyContent />
    </Suspense>
  );
}

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setError("This login link is missing its token.");
      return;
    }

    createApiClient()
      .verifyAffiliateMagicLink({ token })
      .then(() => {
        router.replace("/dashboard");
      })
      .catch(() => {
        setError("This login link is invalid or expired. Request a fresh link and try again.");
      });
  }, [router, searchParams]);

  if (error) return <VerifyShell error={error} />;
  return <VerifyShell status="Signing you in..." />;
}

function VerifyShell({ error, status }: { error?: string; status?: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="items-center text-center">
          {error ? <TriangleAlert className="mb-2 size-8 text-red-500" /> : <Loader2 className="mb-2 size-8 animate-spin text-slate-900" />}
          <CardTitle>{error ? "Could not sign you in" : "Verifying link"}</CardTitle>
          <CardDescription>{error || status}</CardDescription>
        </CardHeader>
        {error && (
          <CardContent>
            <Link href="/">
              <Button className="w-full" variant="secondary">Request a new link</Button>
            </Link>
          </CardContent>
        )}
      </Card>
    </main>
  );
}
