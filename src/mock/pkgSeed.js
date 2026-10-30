// 业务应用包示例数据种子（需求：《业务应用包》PRD v1.0；线框基准：2026-09-15 九张线框图）
// 说明：全部为 Mock 假数据，仅供演示；数据在内存中可变，重启 vite 恢复。

// 引擎类型全量清单（2026-09-15 确认：表单、审批、图表（仪表盘）、报表、报告、信息查询）
// icon = Element Plus 图标名（回退用）；design = 设计稿图标名（见 components/icons/icons.js，优先用）
export const ENGINE_MAP = {
  form: {
    label: '表单',
    design: '表单',
    icon: 'Document',
    color: '#0047FF',
    desc: '信息采集与填报，含前台填写页与后台数据管理页'
  },
  approval: {
    label: '审批',
    design: '审批',
    icon: 'Finished',
    color: '#FF8333',
    desc: '流程审批处理，可切换前台 / 后台'
  },
  chart: {
    label: '仪表盘',
    design: '仪表盘',
    icon: 'PieChart',
    color: '#4dd655',
    desc: '以表单 / 审批为数据源，支持柱形图 / 指标图 / 条形图 / 雷达图'
  },
  report: {
    label: '报表',
    design: '报表',
    icon: 'TrendCharts',
    color: '#EC3327',
    desc: '数据统计报表'
  },
  paper: {
    label: '报告',
    design: '报告',
    icon: 'Memo',
    color: '#57585E',
    desc: '结构化工作报告，可切换前台 / 后台'
  },
  query: {
    label: '信息查询',
    design: '信息查询',
    icon: 'Search',
    color: '#7B5CFF',
    desc: '自定义查询 / 个人信息查询，数据源：Excel、表单、审批'
  },
  // 审批助手不是六类引擎之一：以分组加号方式接入（每包唯一），数据范围收敛为包内审批
  // 设计稿图标集中无对应图标，回退 Element Plus
  'approval-helper': {
    label: '审批助手',
    design: '',
    icon: 'Headset',
    color: '#13C2C2',
    desc: '汇聚本包审批：发起的 / 待审批 / 已审批'
  }
  // 2026-10-11 本版：原 `url`（外链应用）引擎已去掉——分组加号不再提供「添加URL」
}

// 引擎清单（加号菜单中的顺序，按线框 1）
export const ENGINE_LIST = ['form', 'approval', 'chart', 'query', 'report', 'paper']

// 支持「切换为前台 / 后台」的引擎（PRD 5.10：表单、审批、报告；表单、审批转后台必须关联权限组）
export const BACKEND_CONVERTIBLE = ['form', 'approval', 'paper']
export const PERM_GROUP_REQUIRED = ['form', 'approval']

import {
  RiArchiveFill,
  RiAppsFill,
  RiBarChart2Fill,
  RiBook2Fill,
  RiBriefcase4Fill,
  RiBuilding4Fill,
  RiCalculatorFill,
  RiCalendarTodoFill,
  RiChat1Fill,
  RiClipboardFill,
  RiCloudFill,
  RiContactsBook2Fill,
  RiDashboardFill,
  RiDatabase2Fill,
  RiFileCopyFill,
  RiFileExcel2Fill,
  RiFileList3Fill,
  RiFileSearchFill,
  RiFileTextFill,
  RiFilePpt2Fill,
  RiFileWord2Fill,
  RiFlagFill,
  RiFolderFill,
  RiGitBranchFill,
  RiHomeFill,
  RiInboxArchiveFill,
  RiLinksFill,
  RiLockFill,
  RiMapPin2Fill,
  RiNotification3Fill,
  RiPrinterFill,
  RiProjector2Fill,
  RiRocket2Fill,
  RiSearchFill,
  RiSettings3Fill,
  RiShieldCheckFill,
  RiStackFill,
  RiTableFill,
  RiTaskFill,
  RiUploadCloud2Fill
} from '@remixicon/vue'

// 应用包图标库（向导 / 修改名称和图标中可选的 40 个 Remix 填充办公图标）
export const PRESET_ICONS = [
  { id: 'ic-briefcase', icon: RiBriefcase4Fill, color: '#7C3AED' },
  { id: 'ic-flag', icon: RiFlagFill, color: '#EC3327' },
  { id: 'ic-school', icon: RiHomeFill, color: '#0047FF' },
  { id: 'ic-box', icon: RiAppsFill, color: '#4dd655' },
  { id: 'ic-tools', icon: RiSettings3Fill, color: '#FF8333' },
  { id: 'ic-data', icon: RiDatabase2Fill, color: '#7B5CFF' },
  { id: 'ic-files', icon: RiFileTextFill, color: '#57585E' },
  { id: 'ic-cloud', icon: RiCloudFill, color: '#13C2C2' },
  { id: 'ic-form', icon: RiFileList3Fill, color: '#2563EB' },
  { id: 'ic-approval', icon: RiTaskFill, color: '#F97316' },
  { id: 'ic-dashboard', icon: RiDashboardFill, color: '#16A34A' },
  { id: 'ic-query', icon: RiFileSearchFill, color: '#7C3AED' },
  { id: 'ic-report', icon: RiBarChart2Fill, color: '#DC2626' },
  { id: 'ic-folder', icon: RiFolderFill, color: '#0F766E' },
  { id: 'ic-table', icon: RiTableFill, color: '#0284C7' },
  { id: 'ic-graph', icon: RiGitBranchFill, color: '#9333EA' },
  { id: 'ic-calendar', icon: RiCalendarTodoFill, color: '#CA8A04' },
  { id: 'ic-archive', icon: RiArchiveFill, color: '#64748B' },
  { id: 'ic-book', icon: RiBook2Fill, color: '#2563EB' },
  { id: 'ic-building', icon: RiBuilding4Fill, color: '#0F766E' },
  { id: 'ic-calculator', icon: RiCalculatorFill, color: '#EA580C' },
  { id: 'ic-chat', icon: RiChat1Fill, color: '#0891B2' },
  { id: 'ic-clipboard', icon: RiClipboardFill, color: '#16A34A' },
  { id: 'ic-contacts', icon: RiContactsBook2Fill, color: '#DB2777' },
  { id: 'ic-copy', icon: RiFileCopyFill, color: '#4F46E5' },
  { id: 'ic-excel', icon: RiFileExcel2Fill, color: '#15803D' },
  { id: 'ic-ppt', icon: RiFilePpt2Fill, color: '#EA580C' },
  { id: 'ic-word', icon: RiFileWord2Fill, color: '#2563EB' },
  { id: 'ic-inbox', icon: RiInboxArchiveFill, color: '#475569' },
  { id: 'ic-links', icon: RiLinksFill, color: '#9333EA' },
  { id: 'ic-lock', icon: RiLockFill, color: '#64748B' },
  { id: 'ic-location', icon: RiMapPin2Fill, color: '#DC2626' },
  { id: 'ic-notification', icon: RiNotification3Fill, color: '#CA8A04' },
  { id: 'ic-printer', icon: RiPrinterFill, color: '#334155' },
  { id: 'ic-projector', icon: RiProjector2Fill, color: '#7C3AED' },
  { id: 'ic-rocket', icon: RiRocket2Fill, color: '#DB2777' },
  { id: 'ic-search', icon: RiSearchFill, color: '#2563EB' },
  { id: 'ic-shield', icon: RiShieldCheckFill, color: '#0D9488' },
  { id: 'ic-stack', icon: RiStackFill, color: '#4F46E5' }
]

// ========== 微服务应用管理（列表管理：应用包 + 普通应用） ==========
// ========== 业务应用包管理（PRD v3.0 模块十四） ==========
// 单位（微服务 fid）与当前登录用户。单位列表由微服务现有接口返回，
// Demo 里以 isSuperAdmin 标记「当前用户在该单位是否为超管」——**仅超管单位会出现在切换列表**。
export const UNITS = [
  { fid: '10001', name: '北京师范大学第二附属中学', isSuperAdmin: true },
  { fid: '10002', name: '北京师范大学附属实验中学', isSuperAdmin: true },
  { fid: '10003', name: '北京师范大学第三附属中学', isSuperAdmin: false }
]

// 当前登录用户（Demo 固定；正式环境取 passport 登录态）
export const CURRENT_USER = { uid: 'uid_10001', name: '张莉', avatar: '张', fid: '10001' }

export const PACKAGES = [
  {
    id: 'pkg-1',
    name: '校园后勤管理',
    fid: '10001', // 所属单位（业务应用包绑定微服务 fid）
    version: '0.0', // 配置版本号：从 0.0 起、每次保存成功递增（并发校验用）
    desc: '报修申请、维修费用审批、后勤数据统计分析的一体化业务包',
    icon: { presetId: 'ic-flag', custom: null },
    // 应用后台-应用包基础信息（线框 4）
    appId: '60fed237ff144e00094e5d4b',
    homePage: '', // 应用首页（空 = 未设置）
    customUrl: '', // 自定义应用 URL（空 = 未设置）
    // 2026-10-11：包级「发布」废止——应用包创建完成即自动加入微服务应用管理（PRD v2.6 模块十一），故不再有 published 字段
    createdAt: '2026-09-01 10:24',
    creator: '王卓'
  },
  {
    id: 'pkg-4',
    name: '教学质量评价',
    fid: '10001',
    version: '0.0',
    desc: '汇总课堂反馈、课程数据与督导记录，生成可追踪的评价闭环',
    icon: { presetId: 'ic-school', custom: null },
    appId: '62b4c810aa77e000a1b3c9d4',
    homePage: '',
    customUrl: '',
    createdAt: '2026-08-28 16:18',
    creator: '李明'
  },
  {
    id: 'pkg-5',
    name: '学生成长档案',
    fid: '10001',
    version: '0.0',
    desc: '统一沉淀学生发展记录，支持班主任协作和阶段性成长分析',
    icon: { presetId: 'ic-files', custom: null },
    appId: '63c5d921bb88f111b2c4e5d5',
    homePage: '',
    customUrl: '',
    createdAt: '2026-08-24 10:06',
    creator: '王卓'
  },
  {
    id: 'pkg-2',
    name: '招生咨询管理',
    fid: '10002',
    version: '0.0',
    desc: '咨询登记、意向跟进与统计',
    icon: { presetId: 'ic-files', custom: null },
    appId: '61a2c810aa77e000a1b3c9d2',
    homePage: '',
    customUrl: '',
    createdAt: '2026-08-22 15:10',
    creator: '李明'
  },
  {
    id: 'pkg-3',
    name: '实验室安全巡检',
    fid: '10002',
    version: '0.0',
    desc: '实验室日常巡检与隐患上报',
    icon: { presetId: 'ic-tools', custom: null },
    appId: '60f1b9d2e04a6c0008f72e1a',
    homePage: '',
    customUrl: '',
    createdAt: '2026-08-15 09:45',
    creator: '贾敬锎'
  }
]

// 应用管理中的普通单应用（路径 A：创建后同时进入应用管理与应用市场）
export const MSA_APPS = [
  { id: 'msa-1', type: 'app', engine: 'form', name: '会议签到表单', updatedAt: '2026-09-08 11:30' },
  { id: 'msa-2', type: 'app', engine: 'approval', name: '请假审批', updatedAt: '2026-09-02 14:05' }
]

// ========== 包内数据（以 pkg-1 校园后勤管理为例） ==========

// 分组树（层级上限 5 级，G1）。g1 命名与线框 1 一致：分组 1
export const GROUPS = [
  { id: 'g1', parentId: null, name: '分组1', sort: 0 },
  { id: 'g2', parentId: null, name: '审批与助手', sort: 1 },
  { id: 'g3', parentId: null, name: '数据分析', sort: 2 },
  { id: 'g4', parentId: null, name: '综合报告', sort: 3 }
]

// 包内应用（路径 B：包内创建 → 进应用市场、不进应用管理）
// viewMode: front（前台，新建应用默认） | back（应用后台；表单 / 审批转后台需关联权限组）
export const APPS = [
  // —— 分组1：线框 2、线框 3 的两个表单 ——
  {
    id: 'app-fb',
    engine: 'form',
    name: '表单–后台数据管理页',
    groupId: 'g1',
    sort: 0,
    status: 'published',
    viewMode: 'back',
    permGroupName: '默认权限组',
    updatedAt: '2026-09-12 10:20',
    refs: []
  },
  {
    id: 'app-ff',
    engine: 'form',
    name: '审批名称',
    menuIcon: '审批',
    groupId: 'g1',
    sort: 1,
    status: 'published',
    viewMode: 'front',
    updatedAt: '2026-09-12 10:25',
    refs: []
  },
  // —— 审批与助手 ——
  {
    id: 'app-2',
    engine: 'approval',
    name: '仪表盘名称',
    menuIcon: '仪表盘',
    groupId: 'g2',
    sort: 0,
    status: 'published',
    viewMode: 'front',
    updatedAt: '2026-09-09 16:42',
    refs: ['app-fb']
  },
  {
    id: 'app-helper',
    engine: 'approval-helper',
    name: '信息查询名称',
    menuIcon: '信息查询',
    groupId: 'g2',
    sort: 1,
    status: 'published',
    viewMode: 'front',
    updatedAt: '2026-09-09 16:45',
    refs: ['app-2']
  },
  // —— 数据分析 ——
  {
    id: 'app-4',
    engine: 'chart',
    name: '报表名称',
    menuIcon: '报表',
    groupId: 'g3',
    sort: 0,
    status: 'published',
    viewMode: 'front',
    updatedAt: '2026-09-08 14:10',
    refs: ['app-fb', 'app-2']
  },
  {
    id: 'app-5',
    engine: 'report',
    name: '报告名称',
    menuIcon: '报告',
    groupId: 'g3',
    sort: 1,
    status: 'draft',
    viewMode: 'front',
    updatedAt: '2026-09-06 17:25',
    refs: []
  },
  // —— 综合报告 ——
  {
    id: 'app-3',
    engine: 'query',
    name: '报修进度查询',
    groupId: 'g4',
    sort: 0,
    status: 'published',
    viewMode: 'front',
    updatedAt: '2026-09-12 09:05',
    refs: ['app-fb']
  },
  {
    id: 'app-6',
    engine: 'paper',
    name: '学期后勤工作报告',
    groupId: 'g4',
    sort: 1,
    status: 'published',
    viewMode: 'front',
    updatedAt: '2026-09-01 11:00',
    refs: ['app-4']
  }
]

// 微服务用户管理中的角色（包内引用用户管理中的角色，不在包内维护人员）
export const USER_MANAGE_ROLES = [
  { id: 'r-hq', name: '后勤管理员', members: 3, scope: '全校后勤' },
  { id: 'r-wx', name: '维修工程师', members: 8, scope: '后勤保障组' },
  { id: 'r-js', name: '教师', members: 126, scope: '各院系' },
  { id: 'r-xs', name: '学生', members: 2310, scope: '全体在校学生' }
]

// 菜单权限（5.16 第一部分：分组 / 应用可见；2026-10-11 起点「确定」保存即生效，无需发布）
// pkg: 'editable' 可编辑 | 'visible' 可见 | 'none' 不可见；apps 按应用覆盖
// 同时供前台角色交集 / 可见性演示（portal mock 消费）
export const PERMISSIONS = [
  {
    roleId: 'r-hq',
    pkg: 'editable',
    apps: {
      'app-fb': 'editable',
      'app-ff': 'editable',
      'app-2': 'editable',
      'app-helper': 'editable',
      'app-4': 'editable',
      'app-5': 'editable',
      'app-3': 'editable',
      'app-6': 'editable'
    }
  },
  {
    roleId: 'r-wx',
    pkg: 'visible',
    apps: {
      'app-fb': 'visible',
      'app-ff': 'visible',
      'app-2': 'visible',
      'app-helper': 'visible',
      'app-3': 'editable'
    }
  },
  {
    roleId: 'r-js',
    pkg: 'visible',
    apps: { 'app-ff': 'editable', 'app-3': 'visible' }
  }
  // r-xs（学生）未配置 → 无任何权限，前台不可见
]

// 应用权限组（5.16 第二部分 + 线框 6：默认权限组；数据 / 字段 / 功能 / 其他四类权限，自动保存）
// scope: all 全部数据 | filter 符合筛选条件 | self 仅本人相关
// 应用可关联的权限组清单（2026-10-11：搭建页预览区右上角下拉 / 应用后台权限设置共用同一数据源）。
// 演示环境固定两个名字，便于演示「切换权限组」；真实的权限组维护沿用应用后台 · 权限设置 · 应用权限。
export const PERM_GROUP_NAMES = ['默认权限组', '后勤管理组']

export const PERMISSION_GROUPS = [
  {
    id: 'pg-default',
    name: '默认权限组',
    builtin: true,
    roles: [
      {
        key: 'other',
        label: '其他',
        tag: '默认',
        builtin: true,
        desc: '默认为授权管理全部数据，可修改',
        removable: false,
        scopes: { data: 'all', field: 'all', func: 'all', other: 'all' }
      },
      {
        key: 'superadmin',
        label: '超级管理员',
        link: true,
        desc: '授权为符合筛选条件的数据',
        removable: true,
        scopes: { data: 'filter', field: 'all', func: 'all', other: 'all' }
      }
    ]
  }
]

// 应用市场（汇集处：应用管理 + 包内已发布应用全部在此；删除包 / 应用时「保留在市场」规则演示用）
export const MARKET_APPS = [
  { id: 'msa-1', name: '会议签到表单', engine: 'form', from: '应用管理' },
  { id: 'msa-2', name: '请假审批', engine: 'approval', from: '应用管理' },
  { id: 'app-fb', name: '表单–后台数据管理页', engine: 'form', from: '校园后勤管理' },
  { id: 'app-ff', name: '表单–前台填写页', engine: 'form', from: '校园后勤管理' },
  { id: 'app-2', name: '维修费用审批', engine: 'approval', from: '校园后勤管理' },
  { id: 'app-4', name: '后勤数据仪表盘', engine: 'chart', from: '校园后勤管理' },
  { id: 'app-3', name: '报修进度查询', engine: 'query', from: '校园后勤管理' },
  { id: 'app-6', name: '学期后勤工作报告', engine: 'paper', from: '校园后勤管理' }
]

// ========== 应用后台 · 高级功能（线框 5 / 7 / 8；页面本地态演示，刷新复原） ==========

// 聚合表（线框 5）
export const AGGREGATE_TABLES = [
  {
    id: 'ag-1',
    name: '聚合表101',
    enabled: true,
    agg: ['联动表&触发表', '被联动表&被触发表'],
    by: ['id-id'],
    calc: ['公式', '公式1']
  },
  {
    id: 'ag-2',
    name: '聚合表',
    enabled: true,
    agg: ['移动端2.0–关联数据字段', '移动端2.0–地址字段'],
    by: ['微专业–微专业'],
    calc: ['已报名人数', '限额']
  }
]

// 业务流（线框 8：表单 / 审批事件触发）
export const BUSINESS_FLOWS = [
  {
    id: 'bf-1',
    name: 'JJK–测试123',
    trigger: 'event', // event 表单/审批事件触发 | timer 定时触发
    enabled: true,
    execMode: '自动执行',
    updatedAt: '2026-09-10 15:22',
    updater: '王卓',
    children: [
      {
        id: 'bf-1-1',
        name: 'JJK–测试123（子流程）',
        event: '报修申请单 · 数据提交时',
        action: '新增维修费用审批'
      }
    ]
  }
]

// 数据工厂 · 数据流列表（线框 7 左侧深色导航）
export const DATA_FLOWS = [
  { id: 'df-1', name: 'Joec–Nice' },
  { id: 'df-2', name: '北师大二附中–请销假审批' },
  { id: 'df-3', name: '测试同步' },
  { id: 'df-4', name: '【勿动】工作量汇总统计' },
  { id: 'df-5', name: '数据筛选[yyl]' },
  { id: 'df-6', name: '教学档案–教学任务清单（同步）' },
  { id: 'df-7', name: '教学档案–教学任务清单（汇总）' },
  { id: 'df-8', name: '教学档案–教学任务清单（去重）' }
]

// 数据工厂 · 可同步的数据表（当前单位内全部表单 / 审批，含包外；G4）
export const SYNC_TABLES = [
  '会议签到表单（应用管理）',
  '请假审批（应用管理）',
  '表单–后台数据管理页（本包）',
  '表单–前台填写页（本包）',
  '维修费用审批（本包）'
]

// ========== 前台（本期新建；现状无前台） ==========

// 当前登录用户（演示）
export const PORTAL_USER = {
  id: 'u-1',
  name: '张莉',
  dept: '信息中心',
  ownedRoles: ['r-hq', 'r-js', 'r-wx'] // 在用户管理中拥有的角色（不含「学生」）
  // 可切换角色 = 包内配置过权限 ∩ 当前用户拥有 → 后勤管理员 / 维修工程师 / 教师
}
