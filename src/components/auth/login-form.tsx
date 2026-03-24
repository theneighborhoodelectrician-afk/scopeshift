"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";

type LoginState = {
  email: string;
  password: string;
};

const initialState: LoginState = {
  email: "",
  password: ""
};

const inputClassName =
  "w-full rounded-2xl border border-slate/15 bg-mist px-4 py-3 text-ink outline-none transition focus:border-ember/40 focus:bg-white focus:ring-2 focus:ring-ember/10";

export function LoginForm() {
  const router = useRouter();
  const [form, setForm] = useState<LoginState>(initialState);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Unable to log in.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      alternateHref="/signup"
      alternateLabel="Create account"
      alternateText="Need an account?"
      description="Log in to resume training, review recent sessions, and keep building your score history."
      eyebrow="Welcome Back"
      title="Log in to ScopeShift"
    >
      <div className="rounded-2xl bg-mist p-4 text-sm leading-6 text-slate">
        <p className="font-semibold text-ink">Back in the field</p>
        <p className="mt-1">Pick up where you left off and keep building better discovery, education, and close skills.</p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <label className="space-y-2 text-sm text-slate">
          <span className="font-medium text-ink">Email</span>
          <input
            required
            type="email"
            className={inputClassName}
            placeholder="you@company.com"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          />
        </label>

        <label className="space-y-2 text-sm text-slate">
          <span className="font-medium text-ink">Password</span>
          <input
            required
            type="password"
            minLength={8}
            className={inputClassName}
            placeholder="Enter your password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
          />
        </label>

        {error ? <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

        <Button className="w-full bg-ember hover:bg-[#a75614]" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Logging in..." : "Log in and continue training"}
        </Button>
      </form>
    </AuthShell>
  );
}
