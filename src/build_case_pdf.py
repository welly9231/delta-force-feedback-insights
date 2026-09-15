from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from PIL import Image
from pathlib import Path
ROOT=Path(r'C:\Users\WellY\Documents\Codex\2026-09-15\project-brief-md-x20\outputs\delta-force-feedback-insights')
A=ROOT/'portfolio'/'assets'; OUT=ROOT/'portfolio'/'case-study.pdf'
try:
    pdfmetrics.registerFont(TTFont('MSYH',r'C:\Windows\Fonts\msyh.ttc'))
    pdfmetrics.registerFont(TTFont('MSYHB',r'C:\Windows\Fonts\msyhbd.ttc'))
except Exception:
    pdfmetrics.registerFont(TTFont('MSYH',r'C:\Windows\Fonts\simhei.ttf'))
    pdfmetrics.registerFont(TTFont('MSYHB',r'C:\Windows\Fonts\simhei.ttf'))
W,H=A4;c=canvas.Canvas(str(OUT),pagesize=A4)
def bg():
    c.setFillColorRGB(.027,.067,.051);c.rect(0,0,W,H,fill=1,stroke=0)
    c.setStrokeColorRGB(.075,.18,.13);c.setLineWidth(.4)
    for x in range(0,int(W),42):c.line(x,0,x,H)
    for y in range(0,int(H),42):c.line(0,y,W,y)
def title(tag,title,sub=''):
    c.setFont('MSYH',9);c.setFillColorRGB(.38,.9,.65);c.drawString(42,H-44,tag)
    c.setFont('MSYHB',25);c.setFillColorRGB(.93,1,.97);c.drawString(42,H-84,title)
    if sub:c.setFont('MSYH',10.5);c.setFillColorRGB(.62,.78,.7);c.drawString(42,H-106,sub)
def box(x,y,w,h,text,font='MSYH',size=10.5):
    c.setFillColorRGB(.05,.13,.095);c.setStrokeColorRGB(.16,.31,.25);c.roundRect(x,y,w,h,10,fill=1,stroke=1)
    c.setFont(font,size);c.setFillColorRGB(.75,.9,.84);c.drawString(x+12,y+h-20,text)
def footer(n):
    c.setStrokeColorRGB(.16,.31,.25);c.line(42,36,W-42,36);c.setFont('MSYH',8);c.setFillColorRGB(.4,.58,.51);c.drawString(42,24,f'钟明烨｜AI 辅助数据分析与运营洞察作品集｜案例 {n}/3')
# 第一页
bg();title('CASE STUDY / 01','三角洲行动公开反馈洞察','从多源评论到运营动作')
box(42,H-185,W-84,55,'公开采集 → 匿名化 → 清洗去重 → 多语言分类 → 严重度评分 → 人工抽检 → 看板与周报',size=11)
box(42,H-305,(W-100)/2,100,'AI 的参与\nAI 用于方案拆解、代码草稿、分类规则、报告初稿和一致性检查；不替代来源判断、隐私边界与最终业务判断。')
box(58+(W-100)/2,H-305,(W-100)/2,100,'人的控制\n人工决定来源范围、分类标准、抽检样本与结论边界，并对反讽、否定句、复合长评进行复核。')
img=Image.open(A/'01-overview.png');ratio=img.height/img.width;w=W-84;h=w*ratio;c.drawImage(str(A/'01-overview.png'),42,65,width=w,height=h)
footer(1);c.showPage()
# 第二页
bg();title('CASE STUDY / 02','核心发现：问题量与严重度并不一致','外挂、性能、客服问题优先；经济与匹配需要分场景治理')
img=Image.open(A/'02-security.png');ratio=img.height/img.width;w=W-84;h=w*ratio;c.drawImage(str(A/'02-security.png'),42,H-130-h,width=w,height=h)
y=H-155-h;box(42,y-120,W-84,105,'运营动作\n优先处理反作弊与账号安全、闪退与文件损坏、观察期与误封申诉；经济与匹配问题按地图、模式和人群拆解，而不是简单全局调整。',size=11)
footer(2);c.showPage()
# 第三页
bg();title('CASE STUDY / 03','验证与局限：把不确定性写进作品集','48 条分层抽检不是独立双人标注，结论仅用于趋势与问题发现')
img=Image.open(A/'03-evaluation.png');ratio=img.height/img.width;w=W-84;h=w*ratio;c.drawImage(str(A/'03-evaluation.png'),42,H-130-h,width=w,height=h)
y=H-155-h;box(42,y-145,W-84,130,'可展示能力\nAI 工作流设计、数据采集与清洗、分类标准、人工验证、交互式看板、运营优先级与合规边界。\n下一步：补充真人第二标注者、宏平均 F1、定时采集和 MP4 演示视频；Copilot 分类对照三项一致率为 77.1% / 79.2% / 81.3%；独立 AI 复核为 68.3% / 63.3% / 61.7%。',size=10.5)
footer(3);c.save();print(OUT)


