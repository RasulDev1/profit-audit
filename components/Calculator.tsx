"use client";

import { useMemo, useState } from "react";
import {
  DEFAULT_INPUTS,
  TOOLS,
  calculate,
  formatNumber,
  formatPercent,
  formatRub,
  type ToolId,
  type ToolState,
} from "@/lib/calculator";
import { getSummary } from "@/lib/summaries";
import NumberField from "./NumberField";
import ResultPanel from "./ResultPanel";
import ToolSwitch from "./ToolSwitch";

function toNumber(value: string): number {
  const n = parseFloat(value.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export default function Calculator() {
  const [leads, setLeads] = useState(String(DEFAULT_INPUTS.leadsPerDay));
  const [check, setCheck] = useState(String(DEFAULT_INPUTS.averageCheck));
  const [conversion, setConversion] = useState(String(DEFAULT_INPUTS.baseConversion));
  const [tools, setTools] = useState<ToolState>({ comments: false, checkout: false, reactivation: false });

  const result = useMemo(
    () =>
      calculate(
        { leadsPerDay: toNumber(leads), averageCheck: toNumber(check), baseConversion: toNumber(conversion) },
        tools,
      ),
    [leads, check, conversion, tools],
  );
  const summary = getSummary(tools);

  const toggle = (id: ToolId) => setTools((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-8">
      <section className="flex flex-col gap-8 rounded-3xl border border-zinc-800 bg-zinc-950/70 p-5 sm:p-8">
        <div>
          <h2 className="mb-1 text-lg font-bold text-zinc-300 sm:text-xl">Исходные данные</h2>
          <p className="mb-5 text-sm text-zinc-500">Укажите примерные значения, точность не нужна</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <NumberField label="Лидов в Директ в день" value={leads} onChange={setLeads} />
            <NumberField label="Средний чек" suffix="₽" step={100} value={check} onChange={setCheck} />
            <NumberField label="Конверсия сейчас" suffix="%" step={0.5} value={conversion} onChange={setConversion} />
          </div>
        </div>

        <div>
          <h2 className="mb-5 text-lg font-bold text-zinc-300 sm:text-xl">Подключить инструменты</h2>
          <div className="flex flex-col gap-3">
            {TOOLS.map((tool) => (
              <ToolSwitch key={tool.id} tool={tool} on={tools[tool.id]} onToggle={() => toggle(tool.id)} />
            ))}
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <ResultPanel result={result} />

        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-6 sm:p-8">
          <div className="mb-3 text-xs font-semibold uppercase tracking-[.2em] text-zinc-500 sm:text-sm">Физика синергии</div>
          <p key={summary.key} className="fade-in text-xl font-semibold leading-snug text-zinc-100 sm:text-2xl">
            {summary.text}
          </p>
          <p className="mt-4 break-words font-mono text-sm text-zinc-500">
            {formatNumber(result.newLeads)} лидов × {formatPercent(result.newConversion)} × {formatNumber(toNumber(check))} ₽ ≈{" "}
            {formatRub(result.newRevenue)}
          </p>
          <p className="mt-3 text-xs text-zinc-600">Расчёт примерный и показывает порядок цифр, а не гарантию результата.</p>
        </div>
      </section>
    </div>
  );
}
