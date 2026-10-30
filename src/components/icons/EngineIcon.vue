<template>
  <!-- 业务语义图标优先用 AppIcon；未单独映射的引擎名回退到 Remix Icon -->
  <AppIcon v-if="design" :name="design" :size="size" :style="{ color }" />
  <component v-else :is="resolveRemixIcon(ep)" :size="size" :style="{ color }" />
</template>

<script setup>
import { computed } from 'vue'
import { ENGINE_MAP } from '@/mock/pkgSeed'
import { resolveRemixIcon } from './remixIcons'
import AppIcon from './AppIcon.vue'

/**
 * 引擎 / 应用类型图标：按 ENGINE_MAP 取设计稿图标名（design）或 Element Plus 图标名（icon）。
 * 颜色默认取引擎品牌色，可用 color 覆盖。
 */
const props = defineProps({
  engine: { type: String, default: '' },
  size: { type: [String, Number], default: '1em' },
  color: { type: String, default: '' }
})

const meta = computed(() => ENGINE_MAP[props.engine] || {})
const design = computed(() => meta.value.design || '')
const ep = computed(() => meta.value.icon || '')
const color = computed(() => props.color || meta.value.color || 'currentColor')
</script>
