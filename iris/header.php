<?php
/**
 * Site header. On the home page it floats transparently over the hero image and turns solid on scroll.
 */
$iris_transparent = is_front_page();
$iris_menu        = iris_menu_tree( 'primary' );
?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<?php wp_head(); ?>
</head>
<body <?php body_class( $iris_transparent ? 'has-transparent-header' : '' ); ?>>
<?php wp_body_open(); ?>
<a class="skip-link" href="#main">Bỏ qua, tới nội dung chính</a>

<header id="site-header" class="site-header <?php echo $iris_transparent ? 'is-transparent' : ''; ?>" data-header>
	<div class="container-x flex h-[70px] items-center gap-4 lg:h-[90px]">
		<button type="button" class="header-icon -ml-2 lg:hidden" data-drawer-open aria-controls="mobile-drawer" aria-expanded="false" aria-label="Mở menu">
			<?php echo iris_icon( 'menu', 'size-6' ); ?>
		</button>

		<a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="site-logo max-lg:absolute max-lg:left-1/2 max-lg:-translate-x-1/2" rel="home" aria-label="<?php echo esc_attr( get_bloginfo( 'name' ) ); ?> – Trang chủ">
			<?php
			$iris_logo = get_theme_mod( 'custom_logo' );
			if ( $iris_logo ) {
				echo iris_img( $iris_logo, 'medium', 'h-[46px] w-auto lg:h-[60px]', [ 'alt' => get_bloginfo( 'name' ), 'loading' => 'eager', 'fetchpriority' => 'high' ] );
			} else {
				echo '<span class="text-2xl font-bold tracking-wide">' . esc_html( get_bloginfo( 'name' ) ) . '</span>';
			}
			?>
		</a>

		<nav class="hidden flex-1 justify-center lg:flex" aria-label="Menu chính">
			<?php iris_desktop_menu( $iris_menu ); ?>
		</nav>

		<div class="ml-auto flex items-center gap-1 lg:ml-0">
			<form role="search" method="get" action="<?php echo esc_url( home_url( '/' ) ); ?>" class="header-search hidden lg:flex">
				<label class="sr-only" for="header-s">Tìm kiếm</label>
				<input id="header-s" type="search" name="s" placeholder="Tìm kiếm..." value="<?php echo esc_attr( get_search_query() ); ?>">
				<?php if ( class_exists( 'WooCommerce' ) ) : ?><input type="hidden" name="post_type" value="product"><?php endif; ?>
				<button type="submit" aria-label="Tìm"><?php echo iris_icon( 'search', 'size-[18px]' ); ?></button>
			</form>
			<?php if ( class_exists( 'WooCommerce' ) ) : ?>
				<a href="<?php echo esc_url( wc_get_cart_url() ); ?>" class="header-icon relative -mr-2 lg:mr-0" aria-label="Giỏ hàng">
					<?php echo iris_icon( 'shopping-bag', 'size-6' ); ?>
					<?php echo iris_cart_count_html(); // phpcs:ignore ?>
				</a>
			<?php endif; ?>
		</div>
	</div>
</header>

<?php /* Mobile drawer */ ?>
<div id="mobile-drawer" class="drawer" data-drawer hidden>
	<div class="drawer__backdrop" data-drawer-close></div>
	<div class="drawer__panel" role="dialog" aria-modal="true" aria-label="Menu">
		<div class="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
			<span class="text-lg font-bold text-gold">Menu</span>
			<button type="button" class="header-icon -mr-2" data-drawer-close aria-label="Đóng menu"><?php echo iris_icon( 'x', 'size-6' ); ?></button>
		</div>
		<form role="search" method="get" action="<?php echo esc_url( home_url( '/' ) ); ?>" class="m-5 flex items-center rounded-full border border-neutral-300 px-4">
			<label class="sr-only" for="drawer-s">Tìm kiếm</label>
			<input id="drawer-s" type="search" name="s" placeholder="Tìm sản phẩm..." class="h-11 flex-1 bg-transparent outline-none">
			<?php if ( class_exists( 'WooCommerce' ) ) : ?><input type="hidden" name="post_type" value="product"><?php endif; ?>
			<button type="submit" aria-label="Tìm"><?php echo iris_icon( 'search', 'size-5' ); ?></button>
		</form>
		<nav aria-label="Menu di động" class="px-5 pb-8">
			<?php iris_mobile_menu( array_merge( [ [ 'title' => 'Trang chủ', 'url' => home_url( '/' ), 'target' => '', 'current' => is_front_page(), 'children' => [] ] ], $iris_menu ) ); ?>
		</nav>
	</div>
</div>

<main id="main" class="site-main">
