type Props = {
  label: string;
  suffix?: string;
  from: string;
  to: string;
  step?: number;
  onChange: (from: string, to: string) => void;
};

function Bound({ prefix, value, step, onChange }: { prefix: string; value: string; step: number; onChange: (v: string) => void }) {
  return (
    <span className="flex min-w-0 flex-1 items-baseline gap-2 rounded-lg border border-line bg-canvas/60 px-3 py-2 transition-colors focus-within:border-accent focus-within:bg-surface">
      <span className="text-sm text-faint">{prefix}</span>
      <input
        type="number"
        min={0}
        step={step}
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-w-0 bg-transparent text-2xl font-semibold tabular-nums text-ink outline-none sm:text-3xl"
      />
    </span>
  );
}

export default function RangeField({ label, suffix, from, to, step = 1, onChange }: Props) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-muted">{label}</span>
        {suffix && <span className="text-sm font-medium text-faint">{suffix}</span>}
      </div>
      <div className="flex gap-2">
        <Bound prefix="от" value={from} step={step} onChange={(v) => onChange(v, to)} />
        <Bound prefix="до" value={to} step={step} onChange={(v) => onChange(from, v)} />
      </div>
    </div>
  );
}
