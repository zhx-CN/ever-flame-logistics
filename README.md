# EVER FLAME LOGISTICS

React 19 + Vite 6 中英文企业展示网站。包含首页、空运服务、印度空运、马来西亚空运、货物能力、关于我们、联系我们和隐私政策。

## 本地运行

```powershell
npm.cmd ci
npm.cmd run dev
```

## GitHub Pages 发布

将当前 `prototype` 文件夹内的内容作为仓库根目录上传。进入仓库 **Settings → Pages → Source**，选择 **GitHub Actions**。提交到 `main` 后，`.github/workflows/deploy-pages.yml` 会构建、测试并发布静态页面。

工作流通过 GitHub Pages 提供的 `base_path` 自动配置仓库子路径；也支持以 `用户名.github.io` 为仓库名的根站点和已配置的自定义域名。

本地验证项目站点（替换成实际仓库名）：

```powershell
npm.cmd run build:pages -- --base /ever-flame-logistics/
npm.cmd run test:pages
```

输出在 `dist/github-pages/`。七个核心页面和隐私政策的中英文版本均有对应的 `index.html`，可以直接分享内页网址并刷新。

详细操作：[GitHub Pages 发布说明](docs/GitHub-Pages发布说明.md)。

## 原有生产构建

```powershell
npm.cmd run build
npm.cmd run test:sites
```

输出仍位于 `dist/client/`，保留 Windows 本地预览包和原站点兼容构建。

联系表单仅演示校验和成功状态，不发送或保存数据；真实联系方式待接入。
