// Проверка данных формы и расчёт потерь. Выполняется в браузере.
import { METHODS, NICHES, methodById, nicheById, type Coefficient, type MethodId, type NicheId } from "./model";

export interface AuditInput {
  niche: NicheId;
  method: MethodId;
  leadsPerMonth: number;
  avgCheck: number;
  marginPct: number;
  conversionPct: number;
  clientBase?: number;
  comment?: string;
  /** Что у клиента уже налажено: такие пункты не считаются потерями. */
  done?: { leads?: boolean; repeat?: boolean; leak?: boolean };
}

type Parsed = { ok: true; data: AuditInput } | { ok: false; error: string };

/** Проверяет данные формы. Возвращает текст первой ошибки на русском. */
export function parseAuditInput(raw: unknown): Parsed {
  if (!raw || typeof raw !== "object") return { ok: false, error: "Пустой запрос" };
  const r = raw as Record<string, unknown>;
  const num = (key: string, label: string, min: number, max: number, int = false): number | string => {
    const v = r[key];
    if (typeof v !== "number" || !Number.isFinite(v)) return `Укажите «${label}» числом`;
    if (int && !Number.isInteger(v)) return `«${label}» должно быть целым числом`;
    if (v < min || v > max) return `«${label}» должно быть от ${min} до ${max.toLocaleString("ru-RU")}`;
    return v;
  };

  if (!NICHES.some((n) => n.id === r.niche)) return { ok: false, error: "Выберите нишу" };
  if (!METHODS.some((m) => m.id === r.method)) return { ok: false, error: "Выберите способ учёта" };

  const leadsPerMonth = num("leadsPerMonth", "Заявок в месяц", 1, 1_000_000, true);
  const avgCheck = num("avgCheck", "Средний чек", 1, 1_000_000_000);
  const marginPct = num("marginPct", "Маржа", 1, 100);
  const conversionPct = num("conversionPct", "Конверсия", 1, 100);
  const clientBase = r.clientBase === undefined ? undefined : num("clientBase", "Клиентов в базе", 0, 10_000_000, true);
  for (const v of [leadsPerMonth, avgCheck, marginPct, conversionPct, clientBase]) {
    if (typeof v === "string") return { ok: false, error: v };
  }

  if (r.comment !== undefined && (typeof r.comment !== "string" || r.comment.length > 2000)) {
    return { ok: false, error: "Комментарий должен быть не длиннее 2000 символов" };
  }

  let done: AuditInput["done"];
  if (r.done !== undefined) {
    if (!r.done || typeof r.done !== "object") return { ok: false, error: "Некорректные данные о налаженных процессах" };
    const d = r.done as Record<string, unknown>;
    done = { leads: d.leads === true, repeat: d.repeat === true, leak: d.leak === true };
  }

  return {
    ok: true,
    data: {
      niche: r.niche as NicheId,
      method: r.method as MethodId,
      leadsPerMonth: leadsPerMonth as number,
      avgCheck: avgCheck as number,
      marginPct: marginPct as number,
      conversionPct: conversionPct as number,
      clientBase: clientBase as number | undefined,
      comment: r.comment as string | undefined,
      done,
    },
  };
}

export interface LossItem {
  key: "leads" | "repeat" | "leak";
  title: string;
  assumption: string;
  monthlyProfit: number;
  coefficient: Coefficient;
}

export interface LossResult {
  items: LossItem[];
  totalMonthly: number;
  totalYearly: number;
  monthlyRevenue: number;
  monthlyGrossProfit: number;
  /** Потери как доля валовой прибыли, 0..1. */
  shareOfProfit: number;
  /** Честная словесная оценка масштаба. */
  severity: "небольшие" | "заметные" | "существенные";
  clientBaseEstimated: boolean;
}

const rub = (n: number) => `${Math.round(n).toLocaleString("ru-RU")} ₽`;
const pct = (n: number) => `${(n * 100).toLocaleString("ru-RU", { maximumFractionDigits: 1 })}%`;

export function calculateLosses(input: AuditInput): LossResult {
  const niche = nicheById(input.niche);
  const method = methodById(input.method);
  const margin = input.marginPct / 100;
  const conversion = input.conversionPct / 100;

  const ordersPerMonth = input.leadsPerMonth * conversion;
  const monthlyRevenue = ordersPerMonth * input.avgCheck;
  const monthlyGrossProfit = monthlyRevenue * margin;

  // Заявки без ответа никогда не становятся заказом, поэтому теряются только среди тех,
  // кто не купил: доля потерь применяется к некупившим. При 100% конверсии терять нечего.
  // Если на такую заявку ответить, считаем, что она купит с обычной конверсией бизнеса.
  const lostLeads = input.leadsPerMonth * (1 - conversion) * method.lostLeads.value;
  const leads: LossItem = {
    key: "leads",
    title: "Заявки без ответа или без продолжения",
    assumption:
      lostLeads >= 0.5
        ? `≈${Math.round(lostLeads).toLocaleString("ru-RU")} из ${input.leadsPerMonth.toLocaleString("ru-RU")} заявок в месяц остаются без ответа (${pct(method.lostLeads.value)} от тех, кто не купил), при ответе купили бы ${pct(conversion)}`
        : `при конверсии ${pct(conversion)} все заявки уже доходят до продажи`,
    monthlyProfit: lostLeads * conversion * input.avgCheck * margin,
    coefficient: method.lostLeads,
  };

  // Без данных о базе берём половину заказов за год: часть заказов делают одни и те же клиенты.
  const clientBaseEstimated = input.clientBase === undefined || input.clientBase === 0;
  const base = clientBaseEstimated ? Math.round(ordersPerMonth * 12 * 0.5) : input.clientBase!;
  const returnedPerYear = base * niche.repeat.value;
  const repeat: LossItem = {
    key: "repeat",
    title: niche.repeatLossTitle,
    assumption: `+${pct(niche.repeat.value)} возвратов в год из базы ${base.toLocaleString("ru-RU")} клиентов${clientBaseEstimated ? " (оценка: половина заказов за год)" : ""}`,
    monthlyProfit: (returnedPerYear / 12) * input.avgCheck * margin,
    coefficient: niche.repeat,
  };

  const leakRate = niche.leak.value;
  const leak: LossItem = {
    key: "leak",
    title: niche.leakTitle,
    assumption: `${pct(leakRate)} от выручки ${rub(monthlyRevenue)}: ${niche.leakExplain}`,
    // Утечка уже не попала в выручку, поэтому считаем её с маржой.
    monthlyProfit: monthlyRevenue * leakRate * margin,
    coefficient: niche.leak,
  };

  // Налаженные клиентом процессы не дают потерь.
  const DONE_TEXT = "по вашим словам, это уже налажено";
  const items = [leads, repeat, leak].map((item) =>
    input.done?.[item.key] ? { ...item, monthlyProfit: 0, assumption: DONE_TEXT } : item,
  );
  const totalMonthly = items.reduce((s, i) => s + i.monthlyProfit, 0);
  const shareOfProfit = monthlyGrossProfit > 0 ? totalMonthly / monthlyGrossProfit : 0;
  const severity = shareOfProfit < 0.05 ? "небольшие" : shareOfProfit < 0.15 ? "заметные" : "существенные";

  return {
    items,
    totalMonthly,
    totalYearly: totalMonthly * 12,
    monthlyRevenue,
    monthlyGrossProfit,
    shareOfProfit,
    severity,
    clientBaseEstimated,
  };
}

export { rub, pct };
