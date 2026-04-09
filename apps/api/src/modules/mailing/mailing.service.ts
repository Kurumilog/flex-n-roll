import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { OllamaService, OllamaUnavailableException } from '../ollama/ollama.service';
import { EXCLUDED_FROM_MAILING_STATUSES } from '../../common/constants/bitrix-statuses';
import * as nodemailer from 'nodemailer';

export interface MailingCandidate {
  leadId: string;
  clientName: string | null;
  clientEmail: string | null;
  companyTitle: string | null;
  inactiveDays: number;
  statusName: string;
  comments: string | null;
}

export interface MailingStats {
  total: number;
  sent: number;
  failed: number;
  responseReceived: number;
  responseRate: number;
}

@Injectable()
export class MailingService {
  private readonly logger = new Logger(MailingService.name);
  private readonly transporter: nodemailer.Transporter;

  constructor(
    private readonly prisma: PrismaService,
    private readonly ollamaService: OllamaService,
    @Optional() private readonly configService?: ConfigService,
  ) {
    // Инициализация nodemailer транспортера
    this.transporter = nodemailer.createTransport({
      host: this.configService?.get<string>('SMTP_HOST') ?? process.env.SMTP_HOST ?? 'smtp.gmail.com',
      port: this.configService?.get<number>('SMTP_PORT') ?? Number(process.env.SMTP_PORT) ?? 587,
      secure: false, // true для 465, false для 587
      auth: {
        user: this.configService?.get<string>('SMTP_USER') ?? process.env.SMTP_USER,
        pass: this.configService?.get<string>('SMTP_PASS') ?? process.env.SMTP_PASS,
      },
    });
  }

  /**
   * Получить лиды для реактивационной рассылки
   * Критерии: неактивность > N дней, не в терминальных статусах отказа
   */
  async getCandidates(inactiveDays = 30, limit = 50): Promise<MailingCandidate[]> {
    const cutoffDate = new Date(Date.now() - inactiveDays * 24 * 60 * 60 * 1000);

    const leads = await this.prisma.leadCache.findMany({
      where: {
        statusId: {
          notIn: EXCLUDED_FROM_MAILING_STATUSES,
        },
        dateModify: {
          lt: cutoffDate,
        },
        clientEmail: {
          not: null,
        },
      },
      orderBy: { dateModify: 'asc' }, // Самые старые сначала
      take: limit,
      select: {
        bitrixId: true,
        title: true,
        clientName: true,
        clientEmail: true,
        statusId: true,
        dateModify: true,
        comments: true,
      },
    });

    return leads.map((lead) => ({
      leadId: lead.bitrixId,
      clientName: lead.clientName,
      clientEmail: lead.clientEmail,
      companyTitle: lead.title,
      inactiveDays: lead.dateModify
        ? Math.floor((Date.now() - lead.dateModify.getTime()) / (24 * 60 * 60 * 1000))
        : inactiveDays,
      statusName: lead.statusId,
      comments: lead.comments,
    }));
  }

  /**
   * Построить промпт для генерации email через LLM
   */
  buildEmailPrompt(candidate: MailingCandidate): string {
    return `SYSTEM: Ты пишешь реактивационные письма от лица менеджера компании Flex-N-Roll PRO.
Письмо должно быть кратким (3-4 абзаца), персонализированным, не навязчивым.
Не используй слова "напоминаем", "беспокоим", "хотели бы предложить".
Язык: русский, деловой стиль. Подпись: "С уважением, команда Flex-N-Roll PRO"

USER:
Клиент: ${candidate.clientName ?? 'Не указано'}, компания: ${candidate.companyTitle ?? 'Не указано'}
Последний контакт: ${candidate.inactiveDays} дней назад
Статус в CRM: ${candidate.statusName}
Комментарий: ${candidate.comments ?? 'Нет комментариев'}

Напиши тему письма (subject) и тело (body) в формате JSON:
{ "subject": "...", "body": "..." }`;
  }

  /**
   * Отправить письмо кандидату
   */
  async sendToCandidate(
    candidate: MailingCandidate,
    channel: 'email' | 'telegram' | 'whatsapp' = 'email',
  ): Promise<{ status: string; id?: number }> {
    let subject: string;
    let body: string;
    let generatedBy = 'llm';

    // Генерация письма через LLM
    try {
      const prompt = this.buildEmailPrompt(candidate);
      const rawResponse = await this.ollamaService.chat(prompt);
      const parsed = JSON.parse(rawResponse);

      subject = parsed.subject ?? 'Flex-N-Roll PRO — актуальное предложение';
      body = parsed.body ?? '';
    } catch (error) {
      // Fallback на шаблон
      this.logger.warn(
        `Ollama unavailable for lead ${candidate.leadId}, using template`,
      );
      generatedBy = 'template';
      subject = 'Flex-N-Roll PRO — актуальное предложение';
      body = this.getDefaultTemplate(candidate);
    }

    // Отправка email через SMTP
    if (channel === 'email' && candidate.clientEmail) {
      try {
        await this.transporter.sendMail({
          from: this.configService?.get<string>('SMTP_FROM') ?? process.env.SMTP_FROM ?? 'FlexRouter <noreply@kurumi.software>',
          to: candidate.clientEmail,
          subject,
          html: body.replace(/\n/g, '<br>'), // Простая конвертация в HTML
        });
        this.logger.log(`Email sent to ${candidate.clientEmail}`);
      } catch (smtpError) {
        this.logger.error(
          `SMTP failed for ${candidate.clientEmail}: ${smtpError instanceof Error ? smtpError.message : smtpError}`,
        );
        // Записать как failed и продолжить
        return this.logMailing(candidate, channel, subject, body, generatedBy, 'failed');
      }
    } else if (channel !== 'email') {
      this.logger.log(
        `Channel ${channel} selected — email not sent (requires Bitrix24 API)`,
      );
    }

    // Записать в БД как отправленное
    return this.logMailing(candidate, channel, subject, body, generatedBy, 'sent');
  }

  /**
   * Записать результат рассылки в БД
   */
  private async logMailing(
    candidate: MailingCandidate,
    channel: string,
    subject: string,
    body: string,
    generatedBy: string,
    status: 'sent' | 'failed',
  ): Promise<{ status: string; id?: number }> {
    try {
      const mailing = await this.prisma.mailing.create({
        data: {
          leadBitrixId: candidate.leadId,
          clientEmail: candidate.clientEmail,
          clientName: candidate.clientName,
          channel,
          subject,
          messageText: body,
          generatedBy,
          status,
          sentAt: status === 'sent' ? new Date() : undefined,
        },
      });

      this.logger.log(
        `Mailing ${status} for ${candidate.clientEmail} (lead ${candidate.leadId})`,
      );

      return { status, id: mailing.id };
    } catch (dbError) {
      this.logger.error('Failed to log mailing to database', dbError);
      return { status: 'failed' };
    }
  }

  /**
   * Получить статистику рассылок за последние 30 дней
   */
  async getStats(): Promise<MailingStats> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const mailings = await this.prisma.mailing.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        status: true,
        responseReceived: true,
        channel: true,
      },
    });

    const total = mailings.length;
    const sent = mailings.filter((m) => m.status === 'sent').length;
    const failed = mailings.filter((m) => m.status === 'failed').length;
    const responseReceived = mailings.filter((m) => m.responseReceived).length;
    const responseRate = sent > 0 ? (responseReceived / sent) * 100 : 0;

    return {
      total,
      sent,
      failed,
      responseReceived,
      responseRate: Math.round(responseRate * 10) / 10,
    };
  }

  /**
   * Шаблоное письмо (fallback при недоступности Ollama)
   */
  private getDefaultTemplate(candidate: MailingCandidate): string {
    return `Здравствуйте, ${candidate.clientName ?? 'уважаемый клиент'}!

Команда Flex-N-Roll PRO надеется, что у вас всё хорошо. 

${candidate.comments ? `Мы помним, что вы интересовались: ${candidate.comments}.` : 'Мы ценим наше сотрудничество.'}

Будем рады обсудить ваши текущие потребности в этикеточной продукции.
Свяжитесь с нами, если у вас есть вопросы или нужен расчёт.

С уважением, команда Flex-N-Roll PRO`;
  }
}
