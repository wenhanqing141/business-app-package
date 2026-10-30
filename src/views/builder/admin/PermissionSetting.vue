<template>
  <div class="perm-page ai-surface-page" v-loading="loading">
    <el-tabs v-model="topTab" class="top-tabs">
      <!-- ================== 菜单权限 ================== -->
      <el-tab-pane label="菜单权限" name="menu">
        <div class="menu-perm">
          <!-- 工具栏：添加角色（设计稿页面 3 为「文字按钮」：加号 + 文字、无填充底色） -->
          <div class="mp-toolbar">
            <el-button
              text
              class="mp-add"
              :disabled="!addableMenuRoles.length"
              @click="openAddMenuRole"
            >
              <AppIcon name="添加" :size="13" />添加角色
            </el-button>
            <span class="mp-autosave"
              >点击「配置权限」勾选分组与应用，确定后保存并即时对该角色生效</span
            >
          </div>

          <!-- 角色表：一个角色一行（线框图 2026-10-05） -->
          <div class="mp-table">
            <div class="mp-row mp-head">
              <div class="mp-cell mp-cell-role">使用角色</div>
              <div class="mp-cell mp-cell-op">操作</div>
            </div>

            <div v-for="r in menuRoleRows" :key="r.id" class="mp-row">
              <div class="mp-cell mp-cell-role">{{ r.name }}</div>
              <div class="mp-cell mp-cell-op">
                <el-button text class="mp-op" @click="openMenuConfig(r)">配置权限</el-button>
                <el-button text type="danger" class="mp-op mp-op-danger" @click="removeMenuRole(r)"
                  >删除</el-button
                >
              </div>
            </div>

            <div v-if="!menuRoleRows.length" class="mp-empty">
              暂无已配置角色，请先点击「添加角色」
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- ================== 应用权限 ================== -->
      <el-tab-pane name="app">
        <template #label>
          应用权限
          <AppTooltip placement="top">
            <template #content>
              应用权限自动保存；数据 / 字段 / 功能 / 其他四类权限分别配置，不支持跨应用继承。
            </template>
            <AppIcon class="ap-label-icon" name="info" :size="16" />
          </AppTooltip>
        </template>

        <div class="app-perm">
          <!-- 左：应用包内的表单 / 审批列表（仅显示应用名称） -->
          <div class="ap-left">
            <el-input
              v-model="appKeyword"
              size="small"
              placeholder="应用搜索"
              clearable
              class="ap-search"
            >
              <template #prefix><AppIcon name="搜索" :size="14" /></template>
            </el-input>
            <div class="ap-list-title">应用包内的表单 / 审批列表</div>
            <div class="ap-list">
              <div
                v-for="a in formApprovalApps"
                :key="a.id"
                class="ap-item"
                :class="{ active: a.id === activeAppId }"
                @click="selectApp(a.id)"
              >
                <span class="ap-item-name">{{ a.name }}</span>
              </div>
              <el-empty
                v-if="!formApprovalApps.length"
                :image-size="56"
                description="包内暂无表单 / 审批"
              />
            </div>
          </div>

          <!-- 右：权限组 + 数据/字段/功能/其他 -->
          <div class="ap-right">
            <template v-if="activeAppId">
              <div class="ap-head">
                <span class="ap-group-name">{{ permGroup?.name || '默认权限组' }}</span>
                <el-select v-model="activeGroupName" size="small" class="ap-group-select" fit-input-width>
                  <el-option v-for="n in PERM_GROUP_NAMES" :key="n" :label="n" :value="n" />
                </el-select>
              </div>

              <div class="ap-sub-head">
                <el-radio-group v-model="permType" size="small">
                  <el-radio-button value="data">数据权限</el-radio-button>
                  <el-radio-button value="field">字段权限</el-radio-button>
                  <el-radio-button value="func">功能权限</el-radio-button>
                  <el-radio-button value="other">其他权限</el-radio-button>
                </el-radio-group>
                <el-button size="small" type="primary" plain @click="createDialog = true">
                  <AppIcon class="el-icon--left" name="添加" :size="16" />新建
                </el-button>
              </div>

              <el-table :data="permGroup?.roles || []" border size="small" class="ap-table">
                <el-table-column label="使用角色" min-width="150">
                  <template #default="{ row }">
                    <span>{{ row.label }}</span>
                    <el-tag v-if="row.tag" size="small" type="info" class="row-tag">{{
                      row.tag
                    }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="说明" min-width="260" prop="desc" />
                <el-table-column label="操作" width="220" align="center">
                  <template #default="{ row }">
                    <el-button link type="primary" size="small" @click="openScope(row)">
                      设置{{ permTypeLabel }}
                    </el-button>
                    <el-button
                      v-if="row.removable"
                      link
                      type="danger"
                      size="small"
                      @click="removeRole(row)"
                    >
                      删除
                    </el-button>
                    <span v-else class="muted">–</span>
                  </template>
                </el-table-column>
              </el-table>
            </template>
            <el-empty v-else description="请选择左侧表单 / 审批应用" />
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 菜单权限：配置权限（弹窗内按「入口」逐条勾选该角色可见的分组与应用，点「确定」保存即生效；
         同一应用多入口时各占一行、不去重；行文案只显示菜单名称、不区分前后台形态，2026-10-11） -->
    <el-dialog
      v-model="menuConfigDialog"
      :title="`配置权限 · ${configRoleName}`"
      width="1120px"
      top="6vh"
      class="perm-dialog"
    >
      <div class="mp-dialog-body">
        <div v-for="n in rootNodes" :key="n.key" class="mp-list-group">
          <MenuPermNode :node="n" :state="draftState" />
        </div>
      </div>
      <template #footer>
        <el-button @click="menuConfigDialog = false">取消</el-button>
        <el-button type="primary" @click="saveMenuConfig">确定</el-button>
      </template>
    </el-dialog>

    <!-- 菜单权限：添加角色（角色列表多选） -->
    <el-dialog v-model="menuRoleDialog" title="添加角色" width="460px" class="perm-dialog">
      <el-checkbox-group v-model="newMenuRoleIds" class="role-checks">
        <el-checkbox v-for="r in addableMenuRoles" :key="r.id" :value="r.id" class="role-check">
          <span class="rc-name">{{ r.name }}</span>
          <span class="rc-count">{{ r.members }} 人</span>
        </el-checkbox>
      </el-checkbox-group>
      <el-empty
        v-if="!addableMenuRoles.length"
        :image-size="56"
        description="微服务用户管理中的角色已全部配置"
      />
      <template #footer>
        <el-button @click="menuRoleDialog = false">取消</el-button>
        <el-button type="primary" :disabled="!newMenuRoleIds.length" @click="addMenuRole"
          >添加</el-button
        >
      </template>
    </el-dialog>

    <!-- 应用权限：新建（添加使用角色） -->
    <el-dialog v-model="createDialog" title="新建（添加使用角色）" width="420px">
      <el-select v-model="newRoleId" placeholder="选择微服务用户管理中的角色" class="full" fit-input-width>
        <el-option
          v-for="r in addableRoles"
          :key="r.id"
          :label="`${r.name}（${r.members} 人）`"
          :value="r.id"
        />
      </el-select>
      <template #footer>
        <el-button @click="createDialog = false">取消</el-button>
        <el-button type="primary" @click="addRole">新建</el-button>
      </template>
    </el-dialog>

    <!-- 设置数据 / 字段 / 功能 / 其他权限 -->
    <el-dialog
      v-model="scopeDialog.show"
      :title="`设置${permTypeLabel} · ${scopeDialog.rowLabel || ''}`"
      width="440px"
    >
      <el-radio-group v-model="scopeDialog.value" class="scope-radios">
        <el-radio value="all" border>全部数据 / 全部字段</el-radio>
        <el-radio value="filter" border>符合筛选条件的数据 / 字段</el-radio>
        <el-radio value="self" border>仅本人相关</el-radio>
      </el-radio-group>
      <template #footer>
        <el-button @click="scopeDialog.show = false">取消</el-button>
        <el-button type="primary" @click="saveScope">保存（自动保存）</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  fetchBuilderDetail,
  fetchMenuRolePerms,
  updateMenuRole,
  saveMenuRolePerm,
  fetchAppPermGroup,
  updateAppPermGroup
} from '@/api/appPackage'
import MenuPermNode from '@/components/builder/MenuPermNode.vue'
import AppIcon from '@/components/icons/AppIcon.vue'
import { setPkgVersion } from '@/api/pkgVersion'

const loading = ref(false)
const topTab = ref('menu')

const roles = ref([])
const groups = ref([])
const apps = ref([])

// 菜单权限：已配置角色 id 列表 + 每个角色的勾选态 { [roleId]: { [入口id]: boolean } }（按入口、不去重）
const configuredRoleIds = ref([])
const menuStates = reactive({})

const appKeyword = ref('')
const activeAppId = ref('')
const activeGroupName = ref(PERM_GROUP_NAMES[0])
const permGroup = ref(null)
const permType = ref('data')

const permTypeLabel = computed(
  () =>
    ({ data: '数据权限', field: '字段权限', func: '功能权限', other: '其他权限' })[permType.value]
)

function roleName(id) {
  return roles.value.find((r) => r.id === id)?.name || id
}

// 容器节点序列：直属子分组 + 直属应用按统一 sort 混合，顺序与搭建台 / 前台一致
function containerNodes(cid) {
  const gnodes = groups.value
    .filter((g) => (g.parentId || null) === cid)
    .map((ref) => ({ kind: 'group', ref }))
  const anodes = apps.value
    .filter((a) => (a.groupId || null) === cid)
    .map((ref) => ({ kind: 'app', ref }))
  return [...gnodes, ...anodes].sort((x, y) => x.ref.sort - y.ref.sort)
}
// 按菜单容器顺序深度优先收集应用 id
function orderedAppIds() {
  const ids = []
  const walk = (cid) => {
    containerNodes(cid).forEach((n) => {
      if (n.kind === 'group') walk(n.ref.id)
      else ids.push(n.ref.id)
    })
  }
  walk(null)
  return ids
}

// 左栏：仅表单 / 审批，按菜单统一顺序排列，只显示名称
// 2026-10-11（PRD v2.7 模块八）：**「应用权限」以「应用」为单位去重**——同一应用在包内有多个入口
// （多分组 / 前后台两形态并存）时只出现一条，权限对象是应用本身（与菜单权限按入口勾选相反）
const formApprovalApps = computed(() => {
  const kw = appKeyword.value.trim()
  const seen = new Set()
  const out = []
  for (const id of orderedAppIds()) {
    const a = apps.value.find((x) => x.id === id)
    if (!a || !['form', 'approval'].includes(a.engine)) continue
    const appId = a.appId || a.id
    if (seen.has(appId)) continue
    seen.add(appId)
    out.push({ id: appId, name: a.name })
  }
  return kw ? out.filter((a) => a.name.includes(kw)) : out
})

// ============ 菜单权限勾选树 ============
let nodeSeq = 0
function buildTree(cid) {
  return containerNodes(cid).map((n) => {
    if (n.kind === 'group') {
      return {
        key: `g-${n.ref.id}`,
        kind: 'group',
        id: n.ref.id,
        name: n.ref.name,
        children: buildTree(n.ref.id)
      }
    }
    return {
      key: `a-${n.ref.id}-${nodeSeq++}`,
      kind: 'app',
      id: n.ref.id,
      name: n.ref.name,
      engine: n.ref.engine
    }
  })
}
const rootNodes = computed(() => buildTree(null))

// 菜单权限：一角色一行；点「配置权限」弹窗勾选分组与应用
const menuRoleRows = computed(() =>
  configuredRoleIds.value.map((id) => ({ id, name: roleName(id) }))
)
const menuConfigDialog = ref(false)
const configRoleId = ref('')
const configRoleName = computed(() => roleName(configRoleId.value))
// 弹窗内的草稿勾选态：点「确定」才写回 menuStates 并提交
const draftState = ref({})

function openMenuConfig(row) {
  const src = ensureState(row.id, [])
  const draft = {}
  apps.value.forEach((a) => {
    draft[a.id] = !!src[a.id]
  })
  draftState.value = reactive(draft)
  configRoleId.value = row.id
  menuConfigDialog.value = true
}
async function saveMenuConfig() {
  const roleId = configRoleId.value
  if (!roleId) return
  const state = ensureState(roleId, [])
  Object.keys(draftState.value).forEach((id) => {
    state[id] = draftState.value[id]
  })
  await doSave(roleId)
  menuConfigDialog.value = false
  ElMessage.success('该角色的菜单权限已保存并即时生效')
}

// 为角色初始化勾选态（所有应用键预置 false）
function ensureState(roleId, checkedIds = []) {
  if (!menuStates[roleId]) {
    const checked = new Set(checkedIds)
    const state = {}
    apps.value.forEach((a) => {
      state[a.id] = checked.has(a.id)
    })
    menuStates[roleId] = reactive(state)
  }
  return menuStates[roleId]
}

// 保存：弹窗点「确定」后提交；2026-10-11 起落库即对该角色生效（无需发布）
// 注意：勾选对象是**入口（菜单项）id**，同一应用多入口时按入口逐条勾选、不去重
async function doSave(roleId) {
  const appIds = Object.keys(menuStates[roleId]).filter((id) => menuStates[roleId][id])
  await saveMenuRolePerm(roleId, appIds)
}

// 添加 / 移除配置角色
const menuRoleDialog = ref(false)
const newMenuRoleIds = ref([])
const addableMenuRoles = computed(() =>
  roles.value.filter((r) => !configuredRoleIds.value.includes(r.id))
)
function openAddMenuRole() {
  newMenuRoleIds.value = []
  menuRoleDialog.value = true
}
async function addMenuRole() {
  const picks = newMenuRoleIds.value.slice()
  if (!picks.length) return ElMessage.warning('请选择角色')
  for (const roleId of picks) {
    await updateMenuRole('add', roleId)
    configuredRoleIds.value.push(roleId)
    ensureState(roleId, [])
  }
  menuRoleDialog.value = false
  newMenuRoleIds.value = []
  ElMessage.success(
    picks.length > 1
      ? `已添加 ${picks.length} 个角色，请分别为其勾选分组与应用`
      : '已添加角色，请为其勾选分组与应用'
  )
  // 只选了一个角色时，直接打开该角色的配置权限弹窗
  if (picks.length === 1) openMenuConfig({ id: picks[0], name: roleName(picks[0]) })
}
async function removeMenuRole(row) {
  const roleId = typeof row === 'string' ? row : row?.id
  if (!roleId) return
  try {
    await ElMessageBox.confirm(`确认移除角色「${roleName(roleId)}」的菜单权限配置？`, '移除角色', {
      type: 'warning',
      confirmButtonText: '移除',
      cancelButtonText: '取消'
    })
  } catch {
    return
  }
  await updateMenuRole('remove', roleId)
  configuredRoleIds.value = configuredRoleIds.value.filter((id) => id !== roleId)
  if (configRoleId.value === roleId) menuConfigDialog.value = false
  ElMessage.success('已移除角色配置')
}

// ============ 应用权限 ============
async function selectApp(appId) {
  activeAppId.value = appId
  const data = await fetchAppPermGroup(appId)
  permGroup.value = data.group
}

const addableRoles = computed(() => {
  const used = new Set((permGroup.value?.roles || []).map((r) => r.key))
  return roles.value.filter((r) => !used.has(r.id))
})
const createDialog = ref(false)
const newRoleId = ref('')

async function addRole() {
  if (!newRoleId.value) return ElMessage.warning('请选择角色')
  const data = await updateAppPermGroup(activeAppId.value, {
    action: 'add-role',
    roleId: newRoleId.value
  })
  permGroup.value = data.group
  createDialog.value = false
  newRoleId.value = ''
  ElMessage.success('已添加，应用权限自动保存')
}

async function removeRole(row) {
  try {
    await ElMessageBox.confirm(`确认删除角色「${row.label}」的本组权限？`, '删除', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      confirmButtonClass: 'delete-confirm-button'
    })
  } catch {
    return
  }
  const data = await updateAppPermGroup(activeAppId.value, { action: 'remove-role', key: row.key })
  permGroup.value = data.group
  ElMessage.success('已删除并自动保存')
}

const scopeDialog = reactive({ show: false, key: '', rowLabel: '', value: 'all' })
function openScope(row) {
  Object.assign(scopeDialog, {
    show: true,
    key: row.key,
    rowLabel: row.label,
    value: row.scopes[permType.value] || 'all'
  })
}
async function saveScope() {
  const data = await updateAppPermGroup(activeAppId.value, {
    action: 'update-role',
    key: scopeDialog.key,
    scopeType: permType.value,
    scope: scopeDialog.value
  })
  permGroup.value = data.group
  scopeDialog.show = false
  ElMessage.success('已自动保存')
}

onMounted(async () => {
  loading.value = true
  try {
    const [d, menuData] = await Promise.all([fetchBuilderDetail(), fetchMenuRolePerms()])
    if (d.pkg?.version) setPkgVersion(d.pkg.version, d.pkg.id) // 同步持有的应用包版本（并发校验用）
    roles.value = d.roles
    groups.value = d.groups
    apps.value = d.apps
    menuData.configured.forEach((c) => {
      configuredRoleIds.value.push(c.roleId)
      ensureState(c.roleId, c.appIds)
    })
    // 默认选中第一个表单
    const firstForm = formApprovalApps.value[0]
    if (firstForm) await selectApp(firstForm.id)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
/* 外层白色面板已由 BuilderAdminLayout 的 .admin-content 提供，此处只留内边距 */
.perm-page {
  padding: 0;
  min-height: 100%;
  box-sizing: border-box;
}
/* 顶部 Tab（设计稿：16px、激活品牌蓝 + 3px 下划线、整宽 1px 分割线） */
.top-tabs {
  min-height: 100%;
}
.top-tabs :deep(.el-tabs__header) {
  margin: 0 0 8px;
}
.top-tabs :deep(.el-tabs__nav-wrap::after) {
  height: 1px;
  background: var(--border-2);
}
.top-tabs :deep(.el-tabs__item) {
  height: 32px;
  line-height: 32px;
  padding: 0 20px 0 0;
  font-size: 16px;
  color: var(--text-3);
}
.top-tabs :deep(.el-tabs__item.is-active) {
  color: var(--brand-1);
  font-weight: 600;
}
.top-tabs :deep(.el-tabs__active-bar) {
  height: 3px;
  border-radius: 2px;
  background: var(--brand-1);
}
.ap-label-icon {
  margin-left: 4px;
  color: #83868c;
  cursor: pointer;
}

/* 菜单权限（线框图 2026-10-05：一个角色一行 + 行内展开配置卡片） */
.mp-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
/* 添加角色：设计稿为「文字按钮」（组件库规范：24px 高、rx=6、无底色、悬停浅灰底） */
.mp-add {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  height: 24px;
  padding: 0 8px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-1);
  font-size: 14px;
  font-family: inherit;
  cursor: pointer;
  transition: background-color 0.15s ease;
}
.mp-add:hover:not(:disabled) {
  background: var(--fill-2);
}
.mp-add:disabled {
  color: var(--text-4);
  cursor: not-allowed;
}
.mp-autosave {
  margin-left: auto;
  font-size: 12px;
  color: var(--text-3);
}

/* 角色表 */
.mp-table {
  border: 1px solid var(--border-2);
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--fill-1);
}
.mp-row {
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--border-1);
}
.mp-row:last-child {
  border-bottom: none;
}
.mp-head {
  background: var(--fill-2);
  color: var(--text-2);
  font-weight: 600;
}
.mp-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 48px;
  padding: 0 16px;
  font-size: 14px;
}
.mp-head .mp-cell {
  height: 44px;
}
.mp-cell-role {
  width: 50%;
  color: var(--text-1);
}
.mp-head .mp-cell-role,
.mp-head .mp-cell-op {
  color: var(--text-2);
}
.mp-cell-op {
  width: 50%;
  gap: 24px;
}
/* 行内操作：配置权限 / 删除 */
.mp-op {
  border: none;
  background: none;
  height: 24px;
  padding: 0 8px;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-family: inherit;
  color: var(--brand-1);
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
}
.mp-op:hover {
  background: var(--fill-2);
}
.mp-op-danger {
  color: var(--danger-1);
}
.mp-op-danger:hover {
  background: var(--danger-1);
  color: #fff;
}

/* 配置权限弹窗：分组以「列表」形式纵向排列（不再是多列分组卡片） */
.mp-dialog-body {
  max-height: 58vh;
  overflow: auto;
  padding-right: 4px;
}
.mp-list-group {
  padding: 4px 0;
  border-bottom: 1px solid var(--border-1);
}
.mp-list-group:last-child {
  border-bottom: none;
}

/* 弹窗：标题与内容左边缘对齐（Element Plus 头 / 内容内边距不一致时会错开）。
   用组件根节点做前缀：弹窗默认不 teleport，DOM 仍在 .perm-page 内，作用域能命中 */
.perm-page :deep(.el-dialog__header),
.perm-page :deep(.el-dialog__body) {
  padding-left: 20px;
  padding-right: 20px;
}
.perm-page :deep(.el-dialog__title) {
  margin-left: 0;
  padding-left: 0;
}

/* 添加角色弹窗：角色列表多选 */
.role-checks {
  display: block;
}
/* 行内边距用负外边距抵消，让复选框与弹窗标题左对齐，同时保留悬浮底色的左右呼吸 */
.role-check {
  display: flex;
  align-items: center;
  width: calc(100% + 16px);
  height: 36px;
  margin: 0 -8px;
  padding: 0 8px;
  border-radius: var(--radius-md);
}
.role-check:hover {
  background: var(--fill-2);
}
.role-check :deep(.el-checkbox__label) {
  display: inline-flex;
  align-items: center;
  flex: 1;
  font-size: 14px;
  color: var(--text-1);
}
.rc-count {
  margin-left: auto;
  font-size: 12px;
  color: var(--text-3);
}
.mp-empty {
  padding: 32px 16px;
  text-align: center;
  font-size: 14px;
  color: var(--text-3);
}

/* 应用权限 */
.app-perm {
  display: flex;
  gap: 16px;
  min-height: 520px;
}
.ap-left {
  width: 250px;
  flex-shrink: 0;
  border: 1px solid #eaeaeb;
  border-radius: 6px;
  padding: 10px;
  background: #ffffff;
  display: flex;
  flex-direction: column;
}
.ap-search {
  margin-bottom: 8px;
}
.ap-list-title {
  font-size: 12px;
  color: #57585e;
  padding: 4px 2px 8px;
}
.ap-list {
  flex: 1;
  overflow: auto;
}
.ap-item {
  display: flex;
  align-items: center;
  height: 34px;
  padding: 0 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  color: #2f3137;
}
.ap-item:hover {
  background: #f3f4f5;
}
.ap-item.active {
  background: var(--brand-7);
  color: var(--brand-1);
}
.ap-item-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ap-right {
  flex: 1;
  min-width: 0;
  border: 1px solid #eaeaeb;
  border-radius: 6px;
  padding: 16px;
}
.ap-head {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 14px;
}
.ap-group-name {
  font-size: 16px;
  font-weight: 700;
}
.ap-group-select {
  width: 180px;
}
.ap-sub-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.ap-table {
  margin-bottom: 12px;
}
.row-tag {
  margin-left: 6px;
}
.muted {
  color: #c5c6c9;
  margin-left: 12px;
}

/* 弹窗 */
.full {
  width: 100%;
}
.scope-radios {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.scope-radios :deep(.el-radio) {
  margin: 0;
  padding: 8px 12px;
}
</style>
