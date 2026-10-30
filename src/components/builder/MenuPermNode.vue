<template>
  <div class="mpn-node">
    <!-- 分组：全选 / 半选复选框 -->
    <template v-if="node.kind === 'group'">
      <el-checkbox
        :model-value="allChecked"
        :indeterminate="!allChecked && someChecked"
        @change="toggleGroup"
      >
        <AppIcon class="mpn-folder" name="分组" :size="16" />
        <span class="mpn-label">{{ groupName }}</span>
      </el-checkbox>
      <div class="mpn-children">
        <MenuPermNode
          v-for="c in node.children"
          :key="c.key"
          :node="c"
          :state="state"
          @change="emitChange"
        />
      </div>
    </template>

    <!-- 应用：单独勾选 -->
    <el-checkbox v-else v-model="state[node.id]" class="mpn-app" @change="emitChange">
      <EngineIcon class="mpn-engine" :engine="node.engine" />
      <span class="mpn-label">{{ appName }}</span>
    </el-checkbox>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ENGINE_MAP } from '@/mock/pkgSeed'
import EngineIcon from '@/components/icons/EngineIcon.vue'

const props = defineProps({
  node: { type: Object, required: true },
  // 勾选态：{ [appId]: boolean }（由父页面按角色持有，保证所有应用键已初始化）
  state: { type: Object, required: true }
})
const emit = defineEmits(['change'])

function engineColor(engine) {
  return ENGINE_MAP[engine]?.color || '#57585E'
}
function engineIcon(engine) {
  return ENGINE_MAP[engine]?.icon || 'Menu'
}

const groupName = computed(() => props.node.name)
const appName = computed(() => props.node.name)

// 该分组（含所有子分组）下的全部应用 id
const descendantIds = computed(() => {
  const ids = []
  const walk = (n) => {
    if (n.kind === 'app') ids.push(n.id)
    else n.children.forEach(walk)
  }
  props.node.children.forEach(walk)
  return ids
})
const allChecked = computed(
  () => descendantIds.value.length > 0 && descendantIds.value.every((id) => props.state[id])
)
const someChecked = computed(() => descendantIds.value.some((id) => props.state[id]))

function toggleGroup(checked) {
  descendantIds.value.forEach((id) => {
    props.state[id] = checked
  })
  emitChange()
}
function emitChange() {
  emit('change')
}
</script>

<style scoped>
/* 行高 32px（设计稿页面 3） */
.mpn-node {
  display: block;
}
.mpn-node :deep(.el-checkbox) {
  display: flex;
  align-items: center;
  height: 32px;
  margin-right: 0;
}
.mpn-node :deep(.el-checkbox__input) {
  flex-shrink: 0;
}
/* 分组行文字：主文字色 */
.mpn-node :deep(.el-checkbox__label) {
  display: inline-flex;
  align-items: center;
  font-size: 14px;
  color: var(--text-1);
  overflow: hidden;
}
/* 子项（应用）行文字：灰阶（设计稿），图标仍保留各引擎原色 */
.mpn-node :deep(.mpn-app .el-checkbox__label) {
  color: var(--text-2);
}
/* 勾选后文字转品牌蓝 */
.mpn-node :deep(.el-checkbox.is-checked .el-checkbox__label) {
  color: var(--brand-1);
}
.mpn-children {
  display: block;
}
.mpn-folder {
  color: var(--text-2);
  margin-right: 6px;
  font-size: 16px;
}
.mpn-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mpn-engine {
  font-size: 15px;
  margin-right: 6px;
}
/* 应用行相对分组行缩进 24px */
.mpn-app {
  display: flex;
  padding-left: 24px;
}
</style>
