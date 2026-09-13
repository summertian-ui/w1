/** 社区：动态广场 + 尿/拉/吃/睡 全国 / 地区榜单 */
window.HJ = window.HJ || {};
(function () {
const app = window.HJ.app;
const store = window.HJ.store;
const { RECORD_TYPES } = window.HJ.config;
const { play } = window.HJ.audio;
const { toast, sheet, esc, ago } = window.HJ.ui;

let tab = 'feed';
let rankConf = { type: 'pee', scope: 'nation', period: 'week' };

async function renderCommunity(root) {
  root.innerHTML = `<div class="page community">
    <div class="seg full">
      <button class="${tab === 'feed' ? 'on' : ''}" data-t="feed">🌐 动态广场</button>
      <button class="${tab === 'rank' ? 'on' : ''}" data-t="rank">🏆 排行榜</button>
    </div>
    <div id="cbody"></div>
  </div>`;
  const seg = root.querySelector('.seg.full');
  seg.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { tab = b.dataset.t; play('tap'); renderCommunity(root); });
  const body = root.querySelector('#cbody');
  if (tab === 'feed') await drawFeed(body, root);
  else await drawRank(body, root);
}

/* ------------------------------ 动态 ------------------------------ */
async function drawFeed(body, root) {
  const posts = await store.listPosts();
  body.innerHTML = `
    ${app.unlocked('community') ? '' : `<div class="lock-tip">🔒 社区互动（发帖 / 评论 / 点赞）在 Lv.9 解锁，当前 Lv.${app.level.lv}。先去记录攒积分吧！</div>`}
    <button class="btn primary block" id="newpost">✏️ 分享我的动态</button>
    <div class="feed">
      ${posts.map(p => `
        <div class="post">
          <div class="post-head">
            <div class="avatar md">${p.avatar}</div>
            <div><b>${esc(p.author)}</b><small>${esc(p.region)} · ${ago(p.createdAt)}</small></div>
            <span class="post-emoji">${p.emoji}</span>
          </div>
          <p class="post-text">${esc(p.text)}</p>
          <div class="post-actions">
            <button class="pa ${p.liked ? 'on' : ''}" data-like="${p.id}">${p.liked ? '❤️' : '🤍'} ${p.likes}</button>
            <button class="pa" data-comment="${p.id}">💬 ${p.comments.length}</button>
          </div>
          ${p.comments.length ? `<div class="comments">${p.comments.map(c => `<div class="cm"><b>${esc(c.name)}：</b>${esc(c.text)}</div>`).join('')}</div>` : ''}
        </div>`).join('')}
    </div>
    <div class="pad"></div>`;

  body.querySelector('#newpost').onclick = () => {
    if (!app.unlocked('community')) return toast(`社区互动需要 Lv.9（当前 Lv.${app.level.lv}）`, { icon: '🔒' });
    openPost(root);
  };
  body.querySelectorAll('[data-like]').forEach(b => b.onclick = async () => {
    if (!app.unlocked('community')) return toast(`点赞需要 Lv.9（当前 Lv.${app.level.lv}）`, { icon: '🔒' });
    await store.likePost(b.dataset.like); play('tap'); await drawFeed(body, root);
  });
  body.querySelectorAll('[data-comment]').forEach(b => b.onclick = () => {
    if (!app.unlocked('community')) return toast(`评论需要 Lv.9（当前 Lv.${app.level.lv}）`, { icon: '🔒' });
    openComment(b.dataset.comment, root);
  });
}

function openPost(root) {
  sheet('分享动态', `
    <div class="form">
      <div class="emoji-picker">
        ${['🐹', '🐱', '🐶', '💧', '💩', '🍚', '😴', '🫀'].map((a, i) => `<button class="emoji ${i === 0 ? 'on' : ''}" data-e="${a}">${a}</button>`).join('')}
      </div>
      <textarea class="input" id="ptext" rows="4" placeholder="今天尿了么？拉了么？吃了么？睡了么？"></textarea>
      <button class="btn primary block mt" id="psend">发布</button>
    </div>`, {
    onMount: (body, close) => {
      let emoji = '🐹';
      body.querySelectorAll('[data-e]').forEach(b => b.onclick = () => {
        body.querySelectorAll('[data-e]').forEach(x => x.classList.remove('on'));
        b.classList.add('on'); emoji = b.dataset.e;
      });
      body.querySelector('#psend').onclick = async () => {
        const text = body.querySelector('#ptext').value.trim();
        if (!text) return toast('说点什么吧', { icon: '✏️' });
        await store.addPost({ text, emoji });
        play('success', { voice: app.unlocked('voice') });
        close(); toast('发布成功', { icon: '🎉' });
        await renderCommunity(root);
      };
    },
  });
}

function openComment(id, root) {
  sheet('评论', `
    <div class="form">
      <input class="input" id="ctext" placeholder="说点什么…" />
      <button class="btn primary block mt" id="csend">发送</button>
    </div>`, {
    onMount: (body, close) => {
      body.querySelector('#csend').onclick = async () => {
        const t = body.querySelector('#ctext').value.trim();
        if (!t) return toast('空的哦', { icon: '💬' });
        await store.commentPost(id, t); play('tap'); close();
        await renderCommunity(root);
      };
    },
  });
}

/* ------------------------------ 榜单 ------------------------------ */
async function drawRank(body, root) {
  const list = await store.getRank(rankConf);
  const def = RECORD_TYPES[rankConf.type];
  const me = list.find(x => x.isMe);
  // 前五名发勋章
  if (me && me.rank <= 5) await store.awardRankMedal(rankConf.period, me.rank, rankConf.scope);

  body.innerHTML = `
    <div class="rank-filters">
      <div class="seg small">
        ${['pee', 'poop', 'eat', 'sleep'].map(t => `<button class="${rankConf.type === t ? 'on' : ''}" data-rt="${t}">${RECORD_TYPES[t].emoji} ${RECORD_TYPES[t].name}</button>`).join('')}
      </div>
      <div class="seg small">
        <button class="${rankConf.scope === 'nation' ? 'on' : ''}" data-rs="nation">全国</button>
        <button class="${rankConf.scope === 'region' ? 'on' : ''}" data-rs="region">地区（${esc(app.user?.region || '杭州')}）</button>
      </div>
      <div class="seg small">
        ${[['week', '周榜'], ['month', '月榜'], ['year', '年榜']].map(([k, n]) => `<button class="${rankConf.period === k ? 'on' : ''}" data-rp="${k}">${n}</button>`).join('')}
      </div>
    </div>
    <div class="rank-note">🏅 每周 / 每月 / 每年 前五名可获得对应成就勋章，可挂到曼波衣服上</div>
    <div class="rank-list">
      ${list.map(x => `
        <div class="rank-row ${x.isMe ? 'me' : ''} ${x.rank <= 3 ? 'top' : ''}">
          <div class="rr-rank">${x.rank <= 3 ? ['🥇', '🥈', '🥉'][x.rank - 1] : x.rank}</div>
          <div class="avatar md">${x.avatar}</div>
          <div class="rr-info"><b>${esc(x.name)}${x.isMe ? '（我）' : ''}</b><small>${esc(x.region)}</small></div>
          <div class="rr-val">${x.value}<small>${def.unit}</small></div>
        </div>`).join('')}
    </div>
    <div class="pad"></div>`;

  body.querySelectorAll('[data-rt]').forEach(b => b.onclick = () => { rankConf.type = b.dataset.rt; play('tap'); drawRank(body, root); });
  body.querySelectorAll('[data-rs]').forEach(b => b.onclick = () => { rankConf.scope = b.dataset.rs; play('tap'); drawRank(body, root); });
  body.querySelectorAll('[data-rp]').forEach(b => b.onclick = () => { rankConf.period = b.dataset.rp; play('tap'); drawRank(body, root); });
}

  window.HJ.pageCommunity = { renderCommunity };
})();
