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
    <span className="flex min-w-0 flex-1 items-baseline gap-2 rounded-xl bg-zinc-950/60 px-3 py-2">
      <span className="text-sm text-zinc-500">{prefix}</span>
      <input
        type="number"
        min={0}
        step={step}
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-w-0 bg-transparent font-mono text-2xl font-bold text-white outline-none sm:text-3xl"
      />
    </span>
  );
}

export default function RangeField({ label, suffix, from, to, step = 1, onChange }: Props) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 transition-colors focus-within:border-emerald-500/60">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <span className="text-sm text-zinc-400">{label}</span>
        {suffix && <span className="text-sm font-semibold text-zinc-500">{suffix}</span>}
      </div>
      <div className="flex gap-2">
        <Bound prefix="от" value={from} step={step} onChange={(v) => onChange(v, to)} />
        <Bound prefix="до" value={to} step={step} onChange={(v) => onChange(from, v)} />
      </div>
    </div>
  );
}
