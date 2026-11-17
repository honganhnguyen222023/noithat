<?php
/**
 * WooCommerce integration.
 */

defined( 'ABSPATH' ) || exit;

if ( ! class_exists( 'WooCommerce' ) ) {
	// Theme still works without WooCommerce; shop sections are simply skipped.
	return;
}

/* ---------------------------------------------------------------------------
 * Assets: the theme styles shop pages itself. Keep WooCommerce CSS only where
 * its own forms are used (cart, checkout, my account).
 * ------------------------------------------------------------------------- */
add_filter( 'woocommerce_enqueue_styles', function ( $styles ) {
	if ( is_cart() || is_checkout() || is_account_page() ) {
		unset( $styles['woocommerce-layout'] );
		return $styles;
	}
	return [];
} );

add_action( 'wp_enqueue_scripts', function () {
	if ( ! iris_is_wc_page() ) {
		wp_dequeue_style( 'wc-blocks-style' );
		wp_dequeue_style( 'woocommerce-inline' );
		// No add-to-cart buttons outside shop pages → these scripts (and jQuery) are not needed.
		foreach ( [ 'wc-cart-fragments', 'wc-add-to-cart', 'woocommerce', 'jquery-blockui', 'js-cookie' ] as $handle ) {
			wp_dequeue_script( $handle );
		}
	}
	if ( is_product() ) {
		wp_dequeue_script( 'flexslider' );
		wp_dequeue_script( 'photoswipe-ui-default' );
		wp_dequeue_style( 'photoswipe-default-skin' );
		wp_dequeue_script( 'wc-single-product' ); // replaced by the theme's lightweight gallery + tabs
		wp_enqueue_script( 'wc-add-to-cart-variation' );
	}
}, 99 );

add_action( 'after_setup_theme', function () {
	remove_theme_support( 'wc-product-gallery-zoom' );
	remove_theme_support( 'wc-product-gallery-lightbox' );
	remove_theme_support( 'wc-product-gallery-slider' );
}, 20 );

/* Products per page / columns */
add_filter( 'loop_shop_per_page', fn() => 12 );
add_filter( 'loop_shop_columns', fn() => 3 );
add_filter( 'woocommerce_output_related_products_args', fn( $a ) => array_merge( $a, [ 'posts_per_page' => 4, 'columns' => 4 ] ) );

/* Tabs naming like the reference site */
add_filter( 'woocommerce_product_tabs', function ( $tabs ) {
	if ( isset( $tabs['description'] ) ) {
		$tabs['description']['title'] = 'Câu chuyện sản phẩm';
	}
	if ( isset( $tabs['additional_information'] ) ) {
		$tabs['additional_information']['title'] = 'Thông số kỹ thuật';
	}
	return $tabs;
}, 20 );
add_filter( 'woocommerce_product_description_heading', '__return_empty_string' );
add_filter( 'woocommerce_product_additional_information_heading', '__return_empty_string' );

/* Header cart count stays fresh after AJAX add-to-cart */
add_filter( 'woocommerce_add_to_cart_fragments', function ( $fragments ) {
	$fragments['span.cart-count'] = iris_cart_count_html();
	return $fragments;
} );
function iris_cart_count_html(): string {
	$n = WC()->cart ? WC()->cart->get_cart_contents_count() : 0;
	return '<span class="cart-count' . ( $n ? '' : ' hidden' ) . '">' . (int) $n . '</span>';
}

/* "Mua ngay" button next to "Thêm vào giỏ hàng" (works without JavaScript) */
add_action( 'woocommerce_after_add_to_cart_button', function () {
	global $product;
	if ( ! $product ) {
		return;
	}
	if ( $product->is_type( 'simple' ) ) {
		printf( '<input type="hidden" name="add-to-cart" value="%d">', (int) $product->get_id() );
	}
	printf( '<button type="submit" name="iris_buy_now" value="1" class="btn-buy-now single_add_to_cart_button">%s Mua ngay</button>', iris_icon( 'credit-card', 'size-5' ) );
} );

/* "Mua ngay" → add to cart then go straight to checkout */
add_filter( 'woocommerce_add_to_cart_redirect', function ( $url ) {
	return ! empty( $_REQUEST['iris_buy_now'] ) ? wc_get_checkout_url() : $url; // phpcs:ignore
} );

/* ---------------------------------------------------------------------------
 * Product card
 * ------------------------------------------------------------------------- */
function iris_sale_percent( WC_Product $product ): int {
	if ( ! $product->is_on_sale() ) {
		return 0;
	}
	if ( $product->is_type( 'variable' ) ) {
		$max = 0;
		foreach ( $product->get_variation_prices()['regular_price'] as $vid => $regular ) {
			$sale = $product->get_variation_prices()['sale_price'][ $vid ];
			if ( $regular > 0 && $sale < $regular ) {
				$max = max( $max, round( 100 - $sale / $regular * 100 ) );
			}
		}
		return (int) $max;
	}
	$regular = (float) $product->get_regular_price();
	$sale    = (float) $product->get_sale_price();
	return $regular > 0 ? (int) round( 100 - $sale / $regular * 100 ) : 0;
}

/** Variation images shown as small swatches under the card image. */
function iris_card_swatches( WC_Product $product ): array {
	if ( ! $product->is_type( 'variable' ) ) {
		return [];
	}
	$out = [];
	foreach ( $product->get_children() as $vid ) {
		$v = wc_get_product( $vid );
		if ( ! $v || ! $v->get_image_id() ) {
			continue;
		}
		$label = implode( ', ', array_map( 'wc_clean', $v->get_variation_attributes( false ) ) );
		$out[] = [ 'id' => $v->get_image_id(), 'label' => $label ];
	}
	return $out;
}

/**
 * Prints one product card. $button = show the "Thêm vào giỏ hàng" button (category pages).
 */
function iris_product_card( WC_Product $product, bool $button = false ): void {
	$gallery  = $product->get_gallery_image_ids();
	$alt_id   = $gallery[0] ?? 0;
	$percent  = iris_sale_percent( $product );
	$swatches = iris_card_swatches( $product );
	$link     = $product->get_permalink();
	?>
	<article class="product-card group" data-reveal>
		<a href="<?php echo esc_url( $link ); ?>" class="product-card__media" aria-label="<?php echo esc_attr( $product->get_name() ); ?>">
			<?php echo iris_img( $product->get_image_id(), 'woocommerce_thumbnail', 'product-card__img', [ 'alt' => $product->get_name(), 'loading' => 'lazy' ] ); ?>
			<?php if ( $alt_id ) : ?>
				<?php echo iris_img( $alt_id, 'woocommerce_thumbnail', 'product-card__img product-card__img--alt', [ 'alt' => '', 'loading' => 'lazy' ] ); ?>
			<?php endif; ?>
			<?php if ( $percent ) : ?>
				<span class="badge-sale">-<?php echo (int) $percent; ?>%</span>
			<?php endif; ?>
		</a>
		<div class="product-card__body">
			<div class="product-card__swatches">
				<?php foreach ( array_slice( $swatches, 0, 5 ) as $s ) : ?>
					<span class="swatch" title="<?php echo esc_attr( $s['label'] ); ?>"><?php echo iris_img( $s['id'], 'thumbnail', '', [ 'alt' => $s['label'], 'loading' => 'lazy' ] ); ?></span>
				<?php endforeach; ?>
			</div>
			<h3 class="product-card__title"><a href="<?php echo esc_url( $link ); ?>"><?php echo esc_html( $product->get_name() ); ?></a></h3>
			<div class="product-card__price"><?php echo wp_kses_post( $product->get_price_html() ); ?></div>
			<?php if ( $button ) : ?>
				<div class="flex-1 min-h-3"></div>
				<?php
				$ajax = $product->is_type( 'simple' ) && $product->is_purchasable() && $product->is_in_stock();
				printf(
					'<a href="%s" data-quantity="1" data-product_id="%d" data-product_sku="%s" class="btn-outline mt-auto w-full px-2 text-[13px] whitespace-nowrap sm:px-5 sm:text-[17px] %s" rel="nofollow" aria-label="%s">%s %s</a>',
					esc_url( $ajax ? $product->add_to_cart_url() : $link ),
					(int) $product->get_id(),
					esc_attr( $product->get_sku() ),
					$ajax ? 'add_to_cart_button ajax_add_to_cart' : '',
					esc_attr( $ajax ? 'Thêm “' . $product->get_name() . '” vào giỏ' : 'Chọn tùy chọn cho ' . $product->get_name() ),
					iris_icon( 'shopping-cart', 'size-4' ),
					$ajax ? 'Thêm vào giỏ hàng' : 'Chọn mẫu'
				);
				?>
			<?php endif; ?>
		</div>
	</article>
	<?php
}

/** Query helper for home sections. */
function iris_products( int $cat = 0, int $limit = 8, int $page = 1 ): array {
	$args = [ 'status' => 'publish', 'limit' => $limit, 'page' => $page, 'orderby' => 'date', 'order' => 'DESC', 'visibility' => 'catalog' ];
	if ( $cat ) {
		$term = get_term( $cat, 'product_cat' );
		if ( $term && ! is_wp_error( $term ) ) {
			$args['category'] = [ $term->slug ];
		}
	}
	return wc_get_products( $args );
}

/** "Tải thêm" button on the home page (no page reload). */
function iris_ajax_more_products() {
	$cat   = absint( $_GET['cat'] ?? 0 );
	$page  = max( 2, absint( $_GET['page'] ?? 2 ) );
	$limit = min( 24, max( 1, absint( $_GET['limit'] ?? 4 ) ) );
	$items = iris_products( $cat, $limit, $page );
	ob_start();
	foreach ( $items as $p ) {
		iris_product_card( $p );
	}
	$more = count( iris_products( $cat, $limit, $page + 1 ) ) > 0;
	wp_send_json( [ 'html' => ob_get_clean(), 'more' => $more ] );
}
add_action( 'wp_ajax_iris_more', 'iris_ajax_more_products' );
add_action( 'wp_ajax_nopriv_iris_more', 'iris_ajax_more_products' );

/* ---------------------------------------------------------------------------
 * Product category: banner fields (Sản phẩm → Danh mục → Sửa)
 * ------------------------------------------------------------------------- */
function iris_term_fields( $term = null ): void {
	$get   = fn( $k ) => $term ? get_term_meta( $term->term_id, $k, true ) : '';
	$img   = (int) $get( 'banner_image' );
	$is_edit = (bool) $term;
	$row_open  = $is_edit ? '<tr class="form-field"><th scope="row"><label>%s</label></th><td>' : '<div class="form-field"><label>%s</label>';
	$row_close = $is_edit ? '</td></tr>' : '</div>';

	wp_nonce_field( 'iris_term', 'iris_term_nonce' );

	printf( $row_open, 'Banner – tiêu đề' ); // phpcs:ignore
	printf( '<input type="text" name="iris_banner_title" value="%s"><p class="description">Hiện ở đầu trang danh mục. Để trống = không hiện banner.</p>', esc_attr( $get( 'banner_title' ) ) );
	echo $row_close; // phpcs:ignore

	printf( $row_open, 'Banner – mô tả' ); // phpcs:ignore
	printf( '<textarea name="iris_banner_text" rows="4">%s</textarea>', esc_textarea( $get( 'banner_text' ) ) );
	echo $row_close; // phpcs:ignore

	printf( $row_open, 'Banner – ảnh' ); // phpcs:ignore
	printf(
		'<div class="iris-term-image"><input type="hidden" name="iris_banner_image" value="%d"><div class="iris-term-image__preview">%s</div><p><button class="button iris-term-image__pick">Chọn ảnh</button> <button class="button-link iris-term-image__remove" style="color:#b32d2e">Bỏ ảnh</button></p></div>',
		$img,
		$img ? wp_get_attachment_image( $img, 'medium', false, [ 'style' => 'max-width:240px;height:auto;border-radius:6px' ] ) : ''
	);
	echo $row_close; // phpcs:ignore
}
add_action( 'product_cat_add_form_fields', fn() => iris_term_fields() );
add_action( 'product_cat_edit_form_fields', fn( $term ) => iris_term_fields( $term ) );

function iris_save_term_fields( $term_id ) {
	if ( ! isset( $_POST['iris_term_nonce'] ) || ! wp_verify_nonce( sanitize_key( $_POST['iris_term_nonce'] ), 'iris_term' ) ) {
		return;
	}
	update_term_meta( $term_id, 'banner_title', sanitize_text_field( wp_unslash( $_POST['iris_banner_title'] ?? '' ) ) );
	update_term_meta( $term_id, 'banner_text', sanitize_textarea_field( wp_unslash( $_POST['iris_banner_text'] ?? '' ) ) );
	update_term_meta( $term_id, 'banner_image', absint( $_POST['iris_banner_image'] ?? 0 ) );
}
add_action( 'created_product_cat', 'iris_save_term_fields' );
add_action( 'edited_product_cat', 'iris_save_term_fields' );

add_action( 'admin_enqueue_scripts', function ( $hook ) {
	if ( in_array( $hook, [ 'edit-tags.php', 'term.php' ], true ) && 'product_cat' === ( $_GET['taxonomy'] ?? '' ) ) { // phpcs:ignore
		wp_enqueue_media();
		wp_enqueue_script( 'iris-admin', IRIS_URI . '/assets/js/admin.js', [ 'jquery' ], IRIS_VERSION, true );
	}
} );

/** Category thumbnail URL helper. */
function iris_term_image_id( $term ): int {
	return (int) get_term_meta( is_object( $term ) ? $term->term_id : $term, 'thumbnail_id', true );
}

/* ---------------------------------------------------------------------------
 * Sidebar filters on category pages
 * ------------------------------------------------------------------------- */
function iris_price_ranges(): array {
	return [
		[ 0, 1000000, 'Dưới 1.000.000đ' ],
		[ 1000000, 3000000, '1.000.000đ - 3.000.000đ' ],
		[ 3000000, 5000000, '3.000.000đ - 5.000.000đ' ],
		[ 5000000, 10000000, '5.000.000đ - 10.000.000đ' ],
		[ 10000000, 0, 'Trên 10.000.000đ' ],
	];
}

/** Attribute filter (uses WooCommerce's built-in ?filter_xxx= parameter). */
function iris_attribute_filter( string $taxonomy, string $title ): void {
	if ( ! taxonomy_exists( $taxonomy ) ) {
		return;
	}
	$terms = get_terms( [ 'taxonomy' => $taxonomy, 'hide_empty' => true ] );
	if ( ! $terms || is_wp_error( $terms ) ) {
		return;
	}
	$param   = 'filter_' . wc_attribute_taxonomy_slug( $taxonomy );
	$current = array_filter( explode( ',', wc_clean( wp_unslash( $_GET[ $param ] ?? '' ) ) ) ); // phpcs:ignore
	echo '<section class="sidebar-box"><h3 class="sidebar-title">' . esc_html( $title ) . '</h3><ul class="space-y-2.5">';
	foreach ( $terms as $t ) {
		$active = in_array( $t->slug, $current, true );
		$next   = $active ? array_diff( $current, [ $t->slug ] ) : array_merge( $current, [ $t->slug ] );
		$url    = $next ? add_query_arg( $param, implode( ',', $next ) ) : remove_query_arg( $param );
		$url    = remove_query_arg( 'paged', $url );
		printf(
			'<li><a href="%s" class="filter-check %s" rel="nofollow"><span class="filter-check__box">%s</span><span class="flex-1">%s</span><span class="text-xs text-neutral-500">(%d)</span></a></li>',
			esc_url( $url ),
			$active ? 'is-active' : '',
			iris_icon( 'circle-check', 'size-3.5' ),
			esc_html( $t->name ),
			(int) $t->count
		);
	}
	echo '</ul></section>';
}
