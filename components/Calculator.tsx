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
      <section className="flex flex-col gap-8 rounded-xl border border-line bg-surface p-5 shadow-[0_1px_2px_rgb(15_23_42/.04),0_8px_24px_-12px_rgb(15_23_42/.12)] sm:p-8">
        <div>
          <h2 className="mb-1 text-xl font-semibold tracking-tight text-ink sm:text-2xl">Исходные данные</h2>
          <p className="mb-6 text-sm text-muted">Укажите примерный диапазон: от и до</p>
          <div className="flex flex-col gap-5">
            <RangeField label="Лидов в Директ в день" {...fields.leadsPerDay} onChange={setField("leadsPerDay")} />
            <RangeField label="Средний чек" suffix="₽" step={100} {...fields.averageCheck} onChange={setField("averageCheck")} />
            <RangeField label="Конверсия сейчас" suffix="%" step={0.5} {...fields.baseConversion} onChange={setField("baseConversion")} />
          </div>
        </div>

        <div>
          <h2 className="mb-5 border-t border-line pt-8 text-xl font-semibold tracking-tight text-ink sm:text-2xl">Подключить инструменты</h2>
          <div className="flex flex-col gap-3">
            {TOOLS.map((tool) => (
              <ToolSwitch key={tool.id} tool={tool} on={tools[tool.id]} onToggle={() => toggle(tool.id)} />
            ))}
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <ResultPanel result={result} />

        <div className="rounded-xl border border-line bg-surface p-6 shadow-[0_1px_2px_rgb(15_23_42/.04),0_8px_24px_-12px_rgb(15_23_42/.12)] sm:p-8">
          <div className="mb-3 text-xs font-medium uppercase tracking-[.12em] text-faint sm:text-sm">Физика синергии</div>
          <p key={summary.key} className="fade-in text-xl font-medium leading-snug tracking-tight text-ink sm:text-2xl">
            {summary.text}
          </p>
          <p className="mt-5 break-words rounded-lg bg-canvas px-4 py-3 text-sm tabular-nums text-muted">
            {formatSpan(formatNumber(result.low.newLeads), formatNumber(result.high.newLeads))} лидов ×{" "}
            {formatSpan(formatPercent(result.low.newConversion), formatPercent(result.high.newConversion))} ×{" "}
            {formatSpan(formatNumber(checkLow), formatNumber(checkHigh))} ₽{tools.tracking && " × 1,1"} ={" "}
            {formatSpan(formatNumber(result.low.newRevenue), formatNumber(result.high.newRevenue))} руб.
          </p>
          <p className="mt-3 text-xs text-faint">Расчёт примерный и показывает порядок цифр, а не гарантию результата.</p>
        </div>
      </section>
    </div>
  );
}
