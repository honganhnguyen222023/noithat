// Tiện ích cho trang: đọc tham số URL.
export type SP = Record<string, string | string[] | undefined>;

/** Lấy 1 giá trị ?key=. */
export function q(sp: SP, key: string): string {
  const v = sp[key];
  return Array.isArray(v) ? v[0] ?? '' : v ?? '';
}

/** Mọi tham số thành { key: chuỗi }. */
export function flat(sp: SP): Record<string, string> {
  return Object.fromEntries(Object.entries(sp).map(([k, v]) => [k, Array.isArray(v) ? v[0] || '' : v || '']));
}
