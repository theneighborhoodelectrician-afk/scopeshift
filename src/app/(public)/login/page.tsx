import { Card } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <Card className="mx-auto max-w-xl space-y-4">
      <h1 className="text-3xl font-semibold">Login</h1>
      <p className="text-sm text-slate">Connect this form to `POST /api/auth/login`.</p>
    </Card>
  );
}
