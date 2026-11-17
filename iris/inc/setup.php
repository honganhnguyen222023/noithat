<?php
/**
 * Theme setup, assets and performance tweaks.
 */

defined( 'ABSPATH' ) || exit;

add_action( 'after_setup_theme', function () {
	load_theme_textdomain( 'iris', IRIS_DIR . '/languages' );

	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'automatic-feed-links' );
	add_theme_support( 'responsive-embeds' );
	add_theme_support( 'html5', [ 'search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script' ] );
	add_theme_support( 'custom-logo', [ 'height' => 120, 'width' => 300, 'flex-height' => true, 'flex-width' => true ] );

	add_theme_support( 'woocommerce', [
		'thumbnail_image_width' => 600,
		'single_image_width'    => 1000,
		'product_grid'          => [ 'default_rows' => 4, 'default_columns' => 3, 'min_columns' => 2, 'max_columns' => 4 ],
	] );

	register_nav_menus( [
		'primary'  => 'Menu chính (đầu trang)',
		'footer-1' => 'Chân trang – cột "Hướng dẫn"',
		'footer-2' => 'Chân trang – cột "Giới thiệu"',
		'footer-3' => 'Chân trang – cột "Hỗ trợ"',
	] );

	add_image_size( 'iris-card', 600, 600, true );
	add_image_size( 'iris-wide', 900, 560, true );
} );

/**
 * Front-end CSS/JS. Everything is local (no CDN) and the theme JS has no jQuery dependency.
 */
add_action( 'wp_enqueue_scripts', function () {
	$css = IRIS_DIR . '/assets/css/app.css';
	$js  = IRIS_DIR . '/assets/js/app.min.js'; // built from app.js by `npm run build`
	$js_file = file_exists( $js ) && ! ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ) ? 'app.min.js' : 'app.js';
	$js  = IRIS_DIR . '/assets/js/' . $js_file;

	wp_enqueue_style( 'iris', IRIS_URI . '/assets/css/app.css', [], file_exists( $css ) ? filemtime( $css ) : IRIS_VERSION );
	wp_enqueue_script( 'iris', IRIS_URI . '/assets/js/' . $js_file, [], file_exists( $js ) ? filemtime( $js ) : IRIS_VERSION, [ 'strategy' => 'defer', 'in_footer' => true ] );

	if ( is_singular( 'post' ) && comments_open() && get_option( 'thread_comments' ) ) {
		wp_enqueue_script( 'comment-reply' );
	}

	// The theme styles everything itself → drop CSS that would only be overridden.
	wp_dequeue_style( 'classic-theme-styles' );
	wp_dequeue_style( 'global-styles' );
	if ( ! is_singular() || iris_is_wc_page() ) {
		wp_dequeue_style( 'wp-block-library' );
	}
}, 20 );

/** Preload the two most used font files + the hero image so the first paint is fast. */
add_action( 'wp_head', function () {
	// Lets CSS hide reveal-on-scroll elements only when JS is running (no flash without JS).
	echo "<script>document.documentElement.classList.add('js')</script>\n";
	foreach ( [ 'be-vietnam-pro-vietnamese-400-normal', 'be-vietnam-pro-latin-700-normal' ] as $font ) {
		printf( '<link rel="preload" href="%s" as="font" type="font/woff2" crossorigin>' . "\n", esc_url( IRIS_URI . "/assets/fonts/{$font}.woff2" ) );
	}
	if ( is_front_page() && ( $hero = iris_mod( 'hero_image' ) ) ) {
		$src = wp_get_attachment_image_url( $hero, 'full' );
		if ( $src ) {
			printf( '<link rel="preload" as="image" href="%s" fetchpriority="high">' . "\n", esc_url( $src ) );
		}
	}
	printf( '<meta name="theme-color" content="#ba9b63">' . "\n" );
}, 2 );

/** Remove emoji scripts (saves a request + inline JS on every page). */
remove_action( 'wp_head', 'print_emoji_detection_script', 7 );
remove_action( 'wp_print_styles', 'print_emoji_styles' );
remove_action( 'wp_head', 'wp_generator' );
remove_action( 'wp_head', 'wlwmanifest_link' );
remove_action( 'wp_head', 'rsd_link' );

/** Widgets: we only use one optional sidebar on the blog. */
add_action( 'widgets_init', function () {
	register_sidebar( [
		'name'          => 'Cột bên trang Blog (thêm vào dưới các khối mặc định)',
		'id'            => 'blog',
		'before_widget' => '<section class="sidebar-box %2$s">',
		'after_widget'  => '</section>',
		'before_title'  => '<h3 class="sidebar-title">',
		'after_title'   => '</h3>',
	] );
} );

/** Excerpt tuned for cards. */
add_filter( 'excerpt_length', fn() => 28 );
add_filter( 'excerpt_more', fn() => '…' );

/** Wrap embeds (YouTube…) in posts so they stay responsive. */
add_filter( 'embed_oembed_html', fn( $html ) => '<div class="aspect-video [&>iframe]:size-full">' . $html . '</div>' );
