</main>

<footer class="site-footer">
	<div class="container-x grid gap-10 py-10 sm:grid-cols-2 lg:grid-cols-[1.35fr_1fr_1fr_1fr_1.4fr] lg:gap-8">
		<div class="space-y-4 sm:col-span-2 lg:col-span-1">
			<a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="inline-block" aria-label="<?php echo esc_attr( get_bloginfo( 'name' ) ); ?>">
				<?php
				$iris_light = iris_mod( 'logo_light' ) ?: get_theme_mod( 'custom_logo' );
				echo $iris_light ? iris_img( $iris_light, 'medium', 'h-[52px] w-auto', [ 'alt' => get_bloginfo( 'name' ), 'loading' => 'lazy' ] ) : esc_html( get_bloginfo( 'name' ) );
				?>
			</a>
			<p class="text-[15px] leading-relaxed"><?php echo esc_html( iris_mod( 'footer_about' ) ); ?></p>
			<ul class="space-y-3 text-[15px]">
				<li class="flex gap-3"><?php echo iris_icon( 'map-pin', 'size-5 shrink-0 mt-0.5' ); ?><span><?php echo esc_html( iris_mod( 'address' ) ); ?></span></li>
				<li class="flex gap-3"><?php echo iris_icon( 'phone-call', 'size-5 shrink-0' ); ?><a href="<?php echo esc_url( iris_tel( iris_mod( 'phone' ) ) ); ?>"><?php echo esc_html( iris_mod( 'phone' ) ); ?></a></li>
				<li class="flex gap-3"><?php echo iris_icon( 'mail', 'size-5 shrink-0' ); ?><a href="mailto:<?php echo esc_attr( iris_mod( 'email' ) ); ?>"><?php echo esc_html( iris_mod( 'email' ) ); ?></a></li>
			</ul>
		</div>
		<?php foreach ( [ 1, 2, 3 ] as $iris_col ) : ?>
			<div>
				<h2 class="footer-title"><?php echo esc_html( iris_mod( "footer_title_{$iris_col}" ) ); ?></h2>
				<?php iris_footer_menu( "footer-{$iris_col}" ); ?>
			</div>
		<?php endforeach; ?>
		<div class="sm:col-span-2 lg:col-span-1">
			<h2 class="footer-title"><?php echo esc_html( iris_mod( 'footer_title_map' ) ); ?></h2>
			<div class="footer-map" data-lazy-map="<?php echo esc_url( iris_map_src() ); ?>">
				<button type="button" class="flex size-full flex-col items-center justify-center gap-2 text-sm text-white/80 hover:text-white">
					<?php echo iris_icon( 'map-pin', 'size-7 text-gold' ); ?> Xem bản đồ
				</button>
			</div>
		</div>
	</div>
	<div class="border-t border-white/10">
		<div class="container-x flex flex-col items-center justify-between gap-3 py-4 text-sm text-white/70 sm:flex-row">
			<p><?php echo esc_html( iris_mod( 'copyright' ) ); ?></p>
			<?php if ( $iris_socials = iris_socials() ) : ?>
				<ul class="flex gap-2">
					<?php foreach ( $iris_socials as $iris_key => [ $iris_label, $iris_url ] ) : ?>
						<li><a href="<?php echo esc_url( $iris_url ); ?>" class="social-btn" target="_blank" rel="noopener" aria-label="<?php echo esc_attr( $iris_label ); ?>"><?php echo iris_icon( $iris_key, 'size-4' ); ?></a></li>
					<?php endforeach; ?>
				</ul>
			<?php endif; ?>
		</div>
	</div>
</footer>

<?php get_template_part( 'template-parts/contact-buttons' ); ?>

<button type="button" class="back-to-top" data-back-to-top aria-label="Lên đầu trang"><?php echo iris_icon( 'arrow-up', 'size-5' ); ?></button>

<div class="lightbox" data-lightbox hidden>
	<button type="button" class="lightbox__close" data-lightbox-close aria-label="Đóng"><?php echo iris_icon( 'x', 'size-7' ); ?></button>
	<div class="lightbox__body" data-lightbox-body></div>
</div>

<?php wp_footer(); ?>
</body>
</html>
