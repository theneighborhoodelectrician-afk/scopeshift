import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/components/scenario/chat-window";

const speakerLabels: Record<ChatMessage["speaker"], string> = {
  homeowner: "Homeowner",
  technician: "Technician",
  coach: "Coach"
};

export function MessageBubble({ speaker, text }: ChatMessage) {
  const isTechnician = speaker === "technician";
  const isCoach = speaker === "coach";

  return (
    <div
      className={cn(
        "max-w-2xl rounded-2xl p-4",
        isTechnician && "ml-auto bg-ink text-white",
        isCoach && "border border-amber-200 bg-amber-50 text-ink",
        !isTechnician && !isCoach && "bg-mist text-ink"
      )}
    >
      <p className={cn("text-xs font-semibold uppercase tracking-[0.2em]", isTechnician ? "text-white/70" : "text-ember")}>
        {speakerLabels[speaker]}
      </p>
      <p className={cn("mt-2 text-sm leading-6", isTechnician ? "text-white" : "text-ink")}>{text}</p>
    </div>
  );
}
