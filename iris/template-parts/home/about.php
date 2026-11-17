<?php
if ( ! iris_mod( 'about_show' ) ) {
	return;
}
$iris_paras = array_filter( array_map( 'trim', preg_split( '/\R/u', wp_strip_all_tags( iris_mod( 'about_text' ) ) ) ) );
?>
<section id="home-about" class="container-x pt-[30px] pb-14 lg:pb-16">
	<div class="grid items-stretch lg:grid-cols-12">
		<div class="relative overflow-hidden lg:col-start-4 lg:col-end-13 lg:row-start-1" data-reveal="zoom">
			<?php echo iris_img( iris_mod( 'about_image' ), 'large', 'size-full min-h-[260px] object-cover object-right', [ 'loading' => 'lazy', 'sizes' => '(min-width:1024px) 75vw, 100vw' ] ); ?>
		</div>
		<div class="about-panel relative z-10 lg:col-start-1 lg:col-end-8 lg:row-start-1" data-reveal="left">
			<h2 class="mb-6 text-[30px] leading-tight font-bold text-[#62616b] lg:text-[40px]"><?php echo esc_html( iris_mod( 'about_title' ) ); ?></h2>
			<div class="space-y-4 text-[15px] leading-[1.7] text-ink lg:text-base">
				<?php foreach ( $iris_paras as $iris_p ) : ?>
					<p><?php echo esc_html( $iris_p ); ?></p>
				<?php endforeach; ?>
			</div>
			<?php if ( iris_mod( 'about_button' ) ) : ?>
				<a href="<?php echo esc_url( iris_mod( 'about_link' ) ); ?>" class="btn-gold mt-8"><?php echo esc_html( iris_mod( 'about_button' ) ); ?> <?php echo iris_icon( 'chevron-right', 'size-4' ); ?></a>
			<?php endif; ?>
		</div>
	</div>
</section>
