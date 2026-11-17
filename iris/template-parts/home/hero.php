<?php
$iris_img   = iris_mod( 'hero_image' );
$iris_title = iris_mod( 'hero_title' );
?>
<section class="hero relative isolate flex h-[min(800px,100svh)] min-h-[560px] items-center justify-center overflow-hidden bg-neutral-700">
	<?php if ( $iris_img ) : ?>
		<?php echo iris_img( $iris_img, 'full', 'hero__img absolute inset-0 -z-10 size-full object-cover object-[58%_50%]', [ 'loading' => 'eager', 'fetchpriority' => 'high', 'sizes' => '(max-width: 1023px) 1536px, 100vw' ] ); ?>
	<?php endif; ?>
	<div class="absolute inset-0 -z-10 bg-gradient-to-b from-black/35 via-black/5 to-black/20"></div>
	<h1 class="hero__title container-x text-center"><?php echo esc_html( $iris_title ); ?></h1>
	<a href="#home-about" class="hero__scroll" aria-label="Cuộn xuống"><?php echo iris_icon( 'chevron-down', 'size-6' ); ?></a>
</section>
