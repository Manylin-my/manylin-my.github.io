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

// 微信一键复制
var copyBtn = document.getElementById('copyWx');
var hint = document.getElementById('copyHint');
if (copyBtn && hint) {
  copyBtn.addEventListener('click', function () {
    var wx = copyBtn.dataset.wx;
    function ok() { hint.textContent = '✅ 微信号已复制：' + wx; }
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = wx;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); ok(); }
      catch (err) { hint.textContent = '微信号：' + wx + '（请手动复制）'; }
      document.body.removeChild(ta);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(wx).then(ok).catch(fallback);
    } else {
      fallback();
    }
  });
}
