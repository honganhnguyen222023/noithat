<?php
/**
 * Blog card. $args['style']: 'carousel' (white card, home) | 'grid' (blog archive).
 */
$iris_style = $args['style'] ?? 'grid';
$iris_card  = 'carousel' === $iris_style;
?>
<article <?php post_class( $iris_card ? 'post-card post-card--boxed group h-full' : 'post-card group' ); ?> data-reveal>
	<a href="<?php the_permalink(); ?>" class="post-card__media" tabindex="-1" aria-hidden="true">
		<?php
		if ( has_post_thumbnail() ) {
			the_post_thumbnail( 'iris-wide', [ 'class' => 'size-full object-cover transition duration-500 group-hover:scale-105', 'loading' => 'lazy', 'alt' => '' ] );
		}
		?>
	</a>
	<div class="<?php echo $iris_card ? 'px-5 pt-6 pb-6' : 'pt-5'; ?>">
		<h3 class="post-card__title"><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h3>
		<?php if ( $iris_card ) : ?>
			<time class="mt-1 block text-xs text-neutral-600" datetime="<?php echo esc_attr( get_the_date( 'c' ) ); ?>"><?php echo esc_html( get_the_date() ); ?></time>
		<?php endif; ?>
		<p class="mt-3 <?php echo $iris_card ? 'line-clamp-2' : 'line-clamp-3'; ?> text-[15px] leading-relaxed"><?php echo esc_html( get_the_excerpt() ); ?></p>
	</div>
</article>
