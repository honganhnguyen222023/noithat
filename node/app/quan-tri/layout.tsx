import '@/styles/quantri.css';
import '@/styles/quantri-noithat.css';

export const metadata = { robots: { index: false, follow: false } };

// Font Be Vietnam Pro (dùng chung file font của website).
const W = [400, 500, 600, 700];
const RANGES: [string, string][] = [
  ['vietnamese', 'U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+0300-0301,U+0303-0304,U+0308-0309,U+0323,U+0329,U+1EA0-1EF9,U+20AB'],
  ['latin-ext', 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF'],
  ['latin', 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD'],
];
const FONTS = W.flatMap((w) => RANGES.map(([sub, r]) => `@font-face{font-family:'Be Vietnam Pro';font-style:normal;font-display:swap;font-weight:${w};src:url(/fonts/be-vietnam-pro-${sub}-${w}-normal.woff2) format('woff2');unicode-range:${r}}`)).join('');

// Trang quản trị: giao diện riêng (quantri.css + quantri.js), không dùng đầu/chân trang của website.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="qt-body" style={{ display: 'contents' }}>
      <style dangerouslySetInnerHTML={{ __html: FONTS + ":root{--qt-font:'Be Vietnam Pro',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif}body{margin:0;background:var(--qt-bg);color:var(--qt-text);font:15px/1.55 var(--qt-font);-webkit-font-smoothing:antialiased}" }} />
      {children}
      <script dangerouslySetInnerHTML={{ __html: "try{var u=new URL(location.href);if(u.searchParams.has('tb')){u.searchParams.delete('tb');u.searchParams.delete('ok');history.replaceState(null,'',u.pathname+u.search+u.hash)}}catch(e){}" }} />
      <script src="/js/quantri.js" defer />
      <script src="/js/quantri-noithat.js" defer />
    </div>
  );
}
