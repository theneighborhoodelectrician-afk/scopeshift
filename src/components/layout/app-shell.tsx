import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen gap-6 lg:grid-cols-[260px_1fr]">
      <Sidebar />
      <div className="space-y-6">
        <Topbar />
        {children}
      </div>
    </div>
  );
}
