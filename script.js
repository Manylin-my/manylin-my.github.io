// Maylin's blog · 共享脚本：移动端菜单 + 微信一键复制

// 移动端菜单
var menuBtn = document.getElementById('menuBtn');
var navLinks = document.getElementById('navLinks');
if (menuBtn && navLinks) {
  menuBtn.addEventListener('click', function () {
    var open = navLinks.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    menuBtn.textContent = open ? '✕' : '☰';
  });
  navLinks.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') {
      navLinks.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', 'false');
      menuBtn.textContent = '☰';
    }
  });
}

// 项目页：点圆圈（或标题）展开简介
(function () {
  var items = document.querySelectorAll('.tl-item');
  if (!items.length) return;

  Array.prototype.forEach.call(items, function (item) {
    var node = item.querySelector('.tl-node');
    var panel = item.querySelector('.tl-panel');
    var title = item.querySelector('.tl-title');
    if (!node || !panel) return;

    function toggle() {
      var open = item.classList.toggle('open');
      node.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    node.addEventListener('click', function (e) {
      e.stopPropagation();
      toggle();
    });

    if (title) {
      title.addEventListener('click', function (e) {
        e.stopPropagation();
        toggle();
      });
    }

    // 整行也能点，但别拦掉文中的链接
    item.addEventListener('click', function (e) {
      if (e.target.closest('a')) return;
      toggle();
    });
  });
})();

// 项目页：一条手绘虚线，穿过所有图标把它们串起来
// 不是固定图形：按每个图标的真实位置现算路径，所以内容变高、展开简介、换尺寸都跟着走
(function () {
  var tl = document.querySelector('.tl');
  if (!tl) return;
  var svg = tl.querySelector('.tl-line');
  var thread = svg && svg.querySelector('.tl-thread');
  var nodes = Array.prototype.slice.call(tl.querySelectorAll('.tl-node'));
  if (!thread || !nodes.length) return;

  // 用 offset 系列测量，不受 hover / 展开时 transform 的影响
  // （旋转会把 getBoundingClientRect 的外框撑大，路径就会算歪）
  function boxOf(node) {
    var x = 0, y = 0, el = node;
    while (el && el !== tl) { x += el.offsetLeft; y += el.offsetTop; el = el.offsetParent; }
    return {
      x: x + node.offsetWidth / 2,
      y: y + node.offsetHeight / 2,
      rx: node.offsetWidth / 2 - 8,
      ry: node.offsetHeight / 2 - 8
    };
  }

  function draw() {
    var w = tl.clientWidth, h = tl.clientHeight;
    if (!w || !h) return;

    var nodes2 = nodes.map(boxOf);

    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);

    // 从页面顶部探下来，停在第一个图标的上沿（线不压在涂鸦上）
    var d = 'M ' + nodes2[0].x.toFixed(1) + ' -6' +
            ' L ' + nodes2[0].x.toFixed(1) + ' ' + (nodes2[0].y - nodes2[0].ry).toFixed(1);

    for (var i = 0; i < nodes2.length - 1; i++) {
      var a = nodes2[i], b = nodes2[i + 1];

      // 同一列（窄屏单列布局）：直接一段竖线连下去
      if (Math.abs(b.x - a.x) < 2) {
        d += ' M ' + a.x.toFixed(1) + ' ' + (a.y + a.ry).toFixed(1) +
             ' L ' + b.x.toFixed(1) + ' ' + (b.y - b.ry).toFixed(1);
        continue;
      }

      var dir = b.x > a.x ? 1 : -1;       // 往哪边摆
      var ax = a.x + dir * a.rx;          // 从图标边缘出发
      var bx = b.x - dir * b.rx;          // 到图标边缘结束
      var mx = (ax + bx) / 2;             // 中段在页面中央大幅摆开 —— 就是那个大 S
      d += ' M ' + ax.toFixed(1) + ' ' + a.y.toFixed(1) +
           ' C ' + mx.toFixed(1) + ' ' + (a.y + (b.y - a.y) * 0.08).toFixed(1) +
           ', ' + mx.toFixed(1) + ' ' + (b.y - (b.y - a.y) * 0.08).toFixed(1) +
           ', ' + bx.toFixed(1) + ' ' + b.y.toFixed(1);
    }
    thread.setAttribute('d', d);
  }

  draw();
  window.addEventListener('load', draw);
  window.addEventListener('resize', draw);
  if (window.ResizeObserver) {
    new ResizeObserver(function () { draw(); }).observe(tl);
  }
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(draw);
  }
})();

// 一键复制：邮箱 / 微信（凡是带 data-copy 的行都走这里）
// data-copy="要复制的文本"，data-copy-label="提示里的名字"
(function () {
  var hint = document.getElementById('copyHint');
  var rows = Array.prototype.slice.call(document.querySelectorAll('[data-copy]'));
  if (!hint || !rows.length) return;

  // 老路子：临时 textarea + execCommand，file:// 或旧浏览器靠它
  function legacyCopy(text) {
    return new Promise(function (resolve, reject) {
      try {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.top = '-1000px';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        var okFlag = document.execCommand('copy');
        document.body.removeChild(ta);
        if (okFlag) { resolve(); } else { reject(new Error('execCommand failed')); }
      } catch (err) {
        reject(err);
      }
    });
  }

  // 优先用异步剪贴板 API（需要 https 或 localhost），失败再退回老路子
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(function () { return legacyCopy(text); });
    }
    return legacyCopy(text);
  }

  rows.forEach(function (row) {
    row.addEventListener('click', function () {
      var text = row.dataset.copy;
      if (!text) return;
      var label = row.dataset.copyLabel || '内容';
      copyText(text).then(function () {
        hint.textContent = '✅ ' + label + '已复制：' + text;
        row.classList.add('is-copied');
        setTimeout(function () { row.classList.remove('is-copied'); }, 1400);
      }).catch(function () {
        hint.textContent = label + '：' + text + '（浏览器不让自动复制，选中手动复制一下）';
      });
    });
  });
})();

// 设计材料灯箱：点缩略卡放大
// - 单片卡片：data-full="xxx.jpg"，打开就是一张，可在灯箱里滚动看长图
// - 多片卡片：data-slices="img/proto/flower-proto-" + data-slice-count="19"
//   → 灯箱里左右翻页（按钮 / 键盘 ← → / 手机上左右滑）
(function () {
  var thumbs = Array.prototype.slice.call(document.querySelectorAll('.fig-thumb'));
  if (!thumbs.length) return;

  // 一张卡片对应一组图
  function galleryOf(el) {
    var prefix = el.getAttribute('data-slices');
    if (prefix) {
      var n = parseInt(el.getAttribute('data-slice-count'), 10) || 0;
      var ext = el.getAttribute('data-ext') || '.jpg';
      var list = [];
      for (var i = 1; i <= n; i++) list.push(prefix + (i < 10 ? '0' + i : String(i)) + ext);
      return list;
    }
    var full = el.getAttribute('data-full');
    return full ? [full] : [];
  }

  var lb = document.createElement('div');
  lb.className = 'lightbox';
  lb.innerHTML =
    '<button class="lb-nav lb-prev" type="button" aria-label="上一张">←</button>' +
    '<div class="lb-stage">' +
      '<div class="lb-view"><img alt="" /></div>' +
      '<div class="lb-bar">' +
        '<span class="lb-cap"></span>' +
        '<span class="lb-count"></span>' +
        '<button class="lb-close" type="button">关闭 ✕</button>' +
      '</div>' +
    '</div>' +
    '<button class="lb-nav lb-next" type="button" aria-label="下一张">→</button>';
  document.body.appendChild(lb);

  var view = lb.querySelector('.lb-view');
  var img = lb.querySelector('.lb-view img');
  var cap = lb.querySelector('.lb-cap');
  var count = lb.querySelector('.lb-count');
  var prev = lb.querySelector('.lb-prev');
  var next = lb.querySelector('.lb-next');

  var cur = [];       // 当前这组图
  var names = [];     // 每片的名称（可选）
  var idx = 0;        // 当前第几张
  var base = '';      // 卡片上的标题
  var altBase = '';   // 图片替代文本
  var fitSingle = false; // 单图也要整屏适配（照片类，别放大到糊）

  function show(i) {
    if (!cur.length) return;
    idx = (i + cur.length) % cur.length;
    img.src = cur[idx];
    img.alt = names[idx] ? (base + ' · ' + names[idx])
              : (cur.length > 1 ? altBase + ' 第 ' + (idx + 1) + ' 屏' : altBase);
    var label = names[idx] || (cur.length > 1 ? '第 ' + (idx + 1) + ' 屏' : '');
    cap.textContent = base + (label ? '　·　' + label : '');
    count.textContent = cur.length > 1 ? (idx + 1) + ' / ' + cur.length : '';
    view.classList.remove('zoom');
    view.scrollTop = 0;
    var multi = cur.length > 1;
    prev.classList.toggle('show', multi);
    next.classList.toggle('show', multi);
    view.classList.toggle('fit', multi || fitSingle);
  }

  function open(i) {
    var t = thumbs[i];
    var g = galleryOf(t);
    if (!g.length) return;
    cur = g;
    fitSingle = t.getAttribute('data-fit') === 'true';
    base = t.getAttribute('data-caption') || '';
    var cs = t.getAttribute('data-captions');
    names = cs ? cs.split('|') : [];
    var ti = t.querySelector('img');
    altBase = ti ? ti.alt : base;
    show(0);
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function close() { lb.classList.remove('open'); document.body.style.overflow = ''; }

  thumbs.forEach(function (t, i) {
    if (!galleryOf(t).length) return;
    t.addEventListener('click', function () { open(i); });
  });
  lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
  // 点图：在「整屏适配」与「原尺寸可拖动」之间切换
  img.addEventListener('click', function () {
    if (!cur.length) return;
    view.classList.toggle('zoom');
    view.scrollTop = 0;
    view.scrollLeft = 0;
  });
  lb.querySelector('.lb-close').addEventListener('click', close);
  prev.addEventListener('click', function () { show(idx - 1); });
  next.addEventListener('click', function () { show(idx + 1); });
  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(idx - 1);
    if (e.key === 'ArrowRight') show(idx + 1);
  });

  // 手机上左右滑
  var tx = 0, ty = 0;
  lb.addEventListener('touchstart', function (e) {
    tx = e.changedTouches[0].clientX;
    ty = e.changedTouches[0].clientY;
  }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    if (cur.length < 2) return;
    var dx = e.changedTouches[0].clientX - tx;
    var dy = e.changedTouches[0].clientY - ty;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) show(idx + (dx < 0 ? 1 : -1));
  }, { passive: true });
})();
