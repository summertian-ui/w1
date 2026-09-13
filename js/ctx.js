/** 全局应用上下文：不依赖任何页面模块，避免循环引用 */
(function () {
const store = window.HJ.store;
const { levelOf, isUnlocked } = window.HJ.config;

const app = {
  user: null,
  persons: [],
  characters: [],
  character: null,   // 当前角色
  stats: null,
  settings: { soundOn: true, homeSlots: 4, season: 'winter' },

  /** 由 app.js 注入 */
  go: () => {},
  openRecorder: () => {},
  refresh: async () => {},

  get level() { return levelOf(this.stats?.points || 0); },
  unlocked(key) { return isUnlocked(this.level?.lv || 1, key); },

  async load() {
    const st = await store.getState();
    this.user = st.user;
    this.persons = st.persons;
    this.settings = { ...this.settings, ...st.settings };
    const chars = await store.listCharacters();
    this.characters = chars;
    this.character = chars.find(c => c.id === st.currentCharacterId) || chars[0] || null;
    if (this.character) this.stats = await store.getStats(this.character.id);
    return this;
  },
};

window.HJ.app = app;
})();
