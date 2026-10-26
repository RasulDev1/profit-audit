type Props = {
  label: string;
  suffix?: string;
  value: string;
  step?: number;
  onChange: (value: string) => void;
};

export default function NumberField({ label, suffix, value, step = 1, onChange }: Props) {
  return (
    <label className="block rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 transition-colors focus-within:border-emerald-500/60">
      <span className="mb-2 block text-sm text-zinc-400">{label}</span>
      <span className="flex items-baseline gap-2">
        <input
          type="number"
          min={0}
          step={step}
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full min-w-0 bg-transparent font-mono text-3xl font-bold text-white outline-none sm:text-4xl"
        />
        {suffix && <span className="text-xl font-semibold text-zinc-500">{suffix}</span>}
      </span>
    </label>
  );
}
