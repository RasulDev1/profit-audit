// Справочники ниш и способов учёта. Все коэффициенты — отраслевые допущения,
// а не измеренные данные клиента; их стоит уточнять по мере накопления аудитов.

export type NicheId = "auto" | "ecommerce" | "services" | "realty" | "b2b" | "other";
export type MethodId = "memory" | "notebook" | "excel" | "messengers" | "excel_messengers" | "partial_crm";

export interface Niche {
  id: NicheId;
  label: string;
  /** Доля базы, которую реально вернуть напоминаниями и повторными касаниями за год. */
  repeatUplift: number;
  repeatLossTitle: string;
  /** Процессная утечка ниши как доля месячной выручки. */
  leakRate: number;
  leakTitle: string;
  leakExplain: string;
}

export interface Method {
  id: MethodId;
  label: string;
  /** Доля входящих заявок, которые теряются без ответа или без продолжения. */
  lostLeadShare: number;
  /** Множитель процессной утечки относительно Excel. */
  leakMultiplier: number;
}

export const NICHES: Niche[] = [
  {
    id: "auto",
    label: "Автосервис",
    repeatUplift: 0.08,
    repeatLossTitle: "Нет напоминаний о ТО и сезонных работах",
    leakRate: 0.015,
    leakTitle: "Запчасти и работы, не попавшие в заказ-наряд",
    leakExplain: "доля выручки, которая теряется на неучтённых запчастях и доп. работах",
  },
  {
    id: "ecommerce",
    label: "Интернет-магазин",
    repeatUplift: 0.05,
    repeatLossTitle: "Нет повторных продаж по базе покупателей",
    leakRate: 0.03,
    leakTitle: "Брошенные корзины и медленная обработка заказов",
    leakExplain: "доля выручки, которая теряется на брошенных корзинах и отменах из-за задержек",
  },
  {
    id: "services",
    label: "Услуги с записью (салон, клиника, студия)",
    repeatUplift: 0.1,
    repeatLossTitle: "Клиенты не возвращаются на повторную запись",
    leakRate: 0.04,
    leakTitle: "Неявки и пустые окна в расписании мастеров",
    leakExplain: "доля выручки, которая теряется на неявках и незаполненных слотах",
  },
  {
    id: "realty",
    label: "Недвижимость",
    repeatUplift: 0.02,
    repeatLossTitle: "Нет работы с базой после сделки (рекомендации, повторные сделки)",
    leakRate: 0.02,
    leakTitle: "Сделки, потерянные на длинном цикле без follow-up",
    leakExplain: "доля выручки, которая теряется, когда клиент «думает» и о нём забывают",
  },
  {
    id: "b2b",
    label: "B2B / оптовые продажи",
    repeatUplift: 0.06,
    repeatLossTitle: "Нет регулярных касаний с текущими клиентами",
    leakRate: 0.02,
    leakTitle: "Зависшие КП и сделки без следующего шага",
    leakExplain: "доля выручки, которая теряется на КП без follow-up",
  },
  {
    id: "other",
    label: "Другое",
    repeatUplift: 0.05,
    repeatLossTitle: "Нет работы с базой на повторные продажи",
    leakRate: 0.02,
    leakTitle: "Потери на передаче задач между сотрудниками",
    leakExplain: "доля выручки, которая теряется на ручной передаче задач",
  },
];

export const METHODS: Method[] = [
  { id: "memory", label: "В голове / без учёта", lostLeadShare: 0.15, leakMultiplier: 1.5 },
  { id: "notebook", label: "Бумажный блокнот или журнал", lostLeadShare: 0.1, leakMultiplier: 1.3 },
  { id: "excel", label: "Excel / Google Таблицы", lostLeadShare: 0.06, leakMultiplier: 1 },
  { id: "messengers", label: "Чаты в Telegram / WhatsApp", lostLeadShare: 0.08, leakMultiplier: 1.1 },
  { id: "excel_messengers", label: "Excel + мессенджеры", lostLeadShare: 0.07, leakMultiplier: 1 },
  { id: "partial_crm", label: "CRM есть, но используется частично", lostLeadShare: 0.03, leakMultiplier: 0.6 },
];

export const nicheById = (id: NicheId) => NICHES.find((n) => n.id === id)!;
export const methodById = (id: MethodId) => METHODS.find((m) => m.id === id)!;
