<?php
if ( ! iris_mod( 'rooms_show' ) || ! taxonomy_exists( 'product_cat' ) ) {
	return;
}
$iris_rooms = array_filter( array_map( fn( $id ) => $id ? get_term( (int) $id, 'product_cat' ) : null, [ iris_mod( 'room_1' ), iris_mod( 'room_2' ), iris_mod( 'room_3' ) ] ), fn( $t ) => $t && ! is_wp_error( $t ) );
if ( ! $iris_rooms ) {
	return;
}
?>
<section class="mx-auto max-w-[1440px] px-[15px] pb-14">
	<?php iris_section_title( iris_mod( 'rooms_title' ), 'h2', 'mb-8' ); ?>
	<div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-[30px]">
		<?php foreach ( $iris_rooms as $iris_i => $iris_room ) : ?>
			<a href="<?php echo esc_url( get_term_link( $iris_room ) ); ?>" class="room-card group" data-reveal style="--d:<?php echo (int) $iris_i * 90; ?>ms">
				<?php echo iris_img( iris_term_image_id( $iris_room ), 'large', 'room-card__img', [ 'alt' => '', 'loading' => 'lazy', 'sizes' => '(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw' ] ); ?>
				<span class="room-card__shine" aria-hidden="true"></span>
				<span class="absolute bottom-12 left-6 z-10 lg:left-[22px]">
					<span class="block text-2xl font-bold uppercase text-white drop-shadow-[0_2px_6px_rgba(0,0,0,.35)] lg:text-[25px]"><?php echo esc_html( $iris_room->name ); ?></span>
					<span class="btn-gold mt-3 px-[30px] uppercase">Xem thêm</span>
				</span>
			</a>
		<?php endforeach; ?>
	</div>
</section>
