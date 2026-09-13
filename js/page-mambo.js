/** 曼波：形象互动（掀衣服）、换装、勋章挂载管理 */
window.HJ = window.HJ || {};
(function () {
const app = window.HJ.app;
const store = window.HJ.store;
const { CLOTHES, MEDALS, SEASON_LIMIT, SLOTS_PER_LAYER, MAMBO_LINES } = window.HJ.config;
const { play } = window.HJ.audio;
const { toast, sheet, esc, confirmBox } = window.HJ.ui;

let tab = 'wear';       // wear | medals
let layer = 'outer';    // 衣服详情里的层级
let pickedMedal = null; // 待佩戴的勋章 id

async function renderMambo(root) {
  root.innerHTML = `<div class="page mambo" id="mamboPage"></div>`;
  const box = root.querySelector('#mamboPage');
  await draw(box);
}

async function draw(box) {
  const cid = app.character?.id;
  if (!cid) { box.innerHTML = `<div class="empty">先创建一只哈基米</div>`; return; }
  const outfits = await store.listOutfits(cid);
  const medals = await store.listMedals();
  const stifle = store.stifleLevel(cid);
  const season = app.settings.season;
  const limit = SEASON_LIMIT[season];
  const worn = medals.filter(m => m.worn);
  const unWorn = medals.filter(m => !m.worn);

  box.innerHTML = `
    <div class="sec-head">
      <h3>我的曼波</h3>
      <div class="seg small">
        <button class="${tab === 'wear' ? 'on' : ''}" data-tab="wear">换装</button>
        <button class="${tab === 'medals' ? 'on' : ''}" data-tab="medals">勋章 ${medals.length}</button>
      </div>
    </div>

    <!-- 曼波形象 -->
    <div class="mambo-stage ${stifle >= 75 ? 'sick' : ''}" data-act="peek">
      <div class="mambo-body" id="mamboBody">
        <div class="mb-char">${app.character.emoji}</div>
        <div class="mb-clothes">
          ${outfits.map((o, i) => `<div class="mb-cloth c${i}" style="--i:${i}">${cloth(o.key).emoji}</div>`).join('')}
        </div>
        <div class="mb-medals">
          ${worn.slice(0, 8).map(m => `<span title="${esc(m.def?.name || '')}">${m.def?.emoji || '🎖️'}</span>`).join('')}
          ${worn.length > 8 ? `<span class="more">+${worn.length - 8}</span>` : ''}
        </div>
      </div>
      <div class="mb-tip">戳一下曼波 👆</div>
    </div>

    <div class="stifle">
      <div class="st-head"><span>闷坏度</span><b>${stifle}%</b></div>
      <div class="bar thin"><i style="width:${stifle}%;background:${stifle > 60 ? '#ff5d6c' : '#ffb454'}"></i></div>
      <small>${stifle >= 75 ? '曼波快闷坏了！再不脱衣服，曼波就不再爱你了。' : stifle > 0 ? '穿得有点多了，曼波有点喘不过气' : '状态良好，曼波很舒服'}</small>
    </div>

    ${tab === 'wear' ? wearView(outfits, season, limit) : medalView(medals, worn, unWorn)}
    <div class="pad"></div>`;

  bind(box, { outfits, medals, stifle });
}

const cloth = (key) => CLOTHES.find(c => c.key === key) || { name: key, emoji: '👕' };

function wearView(outfits, season, limit) {
  return `
    <div class="sec-head">
      <h3>衣柜（${outfits.length}/${limit}）</h3>
      <div class="seg small">
        <button class="${season === 'winter' ? 'on' : ''}" data-season="winter">冬季</button>
        <button class="${season === 'summer' ? 'on' : ''}" data-season="summer">夏季</button>
      </div>
    </div>
    <div class="outfit-list">
      ${outfits.map(o => {
        const inner = o.inner.filter(Boolean).length;
        const outer = o.outer.filter(Boolean).length;
        return `
        <div class="outfit-card">
          <button class="oc-main" data-outfit="${o.uid}">
            <span class="oc-emoji">${cloth(o.key).emoji}</span>
            <div><b>${cloth(o.key).name}</b><small>内 ${inner} · 外 ${outer} 枚勋章</small></div>
          </button>
          <button class="oc-off" data-off="${o.uid}">脱下</button>
        </div>`;
      }).join('')}
      ${outfits.length < limit ? `<button class="outfit-card add" data-add>➕ 加一件衣服</button>` : `<div class="full-tip">已达上限（${limit} 件），先脱一件再穿</div>`}
    </div>
    <p class="muted small">冬季最多 5 件（背心 / 长袖 / 马甲 / 外套 / 羽绒服），夏季最多 2 件。每件衣服内外各 ${SLOTS_PER_LAYER} 个勋章位。</p>`;
}

function medalView(medals, worn, unWorn) {
  return `
    <div class="sec-head"><h3>已佩戴 ${worn.length}</h3><span class="muted">点击勋章上的 👕 跳到衣服</span></div>
    <div class="medal-grid">
      ${worn.length ? worn.map(m => medalCard(m, true)).join('') : `<div class="empty small">还没有佩戴勋章</div>`}
    </div>
    <div class="sec-head"><h3>未佩戴 ${unWorn.length}</h3><span class="muted">点击佩戴到衣服上</span></div>
    <div class="medal-grid">
      ${unWorn.length ? unWorn.map(m => medalCard(m, false)).join('') : `<div class="empty small">全部佩戴中</div>`}
    </div>
    <div class="sec-head"><h3>未获得</h3></div>
    <div class="medal-grid">
      ${MEDALS.filter(m => !medals.some(x => x.id === m.id)).map(m => `
        <div class="medal-card locked"><span>${m.emoji}</span><b>${m.name}</b><small>${m.desc}</small></div>`).join('')}
    </div>`;
}

function medalCard(m, isWorn) {
  return `
    <button class="medal-card ${isWorn ? 'worn' : ''}" data-medal="${m.id}">
      <span class="mc-emoji">${m.def?.emoji || '🎖️'}</span>
      <b>${esc(m.def?.name || m.id)}</b>
      <small>${isWorn ? `佩戴在 ${clothOf(m.worn?.uid)}` : esc(m.def?.desc || '')}</small>
      ${isWorn ? `<i class="mc-cloth" data-toclothes="${m.worn.uid}">👕</i>` : `<i class="mc-wear">佩戴</i>`}
    </button>`;
}
let _outfitsCache = [];
function clothOf(uid) {
  const o = _outfitsCache.find(x => x.uid === uid);
  return o ? cloth(o.key).name : '衣服';
}

function bind(box, ctxData) {
  _outfitsCache = ctxData.outfits;
  const redraw = async () => { await app.load(); await draw(box); };

  box.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { play('tap'); tab = b.dataset.tab; redraw(); });
  box.querySelectorAll('[data-season]').forEach(b => b.onclick = async () => {
    await store.setSetting('season', b.dataset.season); play('tap'); redraw();
  });

  // 戳曼波 → 掀衣服
  const stage = box.querySelector('[data-act="peek"]');
  if (stage) stage.onclick = () => {
    const el = box.querySelector('#mamboBody');
    el.classList.add('peek');
    setTimeout(() => el.classList.remove('peek'), 900);
    play('peek');
    const lines = window.__MAMBO__.peek;
    const t = lines[Math.floor(Math.random() * lines.length)];
    toast(t, { icon: '🐹', duration: 2400 });
  };

  box.querySelectorAll('[data-off]').forEach(b => b.onclick = async () => {
    const ok = await confirmBox('脱下衣服', '脱下后这件衣服上的勋章会回到未佩戴页哦。');
    if (!ok) return;
    await store.takeOffCloth(app.character.id, b.dataset.off);
    play('tap'); toast('脱掉啦，曼波凉快了', { icon: '👕' }); redraw();
  });

  const add = box.querySelector('[data-add]');
  if (add) add.onclick = () => {
    if (!app.unlocked('outfit')) return toast('曼波换装在 Lv.7 解锁，快去记录攒积分', { icon: '🔒' });
    openWearPicker(redraw);
  };

  box.querySelectorAll('[data-outfit]').forEach(b => b.onclick = () => openOutfit(b.dataset.outfit));

  box.querySelectorAll('[data-medal]').forEach(b => b.onclick = async (e) => {
    const id = b.dataset.medal;
    if (e.target.closest('[data-toclothes]')) {
      play('tap'); return openOutfit(e.target.closest('[data-toclothes]').dataset.toclothes);
    }
    const m = (await store.listMedals()).find(x => x.id === id);
    if (m.worn) {
      const ok = await confirmBox('移出勋章', '把「' + (m.def?.name || '') + '」从衣服上取下来？');
      if (!ok) return;
      await store.removeMedal(id); play('tap'); toast('已移到未佩戴', { icon: '🎖️' }); redraw();
    } else {
      openMedalPlace(id, redraw);
    }
  });
}

/* ------------------------------ 加衣服 ------------------------------ */
function openWearPicker(redraw) {
  const season = app.settings.season;
  const list = CLOTHES.filter(c => c.season.includes(season));
  sheet('给曼波穿一件', `
    <div class="cloth-picker">
      ${list.map(c => `
        <button class="cloth-card" data-wear="${c.key}">
          <span>${c.emoji}</span><b>${c.name}</b><small>保暖 ${c.warm}</small>
        </button>`).join('')}
    </div>`, {
    onMount: async (body, close) => {
      body.querySelectorAll('[data-wear]').forEach(b => b.onclick = async () => {
        const r = await store.wearCloth(app.character.id, b.dataset.wear);
        if (!r.ok) return toast(r.msg, { icon: '😵' });
        play('success', { voice: app.unlocked('voice') });
        toast('穿上了！', { icon: '👕' }); close(); redraw();
      });
    },
  });
}

/* ------------------------------ 佩戴勋章到衣服 ------------------------------ */
async function openMedalPlace(medalId, redraw) {
  const outfits = await store.listOutfits(app.character.id);
  if (!outfits.length) return toast('先给曼波穿件衣服才能挂勋章', { icon: '👕' });
  sheet('佩戴到哪件衣服？', `
    <div class="cloth-picker">
      ${outfits.map(o => `<button class="cloth-card" data-pick="${o.uid}"><span>${cloth(o.key).emoji}</span><b>${cloth(o.key).name}</b><small>内 ${o.inner.filter(Boolean).length} / 外 ${o.outer.filter(Boolean).length}</small></button>`).join('')}
    </div>`, {
    onMount: (body, close) => {
      body.querySelectorAll('[data-pick]').forEach(b => b.onclick = async () => {
        const uid = b.dataset.pick;
        const o = outfits.find(x => x.uid === uid);
        // 找第一个空位
        let target = o.outer.findIndex(x => !x);
        let lay = 'outer';
        if (target < 0) { target = o.inner.findIndex(x => !x); lay = 'inner'; }
        if (target < 0) return toast('这件衣服挂满了（内外各 100 枚）', { icon: '🎖️' });
        await store.placeMedal(app.character.id, uid, lay, target, medalId);
        play('medal'); toast('挂上啦！', { icon: '🎖️' }); close(); redraw();
      });
    },
  });
}

/* ------------------------------ 衣服详情（放大底图 + 勋章格位） ------------------------------ */
async function openOutfit(outfitUid) {
  const cid = app.character.id;
  const outfits = await store.listOutfits(cid);
  const o = outfits.find(x => x.uid === outfitUid);
  if (!o) return toast('这件衣服不见了', { icon: '👕' });
  const medals = await store.listMedals();
  const owned = medals.filter(m => !m.worn);

  const render = (body) => {
    const grid = o[layer];
    body.querySelector('#gridWrap').innerHTML = `
      <div class="cloth-detail">
        <div class="cd-bg">${cloth(o.key).emoji}</div>
        <div class="cd-grid">
          ${grid.map((m, i) => {
            const def = m ? MEDALS.find(x => x.id === m) : null;
            return `<button class="slot ${m ? 'filled' : ''} ${pickedMedal && !m ? 'droppable' : ''}" data-slot="${i}">
              ${def ? `<span title="${esc(def.name)}">${def.emoji}</span>` : `<i>${i + 1}</i>`}
            </button>`;
          }).join('')}
        </div>
      </div>
      <div class="slot-info">${grid.filter(Boolean).length} / ${SLOTS_PER_LAYER} 已使用</div>`;
    bindSlots(body, o, render);
  };

  sheet(`${cloth(o.key).name} · 勋章位`, `
    <div class="seg small">
      <button class="${layer === 'outer' ? 'on' : ''}" data-layer="outer">外层</button>
      <button class="${layer === 'inner' ? 'on' : ''}" data-layer="inner">内层（掀开可见）</button>
    </div>
    <div id="gridWrap"></div>
    <div class="sec-head"><h3>未佩戴勋章 ${owned.length}</h3><small class="muted">先点勋章，再点格子挂上</small></div>
    <div class="medal-pick">
      ${owned.length ? owned.map(m => `<button class="mp ${pickedMedal === m.id ? 'on' : ''}" data-mp="${m.id}"><span>${m.def?.emoji}</span><b>${esc(m.def?.name)}</b></button>`).join('') : '<div class="empty small">没有未佩戴的勋章</div>'}
    </div>
  `, {
    full: true,
    onMount: (body, close) => {
      render(body);
      body.querySelectorAll('[data-layer]').forEach(b => b.onclick = () => { layer = b.dataset.layer; play('tap'); render(body); });
      body.querySelectorAll('[data-mp]').forEach(b => b.onclick = () => {
        pickedMedal = pickedMedal === b.dataset.mp ? null : b.dataset.mp;
        play('tap');
        body.querySelectorAll('[data-mp]').forEach(x => x.classList.toggle('on', x.dataset.mp === pickedMedal));
        body.querySelectorAll('[data-slot]').forEach(x => x.classList.toggle('droppable', !!pickedMedal && !x.classList.contains('filled')));
      });
      body._close = close;
    },
  });

  function bindSlots(body, o, render) {
    body.querySelectorAll('[data-slot]').forEach(b => b.onclick = async () => {
      const i = Number(b.dataset.slot);
      const cur = o[layer][i];
      if (cur) {
        const def = MEDALS.find(x => x.id === cur);
        const ok = await confirmBox('处理勋章', `「${def?.name || ''}」要怎么处理？`, );
        if (ok) {
          await store.removeMedal(cur); play('tap'); toast('已移出到未佩戴', { icon: '🎖️' });
          const fresh = (await store.listOutfits(cid)).find(x => x.uid === o.uid);
          Object.assign(o, fresh);
          pickedMedal = cur;
          render(body);
        }
        return;
      }
      if (!pickedMedal) return toast('先在下面选一个勋章', { icon: '🎖️' });
      await store.placeMedal(cid, o.uid, layer, i, pickedMedal);
      play('medal');
      pickedMedal = null;
      const fresh = (await store.listOutfits(cid)).find(x => x.uid === o.uid);
      Object.assign(o, fresh);
      render(body);
    });
  }
}

  window.HJ.pageMambo = { renderMambo, openOutfit };
})();
