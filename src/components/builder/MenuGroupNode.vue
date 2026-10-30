<template>
  <el-sub-menu
    v-if="visible"
    :index="`group:${group.id}`"
    class="group-menu"
    :class="{ 'is-root-group': level === 0 }"
    :style="{ '--group-caret-indent': builderGroupArrowIndent(level) + 'px' }"
  >
    <template #title>
      <span
      class="group-row"
      :class="{
        sorting: sortMode,
        'drop-into': sortMode && dropZone === 'into',
        // 拖拽中原地隐藏（位置交给 MenuTree 的浮起卡片）
        'is-dragging': dragCtx.type === 'group' && dragCtx.id === group.id
      }"
      :draggable="sortMode"
      @dragstart="onDragStart"
      @dragend="onDragEnd"
      @dragover="onDragOver"
      @dragleave="onRowDragLeave"
      @drop.prevent="onDrop"
    >
      <!-- 设计稿排序态：行内不放拖拽手柄，整行即拖拽区 -->
      <AppIcon class="folder" name="分组" :size="16" />
      <span class="group-name" :class="{ hit: keyword && group.name.includes(keyword) }">{{
        group.name
      }}</span>
      <!-- 分组更多：与应用行复用省略号入口，菜单保留新建 / 添加操作并提供删除。 -->
      <el-dropdown
        v-if="!sortMode && !readonly"
          ref="groupActionsDropdown"
          class="group-actions"
          trigger="contextmenu"
          placement="bottom-start"
          popper-class="builder-app-actions"
          :popper-options="groupActionsPopperOptions"
          @command="onGroupCommand"
      >
          <el-button text class="more" aria-label="更多操作" @click.stop="openGroupActions">
            <RiMore2Line :size="16" />
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="form">新建表单</el-dropdown-item>
              <el-dropdown-item command="approval">新建审批</el-dropdown-item>
              <el-dropdown-item command="chart">新建仪表盘</el-dropdown-item>
              <el-dropdown-item command="query">新建信息查询</el-dropdown-item>
              <el-dropdown-item command="report">新建报表</el-dropdown-item>
              <el-dropdown-item command="paper">新建报告</el-dropdown-item>
              <el-dropdown-item v-if="!hasHelper" command="helper">添加审批助手</el-dropdown-item>
              <el-dropdown-item divided command="rename">修改名称</el-dropdown-item>
              <el-dropdown-item command="existing">添加已有应用</el-dropdown-item>
              <el-dropdown-item command="subgroup">新建子分组</el-dropdown-item>
              <el-dropdown-item command="delete" divided class="danger-item">删除</el-dropdown-item>
            </el-dropdown-menu>
          </template>
      </el-dropdown>
      <!-- 落位指示线：设计稿为 196×2 品牌蓝横线，两端各一个 r=3、2px 描边、白填充的空心圆。
           拖入「分组内首位」时线明显更短（从该层级的文字缩进处起），与同级前 / 后插区分开 -->
      <span v-if="sortMode && dropZone === 'before'" class="drop-line dl-top" aria-hidden="true" />
      <span
        v-if="sortMode && dropZone === 'after'"
        class="drop-line dl-bottom"
        aria-hidden="true"
      />
      <span
        v-if="sortMode && dropZone === 'into-first'"
        class="drop-line dl-bottom dl-inner"
        :style="{ left: '36px' }"
        aria-hidden="true"
      />
      </span>
    </template>

    <!-- 子分组与应用：同一容器内按统一 sort 混合排序 -->
    <template v-for="node in childNodes" :key="node.kind + '-' + node.ref.id">
        <MenuGroupNode
          v-if="node.kind === 'group'"
          :group="node.ref"
          :all-groups="allGroups"
          :has-helper="hasHelper"
          :apps-map="appsMap"
          :selected-id="selectedId"
          :keyword="keyword"
          :level="level + 1"
          :sort-mode="sortMode"
          :drag-ctx="dragCtx"
          :readonly="readonly"
          @select="$emit('select', $event)"
          @plus-command="(cmd, g) => $emit('plus-command', cmd, g)"
          @group-command="(cmd, g) => $emit('group-command', cmd, g)"
          @app-command="(cmd, a) => $emit('app-command', cmd, a)"
          @drag-start="(t, id) => $emit('drag-start', t, id)"
          @drag-end="$emit('drag-end')"
          @drop-group="(gid, z) => $emit('drop-group', gid, z)"
          @drop-app="(aid, z) => $emit('drop-app', aid, z)"
        />
        <MenuAppNode
          v-else
          :app="node.ref"
          :selected="node.ref.id === selectedId"
          :indent-level="level"
          :keyword="keyword"
          :sort-mode="sortMode"
          :drag-ctx="dragCtx"
          :readonly="readonly"
          @select="$emit('select', $event)"
          @command="(cmd) => $emit('app-command', cmd, node.ref)"
          @drag-start="(t, id) => $emit('drag-start', t, id)"
          @drag-end="$emit('drag-end')"
          @drop-app="(aid, z) => $emit('drop-app', aid, z)"
        />
    </template>
    <!-- 空分组：仍是 Element 菜单项，排序态不显示。 -->
    <el-menu-item
      v-if="!childNodes.length && !sortMode"
      class="empty-hint"
      disabled
      :index="`empty:${group.id}`"
      :style="{ paddingLeft: builderAppRowPadding(level) + 'px' }"
    >
        暂无应用
    </el-menu-item>
  </el-sub-menu>
</template>

<script setup>
import { computed, ref } from 'vue'
import { RiMore2Line } from '@remixicon/vue'
import MenuAppNode from './MenuAppNode.vue'
import AppIcon from '@/components/icons/AppIcon.vue'
import { builderAppRowPadding, builderGroupArrowIndent } from '@/utils/builderMenuIndent'
// 本组件按文件名递归引用自身（MenuGroupNode）渲染子分组，SFC 编译器自动支持

const props = defineProps({
  group: { type: Object, required: true },
  allGroups: { type: Array, default: () => [] },
  // 本应用包是否已接入审批助手（已接入则加号菜单不再出现该项）
  hasHelper: { type: Boolean, default: false },
  appsMap: { type: Object, default: () => ({}) },
  selectedId: { type: String, default: '' },
  keyword: { type: String, default: '' },
  level: { type: Number, default: 0 },
  sortMode: { type: Boolean, default: false },
  dragCtx: { type: Object, default: () => ({ type: '', id: '' }) },
  readonly: { type: Boolean, default: false }
})
const emit = defineEmits([
  'select',
  'plus-command',
  'group-command',
  'app-command',
  'drag-start',
  'drag-end',
  'drop-group',
  'drop-app'
])

const expanded = ref(true)
const dropZone = ref('') // before | after | into | into-first | ''
const groupActionsDropdown = ref(null)
const groupActionsPopperOptions = {
  modifiers: [{ name: 'offset', options: { offset: [0, 4] } }]
}

// 分组标题本身由 el-sub-menu 管理点击；显式展开菜单以避免其截获下拉触发事件。
function openGroupActions() {
  groupActionsDropdown.value?.handleOpen()
}

function onGroupCommand(command) {
  if (command === 'rename' || command === 'delete') {
    emit('group-command', command, props.group)
    return
  }
  emit('plus-command', command, props.group)
}

const childGroups = computed(() =>
  props.allGroups.filter((g) => g.parentId === props.group.id).sort((a, b) => a.sort - b.sort)
)
const groupApps = computed(() => {
  const list = props.appsMap[props.group.id] || []
  const kw = props.keyword.trim()
  return kw ? list.filter((a) => a.name.includes(kw)) : list
})
// 容器节点序列：直属子分组 + 直属应用，共用 sort 序号空间
const childNodes = computed(() => {
  const gnodes = childGroups.value.map((g) => ({ kind: 'group', ref: g }))
  const anodes = groupApps.value.map((a) => ({ kind: 'app', ref: a }))
  return [...gnodes, ...anodes].sort((x, y) => x.ref.sort - y.ref.sort)
})

// 关键字下：分组自身 / 组内应用 / 子孙分组命中任一即保留
const visible = computed(() => {
  const kw = props.keyword.trim()
  if (!kw) return true
  if (props.group.name.includes(kw)) return true
  if (groupApps.value.length) return true
  return childGroups.value.some((c) => descendantVisible(c))
})

function descendantVisible(group) {
  const list = props.appsMap[group.id] || []
  const kw = props.keyword.trim()
  if (group.name.includes(kw) || list.some((a) => a.name.includes(kw))) return true
  return props.allGroups.filter((g) => g.parentId === group.id).some(descendantVisible)
}

function onDragStart(e) {
  // 原生事件一并上抛：MenuTree 要用它算浮起卡片的指针偏移并设置拖拽影像
  emit('drag-start', 'group', props.group.id, e)
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', `group:${props.group.id}`)
}
function onDragEnd() {
  dropZone.value = ''
  emit('drag-end')
}

// candidateId 是否处于 rootId 子树内（沿父链向上查找）
function isInsideSubtree(rootId, candidateId) {
  let cur = candidateId
  const guard = new Set()
  while (cur && !guard.has(cur)) {
    if (cur === rootId) return true
    guard.add(cur)
    cur = props.allGroups.find((g) => g.id === cur)?.parentId || null
  }
  return false
}

/**
 * 分组行落位：
 * - 拖入应用：上 25% 插到分组之前（与分组同父级）；中部高亮 = 置入分组（追加组尾）；
 *   下 25% 区分展开状态——展开时组内首位（下沿紧邻组内容），收起时插到分组之后（跳过整个子树）
 * - 拖入分组：上 30% 前移、下 30% 后移（与目标同级）、中部置入（成为子分组）
 */
function onDragOver(e) {
  if (!props.sortMode || !props.dragCtx.type) return
  const rect = e.currentTarget.getBoundingClientRect()
  const ratio = (e.clientY - rect.top) / rect.height

  if (props.dragCtx.type === 'app') {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (ratio < 0.25) dropZone.value = 'before'
    else if (ratio > 0.75) dropZone.value = expanded.value ? 'into-first' : 'after'
    else dropZone.value = 'into'
    return
  }

  if (props.dragCtx.id === props.group.id) return
  const zone = ratio < 0.3 ? 'before' : ratio > 0.7 ? 'after' : 'into'
  if (zone === 'into' && isInsideSubtree(props.dragCtx.id, props.group.id)) return
  if (
    (zone === 'before' || zone === 'after') &&
    props.group.parentId &&
    isInsideSubtree(props.dragCtx.id, props.group.parentId)
  ) {
    return
  }
  e.preventDefault()
  e.dataTransfer.dropEffect = 'move'
  dropZone.value = zone
}

function onDrop() {
  const zone = dropZone.value
  dropZone.value = ''
  if (zone) emit('drop-group', props.group.id, zone)
}

// 仅当指针真正离开该行时清除指示，行内移到图标 / 文字上不清除
function onRowDragLeave(e) {
  if (!e.currentTarget.contains(e.relatedTarget)) dropZone.value = ''
}
</script>

<style scoped>
.group-menu {
  --el-menu-bg-color: transparent;
  --el-menu-hover-bg-color: var(--fill-3);
  --el-menu-text-color: var(--text-1);
  --el-menu-active-color: var(--brand-1);
}
.group-menu :deep(.el-sub-menu__title) {
  position: relative;
  display: flex;
  align-items: center;
  height: var(--builder-row-height);
  line-height: var(--builder-row-height);
  margin-bottom: var(--builder-menu-row-gap);
  padding: 0 !important;
  border-radius: var(--radius-md);
  color: var(--text-1);
  width: 100%;
}
.group-menu.is-root-group > :deep(.el-sub-menu__title) {
  padding-left: 8px !important;
}
.group-menu :deep(.el-sub-menu__title:hover) {
  background: var(--fill-3);
}
.group-menu :deep(.el-sub-menu__icon-arrow) {
  position: static;
  order: -1;
  width: 14px;
  margin: 0 8px 0 var(--group-caret-indent, 0px);
  font-size: 14px;
  color: var(--icon-caret);
}
.group-menu :deep(.el-menu) {
  background: transparent;
}
.group-row {
  position: relative;
  display: flex;
  flex: 1;
  min-width: 0;
  width: 100%;
  align-items: center;
  gap: 8px;
  height: var(--builder-row-height);
  /* 树菜单统一 36px 行高与 2px 行间距。 */
  padding-right: 8px;
  border-radius: var(--radius-md);
  cursor: pointer;
  /* 设计稿：树内行文字统一 14px */
  font-size: 14px;
  color: var(--text-1);
  transition: background-color 0.12s ease;
}
.group-row.sorting {
  cursor: grab;
}
.group-row.sorting:active {
  cursor: grabbing;
}
/* 拖拽中：原地腾空，视觉位置由 MenuTree 的浮起卡片承担 */
.group-row.is-dragging {
  opacity: 0;
}
/* 落位指示线：设计稿为 196×2 品牌蓝横线 + 两端空心圆（r=3、2px 描边、白填充），
   整体占 x 17..223（行宽 208 左右各内收 1），落在行间空隙中央
   （into-first 复用语义：展开态下沿线 = 组内首位） */
.drop-line {
  position: absolute;
  left: 1px;
  right: 1px;
  height: 6px;
  pointer-events: none;
  background: linear-gradient(var(--brand-1), var(--brand-1)) center / calc(100% - 12px) 2px
    no-repeat;
}
.drop-line::before,
.drop-line::after {
  content: '';
  position: absolute;
  top: 0;
  width: 6px;
  height: 6px;
  box-sizing: border-box;
  border: 2px solid var(--brand-1);
  border-radius: 50%;
  background: var(--fill-1);
}
.drop-line::before {
  left: 0;
}
.drop-line::after {
  right: 0;
}
.dl-top {
  top: -7px;
}
.dl-bottom {
  bottom: -7px;
}
.group-row.drop-into {
  background: var(--brand-7);
  outline: 1px dashed var(--brand-1);
  outline-offset: -1px;
}
/* 设计稿：分组图标为深色描边（非橙色） */
.folder {
  width: 16px;
  height: 16px;
  color: var(--text-1);
  font-size: 16px;
  flex-shrink: 0;
}
.group-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hit {
  color: var(--brand-1);
}
.group-actions {
  width: 0;
  height: 26px;
  margin-left: auto;
  overflow: visible;
  flex-shrink: 0;
  pointer-events: none;
}
.group-row:hover .group-actions {
  width: 26px;
  pointer-events: auto;
}
.more {
  width: 26px;
  height: 26px;
  margin-left: auto;
  padding: 0;
  opacity: 0;
  color: var(--text-3);
  border-radius: var(--radius-sm);
  flex-shrink: 0;
  transition:
    color 0.12s ease,
    background-color 0.12s ease;
}
.group-row:hover .more {
  opacity: 1;
}
.more:hover {
  color: var(--brand-1);
  background: var(--brand-7);
}
.empty-hint.el-menu-item.is-disabled {
  font-size: 14px;
  color: var(--color-text-placeholder);
  opacity: 1;
  height: var(--builder-row-height);
  line-height: var(--builder-row-height);
  margin-bottom: var(--builder-menu-row-gap);
  border-radius: var(--radius-md);
}
</style>
