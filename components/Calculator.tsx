"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_INPUTS,
  SLIDER_LIMITS,
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
import RangeSlider from "./RangeSlider";
import ResultPanel from "./ResultPanel";
import StickyResult from "./StickyResult";
import ToolSwitch from "./ToolSwitch";

const CARD = "shadow-[0_1px_2px_rgb(15_23_42/.04),0_8px_24px_-12px_rgb(15_23_42/.12)]";

export default function Calculator() {
  const [inputs, setInputs] = useState<RangeInputs>(DEFAULT_INPUTS);
  const [tools, setTools] = useState<ToolState>({ comments: false, checkout: false, tracking: false });
  const [resultsInView, setResultsInView] = useState(false);
  const resultsRef = useRef<HTMLElement>(null);

  const result = useMemo(() => calculateRange(inputs, tools), [inputs, tools]);
  const summary = getSummary(tools);
  const fullEcosystem = tools.comments && tools.checkout && tools.tracking;

  useEffect(() => {
    const el = resultsRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setResultsInView(entry.isIntersecting), {
      rootMargin: "0px 0px -96px 0px",
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const setRange = (key: keyof Inputs) => (from: number, to: number) =>
    setInputs((prev) => ({ ...prev, [key]: { from, to } }));
  const toggle = (id: ToolId) => setTools((prev) => ({ ...prev, [id]: !prev[id] }));

  const scrollToBreakdown = () => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("breakdown")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  const checkLow = Math.min(inputs.averageCheck.from, inputs.averageCheck.to);
  const checkHigh = Math.max(inputs.averageCheck.from, inputs.averageCheck.to);

  return (
    <>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-8">
        <div className="flex flex-col gap-6">
          <section className={`rounded-xl border border-line bg-surface p-5 sm:p-8 ${CARD}`}>
            <h2 className="mb-1 text-xl font-semibold tracking-tight text-ink sm:text-2xl">Исходные данные</h2>
            <p className="mb-6 text-sm text-muted">Двигайте ползунки или впишите значения вручную</p>
            <div className="flex flex-col gap-5">
              <RangeSlider
                label="Лидов в Директ в день"
                {...SLIDER_LIMITS.leadsPerDay}
                {...inputs.leadsPerDay}
                onChange={setRange("leadsPerDay")}
              />
              <RangeSlider
                label="Средний чек"
                suffix="₽"
                {...SLIDER_LIMITS.averageCheck}
                {...inputs.averageCheck}
                onChange={setRange("averageCheck")}
              />
              <RangeSlider
                label="Конверсия сейчас"
                suffix="%"
                {...SLIDER_LIMITS.baseConversion}
                {...inputs.baseConversion}
                onChange={setRange("baseConversion")}
              />
            </div>
          </section>

          <section className={`lg:rounded-xl lg:border lg:border-line lg:bg-surface lg:p-8 ${CARD.replace("shadow", "lg:shadow")}`}>
            <h2 className="mb-4 text-xl font-semibold tracking-tight text-ink sm:text-2xl lg:mb-5">Подключить инструменты</h2>
            <div className="flex flex-col gap-3">
              {TOOLS.map((tool) => (
                <ToolSwitch key={tool.id} tool={tool} on={tools[tool.id]} onToggle={() => toggle(tool.id)} />
              ))}
            </div>
          </section>
        </div>

        <section ref={resultsRef} className="flex flex-col gap-6">
          <ResultPanel result={result} celebrate={fullEcosystem} />

          <div className={`rounded-xl border border-line bg-surface p-6 sm:p-8 ${CARD} ${fullEcosystem ? "flash" : ""}`}>
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

      <StickyResult low={result.low.gain} high={result.high.gain} hidden={resultsInView} onClick={scrollToBreakdown} />
    </>
  );
}
