"use client";

import { useState, type FocusEvent } from "react";

const THUMB = 28;

type Bound = "from" | "to";

type Props = {
  label: string;
  suffix?: string;
  min: number;
  max: number;
  step: number;
  from: number;
  to: number;
  onChange: (from: number, to: number) => void;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const percent = (value: number, min: number, max: number) => clamp(((value - min) / (max - min)) * 100, 0, 100);
const leftEdge = (p: number) => `calc(${p}% + ${(0.5 - p / 100) * THUMB}px)`;
const rightEdge = (p: number) => `calc(${100 - p}% + ${(p / 100 - 0.5) * THUMB}px)`;

function NumberInput({
  value,
  label,
  step,
  onChange,
}: {
  value: string;
  label: string;
  step: number;
  onChange: (value: string) => void;
}) {
  return (
    <input
      type="number"
      min={0}
      step={step}
      inputMode="decimal"
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ width: `${Math.max(value.length, 2) + 3}ch` }}
      className="rounded-md border border-line bg-canvas px-1.5 py-0.5 text-center text-lg font-semibold tabular-nums text-ink outline-none transition-colors focus:border-accent focus:bg-surface sm:text-xl"
    />
  );
}

export default function RangeSlider({ label, suffix, min, max, step, from, to, onChange }: Props) {
  const [draft, setDraft] = useState<Partial<Record<Bound, string>>>({});

  const pFrom = percent(from, min, max);
  const pTo = percent(to, min, max);
  const fillStart = Math.min(pFrom, pTo);
  const fillEnd = Math.max(pFrom, pTo);

  const type = (bound: Bound) => (text: string) => {
    setDraft((prev) => ({ ...prev, [bound]: text }));
    const parsed = parseFloat(text.replace(",", "."));
    if (!Number.isFinite(parsed) || parsed < 0) return;
    if (bound === "from") onChange(parsed, to);
    else onChange(from, parsed);
  };

  const settle = (e: FocusEvent<HTMLElement>) => {
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setDraft({});
    if (from > to) onChange(to, from);
  };

  const drag = (bound: Bound, value: number) => {
    setDraft({});
    if (bound === "from") onChange(Math.min(value, to), to);
    else onChange(from, Math.max(value, from));
  };

  return (
    <div>
      <div className="mb-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <span className="text-sm font-medium text-muted">{label}</span>
        <span onBlur={settle} className="flex items-center gap-1.5 text-sm font-medium text-faint">
          от
          <NumberInput value={draft.from ?? String(from)} label={`${label}, от`} step={step} onChange={type("from")} />
          до
          <NumberInput value={draft.to ?? String(to)} label={`${label}, до`} step={step} onChange={type("to")} />
          {suffix && <span className="text-base font-semibold text-ink">{suffix}</span>}
        </span>
      </div>
      <div className="relative h-11">
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-line" />
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-accent"
          style={{ left: leftEdge(fillStart), right: rightEdge(fillEnd) }}
        />
        <input
          type="range"
          className="dual-range"
          aria-label={`${label}, ползунок от`}
          min={min}
          max={max}
          step={step}
          value={clamp(from, min, max)}
          style={{ zIndex: pFrom > 50 ? 3 : 1 }}
          onChange={(e) => drag("from", Number(e.target.value))}
        />
        <input
          type="range"
          className="dual-range"
          aria-label={`${label}, ползунок до`}
          min={min}
          max={max}
          step={step}
          value={clamp(to, min, max)}
          style={{ zIndex: 2 }}
          onChange={(e) => drag("to", Number(e.target.value))}
        />
      </div>
    </div>
  );
}
