export function MessageBubble({ speaker, text }: { speaker: string; text: string }) {
  return (
    <div className="rounded-2xl bg-mist p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">{speaker}</p>
      <p className="mt-2 text-sm text-ink">{text}</p>
    </div>
  );
}
