<?php
/**
 * Blog sidebar: product categories + latest posts (+ any widgets added in Giao diện → Tiện ích).
 */
?>
<aside class="space-y-[30px]" aria-label="Cột bên">
	<?php if ( taxonomy_exists( 'product_cat' ) ) : ?>
		<?php $iris_cats = get_terms( [ 'taxonomy' => 'product_cat', 'parent' => 0, 'hide_empty' => true, 'orderby' => 'name' ] ); ?>
		<?php if ( $iris_cats && ! is_wp_error( $iris_cats ) ) : ?>
			<section class="sidebar-card">
				<h2 class="sidebar-title">Danh mục sản phẩm</h2>
				<ul class="space-y-3.5">
					<?php foreach ( $iris_cats as $iris_cat ) : ?>
						<?php $iris_kids = get_terms( [ 'taxonomy' => 'product_cat', 'parent' => $iris_cat->term_id, 'hide_empty' => true ] ); ?>
						<li>
							<div class="flex items-center justify-between gap-2">
								<a href="<?php echo esc_url( get_term_link( $iris_cat ) ); ?>" class="hover:text-gold"><?php echo esc_html( $iris_cat->name ); ?></a>
								<?php if ( $iris_kids && ! is_wp_error( $iris_kids ) ) : ?>
									<button type="button" class="p-1" data-acc aria-expanded="false" aria-label="Mở danh mục con"><?php echo iris_icon( 'chevron-down', 'size-4 transition' ); ?></button>
								<?php endif; ?>
							</div>
							<?php if ( $iris_kids && ! is_wp_error( $iris_kids ) ) : ?>
								<ul class="mt-2 space-y-2 border-l border-neutral-200 pl-4 text-[15px]" hidden>
									<?php foreach ( $iris_kids as $iris_kid ) : ?>
										<li><a href="<?php echo esc_url( get_term_link( $iris_kid ) ); ?>" class="hover:text-gold"><?php echo esc_html( $iris_kid->name ); ?></a></li>
									<?php endforeach; ?>
								</ul>
							<?php endif; ?>
						</li>
					<?php endforeach; ?>
				</ul>
			</section>
		<?php endif; ?>
	<?php endif; ?>

	<?php $iris_recent = get_posts( [ 'numberposts' => 5, 'ignore_sticky_posts' => true ] ); ?>
	<?php if ( $iris_recent ) : ?>
		<section class="sidebar-card">
			<h2 class="sidebar-title">Bài viết mới</h2>
			<ul class="space-y-5">
				<?php foreach ( $iris_recent as $iris_p ) : ?>
					<li>
						<a href="<?php echo esc_url( get_permalink( $iris_p ) ); ?>" class="group flex gap-4">
							<span class="size-[50px] shrink-0 overflow-hidden rounded"><?php echo get_the_post_thumbnail( $iris_p, 'thumbnail', [ 'class' => 'size-full object-cover', 'loading' => 'lazy', 'alt' => '' ] ); ?></span>
							<span class="text-[15px] leading-snug group-hover:text-gold"><?php echo esc_html( get_the_title( $iris_p ) ); ?></span>
						</a>
					</li>
				<?php endforeach; ?>
			</ul>
		</section>
	<?php endif; ?>

	<?php if ( is_active_sidebar( 'blog' ) ) : ?>
		<div class="sidebar-card"><?php dynamic_sidebar( 'blog' ); ?></div>
	<?php endif; ?>
</aside>
