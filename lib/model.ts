// Справочники ниш и способов учёта с коэффициентами потерь.
// Где есть исследование, коэффициент выведен из него (см. SOURCES и поле basis).
// Где исследований нет, стоит осторожная экспертная оценка, и это явно помечено.
// Полный разбор — в docs/sources.md.

export type NicheId =
  | "auto"
  | "ecommerce"
  | "services"
  | "realty"
  | "b2b"
  | "construction"
  | "education"
  | "food"
  | "other";
export type MethodId = "memory" | "notebook" | "excel" | "messengers" | "excel_messengers" | "partial_crm";
export type SourceId = "uis2026" | "workato2026" | "cochrane2018" | "baymard2025" | "klaviyo2024" | "treatwell2025" | "rework2018";

export interface Source {
  title: string;
  url: string;
  finding: string;
}

export const SOURCES: Record<SourceId, Source> = {
  uis2026: {
    title: "UIS, исследование обработки заявок в 5 отраслях (Sostav, 2026)",
    url: "https://www.sostav.ru/publication/klient-uzhe-gotov-platit-a-vy-ego-teryaete-85968.html",
    finding: "Компании теряют от 16% до 29% заявок в зависимости от отрасли (медицина 16%, франчайзинг ~25%, фитнес 29%).",
  },
  workato2026: {
    title: "Workato, B2B Lead Response Times: 114 компаний (2026)",
    url: "https://workato.com/the-connector//lead-response-time-study",
    finding: "Почти каждая пятая B2B-компания не ответила на заявку по email вовсе; средний ответ — почти 12 часов.",
  },
  cochrane2018: {
    title: "Cochrane: Patient reminder and recall interventions (Jacobson Vann et al., 2018)",
    url: "https://pubmed.ncbi.nlm.nih.gov/29342498/",
    finding: "Напоминания увеличивают долю людей, пришедших на плановую процедуру, примерно на 8 п.п. (RR 1,28; 55 исследований, 138 625 человек).",
  },
  baymard2025: {
    title: "Baymard Institute, Cart Abandonment Rate (обновлено в сентябре 2025)",
    url: "https://baymard.com/lists/cart-abandonment-rate",
    finding: "В среднем 70,22% корзин бросают, не оформив заказ (50 исследований).",
  },
  klaviyo2024: {
    title: "Klaviyo, Abandoned Cart Benchmarks (данные 2023, опубликовано в 2024)",
    url: "https://www.klaviyo.com/marketing-resources/abandoned-cart-benchmarks",
    finding: "Письма о брошенной корзине приводят к заказу в среднем 3,33% получателей.",
  },
  treatwell2025: {
    title: "Treatwell, данные о неявках в салонах красоты (Scratch Magazine, 2025)",
    url: "https://scratchmagazine.co.uk/news/beauty-salon-no-shows-uk-locations-highest-rates",
    finding: "Неявки составляют около 2,7–3,1% записей; предоплата снижает их примерно вдвое.",
  },
  rework2018: {
    title: "Исследования переделок в строительстве (Liu et al., 2018; Oyewobi et al., 2011)",
    url: "https://repository.aaup.edu/bitstream/123456789/1715/1/Rework%20investigation%20in%20construction%20projects.pdf",
    finding: "Переделки в жилом строительстве стоят около 5% стоимости проекта.",
  },
};

export interface Coefficient {
  value: number;
  /** Пустой список — экспертная оценка без исследования. */
  sources: SourceId[];
  /** Как значение выведено из источников или почему это оценка. */
  basis: string;
}

export interface Niche {
  id: NicheId;
  label: string;
  /** Доля клиентской базы, которая дополнительно вернётся за год благодаря напоминаниям. */
  repeat: Coefficient;
  repeatLossTitle: string;
  /** Процессная утечка ниши как доля месячной выручки. */
  leak: Coefficient;
  leakTitle: string;
  leakExplain: string;
}

export interface Method {
  id: MethodId;
  label: string;
  /** Доля входящих заявок, которые остаются без ответа. */
  lostLeads: Coefficient;
}

const REMINDERS: Coefficient = {
  value: 0.08,
  sources: ["cochrane2018"],
  basis: "напоминания возвращают на плановую процедуру около 8% людей, которые иначе бы не пришли",
};

const CHECKOUT: Coefficient = {
  value: 0.039,
  sources: ["baymard2025", "klaviyo2024"],
  basis:
    "на каждый заказ приходится ≈2,4 брошенной корзины, напоминание возвращает 3,33% из них; берём половину, потому что контакт есть не у всех",
};

const estimate = (value: number, basis: string): Coefficient => ({ value, sources: [], basis });

export const NICHES: Niche[] = [
  {
    id: "auto",
    label: "Автосервис",
    repeat: REMINDERS,
    repeatLossTitle: "Нет напоминаний о ТО и сезонных работах",
    leak: estimate(0.015, "исследований по неучтённым запчастям не нашлось, взята осторожная оценка"),
    leakTitle: "Запчасти и работы, не попавшие в заказ-наряд",
    leakExplain: "доля выручки, которая теряется на неучтённых запчастях и доп. работах",
  },
  {
    id: "ecommerce",
    label: "Интернет-магазин",
    repeat: estimate(0.05, "исследований эффекта повторных рассылок с долей вернувшихся покупателей не нашлось; оценка ниже, чем для напоминаний (8%)"),
    repeatLossTitle: "Нет повторных продаж по базе покупателей",
    leak: CHECKOUT,
    leakTitle: "Брошенные корзины без напоминаний",
    leakExplain: "доля выручки, которую возвращают напоминания о брошенной корзине",
  },
  {
    id: "services",
    label: "Услуги с записью (салон, клиника, студия)",
    repeat: REMINDERS,
    repeatLossTitle: "Клиенты не возвращаются на повторную запись",
    leak: {
      value: 0.015,
      sources: ["treatwell2025"],
      basis: "неявки ≈3% записей, подтверждение и предоплата снижают их вдвое",
    },
    leakTitle: "Неявки без подтверждения записи",
    leakExplain: "доля выручки, которая теряется на неявках",
  },
  {
    id: "realty",
    label: "Недвижимость",
    repeat: estimate(0.02, "сделки редкие, поэтому взята низкая оценка; исследований не нашлось"),
    repeatLossTitle: "Нет работы с базой после сделки (рекомендации, повторные сделки)",
    leak: estimate(0.02, "исследований по сделкам, потерянным без follow-up, не нашлось"),
    leakTitle: "Сделки, потерянные на длинном цикле без follow-up",
    leakExplain: "доля выручки, которая теряется, когда клиент «думает» и о нём забывают",
  },
  {
    id: "b2b",
    label: "B2B / оптовые продажи",
    repeat: estimate(0.05, "исследований не нашлось; оценка ниже эффекта напоминаний (8%)"),
    repeatLossTitle: "Нет регулярных касаний с текущими клиентами",
    leak: estimate(0.02, "исследований по КП без follow-up не нашлось"),
    leakTitle: "Зависшие КП и сделки без следующего шага",
    leakExplain: "доля выручки, которая теряется на КП без follow-up",
  },
  {
    id: "construction",
    label: "Строительство и ремонт",
    repeat: estimate(0.02, "ремонт делают редко, поэтому взята низкая оценка; исследований не нашлось"),
    repeatLossTitle: "Нет работы с базой: рекомендации и повторные заказы",
    leak: {
      value: 0.025,
      sources: ["rework2018"],
      basis: "переделки стоят около 5% проекта; учёт закрывает не все их причины, поэтому берём половину",
    },
    leakTitle: "Перерасход материалов и неучтённые доп. работы",
    leakExplain: "доля выручки, которая теряется на переделках, неучтённых материалах и доп. работах",
  },
  {
    id: "education",
    label: "Онлайн-школа / курсы",
    repeat: estimate(0.05, "исследований по повторным покупкам курсов не нашлось; оценка ниже эффекта напоминаний (8%)"),
    repeatLossTitle: "Выпускники не покупают следующий курс",
    leak: CHECKOUT,
    leakTitle: "Брошенные оплаты без напоминаний",
    leakExplain: "доля выручки, которую возвращают напоминания о незавершённой оплате",
  },
  {
    id: "food",
    label: "Общепит и доставка еды",
    repeat: estimate(0.05, "исследований с долей вернувшихся гостей не нашлось; оценка ниже эффекта напоминаний (8%)"),
    repeatLossTitle: "Гости не возвращаются: нет программы возврата",
    leak: estimate(0.02, "опросы показывают частые ошибки в доставке, но без доли выручки; взята осторожная оценка"),
    leakTitle: "Ошибки и задержки в заказах",
    leakExplain: "доля выручки, которая теряется на компенсациях, возвратах и отменах",
  },
  {
    id: "other",
    label: "Другое",
    repeat: estimate(0.05, "общая осторожная оценка, ниже эффекта напоминаний (8%)"),
    repeatLossTitle: "Нет работы с базой на повторные продажи",
    leak: estimate(0.02, "общая осторожная оценка"),
    leakTitle: "Потери на передаче задач между сотрудниками",
    leakExplain: "доля выручки, которая теряется на ручной передаче задач",
  },
];

// Исследования не разделяют потери по способу учёта, поэтому для всех ручных способов
// берём нижнюю границу UIS (16%). Она ниже, чем доля компаний, не ответивших вовсе, у Workato.
const MANUAL_LOST_LEADS: Coefficient = {
  value: 0.16,
  sources: ["uis2026", "workato2026"],
  basis: "компании теряют 16–29% заявок; берём нижнюю границу и применяем её только к тем, кто не купил",
};

export const METHODS: Method[] = [
  { id: "memory", label: "В голове / без учёта", lostLeads: MANUAL_LOST_LEADS },
  { id: "notebook", label: "Бумажный блокнот или журнал", lostLeads: MANUAL_LOST_LEADS },
  { id: "excel", label: "Excel / Google Таблицы", lostLeads: MANUAL_LOST_LEADS },
  { id: "messengers", label: "Чаты в Telegram / WhatsApp", lostLeads: MANUAL_LOST_LEADS },
  { id: "excel_messengers", label: "Excel + мессенджеры", lostLeads: MANUAL_LOST_LEADS },
  {
    id: "partial_crm",
    label: "CRM есть, но используется частично",
    lostLeads: estimate(0.08, "исследований для компаний с частично внедрённой CRM не нашлось; взята половина нижней границы (16%)"),
  },
];

export const nicheById = (id: NicheId) => NICHES.find((n) => n.id === id)!;
export const methodById = (id: MethodId) => METHODS.find((m) => m.id === id)!;
