"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { METHODS, NICHES, SOURCES } from "@/lib/model";
import { calculateLosses, parseAuditInput, pct, type LossResult } from "@/lib/calc";
import { buildReport } from "@/lib/report";
import { saveAudit } from "@/lib/supabase";

const rub = (n: number) => `${Math.round(n).toLocaleString("ru-RU")} ₽`;

const field = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-slate-900 focus:outline-none";
const label = "mb-1 block text-sm font-medium text-slate-700";

export default function AuditForm() {
  const [result, setResult] = useState<LossResult | null>(null);
  const [report, setReport] = useState("");
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const num = (k: string) => Number(String(f.get(k) ?? "").replace(/\s/g, "").replace(",", "."));
    const base = String(f.get("clientBase") ?? "").trim();
    const payload = {
      niche: f.get("niche"),
      method: f.get("method"),
      leadsPerMonth: Math.round(num("leadsPerMonth")),
      avgCheck: num("avgCheck"),
      marginPct: num("marginPct"),
      conversionPct: num("conversionPct"),
      clientBase: base ? Math.round(num("clientBase")) : undefined,
      comment: String(f.get("comment") ?? "") || undefined,
    };

    const parsed = parseAuditInput(payload);
    if (!parsed.ok) {
      setResult(null);
      setReport("");
      setError(parsed.error);
      return;
    }
    const calculation = calculateLosses(parsed.data);
    const text = buildReport(parsed.data, calculation);
    setError(null);
    setResult(calculation);
    setReport(text);
    // Сохранение не блокирует показ аудита.
    void saveAudit(parsed.data, calculation, text);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <label className={label} htmlFor="niche">Ниша</label>
          <select id="niche" name="niche" className={field} defaultValue="auto">
            {NICHES.map((n) => <option key={n.id} value={n.id}>{n.label}</option>)}
          </select>
        </div>
        <div>
          <label className={label} htmlFor="method">Как сейчас ведёте клиентов</label>
          <select id="method" name="method" className={field} defaultValue="excel_messengers">
            {METHODS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label} htmlFor="leadsPerMonth">Заявок в месяц</label>
            <input id="leadsPerMonth" name="leadsPerMonth" inputMode="numeric" required className={field} placeholder="400" />
          </div>
          <div>
            <label className={label} htmlFor="conversionPct">Конверсия, %</label>
            <input id="conversionPct" name="conversionPct" inputMode="decimal" required className={field} placeholder="80" />
          </div>
          <div>
            <label className={label} htmlFor="avgCheck">Средний чек, ₽</label>
            <input id="avgCheck" name="avgCheck" inputMode="decimal" required className={field} placeholder="9500" />
          </div>
          <div>
            <label className={label} htmlFor="marginPct">Маржа, %</label>
            <input id="marginPct" name="marginPct" inputMode="decimal" required className={field} placeholder="35" />
          </div>
        </div>
        <div>
          <label className={label} htmlFor="clientBase">Клиентов в базе (необязательно)</label>
          <input id="clientBase" name="clientBase" inputMode="numeric" className={field} placeholder="1800" />
        </div>
        <div>
          <label className={label} htmlFor="comment">Что ещё важно знать (необязательно)</label>
          <textarea id="comment" name="comment" rows={3} maxLength={2000} className={field} placeholder="Например: 2 поста, запись через Telegram, запчасти заказываем в чате" />
        </div>
        <button className="w-full rounded-lg bg-slate-900 px-4 py-2.5 font-medium text-white hover:bg-slate-700">
          Найти потери
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>

      <section className="space-y-6">
        {!result && (
          <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
            Заполните форму, и сервис посчитает, где бизнес недополучает прибыль, и подготовит аудит.
          </div>
        )}
        {result && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Оценка скрытых потерь прибыли</p>
            <p className="mt-1 text-3xl font-semibold text-slate-900">{rub(result.totalMonthly)} <span className="text-base font-normal text-slate-500">в месяц</span></p>
            <p className="mt-1 text-sm text-slate-600">
              {rub(result.totalYearly)} в год, {pct(result.shareOfProfit)} валовой прибыли. Масштаб: {result.severity}.
            </p>
            <ul className="mt-4 divide-y divide-slate-100">
              {result.items.map((i) => (
                <li key={i.key} className="flex items-start justify-between gap-4 py-3">
                  <div>
                    <p className="font-medium text-slate-900">{i.title}</p>
                    <p className="text-sm text-slate-500">{i.assumption}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {i.coefficient.sources.length > 0 ? (
                        <>
                          Основа: {i.coefficient.basis}. Источник:{" "}
                          {i.coefficient.sources.map((id, n) => (
                            <span key={id}>
                              {n > 0 && "; "}
                              <a href={SOURCES[id].url} target="_blank" rel="noreferrer" className="underline hover:text-slate-600">
                                {SOURCES[id].title}
                              </a>
                            </span>
                          ))}
                        </>
                      ) : (
                        <>Экспертная оценка: {i.coefficient.basis}.</>
                      )}
                    </p>
                  </div>
                  <p className="whitespace-nowrap font-medium text-slate-900">{rub(i.monthlyProfit)}</p>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-slate-400">Коэффициенты взяты из исследований, где они есть, остальные — осторожная экспертная оценка. Точнее всего расчёт будет по вашим реальным данным.</p>
          </div>
        )}
        {report && (
          <article className="report rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{report}</ReactMarkdown>
          </article>
        )}
      </section>
    </div>
  );
}
