import { z } from "zod";
import { METHODS, NICHES, methodById, nicheById, type MethodId, type NicheId } from "./model";

export const auditInputSchema = z.object({
  niche: z.enum(NICHES.map((n) => n.id) as [NicheId, ...NicheId[]]),
  method: z.enum(METHODS.map((m) => m.id) as [MethodId, ...MethodId[]]),
  leadsPerMonth: z.number().int().min(1).max(1_000_000),
  avgCheck: z.number().min(1).max(1_000_000_000),
  marginPct: z.number().min(1).max(100),
  conversionPct: z.number().min(1).max(100),
  clientBase: z.number().int().min(0).max(10_000_000).optional(),
  comment: z.string().max(2000).optional(),
});

export type AuditInput = z.infer<typeof auditInputSchema>;

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
