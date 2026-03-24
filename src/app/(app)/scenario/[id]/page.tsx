import { ChatWindow } from "@/components/scenario/chat-window";
import { CoachHintPanel } from "@/components/scenario/coach-hint-panel";
import { ScenarioHeader } from "@/components/scenario/scenario-header";

export default function ScenarioPage() {
  return (
    <main className="space-y-6">
      <ScenarioHeader title="Breaker Tripping in Older Neighborhood" subtitle="Guided mode with light coach support." />
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <ChatWindow
          messages={[
            { id: "1", speaker: "homeowner", text: "Our kitchen breaker keeps tripping and we need to figure out why today." },
            { id: "2", speaker: "technician", text: "What prompted you to call today, and how long has this been happening?" }
          ]}
        />
        <CoachHintPanel hint="Ask about renovation plans and who will be involved in the decision." />
      </div>
    </main>
  );
}
