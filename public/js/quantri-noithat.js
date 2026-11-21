/* Trang quản trị – phần riêng của web nội thất: nhiều ảnh, soạn nội dung, mẫu sản phẩm. */
( function () {
	'use strict';
	var $ = function ( sel, root ) { return ( root || document ).querySelector( sel ); };
	var $$ = function ( sel, root ) { return Array.prototype.slice.call( ( root || document ).querySelectorAll( sel ) ); };

	/* Tải 1 ảnh lên → trả về link. */
	function upload( file ) {
		var fd = new FormData();
		fd.append( 'file', file );
		return fetch( '/quan-tri/tai-anh/', { method: 'POST', body: fd, credentials: 'same-origin' } )
			.then( function ( r ) { return r.json(); } )
			.then( function ( r ) { if ( ! r.ok ) { throw new Error( r.msg ); } return r.url; } );
	}
	function pickFiles( multiple, cb ) {
		var input = document.createElement( 'input' );
		input.type = 'file';
		input.accept = 'image/*';
		input.multiple = !! multiple;
		input.addEventListener( 'change', function () { cb( Array.prototype.slice.call( input.files ) ); } );
		input.click();
	}
	function markDirty( el ) {
		var form = el.closest( 'form' );
		if ( form ) { form.dispatchEvent( new Event( 'input', { bubbles: true } ) ); }
	}

	/* ---- Nhiều ảnh (thư viện ảnh sản phẩm, logo thương hiệu…) ---- */
	function gallerySync( box ) {
		var list = $$( 'figure', box ).map( function ( f ) { return f.getAttribute( 'data-src' ); } );
		$( 'input[type=hidden]', box ).value = JSON.stringify( list );
		markDirty( box );
	}
	function galleryAdd( box, src ) {
		var fig = document.createElement( 'figure' );
		fig.setAttribute( 'data-src', src );
		fig.innerHTML = '<img src="' + src + '" alt=""><button type="button" data-qt-gallery-left aria-label="Lên trước">‹</button><button type="button" data-qt-gallery-del aria-label="Bỏ ảnh">×</button>';
		$( '.qt-gallery-list', box ).appendChild( fig );
	}
	document.addEventListener( 'click', function ( e ) {
		var box = e.target.closest( '[data-qt-gallery]' );
		if ( ! box ) { return; }
		var fig = e.target.closest( 'figure' );
		if ( e.target.closest( '[data-qt-gallery-del]' ) ) {
			fig.parentNode.removeChild( fig );
			gallerySync( box );
		} else if ( e.target.closest( '[data-qt-gallery-left]' ) ) {
			if ( fig.previousElementSibling ) { fig.parentNode.insertBefore( fig, fig.previousElementSibling ); gallerySync( box ); }
		} else if ( e.target.closest( '[data-qt-gallery-add]' ) ) {
			var btn = e.target.closest( '[data-qt-gallery-add]' );
			pickFiles( true, function ( files ) {
				btn.disabled = true;
				btn.textContent = 'Đang tải…';
				files.reduce( function ( p, f ) {
					return p.then( function () { return upload( f ).then( function ( url ) { galleryAdd( box, url ); } ); } );
				}, Promise.resolve() )
					.catch( function ( err ) { window.alert( 'Chưa tải được ảnh: ' + ( err.message || '' ) ); } )
					.then( function () { btn.disabled = false; btn.textContent = '+ Thêm ảnh'; gallerySync( box ); } );
			} );
		}
	} );

	/* ---- Soạn nội dung (đậm, nghiêng, tiêu đề, danh sách, link, ảnh) ---- */
	$$( '[data-qt-editor]' ).forEach( function ( box ) {
		var area = $( '.qt-editor-area', box );
		var src = $( 'textarea', box );
		var sync = function () { src.value = area.innerHTML; };
		area.addEventListener( 'input', sync );
		area.addEventListener( 'blur', sync );
		var form = box.closest( 'form' );
		if ( form ) {
			form.addEventListener( 'submit', function () { if ( ! src.hidden ) { area.innerHTML = src.value; } sync(); } );
		}
		$( '.qt-editor-bar', box ).addEventListener( 'click', function ( e ) {
			var b = e.target.closest( 'button' );
			if ( ! b ) { return; }
			var cmd = b.getAttribute( 'data-cmd' );
			if ( 'html' === cmd ) {
				if ( src.hidden ) { sync(); src.hidden = false; area.hidden = true; b.classList.add( 'is-on' ); }
				else { area.innerHTML = src.value; src.hidden = true; area.hidden = false; b.classList.remove( 'is-on' ); }
				return;
			}
			area.focus();
			if ( 'h2' === cmd || 'h3' === cmd || 'p' === cmd ) {
				document.execCommand( 'formatBlock', false, cmd );
			} else if ( 'link' === cmd ) {
				var url = window.prompt( 'Dán link (vd https://… hoặc /lien-he/):' );
				if ( url ) { document.execCommand( 'createLink', false, url ); }
			} else if ( 'image' === cmd ) {
				var sel = window.getSelection();
				var range = sel.rangeCount ? sel.getRangeAt( 0 ) : null;
				pickFiles( false, function ( files ) {
					if ( ! files[ 0 ] ) { return; }
					b.disabled = true;
					upload( files[ 0 ] ).then( function ( u ) {
						area.focus();
						if ( range ) { sel.removeAllRanges(); sel.addRange( range ); }
						document.execCommand( 'insertHTML', false, '<img src="' + u + '" alt="">' );
						sync();
						markDirty( box );
					} ).catch( function ( err ) { window.alert( 'Chưa tải được ảnh: ' + ( err.message || '' ) ); } ).then( function () { b.disabled = false; } );
				} );
				return;
			} else {
				document.execCommand( cmd, false, null );
			}
			sync();
			markDirty( box );
		} );
	} );

	/* ---- Mẫu sản phẩm (màu sắc / chất liệu): thêm, bỏ dòng ---- */
	document.addEventListener( 'click', function ( e ) {
		var add = e.target.closest( '[data-qt-var-add]' );
		if ( add ) {
			var tpl = $( '#qt-var-tpl' );
			var list = $( '[data-qt-var-list]' );
			list.insertAdjacentHTML( 'beforeend', tpl.innerHTML.replace( /__N__/g, 'n' + Date.now() ) );
			markDirty( list );
		}
		var del = e.target.closest( '[data-qt-var-del]' );
		if ( del ) {
			var row = del.closest( '.qt-var' );
			var list2 = row.parentNode;
			list2.removeChild( row );
			markDirty( list2 );
		}
	} );

	/* Kiểu sản phẩm: hiện / ẩn khung giá đơn và khung mẫu. */
	$$( 'select[name=type][data-qt-ptype]' ).forEach( function ( sel ) {
		var upd = function () {
			$$( '[data-show-type]' ).forEach( function ( el ) { el.hidden = el.getAttribute( 'data-show-type' ) !== sel.value; } );
		};
		sel.addEventListener( 'change', upd );
		upd();
	} );
} )();
