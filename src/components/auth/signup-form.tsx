"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";

type SignupState = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
};

const initialState: SignupState = {
  first_name: "",
  last_name: "",
  email: "",
  password: ""
};

const inputClassName =
  "w-full rounded-2xl border border-slate/15 bg-mist px-4 py-3 text-ink outline-none transition focus:border-ember/40 focus:bg-white focus:ring-2 focus:ring-ember/10";

export function SignupForm() {
  const router = useRouter();
  const [form, setForm] = useState<SignupState>(initialState);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Unable to create account.");
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
      alternateHref="/login"
      alternateLabel="Log in"
      alternateText="Already have an account?"
      description="Create your technician account to start role-play training, real-time coaching, and score tracking."
      eyebrow="Get Started"
      title="Create your ScopeShift account"
    >
      <div className="rounded-2xl bg-mist p-4 text-sm leading-6 text-slate">
        <p className="font-semibold text-ink">Before your first scenario</p>
        <p className="mt-1">Set up your account and we will drop you into practice with a randomized homeowner conversation.</p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm text-slate">
            <span className="font-medium text-ink">First name</span>
            <input
              required
              className={inputClassName}
              placeholder="Nate"
              value={form.first_name}
              onChange={(event) => setForm((current) => ({ ...current, first_name: event.target.value }))}
            />
          </label>

          <label className="space-y-2 text-sm text-slate">
            <span className="font-medium text-ink">Last name</span>
            <input
              required
              className={inputClassName}
              placeholder="Anderson"
              value={form.last_name}
              onChange={(event) => setForm((current) => ({ ...current, last_name: event.target.value }))}
            />
          </label>
        </div>

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
            placeholder="At least 8 characters"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
          />
        </label>

        {error ? <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

        <Button className="w-full bg-ember hover:bg-[#a75614]" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Creating account..." : "Create account and start training"}
        </Button>
      </form>
    </AuthShell>
  );
}
