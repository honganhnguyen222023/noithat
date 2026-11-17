<?php
$iris_url = iris_mod( 'video_url' );
if ( ! $iris_url ) {
	return;
}
preg_match( '~(?:v=|youtu\.be/|embed/|shorts/)([\w-]{11})~', $iris_url, $iris_m );
$iris_vid = $iris_m[1] ?? '';
?>
<section class="mx-auto max-w-[1440px] px-[15px] pb-0">
	<button type="button" class="video-banner group" data-video="<?php echo esc_attr( $iris_vid ); ?>" aria-label="Xem video giới thiệu">
		<?php echo iris_img( iris_mod( 'video_image' ), 'full', 'absolute inset-0 size-full object-cover transition duration-700 group-hover:scale-105', [ 'loading' => 'lazy', 'alt' => '', 'sizes' => '100vw' ] ); ?>
		<span class="absolute inset-0 bg-[#5c4e31]/60"></span>
		<span class="video-banner__play"><?php echo iris_icon( 'play', 'size-7 translate-x-0.5 fill-current' ); ?></span>
	</button>
</section>
