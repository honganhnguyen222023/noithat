<?php
$iris_ids = iris_ids( 'press' );
if ( ! $iris_ids ) {
	return;
}
?>
<section class="container-x pb-14">
	<?php iris_section_title( iris_mod( 'press_title' ), 'h2', 'mb-8' ); ?>
	<div class="grid grid-cols-2 items-center gap-8 lg:grid-cols-4">
		<?php foreach ( $iris_ids as $iris_i => $iris_id ) : ?>
			<div class="flex h-[120px] items-center justify-center" data-reveal style="--d:<?php echo (int) $iris_i * 80; ?>ms">
				<?php echo iris_img( $iris_id, 'medium', 'press-logo max-h-[110px] w-auto max-w-full object-contain sm:max-w-[200px]', [ 'loading' => 'lazy', 'alt' => get_the_title( $iris_id ) ] ); ?>
			</div>
		<?php endforeach; ?>
	</div>
</section>
