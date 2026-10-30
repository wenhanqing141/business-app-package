<template>
  <div class="portal-page ai-surface-page" v-loading="loading">
    <!-- 顶部：包名 + 右上角用户 / 角色切换 -->
    <header class="portal-header">
      <div class="left">
        <AppIcon :size="28" style="color: #ff8333" name="应用" />
        <span class="pkg-name">{{ summary.pkgName }}</span>
      </div>
      <div class="header-right">
        <el-dropdown trigger="click" @command="onUserCommand">
          <span class="user-chip">
            <el-avatar :size="30">{{ user.name?.charAt(0) }}</el-avatar>
            <span class="user-name">{{ user.name }}</span>
            <el-tag size="small" type="primary" effect="plain" class="role-tag">{{
              activeRoleName
            }}</el-tag>
            <el-icon><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <div class="role-header">切换角色（包内配权 ∩ 本人拥有）</div>
              <el-dropdown-item v-for="r in roles" :key="r.id" :command="'role:' + r.id">
                <el-icon><UserFilled /></el-icon>
                {{ r.name }}
                <el-icon v-if="r.id === activeRole" class="check-icon"><Check /></el-icon>
              </el-dropdown-item>
              <el-dropdown-item divided command="nav-home">
                <AppIcon name="左" :size="18" />返回应用包管理
              </el-dropdown-item>
              <el-dropdown-item class="is-danger" command="logout">
                <el-icon><SwitchButton /></el-icon>退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </header>

    <div class="portal-main">
      <!-- 左：全部分组应用（PRD 5.20）；分组样式与搭建页左栏一致，不再显示「全部应用」标题 -->
      <aside class="portal-aside">
        <div class="aside-tree">
          <!-- 根容器：根分组与未分组应用按统一 sort 混合渲染，顺序与搭建台排序结果一致 -->
          <PortalMenuNode
            :group="null"
            :all-groups="groups"
            :apps-map="appsMap"
            :selected-id="selectedId"
            @select="selectApp"
          />
          <el-empty
            v-if="summary.noPermission"
            description="当前角色未被授予任何应用权限"
            :image-size="72"
          />
        </div>
      </aside>

      <!-- 右：应用页（默认第一分组第一个应用） -->
      <section class="portal-content">
        <AppPreview :app="selectedApp" />
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { fetchPortalSummary } from '@/api/portal'
import AppPreview from '@/components/builder/AppPreview.vue'
import PortalMenuNode from '@/components/portal/PortalMenuNode.vue'
import AppIcon from '@/components/icons/AppIcon.vue'

const router = useRouter()
const loading = ref(false)
const activeRole = ref('')
const summary = reactive({
  pkgName: '',
  groups: [],
  apps: [],
  roles: [],
  user: {},
  noPermission: false,
  defaultGroupId: '',
  defaultAppId: ''
})
const selectedId = ref('')

const user = computed(() => summary.user)
const roles = computed(() => summary.roles)
const groups = computed(() => summary.groups)

// 以容器 id 为键（根容器 = ''），PortalMenuNode 内与同容器子分组按统一 sort 混排
const appsMap = computed(() => {
  const map = {}
  for (const a of summary.apps) (map[a.groupId || ''] = map[a.groupId || ''] || []).push(a)
  return map
})

const selectedApp = computed(() => {
  const a = summary.apps.find((x) => x.id === selectedId.value)
  // AppPreview 需要 viewMode 字段（前台应用统一为 front）
  return a ? { viewMode: 'front', ...a } : null
})
const activeRoleName = computed(
  () => roles.value.find((r) => r.id === activeRole.value)?.name || ''
)

async function load(role) {
  loading.value = true
  try {
    const data = await fetchPortalSummary(role)
    Object.assign(summary, data)
    activeRole.value = data.activeRole
    selectedId.value = data.defaultAppId || ''
  } finally {
    loading.value = false
  }
}

function selectApp(app) {
  if (app.engine === 'url' && app.url) {
    window.open(app.url, '_blank', 'noopener')
    return
  }
  selectedId.value = app.id
}

function onUserCommand(cmd) {
  if (cmd.startsWith('role:')) {
    const roleId = cmd.slice(5)
    load(roleId)
  } else if (cmd === 'logout') {
    logout()
  } else if (cmd === 'nav-home') {
    router.push('/package/manage')
  }
}

// 退出登录：确认后写退出标记并跳前台登录页；标记存在期间直接访问 / 浏览器后退回前台均被路由守卫拦截（PRD 5.21）
async function logout() {
  try {
    await ElMessageBox.confirm('退出后需重新登录才能访问应用包前台，确认退出登录？', '退出登录', {
      confirmButtonText: '退出登录',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch {
    return // 用户取消
  }
  sessionStorage.setItem('portal-logged-out', '1')
  router.push({ path: '/portal/login', query: { loggedout: '1' } })
}

onMounted(() => load())
</script>

<style scoped>
/* 配色与搭建页统一：页面 / 顶栏 / 左栏同为 #F5F8FF，不画 1px 分隔线 */
.portal-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--page-bg);
}
/* 高度与搭建页顶栏一致（64px） */
.portal-header {
  height: 64px;
  flex-shrink: 0;
  background: var(--brand-8);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 18px;
}
.left {
  display: flex;
  align-items: center;
  gap: 9px;
}
.pkg-name {
  font-size: 16px;
  font-weight: 700;
}
.user-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  outline: none;
}
.user-name {
  font-size: 13px;
}
.role-tag {
  transform: scale(0.92);
}
.role-header {
  font-size: 12px;
  color: #57585e;
  padding: 6px 14px;
}
.check-icon {
  margin-left: auto;
  color: #0047ff;
}

.portal-main {
  flex: 1;
  display: flex;
  min-height: 0;
}
.portal-aside {
  width: 240px;
  flex-shrink: 0;
  background: var(--brand-8);
  display: flex;
  flex-direction: column;
}
/* 树区左右 16px、行宽 208px，与搭建页左栏一致 */
.aside-tree {
  flex: 1;
  overflow: auto;
  padding: 16px 16px 12px;
}
/* 右侧面板贴齐顶栏与左栏，右 / 下留 16px——与搭建页预览面板同一形态 */
.portal-content {
  flex: 1;
  min-width: 0;
  padding: 0 16px 16px 0;
}
.portal-content :deep(> div) {
  height: 100%;
  background: var(--fill-1);
  border: 1px solid var(--border-2);
  border-radius: var(--builder-panel-radius);
  overflow: hidden;
}

/* 顶栏右侧：用户信息 */
.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>
