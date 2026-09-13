/** 我的：个人信息、角色、勋章入口、意见反馈、权限中心、规划中的模块 */
window.HJ = window.HJ || {};
(function () {
const app = window.HJ.app;
const store = window.HJ.store;
const { REGIONS, FUTURE_MODULES, LEVELS, LEVEL_UNLOCKS } = window.HJ.config;
const { play, setEnabled } = window.HJ.audio;
const { toast, sheet, esc, ago } = window.HJ.ui;

const AVATARS = ['🐹', '🐱', '🐶', '🐭', '🐰', '🦊', '🐼', '🙂', '😎', '🥸'];

async function renderMe(root) {
  const s = app.stats || { points: 0, pee: 0, poop: 0, eat: 0, sleep: 0, alive: 0, extra: 0 };
  const u = app.user || {};
  const logs = await store.listLogs();
  const perms = (await store.getSettings()).perms || {};
  const keep = (await store.getSettings()).keepDays || 90;

  root.innerHTML = `
    <div class="page me">
      <!-- 个人信息 -->
      <div class="me-card">
        <div class="avatar xl">${u.avatar || '🐹'}</div>
        <div class="me-info">
          <b>${esc(u.name || '哈基米用户')}</b>
          <small>${esc(u.region || '未设置地区')} · ${esc(u.bio || '这个人很懒')}</small>
          <div class="me-tags">
            <span>${app.level.emoji} Lv.${app.level.lv} ${app.level.name}</span>
            <span>${s.points} 积分</span>
          </div>
        </div>
        <button class="btn tiny" id="editme">编辑</button>
      </div>

      <div class="values wide">
        ${[['pee', '💧', '尿值'], ['poop', '💩', '拉值'], ['eat', '🍚', '吃值'], ['sleep', '😴', '睡值'], ['alive', '🫀', '活值']].map(([k, e, n]) => `
          <div class="v"><span>${e}</span><b>${s[k] || 0}</b><small>${n}</small></div>`).join('')}
        <div class="v extra"><span>✨</span><b>${s.extra || 0}</b><small>额外值</small></div>
      </div>

      <!-- 等级路线 -->
      <div class="sec-head"><h3>等级路线</h3></div>
      <div class="level-road">
        ${LEVELS.map(l => `
          <div class="lr ${app.level.lv >= l.lv ? 'on' : ''}">
            <span>${l.emoji}</span>
            <b>Lv.${l.lv} ${l.name}</b>
            <small>${l.min} 积分${LEVEL_UNLOCKS.find(u => u.lv === l.lv) ? ' · 解锁「' + LEVEL_UNLOCKS.find(u => u.lv === l.lv).name + '」' : ''}</small>
          </div>`).join('')}
      </div>

      <!-- 角色 -->
      <div class="sec-head"><h3>我的人与角色</h3><button id="newchar">+ 角色</button></div>
      <div class="char-grid">
        ${app.characters.map(c => `
          <div class="char-card ${c.id === app.character?.id ? 'on' : ''}" data-ch="${c.id}">
            <div class="avatar xl">${c.emoji}</div><b>${esc(c.name)}</b><span>${c.isDefault ? '默认' : '点我切换'}</span>
          </div>`).join('')}
      </div>

      <!-- 功能入口 -->
      <div class="sec-head"><h3>功能</h3></div>
      <div class="entry-list">
        <button class="entry" data-go="mambo"><span>🎖️</span><div><b>成就勋章 & 曼波衣柜</b><small>给曼波穿衣服、挂勋章</small></div><i>›</i></button>
        <button class="entry" id="feedback"><span>📮</span><div><b>意见反馈</b><small>吐槽、建议、Bug 都能提</small></div><i>›</i></button>
        <button class="entry" id="perms"><span>🔐</span><div><b>权限中心</b><small>定位 / 自启 / 后台 / 通知 / 使用情况 / 电话 / 锁屏 / 截屏</small></div><i>›</i></button>
        <button class="entry" id="security"><span>🛡️</span><div><b>数据安全与敏感操作</b><small>保留时长 ${keep === 0 ? '永久' : keep + ' 天'} · ${logs.length} 条记录</small></div><i>›</i></button>
        <button class="entry" id="future"><span>🚀</span><div><b>规划中的功能</b><small>抽奖、小游戏、位置共享、亲友关联…</small></div><i>›</i></button>
        <button class="entry" id="logout"><span>🚪</span><div><b>退出登录</b><small>重新体验登录 / 换个人当当</small></div><i>›</i></button>
        <div class="entry"><span>🔊</span><div><b>哈基米音效</b><small>${app.unlocked('voice') ? '已解锁完整语音包' : 'Lv.6 解锁语音包'}</small></div>
          <label class="switch"><input type="checkbox" id="snd" ${app.settings.soundOn ? 'checked' : ''}><i></i></label>
        </div>
      </div>
      <div class="pad"></div>
    </div>`;

  // 事件
  root.querySelector('#editme').onclick = () => openEdit(root);
  root.querySelector('#newchar').onclick = () => openNewChar(root);
  root.querySelectorAll('[data-ch]').forEach(b => b.onclick = async () => {
    await store.setDefaultCharacter(b.dataset.ch); play('tap'); await app.refresh();
  });
  root.querySelector('[data-go="mambo"]').onclick = () => app.go('mambo');
  root.querySelector('#feedback').onclick = () => openFeedback(root);
  root.querySelector('#perms').onclick = () => openPerms(root);
  root.querySelector('#security').onclick = () => openSecurity(root);
  root.querySelector('#future').onclick = openFuture;
  root.querySelector('#logout').onclick = async () => {
    await store.updateUser({ loginMethod: null });
    await store.logAction('退出登录');
    location.reload();
  };
  root.querySelector('#snd').onchange = async (e) => {
    await store.setSetting('soundOn', e.target.checked);
    setEnabled(e.target.checked); play('tap');
    if (e.target.checked) toast('音效已开启', { icon: '🔊' });
  };
}

/* ------------------------------ 编辑个人信息 ------------------------------ */
function openEdit(root) {
  const u = app.user || {};
  let avatar = u.avatar || '🐹';
  sheet('编辑个人信息', `
    <div class="form">
      <label>头像</label>
      <div class="emoji-picker">
        ${AVATARS.map(a => `<button class="emoji ${avatar === a ? 'on' : ''}" data-a="${a}">${a}</button>`).join('')}
      </div>
      <label>昵称</label><input class="input" id="un" value="${esc(u.name || '')}" />
      <label>地区（决定你参加哪个地区榜）</label>
      <select class="input" id="ur">${REGIONS.map(r => `<option ${u.region === r ? 'selected' : ''}>${r}</option>`).join('')}</select>
      <label>简介</label><input class="input" id="ub" value="${esc(u.bio || '')}" />
      <button class="btn primary block mt" id="uok">保存</button>
    </div>`, {
    onMount: (body, close) => {
      body.querySelectorAll('[data-a]').forEach(b => b.onclick = () => {
        avatar = b.dataset.a;
        body.querySelectorAll('[data-a]').forEach(x => x.classList.remove('on'));
        b.classList.add('on');
      });
      body.querySelector('#uok').onclick = async () => {
        await store.updateUser({
          avatar,
          name: body.querySelector('#un').value.trim() || '哈基米用户',
          region: body.querySelector('#ur').value,
          bio: body.querySelector('#ub').value.trim(),
        });
        await store.logAction('修改个人信息');
        play('success', { voice: app.unlocked('voice') });
        close(); toast('已保存', { icon: '✅' }); await app.refresh();
      };
    },
  });
}

function openNewChar(root) {
  sheet('创建角色', `
    <div class="form">
      <label>形象</label>
      <div class="emoji-picker">
        ${['🐹', '🐱', '🐶', '🐭', '🐰', '🦊', '🐼', '🐷', '🐸', '🐨'].map((a, i) => `<button class="emoji ${i === 0 ? 'on' : ''}" data-e="${a}">${a}</button>`).join('')}
      </div>
      <label>名字</label><input class="input" id="cn" placeholder="叫什么呢" />
      <button class="btn primary block mt" id="cok">创建</button>
    </div>`, {
    onMount: (body, close) => {
      let emoji = '🐹';
      body.querySelectorAll('[data-e]').forEach(b => b.onclick = () => {
        body.querySelectorAll('[data-e]').forEach(x => x.classList.remove('on'));
        b.classList.add('on'); emoji = b.dataset.e;
      });
      body.querySelector('#cok').onclick = async () => {
        const name = body.querySelector('#cn').value.trim() || '新角色';
        const c = await store.createCharacter({ name, emoji });
        await store.selectCharacter(c.id);
        play('success', { voice: app.unlocked('voice') });
        close(); await app.refresh();
      };
    },
  });
}

/* ------------------------------ 意见反馈 ------------------------------ */
function openFeedback(root) {
  const history = store.listFeedbacks();
  sheet('意见反馈', `
    <div class="form">
      <label>类型</label>
      <div class="seg small" id="fbtype">
        <button class="on" data-t="功能建议">功能建议</button>
        <button data-t="Bug">Bug</button>
        <button data-t="吐槽">吐槽</button>
        <button data-t="其他">其他</button>
      </div>
      <label>内容</label>
      <textarea class="input" id="fbc" rows="4" placeholder="说说你的想法，哈基米会认真看的"></textarea>
      <label>联系方式（选填）</label>
      <input class="input" id="fbp" placeholder="微信 / QQ / 邮箱" />
      <button class="btn primary block mt" id="fbs">提交</button>
      <div class="sec-head mt"><h3>我的反馈记录</h3></div>
      <div id="fbhistory"></div>
    </div>`, {
    full: true,
    onMount: async (body, close) => {
      let type = '功能建议';
      const renderHistory = async () => {
        const list = await store.listFeedbacks();
        body.querySelector('#fbhistory').innerHTML = list.length ? list.map(f => `
          <div class="fb-item"><b>${esc(f.type)}</b><span>${esc(f.content)}</span><small>${ago(f.createdAt)} · ${esc(f.status)}</small></div>`).join('') : `<div class="empty small">还没有反馈记录</div>`;
      };
      await renderHistory();
      body.querySelectorAll('#fbtype [data-t]').forEach(b => b.onclick = () => {
        type = b.dataset.t;
        body.querySelectorAll('#fbtype [data-t]').forEach(x => x.classList.remove('on'));
        b.classList.add('on');
      });
      body.querySelector('#fbs').onclick = async () => {
        const content = body.querySelector('#fbc').value.trim();
        if (!content) return toast('写点什么吧', { icon: '📮' });
        await store.addFeedback({ type, content, contact: body.querySelector('#fbp').value.trim() });
        play('success', { voice: app.unlocked('voice') });
        body.querySelector('#fbc').value = '';
        toast('收到！哈基米会转达给开发', { icon: '📮' });
        await renderHistory();
      };
    },
  });
}

/* ------------------------------ 权限中心 ------------------------------ */
const PERM_DEFS = [
  ['location', '定位', '用于地区榜单、轨迹停留、好友路况'],
  ['autostart', '自启动', '保证记录提醒能准时到达'],
  ['background', '后台运行', '后台持续记录与提醒'],
  ['notify', '通知', '尿了么 / 拉了么 / 吃了么 定时提醒'],
  ['usage', '获取 App 使用情况', '生成手机使用报告'],
  ['phone', '电话权限', '通话记录收集（规划中）'],
  ['lockscreen', '锁屏', '锁屏显示今日打卡'],
  ['screenshot', '截屏', '外卖小票截屏识别'],
];
function openPerms(root) {
  sheet('权限中心', `
    <div class="perm-list">
      ${PERM_DEFS.map(([k, n, d]) => `
        <div class="perm">
          <div><b>${n}</b><small>${d}</small></div>
          <label class="switch"><input type="checkbox" data-p="${k}"><i></i></label>
        </div>`).join('')}
    </div>
    <p class="muted small">关闭权限会影响对应功能；每次开关都会记入敏感操作记录。</p>`, {
    full: true,
    onMount: async (body) => {
      const st = await store.getSettings();
      const perms = st.perms || {};
      body.querySelectorAll('[data-p]').forEach(inp => {
        inp.checked = !!perms[inp.dataset.p];
        inp.onchange = async () => {
          const key = inp.dataset.p;
          const next = { ...(await store.getSettings()).perms || {}, [key]: inp.checked };
          await store.setSetting('perms', next);
          await store.logAction(`${inp.checked ? '开启' : '关闭'}权限：${PERM_DEFS.find(p => p[0] === key)[1]}`);
          play('tap');
          toast(`${PERM_DEFS.find(p => p[0] === key)[1]}已${inp.checked ? '开启' : '关闭'}`, { icon: '🔐' });
        };
      });
    },
  });
}

/* ------------------------------ 数据安全 ------------------------------ */
function openSecurity(root) {
  sheet('数据安全与敏感操作', `
    <div class="form">
      <label>数据保留时长</label>
      <div class="seg small" id="keep">
        ${[[30, '30 天'], [90, '90 天'], [365, '1 年'], [0, '永久']].map(([v, n]) => `<button data-k="${v}">${n}</button>`).join('')}
      </div>
      <p class="muted small">到期后自动清理超过时长的记录、动态与反馈内容。</p>
      <div class="sec-head mt"><h3>敏感操作记录</h3></div>
      <div id="logs"></div>
    </div>`, {
    full: true,
    onMount: async (body) => {
      const st = await store.getSettings();
      const keep = st.keepDays ?? 90;
      body.querySelectorAll('#keep [data-k]').forEach(b => {
        b.classList.toggle('on', Number(b.dataset.k) === keep);
        b.onclick = async () => {
          await store.setSetting('keepDays', Number(b.dataset.k));
          await store.logAction(`修改数据保留时长：${b.textContent}`);
          body.querySelectorAll('#keep [data-k]').forEach(x => x.classList.remove('on'));
          b.classList.add('on'); play('tap');
        };
      });
      const render = async () => {
        const logs = await store.listLogs();
        body.querySelector('#logs').innerHTML = logs.length ? logs.map(l => `
          <div class="log-item"><b>${esc(l.action)}</b><small>${ago(l.at)}</small></div>`).join('') : `<div class="empty small">暂无记录</div>`;
      };
      await render();
    },
  });
}

/* ------------------------------ 规划中的功能 ------------------------------ */
function openFuture() {
  sheet('规划中的功能', `
    <div class="future">
      ${FUTURE_MODULES.map(g => `
        <div class="fg">
          <h4>${g.group}</h4>
          <div class="fg-items">${g.items.map(i => `<span class="chip">${esc(i)}</span>`).join('')}</div>
        </div>`).join('')}
    </div>`, { full: true });
}

  window.HJ.pageMe = { renderMe };
})();
