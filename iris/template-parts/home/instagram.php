<?php
$iris_ids = iris_ids( 'instagram' );
if ( ! $iris_ids ) {
	return;
}
$iris_link = iris_mod( 'insta_link' );
?>
<section class="arc-section pt-12 pb-[80px]">
	<div class="container-x">
		<?php iris_section_title( iris_mod( 'insta_title' ), 'h2', 'mb-4' ); ?>
		<div class="carousel relative" data-carousel data-autoplay="4000">
			<div class="carousel__track gap-5" data-track>
				<?php foreach ( $iris_ids as $iris_id ) : ?>
					<a href="<?php echo esc_url( $iris_link ?: wp_get_attachment_image_url( $iris_id, 'full' ) ); ?>" class="insta-item w-[calc(50%-10px)] lg:w-[calc(25%-15px)]" <?php echo $iris_link ? 'target="_blank" rel="noopener"' : 'data-lightbox-image'; ?> aria-label="Ảnh Instagram">
						<?php echo iris_img( $iris_id, 'iris-card', 'aspect-square size-full object-cover', [ 'loading' => 'lazy', 'alt' => '' ] ); ?>
						<span class="insta-item__overlay"><?php echo iris_icon( 'instagram', 'size-8' ); ?></span>
					</a>
				<?php endforeach; ?>
			</div>
		</div>
	</div>
</section>
