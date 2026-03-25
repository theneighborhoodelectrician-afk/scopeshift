"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChatWindow } from "@/components/scenario/chat-window";
import type { ChatMessage } from "@/components/scenario/chat-window";
import { CoachHintPanel } from "@/components/scenario/coach-hint-panel";
import { FeedbackPanel } from "@/components/scenario/feedback-panel";
import { ScenarioHeader } from "@/components/scenario/scenario-header";
import { Scorecard } from "@/components/scenario/scorecard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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

type VoiceState = "idle" | "listening" | "thinking" | "speaking";

type BrowserSpeechRecognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionCtor = new () => BrowserSpeechRecognition;

type SpeechRecognitionAlternativeLike = {
  transcript: string;
};

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  0: SpeechRecognitionAlternativeLike;
};

type SpeechRecognitionEventLike = {
  results: ArrayLike<SpeechRecognitionResultLike>;
};

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  }
}

function getLatestMessage(messages: ChatMessage[], speaker: ChatMessage["speaker"]) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const current = messages[index];
    if (current.speaker === speaker) {
      return current;
    }
  }

  return null;
}

function getVoiceStatusLabel(voiceState: VoiceState) {
  if (voiceState === "listening") {
    return "Listening for the technician";
  }

  if (voiceState === "thinking") {
    return "Homeowner is thinking";
  }

  if (voiceState === "speaking") {
    return "Homeowner is speaking";
  }

  return "Ready to start the conversation";
}

function VoiceConversationVisual({ voiceState }: { voiceState: VoiceState }) {
  const outerRingClassName =
    voiceState === "speaking"
      ? "scale-105 bg-cyan-300/15 shadow-[0_0_90px_rgba(103,232,249,0.25)]"
      : voiceState === "listening"
        ? "scale-105 bg-emerald-300/15 shadow-[0_0_90px_rgba(52,211,153,0.22)]"
        : voiceState === "thinking"
          ? "scale-95 bg-amber-200/10 shadow-[0_0_70px_rgba(251,191,36,0.2)]"
          : "bg-white/8 shadow-[0_0_70px_rgba(148,163,184,0.18)]";

  const coreClassName =
    voiceState === "speaking"
      ? "bg-cyan-300"
      : voiceState === "listening"
        ? "bg-emerald-300"
        : voiceState === "thinking"
          ? "bg-amber-300"
          : "bg-white/80";

  return (
    <div className="relative flex flex-col items-center gap-8">
      <div className="absolute inset-x-0 top-1/2 h-56 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.16),transparent_58%)] blur-3xl" />
      <div className={cn("relative flex h-72 w-72 items-center justify-center rounded-full border border-white/12 transition duration-500", outerRingClassName)}>
        <div className="absolute h-56 w-56 rounded-full border border-white/10" />
        <div className="absolute h-44 w-44 rounded-full border border-white/10" />
        <div className={cn("relative h-24 w-24 rounded-full transition duration-300", coreClassName)} />
      </div>
      <div className="flex items-end gap-2">
        {[0, 1, 2, 3, 4].map((index) => {
          const active = voiceState === "speaking" || voiceState === "listening";
          const heightClassName =
            index % 2 === 0
              ? active
                ? "h-16"
                : "h-6"
              : active
                ? "h-10"
                : "h-4";

          return <span key={index} className={cn("w-2 rounded-full bg-white/70 transition-all duration-300", heightClassName)} />;
        })}
      </div>
    </div>
  );
}

function ConversationNudge({ hint }: { hint: string | null }) {
  if (hint == null) {
    return null;
  }

  return (
    <div className="mx-auto max-w-xl rounded-[1.6rem] border border-white/12 bg-white/8 px-5 py-4 text-white shadow-[0_20px_60px_rgba(15,23,42,0.18)] backdrop-blur-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-200">Coach Nudge</p>
      <p className="mt-2 text-sm leading-6 text-slate-100">{hint}</p>
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
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [keyboardFallbackOpen, setKeyboardFallbackOpen] = useState(false);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const spokenMessageIdRef = useRef<string | null>(null);

  const lastHomeownerMessage = useMemo(() => getLatestMessage(messages, "homeowner"), [messages]);
  const lastTechnicianMessage = useMemo(() => getLatestMessage(messages, "technician"), [messages]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const recognitionCtor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    setVoiceSupported(recognitionCtor != null);
  }, []);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      if (typeof window !== "undefined") {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (conversationMode === false) {
      window.speechSynthesis.cancel();
      setVoiceState((current) => (current === "listening" ? current : "idle"));
    }
  }, [conversationMode]);

  function stopListening() {
    recognitionRef.current?.stop();
  }

  function speakHomeownerReply(text: string, messageId: string) {
    if (typeof window === "undefined") {
      return;
    }

    if (conversationMode === false) {
      return;
    }

    if (text.trim() === "") {
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onstart = () => setVoiceState("speaking");
    utterance.onend = () => setVoiceState("idle");
    utterance.onerror = () => setVoiceState("idle");

    spokenMessageIdRef.current = messageId;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  useEffect(() => {
    if (lastHomeownerMessage == null) {
      return;
    }

    if (spokenMessageIdRef.current === lastHomeownerMessage.id) {
      return;
    }

    speakHomeownerReply(lastHomeownerMessage.text, lastHomeownerMessage.id);
  }, [conversationMode, lastHomeownerMessage]);

  async function sendTechnicianMessage(message: string) {
    if (message === "" || isCompleted) {
      return;
    }

    setError(null);
    setIsSending(true);
    setVoiceState(conversationMode ? "thinking" : "idle");

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
        setVoiceState("idle");
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
      setVoiceState("idle");
    } finally {
      setIsSending(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = draft.trim();
    await sendTechnicianMessage(message);
  }

  function startListening() {
    if (typeof window === "undefined") {
      return;
    }

    const recognitionCtor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (recognitionCtor == null) {
      setError("Voice input is not available in this browser. Use keyboard reply instead.");
      return;
    }

    recognitionRef.current?.abort();
    window.speechSynthesis.cancel();

    const recognition = new recognitionCtor();
    let finalTranscript = "";

    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onstart = () => {
      setError(null);
      setVoiceState("listening");
    };
    recognition.onresult = (event) => {
      const transcriptParts: string[] = [];
      for (let index = 0; index < event.results.length; index += 1) {
        const result = event.results[index];
        transcriptParts.push(result[0].transcript);
        if (result.isFinal) {
          finalTranscript += result[0].transcript + " ";
        }
      }
      setDraft(transcriptParts.join(" ").trim());
    };
    recognition.onerror = (event) => {
      setVoiceState("idle");
      if (event.error !== "no-speech") {
        setError("Voice capture ran into an issue. You can try again or use keyboard reply.");
      }
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      const nextMessage = finalTranscript.trim() || draft.trim();
      if (nextMessage !== "") {
        void sendTechnicianMessage(nextMessage);
      } else {
        setVoiceState("idle");
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
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
      setVoiceState("idle");
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

  const voiceModeView = (
    <div className="overflow-hidden rounded-[2.5rem] bg-[linear-gradient(180deg,#102235_0%,#1d3651_50%,#2e4b67_100%)] text-white shadow-[0_35px_120px_rgba(15,23,42,0.35)]">
      <div className="space-y-10 px-6 py-6 md:px-10 md:py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-200">Conversation Mode</p>
            <h2 className="mt-3 text-3xl font-semibold">Talk to the homeowner like it is a real call</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setKeyboardFallbackOpen((current) => current === false)}
              className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/10"
            >
              {keyboardFallbackOpen ? "Hide keyboard" : "Use keyboard"}
            </button>
            <button
              type="button"
              onClick={() => setConversationMode(false)}
              className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/10"
            >
              Return to Scenario
            </button>
          </div>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-8">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-cyan-200">Live status</p>
              <h3 className="mt-3 text-4xl font-semibold leading-tight">{getVoiceStatusLabel(voiceState)}</h3>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-200">
                Keep the call natural. Ask what changed today, clarify risk in plain language, and let the homeowner react like a real customer.
              </p>
            </div>

            <div className="space-y-4 rounded-[1.8rem] border border-white/12 bg-white/8 px-5 py-5 backdrop-blur-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-200">Current homeowner line</p>
              <p className="text-2xl font-medium leading-10 text-white">{lastHomeownerMessage?.text ?? "The homeowner is ready when you are."}</p>
              {lastTechnicianMessage ? (
                <p className="text-sm leading-6 text-slate-300">Last thing you said: {lastTechnicianMessage.text}</p>
              ) : null}
            </div>

            <ConversationNudge hint={coachHint} />

            {error ? (
              <div className="mx-auto max-w-xl rounded-[1.4rem] border border-red-300/30 bg-red-400/10 px-4 py-3 text-sm text-red-100">
                {error}
              </div>
            ) : null}
          </div>

          <div className="space-y-8">
            <VoiceConversationVisual voiceState={voiceState} />
            <div className="flex flex-col gap-4">
              <button
                type="button"
                disabled={isSending || isCompleting || isCompleted || voiceSupported === false}
                onClick={voiceState === "listening" ? stopListening : startListening}
                className={cn(
                  "rounded-full px-8 py-5 text-base font-semibold transition",
                  voiceState === "listening"
                    ? "bg-white text-ink hover:bg-slate-100"
                    : "bg-cyan-300 text-ink hover:bg-cyan-200",
                  (isSending || isCompleting || isCompleted || voiceSupported === false) && "cursor-not-allowed opacity-50"
                )}
              >
                {voiceState === "listening"
                  ? "Listening now"
                  : voiceState === "thinking"
                    ? "Waiting for homeowner"
                    : voiceState === "speaking"
                      ? "Homeowner is talking"
                      : voiceSupported
                        ? "Tap to talk"
                        : "Voice input unavailable"}
              </button>
              <button
                type="button"
                disabled={isCompleting || isSending || isCompleted}
                onClick={handleComplete}
                className="rounded-full border border-white/15 px-8 py-4 text-base font-semibold text-white transition hover:bg-white/10"
              >
                {isCompleting ? "Wrapping up the scenario" : isCompleted ? "Scenario completed" : "End Conversation"}
              </button>
            </div>
          </div>
        </div>

        {keyboardFallbackOpen ? (
          <div className="rounded-[1.8rem] border border-white/12 bg-white/8 px-5 py-5 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">Keyboard Reply</p>
                <p className="mt-2 text-sm leading-6 text-slate-200">Use this if you want to steer the conversation manually instead of talking out loud.</p>
              </div>
              {analysisSummary ? <p className="text-sm text-slate-300">{analysisSummary}</p> : null}
            </div>
            <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
              <textarea
                className="min-h-28 w-full rounded-[1.5rem] border border-white/12 bg-[#0f2234] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-400"
                disabled={isCompleted}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={isCompleted ? "Scenario is complete." : "Type your reply if you do not want to speak it."}
                value={draft}
              />
              <div className="flex gap-3">
                <Button className="bg-cyan-300 text-ink hover:bg-cyan-200" disabled={isSending || isCompleted} type="submit">
                  {isSending ? "Sending..." : "Send Reply"}
                </Button>
              </div>
            </form>
          </div>
        ) : null}
      </div>
    </div>
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

  return (
    <div className="space-y-6">
      {conversationMode && isCompleted === false ? voiceModeView : fullScenarioView}

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
