import { ProgressChart } from "@/components/dashboard/progress-chart";
import { ScenarioCard } from "@/components/scenario/scenario-card";

export default function DashboardPage() {
  return (
    <main className="space-y-6">
      <ScenarioCard title="Momentum Snapshot" detail="Average scores, streaks, and recent session movement belong here." />
      <ProgressChart />
    </main>
  );
}
