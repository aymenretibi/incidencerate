"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { IRResultCard } from "./IRResultCard";
import type { ChatReply, IRResult } from "@/lib/irCalibrator";

interface Props {
  markets: string[];
}

type Gender = "male" | "female" | "all" | "";
type Seg = "ABC1" | "ABC1C2" | "ABC1C2D" | "all" | "";
type Category =
  | "financial"
  | "fmcg"
  | "tech"
  | "auto"
  | "healthcare"
  | "other"
  | "";
type GeoType = "national" | "cities" | "regions" | "";
type Recency = "P3M" | "P6M" | "P12M" | "ever" | "";
type Frequency = "heavy" | "medium" | "light" | "";
type BrandSpec = "category_only" | "specific_brand" | "niche_premium" | "";
type Logic = "AND" | "OR" | "";

interface Overrides {
  age_min?: number | null;
  age_max?: number | null;
  gender?: Exclude<Gender, "">;
  seg?: Exclude<Seg, "">;
  geo_type?: Exclude<GeoType, "">;
  cities?: string[];
  category?: Exclude<Category, "">;
  recency?: Exclude<Recency, "">;
  frequency?: Exclude<Frequency, "">;
  brand_specificity?: Exclude<BrandSpec, "">;
  logic?: Exclude<Logic, "">;
  clinical?: boolean;
  extra_notes?: string;
}

type ChatMessage =
  | { id: string; role: "user"; content: string }
  | {
      id: string;
      role: "assistant";
      kind: "text";
      content: string;
    }
  | {
      id: string;
      role: "assistant";
      kind: "assessment";
      content: string;
      assessment: IRResult;
    };

interface ChatSuccess {
  ok: true;
  reply: ChatReply;
}
interface ChatFailure {
  ok?: false;
  error: string;
  detail?: string;
  raw?: string;
}

const GREETING: ChatMessage = {
  id: "greeting",
  role: "assistant",
  kind: "text",
  content:
    "Hi — I'm the IR Calibration Validator. Tell me about your custom sample, the market, and the IR you've assumed, and I'll reconstruct the funnel and tell you whether that IR is realistic. Drop it all in one message or answer as I ask.",
};

function newId() {
  return Math.random().toString(36).slice(2, 10);
}

function assistantAssessmentToText(r: IRResult, preface: string): string {
  const reason = r.confidence_reason ? ` (${r.confidence_reason})` : "";
  return [
    preface,
    `Market: ${r.market}`,
    `Sample Title: ${r.sample_title}`,
    `Predicted IR: ${r.predicted_ir_point}%`,
    `Predicted IR Range: ${r.predicted_ir_low}% – ${r.predicted_ir_high}%`,
    `Verdict: ${r.verdict}`,
    `Assumed IR: ${r.assumed_ir}%`,
    `Sample Description: ${r.sample_description}`,
    `Short Reason: ${r.short_reason}`,
    `Assumption Confidence: ${r.assumption_confidence}${reason}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function CalculatorForm({ markets }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<ChatFailure | null>(null);

  // Overrides panel — rendered only after the first AI assessment.
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [ageMin, setAgeMin] = useState<string>("");
  const [ageMax, setAgeMax] = useState<string>("");
  const [gender, setGender] = useState<Gender>("");
  const [seg, setSeg] = useState<Seg>("");
  const [category, setCategory] = useState<Category>("");
  const [geoType, setGeoType] = useState<GeoType>("");
  const [citiesStr, setCitiesStr] = useState<string>("");
  const [recency, setRecency] = useState<Recency>("");
  const [frequency, setFrequency] = useState<Frequency>("");
  const [brandSpec, setBrandSpec] = useState<BrandSpec>("");
  const [logic, setLogic] = useState<Logic>("");
  const [clinical, setClinical] = useState(false);
  const [extraNotes, setExtraNotes] = useState("");

  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, pending]);

  const hasAssessment = useMemo(
    () => messages.some((m) => m.role === "assistant" && m.kind === "assessment"),
    [messages],
  );

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  }

  function buildOverrides(): Overrides | undefined {
    const o: Overrides = {};
    if (ageMin) o.age_min = Number(ageMin);
    if (ageMax) o.age_max = Number(ageMax);
    if (gender) o.gender = gender;
    if (seg) o.seg = seg;
    if (geoType) o.geo_type = geoType;
    if (geoType === "cities" && citiesStr) {
      o.cities = citiesStr
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);
    }
    if (category) o.category = category;
    if (recency) o.recency = recency;
    if (frequency) o.frequency = frequency;
    if (brandSpec) o.brand_specificity = brandSpec;
    if (logic) o.logic = logic;
    if (clinical) o.clinical = true;
    if (extraNotes.trim()) o.extra_notes = extraNotes.trim();
    return Object.keys(o).length === 0 ? undefined : o;
  }

  function summariseOverrides(o: Overrides): string {
    const lines: string[] = [];
    const push = (k: string, v: unknown) => {
      if (v === undefined || v === null || v === "") return;
      if (Array.isArray(v) && v.length === 0) return;
      lines.push(`• ${k}: ${Array.isArray(v) ? v.join(", ") : v}`);
    };
    if (o.age_min != null || o.age_max != null) {
      push("age", `${o.age_min ?? "?"}–${o.age_max ?? "?"}`);
    }
    push("gender", o.gender);
    push("SES", o.seg);
    push("geo", o.geo_type);
    push("cities", o.cities);
    push("category", o.category);
    push("recency", o.recency);
    push("frequency", o.frequency);
    push("brand specificity", o.brand_specificity);
    push("logic", o.logic);
    if (o.clinical) push("clinical", "yes");
    if (o.extra_notes) push("notes", o.extra_notes);
    return lines.join("\n");
  }

  async function send(userContent: string, overrides?: Overrides) {
    const userMsg: ChatMessage = {
      id: newId(),
      role: "user",
      content: userContent,
    };
    const nextHistory = [...messages, userMsg].filter(
      (m) => m.id !== "greeting",
    );
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setError(null);
    setPending(true);

    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 115_000);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: nextHistory.map((m) => ({
            role: m.role,
            content:
              m.role === "assistant" && m.kind === "assessment"
                ? assistantAssessmentToText(m.assessment, m.content)
                : m.content,
          })),
          overrides,
        }),
        signal: ac.signal,
      });
      const data = (await res.json()) as ChatSuccess | ChatFailure;
      if (!res.ok || !("ok" in data && data.ok)) {
        setError(data as ChatFailure);
        return;
      }
      const reply = data.reply;
      const id = newId();
      if (reply.kind === "assessment") {
        setMessages((prev) => [
          ...prev,
          {
            id,
            role: "assistant",
            kind: "assessment",
            content: reply.text ?? "",
            assessment: reply.assessment,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { id, role: "assistant", kind: "text", content: reply.text },
        ]);
      }
    } catch (err) {
      const e = err as Error;
      setError({
        error: e.name === "AbortError" ? "request_timeout" : "network_error",
        detail:
          e.name === "AbortError"
            ? "The AI took longer than expected to reply. Check server logs or try again."
            : e.message,
      });
    } finally {
      clearTimeout(timer);
      setPending(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || pending) return;
    void send(trimmed);
  }

  function handleKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  }

  function applyOverrides() {
    const o = buildOverrides();
    if (!o || pending) return;
    const summary = summariseOverrides(o);
    const msg = summary
      ? `Re-validate with these constraints:\n${summary}`
      : "Re-validate.";
    setAdjustOpen(false);
    void send(msg, o);
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col p-6">
      <header className="mb-6 flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-semibold">IR Calibration Quick Validator</h1>
          <p className="text-sm text-white/60">
            Chat-based reconstruction of the IR funnel — prompt v2.5.1,
            temperature 0.
          </p>
        </div>
        <button
          onClick={logout}
          className="text-sm text-white/60 underline hover:text-white"
        >
          Logout
        </button>
      </header>

      <div className="flex min-h-[70vh] flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        <div ref={scrollerRef} className="flex-1 space-y-4 overflow-y-auto p-6">
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}

          {pending && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-sm bg-white/10 px-4 py-3 text-sm text-white/60">
                <span className="inline-flex gap-1">
                  <Dot />
                  <Dot delay={150} />
                  <Dot delay={300} />
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm">
              <div className="font-semibold text-red-300">
                {error.error === "calibrator_failed"
                  ? "AI calibrator failed"
                  : `Error: ${error.error}`}
              </div>
              {error.detail && (
                <p className="mt-1 text-red-200/80">{error.detail}</p>
              )}
              {error.raw && (
                <pre className="mt-2 max-h-40 overflow-auto rounded bg-black/40 p-2 text-xs text-white/70">
                  {error.raw}
                </pre>
              )}
            </div>
          )}

          {hasAssessment && !pending && (
            <AdjustPanel
              open={adjustOpen}
              setOpen={setAdjustOpen}
              markets={markets}
              state={{
                ageMin,
                setAgeMin,
                ageMax,
                setAgeMax,
                gender,
                setGender,
                seg,
                setSeg,
                category,
                setCategory,
                geoType,
                setGeoType,
                citiesStr,
                setCitiesStr,
                recency,
                setRecency,
                frequency,
                setFrequency,
                brandSpec,
                setBrandSpec,
                logic,
                setLogic,
                clinical,
                setClinical,
                extraNotes,
                setExtraNotes,
              }}
              onApply={applyOverrides}
            />
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="border-t border-white/10 bg-black/20 p-4"
        >
          <div className="flex items-end gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              rows={2}
              placeholder={
                hasAssessment
                  ? "Ask a follow-up, or tweak the sample…"
                  : 'e.g. "Premium EV owners in the UK, assumed IR 12%"'
              }
              disabled={pending}
              className="w-full resize-none rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-white/30 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={pending || input.trim().length < 2}
              className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black transition disabled:opacity-40"
            >
              {pending ? "Sending…" : "Send"}
            </button>
          </div>
          <p className="mt-2 text-xs text-white/40">
            Enter to send · Shift+Enter for a new line
            {markets.length > 0 && ` · Known markets: ${markets.slice(0, 6).join(", ")}${markets.length > 6 ? "…" : ""}`}
          </p>
        </form>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-white/90 px-4 py-2 text-sm text-black">
          {message.content}
        </div>
      </div>
    );
  }

  if (message.kind === "assessment") {
    return (
      <div className="flex justify-start">
        <div className="w-full max-w-[92%] space-y-2">
          {message.content && (
            <div className="rounded-2xl rounded-bl-sm bg-white/10 px-4 py-2 text-sm text-white/80">
              {message.content}
            </div>
          )}
          <IRResultCard result={message.assessment} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-white/10 px-4 py-2 text-sm text-white/90">
        {message.content}
      </div>
    </div>
  );
}

function Dot({ delay = 0 }: { delay?: number }) {
  return (
    <span
      className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-white/60"
      style={{ animationDelay: `${delay}ms` }}
    />
  );
}

interface AdjustState {
  ageMin: string;
  setAgeMin: (v: string) => void;
  ageMax: string;
  setAgeMax: (v: string) => void;
  gender: Gender;
  setGender: (v: Gender) => void;
  seg: Seg;
  setSeg: (v: Seg) => void;
  category: Category;
  setCategory: (v: Category) => void;
  geoType: GeoType;
  setGeoType: (v: GeoType) => void;
  citiesStr: string;
  setCitiesStr: (v: string) => void;
  recency: Recency;
  setRecency: (v: Recency) => void;
  frequency: Frequency;
  setFrequency: (v: Frequency) => void;
  brandSpec: BrandSpec;
  setBrandSpec: (v: BrandSpec) => void;
  logic: Logic;
  setLogic: (v: Logic) => void;
  clinical: boolean;
  setClinical: (v: boolean) => void;
  extraNotes: string;
  setExtraNotes: (v: string) => void;
}

function AdjustPanel({
  open,
  setOpen,
  state: s,
  onApply,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  markets: string[];
  state: AdjustState;
  onApply: () => void;
}) {
  return (
    <details
      open={open}
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
      className="rounded-xl border border-white/10 bg-black/30 p-3 text-sm"
    >
      <summary className="cursor-pointer select-none text-white/80">
        Not happy with the AI&apos;s answer? Adjust assumptions and re-validate
      </summary>

      <div className="mt-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Age min">
            <input
              type="number"
              min={0}
              max={120}
              value={s.ageMin}
              onChange={(e) => s.setAgeMin(e.target.value)}
              placeholder="—"
              className={inputCls}
            />
          </Field>
          <Field label="Age max">
            <input
              type="number"
              min={0}
              max={120}
              value={s.ageMax}
              onChange={(e) => s.setAgeMax(e.target.value)}
              placeholder="—"
              className={inputCls}
            />
          </Field>

          <Field label="Gender">
            <select
              value={s.gender}
              onChange={(e) => s.setGender(e.target.value as Gender)}
              className={inputCls}
            >
              <option value="">let AI decide</option>
              <option value="all">all</option>
              <option value="female">female</option>
              <option value="male">male</option>
            </select>
          </Field>

          <Field label="SES segment">
            <select
              value={s.seg}
              onChange={(e) => s.setSeg(e.target.value as Seg)}
              className={inputCls}
            >
              <option value="">let AI decide</option>
              <option value="ABC1">ABC1</option>
              <option value="ABC1C2">ABC1C2</option>
              <option value="ABC1C2D">ABC1C2D</option>
              <option value="all">all</option>
            </select>
          </Field>

          <Field label="Geo coverage">
            <select
              value={s.geoType}
              onChange={(e) => s.setGeoType(e.target.value as GeoType)}
              className={inputCls}
            >
              <option value="">let AI decide</option>
              <option value="national">national</option>
              <option value="cities">specific cities</option>
              <option value="regions">regions</option>
            </select>
          </Field>

          {s.geoType === "cities" && (
            <Field label="Cities">
              <input
                type="text"
                value={s.citiesStr}
                onChange={(e) => s.setCitiesStr(e.target.value)}
                placeholder="comma-separated"
                className={inputCls}
              />
            </Field>
          )}

          <Field label="Category">
            <select
              value={s.category}
              onChange={(e) => s.setCategory(e.target.value as Category)}
              className={inputCls}
            >
              <option value="">let AI decide</option>
              <option value="financial">financial</option>
              <option value="fmcg">fmcg</option>
              <option value="tech">tech</option>
              <option value="auto">auto</option>
              <option value="healthcare">healthcare</option>
              <option value="other">other</option>
            </select>
          </Field>

          <Field label="Recency">
            <select
              value={s.recency}
              onChange={(e) => s.setRecency(e.target.value as Recency)}
              className={inputCls}
            >
              <option value="">let AI decide</option>
              <option value="P3M">past 3 months</option>
              <option value="P6M">past 6 months</option>
              <option value="P12M">past 12 months</option>
              <option value="ever">ever</option>
            </select>
          </Field>

          <Field label="Frequency">
            <select
              value={s.frequency}
              onChange={(e) => s.setFrequency(e.target.value as Frequency)}
              className={inputCls}
            >
              <option value="">let AI decide</option>
              <option value="heavy">heavy</option>
              <option value="medium">medium</option>
              <option value="light">light</option>
            </select>
          </Field>

          <Field label="Brand specificity">
            <select
              value={s.brandSpec}
              onChange={(e) => s.setBrandSpec(e.target.value as BrandSpec)}
              className={inputCls}
            >
              <option value="">let AI decide</option>
              <option value="category_only">any brand in category</option>
              <option value="specific_brand">specific brand</option>
              <option value="niche_premium">premium / niche</option>
            </select>
          </Field>

          <Field label="Logic between qualifiers">
            <select
              value={s.logic}
              onChange={(e) => s.setLogic(e.target.value as Logic)}
              className={inputCls}
            >
              <option value="">let AI decide</option>
              <option value="AND">AND</option>
              <option value="OR">OR</option>
            </select>
          </Field>
        </div>

        <label className="flex items-center gap-2 text-sm text-white/80">
          <input
            type="checkbox"
            checked={s.clinical}
            onChange={(e) => s.setClinical(e.target.checked)}
            className="h-4 w-4 rounded border-white/20 bg-black/30"
          />
          Treat as clinical / patient screener (use published prevalence, no
          panel uplift)
        </label>

        <Field label="Extra notes for the AI">
          <textarea
            value={s.extraNotes}
            onChange={(e) => s.setExtraNotes(e.target.value)}
            rows={3}
            placeholder={`e.g. "Exclude anyone on statins. Penetration for this brand is ~4% in the UK."`}
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/30"
          />
        </Field>

        <button
          type="button"
          onClick={onApply}
          className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black"
        >
          Apply &amp; re-validate
        </button>
      </div>
    </details>
  );
}

const inputCls =
  "w-full rounded-lg border border-white/10 bg-black/30 px-2 py-2 text-sm outline-none focus:border-white/30";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs uppercase tracking-wide text-white/60">
        {label}
      </span>
      {children}
    </label>
  );
}
