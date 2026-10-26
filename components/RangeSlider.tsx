"use client";

const THUMB = 28;

type Props = {
  label: string;
  min: number;
  max: number;
  step: number;
  from: number;
  to: number;
  format: (value: number) => string;
  onChange: (from: number, to: number) => void;
};

const percent = (value: number, min: number, max: number) => ((value - min) / (max - min)) * 100;
const leftEdge = (p: number) => `calc(${p}% + ${(0.5 - p / 100) * THUMB}px)`;
const rightEdge = (p: number) => `calc(${100 - p}% + ${(p / 100 - 0.5) * THUMB}px)`;

export default function RangeSlider({ label, min, max, step, from, to, format, onChange }: Props) {
  const pFrom = percent(from, min, max);
  const pTo = percent(to, min, max);

  return (
    <div>
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="text-sm font-medium text-muted">{label}</span>
        <span className="text-lg font-semibold tabular-nums text-ink sm:text-xl">
          <span className="mr-1 text-sm font-medium text-faint">от</span>
          {format(from)}
          <span className="mx-1 text-sm font-medium text-faint">до</span>
          {format(to)}
        </span>
      </div>
      <div className="relative h-11">
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-line" />
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-accent"
          style={{ left: leftEdge(pFrom), right: rightEdge(pTo) }}
        />
        <input
          type="range"
          className="dual-range"
          aria-label={`${label}, от`}
          min={min}
          max={max}
          step={step}
          value={from}
          style={{ zIndex: pFrom > 50 ? 3 : 1 }}
          onChange={(e) => onChange(Math.min(Number(e.target.value), to), to)}
        />
        <input
          type="range"
          className="dual-range"
          aria-label={`${label}, до`}
          min={min}
          max={max}
          step={step}
          value={to}
          style={{ zIndex: 2 }}
          onChange={(e) => onChange(from, Math.max(Number(e.target.value), from))}
        />
      </div>
    </div>
  );
}
