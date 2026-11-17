<?php
/**
 * Testimonials carousel (content: admin menu "Phản hồi KH"). Also reused on product pages.
 * $args['title'] / $args['subtitle'] optional.
 */
$iris_items = get_posts( [ 'post_type' => 'iris_testimonial', 'numberposts' => 12, 'orderby' => 'menu_order date', 'order' => 'ASC' ] );
if ( ! $iris_items ) {
	return;
}
$iris_title    = $args['title'] ?? iris_mod( 'testi_title' );
$iris_subtitle = $args['subtitle'] ?? '';
?>
<section class="container-x pb-14">
	<?php iris_section_title( $iris_title, 'h2', 'mb-1' ); ?>
	<?php if ( $iris_subtitle ) : ?>
		<p class="mb-6 text-center uppercase"><?php echo esc_html( $iris_subtitle ); ?></p>
	<?php endif; ?>
	<div class="carousel testimonials relative mt-6" data-carousel data-center data-autoplay="6000">
		<div class="carousel__track gap-0" data-track>
			<?php foreach ( $iris_items as $iris_t ) : ?>
				<figure class="testimonial w-full shrink-0 sm:w-1/2 lg:w-1/3" data-slide>
					<blockquote class="testimonial__text"><?php echo wp_kses_post( wpautop( $iris_t->post_content ) ); ?></blockquote>
					<figcaption class="mt-6 flex items-center gap-4">
						<?php echo get_the_post_thumbnail( $iris_t, 'thumbnail', [ 'class' => 'size-[58px] rounded-full object-cover', 'loading' => 'lazy' ] ); ?>
						<span>
							<span class="block text-lg font-bold text-[#8a6a33]"><?php echo esc_html( get_the_title( $iris_t ) ); ?></span>
							<span class="block text-[15px]"><?php echo esc_html( get_post_meta( $iris_t->ID, 'role', true ) ); ?></span>
						</span>
					</figcaption>
				</figure>
			<?php endforeach; ?>
		</div>
		<div class="carousel__dots" data-dots></div>
	</div>
</section>
