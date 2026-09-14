/**
 * 生成时间基础的数学验证题
 * 使用 Intl.DateTimeFormat 获取指定时区的时间
 * 随机选取时间中的两位数字，各加上一个随机值，超过10取个位数
 */
/**
 * 生成简单数学验证题（当前使用）
 * 加法/减法/乘法/除法随机四则运算，答案控制在 0-99 内，真人一眼就能算出
 */
function generateMathProblem() {
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
  
  // ✨ 改进 2：隐藏具体时间，只显示"上海时间"提示
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
let TOKEN, WEBHOOK, SECRET, ADMIN_UID, lan;

const NOTIFY_INTERVAL = 24 * 3600 * 1000;  // ⏱️ 24小时通知间隔
const fraudDb = 'https://raw.githubusercontent.com/lidengfengb-cpu/telegram-verify-bot/main/data/fraud.db';
const notificationUrl = 'https://raw.githubusercontent.com/lidengfengb-cpu/telegram-verify-bot/main/data/notification.txt';
const enable_notification = false;
const MAX_VERIFY_ATTEMPTS = 3;  // 🔢 最多尝试3次（防止脚本穷举6个按钮）
const VERIFICATION_TTL = 300;  // ⏱️ 验证码过期时间：5分钟（300秒）
const VERIFIED_TTL = 259200;  // ⏱️ 验证成功有效期：3天（259200秒）

// ✨ 新增：时区和验证算法配置
const VERIFY_ADD_VALUE_MIN = 1;      // 随机加值最小范围
const VERIFY_ADD_VALUE_MAX = 9;      // 随机加值最大范围
let TIMEZONE;  // 动态配置，从环境变量读取

/**
 * 处理请求的主入口（用于 Service Worker）
 */
function initConfig(env) {
  TOKEN = env.BOT_TOKEN;
  SECRET = env.BOT_SECRET;
  ADMIN_UID = env.ADMIN_UID;
  WEBHOOK = '/endpoint';
  lan = env.lan;
  TIMEZONE = env.TIMEZONE || 'UTC';  // ✨ 新增：读取时区配置，默认 UTC
  
  if (!TOKEN || !SECRET || !ADMIN_UID) {
    throw new Error('❌ 环境变量未配置: BOT_TOKEN, BOT_SECRET, ADMIN_UID');
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
    
    const url = new URL(request.url);
    
    if (url.pathname === WEBHOOK) {
      return handleWebhook(request);
    } else if (url.pathname === '/registerWebhook') {
      return registerWebhook(request, url, WEBHOOK, SECRET);
    } else if (url.pathname === '/unRegisterWebhook') {
      return unRegisterWebhook(request);
    } else {
      return new Response('No handler for this request', { status: 404 });
    }
  }
};

/**
 * 处理 Webhook
 */
async function handleWebhook(request) {
  if (request.headers.get('X-Telegram-Bot-Api-Secret-Token') !== SECRET) {
    return new Response('Unauthorized', { status: 403 });
  }
  
  try {
    const update = await request.json();
    // 异步处理，不阻塞响应
    await onUpdate(update);
    return new Response('Ok');
  } catch (err) {
    console.error('❌ 处理 Webhook 错误:', err);
    return new Response('Error: ' + err.message, { status: 500 });
  }
}

/**
 * 检查用户是否在白名单中
 */
async function isWhitelisted(userId) {
  userId = userId.toString();
  const whitelisted = await lan.get('whitelist-' + userId);
  return whitelisted === 'true';
}

/**
 * 处理消息
 */
async function onMessage(message) {
  // /start 命令
  if (message.text === '/start') {
    return sendMessage({
      chat_id: message.chat.id,
      text: '👋 你好，欢迎来访！为过滤广告机器人，请先完成验证。直接发送任意消息即可开始～'
    });
  }

  // 管理员命令
  if (message.chat.id.toString() === ADMIN_UID) {
    // ✅ 修复：添加到白名单
    if (/^\/addwhite(?:\s+(\d+))?$/.test(message.text)) {
      return handleAddWhitelist(message);
    }
    
    // ✅ 修复：从白名单移除
    if (/^\/removewhite(?:\s+(\d+))?$/.test(message.text)) {
      return handleRemoveWhitelist(message);
    }
    
    // ✅ 修复：检查白名单状态
    if (/^\/checkwhite(?:\s+(\d+))?$/.test(message.text)) {
      return handleCheckWhitelist(message);
    }
    
    // ✅ 修复：列出所有白名单
    if (/^\/listwhite$/.test(message.text)) {
      return handleListWhitelist(message);
    }

    // ✅ 解除屏蔽：支持直接带 UID（不需要回复消息），也可回复转发的消息
    if (/^\/unblock(?:\s+(\d+))?$/.test(message.text)) {
      return handleUnBlock(message);
    }

    if (!message?.reply_to_message?.chat) {
      return sendMessage({
        chat_id: ADMIN_UID,
        text: '使用方法，回复转发的消息，并发送回复消息，或指令:\n' +
              '/block - 屏蔽用户\n' +
              '/unblock [UID] - 解除屏蔽\n' +
              '/checkblock - 检查屏蔽状态\n' +
              '/addwhite [UID] - 添加到白名单\n' +
              '/removewhite [UID] - 从白名单移除\n' +
              '/checkwhite [UID] - 检查白名单状态\n' +
              '/listwhite - 列出所有白名单用户'
      });
    }

    if (/^\/block$/.test(message.text)) {
      return handleBlock(message);
    }
    if (/^\/checkblock$/.test(message.text)) {
      return checkBlock(message);
    }

    const guestChatId = await lan.get('msg-map-' + message?.reply_to_message.message_id);
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
    return await lan.get('msg-map-' + message.reply_to_message.message_id);
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

  await lan.put('whitelist-' + guestChatId, 'true');
  
  // 同步更新白名单列表
  let whitelistData = (await lan.get('whitelist-data')) || '';
  const whitelistArray = whitelistData ? whitelistData.split(',').filter(v => v) : [];
  if (!whitelistArray.includes(guestChatId)) {
    whitelistArray.push(guestChatId);
    await lan.put('whitelist-data', whitelistArray.join(','));
  }
  
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

  await lan.delete('whitelist-' + guestChatId);
  
  // 同步更新白名单列表
  let whitelistData = (await lan.get('whitelist-data')) || '';
  const whitelistArray = whitelistData.split(',').filter(v => v && v !== guestChatId);
  await lan.put('whitelist-data', whitelistArray.join(','));
  
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

  const isWhite = await lan.get('whitelist-' + guestChatId);
  
  return sendMessage({
    chat_id: ADMIN_UID,
    text: `UID: ${guestChatId} ${isWhite === 'true' ? '✅ 在白名单中' : '❌ 不在白名单中'}`
  });
}

/**
 * 列出所有白名单用户
 */
async function handleListWhitelist(message) {
  const whitelistData = (await lan.get('whitelist-data')) || '';
  const whitelistArray = whitelistData ? whitelistData.split(',').filter(v => v) : [];
  
  if (whitelistArray.length === 0) {
    return sendMessage({
      chat_id: ADMIN_UID,
      text: '📋 白名单为空'
    });
  }
  
  const list = whitelistArray.join('\n');
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

    // 格式: verify_{answer}_{correctAnswer}
    if (!data.startsWith('verify_')) {
      return;
    }

    const [, userAnswer, correctAnswer] = data.split('_');

    if (userAnswer === correctAnswer) {
      await lan.put('verified-' + userId, 'true', { expirationTtl: VERIFIED_TTL });  // ✅ 3天有效期
      await lan.delete('verify-' + userId);
      await lan.delete('verify-attempts-' + userId);
      
      await requestTelegram('editMessageText', makeReqBody({
        chat_id: userId,
        message_id: messageId,
        text: '🎉🎊✨ 验证成功！你现在可以使用机器人了～',
        reply_markup: undefined
      }));
    } else {
      // ✅ 新增：记录尝试次数
      const attempts = parseInt(await lan.get('verify-attempts-' + userId) || '0') + 1;
      
      if (attempts >= MAX_VERIFY_ATTEMPTS) {
        await lan.delete('verify-' + userId);
        await lan.put('isblocked-' + userId, 'true');
        await requestTelegram('editMessageText', makeReqBody({
          chat_id: userId,
          message_id: messageId,
          text: '🚫🔥 验证失败次数过多，已拉黑移除～',
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
    const whitelisted = await isWhitelisted(chatId);
    
    if (whitelisted) {
      // 白名单用户直接转发消息
      const forwardReq = await forwardMessage({
        chat_id: ADMIN_UID,
        from_chat_id: message.chat.id,
        message_id: message.message_id
      });
      
      if (forwardReq.ok) {
        await lan.put('msg-map-' + forwardReq.result.message_id, chatId);
        return handleNotify(message, chatId);
      }
      return;
    }

    // 检查是否被屏蔽
    const isblocked = await lan.get('isblocked-' + chatId);
    if (isblocked === 'true') {
      return sendMessage({
        chat_id: chatId,
        text: 'You are blocked'
      });
    }

    // 检查是否已验证
    const verified = await lan.get('verified-' + chatId);
    if (!verified) {
      const expected = await lan.get('verify-' + chatId);
    
      // ✨ 如果没有进行中的验证，才生成新题
      if (!expected) {
        return sendVerification(chatId, 0);
      } else {
        // ✨ 已有进行中的验证，提示用户继续答题
        return sendMessage({
          chat_id: chatId,
          text: '请点击上面的按钮选择答案'
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
      await lan.put('msg-map-' + forwardReq.result.message_id, chatId);
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
  await lan.put('verify-' + chatId, answer, { expirationTtl: VERIFICATION_TTL });
  await lan.put('verify-attempts-' + chatId, attempts.toString(), { expirationTtl: VERIFICATION_TTL });

  const options = generateOptions(parseInt(answer));
  const formattedOptions = options.map(opt => String(opt).padStart(2, '0'));

  const colors = ['🟥', '🟧', '🟨', '🟩', '🟦', '🟪'];

  const keyboard = {
    inline_keyboard: [
      [
        { text: `${colors[0]} ${formattedOptions[0]}`, callback_data: `verify_${formattedOptions[0]}_${answer}` },
        { text: `${colors[1]} ${formattedOptions[1]}`, callback_data: `verify_${formattedOptions[1]}_${answer}` },
        { text: `${colors[2]} ${formattedOptions[2]}`, callback_data: `verify_${formattedOptions[2]}_${answer}` }
      ],
      [
        { text: `${colors[3]} ${formattedOptions[3]}`, callback_data: `verify_${formattedOptions[3]}_${answer}` },
        { text: `${colors[4]} ${formattedOptions[4]}`, callback_data: `verify_${formattedOptions[4]}_${answer}` },
        { text: `${colors[5]} ${formattedOptions[5]}`, callback_data: `verify_${formattedOptions[5]}_${answer}` }
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
    // 检查是否在诈骗名单中
    if (await isFraud(chatId)) {
      return sendMessage({
        chat_id: ADMIN_UID,
        text: `检测到骗子，UID: ${chatId}`
      });
    }

    // 根据时间间隔提醒
    if (enable_notification) {
      const lastMsgTime = parseInt(await lan.get('lastmsg-' + chatId) || '0');
      if (!lastMsgTime || Date.now() - lastMsgTime > NOTIFY_INTERVAL) {  // ⏱️ 24小时检查
        await lan.put('lastmsg-' + chatId, Date.now().toString());
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
    const guestChatId = await lan.get('msg-map-' + message.reply_to_message.message_id);

    if (!guestChatId) {
      return sendMessage({
        chat_id: ADMIN_UID,
        text: '❌ 无法获取用户ID'
      });
    }

    if (guestChatId === ADMIN_UID) {
      return sendMessage({
        chat_id: ADMIN_UID,
        text: '不能屏蔽自己'
      });
    }

    await lan.put('isblocked-' + guestChatId, 'true');
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

    await lan.delete('isblocked-' + guestChatId);
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
    const guestChatId = await lan.get('msg-map-' + message.reply_to_message.message_id);

    if (!guestChatId) {
      return sendMessage({
        chat_id: ADMIN_UID,
        text: '❌ 无法获取用户ID'
      });
    }

    const blocked = await lan.get('isblocked-' + guestChatId);

    return sendMessage({
      chat_id: ADMIN_UID,
      text: `UID: ${guestChatId} ${blocked === 'true' ? '被屏蔽' : '没有被屏蔽'}`
    });
  } catch (err) {
    console.error('检查屏蔽状态错误:', err);
  }
}

/**
 * 检查是否是诈骗人员
 */
async function isFraud(id) {
  try {
    id = id.toString();
    const db = await fetch(fraudDb).then(r => r.text());
    const arr = db.split('\n').filter(v => v.trim());
    return arr.some(v => v.trim() === id);
  } catch (err) {
    console.error('检查诈骗列表错误:', err);
    return false;
  }
}

/**
 * 注册 Webhook
 */
async function registerWebhook(event, requestUrl, suffix, secret) {
  try {
    const webhookUrl = `${requestUrl.protocol}//${requestUrl.hostname}${suffix}`;
    const r = await fetch(apiUrl('setWebhook', { url: webhookUrl, secret_token: secret })).then(r => r.json());
    return new Response('ok' in r && r.ok ? 'Ok' : JSON.stringify(r, null, 2));
  } catch (err) {
    console.error('注册 Webhook 错误:', err);
    return new Response(JSON.stringify({ error: err.message }, null, 2), { status: 500 });
  }
}

/**
 * 注销 Webhook
 */
async function unRegisterWebhook(event) {
  try {
    const r = await fetch(apiUrl('setWebhook', { url: '' })).then(r => r.json());
    return new Response('ok' in r && r.ok ? 'Ok' : JSON.stringify(r, null, 2));
  } catch (err) {
    console.error('注销 Webhook 错误:', err);
    return new Response(JSON.stringify({ error: err.message }, null, 2), { status: 500 });
  }
}
