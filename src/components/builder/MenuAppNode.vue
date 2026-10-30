<template>
  <el-menu-item
    :index="`app:${app.id}`"
    class="app-row"
    :class="{
      selected,
      sorting: sortMode,
      // 拖拽中原地隐藏（位置交给 MenuTree 的浮起卡片）
      'is-dragging': dragCtx.type === 'app' && dragCtx.id === app.id
    }"
    :style="{ paddingLeft: builderAppRowPadding(indentLevel) + 'px' }"
    :draggable="sortMode"
    @click="onClick"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop.prevent="onDrop"
  >
    <!-- 排序态整行可拖拽；选中时图标与文字同时使用主题色。 -->
    <AppIcon
      v-if="app.menuIcon"
      class="app-icon"
      :name="app.menuIcon"
      :size="16"
      :style="{ color: selected ? 'var(--brand-1)' : 'var(--text-1)' }"
    />
    <EngineIcon
      v-else
      class="app-icon"
      :engine="app.engine"
      :color="selected ? 'var(--brand-1)' : 'var(--text-1)'"
    />
    <AppTooltip :content="app.name" placement="right" only-when-overflow>
      <span class="app-name">
        <template v-for="(seg, i) in nameSegments" :key="i">
          <span v-if="seg.hit" class="hit">{{ seg.text }}</span>
          <template v-else>{{ seg.text }}</template>
        </template>
      </span>
    </AppTooltip>
    <!-- 2026-10-11：后台形态的应用不再打「后台」标签（PRD v2.7 模块四）——
         应用行只展示图标 + 名称，不在树上特意标注前后台形态，形态仅在实际打开该应用时体现 -->

    <!-- 落位指示线：设计稿为 196×2 品牌蓝横线，两端各一个 r=3、2px 描边、白填充的空心圆 -->
    <span v-if="sortMode && dropZone === 'before'" class="drop-line dl-top" aria-hidden="true" />
    <span v-if="sortMode && dropZone === 'after'" class="drop-line dl-bottom" aria-hidden="true" />

    <!-- ••• 菜单（线框 2 / 3：编辑 / 修改名称和图标 / 切换前台后台 / 查看引用视图 / 删除；排序模式下隐藏） -->
    <el-dropdown
      v-if="!sortMode && !readonly"
      class="app-actions"
      trigger="click"
      placement="bottom-start"
      popper-class="builder-app-actions"
      :popper-options="appActionsPopperOptions"
      @command="(c) => $emit('command', c)"
    >
      <el-button text class="more" aria-label="更多操作" title="更多操作">
        <RiMore2Line :size="16" />
      </el-button>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item command="edit">编辑</el-dropdown-item>
          <el-dropdown-item command="rename">修改名称和图标</el-dropdown-item>
          <template v-if="convertible">
            <el-dropdown-item command="switch-stage">
              {{ app.viewMode === 'back' ? '切换为前台' : '切换为后台' }}
            </el-dropdown-item>
          </template>
          <el-dropdown-item command="references">查看引用视图</el-dropdown-item>
          <el-dropdown-item command="delete" divided class="danger-item">删除</el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </el-menu-item>
</template>

<script setup>
import { computed, ref } from 'vue'
import { BACKEND_CONVERTIBLE } from '@/mock/pkgSeed'
import EngineIcon from '@/components/icons/EngineIcon.vue'
import { RiMore2Line } from '@remixicon/vue'
import { builderAppRowPadding } from '@/utils/builderMenuIndent'

const props = defineProps({
  app: { type: Object, required: true },
  selected: { type: Boolean, default: false },
  // 所属「容器分组」自身的层级（顶级分组内的应用 = 0）。设计稿里应用行的文字左边缘
  // 与其所属分组行完全对齐，所以这里传容器层级、而不是容器层级 + 1。
  indentLevel: { type: Number, default: 0 },
  // 分组菜单搜索关键字：命中片段高亮（与分组行一致）
  keyword: { type: String, default: '' },
  // 排序模式：整行可拖拽，点击不再选中应用
  sortMode: { type: Boolean, default: false },
  // 当前拖拽上下文 { type, id }，由工作台持有、整树共享，用于判断是否接受放置
  dragCtx: { type: Object, default: () => ({ type: '', id: '' }) },
  readonly: { type: Boolean, default: false }
})
const emit = defineEmits(['select', 'command', 'drag-start', 'drag-end', 'drop-app'])

const convertible = computed(() => BACKEND_CONVERTIBLE.includes(props.app.engine))
const appActionsPopperOptions = {
  modifiers: [{ name: 'offset', options: { offset: [0, 4] } }]
}

// 按关键字把应用名切成「命中 / 未命中」片段，命中的加 .hit 高亮（与分组行同一套规则）
const nameSegments = computed(() => {
  const name = props.app.name || ''
  const kw = props.keyword.trim()
  if (!kw) return [{ text: name, hit: false }]
  const segs = []
  let rest = name
  while (rest) {
    const i = rest.indexOf(kw)
    if (i === -1) {
      segs.push({ text: rest, hit: false })
      break
    }
    if (i > 0) segs.push({ text: rest.slice(0, i), hit: false })
    segs.push({ text: kw, hit: true })
    rest = rest.slice(i + kw.length)
  }
  return segs
})

const dropZone = ref('') // before | after | ''

function onClick() {
  if (props.sortMode) return
  emit('select', props.app)
}

function onDragStart(e) {
  // 原生事件一并上抛：MenuTree 要用它算浮起卡片的指针偏移并设置拖拽影像
  emit('drag-start', 'app', props.app.id, e)
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', `app:${props.app.id}`)
}

function onDragEnd() {
  dropZone.value = ''
  emit('drag-end')
}

// 应用行接受应用 / 分组拖拽：上半区插入到前方，下半区插入到后方（同容器混排，可跨分组）
function onDragOver(e) {
  if (!props.sortMode || !props.dragCtx.type) return
  if (props.dragCtx.type === 'app' && props.dragCtx.id === props.app.id) return
  e.preventDefault()
  e.dataTransfer.dropEffect = 'move'
  const rect = e.currentTarget.getBoundingClientRect()
  dropZone.value = e.clientY - rect.top < rect.height / 2 ? 'before' : 'after'
}

// 仅当指针真正离开该行时清除指示，行内移到图标 / 文字上不清除
function onDragLeave(e) {
  if (!e.currentTarget.contains(e.relatedTarget)) dropZone.value = ''
}

function onDrop(e) {
  const zone = dropZone.value
  dropZone.value = ''
  if (zone) emit('drop-app', props.app.id, zone)
}
</script>

<style scoped>
.app-row {
  position: relative;
  display: flex;
  width: 100%;
  box-sizing: border-box;
  align-items: center;
  gap: 8px;
  height: var(--builder-row-height);
  padding-right: 8px;
  /* 左内边距按所属层级计算，见 builderMenuIndent.js。 */
  margin: 0 0 var(--builder-menu-row-gap);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 14px;
  color: var(--text-1);
  --el-menu-active-color: var(--brand-1);
  --el-menu-hover-bg-color: var(--fill-3);
  --el-menu-bg-color: transparent;
  transition:
    background-color 0.12s ease,
    color 0.12s ease;
}
.app-row:hover {
  background: var(--fill-3);
}
/* 设计稿：选中行底 #E5EDFF、文字 #0047FF / 600（应用图标保持不变色） */
.app-row.selected {
  background: var(--brand-7);
  color: var(--brand-1);
  font-weight: 600;
}
.app-row.selected :deep(.app-icon),
.app-row.selected :deep(.app-icon svg) {
  color: var(--brand-1) !important;
}
.app-row.sorting {
  cursor: grab;
}
.app-row.sorting:active {
  cursor: grabbing;
}
/* 拖拽中：原地腾空，视觉位置由 MenuTree 的浮起卡片承担 */
.app-row.is-dragging {
  opacity: 0;
}
/* 落位指示线：设计稿为 196×2 品牌蓝横线 + 两端空心圆（r=3、2px 描边、白填充），
   整体占 x 17..223（行宽 208 左右各内收 1），落在行间空隙中央 */
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
.app-icon {
  width: 16px;
  height: 16px;
  font-size: 16px;
  flex-shrink: 0;
}
.app-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.app-actions {
  width: 0;
  height: 26px;
  margin-left: auto;
  overflow: visible;
  flex-shrink: 0;
  pointer-events: none;
}
.app-row:hover .app-actions {
  width: 26px;
  pointer-events: auto;
}
/* 搜索命中片段：与分组行一致的品牌蓝 */
.hit {
  color: var(--brand-1);
}
.more {
  width: 26px;
  height: 26px;
  margin-left: 0;
  padding: 0;
  opacity: 0;
  color: var(--text-3);
  border-radius: var(--radius-sm);
  flex-shrink: 0;
  transition:
    color 0.12s ease,
    background-color 0.12s ease;
}
.app-row:hover .more {
  opacity: 1;
}
.more:hover {
  color: var(--brand-1);
  background: var(--brand-7);
}
/* 仅保留危险操作语义色，其余尺寸与状态使用项目默认的 Element 下拉菜单组件。 */
:global(.builder-app-actions.el-dropdown__popper[data-popper-placement^='bottom']) {
  /* Element 的默认 -8px 外边距会抵消 Popper 配置的 4px offset。 */
  margin-top: 0;
}
:global(.builder-app-actions .danger-item) {
  color: var(--danger-1);
}
</style>
