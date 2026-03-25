"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChatWindow } from "@/components/scenario/chat-window";
import type { ChatMessage } from "@/components/scenario/chat-window";
import { CoachHintPanel } from "@/components/scenario/coach-hint-panel";
import { FeedbackPanel } from "@/components/scenario/feedback-panel";
import { ScenarioHeader } from "@/components/scenario/scenario-header";
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
  response_source?: string;
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

function ConversationVisual() {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-ink px-6 py-8 text-white shadow-[0_30px_80px_rgba(15,23,42,0.28)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.22),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.18),transparent_35%)]" />
      <div className="relative flex items-center justify-between gap-6">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">Conversation Mode</p>
          <h2 className="text-3xl font-semibold leading-tight">Focused live role-play</h2>
          <p className="max-w-xl text-sm leading-6 text-slate-300">
            Stay in the call. Keep the screen quiet, listen to the homeowner, and let the coaching nudges guide you only when needed.
          </p>
        </div>
        <div className="hidden md:flex items-center gap-4">
          <div className="h-20 w-20 rounded-full bg-amber-300/20 blur-sm" />
          <div className="flex h-32 w-32 items-center justify-center rounded-full border border-white/15 bg-white/5">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-amber-300/40 bg-amber-300/10">
              <div className="h-8 w-8 rounded-full bg-amber-300 shadow-[0_0_30px_rgba(252,211,77,0.45)]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ScenarioSessionClient({
  sessionId,
  initialMessages,
  initialCoachHint,
  initialResults,
  initiallyCompleted,
  title,
  subtitle
}: {
  sessionId: string;
  initialMessages: ChatMessage[];
  initialCoachHint: string | null;
  initialResults: CompleteResponse | null;
  initiallyCompleted: boolean;
  title: string;
  subtitle: string;
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
  const [conversationMode, setConversationMode] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = draft.trim();
    if (message === "" || isCompleted) {
      return;
    }

    setError(null);
    setIsSending(true);

    const optimisticId = "technician-" + Date.now();
    const optimisticMessage: ChatMessage = {
      id: optimisticId,
      speaker: "technician",
      text: message
    };

    setMessages((current) => [...current, optimisticMessage]);
    setDraft("");

    try {
      const response = await fetch("/api/scenarios/" + sessionId + "/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message })
      });

      const payload = (await response.json()) as MessageResponse;
      if (response.ok === false) {
        setMessages((current) => current.filter((item) => item.id !== optimisticId));
        setError(payload.error ?? "Unable to send your message.");
        return;
      }

      setMessages((current) => {
        const next = current.filter((item) => item.id !== optimisticId);
        next.push({ ...optimisticMessage, id: optimisticId + "-saved" });
        next.push({
          id: "homeowner-" + Date.now(),
          speaker: "homeowner",
          text: payload.homeowner_response
        });
        if (payload.coach_hint) {
          next.push({
            id: "coach-" + Date.now(),
            speaker: "coach",
            text: payload.coach_hint
          });
        }
        return next;
      });

      setCoachHint((current) => payload.coach_hint ?? current);

      const notes = [
        payload.turn_analysis.discovery_detected ? "Discovery detected" : "Need more discovery",
        payload.turn_analysis.option_count_detected > 0 ? String(payload.turn_analysis.option_count_detected) + " option cue(s)" : "No options framed yet",
        payload.turn_analysis.commitment_attempt_detected ? "Commitment question attempted" : "No commitment question yet"
      ];
      setAnalysisSummary(notes.join(" • "));
    } catch {
      setMessages((current) => current.filter((item) => item.id !== optimisticId));
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
      const response = await fetch("/api/scenarios/" + sessionId + "/complete", {
        method: "POST"
      });
      const payload = (await response.json()) as CompleteResponse;

      if (response.ok === false) {
        setError(payload.error ?? "Unable to complete the scenario.");
        return;
      }

      setResults(payload);
      setIsCompleted(true);
      setConversationMode(false);
      setCoachHint("Scenario complete. Review your scores and coaching notes below.");
      router.refresh();
    } catch {
      setError("Unable to complete the scenario.");
    } finally {
      setIsCompleting(false);
    }
  }

  const responseForm = (
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
        {analysisSummary && conversationMode === false ? <p className="text-sm text-slate">{analysisSummary}</p> : null}
        <div className="flex gap-3">
          <Button disabled={isSending || isCompleted} type="submit">
            {isSending ? "Sending..." : "Send Message"}
          </Button>
        </div>
      </form>
    </Card>
  );

  const fullScenarioView = (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <ScenarioHeader subtitle={subtitle} title={title} />
        {isCompleted === false ? (
          <Button className="shrink-0 border border-slate/20 bg-white text-ink hover:bg-mist" onClick={() => setConversationMode(true)} type="button">
            Conversation Mode
          </Button>
        ) : null}
      </div>
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <ChatWindow messages={messages} />
          {responseForm}
        </div>
        <CoachHintPanel hint={coachHint} />
      </div>
    </div>
  );

  const conversationModeView = (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-ember">Live Scenario</p>
        <Button className="border border-slate/20 bg-white text-ink hover:bg-mist" onClick={() => setConversationMode(false)} type="button">
          Exit Conversation Mode
        </Button>
      </div>
      <ConversationVisual />
      {coachHint ? <CoachHintPanel hint={coachHint} /> : null}
      <ChatWindow messages={messages} />
      {responseForm}
    </div>
  );

  return (
    <div className="space-y-6">
      {conversationMode && isCompleted === false ? conversationModeView : fullScenarioView}

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
