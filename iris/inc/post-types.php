<?php
/**
 * Custom content types the shop owner manages from the admin menu:
 *  - "Phản hồi KH"       (iris_testimonial): tên = tiêu đề, nội dung, ảnh đại diện, chức danh
 *  - "Tin nhắn liên hệ"  (iris_message): tin khách gửi từ form liên hệ (chỉ xem, không hiện ngoài web)
 */

defined( 'ABSPATH' ) || exit;

add_action( 'init', function () {
	register_post_type( 'iris_testimonial', [
		'labels'        => [
			'name'               => 'Phản hồi khách hàng',
			'singular_name'      => 'Phản hồi',
			'menu_name'          => 'Phản hồi KH',
			'add_new'            => 'Thêm phản hồi',
			'add_new_item'       => 'Thêm phản hồi mới',
			'edit_item'          => 'Sửa phản hồi',
			'all_items'          => 'Tất cả phản hồi',
			'featured_image'     => 'Ảnh đại diện khách hàng',
			'set_featured_image' => 'Chọn ảnh đại diện',
		],
		'public'        => false,
		'show_ui'       => true,
		'menu_icon'     => 'dashicons-format-quote',
		'menu_position' => 25,
		'supports'      => [ 'title', 'editor', 'thumbnail', 'page-attributes' ],
	] );

	register_post_type( 'iris_message', [
		'labels'        => [
			'name'          => 'Tin nhắn liên hệ',
			'singular_name' => 'Tin nhắn',
			'menu_name'     => 'Tin nhắn liên hệ',
			'all_items'     => 'Tất cả tin nhắn',
			'edit_item'     => 'Xem tin nhắn',
		],
		'public'        => false,
		'show_ui'       => true,
		'menu_icon'     => 'dashicons-email-alt',
		'menu_position' => 26,
		'supports'      => [ 'title', 'editor' ],
		'capabilities'  => [ 'create_posts' => 'do_not_allow' ],
		'map_meta_cap'  => true,
	] );
} );

/* --- Testimonial: "Chức danh" box ---------------------------------------- */
add_action( 'add_meta_boxes', function () {
	add_meta_box( 'iris_role', 'Chức danh / mô tả ngắn', function ( $post ) {
		wp_nonce_field( 'iris_role', 'iris_role_nonce' );
		printf( '<input type="text" name="iris_role" value="%s" class="widefat" placeholder="VD: CEO Công ty Giáo dục">', esc_attr( get_post_meta( $post->ID, 'role', true ) ) );
		echo '<p class="description">Tiêu đề bài = tên khách hàng. Nội dung = lời phản hồi. Ảnh đại diện ở cột bên phải.</p>';
	}, 'iris_testimonial', 'normal', 'high' );

	add_meta_box( 'iris_msg_info', 'Thông tin người gửi', function ( $post ) {
		$rows = [ 'Họ tên' => 'name', 'Điện thoại' => 'phone', 'Email' => 'email', 'Gửi từ trang' => 'source' ];
		echo '<table class="widefat striped"><tbody>';
		foreach ( $rows as $label => $key ) {
			$val = get_post_meta( $post->ID, $key, true );
			if ( 'phone' === $key && $val ) {
				$val = sprintf( '<a href="%s">%s</a>', esc_url( iris_tel( $val ) ), esc_html( $val ) );
			} elseif ( 'email' === $key && $val ) {
				$val = sprintf( '<a href="mailto:%1$s">%1$s</a>', esc_html( $val ) );
			} else {
				$val = esc_html( $val );
			}
			printf( '<tr><th style="width:140px">%s</th><td>%s</td></tr>', esc_html( $label ), $val ); // phpcs:ignore
		}
		echo '</tbody></table>';
	}, 'iris_message', 'normal', 'high' );
} );

add_action( 'save_post_iris_testimonial', function ( $post_id ) {
	if ( ! isset( $_POST['iris_role_nonce'] ) || ! wp_verify_nonce( sanitize_key( $_POST['iris_role_nonce'] ), 'iris_role' ) ) {
		return;
	}
	if ( ! current_user_can( 'edit_post', $post_id ) ) {
		return;
	}
	update_post_meta( $post_id, 'role', sanitize_text_field( wp_unslash( $_POST['iris_role'] ?? '' ) ) );
} );

/* --- Message list: useful columns ----------------------------------------- */
add_filter( 'manage_iris_message_posts_columns', fn( $c ) => [
	'cb'    => $c['cb'],
	'title' => 'Người gửi',
	'phone' => 'Điện thoại',
	'email' => 'Email',
	'date'  => 'Thời gian',
] );
add_action( 'manage_iris_message_posts_custom_column', function ( $col, $id ) {
	echo esc_html( get_post_meta( $id, $col, true ) );
}, 10, 2 );

/** Show the number of unread messages next to the menu item. */
add_action( 'admin_menu', function () {
	global $menu;
	$count = (int) wp_count_posts( 'iris_message' )->pending;
	if ( ! $count ) {
		return;
	}
	foreach ( $menu as &$item ) {
		if ( 'edit.php?post_type=iris_message' === $item[2] ) {
			$item[0] .= ' <span class="awaiting-mod"><span class="pending-count">' . $count . '</span></span>';
		}
	}
} );

/** Opening a message marks it as read. */
add_action( 'load-post.php', function () {
	$id = absint( $_GET['post'] ?? 0 );
	if ( $id && 'iris_message' === get_post_type( $id ) && 'pending' === get_post_status( $id ) ) {
		wp_update_post( [ 'ID' => $id, 'post_status' => 'publish' ] );
	}
} );
