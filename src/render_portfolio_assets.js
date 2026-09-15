'use strict';
const fs=require('fs');const path=require('path');const {chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..');const ASSETS=path.join(ROOT,'portfolio','assets');const DEMO=path.join(ROOT,'portfolio','demo');fs.mkdirSync(ASSETS,{recursive:true});fs.mkdirSync(DEMO,{recursive:true});
const url=p=>'file:///'+p.replace(/\\/g,'/');
async function caption(page,text){await page.evaluate((t)=>{let el=document.getElementById('demo-caption');if(!el){el=document.createElement('div');el.id='demo-caption';el.style.cssText='position:fixed;left:24px;right:24px;bottom:20px;z-index:99999;background:rgba(5,20,14,.94);border:1px solid #4ce09b;color:#ecfff6;padding:14px 20px;border-radius:14px;font:600 18px Microsoft YaHei;box-shadow:0 10px 35px #0008';document.body.appendChild(el);}el.textContent=t;},text);}
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:\\\\Program Files (x86)\\\\Microsoft\\\\Edge\\\\Application\\\\msedge.exe'});const page=await browser.newPage({viewport:{width:1440,height:1100},deviceScaleFactor:1});
await page.goto(url(path.join(ROOT,'dashboard','index.html')),{waitUntil:'load'});await page.waitForTimeout(1000);await page.screenshot({path:path.join(ASSETS,'01-overview.png'),fullPage:false});
await page.selectOption('#themeFilter',{label:'外挂与安全'});await page.waitForTimeout(700);await page.screenshot({path:path.join(ASSETS,'02-security.png'),fullPage:false});
await page.goto(url(path.join(ROOT,'dashboard','index.html')),{waitUntil:'load'});await page.waitForTimeout(500);const evalCard=page.locator('article.card').filter({hasText:'人工抽检质量'}).first();await evalCard.scrollIntoViewIfNeeded();await page.waitForTimeout(300);await evalCard.screenshot({path:path.join(ASSETS,'03-evaluation.png')});
await page.goto(url(path.join(ROOT,'portfolio','ai-workflow.html')),{waitUntil:'load'});await page.screenshot({path:path.join(ASSETS,'04-ai-workflow.png'),fullPage:true});
await page.goto(url(path.join(ROOT,'index.html')),{waitUntil:'load'});await page.screenshot({path:path.join(ASSETS,'05-portfolio-home.png'),fullPage:false});
await page.goto(url(path.join(ROOT,'portfolio','case-study.html')),{waitUntil:'load'});await page.pdf({path:path.join(ROOT,'portfolio','case-study.pdf'),format:'A4',printBackground:true,preferCSSPageSize:true});
await browser.close();
const videoDir=fs.mkdtempSync(path.join(require('os').tmpdir(),'df-demo-'));const context=await browser.newContext({viewport:{width:1280,height:720},recordVideo:{dir:videoDir,size:{width:1280,height:720}}});const vp=await context.newPage();
await vp.goto(url(path.join(ROOT,'index.html')),{waitUntil:'load'});await caption(vp,'AI 辅助数据分析作品集：多源公开反馈洞察');await vp.waitForTimeout(3500);
await vp.goto(url(path.join(ROOT,'dashboard','index.html')),{waitUntil:'load'});await vp.waitForTimeout(1200);await caption(vp,'第一步：看板总览，支持来源、主题、情绪和严重度筛选');await vp.waitForTimeout(3500);
await vp.selectOption('#themeFilter',{label:'外挂与安全'});await vp.waitForTimeout(700);await caption(vp,'筛选“外挂与安全”：99 条，平均严重度 3.10');await vp.waitForTimeout(3500);
await vp.selectOption('#themeFilter',{label:'搜打撤与经济'});await vp.waitForTimeout(700);await caption(vp,'搜打撤与经济：提及量最高，但正负体验并存');await vp.waitForTimeout(3500);
const evalText=await vp.locator('article.card').filter({hasText:'人工抽检质量'}).first().scrollIntoViewIfNeeded();await caption(vp,'48 条人工抽检：透明报告一致率与误差');await vp.waitForTimeout(3500);
const video=vp.video();await vp.close();await context.close();const tempPath=await video.path();const finalVideo=path.join(DEMO,'demo-video.webm');fs.copyFileSync(tempPath,finalVideo);fs.rmSync(videoDir,{recursive:true,force:true});
console.log('已生成截图、三页案例 PDF 和演示视频。');})().catch(e=>{console.error(e.stack||e.message);process.exit(1);});


