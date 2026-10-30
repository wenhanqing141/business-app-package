import { createRouter, createWebHashHistory } from 'vue-router'

const NotFound = () => import('@/views/NotFound.vue')

// === 演示终端 1：微服务应用管理（PC 管理后台入口） ===
const AppManage = () => import('@/views/msa/AppManage.vue')

// === 业务应用包管理（PRD v3.0 模块十四：本期新增的应用包统一入口） ===
const PackageManage = () => import('@/views/package/PackageManage.vue')
// 超星 passport 登录页（Demo 模拟；退出登录 / 未登录访问应用包管理时跳转）
const PassportLogin = () => import('@/views/portal/PassportLogin.vue')

// === 演示终端 2：业务应用包搭建侧 ===
// AI 创建（对话方式创建业务系统，能力已上线；Demo 为模拟对话）
const AiCreate = () => import('@/views/builder/AiCreate.vue')
// 搭建工作台（线框 1：全屏，顶栏 + 分组菜单 + 功能预览区）
const PackageHome = () => import('@/views/builder/PackageHome.vue')
// 应用后台（线框 4：独立全屏布局，左设置导航 + 右配置显示区）
const BuilderAdminLayout = () => import('@/layouts/BuilderAdminLayout.vue')
const PackageBaseInfo = () => import('@/views/builder/admin/PackageBaseInfo.vue')
const PermissionSetting = () => import('@/views/builder/admin/PermissionSetting.vue')
const AggregateTable = () => import('@/views/builder/admin/AggregateTable.vue')
const BusinessFlow = () => import('@/views/builder/admin/BusinessFlow.vue')
const DataFactory = () => import('@/views/builder/admin/DataFactory.vue')

// === 演示终端 3：业务应用包前台（PC·用户侧） ===
// 前台沿用搭建工作台的布局；PackageHome 会按 PortalHome 路由进入只读模式。
const PortalHome = () => import('@/views/builder/PackageHome.vue')
// 前台退出登录后的登录占位页（纯 Mock；真实环境沿用微服务统一登录页）
const PortalLogin = () => import('@/views/portal/PortalLogin.vue')

// 前台登录态：sessionStorage 中存在退出标记即视为未登录（关闭标签页自动清除）
const PORTAL_AUTH_KEY = 'portal-logged-out'
const requirePortalAuth = () => {
  if (sessionStorage.getItem(PORTAL_AUTH_KEY)) return { path: '/portal/login' }
  return true
}

// 业务应用包管理登录态（PRD v3.0 模块十四）：退出登录后有标记；
// **未登录 / 登录态失效时自动跳转 passport 登录页，登录成功后回跳本页**
const PKG_AUTH_KEY = 'pkg-logged-out'
const requirePkgAuth = (to) => {
  if (sessionStorage.getItem(PKG_AUTH_KEY)) {
    return {
      path: '/passport/login',
      query: { redirect: to.fullPath, loggedout: '1' }
    }
  }
  return true
}

export const staticRoutes = [
  { path: '/', redirect: '/package/manage' },
  // 兼容旧演示导航链接；导航首页已移除。
  { path: '/home', redirect: '/package/manage' },
  // === 微服务应用管理（独立页面） ===
  {
    path: '/msa/app-manage',
    name: 'AppManage',
    component: AppManage,
    meta: { title: '微服务应用管理' }
  },
  // === 业务应用包管理（本期新入口：顶栏 + 单位切换 + 应用包卡片列表） ===
  {
    path: '/package/manage',
    name: 'PackageManage',
    component: PackageManage,
    meta: { title: '业务应用包' },
    beforeEnter: requirePkgAuth
  },
  // 超星 passport 登录页（Demo 模拟）
  {
    path: '/passport/login',
    name: 'PassportLogin',
    component: PassportLogin,
    meta: { title: '统一身份认证' }
  },
  // 原创建向导入口已取消（PRD v3.0：创建方式选择并入应用包管理页的「新建应用包」弹窗），旧链接重定向
  { path: '/builder/wizard', redirect: '/package/manage' },
  // AI 创建：对话生成业务系统，完成后进入搭建侧
  {
    path: '/builder/ai-create',
    name: 'AiCreate',
    component: AiCreate,
    meta: { title: 'AI 创建业务系统' }
  },
  // === 搭建工作台（独立全屏页面，线框 1–3） ===
  {
    path: '/builder/home',
    name: 'PackageHome',
    component: PackageHome,
    meta: { title: '应用包搭建工作台' }
  },
  // === 应用后台（独立全屏布局，线框 4–9） ===
  {
    path: '/builder/admin',
    component: BuilderAdminLayout,
    redirect: '/builder/admin/base-info',
    children: [
      {
        path: 'base-info',
        name: 'AdminBaseInfo',
        component: PackageBaseInfo,
        meta: { title: '应用包基础信息' }
      },
      {
        path: 'permission',
        name: 'AdminPermission',
        component: PermissionSetting,
        meta: { title: '权限设置' }
      },
      {
        path: 'aggregate-table',
        name: 'AdminAggregate',
        component: AggregateTable,
        meta: { title: '聚合表' }
      },
      {
        path: 'business-flow',
        name: 'AdminFlow',
        component: BusinessFlow,
        meta: { title: '业务流' }
      },
      {
        path: 'data-factory',
        name: 'AdminFactory',
        component: DataFactory,
        meta: { title: '数据工厂' }
      }
      // 2026-10-11 本版：原 ai-builder（业务维护AI助手）路由已去掉
    ]
  },
  // === 业务应用包前台（独立全屏页面） ===
  {
    path: '/portal',
    name: 'PortalHome',
    component: PortalHome,
    meta: { title: '业务应用包前台' },
    // 退出登录后访问 / 浏览器后退回前台：拦截到登录页（PRD 5.21）
    beforeEnter: requirePortalAuth
  },
  {
    path: '/portal/login',
    name: 'PortalLogin',
    component: PortalLogin,
    meta: { title: '前台登录' }
  },
  { path: '/404', name: 'NotFound', component: NotFound, meta: { title: '页面不存在' } },
  { path: '/:pathMatch(.*)*', redirect: '/404' }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes: staticRoutes
})

export default router
