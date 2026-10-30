import request from './request'

// AI 创建：创建业务应用包（PRD 模块三 · 阶段 4 第二步「全部应用生成并发布后再创建业务应用包」）
// Demo 为 mock 返回；正式环境由 AI 创建服务按模块十三的配置结构落包并回传包标识。
// 2026-10-10 复审：异常项不再提供重试入口，mock 固定返回成功。
export const createPackageFromAi = (data) => request.post('/ai-create/package', data)
