<template>
  <el-input
    v-bind="$attrs"
    class="package-search-input"
    :model-value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    clearable
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template #prefix><AppIcon name="搜索" :size="14.5" /></template>
  </el-input>
</template>

<script setup>
import AppIcon from '@/components/icons/AppIcon.vue'

defineOptions({ inheritAttrs: false })

defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '请输入' },
  disabled: Boolean
})

const emit = defineEmits(['update:modelValue'])
</script>

<style scoped>
.package-search-input :deep(.el-input__wrapper) {
  height: 36px;
  min-height: 36px;
  padding: 0 11px;
  border-radius: 10px;
  background: var(--color-bg-container);
  box-shadow: 0 0 0 1px var(--border-2) inset;
  transition:
    box-shadow var(--motion-hover),
    background-color var(--motion-hover);
}
.package-search-input :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px var(--color-border-brand) inset;
}
.package-search-input :deep(.el-input__inner) {
  font-size: var(--font-size-md);
}
.package-search-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--color-primary) inset;
}
</style>
