import { Card } from "@/components/ui/card";

export function FeedbackPanel({ title, items }: { title: string; items: string[] }) {
  return (
    <Card className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">{title}</p>
      <ul className="space-y-2 text-sm text-slate">
        {items.map((item) => (
          <li key={item}>- {item}</li>
        ))}
      </ul>
    </Card>
  );
}
