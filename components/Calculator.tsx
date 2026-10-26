"use client";

import { useMemo, useState } from "react";
import {
  DEFAULT_INPUTS,
  TOOLS,
  calculateRange,
  formatNumber,
  formatPercent,
  formatSpan,
  type Inputs,
  type RangeInputs,
  type ToolId,
  type ToolState,
} from "@/lib/calculator";
import { getSummary } from "@/lib/summaries";
import RangeField from "./RangeField";
import ResultPanel from "./ResultPanel";
import ToolSwitch from "./ToolSwitch";

type Field = { from: string; to: string };
type Fields = Record<keyof Inputs, Field>;

function toNumber(value: string): number {
  const n = parseFloat(value.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function toFields(inputs: RangeInputs): Fields {
  const field = ({ from, to }: { from: number; to: number }) => ({ from: String(from), to: String(to) });
  return {
    leadsPerDay: field(inputs.leadsPerDay),
    averageCheck: field(inputs.averageCheck),
    baseConversion: field(inputs.baseConversion),
  };
}

function toInputs(fields: Fields): RangeInputs {
  const range = ({ from, to }: Field) => ({ from: toNumber(from), to: toNumber(to) });
  return {
    leadsPerDay: range(fields.leadsPerDay),
    averageCheck: range(fields.averageCheck),
    baseConversion: range(fields.baseConversion),
  };
}

export default function Calculator() {
  const [fields, setFields] = useState<Fields>(() => toFields(DEFAULT_INPUTS));
  const [tools, setTools] = useState<ToolState>({ comments: false, checkout: false, tracking: false });

  const inputs = useMemo(() => toInputs(fields), [fields]);
  const result = useMemo(() => calculateRange(inputs, tools), [inputs, tools]);
  const summary = getSummary(tools);

  const setField = (key: keyof Inputs) => (from: string, to: string) => setFields((prev) => ({ ...prev, [key]: { from, to } }));
  const toggle = (id: ToolId) => setTools((prev) => ({ ...prev, [id]: !prev[id] }));

  const checkLow = Math.min(inputs.averageCheck.from, inputs.averageCheck.to);
  const checkHigh = Math.max(inputs.averageCheck.from, inputs.averageCheck.to);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-8">
      <section className="flex flex-col gap-8 rounded-3xl border border-zinc-800 bg-zinc-950/70 p-5 sm:p-8">
        <div>
          <h2 className="mb-1 text-lg font-bold text-zinc-300 sm:text-xl">Исходные данные</h2>
          <p className="mb-5 text-sm text-zinc-500">Укажите примерный диапазон: от и до</p>
          <div className="flex flex-col gap-4">
            <RangeField label="Лидов в Директ в день" {...fields.leadsPerDay} onChange={setField("leadsPerDay")} />
            <RangeField label="Средний чек" suffix="₽" step={100} {...fields.averageCheck} onChange={setField("averageCheck")} />
            <RangeField label="Конверсия сейчас" suffix="%" step={0.5} {...fields.baseConversion} onChange={setField("baseConversion")} />
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
            {formatSpan(formatNumber(result.low.newLeads), formatNumber(result.high.newLeads))} лидов ×{" "}
            {formatSpan(formatPercent(result.low.newConversion), formatPercent(result.high.newConversion))} ×{" "}
            {formatSpan(formatNumber(checkLow), formatNumber(checkHigh))} ₽{tools.tracking && " × 1,1"} ={" "}
            {formatSpan(formatNumber(result.low.newRevenue), formatNumber(result.high.newRevenue))} руб.
          </p>
          <p className="mt-3 text-xs text-zinc-600">Расчёт примерный и показывает порядок цифр, а не гарантию результата.</p>
        </div>
      </section>
    </div>
  );
}
