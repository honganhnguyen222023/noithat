<?php
if ( ! iris_mod( 'cats_show' ) || ! taxonomy_exists( 'product_cat' ) ) {
	return;
}
$iris_cats = get_terms( [
	'taxonomy'   => 'product_cat',
	'parent'     => 0,
	'hide_empty' => false,
	'exclude'    => array_filter( [ (int) iris_mod( 'cats_exclude' ) ] ),
	'meta_query' => [ [ 'key' => 'thumbnail_id', 'value' => 0, 'compare' => '>' ] ],
	'orderby'    => 'meta_value_num',
	'meta_key'   => 'order', // WooCommerce drag & drop order
] );
// Rooms are shown in their own section below.
$iris_rooms = array_filter( [ iris_mod( 'room_1' ), iris_mod( 'room_2' ), iris_mod( 'room_3' ), iris_mod( 'ab_service_3' ) ] );
$iris_cats  = is_wp_error( $iris_cats ) ? [] : array_filter( $iris_cats, fn( $t ) => ! in_array( $t->term_id, array_map( 'intval', $iris_rooms ), true ) );
if ( ! $iris_cats ) {
	return;
}
?>
<section class="container-x pb-12 lg:pb-14">
	<div class="carousel relative" data-carousel>
		<?php iris_section_title( iris_mod( 'cats_title' ), 'h2', 'mb-4 px-12' ); ?>
		<button type="button" class="carousel__arrow carousel__arrow--plain left-0 top-1 lg:left-5" data-prev aria-label="Danh mục trước"><?php echo iris_icon( 'arrow-left', 'size-8 stroke-[1.5]' ); ?></button>
		<button type="button" class="carousel__arrow carousel__arrow--plain right-0 top-1 lg:right-5" data-next aria-label="Danh mục sau"><?php echo iris_icon( 'arrow-right', 'size-8 stroke-[1.5]' ); ?></button>
		<div class="carousel__track gap-4 lg:gap-6" data-track>
			<?php foreach ( $iris_cats as $iris_cat ) : ?>
				<a href="<?php echo esc_url( get_term_link( $iris_cat ) ); ?>" class="cat-circle w-[calc(50%-8px)] sm:w-[calc(33.333%-11px)] lg:w-[calc(25%-18px)]">
					<span class="cat-circle__img"><?php echo iris_img( iris_term_image_id( $iris_cat ), 'medium_large', '', [ 'alt' => '', 'loading' => 'lazy' ] ); ?></span>
					<span class="cat-circle__label"><?php echo esc_html( $iris_cat->name ); ?></span>
				</a>
			<?php endforeach; ?>
		</div>
	</div>
</section>
