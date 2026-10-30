<template>
  <div
    class="menu-tree-wrap"
    @mousemove="onTreeMouseMove"
    @mouseleave="onTreeMouseLeave"
  >
    <el-menu
      class="menu-tree"
      :default-active="selectedId ? `app:${selectedId}` : ''"
      :default-openeds="openGroupIndexes"
      :collapse-transition="false"
    >
    <!-- 根级容器：子分组与未分组应用在同一排序序列中混合渲染（应用可排在分组前 / 后 / 之间） -->
    <template v-for="node in rootNodes" :key="node.kind + '-' + node.ref.id">
      <GroupNode
        v-if="node.kind === 'group'"
        :group="node.ref"
        :all-groups="groups"
        :has-helper="hasHelper"
        :apps-map="appsMap"
        :selected-id="selectedId"
        :keyword="keyword"
        :level="0"
        :sort-mode="sortMode"
        :drag-ctx="dragCtx"
        :readonly="readonly"
        @select="$emit('select', $event)"
        @plus-command="(cmd, grp) => $emit('plus-command', cmd, grp)"
        @group-command="(cmd, grp) => $emit('group-command', cmd, grp)"
        @app-command="(c, a) => $emit('app-command', c, a)"
        @drag-start="(t, id, e) => onDragStart(t, id, e)"
        @drag-end="onDragEnd"
        @drop-group="(gid, z) => $emit('drop-group', gid, z)"
        @drop-app="(aid, z) => $emit('drop-app', aid, z)"
      />
      <AppNode
        v-else
        :app="node.ref"
        :selected="node.ref.id === selectedId"
        :indent-level="0"
        :keyword="keyword"
        :sort-mode="sortMode"
        :drag-ctx="dragCtx"
        :readonly="readonly"
        @select="$emit('select', $event)"
        @command="(c) => $emit('app-command', c, node.ref)"
        @drag-start="(t, id) => onDragStart(t, id, $event)"
        @drag-end="onDragEnd"
        @drop-app="(aid, z) => $emit('drop-app', aid, z)"
      />
    </template>

      <el-menu-item v-if="!rootNodes.length && !sortMode" class="tree-empty" disabled index="empty">
        暂无分组与应用
      </el-menu-item>
    </el-menu>

    <!-- 搜索无结果（设计稿：64×64 插图 + 「搜索暂无结果」，整体在树区垂直 / 水平居中） -->
    <div v-if="!anyMatch" class="tree-empty-search">
      <svg class="tes-icon" viewBox="0 0 64 64" width="64" height="64" aria-hidden="true">
        <circle cx="28" cy="28" r="17" fill="none" stroke="#C5C6C9" stroke-width="3" />
        <path d="M40.5 40.5 L53 53" stroke="#C5C6C9" stroke-width="3" stroke-linecap="round" />
        <path d="M20 28 C23 24.5 27 23 32 23" fill="none" stroke="#E5EDFF" stroke-width="3" stroke-linecap="round" />
      </svg>
      <div class="tes-text">搜索暂无结果</div>
    </div>

    <!-- 排序模式：所有分组之后的落位区（应用 = 移到分组外；分组 = 置于顶级末尾）。 -->
    <div
      v-if="sortMode && anyMatch"
      class="root-drop"
      @dragover="onRootDragOver"
      @dragleave="onRootDragLeave"
      @drop.prevent="onRootDrop"
    >
      <span v-if="rootOver" class="drop-line dl-top" aria-hidden="true" />
    </div>

    <!-- 排序模式：鼠标悬浮在分组 / 应用行上时，在鼠标右侧跟随显示「按住拖拽」提示 -->
    <div v-if="hint.show" class="drag-hint" :style="{ left: hint.x + 'px', top: hint.y + 'px' }">
      <svg class="dh-hand" viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
        <path
          fill="currentColor"
          d="M6.2 2.6a.9.9 0 0 1 1.8 0v4.1h.7V1.9a.9.9 0 0 1 1.8 0v4.8h.7V2.9a.9.9 0 0 1 1.8 0v4.4h.7V4.6a.9.9 0 0 1 1.8 0v5.1a4.7 4.7 0 0 1-4.7 4.7h-.6a4.7 4.7 0 0 1-3.6-1.7L3.4 9.9a.9.9 0 0 1 1.4-1.2l1.4 1.5V2.6Z"
        />
      </svg>
      按住拖拽
    </div>

    <!-- 拖拽中：白色浮起卡片跟随指针（设计稿「搭建页-分组-排序」） -->
    <div
      v-if="ghost.show"
      class="drag-ghost"
      :style="{ left: ghost.left + 'px', top: ghost.top + 'px' }"
    >
      <AppIcon v-if="ghost.kind === 'group'" class="dg-icon" name="分组" :size="16" />
      <EngineIcon v-else class="dg-icon" :engine="ghost.engine" color="var(--text-1)" />
      <span class="dg-name">{{ ghost.name }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, reactive, ref } from 'vue'
import GroupNode from './MenuGroupNode.vue'
import AppNode from './MenuAppNode.vue'
import AppIcon from '@/components/icons/AppIcon.vue'
import EngineIcon from '@/components/icons/EngineIcon.vue'

const props = defineProps({
  groups: { type: Array, default: () => [] },
  apps: { type: Array, default: () => [] },
  selectedId: { type: String, default: '' },
  keyword: { type: String, default: '' },
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
  'drop-app',
  'drop-root'
])

const appsMap = computed(() => {
  const map = {}
  for (const a of props.apps) {
    const key = a.groupId || 'none'
    ;(map[key] = map[key] || []).push(a)
  }
  for (const k of Object.keys(map)) map[k].sort((a, b) => a.sort - b.sort)
  return map
})

// 根级容器节点序列：根分组 + 未分组应用，共用 sort 序号空间
const rootNodes = computed(() => {
  const kw = props.keyword.trim()
  const groupNodes = props.groups.filter((g) => !g.parentId).map((g) => ({ kind: 'group', ref: g }))
  const appNodes = props.apps
    .filter((a) => !a.groupId)
    .filter((a) => !kw || a.name.includes(kw))
    .map((a) => ({ kind: 'app', ref: a }))
  return [...groupNodes, ...appNodes].sort((x, y) => x.ref.sort - y.ref.sort)
})

// 关键字下是否还有任何命中：分组名 / 应用名命中任一即为 true。
// 都没有 → 整棵树由子节点自行隐藏，这里补设计稿的「搜索暂无结果」空态。
const anyMatch = computed(() => {
  const kw = props.keyword.trim()
  if (!kw) return true
  return (
    props.groups.some((g) => g.name.includes(kw)) ||
    props.apps.some((a) => a.name.includes(kw))
  )
})

// 本应用包是否已接入审批助手（已接入则加号菜单不再出现「添加审批助手」）
const hasHelper = computed(() => props.apps.some((a) => a.engine === 'approval-helper'))
const openGroupIndexes = computed(() => props.groups.map((group) => `group:${group.id}`))

// ============ 悬浮提示：跟随鼠标的「按住拖拽」（排序模式） ============
// 提示不占行内空间，鼠标落在分组 / 应用行上时在指针右侧出现
const hint = reactive({ show: false, x: 0, y: 0 })
const HINT_OFFSET_X = 12

function onTreeMouseMove(e) {
  if (!props.sortMode || ghost.show) {
    hint.show = false
    return
  }
  hint.show = !!e.target.closest?.('.group-row, .app-row')
  hint.x = e.clientX + HINT_OFFSET_X
  hint.y = e.clientY
}
function onTreeMouseLeave() {
  hint.show = false
}

// ============ 拖拽浮起卡片（设计稿「搭建页-分组-排序」） ============
// 原生 drag 快照不可控，改用 1px 透明图抑制原生影像，自绘一张跟随指针的白色卡片。
const TRANSPARENT_PX =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
const ghost = reactive({ show: false, left: 0, top: 0, offsetX: 0, offsetY: 0, kind: '', name: '', engine: '' })

function onDragStart(type, id, e) {
  const ref_ = type === 'group' ? props.groups.find((g) => g.id === id) : props.apps.find((a) => a.id === id)
  if (!ref_) return
  const rect = e?.currentTarget?.getBoundingClientRect?.()
  if (e?.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    // 用透明 1px 图顶掉浏览器默认的半透明拖拽影像
    const img = new Image()
    img.src = TRANSPARENT_PX
    e.dataTransfer.setDragImage(img, 0, 0)
  }
  ghost.kind = type
  ghost.name = ref_.name
  ghost.engine = ref_.engine || ''
  ghost.offsetX = rect && e ? e.clientX - rect.left : 0
  ghost.offsetY = rect && e ? e.clientY - rect.top : 0
  ghost.show = true
  syncGhost(e?.clientX, e?.clientY)
  window.addEventListener('dragover', onWindowDragOver)
  window.addEventListener('dragend', onDragEnd)
  window.addEventListener('drop', onDragEnd)
  emit('drag-start', type, id)
}

// 设计稿：浮起卡片比原行向右偏 11px
const GHOST_SHIFT_X = 11

function syncGhost(clientX, clientY) {
  if (clientX == null || clientY == null) return
  ghost.left = clientX - ghost.offsetX + GHOST_SHIFT_X
  ghost.top = clientY - ghost.offsetY
}

function onWindowDragOver(e) {
  syncGhost(e.clientX, e.clientY)
}

function onDragEnd() {
  ghost.show = false
  window.removeEventListener('dragover', onWindowDragOver)
  window.removeEventListener('dragend', onDragEnd)
  window.removeEventListener('drop', onDragEnd)
  emit('drag-end')
}

onBeforeUnmount(onDragEnd)

const rootOver = ref(false)
function onRootDragOver(e) {
  if (!props.sortMode || !props.dragCtx.type) return
  e.preventDefault()
  e.dataTransfer.dropEffect = 'move'
  rootOver.value = true
}
function onRootDragLeave(e) {
  if (!e.currentTarget.contains(e.relatedTarget)) rootOver.value = false
}
function onRootDrop() {
  rootOver.value = false
  emit('drop-root')
}
</script>

<style scoped>
/* 设计稿：树区左右留 16px，行宽 208px；撑满树区高度，供搜索空态整体居中 */
.menu-tree-wrap {
  position: relative;
  flex: 1;
  min-height: 0;
}
.menu-tree {
  padding: 0 16px;
  border-right: 0;
  background: transparent;
}
/* 所有分组之后的落位区：不显示提示框，靠落位线反馈 */
.root-drop {
  position: relative;
  min-height: 48px;
  margin-top: 4px;
}
.tree-empty {
  font-size: 12px;
  color: var(--text-3);
  padding: 12px 8px;
}

/* 搜索无结果（设计稿：64×64 插图 + 文案，整块在树区垂直 / 水平居中） */
.tree-empty-search {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  pointer-events: none;
}
.tes-icon {
  display: block;
}
.tes-text {
  font-size: 14px;
  color: var(--text-3);
}

/* 悬浮提示：跟随鼠标（设计稿「按住拖拽」深色小气泡） */
.drag-hint {
  position: fixed;
  z-index: 2100;
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  gap: 3px;
  height: 18px;
  padding: 0 6px;
  border-radius: var(--radius-xs);
  background: var(--text-2);
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  white-space: nowrap;
  pointer-events: none;
}
.dh-hand {
  display: block;
}

/* 拖拽浮起卡片与导航菜单保持相同行高。 */
.drag-ghost {
  position: fixed;
  z-index: 2100;
  width: 208px;
  height: var(--builder-row-height);
  padding: 0 8px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--fill-1);
  border-radius: var(--radius-md);
  box-shadow: 0 4px 16px rgba(18, 20, 26, 0.16);
  font-size: 14px;
  color: var(--text-1);
  pointer-events: none;
  white-space: nowrap;
}
.dg-icon {
  flex-shrink: 0;
  font-size: 16px;
}
.dg-name {
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 落位指示线（与 MenuGroupNode / MenuAppNode 同一套视觉）：196×2 品牌蓝横线 + 两端空心圆 */
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
  top: -3px;
}
</style>
