from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
ROOT=Path(r'C:\Users\WellY\Documents\Codex\2026-09-15\project-brief-md-x20\outputs\delta-force-feedback-insights');A=ROOT/'portfolio'/'assets';D=ROOT/'portfolio'/'demo';D.mkdir(parents=True,exist_ok=True)
font=ImageFont.truetype(r'C:\Windows\Fonts\msyhbd.ttc',28)
slides=[('01-overview.png','AI 辅助数据分析作品集：多源公开反馈洞察'),('02-security.png','筛选“外挂与安全”：99 条，平均严重度 3.10'),('01-overview.png','搜打撤与经济：提及量最高，但正负体验并存'),('03-evaluation.png','48 条人工抽检：透明报告一致率与误差'),('04-ai-workflow.png','AI 与人的分工：AI 提效，人负责标准与验证')]
frames=[]
for name,cap in slides:
 im=Image.open(A/name).convert('RGB').resize((1280,720));ov=Image.new('RGBA',im.size,(0,0,0,0));d=ImageDraw.Draw(ov);d.rounded_rectangle((28,630,1252,690),18,fill=(5,20,14,235),outline=(76,224,155,255),width=2);d.text((50,645),cap,font=font,fill=(236,255,246,255));frames.append(Image.alpha_composite(im.convert('RGBA'),ov).convert('P',palette=Image.ADAPTIVE))
frames[0].save(D/'demo-preview.gif',save_all=True,append_images=frames[1:],duration=2200,loop=0,optimize=True)
print(D/'demo-preview.gif')
