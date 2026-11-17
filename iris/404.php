<?php get_header(); ?>
<div class="container-x flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
	<p class="text-[120px] leading-none font-bold text-gold/30">404</p>
	<h1 class="mt-2 text-3xl font-bold text-gold">Không tìm thấy trang</h1>
	<p class="mt-4 max-w-md">Trang bạn tìm có thể đã được đổi tên hoặc không còn tồn tại. Hãy thử tìm sản phẩm bên dưới.</p>
	<form role="search" method="get" action="<?php echo esc_url( home_url( '/' ) ); ?>" class="mt-8 flex w-full max-w-md items-center rounded-full border border-neutral-300 bg-white px-5">
		<label class="sr-only" for="s404">Tìm kiếm</label>
		<input id="s404" type="search" name="s" placeholder="Tìm sản phẩm, bài viết..." class="h-12 flex-1 bg-transparent outline-none">
		<button type="submit" aria-label="Tìm"><?php echo iris_icon( 'search', 'size-5' ); ?></button>
	</form>
	<a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="btn-gold mt-6"><?php echo iris_icon( 'house', 'size-4' ); ?> Về trang chủ</a>
</div>
<?php get_footer(); ?>
