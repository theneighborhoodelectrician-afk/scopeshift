import { FeedbackPanel } from "@/components/scenario/feedback-panel";
import { Scorecard } from "@/components/scenario/scorecard";

export default function SessionDetailPage() {
  return (
    <main className="space-y-6">
      <Scorecard
        scores={{
          rapport_score: 7,
          discovery_score: 6,
          risk_explanation_score: 8,
          education_score: 7,
          options_score: 5,
          commitment_score: 3,
          overall_score: 6
        }}
      />
      <FeedbackPanel title="Strong moments" items={["Strong safety framing", "Good rapport in the first two turns"]} />
    </main>
  );
}
