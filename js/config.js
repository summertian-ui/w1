window.HJ = window.HJ || {};
(function () {
/**
 * 哈基米生活记录器 · 全局配置
 * 所有数值规则、等级、勋章、文案集中在此，便于后续调整数值不改逻辑代码。
 */

/* ============================ 等级体系（10 级） ============================ */
const LEVELS = [
  { lv: 1,  name: '曼波尿泡萌新',   min: 0,    emoji: '💧', desc: '刚学会尿尿的小曼波' },
  { lv: 2,  name: '哈基米干饭学徒', min: 60,   emoji: '🍚', desc: '闻到饭香就会摇尾巴' },
  { lv: 3,  name: '曼波拉屎小将',   min: 150,  emoji: '💩', desc: '一泻千里，气势如虹' },
  { lv: 4,  name: '哈基米瞌睡虫',   min: 280,  emoji: '😴', desc: '一天不睡够 25 小时' },
  { lv: 5,  name: '曼波干饭骑士',   min: 460,  emoji: '🍜', desc: '碗里的最后一粒米也不放过' },
  { lv: 6,  name: '哈基米膀胱领主', min: 700,  emoji: '👑', desc: '膀胱容量深不可测' },
  { lv: 7,  name: '曼波肠胃法王',   min: 1000, emoji: '🧘', desc: '五谷轮回，尽在掌握' },
  { lv: 8,  name: '哈基米作息鬼才', min: 1400, emoji: '🌙', desc: '睡得比鸡晚，起得比鬼早' },
  { lv: 9,  name: '曼波永生尊者',   min: 1900, emoji: '🕉️', desc: '活着，就是最大的行为艺术' },
  { lv: 10, name: '哈基米·曼波之神', min: 2500, emoji: '✨', desc: '曼波哈基米南北绿豆，哈呀路亚' },
];

/** 等级解锁的功能 */
const LEVEL_UNLOCKS = [
  { lv: 1,  key: 'pee',       name: '尿了么',       emoji: '💧', desc: '最基础的生存记录' },
  { lv: 2,  key: 'poop',      name: '拉了么',       emoji: '💩', desc: '开放肠道记录' },
  { lv: 3,  key: 'eat',       name: '吃了么',       emoji: '🍚', desc: '开放干饭记录' },
  { lv: 4,  key: 'sleep',     name: '睡了么',       emoji: '😴', desc: '开放睡眠记录' },
  { lv: 5,  key: 'alive',     name: '活着么',       emoji: '🫀', desc: '开放存活打卡与活法' },
  { lv: 6,  key: 'voice',     name: '哈基米语音',   emoji: '🔊', desc: '解锁完整哈基米音效包' },
  { lv: 7,  key: 'outfit',    name: '曼波换装',     emoji: '👕', desc: '解锁给曼波穿衣服、挂勋章' },
  { lv: 8,  key: 'tone',      name: '哈基米语气',   emoji: '💬', desc: '解锁傲娇/毒舌/黏人语气包' },
  { lv: 9,  key: 'community', name: '社区广场',     emoji: '🌐', desc: '解锁发帖、评论、点赞' },
  { lv: 10, key: 'comfort',   name: '哈基米高级安慰', emoji: '🫂', desc: '解锁深夜高级安慰与长语音' },
];

/* ============================ 记录类型与细分状态 ============================ */
const RECORD_TYPES = {
  pee: {
    key: 'pee', name: '尿了么', emoji: '💧', color: '#5ec8f2', unlockLv: 1,
    question: '今天尿了么？', verb: '尿', unit: '次',
    statuses: [
      { key: 'normal',   label: '正常尿了',   emoji: '☺️', points: 10, value: 1, tone: 'good', line: '哈基米：很好，膀胱通畅，赏你一颗绿豆。' },
      { key: 'stone',    label: '结石了',     emoji: '😣', points: 3,  value: 0, tone: 'bad',  line: '哈基米：结石了？！你再不喝水我就要抽你了！去喝水！现在！' },
      { key: 'forgot',   label: '忘了',       emoji: '🤔', points: 2,  value: 0, tone: 'warn', line: '哈基米：连尿没尿都忘了，你的脑子是拿来装饰的吗？' },
      { key: 'frequent', label: '尿过了',     emoji: '🚽', points: 4,  value: 0, tone: 'warn', line: '哈基米：够能尿的啊你，是水桶成精了吗？' },
    ],
  },
  poop: {
    key: 'poop', name: '拉了么', emoji: '💩', color: '#c99a5b', unlockLv: 2,
    question: '今天拉了么？', verb: '拉', unit: '次',
    statuses: [
      { key: 'normal',       label: '正常拉了', emoji: '☺️', points: 10, value: 1, tone: 'good', line: '哈基米：通畅！这是曼波认证的黄金一坨。' },
      { key: 'constipation', label: '便秘了',   emoji: '😖', points: 3,  value: 0, tone: 'bad',  line: '哈基米：便秘？多吃菜多喝水，别老坐着不动！' },
      { key: 'diarrhea',     label: '拉稀了',   emoji: '😵', points: 3,  value: 0, tone: 'bad',  line: '哈基米：拉稀了……是不是又乱吃什么了？' },
      { key: 'forgot',       label: '忘了',     emoji: '🤔', points: 2,  value: 0, tone: 'warn', line: '哈基米：这也能忘？你的肠道存在感就这么低吗。' },
    ],
  },
  eat: {
    key: 'eat', name: '吃了么', emoji: '🍚', color: '#ff9f68', unlockLv: 3,
    question: '今天吃了么？', verb: '吃', unit: '顿',
    statuses: [
      { key: 'normal',  label: '正常吃了', emoji: '☺️', points: 10, value: 1, tone: 'good', line: '哈基米：干饭人干饭魂！' },
      { key: 'bad',     label: '不好吃',   emoji: '😕', points: 4,  value: 0, tone: 'warn', line: '哈基米：不好吃也要吃完啊，粒粒皆辛苦。' },
      { key: 'notFull', label: '没吃饱',   emoji: '😢', points: 4,  value: 0, tone: 'warn', line: '哈基米：没吃饱？曼波分你半根火腿肠。' },
      { key: 'spoiled', label: '坏掉了',   emoji: '🤢', points: 2,  value: 0, tone: 'bad',  line: '哈基米：吃坏掉的东西？你是铁胃勇士吗！' },
      { key: 'forgot',  label: '忘了',     emoji: '🤔', points: 2,  value: 0, tone: 'warn', line: '哈基米：饭都能忘？你的胃在哭啊笨蛋。' },
      { key: 'vomit',   label: '吐了',     emoji: '🤮', points: 2,  value: 0, tone: 'bad',  line: '哈基米：吐了……先喝点温水，别急着吃东西。' },
      { key: 'fast',    label: '绝食',     emoji: '✊', points: 2,  value: 0, tone: 'bad',  line: '哈基米：绝食抗议？抗议谁？抗议你自己吗？' },
      { key: 'busy',    label: '太忙了',   emoji: '😵‍💫', points: 3, value: 0, tone: 'warn', line: '哈基米：再忙也要记得好好吃饭哦～唱一下：哈基米哟南北绿豆，哈呀路亚咯～' },
    ],
  },
  sleep: {
    key: 'sleep', name: '睡了么', emoji: '😴', color: '#8f8ae0', unlockLv: 4,
    question: '昨天睡了么？睡得怎么样？', verb: '睡', unit: '觉',
    statuses: [
      { key: 'good',    label: '睡得好',     emoji: '☺️', points: 10, value: 1, tone: 'good', line: '哈基米：睡得好，曼波也安心了。' },
      { key: 'miss',    label: '想她了',     emoji: '💔', points: 4,  value: 0, tone: 'warn', line: '哈基米：靠北啦！在想她我抽你？给老子睡觉！' },
      { key: 'nightmare', label: '做噩梦了', emoji: '👻', points: 5,  value: 0, tone: 'warn', line: '哈基米：做噩梦了？说来听听，曼波给你解个梦。' },
      { key: 'overAM',  label: '上午没睡醒', emoji: '😪', points: 5,  value: 0, tone: 'warn', line: '哈基米：上午没睡醒？昨晚又干啥去了！' },
      { key: 'overNoon',label: '午觉睡过了', emoji: '🥱', points: 5,  value: 0, tone: 'warn', line: '哈基米：午觉睡过头，下午人都要废了。' },
      { key: 'allday',  label: '睡了一天',   emoji: '🛌', points: 3,  value: 0, tone: 'bad',  line: '哈基米：睡那么多，你再浪费时间？！起来！给我起来！' },
    ],
  },
  alive: {
    key: 'alive', name: '活着么', emoji: '🫀', color: '#ff6b8a', unlockLv: 5,
    question: '今天，你还活着么？', verb: '活', unit: '天',
    statuses: [
      { key: 'proud',   label: '骄傲的活着', emoji: '😎', points: 12, value: 1, tone: 'good', line: '哈基米：骄傲地活着！曼波为你骄傲。' },
      { key: 'niuma',   label: '牛马的活着', emoji: '🐴', points: 10, value: 1, tone: 'good', line: '哈基米：牛马也是马，跑起来也是风。我还在，你别沮丧。' },
      { key: 'painful', label: '痛苦的活着', emoji: '😖', points: 8,  value: 1, tone: 'warn', line: '哈基米：痛苦也没关系，我在呢，我还在，你别沮丧😟。' },
      { key: 'normal',  label: '活着',       emoji: '🫀', points: 8,  value: 1, tone: 'good', line: '哈基米：活着就好，活着就有下一顿。' },
    ],
  },
};

const RECORD_ORDER = ['pee', 'poop', 'eat', 'sleep', 'alive'];

/* ============================ 成就勋章 ============================ */
const MEDALS = [
  // 尿了么
  { id: 'pee_1',    name: '初尿登场',   emoji: '💧', module: 'pee',   desc: '完成第一次尿尿记录' },
  { id: 'pee_3',    name: '三日尿魂',   emoji: '🌊', module: 'pee',   desc: '连续 3 天记录尿尿' },
  { id: 'pee_100',  name: '钻石膀胱',   emoji: '💎', module: 'pee',   desc: '累计尿尿 100 次' },
  { id: 'pee_water',name: '水桶成精',   emoji: '🪣', module: 'pee',   desc: '单日尿尿超过 10 次' },
  { id: 'pee_night',name: '夜尿战神',   emoji: '🌙', module: 'pee',   desc: '在凌晨 0-5 点记录尿尿' },
  { id: 'pee_clear',name: '通透之人',   emoji: '🔵', module: 'pee',   desc: '连续 7 天尿尿全正常' },
  // 拉了么
  { id: 'poop_1',   name: '黄金一坨',   emoji: '💩', module: 'poop',  desc: '完成第一次拉屎记录' },
  { id: 'poop_7',   name: '肠道法王',   emoji: '🧘', module: 'poop',  desc: '连续 7 天记录拉屎' },
  { id: 'poop_morn',name: '晨间规律',   emoji: '🌅', module: 'poop',  desc: '早上 6-9 点完成拉屎' },
  { id: 'poop_surv',name: '拉稀幸存者', emoji: '🚑', module: 'poop',  desc: '记录一次拉稀并活下来' },
  { id: 'poop_50',  name: '拉神降临',   emoji: '👑', module: 'poop',  desc: '累计拉屎 50 次' },
  // 吃了么
  { id: 'eat_1',    name: '干饭人',     emoji: '🍚', module: 'eat',   desc: '完成第一次吃饭记录' },
  { id: 'eat_30',   name: '干饭之王',   emoji: '🍜', module: 'eat',   desc: '累计吃饭 30 顿' },
  { id: 'eat_take', name: '外卖鉴赏家', emoji: '🛵', module: 'eat',   desc: '记录 10 次不同外卖商家' },
  { id: 'eat_clean',name: '光盘侠',     emoji: '🍽️', module: 'eat',   desc: '连续 5 餐正常干完' },
  { id: 'eat_night',name: '深夜食堂',   emoji: '🍢', module: 'eat',   desc: '在 22 点后记录吃饭' },
  { id: 'eat_fast', name: '绝食抗议者', emoji: '✊', module: 'eat',   desc: '记录一次绝食' },
  // 睡了么
  { id: 'sleep_1',  name: '入眠新手',   emoji: '😴', module: 'sleep', desc: '完成第一次睡眠记录' },
  { id: 'sleep_7',  name: '作息鬼才',   emoji: '🕰️', module: 'sleep', desc: '连续 7 天记录睡眠' },
  { id: 'sleep_god',name: '睡神',       emoji: '🌌', module: 'sleep', desc: '连续 7 天睡得好' },
  { id: 'sleep_miss',name:'想她了',     emoji: '💔', module: 'sleep', desc: '记录一次想她了' },
  { id: 'sleep_dream',name:'噩梦解析者', emoji: '🔮', module: 'sleep', desc: '记录并解析一次噩梦' },
  { id: 'sleep_late',name: '回笼觉冠军', emoji: '🥇', module: 'sleep', desc: '记录一次午觉睡过头' },
  // 活着么
  { id: 'alive_1',  name: '活着的证明', emoji: '🫀', module: 'alive', desc: '完成第一次活着打卡' },
  { id: 'alive_7',  name: '周更存活',   emoji: '📅', module: 'alive', desc: '连续 7 天打卡活着' },
  { id: 'alive_nm', name: '牛马生存家', emoji: '🐴', module: 'alive', desc: '以牛马的活法活过 10 天' },
  { id: 'alive_pd', name: '骄傲生存者', emoji: '😎', module: 'alive', desc: '以骄傲的活法活过 10 天' },
  { id: 'alive_god',name: '永生曼波',   emoji: '🕉️', module: 'alive', desc: '累计打卡活着 100 天' },
  // 综合 / 榜单
  { id: 'all_perfect', name: '完美一日',  emoji: '🌈', module: 'all', desc: '同一天尿拉吃睡全部正常' },
  { id: 'all_streak', name: '全勤之星',  emoji: '⭐', module: 'all', desc: '连续 7 天四项全勤' },
  { id: 'all_extra',  name: '曼波宠儿',  emoji: '💖', module: 'all', desc: '额外值累计达到 30' },
  { id: 'rank_week',  name: '周榜五强',  emoji: '🎖️', module: 'rank', desc: '进入任意周榜前五' },
  { id: 'rank_month', name: '月榜五强',  emoji: '🏅', module: 'rank', desc: '进入任意月榜前五' },
  { id: 'rank_year',  name: '年榜五强',  emoji: '🏆', module: 'rank', desc: '进入任意年榜前五' },
  { id: 'rank_area',  name: '地区之王',  emoji: '🗺️', module: 'rank', desc: '地区榜第一名' },
  { id: 'rank_all',   name: '全国第一',  emoji: '👑', module: 'rank', desc: '全国榜第一名' },
];

/* ============================ 曼波台词库 ============================ */
const MAMBO_LINES = {
  // 点击曼波掀衣服
  peek: [
    '哼！突然掀我衣服干嘛，变态！',
    '看什么看，没见过这么可爱的肚皮吗！',
    '呀！你……你别乱摸啦！',
    '再掀一次信不信我咬你！',
    '我、我才没有因为你来看我就高兴呢！',
  ],
  // 衣服太多
  tooMany: [
    '曼波快闷死了啦！给我脱一件！',
    '你给我穿这么多是想捂死我继承我的绿豆吗！',
    '热……热死了……曼波要融化了……',
  ],
  suffocate: [
    '曼波被你闷坏了，曼波不再爱你了。（真的）',
    '…………曼波已经没有力气吐槽你了。',
  ],
  // 傲娇
  tsundere: [
    '哼，才、才不是专门为你准备的呢。',
    '你今天表现还行吧……就一点点哦。',
    '别得意忘形，曼波可没有夸你。',
  ],
  // 安慰
  comfort: [
    '我在呢。你别沮丧😟，今天也辛苦了。',
    '没关系的，曼波的肚皮借给你靠一下。',
    '活着就已经很了不起了，真的。',
    '哈基米哟南北绿豆，哈呀路亚～给你唱首歌。',
  ],
  // 长时间没记录 / 嗝屁风险
  miss: [
    '喂……你还在吗？多久没来看我了。',
    '你是不是忘记你最爱的哈基米了？',
    '再不出现，我就要离家出走了哦。',
    '曼波一个人好可怜，快回来打卡。',
  ],
  danger: [
    '⚠️ 嗝屁风险警告！你已经很久没有记录了！',
    '你该不会……已经嗝屁了吧？快动一下让我知道你还活着！',
    '曼波要报警了！你再不记录我就发朋友圈找你！',
  ],
  // 噩梦解梦模板
  dream: [
    '梦到被追赶：最近压力有点大，曼波建议你把待办清单砍掉一半。',
    '梦到掉落：失控感在作祟，睡前别刷让你焦虑的东西。',
    '梦到考试/迟到：典型的"被评价焦虑"，你已经很努力了。',
    '梦到找厕所：憋尿了，起来尿个尿再睡，真的。',
    '梦到已故的人：是思念，白天找个时间好好想想 TA。',
    '梦到飞来飞去：身体在告诉你想要自由，周末出去走走吧。',
    '梦到掉牙：对变化的焦虑，最近生活是不是要变天了？',
    '梦到水：情绪在流动，哭出来也没关系的。',
  ],
};

/* ============================ 衣服与季节 ============================ */
const CLOTHES = [
  { key: 'tank',   name: '背心',   emoji: '🎽', warm: 1, season: ['summer', 'winter'] },
  { key: 'long',   name: '长袖',   emoji: '👕', warm: 2, season: ['summer', 'winter'] },
  { key: 'vest',   name: '马甲',   emoji: '🦺', warm: 3, season: ['winter'] },
  { key: 'coat',   name: '外套',   emoji: '🧥', warm: 4, season: ['winter'] },
  { key: 'puffer', name: '羽绒服', emoji: '🧣', warm: 5, season: ['winter'] },
];
const SEASON_LIMIT = { winter: 5, summer: 2 };
const SLOTS_PER_LAYER = 100; // 每件衣服内层 100 格 + 外层 100 格

/* ============================ 地区 ============================ */
const REGIONS = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安', '南京', '重庆', '长沙', '苏州'];

/* ============================ 外卖商家（识别演示用） ============================ */
const TAKEOUT_SHOPS = ['麦当劳', '肯德基', '瑞幸咖啡', '蜜雪冰城', '华莱士', '沙县小吃', '兰州拉面', '杨国福麻辣烫', '美团外卖·无名小店', '海底捞', '塔斯汀', '老乡鸡'];

/* ============================ 未来规划模块 ============================ */
const FUTURE_MODULES = [
  { group: '互动玩法', items: ['抽奖模块', '分享模块（生成打卡海报）', '连连看 / 麻将 / 斗地主 / 掷骰子 / 石头剪刀布', '好友对战与战绩'] },
  { group: '数据收集', items: ['App 使用记录（打开、使用时长、次数）', '手机状态（电量、蓝牙、音量、存储）', '通话记录与锁屏截屏', '屏幕使用时间报告', '待办事项'] },
  { group: '位置与轨迹', items: ['定位与轨迹停留', '好友路况共享', '去找你的路径规划与自动导航', '两人距离与位置互发', '查看对方曼波状态', '曼波合并生小曼波'] },
  { group: '关系', items: ['账号亲人关联（假闺蜜 / 真闺蜜 / 基友 / 爱人）', '交友模块（添加好友、好友对话、分享）'] },
  { group: '系统', items: ['桌面小组件（定位、轨迹、纪念日）', '权限中心（定位、自启、后台、通知、使用情况、电话、锁屏、截屏）', '敏感操作记录（登录、关闭权限）', '数据安全与保留时长设置'] },
];

/* ============================ 工具 ============================ */
function levelOf(points) {
  let lv = LEVELS[0];
  for (const l of LEVELS) if (points >= l.min) lv = l;
  return lv;
}
function nextLevel(points) {
  return LEVELS.find(l => l.min > points) || null;
}
function isUnlocked(lv, key) {
  const u = LEVEL_UNLOCKS.find(x => x.key === key);
  return u ? lv >= u.lv : true;
}
function medalById(id) {
  return MEDALS.find(m => m.id === id);
}

  window.HJ.config = {
    LEVELS, LEVEL_UNLOCKS, RECORD_TYPES, RECORD_ORDER, MEDALS, MAMBO_LINES,
    CLOTHES, SEASON_LIMIT, SLOTS_PER_LAYER, REGIONS, TAKEOUT_SHOPS, FUTURE_MODULES,
    levelOf, nextLevel, isUnlocked, medalById,
  };
})();

/* 兼容旧引用：部分页面可能直接取全局 */
