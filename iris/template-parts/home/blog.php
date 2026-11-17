<?php
$iris_posts = get_posts( [ 'numberposts' => max( 1, (int) iris_mod( 'blog_count' ) ), 'ignore_sticky_posts' => true ] );
if ( ! $iris_posts ) {
	return;
}
?>
<section class="arc-section pt-14 pb-16">
	<div class="container-x relative">
		<?php iris_section_title( iris_mod( 'blog_title' ), 'h2', 'mb-4' ); ?>
		<div class="carousel relative" data-carousel>
			<button type="button" class="carousel__arrow carousel__arrow--ring left-3 top-[140px] lg:left-[30px] lg:top-[162px]" data-prev aria-label="Bài trước"><?php echo iris_icon( 'chevron-left', 'size-5' ); ?></button>
			<button type="button" class="carousel__arrow carousel__arrow--ring right-3 top-[140px] lg:right-[30px] lg:top-[162px]" data-next aria-label="Bài sau"><?php echo iris_icon( 'chevron-right', 'size-5' ); ?></button>
			<div class="carousel__track gap-5" data-track>
				<?php
				foreach ( $iris_posts as $post ) : // phpcs:ignore WordPress.WP.GlobalVariablesOverride
					setup_postdata( $post );
					?>
					<div class="w-[85%] sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)]">
						<?php get_template_part( 'template-parts/post-card', null, [ 'style' => 'carousel' ] ); ?>
					</div>
				<?php endforeach; ?>
				<?php wp_reset_postdata(); ?>
			</div>
		</div>
	</div>
</section>
