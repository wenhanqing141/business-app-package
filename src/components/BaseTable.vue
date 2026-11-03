<template>
  <el-table
    ref="tableRef"
    v-bind="$attrs"
    class="app-data-table"
    :scrollbar-always-on="scrollbarAlwaysOn"
  >
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps || {}" />
    </template>
  </el-table>
</template>

<script setup>
import { ref } from 'vue'
import { ElTable } from 'element-plus'

defineOptions({ inheritAttrs: false })
defineProps({
  scrollbarAlwaysOn: { type: Boolean, default: true }
})

// 原生属性、事件和插槽直接交给 ElTable，统一视觉由全局样式维护。
const tableRef = ref()

defineExpose({
  tableRef,
  clearSelection: (...args) => tableRef.value?.clearSelection(...args),
  getSelectionRows: (...args) => tableRef.value?.getSelectionRows(...args),
  toggleRowSelection: (...args) => tableRef.value?.toggleRowSelection(...args),
  toggleAllSelection: (...args) => tableRef.value?.toggleAllSelection(...args),
  toggleRowExpansion: (...args) => tableRef.value?.toggleRowExpansion(...args),
  setCurrentRow: (...args) => tableRef.value?.setCurrentRow(...args),
  clearSort: (...args) => tableRef.value?.clearSort(...args),
  clearFilter: (...args) => tableRef.value?.clearFilter(...args),
  doLayout: (...args) => tableRef.value?.doLayout(...args),
  sort: (...args) => tableRef.value?.sort(...args),
  scrollTo: (...args) => tableRef.value?.scrollTo(...args),
  setScrollLeft: (...args) => tableRef.value?.setScrollLeft(...args),
  setScrollTop: (...args) => tableRef.value?.setScrollTop(...args),
  updateKeyChildren: (...args) => tableRef.value?.updateKeyChildren(...args)
})
</script>
