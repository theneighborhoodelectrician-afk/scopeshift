"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChatWindow } from "@/components/scenario/chat-window";
import type { ChatMessage } from "@/components/scenario/chat-window";
import { CoachHintPanel } from "@/components/scenario/coach-hint-panel";
import { FeedbackPanel } from "@/components/scenario/feedback-panel";
import { Scorecard } from "@/components/scenario/scorecard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type ScenarioScores = {
  rapport_score: number;
  discovery_score: number;
  risk_explanation_score: number;
  education_score: number;
  options_score: number;
  commitment_score: number;
  overall_score: number;
};

type ScenarioFeedback = {
  missed_questions: string[];
  missed_motivations: string[];
  strong_moments: string[];
  phrasing_improvements: string[];
  next_attempt_strategy: string;
};

type MessageResponse = {
  homeowner_response: string;
  coach_hint: string | null;
  turn_analysis: {
    discovery_detected: boolean;
    option_count_detected: number;
    commitment_attempt_detected: boolean;
  };
  error?: string;
};

type CompleteResponse = {
  scores: ScenarioScores;
  feedback: ScenarioFeedback;
  error?: string;
};

export function ScenarioSessionClient({
  sessionId,
  initialMessages,
  initialCoachHint,
  initialResults,
  initiallyCompleted
}: {
  sessionId: string;
  initialMessages: ChatMessage[];
  initialCoachHint: string | null;
  initialResults: CompleteResponse | null;
  initiallyCompleted: boolean;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [coachHint, setCoachHint] = useState<string | null>(initialCoachHint);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [analysisSummary, setAnalysisSummary] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [results, setResults] = useState<CompleteResponse | null>(initialResults);
  const [isCompleted, setIsCompleted] = useState(initiallyCompleted);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = draft.trim();
    if (!message || isCompleted) {
      return;
    }

    setError(null);
    setIsSending(true);

    const optimisticMessage: ChatMessage = {
      id: `technician-${Date.now()}`,
      speaker: "technician",
      text: message
    };

    setMessages((current) => [...current, optimisticMessage]);
    setDraft("");

    try {
      const response = await fetch(`/api/scenarios/${sessionId}/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message })
      });

      const payload = (await response.json()) as MessageResponse;
      if (!response.ok) {
        setMessages((current) => current.filter((item) => item.id !== optimisticMessage.id));
        setError(payload.error ?? "Unable to send your message.");
        return;
      }

      setMessages((current) => {
        const next = current.filter((item) => item.id !== optimisticMessage.id);
        next.push({ ...optimisticMessage, id: `${optimisticMessage.id}-saved` });
        next.push({
          id: `homeowner-${Date.now()}`,
          speaker: "homeowner",
          text: payload.homeowner_response
        });
        if (payload.coach_hint) {
          next.push({
            id: `coach-${Date.now()}`,
            speaker: "coach",
            text: payload.coach_hint
          });
        }
        return next;
      });

      setCoachHint((current) => payload.coach_hint ?? current);

      const notes = [
        payload.turn_analysis.discovery_detected ? "Discovery detected" : "Need more discovery",
        payload.turn_analysis.option_count_detected > 0 ? `${payload.turn_analysis.option_count_detected} option cue(s)` : "No options framed yet",
        payload.turn_analysis.commitment_attempt_detected ? "Commitment question attempted" : "No commitment question yet"
      ];
      setAnalysisSummary(notes.join(" • "));
    } catch {
      setMessages((current) => current.filter((item) => item.id !== optimisticMessage.id));
      setError("Unable to send your message.");
    } finally {
      setIsSending(false);
    }
  }

  async function handleComplete() {
    if (isCompleted) {
      return;
    }

    setError(null);
    setIsCompleting(true);

    try {
      const response = await fetch(`/api/scenarios/${sessionId}/complete`, {
        method: "POST"
      });
      const payload = (await response.json()) as CompleteResponse;

      if (!response.ok) {
        setError(payload.error ?? "Unable to complete the scenario.");
        return;
      }

      setResults(payload);
      setIsCompleted(true);
      setCoachHint("Scenario complete. Review your scores and coaching notes below.");
      router.refresh();
    } catch {
      setError("Unable to complete the scenario.");
    } finally {
      setIsCompleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <ChatWindow messages={messages} />
          <Card className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">Your Response</p>
              <Button
                className="bg-pine hover:bg-[#124b3c]"
                disabled={isCompleting || isSending || isCompleted}
                onClick={handleComplete}
                type="button"
              >
                {isCompleting ? "Scoring scenario..." : isCompleted ? "Scenario completed" : "Complete Scenario"}
              </Button>
            </div>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <textarea
                className="min-h-32 w-full rounded-2xl border border-slate/20 bg-mist px-4 py-3 text-sm text-ink outline-none"
                disabled={isCompleted}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={isCompleted ? "Scenario is complete." : "Type what the technician says next..."}
                value={draft}
              />
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              {analysisSummary ? <p className="text-sm text-slate">{analysisSummary}</p> : null}
              <div className="flex gap-3">
                <Button disabled={isSending || isCompleted} type="submit">
                  {isSending ? "Sending..." : "Send Message"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
        <CoachHintPanel hint={coachHint} />
      </div>

      {results ? (
        <div className="space-y-6">
          <Scorecard scores={results.scores} />
          <div className="grid gap-6 lg:grid-cols-2">
            <FeedbackPanel emptyMessage="No missed discovery items detected." items={results.feedback.missed_questions} title="Missed Questions" />
            <FeedbackPanel emptyMessage="You surfaced the hidden motivation well." items={results.feedback.missed_motivations} title="Missed Motivations" />
            <FeedbackPanel emptyMessage="No standout strengths were detected yet." items={results.feedback.strong_moments} title="Strong Moments" />
            <FeedbackPanel emptyMessage="No phrasing changes recommended." items={results.feedback.phrasing_improvements} title="Phrasing Improvements" />
          </div>
          <Card className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">Next Attempt Strategy</p>
            <p className="text-sm leading-7 text-slate">{results.feedback.next_attempt_strategy}</p>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
