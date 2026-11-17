<?php
/**
 * Shop + product category pages.
 * Banner content: Sản phẩm → Danh mục → (sửa danh mục) → các ô "Banner".
 */
defined( 'ABSPATH' ) || exit;
get_header();

$iris_term     = is_product_taxonomy() ? get_queried_object() : null;
$iris_banner_t = $iris_term ? get_term_meta( $iris_term->term_id, 'banner_title', true ) : '';
$iris_children = $iris_term ? get_terms( [ 'taxonomy' => 'product_cat', 'parent' => $iris_term->term_id, 'hide_empty' => false ] ) : [];
$iris_title    = $iris_term ? $iris_term->name : woocommerce_page_title( false );
?>
<div class="bg-white">
	<div class="container-x flex flex-wrap items-center justify-between gap-4 py-4 lg:py-6">
		<?php iris_breadcrumbs( 'text-[17px]' ); ?>
		<div class="flex w-full items-center gap-3 sm:w-auto [&_.woocommerce-ordering]:min-w-0 [&_.woocommerce-ordering]:flex-1">
			<button type="button" class="btn-outline h-10 shrink-0 px-4 text-base whitespace-nowrap lg:hidden" data-filter-open aria-controls="shop-filters"><?php echo iris_icon( 'sliders-horizontal', 'size-4' ); ?> Bộ lọc</button>
			<?php woocommerce_catalog_ordering(); ?>
		</div>
	</div>
</div>
<h1 class="sr-only"><?php echo esc_html( $iris_title ); ?></h1>

<?php if ( $iris_banner_t ) : ?>
	<section class="cat-banner border-y border-neutral-200 bg-white">
		<div class="grid lg:grid-cols-[47%_53%]">
			<div class="flex flex-col justify-center px-[15px] py-10 lg:py-16 lg:pr-12 lg:pl-[max(45px,calc((100vw-1320px)/2+15px))]" data-reveal="left">
				<h2 class="text-[32px] font-bold uppercase leading-tight text-ink lg:text-[45px]"><?php echo esc_html( $iris_banner_t ); ?></h2>
				<p class="mt-5 max-w-[460px] text-[17px] leading-[1.6]"><?php echo esc_html( get_term_meta( $iris_term->term_id, 'banner_text', true ) ); ?></p>
			</div>
			<div class="relative flex min-h-[300px] items-center bg-gold lg:min-h-[520px]">
				<?php echo iris_img( (int) get_term_meta( $iris_term->term_id, 'banner_image', true ), 'large', 'relative z-10 w-[92%] max-w-[760px] lg:-ml-[10%]', [ 'loading' => 'eager', 'alt' => $iris_banner_t ] ); ?>
			</div>
		</div>
	</section>
<?php endif; ?>

<?php if ( $iris_children && ! is_wp_error( $iris_children ) ) : ?>
	<section class="bg-white py-8 lg:py-[60px]">
		<div class="container-x">
			<div class="no-scrollbar flex snap-x gap-6 overflow-x-auto lg:gap-[42px]">
				<?php foreach ( $iris_children as $iris_child ) : ?>
					<a href="<?php echo esc_url( get_term_link( $iris_child ) ); ?>" class="subcat group w-[130px] shrink-0 snap-start text-center lg:w-[190px]">
						<span class="subcat__img">
							<?php
							$iris_cimg = iris_term_image_id( $iris_child );
							echo $iris_cimg ? iris_img( $iris_cimg, 'medium', 'size-full object-cover transition duration-500 group-hover:scale-110', [ 'alt' => '', 'loading' => 'lazy' ] ) : wc_placeholder_img( 'thumbnail', [ 'class' => 'size-full object-cover opacity-60' ] ); // phpcs:ignore
							?>
						</span>
						<span class="mt-4 block text-sm uppercase lg:text-base"><?php echo esc_html( $iris_child->name ); ?></span>
					</a>
				<?php endforeach; ?>
			</div>
		</div>
	</section>
<?php endif; ?>

<div class="container-x grid gap-8 py-8 lg:grid-cols-[300px_1fr] lg:py-[30px]">
	<?php get_template_part( 'template-parts/shop-sidebar' ); ?>

	<div class="min-w-0">
		<?php if ( woocommerce_product_loop() ) : ?>
			<?php wc_print_notices(); ?>
			<div class="product-grid product-grid--3">
				<?php
				while ( have_posts() ) :
					the_post();
					iris_product_card( wc_get_product( get_the_ID() ), true );
				endwhile;
				?>
			</div>
			<div class="iris-pagination mt-10"><?php woocommerce_pagination(); ?></div>
		<?php else : ?>
			<div class="rounded-xl bg-white p-10 text-center">
				<p class="text-lg">Chưa có sản phẩm phù hợp.</p>
				<a href="<?php echo esc_url( get_permalink( wc_get_page_id( 'shop' ) ) ); ?>" class="btn-gold mt-5">Xem tất cả sản phẩm</a>
			</div>
		<?php endif; ?>

		<?php
		$iris_desc = $iris_term ? term_description( $iris_term ) : '';
		if ( $iris_desc && ! is_paged() ) :
			?>
			<div class="readmore mt-6" data-readmore>
				<div class="entry-content readmore__body" data-readmore-body><?php echo wp_kses_post( $iris_desc ); ?></div>
				<button type="button" class="readmore__btn" data-readmore-btn aria-expanded="false">Xem thêm</button>
			</div>
		<?php endif; ?>
	</div>
</div>
<?php
get_footer();
