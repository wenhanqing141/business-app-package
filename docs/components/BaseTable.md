# BaseTable

项目通用表格，基于 Element Plus `ElTable`。AI 生成结果、菜单权限和应用权限已接入。

## 基本使用

```vue
<template>
  <BaseTable
    ref="tableRef"
    v-loading="loading"
    :data="rows"
    row-key="id"
    aria-label="应用列表"
    @selection-change="selectedRows = $event"
  >
    <el-table-column type="selection" width="48" />
    <el-table-column
      prop="name"
      label="应用"
      min-width="160"
      class-name="app-data-table__primary"
    />
    <el-table-column prop="type" label="类型" width="100" />
    <el-table-column label="操作" width="140" fixed="right">
      <template #default="{ row }">
        <el-button link type="primary" @click="openDetail(row)">查看详情</el-button>
      </template>
    </el-table-column>
    <template #empty>
      <el-empty :image-size="64" description="暂无应用" />
    </template>
  </BaseTable>
</template>

<script setup>
import { ref } from 'vue'
import BaseTable from '@/components/BaseTable.vue'

const loading = ref(false)
const rows = ref([])
const selectedRows = ref([])
const tableRef = ref()
function openDetail(row) {
  // 按当前页面业务打开详情。
  console.info(row.id)
}
</script>
```

## 统一视觉

样式唯一入口为 `src/styles/index.css` 的 `.app-data-table`，组件自动附加该类名。

- 外框、表头分隔线、行分隔线以及 `border` 模式的列分隔线都使用 `--border-1`。
- 表头与正文内边距相同：上下 `10px`，左右 `16px`。
- 浅灰表头、白色正文；14px 字号、1.5 行高；表头常规字重，主名称可用 `app-data-table__primary` 设置中等字重。
- 10px 圆角、1px 外框；去掉内部底线，普通表格的末行不重复绘制下描边。
- 内容自然换行并撑开行高；页面不另设固定行高或表头、正文颜色及内边距。
- 菜单权限和应用权限通过 `.permission-table` 统一使用 48px 表头及数据行高度，样式同样集中在 `index.css`。
- **权限表格末行下描边**：菜单权限和应用权限默认保留末行 `1px` 下描边；只有表格正文实际垂直溢出、出现垂直滚动条时才隐藏。统一依据 Element Plus 自动维护的 `.el-table--scrollable-y` 状态切换；横向溢出、外层页面滚动和 `scrollbar-always-on` 本身不作为隐藏条件。数据增减、表格尺寸变化或切换标签后应自动恢复对应状态。
- 默认 `scrollbar-always-on` 为 `true`，使用项目统一的 Element 滚动条；可传 `false` 恢复原生按需显示。

主题变量集中在该样式块：`--app-table-border-color`、`--app-table-cell-padding-block`、`--app-table-cell-padding-inline`。需要新密度或主题时统一在该入口扩展，不在页面重复覆盖。

## 保留 Element Plus 能力

- 除默认滚动条选项外，属性与事件通过 `$attrs` 直接透传，包括 `data`、`row-key`、`height`、`max-height`、`border`、`stripe`、排序、筛选、固定列及选择事件。
- 列仍使用 `el-table-column`；默认列插槽及 `empty`、`append` 等原生插槽全部透传，作用域参数保持原样。
- `ref` 提供 `clearSelection`、`getSelectionRows`、`toggleRowSelection`、`toggleAllSelection`、`toggleRowExpansion`、`setCurrentRow`、`clearSort`、`clearFilter`、`doLayout`、`sort`、`scrollTo`、`setScrollLeft`、`setScrollTop`、`updateKeyChildren`，参数和返回值遵循原生方法。
- 暴露的 `tableRef` 可访问底层 `ElTable` 实例。Vue 模板 ref 会自动解包该值。

分页、搜索、请求状态和操作权限仍由使用页面负责；不要把业务数据或接口请求放入基础表格组件。

## 填满剩余高度，正文独立滚动

工具栏放在表格外，父容器提供确定的可用高度；表格区域设置 `flex: 1` 和 `min-height: 0`，再向 BaseTable 传入原生 `height="100%"`。表头和外框保持固定，超出的数据行由 ElTable 内部的 ElScrollbar 滚动，不在整张表外另套滚动容器。

```vue
<template>
  <div class="table-panel">
    <div class="table-toolbar"><el-button type="primary">添加角色</el-button></div>
    <div class="table-region">
      <BaseTable :data="rows" height="100%" :scrollbar-tabindex="0" row-key="id">
        <el-table-column prop="name" label="使用角色" />
      </BaseTable>
    </div>
  </div>
</template>

<style scoped>
.table-panel {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}
.table-toolbar {
  flex-shrink: 0;
}
.table-region {
  flex: 1;
  min-width: 0;
  min-height: 0;
}
</style>
```

父级的 flex 高度链也须设置 `min-height: 0`；没有确定的容器高度时使用默认内容高度。`scrollbar-tabindex="0"` 让正文滚动区域支持键盘焦点及 PageUp / PageDown 滚动。

## 浏览器验收

启动开发服务后访问 `/tests/browser/base-table.html`。验收页使用真实 BaseTable 与 ElTableColumn 和本地内存数据，检查属性、选择事件、实例方法、排序、默认列的作用域插槽、空态及 append 插槽；不调用业务接口，也不加入产品导航。
