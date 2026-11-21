/* Trang quản trị /quan-tri/ – không cần build, chạy trên mọi trình duyệt hiện đại. */
( function () {
	'use strict';

	var $ = function ( sel, root ) { return ( root || document ).querySelector( sel ); };
	var $$ = function ( sel, root ) { return Array.prototype.slice.call( ( root || document ).querySelectorAll( sel ) ); };
	var ICON = {
		up: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>',
		down: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>',
		trash: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>',
		plus: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="M12 5v14"/></svg>'
	};

	/* ---- Menu trên điện thoại ------------------------------------------- */
	document.addEventListener( 'click', function ( e ) {
		if ( e.target.closest( '[data-qt-menu]' ) ) {
			document.body.classList.add( 'qt-menu-open' );
		} else if ( e.target.closest( '[data-qt-close]' ) ) {
			document.body.classList.remove( 'qt-menu-open' );
		}
		var dismiss = e.target.closest( '[data-qt-dismiss]' );
		if ( dismiss ) {
			dismiss.closest( '.qt-flash' ).remove();
		}
	} );
	document.addEventListener( 'keydown', function ( e ) {
		if ( 'Escape' === e.key ) {
			document.body.classList.remove( 'qt-menu-open' );
		}
	} );

	/* ---- Hiện / ẩn mật khẩu ------------------------------------------- */
	document.addEventListener( 'click', function ( e ) {
		var btn = e.target.closest( '[data-qt-pass]' );
		if ( ! btn ) {
			return;
		}
		var wrap = btn.closest( '.qt-pass' );
		var input = $( 'input', wrap );
		var show = 'password' === input.type;
		input.type = show ? 'text' : 'password';
		wrap.classList.toggle( 'is-shown', show );
		btn.setAttribute( 'aria-label', show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu' );
		btn.title = btn.getAttribute( 'aria-label' );
		input.focus();
	} );

	/* ---- Bấm cả dòng trong bảng để mở --------------------------------- */
	document.addEventListener( 'click', function ( e ) {
		var row = e.target.closest( 'tr[data-href]' );
		if ( ! row || e.target.closest( 'a, button, form, input, select, label, summary, details' ) ) {
			return;
		}
		if ( e.metaKey || e.ctrlKey ) {
			window.open( row.getAttribute( 'data-href' ), '_blank' );
		} else {
			window.location.href = row.getAttribute( 'data-href' );
		}
	} );

	/* ---- Hộp xác nhận ------------------------------------------------------ */
	function ask( message, onYes, danger ) {
		var dlg = document.createElement( 'dialog' );
		if ( ! dlg.showModal ) {
			if ( window.confirm( message ) ) {
				onYes();
			}
			return;
		}
		dlg.className = 'qt-dialog';
		dlg.innerHTML = '<div class="qt-dialog-body"><h3>Xác nhận</h3><p></p></div><div class="qt-dialog-foot"><button type="button" class="qt-btn qt-btn-ghost" value="no">Không</button><button type="button" class="qt-btn' + ( danger ? ' is-danger qt-btn-ghost' : '' ) + '" value="yes">Đồng ý</button></div>';
		$( 'p', dlg ).textContent = message;
		document.body.appendChild( dlg );
		dlg.addEventListener( 'click', function ( e ) {
			var b = e.target.closest( 'button' );
			if ( b ) {
				dlg.close();
				if ( 'yes' === b.value ) {
					onYes();
				}
			} else if ( e.target === dlg ) {
				dlg.close();
			}
		} );
		dlg.addEventListener( 'close', function () { dlg.remove(); } );
		dlg.showModal();
		$( 'button[value="yes"]', dlg ).focus();
	}

	document.addEventListener( 'click', function ( e ) {
		var btn = e.target.closest( '[data-confirm]' );
		if ( ! btn || btn.hasAttribute( 'data-confirmed' ) ) {
			return;
		}
		e.preventDefault();
		ask( btn.getAttribute( 'data-confirm' ), function () {
			btn.setAttribute( 'data-confirmed', '1' );
			btn.click();
		}, btn.classList.contains( 'is-danger' ) );
	} );

	// Chống bấm gửi 2 lần.
	document.addEventListener( 'submit', function ( e ) {
		var f = e.target;
		if ( f.getAttribute( 'method' ) !== 'post' ) {
			return;
		}
		if ( f.dataset.sending ) {
			e.preventDefault();
			return;
		}
		f.dataset.sending = '1';
		$$( 'button[type="submit"]', f ).forEach( function ( b ) { b.style.opacity = '.6'; } );
	} );

	/* ---- Ô số tiền: 490000 → 490.000 ------------------------------------ */
	function money( v ) {
		var d = String( v ).replace( /\D/g, '' ).replace( /^0+(?=\d)/, '' );
		return d.replace( /\B(?=(\d{3})+(?!\d))/g, '.' );
	}
	document.addEventListener( 'input', function ( e ) {
		if ( e.target.matches( '[data-qt-money]' ) ) {
			var end = e.target.value.length - e.target.selectionEnd;
			e.target.value = money( e.target.value );
			var pos = Math.max( 0, e.target.value.length - end );
			e.target.setSelectionRange( pos, pos );
		}
		if ( e.target.matches( '.qt-color input' ) ) {
			e.target.nextElementSibling.textContent = e.target.value;
		}
	} );

	/* ---- Chọn ảnh từ Thư viện ------------------------------------------ */
	document.addEventListener( 'click', function ( e ) {
		var pick = e.target.closest( '[data-qt-image-pick]' );
		var clear = e.target.closest( '[data-qt-image-clear]' );
		var box = ( pick || clear ) && ( pick || clear ).closest( '[data-qt-image]' );
		if ( ! box ) {
			return;
		}
		e.preventDefault();
		var input = $( 'input', box );
		var preview = $( '.qt-image-preview', box );
		if ( clear ) {
			input.value = '';
			preview.innerHTML = '';
			input.dispatchEvent( new Event( 'input', { bubbles: true } ) );
			return;
		}
		// Bản Node: chọn ảnh từ máy rồi tải lên /quan-tri/tai-anh/.
		var file = document.createElement( 'input' );
		file.type = 'file';
		file.accept = 'image/jpeg,image/png,image/webp,image/gif';
		file.addEventListener( 'change', function () {
			if ( ! file.files || ! file.files[0] ) {
				return;
			}
			var fd = new FormData();
			fd.append( 'file', file.files[0] );
			pick.disabled = true;
			pick.textContent = 'Đang tải…';
			fetch( '/quan-tri/tai-anh/', { method: 'POST', body: fd, credentials: 'same-origin' } )
				.then( function ( r ) { return r.json(); } )
				.then( function ( r ) {
					if ( ! r.ok ) {
						window.alert( r.msg || 'Chưa tải được ảnh.' );
						return;
					}
					input.value = r.url;
					preview.innerHTML = '<img src="' + r.url + '" alt="">';
					input.dispatchEvent( new Event( 'input', { bubbles: true } ) );
				} )
				.catch( function () { window.alert( 'Chưa tải được ảnh. Thử lại nhé.' ); } )
				.then( function () { pick.disabled = false; pick.textContent = 'Tải ảnh lên'; } );
		} );
		file.click();
	} );

	/* ---- Cảnh báo khi rời trang chưa lưu -------------------------------- */
	$$( 'form[data-qt-dirty]' ).forEach( function ( form ) {
		var bar = $( '.qt-savebar', form );
		var note = $( '[data-qt-dirty-note]', form );
		var dirty = false;
		function mark() {
			if ( dirty ) {
				return;
			}
			dirty = true;
			if ( bar ) {
				bar.classList.add( 'is-dirty' );
			}
			if ( note ) {
				note.textContent = 'Có thay đổi chưa lưu';
			}
		}
		form.addEventListener( 'input', mark );
		form.addEventListener( 'change', mark );
		form.addEventListener( 'qt-change', mark );
		form.addEventListener( 'submit', function () { dirty = false; } );
		window.addEventListener( 'beforeunload', function ( e ) {
			if ( dirty ) {
				e.preventDefault();
				e.returnValue = '';
			}
		} );
	} );

	/* ---- Ô nhập sai nằm trong tab đang ẩn: mở tab đó ra --------------- */
	document.addEventListener( 'invalid', function ( e ) {
		var panel = e.target.closest && e.target.closest( '.qt-tab-panel[hidden]' );
		if ( panel ) {
			var link = document.querySelector( '[data-qt-tabs] a[data-tab="' + panel.getAttribute( 'data-panel' ) + '"]' );
			if ( link ) {
				link.click();
			}
		}
		var form = e.target.form;
		if ( form ) {
			delete form.dataset.sending;
		}
	}, true );

	/* ---- Tab trong Cài đặt -------------------------------------------- */
	$$( '[data-qt-tabs]' ).forEach( function ( nav ) {
		var form = nav.closest( 'form' );
		nav.addEventListener( 'click', function ( e ) {
			var a = e.target.closest( 'a[data-tab]' );
			if ( ! a ) {
				return;
			}
			e.preventDefault();
			var tab = a.getAttribute( 'data-tab' );
			$$( 'a', nav ).forEach( function ( x ) { x.classList.toggle( 'is-active', x === a ); } );
			$$( '.qt-tab-panel', form ).forEach( function ( p ) { p.hidden = p.getAttribute( 'data-panel' ) !== tab; } );
			$( '[data-qt-tab-input]', form ).value = tab;
			if ( window.history.replaceState ) {
				window.history.replaceState( null, '', a.href );
			}
		} );
	} );

	/* ======================================================================
	 * Bộ sửa giáo trình
	 * ==================================================================== */
	var box = $( '[data-qt-curriculum]' );
	var store = $( '[data-qt-curriculum-input]' );
	if ( box && store ) {
		var data;
		try {
			data = JSON.parse( store.value ) || [];
		} catch ( err ) {
			data = [];
		}
		data = data.map( function ( ch ) {
			return { title: ch.title || '', lessons: ( ch.lessons || [] ).map( function ( l ) {
				return { title: l.title || '', duration: l.duration || '', type: 'doc' === l.type ? 'doc' : 'video', video: l.video || '', free: !! l.free };
			} ) };
		} );
		var countEl = $( '[data-qt-curriculum-count]' );

		var save = function ( structural ) {
			store.value = JSON.stringify( data );
			var n = 0;
			data.forEach( function ( ch ) { n += ch.lessons.length; } );
			if ( countEl ) {
				countEl.textContent = n + ' bài';
			}
			store.dispatchEvent( new Event( 'qt-change', { bubbles: true } ) );
			if ( structural ) {
				render();
			}
		};

		var el = function ( tag, attrs, html ) {
			var x = document.createElement( tag );
			Object.keys( attrs || {} ).forEach( function ( k ) {
				if ( 'class' === k ) {
					x.className = attrs[ k ];
				} else {
					x.setAttribute( k, attrs[ k ] );
				}
			} );
			if ( html ) {
				x.innerHTML = html;
			}
			return x;
		};

		var iconBtn = function ( icon, label, fn, disabled, danger ) {
			var b = el( 'button', { type: 'button', class: 'qt-icon-btn' + ( danger ? ' is-danger' : '' ), title: label, 'aria-label': label }, ICON[ icon ] );
			b.disabled = !! disabled;
			b.addEventListener( 'click', fn );
			return b;
		};

		var flashAt = function ( selector ) {
			window.requestAnimationFrame( function () {
				var t = $( selector, box );
				if ( t ) {
					t.classList.add( 'is-flash' );
					var inp = $( 'input', t );
					if ( inp ) {
						inp.focus();
					}
				}
			} );
		};

		var render = function () {
			box.innerHTML = '';
			var n = 0;
			data.forEach( function ( ch, ci ) {
				var wrap = el( 'div', { class: 'qt-ch', 'data-ch': ci } );
				var head = el( 'div', { class: 'qt-ch-head' } );
				head.appendChild( el( 'span', { class: 'qt-ch-num' }, 'Chương ' + ( ci + 1 ) ) );
				var title = el( 'input', { type: 'text', value: ch.title, placeholder: 'Tên chương', 'aria-label': 'Tên chương ' + ( ci + 1 ) } );
				title.value = ch.title;
				title.addEventListener( 'input', function () { ch.title = title.value; save(); } );
				head.appendChild( title );
				var tools = el( 'div', { class: 'qt-ch-tools' } );
				tools.appendChild( iconBtn( 'up', 'Đưa chương lên', function () { data.splice( ci - 1, 0, data.splice( ci, 1 )[ 0 ] ); save( true ); }, 0 === ci ) );
				tools.appendChild( iconBtn( 'down', 'Đưa chương xuống', function () { data.splice( ci + 1, 0, data.splice( ci, 1 )[ 0 ] ); save( true ); }, ci === data.length - 1 ) );
				tools.appendChild( iconBtn( 'trash', 'Xóa chương', function () {
					var go = function () { data.splice( ci, 1 ); save( true ); };
					if ( ch.lessons.length ) {
						ask( 'Xóa chương “' + ( ch.title || 'Chương ' + ( ci + 1 ) ) + '” cùng ' + ch.lessons.length + ' bài học bên trong?', go, true );
					} else {
						go();
					}
				}, false, true ) );
				head.appendChild( tools );
				wrap.appendChild( head );

				var ul = el( 'ol', { class: 'qt-lessons' } );
				ch.lessons.forEach( function ( l, li ) {
					n++;
					var num = n;
					var row = el( 'li', { class: 'qt-ls', 'data-ls': ci + '-' + li } );
					row.appendChild( el( 'span', { class: 'qt-ls-n', title: 'Bài ' + num }, String( num ) ) );

					var f = el( 'div', { class: 'qt-ls-fields' } );
					var t = el( 'input', { type: 'text', class: 'is-title', placeholder: 'Tên bài học', 'aria-label': 'Tên bài ' + num } );
					t.value = l.title;
					t.addEventListener( 'input', function () { l.title = t.value; save(); } );
					var d = el( 'input', { type: 'text', placeholder: '05:30', 'aria-label': 'Thời lượng bài ' + num, title: 'Thời lượng (phút:giây)' } );
					d.value = l.duration;
					d.addEventListener( 'input', function () { l.duration = d.value; save(); } );
					var s = el( 'input', { type: 'url', class: 'is-src', placeholder: 'doc' === l.type ? 'Link tài liệu (Google Drive, PDF…)' : 'Link video (YouTube, Vimeo, Google Drive, Bunny…)', 'aria-label': 'Link bài ' + num } );
					s.value = l.video;
					s.addEventListener( 'input', function () { l.video = s.value.trim(); save(); } );
					f.appendChild( t );
					f.appendChild( d );
					f.appendChild( s );

					var opts = el( 'div', { class: 'qt-ls-opts' } );
					var type = el( 'select', { 'aria-label': 'Loại bài ' + num }, '<option value="video">Video</option><option value="doc">Tài liệu</option>' );
					type.value = l.type;
					type.addEventListener( 'change', function () { l.type = type.value; s.placeholder = 'doc' === l.type ? 'Link tài liệu (Google Drive, PDF…)' : 'Link video (YouTube, Vimeo, Google Drive, Bunny…)'; save(); } );
					var freeLab = el( 'label' );
					var free = el( 'input', { type: 'checkbox' } );
					free.checked = 1 === num ? true : l.free;
					free.disabled = 1 === num;
					free.addEventListener( 'change', function () { l.free = free.checked; save(); } );
					freeLab.appendChild( free );
					freeLab.appendChild( document.createTextNode( 1 === num ? ' Học thử miễn phí (bài 1 luôn mở)' : ' Cho học thử miễn phí' ) );
					opts.appendChild( type );
					opts.appendChild( freeLab );
					f.appendChild( opts );
					row.appendChild( f );

					var lt = el( 'div', { class: 'qt-ls-tools' } );
					var first = 0 === ci && 0 === li;
					var last = ci === data.length - 1 && li === ch.lessons.length - 1;
					lt.appendChild( iconBtn( 'up', 'Đưa bài lên', function () {
						if ( li > 0 ) {
							ch.lessons.splice( li - 1, 0, ch.lessons.splice( li, 1 )[ 0 ] );
						} else {
							data[ ci - 1 ].lessons.push( ch.lessons.shift() ); // Sang cuối chương trước.
						}
						save( true );
					}, first ) );
					lt.appendChild( iconBtn( 'down', 'Đưa bài xuống', function () {
						if ( li < ch.lessons.length - 1 ) {
							ch.lessons.splice( li + 1, 0, ch.lessons.splice( li, 1 )[ 0 ] );
						} else {
							data[ ci + 1 ].lessons.unshift( ch.lessons.pop() ); // Sang đầu chương sau.
						}
						save( true );
					}, last ) );
					lt.appendChild( iconBtn( 'trash', 'Xóa bài', function () {
						var go = function () { ch.lessons.splice( li, 1 ); save( true ); };
						if ( l.title || l.video ) {
							ask( 'Xóa bài ' + num + ( l.title ? ' “' + l.title + '”' : '' ) + '?', go, true );
						} else {
							go();
						}
					}, false, true ) );
					row.appendChild( lt );
					ul.appendChild( row );
				} );
				wrap.appendChild( ul );

				var foot = el( 'div', { class: 'qt-ch-foot' } );
				var add = el( 'button', { type: 'button', class: 'qt-add' }, ICON.plus + ' Thêm bài vào chương này' );
				add.addEventListener( 'click', function () {
					ch.lessons.push( { title: '', duration: '', type: 'video', video: '', free: false } );
					save( true );
					flashAt( '[data-ls="' + ci + '-' + ( ch.lessons.length - 1 ) + '"]' );
				} );
				foot.appendChild( add );
				wrap.appendChild( foot );
				box.appendChild( wrap );
			} );

			var addCh = el( 'button', { type: 'button', class: 'qt-add is-big' }, ICON.plus + ' Thêm chương mới' );
			addCh.addEventListener( 'click', function () {
				data.push( { title: 'Chương ' + ( data.length + 1 ), lessons: [ { title: '', duration: '', type: 'video', video: '', free: false } ] } );
				save( true );
				flashAt( '[data-ch="' + ( data.length - 1 ) + '"]' );
			} );
			box.appendChild( addCh );
		};

		render();
	}
}() );
