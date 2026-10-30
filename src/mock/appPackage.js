// 微服务应用管理 + 业务应用包搭建工作台 / 应用后台 接口（PRD v1.0 + 九张线框图）
import {
  PACKAGES, MSA_APPS, GROUPS, APPS, USER_MANAGE_ROLES, PERMISSIONS,
  PERMISSION_GROUPS, MARKET_APPS, AGGREGATE_TABLES, BUSINESS_FLOWS,
  DATA_FLOWS, SYNC_TABLES, ENGINE_MAP, BACKEND_CONVERTIBLE, PERM_GROUP_REQUIRED,
  UNITS, CURRENT_USER
} from './pkgSeed'

function pad(n) { return String(n).padStart(2, '0') }
function formatNow() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

let pkgSeq = 100
let groupSeq = 100
let appSeq = 100
let agSeq = 100
let bfSeq = 100
let dfSeq = 100

// 默认演示包为 pkg-1；其他应用包复用同一套菜单演示数据，但各自维护版本号。
const PKG_ID = 'pkg-1'
const PKG_NAME = '校园后勤管理'

/**
 * 入口（菜单项）id 与 应用身份 appId 分离（2026-10-11，PRD v2.7 模块五 / 模块十三）：
 * 同一应用允许在包内出现多个入口（多分组、前后台两形态并存），故 `id` 是「入口」的唯一标识、
 * `appId` 才是「应用」的身份；1:1 的种子数据两者相同。
 * 删除按入口、应用权限与引用关系按 appId。
 */
function appEntry(a) {
  return a.appId ? a : { ...a, appId: a.id }
}

// 应用权限组（按应用隔离；首次访问时用默认模板初始化）
const appPermStore = {}
function cloneDefaultGroup() {
  return JSON.parse(JSON.stringify(PERMISSION_GROUPS[0]))
}
function getAppPermGroup(appId) {
  if (!appPermStore[appId]) appPermStore[appId] = cloneDefaultGroup()
  return appPermStore[appId]
}

// 菜单权限（勾选式）：仅记录"已配置角色"及其勾选的**入口 id**（2026-10-11：按入口逐条勾选，不去重）；点「确定」保存即生效
const menuRoleStore = {}
const menuConfiguredRoles = []
PERMISSIONS.forEach((p) => {
  menuConfiguredRoles.push(p.roleId)
  menuRoleStore[p.roleId] = Object.keys(p.apps).filter(
    (id) => ['visible', 'editable'].includes(p.apps[id])
  )
})
// 勾选结果同步回旧权限模型（checked → visible），供前台 portal 过滤消费
function syncPermissionsLegacy() {
  for (const roleId of Object.keys(menuRoleStore)) {
    const exist = PERMISSIONS.find((p) => p.roleId === roleId)
    const target = exist || { roleId, pkg: 'none', apps: {} }
    target.pkg = 'none'
    target.apps = {}
    menuRoleStore[roleId].forEach((id) => { target.apps[id] = 'visible' })
    if (!exist) PERMISSIONS.push(target)
  }
}

// 2026-10-11 本版：业务维护 AI 助手整体去掉，原 aiConfigStore（知识库 / MCP / 数据范围）一并移除

// ========== 并发修改的版本校验（PRD 模块十一，2026-10-11） ==========
// 版本号：从 '0.0' 起、每次保存成功递增一次；写操作校验「客户端持有版本」与「库中版本」是否一致，
// 不一致返回 code 4090（前端据此弹窗「当前应用包版本过低，请刷新页面后重试！」）。
function bumpVersion(pkg) {
  const [major, minor] = String(pkg.version || '0.0').split('.').map(Number)
  pkg.version = `${major}.${minor + 1}`
  return pkg.version
}

function packageFromRequest(ctx = {}) {
  const packageId =
    (ctx.body && ctx.body.__pkgId) || (ctx.query && ctx.query.__pkgId) || PKG_ID
  return PACKAGES.find((p) => p.id === packageId) || PACKAGES.find((p) => p.id === PKG_ID)
}

/** 需要版本校验的写端点（覆盖 PRD 模块十一列出的全部落库改动，以及应用包删除） */
const VERSION_GUARDED = [/^\/api\/builder\//, /^\/api\/msa\/package\/\w+$/]

/**
 * 给写端点套一层版本校验：客户端在 payload（或 query）里带 `__pkgVersion`；
 * 校验通过 → 执行原逻辑 → 成功后递增版本。不带 `__pkgVersion` 的请求（如新建应用包）跳过校验。
 */
function withVersionGuard(list) {
  return list.map((ep) => {
    if (String(ep.method || 'get').toLowerCase() === 'get') return ep
    if (!VERSION_GUARDED.some((re) => re.test(ep.url))) return ep
    const raw = ep.response
    return {
      ...ep,
      response: (ctx) => {
        const pkg = packageFromRequest(ctx)
        const held = (ctx.body && ctx.body.__pkgVersion) || (ctx.query && ctx.query.__pkgVersion)
        if (pkg && held && held !== (pkg.version || '0.0')) {
          return { code: 4090, data: null, message: '当前应用包版本过低，请刷新页面后重试！' }
        }
        const res = raw(ctx)
        if (pkg && res && res.code === 0) bumpVersion(pkg)
        return res
      }
    }
  })
}

const endpoints = [
  // ========== 微服务应用管理 ==========

  // 应用管理列表（2026-10-11 调整）：**只列应用**——业务应用包既不由微服务创建、也不列入本列表（PRD v3.0 R30），
  // 其创建与管理由「业务应用包管理」页面承担（模块十四）
  {
    url: '/api/msa/list',
    method: 'get',
    response: () => {
      // 2026-10-11（PRD v3.0 R30）：业务应用包**不再列入**微服务应用管理列表，该页只列「应用」
      return { code: 0, data: MSA_APPS.map((a) => ({ ...a, type: 'app' })), message: 'ok' }
    }
  },

  // 新建业务应用包（由「业务应用包管理」页面调起，PRD v3.0 模块十四）
  {
    url: '/api/msa/package',
    method: 'post',
    response: ({ body }) => {
      if (!body || !body.name || !body.name.trim()) {
        return { code: 1002, data: null, message: '应用包名称必填' }
      }
      const pkg = {
        id: `pkg-${++pkgSeq}`,
        name: body.name.trim().slice(0, 30),
        desc: (body.desc || '').slice(0, 200),
        icon: body.icon || { presetId: 'ic-box', custom: null },
        appId: `${Math.random().toString(16).slice(2, 12)}ff144e000${Math.random().toString(16).slice(2, 7)}`,
        homePage: '',
        customUrl: '',
        fid: body.fid || CURRENT_USER.fid, // 归属创建时的当前单位
        version: '0.0', // 版本号从 0.0 起
        createdAt: formatNow(),
        creator: CURRENT_USER.name
      }
      PACKAGES.push(pkg)
      return { code: 0, data: pkg, message: 'ok' }
    }
  },


  // ========== 业务应用包管理（PRD v3.0 模块十四） ==========

  // 当前用户可管理的单位列表（仅超管单位；由微服务现有接口返回，Demo 用 UNITS 模拟）
  {
    url: '/api/pkg/units',
    method: 'get',
    response: () => {
      const units = UNITS.filter((u) => u.isSuperAdmin)
      return {
        code: 0,
        data: {
          user: { ...CURRENT_USER },
          current: CURRENT_USER.fid,
          units: units.map((u) => ({ fid: u.fid, name: u.name })),
          // 当前用户不是任一单位超管 → 前端展示「无管理权限」缺省页
          hasManageRight: units.length > 0
        },
        message: 'ok'
      }
    }
  },

  // 当前编辑中的应用包版本（写操作成功后，客户端据此刷新自己持有的版本号，避免二次保存误判）
  {
    url: '/api/pkg/version',
    method: 'get',
    response: (ctx) => {
      const pkg = packageFromRequest(ctx)
      return { code: 0, data: { id: pkg ? pkg.id : null, version: pkg ? pkg.version : null }, message: 'ok' }
    }
  },

  // 某单位下已创建的业务应用包列表（最新在前）
  {
    url: '/api/pkg/list',
    method: 'get',
    response: ({ query }) => {
      const fid = query.fid || CURRENT_USER.fid
      const list = PACKAGES.filter((p) => (p.fid || CURRENT_USER.fid) === fid)
        .map((p) => ({ ...p, appCount: APPS.length }))
        .reverse()
      return { code: 0, data: list, message: 'ok' }
    }
  },

  // 删除业务应用包（仅删外层框架；「完整输入名称」由前端校验）
  {
    url: '/api/pkg/:id',
    method: 'delete',
    response: ({ query }) => {
      const idx = PACKAGES.findIndex((p) => p.id === query.id)
      if (idx === -1) return { code: 404, data: null, message: '应用包不存在或已被删除' }
      PACKAGES.splice(idx, 1)
      return {
        code: 0,
        data: { keptApps: APPS.length },
        message: '已删除该业务应用包；包内应用保留在微服务应用市场'
      }
    }
  },

  // 删除应用包（仅删外层框架——分组/菜单/权限等包级组织关系，不删除绑定应用，应用保留在市场）
  {
    url: '/api/msa/package/:id',
    method: 'delete',
    response: ({ query }) => {
      const idx = PACKAGES.findIndex((p) => p.id === query.id)
      if (idx === -1) return { code: 404, data: null, message: '应用包不存在' }
      PACKAGES.splice(idx, 1)[0]
      return {
        code: 0,
        data: {
          id: query.id,
          keptApps: APPS.length,
          message: '已删除应用包框架（分组、菜单、权限配置）；包内应用已解除绑定，全部保留在应用市场'
        },
        message: 'ok'
      }
    }
  },

  // ========== 搭建工作台 ==========

  // 工作台详情（分组 / 应用为演示共用数据；2026-10-11 起支持按 pkgId 打开其他演示包）
  {
    url: '/api/builder/detail',
    method: 'get',
    response: ({ query }) => {
      // 首次加载时把旧的分组 / 应用双序列 sort 规范化为容器内统一序列（混合排序）
      normalizeContainerSort()
      const target = PACKAGES.find((p) => p.id === query.pkgId) || PACKAGES.find((p) => p.id === PKG_ID) || PACKAGES[0]
      return {
      code: 0,
      data: {
        pkg: { ...target, appCount: APPS.length },
        groups: GROUPS.map((g) => ({ ...g })),
        apps: APPS.map((a) => appEntry({ ...a, engineLabel: ENGINE_MAP[a.engine].label })),
        roles: USER_MANAGE_ROLES.map((r) => ({ ...r })),
        permissions: PERMISSIONS.map((p) => ({ roleId: p.roleId, pkg: p.pkg, apps: { ...p.apps } })),
        // 仅返回「本应用包中创建过的应用」供「添加已有应用」选择（2026-10-11，PRD v2.7）
        marketApps: MARKET_APPS.filter((m) => m.from === PKG_NAME).map((m) => ({ ...m }))
      },
      message: 'ok'
      }
    }
  },

  // （原「发布应用包」端点已移除：2026-10-11 起包级发布废止，应用包创建完成即自动生效并入应用管理）

  // 修改应用包基础信息（名称不校验重名；自定义图标 PNG/JPG、≤1MB 由前端校验）
  {
    url: '/api/builder/package',
    method: 'put',
    response: (ctx) => {
      const { body } = ctx
      const pkg = packageFromRequest(ctx)
      if (body.name !== undefined) pkg.name = body.name.slice(0, 30) || '未命名业务应用包'
      if (body.desc !== undefined) pkg.desc = body.desc.slice(0, 200)
      if (body.icon !== undefined) pkg.icon = body.icon
      if (body.homePage !== undefined) pkg.homePage = body.homePage
      if (body.customUrl !== undefined) pkg.customUrl = body.customUrl
      return { code: 0, data: { ...pkg }, message: 'ok' }
    }
  },

  // 新建分组 / 子分组
  {
    url: '/api/builder/group',
    method: 'post',
    response: ({ body }) => {
      // 分组层级上限 5 级（G1）
      let depth = 1
      let p = GROUPS.find((g) => g.id === body.parentId)
      while (p) {
        depth++
        p = GROUPS.find((g) => g.id === p.parentId)
      }
      if (depth > 5) {
        return { code: 1003, data: null, message: '分组层级已达上限（5 级）' }
      }
      const parentId = body.parentId || null
      const g = {
        id: `g-${++groupSeq}`,
        parentId,
        name: (body.name || '新建分组').slice(0, 20),
        // 新建分组追加到容器（父分组 / 根级）节点序列末尾，与直属应用共用 sort 空间
        sort: containerNodeCount(parentId)
      }
      GROUPS.push(g)
      return { code: 0, data: g, message: 'ok' }
    }
  },

  // 分组排序 / 移动（拖拽；批量提交全量分组顺序，父分组变更时校验环路与 5 级上限 G1）
  {
    url: '/api/builder/group/sort',
    method: 'put',
    response: ({ body }) => {
      const items = body.groups || []
      for (const it of items) {
        const g = GROUPS.find((x) => x.id === it.id)
        if (!g) continue
        const newParentId = it.parentId || null
        if (g.parentId === newParentId) continue
        if (newParentId) {
          // 环路：新父分组不能是自身或自己的子孙
          let cur = GROUPS.find((x) => x.id === newParentId)
          let guard = 0
          while (cur && guard++ < 50) {
            if (cur.id === it.id) {
              return { code: 1016, data: null, message: '不能将分组拖入其自身或子分组' }
            }
            cur = GROUPS.find((x) => x.id === cur.parentId)
          }
          // 层级：新父级深度（顶级为 0）+ 被拖子树高度 ≤ 5
          let parentDepth = 0
          cur = GROUPS.find((x) => x.id === newParentId)
          while (cur && parentDepth < 50) {
            parentDepth++
            cur = GROUPS.find((x) => x.id === cur.parentId)
          }
          if (parentDepth + groupSubtreeHeight(it.id) > 5) {
            return { code: 1003, data: null, message: '分组层级已达上限（5 级），无法拖入' }
          }
        }
      }
      for (const it of items) {
        const g = GROUPS.find((x) => x.id === it.id)
        if (g) {
          g.parentId = it.parentId || null
          g.sort = Number.isInteger(it.sort) ? it.sort : 0
        }
      }
      return { code: 0, data: true, message: '分组排序已保存' }
    }
  },

  // 重命名分组
  {
    url: '/api/builder/group/rename',
    method: 'put',
    response: ({ body }) => {
      const g = GROUPS.find((x) => x.id === body.id)
      if (!g) return { code: 404, data: null, message: '分组不存在' }
      g.name = (body.name || '').slice(0, 20)
      return { code: 0, data: g, message: 'ok' }
    }
  },

  // 删除分组（非空分组删除时，组内应用（含子分组）同步从包中移除，应用保留在市场）
  {
    url: '/api/builder/group/:id',
    method: 'delete',
    response: ({ query }) => {
      const ids = collectGroupIds(query.id)
      if (!ids.length) return { code: 404, data: null, message: '分组不存在' }
      const removedApps = APPS.filter((a) => ids.includes(a.groupId)).map((a) => ({ id: a.id, name: a.name }))
      for (const id of ids) {
        const gi = GROUPS.findIndex((g) => g.id === id)
        if (gi !== -1) GROUPS.splice(gi, 1)
      }
      for (const a of removedApps) {
        const ai = APPS.findIndex((x) => x.id === a.id)
        if (ai !== -1) APPS.splice(ai, 1)
      }
      return {
        code: 0,
        data: { removedGroupIds: ids, removedApps, keptInMarket: true, message: '组内应用入口已随分组一并移除；应用保留在微服务应用市场，可由本应用包重新添加' },
        message: 'ok'
      }
    }
  },

  // 添加已有应用（2026-10-11 调整，PRD v2.7 模块五）
  // ① 范围仅限「本应用包中创建过的应用」（不含应用管理中创建的应用，不再跨包复用）；
  // ② 允许同一应用在包内出现多个入口（多分组 / 前后台两形态并存）——每次添加新建一条入口记录；
  // ③ 表单 / 审批必须由用户显式指定前台 / 后台形态，不设默认值。
  {
    url: '/api/builder/app/existing',
    method: 'post',
    response: ({ body }) => {
      const market = MARKET_APPS.find((m) => m.id === body.appId)
      if (!market) return { code: 404, data: null, message: '应用不存在或已下架' }
      if (market.from !== PKG_NAME) {
        return { code: 1014, data: null, message: '仅支持添加本应用包中创建过的应用，应用管理中创建的应用不可加入' }
      }
      const needMode = PERM_GROUP_REQUIRED.includes(market.engine)
      if (needMode && !['front', 'back'].includes(body.displayMode)) {
        return { code: 1015, data: null, message: '表单 / 审批需先选择前台或后台形态' }
      }
      const toBack = needMode && body.displayMode === 'back'
      const app = {
        id: `app-${++appSeq}`, // 入口（菜单项）id：同一应用多入口时各自唯一
        appId: market.id, // 应用身份：同一应用的全部入口共用
        engine: market.engine,
        name: market.name,
        groupId: body.groupId || null,
        sort: containerNodeCount(body.groupId || null),
        status: 'published',
        viewMode: toBack ? 'back' : 'front',
        permGroupName: toBack ? PERMISSION_GROUPS[0].name : undefined,
        updatedAt: formatNow(),
        refs: []
      }
      APPS.push(app)
      return { code: 0, data: appEntry(app), message: 'ok' }
    }
  },

  // 添加审批助手（每包唯一；数据范围收敛为本包内审批，不回落全单位）
  {
    url: '/api/builder/app/approval-helper',
    method: 'post',
    response: ({ body }) => {
      const exist = APPS.find((a) => a.engine === 'approval-helper')
      if (exist) {
        const g = GROUPS.find((x) => x.id === exist.groupId)
        return { code: 1009, data: null, message: `审批助手已接入本应用包（位于「${g ? g.name : '未分组'}」），无需重复添加` }
      }
      const app = {
        id: 'app-approval-helper',
        engine: 'approval-helper',
        name: '审批助手',
        groupId: body.groupId || null,
        sort: containerNodeCount(body.groupId || null),
        status: 'published',
        viewMode: 'front',
        updatedAt: formatNow(),
        refs: APPS.filter((a) => a.engine === 'approval').map((a) => a.id)
      }
      APPS.push(app)
      return { code: 0, data: appEntry(app), message: 'ok' }
    }
  },

  // ⚠️ 端点排序铁律：`/api/builder/app` 是**更短的字面路径**，而 inline mock 用 end:false 编译正则，
  // 若它排在前面会抢匹配 `/api/builder/app/url`、`/existing`、`/approval-helper`（表现为「未知引擎类型」）。
  // 因此三个具体路径必须先注册，本块置于其后（2026-10-11 修复）。
  // 包内新建应用（引擎：表单/审批/仪表盘/信息查询/报表/报告；新建默认前台，进入应用市场、不进应用管理）
  {
    url: '/api/builder/app',
    method: 'post',
    response: ({ body }) => {
      if (ENGINE_LIST_HAS(body.engine) === false) return { code: 1005, data: null, message: '未知引擎类型' }
      if (!body.name || !body.name.trim()) return { code: 1002, data: null, message: '应用名称必填' }
      const app = {
        id: `app-${++appSeq}`,
        engine: body.engine,
        name: body.name.trim().slice(0, 30),
        groupId: body.groupId || null,
        sort: containerNodeCount(body.groupId || null),
        status: 'draft',
        viewMode: 'front',
        updatedAt: formatNow(),
        refs: []
      }
      APPS.push(app)
      // 包内创建的应用进入「本包创建过的应用」池（from = 包名），供「添加已有应用」选择
      MARKET_APPS.push({ id: app.id, name: app.name, engine: app.engine, from: PKG_NAME })
      return { code: 0, data: appEntry(app), message: 'ok' }
    }
  },

  // 修改应用名称和图标（线框 2/3 的 ••• 菜单）
  // 2026-10-11：名称与图标是**应用级**属性，同一应用在包内的全部入口一并更新
  {
    url: '/api/builder/app/rename',
    method: 'put',
    response: ({ body }) => {
      const app = APPS.find((a) => a.id === body.id)
      if (!app) return { code: 404, data: null, message: '应用不存在' }
      const target = app.appId || app.id
      for (const a of APPS) {
        if ((a.appId || a.id) !== target) continue
        if (body.name) a.name = body.name.slice(0, 30)
        if (body.iconPresetId) a.iconPresetId = body.iconPresetId
        a.updatedAt = formatNow()
      }
      const m = MARKET_APPS.find((x) => x.id === target)
      if (m) {
        if (body.name) m.name = body.name.slice(0, 30)
      }
      return { code: 0, data: appEntry(app), message: 'ok' }
    }
  },

  // 切换为前台 / 后台（PRD 5.10：仅表单、审批、报告支持；表单、审批切换为后台必须关联权限组）
  {
    url: '/api/builder/app/:id/stage',
    method: 'put',
    response: ({ query, body }) => {
      const app = APPS.find((a) => a.id === query.id)
      if (!app) return { code: 404, data: null, message: '应用不存在' }
      if (!BACKEND_CONVERTIBLE.includes(app.engine)) {
        return { code: 1012, data: null, message: `${ENGINE_MAP[app.engine].label}应用不支持切换前台 / 后台` }
      }
      const viewMode = body.viewMode === 'back' ? 'back' : 'front'
      if (viewMode === 'back' && PERM_GROUP_REQUIRED.includes(app.engine) && !body.permGroupName) {
        return { code: 1013, data: null, message: `${ENGINE_MAP[app.engine].label}切换为应用后台时，必须关联权限组` }
      }
      app.viewMode = viewMode
      if (viewMode === 'back') app.permGroupName = body.permGroupName || app.permGroupName || null
      else app.permGroupName = null
      app.updatedAt = formatNow()
      return { code: 0, data: appEntry(app), message: viewMode === 'back' ? `已切换为应用后台（关联权限组：${app.permGroupName}）` : '已切换为前台应用' }
    }
  },

  // 应用排序 / 移动分组（拖拽）
  {
    url: '/api/builder/app/sort',
    method: 'put',
    response: ({ body }) => {
      for (const item of body.items || []) {
        const app = APPS.find((a) => a.id === item.id)
        if (!app) continue
        app.sort = item.sort
        if (item.groupId !== undefined) app.groupId = item.groupId
      }
      return { code: 0, data: true, message: 'ok' }
    }
  },

  // 查看引用视图（••• 菜单；返回包内引用关系，不限制删除）
  {
    url: '/api/builder/app/:id/references',
    method: 'get',
    response: ({ query }) => {
      const app = APPS.find((a) => a.id === query.id)
      if (!app) return { code: 404, data: null, message: '应用不存在' }
      // 2026-10-11：引用关系按「应用」统计——同一应用的其他入口不算引用方
      const targetId = app.appId || app.id
      const refBy = APPS.filter(
        (a) => (a.appId || a.id) !== targetId && (a.refs || []).includes(targetId)
      )
      return {
        code: 0,
        data: {
          app: appEntry({ ...app }),
          refBy: refBy.map((r) => ({ id: r.id, name: r.name, engine: r.engine })),
          tip: refBy.length
            ? `该应用被包内 ${refBy.length} 个应用引用（${refBy.map((r) => r.name).join('、')}）。删除不限制，请确认。`
            : '该应用未被包内其他应用引用。删除不限制，请确认。'
        },
        message: 'ok'
      }
    }
  },

  // 删除应用（仅从应用包移除菜单 / 分组归属；应用本身保留在微服务应用市场）
  {
    url: '/api/builder/app/:id',
    method: 'delete',
    response: ({ query }) => {
      const idx = APPS.findIndex((a) => a.id === query.id)
      if (idx === -1) return { code: 404, data: null, message: '应用不存在' }
      // 2026-10-11：删除粒度为「当前这一个入口」——只移除该菜单项，不牵连该应用在包内的其他入口
      const removed = APPS.splice(idx, 1)[0]
      const targetId = removed.appId || removed.id
      const rest = APPS.filter((a) => (a.appId || a.id) === targetId).length
      return {
        code: 0,
        data: {
          id: removed.id,
          appId: targetId,
          restEntries: rest,
          keptInMarket: true,
          message: rest
            ? `已移除「${removed.name}」的当前入口；该应用在本包还有 ${rest} 个入口，不受影响`
            : `「${removed.name}」已从应用包移除；应用本身保留在微服务应用市场，可由本包重新添加`
        },
        message: 'ok'
      }
    }
  },

  // ========== 权限设置（线框 6） ==========

  // 菜单权限保存（第一部分：分组 / 应用可见；2026-10-11 起保存即生效，无需发布）
  {
    url: '/api/builder/menu-permissions',
    method: 'put',
    response: ({ body }) => {
      for (const p of body.permissions || []) {
        const exist = PERMISSIONS.find((x) => x.roleId === p.roleId)
        if (exist) {
          exist.pkg = p.pkg
          exist.apps = { ...p.apps }
        } else {
          PERMISSIONS.push({ roleId: p.roleId, pkg: p.pkg, apps: { ...p.apps } })
        }
      }
      return { code: 0, data: true, message: '菜单权限已保存并即时生效' }
    }
  },

  // 菜单权限（勾选式）：查询已配置角色及各角色勾选的入口（2026-10-11：按入口逐条勾选，不去重）
  {
    url: '/api/builder/menu-role-perms',
    method: 'get',
    response: () => ({
      code: 0,
      data: {
        configured: menuConfiguredRoles.map((roleId) => ({
          roleId,
          appIds: [...(menuRoleStore[roleId] || [])]
        }))
      }
    })
  },
  // 菜单权限：添加 / 移除配置角色
  {
    url: '/api/builder/menu-role',
    method: 'put',
    response: ({ body }) => {
      if (body.action === 'add') {
        if (!menuConfiguredRoles.includes(body.roleId)) menuConfiguredRoles.push(body.roleId)
        if (!menuRoleStore[body.roleId]) menuRoleStore[body.roleId] = []
      } else if (body.action === 'remove') {
        const i = menuConfiguredRoles.indexOf(body.roleId)
        if (i > -1) menuConfiguredRoles.splice(i, 1)
        delete menuRoleStore[body.roleId]
      }
      syncPermissionsLegacy()
      return { code: 0, data: true }
    }
  },
  // 菜单权限：保存某角色勾选的入口（点「确定」落库即对该角色生效）
  {
    url: '/api/builder/menu-role-perm',
    method: 'put',
    response: ({ body }) => {
      if (!menuConfiguredRoles.includes(body.roleId)) menuConfiguredRoles.push(body.roleId)
      menuRoleStore[body.roleId] = [...(body.appIds || [])]
      syncPermissionsLegacy()
      return { code: 0, data: true, message: '已保存，即时对该角色生效' }
    }
  },

  // 应用权限组详情（第二部分：数据 / 字段 / 功能 / 其他四类；自动保存，不支持继承）
  // 2026-10-11：应用权限的**作用对象是应用本身**，按 appId 存储——同一应用多入口共用一份应用权限
  {
    url: '/api/builder/app/:id/perm-group',
    method: 'get',
    response: ({ query }) => {
      const app = APPS.find((a) => a.id === query.id)
      if (!app) return { code: 404, data: null, message: '应用不存在' }
      const key = app.appId || app.id
      return { code: 0, data: { appId: key, appName: app.name, group: getAppPermGroup(key) }, message: 'ok' }
    }
  },

  // 应用权限组：新建权限组 / 更新角色行（自动保存）
  {
    url: '/api/builder/app/:id/perm-group',
    method: 'put',
    response: ({ query, body }) => {
      const app = APPS.find((a) => a.id === query.id)
      if (!app) return { code: 404, data: null, message: '应用不存在' }
      const group = getAppPermGroup(app.appId || app.id)
      if (body.action === 'create-group') {
        // 演示中权限组模板唯一，接口保留扩展位
        return { code: 0, data: { group }, message: '已新建权限组（演示环境沿用默认权限组模板）' }
      }
      if (body.action === 'add-role') {
        if (!body.roleId) return { code: 1002, data: null, message: '请选择角色' }
        const role = USER_MANAGE_ROLES.find((r) => r.id === body.roleId)
        if (group.roles.some((r) => r.key === body.roleId || r.label === role?.name)) {
          return { code: 1014, data: null, message: '该角色已在权限组中' }
        }
        group.roles.push({
          key: role.id,
          label: role.name,
          desc: '授权为符合筛选条件的数据',
          removable: true,
          scopes: { data: 'filter', field: 'all', func: 'all', other: 'all' }
        })
        return { code: 0, data: { group }, message: '已添加并自动保存' }
      }
      if (body.action === 'update-role') {
        const row = group.roles.find((r) => r.key === body.key)
        if (!row) return { code: 404, data: null, message: '角色行不存在' }
        if (body.scopeType && body.scope) row.scopes[body.scopeType] = body.scope
        if (body.desc !== undefined) row.desc = body.desc
        return { code: 0, data: { group }, message: '已自动保存' }
      }
      if (body.action === 'remove-role') {
        // 「其他（默认）」为内置行不可删；其余可删
        const idx = group.roles.findIndex((r) => r.key === body.key)
        if (idx === -1) return { code: 404, data: null, message: '角色行不存在' }
        if (!group.roles[idx].removable) return { code: 1015, data: null, message: '默认角色行不可删除' }
        group.roles.splice(idx, 1)
        return { code: 0, data: { group }, message: '已删除并自动保存' }
      }
      return { code: 1002, data: null, message: '未知操作' }
    }
  },

  // ========== 高级功能：聚合表（线框 5） ==========
  {
    url: '/api/builder/aggregate-tables',
    method: 'get',
    response: () => ({ code: 0, data: AGGREGATE_TABLES.map((a) => ({ ...a })), message: 'ok' })
  },
  {
    url: '/api/builder/aggregate-table',
    method: 'post',
    response: ({ body }) => {
      const item = {
        id: `ag-${++agSeq}`,
        name: (body.name || '新建聚合表').slice(0, 30),
        enabled: true,
        agg: body.agg || ['聚合字段'],
        by: body.by || ['关联条件'],
        calc: body.calc || ['计算公式']
      }
      AGGREGATE_TABLES.unshift(item)
      return { code: 0, data: item, message: '已新建聚合表' }
    }
  },
  {
    url: '/api/builder/aggregate-table/:id/toggle',
    method: 'put',
    response: ({ query }) => {
      const item = AGGREGATE_TABLES.find((a) => a.id === query.id)
      if (!item) return { code: 404, data: null, message: '聚合表不存在' }
      item.enabled = !item.enabled
      return { code: 0, data: item, message: item.enabled ? '已启用' : '已停用' }
    }
  },
  {
    url: '/api/builder/aggregate-table/:id',
    method: 'delete',
    response: ({ query }) => {
      const idx = AGGREGATE_TABLES.findIndex((a) => a.id === query.id)
      if (idx === -1) return { code: 404, data: null, message: '聚合表不存在' }
      AGGREGATE_TABLES.splice(idx, 1)
      return { code: 0, data: true, message: '已删除聚合表' }
    }
  },

  // ========== 高级功能：业务流（线框 8） ==========
  {
    url: '/api/builder/business-flows',
    method: 'get',
    response: ({ query }) => {
      let list = BUSINESS_FLOWS.map((b) => ({ ...b }))
      if (query.trigger === 'event') list = list.filter((b) => b.trigger === 'event')
      if (query.trigger === 'timer') list = list.filter((b) => b.trigger === 'timer')
      return {
        code: 0,
        data: {
          list,
          counts: {
            event: BUSINESS_FLOWS.filter((b) => b.trigger === 'event').length,
            timer: BUSINESS_FLOWS.filter((b) => b.trigger === 'timer').length
          }
        },
        message: 'ok'
      }
    }
  },
  {
    url: '/api/builder/business-flow',
    method: 'post',
    response: ({ body }) => {
      const item = {
        id: `bf-${++bfSeq}`,
        name: (body.name || '新建业务流程').slice(0, 30),
        trigger: body.trigger === 'timer' ? 'timer' : 'event',
        enabled: true,
        execMode: body.trigger === 'timer' ? '定时执行' : '自动执行',
        updatedAt: formatNow(),
        updater: '张莉',
        children: []
      }
      BUSINESS_FLOWS.unshift(item)
      return { code: 0, data: item, message: '已新建业务流程' }
    }
  },
  {
    url: '/api/builder/business-flow/:id/toggle',
    method: 'put',
    response: ({ query }) => {
      const item = BUSINESS_FLOWS.find((b) => b.id === query.id)
      if (!item) return { code: 404, data: null, message: '业务流程不存在' }
      item.enabled = !item.enabled
      return { code: 0, data: item, message: item.enabled ? '已启用' : '已停用' }
    }
  },
  {
    url: '/api/builder/business-flow/:id',
    method: 'delete',
    response: ({ query }) => {
      const idx = BUSINESS_FLOWS.findIndex((b) => b.id === query.id)
      if (idx === -1) return { code: 404, data: null, message: '业务流程不存在' }
      BUSINESS_FLOWS.splice(idx, 1)
      return { code: 0, data: true, message: '已删除业务流程' }
    }
  },

  // ========== 高级功能：数据工厂（线框 7） ==========
  {
    url: '/api/builder/data-flows',
    method: 'get',
    response: () => ({
      code: 0,
      data: { flows: DATA_FLOWS.map((d) => ({ ...d })), tables: [...SYNC_TABLES] },
      message: 'ok'
    })
  },
  {
    url: '/api/builder/data-flow',
    method: 'post',
    response: ({ body }) => {
      const item = { id: `df-${++dfSeq}`, name: (body.name || '新建数据流').slice(0, 30) }
      DATA_FLOWS.splice(1, 0, item) // 「首页」固定第一，新数据流插其后
      return { code: 0, data: item, message: '已新建数据流' }
    }
  },
  {
    url: '/api/builder/data-flow/:id',
    method: 'delete',
    response: ({ query }) => {
      const idx = DATA_FLOWS.findIndex((d) => d.id === query.id)
      if (idx === -1) return { code: 404, data: null, message: '数据流不存在' }
      DATA_FLOWS.splice(idx, 1)
      return { code: 0, data: true, message: '已删除数据流' }
    }
  },
  // 开始同步（数据表来源为当前单位内全部表单 / 审批，含包外；G4）
  {
    url: '/api/builder/data-sync',
    method: 'post',
    response: ({ body }) => {
      if (!body.table) return { code: 1002, data: null, message: '请选择要同步的数据表' }
      return {
        code: 0,
        data: { table: body.table, syncedAt: formatNow(), rows: 128 },
        message: `同步完成：「${body.table}」共同步 128 条数据（演示）`
      }
    }
  },

  // ========== 2026-10-11 本版：业务维护 AI 助手整体去掉，原 /api/builder/ai/config 读写端点一并移除 ==========
]

export default withVersionGuard(endpoints)

// 六类引擎白名单判断（approval-helper 走专用入口）
function ENGINE_LIST_HAS(engine) {
  return ['form', 'approval', 'chart', 'report', 'paper', 'query'].includes(engine)
}

// 容器节点数：某容器（根 = null / 某分组）下直属子分组 + 直属应用总数
// 拖拽排序后子分组与应用在同一容器内共用 sort 序号空间，新建节点 sort 取此值追加到容器末尾
function containerNodeCount(containerId) {
  return GROUPS.filter((g) => (g.parentId || null) === containerId).length
    + APPS.filter((a) => (a.groupId || null) === containerId).length
}

// 一次性规范化：旧数据中分组 sort / 应用 sort 各自从 0 起，
// 按「先子分组后应用」的旧展示顺序合并为容器内统一 sort，保证切换到混合排序后视觉顺序不变
let sortNormalized = false
// 导出供 portal mock 复用：直接进前台（未先加载搭建台）时也需先把旧双序列规范化为统一 sort
export function normalizeContainerSort() {
  if (sortNormalized) return
  sortNormalized = true
  const containerIds = [null, ...GROUPS.map((g) => g.id)]
  for (const cid of containerIds) {
    const gs = GROUPS.filter((g) => (g.parentId || null) === cid).sort((a, b) => a.sort - b.sort)
    const as2 = APPS.filter((a) => (a.groupId || null) === cid).sort((a, b) => a.sort - b.sort)
    ;[...gs, ...as2].forEach((n, i) => { n.sort = i })
  }
}

// 分组子树高度（自身为 1，每深一级 +1），用于拖拽层级校验
function groupSubtreeHeight(id) {
  const kids = GROUPS.filter((g) => g.parentId === id)
  return kids.length ? 1 + Math.max(...kids.map((k) => groupSubtreeHeight(k.id))) : 1
}

// 收集分组及其子分组的全部 id
function collectGroupIds(rootId) {
  const out = []
  const walk = (id) => {
    const g = GROUPS.find((x) => x.id === id)
    if (!g) return
    out.push(id)
    GROUPS.filter((x) => x.parentId === id).forEach((c) => walk(c.id))
  }
  walk(rootId)
  return out
}
