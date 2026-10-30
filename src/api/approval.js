import request from './request'

// 审批助手：box = todo(待审批) | done(已审批) | sent(我发起的)
export const fetchApprovalData = (box) => request.get('/approval/data', { params: { box } })
