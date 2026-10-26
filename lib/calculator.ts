export const DAYS_IN_MONTH = 30;

export type ToolId = "comments" | "checkout" | "reactivation";

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
    id: "reactivation",
    title: "Бот-реаниматор / Дожимы",
    badge: "конверсия +15%",
    description: "Возвращает брошенные корзины и запускает автоматические повторные продажи.",
  },
];

export type ToolState = Record<ToolId, boolean>;

export type Inputs = {
  leadsPerDay: number;
  averageCheck: number;
  baseConversion: number;
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

export const DEFAULT_INPUTS: Inputs = {
  leadsPerDay: 20,
  averageCheck: 5000,
  baseConversion: 10,
};

export function calculate(inputs: Inputs, tools: ToolState): Result {
  const baseConversion = inputs.baseConversion / 100;
  const newLeadsPerDay = tools.comments ? inputs.leadsPerDay * 2 : inputs.leadsPerDay;

  let newConversion = baseConversion;
  if (tools.checkout) newConversion *= 1.35;
  if (tools.reactivation) newConversion *= 1.15;

  const currentLeads = inputs.leadsPerDay * DAYS_IN_MONTH;
  const newLeads = newLeadsPerDay * DAYS_IN_MONTH;
  const currentRevenue = currentLeads * baseConversion * inputs.averageCheck;
  const newRevenue = newLeads * newConversion * inputs.averageCheck;
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

export function formatNumber(value: number): string {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export function formatRub(value: number): string {
  return `${formatNumber(value)} руб.`;
}

export function formatPercent(fraction: number): string {
  return `${(Math.round(fraction * 1000) / 10).toString().replace(".", ",")}%`;
}
