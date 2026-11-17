<?php
/**
 * Category page sidebar: categories, price filter, colour filter. Becomes a drawer on mobile.
 */
$iris_current = is_product_taxonomy() ? get_queried_object_id() : 0;
$iris_top     = get_terms( [ 'taxonomy' => 'product_cat', 'parent' => 0, 'hide_empty' => true, 'orderby' => 'name' ] );
$iris_min     = isset( $_GET['min_price'] ) ? (int) $_GET['min_price'] : null; // phpcs:ignore
$iris_max     = isset( $_GET['max_price'] ) ? (int) $_GET['max_price'] : null; // phpcs:ignore
?>
<aside id="shop-filters" class="shop-sidebar" data-filter-panel aria-label="Bộ lọc sản phẩm">
	<div class="flex items-center justify-between border-b border-neutral-200 p-5 lg:hidden">
		<span class="text-lg font-bold">Bộ lọc</span>
		<button type="button" data-filter-close aria-label="Đóng bộ lọc"><?php echo iris_icon( 'x', 'size-6' ); ?></button>
	</div>
	<div class="space-y-8 p-5 lg:p-0">
		<section class="sidebar-box">
			<h3 class="sidebar-title">Danh mục sản phẩm</h3>
			<ul class="space-y-3">
				<?php foreach ( is_wp_error( $iris_top ) ? [] : $iris_top as $iris_cat ) : ?>
					<?php
					$iris_kids   = get_terms( [ 'taxonomy' => 'product_cat', 'parent' => $iris_cat->term_id, 'hide_empty' => true ] );
					$iris_kids   = is_wp_error( $iris_kids ) ? [] : $iris_kids;
					$iris_open   = $iris_current && ( $iris_current === $iris_cat->term_id || term_is_ancestor_of( $iris_cat, $iris_current, 'product_cat' ) );
					?>
					<li>
						<div class="flex items-center gap-2">
							<a href="<?php echo esc_url( get_term_link( $iris_cat ) ); ?>" class="flex-1 hover:text-gold <?php echo $iris_current === $iris_cat->term_id ? 'font-bold text-ink' : ''; ?>"><?php echo esc_html( $iris_cat->name ); ?></a>
							<span class="text-xs text-neutral-500">(<?php echo (int) $iris_cat->count; ?>)</span>
							<?php if ( $iris_kids ) : ?>
								<button type="button" class="p-1" data-acc aria-expanded="<?php echo $iris_open ? 'true' : 'false'; ?>" aria-label="Mở danh mục con"><?php echo iris_icon( 'chevron-down', 'size-4 transition' ); ?></button>
							<?php endif; ?>
						</div>
						<?php if ( $iris_kids ) : ?>
							<ul class="mt-2 space-y-2 border-l border-neutral-200 pl-4 text-[15px]" <?php echo $iris_open ? '' : 'hidden'; ?>>
								<?php foreach ( $iris_kids as $iris_kid ) : ?>
									<li><a href="<?php echo esc_url( get_term_link( $iris_kid ) ); ?>" class="hover:text-gold <?php echo $iris_current === $iris_kid->term_id ? 'font-bold' : ''; ?>"><?php echo esc_html( $iris_kid->name ); ?></a> <span class="text-xs text-neutral-500">(<?php echo (int) $iris_kid->count; ?>)</span></li>
								<?php endforeach; ?>
							</ul>
						<?php endif; ?>
					</li>
				<?php endforeach; ?>
			</ul>
		</section>

		<section class="sidebar-box">
			<h3 class="sidebar-title">Lọc theo giá</h3>
			<ul class="space-y-2.5">
				<?php foreach ( iris_price_ranges() as [ $iris_lo, $iris_hi, $iris_label ] ) : ?>
					<?php
					$iris_active = $iris_min === $iris_lo && ( $iris_hi ? $iris_max === $iris_hi : null === $iris_max );
					$iris_url    = $iris_active ? remove_query_arg( [ 'min_price', 'max_price' ] ) : add_query_arg( array_filter( [ 'min_price' => $iris_lo, 'max_price' => $iris_hi ?: null ], fn( $v ) => null !== $v ), remove_query_arg( 'max_price' ) );
					?>
					<li><a href="<?php echo esc_url( remove_query_arg( 'paged', $iris_url ) ); ?>" class="filter-check <?php echo $iris_active ? 'is-active' : ''; ?>" rel="nofollow"><span class="filter-check__box"><?php echo iris_icon( 'circle-check', 'size-3.5' ); ?></span><?php echo esc_html( $iris_label ); ?></a></li>
				<?php endforeach; ?>
			</ul>
		</section>

		<?php
		iris_attribute_filter( 'pa_mau-sac', 'Lọc theo màu' );
		iris_attribute_filter( 'pa_chat-lieu', 'Lọc theo chất liệu' );
		?>
	</div>
</aside>
<div class="filter-backdrop" data-filter-close hidden></div>
