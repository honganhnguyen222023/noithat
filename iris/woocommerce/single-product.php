<?php
/**
 * Product detail page.
 * The promo box / policies / support button texts come from Giao diện → Tùy biến → Trang chi tiết sản phẩm.
 */
defined( 'ABSPATH' ) || exit;
get_header();

while ( have_posts() ) :
	the_post();
	global $product;
	$product = wc_get_product( get_the_ID() ); // phpcs:ignore WordPress.WP.GlobalVariablesOverride

	$iris_images  = array_values( array_filter( array_merge( [ $product->get_image_id() ], $product->get_gallery_image_ids() ) ) );
	$iris_percent = iris_sale_percent( $product );
	$iris_zalo    = iris_mod( 'zalo' );
	$iris_zalo    = str_starts_with( $iris_zalo, 'http' ) ? $iris_zalo : 'https://zalo.me/' . preg_replace( '/\D/', '', $iris_zalo );
	?>
	<div class="product-top">
		<div class="container-x pt-5 pb-10 lg:pt-6 lg:pb-[70px]">
			<?php iris_breadcrumbs( 'mb-5 text-[17px]' ); ?>
			<?php wc_print_notices(); ?>

			<div id="product-<?php the_ID(); ?>" <?php wc_product_class( 'grid gap-8 lg:grid-cols-[630px_1fr] lg:gap-[30px]', $product ); ?>>
				<?php /* Gallery */ ?>
				<div class="product-gallery" data-gallery>
					<div class="product-gallery__thumbs no-scrollbar">
						<?php foreach ( $iris_images as $iris_i => $iris_id ) : ?>
							<button type="button" class="product-gallery__thumb <?php echo 0 === $iris_i ? 'is-active' : ''; ?>" data-thumb="<?php echo esc_attr( wp_get_attachment_image_url( $iris_id, 'woocommerce_single' ) ); ?>" data-full="<?php echo esc_attr( wp_get_attachment_image_url( $iris_id, 'full' ) ); ?>" aria-label="Ảnh <?php echo (int) $iris_i + 1; ?>">
								<?php echo iris_img( $iris_id, 'woocommerce_gallery_thumbnail', 'size-full object-contain', [ 'loading' => 'lazy', 'alt' => '' ] ); ?>
							</button>
						<?php endforeach; ?>
					</div>
					<div class="product-gallery__main">
						<?php echo $iris_images ? iris_img( $iris_images[0], 'woocommerce_single', 'size-full object-contain', [ 'loading' => 'eager', 'fetchpriority' => 'high', 'alt' => $product->get_name(), 'data-main' => '1', 'sizes' => '(min-width:1024px) 520px, 100vw' ] ) : wc_placeholder_img( 'woocommerce_single' ); // phpcs:ignore ?>
						<?php if ( $iris_percent ) : ?>
							<span class="product-gallery__badge">-<?php echo (int) $iris_percent; ?>%</span>
						<?php endif; ?>
						<button type="button" class="product-gallery__zoom" data-zoom aria-label="Phóng to ảnh"><?php echo iris_icon( 'maximize-2', 'size-4' ); ?></button>
					</div>
				</div>

				<?php /* Summary */ ?>
				<div class="product-summary min-w-0">
					<h1 class="text-[28px] leading-tight font-bold text-gold lg:text-[34px]"><?php the_title(); ?></h1>
					<div class="product-summary__price mt-3"><?php echo wp_kses_post( $product->get_price_html() ); ?></div>

					<?php if ( $product->get_short_description() ) : ?>
						<div class="mt-4 rounded-[10px] border border-neutral-200 bg-white p-5 text-[17px]">
							<p class="mb-1 font-bold text-neutral-500">Mô tả ngắn:</p>
							<div class="entry-content entry-content--tight"><?php echo wp_kses_post( wpautop( $product->get_short_description() ) ); ?></div>
						</div>
					<?php endif; ?>

					<div class="product-cart mt-5"><?php woocommerce_template_single_add_to_cart(); ?></div>

					<a href="<?php echo esc_url( $iris_zalo ); ?>" target="_blank" rel="noopener" class="btn-gold mt-4 flex w-full justify-center py-2.5 text-[17px]"><?php echo esc_html( iris_mod( 'support_button' ) ); ?></a>

					<?php $iris_promos = array_filter( array_map( 'trim', preg_split( '/\R/u', (string) iris_mod( 'promo_items' ) ) ) ); ?>
					<?php if ( $iris_promos ) : ?>
						<div class="relative mt-12 rounded-[4px] border-2 border-dashed border-ink px-6 pt-8 pb-5">
							<p class="absolute -top-4 left-7 flex items-center gap-2 bg-[#f7f7f7] px-2 text-lg font-bold uppercase text-ink"><span class="flex size-9 items-center justify-center rounded-md bg-white text-gold shadow"><?php echo iris_icon( 'gift', 'size-5' ); ?></span><?php echo esc_html( iris_mod( 'promo_title' ) ); ?></p>
							<ul class="list-disc space-y-2 pl-6 text-[17px]">
								<?php foreach ( $iris_promos as $iris_p ) : ?>
									<li><?php echo esc_html( $iris_p ); ?></li>
								<?php endforeach; ?>
							</ul>
						</div>
					<?php endif; ?>

					<div class="mt-5 rounded-[4px] border-2 border-ink px-7 py-4 text-[17px]">
						<p>Đặt mua: <a href="<?php echo esc_url( iris_tel( iris_mod( 'hotline' ) ) ); ?>" class="font-bold text-gold"><?php echo esc_html( iris_mod( 'hotline' ) ); ?></a> - <?php echo esc_html( iris_mod( 'hours' ) ); ?></p>
						<p>Showroom: <?php echo esc_html( iris_mod( 'showroom' ) ); ?></p>
					</div>

					<?php $iris_policies = array_filter( array_map( 'trim', preg_split( '/\R/u', (string) iris_mod( 'policy_items' ) ) ) ); ?>
					<?php if ( $iris_policies ) : ?>
						<div class="mt-6 border-t border-neutral-200 pt-6">
							<p class="text-2xl font-bold text-neutral-500"><?php echo esc_html( iris_mod( 'policy_title' ) ); ?></p>
							<ul class="mt-4 flex flex-wrap gap-x-9 gap-y-3 text-sm text-neutral-700">
								<?php foreach ( $iris_policies as $iris_i => $iris_p ) : ?>
									<li class="flex items-center gap-2"><span class="flex size-6 items-center justify-center rounded-full border border-orange text-orange"><?php echo iris_icon( [ 'repeat-2', 'shield-check', 'truck' ][ $iris_i % 3 ], 'size-3.5' ); ?></span><?php echo esc_html( $iris_p ); ?></li>
								<?php endforeach; ?>
							</ul>
						</div>
					<?php endif; ?>
				</div>
			</div>
		</div>
	</div>

	<div class="container-x pt-[30px]">
		<?php
		$iris_tabs = apply_filters( 'woocommerce_product_tabs', [] );
		if ( $iris_tabs ) :
			?>
			<div class="product-tabs" data-tabs>
				<div class="product-tabs__nav no-scrollbar" role="tablist">
					<?php foreach ( array_keys( $iris_tabs ) as $iris_i => $iris_key ) : ?>
						<button type="button" role="tab" id="tab-<?php echo esc_attr( $iris_key ); ?>" aria-controls="panel-<?php echo esc_attr( $iris_key ); ?>" aria-selected="<?php echo 0 === $iris_i ? 'true' : 'false'; ?>" data-tab><?php echo wp_kses_post( apply_filters( 'woocommerce_product_' . $iris_key . '_tab_title', $iris_tabs[ $iris_key ]['title'], $iris_key ) ); ?></button>
					<?php endforeach; ?>
				</div>
				<?php foreach ( $iris_tabs as $iris_key => $iris_tab ) : ?>
					<div class="product-tabs__panel entry-content" role="tabpanel" id="panel-<?php echo esc_attr( $iris_key ); ?>" aria-labelledby="tab-<?php echo esc_attr( $iris_key ); ?>" <?php echo array_key_first( $iris_tabs ) === $iris_key ? '' : 'hidden'; ?>>
						<?php
						if ( isset( $iris_tab['callback'] ) ) {
							call_user_func( $iris_tab['callback'], $iris_key, $iris_tab );
						}
						?>
					</div>
				<?php endforeach; ?>
			</div>
		<?php endif; ?>
	</div>

	<div class="pt-10">
		<?php get_template_part( 'template-parts/home/testimonials', null, [ 'title' => 'Khách hàng đánh giá', 'subtitle' => get_bloginfo( 'name' ) ] ); ?>
	</div>

	<?php
	$iris_related = array_filter( array_map( 'wc_get_product', wc_get_related_products( $product->get_id(), 4 ) ) );
	if ( $iris_related ) :
		?>
		<section class="container-x pb-14">
			<?php iris_section_title( iris_mod( 'related_title' ), 'h2', 'mb-8 uppercase' ); ?>
			<div class="product-grid">
				<?php foreach ( $iris_related as $iris_rel ) : ?>
					<?php iris_product_card( $iris_rel, true ); ?>
				<?php endforeach; ?>
			</div>
		</section>
	<?php endif; ?>
	<?php
endwhile;

get_footer();
