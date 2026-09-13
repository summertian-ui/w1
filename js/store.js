/**
 * 哈基米生活记录器 · 数据层
 * 当前为本地持久化实现（localStorage）。所有接口均为 async 且返回 Promise，
 * 后续接入云端数据库时只需替换本文件内部实现，页面代码无需改动。
 */
(function () {
const {
  RECORD_TYPES, RECORD_ORDER, LEVELS, MEDALS, levelOf, isUnlocked,
  TAKEOUT_SHOPS, REGIONS, MAMBO_LINES, SEASON_LIMIT, SLOTS_PER_LAYER,
} = window.HJ.config;

const KEY = 'hajimi_life_v1';

/* ------------------------------ 基础读写 ------------------------------ */
const blank = () => ({
  version: 1,
  user: null,
  persons: [],
  currentPersonId: null,
  characters: [],
  currentCharacterId: null,
  records: [],
  medals: [],          // { id, gotAt, worn: {uid, layer, slot} | null }
  posts: [],
  feedbacks: [],
  logs: [],
  settings: { homeSlots: 4, soundOn: true, season: currentSeason(), perms: {}, keepDays: 90 },
  seeded: false,
});

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore */ }
  return blank();
}
function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
}
const delay = (v, ms = 0) => new Promise(r => setTimeout(() => r(v), ms));
const uid = (p = 'id') => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

function currentSeason() {
  const m = new Date().getMonth() + 1;
  return (m >= 11 || m <= 3) ? 'winter' : 'summer';
}
const dayKey = (d = new Date()) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};
const hoursAgo = (iso) => (Date.now() - new Date(iso).getTime()) / 36e5;

/* ------------------------------ 种子数据 ------------------------------ */
function seed() {
  if (state.seeded) return;
  // 示例用户
  const me = { id: uid('p'), name: '哈基米本米', avatar: '🐱', region: '杭州', bio: '记录一下自己还活着', createdAt: new Date().toISOString() };
  state.user = me; state.persons = [me]; state.currentPersonId = me.id;

  const mkChar = (name, species, emoji, isDefault, order) => ({
    id: uid('c'), personId: me.id, name, species, emoji, isDefault, order,
    pinned: true, createdAt: new Date().toISOString(),
    outfits: [], awardedExtraDays: [], extra: 0, stifled: 0,
  });
  state.characters = [
    mkChar('曼波', 'hajimi', '🐹', true, 0),
    mkChar('豆豆', 'cat', '🐱', false, 1),
    mkChar('大黄', 'dog', '🐶', false, 2),
    mkChar('绿豆', 'hajimi', '🐭', false, 3),
  ];
  state.currentCharacterId = state.characters[0].id;

  // 示例记录（最近 3 天）
  const now = Date.now();
  ['pee', 'poop', 'eat', 'sleep', 'alive'].forEach((t, i) => {
    const st = RECORD_TYPES[t].statuses[0];
    state.records.push({
      id: uid('r'), characterId: state.currentCharacterId, type: t, status: st.key,
      points: st.points, value: st.value, note: '', createdAt: new Date(now - (i * 3600e3 + 3600e3)).toISOString(), day: dayKey(),
    });
  });
  state.medals = [
    { id: 'pee_1', gotAt: new Date().toISOString(), worn: null },
    { id: 'poop_1', gotAt: new Date().toISOString(), worn: null },
    { id: 'all_perfect', gotAt: new Date().toISOString(), worn: null },
  ];

  // 社区示例动态
  state.posts = [
    { id: uid('post'), author: '南北绿豆', avatar: '🌱', region: '成都', emoji: '🐹', text: '今天尿了 8 次，拉了 2 次，吃了 3 顿，睡了 7 小时。曼波认证：优良人类。', likes: 42, liked: false, comments: [{ id: uid('cm'), name: '哈基米本米', text: '太强了，我要向你学习' }], createdAt: new Date(now - 2 * 3600e3).toISOString() },
    { id: uid('post'), author: '阿伟死了', avatar: '💀', region: '深圳', emoji: '🐶', text: '连续三天没拉屎，曼波说我再不拉就要报警了…', likes: 88, liked: false, comments: [], createdAt: new Date(now - 5 * 3600e3).toISOString() },
    { id: uid('post'), author: '干饭王', avatar: '🍚', region: '北京', emoji: '🐱', text: '今天吃了 5 顿，其中 3 顿外卖。外卖鉴赏家勋章到手！', likes: 23, liked: false, comments: [{ id: uid('cm'), name: '路人甲', text: '哪家外卖？' }], createdAt: new Date(now - 8 * 3600e3).toISOString() },
  ];
  state.seeded = true;
  persist();
}
seed();

/* ------------------------------ 会话 ------------------------------ */
async function getState() { return delay(state); }
async function login(method, profile = {}) {
  if (!state.user) {
    state.user = { id: uid('u'), name: profile.name || '哈基米用户', avatar: profile.avatar || '🐹', region: profile.region || '杭州', bio: '', createdAt: new Date().toISOString() };
    state.persons = [{ ...state.user }];
    state.currentPersonId = state.user.id;
    if (!state.characters.length) {
      const c = { id: uid('c'), personId: state.user.id, name: '曼波', species: 'hajimi', emoji: '🐹', isDefault: true, order: 0, pinned: true, createdAt: new Date().toISOString(), outfits: [], awardedExtraDays: [], extra: 0, stifled: 0 };
      state.characters = [c]; state.currentCharacterId = c.id;
    }
  }
  state.user.loginMethod = method;
  persist();
  return delay(state.user);
}
async function logout() { persist(); return delay(true); }
async function updateUser(patch) {
  if (state.user) Object.assign(state.user, patch);
  persist(); return delay(state.user);
}
/** 敏感操作记录（登录、权限变更、数据策略变更等） */
async function logAction(action) {
  state.logs.unshift({ id: uid('log'), action, at: new Date().toISOString() });
  state.logs = state.logs.slice(0, 50);
  persist(); return delay(true);
}
async function listLogs() { return delay(state.logs); }

/* ------------------------------ 人 & 角色 ------------------------------ */
async function listPersons() { return delay(state.persons); }
async function createPerson(data) {
  const p = { id: uid('p'), name: data.name, avatar: data.avatar || '🙂', region: data.region || '杭州', bio: data.bio || '', createdAt: new Date().toISOString() };
  state.persons.push(p); state.currentPersonId = p.id; persist(); return delay(p);
}
async function selectPerson(id) { state.currentPersonId = id; persist(); return delay(true); }

async function listCharacters(personId = state.currentPersonId) {
  return delay(state.characters.filter(c => c.personId === personId).sort((a, b) => a.order - b.order));
}
async function getCharacter(id) { return delay(state.characters.find(c => c.id === id) || null); }
async function createCharacter(data) {
  const list = state.characters.filter(c => c.personId === (data.personId || state.currentPersonId));
  const c = {
    id: uid('c'), personId: data.personId || state.currentPersonId, name: data.name,
    species: data.species || 'hajimi', emoji: data.emoji || '🐹',
    isDefault: list.length === 0, order: list.length, pinned: true,
    createdAt: new Date().toISOString(), outfits: [], awardedExtraDays: [], extra: 0, stifled: 0,
  };
  state.characters.push(c); persist(); return delay(c);
}
async function setDefaultCharacter(id) {
  state.characters.forEach(c => { if (c.personId === state.currentPersonId) c.isDefault = (c.id === id); });
  state.currentCharacterId = id; persist(); return delay(true);
}
async function selectCharacter(id) { state.currentCharacterId = id; persist(); return delay(true); }
async function togglePin(id) {
  const c = state.characters.find(x => x.id === id); if (!c) return delay(false);
  const pinned = state.characters.filter(x => x.personId === c.personId && x.pinned);
  if (c.pinned) c.pinned = false;
  else if (pinned.length >= 9) return delay(false);
  else c.pinned = true;
  persist(); return delay(true);
}
async function setHomeSlots(n) { state.settings.homeSlots = n; persist(); return delay(n); }

/* ------------------------------ 统计 ------------------------------ */
function statsOf(characterId) {
  const rs = state.records.filter(r => r.characterId === characterId);
  const s = { pee: 0, poop: 0, eat: 0, sleep: 0, alive: 0, points: 0, extra: 0, total: rs.length };
  rs.forEach(r => { s[r.type] += r.value || 0; s.points += r.points || 0; });
  const c = state.characters.find(x => x.id === characterId);
  s.extra = c ? c.extra : 0;
  s.level = levelOf(s.points);
  s.next = LEVELS.find(l => l.min > s.points) || null;
  s.records = rs;
  s.lastAt = rs.length ? rs.map(r => r.createdAt).sort().pop() : null;
  return s;
}
async function getStats(characterId) { return delay(statsOf(characterId)); }

function todayCount(characterId, type) {
  const d = dayKey();
  return state.records.filter(r => r.characterId === characterId && r.type === type && r.day === d).length;
}
/** 距离上次记录的风险等级：0 正常 / 1 提醒 / 2 求安慰 / 3 嗝屁警告 */
function riskLevel(characterId) {
  const s = statsOf(characterId);
  if (!s.lastAt) return 3;
  const h = hoursAgo(s.lastAt);
  if (h >= 72) return 3; if (h >= 48) return 2; if (h >= 24) return 1; return 0;
}

/* ------------------------------ 记录 ------------------------------ */
function grantMedal(id) {
  if (state.medals.some(m => m.id === id)) return null;
  const m = { id, gotAt: new Date().toISOString(), worn: null };
  state.medals.push(m); return m;
}

/** 各模块"正常"状态对应的 key（睡眠的正常态是 good） */
const NORMAL_KEY = { sleep: 'good' };
function isNormal(type, status) {
  return status === (NORMAL_KEY[type] || 'normal');
}

/** 统一成就判定：返回本次新获得的勋章 id 列表 */
function checkAchievements(characterId) {
  const got = [];
  const push = (id) => { const m = grantMedal(id); if (m) got.push(id); };
  const rs = state.records.filter(r => r.characterId === characterId);
  const byType = (t) => rs.filter(r => r.type === t);
  const normalDays = (t) => new Set(byType(t).filter(r => isNormal(t, r.status)).map(r => r.day));

  const hour = new Date().getHours();
  // 尿
  const pees = byType('pee');
  if (pees.length >= 1) push('pee_1');
  if (pees.length >= 100) push('pee_100');
  if (pees.filter(r => r.day === dayKey()).length > 10) push('pee_water');
  if (hour >= 0 && hour < 5 && byType('pee').some(r => r.day === dayKey())) push('pee_night');
  // 拉
  const poops = byType('poop');
  if (poops.length >= 1) push('poop_1');
  if (poops.length >= 50) push('poop_50');
  if (poops.some(r => r.status === 'diarrhea')) push('poop_surv');
  if (poops.some(r => r.status === 'normal' && new Date(r.createdAt).getHours() >= 6 && new Date(r.createdAt).getHours() < 9)) push('poop_morn');
  // 吃
  const eats = byType('eat');
  if (eats.length >= 1) push('eat_1');
  if (eats.length >= 30) push('eat_30');
  if (new Set(eats.filter(r => r.shop).map(r => r.shop)).size >= 10) push('eat_take');
  if (hour >= 22 && eats.some(r => r.day === dayKey())) push('eat_night');
  if (eats.some(r => r.status === 'fast')) push('eat_fast');
  // 睡
  const sleeps = byType('sleep');
  if (sleeps.length >= 1) push('sleep_1');
  if (sleeps.some(r => r.status === 'miss')) push('sleep_miss');
  if (sleeps.some(r => r.status === 'nightmare')) push('sleep_dream');
  if (sleeps.some(r => r.status === 'overNoon')) push('sleep_late');
  // 活
  const alives = byType('alive');
  if (alives.length >= 1) push('alive_1');
  if (alives.length >= 100) push('alive_god');
  if (alives.filter(r => r.status === 'niuma').length >= 10) push('alive_nm');
  if (alives.filter(r => r.status === 'proud').length >= 10) push('alive_pd');

  // 连续天数（基于去重日）
  const streak = (t) => {
    const days = new Set(byType(t).map(r => r.day));
    let n = 0; const cur = new Date();
    for (let i = 0; i < 400; i++) {
      const k = dayKey(new Date(cur.getTime() - i * 864e5));
      if (days.has(k)) n++; else if (i > 0) break;
    }
    return n;
  };
  if (streak('pee') >= 3) push('pee_3');
  if (streak('pee') >= 7 && pees.filter(r => !isNormal('pee', r.status)).length === 0) push('pee_clear');
  if (streak('poop') >= 7) push('poop_7');
  if (streak('sleep') >= 7) push('sleep_7');
  if (streak('alive') >= 7) push('alive_7');

  // 完美一日 & 全勤
  const d = dayKey();
  const okDay = RECORD_ORDER.filter(t => t !== 'alive').every(t => normalDays(t).has(d));
  if (okDay) push('all_perfect');
  let full = 0; const cur = new Date();
  for (let i = 0; i < 400; i++) {
    const k = dayKey(new Date(cur.getTime() - i * 864e5));
    if (RECORD_ORDER.filter(t => t !== 'alive').every(t => normalDays(t).has(k))) full++; else break;
  }
  if (full >= 7) push('all_streak');

  const c = state.characters.find(x => x.id === characterId);
  if (c && c.extra >= 30) push('all_extra');
  return got;
}

/** 额外值：当天尿/拉/吃/睡全部正常 → +1（每天只发一次） */
function tryExtra(characterId) {
  const c = state.characters.find(x => x.id === characterId);
  if (!c) return 0;
  const d = dayKey();
  if (c.awardedExtraDays.includes(d)) return 0;
  const need = ['pee', 'poop', 'eat', 'sleep'];
  const ok = need.every(t => state.records.some(r =>
    r.characterId === characterId && r.type === t && isNormal(t, r.status) && r.day === d));
  if (ok) { c.extra += 1; c.awardedExtraDays.push(d); return 1; }
  return 0;
}

async function addRecord({ characterId, type, status, note = '', meta = {} }) {
  const def = RECORD_TYPES[type];
  const st = def.statuses.find(s => s.key === status) || def.statuses[0];
  const before = statsOf(characterId);
  const rec = {
    id: uid('r'), characterId, type, status: st.key,
    points: st.points+120000, value: st.value, note, meta,
    createdAt: new Date().toISOString(), day: dayKey(),
  };
  debugger;
  state.records.push(rec);
  const extraGained = tryExtra(characterId);
  const after = statsOf(characterId);
  const newMedals = checkAchievements(characterId);
  persist();

  const cnt = todayCount(characterId, type);
  let tips = [st.line];
  // 频次反馈
  if (type === 'pee') {
    if (cnt >= 10) tips.push('哈基米：够能尿的啊你！今天第 ' + cnt + ' 次了，你是水桶吗💧');
    else if (cnt <= 1) tips.push('哈基米：才尿这么点？好好多喝水啊笨蛋！');
  }
  if (type === 'poop' && cnt === 0) tips.push('哈基米：肠道在抗议了！');
  // 活着风险
  if (type === 'alive') {
    const pe = todayCount(characterId, 'pee'), po = todayCount(characterId, 'poop');
    if (pe === 0 && po === 0) tips.push('⚠️ 今天没尿也没拉，活着状态：不好。有便秘风险，快去喝水！');
  }
  const levelUp = after.level.lv > before.level.lv;
  return delay({
    record: rec, gained: st.points, extraGained, levelUp,
    level: after.level, newMedals, tips,
    unlocked: levelUp ? levelUnlocksAt(after.level.lv) : [],
    stats: after,
  });
}
function levelUnlocksAt(lv) {
  return [
    { lv: 2, key: 'poop', name: '拉了么' }, { lv: 3, key: 'eat', name: '吃了么' },
    { lv: 4, key: 'sleep', name: '睡了么' }, { lv: 5, key: 'alive', name: '活着么' },
    { lv: 6, key: 'voice', name: '哈基米语音' }, { lv: 7, key: 'outfit', name: '曼波换装' },
    { lv: 8, key: 'tone', name: '哈基米语气' }, { lv: 9, key: 'community', name: '社区广场' },
    { lv: 10, key: 'comfort', name: '哈基米高级安慰' },
  ].filter(u => u.lv === lv);
}
async function listRecords(characterId, type) {
  let rs = state.records.filter(r => r.characterId === characterId);
  if (type) rs = rs.filter(r => r.type === type);
  return delay(rs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 100));
}
/** 外卖统计 */
async function takeoutStats(characterId) {
  const rs = state.records.filter(r => r.characterId === characterId && r.shop);
  const map = {};
  rs.forEach(r => { map[r.shop] = (map[r.shop] || 0) + 1; });
  return delay(Object.entries(map).map(([shop, n]) => ({ shop, n })).sort((a, b) => b.n - a.n));
}

/* ------------------------------ 勋章 ------------------------------ */
async function listMedals() {
  return delay(state.medals.map(m => ({ ...m, def: MEDALS.find(x => x.id === m.id) })).filter(m => m.def));
}
async function ownedMedalIds() { return delay(state.medals.map(m => m.id)); }

/* ------------------------------ 曼波换装 ------------------------------ */
async function listOutfits(characterId) {
  const c = state.characters.find(x => x.id === characterId);
  return delay(c ? c.outfits : []);
}
async function wearCloth(characterId, key) {
  const c = state.characters.find(x => x.id === characterId);
  if (!c) return delay({ ok: false, msg: '角色不存在' });
  const limit = SEASON_LIMIT[state.settings.season] || 5;
  if (c.outfits.length >= limit) return delay({ ok: false, msg: `最多只能穿 ${limit} 件，曼波快闷死了！先脱一件。` });
  const o = { uid: uid('o'), key, inner: new Array(SLOTS_PER_LAYER).fill(null), outer: new Array(SLOTS_PER_LAYER).fill(null) };
  c.outfits.push(o); c.stifled = Math.min(100, c.stifled + 0); persist();
  return delay({ ok: true, outfit: o });
}
async function takeOffCloth(characterId, outfitUid) {
  const c = state.characters.find(x => x.id === characterId);
  if (!c) return delay(false);
  // 脱下时该衣服上的勋章回到未佩戴
  state.medals.forEach(m => { if (m.worn && m.worn.uid === outfitUid) m.worn = null; });
  c.outfits = c.outfits.filter(o => o.uid !== outfitUid);
  persist(); return delay(true);
}
async function placeMedal(characterId, outfitUid, layer, slot, medalId) {
  const c = state.characters.find(x => x.id === characterId);
  const o = c && c.outfits.find(x => x.uid === outfitUid);
  if (!o) return delay({ ok: false });
  // 先把该勋章从原位置移除
  state.medals.forEach(m => { if (m.worn && m.id === medalId) m.worn = null; });
  o[layer][slot] = medalId;
  const m = state.medals.find(x => x.id === medalId);
  if (m) m.worn = { uid: outfitUid, layer, slot };
  persist(); return delay({ ok: true });
}
async function removeMedal(medalId) {
  const m = state.medals.find(x => x.id === medalId);
  if (!m || !m.worn) return delay(false);
  const c = state.characters.find(x => x.outfits.some(o => o.uid === m.worn.uid));
  if (c) {
    const o = c.outfits.find(x => x.uid === m.worn.uid);
    if (o) o[m.worn.layer][m.worn.slot] = null;
  }
  m.worn = null; persist(); return delay(true);
}
/** 闷坏度：衣服数量超季节建议值时持续上升 */
function stifleLevel(characterId) {
  const c = state.characters.find(x => x.id === characterId);
  if (!c) return 0;
  const limit = SEASON_LIMIT[state.settings.season] || 5;
  const over = Math.max(0, c.outfits.length - Math.max(1, limit - 1));
  return Math.min(100, over * 25);
}

/* ------------------------------ 社区 ------------------------------ */
async function listPosts() {
  return delay([...state.posts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
}
async function addPost({ text, emoji }) {
  const u = state.user || { name: '哈基米用户', avatar: '🐹', region: '杭州' };
  const p = { id: uid('post'), author: u.name, avatar: u.avatar, region: u.region, emoji: emoji || '🐹', text, likes: 0, liked: false, comments: [], createdAt: new Date().toISOString() };
  state.posts.unshift(p); persist(); return delay(p);
}
async function likePost(id) {
  const p = state.posts.find(x => x.id === id); if (!p) return delay(null);
  p.liked = !p.liked; p.likes += p.liked ? 1 : -1; persist(); return delay(p);
}
async function commentPost(id, text) {
  const p = state.posts.find(x => x.id === id); if (!p) return delay(null);
  const u = state.user || { name: '哈基米用户' };
  const c = { id: uid('cm'), name: u.name, text, createdAt: new Date().toISOString() };
  p.comments.push(c); persist(); return delay(c);
}

/* ------------------------------ 榜单 ------------------------------ */
const FAKE_NAMES = ['南北绿豆', '阿伟死了', '干饭王', '膀胱战神', '便秘之王', '睡神小张', '曼波一号', '夜尿小猫', '杭州路人', '深圳打工人', '成都小酒鬼', '北京牛马'];
async function getRank({ type = 'pee', scope = 'nation', period = 'week' }) {
  const u = state.user || { name: '我', region: '杭州' };
  const cur = state.currentCharacterId;
  const s = cur ? statsOf(cur) : { pee: 0, poop: 0, eat: 0, sleep: 0 };
  const seedBase = (type.length + scope.length + period.length) * 7;
  const list = FAKE_NAMES.map((n, i) => ({
    name: n, region: REGIONS[(i + seedBase) % REGIONS.length],
    value: Math.max(1, Math.round((s[type] || 0) * 1.4 + 40 - i * 3 + ((seedBase * (i + 3)) % 17))),
    avatar: ['🐹', '🐱', '🐶', '🐭', '🐰'][i % 5],
    isMe: false,
  }));
  if (scope === 'region') {
    const keep = list.filter(x => x.region === u.region);
    list.length = 0; list.push(...keep);
  }
  list.push({ name: u.name, region: u.region, value: s[type] || 0, avatar: '🐹', isMe: true });
  list.sort((a, b) => b.value - a.value);
  list.forEach((x, i) => { x.rank = i + 1; });
  return delay(list.slice(0, 20));
}

/* ------------------------------ 反馈 ------------------------------ */
async function addFeedback({ type, content, contact }) {
  const f = { id: uid('fb'), type, content, contact, createdAt: new Date().toISOString(), status: '已收到' };
  state.feedbacks.unshift(f); persist(); return delay(f);
}
async function listFeedbacks() { return delay(state.feedbacks); }

/* ------------------------------ 设置 ------------------------------ */
async function getSettings() { return delay(state.settings); }
async function setSetting(k, v) { state.settings[k] = v; persist(); return delay(state.settings); }

/* ------------------------------ 道具：解梦 ------------------------------ */
async function dreamReading(text) {
  const key = (text || '').trim();
  const pool = MAMBO_LINES.dream;
  let hit = null;
  if (/追|跑|逃|被追/.test(key)) hit = pool[0];
  else if (/掉|坠落|掉落|下坠/.test(key)) hit = pool[1];
  else if (/考试|迟到|上学|老师/.test(key)) hit = pool[2];
  else if (/厕所|尿|洗手间/.test(key)) hit = pool[3];
  else if (/死人|已故|爷爷|奶奶|故人/.test(key)) hit = pool[4];
  else if (/飞|天空|飞行/.test(key)) hit = pool[5];
  else if (/牙/.test(key)) hit = pool[6];
  else if (/水|海|河|雨/.test(key)) hit = pool[7];
  return delay(hit || pool[Math.floor(Math.random() * pool.length)]);
}

/* ------------------------------ 道具：外卖识别 ------------------------------ */
async function recognizeTakeout() {
  const shop = TAKEOUT_SHOPS[Math.floor(Math.random() * TAKEOUT_SHOPS.length)];
  const price = (Math.random() * 40 + 12).toFixed(1);
  return delay({ shop, price: Number(price), items: ['主食 x1', '小食 x1', '饮料 x1'] });
}
async function saveTakeout(characterId, shop, price) {
  const rec = {
    id: uid('r'), characterId, type: 'eat', status: 'normal',
    points: 10, value: 1, shop, price, note: `外卖：${shop}`,
    createdAt: new Date().toISOString(), day: dayKey(),
  };
  state.records.push(rec);
  const newMedals = checkAchievements(characterId);
  persist();
  return delay({ record: rec, newMedals });
}

/** 榜单前五名发放成就勋章；第一名再额外发放地区/全国勋章 */
async function awardRankMedal(period, rank, scope) {
  if (rank > 5) return delay([]);
  const got = [];
  const give = (id) => { const m = grantMedal(id); if (m) got.push(id); };
  if (period === 'week') give('rank_week');
  if (period === 'month') give('rank_month');
  if (period === 'year') give('rank_year');
  if (rank === 1) give(scope === 'region' ? 'rank_area' : 'rank_all');
  if (got.length) persist();
  return delay(got);
}

  window.HJ.store = {
    getState, login, logout, updateUser, logAction, listLogs,
    listPersons, createPerson, selectPerson,
    listCharacters, getCharacter, createCharacter, setDefaultCharacter, selectCharacter, togglePin, setHomeSlots,
    statsOf, getStats, todayCount, riskLevel,
    addRecord, listRecords, takeoutStats,
    listMedals, ownedMedalIds,
    listOutfits, wearCloth, takeOffCloth, placeMedal, removeMedal, stifleLevel,
    listPosts, addPost, likePost, commentPost, getRank, awardRankMedal,
    addFeedback, listFeedbacks, getSettings, setSetting,
    dreamReading, recognizeTakeout, saveTakeout,
    isUnlocked, dayKey, currentSeason,
  };
})();
