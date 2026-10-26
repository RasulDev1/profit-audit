"use client";

import { formatNumber, formatPercent, formatSigned, formatSpan, type RangeResult } from "@/lib/calculator";
import AnimatedNumber from "./AnimatedNumber";

type Props = {
  result: RangeResult;
  celebrate: boolean;
};

function Amount({ low, high, className, signed }: { low: number; high: number; className: string; signed?: boolean }) {
  const same = Math.round(low) === Math.round(high);
  return (
    <div className={className}>
      <div>
        {!same && <span className="mr-[.25em] text-[.4em] font-medium opacity-70">от</span>}
        <AnimatedNumber value={low} signed={signed} />
        {same && " руб."}
      </div>
      {!same && (
        <div>
          <span className="mr-[.25em] text-[.4em] font-medium opacity-70">до</span>
          <AnimatedNumber value={high} signed={signed} /> руб.
        </div>
      )}
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
  const valueColor = accent ? "text-accent" : "text-ink";
  return (
    <div
      className={`rounded-xl border p-5 shadow-[0_1px_2px_rgb(15_23_42/.04),0_8px_24px_-12px_rgb(15_23_42/.12)] sm:p-7 ${
        accent ? "border-accent/40 bg-accent-soft" : "border-line bg-surface"
      }`}
    >
      <div className={`mb-3 text-xs font-medium uppercase tracking-[.1em] sm:text-sm ${accent ? "text-accent" : "text-faint"}`}>{title}</div>
      <Amount
        low={revenue[0]}
        high={revenue[1]}
        className={`break-words text-3xl font-semibold leading-tight tracking-tight tabular-nums xl:text-4xl ${valueColor}`}
      />
      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-line pt-4 text-sm">
        <div>
          <div className="text-faint">Лидов / мес</div>
          <div className={`text-lg font-semibold tabular-nums ${valueColor}`}>
            {formatSpan(formatNumber(leads[0]), formatNumber(leads[1]))}
          </div>
        </div>
        <div>
          <div className="text-faint">Конверсия</div>
          <div className={`text-lg font-semibold tabular-nums ${valueColor}`}>
            {formatSpan(formatPercent(conversion[0]), formatPercent(conversion[1]))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResultPanel({ result, celebrate }: Props) {
  const { low, high } = result;

  return (
    <>
      <div
        className={`relative overflow-hidden rounded-xl bg-accent p-6 text-white shadow-[0_20px_50px_-24px_rgb(37_99_235/.8)] transition-opacity sm:p-10 ${
          high.gain > 0 ? "" : "opacity-60"
        }`}
      >
        {celebrate && <span className="shimmer" aria-hidden="true" />}
        <div className="mb-4 text-sm font-medium uppercase tracking-[.12em] text-white/80 sm:text-base">Чистый прирост выручки в месяц</div>
        <Amount
          low={low.gain}
          high={high.gain}
          signed
          className="break-words text-[clamp(2.25rem,5vw,5rem)] font-semibold leading-[1.05] tracking-[-0.025em] tabular-nums"
        />
        <div className="mt-6 flex flex-wrap gap-2 text-sm font-medium sm:text-base">
          <span className="rounded-md bg-white/15 px-3 py-1">
            {formatSpan(formatSigned(low.gainPercent), formatSigned(high.gainPercent))}% к выручке
          </span>
          <span className="rounded-md bg-white/15 px-3 py-1">
            {Math.round(low.gain) === Math.round(high.gain)
              ? `${formatSigned(low.gain * 12)} руб. за год`
              : `от ${formatSigned(low.gain * 12)} до ${formatSigned(high.gain * 12)} руб. за год`}
          </span>
        </div>
      </div>

      <div id="breakdown" className="grid scroll-mt-4 grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
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
