<template>
  <el-dialog
    v-bind="$attrs"
    :model-value="modelValue"
    :title="title"
    :width="width"
    class="app-dialog"
    :class="{ 'app-dialog--with-description': !!description }"
    align-center
    append-to-body
    destroy-on-close
    :close-on-click-modal="false"
    :close-on-press-escape="!submitting"
    :show-close="!submitting"
    :before-close="beforeClose"
    :aria-busy="submitting"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <el-scrollbar class="app-dialog-scrollbar" always>
      <p v-if="description" class="app-dialog-description">{{ description }}</p>
      <slot :submit="handleSubmit" :submitting="submitting" />
      <el-alert
        v-if="errorMessage"
        class="app-dialog-error"
        :title="errorMessage"
        type="error"
        :closable="false"
        show-icon
        role="alert"
      />
    </el-scrollbar>
    <template #footer>
      <div class="app-dialog-actions">
        <el-button :disabled="submitting" @click="emit('update:modelValue', false)">取消</el-button>
        <el-button
          :type="danger ? 'danger' : 'primary'"
          :disabled="confirmDisabled"
          :loading="submitting"
          @click="handleSubmit"
          >{{ confirmText }}</el-button
        >
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'

defineOptions({ inheritAttrs: false })
const props = defineProps({
  modelValue: Boolean,
  title: { type: String, required: true },
  description: { type: String, default: '' },
  width: { type: String, default: '480px' },
  confirmText: { type: String, default: '保存' },
  confirmDisabled: Boolean,
  danger: Boolean,
  submit: { type: Function, required: true }
})
const emit = defineEmits(['update:modelValue'])
const submitting = ref(false)
const errorMessage = ref('')

watch(
  () => props.modelValue,
  (open) => {
    if (open) errorMessage.value = ''
  }
)

function beforeClose(done) {
  if (!submitting.value) done()
}

async function handleSubmit() {
  if (submitting.value || props.confirmDisabled) return
  submitting.value = true
  errorMessage.value = ''
  try {
    const result = await props.submit()
    if (result !== false) emit('update:modelValue', false)
  } catch (error) {
    errorMessage.value = error?.message || '操作失败，请稍后重试'
  } finally {
    submitting.value = false
  }
}
</script>
