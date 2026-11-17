<?php
// Router cho máy chủ PHP thử nghiệm (php -S) – dùng bởi tools/local-wp.sh.
// php -S không tự thêm "/" cuối thư mục như Apache/Nginx, nên /wp-admin làm link
// tương đối (edit.php…) trỏ sai thành /edit.php. Ở đây chuyển hướng sang /wp-admin/.
$path = parse_url( $_SERVER['REQUEST_URI'], PHP_URL_PATH );
$file = $_SERVER['DOCUMENT_ROOT'] . $path;

if ( is_dir( $file ) && substr( $path, -1 ) !== '/' ) {
	$query = isset( $_SERVER['QUERY_STRING'] ) && $_SERVER['QUERY_STRING'] !== '' ? '?' . $_SERVER['QUERY_STRING'] : '';
	header( 'Location: ' . $path . '/' . $query, true, 301 );
	exit;
}

// File tĩnh hoặc file .php có thật: để máy chủ tự xử lý.
if ( $path !== '/' && file_exists( $file ) ) {
	return false;
}

// Trang quản trị bị mở nhầm ở gốc (vd /edit.php do link cũ/bookmark) → /wp-admin/edit.php.
if ( preg_match( '#^/[\w.-]+\.php$#', $path ) && is_file( $_SERVER['DOCUMENT_ROOT'] . '/wp-admin' . $path ) ) {
	$query = isset( $_SERVER['QUERY_STRING'] ) && $_SERVER['QUERY_STRING'] !== '' ? '?' . $_SERVER['QUERY_STRING'] : '';
	header( 'Location: /wp-admin' . $path . $query, true, 302 );
	exit;
}

// Còn lại (đường dẫn đẹp của WordPress) → index.php.
$_SERVER['SCRIPT_NAME'] = '/index.php';
require $_SERVER['DOCUMENT_ROOT'] . '/index.php';
