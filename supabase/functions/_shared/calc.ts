// Общий код браузера и функции Supabase: без внешних зависимостей, импорты с .ts.
import { METHODS, NICHES, methodById, nicheById, type MethodId, type NicheId } from "./model.ts";

export interface AuditInput {
  niche: NicheId;
  method: MethodId;
  leadsPerMonth: number;
  avgCheck: number;
  marginPct: number;
  conversionPct: number;
  clientBase?: number;
  comment?: string;
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
    },
  };
}

export interface LossItem {
  key: "leads" | "repeat" | "leak";
  title: string;
  assumption: string;
  monthlyProfit: number;
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
const pct = (n: number) => `${+(n * 100).toFixed(1)}%`;

export function calculateLosses(input: AuditInput): LossResult {
  const niche = nicheById(input.niche);
  const method = methodById(input.method);
  const margin = input.marginPct / 100;
  const conversion = input.conversionPct / 100;

  const ordersPerMonth = input.leadsPerMonth * conversion;
  const monthlyRevenue = ordersPerMonth * input.avgCheck;
  const monthlyGrossProfit = monthlyRevenue * margin;

  const lostLeads = input.leadsPerMonth * method.lostLeadShare;
  const leads: LossItem = {
    key: "leads",
    title: "Заявки без ответа или без продолжения",
    assumption: `${pct(method.lostLeadShare)} из ${input.leadsPerMonth} заявок (≈${lostLeads.toFixed(0)}) теряются, конверсия ${pct(conversion)}`,
    monthlyProfit: lostLeads * conversion * input.avgCheck * margin,
  };

  // Без данных о базе берём клиентов, пришедших за последний год.
  const clientBaseEstimated = input.clientBase === undefined || input.clientBase === 0;
  const base = clientBaseEstimated ? Math.round(ordersPerMonth * 12) : input.clientBase!;
  const returnedPerYear = base * niche.repeatUplift;
  const repeat: LossItem = {
    key: "repeat",
    title: niche.repeatLossTitle,
    assumption: `+${pct(niche.repeatUplift)} возвратов в год из базы ${base.toLocaleString("ru-RU")} клиентов${clientBaseEstimated ? " (оценка по заказам за год)" : ""}`,
    monthlyProfit: (returnedPerYear / 12) * input.avgCheck * margin,
  };

  const leakRate = niche.leakRate * method.leakMultiplier;
  const leak: LossItem = {
    key: "leak",
    title: niche.leakTitle,
    assumption: `${pct(leakRate)} от выручки ${rub(monthlyRevenue)}: ${niche.leakExplain}`,
    // Утечка уже не попала в выручку, поэтому считаем её с маржой.
    monthlyProfit: monthlyRevenue * leakRate * margin,
  };

  const items = [leads, repeat, leak];
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
