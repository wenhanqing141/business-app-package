<template>
  <div v-loading="loading" class="perm-page ai-surface-page" aria-label="权限设置">
    <el-alert v-if="pageError" :title="pageError" type="error" :closable="false" show-icon>
      <el-button text type="primary" @click="loadPage">重新加载</el-button>
    </el-alert>
    <el-tabs
      v-else
      v-model="topTab"
      class="permission-tabs"
      :class="{ 'permission-tabs--menu': topTab === 'menu' }"
    >
      <el-tab-pane label="菜单权限" name="menu" class="permission-pane">
        <div class="menu-permission-content">
          <div class="menu-permission-toolbar">
            <AppTooltip :disabled="!!addableMenuRoles.length" content="所有使用角色均已添加">
              <span class="action-trigger">
                <el-button
                  type="primary"
                  class="permission-add-role"
                  :disabled="!addableMenuRoles.length"
                  @click="openAddMenuRole"
                >
                  <AppIcon class="el-icon--left" name="添加" :size="16" />添加角色
                </el-button>
              </span>
            </AppTooltip>
          </div>
          <div class="menu-permission-table-region">
            <BaseTable
              :data="menuRoleRows"
              height="100%"
              :scrollbar-tabindex="0"
              class="permission-table menu-permission-table"
              row-key="id"
              aria-label="菜单权限角色列表"
            >
              <el-table-column label="使用角色" prop="name" class-name="app-data-table__primary" />
              <el-table-column label="操作">
                <template #default="{ row }">
                  <el-space :size="16">
                    <el-button
                      link
                      type="primary"
                      :aria-label="`配置${row.name}的菜单权限`"
                      @click="openMenuConfig(row)"
                      >配置权限</el-button
                    >
                    <el-button
                      link
                      type="danger"
                      :aria-label="`移除${row.name}的菜单权限`"
                      @click="removeMenuRole(row)"
                      >删除</el-button
                    >
                  </el-space>
                </template>
              </el-table-column>
              <template #empty>
                <el-empty
                  class="menu-permission-empty"
                  image="/menu-role-empty.svg"
                  :image-size="100"
                  description="暂无已配置角色，请先添加角色"
                />
              </template>
            </BaseTable>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane name="app" class="permission-pane">
        <template #label>
          应用权限
          <AppTooltip content="各应用、权限组与权限类别分别配置，保存后即时生效" placement="top">
            <span class="tab-info" tabindex="0" aria-label="应用权限说明"
              ><AppIcon name="info" :size="16"
            /></span>
          </AppTooltip>
        </template>
        <el-container class="permission-workspace">
          <el-aside class="application-sidebar" width="240px">
            <BaseSelect
              :model-value="activeAppId"
              class="application-mobile-select"
              aria-label="选择应用"
              placeholder="请选择应用"
              filterable
              fit-input-width
              no-data-text="暂无表单或审批应用"
              no-match-text="未找到匹配的应用"
              @change="selectApp"
            >
              <el-option
                v-for="app in eligibleApps"
                :key="app.id"
                :label="app.name"
                :value="app.id"
              />
            </BaseSelect>
            <PackageSearchInput
              v-model="appKeyword"
              placeholder="搜索应用"
              aria-label="搜索应用"
              class="application-search"
            />
            <el-scrollbar class="application-scrollbar" always>
              <el-menu
                v-if="filteredApps.length"
                :default-active="activeAppId"
                class="application-menu"
                aria-label="选择应用"
                @select="selectApp"
                @keydown="handleApplicationKeydown"
              >
                <el-menu-item
                  v-for="app in filteredApps"
                  :key="app.id"
                  :index="app.id"
                  :tabindex="app.id === tabbableAppId ? 0 : -1"
                  :aria-current="app.id === activeAppId ? 'true' : undefined"
                  @focus="focusedAppId = app.id"
                >
                  <AppIcon
                    v-if="app.menuIcon"
                    :name="app.menuIcon"
                    :size="18"
                    class="application-icon"
                  />
                  <EngineIcon
                    v-else
                    :engine="app.engine"
                    :size="18"
                    color="currentColor"
                    class="application-icon"
                  />
                  <AppTooltip :content="app.name" only-when-overflow placement="right">
                    <span
                      class="application-name"
                      :class="{ 'application-name--searching': appKeyword.trim() }"
                    >
                      <template
                        v-for="(segment, index) in searchNameSegments(app.name, appKeyword)"
                        :key="index"
                      >
                        <span v-if="segment.hit" class="application-search-hit">{{
                          segment.text
                        }}</span>
                        <template v-else>{{ segment.text }}</template>
                      </template>
                    </span>
                  </AppTooltip>
                </el-menu-item>
              </el-menu>
              <el-empty
                v-else-if="appKeyword.trim()"
                class="application-search-empty"
                image="/unit-search-empty.png"
                :image-size="64"
                description="搜索暂无结果"
                role="status"
                aria-live="polite"
              />
              <el-empty v-else :image-size="56" description="暂无表单或审批应用" />
            </el-scrollbar>
          </el-aside>

          <el-main class="application-detail" :aria-busy="appLoading">
            <el-scrollbar class="application-detail-scrollbar" always>
              <template v-if="activeApp">
                <div class="application-heading">
                  <div class="application-heading-copy">
                    <h2 class="application-title">{{ activeApp.name }}</h2>
                  </div>
                  <el-form inline class="permission-group-form">
                    <el-form-item label="权限组">
                      <BaseSelect
                        v-model="activeGroupName"
                        aria-label="权限组"
                        class="permission-group-select"
                        fit-input-width
                        @change="loadAppPermission"
                      >
                        <el-option
                          v-for="name in PERM_GROUP_NAMES"
                          :key="name"
                          :label="name"
                          :value="name"
                        />
                      </BaseSelect>
                    </el-form-item>
                  </el-form>
                </div>
                <el-skeleton :loading="appLoading" :rows="5" animated>
                  <template #default>
                    <el-alert
                      v-if="appError"
                      :title="appError"
                      type="error"
                      :closable="false"
                      show-icon
                    >
                      <el-button text type="primary" @click="loadAppPermission">重试</el-button>
                    </el-alert>
                    <template v-else>
                      <div class="permission-type-toolbar">
                        <el-segmented
                          v-model="permType"
                          :options="permissionTypes"
                          aria-label="权限类别"
                          class="permission-type-control"
                        />
                        <AppTooltip
                          :disabled="!!addableRoles.length"
                          content="当前权限组已添加全部使用角色"
                        >
                          <span class="action-trigger">
                            <el-button
                              type="primary"
                              class="permission-add-role"
                              :disabled="!addableRoles.length"
                              @click="openCreateRole"
                            >
                              <AppIcon class="el-icon--left" name="添加" :size="16" />添加角色
                            </el-button>
                          </span>
                        </AppTooltip>
                      </div>
                      <BaseTable
                        :data="permGroup?.roles || []"
                        height="100%"
                        scrollbar-always-on
                        class="permission-table application-table"
                        row-key="key"
                        :aria-label="`${activeApp.name}的${permTypeLabel}角色列表`"
                      >
                        <el-table-column
                          label="使用角色"
                          prop="label"
                          min-width="160"
                          class-name="app-data-table__primary"
                        />
                        <el-table-column label="说明" min-width="208">
                          <template #default="{ row }"
                            ><span class="permission-description">{{
                              scopeDescription(row)
                            }}</span></template
                          >
                        </el-table-column>
                        <el-table-column label="操作" width="164" fixed="right">
                          <template #default="{ row }">
                            <el-space :size="16">
                              <el-button
                                link
                                type="primary"
                                :aria-label="`设置${row.label}的${permTypeLabel}`"
                                @click="openScope(row)"
                                >设置权限</el-button
                              >
                              <AppTooltip :disabled="!!row.removable" content="默认角色不可删除">
                                <span class="action-trigger"
                                  ><el-button
                                    link
                                    type="danger"
                                    :disabled="!row.removable"
                                    :aria-label="`删除${row.label}`"
                                    @click="removeRole(row)"
                                    >删除</el-button
                                  ></span
                                >
                              </AppTooltip>
                            </el-space>
                          </template>
                        </el-table-column>
                        <template #empty
                          ><el-empty :image-size="64" description="当前权限组暂无角色，请添加角色"
                        /></template>
                      </BaseTable>
                    </template>
                  </template>
                </el-skeleton>
              </template>
              <el-empty
                v-else
                :image-size="80"
                description="添加表单或审批应用后，即可配置应用权限"
              />
            </el-scrollbar>
          </el-main>
        </el-container>
      </el-tab-pane>
    </el-tabs>

    <AppDialog
      v-model="menuConfigDialog"
      title="配置权限"
      class="menu-permission-dialog"
      width="640px"
      :submit="saveMenuConfig"
      :confirm-disabled="!apps.length"
      @opened="syncMenuTree"
    >
      <template #default="{ submitting }">
        <div :inert="submitting || undefined" class="menu-tree-content">
          <el-input
            v-model="menuKeyword"
            placeholder="搜索分组或应用"
            aria-label="搜索分组或应用"
            clearable
            :disabled="submitting"
          >
            <template #prefix><AppIcon name="搜索" :size="16" /></template>
          </el-input>
          <div class="menu-tree-panel">
            <el-scrollbar class="menu-tree-scrollbar" always>
              <el-tree
                v-if="rootNodes.length"
                ref="menuTree"
                :data="rootNodes"
                node-key="key"
                :props="{
                  label: 'name',
                  children: 'children',
                  disabled: 'disabled'
                }"
                show-checkbox
                default-expand-all
                :expand-on-click-node="false"
                :highlight-current="false"
                :check-on-click-node="true"
                :default-checked-keys="checkedMenuKeys"
                :filter-node-method="filterMenuNode"
                empty-text="暂无搜索结果"
                class="menu-permission-tree"
                aria-label="角色可见菜单"
                @check="updateCheckedMenuKeys"
              >
                <template #empty>
                  <el-empty
                    class="menu-tree-search-empty"
                    image="/unit-search-empty.png"
                    :image-size="64"
                    description="暂无搜索结果"
                    role="status"
                    aria-live="polite"
                  />
                </template>
                <template #default="{ data }">
                  <span class="menu-tree-node">
                    <AppIcon
                      v-if="data.kind === 'group' || data.menuIcon"
                      class="menu-tree-node-icon"
                      :name="data.kind === 'group' ? '分组' : data.menuIcon"
                      :size="16"
                    />
                    <EngineIcon
                      v-else
                      class="menu-tree-node-icon"
                      :engine="data.engine"
                      :size="16"
                      color="var(--text-1)"
                      aria-hidden="true"
                    />
                    <span class="menu-tree-node-label">
                      <template
                        v-for="(segment, index) in searchNameSegments(data.name, menuKeyword)"
                        :key="index"
                      >
                        <span v-if="segment.hit" class="menu-search-hit">{{ segment.text }}</span>
                        <template v-else>{{ segment.text }}</template>
                      </template>
                    </span>
                  </span>
                </template>
              </el-tree>
              <el-empty v-else :image-size="64" description="暂无菜单，请先在编辑页添加应用" />
            </el-scrollbar>
          </div>
        </div>
      </template>
    </AppDialog>

    <AppDialog
      v-model="menuRoleDialog"
      title="添加角色"
      description="选择需要配置菜单权限的使用角色，可多选"
      class="menu-role-dialog"
      width="600px"
      confirm-text="添加"
      :confirm-disabled="!newMenuRoleIds.length"
      :submit="addMenuRole"
    >
      <template #default="{ submitting }">
        <div class="menu-role-panel">
          <el-scrollbar class="menu-role-scrollbar" always>
            <el-checkbox-group
              v-if="addableMenuRoles.length"
              v-model="newMenuRoleIds"
              class="app-dialog-role-list"
              :disabled="submitting"
              aria-label="选择使用角色"
            >
              <el-checkbox
                v-for="role in addableMenuRoles"
                :key="role.id"
                :value="role.id"
                class="app-dialog-role"
                >{{ role.name }}</el-checkbox
              >
            </el-checkbox-group>
            <el-empty v-else :image-size="56" description="所有使用角色均已配置" />
          </el-scrollbar>
        </div>
      </template>
    </AppDialog>

    <AppDialog
      v-model="createDialog"
      title="添加使用角色"
      :description="`为「${activeApp?.name || ''}」的${activeGroupName}添加角色`"
      confirm-text="添加"
      :confirm-disabled="!newRoleId || !addableRoles.length"
      :submit="addRole"
    >
      <template #default="{ submitting }">
        <el-form label-position="top" :disabled="submitting">
          <el-form-item label="使用角色" required>
            <BaseSelect
              v-model="newRoleId"
              placeholder="请选择使用角色"
              class="full"
              fit-input-width
              :disabled="!addableRoles.length"
              no-data-text="所有角色均已添加"
            >
              <el-option
                v-for="role in addableRoles"
                :key="role.id"
                :label="`${role.name}（${role.members} 人）`"
                :value="role.id"
              />
            </BaseSelect>
          </el-form-item>
          <el-empty
            v-if="!addableRoles.length"
            :image-size="56"
            description="当前权限组已添加全部角色"
          />
        </el-form>
      </template>
    </AppDialog>

    <AppDialog
      v-model="scopeDialog.show"
      :title="`设置${typeLabel(scopeDialog.type)} · ${scopeDialog.rowLabel}`"
      :description="`仅修改「${activeApp?.name || ''}」的${scopeDialog.groupName}，其他权限类别保持独立`"
      :submit="saveScope"
    >
      <template #default="{ submitting }">
        <el-form label-position="top" :disabled="submitting">
          <el-form-item label="权限范围">
            <el-radio-group
              v-model="scopeDialog.value"
              class="app-dialog-scope-options app-dialog-scope-options--inline"
              aria-label="权限范围"
            >
              <el-radio
                v-for="option in scopeOptions(scopeDialog.type)"
                :key="option.value"
                :value="option.value"
                >{{ option.label }}</el-radio
              >
            </el-radio-group>
          </el-form-item>
        </el-form>
      </template>
    </AppDialog>

    <AppDialog
      v-model="removeDialog.show"
      :title="removeDialog.kind === 'menu' ? '移除菜单角色' : '删除应用角色'"
      :confirm-text="removeDialog.kind === 'menu' ? '确认移除' : '确认删除'"
      danger
      :submit="confirmRemoveRole"
    >
      <p class="app-dialog-content">
        {{
          removeDialog.kind === 'menu'
            ? `确认移除角色「${removeDialog.row?.name || ''}」的菜单权限配置？其他角色的配置不受影响`
            : `确认从${removeDialog.groupName}删除「${removeDialog.row?.label || ''}」？该角色在此权限组的四类权限配置将一并移除`
        }}
      </p>
    </AppDialog>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  fetchBuilderDetail,
  fetchMenuRolePerms,
  updateMenuRole,
  saveMenuRolePerm,
  fetchAppPermGroup,
  updateAppPermGroup
} from '@/api/appPackage'
import AppIcon from '@/components/icons/AppIcon.vue'
import BaseTable from '@/components/BaseTable.vue'
import EngineIcon from '@/components/icons/EngineIcon.vue'
import AppDialog from '@/components/AppDialog.vue'
import PackageSearchInput from '@/components/PackageSearchInput.vue'
import BaseSelect from '@/components/BaseSelect.vue'
import { setPkgVersion } from '@/api/pkgVersion'
import { PERM_GROUP_NAMES } from '@/mock/pkgSeed'

const loading = ref(false)
const pageError = ref('')
const topTab = ref('menu')
const roles = ref([])
const groups = ref([])
const apps = ref([])
const configuredRoleIds = ref([])
// 菜单可见性按入口存储；应用权限按 appId 去重，同应用的多个入口共用配置。
const menuStates = reactive({})
const appKeyword = ref('')
const activeAppId = ref('')
const activeGroupName = ref(PERM_GROUP_NAMES[0])
const permGroup = ref(null)
const permType = ref('data')
const appLoading = ref(false)
const appError = ref('')
let appRequestId = 0
const permissionTypes = [
  { value: 'data', label: '数据权限', subject: '数据' },
  { value: 'field', label: '字段权限', subject: '字段' },
  { value: 'func', label: '功能权限', subject: '功能' },
  { value: 'other', label: '其他权限', subject: '其他权限' }
]
const typeLabel = (type) => permissionTypes.find((item) => item.value === type)?.label || '数据权限'
const permTypeLabel = computed(() => typeLabel(permType.value))
const roleName = (id) => roles.value.find((role) => role.id === id)?.name || id

function containerNodes(containerId) {
  return [
    ...groups.value
      .filter((group) => (group.parentId || null) === containerId)
      .map((item) => ({ kind: 'group', item })),
    ...apps.value
      .filter((app) => (app.groupId || null) === containerId)
      .map((item) => ({ kind: 'app', item }))
  ].sort((a, b) => a.item.sort - b.item.sort)
}
function buildTree(containerId) {
  return containerNodes(containerId).map(({ kind, item }) => {
    if (kind === 'app') {
      return {
        key: `a-${item.id}`,
        name: item.name,
        kind,
        engine: item.engine,
        menuIcon: item.menuIcon
      }
    }
    const children = buildTree(item.id)
    return {
      key: `g-${item.id}`,
      name: item.name,
      kind,
      children,
      disabled: !children.length
    }
  })
}
const rootNodes = computed(() => buildTree(null))
const eligibleApps = computed(() => {
  const result = []
  const seen = new Set()
  const walk = (containerId) => {
    for (const { kind, item } of containerNodes(containerId)) {
      if (kind === 'group') walk(item.id)
      else if (['form', 'approval'].includes(item.engine)) {
        const id = item.appId || item.id
        if (!seen.has(id)) {
          seen.add(id)
          // 与编辑页一致，保留应用入口配置的图标，缺省时按引擎类型展示。
          result.push({ id, name: item.name, engine: item.engine, menuIcon: item.menuIcon })
        }
      }
    }
  }
  walk(null)
  return result
})
const filteredApps = computed(() => {
  const keyword = appKeyword.value.trim().toLocaleLowerCase()
  return eligibleApps.value.filter((app) => app.name.toLocaleLowerCase().includes(keyword))
})
const focusedAppId = ref('')
const tabbableAppId = computed(
  () =>
    filteredApps.value.find((app) => app.id === (focusedAppId.value || activeAppId.value))?.id ||
    filteredApps.value[0]?.id
)
// Element Plus 的纵向菜单补齐方向键、首尾跳转和键盘激活。
function handleApplicationKeydown(event) {
  if (event.defaultPrevented) return
  const items = [...event.currentTarget.querySelectorAll('[role="menuitem"]')]
  const index = items.findIndex((item) => item.contains(event.target))
  if (index < 0) return
  let next = index
  if (event.key === 'ArrowDown') next = (index + 1) % items.length
  else if (event.key === 'ArrowUp') next = (index - 1 + items.length) % items.length
  else if (event.key === 'Home') next = 0
  else if (event.key === 'End') next = items.length - 1
  else if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    selectApp(filteredApps.value[index].id)
    return
  } else return
  event.preventDefault()
  items[next].focus()
}
const activeApp = computed(() => eligibleApps.value.find((app) => app.id === activeAppId.value))
const menuRoleRows = computed(() =>
  configuredRoleIds.value.map((id) => ({
    id,
    name: roleName(id)
  }))
)
function ensureState(roleId, checkedIds = []) {
  if (!menuStates[roleId]) {
    const checked = new Set(checkedIds)
    menuStates[roleId] = Object.fromEntries(apps.value.map((app) => [app.id, checked.has(app.id)]))
  }
  return menuStates[roleId]
}

const menuConfigDialog = ref(false)
const configRoleId = ref('')
const menuTree = ref(null)
const menuKeyword = ref('')
function searchNameSegments(name, keyword) {
  const trimmedKeyword = keyword.trim()
  if (!trimmedKeyword) return [{ text: name, hit: false }]
  const escaped = trimmedKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(`(${escaped})`, 'gi')
  return name.split(pattern).map((text, index) => ({ text, hit: index % 2 === 1 }))
}
const checkedMenuKeys = ref([])
watch(menuKeyword, (keyword) => menuTree.value?.filter(keyword.trim()))
function filterMenuNode(keyword, node) {
  return !keyword || node.name.toLocaleLowerCase().includes(keyword.toLocaleLowerCase())
}
async function syncMenuTree() {
  await nextTick()
  menuTree.value?.setCheckedKeys(checkedMenuKeys.value)
  menuTree.value?.filter(menuKeyword.value.trim())
}
function updateCheckedMenuKeys() {
  checkedMenuKeys.value = menuTree.value?.getCheckedKeys() || []
}
function openMenuConfig(row) {
  const state = ensureState(row.id)
  checkedMenuKeys.value = apps.value.filter((app) => state[app.id]).map((app) => `a-${app.id}`)
  menuKeyword.value = ''
  configRoleId.value = row.id
  menuConfigDialog.value = true
}
async function saveMenuConfig() {
  const roleId = configRoleId.value
  if (!roleId) return false
  const appIds = apps.value
    .filter((app) => checkedMenuKeys.value.includes(`a-${app.id}`))
    .map((app) => app.id)
  await saveMenuRolePerm(roleId, appIds)
  const selected = new Set(appIds)
  menuStates[roleId] = Object.fromEntries(apps.value.map((app) => [app.id, selected.has(app.id)]))
  ElMessage.success('菜单权限已保存并即时生效')
}

const menuRoleDialog = ref(false)
const newMenuRoleIds = ref([])
const addableMenuRoles = computed(() =>
  roles.value.filter((role) => !configuredRoleIds.value.includes(role.id))
)
function openAddMenuRole() {
  newMenuRoleIds.value = []
  menuRoleDialog.value = true
}
async function addMenuRole() {
  const picks = [...newMenuRoleIds.value]
  if (!picks.length) return false
  for (const roleId of picks) {
    await updateMenuRole('add', roleId)
    configuredRoleIds.value.push(roleId)
    newMenuRoleIds.value = newMenuRoleIds.value.filter((id) => id !== roleId)
    ensureState(roleId)
  }
  ElMessage.success('已添加角色，请配置可见菜单')
  if (picks.length === 1) openMenuConfig({ id: picks[0] })
}

function currentContext() {
  return { appId: activeAppId.value, groupName: activeGroupName.value }
}
function applyGroup(data, context) {
  if (context.appId === activeAppId.value && context.groupName === activeGroupName.value)
    permGroup.value = data.group
}
async function loadAppPermission() {
  const context = currentContext()
  const requestId = ++appRequestId
  appError.value = ''
  permGroup.value = null
  if (!context.appId) return
  appLoading.value = true
  try {
    const data = await fetchAppPermGroup(context.appId, context.groupName)
    if (requestId === appRequestId) applyGroup(data, context)
  } catch (error) {
    if (requestId === appRequestId) appError.value = error?.message || '权限配置加载失败，请重试'
  } finally {
    if (requestId === appRequestId) appLoading.value = false
  }
}
async function selectApp(appId) {
  if (appId === activeAppId.value && permGroup.value && !appError.value) return
  activeAppId.value = appId
  await loadAppPermission()
}
const addableRoles = computed(() => {
  const used = new Set((permGroup.value?.roles || []).map((role) => role.key))
  return roles.value.filter((role) => !used.has(role.id))
})
const createDialog = ref(false)
const newRoleId = ref('')
const createContext = ref(null)
function openCreateRole() {
  createContext.value = currentContext()
  newRoleId.value = ''
  createDialog.value = true
}
async function addRole() {
  if (!newRoleId.value || !createContext.value) return false
  const context = createContext.value
  const data = await updateAppPermGroup(context.appId, {
    action: 'add-role',
    roleId: newRoleId.value,
    groupName: context.groupName
  })
  applyGroup(data, context)
  ElMessage.success('已添加角色并保存')
}

function scopeValue(row) {
  return row.scopes?.[permType.value] || 'all'
}
function scopeOptions(type) {
  const subject = permissionTypes.find((item) => item.value === type)?.subject || '数据'
  return [
    { value: 'all', label: `全部${subject}` },
    { value: 'filter', label: `符合筛选条件的${subject}` },
    { value: 'self', label: `仅本人相关${subject}` }
  ]
}
function scopeDescription(row) {
  return (
    scopeOptions(permType.value).find((option) => option.value === scopeValue(row))?.label ||
    '尚未配置权限范围'
  )
}
const scopeDialog = reactive({
  show: false,
  key: '',
  rowLabel: '',
  type: 'data',
  value: 'all',
  appId: '',
  groupName: ''
})
function openScope(row) {
  Object.assign(scopeDialog, currentContext(), {
    show: true,
    key: row.key,
    rowLabel: row.label,
    type: permType.value,
    value: scopeValue(row)
  })
}
async function saveScope() {
  const context = { ...scopeDialog }
  const data = await updateAppPermGroup(context.appId, {
    action: 'update-role',
    groupName: context.groupName,
    key: context.key,
    scopeType: context.type,
    scope: context.value
  })
  applyGroup(data, context)
  ElMessage.success(`${typeLabel(context.type)}已保存`)
}
const removeDialog = reactive({
  show: false,
  kind: 'menu',
  row: null,
  appId: '',
  groupName: ''
})
function removeMenuRole(row) {
  Object.assign(removeDialog, { show: true, kind: 'menu', row })
}
function removeRole(row) {
  if (row.removable)
    Object.assign(removeDialog, currentContext(), {
      show: true,
      kind: 'app',
      row
    })
}
async function confirmRemoveRole() {
  const context = { ...removeDialog }
  if (!context.row) return false
  if (context.kind === 'menu') {
    await updateMenuRole('remove', context.row.id)
    configuredRoleIds.value = configuredRoleIds.value.filter((id) => id !== context.row.id)
    delete menuStates[context.row.id]
    ElMessage.success('已移除角色配置')
  } else {
    const data = await updateAppPermGroup(context.appId, {
      action: 'remove-role',
      groupName: context.groupName,
      key: context.row.key
    })
    applyGroup(data, context)
    ElMessage.success('已删除角色并保存')
  }
}
async function loadPage() {
  loading.value = true
  pageError.value = ''
  try {
    const [detail, menuData] = await Promise.all([fetchBuilderDetail(), fetchMenuRolePerms()])
    if (detail.pkg?.version) setPkgVersion(detail.pkg.version, detail.pkg.id)
    roles.value = detail.roles || []
    groups.value = detail.groups || []
    apps.value = detail.apps || []
    configuredRoleIds.value = menuData.configured.map((config) => config.roleId)
    Object.keys(menuStates).forEach((key) => delete menuStates[key])
    menuData.configured.forEach((config) => ensureState(config.roleId, config.appIds))
    activeAppId.value = eligibleApps.value[0]?.id || ''
    await loadAppPermission()
  } catch (error) {
    pageError.value = error?.message || '权限设置加载失败，请重试'
  } finally {
    loading.value = false
  }
}
onMounted(loadPage)
</script>

<style scoped>
.perm-page {
  --permission-control-height: calc(var(--builder-row-height) - var(--spacing-xs));
  display: flex;
  flex: 1;
  flex-direction: column;
  padding: 0;
  min-width: 0;
  min-height: 0;
}
.permission-tabs {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}
.permission-tabs :deep(.el-tabs__content) {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}
.permission-pane {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}
.menu-permission-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}
.menu-permission-table-region {
  flex: 1;
  min-width: 0;
  min-height: 0;
}
.menu-permission-table :deep(.el-table__body-wrapper .el-scrollbar__wrap) {
  overscroll-behavior-y: contain;
}
.menu-permission-table :deep(.el-table__empty-text) {
  width: 100%;
}
.perm-page .permission-tabs :deep(.el-scrollbar__view) {
  padding: 0;
  min-height: 0;
}
.permission-tabs :deep(.el-tabs__header) {
  flex-shrink: 0;
  margin-bottom: var(--spacing-lg);
}
.permission-tabs :deep(.el-tabs__nav-wrap::after) {
  height: 1px;
  background: var(--border-1);
}
.permission-tabs :deep(.el-tabs__item) {
  height: var(--builder-row-height);
  font-size: var(--font-size-lg);
}
.tab-info {
  display: inline-flex;
  margin-left: var(--spacing-xs);
  color: var(--text-3);
  border-radius: var(--radius-xs);
}
.tab-info:focus-visible {
  outline: 2px solid var(--brand-1);
  outline-offset: 2px;
}
.application-heading,
.permission-type-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-lg);
}
.permission-tabs.permission-tabs--menu :deep(.el-tabs__header) {
  margin-bottom: 0;
}
.menu-permission-toolbar {
  display: flex;
  flex-shrink: 0;
  justify-content: flex-start;
  margin: var(--spacing-lg) 0;
}
.application-title {
  margin: 0;
  color: var(--text-1);
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-lg);
  line-height: var(--line-height-text-md);
}
.application-title {
  line-height: 28px;
  overflow-wrap: anywhere;
}
.action-trigger {
  display: inline-flex;
}
.perm-page :deep(.el-button:not(.is-link)),
.perm-page :deep(.el-input__wrapper),
.perm-page :deep(.el-select__wrapper) {
  min-height: var(--permission-control-height);
  box-sizing: border-box;
}
.perm-page :deep(.el-button:not(.is-link)) {
  height: var(--permission-control-height);
}
.permission-table {
  width: 100%;
}
.permission-workspace {
  flex: 1;
  min-width: 0;
  min-height: 0;
  border: 1px solid var(--border-1);
  border-radius: var(--radius-md);
  overflow: hidden;
}
.application-sidebar {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  padding: var(--spacing-lg);
  background: transparent;
  border-right: 1px solid var(--border-1);
}
.application-mobile-select {
  display: none;
}
.application-search {
  margin-bottom: var(--spacing-md);
}
.application-search {
  flex-shrink: 0;
}
/* 搜索固定，仅列表项在统一 Element Plus 滚动区域内滚动。 */
.application-scrollbar {
  flex: 1;
  height: auto;
  min-height: 0;
}
.application-scrollbar :deep(.el-scrollbar__wrap) {
  overflow-x: hidden;
  overscroll-behavior-y: contain;
}
.permission-tabs :deep(.application-scrollbar > .el-scrollbar__wrap > .el-scrollbar__view) {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}
.application-scrollbar .application-search-empty {
  --el-empty-description-margin-top: var(--spacing-sm);
  flex: 1;
  padding: 0;
}
.application-search-empty :deep(.el-empty__image) {
  height: 64px;
  flex-shrink: 0;
}
.application-search-empty :deep(.el-empty__description p) {
  font-size: var(--font-size-md);
  line-height: var(--line-height-text-md);
  color: var(--text-3);
}
.application-menu {
  border-right: none;
  background: transparent;
  --el-menu-item-height: var(--builder-row-height);
  --el-menu-base-level-padding: var(--spacing-md);
}
.application-menu :deep(.el-menu-item) {
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xs);
  border-radius: var(--radius-sm);
  color: var(--text-1);
}
.application-menu :deep(.el-menu-item.is-active) {
  color: var(--brand-1);
  background: var(--brand-7);
  font-weight: var(--font-weight-medium);
}
.application-menu :deep(.el-menu-item:focus-visible) {
  outline: 2px solid var(--brand-1);
  outline-offset: -2px;
}
.application-icon {
  flex: none;
}
.application-name {
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.application-name--searching {
  color: var(--text-1);
}
.application-detail {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  padding: 0;
  overflow: hidden;
}
.application-detail-scrollbar {
  flex: 1;
  height: auto;
  min-height: 0;
}
.permission-tabs :deep(.application-detail-scrollbar > .el-scrollbar__wrap > .el-scrollbar__view) {
  display: flex;
  flex-direction: column;
  height: 100%;
  box-sizing: border-box;
  padding: var(--spacing-xl);
}
.application-detail-scrollbar :deep(.application-heading),
.application-detail-scrollbar :deep(.permission-type-toolbar) {
  flex-shrink: 0;
}
.application-table {
  flex: 1;
  min-height: 0;
}
.application-heading {
  align-items: flex-start;
  margin-bottom: var(--spacing-lg);
  flex-wrap: wrap;
}
.application-heading-copy {
  flex: 1 1 260px;
  min-width: 0;
}
.permission-group-form {
  flex: none;
}
.permission-group-form :deep(.el-form-item) {
  margin: 0;
}
.permission-group-form :deep(.el-form-item__label) {
  height: var(--permission-control-height);
  line-height: var(--permission-control-height);
  padding-right: var(--spacing-sm);
}
.permission-group-select {
  width: 176px;
}
.permission-type-toolbar {
  margin-bottom: var(--spacing-lg);
  flex-wrap: wrap;
}
.permission-type-control {
  --el-border-radius-base: var(--radius-sm);
  --el-segmented-padding: var(--spacing-xs);
  --el-segmented-color: var(--text-3);
  --el-segmented-bg-color: var(--fill-2);
  --el-segmented-item-selected-color: var(--text-1);
  --el-segmented-item-selected-bg-color: var(--fill-1);
  --el-segmented-item-hover-color: var(--text-1);
  --el-segmented-item-hover-bg-color: var(--fill-3);
  --el-segmented-item-active-bg-color: var(--fill-3);
  height: var(--permission-control-height);
  min-height: var(--permission-control-height);
  max-width: 100%;
  font-size: var(--font-size-md);
}
.permission-type-control :deep(.el-segmented__item) {
  min-width: 0;
  padding: 0 var(--spacing-lg);
  border-radius: var(--radius-sm);
}
.permission-type-control :deep(.el-segmented__item-selected) {
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-sm);
}
.permission-type-control :deep(.el-segmented__item-selected.is-focus-visible::before) {
  outline-color: var(--brand-5);
}
.menu-role-panel {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  border: 1px solid var(--border-2);
  border-radius: var(--radius-md);
}
.menu-role-scrollbar {
  flex: 1;
  min-height: 0;
}
.menu-role-scrollbar :deep(.el-scrollbar__view) {
  min-height: 100%;
  padding: var(--spacing-sm);
}
.menu-tree-content {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
  gap: var(--spacing-lg);
}
.menu-tree-content > .el-input {
  flex-shrink: 0;
}
.menu-tree-panel {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  border: 1px solid var(--border-2);
  border-radius: var(--radius-md);
}
.menu-tree-scrollbar {
  flex: 1;
  min-height: 0;
}
.menu-tree-scrollbar :deep(.el-scrollbar__view) {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  padding: var(--spacing-sm);
}
.menu-permission-tree {
  --el-tree-node-content-height: var(--builder-row-height);
  --el-tree-node-hover-bg-color: var(--fill-2);
  --el-tree-text-color: var(--text-1);
  flex: 1;
}
.menu-permission-tree :deep(.el-tree__empty-block) {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.menu-tree-search-empty {
  --el-empty-description-margin-top: var(--spacing-sm);
  padding: 0;
}
.menu-tree-search-empty :deep(.el-empty__image) {
  height: 64px;
  flex-shrink: 0;
}
.menu-tree-search-empty :deep(.el-empty__description p) {
  color: var(--text-1);
}
.menu-permission-tree :deep(.el-tree-node__content) {
  border-radius: var(--radius-sm);
}
.menu-permission-tree :deep(.el-tree-node:focus > .el-tree-node__content:not(:hover)) {
  background-color: transparent;
}
.menu-permission-tree :deep(.el-tree-node:focus-visible > .el-tree-node__content) {
  outline: 2px solid var(--brand-5);
  outline-offset: -2px;
}
.menu-permission-tree :deep(.el-tree-node__expand-icon:not(.is-leaf)) {
  color: var(--text-1);
}
.menu-tree-node {
  display: flex;
  flex: 1;
  min-width: 0;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--text-1);
}
.menu-tree-node-icon {
  flex-shrink: 0;
}
.menu-tree-node-label {
  min-width: 0;
  white-space: normal;
  overflow-wrap: anywhere;
}
.menu-search-hit,
.application-search-hit {
  color: var(--brand-1);
}
.full {
  width: 100%;
}
@media (max-width: 1100px) {
  .application-sidebar {
    width: 216px;
  }
  .permission-tabs
    :deep(.application-detail-scrollbar > .el-scrollbar__wrap > .el-scrollbar__view) {
    padding: var(--spacing-lg);
  }
}
@media (max-width: 1100px) {
  .permission-workspace {
    flex-direction: column;
  }
  .application-sidebar {
    flex: none;
    width: 100%;
    border-right: none;
    border-bottom: 1px solid var(--border-1);
  }
  .application-scrollbar {
    flex: none;
    max-height: 144px;
  }
  .application-scrollbar :deep(.el-scrollbar__wrap) {
    max-height: 144px;
  }
  .application-heading-copy {
    flex-basis: 200px;
  }
}
@media (max-width: 640px) {
  .application-mobile-select {
    display: block;
    width: 100%;
  }
  .application-search,
  .application-scrollbar {
    display: none;
  }
  .permission-tabs :deep(.el-tabs__header) {
    margin-bottom: var(--spacing-lg);
  }
  .application-heading {
    gap: var(--spacing-lg);
  }
  .permission-group-form {
    width: 100%;
  }
  .permission-group-form :deep(.el-form-item) {
    display: flex;
  }
  .permission-group-form :deep(.el-form-item__content) {
    flex: 1;
    min-width: 0;
  }
  .permission-group-select {
    width: 100%;
  }
  .permission-type-control {
    width: 100%;
  }
  .permission-type-control :deep(.el-segmented__item) {
    padding-inline: 0;
  }
}
</style>
