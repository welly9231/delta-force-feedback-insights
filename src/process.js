'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const RAW_DIR = path.join(ROOT, 'data', 'raw');
const OUT_DIR = path.join(ROOT, 'data', 'processed');
const WORK_DIR = path.join(ROOT, 'work');
const OBSERVATION_START = '2025-09-01T00:00:00.000Z';

const THEME_RULES = [
  { theme: '外挂与安全', keywords: ['外挂', '开挂', '卖挂', '挂狗', '挂b', '挂逼', '开g', '透视', '透啊', '全是透', '自瞄', '锁头', '锁血', '作弊', '护航', '带老板', '坐挂车', '反作弊', 'ace扫盘', '举报不封', '外挂狗', '神仙', '魔法子弹', '暴力锁', '软锁', 'hack', 'hacker', 'cheat', 'cheater', 'aimbot', 'wallhack', 'esp'] },
  { theme: '客服与封禁', keywords: ['误封', '封号', '封禁', '解封', '申诉', '客服', '工单', '禁言', '处罚', '账号异常', '被盗', '盗号', '黑屋', '观察期', '账号暂停', '暂停', '账户', '人脸', '注销', 'support', 'banned', 'account suspended', 'ban appeal'] },
  { theme: '性能与优化', keywords: ['优化', '卡顿', '掉帧', '闪退', '崩溃', '黑屏', '进不去', '登录失败', '连接失败', '断线', '延迟', '网络波动', '爆ping', '发热', '耗电', '帧率', '卡死', '加载慢', '加载', '更新失败', '更新太慢', '下载限速', '下载慢', '内存', '爆内存', '能爆', '限速', '下载资源', 'update size', '200 gb', 'gb update', 'actualizaciones', 'bug', '异常', 'lag', '掉fps', '低fps', 'fps低', '帧数', 'stutter', 'crash', 'freeze', 'optimization', 'optimizado', 'optimize', 'disconnect', 'loading', 'download', 'redownload', 'corrupted', 'server', 'ping', 'memory', 'gb'] },
  { theme: '匹配与队友', keywords: ['匹配', '队友', '单排', '排位', '人机', '人机局', '全是人机', '组队', '补位', '挂机', '抢包', '送人头', '摆烂', '黑屋局', 'elo', 'mmr', 'matchmaking', 'teammate', 'squad', 'bot', 'bots', 'rank', 'ranked', 'team', 'players'] },
  { theme: '搜打撤与经济', keywords: ['爆率', '暴率', '掉率', '摸金', '物资', '经济', '物价', '交易行', '哈夫币', '保险', '撤离点', '撤离', '撤不出来', '大红', '出红', '小金', '曼德尔砖', '搜打撤', '出金', '非洲之心', '黑卡', '赛伊德', '虎鱼', '钓鱼', '巨尊', '信号棒', '八音盒', '彩蛋', '市场', '库存', '亏损', '挣', '卖', '一颗心', '两颗心', '雷龙', 'loot', 'extraction'] },
  { theme: '武器与干员平衡', keywords: ['干员', '武器', '枪械', '步枪', '冲锋枪', '狙击枪', '霰弹枪', '后坐力', '平衡', '超模', '削弱', '加强', '削', '盾', '伤害', '枪感', '弹道', '子弹', '液氮', '重做', '改动', '弱势', '强势', '红狼', '露娜', '蜂医', '威龙', '牧羊人', '骇爪', '深蓝', '无名', '疾风', '蛊', '张姐', 'operator', 'weapon', 'nerf', 'buff', 'balance'] },
  { theme: '地图与模式', keywords: ['地图', '模式', '大战场', '全面战场', '烽火地带', '黑鹰坠落', '攻防', '玩法', '地图设计', '点位', '复活点', '载具', '新图', '大坝', '核电站', '变电站', '航天', '巴克什', '长弓', '潮汐', 'az3', '新地图', '蹲点', '角落', 'map', 'mode', 'gameplay'] },
  { theme: '付费与通行证', keywords: ['通行证', '战令', '皮肤', '刀皮', '抽奖', '抽卡', '充值', '充钱', '氪金', '点券', '角色', '价格', '售价', '礼包', '商城', '返场', '联动', '付费', '买不起', 'battle pass', 'skin', 'price', 'pay', 'monetization'] },
  { theme: '任务与成长', keywords: ['任务', '赛季任务', '周任务', '活动', '等级', '肝', '进度', '奖励', '福利', '解锁', '新手', '教程', '成长', '部门', '阶段', '收集', '军械库', 'completed', 'unlock', 'armory', '通行证等级', 'mission', 'quest', 'progression', 'event'] },
  { theme: '界面与操作体验', keywords: ['界面', '操作', '手感', '准星', '键位', '设置', '菜单', '交互', '提示', '音效', '语音', '翻译', '动画', '画质', '字幕', '语言', '创建房间', '房间名称', '不可用', '修复', 'ui', 'hud', 'control', 'sensitivity'] },
  { theme: '性能与优化', keywords: ['服务器', '服务端', '维护', '补偿', '网络', 'ping'] }
];

const POSITIVE_WORDS = ['好玩', '喜欢', '上头', '不错', '优秀', '良心', '满意', '推荐', '期待', '爽', '舒服', '有意思', '氛围好', '改进', '进步', '支持', '加油', '真香', '耐玩', '惊艳', '值得', '爱了', '很棒', '做得非常好', '有梗', '笑出声', '心情变好', '真实', '不卡', '推荐手机', 'best', 'fun', 'love', 'awesome', 'excellent', 'nice', 'amazing', 'recommend', 'enjoy', 'underrated', 'solid', 'fantastic', 'incredible', 'good', 'great', 'top', 'bom', 'güzel', 'mükemmel', 'juegazo', 'addictive'];
const NEGATIVE_WORDS = ['垃圾', '差', '烂', '恶心', '失望', '无聊', '难受', '生气', '离谱', '劝退', '退游', '受不了', '恶心人', '一坨', '无语', '坑', '骗钱', '圈钱', '不公平', '不平衡', '很卡', '太卡', '卡顿', '卡死', '卡了', '卡住', '卡爆', '崩', '封号', '外挂', '作弊', '爆率低', '暴率低', '太低了', '匹配差', '没人管', '不处理', '涨价', '涨疯', '限速', '能爆', '不可用', '完蛋', '暗改', '追缴', '黑屋', '观察期', '没有人类', '神人队友', '玩不了', 'bad', 'trash', 'boring', 'disappointed', 'unplayable', 'sucks', 'garbage', 'worst', 'terrible', 'awful', 'hate', 'refund', 'broken', 'laggy', 'avoid', 'dumpster fire', '千万别', '别玩', '别下', '不推荐', '不互通', '不能玩'];
const SEVERE_WORDS = ['无法登录', '进不去', '闪退', '崩溃', '黑屏', '丢档', '被盗', '盗号', '误封', '永久封', '封十年', '外挂横行', '全是挂', '没法玩', '玩不了', '退款', '欺诈', '骗钱', '账号暂停', 'account suspended', 'corrupted', 'unplayable', 'complete joke', 'dumpster fire', 'avoid'];

function ensureDirs() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(WORK_DIR, { recursive: true });
}

function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(RAW_DIR, name), 'utf8'));
}

function cleanText(value) {
  return String(value || '')
    .replace(/\u0000/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeForDuplicate(value) {
  return cleanText(value).toLowerCase()
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[\s\p{P}\p{S}]+/gu, '');
}

function countMatches(text, keywords) {
  const hits = [];
  let score = 0;
  for (const keyword of keywords) {
    const key = keyword.toLowerCase();
    if (!key) continue;
    const indexes = text.includes(key);
    if (indexes) {
      hits.push(keyword);
      score += keyword.length >= 2 ? 2 : 1;
    }
  }
  return { score, hits };
}

function ratingNumber(value) {
  if (value === '推荐') return 5;
  if (value === '不推荐') return 1;
  const n = Number(value);
  if (Number.isFinite(n) && n >= 1 && n <= 5) return n;
  return null;
}

function detectIssueTheme(text) {
  let best = { theme: '其他', score: 0, hits: [] };
  for (const rule of THEME_RULES) {
    const result = countMatches(text, rule.keywords);
    if (result.score > best.score) best = { theme: rule.theme, score: result.score, hits: result.hits };
  }
  return best;
}

function detectSentiment(text, rating) {
  const positive = countMatches(text, POSITIVE_WORDS);
  const negative = countMatches(text, NEGATIVE_WORDS);
  const score = positive.score - negative.score;
  let sentiment = '中性';
  if (positive.score > 0 && negative.score > 0) sentiment = '混合';
  else if (rating != null && rating <= 2 && positive.score < 4) sentiment = '负向';
  else if (rating != null && rating >= 4 && negative.score < 2) sentiment = '正向';
  else if (positive.score > negative.score) sentiment = '正向';
  else if (negative.score > positive.score) sentiment = '负向';
  else if (rating != null) sentiment = rating >= 4 ? '正向' : rating <= 2 ? '负向' : '中性';
  return { sentiment, positive, negative, score };
}

function detectSeverity(text, theme, sentiment, rating) {
  const severe = countMatches(text, SEVERE_WORDS);
  let score = 1;
  if (theme === '外挂与安全' || theme === '客服与封禁') score = 3;
  if (theme === '性能与优化' && /卡顿|闪退|崩溃|进不去|无法登录|断线/.test(text)) score = 3;
  if (theme === '搜打撤与经济' && /爆率|物价|经济/.test(text)) score = 2;
  if (theme === '匹配与队友' && /匹配|队友/.test(text)) score = 2;
  if (theme === '付费与通行证' && /骗钱|圈钱|欺诈|退款/.test(text)) score = 3;
  if (theme === '性能与优化' && /下载|更新|内存|加载|gb|限速/.test(text)) score = Math.max(score, 2);
  if (text.length < 8 && severe.score === 0) score = 1;
  if (sentiment.negative.score >= 3 && text.length > 80) score = Math.max(score, 3);
  if (severe.score > 0) score = 4;
  if (rating === 1 && score < 3 && sentiment.sentiment === '负向') score = 2;
  if (sentiment.sentiment === '正向' && score < 3) score = 1;
  if (score > 4) score = 4;
  return {
    score,
    label: score >= 4 ? '严重' : score === 3 ? '高' : score === 2 ? '中' : '低',
    hits: severe.hits
  };
}

function suggestedAction(theme, severityScore, sentiment) {
  if (sentiment === '正向' && severityScore === 1) return '沉淀正向口碑素材，并同步研发团队';
  const actions = {
    '外挂与安全': '优先排查反作弊链路，公开高频作弊类型处置进度',
    '客服与封禁': '复核封禁与申诉工单，建立误封复查和响应时限',
    '性能与优化': '按设备与网络环境复现高频问题，优先修复阻塞型故障',
    '匹配与队友': '分析匹配池与单排体验，降低实力差距和摆烂影响',
    '搜打撤与经济': '复核爆率、物价与撤离收益曲线，评估经济回收节奏',
    '武器与干员平衡': '结合胜率与出场率评估武器和干员强度',
    '地图与模式': '汇总热点区域与模式数据，安排地图和玩法迭代',
    '付费与通行证': '解释付费价值并监控定价、返场与抽取争议',
    '任务与成长': '优化任务节奏、新手引导和奖励获得感',
    '界面与操作体验': '整理交互问题清单，优化设置、准星与操作反馈',
    '正向反馈': '沉淀正向口碑素材，并同步研发团队',
    '其他': '进入人工复核队列，补充上下文后再归因'
  };
  const base = actions[theme] || actions['其他'];
  return severityScore >= 4 ? '立即跟进：' + base : severityScore === 3 ? '高优先级：' + base : base;
}

function classify(row) {
  const text = cleanText(row.content).toLowerCase();
  const themeText = text.replace(/不用靠[^，。；\n]{0,30}外挂/g, '').replace(/没有(外挂|挂)/g, '').replace(/外挂(少|不多|变少|减少)/g, '').replace(/无挂/g, '');
  const rating = ratingNumber(row.rating);
  const issue = detectIssueTheme(themeText);
  const sentiment = detectSentiment(text, rating);
  let theme = issue.theme;
  if (issue.score === 0 && sentiment.sentiment === '正向') theme = '正向反馈';
  if (issue.score === 0 && sentiment.sentiment === '中性' && rating == null) theme = '其他';
  const severity = detectSeverity(text, theme, sentiment, rating);
  const action = suggestedAction(theme, severity.score, sentiment.sentiment);
  const confidence = issue.score >= 4 ? '高' : issue.score >= 2 ? '中' : theme === '其他' ? '低' : '中';
  const notes = [];
  if (issue.hits.length) notes.push('主题命中：' + issue.hits.join('、'));
  if (sentiment.positive.hits.length) notes.push('正向命中：' + sentiment.positive.hits.join('、'));
  if (sentiment.negative.hits.length) notes.push('负向命中：' + sentiment.negative.hits.join('、'));
  if (severity.hits.length) notes.push('严重度命中：' + severity.hits.join('、'));
  return {
    theme,
    sentiment: sentiment.sentiment,
    severity: severity.label,
    severity_score: severity.score,
    suggested_action: action,
    theme_confidence: confidence,
    matched_keywords: notes.join('；')
  };
}

function loadRows() {
  const steam = readJson('steam.json').reviews || [];
  const apple = readJson('apple.json').reviews || [];
  const taptap = readJson('taptap.json').reviews || [];
  const bilibili = readJson('bilibili.json').comments || [];
  return steam.concat(apple, taptap, bilibili);
}

function deduplicate(rows) {
  const seen = new Set();
  const output = [];
  let duplicateCount = 0;
  let invalidCount = 0;
  for (const row of rows) {
    const published = new Date(row.published_at).getTime();
    const content = cleanText(row.content);
    if (!content || content.length < 4 || !Number.isFinite(published) || published < new Date(OBSERVATION_START).getTime()) {
      invalidCount += 1;
      continue;
    }
    const key = [row.source || '', row.anonymized_author || '', normalizeForDuplicate(content)].join('|');
    if (seen.has(key)) {
      duplicateCount += 1;
      continue;
    }
    seen.add(key);
    output.push({ ...row, content });
  }
  return { rows: output, duplicateCount, invalidCount };
}

function csvEscape(value) {
  const s = value == null ? '' : String(value);
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

function toCsv(rows, columns) {
  const lines = [columns.join(',')];
  for (const row of rows) lines.push(columns.map((column) => csvEscape(row[column])).join(','));
  return '\ufeff' + lines.join('\r\n');
}

function countBy(rows, field) {
  const result = {};
  for (const row of rows) result[row[field] || '未知'] = (result[row[field] || '未知'] || 0) + 1;
  return result;
}

function groupMatrix(rows, left, right) {
  const matrix = {};
  for (const row of rows) {
    const a = row[left] || '未知';
    const b = row[right] || '未知';
    matrix[a] = matrix[a] || {};
    matrix[a][b] = (matrix[a][b] || 0) + 1;
  }
  return matrix;
}

function buildSummary(rows, quality) {
  const sourceCounts = countBy(rows, 'source');
  const themeCounts = countBy(rows, 'theme');
  const sentimentCounts = countBy(rows, 'sentiment');
  const severityCounts = countBy(rows, 'severity');
  const monthCounts = {};
  const sourceTheme = groupMatrix(rows, 'source', 'theme');
  const themeSeverity = groupMatrix(rows, 'theme', 'severity');

  for (const row of rows) {
    const month = String(row.published_at || '').slice(0, 7);
    if (month) monthCounts[month] = (monthCounts[month] || 0) + 1;
  }

  const themeDetails = Object.keys(themeCounts).map((theme) => {
    const items = rows.filter((row) => row.theme === theme);
    const negative = items.filter((row) => row.sentiment === '负向' || row.sentiment === '混合').length;
    const averageSeverity = items.reduce((sum, row) => sum + Number(row.severity_score || 1), 0) / (items.length || 1);
    const positive = items.filter((row) => row.sentiment === '正向').length;
    return {
      theme,
      count: items.length,
      share: Number((items.length / (rows.length || 1) * 100).toFixed(1)),
      negative,
      negative_share: Number((negative / (items.length || 1) * 100).toFixed(1)),
      positive,
      positive_share: Number((positive / (items.length || 1) * 100).toFixed(1)),
      average_severity: Number(averageSeverity.toFixed(2)),
      priority_score: Number((items.length * averageSeverity).toFixed(1))
    };
  }).sort((a, b) => b.priority_score - a.priority_score);

  const recentCutoff = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
  const recentRows = rows.filter((row) => row.published_at >= recentCutoff);
  const recentThemeCounts = countBy(recentRows, 'theme');
  const representative = [];
  const seenThemes = new Set();
  for (const row of rows.slice().sort((a, b) => b.severity_score - a.severity_score || String(b.published_at).localeCompare(String(a.published_at)))) {
    if (seenThemes.has(row.theme)) continue;
    if (row.sentiment === '负向' || row.severity_score >= 3) {
      representative.push({
        feedback_id: row.feedback_id,
        source: row.source,
        theme: row.theme,
        sentiment: row.sentiment,
        severity: row.severity,
        content: row.content.slice(0, 180),
        source_url: row.source_url
      });
      seenThemes.add(row.theme);
    }
    if (representative.length >= 10) break;
  }

  return {
    generated_at: new Date().toISOString(),
    observation_start: OBSERVATION_START,
    observation_end: new Date().toISOString(),
    total: rows.length,
    source_counts: sourceCounts,
    theme_counts: themeCounts,
    sentiment_counts: sentimentCounts,
    severity_counts: severityCounts,
    month_counts: monthCounts,
    source_theme_matrix: sourceTheme,
    theme_severity_matrix: themeSeverity,
    theme_details: themeDetails,
    recent_7d: {
      count: recentRows.length,
      theme_counts: recentThemeCounts,
      negative_count: recentRows.filter((row) => row.sentiment === '负向' || row.sentiment === '混合').length
    },
    representative_comments: representative,
    quality: quality,
    limitations: [
      'Steam 与 Apple 的公开接口能返回较新评论，但接口排序和可见范围由平台决定。',
      'TapTap 本次读取公开分页样本，接口显示总量存在上限，不能视作完整总体。',
      'B站仅覆盖公开搜索命中的视频，且采集时段触发过平台限流，样本量明显少于其他来源。',
      '规则分类适合快速监控，反讽、行业黑话和多主题评论仍需要人工复核。',
      '各来源人群与活跃度不同，来源占比不代表游戏整体玩家结构。'
    ]
  };
}

function createValidationSample(rows, size) {
  const bySource = {};
  for (const row of rows) {
    bySource[row.source] = bySource[row.source] || [];
    bySource[row.source].push(row);
  }
  const quotas = {};
  for (const source of Object.keys(bySource)) quotas[source] = Math.max(1, Math.round(size * bySource[source].length / rows.length));
  const sample = [];
  for (const source of Object.keys(bySource)) {
    const list = bySource[source].slice().sort((a, b) => String(a.feedback_id).localeCompare(String(b.feedback_id)));
    const quota = Math.min(quotas[source], list.length);
    if (!quota) continue;
    const step = Math.max(1, Math.floor(list.length / quota));
    for (let i = 0; i < list.length && sample.filter((x) => x.source === source).length < quota; i += step) sample.push(list[i]);
  }
  return sample.slice(0, size);
}

function main() {
  ensureDirs();
  const rawRows = loadRows();
  const deduped = deduplicate(rawRows);
  const analyzed = deduped.rows.map((row, index) => {
    const result = classify(row);
    return {
      ...row,
      ...result,
      feedback_id: 'DFF-' + String(index + 1).padStart(6, '0'),
      human_theme: '',
      human_sentiment: '',
      human_severity: '',
      is_correct: '',
      validation_notes: ''
    };
  }).sort((a, b) => String(b.published_at).localeCompare(String(a.published_at))).map((row, index) => ({ ...row, feedback_id: 'DFF-' + String(index + 1).padStart(6, '0') }));

  const quality = {
    raw_items: rawRows.length,
    valid_items: analyzed.length,
    invalid_items: deduped.invalidCount,
    duplicates_removed: deduped.duplicateCount,
    unique_authors: new Set(analyzed.map((row) => row.anonymized_author)).size,
    languages: countBy(analyzed, 'language'),
    sources: countBy(analyzed, 'source')
  };

  const manualLabelsPath = path.join(OUT_DIR, 'manual-labels.json');
  if (fs.existsSync(manualLabelsPath)) {
    const manualLabels = JSON.parse(fs.readFileSync(manualLabelsPath, 'utf8'));
    for (const row of analyzed) {
      const label = manualLabels[row.feedback_id];
      if (!label) continue;
      row.human_theme = label.human_theme || '';
      row.human_sentiment = label.human_sentiment || '';
      row.human_severity = label.human_severity || '';
      const sameTheme = row.theme === row.human_theme;
      const sameSentiment = row.sentiment === row.human_sentiment;
      const sameSeverity = row.severity === row.human_severity;
      row.is_correct = sameTheme && sameSentiment && sameSeverity ? '是' : '否';
      row.validation_notes = label.validation_notes || '';
    }
  }

  const validatedRows = analyzed.filter((row) => row.human_theme);
  const evaluationSummary = {
    sample_size: validatedRows.length,
    theme_accuracy: validatedRows.length ? Number((validatedRows.filter((row) => row.theme === row.human_theme).length / validatedRows.length * 100).toFixed(1)) : 0,
    sentiment_accuracy: validatedRows.length ? Number((validatedRows.filter((row) => row.sentiment === row.human_sentiment).length / validatedRows.length * 100).toFixed(1)) : 0,
    severity_accuracy: validatedRows.length ? Number((validatedRows.filter((row) => row.severity === row.human_severity).length / validatedRows.length * 100).toFixed(1)) : 0,
    exact_accuracy: validatedRows.length ? Number((validatedRows.filter((row) => row.is_correct === '是').length / validatedRows.length * 100).toFixed(1)) : 0,
    theme_confusion: {},
    mismatch_examples: validatedRows.filter((row) => row.theme !== row.human_theme || row.sentiment !== row.human_sentiment || row.severity !== row.human_severity).slice(0, 12).map((row) => ({
      feedback_id: row.feedback_id,
      source: row.source,
      content: row.content.slice(0, 180),
      machine: [row.theme, row.sentiment, row.severity],
      human: [row.human_theme, row.human_sentiment, row.human_severity],
      notes: row.validation_notes
    })),
    note: '抽检由单一分析师完成，用于发现系统性错误，不等同于独立双人标注一致性检验。'
  };
  for (const row of validatedRows) {
    const key = row.human_theme + ' → ' + row.theme;
    evaluationSummary.theme_confusion[key] = (evaluationSummary.theme_confusion[key] || 0) + 1;
  }

  const baseColumns = ['feedback_id', 'source', 'source_url', 'collected_at', 'published_at', 'language', 'content', 'anonymized_author', 'rating', 'source_item_id'];
  const analysisColumns = baseColumns.concat(['theme', 'sentiment', 'severity', 'suggested_action', 'human_theme', 'human_sentiment', 'human_severity', 'is_correct', 'notes', 'theme_confidence', 'severity_score', 'matched_keywords']);
  const feedbackRows = analyzed.map((row) => ({ ...row, notes: row.matched_keywords }));
  const analysisRows = analyzed.map((row) => ({ ...row, notes: row.matched_keywords }));

  fs.writeFileSync(path.join(OUT_DIR, 'feedback.csv'), toCsv(feedbackRows, baseColumns.concat(['theme', 'sentiment', 'severity', 'suggested_action'])), 'utf8');
  fs.writeFileSync(path.join(OUT_DIR, 'analysis.csv'), toCsv(analysisRows, analysisColumns), 'utf8');
  fs.writeFileSync(path.join(OUT_DIR, 'analysis.json'), JSON.stringify(analyzed, null, 2), 'utf8');

  const summary = buildSummary(analyzed, quality);
  fs.writeFileSync(path.join(OUT_DIR, 'summary.json'), JSON.stringify(summary, null, 2), 'utf8');
  fs.writeFileSync(path.join(OUT_DIR, 'evaluation-summary.json'), JSON.stringify(evaluationSummary, null, 2), 'utf8');
  summary.evaluation = evaluationSummary;

  const validationSample = createValidationSample(analyzed, 48);
  fs.writeFileSync(path.join(OUT_DIR, 'validation-sample.csv'), toCsv(validationSample, ['feedback_id', 'source', 'published_at', 'content', 'rating', 'theme', 'sentiment', 'severity', 'human_theme', 'human_sentiment', 'human_severity', 'is_correct', 'validation_notes']), 'utf8');
  fs.writeFileSync(path.join(WORK_DIR, 'validation_to_review.json'), JSON.stringify(validationSample, null, 2), 'utf8');

  console.log('有效评论：' + analyzed.length + ' 条；去重：' + deduped.duplicateCount + ' 条；无效：' + deduped.invalidCount + ' 条。');
  console.log('主题分布：' + JSON.stringify(summary.theme_counts));
  console.log('情绪分布：' + JSON.stringify(summary.sentiment_counts));
  console.log('待人工复核样本：' + validationSample.length + ' 条。');
}

main();
