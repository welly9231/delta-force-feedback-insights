from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
ROOT=Path(r'C:\Users\WellY\Documents\Codex\2026-09-15\project-brief-md-x20\outputs\delta-force-feedback-insights')
ASSETS=ROOT/'portfolio'/'assets'; ASSETS.mkdir(parents=True,exist_ok=True)
FONT=r'C:\Windows\Fonts\msyh.ttc'; FONT_BOLD=r'C:\Windows\Fonts\msyhbd.ttc'
def f(size,bold=False):
    try:return ImageFont.truetype(FONT_BOLD if bold else FONT,size)
    except:return ImageFont.load_default()
def bg(w,h):
    im=Image.new('RGB',(w,h),'#07110d');d=ImageDraw.Draw(im)
    for y in range(h):
        c=(7+int(7*y/h),17+int(25*y/h),13+int(15*y/h));d.line((0,y,w,y),fill=c)
    for x in range(0,w,48):d.line((x,0,x,h),fill='#0d241a',width=1)
    for y in range(0,h,48):d.line((0,y,w,y),fill='#0d241a',width=1)
    return im,d
def card(d,box,fill='#0d2018',outline='#234538',radius=20):
    d.rounded_rectangle(box,radius=radius,fill=fill,outline=outline,width=2)
def pill(d,x,y,text,color='#62e6a5'):
    d.rounded_rectangle((x,y,x+270,y+38),radius=19,fill='#0c271d',outline='#2e6a51',width=1);d.text((x+16,y+9),text,font=f(16,True),fill=color)
def bars(d,x,y,items,w=500):
    maxv=max(v for _,v in items)
    for i,(name,v) in enumerate(items):
        yy=y+i*54;d.text((x,yy),name,font=f(18),fill='#cce9dc');d.rounded_rectangle((x+190,yy+5,x+w,yy+20),radius=8,fill='#0a1712');
        d.rounded_rectangle((x+190,yy+5,x+190+int((w-190)*v/maxv),yy+20),radius=8,fill='#62e6a5');d.text((x+w+15,yy),str(v),font=f(17,True),fill='#91b5a5')
def card_metric(d,box,label,value,sub=''):
    card(d,box);x,y,w,h=box;d.text((x+22,y+18),label,font=f(16),fill='#91b5a5');d.text((x+22,y+52),value,font=f(40,True),fill='#b9f36b');
    if sub:d.text((x+22,y+105),sub,font=f(14),fill='#91b5a5')
# 01 总览
im,d=bg(1440,900);pill(d,48,40,'PUBLIC FEEDBACK INTELLIGENCE');d.text((48,105),'三角洲行动反馈洞察看板',font=f(42,True),fill='#ecfff6');d.text((48,165),'4 类公开来源｜1,431 条有效评论｜主题·情绪·严重度·运营动作',font=f(19),fill='#9fc5b5')
metrics=[('有效评论','1,431','公开样本'),('负向与混合','775','54.2%'),('高与严重','231','16.1%'),('三项全对','45.8%','48 条抽检')]
for i,m in enumerate(metrics):card_metric(d,(48+i*338,220,320+i*338,340),*m)
card(d,(48,380,760,820));d.text((76,405),'主题分布',font=f(25,True),fill='#ecfff6');bars(d,78,460,[('正向反馈',403),('搜打撤与经济',183),('性能与优化',125),('外挂与安全',99),('匹配与队友',91)])
card(d,(790,380,1392,820));d.text((818,405),'情绪与来源',font=f(25,True),fill='#ecfff6');bars(d,820,460,[('Steam',800),('苹果应用商店',451),('TapTap',162),('B站',18)],480);d.text((820,715),'正向 631｜负向 678｜混合 97｜中性 25',font=f(18),fill='#9fc5b5')
im.save(ASSETS/'01-overview.png')
# 02 高严重度
im,d=bg(1440,900);pill(d,48,40,'PRIORITY VIEW');d.text((48,110),'高频问题与运营优先级',font=f(42,True),fill='#ecfff6');d.text((48,170),'问题数量与严重度并不一致，外挂、性能、客服信任优先。',font=f(20),fill='#9fc5b5')
items=[('外挂与安全','99 条 · 平均严重度 3.10','89.9%',0.90),('性能与优化','125 条 · 平均严重度 2.28','77.6%',0.78),('搜打撤与经济','183 条 · 平均严重度 1.64','56.8%',0.57),('匹配与队友','91 条 · 平均严重度 1.76','67.0%',0.67),('客服与封禁','37 条 · 平均严重度 2.92','100%',1.0)]
for i,(title,meta,neg,pct) in enumerate(items):
    y=250+i*115;card(d,(70,y,1370,y+92));d.text((100,y+18),title,font=f(25,True),fill='#ecfff6');d.text((100,y+56),meta,font=f(16),fill='#91b5a5');d.text((1150,y+18),'负向/混合 '+neg,font=f(17),fill='#ffc857');d.rounded_rectangle((1150,y+58,1330,y+72),8,fill='#0a1712');d.rounded_rectangle((1150,y+58,1150+int(180*pct),y+72),8,fill='#62e6a5')
im.save(ASSETS/'02-security.png')
# 03 验证
im,d=bg(1440,900);pill(d,48,40,'HUMAN REVIEW');d.text((48,110),'人工抽检与误差分析',font=f(42,True),fill='#ecfff6');d.text((48,170),'单分析师分层复核 48 条，公开记录质量与边界。',font=f(20),fill='#9fc5b5')
vals=[('主题一致率','81.3%'),('情绪一致率','66.7%'),('严重度一致率','75.0%'),('三项全对','45.8%')]
for i,(a,b) in enumerate(vals):card_metric(d,(48+i*338,230,320+i*338,360),a,b,'一致率')
card(d,(70,410,680,810));d.text((100,440),'主要误差',font=f(25,True),fill='#ecfff6');errors=['复合长评主主题冲突','反讽情绪方向错误','否定表达被关键词误判','跨语言短评语义不足','简短文本严重度偏差']
for i,e in enumerate(errors):d.text((100,500+i*52),'• '+e,font=f(19),fill='#b4d3c5')
card(d,(720,410,1370,810));d.text((750,440),'改进方向',font=f(25,True),fill='#ecfff6');actions=['大模型零样本分类对照','第二标注者与独立测试集','宏平均 F1、高严重度召回率','成本、延迟与可解释性比较','在线部署与定时采集']
for i,e in enumerate(actions):d.text((750,500+i*52),'• '+e,font=f(19),fill='#b4d3c5')
im.save(ASSETS/'03-evaluation.png')
# 04 AI 工作流
im,d=bg(1440,560);d.text((48,40),'AI 辅助数据分析工作流',font=f(36,True),fill='#ecfff6');steps=[('01','公开采集','四类公开评论'),('02','匿名化','移除身份信息'),('03','预分类','主题情绪严重度'),('04','人工抽检','分层复核 48 条'),('05','修正说明','保留依据与边界'),('06','运营输出','看板周报行动')]
for i,(n,t,s) in enumerate(steps):
    x=45+i*230;card(d,(x,140,x+205,470));d.text((x+22,170),n,font=f(34,True),fill='#62e6a5');d.text((x+22,300),t,font=f(23,True),fill='#ecfff6');
    for j,line in enumerate([s[:10],s[10:]]):
        if line:d.text((x+22,350+j*32),line,font=f(15),fill='#9fc5b5')
im.save(ASSETS/'04-ai-workflow.png')
print('图卡已生成')
