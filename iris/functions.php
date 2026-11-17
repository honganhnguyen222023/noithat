<?php
/**
 * IRIS Nội Thất – theme bootstrap.
 *
 * Mỗi file trong /inc lo một việc:
 *  setup.php        – khai báo theme, menu, kích thước ảnh, nạp CSS/JS, tối ưu tốc độ
 *  helpers.php      – hàm tiện ích (icon, ảnh, breadcrumb, mục lục bài viết…)
 *  customizer.php   – các ô nhập nội dung trong Giao diện → Tùy biến
 *  post-types.php   – "Phản hồi khách hàng" và "Tin nhắn liên hệ"
 *  woocommerce.php  – tùy biến cửa hàng (thẻ sản phẩm, banner danh mục, Mua ngay…)
 *  contact-form.php – xử lý form liên hệ
 *  seo.php          – thẻ meta, Open Graph, dữ liệu có cấu trúc (schema)
 *  demo-import.php  – trang "Nhập dữ liệu mẫu"
 */

defined( 'ABSPATH' ) || exit;

define( 'IRIS_VERSION', '1.0.0' );
define( 'IRIS_DIR', get_template_directory() );
define( 'IRIS_URI', get_template_directory_uri() );

foreach ( [ 'setup', 'helpers', 'menu', 'customizer', 'post-types', 'woocommerce', 'contact-form', 'seo', 'demo-import' ] as $iris_file ) {
	require_once IRIS_DIR . "/inc/{$iris_file}.php";
}
