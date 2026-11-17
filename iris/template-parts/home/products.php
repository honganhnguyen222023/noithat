<?php
if ( ! function_exists( 'wc_get_products' ) ) {
	return;
}
foreach ( [ 1, 2, 3 ] as $iris_n ) :
	$iris_title = iris_mod( "ps{$iris_n}_title" );
	if ( ! $iris_title ) {
		continue;
	}
	$iris_cat   = (int) iris_mod( "ps{$iris_n}_cat" );
	$iris_count = max( 1, (int) iris_mod( "ps{$iris_n}_count" ) );
	$iris_items = iris_products( $iris_cat, $iris_count );
	if ( ! $iris_items ) {
		continue;
	}
	$iris_more = 3 === $iris_n && iris_mod( 'ps3_more' ) && count( iris_products( $iris_cat, $iris_count, 2 ) ) > 0;
	?>
	<section class="container-x pb-14 lg:pb-[70px]">
		<?php iris_section_title( $iris_title, 'h2', 'mb-[18px]' ); ?>
		<div class="product-grid" data-more-grid>
			<?php foreach ( $iris_items as $iris_product ) : ?>
				<?php iris_product_card( $iris_product ); ?>
			<?php endforeach; ?>
		</div>
		<?php if ( $iris_more ) : ?>
			<div class="mt-5 text-center">
				<button type="button" class="btn-gold-gradient" data-load-more data-cat="<?php echo (int) $iris_cat; ?>" data-limit="<?php echo (int) $iris_count; ?>" data-page="2" data-url="<?php echo esc_url( admin_url( 'admin-ajax.php' ) ); ?>">Tải thêm</button>
			</div>
		<?php endif; ?>
	</section>
<?php endforeach; ?>
