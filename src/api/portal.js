import request from './request'

// 前台统一入口：summary（role 为当前选中的角色 id）
export const fetchPortalSummary = (role) => request.get('/portal/summary', { params: { role } })
