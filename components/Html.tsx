// In một đoạn HTML đã dựng sẵn mà không thêm khung bao (display: contents).
export function Html({ html, as = 'div' }: { html: string; as?: 'div' | 'span' }) {
  const Tag = as;
  return <Tag style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: html }} />;
}
