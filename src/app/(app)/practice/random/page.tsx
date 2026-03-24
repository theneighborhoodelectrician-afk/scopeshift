import { DifficultySelector } from "@/components/scenario/difficulty-selector";
import { CoachModeToggle } from "@/components/scenario/coach-mode-toggle";

export default function RandomPracticePage() {
  return (
    <main className="grid gap-6 md:grid-cols-2">
      <DifficultySelector />
      <CoachModeToggle />
    </main>
  );
}
