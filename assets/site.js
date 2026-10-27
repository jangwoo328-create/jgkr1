(function () {
  // 모바일 메뉴 열기/닫기
  var hd = document.querySelector('.hd');
  var btn = document.querySelector('.menu-btn');
  if (hd && btn) {
    var setMenu = function (open) {
      if (open) hd.setAttribute('data-state', 'active'); else hd.removeAttribute('data-state');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
    };
    btn.addEventListener('click', function () { setMenu(hd.getAttribute('data-state') !== 'active'); });
    hd.querySelectorAll('.drawer a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  }

  // 원통형 회전 사진: 저절로 돌고, 손가락·마우스로 밀어서 돌릴 수 있음
  var STEP = 2, SPACING = 58.7654, VIS = 63.7, R = '90cqw', SLICES = 16, SW = 5.3918;
  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  var spins = [];
  document.querySelectorAll('.spin').forEach(function (host) {
    var imgs = Array.prototype.slice.call(host.querySelectorAll('.spin-src img'));
    var N = imgs.length; if (!N) return;
    var ratio = parseFloat(host.getAttribute('data-ratio')) || 0.667;
    var tileH = 86.2696 * ratio;
    host.style.aspectRatio = '100 / ' + (tileH + 8.6).toFixed(3);
    var stage = host.querySelector('.spin-stage');
    var tiles = imgs.map(function (img) {
      var t = document.createElement('div'); t.className = 'spin-tile';
      t.style.height = tileH.toFixed(4) + 'cqw'; t.style.top = 'calc(50% - ' + (tileH / 2).toFixed(4) + 'cqw)';
      for (var k = 0; k < SLICES; k++) {
        var sl = document.createElement('i'); sl.className = 'spin-sl';
        var a = (-25.7442 + k * 3.43256).toFixed(4);
        sl.style.transform = 'translateZ(-' + R + ') rotateY(' + a + 'deg) translateZ(' + R + ')';
        sl.style.backgroundImage = 'url("' + img.getAttribute('src') + '")';
        sl.style.backgroundSize = '86.2696cqw ' + tileH.toFixed(4) + 'cqw';
        sl.style.backgroundPosition = '-' + (k * SW).toFixed(4) + 'cqw 0';
        t.appendChild(sl);
      }
      stage.appendChild(t); return t;
    });
    var SWEEP = SPACING * N / 2, DUR = N * STEP, HIDE = Math.max(0, 0.5 - VIS / (2 * SWEEP));
    var st = { ph: N, hover: false, drag: false, lastX: 0, lastT: 0, vel: 0, tween: null, seen: true, front: -1 };
    var cap = host.nextElementSibling && host.nextElementSibling.classList.contains('spin-cap') ? host.nextElementSibling : null;
    if (!cap) { cap = document.createElement('p'); cap.className = 'spin-cap'; cap.setAttribute('aria-hidden', 'true'); host.parentNode.insertBefore(cap, host.nextSibling); }
    host.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') st.hover = true; });
    host.addEventListener('pointerleave', function () { st.hover = false; });
    host.addEventListener('pointerdown', function (e) {
      st.drag = true; st.tween = null; st.lastX = e.clientX; st.lastT = performance.now(); st.vel = 0; host.classList.add('grabbing');
      try { host.setPointerCapture(e.pointerId); } catch (x) {}
    });
    host.addEventListener('pointermove', function (e) {
      if (!st.drag) return;
      var now = performance.now(), dx = e.clientX - st.lastX, dt = Math.max(1, now - st.lastT) / 1000;
      var d = (-dx / (host.clientWidth * 0.8)) * STEP * 1.6;
      st.ph += d; st.vel = d / dt * 0.6 + st.vel * 0.4; st.lastX = e.clientX; st.lastT = now;
    });
    var up = function () { st.drag = false; host.classList.remove('grabbing'); };
    host.addEventListener('pointerup', up); host.addEventListener('pointercancel', up);
    var nudge = function (dir) { st.vel = 0; var f = Math.round((st.ph - DUR / 2) / STEP); st.tween = { from: st.ph, to: DUR / 2 + STEP * (f + dir), t: 0 }; };
    host.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); nudge(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); nudge(-1); }
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { st.seen = en[0].isIntersecting; }, { rootMargin: '100px' }).observe(host);
    }
    var draw = function () {
      var best = 1, bi = 0;
      tiles.forEach(function (el, i) {
        var p = ((((st.ph - i * STEP) / DUR) % 1) + 1) % 1;
        var a = SWEEP - 2 * SWEEP * p;
        el.style.transform = 'translateZ(-' + R + ') rotateY(' + a.toFixed(3) + 'deg) translateZ(' + R + ')';
        el.style.visibility = (p > HIDE && p < 1 - HIDE) ? 'visible' : 'hidden';
        var off = Math.abs(p - 0.5); if (off < best) { best = off; bi = i; }
      });
      if (bi !== st.front) {
        st.front = bi; cap.textContent = '';
        var b = document.createElement('b'); b.textContent = imgs[bi].getAttribute('data-cap') || imgs[bi].alt;
        var n = document.createElement('span'); n.textContent = (bi + 1) + ' / ' + N;
        cap.appendChild(b); cap.appendChild(n);
      }
    };
    draw();
    spins.push({
      host: host, nudge: nudge,
      tick: function (dt) {
        if (!st.seen && !st.drag && !st.tween) return;
        if (st.tween) {
          st.tween.t = Math.min(1, st.tween.t + dt / 0.6);
          var k = 1 - Math.pow(1 - st.tween.t, 3);
          st.ph = st.tween.from + (st.tween.to - st.tween.from) * k;
          if (st.tween.t >= 1) st.tween = null;
        } else if (!st.drag) {
          st.ph += st.vel * dt; st.vel *= Math.pow(0.04, dt); if (Math.abs(st.vel) < 0.02) st.vel = 0;
          if (!st.hover && !reduce) st.ph += dt;
        }
        draw();
      }
    });
  });
  document.querySelectorAll('[data-spin]').forEach(function (b) {
    b.addEventListener('click', function () {
      var host = b.closest('.gallery') && b.closest('.gallery').querySelector('.spin');
      spins.forEach(function (s) { if (s.host === host) s.nudge(b.getAttribute('data-spin') === 'next' ? 1 : -1); });
    });
  });
  if (spins.length) {
    var last = performance.now();
    var loop = function (now) {
      var dt = Math.min(0.1, (now - last) / 1000); last = now;
      if (!document.hidden) spins.forEach(function (s) { s.tick(dt); });
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  // 안내 메시지
  function toast(msg) {
    var t = document.createElement('div');
    t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2200);
  }

  // 칼럼: 공유하기
  var share = document.querySelector('[data-share]');
  if (share) {
    share.addEventListener('click', function () {
      var url = location.href.split('#')[0];
      if (navigator.share) {
        navigator.share({ title: document.title, url: url }).catch(function () {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(function () { toast('글 주소를 복사했습니다'); }, function () { toast(url); });
      } else { toast(url); }
    });
  }

  // 칼럼: 글자 크기 (보통 → 크게 → 아주 크게)
  var prose = document.querySelector('.prose');
  var fsBtn = document.querySelector('[data-font]');
  if (prose && fsBtn) {
    var labels = ['보통', '크게', '아주 크게'];
    var lv = 0;
    try { lv = parseInt(localStorage.getItem('jg-font') || '0', 10) || 0; } catch (e) {}
    var apply = function () {
      prose.setAttribute('data-size', String(lv));
      fsBtn.setAttribute('aria-label', '글자 크기: ' + labels[lv]);
    };
    apply();
    fsBtn.addEventListener('click', function () {
      lv = (lv + 1) % 3; apply(); toast('글자 크기: ' + labels[lv]);
      try { localStorage.setItem('jg-font', String(lv)); } catch (e) {}
    });
  }
  // 빠른 메뉴 버튼: 일정 이상 스크롤하면 나타남
  var fab = document.getElementById('fab');
  if (fab) {
    var fbtn = fab.querySelector('.fab-btn'), fmenu = document.getElementById('fab-menu');
    var setFab = function (open) {
      fmenu.hidden = !open;
      fbtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      fbtn.setAttribute('aria-label', open ? '빠른 메뉴 닫기' : '빠른 메뉴 열기');
    };
    setFab(false);
    var onScroll = function () {
      var show = window.scrollY > 560;
      if (fab.hidden === show) { fab.hidden = !show; if (!show) setFab(false); }
    };
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
    fbtn.addEventListener('click', function () { setFab(fmenu.hidden); });
    fmenu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setFab(false); }); });
    fab.querySelector('[data-totop]').addEventListener('click', function () {
      setFab(false);
      try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) { window.scrollTo(0, 0); }
    });
    document.addEventListener('click', function (e) { if (!fab.contains(e.target)) setFab(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setFab(false); });
  }

  // 진료시간 링크: 진료시간 안내를 화면 가운데로
  var hours = document.getElementById('hours');
  if (hours) {
    var showHours = function (smooth) {
      try { hours.scrollIntoView({ block: 'center', behavior: smooth && !reduce ? 'smooth' : 'auto' }); }
      catch (e) { hours.scrollIntoView(); }
      hours.classList.remove('flash'); void hours.offsetWidth; hours.classList.add('flash');
    };
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href="#hours"]');
      if (!a) return;
      e.preventDefault();
      if (hd) hd.removeAttribute('data-state');
      try { history.replaceState(null, '', '#hours'); } catch (x) {}
      showHours(true);
    });
    if (location.hash === '#hours') {
      window.addEventListener('load', function () { setTimeout(function () { showHours(false); }, 60); });
    }
  }
})();
