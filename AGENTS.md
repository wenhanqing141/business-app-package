# 项目页面修改规则

- 所有页面修改必须以本地预览 `http://127.0.0.1:5176/#/builder/ai-create` 及其实际路由源码为准，不要修改其他预览副本或根据截图猜测文件。
- AI 创建页源码入口为 `src/views/builder/AiCreate.vue`。修改前先在本地预览确认目标元素，修改后刷新预览并截图核对。
- 视觉基准沿用 AI 创建页空状态；通用交互组件使用 Element Plus，视觉表达遵循 HeroUI 的轻量层级、低对比度边框和完整交互状态。
- 所有定位类调整必须明确相对参照物。输入框上方的浮动按钮，以输入框顶部为参照，保持用户要求的像素间距；不要用消息流的 sticky 定位替代。

## 下拉菜单与下拉列表

- 所有菜单和选择列表必须复用 Element Plus 的 `el-dropdown`、`el-dropdown-menu`、`el-dropdown-item`、`el-select` 与 `el-option`，不手写替代控件。
- 视觉统一由 `src/styles/index.css` 维护：隐藏 Popper 顶部箭头，触发器与浮层的可见间距保持 4px；浮层使用 20px 圆角、白底、细边框与柔和扩散阴影。
- 菜单内容区最小宽度为 208px；条目高度 40px、左右内边距 14px、圆角 14px、字体 14px、行高 40px。默认态不显示底色，仅 hover、focus、已选态显示中性灰底。
- 删除、退出登录等危险菜单项必须使用 `is-danger` 语义类；只在语义确有必要时保留图标，分组继续使用 Element 的 `divided`。

## 滚动条

- 所有页面内独立滚动区域必须复用 Element Plus `el-scrollbar`，禁止新增裸 `overflow-y: auto`、`overflow-y: scroll` 或依赖浏览器原生滚动条的页面滚动容器。
- 统一采用悬浮式滚动条：Element 的原生滚动层隐藏系统滚动条，自绘滑块绝对定位覆盖在内容右侧边缘；滚动条不得占用内容布局宽度，也不得因出现或消失导致内容宽度跳动。
- 滚动容器必须有明确高度或由 flex 布局提供 `min-height: 0`；内容的 `padding`、`gap`、背景应施加在 `.el-scrollbar__view`，不能施加在外层滚动容器后再依赖原生 gutter。
- 可滚动内容默认使用 `always` 保持滑块可发现；垂直滑块固定 6px 宽、距右侧 4px、低对比度中性灰，hover 时仅提高可见度。
- 文本域、代码编辑器、浏览器 iframe 和第三方不可控组件可保留其原生滚动行为；其他存量滚动区在后续改动对应页面时迁移到该方案。
- 全局视觉样式只维护在 `src/styles/index.css`；局部页面仅补充尺寸、内容视图间距和必要的状态范围，不能重新绘制另一套滚动条。

## 文字提示

- 所有悬停文字提示必须使用全局 `AppTooltip` 组件。该组件基于 Element Plus `el-tooltip`，统一维护 10px 圆角和 300ms 显示延时。
- 不要为悬停提示直接使用 `el-tooltip` 或原生 `title`。`title` 仅可用于对话框、页面、iframe 等非悬停提示的业务标题。
- 截断文本必须使用 `AppTooltip` 的 `only-when-overflow` 属性：文本未发生截断时禁止显示提示；图标按钮等操作说明不使用该属性，始终展示提示。
