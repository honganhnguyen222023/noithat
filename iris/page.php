<?php
/**
 * Default page (policies, cart, checkout, account…).
 */
get_header();
$iris_is_shop_page = function_exists( 'is_cart' ) && ( is_cart() || is_checkout() || is_account_page() );

while ( have_posts() ) :
	the_post();
	?>
	<div class="container-x py-6 lg:py-8">
		<?php iris_breadcrumbs( 'mb-6 text-[17px]' ); ?>
		<article <?php post_class( $iris_is_shop_page ? 'wc-page' : 'mx-auto max-w-[900px] rounded-2xl bg-white p-6 lg:p-12' ); ?>>
			<h1 class="mb-6 text-[28px] leading-tight font-bold text-gold lg:text-[34px]"><?php the_title(); ?></h1>
			<div class="entry-content"><?php the_content(); ?></div>
		</article>
	</div>
	<?php
endwhile;

get_footer();
