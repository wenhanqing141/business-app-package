<template>
  <div class="app-preview" :class="{ 'is-nested-only': nestedOnly }">
    <el-card v-if="nestedOnly" class="nested-region-panel" shadow="never">
      <div class="nested-region-content" role="status" aria-label="嵌套区域">
        <h2>嵌套区域</h2>
      </div>
    </el-card>

    <!-- 未选中应用：功能预览区引导 -->
    <div v-else-if="!app" class="preview-empty">
      <AppIcon class="pe-icon" name="应用" :size="16" />
      <div class="pe-title">功能预览区</div>
      <div class="pe-desc">在左侧分组菜单中选择应用，此处实时预览应用前台 / 后台形态</div>
      <div class="pe-tips">
        <p>· 表单支持「切换为前台 / 后台」：前台为填写页，后台为数据管理页</p>
        <p>· 审批助手汇聚本包内「我发起的 / 待审批 / 已审批」</p>
        <p>· 仪表盘、报表、报告、信息查询为六类引擎应用</p>
      </div>
    </div>

    <!-- 表单：按前台 / 后台两种形态渲染（线框 2 / 线框 3） -->
    <FormFrontView
      v-else-if="app.engine === 'form' && app.viewMode !== 'back'"
      :key="app.id"
      :app="app"
    />
    <!-- 表单后台：右上角权限组下拉的变更冒泡给搭建页自动保存 -->
    <FormBackendView
      v-else-if="app.engine === 'form'"
      :key="app.id"
      :app="app"
      @perm-group-change="$emit('perm-group-change', $event)"
    />

    <!-- 审批助手 -->
    <ApprovalHelperView v-else-if="app.engine === 'approval-helper'" :key="app.id" />

    <!-- 其余引擎通用预览 -->
    <div v-else class="generic-view" :class="`engine-${app.engine}`">
      <div class="gv-head">
        <el-icon :size="18" :color="meta.color"><component :is="meta.icon" /></el-icon>
        <span class="gv-name">{{ app.name }}</span>
        <el-tag size="small" :type="app.status === 'published' ? 'success' : 'info'">
          {{ app.status === 'published' ? '已发布' : '草稿' }}
        </el-tag>
        <el-tag v-if="app.viewMode === 'back'" size="small" type="warning" effect="plain"
          >应用后台</el-tag
        >
        <el-tag v-else size="small" type="primary" effect="plain">前台</el-tag>
        <!-- 审批（及表单外的其他可转后台引擎）后台形态：右上角权限组下拉，选择后自动保存 -->
        <PermGroupSelect
          v-if="app.viewMode === 'back' && PERM_GROUP_REQUIRED.includes(app.engine)"
          :model-value="app.permGroupName"
          @change="(v) => $emit('perm-group-change', v)"
        />
      </div>
      <div class="gv-body">
        <!-- 审批 -->
        <template v-if="app.engine === 'approval'">
          <el-steps :active="2" align-center class="gv-steps">
            <el-step title="发起申请" description="张莉 · 提交" />
            <el-step title="后勤管理员审批" description="审批中" />
            <el-step title="维修工程师处理" />
            <el-step title="完成归档" />
          </el-steps>
          <el-descriptions :column="2" border class="gv-desc">
            <el-descriptions-item label="申请标题"
              >3 号教学楼暖气管道维修费用报销</el-descriptions-item
            >
            <el-descriptions-item label="金额">¥3,200</el-descriptions-item>
            <el-descriptions-item label="发起人">王建国</el-descriptions-item>
            <el-descriptions-item label="发起时间">2026-09-14 09:20</el-descriptions-item>
          </el-descriptions>
        </template>

        <!-- 仪表盘（CSS 演示图） -->
        <template v-else-if="app.engine === 'chart'">
          <div class="chart-demo">
            <div class="chart-card">
              <div class="cc-num">328</div>
              <div class="cc-label">本月报修单量</div>
            </div>
            <div class="chart-card">
              <div class="cc-num">96.3%</div>
              <div class="cc-label">按时完成率</div>
            </div>
            <div class="chart-bars">
              <div v-for="(h, i) in bars" :key="i" class="bar-col">
                <div class="bar" :style="{ height: h + '%' }" />
                <span>{{ i + 1 }}月</span>
              </div>
            </div>
          </div>
        </template>

        <!-- 报表 -->
        <template v-else-if="app.engine === 'report'">
          <el-table :data="reportRows" border size="small">
            <el-table-column prop="dept" label="部门" />
            <el-table-column prop="water" label="水费（元）" align="right" />
            <el-table-column prop="elec" label="电费（元）" align="right" />
            <el-table-column prop="total" label="合计（元）" align="right" />
          </el-table>
        </template>

        <!-- 报告 -->
        <template v-else-if="app.engine === 'paper'">
          <div class="paper-demo">
            <h3>学期后勤工作报告</h3>
            <p>一、总体情况：本学期共受理报修 328 单，按时完成率 96.3%。</p>
            <p>二、费用情况：维修费用合计 ¥128,600，预算执行率 82%。</p>
            <p>三、下阶段计划：推进宿舍照明 LED 改造与食堂设备例行检修。</p>
          </div>
        </template>

        <!-- 信息查询 -->
        <template v-else-if="app.engine === 'query'">
          <el-form :inline="true" size="small">
            <el-form-item label="报修单号"><el-input placeholder="请输入单号" /></el-form-item>
            <el-form-item label="状态">
              <el-select placeholder="全部" style="width: 110px" fit-input-width>
                <el-option label="处理中" value="1" /><el-option label="已完成" value="2" />
              </el-select>
            </el-form-item>
            <el-form-item><el-button type="primary">查询</el-button></el-form-item>
          </el-form>
          <el-table :data="queryRows" border size="small">
            <el-table-column prop="no" label="单号" width="120" />
            <el-table-column prop="name" label="报修事项" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag size="small" :type="row.status === '已完成' ? 'success' : 'warning'">{{
                  row.status
                }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </template>
      </div>
      <div class="gv-foot">{{ meta.desc }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ENGINE_MAP, PERM_GROUP_REQUIRED } from '@/mock/pkgSeed'
import FormFrontView from './FormFrontView.vue'
import FormBackendView from './FormBackendView.vue'
import ApprovalHelperView from './ApprovalHelperView.vue'
import PermGroupSelect from './PermGroupSelect.vue'
import AppIcon from '@/components/icons/AppIcon.vue'

const props = defineProps({
  app: { type: Object, default: null },
  // 搭建页的预览区是嵌套画布；门户首页仍保留应用预览。
  nestedOnly: { type: Boolean, default: false }
})
// 预览区内切换关联权限组 → 冒泡给搭建页（选择后自动保存，2026-10-11）
defineEmits(['perm-group-change'])

const meta = computed(
  () => ENGINE_MAP[props.app?.engine] || { label: '应用', icon: 'Menu', color: '#57585E', desc: '' }
)

const bars = [46, 62, 38, 74, 58, 88, 70, 95, 64]
const reportRows = [
  { dept: '教学楼群', water: 12800, elec: 46200, total: 59000 },
  { dept: '学生宿舍', water: 31600, elec: 28900, total: 60500 },
  { dept: '食堂', water: 9800, elec: 21300, total: 31100 }
]
const queryRows = [
  { no: 'BX-20260901', name: '3 号教学楼暖气管道维修', status: '已完成' },
  { no: 'BX-20260912', name: '宿舍 5 栋照明线路更换', status: '处理中' }
]
</script>

<style scoped>
.app-preview {
  height: 100%;
  min-height: 0;
}
.is-nested-only {
  background: #fff;
}
.nested-region-panel {
  height: 100%;
  border: 0;
  border-radius: 0;
  background: #fff;
}
.nested-region-panel :deep(.el-card__body) {
  height: 100%;
  box-sizing: border-box;
  padding: 0;
  background: #fff;
}
.nested-region-content {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: #fff;
}
.nested-region-content h2 {
  margin: 0;
  color: var(--text-2, #3f3f46);
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
  letter-spacing: 0;
  white-space: nowrap;
}
.preview-empty {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #57585e;
  background: #fff;
}
.pe-icon {
  font-size: 52px;
  color: #c5c6c9;
}
.pe-title {
  font-size: 17px;
  font-weight: 600;
  color: #57585e;
  margin: 14px 0 6px;
}
.pe-desc {
  font-size: 13px;
}
.pe-tips {
  margin-top: 14px;
  font-size: 12px;
  color: #a6a8ae;
  line-height: 1.9;
}
.pe-tips p {
  margin: 0;
}

.generic-view {
  height: 100%;
  background: #fff;
  display: flex;
  flex-direction: column;
  padding: 16px 18px;
  box-sizing: border-box;
  overflow: auto;
}
.gv-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eaeaeb;
}
.gv-name {
  font-size: 15px;
  font-weight: 600;
}
.gv-body {
  flex: 1;
  padding: 18px 4px;
}
.gv-foot {
  font-size: 12px;
  color: #c5c6c9;
  border-top: 1px solid #f3f4f5;
  padding-top: 10px;
}
.gv-steps {
  margin-bottom: 22px;
}
.gv-note {
  font-size: 12px;
  color: #a6a8ae;
}

.chart-demo {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}
.chart-card {
  width: 150px;
  border: 1px solid #eaeaeb;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
}
.cc-num {
  font-size: 26px;
  font-weight: 700;
  color: #0047ff;
}
.cc-label {
  font-size: 12px;
  color: #57585e;
  margin-top: 4px;
}
.chart-bars {
  flex: 1;
  min-width: 320px;
  height: 200px;
  display: flex;
  align-items: flex-end;
  gap: 14px;
  padding: 12px 8px 0;
  border: 1px solid #eaeaeb;
  border-radius: 8px;
}
.bar-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #57585e;
}
.bar {
  width: 60%;
  background: var(--brand-1);
  border-radius: 4px 4px 0 0;
}
.paper-demo h3 {
  text-align: center;
}
.paper-demo p {
  line-height: 2;
  color: #2f3137;
  font-size: 13px;
}
</style>
