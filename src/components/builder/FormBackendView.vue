<template>
  <!-- 表单 · 后台数据管理页（线框 2） -->
  <div class="form-back">
    <!-- 顶部条：表单名 + 右上角「关联权限组」下拉
         2026-10-11：去掉表单名后的「权限组：xx」标签，按钮改为下拉，选择后自动保存 -->
    <div class="fb-topbar">
      <div class="fb-title">
        <AppIcon class="fb-title-icon" name="表单" :size="16" />
        <span>{{ app.name }}</span>
      </div>
      <PermGroupSelect
        :model-value="app.permGroupName"
        @change="(v) => $emit('perm-group-change', v)"
      />
    </div>

    <div class="fb-panel">
      <!-- 工具栏（按线框 2 全量按钮，两行内自动换行） -->
      <div class="fb-toolbar">
        <el-button
          v-for="b in tools"
          :key="b.label"
          size="small"
          :type="b.type || ''"
          :plain="b.plain !== false"
          @click="onTool(b.label)"
        >
          {{ b.label }}
        </el-button>
      </div>

      <!-- 查询行 -->
      <div class="fb-query">
        <el-input
          v-model="keyword"
          size="small"
          placeholder="单行输入 / 单选 / 下拉框"
          clearable
          class="q-input"
          @keyup.enter="onSearch"
        >
          <template #prefix><AppIcon name="搜索" :size="14" /></template>
        </el-input>
        <el-select v-model="qRadio" size="small" placeholder="单选" clearable class="q-select" fit-input-width>
          <el-option label="良辰好景" value="良辰好景" />
          <el-option label="此去经年" value="此去经年" />
          <el-option label="阳春白雪" value="阳春白雪" />
        </el-select>
        <el-button size="small" type="primary" @click="onSearch">查询</el-button>
        <el-button size="small" @click="resetQuery">重置</el-button>
      </div>

      <!-- 数据表 -->
      <el-table
        :data="pagedRows"
        size="small"
        border
        stripe
        class="fb-table"
        @selection-change="onSelectionChange"
      >
        <el-table-column type="selection" width="40" align="center" />
        <el-table-column prop="idx" label="#" width="50" align="center" />
        <el-table-column prop="text" label="单行输入" min-width="110" show-overflow-tooltip />
        <el-table-column prop="textarea" label="多行输入" min-width="130" show-overflow-tooltip />
        <el-table-column prop="num" label="数字输入" width="80" align="center" />
        <el-table-column label="滑动条" width="110" align="center">
          <template #default="{ row }">
            <el-progress :percentage="row.slider" :stroke-width="6" :show-text="false" />
          </template>
        </el-table-column>
        <el-table-column label="评分" width="110" align="center">
          <template #default="{ row }">
            <el-rate :model-value="row.rate" disabled size="small" />
          </template>
        </el-table-column>
        <el-table-column prop="radio" label="单选" min-width="90" />
        <el-table-column label="多选" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">{{ row.checks.join('、') }}</template>
        </el-table-column>
        <el-table-column prop="select" label="下拉框" min-width="90" />
        <el-table-column label="下拉复选" min-width="130" show-overflow-tooltip>
          <template #default="{ row }">{{ row.multi.join('、') }}</template>
        </el-table-column>
        <el-table-column prop="cascade" label="多级下拉" min-width="120" show-overflow-tooltip />

        <!-- 操作列（线框 2：查看 / 编辑 / 删除 / 发通知 / 打开URL / 修改字段值 / …） -->
        <el-table-column label="操作" width="270" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="onRowAction('查看', row)"
              >查看</el-button
            >
            <el-button link type="primary" size="small" @click="onRowAction('编辑', row)"
              >编辑</el-button
            >
            <el-button link type="danger" size="small" @click="onRowAction('删除', row)"
              >删除</el-button
            >
            <el-dropdown trigger="click" @command="(c) => onRowAction(c, row)">
              <el-button link type="primary" size="small">
                更多<el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="发通知">发通知</el-dropdown-item>
                  <el-dropdown-item command="打开URL">打开URL</el-dropdown-item>
                  <el-dropdown-item command="修改字段值">修改字段值</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <!-- 底部分页 + 批量操作（线框 2） -->
      <div class="fb-footer">
        <div class="batch">
          <el-checkbox v-model="selectAll" @change="onSelectAll">选中所有数据</el-checkbox>
          <el-button size="small" @click="onTool('显示记录')">显示记录</el-button>
          <el-button
            size="small"
            type="danger"
            plain
            :disabled="!selection.length"
            @click="onTool('删除记录')"
          >
            删除记录{{ selection.length ? `（${selection.length}）` : '' }}
          </el-button>
        </div>
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="filteredRows.length"
          size="small"
          layout="total, sizes, prev, pager, next, jumper"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import AppIcon from '@/components/icons/AppIcon.vue'
import PermGroupSelect from './PermGroupSelect.vue'

const props = defineProps({
  app: { type: Object, required: true }
})
// 权限组下拉变更 → 冒泡给搭建页做自动保存（2026-10-11）
defineEmits(['perm-group-change'])

// 工具栏按钮（顺序与线框 2 一致）
const tools = [
  { label: '添加' },
  { label: '导入单位用户' },
  { label: '导入' },
  { label: '导出' },
  { label: '导出打印文件' },
  { label: '导出管理' },
  { label: '删除', type: 'danger' },
  { label: '发放采集' },
  { label: '发放修正' },
  { label: '复制' },
  { label: '批量编辑' },
  { label: '未提交人员' },
  { label: '统计' },
  { label: '发通知' },
  { label: '批量上传图片' },
  { label: '数据更新' },
  { label: '通过', type: 'success' },
  { label: '不通过', type: 'warning' }
]

const RADIO_OPTS = ['良辰好景', '此去经年', '阳春白雪']
const CHECK_OPTS = ['白云苍狗', '风云变幻', '物是人非', '似水流年']
const SELECT_OPTS = ['选项一', '选项二', '选项三']
const CASCADE_OPTS = ['北京市/海淀区', '北京市/朝阳区', '上海市/浦东新区', '广州市/天河区']

// 23 条演示数据
const rows = Array.from({ length: 23 }, (_, i) => {
  const n = i + 1
  return {
    id: n,
    idx: n,
    text: `单行记录 ${n}`,
    textarea:
      n % 3 === 0
        ? '这是一段超过一行的多行输入内容，用于演示省略与悬浮查看效果。'
        : `多行内容 ${n}`,
    num: n * 7,
    slider: (n * 37) % 101,
    rate: n % 6,
    radio: RADIO_OPTS[n % 3],
    checks: [CHECK_OPTS[n % 4], CHECK_OPTS[(n + 1) % 4]],
    select: SELECT_OPTS[n % 3],
    multi: n % 2 ? [SELECT_OPTS[n % 3], SELECT_OPTS[(n + 1) % 3]] : [SELECT_OPTS[n % 3]],
    cascade: CASCADE_OPTS[n % 4]
  }
})

const keyword = ref('')
const qRadio = ref('')
const page = ref(1)
const pageSize = ref(10)
const selection = ref([])
const selectAll = ref(false)

const filteredRows = computed(() =>
  rows.filter((r) => {
    const kw = keyword.value.trim()
    const okKw = !kw || r.text.includes(kw) || r.radio.includes(kw) || r.select.includes(kw)
    const okRadio = !qRadio.value || r.radio === qRadio.value
    return okKw && okRadio
  })
)
const pagedRows = computed(() =>
  filteredRows.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value)
)

function onSearch() {
  page.value = 1
}
function resetQuery() {
  keyword.value = ''
  qRadio.value = ''
  page.value = 1
}
function onSelectionChange(val) {
  selection.value = val
}
function onSelectAll(val) {
  ElMessage.info(val ? '已选中符合查询条件的全部数据（演示）' : '已取消全选')
}

function onTool(label) {
  ElMessage.info(`「${label}」功能演示入口（Mock）`)
}

async function onRowAction(action, row) {
  if (action === '删除') {
    await ElMessageBox.confirm(`确认删除记录「${row.text}」？删除不限制。`, '删除记录', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      confirmButtonClass: 'delete-confirm-button'
    }).catch(() => {})
    ElMessage.success('已删除（演示，数据不持久化）')
    return
  }
  if (action === '打开URL') {
    ElMessage.info('将在新窗口打开该记录关联的 URL（演示）')
    return
  }
  ElMessage.info(`「${action}」记录 ${row.idx}（演示）`)
}
</script>

<style scoped>
.form-back {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f5f8ff;
  min-height: 0;
}
.fb-topbar {
  height: 46px;
  flex-shrink: 0;
  background: #fff;
  border-bottom: 1px solid #eaeaeb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
}
.fb-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #12141a;
}
.fb-title-icon {
  color: #0047ff;
}
.fb-panel {
  flex: 1;
  min-height: 0;
  margin: 12px;
  background: #fff;
  border: 1px solid #eaeaeb;
  border-radius: 6px;
  padding: 12px;
  display: flex;
  flex-direction: column;
}
.fb-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding-bottom: 10px;
  border-bottom: 1px dashed #eaeaeb;
}
.fb-query {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 10px 0;
}
.q-input {
  width: 220px;
}
.q-select {
  width: 140px;
}
.fb-table {
  flex: 1;
  min-height: 0;
}
.fb-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 10px;
  gap: 12px;
  flex-wrap: wrap;
}
.batch {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
