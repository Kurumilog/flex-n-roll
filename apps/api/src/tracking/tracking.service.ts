import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OllamaService } from '../modules/ollama/ollama.service';

@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ollama: OllamaService,
  ) {}

  async getTrackingByNumber(trackingNumber: string) {
    const tracking = await this.prisma.deliveryTracking.findUnique({
      where: { trackingNumber },
      include: { employee: true },
    });
    if (!tracking) {
      throw new NotFoundException(`Трек-номер ${trackingNumber} не найден`);
    }
    return tracking;
  }

  async testGeneratePlan(identifier: string, managerId: number) {
    // 1. Попытка определить по контактным данным или Имени из LeadCache или Assignment
    const lead = await this.prisma.leadCache.findFirst({
      where: {
        OR: [
          { clientPhone: { contains: identifier } },
          { clientEmail: { contains: identifier } },
          { clientName: { contains: identifier, mode: 'insensitive' } }
        ]
      }
    });

    const phoneToSearch = lead?.clientPhone || identifier;

    // Для демо хакатона мы найдем все сообщения этого клиента (по телефону или email)
    const messages = await this.prisma.incomingEvent.findMany({
      where: { 
        OR: [
          { clientPhone: phoneToSearch },
          { clientEmail: identifier }
        ]
      },
      orderBy: { processedAt: 'asc' },
    });

    const chatHistory = messages.map(m => m.clientText).join('\n---\n');

    const today = new Date();
    const dayMinus2 = new Date(today); dayMinus2.setDate(today.getDate() - 2);
    const dayPlus2  = new Date(today); dayPlus2.setDate(today.getDate() + 2);
    const dayPlus5  = new Date(today); dayPlus5.setDate(today.getDate() + 5);

    const prompt = `На основе этих сообщений клиента создай план доставки:
${chatHistory || "Клиент хочет доставку этикеток."}

Сегодняшняя дата: ${today.toISOString()}

Твоя задача — сгенерировать детальный таймлайн выполнения заказа на производство этикеток.
Возможные примеры или типы этапов: "Проверка у экономиста", "Проверка наличия материалов", "Дизайнер работает над макетом", "В печати / Производство", "Выполнена половина заказа", "Морозилка / Сборка", "Уже в пути (отправлено)", "Доставлено".

Ответь ТОЛЬКО валидным JSON без markdown:
{
  "fromLocation": "Минск, Завод",
  "toLocation": "Адрес клиента",
  "currentStatus": "Дизайнер работает над макетом",
  "expectedDate": "${dayPlus5.toISOString()}",
  "timelineEvents": [
    { "status": "Проверка у экономиста", "description": "Смета согласована", "date": "${dayMinus2.toISOString()}", "isActive": false },
    { "status": "Проверка наличия материалов", "description": "Фольга и бумага зарезервированы", "date": "${dayMinus2.toISOString()}", "isActive": false },
    { "status": "Дизайнер работает над макетом", "description": "Подготовка макета в печать", "date": "${today.toISOString()}", "isActive": true },
    { "status": "Производство", "description": "Печать этикеток", "date": "${dayPlus2.toISOString()}", "isActive": false }
  ]
}`;

    let parsed = {
      fromLocation: "Минск",
      toLocation: "Москва",
      currentStatus: "В производстве",
      expectedDate: new Date().toISOString(),
      timelineEvents: [
        { status: "Заказ оформлен", description: "Заявка принята в работу", date: new Date().toISOString(), isActive: false },
        { status: "В производстве", description: "Изготовление этикеток", date: new Date().toISOString(), isActive: true },
      ]
    };

    try {
      const response = await this.ollama.chat(prompt, 'Ты логистический диспетчер.');
      const cleaned = response.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch(e) {
      this.logger.warn('Ollama failed to generate plan, using fallback.', e);
    }

    const trackingNumber = `FL-${Math.floor(1000 + Math.random() * 9000)}-${managerId}`;

    return this.prisma.deliveryTracking.create({
      data: {
        trackingNumber,
        clientPhone: phoneToSearch,
        managerId,
        fromLocation: parsed.fromLocation,
        toLocation: parsed.toLocation,
        currentStatus: parsed.currentStatus,
        expectedDate: new Date(parsed.expectedDate || Date.now()),
        timelineEvents: parsed.timelineEvents as any,
      }
    });
  }

  async updateTrackingPlan(trackingNumber: string, updateData: any) {
    const existing = await this.getTrackingByNumber(trackingNumber);

    return this.prisma.deliveryTracking.update({
      where: { trackingNumber },
      data: {
        currentStatus: updateData.currentStatus ?? existing.currentStatus,
        expectedDate: updateData.expectedDate ? new Date(updateData.expectedDate) : existing.expectedDate,
        fromLocation: updateData.fromLocation ?? existing.fromLocation,
        toLocation: updateData.toLocation ?? existing.toLocation,
        timelineEvents: updateData.timelineEvents ?? existing.timelineEvents,
      },
    });
  }

  async getAllForManager(managerId: number) {
    return this.prisma.deliveryTracking.findMany({
      where: { managerId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getManagerClients(managerId: number) {
    // Получить клиентов из LeadCache, которые закреплены за менеджером
    // Плюс добавим немножко моковых данных чтобы точно было что показать на хакатоне, если БД пустая.
    const leads = await this.prisma.leadCache.findMany({
      where: { assignedById: managerId },
      select: { clientName: true, clientPhone: true, clientEmail: true, title: true, comments: true },
      distinct: ['clientPhone', 'clientEmail'],
      take: 15,
    });

    if (leads.length > 0) {
      return leads.map(l => ({
        name: l.clientName || 'Неизвестно',
        phone: l.clientPhone || '',
        email: l.clientEmail || '',
        company: l.title || 'Новая сделка',
        comments: l.comments
      }));
    }

    // Если база пустая или за этим менеджером нет закрепленных - вернём захардкоженных
    return [
      { name: 'Алексей Смирнов', phone: '+375291112233', email: 'smirnov@example.by', company: 'ООО ТрансЛогистик', comments: 'Постоянный клиент, частые заказы' },
      { name: 'Мария Иванова', phone: '+375292223344', email: 'ivanova@test.com', company: 'ЗАО Ритейл Групп', comments: 'Особые требования к упаковке' },
      { name: 'ИП Сидорчук', phone: '+375443334455', email: 'sidorchuk.ip@mail.ru', company: 'ИП Сидорчук В.А.', comments: 'Работает по предоплате' }
    ];
  }
}
