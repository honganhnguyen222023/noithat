<?php
/**
 * Customizer control: pick several images from the Media Library (stored as "12,34,56").
 */

defined( 'ABSPATH' ) || exit;

class Iris_Gallery_Control extends WP_Customize_Control {
	public $type = 'iris-gallery';

	public function enqueue() {
		wp_enqueue_media();
		wp_enqueue_script( 'iris-admin', IRIS_URI . '/assets/js/admin.js', [ 'jquery', 'customize-controls' ], IRIS_VERSION, true );
	}

	public function render_content() {
		$ids = array_filter( array_map( 'absint', explode( ',', (string) $this->value() ) ) );
		?>
		<span class="customize-control-title"><?php echo esc_html( $this->label ); ?></span>
		<div class="iris-gallery" data-setting="<?php echo esc_attr( $this->id ); ?>">
			<ul class="iris-gallery__list" style="display:flex;flex-wrap:wrap;gap:6px;margin:0 0 8px">
				<?php foreach ( $ids as $id ) : ?>
					<li style="margin:0"><?php echo wp_get_attachment_image( $id, [ 60, 60 ], false, [ 'style' => 'width:60px;height:60px;object-fit:cover;border:1px solid #ddd;border-radius:4px' ] ); ?></li>
				<?php endforeach; ?>
			</ul>
			<input type="hidden" <?php $this->link(); ?> value="<?php echo esc_attr( implode( ',', $ids ) ); ?>">
			<button type="button" class="button iris-gallery__pick">Chọn / sắp xếp ảnh</button>
			<button type="button" class="button-link iris-gallery__clear" style="margin-left:8px;color:#b32d2e">Xóa hết</button>
		</div>
		<?php
	}
}
