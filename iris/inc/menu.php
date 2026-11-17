<?php
/**
 * Menu rendering (desktop dropdowns + mobile accordion) from a menu location.
 */

defined( 'ABSPATH' ) || exit;

function iris_menu_tree( string $location ): array {
	$locations = get_nav_menu_locations();
	if ( empty( $locations[ $location ] ) ) {
		return [];
	}
	$items = wp_get_nav_menu_items( $locations[ $location ] ) ?: [];
	_wp_menu_item_classes_by_context( $items ); // adds current-menu-item / ancestor classes
	$by_parent = [];
	foreach ( $items as $item ) {
		$by_parent[ (int) $item->menu_item_parent ][] = $item;
	}
	$build = function ( int $parent ) use ( &$build, $by_parent ) {
		$out = [];
		foreach ( $by_parent[ $parent ] ?? [] as $item ) {
			$classes = (array) $item->classes;
			$out[]   = [
				'title'    => $item->title,
				'url'      => $item->url,
				'target'   => $item->target,
				'current'  => (bool) array_intersect( [ 'current-menu-item', 'current-menu-ancestor', 'current-menu-parent' ], $classes ),
				'object'   => $item->object,
				'id'       => (int) $item->object_id,
				'children' => $build( (int) $item->ID ),
			];
		}
		return $out;
	};
	return $build( 0 );
}

function iris_desktop_menu( array $tree, int $depth = 0 ): void {
	if ( ! $tree ) {
		return;
	}
	echo 0 === $depth ? '<ul class="nav-desktop">' : '<ul class="nav-dropdown' . ( $depth > 1 ? ' nav-dropdown--sub' : '' ) . '">';
	foreach ( $tree as $item ) {
		$has  = (bool) $item['children'];
		$mega = 0 === $depth && $has && in_array( 'product_cat', array_column( $item['children'], 'object' ), true );
		if ( $mega ) {
			iris_mega_menu( $item );
			continue;
		}
		printf( '<li class="%s">', esc_attr( trim( ( $has ? 'has-children ' : '' ) . ( $item['current'] ? 'is-current' : '' ) ) ) );
		printf(
			'<a href="%s"%s>%s%s</a>',
			esc_url( $item['url'] ),
			$item['target'] ? ' target="' . esc_attr( $item['target'] ) . '" rel="noopener"' : '',
			esc_html( $item['title'] ),
			$has ? iris_icon( 0 === $depth ? 'chevron-down' : 'chevron-right', 'size-3.5 opacity-60' ) : ''
		);
		if ( $has ) {
			iris_desktop_menu( $item['children'], $depth + 1 );
		}
		echo '</li>';
	}
	echo '</ul>';
}

/**
 * Mega menu "Sản phẩm": tự bật khi mục cấp 1 có mục con là Danh mục sản phẩm.
 * Cột trái = các danh mục (mục con trong Menu); di chuột để đổi bảng bên phải.
 * Bảng phải = mục cấp 3 trong Menu (nếu trống: tự lấy danh mục con) + "Ảnh thu nhỏ" của danh mục.
 */
function iris_mega_menu( array $item ): void {
	static $n = 0;
	$uid      = 'mega-' . ( ++$n );
	$parents  = $item['children'];
	$label    = iris_mod( 'mega_label' );
	$view_all = iris_mod( 'mega_view_all' );
	$collect  = iris_mod( 'mega_collection' );

	printf( '<li class="has-children has-mega%s">', $item['current'] ? ' is-current' : '' );
	printf( '<a href="%s" aria-haspopup="true">%s%s</a>', esc_url( $item['url'] ), esc_html( $item['title'] ), iris_icon( 'chevron-down', 'size-3.5 opacity-60' ) );
	printf( '<div class="mega" data-mega id="%s"><div class="mega__parents" role="tablist" aria-label="%s">', esc_attr( $uid ), esc_attr( $item['title'] ) );
	foreach ( $parents as $i => $p ) {
		printf(
			'<a href="%1$s" class="mega__parent%2$s" role="tab" id="%3$s-t%4$d" aria-controls="%3$s-p%4$d" aria-selected="%5$s" data-mega-tab><span>%6$s</span>%7$s</a>',
			esc_url( $p['url'] ),
			0 === $i ? ' is-active' : '',
			esc_attr( $uid ),
			$i,
			0 === $i ? 'true' : 'false',
			esc_html( $p['title'] ),
			iris_icon( 'chevron-right', 'size-6 shrink-0' )
		);
	}
	echo '</div><div class="mega__content">';
	foreach ( $parents as $i => $p ) {
		$kids = $p['children'];
		if ( ! $kids && 'product_cat' === $p['object'] ) {
			foreach ( get_terms( [ 'taxonomy' => 'product_cat', 'parent' => $p['id'], 'hide_empty' => false, 'orderby' => 'meta_value_num', 'meta_key' => 'order' ] ) ?: [] as $t ) {
				if ( ! is_wp_error( $t ) ) {
					$kids[] = [ 'title' => $t->name, 'url' => get_term_link( $t ) ];
				}
			}
		}
		$img = 'product_cat' === $p['object'] && function_exists( 'iris_term_image_id' ) ? iris_term_image_id( $p['id'] ) : 0;

		printf( '<section class="mega__panel" id="%1$s-p%2$d" role="tabpanel" aria-labelledby="%1$s-t%2$d"%3$s>', esc_attr( $uid ), $i, 0 === $i ? '' : ' hidden' );
		echo '<div class="min-w-0">';
		printf( '<a href="%s" class="mega__view-all"><span>%s %s</span>%s</a>', esc_url( $p['url'] ), esc_html( $view_all ), esc_html( $p['title'] ), iris_icon( 'chevron-right', 'size-6 shrink-0' ) );
		if ( $kids ) {
			if ( $label ) {
				printf( '<div class="mega__label">%s</div>', esc_html( $label ) );
			}
			echo '<div class="mega__children">';
			foreach ( $kids as $k ) {
				printf( '<a href="%s" class="mega__child">%s</a>', esc_url( $k['url'] ), esc_html( $k['title'] ) );
			}
			echo '</div>';
		}
		echo '</div><div class="mega__media">';
		if ( $img ) {
			printf( '<a href="%s" class="mega__image" tabindex="-1" aria-hidden="true">%s</a>', esc_url( $p['url'] ), iris_img( $img, 'medium_large', 'h-full w-full object-contain', [ 'alt' => '' ] ) );
		}
		printf( '<a href="%s" class="mega__collection"><span>%s %s</span>%s</a>', esc_url( $p['url'] ), esc_html( $collect ), esc_html( $p['title'] ), iris_icon( 'chevron-right', 'size-6 shrink-0' ) );
		echo '</div></section>';
	}
	echo '</div></div></li>';
}

function iris_mobile_menu( array $tree, int $depth = 0 ): void {
	if ( ! $tree ) {
		return;
	}
	echo '<ul class="' . ( $depth ? 'nav-mobile__sub' : 'nav-mobile' ) . '"' . ( $depth ? ' hidden' : '' ) . '>';
	foreach ( $tree as $item ) {
		$has = (bool) $item['children'];
		echo '<li>';
		echo '<div class="nav-mobile__row">';
		printf( '<a href="%s" class="%s">%s</a>', esc_url( $item['url'] ), $item['current'] ? 'text-gold' : '', esc_html( $item['title'] ) );
		if ( $has ) {
			printf( '<button type="button" class="nav-mobile__toggle" aria-expanded="false" aria-label="Mở menu con %s">%s</button>', esc_attr( $item['title'] ), iris_icon( 'chevron-down', 'size-4' ) );
		}
		echo '</div>';
		if ( $has ) {
			iris_mobile_menu( $item['children'], $depth + 1 );
		}
		echo '</li>';
	}
	echo '</ul>';
}

function iris_footer_menu( string $location ): void {
	$tree = iris_menu_tree( $location );
	if ( ! $tree ) {
		return;
	}
	echo '<ul class="footer-list">';
	foreach ( $tree as $item ) {
		printf( '<li><a href="%s">%s</a></li>', esc_url( $item['url'] ), esc_html( $item['title'] ) );
	}
	echo '</ul>';
}
