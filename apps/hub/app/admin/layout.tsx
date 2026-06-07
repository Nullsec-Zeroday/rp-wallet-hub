"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  
  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans">
      {/* Top Nav */}
      <div className="border-b border-zinc-800 bg-black sticky top-0 z-50">
        <div className="flex h-16 items-center px-4 md:px-8 max-w-[1600px] mx-auto w-full">
          <div className="flex items-center gap-2 font-bold text-lg">
            <ShieldCheck className="h-6 w-6 text-white" />
            <span className="hidden sm:inline-block">RPWallet Admin</span>
          </div>
          <nav className="flex items-center space-x-6 ml-6 md:ml-10">
            <Link href="/" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
              Hub
            </Link>
            <Link 
              href="/admin/affiliates" 
              className={`text-sm font-medium transition-colors ${pathname.startsWith("/admin/affiliates") ? "text-white" : "text-zinc-400 hover:text-white"}`}
            >
              Affiliates
            </Link>
            <Link 
              href="/admin/keys" 
              className={`text-sm font-medium transition-colors ${pathname.startsWith("/admin/keys") ? "text-white" : "text-zinc-400 hover:text-white"}`}
            >
              Keys
            </Link>
          </nav>
          <div className="ml-auto flex items-center space-x-4">
            <div className="h-8 w-8 rounded-full bg-zinc-800 border border-zinc-700" />
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <main className="flex-1 w-full">
        {children}
      </main>
    </div>
  );
}
