import Link from "next/link";
import { ScenarioCard } from "@/components/scenario/scenario-card";

export default function PracticePage() {
  return (
    <main className="grid gap-6 md:grid-cols-2">
      <Link href="/practice/random"><ScenarioCard title="Random Practice" detail="Generate a fresh homeowner scenario." /></Link>
      <Link href="/practice/targeted"><ScenarioCard title="Targeted Practice" detail="Choose a category or preset for focused reps." /></Link>
    </main>
  );
}
