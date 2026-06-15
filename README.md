# 人类基准测试

一个基于 React + Vite 实现的 Human Benchmark 复刻版，包含 8 项常见认知、记忆和反应测试。应用在浏览器本地运行，成绩保存在 `localStorage`，不依赖后端服务。

## 功能

- 反应速度：屏幕变绿后尽快点击。
- 顺序记忆：重复越来越长的闪烁顺序。
- 瞄准训练：尽快点中 30 个目标。
- 数字记忆：记住并输入越来越长的数字。
- 词语记忆：判断词语是否已经出现过。
- 黑猩猩测试：按编号顺序点击隐藏方块。
- 视觉记忆：记住并复原高亮方格。
- 打字速度：按给定中文句子准确输入。

## 运行

```bash
npm install
npm run dev
```

默认开发地址：

```text
http://localhost:5173/
```

## 构建

```bash
npm run build
```

构建产物会输出到 `dist/`。

## GitHub Pages

项目已经在 `vite.config.ts` 中配置了 `base: "./"`，构建后的资源会使用相对路径，例如 `./assets/...`。这样发布到 GitHub Pages 的项目页时，不会因为仓库名子路径导致 JS/CSS 资源 404 和页面白屏。

## 成绩记录

每项测试会记录：

- 最佳成绩
- 最近 5 次尝试

记录保存在浏览器 `localStorage` 的 `human-benchmark-lab-scores` key 下。清除浏览器站点数据后，成绩也会被清空。

## 技术栈

- React
- TypeScript
- Vite
- lucide-react
