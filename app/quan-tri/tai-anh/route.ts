// Tải ảnh lên (ảnh khóa học, logo…): lưu vào public/uploads/media/<năm>/<tháng>/.
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { getAdminUser, isStaff } from '@/lib/auth';

const TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };

export async function POST(req: Request) {
  const origin = req.headers.get('origin');
  if (origin && new URL(origin).host !== new URL(req.url).host) return Response.json({ ok: false, msg: 'Sai nguồn gửi.' }, { status: 403 });
  if (!isStaff(await getAdminUser())) return Response.json({ ok: false, msg: 'Bạn cần đăng nhập quản trị.' }, { status: 403 });
  const file = (await req.formData()).get('file');
  if (!(file instanceof File)) return Response.json({ ok: false, msg: 'Chưa chọn ảnh.' }, { status: 400 });
  const ext = TYPES[file.type];
  if (!ext) return Response.json({ ok: false, msg: 'Chỉ nhận ảnh JPG, PNG, WebP, GIF.' }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return Response.json({ ok: false, msg: 'Ảnh lớn hơn 5MB.' }, { status: 400 });
  const now = new Date();
  const dir = `media/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`;
  const base = (file.name.replace(/\.[^.]+$/, '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'anh').slice(0, 50);
  const name = `${base}-${randomBytes(3).toString('hex')}.${ext}`;
  const abs = path.join(process.cwd(), 'public', 'uploads', dir);
  await mkdir(abs, { recursive: true });
  await writeFile(path.join(abs, name), Buffer.from(await file.arrayBuffer()));
  return Response.json({ ok: true, url: `/uploads/${dir}/${name}` });
}
