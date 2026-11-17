<?php
/**
 * Small helpers used across templates.
 */

defined( 'ABSPATH' ) || exit;

/**
 * Inline a Lucide (or brand) icon from assets/icons.
 * Usage: echo iris_icon( 'phone', 'size-5' );
 */
function iris_icon( string $name, string $class = 'size-5' ): string {
	static $cache = [];
	if ( ! isset( $cache[ $name ] ) ) {
		$file           = IRIS_DIR . "/assets/icons/{$name}.svg";
		$cache[ $name ] = file_exists( $file ) ? trim( file_get_contents( $file ) ) : '';
	}
	if ( ! $cache[ $name ] ) {
		return '';
	}
	return preg_replace( '/<svg\b/', '<svg class="' . esc_attr( $class ) . '" aria-hidden="true" focusable="false"', $cache[ $name ], 1 );
}

/** Theme option (Customizer) with the default declared in customizer.php. */
function iris_mod( string $key ) {
	$defaults = iris_customizer_defaults();
	return get_theme_mod( $key, $defaults[ $key ] ?? '' );
}

/** Comma separated attachment IDs (gallery control) → int[] */
function iris_ids( string $key ): array {
	return array_values( array_filter( array_map( 'absint', explode( ',', (string) iris_mod( $key ) ) ) ) );
}

/** Attachment image by ID with sane defaults (lazy, async decoding). */
function iris_img( $id, string $size = 'large', string $class = '', array $attr = [] ): string {
	if ( ! $id ) {
		return '';
	}
	return wp_get_attachment_image( (int) $id, $size, false, array_merge( [ 'class' => $class, 'decoding' => 'async' ], $attr ) );
}

/** Is the current request a WooCommerce page? (safe when WooCommerce is off) */
function iris_is_wc_page(): bool {
	return function_exists( 'is_woocommerce' ) && ( is_woocommerce() || is_cart() || is_checkout() || is_account_page() );
}

/** "0909 123 456" → "tel:0909123456" */
function iris_tel( string $phone ): string {
	return 'tel:' . preg_replace( '/[^0-9+]/', '', $phone );
}

/** Centered gold section heading used by most home sections. */
function iris_section_title( string $title, string $tag = 'h2', string $extra = '' ): void {
	if ( '' === trim( $title ) ) {
		return;
	}
	printf( '<%1$s class="section-title %3$s" data-reveal>%2$s</%1$s>', tag_escape( $tag ), esc_html( $title ), esc_attr( $extra ) );
}

/**
 * Breadcrumb trail as [ [label, url], … ]. Used for both the visible breadcrumb and the JSON-LD.
 */
function iris_breadcrumb_items(): array {
	$items = [ [ 'Trang chủ', home_url( '/' ) ] ];

	if ( function_exists( 'is_product' ) && is_product() ) {
		$terms = wc_get_product_terms( get_the_ID(), 'product_cat', [ 'orderby' => 'parent', 'order' => 'DESC' ] );
		if ( $terms ) {
			$main = $terms[0];
			foreach ( array_reverse( get_ancestors( $main->term_id, 'product_cat' ) ) as $anc ) {
				$t       = get_term( $anc, 'product_cat' );
				$items[] = [ $t->name, get_term_link( $t ) ];
			}
			$items[] = [ $main->name, get_term_link( $main ) ];
		}
		$items[] = [ get_the_title(), '' ];
	} elseif ( function_exists( 'is_product_taxonomy' ) && is_product_taxonomy() ) {
		$term = get_queried_object();
		foreach ( array_reverse( get_ancestors( $term->term_id, $term->taxonomy ) ) as $anc ) {
			$t       = get_term( $anc, $term->taxonomy );
			$items[] = [ $t->name, get_term_link( $t ) ];
		}
		$items[] = [ $term->name, '' ];
	} elseif ( function_exists( 'is_shop' ) && is_shop() ) {
		$items[] = [ 'Sản phẩm', '' ];
	} elseif ( is_singular( 'post' ) ) {
		$cat = get_the_category();
		if ( $cat ) {
			$items[] = [ $cat[0]->name, get_category_link( $cat[0] ) ];
		}
		$items[] = [ get_the_title(), '' ];
	} elseif ( is_page() ) {
		foreach ( array_reverse( get_post_ancestors( get_the_ID() ) ) as $anc ) {
			$items[] = [ get_the_title( $anc ), get_permalink( $anc ) ];
		}
		$items[] = [ get_the_title(), '' ];
	} elseif ( is_category() || is_tag() || is_tax() ) {
		$items[] = [ single_term_title( '', false ), '' ];
	} elseif ( is_home() ) {
		$items[] = [ 'Blog kiến thức', '' ];
	} elseif ( is_search() ) {
		$items[] = [ 'Tìm kiếm: ' . get_search_query(), '' ];
	} elseif ( is_404() ) {
		$items[] = [ 'Không tìm thấy trang', '' ];
	} elseif ( is_archive() ) {
		$items[] = [ wp_strip_all_tags( get_the_archive_title() ), '' ];
	}
	return $items;
}

function iris_breadcrumbs( string $class = '' ): void {
	$items = iris_breadcrumb_items();
	$last  = count( $items ) - 1;
	echo '<nav aria-label="Breadcrumb" class="breadcrumbs ' . esc_attr( $class ) . '"><ol class="flex flex-wrap items-center gap-x-3 gap-y-1">';
	foreach ( $items as $i => [ $label, $url ] ) {
		echo '<li class="flex items-center gap-3">';
		if ( $i > 0 ) {
			echo iris_icon( 'chevron-right', 'size-3.5 text-neutral-500' );
		}
		if ( $url && $i !== $last ) {
			printf( '<a href="%s" class="hover:text-gold">%s</a>', esc_url( $url ), esc_html( $label ) );
		} else {
			printf( '<span class="font-bold text-ink" aria-current="page">%s</span>', esc_html( $label ) );
		}
		echo '</li>';
	}
	echo '</ol></nav>';
}

/**
 * Adds ids to h2/h3 in post content and builds a table of contents from them.
 * Returns [ $content_with_ids, $toc_items ].
 */
function iris_toc( string $content ): array {
	$toc   = [];
	$used  = [];
	$content = preg_replace_callback( '#<(h[23])([^>]*)>(.*?)</\1>#is', function ( $m ) use ( &$toc, &$used ) {
		$text = trim( wp_strip_all_tags( $m[3] ) );
		if ( '' === $text ) {
			return $m[0];
		}
		$id = sanitize_title( $text ) ?: 'muc';
		$base = $id;
		$n = 2;
		while ( isset( $used[ $id ] ) ) {
			$id = $base . '-' . $n++;
		}
		$used[ $id ] = true;
		$toc[]       = [ 'level' => (int) substr( $m[1], 1 ), 'id' => $id, 'text' => $text ];
		$attrs       = preg_replace( '/\sid="[^"]*"/', '', $m[2] );
		return "<{$m[1]}{$attrs} id=\"{$id}\">{$m[3]}</{$m[1]}>";
	}, $content );
	return [ $content, $toc ];
}

/** Social links from the Customizer (only the filled ones). */
function iris_socials(): array {
	$out = [];
	foreach ( [ 'facebook' => 'Facebook', 'instagram' => 'Instagram', 'youtube' => 'YouTube', 'tiktok' => 'TikTok' ] as $key => $label ) {
		$url = iris_mod( "social_{$key}" );
		if ( $url ) {
			$out[ $key ] = [ $label, $url ];
		}
	}
	return $out;
}

/** Google map iframe src from an address (no API key needed). */
function iris_map_src(): string {
	$custom = trim( (string) iris_mod( 'map_embed' ) );
	if ( $custom ) {
		if ( preg_match( '/src="([^"]+)"/', $custom, $m ) ) {
			return $m[1];
		}
		return $custom;
	}
	return 'https://www.google.com/maps?q=' . rawurlencode( (string) iris_mod( 'address' ) ) . '&output=embed';
}

/** Product categories for <select> controls: [ id => name ]. */
function iris_product_cat_choices( bool $with_all = true ): array {
	$choices = $with_all ? [ 0 => '— Tất cả sản phẩm (mới nhất) —' ] : [ 0 => '— Chọn danh mục —' ];
	if ( ! taxonomy_exists( 'product_cat' ) ) {
		return $choices;
	}
	$terms = get_terms( [ 'taxonomy' => 'product_cat', 'hide_empty' => false ] );
	if ( is_wp_error( $terms ) ) {
		return $choices;
	}
	foreach ( $terms as $t ) {
		$choices[ $t->term_id ] = ( $t->parent ? '— ' : '' ) . $t->name;
	}
	return $choices;
}
