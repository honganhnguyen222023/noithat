<form role="search" method="get" action="<?php echo esc_url( home_url( '/' ) ); ?>" class="flex items-center rounded-full border border-neutral-300 bg-white px-5">
	<label class="sr-only" for="sf-<?php echo esc_attr( wp_unique_id() ); ?>">Tìm kiếm</label>
	<input type="search" name="s" value="<?php echo esc_attr( get_search_query() ); ?>" placeholder="Tìm kiếm..." class="h-11 flex-1 bg-transparent outline-none">
	<button type="submit" aria-label="Tìm"><?php echo iris_icon( 'search', 'size-5' ); ?></button>
</form>
