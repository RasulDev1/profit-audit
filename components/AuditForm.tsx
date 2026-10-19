"use client";

import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { METHODS, NICHES, SOURCES, nicheById, type MethodId, type NicheId } from "@/lib/model";
import { calculateLosses, parseAuditInput, pct, rub, type LossItem } from "@/lib/calc";
import { buildReport } from "@/lib/report";
import { saveAudit } from "@/lib/supabase";

type Key = LossItem["key"];

interface FormState {
  niche: NicheId;
  method: MethodId;
  leadsPerMonth: string;
  conversionPct: string;
  avgCheck: string;
  marginPct: string;
  clientBase: string;
  done: Record<Key, boolean>;
}

const INITIAL: FormState = {
  niche: "auto",
  method: "excel_messengers",
  leadsPerMonth: "",
  conversionPct: "",
  avgCheck: "",
  marginPct: "",
  clientBase: "",
  done: { leads: false, repeat: false, leak: false },
};

const DOT: Record<Key, string> = { leads: "bg-indigo-500", repeat: "bg-teal-500", leak: "bg-amber-500" };

const SEVERITY_BADGE = {
  небольшие: "bg-emerald-100 text-emerald-800",
  заметные: "bg-amber-100 text-amber-800",
  существенные: "bg-rose-100 text-rose-800",
} as const;

const NUMBER_FIELDS = ["leadsPerMonth", "conversionPct", "avgCheck", "marginPct", "clientBase"] as const;

const toNumber = (v: string) => Number(v.replace(/\s/g, "").replace(",", "."));

function toPayload(s: FormState) {
  return {
    niche: s.niche,
    method: s.method,
    leadsPerMonth: Math.round(toNumber(s.leadsPerMonth)),
    conversionPct: toNumber(s.conversionPct),
    avgCheck: toNumber(s.avgCheck),
    marginPct: toNumber(s.marginPct),
    clientBase: s.clientBase.trim() ? Math.round(toNumber(s.clientBase)) : undefined,
    done: s.done,
  };
}

/** Состояние формы хранится в адресе страницы, чтобы аудитом можно было поделиться ссылкой. */
function readFromUrl(): { state: FormState; revealed: boolean } {
  const p = new URLSearchParams(window.location.search);
  const s: FormState = { ...INITIAL, done: { ...INITIAL.done } };
  const niche = p.get("niche");
  const method = p.get("method");
  if (niche && NICHES.some((n) => n.id === niche)) s.niche = niche as NicheId;
  if (method && METHODS.some((m) => m.id === method)) s.method = method as MethodId;
  for (const k of NUMBER_FIELDS) s[k] = p.get(k) ?? "";
  for (const k of (p.get("done") ?? "").split(",")) if (k in s.done) s.done[k as Key] = true;
  return { state: s, revealed: p.get("report") === "1" };
}

function writeToUrl(s: FormState, revealed: boolean) {
  const p = new URLSearchParams();
  p.set("niche", s.niche);
  p.set("method", s.method);
  for (const k of NUMBER_FIELDS) if (s[k].trim()) p.set(k, s[k].trim());
  const done = (Object.keys(s.done) as Key[]).filter((k) => s.done[k]);
  if (done.length) p.set("done", done.join(","));
  if (revealed) p.set("report", "1");
  window.history.replaceState(null, "", `${window.location.pathname}?${p}`);
}

export default function AuditForm() {
  const [state, setState] = useState<FormState>(INITIAL);
  const [revealed, setRevealed] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const fromUrl = readFromUrl();
    setState(fromUrl.state);
    setRevealed(fromUrl.revealed);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) writeToUrl(state, revealed);
  }, [state, revealed, loaded]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const requiredFilled = [state.leadsPerMonth, state.conversionPct, state.avgCheck, state.marginPct].every((v) => v.trim());
  const parsed = useMemo(() => (requiredFilled ? parseAuditInput(toPayload(state)) : null), [state, requiredFilled]);
  const result = useMemo(() => (parsed?.ok ? calculateLosses(parsed.data) : null), [parsed]);
  const report = useMemo(() => (parsed?.ok && result ? buildReport(parsed.data, result) : ""), [parsed, result]);
  const niche = nicheById(state.niche);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setState((s) => ({ ...s, [key]: value }));

  function reveal() {
    if (!parsed?.ok || !result) return;
    setRevealed(true);
    void saveAudit(parsed.data, result, report);
    setTimeout(() => document.getElementById("report")?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  async function copy(text: string, message: string) {
    try {
      await navigator.clipboard.writeText(text);
      setToast(message);
    } catch {
      setToast("Не удалось скопировать");
    }
  }

  const doneOptions: { key: Key; label: string }[] = [
    { key: "leads", label: "Отвечаем на каждую заявку в течение часа" },
    { key: "repeat", label: niche.repeatDone },
    { key: "leak", label: niche.leakDone },
  ];

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)]">
      <div className="no-print space-y-5">
        <Card step="1" title="Ваш бизнес">
          <p className={labelClass}>Ниша</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {NICHES.map((n) => (
              <Chip key={n.id} active={state.niche === n.id} onClick={() => set("niche", n.id)}>
                <span className="text-lg leading-none">{n.icon}</span>
                <span className="text-left text-xs leading-tight">{n.label}</span>
              </Chip>
            ))}
          </div>
          <p className={`${labelClass} mt-5`}>Как сейчас ведёте клиентов</p>
          <div className="grid grid-cols-2 gap-2">
            {METHODS.map((m) => (
              <Chip key={m.id} active={state.method === m.id} onClick={() => set("method", m.id)}>
                <span className="text-base leading-none">{m.icon}</span>
                <span className="text-left text-xs leading-tight">{m.label}</span>
              </Chip>
            ))}
          </div>
        </Card>

        <Card step="2" title="Цифры за месяц">
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Заявок в месяц" hint="Звонки, сообщения, заявки с сайта" suffix="шт." value={state.leadsPerMonth} onChange={(v) => set("leadsPerMonth", v)} placeholder="400" />
            <NumberField label="Конверсия" hint="Сколько заявок становятся заказом" suffix="%" value={state.conversionPct} onChange={(v) => set("conversionPct", v)} placeholder="60" />
            <NumberField label="Средний чек" hint="Выручка с одного заказа" suffix="₽" value={state.avgCheck} onChange={(v) => set("avgCheck", v)} placeholder="9 500" />
            <NumberField label="Маржа" hint="Какая часть чека — прибыль" suffix="%" value={state.marginPct} onChange={(v) => set("marginPct", v)} placeholder="35" />
          </div>
          <div className="mt-3">
            <NumberField label="Клиентов в базе" hint="Необязательно. Без этого оценим по заказам" suffix="чел." value={state.clientBase} onChange={(v) => set("clientBase", v)} placeholder="1 800" />
          </div>
        </Card>

        <Card step="3" title="Что у вас уже налажено">
          <p className="-mt-1 mb-3 text-sm text-slate-500">Отметьте, и этот пункт не будет считаться потерей.</p>
          <div className="space-y-2">
            {doneOptions.map((o) => (
              <label
                key={o.key}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition ${
                  state.done[o.key] ? "border-slate-900 bg-slate-50" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <input
                  type="checkbox"
                  className="size-4 accent-slate-900"
                  checked={state.done[o.key]}
                  onChange={(e) => set("done", { ...state.done, [o.key]: e.target.checked })}
                />
                <span className={`size-2 shrink-0 rounded-full ${DOT[o.key]}`} />
                <span className="text-slate-700">{o.label}</span>
              </label>
            ))}
          </div>
        </Card>
      </div>

      <div className="space-y-5 lg:sticky lg:top-6">
        {!result && (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white/60 p-8 sm:p-10">
            <p className="text-lg font-semibold text-slate-900">Здесь появится расчёт</p>
            <p className={`mt-1 ${parsed && !parsed.ok ? "text-rose-600" : "text-slate-600"}`}>
              {parsed && !parsed.ok ? parsed.error : "Заполните четыре цифры, и сервис сразу посчитает потери."}
            </p>
            <ul className="mt-6 grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
              {[
                ["💸", "Сколько прибыли теряется каждый месяц"],
                ["🎯", "Три точки потерь с расчётом и источниками"],
                ["🛠️", "Что сделать и с чего начать"],
              ].map(([icon, text]) => (
                <li key={text} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                  <span className="text-xl">{icon}</span>
                  <p className="mt-2">{text}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {result && (
          <div id="result" className="scroll-mt-4 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
            <div className="bg-slate-900 p-6 text-white sm:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm text-slate-300">Скрытые потери прибыли</p>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${SEVERITY_BADGE[result.severity]}`}>{result.severity}</span>
              </div>
              <p className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
                {rub(result.totalMonthly)}
                <span className="ml-2 text-lg font-normal text-slate-400">в месяц</span>
              </p>
              <p className="mt-2 text-slate-300">
                {rub(result.totalYearly)} в год · {pct(result.shareOfProfit)} валовой прибыли
              </p>
              {result.totalMonthly >= 1 && (
                <div className="mt-6 flex h-3 gap-0.5 overflow-hidden rounded-full bg-slate-700">
                  {result.items.map((i) => (
                    <div key={i.key} className={DOT[i.key]} style={{ width: `${(i.monthlyProfit / result.totalMonthly) * 100}%` }} />
                  ))}
                </div>
              )}
            </div>
            <ul className="divide-y divide-slate-100">
              {result.items.map((i) => (
                <li key={i.key} className="p-5 sm:px-8">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <span className={`mt-1.5 size-2.5 shrink-0 rounded-full ${DOT[i.key]}`} />
                      <div>
                        <p className="font-medium text-slate-900">{i.title}</p>
                        <p className="mt-0.5 text-sm text-slate-500">{i.assumption}</p>
                        <details className="group mt-2 text-xs text-slate-500">
                          <summary className="cursor-pointer list-none text-slate-400 hover:text-slate-600">
                            <span className="group-open:hidden">Откуда цифра ↓</span>
                            <span className="hidden group-open:inline">Скрыть ↑</span>
                          </summary>
                          <p className="mt-1.5 leading-relaxed">
                            {i.coefficient.sources.length > 0 ? (
                              <>
                                Основа: {i.coefficient.basis}. Источник:{" "}
                                {i.coefficient.sources.map((id, n) => (
                                  <span key={id}>
                                    {n > 0 && "; "}
                                    <a href={SOURCES[id].url} target="_blank" rel="noreferrer" className="underline hover:text-slate-700">
                                      {SOURCES[id].title}
                                    </a>
                                  </span>
                                ))}
                              </>
                            ) : (
                              <>Экспертная оценка: {i.coefficient.basis}.</>
                            )}
                          </p>
                        </details>
                      </div>
                    </div>
                    <p className={`whitespace-nowrap font-semibold ${i.monthlyProfit >= 1 ? "text-slate-900" : "text-emerald-600"}`}>
                      {i.monthlyProfit >= 1 ? rub(i.monthlyProfit) : "нет потерь"}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            {!revealed && (
              <div className="no-print border-t border-slate-100 p-5 sm:px-8">
                <button onClick={reveal} className="w-full rounded-xl bg-slate-900 px-4 py-3 font-medium text-white transition hover:bg-slate-700">
                  Получить полный аудит
                </button>
              </div>
            )}
          </div>
        )}

        {result && revealed && (
          <article id="report" className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
            <div className="no-print mb-6 flex flex-wrap gap-2">
              <ActionButton onClick={() => copy(report, "Текст аудита скопирован")}>📋 Скопировать текст</ActionButton>
              <ActionButton onClick={() => window.print()}>📄 Сохранить в PDF</ActionButton>
              <ActionButton onClick={() => copy(window.location.href, "Ссылка скопирована")}>🔗 Ссылка на аудит</ActionButton>
            </div>
            <div className="report">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{report}</ReactMarkdown>
            </div>
            <p className="mt-6 border-t border-slate-100 pt-4 text-xs text-slate-400">
              Коэффициенты взяты из исследований, где они есть, остальные — осторожная экспертная оценка. Точнее всего расчёт будет по вашим реальным данным.
            </p>
          </article>
        )}
      </div>

      {result && (
        <a
          href="#result"
          className="no-print fixed inset-x-4 bottom-4 z-10 flex items-center justify-between rounded-2xl bg-slate-900 px-4 py-3 text-white shadow-lg lg:hidden"
        >
          <span className="text-sm text-slate-300">Потери</span>
          <span className="font-semibold">{rub(result.totalMonthly)} в месяц →</span>
        </a>
      )}

      {toast && (
        <div className="no-print fixed inset-x-0 bottom-20 z-20 mx-auto lg:bottom-6 w-fit rounded-full bg-slate-900 px-4 py-2 text-sm text-white shadow-lg">{toast}</div>
      )}
    </div>
  );
}

const labelClass = "mb-2 text-sm font-medium text-slate-700";

function Card({ step, title, children }: { step: string; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex size-7 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">{step}</span>
        <h2 className="font-semibold text-slate-900">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex min-h-12 items-center gap-2 rounded-xl border px-2.5 py-2 transition ${
        active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
      }`}
    >
      {children}
    </button>
  );
}

function NumberField(props: { label: string; hint: string; suffix: string; value: string; placeholder: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{props.label}</span>
      <span className="relative mt-1 block">
        <input
          inputMode="decimal"
          value={props.value}
          placeholder={props.placeholder}
          onChange={(e) => props.onChange(e.target.value.replace(/[^\d\s.,]/g, ""))}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-3 pr-12 text-slate-900 transition placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none"
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-slate-400">{props.suffix}</span>
      </span>
      <span className="mt-1 block text-xs text-slate-400">{props.hint}</span>
    </label>
  );
}

function ActionButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="rounded-full border border-slate-200 px-3.5 py-1.5 text-sm text-slate-700 transition hover:border-slate-400 hover:bg-slate-50">
      {children}
    </button>
  );
}
