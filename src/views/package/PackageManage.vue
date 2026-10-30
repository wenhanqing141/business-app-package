<template>
  <div class="pm-page">
    <!-- ============ 顶栏：左上「业务应用包」/ 右上 头像 + 姓名 + 当前单位 ============ -->
    <header class="pm-header">
      <div class="pm-brand">
        <img class="pm-logo-mark" src="/figma-chaoxing-logo.png" alt="" />
        <img class="pm-logo-wordmark" src="/figma-business-package-logo.svg" alt="业务应用包" />
      </div>

      <!-- 个人信息区：悬浮展开下拉（切换单位 / 退出登录） -->
      <el-dropdown
        trigger="hover"
        placement="bottom-end"
        popper-class="pm-user-menu"
        @command="onUserCommand"
      >
        <div class="pm-user">
          <el-avatar class="avatar" :size="28">{{ user.avatar }}</el-avatar>
          <span class="name">{{ user.name }}</span>
          <AppIcon class="caret" name="下拉箭头" :size="16" />
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <div class="pm-unit-menu-header">
              <span>单位：</span>
              <AppTooltip :content="currentUnitName" placement="top" only-when-overflow>
                <span class="pm-unit-menu-name">{{ currentUnitName }}</span>
              </AppTooltip>
            </div>
            <el-dropdown-item command="switch-unit" class="pm-user-menu-item">
              <AppIcon name="切换单位" :size="16" />
              <span>切换单位</span>
            </el-dropdown-item>
            <el-dropdown-item class="is-danger pm-user-menu-item" command="logout">
              <AppIcon name="退出登录" :size="16" />
              <span>退出登录</span>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </header>

    <!-- ============ 无管理权限缺省页（当前用户不是任一单位超管） ============ -->
    <div v-if="!units.length && loaded" class="pm-empty-page">
      <AppIcon :size="56" name="权限设置" />
      <p class="t">无管理权限</p>
      <p class="d">你当前不是任何单位的业务应用包管理员，请联系单位管理员开通权限后再试。</p>
    </div>

    <div v-else class="pm-body">
      <!-- 展示区顶部：左侧按名称搜索 / 右侧「＋ 新建应用包」 -->
      <div class="pm-toolbar">
        <PackageSearchInput
          v-model="keyword"
          class="pm-search"
          placeholder="搜索应用包名称"
        />
        <el-button type="primary" @click="createDialog = true">
          <AppIcon name="添加" :size="16" />新建应用包
        </el-button>
      </div>

      <!-- 卡片列表：一行一个 -->
      <div v-loading="loading" class="pm-list">
        <div v-for="p in filtered" :key="p.id" class="pm-card">
          <PackageIcon class="pm-icon" :icon="p.icon" :size="48" />
          <div class="pm-info">
            <div class="pm-name">{{ p.name }}</div>
            <!-- 描述默认一行，超出省略 -->
            <AppTooltip :content="p.desc || '暂无描述'" placement="top" only-when-overflow>
              <div class="pm-desc">{{ p.desc || '暂无描述' }}</div>
            </AppTooltip>
          </div>
          <div class="pm-actions">
            <el-button class="pm-secondary-action" plain size="small" @click="editPkg(p)">
              <AppIcon name="编辑" :size="14" />编辑
            </el-button>
            <el-button class="pm-secondary-action" plain size="small" @click="enterFront(p)">
              <AppIcon name="进入前台" :size="14" />进入前台
            </el-button>
            <el-button class="pm-danger-action" plain size="small" @click="openDelete(p)">
              <AppIcon name="删除" :size="14" />删除
            </el-button>
          </div>
        </div>

        <div v-if="loaded && !filtered.length && keyword" class="pm-search-empty">
          <img class="pm-search-empty-image" src="/figma-no-search-results.png" alt="" />
          <div class="pm-search-empty-title">暂无搜索结果</div>
        </div>
        <el-empty
          v-else-if="loaded && !filtered.length"
          :image-size="72"
          description="该单位暂无业务应用包，点右上角「新建应用包」开始创建"
        />
      </div>
    </div>

    <!-- ============ 新建应用包：创建方式弹窗（AI 创建 / 空白创建） ============ -->
    <el-dialog
      v-model="createDialog"
      width="560px"
      append-to-body
      align-center
      title="新建应用包"
      class="pm-dialog pm-create-dialog"
    >
      <div class="dlg-body">
        <div class="method-options">
          <el-button
            class="method-option ai"
            type="default"
            plain
            native-type="button"
            aria-label="使用 AI 创建应用包"
            @click="chooseAi"
          >
            <div class="method-icon">
              <img src="/package-create-ai.png" alt="AI 创建" class="method-icon-img" />
            </div>
            <div class="method-name">AI 创建</div>
          </el-button>
          <el-button
            class="method-option blank"
            type="default"
            plain
            native-type="button"
            aria-label="空白创建应用包"
            @click="chooseBlank"
          >
            <div class="method-icon">
              <img src="/package-create-blank.png" alt="空白创建" class="method-icon-img" />
            </div>
            <div class="method-name">空白创建</div>
          </el-button>
        </div>
      </div>
    </el-dialog>

    <!-- ============ 切换单位：复用 Element Dialog，单位作为一组连续列表展示 ============ -->
    <el-dialog
      v-model="unitDialog"
      width="480px"
      append-to-body
      align-center
      title="切换单位"
      class="pm-dialog pm-unit-dialog"
    >
      <el-scrollbar class="unit-list-scroll" always>
        <div class="unit-list">
          <el-button
            v-for="u in units"
            :key="u.fid"
            text
            native-type="button"
            class="unit-item"
            :class="{ active: u.fid === currentFid }"
            @click="switchUnit(u)"
          >
            <span class="u-name">{{ u.name }}</span>
            <RiCheckboxCircleFill v-if="u.fid === currentFid" class="u-check" aria-label="当前单位" />
          </el-button>
        </div>
      </el-scrollbar>
      <template #footer>
        <div class="dlg-foot">
          <el-button class="pm-dialog-cancel" plain @click="unitDialog = false">取消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- ============ 删除应用包：需完整输入应用包名称 ============ -->
    <el-dialog
      v-model="delDialog.show"
      width="520px"
      append-to-body
      align-center
      title="删除业务应用包"
      destroy-on-close
      close-on-click-modal
      close-on-press-escape
      class="pm-dialog pm-delete-dialog"
    >
      <div class="dlg-body">
        <el-form
          class="del-body pm-delete-form"
          :model="delDialog"
          label-position="top"
        >
          <el-form-item
            :error="
              delDialog.input && delDialog.input !== delDialog.pkg.name
                ? '请输入完整的应用包名称'
                : ''
            "
          >
            <template #label>
              <span class="del-tip">
                请输入应用包名称 <code>{{ delDialog.pkg.name }}</code> 以确认删除：
              </span>
            </template>
            <el-input
              v-model="delDialog.input"
              class="pm-delete-input"
              placeholder="请输入完整的应用包名称"
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <div class="dlg-foot">
          <el-button class="pm-dialog-cancel" plain @click="delDialog.show = false">取消</el-button>
          <el-button
            class="pm-dialog-confirm"
            type="danger"
            :disabled="delDialog.input !== delDialog.pkg.name"
            @click="confirmDelete"
          >
            确认删除
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { RiCheckboxCircleFill } from '@remixicon/vue'
import AppIcon from '@/components/icons/AppIcon.vue'
import PackageIcon from '@/components/icons/PackageIcon.vue'
import PackageSearchInput from '@/components/PackageSearchInput.vue'
import { fetchManageUnits, fetchPkgList, deletePkg } from '@/api/appPackage'
import { setPkgVersion } from '@/api/pkgVersion'

const router = useRouter()

const loading = ref(false)
const loaded = ref(false)
const keyword = ref('')
const pkgs = ref([])
const units = ref([])
const user = ref({ name: '', avatar: '' })
const currentFid = ref('')

const createDialog = ref(false)
const unitDialog = ref(false)
const delDialog = reactive({ show: false, pkg: {}, input: '' })

const currentUnitName = computed(
  () => units.value.find((u) => u.fid === currentFid.value)?.name || '—'
)
const filtered = computed(() => {
  const kw = keyword.value.trim()
  return kw ? pkgs.value.filter((p) => p.name.includes(kw)) : pkgs.value
})

async function loadUnits() {
  const d = await fetchManageUnits()
  user.value = d.user
  units.value = d.units
  currentFid.value = d.current
}

async function loadPkgs() {
  loading.value = true
  try {
    pkgs.value = await fetchPkgList(currentFid.value)
    // 列表即「当前单位最新的应用包配置」，同步页面持有的版本号
    const first = pkgs.value.find((p) => p.id === 'pkg-1') || pkgs.value[0]
    if (first) setPkgVersion(first.version, first.id)
  } finally {
    loading.value = false
    loaded.value = true
  }
}

onMounted(async () => {
  await loadUnits()
  if (units.value.length) await loadPkgs()
  else loaded.value = true
})

// ---------- 顶栏个人信息下拉 ----------
function onUserCommand(cmd) {
  if (cmd === 'switch-unit') unitDialog.value = true
  else if (cmd === 'logout') logout()
}

function switchUnit(u) {
  currentFid.value = u.fid
  unitDialog.value = false
  keyword.value = ''
  ElMessage.success(`已切换到「${u.name}」`)
  loadPkgs()
}

// 退出登录 → 超星 passport 登录页（Demo 模拟；正式直接对接 passport）
function logout() {
  sessionStorage.setItem('pkg-logged-out', '1')
  router.push({ path: '/passport/login', query: { redirect: '/package/manage', loggedout: '1' } })
}

// ---------- 展示区操作 ----------
function editPkg(p) {
  setPkgVersion(p.version, p.id)
  router.push({ path: '/builder/home', query: { pkgId: p.id } })
}
function enterFront(p) {
  setPkgVersion(p.version, p.id)
  if (p.id !== 'pkg-1') {
    // 演示环境只实现了「校园后勤管理」的前台结构，其他包仅用于演示单位切换与列表
    ElMessage.info('演示环境前台固定展示「校园后勤管理」，该入口仅演示跳转')
  } else {
    ElMessage.success(`进入「${p.name}」业务应用包前台（演示）`)
  }
  router.push('/portal')
}
function chooseAi() {
  createDialog.value = false
  router.push('/builder/ai-create')
}
function chooseBlank() {
  createDialog.value = false
  // 空白创建：进入搭建页，页内弹窗补基础信息，完成后启动新手引导
  router.push({ path: '/builder/home', query: { setup: '1' } })
}

// ---------- 删除：完整输入应用包名称 ----------
function openDelete(p) {
  Object.assign(delDialog, { show: true, pkg: p, input: '' })
}

async function confirmDelete() {
  const p = delDialog.pkg
  try {
    await deletePkg(p.id, p.version)
  } catch (e) {
    // 并发校验失败（版本过低）等：request.js 已弹窗，这里不再重复提示
    if (!/版本过低/.test(e?.message || '')) ElMessage.error(e?.message || '删除失败')
    return
  }
  delDialog.show = false
  ElMessage.success(`已删除业务应用包「${p.name}」`)
  loadPkgs()
}
</script>

<style scoped>
.pm-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f8ff;
  overflow: hidden;
}
.pm-page :deep(.el-button) {
  border-radius: 10px;
}

/* 顶部菜单栏保持与页面背景融合，不额外增加面板层级。 */
.pm-header {
  flex: none;
  height: 68px;
  display: flex;
  align-items: center;
  padding: 0 24px;
  background: transparent;
  border-bottom: none;
}
.pm-brand {
  display: flex;
  align-items: center;
  gap: 8px;
}
.pm-logo-mark {
  display: block;
  width: 32px;
  height: 32px;
  flex: none;
  border-radius: 8px;
  object-fit: cover;
}
.pm-logo-wordmark {
  display: block;
  width: 97.68px;
  height: 18.24px;
  flex: none;
}
.pm-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-1);
}
/* 个人信息固定在最右：el-dropdown 才是 flex 子元素，外边距要加在它身上 */
.pm-header :deep(.el-dropdown) {
  flex: none;
  margin-left: auto;
}
.pm-user {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 40px;
  padding: 0 10px;
  border-radius: 10px;
  cursor: pointer;
  outline: none;
  transition: background var(--motion-hover);
}
.pm-user:hover {
  background: var(--color-bg-container);
}
.avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--color-primary);
  color: var(--color-text-anti);
  font-size: 16px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.name {
  font-size: 14px;
  color: var(--text-1);
}
.caret {
  font-size: 12px;
  color: var(--icon-1);
}

/* 内容区不再使用外层面板，保留内容区域的布局间距。 */
.pm-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0 24px 24px;
  background: transparent;
  border: 0;
  border-radius: 0;
}
.pm-toolbar {
  flex: none;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: var(--spacing-lg);
}
.pm-search {
  width: 280px;
}

:global(.pm-user-menu .pm-unit-menu-header) {
  display: flex;
  align-items: center;
  gap: 0;
  height: 40px;
  padding: 0 14px;
  color: var(--text-3);
  font-size: 14px;
  border-bottom: 1px solid var(--border-1);
  white-space: nowrap;
}
:global(.pm-user-menu.el-popper) {
  width: min(240px, calc(100vw - 16px));
  box-sizing: border-box;
}
:global(.pm-user-menu .el-dropdown-menu) {
  width: 100%;
  min-width: 0;
  padding: 0;
}
:global(.pm-user-menu .pm-user-menu-item) {
  display: flex;
  align-items: center;
  gap: 8px;
}
:global(.pm-user-menu .pm-user-menu-item .app-icon) {
  flex: none;
}
:global(.pm-user-menu .el-dropdown-menu__item:first-of-type) {
  margin-top: 8px;
}
:global(.pm-user-menu .pm-unit-menu-header > span:first-child) {
  flex: none;
}
:global(.pm-user-menu .pm-unit-menu-name) {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pm-toolbar :deep(.el-button) {
  margin-left: auto;
  align-items: center;
  height: 36px;
  min-height: 36px;
}
/* 图标和文字都在 el-button 的内层 span 里，间距与居中要作用到 span 上 */
.pm-toolbar :deep(.el-button > span) {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
/* 中文字形在行盒中偏上，flex 几何居中的图标视觉上偏低，上移 1px 做视觉校正 */
.pm-toolbar :deep(.el-button .app-icon) {
  transform: translateY(-1px);
}

/* 卡片列表（一行一个） */
.pm-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}
.pm-search-empty {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.pm-search-empty-image {
  display: block;
  width: 100px;
  height: 100px;
  object-fit: contain;
}
.pm-search-empty-title {
  color: var(--text-1);
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
}
.pm-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-sm);
  background: var(--color-bg-container);
  border: 1px solid var(--border-2);
  border-radius: var(--builder-card-radius, 16px);
  transition:
    border-color var(--motion-hover),
    box-shadow var(--motion-hover);
}
.pm-icon {
  flex: none;
  width: 48px;
  height: 48px;
  border-radius: 10px;
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.pm-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 10px;
}
.pm-info {
  flex: 1;
  min-width: 0;
}
.pm-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-1);
}
/* 描述默认一行，超出省略 */
.pm-desc {
  margin-top: 0;
  font-size: 12.5px;
  color: var(--text-3);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.pm-actions {
  flex: none;
  display: flex;
  align-items: center;
  gap: 8px;
}
.pm-actions :deep(.el-button) {
  height: 36px;
  min-height: 36px;
  padding: 0 12px;
  font-size: 14px;
  border-radius: 10px;
}
.pm-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}
.pm-actions :deep(.el-button > span) {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.pm-secondary-action {
  --el-button-text-color: var(--text-1);
  --el-button-bg-color: #ffffff;
  --el-button-border-color: var(--border-2);
  --el-button-hover-text-color: var(--text-1);
  --el-button-hover-bg-color: var(--fill-2);
  --el-button-hover-border-color: var(--border-4);
}
.pm-danger-action {
  --el-button-text-color: var(--text-1);
  --el-button-bg-color: #ffffff;
  --el-button-border-color: var(--border-2);
  --el-button-hover-text-color: var(--danger-1);
  --el-button-hover-bg-color: var(--danger-8);
  --el-button-hover-border-color: var(--danger-7);
}

@media (max-width: 640px) {
  .pm-card {
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 12px;
  }
  .pm-info {
    padding-top: 2px;
  }
  .pm-actions {
    width: calc(100% - 60px);
    margin-left: 60px;
  }
}

/* 无管理权限缺省页 */
.pm-empty-page {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--text-4);
}
.pm-empty-page .t {
  margin: 10px 0 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-1);
}
.pm-empty-page .d {
  margin: 0;
  font-size: 13px;
  color: var(--text-3);
}

/* 创建方式弹窗（与创建向导一致的两张卡片） */
.method-options {
  display: flex;
  gap: 16px;
  justify-content: center;
  padding: 0;
  width: 100%;
}
.method-option {
  flex: 1;
  max-width: 300px;
  min-height: 190px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin: 0;
  padding: 24px 22px 34px;
  border: 1px solid var(--border-2);
  border-radius: 14px;
  text-align: center;
  cursor: pointer;
  background: var(--fill-1);
  color: var(--text-1);
  transition:
    border-color 160ms ease,
    background-color 160ms ease;
}
:deep(.method-option > span) {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
}
.method-option:hover {
  border-color: var(--brand-1);
  background: var(--brand-8);
  box-shadow: none;
  transform: none;
}
.method-option:focus-visible {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.16);
}
.method-option.is-plain {
  --el-button-hover-text-color: var(--text-1);
  --el-button-hover-bg-color: var(--brand-8);
  --el-button-hover-border-color: var(--brand-1);
}
.method-icon {
  display: flex;
  justify-content: center;
}
.method-icon-img {
  width: 120px;
  height: 120px;
  object-fit: contain;
}
.method-name {
  font-size: 16px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--text-1);
}

/* 单位列表 */
.unit-list {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow: hidden;
  border: 1px solid var(--border-2);
  border-radius: var(--radius-md);
}
.unit-item.el-button {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 10px;
  height: 44px;
  min-height: 44px;
  padding: 0 14px;
  margin: 0;
  border: 0;
  border-bottom: 1px solid var(--border-2);
  border-radius: 0;
  background: var(--fill-1);
  font-size: 13.5px;
  color: var(--text-1);
  cursor: pointer;
  transition:
    background var(--motion-hover);
}
:global(.unit-item.el-button > span) {
  display: flex;
  flex: 1;
  min-width: 0;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
  text-align: left;
}
.unit-item.el-button:last-child {
  border-bottom: 0;
}
.unit-item.el-button:hover,
.unit-item.el-button:focus-visible {
  color: var(--text-1);
  background: var(--brand-8);
}
.unit-item.el-button.active {
  background: var(--fill-1);
  color: var(--brand-1);
  font-weight: 600;
}
.u-name {
  flex: 1;
}
.u-check {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  margin-left: auto;
  color: var(--brand-1);
}

.dlg-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.dlg-titles {
  display: flex;
  align-items: baseline;
  gap: 12px;
  min-width: 0;
}
/* 主标题：蓝色加粗 */
.dlg-title {
  flex: none;
  font-size: 19px;
  font-weight: 700;
  line-height: 1.2;
  color: var(--brand-1);
}
/* 副说明：灰色小字，紧跟主标题 */
/* 关闭按钮：线条更粗、蓝灰色 */
.dlg-close {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: var(--icon-caret);
  cursor: pointer;
  transition:
    color var(--motion-hover),
    background var(--motion-hover);
}
.dlg-close:hover {
  color: var(--brand-3);
  background: var(--brand-8);
}

/* 正文：整体居中 */
.dlg-body {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 0;
}
/* 正文主文案（如「确认删除？」）：居中、深色、字大 */
.dlg-tip-center {
  margin: 0 0 16px;
  font-size: 16px;
  font-weight: 600;
  text-align: left;
  color: var(--text-1);
}

/* 底部按钮：大号圆角，居中排列 */
.dlg-foot {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.dlg-btn {
  /* 尺寸按按钮文字 14px 推算：140×38、胶囊圆角 19 */
  min-width: 140px;
  height: 36px;
  padding: 0 22px;
  border-radius: 10px;
  border: 1px solid transparent;
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition:
    background var(--motion-hover),
    border-color var(--motion-hover),
    color var(--motion-hover);
}
/* 确认类按钮：无边框蓝色实心（禁用时保持同一蓝底、仅降透明度，不用另一种浅蓝，避免看着像另一个按钮） */
.dlg-btn.primary {
  background: var(--brand-1);
  border-color: transparent;
  color: var(--color-text-anti);
}
.dlg-btn.primary:hover:not(:disabled) {
  background: var(--brand-3);
}
.dlg-btn.primary:disabled {
  background: var(--brand-1);
  opacity: 0.45;
  cursor: not-allowed;
}
/* 取消类按钮：白底 + 边框 */
.dlg-btn.ghost {
  background: var(--fill-1);
  border-color: var(--border-2);
  color: var(--text-1);
}
.dlg-btn.ghost:hover {
  border-color: var(--brand-4);
  color: var(--brand-1);
}

.del-err {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--danger-1);
}
.pm-delete-form {
  width: 100%;
}
.pm-delete-input {
  --el-input-height: 36px;
}
.pm-delete-form :deep(.el-form-item) {
  margin-bottom: 0;
}
.pm-delete-form :deep(.el-form-item__label) {
  height: auto;
  padding: 0;
  color: var(--text-2);
  line-height: 1.6;
}
.pm-delete-form :deep(.el-form-item__content) {
  display: block;
  line-height: normal;
}
.pm-delete-form :deep(.el-input__wrapper) {
  height: var(--el-input-height);
  min-height: var(--el-input-height);
  padding: 1px 11px;
  border-radius: var(--radius-md);
  background: var(--fill-1);
  box-shadow: 0 0 0 1px var(--border-3) inset;
  transition:
    background-color var(--motion-hover),
    box-shadow var(--motion-hover);
}
.pm-delete-form :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px var(--color-border-brand) inset;
}
.pm-delete-form :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--border-3) inset;
}
.pm-delete-form :deep(.el-input__inner) {
  color: var(--text-1);
  font-size: 14px;
}
.pm-delete-form :deep(.el-input__inner::placeholder) {
  color: var(--text-4);
}
.del-tip {
  display: block;
  font-size: 14px;
  line-height: 1.6;
  text-align: left;
}
.del-tip code {
  font-family: inherit;
  color: inherit;
}
</style>

<style>
/* 弹窗本体样式：`<el-dialog>` 用了 append-to-body，弹窗被 teleport 到 body 下，
   根元素拿不到本组件的 scoped 属性选择器，故这层用非 scoped 样式块（类名 .pm-dialog 唯一，不会外溢）。
   参照设计稿：大圆角卡片 + 蓝色标题行 + 居中大按钮。 */
.pm-dialog {
  border: 1px solid var(--border-2);
  border-radius: 18px;
  padding: 0;
  background: var(--fill-1);
  box-shadow: var(--shadow-3);
  overflow: hidden;
}
.pm-dialog .el-dialog__header {
  margin: 0;
  padding: 20px 20px 24px 24px;
}
.pm-dialog .el-dialog__body {
  padding: 0 24px 24px;
}
.pm-dialog .el-dialog__footer {
  padding: 24px;
  text-align: right;
}
.pm-dialog.pm-unit-dialog .el-dialog__body {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  padding-bottom: 0;
  overflow: hidden;
}
.pm-unit-dialog .unit-list-scroll {
  flex: 1 1 auto;
  min-height: 0;
  max-height: 100%;
}
.pm-unit-dialog .unit-list-scroll .el-scrollbar__wrap {
  overflow-x: hidden !important;
  overflow-y: auto !important;
}
.pm-unit-dialog .unit-list-scroll .el-scrollbar__bar.is-horizontal {
  display: none;
}
.pm-unit-dialog .dlg-foot {
  display: flex;
  justify-content: flex-end;
}
.pm-unit-dialog .pm-dialog-cancel {
  min-width: 88px;
  height: 36px;
  padding: 0 16px;
  color: var(--text-1);
  border-color: var(--border-2);
  background: var(--fill-1);
}
.pm-unit-dialog .pm-dialog-cancel:hover,
.pm-unit-dialog .pm-dialog-cancel:focus-visible {
  color: var(--text-1);
  border-color: var(--border-4);
  background: var(--fill-2);
}
.pm-create-dialog .el-dialog__title {
  color: var(--text-1);
  font-size: 16px;
  font-weight: 700;
  line-height: 24px;
}
.pm-create-dialog .el-dialog__headerbtn,
.pm-unit-dialog .el-dialog__headerbtn {
  top: 16px;
  right: 20px;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  transform: none;
  transition:
    background var(--motion-hover),
    color var(--motion-hover);
}
.pm-create-dialog .el-dialog__headerbtn:hover,
.pm-unit-dialog .el-dialog__headerbtn:hover {
  background: var(--fill-2);
}
.pm-create-dialog .el-dialog__headerbtn .el-dialog__close,
.pm-unit-dialog .el-dialog__headerbtn .el-dialog__close {
  color: var(--text-1);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  line-height: 1;
}
.pm-create-dialog .el-dialog__headerbtn:hover .el-dialog__close,
.pm-unit-dialog .el-dialog__headerbtn:hover .el-dialog__close {
  color: var(--text-1);
}
.pm-delete-dialog .el-dialog__title {
  color: var(--text-1);
  font-size: 16px;
  font-weight: 700;
  line-height: 24px;
}
.pm-delete-dialog .el-dialog__headerbtn {
  top: 16px;
  right: 20px;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  transform: none;
  transition:
    background var(--motion-hover),
    color var(--motion-hover);
}
.pm-delete-dialog .el-dialog__headerbtn:hover {
  background: var(--fill-2);
}
.pm-delete-dialog .el-dialog__headerbtn .el-dialog__close {
  color: var(--text-1);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  line-height: 1;
}
.pm-delete-dialog .el-dialog__headerbtn:hover .el-dialog__close {
  color: var(--text-1);
}
.pm-delete-dialog .dlg-foot {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}
.pm-delete-dialog .dlg-foot .el-button + .el-button {
  margin-left: 0;
}
.pm-delete-dialog .el-button {
  min-width: 88px;
  height: 36px;
  padding: 0 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
}
.pm-delete-dialog .pm-dialog-cancel {
  --el-button-text-color: var(--text-1);
  --el-button-bg-color: var(--fill-1);
  --el-button-border-color: var(--border-2);
  --el-button-hover-text-color: var(--text-1);
  --el-button-hover-bg-color: var(--fill-2);
  --el-button-hover-border-color: var(--border-4);
}
.pm-delete-dialog .pm-dialog-cancel:hover {
  color: var(--text-1);
}
.pm-delete-dialog .pm-dialog-confirm {
  border-color: var(--color-status-error);
  background: var(--color-status-error);
  color: var(--color-text-anti);
  box-shadow: none;
}
.pm-delete-dialog .pm-dialog-confirm:hover:not(:disabled) {
  border-color: color-mix(in srgb, var(--color-status-error) 85%, #000);
  background: color-mix(in srgb, var(--color-status-error) 85%, #000);
}
.pm-delete-dialog .pm-dialog-confirm:disabled {
  border-color: var(--color-status-error);
  background: var(--color-status-error);
  opacity: 0.42;
}

@media (max-width: 640px) {
  .pm-dialog {
    width: calc(100vw - 32px) !important;
  }
  .pm-dialog .el-dialog__header {
    padding: 24px;
  }
  .pm-dialog .el-dialog__body {
    padding: 0 24px 24px;
  }
  .pm-dialog .el-dialog__footer {
    padding: 24px;
  }
  .method-options {
    flex-direction: column;
  }
  .method-option {
    max-width: none;
    min-height: 132px;
  }
  .pm-delete-dialog .dlg-foot {
    width: 100%;
  }
  .pm-delete-dialog .el-button {
    min-width: 0;
    flex: 1;
  }
}
</style>
