import Link from "next/link";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

const trainingMoments = [
  {
    label: "Discovery",
    detail: "Uncover why they called today, who decides, and what risk actually matters."
  },
  {
    label: "Education",
    detail: "Explain consequences in homeowner language instead of tool talk and trivia."
  },
  {
    label: "Commitment",
    detail: "Present clear options and confidently ask for the next step while trust is high."
  }
];

export function AuthShell({
  eyebrow,
  title,
  description,
  alternateHref,
  alternateLabel,
  alternateText,
  children
}: {
  eyebrow: string;
  title: string;
  description: string;
  alternateHref: "/login" | "/signup";
  alternateLabel: string;
  alternateText: string;
  children: ReactNode;
}) {
  return (
    <main className="grid min-h-[calc(100vh-4rem)] items-center gap-8 lg:grid-cols-[1.15fr_0.85fr]">
      <section className="relative overflow-hidden rounded-[2rem] bg-ink p-8 text-white shadow-panel lg:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.14),transparent_28%),radial-gradient(circle_at_20%_80%,rgba(22,93,74,0.28),transparent_30%),linear-gradient(135deg,rgba(201,106,27,0.18),transparent_42%)]" />
        <div className="relative space-y-10">
          <div className="flex flex-wrap gap-3">
            <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">
              {eyebrow}
            </span>
            <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/70">
              Metro Detroit Training
            </span>
          </div>

          <div className="space-y-5">
            <h1 className="max-w-2xl text-4xl font-semibold leading-[1.02] lg:text-6xl">
              Train technicians to lead better conversations, not just better repairs.
            </h1>
            <p className="max-w-xl text-base leading-7 text-slate-300 lg:text-lg">
              ScopeShift helps residential service teams turn simple service calls into complete professional solutions through discovery,
              consequence framing, structured options, and commitment questions.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {trainingMoments.map((item) => (
              <Card key={item.label} className="border-white/10 bg-white/8 p-5 text-white shadow-none backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">{item.label}</p>
                <p className="mt-3 text-sm leading-6 text-slate-200">{item.detail}</p>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-3xl border border-white/10 bg-white/8 p-6 backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">Built For The Field</p>
              <p className="mt-3 text-sm leading-7 text-slate-200">
                Every role-play is randomized across visible problem, hidden issue, homeowner personality, motivation, and objection style so reps do not just memorize a script.
              </p>
            </div>
            <div className="rounded-3xl bg-white p-6 text-ink">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ember">What Good Looks Like</p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate">
                <li>Build rapport before diagnosing motives.</li>
                <li>Teach consequences before reacting to price.</li>
                <li>Offer temporary, recommended, and long-term options.</li>
                <li>End with a real commitment question.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-ember">{eyebrow}</p>
          <h2 className="max-w-md text-3xl font-semibold leading-tight text-ink lg:text-4xl">{title}</h2>
          <p className="max-w-md text-sm leading-7 text-slate">{description}</p>
        </div>

        <Card className="space-y-6 border-white/70 bg-white/95 p-8 shadow-panel">{children}</Card>

        <div className="flex items-center justify-between rounded-2xl border border-slate/10 bg-white/70 px-5 py-4 text-sm text-slate">
          <p>
            {alternateText}{" "}
            <Link className="font-semibold text-ink underline decoration-ember/40 underline-offset-4" href={alternateHref}>
              {alternateLabel}
            </Link>
          </p>
          <span className="hidden rounded-full bg-mist px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate md:inline-flex">
            Role-play ready
          </span>
        </div>
      </section>
    </main>
  );
}
