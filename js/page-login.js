/** 登录模块：微信 / QQ / 手机号 → 选择"今天我是谁" → 选择或创建角色 */
window.HJ = window.HJ || {};
(function () {
const app = window.HJ.app;
const store = window.HJ.store;
const { play, unlockAudio } = window.HJ.audio;
const { toast, esc } = window.HJ.ui;
const { REGIONS } = window.HJ.config;

const SPECIES = [
  { key: 'hajimi', name: '哈基米', emoji: '🐹' },
  { key: 'cat', name: '猫', emoji: '🐱' },
  { key: 'dog', name: '狗', emoji: '🐶' },
  { key: 'other', name: '其他', emoji: '🐾' },
];
const AVATARS = ['🐹', '🐱', '🐶', '🐭', '🐰', '🦊', '🐼', '🙂', '😎', '🥸'];

let step = 'method';
let personDraft = { name: '', avatar: '🙂', region: '杭州', bio: '' };
let charDraft = { name: '', species: 'hajimi', emoji: '🐹' };
let loginMethod = 'wechat';

function renderLogin(root, onDone) {
  const draw = () => {
    root.innerHTML = `
      <div class="login-wrap">
        <div class="login-bg"></div>
        ${step === 'method' ? viewMethod() : ''}
        ${step === 'pickPerson' ? viewPickPerson() : ''}
        ${step === 'createPerson' ? viewCreatePerson() : ''}
        ${step === 'pickCharacter' ? viewPickCharacter() : ''}
        ${step === 'createCharacter' ? viewCreateCharacter() : ''}
      </div>`;
    bind(root, draw, onDone);
  };
  step = 'method';
  draw();
}

/* ------------------------------ 第一步：登录方式 ------------------------------ */
function viewMethod() {
  return `
    <div class="login-hero">
      <div class="login-logo">🐹</div>
      <h1>哈基米生活记录器</h1>
      <p>尿了么 · 拉了么 · 吃了么 · 睡了么 · 活着么</p>
    </div>
    <div class="login-methods">
      <button class="login-btn wechat" data-m="wechat"><span>💬</span>微信登录</button>
      <button class="login-btn qq" data-m="qq"><span>🐧</span>QQ 登录</button>
      <button class="login-btn phone2" data-m="phone"><span>📱</span>手机号登录</button>
      <button class="login-btn ghost" data-m="guest"><span>🍼</span>先逛逛（体验账号）</button>
    </div>
    <p class="login-tip">登录即代表同意《哈基米用户协议》与《曼波隐私政策》</p>`;
}

/* ------------------------------ 第二步：今天我是谁 ------------------------------ */
function viewPickPerson() {
  const list = app.persons;
  return `
    <div class="step-head">
      <button class="back" data-back>‹</button>
      <h2>今天我是人</h2>
      <p>选择一个人，或者换一个人当当</p>
    </div>
    <div class="person-list">
      ${list.map(p => `
        <button class="person-card" data-person="${p.id}">
          <div class="avatar big">${p.avatar}</div>
          <div class="pc-info">
            <b>${esc(p.name)}</b>
            <span>${esc(p.region || '未知地区')} · ${esc(p.bio || '这个人很懒')}</span>
          </div>
          <span class="arrow">›</span>
        </button>`).join('')}
      <button class="person-card add" data-newperson>
        <div class="avatar big">➕</div>
        <div class="pc-info"><b>今天我是其他人</b><span>创建一个新的「人」</span></div>
        <span class="arrow">›</span>
      </button>
    </div>`;
}

function viewCreatePerson() {
  return `
    <div class="step-head">
      <button class="back" data-back>‹</button>
      <h2>今天我是其他人</h2>
      <p>填一下这个「人」的个人信息</p>
    </div>
    <div class="form">
      <label>头像</label>
      <div class="emoji-picker">
        ${AVATARS.map(a => `<button class="emoji ${personDraft.avatar === a ? 'on' : ''}" data-avatar="${a}">${a}</button>`).join('')}
      </div>
      <label>昵称</label>
      <input class="input" id="pname" placeholder="给自己起个名字" value="${esc(personDraft.name)}" />
      <label>地区（用于地区榜单）</label>
      <select class="input" id="pregion">
        ${REGIONS.map(r => `<option ${personDraft.region === r ? 'selected' : ''}>${r}</option>`).join('')}
      </select>
      <label>简介</label>
      <input class="input" id="pbio" placeholder="一句话介绍自己" value="${esc(personDraft.bio)}" />
      <button class="btn primary block" id="pnext">下一步：创建角色</button>
    </div>`;
}

/* ------------------------------ 第三步：角色 ------------------------------ */
function viewPickCharacter() {
  const list = app.characters;
  return `
    <div class="step-head">
      <button class="back" data-back>‹</button>
      <h2>选择你的哈基米</h2>
      <p>一个人可以养很多只，首页最多展示 9 只</p>
    </div>
    <div class="char-grid">
      ${list.map(c => `
        <button class="char-card ${c.isDefault ? 'on' : ''}" data-char="${c.id}">
          <div class="avatar xl">${c.emoji}</div>
          <b>${esc(c.name)}</b>
          <span>${c.isDefault ? '默认' : '点我设为默认'}</span>
        </button>`).join('')}
      <button class="char-card add" data-newchar>
        <div class="avatar xl">➕</div><b>新建角色</b><span>猫 / 狗 / 哈基米</span>
      </button>
    </div>
    <button class="btn primary block" id="enter">进入哈基米世界</button>`;
}

function viewCreateCharacter() {
  return `
    <div class="step-head">
      <button class="back" data-back>‹</button>
      <h2>创建角色</h2>
      <p>在「人」之下，创建猫 / 狗 / 哈基米等角色</p>
    </div>
    <div class="form">
      <label>物种</label>
      <div class="species">
        ${SPECIES.map(s => `<button class="sp ${charDraft.species === s.key ? 'on' : ''}" data-sp="${s.key}"><span>${s.emoji}</span>${s.name}</button>`).join('')}
      </div>
      <label>形象</label>
      <div class="emoji-picker">
        ${['🐹', '🐱', '🐶', '🐭', '🐰', '🦊', '🐼', '🐷', '🐸', '🐨'].map(a => `<button class="emoji ${charDraft.emoji === a ? 'on' : ''}" data-cemoji="${a}">${a}</button>`).join('')}
      </div>
      <label>名字</label>
      <input class="input" id="cname" placeholder="给角色起个名字" value="${esc(charDraft.name)}" />
      <button class="btn primary block" id="cok">创建并进入</button>
    </div>`;
}

/* ------------------------------ 事件绑定 ------------------------------ */
function bind(root, draw, onDone) {
  root.querySelectorAll('[data-m]').forEach(b => b.onclick = async () => {
    unlockAudio(); play('tap');
    loginMethod = b.dataset.m;
    if (loginMethod === 'phone') {
      const phone = prompt('输入手机号（演示环境，不会真实发送验证码）');
      if (!phone) return;
      if (!/^1\d{10}$/.test(phone.trim())) return toast('手机号格式不太对哦', { icon: '📱' });
      const code = prompt('输入验证码（演示：任意 4 位）');
      if (!code) return;
    }
    await store.login(loginMethod);
    await app.load();
    toast(`登录成功：${{ wechat: '微信', qq: 'QQ', phone: '手机号', guest: '体验' }[loginMethod]}`, { icon: '✅' });
    step = app.persons.length ? 'pickPerson' : 'createPerson';
    draw();
  });

  root.querySelectorAll('[data-person]').forEach(b => b.onclick = async () => {
    play('tap');
    await store.selectPerson(b.dataset.person);
    await app.load();
    step = 'pickCharacter'; draw();
  });

  const np = root.querySelector('[data-newperson]');
  if (np) np.onclick = () => { play('tap'); step = 'createPerson'; draw(); };

  const back = root.querySelector('[data-back]');
  if (back) back.onclick = () => {
    play('tap');
    step = step === 'createPerson' ? 'pickPerson' : step === 'createCharacter' ? 'pickCharacter' : 'method';
    draw();
  };

  root.querySelectorAll('[data-avatar]').forEach(b => b.onclick = () => { personDraft.avatar = b.dataset.avatar; draw(); });
  const pn = root.querySelector('#pnext');
  if (pn) pn.onclick = async () => {
    personDraft.name = root.querySelector('#pname').value.trim() || '无名人类';
    personDraft.region = root.querySelector('#pregion').value;
    personDraft.bio = root.querySelector('#pbio').value.trim();
    await store.createPerson(personDraft);
    await app.load();
    step = 'createCharacter'; draw();
  };

  root.querySelectorAll('[data-char]').forEach(b => b.onclick = async () => {
    play('tap');
    await store.setDefaultCharacter(b.dataset.char);
    await app.load(); draw();
  });
  const nc = root.querySelector('[data-newchar]');
  if (nc) nc.onclick = () => { play('tap'); step = 'createCharacter'; draw(); };

  root.querySelectorAll('[data-sp]').forEach(b => b.onclick = () => {
    charDraft.species = b.dataset.sp;
    charDraft.emoji = SPECIES.find(s => s.key === b.dataset.sp).emoji;
    draw();
  });
  root.querySelectorAll('[data-cemoji]').forEach(b => b.onclick = () => { charDraft.emoji = b.dataset.cemoji; draw(); });
  const cok = root.querySelector('#cok');
  if (cok) cok.onclick = async () => {
    charDraft.name = root.querySelector('#cname').value.trim() || '曼波';
    const c = await store.createCharacter(charDraft);
    await store.setDefaultCharacter(c.id);
    await app.load();
    play('levelup', { voice: app.unlocked('voice') });
    onDone();
  };

  const enter = root.querySelector('#enter');
  if (enter) enter.onclick = () => {
    if (!app.character) return toast('先选一只哈基米吧', { icon: '🐹' });
    play('success', { voice: true });
    onDone();
  };
}

  window.HJ.pageLogin = { renderLogin };
})();
