"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/types/auth";

type NavLink = {
  href: Route;
  label: string;
  helper: string;
};

const primaryLinks: NavLink[] = [
  { href: "/dashboard", label: "Dashboard", helper: "Your progress and next rep" },
  { href: "/practice", label: "Practice", helper: "Jump into training modes" },
  { href: "/practice/random", label: "Random Scenario", helper: "Start a fresh conversation" },
  { href: "/sessions", label: "Sessions", helper: "Review recent scenario history" },
  { href: "/progress", label: "Progress", helper: "Track score movement" },
  { href: "/settings", label: "Settings", helper: "Account and preferences" }
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }

  return pathname === href || pathname.startsWith(href + "/");
}

export function Sidebar({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const firstName = user.firstName?.trim() || "Technician";

  return (
    <aside className="rounded-[2rem] border border-white/70 bg-white/90 p-5 shadow-panel lg:sticky lg:top-8">
      <div className="rounded-[1.5rem] bg-ink px-5 py-5 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-ember">ScopeShift</p>
        <h2 className="mt-3 text-2xl font-semibold leading-tight">Conversation-first training for real service calls</h2>
        <p className="mt-3 text-sm leading-6 text-white/75">Pick up a new scenario fast, then come back here to review your progress.</p>
      </div>

      <div className="mt-5 rounded-[1.5rem] border border-mist bg-mist/70 px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">Signed in</p>
        <p className="mt-2 text-lg font-semibold text-ink">{firstName}</p>
        <p className="text-sm text-slate">{user.email}</p>
      </div>

      <nav className="mt-5 space-y-2" aria-label="Primary navigation">
        {primaryLinks.map((link) => {
          const active = isActive(pathname, link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "block rounded-[1.4rem] border px-4 py-3 transition",
                active
                  ? "border-ember/20 bg-ember/10 shadow-sm"
                  : "border-transparent bg-white/50 hover:border-white hover:bg-white"
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-ink">{link.label}</span>
                <span
                  className={cn(
                    "h-2.5 w-2.5 rounded-full transition",
                    active ? "bg-emerald-600" : "bg-slate/20"
                  )}
                />
              </div>
              <p className="mt-1 text-sm leading-5 text-slate">{link.helper}</p>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
