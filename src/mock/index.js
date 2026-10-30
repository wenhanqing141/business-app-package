import appPackageEndpoints from './appPackage'
import approvalEndpoints from './approval'
import portalEndpoints from './portal'
import aiCreateEndpoints from './aiCreate'

/**
 * 单一来源:dev 给 viteMockServe 扫描,prod 给 inlineMockAdapter import
 * 注意: dev 期 viteMockServe 只用 default export;prod 期 main.js / request.js 只用 named
 *       两者指向同一数组,数据零分叉
 */
export const mockEndpoints = [
  // === 微服务应用管理 + 业务应用包后台 ===
  ...appPackageEndpoints,
  // === 审批助手 ===
  ...approvalEndpoints,
  // === 前台 ===
  ...portalEndpoints,
  // === AI 创建对话页 ===
  ...aiCreateEndpoints
]

// 保留 default export(viteMockServe 默认扫描 ./index 的 default,行为不变)
export default mockEndpoints
