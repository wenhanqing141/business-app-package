<template>
  <el-select
    ref="selectRef"
    v-bind="$attrs"
    class="base-select"
    :model-value="modelValue"
    :popper-class="['base-select-popper', popperClass].filter(Boolean).join(' ')"
    fit-input-width
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps || {}" />
    </template>
  </el-select>
</template>

<script setup>
import { ref } from 'vue'

defineOptions({ inheritAttrs: false })

defineProps({
  modelValue: { type: [String, Number, Boolean, Object, Array], default: undefined },
  popperClass: { type: String, default: '' }
})

// 保留 Element Plus 的属性、事件和插槽能力，统一浮层及滚动条行为。
const emit = defineEmits(['update:modelValue'])
const selectRef = ref()

defineExpose({
  focus: () => selectRef.value?.focus(),
  blur: () => selectRef.value?.blur()
})
</script>
