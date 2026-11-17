<?php
/**
 * Template Name: Trang liên hệ
 * Nội dung: Giao diện → Tùy biến → IRIS – Nội dung website → Trang Liên hệ / Thông tin liên hệ.
 * Tin nhắn khách gửi: menu "Tin nhắn liên hệ" trong trang quản trị.
 */
get_header();
$iris_follow = iris_ids( 'ct_follow' );
?>
<section class="px-[10px] pt-[10px] lg:px-[25px]">
	<div class="relative h-[350px] overflow-hidden rounded-2xl lg:h-[500px]">
		<?php echo iris_img( iris_mod( 'ct_banner' ), 'full', 'size-full object-cover object-[53%_48%]', [ 'loading' => 'eager', 'fetchpriority' => 'high', 'alt' => '', 'sizes' => '100vw' ] ); ?>
	</div>
</section>
<span class="mx-auto block h-[95px] w-0.5 -translate-y-[1px] bg-[#1d2b45]" aria-hidden="true"></span>

<section class="container-x pt-16 text-center">
	<h1 class="text-[40px] font-bold text-gold lg:text-[50px]" data-reveal><?php echo esc_html( iris_mod( 'ct_title' ) ); ?></h1>
	<p class="mx-auto mt-6 max-w-[640px] leading-[1.6]" data-reveal><?php echo esc_html( iris_mod( 'ct_text' ) ); ?></p>

	<div class="mx-auto mt-14 grid max-w-[1000px] gap-10 sm:grid-cols-3">
		<?php
		$iris_cards = [
			[ 'mail', 'Gửi email cho chúng tôi', iris_mod( 'email' ), 'mailto:' . iris_mod( 'email' ) ],
			[ 'map-pin', 'Ghé thăm showroom', iris_mod( 'address' ), 'https://www.google.com/maps/search/?api=1&query=' . rawurlencode( iris_mod( 'address' ) ) ],
			[ 'phone-call', 'Gọi cho chúng tôi', iris_mod( 'phone' ), iris_tel( iris_mod( 'phone' ) ) ],
		];
		foreach ( $iris_cards as $iris_i => [ $iris_icon, $iris_label, $iris_value, $iris_href ] ) :
			?>
			<a href="<?php echo esc_url( $iris_href ); ?>" class="group flex flex-col items-center" data-reveal style="--d:<?php echo (int) $iris_i * 100; ?>ms" <?php echo 1 === $iris_i ? 'target="_blank" rel="noopener"' : ''; ?>>
				<span class="flex size-[50px] items-center justify-center rounded-xl bg-gradient-to-br from-[#fdcc7f] to-[#e8762b] text-white shadow-md transition group-hover:-translate-y-1"><?php echo iris_icon( $iris_icon, 'size-6' ); ?></span>
				<span class="mt-4 text-xl font-bold text-gold"><?php echo esc_html( $iris_label ); ?></span>
				<span class="mt-1"><?php echo esc_html( $iris_value ); ?></span>
			</a>
		<?php endforeach; ?>
	</div>
</section>

<section id="lien-he-form" class="container-x scroll-mt-28 py-16">
	<div class="grid overflow-hidden rounded-2xl bg-white shadow-sm lg:grid-cols-2">
		<div class="p-6 lg:p-12">
			<h2 class="mb-6 text-[28px] font-bold text-gold"><?php echo esc_html( iris_mod( 'ct_form_title' ) ); ?></h2>
			<?php iris_contact_form( 'Trang liên hệ' ); ?>
		</div>
		<div class="min-h-[320px]" data-lazy-map="<?php echo esc_url( iris_map_src() ); ?>">
			<button type="button" class="flex size-full flex-col items-center justify-center gap-2 bg-neutral-100 text-neutral-600 hover:text-gold"><?php echo iris_icon( 'map-pin', 'size-8 text-gold' ); ?> Xem bản đồ</button>
		</div>
	</div>
</section>

<?php if ( $iris_follow ) : ?>
	<span class="mx-auto block h-[150px] w-0.5 bg-[#1d2b45]" aria-hidden="true"></span>
	<section class="container-x pb-14">
		<?php iris_section_title( iris_mod( 'ct_follow_title' ), 'h2', 'mb-12 !text-[40px] lg:!text-[46px]' ); ?>
		<div class="grid gap-5 sm:grid-cols-3">
			<?php foreach ( $iris_follow as $iris_i => $iris_id ) : ?>
				<div class="room-card aspect-square" data-reveal style="--d:<?php echo (int) $iris_i * 100; ?>ms">
					<?php echo iris_img( $iris_id, 'large', 'room-card__img', [ 'loading' => 'lazy', 'alt' => '' ] ); ?>
					<span class="room-card__shine" aria-hidden="true"></span>
				</div>
			<?php endforeach; ?>
		</div>
	</section>
<?php endif; ?>

<?php if ( $iris_socials = iris_socials() ) : ?>
	<section class="container-x pt-10 pb-20 text-center">
		<?php iris_section_title( iris_mod( 'ct_social_title' ), 'h2', 'mb-6' ); ?>
		<ul class="flex justify-center gap-2">
			<?php
			$iris_colors = [ 'facebook' => '#3b5998', 'instagram' => '#c13584', 'youtube' => '#ff0000', 'tiktok' => '#111' ];
			foreach ( $iris_socials as $iris_key => [ $iris_label, $iris_url ] ) :
				?>
				<li><a href="<?php echo esc_url( $iris_url ); ?>" class="social-btn size-10" style="background:<?php echo esc_attr( $iris_colors[ $iris_key ] ); ?>" target="_blank" rel="noopener" aria-label="<?php echo esc_attr( $iris_label ); ?>"><?php echo iris_icon( $iris_key, 'size-5' ); ?></a></li>
			<?php endforeach; ?>
		</ul>
	</section>
<?php endif; ?>
<?php
get_footer();
