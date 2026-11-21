// Gửi email. Chưa cấu hình SMTP (.env): không gửi thật, chỉ lưu lại để xem trong quản trị.
import nodemailer from 'nodemailer';
import { db } from './db';

export async function sendMail(to: string, subject: string, text: string): Promise<boolean> {
  const log = await db.emailLog.create({ data: { to, subject, body: text } });
  if (!process.env.SMTP_HOST || !to) return false;
  try {
    const t = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
    await t.sendMail({ from: process.env.MAIL_FROM, to, subject, text });
    await db.emailLog.update({ where: { id: log.id }, data: { sent: true } });
    return true;
  } catch (e) {
    await db.emailLog.update({ where: { id: log.id }, data: { error: String(e).slice(0, 500) } });
    return false;
  }
}
