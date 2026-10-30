<template>
  <component
    :is="iconComponent"
    v-if="iconComponent"
    class="app-icon"
    :size="size"
    aria-hidden="true"
  />
</template>

<script setup>
import { computed } from 'vue'
import {
  RiAddLine,
  RiAppsLine,
  RiArrowDownSLine,
  RiArrowLeftLine,
  RiArrowLeftRightLine,
  RiArrowRightSLine,
  RiBarcodeLine,
  RiDatabase2Line,
  RiDeleteBinLine,
  RiDownload2Line,
  RiEditLine,
  RiFileCopyLine,
  RiFileExcelLine,
  RiFileList3Fill,
  RiFileList3Line,
  RiFileSearchLine,
  RiFileTextLine,
  RiFolderLine,
  RiHomeLine,
  RiImageLine,
  RiIndeterminateCircleLine,
  RiInformationLine,
  RiLayoutGridLine,
  RiLinkM,
  RiLoginBoxLine,
  RiLogoutBoxRLine,
  RiMore2Line,
  RiNodeTree,
  RiPriceTag3Line,
  RiRobot2Line,
  RiSearchLine,
  RiSettings3Line,
  RiShieldUserLine,
  RiSortAsc,
  RiSparkling2Line,
  RiTable2,
  RiTableLine,
  RiPieChartFill,
  RiPieChartLine,
  RiWrenchFill
} from '@remixicon/vue'
import ApprovalStampIcon from './ApprovalStampIcon.vue'

/**
 * 项目图标兼容层：业务名称映射到 Remix Icon。
 * 用法：<AppIcon name="分组" />，尺寸用 size 或外层 font-size + size="1em" 控制，颜色继承 currentColor。
 */
const props = defineProps({
  name: { type: String, required: true },
  // 默认 1em，跟随所在元素字号；也可传 16 / '16px'
  size: { type: [String, Number], default: '1em' }
})

const ICON_MAP = {
  '应用关联图谱': RiNodeTree,
  添加: RiAddLine,
  左: RiArrowLeftLine,
  更多: RiMore2Line,
  分组: RiFolderLine,
  表单: RiFileList3Line,
  维修: RiWrenchFill,
  文件列表: RiFileList3Fill,
  饼图: RiPieChartFill,
  审批: ApprovalStampIcon,
  仪表盘: RiPieChartLine,
  信息查询: RiFileSearchLine,
  报表: RiFileExcelLine,
  报告: RiFileTextLine,
  url: RiLinkM,
  应用: RiAppsLine,
  权限设置: RiShieldUserLine,
  业务表: RiTableLine,
  聚合表: RiTable2,
  数据工厂: RiDatabase2Line,
  业务维护AI助手: RiRobot2Line,
  编辑: RiEditLine,
  进入前台: RiLoginBoxLine,
  删除: RiDeleteBinLine,
  设置: RiSettings3Line,
  下拉箭头: RiArrowDownSLine,
  切换单位: RiArrowLeftRightLine,
  退出登录: RiLogoutBoxRLine,
  应用名称: RiPriceTag3Line,
  复制: RiFileCopyLine,
  首页: RiHomeLine,
  图标: RiImageLine,
  ID: RiBarcodeLine,
  下载: RiDownload2Line,
  info: RiInformationLine,
  移除: RiIndeterminateCircleLine,
  搜索: RiSearchLine,
  展开箭头: RiArrowRightSLine,
  排序: RiSortAsc,
  退出排序: RiLogoutBoxRLine,
  应用后台: RiLayoutGridLine,
  AI: RiSparkling2Line
}

const iconComponent = computed(() => ICON_MAP[props.name] || null)
</script>

<style scoped>
.app-icon {
  display: inline-block;
  vertical-align: -0.15em;
  flex-shrink: 0;
}
</style>
