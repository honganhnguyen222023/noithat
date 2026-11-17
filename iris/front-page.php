<?php
/**
 * Home page. Every section reads its content from Giao diện → Tùy biến → IRIS – Nội dung website.
 * Each section lives in template-parts/home/*.php so it is easy to reorder or remove.
 */
get_header();

$iris_sections = [ 'hero', 'about', 'categories', 'rooms', 'products', 'brands', 'video', 'blog', 'press', 'testimonials', 'instagram' ];
foreach ( apply_filters( 'iris_home_sections', $iris_sections ) as $iris_section ) {
	get_template_part( 'template-parts/home/' . $iris_section );
}

get_footer();
