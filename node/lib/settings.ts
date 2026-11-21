// Cài đặt website – viết lại từ inc/customizer.php của theme IRIS (Giao diện → Tùy biến).
// Mọi chữ / ảnh sửa được của website khai báo 1 lần ở FIELDS; giá trị lưu trong bảng Setting ("site").
import { cache } from 'react';
import { db } from './db';

export type FieldType = 'text' | 'textarea' | 'url' | 'image' | 'gallery' | 'checkbox' | 'number' | 'cat' | 'cat-all' | 'email';
export type Field = [label: string, type: FieldType, def: string | string[]];
export type Section = { title: string; description?: string; fields: Record<string, Field> };

export const FIELDS: Record<string, Section> = {
  brand: {
    title: 'Thương hiệu',
    fields: {
      site_name: ['Tên website', 'text', 'Nội Thất IRIS'],
      site_tagline: ['Khẩu hiệu (hiện ở tiêu đề trang chủ)', 'text', 'Với sứ mệnh kiến tạo không gian sống với tinh hoa thiết kế Ý'],
      custom_logo: ['Logo (nền sáng: đầu trang)', 'image', ''],
      logo_light: ['Logo màu sáng (nền tối: chân trang)', 'image', ''],
      favicon: ['Biểu tượng tab trình duyệt (favicon)', 'image', ''],
      seo_description: ['Mô tả website (Google, chia sẻ Facebook)', 'textarea', ''],
    },
  },
  contact: {
    title: 'Thông tin liên hệ & mạng xã hội',
    fields: {
      phone: ['Số điện thoại (nút Gọi, chân trang)', 'text', '0909 123 456'],
      hotline: ['Hotline đặt hàng (trang sản phẩm)', 'text', '0904.863.155'],
      hours: ['Giờ làm việc', 'text', 'Thứ 2 - Chủ Nhật từ 10:00 – 22:00'],
      zalo: ['Số Zalo (hoặc link zalo.me)', 'text', '0909123456'],
      messenger: ['Link Messenger (m.me/…)', 'url', 'https://m.me/'],
      email: ['Email', 'text', 'demo@gmail.com'],
      address: ['Địa chỉ (chân trang, bản đồ)', 'text', 'Tòa Ladeco, 2166 Đội Cấn, Quận Ba Đình, TP Hà Nội'],
      showroom: ['Showroom (trang sản phẩm)', 'text', 'Số 11A Dịch Vọng Hậu, Cầu Giấy, Hà Nội'],
      map_embed: ['Bản đồ Google (để trống = tự lấy theo địa chỉ; hoặc dán mã nhúng iframe)', 'textarea', ''],
      notify_email: ['Email nhận thông báo (đơn hàng mới, tin nhắn liên hệ)', 'email', ''],
      social_facebook: ['Facebook', 'url', 'https://facebook.com/'],
      social_instagram: ['Instagram', 'url', 'https://instagram.com/'],
      social_youtube: ['YouTube', 'url', 'https://youtube.com/'],
      social_tiktok: ['TikTok', 'url', ''],
    },
  },
  header_footer: {
    title: 'Đầu trang & chân trang',
    fields: {
      footer_about: ['Đoạn giới thiệu ở chân trang', 'textarea', 'IRIS với sứ mệnh không ngừng mang những sản phẩm nội thất luxury đang được ưa chuộng trên thị trường quốc tế về Việt Nam'],
      footer_title_1: ['Tiêu đề cột 1', 'text', 'Hướng dẫn'],
      footer_title_2: ['Tiêu đề cột 2', 'text', 'Giới thiệu'],
      footer_title_3: ['Tiêu đề cột 3', 'text', 'Hỗ trợ'],
      footer_title_map: ['Tiêu đề cột bản đồ', 'text', 'Google Map'],
      copyright: ['Dòng bản quyền', 'text', '© Bản quyền thuộc về Nội thất IRIS'],
      show_floating: ['Hiện nút liên hệ nổi (Gọi, Zalo, Messenger)', 'checkbox', '1'],
      mega_view_all: ['Menu Sản phẩm: chữ trước tên danh mục ở dòng đầu (vd "Xem tất cả")', 'text', 'Xem tất cả'],
      mega_label: ['Menu Sản phẩm: tiêu đề nhóm danh mục con (để trống = ẩn)', 'text', 'Theo loại'],
      mega_collection: ['Menu Sản phẩm: chữ dưới ảnh (vd "Bộ sưu tập")', 'text', 'Bộ sưu tập'],
    },
  },
  home_hero: {
    title: 'Trang chủ: Ảnh bìa & giới thiệu',
    fields: {
      hero_image: ['Ảnh bìa lớn', 'image', ''],
      hero_title: ['Dòng chữ trên ảnh bìa', 'text', 'Bring your modern design FURNITURE'],
      about_show: ['Hiện khối giới thiệu', 'checkbox', '1'],
      about_title: ['Tiêu đề giới thiệu', 'text', 'Nội Thất IRIS'],
      about_text: ['Nội dung giới thiệu (mỗi đoạn một dòng)', 'textarea', 'Với sứ mệnh kiến tạo không gian sống với tinh hoa thiết kế Ý\nVới nhiều năm hoạt động trong lĩnh vực nội thất cao cấp, IRIS luôn cam kết mang tới những giải pháp đồ rời đẳng cấp.\nLuôn khác biệt với thiết kế Ý tinh tế, chuẩn mực chất lượng châu Âu là giá trị cốt lõi của mỗi sản phẩm của Nội Thất IRIS.\nChúng tôi tự hào là hệ thống phân phối nội thất nhập khẩu được gia chủ có gu lựa chọn, như một bảo chứng cho không gian sống sang trọng.'],
      about_image: ['Ảnh giới thiệu', 'image', ''],
      about_button: ['Chữ trên nút', 'text', 'xem thêm về chúng tôi'],
      about_link: ['Nút dẫn tới (link)', 'url', '/gioi-thieu/'],
    },
  },
  home_cats: {
    title: 'Trang chủ: Danh mục & không gian',
    description: 'Khối "Danh mục" tự lấy các danh mục sản phẩm cấp 1 có ảnh (trừ các danh mục chọn làm Không gian). Thứ tự: Sản phẩm → Danh mục → ô "Thứ tự".',
    fields: {
      cats_show: ['Hiện khối danh mục', 'checkbox', '1'],
      cats_title: ['Tiêu đề khối danh mục', 'text', 'Danh Mục Sản Phẩm Nội Thất'],
      cats_exclude: ['Ẩn danh mục (chọn 1 danh mục muốn ẩn)', 'cat', ''],
      rooms_show: ['Hiện khối không gian', 'checkbox', '1'],
      rooms_title: ['Tiêu đề khối không gian', 'text', 'Chọn Không Gian Nội Thất Cao Cấp'],
      room_1: ['Không gian 1 (danh mục)', 'cat', ''],
      room_2: ['Không gian 2 (danh mục)', 'cat', ''],
      room_3: ['Không gian 3 (danh mục)', 'cat', ''],
    },
  },
  home_products: {
    title: 'Trang chủ: Các khối sản phẩm',
    description: 'Mỗi khối hiển thị sản phẩm của 1 danh mục. Để trống tiêu đề = ẩn khối.',
    fields: {
      ps1_title: ['Khối 1 – tiêu đề', 'text', 'Ghế Sofa Da Thật, Cao Cấp'],
      ps1_cat: ['Khối 1 – danh mục', 'cat-all', ''],
      ps1_count: ['Khối 1 – số sản phẩm', 'number', '8'],
      ps2_title: ['Khối 2 – tiêu đề', 'text', 'Bàn ăn mặt đá nhập khẩu'],
      ps2_cat: ['Khối 2 – danh mục', 'cat-all', ''],
      ps2_count: ['Khối 2 – số sản phẩm', 'number', '8'],
      ps3_title: ['Khối 3 – tiêu đề', 'text', 'Ghế ăn cao cấp'],
      ps3_cat: ['Khối 3 – danh mục', 'cat-all', ''],
      ps3_count: ['Khối 3 – số sản phẩm', 'number', '4'],
      ps3_more: ['Khối 3 – hiện nút "Tải thêm"', 'checkbox', '1'],
    },
  },
  home_media: {
    title: 'Trang chủ: Thương hiệu, video, blog, báo chí',
    fields: {
      brands: ['Logo thương hiệu (chạy ngang)', 'gallery', []],
      video_image: ['Ảnh nền video', 'image', ''],
      video_url: ['Link video YouTube', 'url', 'https://www.youtube.com/watch?v=f3Hh_qSkpaA'],
      blog_title: ['Tiêu đề khối blog', 'text', 'Blog kiến thức'],
      blog_count: ['Số bài viết', 'number', '8'],
      press_title: ['Tiêu đề khối báo chí', 'text', 'Báo chí Nói về chúng tôi'],
      press: ['Logo báo chí', 'gallery', []],
      testi_title: ['Tiêu đề khối phản hồi (nội dung: menu Phản hồi KH)', 'text', 'Khách hàng phản hồi'],
      insta_title: ['Tiêu đề khối Instagram', 'text', 'Theo dõi chúng tôi trên Instagram'],
      insta_link: ['Link Instagram', 'url', 'https://instagram.com/'],
      instagram: ['Ảnh Instagram', 'gallery', []],
    },
  },
  product_page: {
    title: 'Trang chi tiết sản phẩm',
    fields: {
      promo_title: ['Tiêu đề khung ưu đãi', 'text', 'Khuyến mãi - Ưu đãi'],
      promo_items: ['Các dòng ưu đãi (mỗi dòng một ý)', 'textarea', 'Miễn phí ship đơn hàng từ 10 triệu (nội thành Hà Nội)\nThời gian mở cửa: 8H - 21H (T2-CN)\nĐổi mới 30 ngày với lỗi nhà sản xuất'],
      policy_title: ['Tiêu đề quyền lợi', 'text', 'Quyền lợi & chính sách:'],
      policy_items: ['Các quyền lợi (mỗi dòng một ý)', 'textarea', '7 ngày hoàn trả miễn phí\nBảo hành trong 12 tháng\nMiễn phí vận chuyển'],
      support_button: ['Chữ nút hỗ trợ', 'text', 'Kết nối chuyên viên hỗ trợ ngay'],
      related_title: ['Tiêu đề sản phẩm tương tự', 'text', 'Sản phẩm tương tự'],
    },
  },
  about_page: {
    title: 'Trang Giới thiệu',
    fields: {
      ab_banner: ['Ảnh bìa', 'image', ''],
      ab_title: ['Tiêu đề trên ảnh bìa', 'text', 'về chúng tôi'],
      ab_heading: ['Tiêu đề chính', 'text', 'Chúng tôi thích ngôi nhà các bạn thành siêu phẩm'],
      ab_text_1: ['Đoạn văn 1', 'textarea', 'Chúng tôi không chỉ đơn thuần cung cấp nội thất, mà còn đồng hành cùng khách hàng để kiến tạo nên những không gian sống sang trọng, tiện nghi và mang đậm dấu ấn riêng. Mỗi sản phẩm đều được lựa chọn kỹ lưỡng nhằm biến ngôi nhà của bạn trở thành một "siêu phẩm" hiện đại, đẳng cấp và đầy cảm hứng cho cả gia đình.'],
      ab_text_2: ['Đoạn văn 2', 'textarea', 'Với kinh nghiệm trong lĩnh vực nội thất, chúng tôi luôn mang đến những giải pháp tối ưu từ thiết kế đến thi công, giúp nâng tầm giá trị cho từng không gian sống. Sự kết hợp giữa chất lượng, thẩm mỹ và xu hướng mới nhất chính là điều làm nên những căn nhà đẹp, tinh tế và khác biệt theo phong cách riêng của bạn.'],
      ab_image_1: ['Ảnh 1', 'image', ''],
      ab_image_2: ['Ảnh 2', 'image', ''],
      ab_v1_title: ['Giá trị 01 – tiêu đề', 'text', 'Được làm thủ công'],
      ab_v1_text: ['Giá trị 01 – nội dung', 'textarea', 'Mỗi sản phẩm nội thất đều được chế tác thủ công tỉ mỉ bởi những người thợ lành nghề, mang đến vẻ đẹp tinh tế và giá trị bền vững theo thời gian. Chúng tôi tin rằng một không gian sống đẹp không chỉ đến từ thiết kế, mà còn từ sự chăm chút trong từng chi tiết được làm bằng cả tâm huyết.'],
      ab_v2_title: ['Giá trị 02 – tiêu đề', 'text', 'Đam mê thực sự'],
      ab_v2_text: ['Giá trị 02 – nội dung', 'textarea', 'Với niềm đam mê thực sự dành cho nội thất và không gian sống, chúng tôi luôn không ngừng sáng tạo để mang đến những sản phẩm tinh tế, sang trọng và khác biệt. Mỗi công trình hoàn thiện không chỉ là một căn nhà đẹp, mà còn là nơi thể hiện phong cách, cá tính và giá trị riêng của gia chủ.'],
      ab_v3_title: ['Giá trị 03 – tiêu đề', 'text', 'Chúng tôi đề cao tính chính trực'],
      ab_v3_text: ['Giá trị 03 – nội dung', 'textarea', 'Với chúng tôi, chính trực không chỉ là một giá trị cốt lõi mà còn là kim chỉ nam trong mọi hoạt động kinh doanh và phục vụ khách hàng. Từ việc lựa chọn chất liệu, quy trình sản xuất đến dịch vụ hậu mãi, tất cả đều được thực hiện bằng sự tử tế, trách nhiệm và cam kết mang lại những không gian sống chất lượng nhất.'],
      ab_services_title: ['Tiêu đề khối dịch vụ', 'text', 'Khám phá các dịch vụ của chúng tôi'],
      ab_service_1: ['Dịch vụ 1 (danh mục)', 'cat', ''],
      ab_service_2: ['Dịch vụ 2 (danh mục)', 'cat', ''],
      ab_service_3: ['Dịch vụ 3 (danh mục)', 'cat', ''],
    },
  },
  contact_page: {
    title: 'Trang Liên hệ',
    fields: {
      ct_banner: ['Ảnh bìa', 'image', ''],
      ct_title: ['Tiêu đề', 'text', 'Liên hệ'],
      ct_text: ['Lời giới thiệu', 'textarea', 'Nội Thất IRIS luôn sẵn sàng lắng nghe và tư vấn giải pháp nội thất phù hợp nhất cho không gian của bạn. Hãy để lại lời nhắn hoặc ghé thăm showroom của chúng tôi.'],
      ct_form_title: ['Tiêu đề form', 'text', 'Gửi lời nhắn cho chúng tôi'],
      ct_follow_title: ['Tiêu đề khối ảnh', 'text', 'Theo dõi chúng tôi'],
      ct_follow: ['Ảnh khối "Theo dõi"', 'gallery', []],
      ct_social_title: ['Tiêu đề mạng xã hội', 'text', 'Kết nối với IRIS'],
    },
  },
};

export type MenuItem = { title: string; url: string; target?: string; object?: string; catSlug?: string; children: MenuItem[] };
export type Menus = Record<'primary' | 'footer-1' | 'footer-2' | 'footer-3', MenuItem[]>;
export type BankAccount = { bank: string; number: string; name: string; bin?: string };
export type Payments = {
  cod: { enabled: boolean; title: string; instructions: string };
  bacs: { enabled: boolean; title: string; instructions: string; accounts: BankAccount[] };
};
export type Settings = { site: Record<string, string | string[]>; menus: Menus; payments: Payments };

export const MENU_LOCATIONS: Record<keyof Menus, string> = { primary: 'Menu chính (đầu trang)', 'footer-1': 'Chân trang – cột 1', 'footer-2': 'Chân trang – cột 2', 'footer-3': 'Chân trang – cột 3' };

export function defaults(): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};
  for (const sec of Object.values(FIELDS)) for (const [k, f] of Object.entries(sec.fields)) out[k] = f[2];
  return out;
}

const DEFAULT_PAYMENTS: Payments = {
  cod: { enabled: true, title: 'Thanh toán khi nhận hàng (COD)', instructions: 'Trả tiền mặt khi nhận hàng.' },
  bacs: { enabled: true, title: 'Chuyển khoản ngân hàng', instructions: 'Chuyển khoản theo thông tin bên dưới, ghi nội dung là mã đơn hàng. Đơn hàng được giao sau khi chúng tôi nhận được tiền.', accounts: [] },
};

async function read<T>(key: string, def: T): Promise<T> {
  const row = await db.setting.findUnique({ where: { key } });
  if (!row) return def;
  try {
    const v = JSON.parse(row.value);
    return typeof def === 'object' && !Array.isArray(def) ? { ...def, ...v } : v;
  } catch {
    return def;
  }
}

export const getSettings = cache(async (): Promise<Settings> => {
  const [site, menus, payments] = await Promise.all([
    read('site', {} as Record<string, string | string[]>),
    read('menus', { primary: [], 'footer-1': [], 'footer-2': [], 'footer-3': [] } as Menus),
    read('payments', DEFAULT_PAYMENTS),
  ]);
  return { site: { ...defaults(), ...site }, menus, payments: { cod: { ...DEFAULT_PAYMENTS.cod, ...payments.cod }, bacs: { ...DEFAULT_PAYMENTS.bacs, ...payments.bacs } } };
});

export async function saveSetting(key: string, value: unknown) {
  const v = JSON.stringify(value);
  await db.setting.upsert({ where: { key }, create: { key, value: v }, update: { value: v } });
}

/** 1 giá trị chữ (giống iris_mod). */
export function mod(s: Settings, key: string): string {
  const v = s.site[key];
  return Array.isArray(v) ? v.join(',') : String(v ?? '');
}

/** Danh sách ảnh (ô "gallery"). */
export function mods(s: Settings, key: string): string[] {
  const v = s.site[key];
  return Array.isArray(v) ? v.filter(Boolean) : String(v || '').split(',').map((x) => x.trim()).filter(Boolean);
}

export const on = (s: Settings, key: string) => mod(s, key) === '1';

/** Link Zalo từ số hoặc link. */
export function zaloUrl(s: Settings): string {
  const z = mod(s, 'zalo');
  return z.startsWith('http') ? z : 'https://zalo.me/' + z.replace(/\D/g, '');
}

export function tel(phone: string): string {
  return 'tel:' + phone.replace(/[^0-9+]/g, '');
}

/** Iframe bản đồ Google theo địa chỉ (không cần API key). */
export function mapSrc(s: Settings): string {
  const custom = mod(s, 'map_embed').trim();
  if (custom) return custom.match(/src="([^"]+)"/)?.[1] || custom;
  return 'https://www.google.com/maps?q=' + encodeURIComponent(mod(s, 'address')) + '&output=embed';
}

export function socials(s: Settings): [key: string, label: string, url: string][] {
  return ([['facebook', 'Facebook'], ['instagram', 'Instagram'], ['youtube', 'YouTube'], ['tiktok', 'TikTok']] as const)
    .map(([k, l]) => [k, l, mod(s, 'social_' + k)] as [string, string, string])
    .filter(([, , u]) => u);
}
