"use client";

import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/types/auth";

type QuickLink = {
  href: Route;
  label: string;
};

const quickLinks: QuickLink[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/practice", label: "Practice" },
  { href: "/practice/random", label: "Start Training" },
  { href: "/sessions", label: "Sessions" }
];

export function Topbar({ user }: { user: SessionUser }) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const firstName = user.firstName?.trim() || "Technician";

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (response.ok === false) {
        throw new Error("Logout failed");
      }

      router.push("/login");
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <div className="space-y-4 rounded-[2rem] border border-white/70 bg-white/90 px-5 py-5 shadow-panel">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">Workspace</p>
          <h1 className="mt-2 text-2xl font-semibold text-ink">Welcome back, {firstName}</h1>
          <p className="mt-1 text-sm leading-6 text-slate">Move between training, progress, and review without losing your place.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/practice/random">
            <Button className="bg-emerald-700 hover:bg-emerald-800">Start Training</Button>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={cn(
              "inline-flex items-center justify-center rounded-full border border-slate/15 px-5 py-3 text-sm font-semibold text-ink transition hover:bg-mist",
              isLoggingOut && "cursor-not-allowed opacity-60"
            )}
          >
            {isLoggingOut ? "Signing Out" : "Log Out"}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-full border border-slate/15 bg-mist/70 px-4 py-2 text-sm font-medium text-slate transition hover:bg-mist hover:text-ink"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
