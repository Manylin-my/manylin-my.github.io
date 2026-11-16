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
