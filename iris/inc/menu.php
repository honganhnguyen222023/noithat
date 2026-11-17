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
		$has = (bool) $item['children'];
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
