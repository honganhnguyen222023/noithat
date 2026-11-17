<?php
/**
 * Template Name: Trang giới thiệu
 * Nội dung: Giao diện → Tùy biến → IRIS – Nội dung website → Trang Giới thiệu.
 */
get_header();
$iris_services = array_filter( array_map( fn( $id ) => $id ? get_term( (int) $id, 'product_cat' ) : null, [ iris_mod( 'ab_service_1' ), iris_mod( 'ab_service_2' ), iris_mod( 'ab_service_3' ) ] ), fn( $t ) => $t && ! is_wp_error( $t ) );
?>
<h1 class="sr-only"><?php the_title(); ?></h1>
<section class="relative flex h-[300px] items-center overflow-hidden bg-neutral-700 lg:h-[478px]">
	<?php echo iris_img( iris_mod( 'ab_banner' ), 'full', 'absolute inset-0 size-full object-cover', [ 'loading' => 'eager', 'fetchpriority' => 'high', 'alt' => '', 'sizes' => '100vw' ] ); ?>
	<div class="absolute inset-0 bg-black/15"></div>
	<p class="container-x relative text-[44px] font-bold text-white drop-shadow-lg lg:text-[70px]" data-reveal="left"><?php echo esc_html( iris_mod( 'ab_title' ) ); ?></p>
</section>

<nav class="container-x grid grid-cols-3 py-[30px]" aria-label="Mục lục trang">
	<?php foreach ( [ 'gioi-thieu-iris' => 'Giới thiệu', 'trai-nghiem' => 'Trải nghiệm', 'dich-vu' => 'Dịch vụ' ] as $iris_id => $iris_label ) : ?>
		<a href="#<?php echo esc_attr( $iris_id ); ?>" class="border-neutral-300 py-5 text-center font-bold text-[#344943] transition hover:text-gold [&:not(:last-child)]:border-r"><?php echo esc_html( $iris_label ); ?></a>
	<?php endforeach; ?>
</nav>

<section id="gioi-thieu-iris" class="container-x scroll-mt-28 py-10">
	<span class="block h-0.5 w-[50px] bg-[#4d8ad2]"></span>
	<h2 class="mt-4 text-[30px] leading-tight font-bold text-gold lg:text-[40px]" data-reveal><?php echo esc_html( iris_mod( 'ab_heading' ) ); ?></h2>
	<div class="mt-8 grid gap-8 text-[17px] leading-[1.6] lg:grid-cols-3 lg:gap-10">
		<div class="hidden lg:block"></div>
		<p data-reveal><?php echo esc_html( iris_mod( 'ab_text_1' ) ); ?></p>
		<p data-reveal style="--d:120ms"><?php echo esc_html( iris_mod( 'ab_text_2' ) ); ?></p>
	</div>
</section>

<section id="trai-nghiem" class="scroll-mt-28 bg-[linear-gradient(to_bottom,transparent_0,transparent_360px,#253446_360px)] pt-[60px] pb-20 text-white">
	<div class="container-x">
		<div class="grid items-start gap-[30px] md:grid-cols-2">
			<div class="overflow-hidden rounded-2xl" data-reveal="zoom"><?php echo iris_img( iris_mod( 'ab_image_1' ), 'large', 'aspect-[630/360] w-full object-cover', [ 'loading' => 'lazy', 'alt' => '' ] ); ?></div>
			<div class="overflow-hidden rounded-2xl" data-reveal="zoom" style="--d:120ms"><?php echo iris_img( iris_mod( 'ab_image_2' ), 'large', 'aspect-[630/500] w-full object-cover', [ 'loading' => 'lazy', 'alt' => '' ] ); ?></div>
		</div>
		<div class="mt-20 space-y-[90px] lg:mt-[170px]">
			<?php foreach ( [ 1, 2, 3 ] as $iris_n ) : ?>
				<div data-reveal>
					<p class="text-[15px] font-bold text-[#3fc0a0]">0<?php echo (int) $iris_n; ?></p>
					<div class="mt-2 grid gap-6 border-t border-white/25 pt-8 lg:grid-cols-2 lg:gap-[45px]">
						<h3 class="text-[28px] font-bold lg:text-[38px]"><?php echo esc_html( iris_mod( "ab_v{$iris_n}_title" ) ); ?></h3>
						<p class="leading-[1.6]"><?php echo esc_html( iris_mod( "ab_v{$iris_n}_text" ) ); ?></p>
					</div>
				</div>
			<?php endforeach; ?>
		</div>
	</div>
</section>

<?php if ( $iris_services ) : ?>
	<section id="dich-vu" class="scroll-mt-28 bg-[linear-gradient(90deg,#f1f4f7_50%,transparent_50%)] pt-[120px] pb-24 lg:pt-[166px]">
		<div class="container-x">
			<span class="block h-0.5 w-[50px] bg-[#4d8ad2]"></span>
			<h2 class="mt-16 text-[26px] font-bold text-gold lg:text-[30px]" data-reveal><?php echo esc_html( iris_mod( 'ab_services_title' ) ); ?></h2>
			<div class="mt-10 grid gap-[30px] md:grid-cols-3">
				<?php foreach ( $iris_services as $iris_i => $iris_s ) : ?>
					<a href="<?php echo esc_url( get_term_link( $iris_s ) ); ?>" class="room-card aspect-square group" data-reveal style="--d:<?php echo (int) $iris_i * 100; ?>ms">
						<?php echo iris_img( iris_term_image_id( $iris_s ), 'large', 'room-card__img', [ 'loading' => 'lazy', 'alt' => '' ] ); ?>
						<span class="room-card__shine" aria-hidden="true"></span>
						<span class="absolute inset-x-0 bottom-[40px] z-10 flex flex-col items-center gap-6 text-center">
							<span class="h-[50px] w-px bg-white"></span>
							<span class="text-lg font-bold text-white drop-shadow lg:text-xl">Nội thất <?php echo esc_html( mb_strtolower( $iris_s->name ) ); ?></span>
						</span>
					</a>
				<?php endforeach; ?>
			</div>
		</div>
	</section>
<?php endif; ?>

<?php if ( trim( get_the_content() ) ) : ?>
	<section class="container-x pb-16"><div class="entry-content"><?php the_content(); ?></div></section>
<?php endif; ?>
<?php
get_footer();
