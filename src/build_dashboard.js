'use strict';
const fs=require('fs');const path=require('path');const ROOT=path.resolve(__dirname,'..');const PROCESSED=path.join(ROOT,'data','processed');const DASHBOARD=path.join(ROOT,'dashboard');fs.mkdirSync(DASHBOARD,{recursive:true});
function readJson(name){return JSON.parse(fs.readFileSync(path.join(PROCESSED,name),'utf8'));}
const analysis=readJson('analysis.json');
const summary=readJson('summary.json');
const evaluation=readJson('evaluation-summary.json');
const sourceStatus=JSON.parse(fs.readFileSync(path.join(ROOT,'data','raw','source-status.json'),'utf8'));
const rows=analysis.map(r=>({id:r.feedback_id,source:r.source,published_at:r.published_at,content:r.content,language:r.language,rating:r.rating,theme:r.theme,sentiment:r.sentiment,severity:r.severity,severity_score:r.severity_score,suggested_action:r.suggested_action,theme_confidence:r.theme_confidence,source_url:r.source_url}));
let html=fs.readFileSync(path.join(__dirname,'dashboard-template.html'),'utf8');
const map={
  __GENERATED_AT__:new Date().toISOString().slice(0,19).replace('T',' ')+' UTC',
  __TOTAL__:rows.length.toLocaleString('zh-CN'),
  __EVAL_SAMPLE__:evaluation.sample_size,
  __EVAL_EXACT__:evaluation.exact_accuracy,
  __EVAL_THEME__:evaluation.theme_accuracy,
  __EVAL_SENTIMENT__:evaluation.sentiment_accuracy,
  __EVAL_SEVERITY__:evaluation.severity_accuracy,
  __DATA_JSON__:JSON.stringify(rows),
  __SUMMARY_JSON__:JSON.stringify(summary),
  __EVALUATION_JSON__:JSON.stringify(evaluation),
  __SOURCE_STATUS_JSON__:JSON.stringify(sourceStatus)
};
for(const [key,value] of Object.entries(map))html=html.split(key).join(String(value).replace(/</g,'\\u003c'));
fs.writeFileSync(path.join(DASHBOARD,'index.html'),html,'utf8');
console.log('看板已生成：dashboard/index.html，大小 '+(Buffer.byteLength(html)/1024).toFixed(1)+' KB。');
