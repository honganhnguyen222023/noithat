<?php
/**
 * Basic SEO output. Automatically turns itself off when Yoast SEO, Rank Math or SEOPress is active
 * (those plugins then handle meta tags), except the breadcrumb schema which they also replace.
 */

defined( 'ABSPATH' ) || exit;

function iris_seo_plugin_active(): bool {
	return defined( 'WPSEO_VERSION' ) || defined( 'RANK_MATH_VERSION' ) || defined( 'SEOPRESS_VERSION' );
}

function iris_meta_description(): string {
	$desc = '';
	if ( is_singular() ) {
		$post = get_queried_object();
		$desc = has_excerpt( $post ) ? get_the_excerpt( $post ) : wp_trim_words( wp_strip_all_tags( strip_shortcodes( $post->post_content ) ), 30, '…' );
		if ( function_exists( 'is_product' ) && is_product() ) {
			$p    = wc_get_product( $post->ID );
			$desc = $p ? wp_trim_words( wp_strip_all_tags( $p->get_short_description() ?: $p->get_description() ), 30, '…' ) : $desc;
		}
	} elseif ( is_category() || is_tag() || is_tax() ) {
		$desc = wp_trim_words( wp_strip_all_tags( term_description() ), 30, '…' );
	}
	if ( ! $desc ) {
		$desc = get_bloginfo( 'description' );
	}
	return trim( preg_replace( '/\s+/', ' ', $desc ) );
}

add_action( 'wp_head', function () {
	if ( iris_seo_plugin_active() ) {
		return;
	}
	$desc  = iris_meta_description();
	$title = wp_get_document_title();
	$url   = is_singular() ? get_permalink() : home_url( add_query_arg( [] ) );
	$image = '';
	if ( is_singular() && has_post_thumbnail() ) {
		$image = get_the_post_thumbnail_url( null, 'large' );
	} elseif ( is_front_page() && iris_mod( 'hero_image' ) ) {
		$image = wp_get_attachment_image_url( iris_mod( 'hero_image' ), 'large' );
	}

	if ( $desc ) {
		printf( '<meta name="description" content="%s">' . "\n", esc_attr( $desc ) );
	}
	if ( is_search() || is_404() ) {
		echo '<meta name="robots" content="noindex,follow">' . "\n";
	}
	printf( '<link rel="canonical" href="%s">' . "\n", esc_url( $url ) );
	printf( '<meta property="og:locale" content="vi_VN">' . "\n" );
	printf( '<meta property="og:type" content="%s">' . "\n", is_singular( 'post' ) ? 'article' : ( function_exists( 'is_product' ) && is_product() ? 'product' : 'website' ) );
	printf( '<meta property="og:title" content="%s">' . "\n", esc_attr( $title ) );
	printf( '<meta property="og:url" content="%s">' . "\n", esc_url( $url ) );
	printf( '<meta property="og:site_name" content="%s">' . "\n", esc_attr( get_bloginfo( 'name' ) ) );
	if ( $desc ) {
		printf( '<meta property="og:description" content="%s">' . "\n", esc_attr( $desc ) );
	}
	if ( $image ) {
		printf( '<meta property="og:image" content="%s">' . "\n", esc_url( $image ) );
		echo '<meta name="twitter:card" content="summary_large_image">' . "\n";
	}
}, 1 );

/* WordPress prints its own canonical on singular pages – avoid duplicates. */
add_action( 'wp', function () {
	if ( ! iris_seo_plugin_active() ) {
		remove_action( 'wp_head', 'rel_canonical' );
	}
} );

/* JSON-LD: store info (home) + breadcrumbs (inner pages). WooCommerce adds Product schema itself. */
add_action( 'wp_footer', function () {
	if ( iris_seo_plugin_active() ) {
		return;
	}
	$graph = [];
	if ( is_front_page() ) {
		$logo    = get_theme_mod( 'custom_logo' );
		$graph[] = array_filter( [
			'@type'     => 'FurnitureStore',
			'name'      => get_bloginfo( 'name' ),
			'url'       => home_url( '/' ),
			'logo'      => $logo ? wp_get_attachment_image_url( $logo, 'full' ) : null,
			'telephone' => iris_mod( 'phone' ),
			'email'     => iris_mod( 'email' ),
			'address'   => [ '@type' => 'PostalAddress', 'streetAddress' => iris_mod( 'address' ), 'addressCountry' => 'VN' ],
			'sameAs'    => array_values( array_map( fn( $s ) => $s[1], iris_socials() ) ),
		] );
	} else {
		$list = [];
		foreach ( iris_breadcrumb_items() as $i => [ $label, $url ] ) {
			$list[] = array_filter( [ '@type' => 'ListItem', 'position' => $i + 1, 'name' => $label, 'item' => $url ?: null ] );
		}
		$graph[] = [ '@type' => 'BreadcrumbList', 'itemListElement' => $list ];
	}
	echo '<script type="application/ld+json">' . wp_json_encode( [ '@context' => 'https://schema.org', '@graph' => $graph ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES ) . '</script>' . "\n";
} );
