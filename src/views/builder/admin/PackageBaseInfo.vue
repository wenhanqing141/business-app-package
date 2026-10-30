<template>
  <div class="base-info ai-surface-page" v-loading="loading">
    <!-- 应用包基础信息（线框 4 / 设计稿页面 2：卡片栅格） -->
    <div class="page-title">应用包基础信息</div>

    <div class="info-grid">
      <!-- 应用名称 -->
      <div class="info-card">
        <span class="ico"><AppIcon :size="24" name="应用名称" /> </span>
        <div class="body">
          <div class="label">应用名称</div>
          <div class="value">
            <span class="txt">{{ pkg.name }}</span>
            <AppTooltip content="修改应用名称" placement="top">
              <AppIcon class="act" name="编辑" :size="16" @click="editName" />
            </AppTooltip>
          </div>
        </div>
      </div>

      <!-- 应用图标 -->
      <div class="info-card">
        <span class="ico"><AppIcon :size="24" name="图标" /> </span>
        <div class="body">
          <div class="label">应用图标</div>
          <div class="value">
            <el-icon :size="20" color="#EC3327" class="app-flag"><Flag /></el-icon>
            <AppTooltip content="下载图标" placement="top">
              <AppIcon class="act" name="下载" :size="16" @click="downloadIcon" />
            </AppTooltip>
          </div>
        </div>
      </div>

      <!-- 应用首页 -->
      <div class="info-card">
        <span class="ico"><AppIcon :size="24" name="首页" /> </span>
        <div class="body">
          <div class="label">应用首页</div>
          <div class="value">
            <span class="txt">{{
              homePageName || '未设置（默认打开第一个分组的第一个应用）'
            }}</span>
            <AppTooltip content="设置应用首页" placement="top">
              <AppIcon class="act" name="设置" :size="16" @click="openHome" />
            </AppTooltip>
          </div>
        </div>
      </div>

      <!-- 应用 URL：只读展示，不可设置——2026-10-11 起包创建后即展示固定地址（包级发布废止） -->
      <div class="info-card">
        <span class="ico"><AppIcon :size="24" name="url" /> </span>
        <div class="body">
          <div class="label">应用URL</div>
          <div class="value">
            <span class="txt mono">{{ appUrl }}</span>
          </div>
        </div>
      </div>

      <!-- 应用 ID -->
      <div class="info-card">
        <span class="ico ico-text">ID</span>
        <div class="body">
          <div class="label">应用ID</div>
          <div class="value">
            <span class="txt mono">{{ pkg.appId }}</span>
            <AppTooltip content="复制应用 ID" placement="top">
              <AppIcon class="act" name="复制" :size="16" @click="copyAppId" />
            </AppTooltip>
          </div>
        </div>
      </div>
    </div>

    <!-- 修改应用名称 -->
    <el-dialog v-model="nameDialog" title="修改应用名称" width="420px">
      <el-input v-model="form.name" maxlength="30" show-word-limit placeholder="请输入应用包名称" />
      <template #footer>
        <el-button @click="nameDialog = false">取消</el-button>
        <el-button type="primary" @click="saveName">保存</el-button>
      </template>
    </el-dialog>

    <!-- 设置应用首页 -->
    <el-dialog v-model="homeDialog" title="设置应用首页" width="460px">
      <el-select v-model="form.homePage" placeholder="选择进入应用包时默认打开的应用" class="full" fit-input-width>
        <el-option-group v-for="g in groupedApps" :key="g.id" :label="g.name">
          <el-option
            v-for="a in g.apps"
            :key="a.id"
            :label="`${a.engineLabel} · ${a.name}`"
            :value="a.id"
          />
        </el-option-group>
      </el-select>
      <template #footer>
        <el-button @click="homeDialog = false">取消</el-button>
        <el-button type="primary" @click="saveHome">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchBuilderDetail, updatePackage } from '@/api/appPackage'
import AppIcon from '@/components/icons/AppIcon.vue'
import { setPkgVersion } from '@/api/pkgVersion'

const loading = ref(false)
const pkg = ref({ name: '', appId: '', homePage: '' })
const groups = ref([])
const apps = ref([])

// 应用 URL：只读。2026-10-11 起应用包创建完成即生效，故创建后即展示固定地址
// （与业务图谱一样用演示域名占位，真实地址待与后端确认后替换）
const appUrl = computed(() =>
  pkg.value.appId ? `https://demo.example.com/app/${pkg.value.appId}` : ''
)

const homePageName = computed(() => apps.value.find((a) => a.id === pkg.value.homePage)?.name || '')
const groupedApps = computed(() =>
  groups.value
    .slice()
    .sort((a, b) => a.sort - b.sort)
    .map((g) => ({ ...g, apps: apps.value.filter((a) => a.groupId === g.id) }))
    .filter((g) => g.apps.length)
)

const nameDialog = ref(false)
const homeDialog = ref(false)
const form = reactive({ name: '', homePage: '' })

async function load() {
  loading.value = true
  try {
    const d = await fetchBuilderDetail()
    if (d.pkg?.version) setPkgVersion(d.pkg.version, d.pkg.id) // 同步持有的应用包版本（并发校验用）
    pkg.value = d.pkg
    groups.value = d.groups
    apps.value = d.apps
  } finally {
    loading.value = false
  }
}

function editName() {
  form.name = pkg.value.name
  nameDialog.value = true
}
async function saveName() {
  if (!form.name.trim()) return ElMessage.warning('名称不能为空')
  pkg.value = await updatePackage({ name: form.name })
  nameDialog.value = false
  ElMessage.success('已保存')
}

function openHome() {
  form.homePage = pkg.value.homePage || ''
  homeDialog.value = true
}
async function saveHome() {
  pkg.value = await updatePackage({ homePage: form.homePage })
  homeDialog.value = false
  ElMessage.success('已保存应用首页')
}

async function copyAppId() {
  try {
    await navigator.clipboard.writeText(pkg.value.appId)
    ElMessage.success('应用 ID 已复制')
  } catch {
    ElMessage.info(pkg.value.appId)
  }
}

function downloadIcon() {
  // 演示：无真实图标资源，仅提示
  ElMessage.info('图标下载已开始（演示）')
}

onMounted(load)
</script>

<style scoped>
.page-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-1);
  margin-bottom: 24px;
}

/* 卡片列表：一行一个卡片、行距 16px、卡片 94px 高 */
.info-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}
.info-card {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 94px;
  padding: 0 22px;
  background: var(--fill-4);
  border: 1px solid var(--border-2);
  border-radius: var(--builder-card-radius);
}
/* 左侧图标位：48×48 白底圆角块 */
.info-card .ico {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--fill-1);
  border: 1px solid var(--border-2);
  border-radius: 10px; /* 设计稿 47×47 rx=9.5 */
  color: var(--text-1);
}
.info-card .ico-text {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-1);
}
.info-card .body {
  min-width: 0;
  flex: 1;
}
.info-card .label {
  font-size: 12px;
  line-height: 20px;
  color: var(--text-3);
}
.info-card .value {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  line-height: 22px;
  color: var(--text-1);
}
.info-card .value .txt {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.info-card .app-flag {
  flex-shrink: 0;
}
.info-card .act {
  flex-shrink: 0;
  font-size: 16px;
  color: var(--text-3);
  cursor: pointer;
  transition: color 0.15s ease;
}
.info-card .act:hover {
  color: var(--brand-1);
}

.full {
  width: 100%;
}
/* 应用 ID / URL 用等宽字体，便于逐位核对 */
.info-card .value .mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}
</style>
