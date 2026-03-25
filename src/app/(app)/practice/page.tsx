import Link from "next/link";
import { ScenarioCard } from "@/components/scenario/scenario-card";

export default function PracticePage() {
  return (
    <main className="grid gap-6 md:grid-cols-2">
      <Link href="/practice/random">
        <ScenarioCard
          title="Random Practice"
          detail="Generate a fresh service-call scenario with new personalities, motivations, and hidden issues each time."
        />
      </Link>
      <Link href="/practice/targeted">
        <ScenarioCard
          title="Targeted Practice"
          detail="Choose a revenue-growth conversation track built to help techs expand scope and raise ticket value while already onsite."
        />
      </Link>
    </main>
  );
}
