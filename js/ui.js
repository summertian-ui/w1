window.HJ = window.HJ || {};
(function () {
/** 通用 UI 组件：toast / 弹层 / 确认框 / 时间格式化 */

let toastTimer = null;
function toast(msg, { icon = '', duration = 2200 } = {}) {
  let el = document.getElementById('__toast');
  if (!el) {
    el = document.createElement('div');
    el.id = '__toast';
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.innerHTML = `<span class="toast-icon">${icon}</span><span>${msg}</span>`;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), duration);
}

/** 底部弹出层，content 为 HTML 字符串；返回关闭函数 */
function sheet(title, contentHTML, { onMount, full = false } = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'mask';
  wrap.innerHTML = `
    <div class="sheet ${full ? 'full' : ''}">
      <div class="sheet-bar"></div>
      <div class="sheet-head">
        <h3>${title || ''}</h3>
        <button class="sheet-close" aria-label="关闭">✕</button>
      </div>
      <div class="sheet-body">${contentHTML}</div>
    </div>`;
  document.body.appendChild(wrap);
  requestAnimationFrame(() => wrap.classList.add('show'));
  const close = () => {
    wrap.classList.remove('show');
    setTimeout(() => wrap.remove(), 220);
  };
  wrap.querySelector('.sheet-close').onclick = close;
  wrap.addEventListener('click', e => { if (e.target === wrap) close(); });
  if (onMount) onMount(wrap.querySelector('.sheet-body'), close);
  return close;
}

function confirmBox(title, msg, okText = '确定') {
  return new Promise(resolve => {
    const wrap = document.createElement('div');
    wrap.className = 'mask';
    wrap.innerHTML = `
      <div class="dialog">
        <h3>${title}</h3>
        <p>${msg}</p>
        <div class="dialog-btns">
          <button class="btn ghost" data-no>取消</button>
          <button class="btn primary" data-yes>${okText}</button>
        </div>
      </div>`;
    document.body.appendChild(wrap);
    requestAnimationFrame(() => wrap.classList.add('show'));
    const done = v => { wrap.classList.remove('show'); setTimeout(() => wrap.remove(), 200); resolve(v); };
    wrap.querySelector('[data-no]').onclick = () => done(false);
    wrap.querySelector('[data-yes]').onclick = () => done(true);
    wrap.addEventListener('click', e => { if (e.target === wrap) done(false); });
  });
}

function ago(iso) {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return '刚刚';
  if (d < 3600) return `${Math.floor(d / 60)} 分钟前`;
  if (d < 86400) return `${Math.floor(d / 3600)} 小时前`;
  if (d < 86400 * 7) return `${Math.floor(d / 86400)} 天前`;
  return new Date(iso).toLocaleDateString('zh-CN');
}
function hhmm(iso) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
function esc(s = '') {
  return String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  window.HJ.ui = { toast, sheet, confirmBox, ago, hhmm, esc, $, $$ };
})();
