/* Admin helpers: Customizer gallery picker + single image picker on product-category screens. */
(function ($) {
  // Customizer gallery control
  $(document).on('click', '.iris-gallery__pick', function () {
    const box = $(this).closest('.iris-gallery');
    const input = box.find('input[type=hidden]');
    const ids = (input.val() || '').split(',').filter(Boolean).map(Number);
    const frame = wp.media({
      title: 'Chọn ảnh (kéo thả để sắp xếp)',
      multiple: 'add',
      library: { type: 'image' },
      button: { text: 'Dùng các ảnh này' },
    });
    frame.on('open', function () {
      const sel = frame.state().get('selection');
      ids.forEach((id) => { const a = wp.media.attachment(id); a.fetch(); sel.add(a); });
    });
    frame.on('select', function () {
      const items = frame.state().get('selection').toJSON();
      input.val(items.map((i) => i.id).join(',')).trigger('change');
      box.find('.iris-gallery__list').html(items.map((i) => {
        const src = (i.sizes && (i.sizes.thumbnail || i.sizes.full)).url;
        return `<li style="margin:0"><img src="${src}" style="width:60px;height:60px;object-fit:cover;border:1px solid #ddd;border-radius:4px"></li>`;
      }).join(''));
    });
    frame.open();
  });
  $(document).on('click', '.iris-gallery__clear', function () {
    const box = $(this).closest('.iris-gallery');
    box.find('input[type=hidden]').val('').trigger('change');
    box.find('.iris-gallery__list').empty();
  });

  // Term meta image field (product category banner)
  $(document).on('click', '.iris-term-image__pick', function (e) {
    e.preventDefault();
    const wrap = $(this).closest('.iris-term-image');
    const frame = wp.media({ title: 'Chọn ảnh', multiple: false, library: { type: 'image' } });
    frame.on('select', function () {
      const a = frame.state().get('selection').first().toJSON();
      wrap.find('input').val(a.id);
      wrap.find('.iris-term-image__preview').html(`<img src="${(a.sizes.medium || a.sizes.full).url}" style="max-width:240px;height:auto;border-radius:6px">`);
    });
    frame.open();
  });
  $(document).on('click', '.iris-term-image__remove', function (e) {
    e.preventDefault();
    const wrap = $(this).closest('.iris-term-image');
    wrap.find('input').val('');
    wrap.find('.iris-term-image__preview').empty();
  });
})(jQuery);
