import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import type { SessionUser } from "@/types/auth";

export function AppShell({ children, user }: { children: ReactNode; user: SessionUser }) {
  return (
    <div className="min-h-screen">
      <div className="grid gap-6 lg:grid-cols-[280px_1fr] lg:items-start">
        <Sidebar user={user} />
        <div className="space-y-6">
          <Topbar user={user} />
          {children}
        </div>
      </div>
    </div>
  );
}
