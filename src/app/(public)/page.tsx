import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function HomePage() {
  return (
    <main className="space-y-8">
      <Card className="overflow-hidden bg-ink text-white">
        <div className="grid gap-8 md:grid-cols-[1.5fr_1fr]">
          <div className="space-y-5">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-300">ScopeShift</p>
            <h1 className="max-w-3xl text-5xl font-semibold leading-tight">Turn service calls into solutions.</h1>
            <p className="max-w-2xl text-base text-slate-300">
              AI-powered role-play for residential service technicians, with realistic homeowners, live coaching, post-scenario scoring, and progress tracking.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/signup"><Button>Create Account</Button></Link>
              <Link href="/login"><Button className="bg-white text-ink hover:bg-mist">Log In</Button></Link>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-slate-300">
              <Link href="/practice/random" className="underline-offset-4 hover:underline">Start Training</Link>
              <Link href="/dashboard" className="underline-offset-4 hover:underline">View Dashboard</Link>
            </div>
          </div>
          <div className="rounded-3xl bg-white/10 p-6">
            <p className="text-sm text-slate-200">Modes</p>
            <div className="mt-4 space-y-3 text-sm text-white">
              <div className="rounded-2xl bg-white/10 p-3">Simulation Mode</div>
              <div className="rounded-2xl bg-white/10 p-3">Live Coach Mode</div>
              <div className="rounded-2xl bg-white/10 p-3">Replay Coach Mode</div>
            </div>
          </div>
        </div>
      </Card>
    </main>
  );
}
