<?php
/**
 * Contact form: no plugin needed. Messages are saved under "Tin nhắn liên hệ" (so nothing is lost
 * even if the hosting cannot send email) and an email notification is attempted.
 */

defined( 'ABSPATH' ) || exit;

function iris_contact_form( string $source = '' ): void {
	$status = sanitize_key( $_GET['lien-he'] ?? '' );
	?>
	<form class="contact-form grid gap-4" method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
		<?php if ( 'ok' === $status ) : ?>
			<p class="rounded-lg bg-emerald-50 p-4 text-emerald-800" role="status">Cảm ơn bạn! IRIS đã nhận được lời nhắn và sẽ liên hệ lại sớm nhất.</p>
		<?php elseif ( 'loi' === $status ) : ?>
			<p class="rounded-lg bg-red-50 p-4 text-red-700" role="alert">Vui lòng nhập họ tên và số điện thoại hoặc email hợp lệ.</p>
		<?php endif; ?>
		<input type="hidden" name="action" value="iris_contact">
		<input type="hidden" name="source" value="<?php echo esc_attr( $source ?: get_the_title() ); ?>">
		<?php wp_nonce_field( 'iris_contact', 'iris_contact_nonce' ); ?>
		<div class="hidden" aria-hidden="true"><label>Website <input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
		<div class="grid gap-4 sm:grid-cols-2">
			<label class="field"><span>Họ và tên *</span><input type="text" name="name" required autocomplete="name"></label>
			<label class="field"><span>Số điện thoại *</span><input type="tel" name="phone" required autocomplete="tel" inputmode="tel"></label>
		</div>
		<label class="field"><span>Email</span><input type="email" name="email" autocomplete="email"></label>
		<label class="field"><span>Nội dung</span><textarea name="message" rows="5" placeholder="Bạn cần tư vấn sản phẩm nào?"></textarea></label>
		<button type="submit" class="btn-gold justify-self-start"><?php echo iris_icon( 'send', 'size-4' ); ?> Gửi lời nhắn</button>
	</form>
	<?php
}

function iris_handle_contact() {
	$back = wp_get_referer() ?: home_url( '/' );
	$back = remove_query_arg( 'lien-he', $back );

	if ( ! isset( $_POST['iris_contact_nonce'] ) || ! wp_verify_nonce( sanitize_key( $_POST['iris_contact_nonce'] ), 'iris_contact' ) || ! empty( $_POST['website'] ) ) {
		wp_safe_redirect( add_query_arg( 'lien-he', 'loi', $back ) . '#lien-he-form' );
		exit;
	}

	$name    = sanitize_text_field( wp_unslash( $_POST['name'] ?? '' ) );
	$phone   = sanitize_text_field( wp_unslash( $_POST['phone'] ?? '' ) );
	$email   = sanitize_email( wp_unslash( $_POST['email'] ?? '' ) );
	$message = sanitize_textarea_field( wp_unslash( $_POST['message'] ?? '' ) );
	$source  = sanitize_text_field( wp_unslash( $_POST['source'] ?? '' ) );

	if ( '' === $name || ( strlen( preg_replace( '/\D/', '', $phone ) ) < 9 && ! is_email( $email ) ) ) {
		wp_safe_redirect( add_query_arg( 'lien-he', 'loi', $back ) . '#lien-he-form' );
		exit;
	}

	$id = wp_insert_post( [
		'post_type'    => 'iris_message',
		'post_status'  => 'pending',
		'post_title'   => $name,
		'post_content' => $message,
	] );
	if ( $id ) {
		foreach ( compact( 'name', 'phone', 'email', 'source' ) as $k => $v ) {
			update_post_meta( $id, $k, $v );
		}
	}

	$to = iris_mod( 'ct_notify' ) ?: get_option( 'admin_email' );
	wp_mail( $to, '[Website] Tin nhắn mới từ ' . $name, "Họ tên: {$name}\nĐiện thoại: {$phone}\nEmail: {$email}\nTrang: {$source}\n\n{$message}\n\nXem trong quản trị: " . admin_url( 'edit.php?post_type=iris_message' ) );

	wp_safe_redirect( add_query_arg( 'lien-he', 'ok', $back ) . '#lien-he-form' );
	exit;
}
add_action( 'admin_post_nopriv_iris_contact', 'iris_handle_contact' );
add_action( 'admin_post_iris_contact', 'iris_handle_contact' );
