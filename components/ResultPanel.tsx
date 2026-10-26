import { formatNumber, formatPercent, formatSpan, type RangeResult } from "@/lib/calculator";

type Props = {
  result: RangeResult;
};

function signed(value: number): string {
  return `${value > 0 ? "+" : ""}${formatNumber(value)}`;
}

function Amount({ low, high, className }: { low: string; high: string; className: string }) {
  if (low === high) return <div className={className}>{low} руб.</div>;
  return (
    <div className={className}>
      <div>
        <span className="mr-[.25em] text-[.45em] font-semibold opacity-60">от</span>
        {low}
      </div>
      <div>
        <span className="mr-[.25em] text-[.45em] font-semibold opacity-60">до</span>
        {high} руб.
      </div>
    </div>
  );
}

function StatCard({
  title,
  revenue,
  leads,
  conversion,
  accent,
}: {
  title: string;
  revenue: [number, number];
  leads: [number, number];
  conversion: [number, number];
  accent?: boolean;
}) {
  const valueColor = accent ? "text-emerald-300" : "text-zinc-200";
  return (
    <div
      className={`rounded-3xl border p-5 sm:p-7 ${
        accent ? "border-emerald-500/40 bg-emerald-500/[.06]" : "border-zinc-800 bg-zinc-950/70"
      }`}
    >
      <div className={`mb-3 text-sm font-semibold sm:text-base ${accent ? "text-emerald-300" : "text-zinc-400"}`}>{title}</div>
      <Amount
        low={formatNumber(revenue[0])}
        high={formatNumber(revenue[1])}
        className="break-words text-3xl font-extrabold leading-tight tracking-tight text-white xl:text-4xl"
      />
      <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-zinc-500">Лидов / мес</div>
          <div className={`font-mono text-lg font-bold ${valueColor}`}>
            {formatSpan(formatNumber(leads[0]), formatNumber(leads[1]))}
          </div>
        </div>
        <div>
          <div className="text-zinc-500">Конверсия</div>
          <div className={`font-mono text-lg font-bold ${valueColor}`}>
            {formatSpan(formatPercent(conversion[0]), formatPercent(conversion[1]))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResultPanel({ result }: Props) {
  const { low, high } = result;

  return (
    <>
      <div
        className={`rounded-3xl bg-gradient-to-br from-emerald-400 to-emerald-600 p-6 text-zinc-950 shadow-[0_0_0_1px_rgba(16,185,129,.35),0_30px_80px_-20px_rgba(16,185,129,.45)] transition-opacity sm:p-10 ${
          high.gain > 0 ? "" : "opacity-60"
        }`}
      >
        <div className="mb-3 text-base font-bold uppercase tracking-wider opacity-80 sm:text-xl">Чистый прирост выручки в месяц</div>
        <Amount
          low={signed(low.gain)}
          high={signed(high.gain)}
          className="break-words text-[clamp(2.25rem,5vw,5rem)] font-extrabold leading-none tracking-tight"
        />
        <div className="mt-5 flex flex-wrap gap-2 text-sm font-semibold sm:text-base">
          <span className="rounded-full bg-zinc-950/15 px-3 py-1">
            {formatSpan(signed(low.gainPercent), signed(high.gainPercent))}% к выручке
          </span>
          <span className="rounded-full bg-zinc-950/15 px-3 py-1">
            {low.gain === high.gain
              ? `${signed(low.gain * 12)} руб. за год`
              : `от ${signed(low.gain * 12)} до ${signed(high.gain * 12)} руб. за год`}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
        <StatCard
          title="Сейчас (Ручной режим)"
          revenue={[low.currentRevenue, high.currentRevenue]}
          leads={[low.currentLeads, high.currentLeads]}
          conversion={[low.baseConversion, high.baseConversion]}
        />
        <StatCard
          title="После автоматизации"
          revenue={[low.newRevenue, high.newRevenue]}
          leads={[low.newLeads, high.newLeads]}
          conversion={[low.newConversion, high.newConversion]}
          accent
        />
      </div>
    </>
  );
}
