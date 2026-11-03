<template>
  <div ref="hostRef" class="app-textarea-scrollbar">
    <slot />
    <el-scrollbar
      ref="scrollbarRef"
      class="app-textarea-scrollbar__control"
      :view-style="{ height: `${contentHeight}px` }"
      :tabindex="-1"
      aria-hidden="true"
      always
      @scroll="onScrollbarScroll"
    />
  </div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

const hostRef = ref(null)
const scrollbarRef = ref(null)
const contentHeight = ref(0)
let textarea = null
let resizeObserver = null

// 原生文本域负责选区、输入法和光标自动滚动；Element Scrollbar 同步其滚动范围。
async function updateScrollbar() {
  await nextTick()
  if (!textarea) return
  contentHeight.value = textarea.scrollHeight
  await nextTick()
  if (!textarea) return
  scrollbarRef.value?.update()
  onTextareaScroll()
}

function onTextareaScroll() {
  if (!textarea) return
  const wrap = scrollbarRef.value?.wrapRef
  if (wrap && Math.abs(wrap.scrollTop - textarea.scrollTop) > 0.5) {
    scrollbarRef.value.setScrollTop(textarea.scrollTop)
  }
}

function onScrollbarScroll({ scrollTop }) {
  if (textarea && Math.abs(textarea.scrollTop - scrollTop) > 0.5) {
    textarea.scrollTop = scrollTop
  }
}

onMounted(() => {
  textarea = hostRef.value?.querySelector('textarea')
  if (!textarea) return
  textarea.addEventListener('input', updateScrollbar)
  textarea.addEventListener('scroll', onTextareaScroll, { passive: true })
  resizeObserver = new ResizeObserver(updateScrollbar)
  resizeObserver.observe(textarea)
  updateScrollbar()
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  textarea?.removeEventListener('input', updateScrollbar)
  textarea?.removeEventListener('scroll', onTextareaScroll)
  textarea = null
})
</script>

<style scoped>
.app-textarea-scrollbar {
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  min-width: 0;
}
.app-textarea-scrollbar :deep(textarea) {
  padding-inline-end: var(--spacing-lg);
}
.app-textarea-scrollbar__control {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.app-textarea-scrollbar__control :deep(.el-scrollbar__bar) {
  pointer-events: auto;
}
</style>
