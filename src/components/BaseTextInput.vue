<template>
  <el-input
    v-bind="$attrs"
    class="base-text-input"
    :model-value="modelValue"
    :type="type"
    :rows="rows"
    :maxlength="maxlength"
    :show-word-limit="showWordLimit"
    :readonly="readonly"
    :disabled="disabled"
    @update:model-value="emit('update:modelValue', $event)"
  />
</template>

<script setup>
defineOptions({ inheritAttrs: false })

defineProps({
  modelValue: { type: [String, Number], default: '' },
  type: { type: String, default: 'text' },
  rows: { type: Number, default: undefined },
  maxlength: { type: [String, Number], default: undefined },
  showWordLimit: Boolean,
  readonly: Boolean,
  disabled: Boolean
})

const emit = defineEmits(['update:modelValue'])
</script>
