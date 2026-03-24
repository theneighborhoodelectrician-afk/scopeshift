import { Card } from "@/components/ui/card";

export function FeedbackPanel({ title, items, emptyMessage }: { title: string; items: string[]; emptyMessage?: string }) {
  return (
    <Card className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">{title}</p>
      {items.length ? (
        <ul className="space-y-2 text-sm leading-6 text-slate">
          {items.map((item) => (
            <li key={item} className="rounded-2xl bg-mist px-4 py-3">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate">{emptyMessage ?? "Nothing to highlight here yet."}</p>
      )}
    </Card>
  );
}
