<template>
  <!--
    搭建页功能预览区 · 右上角「关联权限组」下拉（2026-10-11，PRD v2.7 模块四/六）
    仅表单 / 审批的**后台形态**出现；选择后**自动保存**（无需再点按钮），
    原「关联权限组」按钮与表单名后的「权限组：xx」标签一并去掉。
  -->
  <el-select
    :model-value="modelValue"
    class="perm-group-select"
    placeholder="选择权限组"
    size="small"
    fit-input-width
    @change="(v) => $emit('change', v)"
  >
    <el-option v-for="n in PERM_GROUP_NAMES" :key="n" :label="n" :value="n" />
  </el-select>
</template>

<script setup>
import { PERM_GROUP_NAMES } from '@/mock/pkgSeed'

defineProps({
  modelValue: { type: String, default: '' }
})
defineEmits(['change'])
</script>

<style scoped>
.perm-group-select {
  width: 156px;
}
</style>
