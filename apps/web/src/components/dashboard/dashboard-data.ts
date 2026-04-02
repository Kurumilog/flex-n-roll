export type Source = "email" | "facebook" | "webform";

export type Metric = {
  label: string;
  value: string;
  detail: string;
  note: string;
  layout: string;
  tone: "light" | "dark";
};

export type FeedItem = {
  id: string;
  source: Source;
  time: string;
  rawText: string;
  intent: "Commercial" | "Support" | "Technical";
  urgency: "High" | "Medium" | "Low";
  complexity: "Low" | "Medium" | "High";
  confidence: number;
  assignedTo: string;
  dealId: string;
  dealUrl: string;
};

export type PipelineStep = {
  label: string;
  detail: string;
  status: "done" | "active" | "queued";
};

export type CategoryLoadItem = {
  label: string;
  value: number;
  width: string;
};

export type Capability = {
  label: string;
  href: string;
  title: string;
  summary: string;
  tone: "light" | "dark";
  points: string[];
};

export const metrics: Metric[] = [
  {
    label: "AI Confidence",
    value: "94%",
    detail: "Средняя уверенность модели по сегодняшнему потоку входящих заявок.",
    note: "LLM routing confidence stays above the review threshold.",
    layout: "lg:col-span-5",
    tone: "dark",
  },
  {
    label: "Auto-routing",
    value: "10 / 12",
    detail: "Большая часть обращений уже уходит нужному менеджеру без ручной сортировки.",
    note: "Only two messages were flagged for manual review.",
    layout: "lg:col-span-3",
    tone: "light",
  },
  {
    label: "Manager Review",
    value: "2",
    detail: "Сомнительные кейсы сразу поднимаются выше по вниманию.",
    note: "Both need human confirmation before Bitrix24 sync.",
    layout: "lg:col-span-2",
    tone: "light",
  },
  {
    label: "SLA Compliance",
    value: "100%",
    detail: "Порог on-time routing держится в пределах демонстрационного SLA.",
    note: "No delayed routing events in the last session.",
    layout: "lg:col-span-2",
    tone: "light",
  },
];

export const feedItems: FeedItem[] = [
  {
    id: "BX-1451",
    source: "email",
    time: "14:02",
    rawText:
      "Здравствуйте, нужны термохромные этикетки 50x50, тираж 10 000, запуск нужен к отраслевой выставке уже на следующей неделе.",
    intent: "Technical",
    urgency: "High",
    complexity: "Medium",
    confidence: 96,
    assignedTo: "Ivan Ivanov",
    dealId: "BX-1451",
    dealUrl: "https://flexnroll.bitrix24.ru/crm/deal/details/1451/",
  },
  {
    id: "BX-1452",
    source: "facebook",
    time: "14:11",
    rawText:
      "Добрый день. Хотим пересчитать заказ по самоклеящимся этикеткам для новой линейки соков, нужен быстрый расчет и сроки по запуску.",
    intent: "Commercial",
    urgency: "Medium",
    complexity: "Low",
    confidence: 92,
    assignedTo: "Elena Smirnova",
    dealId: "BX-1452",
    dealUrl: "https://flexnroll.bitrix24.ru/crm/deal/details/1452/",
  },
  {
    id: "BX-1453",
    source: "webform",
    time: "14:19",
    rawText:
      "Вчера получили партию рулонов, часть маркировки смещена. Нужна проверка заказа 451-B и оперативная обратная связь от производства.",
    intent: "Support",
    urgency: "High",
    complexity: "Medium",
    confidence: 89,
    assignedTo: "Dmitry Kozlov",
    dealId: "BX-1453",
    dealUrl: "https://flexnroll.bitrix24.ru/crm/deal/details/1453/",
  },
];

export const pipelineSteps: PipelineStep[] = [
  {
    label: "Webhook Received",
    detail: "n8n captured the payload and normalized channel metadata.",
    status: "done",
  },
  {
    label: "AI Parsing",
    detail: "Groq extracts intent, urgency, complexity, and context fragments.",
    status: "done",
  },
  {
    label: "Intent Classification",
    detail: "Confidence threshold is high enough for auto-routing.",
    status: "active",
  },
  {
    label: "Bitrix24 Sync",
    detail: "Deal card is prepared for the assigned manager.",
    status: "queued",
  },
];

export const categoryLoad: CategoryLoadItem[] = [
  { label: "Commercial", value: 6, width: "76%" },
  { label: "Support", value: 4, width: "52%" },
  { label: "Technical", value: 2, width: "31%" },
];

export const capabilities: Capability[] = [
  {
    label: "Deal Analytics",
    href: "/analytics",
    title: "Разложить завершенную сделку по времени, отделам и эффективности.",
    summary:
      "Показываем полный путь заявки от первого контакта клиента до финального ответа производства.",
    tone: "dark",
    points: [
      "Department timing with clear bottlenecks",
      "Conversion context for marketing and sales",
    ],
  },
  {
    label: "Personalized Re-engagement",
    href: "/settings",
    title: "Возвращать клиента персональным касанием, если диалог затих.",
    summary:
      "Система собирает интересы по истории сообщений и готовит следующее релевантное предложение.",
    tone: "light",
    points: [
      "Interest-based campaign drafting",
      "Dormant lead nudges without manual follow-up",
    ],
  },
];
