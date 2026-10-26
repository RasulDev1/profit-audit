import { formatNumber, formatPercent, formatRub, type Result } from "@/lib/calculator";

type Props = {
  result: Result;
};

function StatCard({
  title,
  revenue,
  leads,
  conversion,
  accent,
}: {
  title: string;
  revenue: number;
  leads: number;
  conversion: number;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-3xl border p-5 sm:p-7 ${
        accent ? "border-emerald-500/40 bg-emerald-500/[.06]" : "border-zinc-800 bg-zinc-950/70"
      }`}
    >
      <div className={`mb-3 text-sm font-semibold sm:text-base ${accent ? "text-emerald-300" : "text-zinc-400"}`}>{title}</div>
      <div className="break-words text-3xl font-extrabold tracking-tight text-white sm:text-3xl xl:text-4xl">
        ≈ {formatRub(revenue)}
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-zinc-500">Лидов / мес</div>
          <div className={`font-mono text-lg font-bold ${accent ? "text-emerald-300" : "text-zinc-200"}`}>~{formatNumber(leads)}</div>
        </div>
        <div>
          <div className="text-zinc-500">Конверсия</div>
          <div className={`font-mono text-lg font-bold ${accent ? "text-emerald-300" : "text-zinc-200"}`}>~{formatPercent(conversion)}</div>
        </div>
      </div>
    </div>
  );
}

export default function ResultPanel({ result }: Props) {
  const sign = result.gain > 0 ? "+" : "";

  return (
    <>
      <div
        className={`rounded-3xl bg-gradient-to-br from-emerald-400 to-emerald-600 p-6 text-zinc-950 shadow-[0_0_0_1px_rgba(16,185,129,.35),0_30px_80px_-20px_rgba(16,185,129,.45)] transition-opacity sm:p-10 ${
          result.gain > 0 ? "" : "opacity-60"
        }`}
      >
        <div className="mb-3 text-base font-bold uppercase tracking-wider opacity-80 sm:text-xl">Чистый прирост выручки в месяц</div>
        <div className="break-words text-[clamp(2.25rem,5vw,5rem)] font-extrabold leading-none tracking-tight">
          ≈ {sign}
          {formatRub(result.gain)}
        </div>
        <div className="mt-5 flex flex-wrap gap-2 text-sm font-semibold sm:text-base">
          <span className="rounded-full bg-zinc-950/15 px-3 py-1">
            ~{sign}
            {formatNumber(result.gainPercent)}% к выручке
          </span>
          <span className="rounded-full bg-zinc-950/15 px-3 py-1">
            ≈ {sign}
            {formatRub(result.gain * 12)} за год
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
        <StatCard
          title="Сейчас (Ручной режим)"
          revenue={result.currentRevenue}
          leads={result.currentLeads}
          conversion={result.baseConversion}
        />
        <StatCard
          title="После автоматизации"
          revenue={result.newRevenue}
          leads={result.newLeads}
          conversion={result.newConversion}
          accent
        />
      </div>
    </>
  );
}
