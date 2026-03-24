import { Card } from "@/components/ui/card";

export type ChatMessage = {
  id: string;
  speaker: "homeowner" | "technician" | "coach";
  text: string;
};

export function ChatWindow({ messages }: { messages: ChatMessage[] }) {
  return (
    <Card className="space-y-4">
      {messages.map((message) => (
        <div key={message.id} className="rounded-2xl bg-mist p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">{message.speaker}</p>
          <p className="mt-2 text-sm text-ink">{message.text}</p>
        </div>
      ))}
    </Card>
  );
}
