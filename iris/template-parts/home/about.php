<?php
/**
 * Khối giới thiệu trang chủ (giống demo): ảnh rộng 80% bên phải, hiện đủ ảnh không cắt;
 * khung chữ trắng mờ rộng 50% đè lên góc dưới bên trái ảnh. Mobile: chữ trên, ảnh dưới.
 */
if ( ! iris_mod( 'about_show' ) ) {
	return;
}
$iris_paras = array_filter( array_map( 'trim', preg_split( '/\R/u', wp_strip_all_tags( iris_mod( 'about_text' ) ) ) ) );
?>
<section id="home-about" class="container-x py-[30px]">
	<div class="grid lg:grid-cols-1">
		<div class="about-panel relative z-10 lg:col-start-1 lg:row-start-1 lg:w-1/2 lg:self-end" data-reveal="left">
			<h2 class="mb-5 text-[32px] leading-tight font-bold text-[#62616b] lg:text-[40px]"><?php echo esc_html( iris_mod( 'about_title' ) ); ?></h2>
			<div class="space-y-4 text-[15px] leading-[1.6] text-ink sm:text-base">
				<?php foreach ( $iris_paras as $iris_p ) : ?>
					<p><?php echo esc_html( $iris_p ); ?></p>
				<?php endforeach; ?>
			</div>
			<?php if ( iris_mod( 'about_button' ) ) : ?>
				<a href="<?php echo esc_url( iris_mod( 'about_link' ) ); ?>" class="btn-gold mt-9"><?php echo esc_html( iris_mod( 'about_button' ) ); ?> <?php echo iris_icon( 'chevron-right', 'size-4' ); ?></a>
			<?php endif; ?>
		</div>
		<div class="overflow-hidden lg:col-start-1 lg:row-start-1 lg:w-4/5 lg:justify-self-end" data-reveal="zoom">
			<?php echo iris_img( iris_mod( 'about_image' ), 'full', 'block h-auto w-full', [ 'loading' => 'lazy', 'sizes' => '(min-width:1320px) 1032px, (min-width:1024px) 80vw, 100vw' ] ); ?>
		</div>
	</div>
</section>
