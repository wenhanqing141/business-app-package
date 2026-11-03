<template>
  <div v-loading="loading" class="base-info ai-surface-page">
    <!-- 应用包基础信息（线框 4 / 设计稿页面 2：卡片栅格） -->
    <div class="page-title">应用包基础信息</div>

    <div class="info-grid">
      <!-- 应用名称 -->
      <div class="info-card">
        <span class="ico"><RiPriceTag3Fill :size="24" aria-hidden="true" /></span>
        <div class="body">
          <div class="label">应用名称</div>
          <div class="value">
            <span class="txt">{{ pkg.name }}</span>
            <AppTooltip content="修改应用名称" placement="top" :trigger-keys="[]">
              <el-button
                text
                class="info-action info-action--icon"
                aria-label="修改应用名称"
                :disabled="loading"
                @click="editName"
                ><AppIcon name="编辑" :size="16"
              /></el-button>
            </AppTooltip>
          </div>
        </div>
      </div>

      <!-- 应用图标 -->
      <div class="info-card icon-info-card">
        <span class="ico"><RiImageFill :size="24" aria-hidden="true" /></span>
        <div class="body">
          <div class="label">应用图标</div>
          <div class="value icon-value">
            <PackageIcon
              class="current-icon"
              :icon="pkg.icon"
              :size="28"
              role="img"
              aria-label="当前应用图标"
            />
            <el-upload
              class="icon-upload"
              action="#"
              accept="image/png,image/jpeg"
              :show-file-list="false"
              :disabled="loading || iconSaving"
              :before-upload="validateIcon"
              :http-request="uploadIcon"
            >
              <el-button
                class="info-action"
                text
                :loading="iconSaving"
                :disabled="loading || iconSaving"
                aria-describedby="icon-upload-help"
              >
                <RiUpload2Line v-if="!iconSaving" size="16" aria-hidden="true" />
                <span>{{ iconSaving ? '上传中' : pkg.icon?.custom ? '重新上传' : '上传图标' }}</span>
              </el-button>
            </el-upload>
            <el-divider class="icon-upload-divider" direction="vertical" aria-hidden="true" />
            <span id="icon-upload-help" class="field-help">支持上传最大 1 MB的 PNG/JPG 文件</span>
          </div>
          <p v-if="iconError" class="field-error" role="alert">{{ iconError }}</p>
        </div>
      </div>

      <!-- 应用首页 -->
      <div class="info-card">
        <span class="ico"><RiHomeSmileFill :size="24" aria-hidden="true" /></span>
        <div class="body">
          <div class="label">应用首页</div>
          <div class="value">
            <span class="txt">{{
              homePageName || '未设置（默认打开第一个分组的第一个应用）'
            }}</span>
            <AppTooltip content="设置应用首页" placement="top" :trigger-keys="[]">
              <el-button
                text
                class="info-action info-action--icon"
                aria-label="设置应用首页"
                :disabled="loading"
                @click="openHome"
                ><AppIcon name="设置" :size="16"
              /></el-button>
            </AppTooltip>
          </div>
        </div>
      </div>

      <!-- 应用 URL：只读展示，支持复制完整链接 -->
      <div class="info-card url-info-card">
        <span class="ico"><RiLinksFill :size="24" aria-hidden="true" /></span>
        <div class="body">
          <div class="label">应用URL</div>
          <div class="value url-value">
            <AppTooltip :content="appUrl" placement="top" only-when-overflow>
              <span class="txt mono app-url">{{ appUrl }}</span>
            </AppTooltip>
            <AppTooltip content="复制链接" placement="top" :trigger-keys="[]">
              <el-button
                class="info-action info-action--icon"
                text
                aria-label="复制链接"
                :disabled="loading || !appUrl"
                :loading="copyingUrl"
                @click="copyAppUrl"
              >
                <AppIcon v-if="!copyingUrl" name="复制" size="16" />
              </el-button>
            </AppTooltip>
          </div>
          <p v-if="urlCopyError" class="field-error" role="alert">{{ urlCopyError }}</p>
        </div>
      </div>

      <!-- 应用 ID -->
      <div class="info-card">
        <span class="ico"><RiIdCardFill :size="24" aria-hidden="true" /></span>
        <div class="body">
          <div class="label">应用ID</div>
          <div class="value id-value">
            <span class="txt mono">{{ pkg.appId }}</span>
            <AppTooltip content="复制应用 ID" placement="top" :trigger-keys="[]">
              <el-button
                class="info-action info-action--icon"
                text
                aria-label="复制应用 ID"
                :disabled="loading || !pkg.appId"
                @click="copyAppId"
              >
                <AppIcon name="复制" size="16" />
              </el-button>
            </AppTooltip>
          </div>
        </div>
      </div>

      <!-- 描述：回显编辑页保存的应用包描述 -->
      <div class="info-card description-info-card">
        <span class="ico"><RiFileTextFill :size="24" aria-hidden="true" /></span>
        <div class="body">
          <div class="label">描述</div>
          <div class="value">
            <AppTooltip :content="descriptionText" placement="top" only-when-overflow>
              <span class="txt description-text" :class="{ 'is-empty': !pkg.desc?.trim() }">{{
                descriptionText
              }}</span>
            </AppTooltip>
          </div>
        </div>
      </div>
    </div>

    <!-- 基础信息弹窗统一使用项目弹窗容器。 -->
    <AppDialog
      v-model="nameDialog"
      title="修改应用名称"
      description="名称用于应用包列表和页面标题，最多 30 个字符"
      :submit="saveName"
    >
      <template #default="{ submit, submitting }">
        <el-form
          ref="nameFormRef"
          :model="form"
          :rules="nameRules"
          :disabled="submitting"
          label-position="top"
          @submit.prevent="submit"
        >
          <el-form-item label="应用名称" prop="name" required>
            <el-input
              v-model="form.name"
              maxlength="30"
              show-word-limit
              placeholder="请输入应用包名称"
            />
          </el-form-item>
        </el-form>
      </template>
    </AppDialog>

    <AppDialog
      v-model="homeDialog"
      title="设置应用首页"
      description="选择进入应用包时默认打开的应用；未设置时打开第一个分组的第一个应用"
      :submit="saveHome"
      :confirm-disabled="!homePageOptions.length"
    >
      <template #default="{ submitting }">
        <el-form label-position="top" :disabled="submitting">
          <el-form-item label="默认首页">
            <BaseSelect
              v-model="form.homePage"
              placeholder="请选择应用"
              class="full"
              clearable
              :disabled="!homePageOptions.length"
              no-data-text="暂无可设置为首页的应用"
            >
              <el-option
                v-for="a in homePageOptions"
                :key="a.id"
                :label="`${a.engineLabel} · ${a.name}`"
                :value="a.id"
              />
            </BaseSelect>
          </el-form-item>
          <el-empty
            v-if="!homePageOptions.length"
            :image-size="56"
            description="暂无应用，请先在编辑页添加应用"
          />
        </el-form>
      </template>
    </AppDialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  RiFileTextFill,
  RiHomeSmileFill,
  RiIdCardFill,
  RiImageFill,
  RiLinksFill,
  RiPriceTag3Fill,
  RiUpload2Line
} from '@remixicon/vue'
import { fetchBuilderDetail, updatePackage } from '@/api/appPackage'
import AppIcon from '@/components/icons/AppIcon.vue'
import AppDialog from '@/components/AppDialog.vue'
import BaseSelect from '@/components/BaseSelect.vue'
import PackageIcon from '@/components/icons/PackageIcon.vue'
import { setPkgVersion } from '@/api/pkgVersion'

const loading = ref(false)
const iconSaving = ref(false)
const iconError = ref('')
const copyingUrl = ref(false)
const urlCopyError = ref('')
const pkg = ref({ name: '', appId: '', homePage: '', desc: '' })
const groups = ref([])
const apps = ref([])

// 应用 URL：只读。2026-10-11 起应用包创建完成即生效，故创建后即展示固定地址
// （与业务图谱一样用演示域名占位，真实地址待与后端确认后替换）
const appUrl = computed(() =>
  pkg.value.appId ? `https://demo.example.com/app/${pkg.value.appId}` : ''
)

const descriptionText = computed(() => (pkg.value.desc?.trim() ? pkg.value.desc : '未填写描述'))

const homePageName = computed(() => apps.value.find((a) => a.id === pkg.value.homePage)?.name || '')
// 沿用编辑页的分组顺序排列应用，选择列表仅展示平铺选项。
const homePageOptions = computed(() =>
  groups.value
    .slice()
    .sort((a, b) => a.sort - b.sort)
    .flatMap((g) => apps.value.filter((a) => a.groupId === g.id))
)

const nameFormRef = ref(null)
const nameRules = {
  name: [{ required: true, whitespace: true, message: '请输入应用名称', trigger: 'blur' }]
}
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
  if (!(await nameFormRef.value.validate().catch(() => false))) return false
  pkg.value = await updatePackage({ name: form.name.trim() })
  nameDialog.value = false
  ElMessage.success('已保存')
}

function openHome() {
  form.homePage = pkg.value.homePage || ''
  homeDialog.value = true
}
async function saveHome() {
  pkg.value = await updatePackage({ homePage: form.homePage || '' })
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

function reportIconError(message) {
  iconError.value = message
  ElMessage.error(message)
}

function validateIcon(file) {
  iconError.value = ''
  if (!['image/png', 'image/jpeg'].includes(file.type)) {
    reportIconError('仅支持 PNG / JPG 格式的图标')
    return false
  }
  if (!file.size || file.size > 1024 * 1024) {
    reportIconError(file.size ? '图标大小不能超过 1MB' : '请选择有效的图片文件')
    return false
  }
  return true
}

async function readIcon(file) {
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('图片读取失败，请重新选择'))
    reader.onabort = () => reject(new Error('图片读取已取消，请重新选择'))
    reader.readAsDataURL(file)
  })
  // 校验实际图片内容，避免将损坏文件保存为应用图标。
  await new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = resolve
    image.onerror = () => reject(new Error('图片无法打开，请选择有效的 PNG / JPG 图片'))
    image.src = dataUrl
  })
  return dataUrl
}

async function uploadIcon({ file }) {
  iconSaving.value = true
  iconError.value = ''
  try {
    const custom = await readIcon(file)
    pkg.value = await updatePackage({ icon: { ...pkg.value.icon, custom } })
    ElMessage.success('应用图标已更新')
  } catch (error) {
    reportIconError(error.message || '图标上传失败，请重试')
    throw error
  } finally {
    iconSaving.value = false
  }
}

async function copyAppUrl() {
  if (!appUrl.value || copyingUrl.value) return
  copyingUrl.value = true
  urlCopyError.value = ''
  try {
    await navigator.clipboard.writeText(appUrl.value)
    ElMessage.success('应用链接已复制')
  } catch {
    urlCopyError.value = '复制失败，请选中链接后手动复制'
    ElMessage.error(urlCopyError.value)
  } finally {
    copyingUrl.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.base-info {
  --base-info-line-height: calc(var(--spacing-xl) + var(--spacing-xs));
  --base-info-item-height: 80px;
}
.page-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-1);
  margin-bottom: calc(var(--spacing-xl) - var(--spacing-xs));
}

/* 卡片列表：一行一个卡片，高度 80px，间距 12px，内边距 16px */
.info-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--spacing-md);
}
.info-card {
  display: flex;
  align-items: center;
  gap: 14px;
  height: var(--base-info-item-height);
  padding: var(--spacing-lg);
  border: 1px solid var(--border-1);
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
  border: 1px solid var(--border-1);
  border-radius: 10px; /* 设计稿 47×47 rx=9.5 */
  color: var(--text-1);
}
.info-card .body {
  min-width: 0;
  flex: 1;
}
.info-card .label {
  height: var(--base-info-line-height);
  font-size: var(--font-size-md);
  line-height: var(--base-info-line-height);
  color: var(--text-3);
}
.info-card .value {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: var(--base-info-line-height);
  font-size: 14px;
  line-height: var(--base-info-line-height);
  color: var(--text-1);
}
.info-card .value .txt {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.description-text.is-empty {
  color: var(--text-3);
}
.icon-value {
  flex-wrap: wrap;
}
.current-icon {
  border-radius: var(--radius-md);
}
.icon-upload {
  display: inline-flex;
}
.info-action {
  --el-button-text-color: var(--text-1);
  --el-button-hover-text-color: var(--text-1);
  --el-button-active-text-color: var(--text-1);
  flex-shrink: 0;
  height: var(--spacing-xl);
  min-height: var(--spacing-xl);
  margin: 0;
  font-size: var(--font-size-md);
}
.info-action.is-text:not(.is-disabled):hover {
  background-color: var(--fill-2);
}
.icon-upload .info-action {
  padding-inline: var(--spacing-xs);
  font-weight: var(--font-weight-regular);
}
.info-action--icon {
  width: var(--spacing-xl);
  min-width: var(--spacing-xl);
  padding: 0;
}
.info-action :deep(> span) {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
}
.icon-upload-divider {
  flex-shrink: 0;
  height: var(--spacing-lg);
  margin: 0;
  margin-inline-start: calc(-1 * var(--spacing-xs));
  border-color: var(--border-2);
}
.field-help {
  color: var(--text-3);
  font-size: var(--font-size-md);
  line-height: var(--base-info-line-height);
}
.field-error {
  margin: var(--spacing-xs) 0 0;
  color: var(--color-danger);
  font-size: 12px;
  line-height: 20px;
}
.url-value {
  min-width: 0;
}
.app-url {
  min-width: 0;
  user-select: all;
}

.full {
  width: 100%;
}
/* 应用 ID / URL 用等宽字体，便于逐位核对 */
.info-card .value .mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}
</style>
