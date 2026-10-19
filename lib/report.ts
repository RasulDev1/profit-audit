// Собирает текст аудита из шаблонов lib/templates.ts.
// Варианты выбираются детерминированно: одинаковые данные дают одинаковый текст.

import { rub, pct, type AuditInput, type LossItem, type LossResult } from "./calc";
import {
  AMOUNT,
  ECONOMICS,
  MAIN_LOSS,
  NO_LOSS,
  METHOD_TEXT,
  NICHE_TEXT,
  OBSERVATIONS,
  SEVERITY_TEXT,
  SOLUTION_INTRO,
  START_INTRO,
  START_STEP,
} from "./templates";

/** Генератор псевдослучайных чисел mulberry32 с сидом из хеша строки. */
function createRandom(seedText: string) {
  let h = 2166136261;
  for (let i = 0; i < seedText.length; i++) {
    h ^= seedText.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const fill = (text: string, vars: Record<string, string>) =>
  text.replace(/\{(\w+)\}/g, (m, key: string) => vars[key] ?? m);

export function buildReport(input: AuditInput, result: LossResult): string {
  const random = createRandom(JSON.stringify(input));
  const pick = <T,>(variants: readonly T[]): T => variants[Math.floor(random() * variants.length)];

  const niche = NICHE_TEXT[input.niche];
  const method = METHOD_TEXT[input.method];
  const items = [...result.items].sort((a, b) => b.monthlyProfit - a.monthlyProfit);
  const total = result.totalMonthly;

  const ordersPerYear = input.leadsPerMonth * (input.conversionPct / 100) * 12;
  const vars: Record<string, string> = {
    total: rub(total),
    share: pct(result.shareOfProfit),
    conv: String(input.conversionPct),
    margin: String(input.marginPct),
    leads: input.leadsPerMonth.toLocaleString("ru-RU"),
    check: rub(input.avgCheck),
    base: (input.clientBase ?? 0).toLocaleString("ru-RU"),
    half: rub(total / 2),
    halfYear: rub(total * 6),
  };

  // Наблюдения по цифрам клиента: не больше трёх, в порядке важности.
  const observations: string[] = [];
  const observe = (condition: boolean, variants: string[]) => {
    if (condition && observations.length < 3) observations.push(fill(pick(variants), vars));
  };
  if (result.clientBaseEstimated) observe(true, OBSERVATIONS.estimatedBase);
  else {
    observe(input.clientBase! < ordersPerYear * 0.25, OBSERVATIONS.smallBase);
    observe(input.clientBase! > ordersPerYear * 2, OBSERVATIONS.bigBase);
  }
  observe(input.conversionPct < 25, OBSERVATIONS.lowConversion);
  observe(input.conversionPct >= 100, OBSERVATIONS.perfectConversion);
  observe(input.conversionPct >= 70 && input.conversionPct < 100, OBSERVATIONS.highConversion);
  observe(input.marginPct < 20, OBSERVATIONS.lowMargin);
  observe(input.marginPct >= 50, OBSERVATIONS.highMargin);
  observe(input.leadsPerMonth >= 1000, OBSERVATIONS.manyLeads);
  observe(input.leadsPerMonth <= 50, OBSERVATIONS.fewLeads);
  observe(input.avgCheck >= 100_000, OBSERVATIONS.highCheck);

  const main = items[0];
  const mainShare = total > 0 ? main.monthlyProfit / total : 0;

  const cause = (item: LossItem) =>
    item.key === "leads"
      ? `${pick(method.leadsCause)} ${pick(niche.leadsWhy)}`
      : item.key === "repeat"
        ? `${pick(method.repeatCause)} ${pick(niche.repeatWhy)}`
        : // В нишах, где утечка не связана с ручным учётом (корзины, неявки, оплаты), причина из способа учёта не подходит.
          ["ecommerce", "services", "education"].includes(input.niche)
          ? pick(niche.leakWhy)
          : `${pick(niche.leakWhy)} ${pick(method.leakCause)}`;

  // Пункт без потерь (например, заявки при 100% конверсии) не требует решения.
  const hasLoss = (item: LossItem) => item.monthlyProfit >= 1;
  const active = items.filter(hasLoss);
  const point = (item: LossItem) =>
    hasLoss(item)
      ? `**${item.title}.** ${cause(item)} ${fill(pick(AMOUNT), { sum: rub(item.monthlyProfit), assumption: item.assumption })}`
      : `**${item.title}.** ${fill(pick(NO_LOSS), { assumption: item.assumption })}`;

  const fix = (item: LossItem) => pick(niche.fix[item.key]);
  const startStep = (item: LossItem) => (item.key === "leak" ? pick(niche.leakStart) : pick(START_STEP[item.key]));

  const lines = [
    "#### 📋 Операционный анализ ситуации",
    "",
    pick(niche.context),
    "",
    pick(method.analysis),
    "",
    ...(observations.length ? [observations.join(" "), ""] : []),
    fill(pick(SEVERITY_TEXT[result.severity]), vars),
    "",
    fill(pick(MAIN_LOSS), { share: pct(mainShare), title: main.title }),
    "",
    "#### ⚠️ 3 критические точки потери прибыли",
    "",
    ...items.map((item, i) => `${i + 1}. ${point(item)}`),
    "",
    "#### 🛠️ Инженерное решение проблемы",
    "",
    pick(SOLUTION_INTRO),
    "",
    ...active.map((item) => `- ${fix(item)}`),
    "",
    pick(method.migration),
    "",
    fill(pick(ECONOMICS[result.severity]), vars),
    "",
    pick(START_INTRO),
    "",
    ...active.map((item, i) => `${i + 1}. ${startStep(item)}`),
  ];

  return lines.join("\n");
}
