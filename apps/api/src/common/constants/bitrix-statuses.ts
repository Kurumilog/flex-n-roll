/**
 * Bitrix24 статусы лидов из pipeline.json
 * Единый источник правды для всех модулей
 */

export const LEAD_STATUSES = {
  NEW: 'NEW',
  CONTACT: '3',
  NEED_DISCOVERY: '4',
  PROPOSAL: '5',
  CONVERTED: 'CONVERTED',
  JUNK: 'JUNK',
  INTERMEDIARY: '15',
  PRICE_FAIL: '16',
  SPEC_FAIL: '17',
  TIMING_FAIL: '18',
  LOGISTICS_FAIL: '19',
  BANKRUPT: '20',
  OTHER_FAIL: '22',
} as const;

// Статусы которые означают что клиент НЕ подходит для рассылки
export const TERMINAL_FAILURE_STATUSES = [
  LEAD_STATUSES.JUNK,
  LEAD_STATUSES.INTERMEDIARY,
  LEAD_STATUSES.PRICE_FAIL,
  LEAD_STATUSES.SPEC_FAIL,
  LEAD_STATUSES.TIMING_FAIL,
  LEAD_STATUSES.LOGISTICS_FAIL,
  LEAD_STATUSES.BANKRUPT,
  LEAD_STATUSES.OTHER_FAIL,
];

// Статусы которые НЕ подходят для рассылки (включая успешные)
export const EXCLUDED_FROM_MAILING_STATUSES = [
  LEAD_STATUSES.CONVERTED,
  ...TERMINAL_FAILURE_STATUSES,
];

// Успешные статусы
export const SUCCESS_STATUSES = [LEAD_STATUSES.CONVERTED];

// Активные статусы (лиды в работе)
export const ACTIVE_STATUSES = [
  LEAD_STATUSES.NEW,
  LEAD_STATUSES.CONTACT,
  LEAD_STATUSES.NEED_DISCOVERY,
  LEAD_STATUSES.PROPOSAL,
];

// Маппинг статусов на читаемые названия
export const LEAD_STATUS_NAMES: Record<string, string> = {
  [LEAD_STATUSES.NEW]: 'Новый лид',
  [LEAD_STATUSES.CONTACT]: 'Установление контакта с ЛПР, ЛВР',
  [LEAD_STATUSES.NEED_DISCOVERY]: 'Выявление потребности',
  [LEAD_STATUSES.PROPOSAL]: 'Коммерческое предложение',
  [LEAD_STATUSES.CONVERTED]: 'Размещён заказ',
  [LEAD_STATUSES.JUNK]: 'Не используют этикетку',
  [LEAD_STATUSES.INTERMEDIARY]: 'Работают с посредником',
  [LEAD_STATUSES.PRICE_FAIL]: 'Не прошли по ценам',
  [LEAD_STATUSES.SPEC_FAIL]: 'Не прошли по ТЗ',
  [LEAD_STATUSES.TIMING_FAIL]: 'Не прошли по срокам изготовления',
  [LEAD_STATUSES.LOGISTICS_FAIL]: 'Не прошли по логистике',
  [LEAD_STATUSES.BANKRUPT]: 'Банкроты / ненадёжные',
  [LEAD_STATUSES.OTHER_FAIL]: 'Другое',
};

// Маппинг статусов на причины отказа
export const REJECTION_REASON_MAP: Record<string, string> = {
  [LEAD_STATUSES.JUNK]: 'Не используют этикетку',
  [LEAD_STATUSES.INTERMEDIARY]: 'Работают с посредником',
  [LEAD_STATUSES.PRICE_FAIL]: 'Не прошли по ценам',
  [LEAD_STATUSES.SPEC_FAIL]: 'Не прошли по ТЗ',
  [LEAD_STATUSES.TIMING_FAIL]: 'Не прошли по срокам изготовления',
  [LEAD_STATUSES.LOGISTICS_FAIL]: 'Не прошли по логистике',
  [LEAD_STATUSES.BANKRUPT]: 'Банкроты / ненадёжные',
  [LEAD_STATUSES.OTHER_FAIL]: 'Другое',
  // Статусы сделок (не лидов)
  LOSE: 'Технологическое ограничение',
  APOLOGY: 'Не прошли по цене',
  '6': 'Не прошли по срокам производства',
  '7': 'Не прошли по срокам доставки',
  '8': 'Не прошли тестирование',
  '9': 'Другое (сделка)',
};
