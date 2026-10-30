import request from './request'

// === 微服务应用管理（2026-10-11：只列「应用」，业务应用包不再列入 R30） ===
export const fetchMsaList = () => request.get('/msa/list')

// === 业务应用包管理页面（PRD v3.0 模块十四） ===
// 当前用户可管理的单位列表（仅超管单位）
export const fetchManageUnits = () => request.get('/pkg/units')
// 当前编辑中的应用包版本（写成功后刷新客户端持有的版本号）
export const fetchPkgVersion = () => request.get('/pkg/version')
// 某单位下已创建的业务应用包
export const fetchPkgList = (fid) => request.get('/pkg/list', { params: fid ? { fid } : {} })
// 新建业务应用包（fid 取当前单位）
export const createPackage = (data) => request.post('/msa/package', data)
// 删除业务应用包（带该包版本做并发校验）
export const deletePkg = (id, version) =>
  request.delete(`/pkg/${id}`, { params: version ? { __pkgVersion: version } : {} })
// 原微服务侧的删除端点保留（兼容旧调用）
export const deletePackage = (id) => request.delete(`/msa/package/${id}`)

// === 搭建工作台 ===
export const fetchBuilderDetail = (pkgId) =>
  request.get('/builder/detail', { params: pkgId ? { pkgId } : {} })
export const updatePackage = (data) => request.put('/builder/package', data)

export const createGroup = (data) => request.post('/builder/group', data)
// 分组排序 / 跨组移动（拖拽；批量提交全量分组 {id,parentId,sort}）
export const sortGroups = (groups) => request.put('/builder/group/sort', { groups })
export const renameGroup = (data) => request.put('/builder/group/rename', data)
export const deleteGroup = (id) => request.delete(`/builder/group/${id}`)

export const createApp = (data) => request.post('/builder/app', data)
// 添加已有应用（2026-10-11：仅限本应用包中创建过的应用；同一应用允许多入口；
// 表单 / 审批必须显式传 displayMode 指定前台 / 后台形态，不设默认值）
export const addExistingApp = (data) => request.post('/builder/app/existing', data)
// 添加审批助手（以分组新增应用方式接入，每包唯一）
export const addApprovalHelper = (data) => request.post('/builder/app/approval-helper', data)
// 修改名称和图标
export const renameApp = (data) => request.put('/builder/app/rename', data)
// 切换为前台 / 后台（表单、审批转后台必须传 permGroupName）
export const switchAppStage = (id, data) => request.put(`/builder/app/${id}/stage`, data)
export const sortApps = (items) => request.put('/builder/app/sort', { items })
export const fetchAppReferences = (id) => request.get(`/builder/app/${id}/references`)
export const deleteApp = (id) => request.delete(`/builder/app/${id}`)

// === 权限设置 ===
// 菜单权限（勾选式：先添加角色，再逐条勾选入口；点「确定」保存即生效，无需发布）
// 2026-10-11：按入口勾选、不去重（与「应用权限」按应用去重相反）
export const fetchMenuRolePerms = () => request.get('/builder/menu-role-perms')
export const updateMenuRole = (action, roleId) => request.put('/builder/menu-role', { action, roleId })
export const saveMenuRolePerm = (roleId, appIds) =>
  request.put('/builder/menu-role-perm', { roleId, appIds })
// 应用权限（数据 / 字段 / 功能 / 其他，自动保存；按 appId 存储，同一应用多入口共用一份）
export const fetchAppPermGroup = (appId) => request.get(`/builder/app/${appId}/perm-group`)
export const updateAppPermGroup = (appId, payload) => request.put(`/builder/app/${appId}/perm-group`, payload)

// === 高级功能：聚合表 ===
export const fetchAggregateTables = () => request.get('/builder/aggregate-tables')
export const createAggregateTable = (data) => request.post('/builder/aggregate-table', data)
export const toggleAggregateTable = (id) => request.put(`/builder/aggregate-table/${id}/toggle`)
export const deleteAggregateTable = (id) => request.delete(`/builder/aggregate-table/${id}`)

// === 高级功能：业务流 ===
export const fetchBusinessFlows = (trigger) =>
  request.get('/builder/business-flows', { params: trigger ? { trigger } : {} })
export const createBusinessFlow = (data) => request.post('/builder/business-flow', data)
export const toggleBusinessFlow = (id) => request.put(`/builder/business-flow/${id}/toggle`)
export const deleteBusinessFlow = (id) => request.delete(`/builder/business-flow/${id}`)

// === 高级功能：数据工厂 ===
export const fetchDataFlows = () => request.get('/builder/data-flows')
export const createDataFlow = (data) => request.post('/builder/data-flow', data)
export const deleteDataFlow = (id) => request.delete(`/builder/data-flow/${id}`)
export const startDataSync = (table) => request.post('/builder/data-sync', { table })

// === 2026-10-11 本版：业务维护 AI 助手已去掉（原 /builder/ai/config 读写接口一并移除） ===
