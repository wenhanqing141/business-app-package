# 业务应用包 · 前端原型 Demo

「业务应用包」需求的**全链路高保真前端原型**，用于演示 UI、交互与业务流程：微服务应用管理 → 创建向导 → 搭建工作台 → 应用后台（基础信息 / 权限 / 聚合表 / 业务流 / 数据工厂 / AI 助手）→ 业务应用包前台。

> ⚠️ 本品为**纯前端原型**：数据全部来自 Mock 假数据，**不对接真实后端**；供 UI / 交互 / 业务流参照，非可集成到生产系统的真实功能代码。

---

## 一、技术栈

| 类别 | 技术 | 版本 | 说明 |
| --- | --- | --- | --- |
| 框架 | Vue 3 | ^3.4 | Composition API（`<script setup>`） |
| 构建 | Vite | ^5.1 | 开发服务器 + 生产构建 |
| 语言 | JavaScript (ESM) | — | — |
| UI 组件库 | Element Plus | ^2.5 | PC 管理后台组件 + 主题变量换肤 |
| 图标 | @remixicon/vue | ^4.9 | 全项目统一图标库；业务语义图标通过 `AppIcon` 映射 |
| 路由 | Vue Router | ^4.3 | hash 模式（适配静态托管 / 子路径） |
| 状态管理 | Pinia | ^2.1 | + pinia-plugin-persistedstate 持久化 |
| HTTP | Axios | ^1.6 | 请求封装（`src/api/request.js`） |
| Mock（开发） | vite-plugin-mock | ^3.0 | 拦截 `/api` 前缀请求 |
| Mock（生产） | 内联 Mock 适配器 | — | `src/utils/inlineMockAdapter.js`，构建产物运行 |
| 拖拽排序 | vuedraggable | ^4.1 | 工作台分组 / 应用排序 |
| 富文本 | @wangeditor/editor | ^5.1 | 富文本编辑器 |
| 表格导出 | xlsx | ^0.18 | Excel 导出 |

**UI 设计**：遵循 `context/reusable_assets/设计规范/cxlowcode设计规范.md`（品牌蓝 `#2B67FF`、4/8/12px 圆角、统一中性灰阶），通过 `src/styles/variables.css` 的一套设计 Token（含 Element Plus `--el-*` 变量覆盖）全局换肤。

---

## 二、目录结构

```
business-app-package/
├── src/
│   ├── api/            # 接口封装（appPackage / approval / menu / portal）
│   ├── components/     # 业务组件（builder 工作台 / portal 前台）
│   ├── layouts/        # 布局（MainLayout / BuilderAdminLayout）
│   ├── mock/           # Mock 数据源（pkgSeed 单一假数据 + 各业务端点）
│   ├── router/         # 路由（hash 模式 + 动态路由）
│   ├── stores/         # Pinia（menu / tabs）
│   ├── styles/         # 全局设计 Token（variables.css / index.css）
│   ├── utils/          # 工具（内联 mock 适配器等）
│   └── views/          # 页面（builder / msa / portal / admin）
├── vite.config.js      # base:'./'，端口 5173，自动开浏览器
├── index.html
└── package.json
```

---

## 三、快速开始（源码运行）

```bash
npm install        # 首次安装依赖
npm run dev        # 开发服务器 → http://localhost:5173（自动开浏览器）
npm run build      # 生产构建 → dist/（纯静态产物）
npm run preview    # 本地预览构建产物
```

---

## 四、`dist/` 产物说明（发给预览方）

`dist/` 是自包含的纯静态产物，**无需 Node、无需后端、无需安装任何依赖**：

- **hash 路由 + 相对资源路径**（`base: './'`），可托管到任意子路径；
- **双击 `index.html` 即可打开**，或放到任意静态服务器（Nginx / Apache / OSS 等）。

```bash
# Nginx（支持任意子路径，例如 /demo/bap/）
location /demo/bap/ {
    alias /var/www/bap/dist/;
    index index.html;
    try_files $uri $uri/ /demo/bap/index.html;
}
```

---

## 五、注意事项

1. **纯前端原型**：所有数据为 Mock 假数据，接口前缀 `/api`，不接真实后端。
2. **不作为生产代码**：研发以本原型为依据对接真实后端时，需按实际接口 / 数据模型重写 `src/api` 与 `src/mock`。
3. 数据流：`src/mock/*` 单一数据源在开发（vite-plugin-mock）与生产（inlineMockAdapter）共用，数据与逻辑零分叉。
