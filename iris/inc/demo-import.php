<?php
/**
 * Giao diện → Nhập dữ liệu mẫu: one click to get the full demo (products, categories, posts,
 * pages, menus, images, home page content, WooCommerce settings for Vietnam).
 * Also available as WP-CLI: `wp iris import-demo`.
 *
 * Safe to run more than once: existing items (matched by slug) are updated, not duplicated.
 */

defined( 'ABSPATH' ) || exit;

add_action( 'admin_menu', function () {
	add_theme_page( 'Nhập dữ liệu mẫu', 'Nhập dữ liệu mẫu', 'manage_options', 'iris-demo', 'iris_demo_page' );
} );

function iris_demo_page() {
	$done = get_option( 'iris_demo_imported' );
	?>
	<div class="wrap">
		<h1>Nhập dữ liệu mẫu IRIS</h1>
		<?php if ( isset( $_GET['imported'] ) ) : // phpcs:ignore ?>
			<div class="notice notice-success"><p><strong>Đã nhập xong!</strong> <a href="<?php echo esc_url( home_url( '/' ) ); ?>" target="_blank">Xem website →</a></p></div>
		<?php endif; ?>
		<?php if ( ! class_exists( 'WooCommerce' ) ) : ?>
			<div class="notice notice-error"><p>Cần cài và kích hoạt plugin <strong>WooCommerce</strong> trước (Plugin → Cài mới → tìm "WooCommerce").</p></div>
		<?php endif; ?>
		<p>Thao tác này tạo: 8 sản phẩm (có biến thể màu sắc), danh mục sản phẩm, 10 bài blog, các trang chính sách, trang Giới thiệu, Liên hệ, menu và nội dung trang chủ giống bản mẫu.</p>
		<p>Có thể bấm lại nhiều lần – dữ liệu trùng sẽ được cập nhật, không bị nhân đôi. Mất khoảng 1–2 phút vì phải tạo ảnh thu nhỏ.</p>
		<?php if ( $done ) : ?>
			<p><em>Lần nhập gần nhất: <?php echo esc_html( $done ); ?></em></p>
		<?php endif; ?>
		<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
			<input type="hidden" name="action" value="iris_import_demo">
			<?php wp_nonce_field( 'iris_import_demo' ); ?>
			<?php submit_button( 'Nhập dữ liệu mẫu ngay', 'primary hero', 'submit', true, class_exists( 'WooCommerce' ) ? [] : [ 'disabled' => 'disabled' ] ); ?>
		</form>
	</div>
	<?php
}

add_action( 'admin_post_iris_import_demo', function () {
	check_admin_referer( 'iris_import_demo' );
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( 'Không có quyền.' );
	}
	iris_import_demo();
	wp_safe_redirect( admin_url( 'themes.php?page=iris-demo&imported=1' ) );
	exit;
} );

if ( defined( 'WP_CLI' ) && WP_CLI ) {
	WP_CLI::add_command( 'iris import-demo', function () {
		iris_import_demo( fn( $msg ) => WP_CLI::log( $msg ) );
		WP_CLI::success( 'Đã nhập dữ liệu mẫu.' );
	} );
}

/** Find a post by slug + exact post type (get_page_by_path() also matches attachments). */
function iris_demo_find( string $slug, string $type ): ?WP_Post {
	$found = get_posts( [ 'name' => $slug, 'post_type' => $type, 'post_status' => 'any', 'numberposts' => 1 ] );
	return $found[0] ?? null;
}

/**
 * The importer.
 */
function iris_import_demo( ?callable $log = null ): void {
	$log  = $log ?: fn() => null;
	$dir  = IRIS_DIR . '/demo';
	$data = json_decode( file_get_contents( $dir . '/data.json' ), true );
	if ( ! $data ) {
		return;
	}
	if ( function_exists( 'set_time_limit' ) ) {
		@set_time_limit( 600 ); // phpcs:ignore
	}
	wp_defer_term_counting( true );
	require_once ABSPATH . 'wp-admin/includes/image.php';
	require_once ABSPATH . 'wp-admin/includes/file.php';
	require_once ABSPATH . 'wp-admin/includes/media.php';

	/* --- Media ---------------------------------------------------------- */
	$map   = get_option( 'iris_demo_media', [] );
	$media = function ( ?string $file, string $title = '' ) use ( &$map, $dir ): int {
		if ( ! $file ) {
			return 0;
		}
		$src = $dir . '/images/' . $file;
		if ( ! file_exists( $src ) ) {
			return 0;
		}
		$key = $file . ':' . md5_file( $src ); // a changed image file is imported again
		if ( ! empty( $map[ $key ] ) && get_post( $map[ $key ] ) ) {
			return (int) $map[ $key ];
		}
		$tmp = wp_tempnam( $file );
		copy( $src, $tmp );
		$id = media_handle_sideload( [ 'name' => $file, 'tmp_name' => $tmp ], 0, $title ?: null );
		if ( is_wp_error( $id ) ) {
			@unlink( $tmp ); // phpcs:ignore
			return 0;
		}
		$map[ $key ] = $id;
		update_option( 'iris_demo_media', $map, false );
		return (int) $id;
	};

	/* --- Site + WooCommerce settings --------------------------------------- */
	$log( 'Cài đặt chung…' );
	update_option( 'blogname', 'Nội Thất IRIS' );
	update_option( 'blogdescription', 'Với sứ mệnh kiến tạo không gian sống với tinh hoa thiết kế Ý' );
	update_option( 'permalink_structure', '/%postname%/' );
	update_option( 'timezone_string', 'Asia/Ho_Chi_Minh' );
	update_option( 'date_format', 'j \T\h\á\n\g n, Y' );
	if ( class_exists( 'WooCommerce' ) ) {
		update_option( 'woocommerce_currency', 'VND' );
		update_option( 'woocommerce_currency_pos', 'right_space' );
		update_option( 'woocommerce_price_thousand_sep', '.' );
		update_option( 'woocommerce_price_decimal_sep', ',' );
		update_option( 'woocommerce_price_num_decimals', '0' );
		update_option( 'woocommerce_default_country', 'VN' );
		update_option( 'woocommerce_coming_soon', 'no' );
		update_option( 'woocommerce_store_pages_only', 'no' );
		update_option( 'woocommerce_permalinks', array_merge( (array) get_option( 'woocommerce_permalinks', [] ), [ 'product_base' => 'san-pham', 'category_base' => 'danh-muc-san-pham' ] ) );
		update_option( 'woocommerce_cod_settings', [ 'enabled' => 'yes', 'title' => 'Thanh toán khi nhận hàng (COD)', 'description' => 'Trả tiền mặt khi nhận hàng.', 'instructions' => 'Trả tiền mặt khi nhận hàng.' ] );
		update_option( 'woocommerce_bacs_settings', array_merge( (array) get_option( 'woocommerce_bacs_settings', [] ), [ 'enabled' => 'yes', 'title' => 'Chuyển khoản ngân hàng' ] ) );
		update_option( 'woocommerce_task_list_hidden', 'yes' );
		update_option( 'woocommerce_onboarding_profile', [ 'skipped' => true ] );
	}

	/* --- Logos ------------------------------------------------------------- */
	set_theme_mod( 'custom_logo', $media( $data['site']['logo'], 'Logo IRIS' ) );
	set_theme_mod( 'logo_light', $media( $data['site']['logo_light'], 'Logo IRIS (sáng)' ) );
	if ( ! empty( $data['site']['favicon'] ) ) {
		update_option( 'site_icon', $media( $data['site']['favicon'], 'Biểu tượng trang (favicon)' ) );
	}

	/* --- Product attributes + categories ------------------------------------ */
	$cat_ids = [];
	if ( class_exists( 'WooCommerce' ) ) {
		$log( 'Danh mục & thuộc tính sản phẩm…' );
		$attr_tax = [];
		foreach ( $data['products'] as $p ) {
			foreach ( $p['attributes'] as $a ) {
				$slug = sanitize_title( remove_accents( $a['name'] ) );
				$tax  = wc_attribute_taxonomy_name( $slug );
				if ( ! wc_attribute_taxonomy_id_by_name( $slug ) ) {
					wc_create_attribute( [ 'name' => $a['name'], 'slug' => $slug, 'type' => 'select', 'order_by' => 'menu_order', 'has_archives' => false ] );
				}
				if ( ! taxonomy_exists( $tax ) ) {
					register_taxonomy( $tax, [ 'product' ], [ 'hierarchical' => false, 'show_ui' => false, 'query_var' => true, 'rewrite' => false ] );
				}
				foreach ( $a['terms'] as $term ) {
					if ( ! term_exists( $term, $tax ) ) {
						wp_insert_term( $term, $tax, [ 'slug' => sanitize_title( remove_accents( $term ) ) ] );
					}
				}
				$attr_tax[ $a['name'] ] = $tax;
			}
		}

		$order = 0;
		foreach ( $data['product_categories'] as $c ) {
			$parent = ! empty( $c['parent'] ) ? ( $cat_ids[ $c['parent'] ] ?? 0 ) : 0;
			$exists = get_term_by( 'slug', $c['slug'], 'product_cat' );
			if ( ! $exists && 'chua-phan-loai' === $c['slug'] ) {
				$exists = get_term( (int) get_option( 'default_product_cat' ), 'product_cat' ); // WooCommerce's "Uncategorized"
			}
			$args = [ 'slug' => $c['slug'], 'parent' => $parent, 'description' => $c['description'] ?? '' ];
			if ( $exists && ! is_wp_error( $exists ) ) {
				wp_update_term( $exists->term_id, 'product_cat', $args + [ 'name' => $c['name'] ] );
				$tid = $exists->term_id;
			} else {
				$r   = wp_insert_term( $c['name'], 'product_cat', $args );
				$tid = is_wp_error( $r ) ? 0 : $r['term_id'];
			}
			if ( ! $tid ) {
				continue;
			}
			$cat_ids[ $c['slug'] ] = $tid;
			update_term_meta( $tid, 'order', $order++ );
			if ( ! empty( $c['image'] ) ) {
				update_term_meta( $tid, 'thumbnail_id', $media( $c['image'], $c['name'] ) );
			}
			if ( ! empty( $c['banner_title'] ) ) {
				update_term_meta( $tid, 'banner_title', $c['banner_title'] );
				update_term_meta( $tid, 'banner_text', $c['banner_text'] );
				update_term_meta( $tid, 'banner_image', $media( $c['banner_image'], $c['banner_title'] ) );
			}
		}

		/* --- Products ------------------------------------------------------- */
		$log( 'Sản phẩm…' );
		foreach ( array_reverse( $data['products'] ) as $i => $p ) { // reverse so the newest matches the reference order
			$existing = iris_demo_find( $p['slug'], 'product' );
			$product  = 'variable' === $p['type'] ? new WC_Product_Variable( $existing ? $existing->ID : 0 ) : new WC_Product_Simple( $existing ? $existing->ID : 0 );
			$product->set_name( $p['name'] );
			$product->set_slug( $p['slug'] );
			$product->set_status( 'publish' );
			$product->set_description( $p['description'] );
			$product->set_short_description( $p['short_description'] );
			$product->set_category_ids( array_values( array_filter( array_map( fn( $s ) => $cat_ids[ $s ] ?? 0, $p['categories'] ) ) ) );
			$imgs = array_values( array_filter( array_map( fn( $f ) => $media( $f, $p['name'] ), $p['images'] ) ) );
			$product->set_image_id( $imgs[0] ?? 0 );
			$product->set_gallery_image_ids( array_slice( $imgs, 1 ) );
			$product->set_date_created( time() - ( count( $data['products'] ) - $i ) * 3600 );

			$attributes = [];
			foreach ( $p['attributes'] as $pos => $a ) {
				$tax  = $attr_tax[ $a['name'] ];
				$attr = new WC_Product_Attribute();
				$attr->set_id( wc_attribute_taxonomy_id_by_name( $tax ) );
				$attr->set_name( $tax );
				$attr->set_options( array_map( fn( $t ) => (int) get_term_by( 'name', $t, $tax )->term_id, $a['terms'] ) );
				$attr->set_position( $pos );
				$attr->set_visible( true );
				$attr->set_variation( 'variable' === $p['type'] );
				$attributes[] = $attr;
			}
			$product->set_attributes( $attributes );

			if ( 'simple' === $p['type'] ) {
				$product->set_regular_price( $p['regular_price'] );
				$product->set_sale_price( $p['sale_price'] );
			}
			$pid = $product->save();

			if ( 'variable' === $p['type'] ) {
				foreach ( $product->get_children() as $old ) {
					wp_delete_post( $old, true );
				}
				foreach ( $p['variations'] as $v ) {
					$tax       = $attr_tax[ $v['attribute'] ];
					$term      = get_term_by( 'name', $v['term'], $tax );
					$variation = new WC_Product_Variation();
					$variation->set_parent_id( $pid );
					$variation->set_attributes( [ $tax => $term ? $term->slug : sanitize_title( $v['term'] ) ] );
					$variation->set_regular_price( $v['regular_price'] );
					$variation->set_sale_price( $v['sale_price'] );
					$variation->set_image_id( $media( $v['image'], $p['name'] . ' – ' . $v['term'] ) );
					$variation->set_status( 'publish' );
					$variation->save();
				}
				WC_Product_Variable::sync( $pid );
			}
		}
	}

	/* --- Blog ---------------------------------------------------------------- */
	$log( 'Bài viết…' );
	$post_cats = [];
	foreach ( $data['post_categories'] as $c ) {
		$t = get_term_by( 'slug', $c['slug'], 'category' );
		$post_cats[ $c['slug'] ] = $t ? $t->term_id : ( wp_insert_term( $c['name'], 'category', [ 'slug' => $c['slug'] ] )['term_id'] ?? 0 );
	}
	foreach ( $data['posts'] as $p ) {
		$existing = iris_demo_find( $p['slug'], 'post' );
		$id       = wp_insert_post( [
			'ID'            => $existing ? $existing->ID : 0,
			'post_type'     => 'post',
			'post_status'   => 'publish',
			'post_title'    => $p['title'],
			'post_name'     => $p['slug'],
			'post_content'  => $p['content'],
			'post_excerpt'  => $p['excerpt'],
			'post_date'     => $p['date'],
			'post_category' => array_values( array_filter( array_map( fn( $s ) => $post_cats[ $s ] ?? 0, $p['categories'] ) ) ),
		] );
		if ( $id && $p['image'] ) {
			set_post_thumbnail( $id, $media( $p['image'], $p['title'] ) );
		}
	}
	if ( $hello = iris_demo_find( 'hello-world', 'post' ) ) {
		wp_delete_post( $hello->ID, true );
	}

	/* --- Pages ---------------------------------------------------------------- */
	$log( 'Trang…' );
	$page = function ( string $slug, string $title, string $content = '', string $template = '' ): int {
		$existing = iris_demo_find( $slug, 'page' );
		$id       = wp_insert_post( [
			'ID'           => $existing ? $existing->ID : 0,
			'post_type'    => 'page',
			'post_status'  => 'publish',
			'post_title'   => $title,
			'post_name'    => $slug,
			'post_content' => $content,
		] );
		if ( $template ) {
			update_post_meta( $id, '_wp_page_template', $template );
		}
		return (int) $id;
	};
	$pages = [];
	foreach ( $data['pages'] as $p ) {
		$pages[ $p['slug'] ] = $page( $p['slug'], $p['title'], $p['content'] );
	}
	$pages['trang-chu']  = $page( 'trang-chu', 'Trang chủ', '<!-- Nội dung trang chủ chỉnh trong Giao diện → Tùy biến → IRIS – Nội dung website -->' );
	$pages['gioi-thieu'] = $page( 'gioi-thieu', 'Về chúng tôi', '', 'page-templates/about.php' );
	$pages['lien-he']    = $page( 'lien-he', 'Liên hệ', '', 'page-templates/contact.php' );
	$pages['blog']       = $page( 'blog', 'Blog kiến thức' );
	update_option( 'show_on_front', 'page' );
	update_option( 'page_on_front', $pages['trang-chu'] );
	update_option( 'page_for_posts', $pages['blog'] );
	if ( $sample = iris_demo_find( 'sample-page', 'page' ) ) {
		wp_delete_post( $sample->ID, true );
	}
	if ( class_exists( 'WooCommerce' ) ) {
		if ( wc_get_page_id( 'shop' ) < 1 ) {
			WC_Install::create_pages();
		}
		// Vietnamese titles + URLs for the WooCommerce pages (they are created in English when the site language was English).
		foreach ( [ 'shop' => [ 'cua-hang', 'Sản phẩm' ], 'cart' => [ 'gio-hang', 'Giỏ hàng' ], 'checkout' => [ 'thanh-toan', 'Thanh toán' ], 'myaccount' => [ 'tai-khoan', 'Tài khoản' ] ] as $key => [ $slug, $title ] ) {
			$id = wc_get_page_id( $key );
			if ( $id > 0 ) {
				wp_update_post( [ 'ID' => $id, 'post_name' => $slug, 'post_title' => $title ] );
			}
		}
		foreach ( [ 'refund_returns', 'privacy-policy' ] as $slug ) { // replaced by the Vietnamese policy pages
			if ( $old = iris_demo_find( $slug, 'page' ) ) {
				wp_trash_post( $old->ID );
			}
		}
		update_option( 'wp_page_for_privacy_policy', $pages['chinh-sach-bao-mat'] );
		update_option( 'woocommerce_terms_page_id', $pages['chinh-sach-doi-tra'] );
	}

	/* --- Testimonials ------------------------------------------------------------ */
	$log( 'Phản hồi khách hàng…' );
	foreach ( get_posts( [ 'post_type' => 'iris_testimonial', 'numberposts' => -1, 'post_status' => 'any', 'meta_key' => '_iris_demo', 'fields' => 'ids' ] ) as $old ) {
		wp_delete_post( $old, true );
	}
	foreach ( $data['testimonials'] as $i => $t ) {
		$id = wp_insert_post( [ 'post_type' => 'iris_testimonial', 'post_status' => 'publish', 'post_title' => $t['name'], 'post_content' => $t['content'], 'menu_order' => $i ] );
		update_post_meta( $id, 'role', $t['role'] );
		update_post_meta( $id, '_iris_demo', 1 );
		set_post_thumbnail( $id, $media( $t['avatar'], $t['name'] ) );
	}

	/* --- Customizer content ------------------------------------------------------ */
	$log( 'Nội dung trang chủ…' );
	$h = $data['home'];
	$s = $data['site'];
	set_theme_mod( 'hero_image', $media( $h['hero_image'], 'Ảnh bìa trang chủ' ) );
	set_theme_mod( 'about_image', $media( $h['about_image'], 'Giới thiệu IRIS' ) );
	set_theme_mod( 'video_image', $media( $h['video_image'], 'Video IRIS' ) );
	set_theme_mod( 'brands', implode( ',', array_map( fn( $f ) => $media( $f, 'Thương hiệu' ), $h['brands'] ) ) );
	set_theme_mod( 'press', implode( ',', array_map( fn( $f ) => $media( $f, 'Báo chí' ), $h['press'] ) ) );
	set_theme_mod( 'instagram', implode( ',', array_map( fn( $f ) => $media( $f, 'Instagram IRIS' ), $h['instagram'] ) ) );
	set_theme_mod( 'cats_exclude', 0 );
	foreach ( [ 'room_1' => 'phong-khach', 'room_2' => 'phong-an', 'room_3' => 'phong-ngu', 'ab_service_1' => 'phong-an', 'ab_service_2' => 'phong-khach', 'ab_service_3' => 'phong-lam-viec' ] as $mod => $slug ) {
		set_theme_mod( $mod, $cat_ids[ $slug ] ?? 0 );
	}
	set_theme_mod( 'ab_banner', $media( $s['page_banner'], 'Không gian nội thất' ) );
	set_theme_mod( 'ct_banner', $media( $s['page_banner'], 'Không gian nội thất' ) );
	set_theme_mod( 'ab_image_1', $media( $s['about_images'][0], 'Phòng ăn' ) );
	set_theme_mod( 'ab_image_2', $media( $s['about_images'][1], 'Phòng khách' ) );
	set_theme_mod( 'ct_follow', implode( ',', array_map( fn( $f ) => $media( $f, 'Theo dõi IRIS' ), $s['contact_follow'] ) ) );

	/* --- Menus ------------------------------------------------------------------- */
	$log( 'Menu…' );
	$menu = function ( string $name, string $location, array $items ) {
		$obj = wp_get_nav_menu_object( $name );
		$id  = $obj ? $obj->term_id : wp_create_nav_menu( $name );
		foreach ( wp_get_nav_menu_items( $id ) ?: [] as $old ) {
			wp_delete_post( $old->ID, true );
		}
		$add = function ( array $items, int $parent = 0 ) use ( &$add, $id ) {
			foreach ( $items as $it ) {
				$args = [ 'menu-item-title' => $it[0], 'menu-item-status' => 'publish', 'menu-item-parent-id' => $parent ];
				$tgt  = $it[1];
				if ( is_array( $tgt ) ) { // [ type, object, id ]
					$args += [ 'menu-item-type' => $tgt[0], 'menu-item-object' => $tgt[1], 'menu-item-object-id' => $tgt[2] ];
				} else {
					$args += [ 'menu-item-type' => 'custom', 'menu-item-url' => $tgt ];
				}
				$item_id = wp_update_nav_menu_item( $id, 0, $args );
				if ( ! empty( $it[2] ) ) {
					$add( $it[2], $item_id );
				}
			}
		};
		$add( $items );
		$locations              = get_theme_mod( 'nav_menu_locations', [] );
		$locations[ $location ] = $id;
		set_theme_mod( 'nav_menu_locations', $locations );
	};
	$pg   = fn( $slug, $title = null ) => [ $title ?? get_the_title( $pages[ $slug ] ), [ 'post_type', 'page', $pages[ $slug ] ] ];
	$pcat = function ( $slug ) use ( $cat_ids, &$pcat, $data ) {
		$children = array_values( array_filter( $data['product_categories'], fn( $c ) => ( $c['parent'] ?? '' ) === $slug ) );
		$term     = get_term( $cat_ids[ $slug ], 'product_cat' );
		return [ $term->name, [ 'taxonomy', 'product_cat', $cat_ids[ $slug ] ], array_map( fn( $c ) => $pcat( $c['slug'] ), $children ) ];
	};
	$bcat = fn( $slug ) => [ get_term( $post_cats[ $slug ] )->name, [ 'taxonomy', 'category', $post_cats[ $slug ] ] ];
	$policies = [ $pg( 'chinh-sach-bao-hanh' ), $pg( 'chinh-sach-bao-mat' ), $pg( 'chinh-sach-doi-tra' ), $pg( 'chinh-sach-kiem-hang' ), $pg( 'chinh-sach-thanh-toan' ), $pg( 'chinh-sach-van-chuyen' ) ];

	$primary = [ $pg( 'gioi-thieu' ) ];
	if ( $cat_ids ) {
		$primary[] = [ 'Sản Phẩm', get_permalink( wc_get_page_id( 'shop' ) ), [ $pcat( 'ban-an' ), $pcat( 'ban-tra' ), $pcat( 'ghe-an' ), $pcat( 'ghe-sofa' ) ] ];
	}
	$primary[] = [ 'Blog kiến thức', [ 'post_type', 'page', $pages['blog'] ], [ $bcat( 'kien-thuc-noi-that' ), $bcat( 'kien-thuc-sofa' ), $bcat( 'kien-thuc-ve-da' ) ] ];
	$primary[] = [ 'Chính Sách Mua Hàng', '#', $policies ];
	$primary[] = $pg( 'lien-he' );
	$menu( 'Menu chính', 'primary', $primary );
	$menu( 'Chân trang – Hướng dẫn', 'footer-1', [ $pg( 'chinh-sach-doi-tra' ), $pg( 'chinh-sach-bao-mat' ), $pg( 'chinh-sach-kiem-hang' ), $pg( 'chinh-sach-van-chuyen' ), $pg( 'chinh-sach-thanh-toan' ), $pg( 'chinh-sach-bao-hanh' ), [ 'Bộ sưu tập', $cat_ids ? get_permalink( wc_get_page_id( 'shop' ) ) : home_url( '/' ) ] ] );
	$menu( 'Chân trang – Giới thiệu', 'footer-2', [ $pg( 'gioi-thieu' ), $pg( 'lien-he' ), $bcat( 'kien-thuc-sofa' ) ] );
	$menu( 'Chân trang – Hỗ trợ', 'footer-3', [ $pg( 'chinh-sach-thanh-toan', 'Đặt hàng & Thanh toán' ), $pg( 'chinh-sach-van-chuyen', 'Vận chuyển & Giao hàng' ), $pg( 'chinh-sach-bao-hanh', 'Dịch vụ bảo hành' ), $pg( 'chinh-sach-doi-tra', 'Chính sách đổi hàng' ) ] );

	wp_defer_term_counting( false );
	if ( class_exists( 'WooCommerce' ) ) {
		wc_delete_product_transients();
		if ( function_exists( 'wc_update_product_lookup_tables' ) ) {
			wc_update_product_lookup_tables();
		}
		delete_transient( 'wc_attribute_taxonomies' );
	}
	flush_rewrite_rules();
	update_option( 'iris_demo_imported', current_time( 'mysql' ) );
	$log( 'Xong.' );
}
