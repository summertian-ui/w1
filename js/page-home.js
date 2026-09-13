/** 首页：角色卡、等级与四值、五个记录器入口、风险提醒 */
window.HJ = window.HJ || {};
(function () {
const app = window.HJ.app;
const store = window.HJ.store;
const { RECORD_TYPES, RECORD_ORDER, MAMBO_LINES, levelOf, MEDALS } = window.HJ.config;
const { play, haptic } = window.HJ.audio;
const { toast, sheet, esc } = window.HJ.ui;

async function renderHome(root) {
  const s = app.stats || { points: 0, pee: 0, poop: 0, eat: 0, sleep: 0, alive: 0, extra: 0 };
  const lv = levelOf(s.points);
  const next = s.next;
  const pct = next ? Math.min(100, Math.round(((s.points - lv.min) / (next.min - lv.min)) * 100)) : 100;
  const chars = app.characters.filter(c => c.pinned).slice(0, app.settings.homeSlots || 4);
  const risk = app.character ? store.riskLevel(app.character.id) : 0;

  root.innerHTML = `
    <div class="page home">
      <!-- 顶部：角色 + 等级 -->
      <div class="topbar">
        <div class="who" data-act="switch">
          <div class="avatar lg">${app.character?.emoji || '🐹'}</div>
          <div>
            <b>${esc(app.character?.name || '曼波')}</b>
            <span>${lv.emoji} ${lv.name}</span>
          </div>
          <span class="caret">⌄</span>
        </div>
        <div class="top-right">
          <button class="icon-btn" data-act="manage">🧷</button>
          <button class="icon-btn" data-act="mambo">👕</button>
        </div>
      </div>

      <!-- 等级进度 -->
      <div class="level-card">
        <div class="lc-top">
          <span class="lv-badge">Lv.${lv.lv}</span>
          <div class="lc-name"><b>${lv.name}</b><span>${lv.desc}</span></div>
          <div class="lc-pts">${s.points}<small>积分</small></div>
        </div>
        <div class="bar"><i style="width:${pct}%"></i></div>
        <div class="lc-foot">${next ? `距离 <b>${next.name}</b> 还差 ${next.min - s.points} 积分` : '已满级，哈基米之神'}</div>
        <div class="values">
          ${['pee', 'poop', 'eat', 'sleep'].map(t => `
            <div class="v"><span>${RECORD_TYPES[t].emoji}</span><b>${s[t]}</b><small>${RECORD_TYPES[t].verb}值</small></div>`).join('')}
          <div class="v extra"><span>✨</span><b>${s.extra}</b><small>额外值</small></div>
        </div>
      </div>

      ${risk > 0 ? `
        <div class="risk risk-${risk}" data-act="alive">
          <div class="risk-icon">${risk >= 3 ? '💀' : risk === 2 ? '🥺' : '👀'}</div>
          <div>
            <b>${risk >= 3 ? '嗝屁风险！' : risk === 2 ? '哈基米想你了' : '该记录了'}</b>
            <span>${pick(MAMBO_LINES[risk >= 3 ? 'danger' : 'miss'])}</span>
          </div>
          <button class="btn tiny">活着么</button>
        </div>` : ''}

      <!-- 角色卡（首页展示） -->
      <div class="sec-head"><h3>我的哈基米（${chars.length}/${app.settings.homeSlots}）</h3><button data-act="manage">管理</button></div>
      <div class="char-row">
        ${chars.map(c => `
          <button class="mini-char ${c.id === app.character?.id ? 'on' : ''}" data-char="${c.id}">
            <div class="avatar md">${c.emoji}</div>
            <span>${esc(c.name)}</span>
          </button>`).join('')}
        ${chars.length < (app.settings.homeSlots || 4) ? `<button class="mini-char add" data-act="newchar"><div class="avatar md">➕</div><span>新增</span></button>` : ''}
      </div>

      <!-- 记录器 -->
      <div class="sec-head"><h3>今日记录</h3><span class="muted">${new Date().toLocaleDateString('zh-CN')}</span></div>
      <div class="rec-grid">
        ${RECORD_ORDER.map(t => recCard(t, s)).join('')}
      </div>

      <div class="sec-head"><h3>今日速览</h3></div>
      <div class="today-strip">
        ${RECORD_ORDER.map(t => `
          <div class="ts">
            <span>${RECORD_TYPES[t].emoji}</span>
            <b>${app.character ? store.todayCount(app.character.id, t) : 0}</b>
            <small>${RECORD_TYPES[t].unit}</small>
          </div>`).join('')}
      </div>
      <div class="pad"></div>
    </div>`;

  bind(root);
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function recCard(t, s) {
  const def = RECORD_TYPES[t];
  const ok = app.unlocked(t);
  const cnt = app.character ? store.todayCount(app.character.id, t) : 0;
  return `
    <button class="rec-card ${ok ? '' : 'locked'}" style="--c:${def.color}" data-rec="${t}">
      <div class="rc-emoji">${ok ? def.emoji : '🔒'}</div>
      <div class="rc-body">
        <b>${def.name}</b>
        <span>${ok ? (cnt ? `今天已 ${cnt} ${def.unit}` : def.question) : `Lv.${def.unlockLv} 解锁`}</span>
      </div>
      ${ok ? `<span class="rc-go">记录 ›</span>` : `<span class="rc-lock">Lv.${def.unlockLv}</span>`}
    </button>`;
}

function bind(root) {
  root.querySelectorAll('[data-rec]').forEach(b => b.onclick = () => {
    const t = b.dataset.rec;
    if (!app.unlocked(t)) return toast(`还没解锁，升到 Lv.${RECORD_TYPES[t].unlockLv} 开放「${RECORD_TYPES[t].name}」`, { icon: '🔒' });
    openRecorder(t);
  });
  root.querySelectorAll('[data-char]').forEach(b => b.onclick = async () => {
    play('tap');
    await store.selectCharacter(b.dataset.char);
    await app.refresh();
  });
  root.querySelector('[data-act="switch"]').onclick = () => openCharSwitch();
  root.querySelectorAll('[data-act="manage"]').forEach(b => b.onclick = () => openCharManage());
  root.querySelectorAll('[data-act="mambo"]').forEach(b => b.onclick = () => app.go('mambo'));
  root.querySelectorAll('[data-act="newchar"]').forEach(b => b.onclick = () => openCharCreate());
  const alive = root.querySelector('[data-act="alive"]');
  if (alive) alive.onclick = () => { if (app.unlocked('alive')) openRecorder('alive'); else toast('活着么在 Lv.5 解锁', { icon: '🔒' }); };
}

/* ------------------------------ 角色切换 ------------------------------ */
function openCharSwitch() {
  const all = app.characters;
  sheet('今天我是哪只？', `
    <div class="char-list">
      ${all.map(c => `
        <button class="person-card ${c.id === app.character?.id ? 'on' : ''}" data-sw="${c.id}">
          <div class="avatar big">${c.emoji}</div>
          <div class="pc-info"><b>${esc(c.name)}</b><span>${c.isDefault ? '默认角色' : '点击切换'}</span></div>
        </button>`).join('')}
    </div>`, {
    onMount: async (body, close) => {
      body.querySelectorAll('[data-sw]').forEach(b => b.onclick = async () => {
        play('tap'); await store.selectCharacter(b.dataset.sw); close(); await app.refresh();
      });
    },
  });
}

/* ------------------------------ 角色管理（展示数量 / 最多 9） ------------------------------ */
function openCharManage() {
  const all = app.characters;
  const slots = app.settings.homeSlots || 4;
  sheet('管理首页展示', `
    <div class="form">
      <label>首页展示数量</label>
      <div class="seg">
        ${[4, 6, 9].map(n => `<button class="${slots === n ? 'on' : ''}" data-slot="${n}">${n} 个</button>`).join('')}
      </div>
      <label>选择展示哪些（最多 9 个）</label>
      <div class="pin-list">
        ${all.map(c => `
          <button class="pin-item ${c.pinned ? 'on' : ''}" data-pin="${c.id}">
            <span>${c.emoji}</span><b>${esc(c.name)}</b>
            <i>${c.pinned ? '展示中' : '未展示'}</i>
          </button>`).join('')}
      </div>
      <p class="muted small">提示：首页最多展示 9 个角色，默认展示 4 个。</p>
    </div>`, {
    onMount: async (body, close) => {
      body.querySelectorAll('[data-slot]').forEach(b => b.onclick = async () => {
        await store.setHomeSlots(Number(b.dataset.slot));
        play('tap'); close(); await app.refresh();
      });
      body.querySelectorAll('[data-pin]').forEach(b => b.onclick = async () => {
        const ok = await store.togglePin(b.dataset.pin);
        if (!ok) return toast('最多只能展示 9 个角色', { icon: '⚠️' });
        play('tap'); close(); await app.refresh();
      });
    },
  });
}

function openCharCreate() {
  sheet('创建角色', `
    <div class="form">
      <label>形象</label>
      <div class="emoji-picker">
        ${['🐹', '🐱', '🐶', '🐭', '🐰', '🦊', '🐼', '🐷', '🐸', '🐨'].map((a, i) => `<button class="emoji ${i === 0 ? 'on' : ''}" data-e="${a}">${a}</button>`).join('')}
      </div>
      <label>名字</label>
      <input class="input" id="ncname" placeholder="叫什么呢" />
      <button class="btn primary block" id="ncok">创建</button>
    </div>`, {
    onMount: async (body, close) => {
      let emoji = '🐹';
      body.querySelectorAll('[data-e]').forEach(b => b.onclick = () => {
        body.querySelectorAll('[data-e]').forEach(x => x.classList.remove('on'));
        b.classList.add('on'); emoji = b.dataset.e;
      });
      body.querySelector('#ncok').onclick = async () => {
        const name = body.querySelector('#ncname').value.trim() || '新角色';
        const c = await store.createCharacter({ name, emoji, species: 'hajimi' });
        await store.selectCharacter(c.id);
        play('success', { voice: app.unlocked('voice') });
        close(); await app.refresh();
      };
    },
  });
}

/* ============================ 记录器 ============================ */
function openRecorder(type) {
  const def = RECORD_TYPES[type];
  let status = null;
  let note = '';
  let meta = {};

  const bodyHTML = () => `
    <div class="rec-ask">
      <div class="ra-emoji">${def.emoji}</div>
      <h3>${def.question}</h3>
      <div class="status-grid">
        ${def.statuses.map(st => `
          <button class="st ${status === st.key ? 'on' : ''}" data-st="${st.key}">
            <span class="st-e">${st.emoji}</span>
            <b>${st.label}</b>
            <small>+${st.points} 分</small>
          </button>`).join('')}
      </div>
      ${extraHTML()}
      <label class="mt">备注（可不填）</label>
      <input class="input" id="rnote" placeholder="说点什么…" value="${esc(note)}" />
      <button class="btn primary block mt" id="rok" ${status ? '' : 'disabled'}>记录一下</button>
    </div>`;

  function extraHTML() {
    if (type === 'eat' && status === 'busy') {
      return `<div class="tip-box">🎤 哈基米：再忙也要记得好好吃饭哦～<br/>唱一下：哈基米哟南北绿豆，哈呀路亚咯～</div>`;
    }
    if (type === 'eat') {
      return `
        <div class="tip-box">
          🛵 吃的外卖？拍一下外卖小票，我帮你记下来
          <button class="btn tiny mt" id="scan">📷 拍外卖条识别</button>
          <div id="scanres"></div>
        </div>`;
    }
    if (type === 'sleep' && status === 'nightmare') {
      return `
        <div class="tip-box">
          😱 梦到什么了？说来听听，哈基米给你解梦
          <input class="input mt" id="dream" placeholder="简单描述一下噩梦" />
          <button class="btn tiny mt" id="doread">🔮 解梦一下</button>
          <div id="dreamres"></div>
        </div>`;
    }
    if (type === 'alive') {
      const pe = app.character ? store.todayCount(app.character.id, 'pee') : 0;
      const po = app.character ? store.todayCount(app.character.id, 'poop') : 0;
      if (pe === 0 && po === 0) {
        return `<div class="tip-box warn">⚠️ 今天还没尿也没拉，活着状态：不好。有便秘风险，快去喝水！</div>`;
      }
    }
    return '';
  }

  sheet(def.name, bodyHTML(), {
    onMount: (body, close) => {
      const redraw = () => {
        body.innerHTML = bodyHTML();
        mount(body, close, redraw);
      };
      mount(body, close, redraw);
    },
  });

  function mount(body, close, redraw) {
    body.querySelectorAll('[data-st]').forEach(b => b.onclick = () => {
      status = b.dataset.st; play('tap'); redraw();
    });
    const noteEl = body.querySelector('#rnote');
    if (noteEl) noteEl.oninput = e => { note = e.target.value; };

    const scan = body.querySelector('#scan');
    if (scan) scan.onclick = async () => {
      toast('正在识别外卖小票…', { icon: '📷' });
      const r = await store.recognizeTakeout();
      meta.shop = r.shop; meta.price = r.price;
      body.querySelector('#scanres').innerHTML = `
        <div class="scan-card">
          <b>识别结果：${esc(r.shop)}</b>
          <span>金额 ¥${r.price} · ${r.items.join(' / ')}</span>
        </div>`;
      play('medal');
    };

    const dr = body.querySelector('#doread');
    if (dr) dr.onclick = async () => {
      const t = body.querySelector('#dream').value.trim();
      if (!t) return toast('先说说梦到啥了', { icon: '💭' });
      const res = await store.dreamReading(t);
      meta.dream = t; meta.dreamReading = res;
      body.querySelector('#dreamres').innerHTML = `<div class="scan-card"><b>🔮 哈基米解梦</b><span>${esc(res)}</span></div>`;
      play('medal');
    };

    body.querySelector('#rok').onclick = async () => {
      if (!status) return;
      const res = await store.addRecord({ characterId: app.character.id, type, status, note, meta });
      if (meta.shop) {
        await store.saveTakeout(app.character.id, meta.shop, meta.price);
      }
      // 音效
      const st = def.statuses.find(x => x.key === status);
      play(st.tone === 'good' ? 'success' : st.tone === 'bad' ? 'bad' : 'warn', { voice: app.unlocked('voice') });
      if (res.levelUp) setTimeout(() => play('levelup', { voice: app.unlocked('voice') }), 500);
      if (res.newMedals.length) setTimeout(() => play('medal'), 800);
      haptic(30);
      showResult(close, res, def, st);
      await app.refresh();
    };
  }
}

function showResult(close, res, def, st) {
  const names = res.newMedals.map(id => {
    const m = MEDALS.find(x => x.id === id);
    return m ? `${m.emoji} ${m.name}` : id;
  });
  sheet('记录成功', `
    <div class="result">
      <div class="res-emoji">${st.emoji}</div>
      <h3>${st.label}</h3>
      <div class="res-points">+${res.gained} 积分 ${res.extraGained ? `<span class="extra">额外值 +${res.extraGained}</span>` : ''}</div>
      ${res.levelUp ? `<div class="levelup-banner">🎉 升级！现在是 <b>Lv.${res.level.lv} ${res.level.name}</b></div>` : ''}
      ${res.unlocked.length ? `<div class="unlock-box">🔓 解锁：${res.unlocked.map(u => u.name).join('、')}</div>` : ''}
      ${names.length ? `<div class="medal-box">🎖 获得勋章：${names.join('、')}</div>` : ''}
      <div class="lines">${res.tips.map(t => `<p>${esc(t)}</p>`).join('')}</div>
      <button class="btn primary block mt" data-close>好耶</button>
    </div>`, {
    onMount: (body, c) => {
      body.querySelector('[data-close]').onclick = () => { c(); close(); };
    },
  });
}

  window.HJ.pageHome = { renderHome, openRecorder };
})();
