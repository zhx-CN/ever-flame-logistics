# GitHub Pages 发布说明

## 当前状态

已于 2026-10-04 创建公开仓库并成功发布；GitHub Actions 的首次 `build` 和 `deploy` 均已通过，HTTPS 已启用。

- 英文首页：[EVER FLAME LOGISTICS](https://zhx-cn.github.io/ever-flame-logistics/)。
- 中文首页：[EVER FLAME LOGISTICS 中文版](https://zhx-cn.github.io/ever-flame-logistics/zh/)。
- 公开仓库：[zhx-CN/ever-flame-logistics](https://github.com/zhx-CN/ever-flame-logistics)。
- 首次部署记录：[GitHub Actions 发布记录](https://github.com/zhx-CN/ever-flame-logistics/actions/runs/37171791089)。

验证结果：3 项 GitHub Pages 构建测试通过，覆盖全部 16 个中英文静态入口、资源路径和静态主机刷新；原生产构建及 4 项现有站点测试已通过。部署后逐项核对了公网的 16 个页面入口和语言标记，JavaScript、CSS 及四张 PNG 图片均返回正常响应，图片大小与项目资产一致；未知路径返回 404。本次公网验收为 HTTP 页面与资源检查，不代表完成新一轮全站视觉截图验收。

当前发布的是展示原型：联系表单不会发送或保存数据，真实联系方式尚待提供，页面仍保留 `noindex, nofollow`。

## 对外访问方式

项目站点的网址为 `https://用户名.github.io/仓库名/`。以仓库名 `ever-flame-logistics` 为例：首页为 `/ever-flame-logistics/`，中文印度空运页面为 `/ever-flame-logistics/zh/india-air-freight/`。接收方点击网址即可访问，无需下载压缩包或运行启动脚本。

GitHub Free 支持公开仓库的 Pages；私有仓库的 Pages 取决于账户方案。用于当前原型展示适合静态托管；如将来扩展为在线交易、生产收款或商业 SaaS，需要另选符合要求的托管方式。参见 [GitHub Pages 介绍](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages) 和 [使用限制](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)。

## 发布步骤

1. 在选定 GitHub 账号下新建仓库，或选择已有仓库。
2. 将 `prototype` 的内容作为仓库根目录上传；仓库根目录应直接包含 `package.json`、`src`、`public` 和 `.github`。
3. 仓库默认分支使用 `main`；若使用其他分支，修改 `.github/workflows/deploy-pages.yml` 的 `push.branches`。
4. 进入 **Settings → Pages → Build and deployment → Source**，选择 **GitHub Actions**。
5. 在 **Actions** 中运行 **Deploy EVER FLAME LOGISTICS to GitHub Pages**，或向 `main` 提交更新触发发布。
6. 等待 `build` 和 `deploy` 成功，打开工作流显示的 `page_url`；检查英文首页、中文首页以及一个深层页面刷新。

GitHub CLI 发布需要有效登录以及目标仓库的写权限。账户已登录不等于指定仓库已创建，也不等于项目已发布。

## 路径及刷新处理

GitHub 项目站点通常有 `/仓库名/` 前缀。页面导航、语言切换和四张货运图片均使用同一构建基路径，避免请求到域名根目录。

构建会为每个已知页面生成实际目录入口，例如 `zh/india-air-freight/index.html`。这些入口在没有单页应用回退规则的静态主机上也能返回正常页面。未知网址使用 `404.html` 呈现现有找不到页面状态。

每个静态入口含对应页面和语言的标题、描述；完整页面内容和交互由 React 加载。当前保留 `noindex, nofollow` 的原型设置。

## 本地验证

```powershell
cd D:\Knowledge\Try\help\ahai\web1\prototype
npm.cmd run build:pages -- --base /ever-flame-logistics/
npm.cmd run test:pages
```

测试覆盖仓库前缀、语言对应、静态主机上的 16 个入口、直接访问及刷新、脚本与样式引用、四张图片和未知路径。部署后仍需检查公网实际响应。

## 更新方式

以后修改源文件并提交到 `main` 即可自动重新构建与发布。工作流只上传 `dist/github-pages/`；源码仓库是否公开由仓库可见性决定。不要把 `node_modules`、npm 缓存、旧交付 ZIP 和日志上传为网站内容。

原来的 `npm.cmd run build` 和 Windows 一键预览仍使用 `dist/client/`，与 GitHub Pages 构建分开存放。
