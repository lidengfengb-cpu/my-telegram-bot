/**
 * 生成验证题（当前使用）
 * 随机从两种题型中出一种：四则运算 / emoji 计数，真人一眼就能看懂。
 * 两者都返回 { question, answer }，answer 统一为两位数字字符串，兼容选项与校验逻辑。
 */
function generateMathProblem() {
  // 50% 概率出 emoji 计数题，50% 出四则运算题
  if (Math.random() < 0.5) {
    return generateEmojiCountProblem();
  }

  const ops = ['+', '-', '*', '/'];
  const op = ops[Math.floor(Math.random() * ops.length)];

  let a, b, result;

  switch (op) {
    case '+': {
      // 两位数相加，结果不超过 99
      do {
        a = Math.floor(Math.random() * 90) + 10; // 10-99
        b = Math.floor(Math.random() * 90) + 10; // 10-99
      } while (a + b > 99);
      result = a + b;
      break;
    }
    case '-': {
      // 大数减小数，结果非负
      a = Math.floor(Math.random() * 90) + 10; // 10-99
      b = Math.floor(Math.random() * a) + 1;   // 1-a
      result = a - b;
      break;
    }
    case '*': {
      // 一位数乘一位数，结果 4-81
      a = Math.floor(Math.random() * 8) + 2; // 2-9
      b = Math.floor(Math.random() * 8) + 2; // 2-9
      result = a * b;
      break;
    }
    case '/': {
      // 整除：被除数 = 除数 × 商
      b = Math.floor(Math.random() * 8) + 2;     // 除数 2-9
      result = Math.floor(Math.random() * 8) + 2; // 商 2-9
      a = b * result;
      break;
    }
  }

  const symbol = { '+': '+', '-': '-', '*': '×', '/': '÷' }[op];
  const question = `${a} ${symbol} ${b} = ?`;
  return {
    question: question,
    answer: String(result).padStart(2, '0')
  };
}

/**
 * 生成 emoji 计数题
 * 一行 5~8 个混合 emoji，目标是数出其中某一种的数量（1~4 个），真人一眼即可数清。
 */
function generateEmojiCountProblem() {
  // 可用 emoji 池，保证字符宽度接近、视觉整齐
  const emojiPool = ['🍎', '🍌', '🍊', '🍇', '🍒', '🍓'];
  
  // 随机选一种作为"目标 emoji"
  const target = emojiPool[Math.floor(Math.random() * emojiPool.length)];
  // 目标的出现次数控制在 1~4（真实好数）
  const targetCount = Math.floor(Math.random() * 4) + 1;
  // 总共 5~8 个
  const total = 5 + Math.floor(Math.random() * 4);
  // 干扰种类（从剩余 emoji 中随机再挑 1~2 种，让区分度适中）
  const distractors = emojiPool
    .filter(e => e !== target)
    .sort(() => Math.random() - 0.5)
    .slice(0, 1 + Math.floor(Math.random() * 2));

  // 组装：先放 targetCount 个目标，再随机补满到 total 个干扰项，最后洗牌打乱位置
  const items = [];
  for (let i = 0; i < targetCount; i++) items.push(target);
  while (items.length < total) {
    items.push(distractors[Math.floor(Math.random() * distractors.length)]);
  }
  items.sort(() => Math.random() - 0.5);

  // 两行展示，避免一行过长
  const rowLen = Math.ceil(items.length / 2);
  const emojiRow1 = items.slice(0, rowLen).join(' ');
  const emojiRow2 = items.slice(rowLen).join(' ');

  return {
    question: `${emojiRow1}\n${emojiRow2}\n\n这些 emoji 里有多少个 ${target}？`,
    answer: String(targetCount).padStart(2, '0')
  };
}

/* ============================================================
 * 【旧版验证题】基于时间的数学题（暂时注释保留，可随时放开）
 * 如需恢复旧版：
 *   1. 删除上方"生成简单数学验证题"函数整体；
 *   2. 取消下方这段的注释即可。
 * 原逻辑：使用 Intl.DateTimeFormat 获取指定时区的时间，
 * 选取 HHMM 中两位数字各加随机值，超过10取个位数，组成答案。
 * ============================================================
function generateMathProblem() {
  // 使用 Intl.DateTimeFormat 获取指定时区的时间
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  
  // 解析格式化后的时间部分
  const parts = formatter.formatToParts(new Date());
  const timeObj = {};
  parts.forEach(part => {
    if (part.type !== 'literal') {
      timeObj[part.type] = part.value;
    }
  });
  
  // ✨ 改进 1：只取 HHmm（4位数字），不取秒
  const timeDigits = timeObj.hour + timeObj.minute;
  
  // 随机选取两个不同的位置
  let pos1 = Math.floor(Math.random() * timeDigits.length);
  let pos2 = Math.floor(Math.random() * timeDigits.length);
  while (pos2 === pos1) {
    pos2 = Math.floor(Math.random() * timeDigits.length);
  }
  
  // ✨ 随机生成两个不同的加值
  let addValue1 = Math.floor(Math.random() * (VERIFY_ADD_VALUE_MAX - VERIFY_ADD_VALUE_MIN + 1)) + VERIFY_ADD_VALUE_MIN;
  let addValue2 = Math.floor(Math.random() * (VERIFY_ADD_VALUE_MAX - VERIFY_ADD_VALUE_MIN + 1)) + VERIFY_ADD_VALUE_MIN;
  while (addValue2 === addValue1) {
    addValue2 = Math.floor(Math.random() * (VERIFY_ADD_VALUE_MAX - VERIFY_ADD_VALUE_MIN + 1)) + VERIFY_ADD_VALUE_MIN;
  }
  
  // 获取两个数字
  const digit1 = parseInt(timeDigits[pos1]);
  const digit2 = parseInt(timeDigits[pos2]);
  
  // 计算答案（超过10则取个位数）
  const result1 = (digit1 + addValue1) % 10;
  const result2 = (digit2 + addValue2) % 10;
  
  // ✨ 使用模板字符串保留前导0
  const answer = `${result1}${result2}`;
  
  // ✨ 改进 2：隐藏具体时间，只显示"UTC+8时间"提示
  const question = `以UTC+8时间的 时分（HHMM格式，仅数字）四位数字的\n\n第${pos1 + 1}位数字 + ${addValue1} = ?\n第${pos2 + 1}位数字 + ${addValue2} = ?\n\n按顺序组成两位数即为答案`;
  
  return { 
    question: question, 
    answer: answer
  };
}
 ============================================================ */


/**
 * 常量配置和环境变量初始化
 */
let TOKEN, WEBHOOK, SECRET, ADMIN_UID, db;

const NOTIFY_INTERVAL = 24 * 3600 * 1000;  // ⏱️ 24小时通知间隔
const fraudDb = 'https://raw.githubusercontent.com/lidengfengb-cpu/my-telegram-bot/main/data/fraud.db';
const notificationUrl = 'https://raw.githubusercontent.com/lidengfengb-cpu/my-telegram-bot/main/data/notification.txt';
const enable_notification = false;  // 🔕 通知功能开关（false=关闭，改为 true 后超间隔会提醒管理员）
const FRAUD_CACHE_TTL = 600000;     // ⏱️ 诈骗名单缓存时长：10 分钟
const MAX_VERIFY_ATTEMPTS = 3;  // 🔢 最多尝试3次（防止脚本穷举6个按钮）
const BLOCK_COOLDOWN_MS = 2 * 60 * 1000;  // ⏱️ 答错3次后的冷却时间：2 分钟（冷却结束后可重新验证）
const VERIFICATION_TTL = 300;  // ⏱️ 验证码过期时间：5分钟（300秒）
const VERIFIED_TTL = 259200;  // ⏱️ 验证成功有效期：3天（259200秒）

/**
 * 处理请求的主入口
 */
function initConfig(env) {
  TOKEN = env.BOT_TOKEN;
  SECRET = env.BOT_SECRET;
  ADMIN_UID = env.ADMIN_UID;
  WEBHOOK = '/endpoint';
  
  if (!TOKEN || !SECRET || !ADMIN_UID) {
    throw new Error('❌ 环境变量未配置: BOT_TOKEN, BOT_SECRET, ADMIN_UID');
  }
}

/**
 * 校验是否为管理员发起的接口请求（复用 BOT_SECRET 作为管理口令）
 * 支持两种传参方式：URL 查询参数 ?token=xxx，或请求头 X-Admin-Token: xxx
 */
function isAdminRequest(request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token') || request.headers.get('X-Admin-Token');
  return token === SECRET;
}

/**
 * D1 数据库操作类
 */
class Database {
  constructor(d1) {
    this.d1 = d1;
  }

  // 白名单操作
  async isWhitelisted(userId) {
    const result = await this.d1.prepare(
      'SELECT user_id FROM whitelist WHERE user_id = ?'
    ).bind(userId.toString()).first();
    
    return !!result;
  }

  async addWhitelist(userId) {
    await this.d1.prepare(
      'INSERT OR IGNORE INTO whitelist (user_id, created_at) VALUES (?, ?)'
    ).bind(userId.toString(), Date.now()).run();
  }

  async removeWhitelist(userId) {
    await this.d1.prepare(
      'DELETE FROM whitelist WHERE user_id = ?'
    ).bind(userId.toString()).run();
  }

  async getWhitelist() {
    const result = await this.d1.prepare(
      'SELECT user_id FROM whitelist ORDER BY created_at DESC'
    ).all();
    
    return result.results || [];
  }

  // 验证状态操作
  async getVerificationState(userId) {
    // ✨ 改进：直接在 SQL 中过滤过期数据，更高效
    const result = await this.d1.prepare(
      'SELECT answer, attempts, created_at FROM verification WHERE user_id = ? AND created_at > ?'
    ).bind(userId.toString(), Date.now() - 300000).first();
    
    return result || null;
  }

  async setVerification(userId, answer, attempts = 0) {
    await this.d1.prepare(
      'INSERT OR REPLACE INTO verification (user_id, answer, attempts, created_at) VALUES (?, ?, ?, ?)'
    ).bind(userId.toString(), answer, attempts, Date.now()).run();
  }

  async deleteVerification(userId) {
    await this.d1.prepare(
      'DELETE FROM verification WHERE user_id = ?'
    ).bind(userId.toString()).run();
  }

  // 验证成功状态
  async isVerified(userId) {
    const result = await this.d1.prepare(
      'SELECT user_id FROM verified_users WHERE user_id = ? AND expiry_time > ?'
    ).bind(userId.toString(), Date.now()).first();
    
    return !!result;
  }

  async setVerified(userId, expirationTtl = 259200) {
    const expiryTime = Date.now() + (expirationTtl * 1000);
    await this.d1.prepare(
      'INSERT OR REPLACE INTO verified_users (user_id, expiry_time) VALUES (?, ?)'
    ).bind(userId.toString(), expiryTime).run();
  }

  // 屏蔽用户操作
  async isBlocked(userId) {
    const result = await this.d1.prepare(
      'SELECT user_id FROM blocked_users WHERE user_id = ?'
    ).bind(userId.toString()).first();
    
    return !!result;
  }

  async blockUser(userId) {
    await this.d1.prepare(
      'INSERT OR IGNORE INTO blocked_users (user_id, blocked_at) VALUES (?, ?)'
    ).bind(userId.toString(), Date.now()).run();
  }

  async unblockUser(userId) {
    await this.d1.prepare(
      'DELETE FROM blocked_users WHERE user_id = ?'
    ).bind(userId.toString()).run();
  }

  // 验证冷却（答错次数超标后的临时屏蔽）操作
  async setCooldown(userId, untilMs) {
    await this.d1.prepare(
      'INSERT OR REPLACE INTO verification_cooldowns (user_id, cooldown_until) VALUES (?, ?)'
    ).bind(userId.toString(), untilMs).run();
  }

  async getCooldownRemaining(userId) {
    const result = await this.d1.prepare(
      'SELECT cooldown_until FROM verification_cooldowns WHERE user_id = ?'
    ).bind(userId.toString()).first();

    if (!result) return 0;

    const remaining = result.cooldown_until - Date.now();
    if (remaining <= 0) {
      // 冷却已结束，自动清除记录
      await this.d1.prepare(
        'DELETE FROM verification_cooldowns WHERE user_id = ?'
      ).bind(userId.toString()).run();
      return 0;
    }
    return remaining;
  }

  // 消息映射操作
  async getMessageMap(key) {
    const result = await this.d1.prepare(
      'SELECT mapped_value FROM message_mappings WHERE mapping_key = ?'
    ).bind(key).first();
    
    return result?.mapped_value || null;
  }

  async setMessageMap(key, value) {
    await this.d1.prepare(
      'INSERT OR REPLACE INTO message_mappings (mapping_key, mapped_value, created_at) VALUES (?, ?, ?)'
    ).bind(key, value, Date.now()).run();
  }

  // 消息时间戳操作
  async getLastMessageTime(userId) {
    const result = await this.d1.prepare(
      'SELECT last_message_time FROM message_rates WHERE user_id = ?'
    ).bind(userId.toString()).first();
    
    return result?.last_message_time || 0;
  }

  async setLastMessageTime(userId, timestamp) {
    await this.d1.prepare(
      'INSERT OR REPLACE INTO message_rates (user_id, last_message_time) VALUES (?, ?)'
    ).bind(userId.toString(), timestamp).run();
  }
}

/**
 * 构建 Telegram API URL
 */
function apiUrl(methodName, params = null) {
  let query = '';
  if (params) {
    query = '?' + new URLSearchParams(params).toString();
  }
  return `https://api.telegram.org/bot${TOKEN}/${methodName}${query}`;
}

/**
 * 发送 Telegram 请求
 */
function requestTelegram(methodName, body, params = null) {
  return fetch(apiUrl(methodName, params), body).then(r => r.json());
}

/**
 * 构建请求体
 */
function makeReqBody(body) {
  return {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  };
}

/**
 * 发送消息
 */
function sendMessage(msg = {}) {
  return requestTelegram('sendMessage', makeReqBody(msg));
}

/**
 * 复制消息
 */
function copyMessage(msg = {}) {
  return requestTelegram('copyMessage', makeReqBody(msg));
}

/**
 * 转发消息
 */
function forwardMessage(msg) {
  return requestTelegram('forwardMessage', makeReqBody(msg));
}

/**
 * Webhook 监听 (Cloudflare Workers)
 */
export default {
  async fetch(request, env, ctx) {
    // 初始化配置
    initConfig(env);
    
    // 初始化数据库
    if (!db && env.lan) {
      db = new Database(env.lan);
    }
    
    const url = new URL(request.url);
    
    if (url.pathname === WEBHOOK) {
      return handleWebhook(request, ctx);
    } else if (url.pathname === '/registerWebhook') {
      return isAdminRequest(request) ? registerWebhook(url) : new Response('Unauthorized', { status: 403 });
    } else if (url.pathname === '/unRegisterWebhook') {
      return isAdminRequest(request) ? unRegisterWebhook() : new Response('Unauthorized', { status: 403 });
    } else if (url.pathname === '/initDatabase') {
      return isAdminRequest(request) ? initDatabase(env.lan) : new Response('Unauthorized', { status: 403 });
    } else {
      return new Response('No handler for this request', { status: 404 });
    }
  }
};

/**
 * 处理 Webhook
 */
let commandsPromise = null;

/**
 * 注册 bot 命令菜单（输入框左侧点 "/" 可见）。
 * 这样用户点击即可发送 /start，无需手动输入。
 */
function ensureBotCommands() {
  if (commandsPromise) return commandsPromise;

  // 普通用户命令菜单：输入框左侧点 "/" 只显示 start
  const setUserCommands = requestTelegram('setMyCommands', makeReqBody({
    commands: [
      { command: 'start', description: '开始使用 / 重新验证' }
    ]
  }));

  // 管理员专属命令菜单：scope 限定为管理员（ADMIN_UID）单独生效
  const setAdminCommands = requestTelegram('setMyCommands', makeReqBody({
    commands: [
      { command: 'start', description: '开始使用 / 重新验证' },
      { command: 'block', description: '屏蔽用户 (可带 UID)' },
      { command: 'unblock', description: '解除屏蔽 (可带 UID)' },
      { command: 'checkblock', description: '查询屏蔽状态 (可带 UID)' },
      { command: 'addwhite', description: '添加白名单 (可带 UID)' },
      { command: 'removewhite', description: '移除白名单 (可带 UID)' },
      { command: 'checkwhite', description: '查询白名单 (可带 UID)' },
      { command: 'listwhite', description: '列出所有白名单' }
    ],
    scope: { type: 'chat', chat_id: parseInt(ADMIN_UID) }
  }));

  commandsPromise = Promise.all([setUserCommands, setAdminCommands]).catch(err => {
    console.error('注册 bot 命令菜单失败:', err);
    commandsPromise = null; // 失败后允许下次重试
  });
  return commandsPromise;
}

async function handleWebhook(request, ctx) {
  if (request.headers.get('X-Telegram-Bot-Api-Secret-Token') !== SECRET) {
    return new Response('Unauthorized', { status: 403 });
  }
  
  try {
    const update = await request.json();
    ctx.waitUntil(ensureBotCommands());       // 异步注册命令菜单，不影响响应
    ctx.waitUntil(onUpdate(update));
    return new Response('Ok');
  } catch (err) {
    console.error('❌ 处理 Webhook 错误:', err);
    return new Response('Error: ' + err.message, { status: 500 });
  }
}

/**
 * 处理消息
 */
async function onMessage(message) {
  // /start 命令
  if (message.text === '/start') {
    const chatId = message.chat.id.toString();
    const verified = await db.isVerified(chatId);

    if (verified) {
      // ✅ 已验证用户：不再展示验证引导
      return sendMessage({
        chat_id: chatId,
        text: '<b>👋 欢迎回来！</b>你已通过验证，直接发送消息即可和我对话～',
        parse_mode: 'HTML'
      });
    }

    // 未验证用户：展示验证引导
    return sendMessage({
      chat_id: chatId,
      text: '<b>👋 你好，欢迎来访！</b>\n\n为过滤广告机器人，请先完成一道简单的数学验证题，通过后你的消息就会直接转达给我。\n\n<i>直接发送任意消息即可开始验证～</i>',
      parse_mode: 'HTML'
    });
  }

  // 管理员命令
  if (message.chat.id.toString() === ADMIN_UID) {
    // ✅ 添加到白名单
    if (/^\/addwhite(?:\s+(\d+))?$/.test(message.text)) {
      return handleAddWhitelist(message);
    }
    
    // ✅ 从白名单移除
    if (/^\/removewhite(?:\s+(\d+))?$/.test(message.text)) {
      return handleRemoveWhitelist(message);
    }
    
    // ✅ 检查白名单状态
    if (/^\/checkwhite(?:\s+(\d+))?$/.test(message.text)) {
      return handleCheckWhitelist(message);
    }
    
    // ✅ 列出所有白名单
    if (/^\/listwhite$/.test(message.text)) {
      return handleListWhitelist(message);
    }

    // ✅ 解除屏蔽：支持直接带 UID（不需要回复消息），也可回复转发的消息
    if (/^\/unblock(?:\s+(\d+))?$/.test(message.text)) {
      return handleUnBlock(message);
    }

    // ✅ 屏蔽用户：支持直接带 UID，也可回复转发的消息
    if (/^\/block(?:\s+(\d+))?$/.test(message.text)) {
      return handleBlock(message);
    }

    // ✅ 检查屏蔽状态：支持直接带 UID，也可回复转发的消息
    if (/^\/checkblock(?:\s+(\d+))?$/.test(message.text)) {
      return checkBlock(message);
    }

    if (!message?.reply_to_message?.chat) {
      return sendMessage({
        chat_id: ADMIN_UID,
        text: '使用方法，回复转发的消息，并发送回复消息，或指令:\n' +
              '/block [UID] - 屏蔽用户\n' +
              '/unblock [UID] - 解除屏蔽\n' +
              '/checkblock [UID] - 检查屏蔽状态\n' +
              '/addwhite [UID] - 添加到白名单\n' +
              '/removewhite [UID] - 从白名单移除\n' +
              '/checkwhite [UID] - 检查白名单状态\n' +
              '/listwhite - 列出所有白名单用户'
      });
    }

    const guestChatId = await db.getMessageMap('msg-map-' + message?.reply_to_message.message_id);
    return copyMessage({
      chat_id: guestChatId,
      from_chat_id: message.chat.id,
      message_id: message.message_id
    });
  }

  return handleGuestMessage(message);
}

/**
 * 从消息或命令参数中提取目标 UID
 */
async function getTargetUserId(message) {
  // 优先从命令参数中获取
  const match = message.text.match(/\/\w+\s+(\d+)/);
  if (match) {
    return match[1];
  }
  
  // 其次从回复消息中获取
  if (message.reply_to_message) {
    return await db.getMessageMap('msg-map-' + message.reply_to_message.message_id);
  }
  
  return null;
}

/**
 * 添加用户到白名单
 */
async function handleAddWhitelist(message) {
  const guestChatId = await getTargetUserId(message);
  
  if (!guestChatId) {
    return sendMessage({
      chat_id: ADMIN_UID,
      text: '❌ 用法: /addwhite <UID> 或回复一条转发的消息'
    });
  }

  await db.addWhitelist(guestChatId);
  
  return sendMessage({
    chat_id: ADMIN_UID,
    text: `✅ UID: ${guestChatId} 已添加到白名单`
  });
}

/**
 * 从白名单移除用户
 */
async function handleRemoveWhitelist(message) {
  const guestChatId = await getTargetUserId(message);
  
  if (!guestChatId) {
    return sendMessage({
      chat_id: ADMIN_UID,
      text: '❌ 用法: /removewhite <UID> 或回复一条转发的消息'
    });
  }

  await db.removeWhitelist(guestChatId);
  
  return sendMessage({
    chat_id: ADMIN_UID,
    text: `✅ UID: ${guestChatId} 已从白名单移除`
  });
}

/**
 * 检查白名单状态
 */
async function handleCheckWhitelist(message) {
  const guestChatId = await getTargetUserId(message);
  
  if (!guestChatId) {
    return sendMessage({
      chat_id: ADMIN_UID,
      text: '❌ 用法: /checkwhite <UID> 或回复一条转发的消息'
    });
  }

  const isWhite = await db.isWhitelisted(guestChatId);
  
  return sendMessage({
    chat_id: ADMIN_UID,
    text: `UID: ${guestChatId} ${isWhite ? '✅ 在白名单中' : '❌ 不在白名单中'}`
  });
}

/**
 * 列出所有白名单用户
 */
async function handleListWhitelist(message) {
  const whitelistArray = await db.getWhitelist();
  
  if (whitelistArray.length === 0) {
    return sendMessage({
      chat_id: ADMIN_UID,
      text: '📋 白名单为空'
    });
  }
  
  const list = whitelistArray.map(u => u.user_id).join('\n');
  return sendMessage({
    chat_id: ADMIN_UID,
    text: `📋 白名单用户列表 (共 ${whitelistArray.length} 个):\n${list}`
  });
}

/**
 * 处理回调查询（按钮点击）
 */
async function onCallbackQuery(callbackQuery) {
  try {
    const userId = callbackQuery.from.id.toString();
    const data = callbackQuery.data;
    const messageId = callbackQuery.message.message_id;

    // 格式: verify_{用户选择的选项值}
    if (!data.startsWith('verify_')) {
      return;
    }

    const userAnswer = data.replace(/^verify_/, '');

    // 从数据库读取当前验证题的正确答案（答案不暴露在按钮数据里）
    const verState = await db.getVerificationState(userId);
    if (!verState) {
      await requestTelegram('answerCallbackQuery', makeReqBody({
        callback_query_id: callbackQuery.id,
        text: '⏳ 验证题已过期，请重新发一条消息获取新题',
        show_alert: true
      }));
      return;
    }

    if (userAnswer === verState.answer) {
      await db.setVerified(userId);
      await db.deleteVerification(userId);
      
      await requestTelegram('editMessageText', makeReqBody({
        chat_id: userId,
        message_id: messageId,
        text: '🎉🎊✨ 验证成功！你现在可以正常和我对话啦～',
        reply_markup: undefined
      }));
    } else {
      // 记录尝试次数
      const attempts = (verState.attempts || 0) + 1;
      
      if (attempts >= MAX_VERIFY_ATTEMPTS) {
        // ✅ 答错次数超标：进入 2 分钟冷却，而非永久屏蔽；冷却结束后可重新验证
        await db.setCooldown(userId, Date.now() + BLOCK_COOLDOWN_MS);
        await db.deleteVerification(userId);
        
        await requestTelegram('editMessageText', makeReqBody({
          chat_id: userId,
          message_id: messageId,
          text: '🚫🔥 验证失败次数过多，请 2 分钟后再试～',
          reply_markup: undefined
        }));
      } else {
        // ✅ 答错后不保留旧题，原地换一道新题（只保留最新）；尝试次数继续累计
        await sendVerification(userId, attempts, messageId);
        await requestTelegram('answerCallbackQuery', makeReqBody({
          callback_query_id: callbackQuery.id,
          text: `❌ 回答错误 (${attempts}/${MAX_VERIFY_ATTEMPTS})，请重新作答`,
          show_alert: true
        }));
      }
    }
  } catch (err) {
    console.error('处理回调查询错误:', err);
  }
}

/**
 * 处理更新
 */
async function onUpdate(update) {
  try {
    if ('message' in update) {
      await onMessage(update.message);
    }
    if ('callback_query' in update) {
      await onCallbackQuery(update.callback_query);
    }
  } catch (err) {
    console.error('处理更新错误:', err);
  }
}

/**
 * 处理客户消息
 */
async function handleGuestMessage(message) {
  try {
    const chatId = message.chat.id.toString();

    // ✅ 白名单用户直接跳过验证和屏蔽检查
    const whitelisted = await db.isWhitelisted(chatId);
    
    if (whitelisted) {
      // 白名单用户直接转发消息
      const forwardReq = await forwardMessage({
        chat_id: ADMIN_UID,
        from_chat_id: message.chat.id,
        message_id: message.message_id
      });
      
      if (forwardReq.ok) {
        await db.setMessageMap('msg-map-' + forwardReq.result.message_id, chatId);
        return handleNotify(message, chatId);
      }
      return;
    }

    // 检查是否被屏蔽（永久）
    const isblocked = await db.isBlocked(chatId);
    if (isblocked) {
      return sendMessage({
        chat_id: chatId,
        text: '⛔ 你已被屏蔽，无法继续使用。如有疑问请联系管理员。'
      });
    }

    // 检查是否处于验证冷却期（答错3次后 2 分钟内）
    const cooldownRemaining = await db.getCooldownRemaining(chatId);
    if (cooldownRemaining > 0) {
      const secLeft = Math.ceil(cooldownRemaining / 1000);
      return sendMessage({
        chat_id: chatId,
        text: `⏳ 你验证失败次数过多，请在 ${secLeft} 秒后再试～`
      });
    }

    // 检查是否已验证
    const verified = await db.isVerified(chatId);
    if (!verified) {
      const verState = await db.getVerificationState(chatId);

      if (!verState) {
        return sendVerification(chatId, 0);
      } else {
        return sendMessage({
          chat_id: chatId,
          text: '⏳ 你已有一道未完成的验证题，请在最近的验证消息里选择答案作答～'
        });
      }
    }

    // 诈骗检查
    if (await isFraud(chatId)) {
      return sendMessage({
        chat_id: ADMIN_UID,
        text: `⚠️ 检测到诈骗人员\nUID: ${chatId}`
      });
    }

    // 已验证用户 → 转发消息
    const forwardReq = await forwardMessage({
      chat_id: ADMIN_UID,
      from_chat_id: message.chat.id,
      message_id: message.message_id
    });

    if (forwardReq.ok) {
      await db.setMessageMap('msg-map-' + forwardReq.result.message_id, chatId);
      return handleNotify(message, chatId);
    }
  } catch (err) {
    console.error('处理客户消息错误:', err);
  }
}

/**
 * 生成出一道新验证题并发送（含保存答案与尝试次数）
 * @param chatId 用户 chat_id
 * @param attempts 本次验证已累计的尝试次数（首次为 0，答错换题时保留累计值）
 */
async function sendVerification(chatId, attempts, editMessageId) {
  const { question, answer } = generateMathProblem();
  await db.setVerification(chatId, answer, attempts);

  const options = generateOptions(parseInt(answer));
  const formattedOptions = options.map(opt => String(opt).padStart(2, '0'));

  const colors = ['🟥', '🟧', '🟨', '🟩', '🟦', '🟪'];

  const keyboard = {
    inline_keyboard: [
      [
        { text: `${colors[0]} ${formattedOptions[0]}`, callback_data: `verify_${formattedOptions[0]}` },
        { text: `${colors[1]} ${formattedOptions[1]}`, callback_data: `verify_${formattedOptions[1]}` },
        { text: `${colors[2]} ${formattedOptions[2]}`, callback_data: `verify_${formattedOptions[2]}` }
      ],
      [
        { text: `${colors[3]} ${formattedOptions[3]}`, callback_data: `verify_${formattedOptions[3]}` },
        { text: `${colors[4]} ${formattedOptions[4]}`, callback_data: `verify_${formattedOptions[4]}` },
        { text: `${colors[5]} ${formattedOptions[5]}`, callback_data: `verify_${formattedOptions[5]}` }
      ]
    ]
  };

  const text = `🎲✨ <b>真人验证</b> 🎯\n\n算出下面这道题的答案：\n\n<code>${question}</code>\n\n👇 在下面的彩色按钮中选出正确答案：`;

  if (editMessageId) {
    // 答错换题：原地把旧题改写成新题，始终保持只有一条最新题目
    return requestTelegram('editMessageText', makeReqBody({
      chat_id: chatId,
      message_id: editMessageId,
      text: text,
      parse_mode: 'HTML',
      reply_markup: keyboard
    }));
  }

  return sendMessage({
    chat_id: chatId,
    text: text,
    parse_mode: 'HTML',
    reply_markup: keyboard
  });
}

/**
 * 生成六个选项（包含正确答案）
 */
function generateOptions(correctAnswer) {
  // ✨ 确保输入范围在 0-99
  correctAnswer = Math.max(0, Math.min(99, correctAnswer));
  
  const options = [correctAnswer];
  
  while (options.length < 6) {
    // 生成 0-99 范围内的错误答案
    let wrongAnswer = Math.floor(Math.random() * 100);
    
    if (wrongAnswer !== correctAnswer && !options.includes(wrongAnswer)) {
      options.push(wrongAnswer);
    }
  }
  
  return options.sort(() => Math.random() - 0.5);
}

/**
 * 处理通知
 */
async function handleNotify(message, chatId) {
  try {
    if (enable_notification) {
      const lastMsgTime = await db.getLastMessageTime(chatId);
      if (!lastMsgTime || Date.now() - lastMsgTime > NOTIFY_INTERVAL) {
        await db.setLastMessageTime(chatId, Date.now());
        const notification = await fetch(notificationUrl).then(r => r.text());
        return sendMessage({
          chat_id: ADMIN_UID,
          text: notification
        });
      }
    }
  } catch (err) {
    console.error('处理通知错误:', err);
  }
}

/**
 * 处理屏蔽
 */
async function handleBlock(message) {
  try {
    const guestChatId = await getTargetUserId(message);

    if (!guestChatId) {
      return sendMessage({
        chat_id: ADMIN_UID,
        text: '❌ 用法: /block <UID> 或回复一条转发的消息'
      });
    }

    if (guestChatId === ADMIN_UID) {
      return sendMessage({
        chat_id: ADMIN_UID,
        text: '不能屏蔽自己'
      });
    }

    await db.blockUser(guestChatId);
    return sendMessage({
      chat_id: ADMIN_UID,
      text: `UID: ${guestChatId} 屏蔽成功`
    });
  } catch (err) {
    console.error('处理屏蔽错误:', err);
  }
}

/**
 * 处理解除屏蔽
 */
async function handleUnBlock(message) {
  try {
    const guestChatId = await getTargetUserId(message);

    if (!guestChatId) {
      return sendMessage({
        chat_id: ADMIN_UID,
        text: '❌ 用法: /unblock <UID> 或回复一条转发的消息'
      });
    }

    await db.unblockUser(guestChatId);
    return sendMessage({
      chat_id: ADMIN_UID,
      text: `UID: ${guestChatId} 解除屏蔽成功`
    });
  } catch (err) {
    console.error('处理解除屏蔽错误:', err);
  }
}

/**
 * 检查屏蔽状态
 */
async function checkBlock(message) {
  try {
    const guestChatId = await getTargetUserId(message);

    if (!guestChatId) {
      return sendMessage({
        chat_id: ADMIN_UID,
        text: '❌ 用法: /checkblock <UID> 或回复一条转发的消息'
      });
    }

    const blocked = await db.isBlocked(guestChatId);

    return sendMessage({
      chat_id: ADMIN_UID,
      text: `UID: ${guestChatId} ${blocked ? '被屏蔽' : '没有被屏蔽'}`
    });
  } catch (err) {
    console.error('检查屏蔽状态错误:', err);
  }
}

/**
 * 检查是否是诈骗人员
 */
let fraudCache = null;
let fraudCacheTime = 0;

async function isFraud(id) {
  try {
    const now = Date.now();
    if (!fraudCache || now - fraudCacheTime > FRAUD_CACHE_TTL) {
      const db_list = await fetch(fraudDb).then(r => r.text());
      fraudCache = db_list.split('\n').filter(v => v.trim());
      fraudCacheTime = now;
    }
    return fraudCache.some(v => v.trim() === id.toString());
  } catch (err) {
    console.error('检查诈骗列表错误:', err);
    return false;
  }
}

/**
 * 注册 Webhook
 */
async function registerWebhook(requestUrl) {
  try {
    const webhookUrl = `${requestUrl.protocol}//${requestUrl.hostname}${WEBHOOK}`;
    const r = await fetch(apiUrl('setWebhook'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        secret_token: SECRET,
        allowed_updates: ['message', 'callback_query']
      })
    }).then(r => r.json());
    
    return new Response('ok' in r && r.ok ? 'Ok' : JSON.stringify(r, null, 2));
  } catch (err) {
    console.error('注册 Webhook 错误:', err);
    return new Response(JSON.stringify({ error: err.message }, null, 2), { status: 500 });
  }
}

/**
 * 注销 Webhook
 */
async function unRegisterWebhook() {
  try {
    const r = await fetch(apiUrl('setWebhook'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url: '' })
    }).then(r => r.json());
    
    return new Response('ok' in r && r.ok ? 'Ok' : JSON.stringify(r, null, 2));
  } catch (err) {
    console.error('注销 Webhook 错误:', err);
    return new Response(JSON.stringify({ error: err.message }, null, 2), { status: 500 });
  }
}

/**
 * 初始化数据库表
 */
async function initDatabase(d1) {
  const statements = [
    // 创建表
    `CREATE TABLE IF NOT EXISTS whitelist (
      user_id TEXT PRIMARY KEY,
      created_at INTEGER
    )`,
    `CREATE TABLE IF NOT EXISTS verification (
      user_id TEXT PRIMARY KEY,
      answer TEXT,
      attempts INTEGER DEFAULT 0,
      created_at INTEGER
    )`,
    `CREATE TABLE IF NOT EXISTS verified_users (
      user_id TEXT PRIMARY KEY,
      expiry_time INTEGER
    )`,
    `CREATE TABLE IF NOT EXISTS blocked_users (
      user_id TEXT PRIMARY KEY,
      blocked_at INTEGER
    )`,
    `CREATE TABLE IF NOT EXISTS verification_cooldowns (
      user_id TEXT PRIMARY KEY,
      cooldown_until INTEGER
    )`,
    `CREATE TABLE IF NOT EXISTS message_mappings (
      mapping_key TEXT PRIMARY KEY,
      mapped_value TEXT,
      created_at INTEGER
    )`,
    `CREATE TABLE IF NOT EXISTS message_rates (
      user_id TEXT PRIMARY KEY,
      last_message_time INTEGER
    )`,
    // 创建索引
    'CREATE INDEX IF NOT EXISTS idx_verification_created ON verification(created_at)',
    'CREATE INDEX IF NOT EXISTS idx_verified_expiry ON verified_users(expiry_time)',
    'CREATE INDEX IF NOT EXISTS idx_mappings_key ON message_mappings(mapping_key)'
  ];

  try {
    // ✨ 改进：逐个执行 SQL 语句，而不是用 batch
    for (const sql of statements) {
      await d1.prepare(sql).run();
    }
    
    console.log('✅ 数据库表初始化成功');
    return new Response('✅ 数据库初始化成功', {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  } catch (error) {
    console.error('❌ 数据库初始化错误:', error);
    return new Response(`❌ 数据库初始化失败: ${error.message}`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}
