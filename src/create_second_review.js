'use strict';
const fs=require('fs');const path=require('path');
const ROOT=path.resolve(__dirname,'..');const OUT=path.join(ROOT,'data','processed','second-review');fs.mkdirSync(OUT,{recursive:true});
const rows=JSON.parse(fs.readFileSync(path.join(ROOT,'data','processed','analysis.json'),'utf8')).filter(r=>!r.human_theme);
function esc(v){const s=String(v==null?'':v);return /[",\r\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;}
function csv(list,cols){return '\ufeff'+[cols.join(',')].concat(list.map(r=>cols.map(c=>esc(r[c])).join(','))).join('\r\n');}
const by={};for(const r of rows){(by[r.source]=by[r.source]||[]).push(r)}
const sample=[];for(const source of Object.keys(by)){const list=by[source].sort((a,b)=>String(a.feedback_id).localeCompare(String(b.feedback_id)));const quota=source==='B站'?8:source==='TapTap'?14:source==='苹果应用商店'?18:20;const step=Math.max(1,Math.floor(list.length/quota));let got=0;for(let i=0;i<list.length&&got<quota;i+=step){sample.push({feedback_id:list[i].feedback_id,source:list[i].source,published_at:list[i].published_at,content:list[i].content,rating:list[i].rating,theme:'',sentiment:'',severity:'',reviewer_notes:''});got++;}}
fs.writeFileSync(path.join(OUT,'second-reviewer-template.csv'),csv(sample,['feedback_id','source','published_at','content','rating','theme','sentiment','severity','reviewer_notes']),'utf8');
fs.writeFileSync(path.join(OUT,'annotator-instructions.md'),`# 第二标注者操作说明\n\n1. 打开 second-reviewer-template.csv。\n2. 只阅读 content 和 rating，不参考自动分类结果。\n3. theme 只能填写分类标准中的 12 类主题。\n4. sentiment 只能填写正向、负向、混合、中性。\n5. severity 只能填写低、中、高、严重。\n6. 有歧义时在 reviewer_notes 写明判断依据或无法判断的原因。\n7. 完成后把文件另存为 second-reviewer-completed.csv，不覆盖原模板。\n\n本文件用于获得真实第二标注者，不应由自动规则代填。`, 'utf8');
console.log('第二标注者样本已生成：'+sample.length+' 条');
