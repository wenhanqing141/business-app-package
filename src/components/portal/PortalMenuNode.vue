<template>
  <div>
    <div
      v-if="group"
      class="p-group"
      :style="{ paddingLeft: groupRowPadding(level) + 'px' }"
      @click="expanded = !expanded"
    >
      <!-- 展开箭头 / 分组图标 / 文字色与搭建页左栏一致（设计稿：小三角 #8FA1C7、分组图标深色） -->
      <span class="arrow" :class="{ open: expanded }">
        <AppIcon name="展开箭头" :size="10" />
      </span>
      <AppIcon class="folder" name="分组" :size="16" />
      <span class="p-name">{{ group.name }}</span>
    </div>
    <!-- 容器内容：直属子分组与直属应用在同一 sort 序列中混合渲染（group=null 为根容器，常驻展开） -->
    <div v-show="!group || expanded">
      <template v-for="node in childNodes" :key="node.kind + '-' + node.ref.id">
        <PortalMenuNode
          v-if="node.kind === 'group'"
          :group="node.ref"
          :all-groups="allGroups"
          :apps-map="appsMap"
          :selected-id="selectedId"
          :level="childGroupLevel"
          @select="$emit('select', $event)"
        />
        <div
          v-else
          class="p-app"
          :class="{ active: node.ref.id === selectedId }"
          :style="{ paddingLeft: appRowPadding(level) + 'px' }"
          @click="$emit('select', node.ref)"
        >
          <!-- 应用图标单色固定（与搭建页一致），选中只改应用名颜色 -->
          <EngineIcon class="p-app-icon" :engine="node.ref.engine" color="var(--text-1)" />
          <span class="p-name">{{ node.ref.name }}</span>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import EngineIcon from '@/components/icons/EngineIcon.vue'
import AppIcon from '@/components/icons/AppIcon.vue'
import { appRowPadding, groupRowPadding } from '@/utils/menuIndent'

const props = defineProps({
  // null 表示根容器：不渲染分组行，仅渲染根分组与未分组应用的混合序列
  group: { type: Object, default: null },
  allGroups: { type: Array, default: () => [] },
  // 以容器 id 为键（根容器用 ''），值为该容器直属应用数组
  appsMap: { type: Object, default: () => ({}) },
  selectedId: { type: String, default: '' },
  level: { type: Number, default: 0 }
})
defineEmits(['select'])

const expanded = ref(true)

// 子分组层级：根容器下即为顶级（0），分组下则 +1
const childGroupLevel = computed(() => (props.group ? props.level + 1 : props.level))

// 容器节点序列：直属子分组 + 直属应用，共用 sort 序号空间，与搭建台排序结果一致
const childNodes = computed(() => {
  const containerId = props.group ? props.group.id : ''
  const gnodes = props.group
    ? props.allGroups
        .filter((g) => g.parentId === props.group.id)
        .map((g) => ({ kind: 'group', ref: g }))
    : props.allGroups.filter((g) => !g.parentId).map((g) => ({ kind: 'group', ref: g }))
  const anodes = (props.appsMap[containerId] || []).map((a) => ({ kind: 'app', ref: a }))
  return [...gnodes, ...anodes].sort((x, y) => (x.ref.sort ?? 0) - (y.ref.sort ?? 0))
})
</script>

<style scoped>
/* 行样式与搭建页左栏分组树保持一致：行高 32px、行距 8px、14px 文字、8px 圆角 */
.p-group {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 32px;
  margin-bottom: 8px;
  padding-right: 8px;
  font-size: 14px;
  color: var(--text-1);
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: background-color 0.12s ease;
}
.p-group:hover {
  background: var(--fill-3);
}
/* 固定 11px 占位，与搭建页一致，保证分组图标 / 文字水平位置不变 */
.arrow {
  width: 11px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--icon-caret);
  transition: transform 0.15s;
}
.arrow.open {
  transform: rotate(90deg);
}
.folder {
  color: var(--text-1);
  flex-shrink: 0;
}
.p-app {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  margin-bottom: 8px;
  padding-right: 8px;
  font-size: 14px;
  color: var(--text-1);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition:
    background-color 0.12s ease,
    color 0.12s ease;
}
.p-app:hover {
  background: var(--fill-3);
}
.p-app.active {
  background: var(--brand-7);
  color: var(--brand-1);
  font-weight: 600;
}
.p-app-icon {
  flex-shrink: 0;
}
.p-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
