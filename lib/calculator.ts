export const DAYS_IN_MONTH = 30;

export type ToolId = "comments" | "checkout" | "tracking";

export type Tool = {
  id: ToolId;
  title: string;
  badge: string;
  description: string;
};

export const TOOLS: Tool[] = [
  {
    id: "comments",
    title: "Слово в комментариях + Автоответ",
    badge: "лиды ×2",
    description: "Примерно удваивает входящий поток лидов из Reels за счёт буста алгоритмов Meta.",
  },
  {
    id: "checkout",
    title: "Сайт с онлайн-оплатой",
    badge: "конверсия +35%",
    description: "Диалог чаще превращается в оплату: СБП и авторасчёт доставки.",
  },
  {
    id: "tracking",
    title: "Бот для трекинга и разгрузки Директа",
    badge: "выручка +10%",
    description:
      "Сам выдаёт трек-номер и статус доставки, защищая Директ от вопросов «Где мой заказ?». Кнопка «Перейти в магазин» возвращает лояльных клиентов на сайт без затрат на рекламу.",
  },
];

export type ToolState = Record<ToolId, boolean>;

export type Inputs = {
  leadsPerDay: number;
  averageCheck: number;
  baseConversion: number;
};

export type Range = {
  from: number;
  to: number;
};

export type RangeInputs = Record<keyof Inputs, Range>;

export type RangeResult = {
  low: Result;
  high: Result;
};

export type Result = {
  currentLeads: number;
  newLeads: number;
  baseConversion: number;
  newConversion: number;
  currentRevenue: number;
  newRevenue: number;
  gain: number;
  gainPercent: number;
};

export const DEFAULT_INPUTS: RangeInputs = {
  leadsPerDay: { from: 15, to: 25 },
  averageCheck: { from: 4000, to: 6000 },
  baseConversion: { from: 8, to: 12 },
};

export const SLIDER_LIMITS: Record<keyof Inputs, { min: number; max: number; step: number }> = {
  leadsPerDay: { min: 1, max: 100, step: 1 },
  averageCheck: { min: 500, max: 50000, step: 500 },
  baseConversion: { min: 1, max: 30, step: 0.5 },
};

export const TRACKING_REVENUE_MULTIPLIER = 1.1;

export function calculate(inputs: Inputs, tools: ToolState): Result {
  const baseConversion = inputs.baseConversion / 100;
  const newLeadsPerDay = tools.comments ? inputs.leadsPerDay * 2 : inputs.leadsPerDay;

  let newConversion = baseConversion;
  if (tools.checkout) newConversion *= 1.35;

  const currentLeads = inputs.leadsPerDay * DAYS_IN_MONTH;
  const newLeads = newLeadsPerDay * DAYS_IN_MONTH;
  const currentRevenue = currentLeads * baseConversion * inputs.averageCheck;
  const funnelRevenue = newLeads * newConversion * inputs.averageCheck;
  const newRevenue = tools.tracking ? funnelRevenue * TRACKING_REVENUE_MULTIPLIER : funnelRevenue;
  const gain = newRevenue - currentRevenue;

  return {
    currentLeads,
    newLeads,
    baseConversion,
    newConversion,
    currentRevenue,
    newRevenue,
    gain,
    gainPercent: currentRevenue > 0 ? (gain / currentRevenue) * 100 : 0,
  };
}

export function calculateRange(inputs: RangeInputs, tools: ToolState): RangeResult {
  const pick = (side: "low" | "high"): Inputs => {
    const value = (r: Range) => (side === "low" ? Math.min(r.from, r.to) : Math.max(r.from, r.to));
    return {
      leadsPerDay: value(inputs.leadsPerDay),
      averageCheck: value(inputs.averageCheck),
      baseConversion: value(inputs.baseConversion),
    };
  };
  return { low: calculate(pick("low"), tools), high: calculate(pick("high"), tools) };
}

export function formatNumber(value: number): string {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export function formatSigned(value: number): string {
  const rounded = Math.round(value);
  return `${rounded > 0 ? "+" : ""}${formatNumber(rounded)}`;
}

export function formatRub(value: number): string {
  return `${formatNumber(value)} руб.`;
}

export function formatPercent(fraction: number): string {
  return `${(Math.round(fraction * 1000) / 10).toString().replace(".", ",")}%`;
}

export function formatSpan(low: string, high: string): string {
  return low === high ? low : `${low}–${high}`;
}
