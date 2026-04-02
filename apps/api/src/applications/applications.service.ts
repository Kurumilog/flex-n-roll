import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";

import type { CreateApplicationDto } from "./dto/create-application.dto";
import { ApplicationStatus } from "./dto/create-application.dto";

export interface Application {
  id: string;
  source: "email" | "facebook" | "webform";
  rawText: string;
  intent: "commercial" | "support" | "technical";
  urgency: "low" | "medium" | "high";
  complexity: "low" | "medium" | "high";
  aiConfidence: number;
  assignedTo: { id: string; name: string; avatar?: string };
  bitrix24DealId?: string;
  bitrix24DealUrl?: string;
  createdAt: Date;
  processedAt?: Date;
  status: "processing" | "assigned" | "escalated";
}

@Injectable()
export class ApplicationsService {
  private applications: Application[] = [
    {
      id: randomUUID(),
      source: "email",
      rawText: "Здравствуйте! Нужна печать этикеток для новой линейки соков. Тираж 5000 шт, формат 100x150мм. Интересует самоклеящаяся пленка с ламинацией. Срок - до конца месяца.",
      intent: "commercial",
      urgency: "medium",
      complexity: "medium",
      aiConfidence: 92,
      assignedTo: { id: "mgr-1", name: "Ivan Ivanov", avatar: "https://picsum.photos/seed/mgr1/96/96" },
      bitrix24DealId: "BX-1001",
      bitrix24DealUrl: "https://flexnroll.bitrix24.ru/crm/deal/1001/",
      createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
      processedAt: new Date(Date.now() - 1000 * 60 * 25),
      status: "assigned",
    },
    {
      id: randomUUID(),
      source: "facebook",
      rawText: "Добрый день! Подскажите, делаете ли вы этикетки для крафтовой косметики? Нужен дизайн и печать 200 шт.",
      intent: "commercial",
      urgency: "low",
      complexity: "low",
      aiConfidence: 88,
      assignedTo: { id: "mgr-2", name: "Bitrix Agent", avatar: "https://picsum.photos/seed/mgr2/96/96" },
      createdAt: new Date(Date.now() - 1000 * 60 * 45),
      status: "processing",
    },
    {
      id: randomUUID(),
      source: "webform",
      rawText: "СРОЧНО! Ошибка в макете этикеток для партии меда. Нужно переделать 50 шт urgently!",
      intent: "support",
      urgency: "high",
      complexity: "low",
      aiConfidence: 95,
      assignedTo: { id: "mgr-1", name: "Ivan Ivanov" },
      bitrix24DealId: "BX-1002",
      createdAt: new Date(Date.now() - 1000 * 60 * 15),
      processedAt: new Date(Date.now() - 1000 * 60 * 10),
      status: "escalated",
    },
    {
      id: randomUUID(),
      source: "email",
      rawText: "Печать этикеток для вина, 1000 бутылок. Материал - металлизированная бумага. Нужен расчет стоимости.",
      intent: "commercial",
      urgency: "medium",
      complexity: "medium",
      aiConfidence: 90,
      assignedTo: { id: "mgr-2", name: "Bitrix Agent" },
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      status: "assigned",
    },
    {
      id: randomUUID(),
      source: "webform",
      rawText: "Технический вопрос: можно ли печатать этикетки на прозрачной пленке с золотым тиснением?",
      intent: "technical",
      urgency: "low",
      complexity: "high",
      aiConfidence: 78,
      assignedTo: { id: "mgr-1", name: "Ivan Ivanov" },
      createdAt: new Date(Date.now() - 1000 * 60 * 90),
      status: "assigned",
    },
    {
      id: randomUUID(),
      source: "facebook",
      rawText: "Здравствуйте! Интересует печать этикеток для джемов и варенья. Тираж 300 шт на каждый вкус (всего 5 видов).",
      intent: "commercial",
      urgency: "low",
      complexity: "low",
      aiConfidence: 85,
      assignedTo: { id: "mgr-2", name: "Bitrix Agent" },
      createdAt: new Date(Date.now() - 1000 * 60 * 120),
      status: "processing",
    },
    {
      id: randomUUID(),
      source: "email",
      rawText: "Нужно срочно заменить этикетки на уже отпечатанной партии. Брак типографии.",
      intent: "support",
      urgency: "high",
      complexity: "medium",
      aiConfidence: 91,
      assignedTo: { id: "mgr-1", name: "Ivan Ivanov" },
      bitrix24DealId: "BX-1003",
      createdAt: new Date(Date.now() - 1000 * 60 * 5),
      processedAt: new Date(Date.now() - 1000 * 60 * 2),
      status: "escalated",
    },
    {
      id: randomUUID(),
      source: "webform",
      rawText: "Расчет стоимости печати этикеток для пивной продукции. 4 сорта, по 5000 этикеток каждый.",
      intent: "commercial",
      urgency: "medium",
      complexity: "high",
      aiConfidence: 87,
      assignedTo: { id: "mgr-2", name: "Bitrix Agent" },
      createdAt: new Date(Date.now() - 1000 * 60 * 180),
      status: "assigned",
    },
    {
      id: randomUUID(),
      source: "email",
      rawText: "Вопрос по хранению этикеток: какой срок годности у клея на самоклеящейся основе?",
      intent: "technical",
      urgency: "low",
      complexity: "low",
      aiConfidence: 93,
      assignedTo: { id: "mgr-1", name: "Ivan Ivanov" },
      createdAt: new Date(Date.now() - 1000 * 60 * 240),
      status: "assigned",
    },
    {
      id: randomUUID(),
      source: "facebook",
      rawText: "Печать этикеток для шоколада. Формат 70x100мм, тираж 1000 шт. Нужна пищевая пленка.",
      intent: "commercial",
      urgency: "medium",
      complexity: "low",
      aiConfidence: 89,
      assignedTo: { id: "mgr-2", name: "Bitrix Agent" },
      createdAt: new Date(Date.now() - 1000 * 60 * 300),
      status: "processing",
    },
    {
      id: randomUUID(),
      source: "webform",
      rawText: "Смена дизайна этикеток для существующей продукции. Нужно 3 варианта на выбор.",
      intent: "commercial",
      urgency: "low",
      complexity: "medium",
      aiConfidence: 82,
      assignedTo: { id: "mgr-1", name: "Ivan Ivanov" },
      createdAt: new Date(Date.now() - 1000 * 60 * 360),
      status: "assigned",
    },
    {
      id: randomUUID(),
      source: "email",
      rawText: "Рекламация: этикетки отклеиваются на холоде. Партия от 15.03.2024.",
      intent: "support",
      urgency: "high",
      complexity: "medium",
      aiConfidence: 96,
      assignedTo: { id: "mgr-2", name: "Bitrix Agent" },
      bitrix24DealId: "BX-1004",
      createdAt: new Date(Date.now() - 1000 * 60 * 8),
      processedAt: new Date(Date.now() - 1000 * 60 * 3),
      status: "escalated",
    },
  ];

  findAll(filters: { intent?: string; urgency?: string; status?: string; limit?: number; offset?: number }): { items: Application[]; total: number } {
    let filtered = [...this.applications];

    if (filters.intent) {
      filtered = filtered.filter((app) => app.intent === filters.intent);
    }
    if (filters.urgency) {
      filtered = filtered.filter((app) => app.urgency === filters.urgency);
    }
    if (filters.status) {
      filtered = filtered.filter((app) => app.status === filters.status);
    }

    const total = filtered.length;
    const limit = filters.limit ?? 20;
    const offset = filters.offset ?? 0;

    return {
      items: filtered.slice(offset, offset + limit),
      total,
    };
  }

  findOne(id: string): Application | null {
    return this.applications.find((app) => app.id === id) ?? null;
  }

  create(payload: Omit<Application, "id" | "createdAt" | "processedAt" | "status">): Application {
    const newApplication: Application = {
      ...payload,
      id: randomUUID(),
      createdAt: new Date(),
      status: ApplicationStatus.PROCESSING,
    };

    this.applications.unshift(newApplication);
    return newApplication;
  }
}
