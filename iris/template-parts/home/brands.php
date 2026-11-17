<?php
$iris_ids = iris_ids( 'brands' );
if ( ! $iris_ids ) {
	return;
}
?>
<section class="mx-auto max-w-[1440px] px-[15px] pb-[60px]" aria-label="Thương hiệu đối tác">
	<div class="marquee" style="--count:<?php echo count( $iris_ids ); ?>">
		<div class="marquee__track">
			<?php foreach ( [ 0, 1 ] as $iris_copy ) : ?>
				<?php foreach ( $iris_ids as $iris_id ) : ?>
					<div class="marquee__item" <?php echo $iris_copy ? 'aria-hidden="true"' : ''; ?>>
						<?php echo iris_img( $iris_id, 'medium', 'max-h-[60px] w-auto object-contain', [ 'loading' => 'lazy', 'alt' => $iris_copy ? '' : get_the_title( $iris_id ) ] ); ?>
					</div>
				<?php endforeach; ?>
			<?php endforeach; ?>
		</div>
	</div>
</section>
