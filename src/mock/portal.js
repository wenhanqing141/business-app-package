// 前台 Mock（PRD 5.20：左侧全部分组应用，右侧应用页，默认打开第一分组第一个应用；右上角角色切换）
import { GROUPS, APPS, USER_MANAGE_ROLES, PERMISSIONS, PORTAL_USER, ENGINE_MAP } from './pkgSeed'
import { normalizeContainerSort } from './appPackage'

// 某角色对某应用的最终菜单权限：应用独立配置优先于包权限
function appPerm(permission, appId) {
  if (!permission) return 'none'
  const override = permission.apps[appId]
  return override !== undefined ? override : permission.pkg
}

export default [
  {
    url: '/api/portal/summary',
    method: 'get',
    response: ({ query }) => {
      // 未先访问搭建台时保证种子数据已合并为容器统一 sort，混排顺序才不会错位
      normalizeContainerSort()
      const activeRole = query.role || PORTAL_USER.ownedRoles[0]
      const permission = PERMISSIONS.find((p) => p.roleId === activeRole)

      // 可切换角色 = 应用包中配置过权限 ∩ 当前用户拥有的角色（学生角色未配权，不出现）
      const switchableRoles = USER_MANAGE_ROLES.filter(
        (r) => PORTAL_USER.ownedRoles.includes(r.id) && PERMISSIONS.some((p) => p.roleId === r.id)
      ).map((r) => ({ id: r.id, name: r.name, members: r.members }))

      // 可见应用：① 有权限（visible/editable）② 前台应用（已转为「应用后台」的表单/审批/报告不出现在用户前台）
      const visibleApps = APPS.filter(
        (a) => a.viewMode !== 'back' && ['visible', 'editable'].includes(appPerm(permission, a.id))
      ).map((a) => ({
        id: a.id,
        name: a.name,
        engine: a.engine,
        url: a.url || '',
        groupId: a.groupId,
        // 与同容器子分组共用的统一排序序号，前台按其混合渲染
        sort: a.sort,
        engineLabel: ENGINE_MAP[a.engine].label,
        engineIcon: ENGINE_MAP[a.engine].icon,
        engineColor: ENGINE_MAP[a.engine].color,
        editable: appPerm(permission, a.id) === 'editable'
      }))

      // 仅保留含可见应用的分组（含其祖先链），保持 GROUPS 原有排序
      const usedIds = new Set()
      for (const a of visibleApps) {
        let gid = a.groupId
        while (gid) {
          usedIds.add(gid)
          const g = GROUPS.find((x) => x.id === gid)
          gid = g ? g.parentId : null
        }
      }
      const visibleGroups = GROUPS.filter((g) => usedIds.has(g.id)).map((g) => ({ ...g }))

      // 默认打开：根容器统一序列中的第一个可见应用（根级应用可排在根分组之前；分组按其展开序列深度优先）
      const firstAppInContainer = (containerId) => {
        const nodes = [
          ...visibleGroups.filter((g) => (g.parentId || null) === containerId).map((ref) => ({ kind: 'group', ref })),
          ...visibleApps.filter((a) => (a.groupId || null) === containerId).map((ref) => ({ kind: 'app', ref }))
        ].sort((x, y) => (x.ref.sort ?? 0) - (y.ref.sort ?? 0))
        for (const n of nodes) {
          if (n.kind === 'app') return n.ref
          const inSub = firstAppInContainer(n.ref.id)
          if (inSub) return inSub
        }
        return null
      }
      const firstGroup = visibleGroups.find((g) => g.parentId === null) || visibleGroups[0]
      const defaultApp = firstAppInContainer(null)

      return {
        code: 0,
        data: {
          user: { ...PORTAL_USER },
          activeRole,
          roles: switchableRoles,
          pkgName: '校园后勤管理',
          groups: visibleGroups,
          apps: visibleApps,
          defaultGroupId: firstGroup?.id || null,
          defaultAppId: defaultApp?.id || null,
          noPermission: visibleApps.length === 0
        },
        message: 'ok'
      }
    }
  }
]
