/** 应用外壳：手机框、底部导航、路由与登录门控 */
(function () {
const app = window.HJ.app;
const store = window.HJ.store;
const { renderLogin } = window.HJ.pageLogin;
const { renderHome, openRecorder } = window.HJ.pageHome;
const { renderMambo } = window.HJ.pageMambo;
const { renderCommunity } = window.HJ.pageCommunity;
const { renderMe } = window.HJ.pageMe;
const { setEnabled, play } = window.HJ.audio;
const { toast } = window.HJ.ui;

const TABS = [
  { key: 'home', icon: '🏠', name: '首页' },
  { key: 'community', icon: '🌐', name: '社区' },
  { key: 'mambo', icon: '🐹', name: '曼波' },
  { key: 'me', icon: '🙋', name: '我的' },
];

let current = 'home';

function shell() {
  return `
    <div class="phone">
      <div class="screen">
        <div class="statusbar">
          <span id="clock">--:--</span>
          <span class="sb-right">📶 🔋 100%</span>
        </div>
        <div id="view" class="view"></div>
        <nav class="tabbar">
          ${TABS.map(t => `
            <button class="tab ${t.key === current ? 'on' : ''}" data-tab="${t.key}">
              <span class="ti">${t.icon}</span><span class="tn">${t.name}</span>
            </button>`).join('')}
        </nav>
      </div>
    </div>`;
}

function bindTabs() {
  document.querySelectorAll('[data-tab]').forEach(b => {
    b.onclick = () => { play('tap'); go(b.dataset.tab); };
  });
  tickClock();
  setInterval(tickClock, 30000);
}
function tickClock() {
  const el = document.getElementById('clock');
  if (!el) return;
  const d = new Date();
  el.textContent = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function markTab() {
  document.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === current));
}

async function render() {
  const view = document.getElementById('view');
  if (!view) return;
  view.scrollTop = 0;
  try {
    if (current === 'home') await renderHome(view);
    else if (current === 'community') await renderCommunity(view);
    else if (current === 'mambo') await renderMambo(view);
    else await renderMe(view);
  } catch (e) {
    view.innerHTML = `<div class="empty">页面渲染出错了：${e.message}</div>`;
    console.error(e);
  }
  markTab();
}

async function go(tab) { current = tab; await render(); }
async function refresh() { await app.load(); await render(); }

function showLogin() {
  let layer = document.getElementById('loginLayer');
  if (!layer) {
    layer = document.createElement('div');
    layer.id = 'loginLayer';
    layer.className = 'login-layer';
    document.body.appendChild(layer);
  }
  renderLogin(layer, async () => {
    layer.classList.add('out');
    setTimeout(() => layer.remove(), 260);
    await store.logAction('登录账号');
    await refresh();
  });
}

async function boot() {
  await app.load();
  setEnabled(app.settings.soundOn !== false);
  app.go = go;
  app.refresh = refresh;
  app.openRecorder = openRecorder;

  const root = document.getElementById('root');
  root.innerHTML = shell();
  bindTabs();

  if (!app.user || !app.user.loginMethod || !app.character) showLogin();
  else await render();

  // 长时间未记录的嗝屁风险提醒
  setTimeout(async () => {
    await app.load();
    if (!app.character) return;
    const r = store.riskLevel(app.character.id);
    if (r >= 2) {
      toast(r >= 3 ? '⚠️ 嗝屁风险！你很久没记录了' : '哈基米：你终于回来了…',
        { icon: r >= 3 ? '💀' : '🥺', duration: 3200 });
      play('danger');
    }
  }, 900);
}

boot();
})();
