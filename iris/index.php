<?php
/**
 * Blog listing (page "Blog kiến thức", post categories, tags, search, archives).
 */
get_header();

if ( is_home() ) {
	$iris_heading = get_the_title( (int) get_option( 'page_for_posts' ) ) ?: 'Blog kiến thức';
} elseif ( is_search() ) {
	$iris_heading = 'Kết quả tìm kiếm: “' . get_search_query() . '”';
} elseif ( is_archive() ) {
	$iris_heading = wp_strip_all_tags( get_the_archive_title() );
} else {
	$iris_heading = get_bloginfo( 'name' );
}
?>
<div class="container-x py-6 lg:py-8">
	<?php iris_breadcrumbs( 'mb-6 text-[17px]' ); ?>
	<div class="grid gap-8 lg:grid-cols-[300px_1fr] lg:gap-[30px]">
		<div class="order-2 lg:order-1"><?php get_template_part( 'template-parts/blog-sidebar' ); ?></div>
		<div class="order-1 min-w-0 lg:order-2">
			<h1 class="mb-6 text-2xl font-bold uppercase text-gold lg:text-[28px]"><?php echo esc_html( $iris_heading ); ?></h1>
			<?php if ( is_category() && category_description() ) : ?>
				<div class="entry-content mb-8"><?php echo wp_kses_post( category_description() ); ?></div>
			<?php endif; ?>

			<?php if ( have_posts() ) : ?>
				<div class="grid gap-x-[30px] gap-y-10 sm:grid-cols-2">
					<?php
					while ( have_posts() ) :
						the_post();
						get_template_part( 'template-parts/post-card', null, [ 'style' => 'grid' ] );
					endwhile;
					?>
				</div>
				<div class="iris-pagination mt-12">
					<?php the_posts_pagination( [ 'mid_size' => 1, 'prev_text' => iris_icon( 'chevron-left', 'size-4' ), 'next_text' => iris_icon( 'chevron-right', 'size-4' ) ] ); ?>
				</div>
			<?php else : ?>
				<div class="rounded-xl bg-white p-8">
					<p class="mb-4">Không tìm thấy nội dung phù hợp. Bạn thử từ khóa khác nhé.</p>
					<?php get_search_form(); ?>
				</div>
			<?php endif; ?>
		</div>
	</div>
</div>
<?php
get_footer();
