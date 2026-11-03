<template>
  <div class="builder-workspace">
    <slot name="header" />
    <div class="workspace-body">
      <slot name="aside" />
      <main class="workspace-main">
        <div class="workspace-panel">
          <el-scrollbar v-if="scrollContent" ref="contentScrollbar" class="workspace-scroll" always>
            <slot />
          </el-scrollbar>
          <slot v-else />
        </div>
      </main>
    </div>
    <slot name="overlays" />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

defineProps({ scrollContent: Boolean })

const route = useRoute()
const contentScrollbar = ref(null)
watch(() => route.path, () => contentScrollbar.value?.setScrollTop(0), { flush: 'post' })
</script>

<style scoped>
/* 编辑页和应用后台共用同一个框架，尺寸沿用编辑页。 */
.builder-workspace {
  display: flex;
  flex-direction: column;
  position: relative;
  width: 100%;
  height: 100vh;
  height: 100dvh;
  min-height: 0;
  overflow: hidden;
  background: var(--app-page-bg);
}
.builder-workspace :slotted(header) {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  height: var(--builder-header-height);
  min-width: 0;
  padding: 0 var(--spacing-lg);
  gap: var(--spacing-sm);
  background: transparent;
}
.workspace-body {
  display: flex;
  flex: 1;
  min-height: 0;
}
.builder-workspace :slotted(aside) {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  width: var(--builder-aside-width);
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: transparent;
  border: 0;
}
.workspace-main {
  flex: 1;
  min-width: 0;
  min-height: 0;
  padding: 0 var(--spacing-sm) var(--spacing-sm) 0;
}
.workspace-panel {
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: var(--fill-1);
  border: 1px solid var(--border-2);
  border-radius: var(--radius-xl);
}
.workspace-scroll {
  height: 100%;
  min-height: 0;
}
.workspace-scroll :deep(.el-scrollbar__view) {
  min-height: 100%;
  padding: var(--spacing-xl);
}
.workspace-scroll :deep(.el-scrollbar__view > .ai-surface-page) {
  background: transparent;
}
@media (max-width: 768px) {
  .builder-workspace :slotted(header) {
    padding-inline: var(--spacing-md);
  }
  .workspace-scroll :deep(.el-scrollbar__view) {
    padding: var(--spacing-lg);
  }
}
@media (max-width: 640px) {
  .workspace-body {
    flex-direction: column;
  }
  .builder-workspace :slotted(aside) {
    width: 100%;
    max-height: 32dvh;
  }
  .workspace-main {
    padding-left: var(--spacing-sm);
  }
}
</style>
