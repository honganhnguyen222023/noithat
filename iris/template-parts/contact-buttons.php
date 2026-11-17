<?php
/**
 * Floating contact buttons (desktop: right side) + bottom contact bar (mobile).
 */
if ( ! iris_mod( 'show_floating' ) ) {
	return;
}
$iris_phone   = iris_mod( 'phone' );
$iris_zalo    = iris_mod( 'zalo' );
$iris_zalo    = str_starts_with( $iris_zalo, 'http' ) ? $iris_zalo : 'https://zalo.me/' . preg_replace( '/\D/', '', $iris_zalo );
$iris_mess    = iris_mod( 'messenger' );
$iris_contact = ( $p = get_page_by_path( 'lien-he' ) ) ? get_permalink( $p ) : home_url( '/lien-he/' );
?>
<div class="float-contact" aria-label="Liên hệ nhanh">
	<a href="<?php echo esc_url( $iris_contact ); ?>" class="float-contact__btn bg-[#0f3a46] text-white" aria-label="Liên hệ"><?php echo iris_icon( 'square-pen', 'size-5' ); ?><span>Liên hệ</span></a>
	<a href="<?php echo esc_url( iris_tel( $iris_phone ) ); ?>" class="float-contact__btn bg-white text-[#e8262d] ring-pulse" aria-label="Gọi điện"><?php echo iris_icon( 'phone', 'size-5' ); ?><span><?php echo esc_html( $iris_phone ); ?></span></a>
	<a href="<?php echo esc_url( $iris_zalo ); ?>" class="float-contact__btn bg-[#0068ff] text-white" target="_blank" rel="noopener" aria-label="Chat Zalo"><?php echo iris_icon( 'zalo', 'size-6' ); ?><span>Zalo</span></a>
	<?php if ( $iris_mess ) : ?>
		<a href="<?php echo esc_url( $iris_mess ); ?>" class="float-contact__btn bg-[#0a7cff] text-white" target="_blank" rel="noopener" aria-label="Chat Messenger"><?php echo iris_icon( 'messenger', 'size-5' ); ?><span>Messenger</span></a>
	<?php endif; ?>
</div>

<nav class="mobile-bar" aria-label="Thanh liên hệ">
	<button type="button" data-drawer-open aria-controls="mobile-drawer"><span class="mobile-bar__icon bg-[#1677ff]"><?php echo iris_icon( 'menu', 'size-4' ); ?></span>Menu</button>
	<a href="<?php echo esc_url( $iris_zalo ); ?>" target="_blank" rel="noopener"><span class="mobile-bar__icon bg-[#0068ff]"><?php echo iris_icon( 'zalo', 'size-5' ); ?></span>Zalo</a>
	<a href="<?php echo esc_url( iris_tel( $iris_phone ) ); ?>" class="mobile-bar__call"><span class="mobile-bar__call-btn ring-pulse"><?php echo iris_icon( 'phone', 'size-6' ); ?></span><span class="mobile-bar__call-label">Gọi ngay</span></a>
	<a href="<?php echo esc_url( $iris_mess ?: $iris_contact ); ?>" target="_blank" rel="noopener"><span class="mobile-bar__icon bg-[#0a7cff]"><?php echo iris_icon( 'messenger', 'size-4' ); ?></span>Messenger</a>
	<a href="<?php echo esc_url( $iris_contact ); ?>"><span class="mobile-bar__icon bg-[#38a3c4]"><?php echo iris_icon( 'square-pen', 'size-4' ); ?></span>Liên hệ</a>
</nav>
