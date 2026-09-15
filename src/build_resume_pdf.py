from docx import Document
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from pathlib import Path
ROOT=Path(r'C:\Users\WellY\Documents\Codex\2026-09-15\project-brief-md-x20\outputs\delta-force-feedback-insights')
DOC=ROOT/'resume'/'钟明烨-AI创新人才储备-含AI作品集-一页版.docx'; OUT=ROOT/'resume'/'钟明烨-AI创新人才储备-含AI作品集-一页版.pdf'
try:
 pdfmetrics.registerFont(TTFont('MSYH',r'C:\Windows\Fonts\msyh.ttc'));pdfmetrics.registerFont(TTFont('MSYHB',r'C:\Windows\Fonts\msyhbd.ttc'))
except: pdfmetrics.registerFont(TTFont('MSYH',r'C:\Windows\Fonts\simhei.ttf'));pdfmetrics.registerFont(TTFont('MSYHB',r'C:\Windows\Fonts\simhei.ttf'))
doc=Document(str(DOC)); W,H=A4;c=canvas.Canvas(str(OUT),pagesize=A4);c.setFillColorRGB(1,1,1);c.rect(0,0,W,H,fill=1,stroke=0)
c.setFillColorRGB(.09,.2,.35);c.setFont('MSYHB',21);c.drawString(44,H-48,'钟明烨')
c.setFillColorRGB(.18,.45,.71);c.setFont('MSYHB',10.5);c.drawString(44,H-67,'AI创新人才储备｜AI应用 / 产品 / 运营方向')
c.setFillColorRGB(.3,.33,.38);c.setFont('MSYH',8);c.drawString(44,H-82,'2026届本科｜广东工业大学·信息管理与信息系统｜广州｜19866709231｜1341191810@qq.com')
sections={'职业定位','AI实践与效率提升','核心优势','项目经历','实习经历','教育经历','技能与工具'};y=H-100
for p in doc.paragraphs:
 text=p.text.strip()
 if not text: continue
 if text in sections:
  y-=5;c.setFillColorRGB(.09,.2,.35);c.setFont('MSYHB',10.5);c.drawString(44,y,text);c.setStrokeColorRGB(.85,.89,.91);c.line(44,y-3,W-44,y-3);y-=13;continue
 if text.startswith('•'):
  c.setFillColorRGB(.18,.45,.71);c.setFont('MSYHB',8.2);c.drawString(48,y,'•');
  lines=[];cur='';prefix='';body=text[1:].strip();
  for ch in body:
   if pdfmetrics.stringWidth(prefix+cur+ch,'MSYH',8.1) < W-105: cur+=ch
   else: lines.append('%s%s'%(prefix,cur));prefix='  ';cur=ch
  lines.append('%s%s'%(prefix,cur))
 else:
  lines=[];cur=''
  for ch in text:
   if pdfmetrics.stringWidth(cur+ch,'MSYH',8.1) < W-88: cur+=ch
   else: lines.append(cur);cur=ch
  lines.append(cur)
 for i,line in enumerate(lines):
  c.setFillColorRGB(.18,.19,.21);c.setFont('MSYH',8.1);c.drawString(54 if text.startswith('•') and i==0 else 61 if text.startswith('•') else 44,y,line);y-=10.2
 y-=2.4
c.setFillColorRGB(.45,.48,.52);c.setFont('MSYH',7);c.drawString(44,26,'AI作品集入口随附：index.html / dashboard/index.html / portfolio/case-study.pdf')
c.save();print(OUT)
