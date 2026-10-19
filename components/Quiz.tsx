"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { METHODS, NICHES, SOURCES, nicheById, type MethodId, type NicheId } from "@/lib/model";
import { calculateLosses, parseAuditInput, pct, rub, type LossItem } from "@/lib/calc";
import { buildReport } from "@/lib/report";
import { saveAudit } from "@/lib/supabase";
import { SOURCES_URL, TELEGRAM_USERNAME } from "@/lib/config";

type Key = LossItem["key"];
type Step = "welcome" | "niche" | "method" | "volume" | "money" | "done" | "loading" | "result";

/** Шаги с вопросами в порядке прохождения: по ним считается прогресс. */
const QUESTIONS: Step[] = ["niche", "method", "volume", "money", "done"];

interface State {
  niche: NicheId;
  method: MethodId;
  leadsPerMonth: number;
  conversionPct: number;
  avgCheck: number;
  marginPct: number;
  /** 0 — клиент не знает размер базы, оценим по заказам. */
  clientBase: number;
  done: Record<Key, boolean>;
}

const INITIAL: State = {
  niche: "auto",
  method: "excel_messengers",
  leadsPerMonth: 100,
  conversionPct: 30,
  avgCheck: 5000,
  marginPct: 30,
  clientBase: 0,
  done: { leads: false, repeat: false, leak: false },
};

const NUMBER_FIELDS = ["leadsPerMonth", "conversionPct", "avgCheck", "marginPct", "clientBase"] as const;

/** Неравномерная шкала: мелкий шаг на малых значениях, крупный на больших. */
function scale(...ranges: [from: number, to: number, step: number][]) {
  const values: number[] = [];
  for (const [from, to, step] of ranges) for (let v = from; v <= to; v += step) if (values.at(-1) !== v) values.push(v);
  return values;
}

const SCALES = {
  leadsPerMonth: scale([5, 50, 5], [60, 200, 10], [225, 500, 25], [550, 1000, 50], [1100, 3000, 100], [3500, 10000, 500]),
  conversionPct: scale([1, 100, 1]),
  avgCheck: scale([300, 1000, 100], [1250, 5000, 250], [5500, 20000, 500], [21000, 50000, 1000], [52500, 100000, 2500], [105000, 300000, 5000], [310000, 1000000, 10000]),
  marginPct: scale([1, 100, 1]),
  clientBase: scale([0, 0, 1], [50, 500, 50], [600, 2000, 100], [2250, 5000, 250], [5500, 20000, 500], [21000, 50000, 1000]),
};

const nearestIndex = (values: number[], v: number) =>
  values.reduce((best, x, i) => (Math.abs(x - v) < Math.abs(values[best] - v) ? i : best), 0);

function plural(n: number, one: string, few: string, many: string) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}
const num = (n: number) => n.toLocaleString("ru-RU");

const LOADER_FIRST: Record<MethodId, string> = {
  memory: "Оцениваем, что теряется без учёта…",
  notebook: "Анализируем уязвимости бумажного журнала…",
  excel: "Анализируем уязвимости Excel…",
  messengers: "Ищем заявки, потерянные в чатах…",
  excel_messengers: "Сверяем чаты и таблицы…",
  partial_crm: "Ищем пробелы в работе с CRM…",
};
const LOADER_REST = ["Рассчитываем упущенную маржу…", "Сверяем с исследованиями…", "Готовим план действий…"];
const LOADER_TICK = 750;

const DOT: Record<Key, string> = { leads: "bg-indigo-400", repeat: "bg-cyan-400", leak: "bg-violet-400" };

const SEVERITY_BADGE = {
  небольшие: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/30",
  заметные: "bg-amber-400/10 text-amber-300 ring-amber-400/30",
  существенные: "bg-rose-400/10 text-rose-300 ring-rose-400/30",
} as const;

// Короткие коды для ссылки на аудит: /?r=auto.excel.400.30.5000.30
const METHOD_CODE: Record<MethodId, string> = {
  memory: "head",
  notebook: "note",
  excel: "excel",
  messengers: "chats",
  excel_messengers: "excelchats",
  partial_crm: "crm",
};
const DONE_CODE: Record<Key, string> = { leads: "l", repeat: "r", leak: "k" };

const snap = (k: (typeof NUMBER_FIELDS)[number], v: number) => SCALES[k][nearestIndex(SCALES[k], v)];

/** Ссылка на готовый аудит: ниша.учёт.заявки.конверсия.чек.маржа[.база][.налажено]. */
function encodeAudit(s: State) {
  const parts: string[] = [s.niche, METHOD_CODE[s.method], ...NUMBER_FIELDS.slice(0, 4).map((k) => String(s[k]))];
  if (s.clientBase > 0) parts.push(String(s.clientBase));
  const done = (Object.keys(s.done) as Key[]).filter((k) => s.done[k]).map((k) => DONE_CODE[k]).join("");
  if (done) parts.push(done);
  return parts.join(".");
}

function decodeAudit(code: string): State | null {
  const [niche, method, ...rest] = code.split(".");
  const methodId = (Object.keys(METHOD_CODE) as MethodId[]).find((m) => METHOD_CODE[m] === method);
  if (!NICHES.some((n) => n.id === niche) || !methodId) return null;
  const numbers = rest.filter((x) => /^\d+$/.test(x)).map(Number);
  if (numbers.length < 4) return null;
  const s: State = { ...INITIAL, niche: niche as NicheId, method: methodId, done: { ...INITIAL.done } };
  NUMBER_FIELDS.forEach((k, i) => {
    if (numbers[i] !== undefined) s[k] = snap(k, numbers[i]);
  });
  const flags = rest.find((x) => /^[a-z]+$/.test(x)) ?? "";
  for (const k of Object.keys(DONE_CODE) as Key[]) s.done[k] = flags.includes(DONE_CODE[k]);
  return s;
}

/** Старые длинные ссылки вида ?niche=auto&method=excel&leadsPerMonth=400… тоже открываются. */
function decodeLegacy(p: URLSearchParams): State | null {
  if (p.get("report") !== "1" || !p.has("leadsPerMonth")) return null;
  const s: State = { ...INITIAL, done: { ...INITIAL.done } };
  const niche = p.get("niche");
  const method = p.get("method");
  if (niche && NICHES.some((n) => n.id === niche)) s.niche = niche as NicheId;
  if (method && METHODS.some((m) => m.id === method)) s.method = method as MethodId;
  for (const k of NUMBER_FIELDS) {
    const v = Number((p.get(k) ?? "").replace(/\s/g, "").replace(",", "."));
    if (p.has(k) && Number.isFinite(v)) s[k] = snap(k, v);
  }
  for (const k of (p.get("done") ?? "").split(",")) if (k in s.done) s.done[k as Key] = true;
  return s;
}

function readFromUrl(): State | null {
  const p = new URLSearchParams(window.location.search);
  const code = p.get("r");
  return code ? decodeAudit(code) : decodeLegacy(p);
}

/** Пока идёт квиз, адрес чистый; на экране результата в нём короткая ссылка на аудит. */
function writeToUrl(s: State, showResult: boolean) {
  const query = showResult ? `?r=${encodeAudit(s)}` : "";
  window.history.replaceState(null, "", `${window.location.pathname}${query}`);
}

export default function Quiz() {
  const [state, setState] = useState<State>(INITIAL);
  const [step, setStep] = useState<Step>("welcome");
  const [loaderIndex, setLoaderIndex] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const saved = useRef(false);

  useEffect(() => {
    const fromUrl = readFromUrl();
    if (fromUrl) {
      setState(fromUrl);
      saved.current = true; // открыли готовый аудит по ссылке — повторно не сохраняем
      setStep("result");
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) writeToUrl(state, step === "result");
  }, [state, step, loaded]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const parsed = useMemo(
    () => parseAuditInput({ ...state, clientBase: state.clientBase > 0 ? state.clientBase : undefined }),
    [state],
  );
  const result = useMemo(() => (parsed.ok ? calculateLosses(parsed.data) : null), [parsed]);
  const report = useMemo(() => (parsed.ok && result ? buildReport(parsed.data, result) : ""), [parsed, result]);
  const loaderTexts = [LOADER_FIRST[state.method], ...LOADER_REST];

  useEffect(() => {
    if (step !== "loading") return;
    setLoaderIndex(0);
    const t = setInterval(() => setLoaderIndex((i) => i + 1), LOADER_TICK);
    const done = setTimeout(() => setStep("result"), LOADER_TICK * loaderTexts.length);
    return () => {
      clearInterval(t);
      clearTimeout(done);
    };
    // Тексты зависят только от способа учёта, который на этом шаге не меняется.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  useEffect(() => {
    if (step !== "result" || saved.current || !parsed.ok || !result) return;
    saved.current = true;
    void saveAudit(parsed.data, result, report);
  }, [step, parsed, result, report]);

  const set = <K extends keyof State>(key: K, value: State[K]) => setState((s) => ({ ...s, [key]: value }));
  const questionIndex = QUESTIONS.indexOf(step);
  const next = () => setStep(questionIndex < QUESTIONS.length - 1 ? QUESTIONS[questionIndex + 1] : "loading");
  const back = () => setStep(questionIndex > 0 ? QUESTIONS[questionIndex - 1] : "welcome");

  /** Выбор карточки сразу ведёт дальше: короткая пауза, чтобы было видно, что выбор принят. */
  function pick<K extends "niche" | "method">(key: K, value: State[K]) {
    set(key, value);
    setTimeout(next, 180);
  }

  async function copy(text: string, message: string) {
    try {
      await navigator.clipboard.writeText(text);
      setToast(message);
    } catch {
      setToast("Не удалось скопировать");
    }
  }

  if (!loaded) return null;

  if (step === "welcome") {
    return (
      <Shell
        top={<Logo />}
        bottom={
          <>
            <PrimaryButton onClick={() => setStep("niche")}>🚀 Рассчитать потери за 1 минуту</PrimaryButton>
            <p className="mt-3 text-center text-xs text-slate-500">
              Бесплатно, без регистрации. Расчёт по{" "}
              <a href={SOURCES_URL} target="_blank" rel="noreferrer" className="underline decoration-slate-600 underline-offset-2 hover:text-slate-300">
                открытым исследованиям
              </a>
            </p>
          </>
        }
      >
        <div className="flex h-full flex-col justify-center py-6 sm:py-10">
          <h1 className="text-[2.5rem] font-semibold leading-[1.08] tracking-tight text-white sm:text-6xl">
            Сколько денег теряет ваш бизнес из-за <span className="text-gradient">ручного учёта?</span>
          </h1>
        </div>
      </Shell>
    );
  }

  if (step === "loading") {
    return (
      <Shell top={<Logo />}>
        <div className="flex h-full flex-col items-center justify-center gap-8 py-16 text-center" role="status" aria-live="polite">
          <div className="relative size-24">
            <div className="absolute inset-0 rounded-full border-4 border-white/5" />
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-indigo-400 border-r-cyan-400" />
            <div className="absolute inset-5 animate-pulse rounded-full bg-gradient-to-br from-indigo-500/40 to-cyan-400/30 blur-md" />
          </div>
          <p key={loaderIndex} className="fade-in min-h-14 max-w-xs text-lg font-medium text-white">
            {loaderTexts[Math.min(loaderIndex, loaderTexts.length - 1)]}
          </p>
        </div>
      </Shell>
    );
  }

  if (step === "result" && result) {
    const total = result.totalMonthly;
    const telegramUrl = TELEGRAM_USERNAME
      ? `https://t.me/${TELEGRAM_USERNAME}?text=${encodeURIComponent(
          `Здравствуйте! Прошёл аудит потерь: ${rub(total)} в месяц. Хочу обсудить, как их остановить. ${window.location.href}`,
        )}`
      : null;
    return (
      <div className="mx-auto w-full max-w-3xl px-4 pb-32 sm:pb-36">
        <header className="no-print flex h-16 items-center justify-between">
          <Logo />
          <button
            onClick={() => {
              saved.current = false;
              setStep("niche");
            }}
            className="min-h-12 rounded-full px-4 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
          >
            ↺ Пройти заново
          </button>
        </header>

        <section className="print-light fade-in overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-600/25 via-violet-600/15 to-cyan-500/10 p-6 shadow-2xl shadow-indigo-950/40 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm text-slate-300">Скрытые потери прибыли</p>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${SEVERITY_BADGE[result.severity]}`}>{result.severity}</span>
          </div>
          <p className="mt-3 text-5xl font-semibold tabular-nums tracking-tight text-white sm:text-7xl">
            {total >= 1 ? <span className="text-gradient">{rub(total)}</span> : "0 ₽"}
          </p>
          <p className="mt-1 text-lg text-slate-300">в месяц</p>
          <p className="mt-3 text-sm text-slate-400">
            {rub(result.totalYearly)} в год · {pct(result.shareOfProfit)} валовой прибыли
          </p>
          {total >= 1 && (
            <div className="mt-6 flex h-3 gap-1 overflow-hidden rounded-full bg-white/5">
              {result.items.map((i) => (
                <div key={i.key} className={`${DOT[i.key]} rounded-full`} style={{ width: `${(i.monthlyProfit / total) * 100}%` }} />
              ))}
            </div>
          )}
          <ul className="mt-5 space-y-3">
            {result.items.map((i) => (
              <li key={i.key} className="flex items-start justify-between gap-4 text-sm">
                <span className="flex items-start gap-2.5">
                  <span className={`mt-1.5 size-2 shrink-0 rounded-full ${DOT[i.key]}`} />
                  <span className="text-slate-200">{i.title}</span>
                </span>
                <span className={`whitespace-nowrap font-semibold tabular-nums ${i.monthlyProfit >= 1 ? "text-white" : "text-emerald-400"}`}>
                  {i.monthlyProfit >= 1 ? rub(i.monthlyProfit) : "нет потерь"}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <article className="print-light mt-4 rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur sm:p-8">
          <div className="no-print mb-4 flex items-center justify-between gap-3">
            <h2 className="font-semibold text-white">Полный аудит</h2>
            <div className="flex gap-1">
              <IconButton label="Скопировать текст" onClick={() => copy(report, "Текст аудита скопирован")}>📋</IconButton>
              <IconButton label="Сохранить в PDF" onClick={() => window.print()}>📄</IconButton>
              <IconButton label="Скопировать ссылку" onClick={() => copy(window.location.href, "Ссылка скопирована")}>🔗</IconButton>
            </div>
          </div>
          <div className="report-scroll -mx-1 max-h-60 overflow-y-auto overscroll-contain px-1 sm:max-h-none sm:overflow-visible">
            <div className="report">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{report}</ReactMarkdown>
            </div>
          </div>
        </article>

        <details className="no-print mt-4 rounded-3xl border border-white/10 bg-white/[0.02] p-5 text-sm text-slate-400 sm:px-8">
          <summary className="min-h-6 cursor-pointer text-slate-300">Откуда цифры</summary>
          <ul className="mt-3 space-y-3">
            {result.items.map((i) => (
              <li key={i.key}>
                <p className="text-slate-200">{i.title}</p>
                <p className="mt-0.5">{i.assumption}.</p>
                <p className="mt-0.5">
                  {i.coefficient.sources.length > 0 ? (
                    <>
                      Основа: {i.coefficient.basis}. Источник:{" "}
                      {i.coefficient.sources.map((id, n) => (
                        <span key={id}>
                          {n > 0 && "; "}
                          <a href={SOURCES[id].url} target="_blank" rel="noreferrer" className="text-indigo-300 underline decoration-indigo-300/40 underline-offset-2">
                            {SOURCES[id].title}
                          </a>
                        </span>
                      ))}
                    </>
                  ) : (
                    <>Экспертная оценка: {i.coefficient.basis}.</>
                  )}
                </p>
              </li>
            ))}
          </ul>
        </details>

        <div className="no-print fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-[#07070c]/85 backdrop-blur-xl">
          <div className="mx-auto max-w-3xl px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {telegramUrl ? (
              <a href={telegramUrl} target="_blank" rel="noreferrer" className={primaryClass}>
                💬 Остановить потери: обсудить в Telegram
              </a>
            ) : (
              <PrimaryButton onClick={() => copy(window.location.href, "Ссылка на аудит скопирована")}>🔗 Скопировать ссылку на аудит</PrimaryButton>
            )}
          </div>
        </div>

        {toast && <Toast>{toast}</Toast>}
      </div>
    );
  }

  const niche = nicheById(state.niche);
  const top = (
    <div className="flex w-full items-center gap-3">
      <button onClick={back} aria-label="Назад" className="flex size-12 shrink-0 items-center justify-center rounded-full text-xl text-slate-300 transition hover:bg-white/5 active:bg-white/10">
        ←
      </button>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-500" style={{ width: `${((questionIndex + 1) / QUESTIONS.length) * 100}%` }} />
      </div>
      <span className="w-12 shrink-0 text-right text-sm tabular-nums text-slate-500">
        {questionIndex + 1}/{QUESTIONS.length}
      </span>
    </div>
  );

  if (step === "niche" || step === "method") {
    const isNiche = step === "niche";
    const options = isNiche ? NICHES : METHODS;
    const current = isNiche ? state.niche : state.method;
    return (
      <Shell top={top}>
        <Question title={isNiche ? "Чем занимается ваш бизнес?" : "Как сейчас ведёте клиентов?"} />
        <div className={`grid grid-cols-1 gap-2.5 pb-6 ${isNiche ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
          {options.map((o) => (
            <button
              key={o.id}
              type="button"
              aria-pressed={current === o.id}
              onClick={() => (isNiche ? pick("niche", o.id as NicheId) : pick("method", o.id as MethodId))}
              className={`flex min-h-14 items-center gap-3 rounded-2xl border px-4 py-3 text-left transition active:scale-[0.98] ${
                current === o.id
                  ? "border-indigo-400/60 bg-gradient-to-br from-indigo-500/25 to-violet-500/20 text-white"
                  : "border-white/10 bg-white/[0.03] text-slate-200 hover:border-white/25 hover:bg-white/[0.06]"
              }`}
            >
              <span className="text-2xl leading-none">{o.icon}</span>
              <span className="text-[15px] leading-snug">{o.label}</span>
            </button>
          ))}
        </div>
      </Shell>
    );
  }

  if (step === "volume") {
    return (
      <Shell top={top} bottom={<PrimaryButton onClick={next}>Далее</PrimaryButton>}>
        <Question title="Сколько обращений и продаж?" hint="Примерно, за обычный месяц." />
        <div className="space-y-8 pb-6">
          <Slider
            label="Заявок в месяц"
            hint="Звонки, сообщения, заявки с сайта"
            values={SCALES.leadsPerMonth}
            value={state.leadsPerMonth}
            onChange={(v) => set("leadsPerMonth", v)}
            format={(v) => `${num(v)} ${plural(v, "заявка", "заявки", "заявок")}`}
          />
          <Slider
            label="Конверсия в продажу"
            hint="Сколько заявок из 100 становятся заказом"
            values={SCALES.conversionPct}
            value={state.conversionPct}
            onChange={(v) => set("conversionPct", v)}
            format={(v) => `${v}%`}
          />
        </div>
      </Shell>
    );
  }

  if (step === "money") {
    return (
      <Shell top={top} bottom={<PrimaryButton onClick={next}>Далее</PrimaryButton>}>
        <Question title="Сколько приносит один заказ?" />
        <div className="space-y-8 pb-6">
          <Slider label="Средний чек" values={SCALES.avgCheck} value={state.avgCheck} onChange={(v) => set("avgCheck", v)} format={rub} />
          <Slider label="Маржа" hint="Какая часть чека остаётся прибылью" values={SCALES.marginPct} value={state.marginPct} onChange={(v) => set("marginPct", v)} format={(v) => `${v}%`} />
          <Slider
            label="Клиентов в базе"
            hint="Если не знаете, оставьте ползунок в начале"
            values={SCALES.clientBase}
            value={state.clientBase}
            onChange={(v) => set("clientBase", v)}
            format={(v) => (v === 0 ? "Не знаю" : `${num(v)} ${plural(v, "клиент", "клиента", "клиентов")}`)}
          />
        </div>
      </Shell>
    );
  }

  // step === "done"
  const doneOptions: { key: Key; label: string }[] = [
    { key: "leads", label: "Отвечаем на каждую заявку в течение часа" },
    { key: "repeat", label: niche.repeatDone },
    { key: "leak", label: niche.leakDone },
  ];
  return (
    <Shell top={top} bottom={<PrimaryButton onClick={next}>Рассчитать потери</PrimaryButton>}>
      <Question title="Что у вас уже налажено?" hint="Отметьте, что уже работает. Если ничего, просто жмите «Рассчитать»." />
      <div className="space-y-2.5 pb-6">
        {doneOptions.map((o) => {
          const on = state.done[o.key];
          return (
            <button
              key={o.key}
              type="button"
              role="checkbox"
              aria-checked={on}
              onClick={() => set("done", { ...state.done, [o.key]: !on })}
              className={`flex min-h-16 w-full items-center gap-4 rounded-2xl border px-4 py-3 text-left transition active:scale-[0.98] ${
                on ? "border-indigo-400/60 bg-indigo-500/15 text-white" : "border-white/10 bg-white/[0.03] text-slate-200 hover:border-white/25"
              }`}
            >
              <span className={`flex size-7 shrink-0 items-center justify-center rounded-lg border text-sm font-bold transition ${on ? "border-indigo-400 bg-indigo-500 text-white" : "border-white/20"}`}>
                {on && "✓"}
              </span>
              <span className="text-[15px] leading-snug">{o.label}</span>
            </button>
          );
        })}
      </div>
    </Shell>
  );
}

const primaryClass =
  "flex min-h-14 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 px-5 text-center text-base font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:brightness-110 active:scale-[0.98]";

/** Экран квиза: фиксированная высота на телефоне, кнопка действия внизу под большим пальцем. */
function Shell({ top, bottom, children }: { top: React.ReactNode; bottom?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mx-auto flex h-[100dvh] w-full max-w-2xl flex-col px-4 sm:h-auto sm:min-h-[100dvh] sm:justify-center sm:py-10">
      <header className="flex h-16 shrink-0 items-center">{top}</header>
      <div className="fade-in min-h-0 flex-1 overflow-y-auto overscroll-contain sm:flex-none sm:overflow-visible">{children}</div>
      {bottom && <div className="shrink-0 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pt-6">{bottom}</div>}
    </div>
  );
}

function Logo() {
  return (
    <span className="flex items-center gap-2.5 font-semibold tracking-tight text-white">
      <svg viewBox="0 0 32 32" className="size-7" aria-hidden>
        <defs>
          <linearGradient id="logo" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#6366f1" />
            <stop offset="1" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="8" fill="url(#logo)" />
        <rect x="7" y="17" width="4" height="8" rx="1" fill="#fff" fillOpacity=".55" />
        <rect x="14" y="12" width="4" height="13" rx="1" fill="#fff" fillOpacity=".8" />
        <rect x="21" y="7" width="4" height="18" rx="1" fill="#fff" />
      </svg>
      Аудит потерь
    </span>
  );
}

function Question({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mb-6 mt-2">
      <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{title}</h1>
      {hint && <p className="mt-2 text-slate-400">{hint}</p>}
    </div>
  );
}

function PrimaryButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={primaryClass}>
      {children}
    </button>
  );
}

function Slider(props: { label: string; hint?: string; values: number[]; value: number; onChange: (v: number) => void; format: (v: number) => string }) {
  const { values } = props;
  const index = nearestIndex(values, props.value);
  const setIndex = (i: number) => props.onChange(values[Math.max(0, Math.min(values.length - 1, i))]);
  const progress = (index / (values.length - 1)) * 100;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-medium text-slate-200">{props.label}</p>
      </div>
      <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-white">{props.format(values[index])}</p>
      {props.hint && <p className="mt-1 text-sm text-slate-500">{props.hint}</p>}
      <div className="mt-3 flex items-center gap-3">
        <StepButton label={`Уменьшить: ${props.label}`} disabled={index === 0} onClick={() => setIndex(index - 1)}>
          −
        </StepButton>
        <input
          type="range"
          min={0}
          max={values.length - 1}
          step={1}
          value={index}
          aria-label={props.label}
          aria-valuetext={props.format(values[index])}
          onChange={(e) => setIndex(Number(e.target.value))}
          className="range min-w-0 flex-1"
          style={{ "--p": `${progress}%` } as React.CSSProperties}
        />
        <StepButton label={`Увеличить: ${props.label}`} disabled={index === values.length - 1} onClick={() => setIndex(index + 1)}>
          +
        </StepButton>
      </div>
    </div>
  );
}

function StepButton({ label, disabled, onClick, children }: { label: string; disabled: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-2xl text-white transition hover:bg-white/10 active:scale-95 disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className="flex size-12 items-center justify-center rounded-xl text-lg transition hover:bg-white/5 active:bg-white/10">
      {children}
    </button>
  );
}

function Toast({ children }: { children: React.ReactNode }) {
  return (
    <div className="no-print fixed inset-x-0 bottom-24 z-30 mx-auto w-fit rounded-full border border-white/10 bg-[#0d0d16] px-4 py-2 text-sm text-white shadow-lg">{children}</div>
  );
}
