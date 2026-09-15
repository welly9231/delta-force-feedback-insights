# 发布到 GitHub Pages

1. 在 GitHub 新建公开仓库，例如 `delta-force-ai-portfolio`，不要勾选初始化 README。
2. 在当前目录打开 PowerShell。
3. 执行：

```powershell
git remote add origin https://github.com/你的用户名/delta-force-ai-portfolio.git
git push -u origin main
```

4. 进入仓库 `Settings → Pages`，在 `Build and deployment` 中选择 `GitHub Actions`。
5. 等待 Actions 完成，访问 `https://你的用户名.github.io/delta-force-ai-portfolio/`。

仓库中已经包含 `.github/workflows/pages.yml`，推送后会自动部署。
