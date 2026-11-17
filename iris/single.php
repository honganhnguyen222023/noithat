<?php
/**
 * Single blog post: sidebar + automatic table of contents ("Nội dung") built from the H2/H3 headings.
 */
get_header();

while ( have_posts() ) :
	the_post();
	[ $iris_content, $iris_toc ] = iris_toc( apply_filters( 'the_content', get_the_content() ) );
	// The table of contents goes right after the intro paragraph (like the reference site).
	$iris_cut   = strpos( $iris_content, '</p>' );
	$iris_intro = false !== $iris_cut && $iris_cut < strpos( $iris_content . '<h2', '<h2' ) ? substr( $iris_content, 0, $iris_cut + 4 ) : '';
	$iris_body  = substr( $iris_content, strlen( $iris_intro ) );
	?>
	<div class="container-x py-6 lg:py-8">
		<?php iris_breadcrumbs( 'mb-6 text-[17px]' ); ?>
		<div class="grid gap-8 lg:grid-cols-[300px_1fr] lg:gap-[30px]">
			<div class="order-2 lg:order-1"><?php get_template_part( 'template-parts/blog-sidebar' ); ?></div>

			<article <?php post_class( 'order-1 min-w-0 lg:order-2' ); ?>>
				<header class="mb-6">
					<p class="mb-1 text-xs font-bold uppercase tracking-wide text-[#3b6c86]"><?php echo wp_kses_post( get_the_category_list( ', ' ) ); ?></p>
					<h1 class="text-[26px] leading-tight font-bold text-gold lg:text-[30px]"><?php the_title(); ?></h1>
					<p class="mt-3 flex items-center gap-2 text-sm text-neutral-600"><?php echo iris_icon( 'calendar', 'size-4' ); ?><time datetime="<?php echo esc_attr( get_the_date( 'c' ) ); ?>"><?php echo esc_html( get_the_date() ); ?></time></p>
				</header>

				<?php if ( $iris_intro ) : ?>
					<div class="entry-content mb-6"><?php echo $iris_intro; // phpcs:ignore -- filtered by the_content ?></div>
				<?php endif; ?>

				<?php if ( count( $iris_toc ) > 2 ) : ?>
					<nav class="toc" aria-label="Mục lục" data-toc>
						<div class="flex items-center justify-between">
							<p class="text-xl font-bold text-ink">Nội dung</p>
							<button type="button" class="toc__toggle" data-toc-toggle aria-expanded="true" aria-label="Ẩn/hiện mục lục"><?php echo iris_icon( 'list-tree', 'size-5' ); ?></button>
						</div>
						<ol class="toc__list" data-toc-list>
							<?php
							$iris_n = [ 0, 0 ];
							foreach ( $iris_toc as $iris_item ) :
								if ( 2 === $iris_item['level'] ) {
									$iris_n = [ $iris_n[0] + 1, 0 ];
									$iris_num = $iris_n[0] . '.';
								} else {
									++$iris_n[1];
									$iris_num = $iris_n[0] . '.' . $iris_n[1] . '.';
								}
								?>
								<li class="<?php echo 3 === $iris_item['level'] ? 'pl-6 text-[14px]' : ''; ?>"><a href="#<?php echo esc_attr( $iris_item['id'] ); ?>"><span class="mr-1"><?php echo esc_html( $iris_num ); ?></span><?php echo esc_html( preg_replace( '/^[\d.]+\s*/', '', $iris_item['text'] ) ); ?></a></li>
							<?php endforeach; ?>
						</ol>
					</nav>
				<?php endif; ?>

				<div class="entry-content"><?php echo $iris_body; // phpcs:ignore -- already filtered by the_content ?></div>

				<footer class="mt-10 flex flex-wrap items-center gap-3 border-t border-neutral-300 pt-6">
					<span class="font-bold">Chia sẻ:</span>
					<a class="social-btn bg-[#1877f2]" href="https://www.facebook.com/sharer/sharer.php?u=<?php echo rawurlencode( get_permalink() ); ?>" target="_blank" rel="noopener" aria-label="Chia sẻ Facebook"><?php echo iris_icon( 'facebook', 'size-4' ); ?></a>
					<a class="social-btn bg-[#0068ff]" href="https://zalo.me/share?url=<?php echo rawurlencode( get_permalink() ); ?>" target="_blank" rel="noopener" aria-label="Chia sẻ Zalo"><?php echo iris_icon( 'zalo', 'size-5' ); ?></a>
				</footer>

				<?php
				$iris_related = get_posts( [ 'numberposts' => 2, 'post__not_in' => [ get_the_ID() ], 'category__in' => wp_get_post_categories( get_the_ID() ) ] );
				if ( $iris_related ) :
					?>
					<section class="mt-12">
						<h2 class="mb-6 text-2xl font-bold text-gold">Bài viết liên quan</h2>
						<div class="grid gap-8 sm:grid-cols-2">
							<?php
							foreach ( $iris_related as $post ) : // phpcs:ignore WordPress.WP.GlobalVariablesOverride
								setup_postdata( $post );
								get_template_part( 'template-parts/post-card' );
							endforeach;
							wp_reset_postdata();
							?>
						</div>
					</section>
				<?php endif; ?>
			</article>
		</div>
	</div>
	<?php
endwhile;

get_footer();
