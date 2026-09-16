# my-telegram-bot

一个基于 Cloudflare Workers 的 Telegram 消息转发机器人，集成了数学验证、反欺诈和用户管理功能。支持 KV 版本和 D1 版本。

> 💡 本项目参考 [NFD](https://github.com/LloydAsp/nfd)，在其基础上增加了多重验证和管理功能。

---

## ✨ 功能特性

- 🔐 **数学验证** - 用户必须通过验证才能使用机器人
  - 🔢 **四则运算口算题** - 随机生成加/减/乘/除（如 `37 + 8`、`6 × 7`、`35 - 9`、`48 ÷ 8`），真人一眼就能算出
  - ❌ **防重复答题** - 同一用户在5分钟内若已生成验证题，重复消息只提示继续答题，不重新生成
  - 6个选项按钮，2x3 布局，所有选项统一为两位数字格式（如 "05"、"23"）
  - 5分钟内必须回答，超期自动失效并重新生成新题
  - 最多尝试 3 次，答错满 3 次进入 2 分钟冷却期，冷却后可重新验证（管理员手动 `/block` 为永久屏蔽）
- ✅ **验证有效期** - 验证成功后 3 天内 无需重复验证
- 🚫 **反欺诈** - 内置欺诈用户数据库，自动检测和阻止
- 👤 **用户管理** - 支持屏蔽/解除屏蔽用户、白名单管理
- 📱 **消息转发** - 支持文本、图片、视频等多种媒体转发
- 📋 **白名单功能** - 白名单用户直接跳过验证和屏蔽检查
- ⏰ **通知提醒** - 可配置的定时提醒功能（默认一天一次）
- 🔒 **Webhook 加密** - 使用密钥验证确保消息来源
- 💾 **数据持久化** - 支持 KV 和 D1 两种存储方案

---

## 🚀 快速开始

### 前置条件

- Cloudflare 账户
- Telegram 账户

### 部署步骤

#### 1️⃣ 获取 Telegram 配置

- 从 [@BotFather](https://t.me/BotFather) 获取 Bot Token，并执行 `/setjoingroups` 禁止 Bot 被添加到群组
- 从 [@username_to_id_bot](https://t.me/username_to_id_bot) 获取你的用户 ID

#### 2️⃣ 生成 Webhook 密钥

- 访问 [UUID 生成器](https://www.uuidgenerator.net/) 生成一个随机 UUID 作为 `SECRET`

#### 3️⃣ 在 Cloudflare 创建 Worker

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 Workers & Pages → Create application → Start with Hello World!
3. 给 Worker 命名（如 telegram-verify-bot）
4. 点击 Deploy

#### 4️⃣ 配置环境变量

在 Worker 设置中，进入 Settings → Variables，添加以下环境变量：

| 变量名 | 说明 | 示例 | 必需 |
|------|------|------|------|
| BOT_TOKEN | Telegram Bot Token | 123456:ABCDEFxyz... | ✅ 是 |
| BOT_SECRET | Webhook 密钥（UUID 格式） | 550e8400-e29b-41d4-a716-446655440000 | ✅ 是 |
| ADMIN_UID | 你的 Telegram 用户 ID | 123456789 | ✅ 是 |
| TIMEZONE | 已废弃（旧版时间验证题所用，新版无需配置） | Asia/Shanghai | ❌ 否 |

**TIMEZONE 说明（已废弃）：**
- 仅旧版基于时间的验证题会用到，新版为纯数学四则运算题，无需配置
- 即使不配置也不影响使用

#### 5️⃣ 选择数据库方案

本项目提供两个版本，请根据需要选择：

##### 📦 方案 A：KV 版本（worker-KV.js）

**适合：** 小型应用，数据量不大（<10MB）

**配置步骤：**

1. 进入 Workers KV
2. 创建新的 KV 命名空间：`lan`
3. 在 Worker 设置中，进入 Settings → Bindings → Add binding
   - Variable name： `lan`
   - KV namespace： 选择刚创建的 `lan`
4. 部署 [worker-KV.js](./worker-KV.js) 代码

**KV 绑定配置：**

在代码中访问
```javascript
let lan = env.lan;
```

**存储结构：**

| 存储键 | 说明 |
|------|------|
| whitelist-{userId} | 白名单标记 |
| verify-{userId} | 当前验证码答案 |
| verify-attempts-{userId} | 验证尝试次数 |
| verified-{userId} | 验证成功标记（3天过期） |
| isblocked-{userId} | 屏蔽标记（管理员手动 /block，永久） |
| cooldown-{userId} | 验证冷却期截止时间（答错3次后 2 分钟，过期自动失效） |
| msg-map-{messageId} | 消息映射关系 |
| lastmsg-{userId} | 上次消息时间戳 |
| whitelist-data | 白名单数据集合 |


##### 💾 方案 B：D1 版本（worker-D1.js）

**适合：** 中大型应用，需要结构化查询，数据持久化

**配置步骤：**

1. 进入 D1 SQL database：
2. 创建名为`lan`的数据库
3. 在 Worker 设置中，进入 Settings → Bindings → Add binding
   - Variable name： `lan`
   - D1 database： 选择刚创建的 `lan`
4. 部署 [worker-D1.js](./worker-D1.js) 代码
5. 初始化数据库表（需携带管理口令，口令即环境变量 `BOT_SECRET` 的值）：

https://你的worker.workers.dev/initDatabase?token=你的BOT_SECRET


**D1 数据库表结构：**

| 表名 | 用途 |
|-----|------|
| whitelist | 白名单用户 |
| verification | 验证码状态 |
| verified_users | 验证成功用户 |
| blocked_users | 永久屏蔽用户（管理员手动操作） |
| verification_cooldowns | 验证冷却期（答错3次后 2 分钟内，过期自动失效） |
| message_mappings | 消息映射 |
| message_rates | 消息频率限制 |

**详细 SQL 语句：**
```javascript
-- 白名单用户
CREATE TABLE whitelist (user_id TEXT PRIMARY KEY,created_at INTEGER);

-- 验证码状态
CREATE TABLE verification (user_id TEXT PRIMARY KEY,answer TEXT,attempts INTEGER DEFAULT 0,created_at INTEGER);

-- 验证成功用户
CREATE TABLE verified_users (user_id TEXT PRIMARY KEY,expiry_time INTEGER);

-- 屏蔽用户
CREATE TABLE blocked_users (user_id TEXT PRIMARY KEY,blocked_at INTEGER);

-- 验证冷却期（答错3次后 2 分钟内）
CREATE TABLE verification_cooldowns (user_id TEXT PRIMARY KEY,cooldown_until INTEGER);

-- 消息映射
CREATE TABLE message_mappings (mapping_key TEXT PRIMARY KEY,mapped_value TEXT,created_at INTEGER);

-- 消息频率限制
CREATE TABLE message_rates (user_id TEXT PRIMARY KEY,last_message_time INTEGER);
```

**D1 优势：**

- ✅ 支持 SQL 查询，灵活度高
- ✅ 自动过期时间管理
- ✅ 数据结构清晰，易于维护
- ✅ 支持批量操作和事务
- ✅ 免费额度更高（读/写操作更多）

#### 6️⃣ 部署代码

1. 进入 Worker Edit code
2. 选择对应版本的代码：
   - KV 版本： 复制 [worker-KV.js](./worker-KV.js)
   - D1 版本： 复制 [worker-D1.js](./worker-D1.js)
3. 点击 Deploy

#### 7️⃣ 注册 Webhook

访问以下 URL 注册 webhook（替换 `xxx.workers.dev` 为你的 Worker 域名）。**必须携带管理口令（即环境变量 `BOT_SECRET` 的值）**，否则会返回 `403 Unauthorized`：

https://xxx.workers.dev/registerWebhook?token=你的BOT_SECRET

成功后将看到 `Ok` 响应。

> ⚠️ **安全提示：** `/registerWebhook`、`/unRegisterWebhook`、`/initDatabase` 三个管理接口均已加鉴权，调用时需带 `?token=你的BOT_SECRET`。请务必保管好你的 `BOT_SECRET`，切勿泄露给他人。

---

## 📖 使用指南

### 普通用户

**初次使用流程：**

1. 给机器人发送 `/start` 查看欢迎消息
2. 回答数学验证题：
   - 题目说明：一道随机四则运算（加/减/乘/除）的口算题
   - 例如题目可能是：
     ```
     🎲✨ 真人验证 🎯

     37 + 8 = ?
     ```
   - 点击 6 个选项中的正确答案（所有选项均为两位数字，如 "07"、"23"、"45"）
   - 若5分钟内未答题，验证码自动过期，重新发消息时会生成新题
3. ✅ 验证成功后可正常使用
4. 发送的消息会被转发给机器人创建者

**⏱️ 时间限制：**

- 验证码有效期：5 分钟（基于题目生成时间，不会因为用户重复发消息而重置）
- 验证成功有效期：3 天（3天内无需再次验证，3天后需要重新验证）
- 验证失败上限：3 次（超过进入 2 分钟冷却期，冷却后可重新验证；管理员手动 `/block` 才是永久屏蔽）
- 单题答题时间：无限制（在5分钟过期前任意时刻点击即可）

**⚠️ 重要说明：**

- ✅ 同一验证题有效期内，用户重复发消息不会覆盖已有的验证题，只会提示"⏳ 你已有一道未完成的验证题，请在最近的验证消息里选择答案作答～"
- ✅ 答题尝试次数在验证码有效期内累计，超过3次后自动屏蔽
- ✅ 验证成功后，3天内的任何新消息都无需再验证

### 机器人创建者（管理员）

#### 基础操作

**回复用户消息流程：**

1. 用户发送消息 → 机器人转发给你
2. 长按转发的消息
3. 选择"回复"
4. 输入消息内容
5. 消息自动回复给原用户

#### 命令菜单（输入框左侧点 "/"）

- **普通用户**：可直接点击发送 `/start`，无需手动输入。
- **管理员（ADMIN_UID）**：额外显示全套管理命令菜单（`/block`、`/unblock`、`/checkblock`、白名单命令），点击即可调用。

#### 管理命令

**屏蔽/解除屏蔽用户：**

| 命令 | 功能 | 使用方式 |
|-----|------|--------|
| `/block [UID]` | 屏蔽用户 | 直接指定 UID 或回复消息 |
| `/unblock [UID]` | 解除屏蔽 | 直接指定 UID 或回复消息 |
| `/checkblock [UID]` | 查看屏蔽状态 | 直接指定 UID 或回复消息 |

**白名单管理：**

| 命令 | 功能 | 使用方式 |
|-----|------|--------|
| `/addwhite [UID]` | 添加白名单 | 直接指定 UID 或回复消息 |
| `/removewhite [UID]` | 移除白名单 | 直接指定 UID 或回复消息 |
| `/checkwhite [UID]` | 检查白名单状态 | 直接指定 UID 或回复消息 |
| `/listwhite` | 列出所有白名单 | 直接发送 |

**白名单用户特殊权限：**

- ✅ 直接跳过数学验证
- ✅ 无需再次验证（永久有效）
- ✅ 屏蔽列表检查被跳过
- ✅ 消息直接转发

#### 使用示例

**场景 1：屏蔽用户**

1. 长按用户转发的消息
2. 选择"回复"
3. 输入 `/block`
4. 结果：UID: 123456789 屏蔽成功

**场景 2：添加白名单**

1. 使用命令：`/addwhite 123456789`
2. 结果：UID: 123456789 已添加到白名单

**场景 3：查看白名单**

1. 使用命令：`/listwhite`
2. 结果：显示所有白名单用户列表

---

## ⚙️ 配置说明

### 时间参数详解

代码中的所有时间参数都可以自定义修改：

| 参数名 | 默认值 | 单位 | 含义 | 位置 |
|------|-------|------|------|------|
| VERIFICATION_TTL | 300 | 秒 | 验证码过期时间 | 代码顶部 |
| VERIFIED_TTL | 259200 | 秒 | 验证成功有效期 | 代码顶部 |
| MAX_VERIFY_ATTEMPTS | 3 | 次数 | 最大验证尝试次数 | 代码顶部 |
| NOTIFY_INTERVAL | 86400000 | 毫秒 | 通知间隔（24小时） | handleNotify() |

### 时间换算对照表

- 1 分钟 = 60 秒 = 60000 毫秒
- 5 分钟 = 300 秒 = 300000 毫秒
- 1 小时 = 3600 秒 = 3600000 毫秒
- 1 天 = 86400 秒 = 86400000 毫秒
- 3 天 = 259200 秒 = 259200000 毫秒
- 7 天 = 604800 秒 = 604800000 毫秒
- 30 天 = 2592000 秒 = 2592000000 毫秒


### 修改验证码过期时间

编辑代码顶部的常量：
```javascript
//改为 10 分钟过期
const VERIFICATION_TTL = 600;

//改为 2 小时过期
const VERIFICATION_TTL = 7200;
```

### 修改验证成功有效期

编辑代码顶部的常量：
```javascript
//改为 7 天有效期
const VERIFIED_TTL = 604800;

//改为 1 天有效期
const VERIFIED_TTL = 86400;
```

### 修改最大验证尝试次数

编辑代码顶部的常量：
```javascript
//改为 5 次尝试
const MAX_VERIFY_ATTEMPTS = 5;

//改为 20 次尝试
const MAX_VERIFY_ATTEMPTS = 20;
```

### 启用通知功能

默认关闭，要启用请改为：
```javascript
const enable_notification = true;
```

启用后，每次用户发送消息超过 24 小时后会触发一次通知。

### 时区配置说明（已废弃，无需配置）

> ⚠️ **重要：当前版本验证题已改为纯数学四则运算题，不再依赖任何时区，`TIMEZONE` 变量无需配置，也不影响验证。**

以下内容仅在**恢复旧版基于时间的验证题**时才有意义，作为参考保留：

#### 什么是时区配置？

旧版验证题基于用户的实时时间生成，通过 TIMEZONE 环境变量控制。

#### 默认时区

默认为 `UTC`，可以修改为其他时区。

#### 常见时区代码

| 地区 | 时区代码 | 说明 |
|-----|---------|------|
| 中国 | Asia/Shanghai | UTC+8（北京时间） |
| 中国（香港） | Asia/Hong_Kong | UTC+8（香港时间） |
| 日本 | Asia/Tokyo | UTC+9 |
| 新加坡 | Asia/Singapore | UTC+8 |
| 印度 | Asia/Kolkata | UTC+5:30 |
| 阿联酋 | Asia/Dubai | UTC+4 |
| 英国 | Europe/London | UTC+0/+1 |
| 美国（东部） | America/New_York | UTC-5/-4 |
| 美国（西部） | America/Los_Angeles | UTC-8/-7 |

#### 修改时区配置

在 Cloudflare Workers 设置中：

1. 进入 Settings → Variables
2. 添加新变量：
   - Variable name： `TIMEZONE`
   - Value： 你需要的时区代码（如 `Asia/Shanghai`）
3. 重新部署 Worker

#### 验证题中的时区显示

旧版验证题文案会自动根据 TIMEZONE 显示：

```javascript
// 题目文案示例
`以UTC+8时间为基准
第${pos1 + 1}位数字 + ${addValue1} = ?
第${pos2 + 1}位数字 + ${addValue2} = ?

按顺序组成两位数即为答案`
```

说明： 虽然旧版代码计算基于指定的时区，但文案中的"UTC+8"是示意文本，实际应根据 TIMEZONE 修改。建议使用 Asia/Shanghai 时区并保持文案为"UTC+8时间"。
Intl.DateTimeFormat 工作原理

旧版代码使用 Intl.DateTimeFormat 根据 TIMEZONE 获取实时时间：

```javascript
const formatter = new Intl.DateTimeFormat('en-US', {
  timeZone: TIMEZONE,  // 使用配置的时区
  hour: '2-digit',
  minute: '2-digit',
  hour12: false  // 24小时制
});
```

这样即使 Cloudflare 服务器在不同地区，也能获取用户指定时区的准确时间。

---

## 🔍 反欺诈数据库

### 数据源

- **文件路径：** `data/fraud.db`（部署时读取本仓库 `main` 分支下的这个文件，可通过代码顶部的 `fraudDb` 常量修改）
- **格式：** 每行一个 UID，如：
```javascript
123456789
987654321
111111111
```

- **更新方式：** 通过 PR 或 Issue 补充

### 工作原理

- 当已验证用户在欺诈数据库中时，消息不会被转发
- 管理员会收到警告消息：⚠️ 检测到诈骗人员 UID: xxxxx
- 有助于防止骗子使用机器人

---

## 🛠️ 常见问题

**Q: 为什么每次发消息都会生成新的验证题？**

A: 不会重复生成。系统逻辑是：
- 第一条消息 → 生成新题目
- 第二至N条消息 → 如果题目还未过期，只提示"⏳ 你已有一道未完成的验证题，请在最近的验证消息里选择答案作答～"，不重新生成
- 只有当题目过期（5分钟后）才会生成新题目

这样可以防止恶意用户通过重复发消息来刷屏。

---

**Q: 验证题是怎么出的？**

A: 随机生成一道四则运算口算题（如 `37 + 8`、`6 × 7`、`35 - 9`、`48 ÷ 8`），真人一眼就能算出答案。所有选项都是两位数字格式（带前导0），不依赖任何时区。旧版基于时间（HHMM）的题目已注释保留在代码中。

---

**Q: 验证题选项为什么都是两位数字（如 "05"、"23"）？**

A: 这是为了防止识别。因为验证答案都是两位数字（0-99），所以所有选项也格式化为两位数字，避免用户通过选项长度来判断答案。

例如：

✅ 正确格式：["05", "23", "67", "12", "89", "45"]
❌ 错误格式：["5", "23", "67", "101", "102"] ← 这样会暴露答案长度


---

**Q: 为什么答题失败后尝试次数不会重置？**

A: 尝试次数与验证码的过期时间绑定。在 5 分钟内的所有尝试都会累计，达到 3 次后进入 2 分钟冷却期。

- ✅ 用户在 5 分钟内答错 3 次 → 进入 2 分钟冷却期，冷却结束后可重新验证
- ✅ 用户答错 2 次，5 分钟后重新生成新题 → 新题的尝试次数重新计算
- ✅ 答题成功后，尝试次数自动清除

---

**Q: D1 版本和 KV 版本在验证题上有什么区别？**

A: 功能完全相同，都支持：

- ✅ 四则运算口算验证
- ✅ 5 分钟过期机制
- ✅ 防重复生成逻辑
- ✅ 3 次尝试限制

区别仅在存储方式：

- **KV 版本**：直接存储答案和尝试次数
- **D1 版本**：使用数据库表存储，支持 SQL 查询和批量操作

推荐：

- 小型应用（用户少）→ KV 版本
- 中大型应用（需要统计数据）→ D1 版本

---

**Q: 屏蔽用户后他能做什么？**

A: 有两种屏蔽，行为不同：

- **验证失败屏蔽（冷却）**：答错 3 次会进入 2 分钟冷却期，期间发消息会提示"请 X 秒后再试"；冷却结束后可重新开始验证。
- **管理员手动屏蔽**：通过 `/block` 屏蔽后为永久屏蔽，收到 `⛔ 你已被屏蔽，无法继续使用。如有疑问请联系管理员。` 提示，只有管理员用 `/unblock` 才能解除。

---

**Q: 白名单用户有什么优势？**

A:
- ✅ 无需进行数学验证
- ✅ 消息永久有效（无需重新验证）
- ✅ 直接转发消息，无任何限制

---

**Q: 消息转发支持哪些类型？**

A: 支持文本、图片、视频、文件等 Telegram 支持的所有媒体类型。

---

**Q: 如何自定义欢迎消息？**

A: 编辑代码中 `/start` 命令的 text 字段即可：
```javascript
if (message.text === '/start') {return sendMessage({
    chat_id: message.chat.id,
    text: '你的自定义欢迎消息内容' // ← 改这里
});
}
```

---

**Q: KV 和 D1 哪个更好？**

A:

| 对比项 | KV | D1 |
|------|----|----|
| 学习难度 | 简单 | 中等 |
| 查询能力 | 简单键值 | SQL查询 |
| 数据量 | 1GB | 5GB |
| 性能 | 快速 | 快速 |
| 价格 | 免费额度1000次/天 | 免费额度100,000次/天 |
| 推荐用途 | 小型应用 | 中大型应用 |

---

**Q: 如何修改验证有效期？**

A: 编辑代码顶部的常量：
```javascript
// D1 版本或 KV 版本
const VERIFIED_TTL = 259200; // 改为你需要的秒数
```

然后重新部署。

---

**Q: 如何查看存储的数据？**

A:
- **KV 版本：** 进入 Cloudflare Dashboard → Workers KV → 查看值
- **D1 版本：** 进入 Cloudflare Dashboard → D1 Databases → 使用查询工具

---

## 📝 项目结构
```
telegram-verify-bot/
├── README.md # 项目说明文档
├── LICENSE # 开源许可证
├── worker-KV.js # KV 版本（使用 Cloudflare KV）
├── worker-D1.js # D1 版本（使用 Cloudflare D1 数据库）
└── data/
    ├── fraud.db # 欺诈数据库（行分隔的 UID 列表）
    └── notification.txt # 通知模板
```

### 版本对比

| 文件 | 适用场景 | 特点 |
|-----|--------|------|
| worker-KV.js | 小型应用、快速部署 | 无需初始化，开箱即用 |
| worker-D1.js | 中大型应用、需要查询 | 需要初始化表，功能完整 |

---

## 🔄 版本迭代记录

### v2.3（当前版本）

**📊 改进：**

- **KV 版本全面对齐 D1 版本** - 此前几个版本新增的安全与体验改进（验证答案改查库比对、管理接口口令校验、答错 3 次改 2 分钟冷却、诈骗名单缓存、`/block` 和 `/checkblock` 支持直接带 UID）此前只在 D1 版本实现，本次全部移植到 KV 版本，两个版本的功能与安全性现已完全一致。
- **KV 版本新增 emoji 计数题** - 出题逻辑与 D1 一致，50% 概率出四则运算、50% 概率出数 emoji。
- **KV 版本体验优化** - `/start` 欢迎语区分已验证用户与新用户、屏蔽与冷却提示文案中文化、新增命令菜单注册、Webhook 改为异步处理不阻塞响应。
- **文档修正** - 修正正文与 FAQ 中"答错 3 次永久屏蔽"的过时表述，与冷却机制保持一致。

---

### v2.2

**📊 改进：**

- **简化验证题** - 验证题由"基于时间（UTC+8 实时时间的 HHMM 数字加减）"改为随机四则运算口算题（如 `37 + 8`、`6 × 7`、`35 - 9`、`48 ÷ 8`），真人一眼就能算出，大幅降低使用门槛。旧版时间题的代码已注释保留，需要时可随时恢复。
- **答错即换新题** - 用户答错后不再保留当前题目，而是立即换一道新题；旧题消息会被就地改写为新题，聊天里始终只保留最新一道题；尝试次数继续累计，仍满 3 次即永久屏蔽，防止在同一道题上反复猜。
- **提高防脚本能力** - 验证尝试上限由 10 次收紧到 3 次，堵住脚本穷举 6 个选项按钮的后路，答错 3 次直接永久屏蔽。
- **`/unblock` 支持按 UID 解除** - 现在可以直接发送 `/unblock 用户ID` 解除屏蔽，方便解救误屏蔽的真人（不再只能通过回复转发消息）。
- **`/block`、`/checkblock` 对齐** - 与 `/unblock` 一致，两个命令同样支持直接指定 UID 操作。
- **废弃时区配置** - 由于新版验证题不再依赖时间，`TIMEZONE` 环境变量已不再使用，部署时无需再单独配置。
- **管理接口鉴权** - `/initDatabase`、`/registerWebhook`、`/unRegisterWebhook` 三个接口增加校验，调用时需携带 `?token=你的BOT_SECRET`，防止他人恶意操控。
- **验证答案改为查库** - 正确答案不再写在按钮数据里，改由回调时查询数据库比对，避免被脚本直接从按钮提取。
- **诈骗名单缓存** - 名单下载后缓存 10 分钟，避免每条消息都重复拉取远程文件。
- **体验与文案优化** - 美化 `/start` 欢迎语、屏蔽提示中文化、诈骗名单指向本仓库；清理无用代码与废弃常量。
- **通知功能开关说明** - 顶部 `enable_notification` 默认关闭，如需要通知可改为 `true` 并自备模板。
- **验证冷却机制** - 答错满 3 次由"永久屏蔽"改为"2 分钟冷却期"，冷却结束后用户可重新验证；管理员手动 `/block` 仍为永久屏蔽，避免误伤真人难以解封。

---

### v2.1

**✅ 新增功能：**

- 🔐 **基于时间的数学验证** - 根据 UTC+8 实时时间 HHMM 格式生成，自动隐藏具体时间防止暴露逻辑
- 🛡️ **防重复生成机制** - 同一用户 5 分钟内重复消息不会重新生成验证题，只提示继续答题，有效防止刷屏
- 🔢 **选项格式统一化** - 所有选项统一为两位数字格式（带前导0），防止通过选项长度识别答案
- ⏰ **验证码生成时间隐藏** - 验证码 5 分钟过期时间基于生成时刻，不被用户重复消息重置

**📊 改进：**

- 优化验证尝试次数计算 - 尝试次数与验证码过期时间绑定，5 分钟后重新计算
- 增强数学题目隐私保护 - 题目中不显示具体时间，只提示"以 UTC+8 时间为基准"
- 改进选项生成算法 - 确保所有选项都在 0-99 范围内，格式化后无三位数问题
- 完善错误处理逻辑 - 区分"新题目"和"继续答题"两种场景的用户提示

---

### v2.0

**✅ 新增功能：**

- 新增 6 选项数学验证（2x3 布局）
- 新增 D1 数据库版本，支持 SQL 查询
- 新增 白名单管理命令（`/addwhite`, `/removewhite`, `/checkwhite`, `/listwhite`）
- 新增 验证码 5 分钟自动过期
- 新增 验证成功 3 天有效期
- 新增 验证尝试次数限制（最多 10 次）

**📊 改进：**

- 优化数据存储结构（支持 KV 和 D1）
- 增强用户隐私保护
- 改进错误提示信息
- 完善文档说明

---

## 🤝 贡献

欢迎通过以下方式贡献：

- 补充欺诈数据： 提交 PR 更新 `fraud.db`
- 功能改进： 提交 Issue 讨论功能建议
- Bug 反馈： 报告发现的问题，带上错误日志

### 提交欺诈信息时的注意事项

- 请提供可靠的消息出处
- 多个 UID 请分行提交
- 确认 UID 无误后再提交

---

## 📜 许可证



---

## 🔗 相关资源

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Cloudflare D1 数据库文档](https://developers.cloudflare.com/d1/)
- [Cloudflare KV 文档](https://developers.cloudflare.com/workers/runtime-apis/kv/)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [NFD 原项目](https://github.com/LloydAsp/nfd)

---

## 💬 支持

有问题或建议？



⭐ 如果对你有帮助，请给个 Star！
