import { Card } from "@/components/ui/card";
import { MessageBubble } from "@/components/scenario/message-bubble";

export type ChatMessage = {
  id: string;
  speaker: "homeowner" | "technician" | "coach";
  text: string;
};

export function ChatWindow({ messages }: { messages: ChatMessage[] }) {
  return (
    <Card className="space-y-4">
      {messages.length ? (
        messages.map((message) => <MessageBubble key={message.id} {...message} />)
      ) : (
        <p className="text-sm text-slate">No conversation yet. Send your first technician message to begin.</p>
      )}
    </Card>
  );
}
