// Mật khẩu: mã hóa bcrypt; đọc được mật khẩu cũ của WordPress để học viên không phải đặt lại.
import bcrypt from 'bcryptjs';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

export async function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, 10);
}

const ITOA64 = './0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

function encode64(input: Buffer, count: number): string {
  let out = '';
  let i = 0;
  do {
    let value = input[i++];
    out += ITOA64[value & 0x3f];
    if (i < count) value |= input[i] << 8;
    out += ITOA64[(value >> 6) & 0x3f];
    if (i++ >= count) break;
    if (i < count) value |= input[i] << 16;
    out += ITOA64[(value >> 12) & 0x3f];
    if (i++ >= count) break;
    out += ITOA64[(value >> 18) & 0x3f];
  } while (i < count);
  return out;
}

/** Mật khẩu WordPress kiểu cũ (phpass: $P$…). */
function phpass(pw: string, setting: string): string {
  if (!['$P$', '$H$'].includes(setting.slice(0, 3))) return '*';
  const log2 = ITOA64.indexOf(setting[3]);
  if (log2 < 7 || log2 > 30) return '*';
  let count = 1 << log2;
  const salt = setting.slice(4, 12);
  if (salt.length !== 8) return '*';
  const md5 = (b: Buffer) => createHash('md5').update(b).digest();
  const p = Buffer.from(pw, 'utf8');
  let hash = md5(Buffer.concat([Buffer.from(salt, 'binary'), p]));
  do {
    hash = md5(Buffer.concat([hash, p]));
  } while (--count);
  return setting.slice(0, 12) + encode64(hash, 16);
}

function same(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Kiểm tra mật khẩu. Trả về needsRehash = true nếu nên lưu lại bằng kiểu mới. */
export async function verifyPassword(pw: string, hash: string): Promise<{ ok: boolean; needsRehash: boolean }> {
  if (!hash) return { ok: false, needsRehash: false };
  // WordPress 6.8+: "$wp" + bcrypt( base64( HMAC-SHA384(mật khẩu, "wp-sha384") ) ).
  if (hash.startsWith('$wp')) {
    const pre = createHmac('sha384', 'wp-sha384').update(pw.trim()).digest('base64');
    const ok = await bcrypt.compare(pre, hash.slice(3).replace(/^\$2y\$/, '$2b$'));
    return { ok, needsRehash: ok };
  }
  if (/^\$2[aby]\$/.test(hash)) {
    const ok = await bcrypt.compare(pw, hash.replace(/^\$2y\$/, '$2b$'));
    return { ok, needsRehash: false };
  }
  if (hash.startsWith('$P$') || hash.startsWith('$H$')) {
    const ok = same(phpass(pw, hash), hash);
    return { ok, needsRehash: ok };
  }
  if (/^[a-f0-9]{32}$/.test(hash)) {
    const ok = same(createHash('md5').update(pw).digest('hex'), hash);
    return { ok, needsRehash: ok };
  }
  return { ok: false, needsRehash: false };
}
