'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const RAW_FILE = path.join(ROOT, 'data', 'raw', 'bilibili.json');
const STATUS_FILE = path.join(ROOT, 'data', 'raw', 'source-status.json');
const COLLECTED_AT = new Date().toISOString();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function hashAuthor(id) {
  return crypto.createHash('sha256').update('bilibili|' + String(id || '匿名玩家')).digest('hex').slice(0, 12);
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
  return Number.isFinite(n) && n > 0 ? new Date(n * 1000).toISOString() : '';
}

function request(url, options = {}) {
  const headers = {
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) DeltaForceFeedbackResearch/1.0',
    'accept': 'application/json,text/plain,*/*',
    ...(options.headers || {})
  };
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers }, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(JSON.parse(data));
        else reject(new Error('HTTP ' + res.statusCode + ' ' + url));
      });
    });
    req.setTimeout(30000, () => req.destroy(new Error('请求超时 ' + url)));
    req.on('error', reject);
  });
}

function flattenReplies(items) {
  const out = [];
  const walk = (list) => {
    for (const item of list || []) {
      if (!item) continue;
      out.push(item);
      if (Array.isArray(item.replies) && item.replies.length) walk(item.replies);
    }
  };
  walk(items);
  return out;
}

(async () => {
  if (!fs.existsSync(RAW_FILE)) throw new Error('缺少 B站原始文件，请先运行采集脚本。');
  const raw = JSON.parse(fs.readFileSync(RAW_FILE, 'utf8'));
  const comments = Array.isArray(raw.comments) ? raw.comments.slice() : [];
  const initialCount = comments.length;
  const seen = new Set(comments.map((item) => String(item.source_item_id)));
  const videos = (raw.videos || [])
    .slice()
    .sort((a, b) => Number(b.reply_count || 0) - Number(a.reply_count || 0))
    .slice(0, 18);
  const runResults = [];
  const cutoff = Math.floor(new Date('2025-09-01T00:00:00+08:00').getTime() / 1000);

  for (const video of videos) {
    if (comments.length >= 420) break;
    let accepted = 0;
    let responseCount = 0;
    let error = '';
    try {
      const url = 'https://api.bilibili.com/x/v2/reply/main?type=1&oid=' + video.aid + '&mode=3&next=0&ps=20';
      const payload = await request(url, {
        referer: 'https://www.bilibili.com/video/' + video.bvid + '/',
        headers: { origin: 'https://www.bilibili.com' }
      });
      const replies = payload && payload.code === 0 && payload.data ? flattenReplies(payload.data.replies || []) : [];
      responseCount = replies.length;
      for (const reply of replies) {
        const id = String(reply.rpid_str || reply.rpid || '');
        if (!id || seen.has(id)) continue;
        const content = cleanText(reply.content && reply.content.message);
        if (content.length < 4) continue;
        const createdAt = Number(reply.ctime || 0);
        if (createdAt && createdAt < cutoff) continue;
        seen.add(id);
        const mid = reply.member && (reply.member.mid || reply.member.uname);
        comments.push({
          source: 'B站',
          source_item_id: id,
          source_parent_id: video.bvid,
          source_url: 'https://www.bilibili.com/video/' + video.bvid + '/#reply' + id,
          collected_at: COLLECTED_AT,
          published_at: isoFromUnix(createdAt),
          language: 'zh-CN',
          content,
          anonymized_author: 'B站用户-' + hashAuthor(mid),
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
        accepted += 1;
        if (comments.length >= 420) break;
      }
    } catch (e) {
      error = e.message;
    }
    runResults.push({ bvid: video.bvid, response_count: responseCount, accepted, error });
    console.log(video.bvid + '：返回 ' + responseCount + ' 条，新增 ' + accepted + ' 条' + (error ? '，错误：' + error : ''));
    await sleep(2200);
  }

  raw.comments = comments;
  raw.status.collected_items = comments.length;
  raw.status.video_count = new Set(comments.map((item) => item.metadata && item.metadata.bvid).filter(Boolean)).size;
  raw.status.supplement = {
    collected_at: COLLECTED_AT,
    approached_videos: videos.length,
    added_items: comments.length - initialCount,
    results: runResults
  };
  raw.status.limitation = 'B站评论仅覆盖公开搜索命中的视频，按 2 秒以上间隔低频读取；风控触发时不会绕过验证码。';
  fs.writeFileSync(RAW_FILE, JSON.stringify(raw, null, 2), 'utf8');

  if (fs.existsSync(STATUS_FILE)) {
    const summary = JSON.parse(fs.readFileSync(STATUS_FILE, 'utf8'));
    summary.collected_at = COLLECTED_AT;
    summary.feedback_count = Number(summary.source_counts && summary.source_counts.Steam || 0) +
      Number(summary.source_counts && summary.source_counts['苹果应用商店'] || 0) +
      Number(summary.source_counts && summary.source_counts.TapTap || 0) + comments.length;
    summary.source_counts = summary.source_counts || {};
    summary.source_counts['B站'] = comments.length;
    summary.sources.bilibili = raw.status;
    fs.writeFileSync(STATUS_FILE, JSON.stringify(summary, null, 2), 'utf8');
  }

  console.log('B站补充完成，累计 ' + comments.length + ' 条，覆盖视频 ' + raw.status.video_count + ' 个。');
})().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
