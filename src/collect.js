'use strict';

const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const RAW_DIR = path.join(ROOT, 'data', 'raw');
const COLLECTED_AT = new Date().toISOString();

const CONFIG = {
  steam: {
    appId: 2507950,
    appName: '三角洲行动',
    target: 800,
    pageSize: 100,
    lookupIp: '104.119.106.101',
    appUrl: 'https://store.steampowered.com/app/2507950/'
  },
  apple: {
    appId: 1642894547,
    appName: '三角洲行动',
    pages: 12,
    country: 'cn'
  },
  taptap: {
    appId: 330259,
    appName: '三角洲行动',
    target: 320,
    pageSize: 10,
    appUrl: 'https://www.taptap.cn/app/330259',
    reviewUrl: 'https://www.taptap.cn/app/330259/review'
  },
  bilibili: {
    target: 420,
    videoTarget: 24,
    pagesPerVideo: 3,
    pageSize: 20,
    cutoff: Math.floor(new Date('2025-09-01T00:00:00+08:00').getTime() / 1000),
    queries: [
      '三角洲行动 外挂',
      '三角洲行动 优化 卡顿',
      '三角洲行动 匹配 队友',
      '三角洲行动 爆率',
      '三角洲行动 烽火地带 评价',
      '三角洲行动 赛季 反馈',
      '三角洲行动 官方 评论区',
      '三角洲行动 差评',
      '三角洲行动 平衡 干员',
      '三角洲行动 通行证 皮肤'
    ]
  }
};

const SOURCE_STATUS = {};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function ensureDirs() {
  fs.mkdirSync(RAW_DIR, { recursive: true });
}

function hashAuthor(source, id) {
  const raw = String(id || '匿名玩家');
  return crypto.createHash('sha256').update(source + '|' + raw).digest('hex').slice(0, 12);
}

function cleanText(value) {
  return String(value || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function isoFromUnix(seconds) {
  const n = Number(seconds);
  if (!Number.isFinite(n) || n <= 0) return '';
  return new Date(n * 1000).toISOString();
}

function languageName(value) {
  const mapping = {
    schinese: 'zh-CN',
    tchinese: 'zh-Hant',
    english: 'en',
    japanese: 'ja',
    koreana: 'ko',
    russian: 'ru',
    spanish: 'es',
    latam: 'es-419',
    french: 'fr',
    german: 'de',
    portuguese: 'pt',
    brazilian: 'pt-BR',
    italian: 'it',
    polish: 'pl',
    turkish: 'tr',
    thai: 'th',
    vietnamese: 'vi',
    ukrainian: 'uk'
  };
  return mapping[value] || value || 'unknown';
}

function request(url, options = {}) {
  const retries = options.retries == null ? 3 : options.retries;
  const timeout = options.timeout == null ? 30000 : options.timeout;
  const headers = {
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) DeltaForceFeedbackResearch/1.0',
    'accept': 'application/json,text/plain,*/*',
    ...(options.headers || {})
  };

  const requestOptions = { headers };
  if (options.lookupIp) {
    requestOptions.lookup = (hostname, opts, callback) => callback(null, options.lookupIp, 4);
  }

  return new Promise((resolve, reject) => {
    const req = https.get(url, requestOptions, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ status: res.statusCode, headers: res.headers, data });
          return;
        }
        const error = new Error('HTTP ' + res.statusCode + ' ' + url);
        error.status = res.statusCode;
        error.body = data.slice(0, 500);
        reject(error);
      });
    });
    req.setTimeout(timeout, () => req.destroy(new Error('请求超时 ' + url)));
    req.on('error', reject);
  }).catch(async (error) => {
    if (retries <= 0) throw error;
    await sleep(options.delay == null ? 700 : options.delay);
    return request(url, { ...options, retries: retries - 1 });
  });
}

async function getJson(url, options = {}) {
  const response = await request(url, options);
  try {
    return JSON.parse(response.data);
  } catch (error) {
    error.message = 'JSON 解析失败：' + error.message + '，地址 ' + url;
    throw error;
  }
}

function writeJson(name, value) {
  const target = path.join(RAW_DIR, name);
  fs.writeFileSync(target, JSON.stringify(value, null, 2), 'utf8');
  return target;
}

async function collectSteam() {
  const cfg = CONFIG.steam;
  const startedAt = new Date().toISOString();
  const reviews = [];
  let cursor = '*';
  let page = 0;
  let totalAvailable = null;
  let limitation = '';

  try {
    while (reviews.length < cfg.target && page < 12) {
      page += 1;
      const url = 'https://store.steampowered.com/appreviews/' + cfg.appId +
        '?json=1&filter=recent&language=all&day_range=365&review_type=all&purchase_type=all&num_per_page=' +
        cfg.pageSize + '&cursor=' + encodeURIComponent(cursor);
      const payload = await getJson(url, { referer: cfg.appUrl, lookupIp: cfg.lookupIp });
      if (!payload || payload.success !== 1 || !Array.isArray(payload.reviews)) {
        limitation = 'Steam 接口未返回成功状态';
        break;
      }
      if (totalAvailable == null && payload.query_summary) totalAvailable = payload.query_summary.total_reviews;
      if (!payload.reviews.length) break;

      for (const review of payload.reviews) {
        const content = cleanText(review.review);
        if (content.length < 4) continue;
        const authorId = review.author && (review.author.steamid || review.author.personaname);
        reviews.push({
          source: 'Steam',
          source_item_id: String(review.recommendationid || ''),
          source_url: 'https://steamcommunity.com/app/' + cfg.appId + '/reviews/?browsefilter=mostrecent',
          collected_at: COLLECTED_AT,
          published_at: isoFromUnix(review.timestamp_created),
          language: languageName(review.language),
          content,
          anonymized_author: 'Steam玩家-' + hashAuthor('steam', authorId),
          rating: review.voted_up ? '推荐' : '不推荐',
          metadata: {
            app_id: cfg.appId,
            app_name: cfg.appName,
            votes_up: Number(review.votes_up || 0),
            votes_funny: Number(review.votes_funny || 0),
            comment_count: Number(review.comment_count || 0),
            weighted_vote_score: review.weighted_vote_score || '',
            purchase_type: review.steam_purchase ? 'Steam购买' : '其他激活',
            written_during_early_access: Boolean(review.written_during_early_access)
          }
        });
        if (reviews.length >= cfg.target) break;
      }

      const nextCursor = payload.cursor || '';
      if (!nextCursor || nextCursor === cursor) break;
      cursor = nextCursor;
      await sleep(350);
    }
  } catch (error) {
    limitation = error.message;
  }

  const status = {
    source: 'Steam',
    endpoint: 'https://store.steampowered.com/appreviews/2507950',
    public_access: true,
    started_at: startedAt,
    finished_at: new Date().toISOString(),
    requested_items: cfg.target,
    collected_items: reviews.length,
    total_available: totalAvailable,
    pages: page,
    limitation: limitation || '只采集最近 365 天可见评论；Steam 游标接口最多逐页读取。'
  };
  SOURCE_STATUS.steam = status;
  writeJson('steam.json', { status, reviews });
  console.log('Steam：采集 ' + reviews.length + ' 条，页数 ' + page);
  return reviews;
}

async function collectApple() {
  const cfg = CONFIG.apple;
  const startedAt = new Date().toISOString();
  const reviews = [];
  let limitation = '';
  let successfulPages = 0;

  try {
    for (let page = 1; page <= cfg.pages; page += 1) {
      const url = 'https://itunes.apple.com/' + cfg.country + '/rss/customerreviews/page=' + page +
        '/id=' + cfg.appId + '/sortby=mostrecent/json';
      const payload = await getJson(url, { retries: 2 });
      const entries = payload && payload.feed && Array.isArray(payload.feed.entry) ? payload.feed.entry : [];
      if (!entries.length) break;
      successfulPages += 1;

      for (const entry of entries) {
        if (!entry || !entry['im:rating'] || !entry.content) continue;
        const content = cleanText(entry.content && entry.content.label);
        if (content.length < 4) continue;
        const authorId = entry.author && entry.author.uri && entry.author.uri.label;
        reviews.push({
          source: '苹果应用商店',
          source_item_id: String(entry.id && entry.id.label || ''),
          source_url: String(entry.link && entry.link.attributes && entry.link.attributes.href || 'https://apps.apple.com/cn/app/id' + cfg.appId),
          collected_at: COLLECTED_AT,
          published_at: String(entry.updated && entry.updated.label || ''),
          language: 'zh-CN',
          content,
          anonymized_author: '苹果玩家-' + hashAuthor('apple', authorId),
          rating: Number(entry['im:rating'].label || 0),
          metadata: {
            app_id: cfg.appId,
            app_name: cfg.appName,
            title: cleanText(entry.title && entry.title.label),
            version: String(entry['im:version'] && entry['im:version'].label || ''),
            vote_sum: Number(entry['im:voteSum'] && entry['im:voteSum'].label || 0),
            vote_count: Number(entry['im:voteCount'] && entry['im:voteCount'].label || 0)
          }
        });
      }
      await sleep(300);
    }
  } catch (error) {
    limitation = error.message;
  }

  const status = {
    source: '苹果应用商店',
    endpoint: 'https://itunes.apple.com/cn/rss/customerreviews/id=1642894547',
    public_access: true,
    started_at: startedAt,
    finished_at: new Date().toISOString(),
    requested_items: cfg.pages * 50,
    collected_items: reviews.length,
    pages: successfulPages,
    limitation: limitation || 'Apple 公开 RSS 最多提供最近约 500 条评论，且不保证覆盖全部历史评价。'
  };
  SOURCE_STATUS.apple = status;
  writeJson('apple.json', { status, reviews });
  console.log('苹果应用商店：采集 ' + reviews.length + ' 条，页数 ' + successfulPages);
  return reviews;
}

function taptapXua() {
  return 'V=1&PN=WebApp&LANG=zh_CN&VN_CODE=1&LOC=CN&PLT=PC&DS=PC&UID=0';
}

async function collectTapTap() {
  const cfg = CONFIG.taptap;
  const startedAt = new Date().toISOString();
  const reviews = [];
  let limitation = '';
  let page = 0;
  let from = 0;
  let total = null;

  try {
    while (reviews.length < cfg.target && page < 20) {
      page += 1;
      const url = 'https://www.taptap.cn/webapiv2/review/v2/list-by-app?X-UA=' +
        encodeURIComponent(taptapXua()) + '&app_id=' + cfg.appId + '&from=' + from + '&limit=' + cfg.pageSize;
      const payload = await getJson(url, {
        referer: cfg.reviewUrl,
        headers: { 'x-requested-with': 'XMLHttpRequest' }
      });
      const data = payload && payload.data ? payload.data : {};
      const list = Array.isArray(data.list) ? data.list : [];
      if (total == null && Number.isFinite(Number(data.total))) total = Number(data.total);
      if (!list.length) break;

      for (const item of list) {
        const moment = item.moment || item;
        const review = moment.review || item.review || {};
        const contents = review.contents || {};
        const content = cleanText(contents.text || contents.raw_text);
        if (content.length < 4) continue;
        const authorId = moment.author && moment.author.user && (moment.author.user.id || moment.author.user.name);
        const stat = moment.stat || item.stat || {};
        reviews.push({
          source: 'TapTap',
          source_item_id: String(review.id || moment.id_str || item.identification || ''),
          source_url: cfg.reviewUrl,
          collected_at: COLLECTED_AT,
          published_at: isoFromUnix(moment.publish_time || moment.created_time),
          language: 'zh-CN',
          content,
          anonymized_author: 'TapTap玩家-' + hashAuthor('taptap', authorId),
          rating: Number(review.score || 0),
          metadata: {
            app_id: cfg.appId,
            app_name: cfg.appName,
            device: cleanText(moment.device),
            stage: review.stage_label || '',
            ups: Number(stat.ups || 0),
            pv_total: Number(stat.pv_total || 0),
            review_id: review.id || null
          }
        });
        if (reviews.length >= cfg.target) break;
      }
      from += cfg.pageSize;
      await sleep(400);
    }
  } catch (error) {
    limitation = error.message;
  }

  const status = {
    source: 'TapTap',
    endpoint: 'https://www.taptap.cn/webapiv2/review/v2/list-by-app?app_id=330259',
    public_access: true,
    started_at: startedAt,
    finished_at: new Date().toISOString(),
    requested_items: cfg.target,
    collected_items: reviews.length,
    total_available: total,
    pages: page,
    limitation: limitation || 'TapTap 接口返回的公开评论总量上限显示为 10000，本次仅按可用分页读取样本。'
  };
  SOURCE_STATUS.taptap = status;
  writeJson('taptap.json', { status, reviews });
  console.log('TapTap：采集 ' + reviews.length + ' 条，页数 ' + page);
  return reviews;
}

async function collectBilibiliCandidates() {
  const cfg = CONFIG.bilibili;
  const found = new Map();
  const queryStatus = [];

  for (const keyword of cfg.queries) {
    try {
      const url = 'https://api.bilibili.com/x/web-interface/search/type?search_type=video&keyword=' +
        encodeURIComponent(keyword) + '&page=1&page_size=50&order=pubdate';
      const payload = await getJson(url, {
        referer: 'https://search.bilibili.com/',
        headers: { origin: 'https://www.bilibili.com' }
      });
      if (!payload || payload.code !== 0 || !payload.data || !Array.isArray(payload.data.result)) {
        queryStatus.push({ keyword, success: false, message: payload && payload.message || '无结果' });
        await sleep(500);
        continue;
      }
      let accepted = 0;
      for (const video of payload.data.result) {
        if (!video || !video.bvid) continue;
        const replyCount = Number(video.review || video.video_review || 0);
        if (replyCount < 10) continue;
        if (!found.has(video.bvid)) {
          found.set(video.bvid, {
            bvid: video.bvid,
            aid: Number(video.aid || 0),
            title: cleanText(video.title),
            description: cleanText(video.description || video.desc),
            pubdate: Number(video.pubdate || 0),
            reply_count: replyCount,
            play_count: Number(video.play || 0),
            like_count: Number(video.like || 0),
            matched_query: keyword
          });
          accepted += 1;
        }
      }
      queryStatus.push({ keyword, success: true, accepted });
      await sleep(500);
    } catch (error) {
      queryStatus.push({ keyword, success: false, message: error.message });
      await sleep(600);
    }
  }

  let candidates = Array.from(found.values())
    .filter((v) => v.pubdate >= cfg.cutoff)
    .sort((a, b) => b.pubdate - a.pubdate || b.reply_count - a.reply_count);

  if (candidates.length < cfg.videoTarget) {
    const extra = Array.from(found.values())
      .filter((v) => !candidates.some((x) => x.bvid === v.bvid))
      .sort((a, b) => b.reply_count - a.reply_count);
    candidates = candidates.concat(extra).slice(0, cfg.videoTarget);
  }

  return {
    candidates: candidates.slice(0, cfg.videoTarget),
    allCandidates: Array.from(found.values()),
    queryStatus
  };
}

function flattenBilibiliReplies(replies) {
  const result = [];
  const walk = (items) => {
    for (const item of items || []) {
      if (!item) continue;
      result.push(item);
      if (Array.isArray(item.replies) && item.replies.length) walk(item.replies);
    }
  };
  walk(replies);
  return result;
}

async function collectBilibili() {
  const cfg = CONFIG.bilibili;
  const startedAt = new Date().toISOString();
  const discovery = await collectBilibiliCandidates();
  const comments = [];
  const seen = new Set();
  const videoResults = [];

  for (const video of discovery.candidates) {
    let collectedForVideo = 0;
    let next = 0;
    let pages = 0;

    try {
      while (pages < cfg.pagesPerVideo && collectedForVideo < cfg.pageSize * cfg.pagesPerVideo && comments.length < cfg.target) {
        pages += 1;
        const url = 'https://api.bilibili.com/x/v2/reply/main?type=1&oid=' + video.aid +
          '&mode=3&next=' + next + '&ps=' + cfg.pageSize;
        let payload = await getJson(url, {
          referer: 'https://www.bilibili.com/video/' + video.bvid + '/',
          headers: { origin: 'https://www.bilibili.com' }
        });
        if (!payload || payload.code !== 0 || !payload.data) break;
        let replies = flattenBilibiliReplies(payload.data.replies || []);
        if (!replies.length && pages === 1) {
          await sleep(1600);
          payload = await getJson(url, {
            referer: 'https://www.bilibili.com/video/' + video.bvid + '/',
            headers: { origin: 'https://www.bilibili.com' }
          });
          replies = payload && payload.code === 0 && payload.data ? flattenBilibiliReplies(payload.data.replies || []) : [];
        }
        if (!replies.length) break;

        for (const reply of replies) {
          const rpid = String(reply.rpid_str || reply.rpid || '');
          if (!rpid || seen.has(rpid)) continue;
          const content = cleanText(reply.content && reply.content.message);
          if (content.length < 4) continue;
          const createdAt = Number(reply.ctime || 0);
          if (createdAt && createdAt < cfg.cutoff) continue;
          seen.add(rpid);
          const mid = reply.member && (reply.member.mid || reply.member.uname);
          comments.push({
            source: 'B站',
            source_item_id: rpid,
            source_parent_id: video.bvid,
            source_url: 'https://www.bilibili.com/video/' + video.bvid + '/#reply' + rpid,
            collected_at: COLLECTED_AT,
            published_at: isoFromUnix(createdAt),
            language: 'zh-CN',
            content,
            anonymized_author: 'B站用户-' + hashAuthor('bilibili', mid),
            rating: '',
            metadata: {
              bvid: video.bvid,
              aid: video.aid,
              video_title: video.title,
              video_published_at: isoFromUnix(video.pubdate),
              video_reply_count: video.reply_count,
              like_count: Number(reply.like || 0),
              root_id: String(reply.root || 0),
              parent_id: String(reply.parent || 0)
            }
          });
          collectedForVideo += 1;
          if (comments.length >= cfg.target) break;
        }

        const cursor = payload.data.cursor || {};
        const nextCursor = Number(cursor.next || 0);
        if (!nextCursor || nextCursor === next || cursor.is_end) break;
        next = nextCursor;
        await sleep(900);
      }
    } catch (error) {
      videoResults.push({ bvid: video.bvid, pages, collected: collectedForVideo, error: error.message });
      continue;
    }
    videoResults.push({ bvid: video.bvid, pages, collected: collectedForVideo, error: '' });
    if (comments.length >= cfg.target) break;
    await sleep(1000);
  }

  const status = {
    source: 'B站',
    endpoint: 'https://api.bilibili.com/x/v2/reply/main',
    discovery_endpoint: 'https://api.bilibili.com/x/web-interface/search/type',
    public_access: true,
    started_at: startedAt,
    finished_at: new Date().toISOString(),
    requested_items: cfg.target,
    collected_items: comments.length,
    video_count: videoResults.filter((v) => v.collected > 0).length,
    candidate_count: discovery.allCandidates.length,
    queries: discovery.queryStatus,
    videos: videoResults,
    limitation: 'B站评论仅覆盖公开搜索命中的视频，不等同于全站评论；风控触发时不会绕过验证码。'
  };
  SOURCE_STATUS.bilibili = status;
  writeJson('bilibili.json', { status, videos: discovery.candidates, comments });
  console.log('B站：采集 ' + comments.length + ' 条，覆盖视频 ' + status.video_count + ' 个');
  return comments;
}

async function main() {
  ensureDirs();
  const only = process.argv[2] || 'all';
  console.log('开始公开评论采集，采集时间：' + COLLECTED_AT + '，范围：' + only);
  const steam = only === 'all' || only === 'steam' ? await collectSteam() : [];
  const apple = only === 'all' || only === 'apple' ? await collectApple() : [];
  const taptap = only === 'all' || only === 'taptap' ? await collectTapTap() : [];
  const bilibili = only === 'all' || only === 'bilibili' ? await collectBilibili() : [];

  const summary = {
    collected_at: COLLECTED_AT,
    source_count: Object.keys(SOURCE_STATUS).length,
    feedback_count: steam.length + apple.length + taptap.length + bilibili.length,
    source_counts: {
      Steam: steam.length,
      '苹果应用商店': apple.length,
      TapTap: taptap.length,
      'B站': bilibili.length
    },
    sources: SOURCE_STATUS,
    notes: [
      '所有用户名和头像均未写入原始快照，作者标识仅保留不可逆短哈希。',
      '采集仅访问公开页面或公开接口，不绕过登录、验证码或访问控制。',
      '各来源的可见样本量不同，不能直接外推为全部玩家意见。'
    ]
  };
  writeJson('source-status.json', summary);
  console.log('全部采集完成，共 ' + summary.feedback_count + ' 条。');
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
